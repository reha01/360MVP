const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const csv = require('csv-parser');

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const auth = admin.auth();
const storage = admin.storage();

const runtimeConfig = typeof functions.config === 'function' ? functions.config() : {};
const MEMBER_IMPORT_BUCKET =
  (runtimeConfig.memberimport && runtimeConfig.memberimport.bucket) ||
  process.env.MEMBER_IMPORT_BUCKET ||
  'mvp-staging-3e1cd.firebasestorage.app';

const MEMBER_IMPORT_SEGMENT = '/member_imports/';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_ROWS_RECORDED = 50;

const markJob = async (orgId, jobId, data) => {
  const jobRef = db.collection('organizations').doc(orgId).collection('importJobs').doc(jobId);
  await jobRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      ...data,
    },
    { merge: true }
  );
};

const logContext = (orgId, jobId, extra = {}) => ({
  orgId,
  jobId,
  ...extra,
});

const parseCsvFromStorage = async (bucket, filePath) => {
  const rows = [];

  await new Promise((resolve, reject) => {
    bucket
      .file(filePath)
      .createReadStream()
      .on('error', (error) => {
        reject(error);
      })
      .pipe(
        csv({
          separator: ';', // Accept semicolon delimiter (common in Excel exports)
          mapHeaders: ({ header }) =>
            header ? header.trim().toLowerCase().replace(/\s+/g, '') : header,
          skipLines: 0,
          strict: false,
        })
      )
      .on('data', (data) => {
        const normalized = Object.entries(data).reduce((acc, [key, value]) => {
          if (!key) return acc;
          acc[key] = typeof value === 'string' ? value.trim() : value;
          return acc;
        }, {});
        rows.push(normalized);
      })
      .on('end', resolve);
  });

  return rows;
};

const buildDisplayName = (name, lastName, fallbackEmail) => {
  const fullName = [name, lastName].filter(Boolean).join(' ').trim();
  return fullName || fallbackEmail;
};

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return 'employee';
  }
  return role.trim().toLowerCase();
};

const findExistingMemberDoc = async (membersCollection, email, emailLower, authUid, orgId) => {
  if (authUid && orgId) {
    const compositeId = `${orgId}:${authUid}`;
    const directRef = membersCollection.doc(compositeId);
    const directSnap = await directRef.get();
    if (directSnap.exists) {
      return directSnap;
    }
    
    // Fallback: try authUid alone (legacy format)
    const legacyRef = membersCollection.doc(authUid);
    const legacySnap = await legacyRef.get();
    if (legacySnap.exists) {
      return legacySnap;
    }
  }

  const byEmailSnap = await membersCollection.where('email', '==', email).limit(1).get();
  if (!byEmailSnap.empty) {
    return byEmailSnap.docs[0];
  }

  const byEmailLowerSnap = await membersCollection.where('emailLower', '==', emailLower).limit(1).get();
  if (!byEmailLowerSnap.empty) {
    return byEmailLowerSnap.docs[0];
  }

  return null;
};

const upsertMember = async ({
  orgId,
  jobId,
  email,
  originalEmail,
  name,
  lastName,
  role,
  membersCollection,
  uploadedBy,
  uploaderEmail,
}) => {
  const displayName = buildDisplayName(name, lastName, originalEmail);
  const normalizedRole = normalizeRole(role);
  let userRecord = null;
  let isExistingUser = true;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      isExistingUser = false;
      userRecord = await auth.createUser({
        email,
        displayName,
        emailVerified: false,
      });
    } else {
      throw error;
    }
  }

  // Update displayName if user already existed but has different name
  if (isExistingUser && displayName && userRecord.displayName !== displayName) {
    await auth.updateUser(userRecord.uid, { displayName });
  }

  // Find existing Firestore document
  let memberSnap = await findExistingMemberDoc(
    membersCollection,
    originalEmail,
    email,
    userRecord.uid,
    orgId
  );

  let memberRef;
  const memberDocId = `${orgId}:${userRecord.uid}`;

  if (memberSnap) {
    memberRef = memberSnap.ref;
  } else {
    memberRef = membersCollection.doc(memberDocId);
    memberSnap = null;
  }

  const now = FieldValue.serverTimestamp();
  const payload = {
    email: originalEmail,
    emailLower: email,
    name: name || null,
    lastName: lastName || null,
    displayName,
    fullName: displayName,
    role: normalizedRole,
    memberRole: normalizedRole,
    authUid: userRecord.uid,
    orgId,
    organizationId: orgId,
    isActive: true,
    importJobId: jobId,
    updatedAt: now,
    updatedBy: uploaderEmail || uploadedBy || 'member-import',
    source: 'member-import',
  };

  if (!memberSnap) {
    payload.createdAt = now;
    payload.createdBy = uploaderEmail || uploadedBy || 'member-import';
  }

  await memberRef.set(payload, { merge: true });

  return {
    result: isExistingUser ? 'updated' : 'created',
    memberId: memberRef.id,
  };
};

const memberImportProcessor = functions
  .region('us-central1')
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .storage
  .object()
  .onFinalize(async (object) => {
    console.log('[Worker] Function triggered for file:', object.name, 'in bucket:', object.bucket);
    
    const filePath = object?.name;

    if (!filePath || !filePath.includes(MEMBER_IMPORT_SEGMENT)) {
      console.log('[Worker] Ignoring file - not member import:', filePath);
      return null;
    }

    const metadata = object.metadata || {};
    const orgId = metadata.orgId || metadata.organizationId;
    
    console.log('[Worker] Processing member import:', { filePath, orgId, metadata });
    const jobId = metadata.jobId;
    const uploadedBy = metadata.uploadedBy || '';
    const uploaderEmail = metadata.uploaderEmail || '';

    if (!orgId || !jobId) {
      functions.logger.warn('[MemberImport] Storage object missing metadata', {
        filePath,
        metadata,
      });
      return null;
    }

    functions.logger.info('[MemberImport] Worker triggered', logContext(orgId, jobId, { filePath }));

    const bucketName = object.bucket || undefined;
    const bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();

    try {
      await markJob(orgId, jobId, {
        status: 'processing',
        startedAt: FieldValue.serverTimestamp(),
        storagePath: filePath,
        originalFilename: metadata.originalFilename || object.name.split('/').pop(),
        fileSize: object.size || null,
      });

      // Use root members collection instead of subcollection
      const membersCollection = db.collection('members');
      const rows = await parseCsvFromStorage(bucket, filePath);

      functions.logger.info('[MemberImport] Parsed CSV rows', logContext(orgId, jobId, { rows: rows.length }));

      const summary = {
        total: rows.length,
        created: 0,
        updated: 0,
        failed: 0,
      };
      const failedRows = [];
      const processedEmails = new Set();
      const recordFailedRow = (entry) => {
        if (failedRows.length < MAX_FAILED_ROWS_RECORDED) {
          failedRows.push(entry);
        }
      };

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2; // header is line 1

        const originalEmail = row.email || row.correo || row.mail || '';
        const email = originalEmail ? String(originalEmail).trim().toLowerCase() : '';
        const name = row.name || row.nombre || '';
        const lastName =
          row.lastname || row['last_name'] || row.apellido || row['apellido'] || '';
        const role = row.role || row.rol || '';

        const isEmptyRow =
          !originalEmail && !name && !lastName && !role;

        if (isEmptyRow) {
          summary.total -= 1;
          continue;
        }

        if (!email) {
          summary.failed += 1;
          recordFailedRow({
            row: rowNumber,
            email: originalEmail || '',
            reason: 'Email requerido',
          });
          continue;
        }

        if (!EMAIL_REGEX.test(email)) {
          summary.failed += 1;
          recordFailedRow({
            row: rowNumber,
            email: originalEmail,
            reason: 'Email inválido',
          });
          continue;
        }

        if (processedEmails.has(email)) {
          summary.failed += 1;
          recordFailedRow({
            row: rowNumber,
            email: originalEmail,
            reason: 'Email duplicado en el archivo',
          });
          continue;
        }

        processedEmails.add(email);

        if (!role) {
          summary.failed += 1;
          recordFailedRow({
            row: rowNumber,
            email: originalEmail,
            reason: 'Rol requerido',
          });
          continue;
        }

        try {
          const { result } = await upsertMember({
            orgId,
            jobId,
            email,
            originalEmail: originalEmail || email,
            name,
            lastName,
            role,
            membersCollection,
            uploadedBy,
            uploaderEmail,
          });

          if (result === 'created') {
            summary.created += 1;
          } else {
            summary.updated += 1;
          }
        } catch (error) {
          functions.logger.warn(
            '[MemberImport] Row processing failed',
            logContext(orgId, jobId, {
              row: rowNumber,
              email,
              error: error.message,
            })
          );
          summary.failed += 1;
          recordFailedRow({
            row: rowNumber,
            email,
            reason: error.message,
          });
        }
      }

      const truncatedFailedRows = failedRows.slice(0, MAX_FAILED_ROWS_RECORDED);

      await markJob(orgId, jobId, {
        status: 'completed',
        finishedAt: FieldValue.serverTimestamp(),
        summary,
        failedRows: truncatedFailedRows,
        errorsRecorded: truncatedFailedRows.length,
        hasErrors: summary.failed > 0,
      });

      functions.logger.info('[MemberImport] Worker completed', logContext(orgId, jobId, summary));
    } catch (error) {
      functions.logger.error('[MemberImport] Worker failed', logContext(orgId, jobId, { error }));

      await markJob(orgId, jobId, {
        status: 'failed',
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 5000) || '',
      });

      throw error;
    }

    return null;
  });

module.exports = {
  memberImportProcessor,
};





const csv = require('csv-parser');

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const auth = admin.auth();
const storage = admin.storage();

const runtimeConfig = typeof functions.config === 'function' ? functions.config() : {};
const MEMBER_IMPORT_BUCKET =
  (runtimeConfig.memberimport && runtimeConfig.memberimport.bucket) ||
  process.env.MEMBER_IMPORT_BUCKET ||
  'mvp-staging-3e1cd.firebasestorage.app';

const MEMBER_IMPORT_SEGMENT = '/member_imports/';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_ROWS_RECORDED = 50;

const markJob = async (orgId, jobId, data) => {
  const jobRef = db.collection('organizations').doc(orgId).collection('importJobs').doc(jobId);
  await jobRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      ...data,
    },
    { merge: true }
  );
};

const logContext = (orgId, jobId, extra = {}) => ({
  orgId,
  jobId,
  ...extra,
});

const parseCsvFromStorage = async (bucket, filePath) => {
  const rows = [];

  await new Promise((resolve, reject) => {
    bucket
      .file(filePath)
      .createReadStream()
      .on('error', (error) => {
        reject(error);
      })
      .pipe(
        csv({
          separator: ';', // Accept semicolon delimiter (common in Excel exports)
          mapHeaders: ({ header }) =>
            header ? header.trim().toLowerCase().replace(/\s+/g, '') : header,
          skipLines: 0,
          strict: false,
        })
      )
      .on('data', (data) => {
        const normalized = Object.entries(data).reduce((acc, [key, value]) => {
          if (!key) return acc;
          acc[key] = typeof value === 'string' ? value.trim() : value;
          return acc;
        }, {});
        rows.push(normalized);
      })
      .on('end', resolve);
  });

  return rows;
};

const buildDisplayName = (name, lastName, fallbackEmail) => {
  const fullName = [name, lastName].filter(Boolean).join(' ').trim();
  return fullName || fallbackEmail;
};

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return 'employee';
  }
  return role.trim().toLowerCase();
};

const findExistingMemberDoc = async (membersCollection, email, emailLower, authUid, orgId) => {
  if (authUid && orgId) {
    const compositeId = `${orgId}:${authUid}`;
    const directRef = membersCollection.doc(compositeId);
    const directSnap = await directRef.get();
    if (directSnap.exists) {
      return directSnap;
    }
    
    // Fallback: try authUid alone (legacy format)
    const legacyRef = membersCollection.doc(authUid);
    const legacySnap = await legacyRef.get();
    if (legacySnap.exists) {
      return legacySnap;
    }
  }

  const byEmailSnap = await membersCollection.where('email', '==', email).limit(1).get();
  if (!byEmailSnap.empty) {
    return byEmailSnap.docs[0];
  }

  const byEmailLowerSnap = await membersCollection.where('emailLower', '==', emailLower).limit(1).get();
  if (!byEmailLowerSnap.empty) {
    return byEmailLowerSnap.docs[0];
  }

  return null;
};

const upsertMember = async ({
  orgId,
  jobId,
  email,
  originalEmail,
  name,
  lastName,
  role,
  membersCollection,
  uploadedBy,
  uploaderEmail,
}) => {
  const displayName = buildDisplayName(name, lastName, originalEmail);
  const normalizedRole = normalizeRole(role);
  let userRecord = null;
  let isExistingUser = true;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      isExistingUser = false;
      userRecord = await auth.createUser({
        email,
        displayName,
        emailVerified: false,
      });
    } else {
      throw error;
    }
  }

  // Update displayName if user already existed but has different name
  if (isExistingUser && displayName && userRecord.displayName !== displayName) {
    await auth.updateUser(userRecord.uid, { displayName });
  }

  // Find existing Firestore document
  let memberSnap = await findExistingMemberDoc(
    membersCollection,
    originalEmail,
    email,
    userRecord.uid,
    orgId
  );

  let memberRef;
  const memberDocId = `${orgId}:${userRecord.uid}`;

  if (memberSnap) {
    memberRef = memberSnap.ref;
  } else {
    memberRef = membersCollection.doc(memberDocId);
    memberSnap = null;
  }

  const now = FieldValue.serverTimestamp();
  const payload = {
    email: originalEmail,
    emailLower: email,
    name: name || null,
    lastName: lastName || null,
    displayName,
    fullName: displayName,
    role: normalizedRole,
    memberRole: normalizedRole,
    authUid: userRecord.uid,
    orgId,
    organizationId: orgId,
    isActive: true,
    importJobId: jobId,
    updatedAt: now,
    updatedBy: uploaderEmail || uploadedBy || 'member-import',
    source: 'member-import',
  };

  if (!memberSnap) {
    payload.createdAt = now;
    payload.createdBy = uploaderEmail || uploadedBy || 'member-import';
  }

  await memberRef.set(payload, { merge: true });

  return {
    result: isExistingUser ? 'updated' : 'created',
    memberId: memberRef.id,
  };
};

