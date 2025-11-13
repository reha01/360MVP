const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');

const EmailService = require('../email/emailService');

const db = admin.firestore();
const { FieldValue } = admin.firestore;
const emailService = new EmailService();

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const AUTO_ARCHIVE_TYPE = 'AUTO_ARCHIVE_CAMPAIGNS';
const AUTO_REMIND_TYPE = 'AUTO_REMIND_PENDING';
const AUTO_RETRY_DLQ_TYPE = 'AUTO_RETRY_DLQ';

const DEFAULTS = {
  archiveDaysAfterEnd: 90,
  remindDaysBefore: 7,
  remindBatchSize: 100,
  dlqMaxRetries: 5,
  dlqBatchSize: 25,
};

const DEFAULT_REMINDER_MESSAGE = 'Mensaje estandar del sistema';
const APP_BASE_URL =
  functions.config().app?.base_url ||
  process.env.APP_BASE_URL ||
  'https://mvp-staging-3e1cd.web.app';

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const createBulkActionPayload = ({
  orgId,
  type,
  targetIds,
  parameters = {},
  metadata = {},
}) => {
  const createdAt = FieldValue.serverTimestamp();

  return {
    orgId,
    type,
    requestType: type,
    status: 'pending',
    requestStatus: 'pending',
    targetIds,
    parameters,
    totalItems: targetIds.length,
    processedItems: 0,
    successCount: 0,
    failureCount: 0,
    progress: 0,
    dlqCount: 0,
    lastError: null,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      initiatedBy: 'automation_worker',
      ...metadata,
    },
  };
};

const processAutoArchivePolicy = async (orgId, policy) => {
  const days = Number(policy.parameters?.daysAfterEndDate ?? DEFAULTS.archiveDaysAfterEnd);
  if (Number.isNaN(days) || days <= 0) {
    functions.logger.warn('[CampaignPolicyWorker] Invalid daysAfterEndDate parameter', {
      orgId,
      policyId: policy.id,
      parameter: policy.parameters?.daysAfterEndDate,
    });
    return { processed: 0 };
  }

  const cutoff = new Date(Date.now() - days * DAY_IN_MS).toISOString();

  const campaignsRef = db.collection('organizations').doc(orgId).collection('campaigns');
  const snapshot = await campaignsRef.where('endDate', '<=', cutoff).get();

  if (snapshot.empty) {
    return { processed: 0 };
  }

  const batch = db.batch();
  let processed = 0;

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const currentStatus = (data.status || '').toLowerCase();

    if (currentStatus === 'archived') {
      return;
    }

    batch.update(docSnap.ref, {
      status: 'archived',
      updatedAt: FieldValue.serverTimestamp(),
      archivedAt: FieldValue.serverTimestamp(),
      'metadata.autoArchivedBy': 'policy_worker',
      'metadata.autoArchivePolicyId': policy.id,
      'metadata.autoArchiveRunAt': FieldValue.serverTimestamp(),
    });

    processed += 1;
  });

  if (processed === 0) {
    return { processed: 0 };
  }

  await batch.commit();

  functions.logger.info('[CampaignPolicyWorker] Archived campaigns', {
    orgId,
    policyId: policy.id,
    archivedCount: processed,
  });

  return { processed };
};

const processAutoRemindPolicy = async (orgId, policy) => {
  const daysBefore = Number(policy.parameters?.remindDaysBefore ?? DEFAULTS.remindDaysBefore);
  const batchSize = Number(policy.parameters?.batchSize ?? DEFAULTS.remindBatchSize);

  const assignmentsSnapshot = await db
    .collection('organizations')
    .doc(orgId)
    .collection('assignments')
    .where('status', '==', 'pending')
    .get();

  if (assignmentsSnapshot.empty) {
    return { processed: 0 };
  }

  const now = Date.now();
  const threshold = now + daysBefore * DAY_IN_MS;

  const eligibleAssignments = assignmentsSnapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data() || {};
      if (!data.expiresAt) return false;

      const expiresAt = new Date(data.expiresAt).getTime();
      if (Number.isNaN(expiresAt)) return false;

      if (expiresAt < now) return false; // Already expired
      if (expiresAt > threshold) return false; // Too far in the future

      if (typeof data.reminderCount === 'number' && typeof policy.parameters?.maxReminderCount === 'number') {
        if (data.reminderCount >= policy.parameters.maxReminderCount) {
          return false;
        }
      }

      if (data.lastReminderAt) {
        const cooldownHours = Number(policy.parameters?.cooldownHours ?? 24);
        const lastReminderAt = new Date(data.lastReminderAt).getTime();
        if (!Number.isNaN(lastReminderAt)) {
          const elapsed = now - lastReminderAt;
          if (elapsed < cooldownHours * 60 * 60 * 1000) {
            return false;
          }
        }
      }

      return true;
    })
    .slice(0, batchSize);

  if (eligibleAssignments.length === 0) {
    return { processed: 0 };
  }

  const targetIds = eligibleAssignments.map((docSnap) => docSnap.id);

  await db
    .collection('organizations')
    .doc(orgId)
    .collection('bulkActions')
    .add(
      createBulkActionPayload({
        orgId,
        type: 'RESEND_INVITATIONS',
        targetIds,
        parameters: {
          policyId: policy.id,
          triggeredAt: FieldValue.serverTimestamp(),
          policyType: policy.type,
        },
        metadata: {
          policyId: policy.id,
          policyType: policy.type,
          policyName: policy.name,
        },
      })
    );

  functions.logger.info('[CampaignPolicyWorker] Created REMIND bulk action', {
    orgId,
    policyId: policy.id,
    assignmentCount: targetIds.length,
  });

  return { processed: targetIds.length };
};

const processDlqPolicy = async (orgId, policy) => {
  const maxRetries = Number(policy.parameters?.maxRetries ?? DEFAULTS.dlqMaxRetries);
  const batchSize = Number(policy.parameters?.batchSize ?? DEFAULTS.dlqBatchSize);

  const dlqRef = db.collection('organizations').doc(orgId).collection('dlqErrors');
  let queryRef = dlqRef.where('status', '==', 'pending');

  if (Number.isFinite(maxRetries)) {
    queryRef = queryRef.where('retryCount', '<', maxRetries);
  }

  const snapshot = await queryRef.get();

  if (snapshot.empty) {
    return { processed: 0 };
  }

  const eligible = snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data() || {};
      if (data.canRetry === false) return false;
      if (typeof data.retryCount === 'number' && data.retryCount >= maxRetries) {
        return false;
      }
      return true;
    })
    .slice(0, batchSize);

  if (eligible.length === 0) {
    return { processed: 0 };
  }

  const targetIds = eligible.map((docSnap) => docSnap.id);

  await db
    .collection('organizations')
    .doc(orgId)
    .collection('bulkActions')
    .add(
      createBulkActionPayload({
        orgId,
        type: 'RETRY_DLQ',
        targetIds,
        parameters: {
          policyId: policy.id,
          maxRetries,
          triggeredAt: FieldValue.serverTimestamp(),
        },
        metadata: {
          policyId: policy.id,
          policyType: policy.type,
          policyName: policy.name,
        },
      })
    );

  functions.logger.info('[DLQPolicyWorker] Created RETRY_DLQ bulk action', {
    orgId,
    policyId: policy.id,
    errorCount: targetIds.length,
  });

  return { processed: targetIds.length };
};

const scheduleCampaignPoliciesWorker = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Santiago')
  .onRun(async () => {
    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      functions.logger.info('[CampaignPolicyWorker] No organizations found');
      return null;
    }

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      const policiesSnapshot = await orgDoc.ref
        .collection('policies')
        .where('status', '==', 'active')
        .where('type', 'in', [AUTO_ARCHIVE_TYPE, AUTO_REMIND_TYPE])
        .get()
        .catch((error) => {
          functions.logger.error('[CampaignPolicyWorker] Error fetching policies', { orgId, error });
          return null;
        });

      if (!policiesSnapshot || policiesSnapshot.empty) {
        continue;
      }

      for (const policyDoc of policiesSnapshot.docs) {
        const policy = { id: policyDoc.id, ...policyDoc.data() };

        try {
          if (policy.type === AUTO_ARCHIVE_TYPE) {
            await processAutoArchivePolicy(orgId, policy);
          }

          if (policy.type === AUTO_REMIND_TYPE) {
            await processAutoRemindPolicy(orgId, policy);
          }
        } catch (error) {
          functions.logger.error('[CampaignPolicyWorker] Policy execution failed', {
            orgId,
            policyId: policy.id,
            policyType: policy.type,
            error,
          });
        }
      }
    }

    return null;
  });

const scheduleDlqPolicyWorker = functions.pubsub
  .schedule('*/15 * * * *')
  .timeZone('America/Santiago')
  .onRun(async () => {
    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      functions.logger.info('[DLQPolicyWorker] No organizations found');
      return null;
    }

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      const policiesSnapshot = await orgDoc.ref
        .collection('policies')
        .where('status', '==', 'active')
        .where('type', '==', AUTO_RETRY_DLQ_TYPE)
        .limit(1)
        .get()
        .catch((error) => {
          functions.logger.error('[DLQPolicyWorker] Error fetching policies', { orgId, error });
          return null;
        });

      if (!policiesSnapshot || policiesSnapshot.empty) {
        continue;
      }

      const policyDoc = policiesSnapshot.docs[0];
      const policy = { id: policyDoc.id, ...policyDoc.data() };

      try {
        await processDlqPolicy(orgId, policy);
      } catch (error) {
        functions.logger.error('[DLQPolicyWorker] Policy execution failed', {
          orgId,
          policyId: policy.id,
          error,
        });
      }
    }

    return null;
  });

const processBulkActionWorker = functions.firestore
  .document('organizations/{orgId}/bulkActions/{actionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const orgId = context.params.orgId;
    const actionId = context.params.actionId;

    const type = (data.type || data.requestType || '').toString();
    const normalizedType = type.toUpperCase();
    const targetIds = normalizeArray(data.targetIds);

    if (!orgId || !type || targetIds.length === 0) {
      functions.logger.error('[BulkActionProcessor] Invalid bulk action payload', {
        orgId,
        actionId,
        type,
        targetIdsLength: targetIds.length,
      });

      await snap.ref.update({
        status: 'failed',
        lastError: 'Invalid bulk action payload (missing orgId, type or targetIds)',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return null;
    }

    await snap.ref.update({
      status: 'in_progress',
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const results = {
      successful: [],
      failed: [],
    };

    let orgInfoCache = null;
    const getOrgInfo = async () => {
      if (orgInfoCache) {
        return orgInfoCache;
      }

      const orgSnap = await db.collection('organizations').doc(orgId).get();
      orgInfoCache = orgSnap.exists ? orgSnap.data() : {};
      return orgInfoCache;
    };

    const normalizedBaseUrl =
      typeof APP_BASE_URL === 'string' ? APP_BASE_URL.replace(/\/$/, '') : 'https://mvp-staging-3e1cd.web.app';

    let successCount = 0;
    let failureCount = 0;

    for (const targetId of targetIds) {
      try {
        if (normalizedType === 'RESEND_INVITATIONS' || normalizedType === 'RESEND_INVITATION') {
          functions.logger.info('[BulkActionProcessor] Simulating resend invitation', {
            orgId,
            actionId,
            assignmentId: targetId,
          });

          const assignmentRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('assignments')
            .doc(targetId);

          const customMessage =
            typeof data.parameters?.customMessage === 'string'
              ? data.parameters.customMessage.trim()
              : '';
          const fallbackPolicyMessage =
            typeof data.parameters?.policyMessage === 'string'
              ? data.parameters.policyMessage.trim()
              : '';

          const reminderMessage =
            customMessage ||
            fallbackPolicyMessage ||
            (data.metadata?.policyId
              ? 'Recordatorio automatico generado por politica'
              : DEFAULT_REMINDER_MESSAGE);

          await assignmentRef.set(
            {
              lastReminderAt: FieldValue.serverTimestamp(),
              lastReminderMessage: reminderMessage,
              reminderCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          const evaluatorPaths = [
            db.collection('organizations').doc(orgId).collection('evaluatorAssignments').doc(targetId),
            db.collection('orgs').doc(orgId).collection('evaluatorAssignments').doc(targetId),
          ];

          await Promise.all(
            evaluatorPaths.map(async (docRef) => {
              try {
                await docRef.set(
                  {
                    lastReminderSentAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                  },
                  { merge: true }
                );
              } catch (error) {
                functions.logger.warn('[BulkActionProcessor] Failed to update evaluator assignment', {
                  orgId,
                  actionId,
                  assignmentId: targetId,
                  path: docRef.path,
                  error,
                });
              }
            })
          );
        } else if (normalizedType === 'RETRY_DLQ') {
          functions.logger.info('[BulkActionProcessor] Simulating DLQ retry', {
            orgId,
            actionId,
            dlqErrorId: targetId,
          });

          await db
            .collection('organizations')
            .doc(orgId)
            .collection('dlqErrors')
            .doc(targetId)
            .set(
              {
                status: 'retrying',
                lastRetryAt: FieldValue.serverTimestamp(),
                retryCount: FieldValue.increment(1),
              },
              { merge: true }
            );
        } else if (normalizedType === 'INVITE_MEMBERS') {
          const memberRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('members')
            .doc(targetId);

          const memberSnap = await memberRef.get();

          if (!memberSnap.exists) {
            throw new Error('Member not found');
          }

          const memberData = memberSnap.data() || {};
          const memberEmail = memberData.email || memberData.workEmail;

          if (!memberEmail) {
            throw new Error('Member missing email');
          }

          const orgInfo = await getOrgInfo();
          const orgName =
            orgInfo.displayName ||
            orgInfo.legalName ||
            orgInfo.name ||
            data.metadata?.orgName ||
            'Tu organización';
          const supportEmail =
            data.parameters?.supportEmail ||
            orgInfo.supportEmail ||
            process.env.EMAIL_REPLY_TO ||
            'support@360mvp.com';
          const activationPath =
            data.parameters?.activationPath || '/onboarding';
          const activationUrl =
            data.parameters?.activationUrl ||
            `${normalizedBaseUrl}${activationPath}${
              activationPath.includes('?')
                ? `&email=${encodeURIComponent(memberEmail)}`
                : `?email=${encodeURIComponent(memberEmail)}`
            }`;

          const emailResult = await emailService.sendMemberInvite({
            toEmail: memberEmail,
            memberName:
              memberData.displayName ||
              [memberData.name, memberData.lastName].filter(Boolean).join(' ') ||
              memberEmail,
            orgName,
            activationUrl,
            supportEmail,
          });

          await memberRef.set(
            {
              lastInviteAt: FieldValue.serverTimestamp(),
              inviteStatus: emailResult.status || 'unknown',
              inviteMessageId: emailResult.messageId || null,
              inviteError: emailResult.error || null,
              inviteCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          if (emailResult.success === false) {
            throw new Error(emailResult.error || 'Failed to send member invite');
          }
        } else if (normalizedType === 'DEACTIVATE_MEMBERS') {
          const memberRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('members')
            .doc(targetId);

          const memberSnap = await memberRef.get();

          if (!memberSnap.exists) {
            throw new Error('Member not found');
          }

          const alreadyInactive = memberSnap.data()?.isActive === false;

          await memberRef.set(
            {
              isActive: false,
              deactivatedAt: FieldValue.serverTimestamp(),
              deactivatedBy: data.userId || data.userEmail || 'bulk-action',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          if (alreadyInactive) {
            functions.logger.info('[BulkActionProcessor] Member already inactive', {
              orgId,
              actionId,
              memberId: targetId,
            });
          }
        }

        results.successful.push(targetId);
        successCount += 1;
      } catch (error) {
        functions.logger.error('[BulkActionProcessor] Failed to process item', {
          orgId,
          actionId,
          targetId,
          error,
        });

        results.failed.push({ targetId, error: error.message || 'Unknown error' });
        failureCount += 1;
      }
    }

    const processedItems = successCount + failureCount;
    const hasFailures = failureCount > 0;
    const status = hasFailures ? 'failed' : 'completed';

    await snap.ref.update({
      status,
      processedItems,
      successCount,
      failureCount,
      progress: processedItems >= targetIds.length ? 100 : Math.round((processedItems / targetIds.length) * 100),
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastError: hasFailures ? 'Some items failed during processing' : null,
      results,
    });

    functions.logger.info('[BulkActionProcessor] Finished bulk action processing', {
      orgId,
      actionId,
      status,
      successCount,
      failureCount,
    });

    return null;
  });

module.exports = {
  scheduleCampaignPoliciesWorker,
  scheduleDlqPolicyWorker,
  processBulkActionWorker,
};







const EmailService = require('../email/emailService');

const db = admin.firestore();
const { FieldValue } = admin.firestore;
const emailService = new EmailService();

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const AUTO_ARCHIVE_TYPE = 'AUTO_ARCHIVE_CAMPAIGNS';
const AUTO_REMIND_TYPE = 'AUTO_REMIND_PENDING';
const AUTO_RETRY_DLQ_TYPE = 'AUTO_RETRY_DLQ';

const DEFAULTS = {
  archiveDaysAfterEnd: 90,
  remindDaysBefore: 7,
  remindBatchSize: 100,
  dlqMaxRetries: 5,
  dlqBatchSize: 25,
};

const DEFAULT_REMINDER_MESSAGE = 'Mensaje estandar del sistema';
const APP_BASE_URL =
  functions.config().app?.base_url ||
  process.env.APP_BASE_URL ||
  'https://mvp-staging-3e1cd.web.app';

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const createBulkActionPayload = ({
  orgId,
  type,
  targetIds,
  parameters = {},
  metadata = {},
}) => {
  const createdAt = FieldValue.serverTimestamp();

  return {
    orgId,
    type,
    requestType: type,
    status: 'pending',
    requestStatus: 'pending',
    targetIds,
    parameters,
    totalItems: targetIds.length,
    processedItems: 0,
    successCount: 0,
    failureCount: 0,
    progress: 0,
    dlqCount: 0,
    lastError: null,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      initiatedBy: 'automation_worker',
      ...metadata,
    },
  };
};

const processAutoArchivePolicy = async (orgId, policy) => {
  const days = Number(policy.parameters?.daysAfterEndDate ?? DEFAULTS.archiveDaysAfterEnd);
  if (Number.isNaN(days) || days <= 0) {
    functions.logger.warn('[CampaignPolicyWorker] Invalid daysAfterEndDate parameter', {
      orgId,
      policyId: policy.id,
      parameter: policy.parameters?.daysAfterEndDate,
    });
    return { processed: 0 };
  }

  const cutoff = new Date(Date.now() - days * DAY_IN_MS).toISOString();

  const campaignsRef = db.collection('organizations').doc(orgId).collection('campaigns');
  const snapshot = await campaignsRef.where('endDate', '<=', cutoff).get();

  if (snapshot.empty) {
    return { processed: 0 };
  }

  const batch = db.batch();
  let processed = 0;

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const currentStatus = (data.status || '').toLowerCase();

    if (currentStatus === 'archived') {
      return;
    }

    batch.update(docSnap.ref, {
      status: 'archived',
      updatedAt: FieldValue.serverTimestamp(),
      archivedAt: FieldValue.serverTimestamp(),
      'metadata.autoArchivedBy': 'policy_worker',
      'metadata.autoArchivePolicyId': policy.id,
      'metadata.autoArchiveRunAt': FieldValue.serverTimestamp(),
    });

    processed += 1;
  });

  if (processed === 0) {
    return { processed: 0 };
  }

  await batch.commit();

  functions.logger.info('[CampaignPolicyWorker] Archived campaigns', {
    orgId,
    policyId: policy.id,
    archivedCount: processed,
  });

  return { processed };
};

const processAutoRemindPolicy = async (orgId, policy) => {
  const daysBefore = Number(policy.parameters?.remindDaysBefore ?? DEFAULTS.remindDaysBefore);
  const batchSize = Number(policy.parameters?.batchSize ?? DEFAULTS.remindBatchSize);

  const assignmentsSnapshot = await db
    .collection('organizations')
    .doc(orgId)
    .collection('assignments')
    .where('status', '==', 'pending')
    .get();

  if (assignmentsSnapshot.empty) {
    return { processed: 0 };
  }

  const now = Date.now();
  const threshold = now + daysBefore * DAY_IN_MS;

  const eligibleAssignments = assignmentsSnapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data() || {};
      if (!data.expiresAt) return false;

      const expiresAt = new Date(data.expiresAt).getTime();
      if (Number.isNaN(expiresAt)) return false;

      if (expiresAt < now) return false; // Already expired
      if (expiresAt > threshold) return false; // Too far in the future

      if (typeof data.reminderCount === 'number' && typeof policy.parameters?.maxReminderCount === 'number') {
        if (data.reminderCount >= policy.parameters.maxReminderCount) {
          return false;
        }
      }

      if (data.lastReminderAt) {
        const cooldownHours = Number(policy.parameters?.cooldownHours ?? 24);
        const lastReminderAt = new Date(data.lastReminderAt).getTime();
        if (!Number.isNaN(lastReminderAt)) {
          const elapsed = now - lastReminderAt;
          if (elapsed < cooldownHours * 60 * 60 * 1000) {
            return false;
          }
        }
      }

      return true;
    })
    .slice(0, batchSize);

  if (eligibleAssignments.length === 0) {
    return { processed: 0 };
  }

  const targetIds = eligibleAssignments.map((docSnap) => docSnap.id);

  await db
    .collection('organizations')
    .doc(orgId)
    .collection('bulkActions')
    .add(
      createBulkActionPayload({
        orgId,
        type: 'RESEND_INVITATIONS',
        targetIds,
        parameters: {
          policyId: policy.id,
          triggeredAt: FieldValue.serverTimestamp(),
          policyType: policy.type,
        },
        metadata: {
          policyId: policy.id,
          policyType: policy.type,
          policyName: policy.name,
        },
      })
    );

  functions.logger.info('[CampaignPolicyWorker] Created REMIND bulk action', {
    orgId,
    policyId: policy.id,
    assignmentCount: targetIds.length,
  });

  return { processed: targetIds.length };
};

const processDlqPolicy = async (orgId, policy) => {
  const maxRetries = Number(policy.parameters?.maxRetries ?? DEFAULTS.dlqMaxRetries);
  const batchSize = Number(policy.parameters?.batchSize ?? DEFAULTS.dlqBatchSize);

  const dlqRef = db.collection('organizations').doc(orgId).collection('dlqErrors');
  let queryRef = dlqRef.where('status', '==', 'pending');

  if (Number.isFinite(maxRetries)) {
    queryRef = queryRef.where('retryCount', '<', maxRetries);
  }

  const snapshot = await queryRef.get();

  if (snapshot.empty) {
    return { processed: 0 };
  }

  const eligible = snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data() || {};
      if (data.canRetry === false) return false;
      if (typeof data.retryCount === 'number' && data.retryCount >= maxRetries) {
        return false;
      }
      return true;
    })
    .slice(0, batchSize);

  if (eligible.length === 0) {
    return { processed: 0 };
  }

  const targetIds = eligible.map((docSnap) => docSnap.id);

  await db
    .collection('organizations')
    .doc(orgId)
    .collection('bulkActions')
    .add(
      createBulkActionPayload({
        orgId,
        type: 'RETRY_DLQ',
        targetIds,
        parameters: {
          policyId: policy.id,
          maxRetries,
          triggeredAt: FieldValue.serverTimestamp(),
        },
        metadata: {
          policyId: policy.id,
          policyType: policy.type,
          policyName: policy.name,
        },
      })
    );

  functions.logger.info('[DLQPolicyWorker] Created RETRY_DLQ bulk action', {
    orgId,
    policyId: policy.id,
    errorCount: targetIds.length,
  });

  return { processed: targetIds.length };
};

const scheduleCampaignPoliciesWorker = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Santiago')
  .onRun(async () => {
    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      functions.logger.info('[CampaignPolicyWorker] No organizations found');
      return null;
    }

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      const policiesSnapshot = await orgDoc.ref
        .collection('policies')
        .where('status', '==', 'active')
        .where('type', 'in', [AUTO_ARCHIVE_TYPE, AUTO_REMIND_TYPE])
        .get()
        .catch((error) => {
          functions.logger.error('[CampaignPolicyWorker] Error fetching policies', { orgId, error });
          return null;
        });

      if (!policiesSnapshot || policiesSnapshot.empty) {
        continue;
      }

      for (const policyDoc of policiesSnapshot.docs) {
        const policy = { id: policyDoc.id, ...policyDoc.data() };

        try {
          if (policy.type === AUTO_ARCHIVE_TYPE) {
            await processAutoArchivePolicy(orgId, policy);
          }

          if (policy.type === AUTO_REMIND_TYPE) {
            await processAutoRemindPolicy(orgId, policy);
          }
        } catch (error) {
          functions.logger.error('[CampaignPolicyWorker] Policy execution failed', {
            orgId,
            policyId: policy.id,
            policyType: policy.type,
            error,
          });
        }
      }
    }

    return null;
  });

const scheduleDlqPolicyWorker = functions.pubsub
  .schedule('*/15 * * * *')
  .timeZone('America/Santiago')
  .onRun(async () => {
    const orgsSnapshot = await db.collection('organizations').get();

    if (orgsSnapshot.empty) {
      functions.logger.info('[DLQPolicyWorker] No organizations found');
      return null;
    }

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      const policiesSnapshot = await orgDoc.ref
        .collection('policies')
        .where('status', '==', 'active')
        .where('type', '==', AUTO_RETRY_DLQ_TYPE)
        .limit(1)
        .get()
        .catch((error) => {
          functions.logger.error('[DLQPolicyWorker] Error fetching policies', { orgId, error });
          return null;
        });

      if (!policiesSnapshot || policiesSnapshot.empty) {
        continue;
      }

      const policyDoc = policiesSnapshot.docs[0];
      const policy = { id: policyDoc.id, ...policyDoc.data() };

      try {
        await processDlqPolicy(orgId, policy);
      } catch (error) {
        functions.logger.error('[DLQPolicyWorker] Policy execution failed', {
          orgId,
          policyId: policy.id,
          error,
        });
      }
    }

    return null;
  });

const processBulkActionWorker = functions.firestore
  .document('organizations/{orgId}/bulkActions/{actionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const orgId = context.params.orgId;
    const actionId = context.params.actionId;

    const type = (data.type || data.requestType || '').toString();
    const normalizedType = type.toUpperCase();
    const targetIds = normalizeArray(data.targetIds);

    if (!orgId || !type || targetIds.length === 0) {
      functions.logger.error('[BulkActionProcessor] Invalid bulk action payload', {
        orgId,
        actionId,
        type,
        targetIdsLength: targetIds.length,
      });

      await snap.ref.update({
        status: 'failed',
        lastError: 'Invalid bulk action payload (missing orgId, type or targetIds)',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return null;
    }

    await snap.ref.update({
      status: 'in_progress',
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const results = {
      successful: [],
      failed: [],
    };

    let orgInfoCache = null;
    const getOrgInfo = async () => {
      if (orgInfoCache) {
        return orgInfoCache;
      }

      const orgSnap = await db.collection('organizations').doc(orgId).get();
      orgInfoCache = orgSnap.exists ? orgSnap.data() : {};
      return orgInfoCache;
    };

    const normalizedBaseUrl =
      typeof APP_BASE_URL === 'string' ? APP_BASE_URL.replace(/\/$/, '') : 'https://mvp-staging-3e1cd.web.app';

    let successCount = 0;
    let failureCount = 0;

    for (const targetId of targetIds) {
      try {
        if (normalizedType === 'RESEND_INVITATIONS' || normalizedType === 'RESEND_INVITATION') {
          functions.logger.info('[BulkActionProcessor] Simulating resend invitation', {
            orgId,
            actionId,
            assignmentId: targetId,
          });

          const assignmentRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('assignments')
            .doc(targetId);

          const customMessage =
            typeof data.parameters?.customMessage === 'string'
              ? data.parameters.customMessage.trim()
              : '';
          const fallbackPolicyMessage =
            typeof data.parameters?.policyMessage === 'string'
              ? data.parameters.policyMessage.trim()
              : '';

          const reminderMessage =
            customMessage ||
            fallbackPolicyMessage ||
            (data.metadata?.policyId
              ? 'Recordatorio automatico generado por politica'
              : DEFAULT_REMINDER_MESSAGE);

          await assignmentRef.set(
            {
              lastReminderAt: FieldValue.serverTimestamp(),
              lastReminderMessage: reminderMessage,
              reminderCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          const evaluatorPaths = [
            db.collection('organizations').doc(orgId).collection('evaluatorAssignments').doc(targetId),
            db.collection('orgs').doc(orgId).collection('evaluatorAssignments').doc(targetId),
          ];

          await Promise.all(
            evaluatorPaths.map(async (docRef) => {
              try {
                await docRef.set(
                  {
                    lastReminderSentAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                  },
                  { merge: true }
                );
              } catch (error) {
                functions.logger.warn('[BulkActionProcessor] Failed to update evaluator assignment', {
                  orgId,
                  actionId,
                  assignmentId: targetId,
                  path: docRef.path,
                  error,
                });
              }
            })
          );
        } else if (normalizedType === 'RETRY_DLQ') {
          functions.logger.info('[BulkActionProcessor] Simulating DLQ retry', {
            orgId,
            actionId,
            dlqErrorId: targetId,
          });

          await db
            .collection('organizations')
            .doc(orgId)
            .collection('dlqErrors')
            .doc(targetId)
            .set(
              {
                status: 'retrying',
                lastRetryAt: FieldValue.serverTimestamp(),
                retryCount: FieldValue.increment(1),
              },
              { merge: true }
            );
        } else if (normalizedType === 'INVITE_MEMBERS') {
          const memberRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('members')
            .doc(targetId);

          const memberSnap = await memberRef.get();

          if (!memberSnap.exists) {
            throw new Error('Member not found');
          }

          const memberData = memberSnap.data() || {};
          const memberEmail = memberData.email || memberData.workEmail;

          if (!memberEmail) {
            throw new Error('Member missing email');
          }

          const orgInfo = await getOrgInfo();
          const orgName =
            orgInfo.displayName ||
            orgInfo.legalName ||
            orgInfo.name ||
            data.metadata?.orgName ||
            'Tu organización';
          const supportEmail =
            data.parameters?.supportEmail ||
            orgInfo.supportEmail ||
            process.env.EMAIL_REPLY_TO ||
            'support@360mvp.com';
          const activationPath =
            data.parameters?.activationPath || '/onboarding';
          const activationUrl =
            data.parameters?.activationUrl ||
            `${normalizedBaseUrl}${activationPath}${
              activationPath.includes('?')
                ? `&email=${encodeURIComponent(memberEmail)}`
                : `?email=${encodeURIComponent(memberEmail)}`
            }`;

          const emailResult = await emailService.sendMemberInvite({
            toEmail: memberEmail,
            memberName:
              memberData.displayName ||
              [memberData.name, memberData.lastName].filter(Boolean).join(' ') ||
              memberEmail,
            orgName,
            activationUrl,
            supportEmail,
          });

          await memberRef.set(
            {
              lastInviteAt: FieldValue.serverTimestamp(),
              inviteStatus: emailResult.status || 'unknown',
              inviteMessageId: emailResult.messageId || null,
              inviteError: emailResult.error || null,
              inviteCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          if (emailResult.success === false) {
            throw new Error(emailResult.error || 'Failed to send member invite');
          }
        } else if (normalizedType === 'DEACTIVATE_MEMBERS') {
          const memberRef = db
            .collection('organizations')
            .doc(orgId)
            .collection('members')
            .doc(targetId);

          const memberSnap = await memberRef.get();

          if (!memberSnap.exists) {
            throw new Error('Member not found');
          }

          const alreadyInactive = memberSnap.data()?.isActive === false;

          await memberRef.set(
            {
              isActive: false,
              deactivatedAt: FieldValue.serverTimestamp(),
              deactivatedBy: data.userId || data.userEmail || 'bulk-action',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          if (alreadyInactive) {
            functions.logger.info('[BulkActionProcessor] Member already inactive', {
              orgId,
              actionId,
              memberId: targetId,
            });
          }
        }

        results.successful.push(targetId);
        successCount += 1;
      } catch (error) {
        functions.logger.error('[BulkActionProcessor] Failed to process item', {
          orgId,
          actionId,
          targetId,
          error,
        });

        results.failed.push({ targetId, error: error.message || 'Unknown error' });
        failureCount += 1;
      }
    }

    const processedItems = successCount + failureCount;
    const hasFailures = failureCount > 0;
    const status = hasFailures ? 'failed' : 'completed';

    await snap.ref.update({
      status,
      processedItems,
      successCount,
      failureCount,
      progress: processedItems >= targetIds.length ? 100 : Math.round((processedItems / targetIds.length) * 100),
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastError: hasFailures ? 'Some items failed during processing' : null,
      results,
    });

    functions.logger.info('[BulkActionProcessor] Finished bulk action processing', {
      orgId,
      actionId,
      status,
      successCount,
      failureCount,
    });

    return null;
  });

module.exports = {
  scheduleCampaignPoliciesWorker,
  scheduleDlqPolicyWorker,
  processBulkActionWorker,
};









