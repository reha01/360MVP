/**
 * Cloud Function para enviar invitaciones 360°
 * 
 * Envía invitaciones a evaluadores para evaluaciones 360°
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const email360Service = require('./360EmailService');

exports.send360Invitations = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { orgId, campaignId, assignmentIds } = data;

  if (!orgId || !campaignId || !assignmentIds || !Array.isArray(assignmentIds)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  const db = admin.firestore();
  const results = [];

  try {
    // Obtener información de la campaña
    const campaignDoc = await db.collection('organizations').doc(orgId).collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }

    const campaignData = campaignDoc.data();
    const { title: campaignTitle, config, orgName } = campaignData;

    // Obtener información de la organización
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data();
    const supportEmail = orgData.supportEmail || 'support@company.com';

    // Procesar cada asignación
    for (const assignmentId of assignmentIds) {
      try {
        const assignmentDoc = await db.collection('organizations').doc(orgId).collection('evaluatorAssignments').doc(assignmentId).get();

        if (!assignmentDoc.exists) {
          results.push({
            assignmentId,
            success: false,
            error: 'Assignment not found'
          });
          continue;
        }

        const assignmentData = assignmentDoc.data();
        const {
          evaluatorEmail,
          evaluatorName,
          evaluatorType,
          session360Id,
          evaluateeId,
          emailSent,
          emailSentAt
        } = assignmentData;

        // Verificar si ya se envió recientemente (prevenir spam)
        const lastSent = emailSentAt;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        if (emailSent && lastSent && lastSent.toDate() > oneHourAgo) {
          results.push({
            assignmentId,
            success: false,
            error: 'Email sent recently, please wait before resending'
          });
          continue;
        }

        // Obtener información del evaluado
        const evaluateeDoc = await db.collection('organizations').doc(orgId).collection('members').doc(evaluateeId).get();
        const evaluateeData = evaluateeDoc.data();
        const evaluateeName = evaluateeData?.displayName || 'Evaluado';

        // Generar URL de evaluación
        const evaluationUrl = `${functions.config().app?.base_url || 'http://localhost:5178'}/eval/${assignmentData.token}`;

        // Enviar email
        const emailResult = await email360Service.send360Invitation({
          toEmail: evaluatorEmail,
          evaluatorName,
          evaluateeName,
          evaluatorType,
          campaignTitle,
          deadline: config.endDate,
          evaluationUrl,
          supportEmail,
          orgName: orgName || orgData.name
        });

        // Log del evento de email
        await email360Service.logEmailEvent({
          assignmentId,
          campaignId,
          orgId,
          emailType: '360_invitation',
          toEmail: evaluatorEmail,
          status: emailResult.status,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

        // Actualizar asignación con estado de email
        await db.collection('organizations').doc(orgId).collection('evaluatorAssignments').doc(assignmentId).update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          emailStatus: emailResult.status || 'unknown',
          emailMessageId: emailResult.messageId || null,
          emailError: emailResult.error || null,
          status: 'invited',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        results.push({
          assignmentId,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

      } catch (error) {
        console.error(`[Send360Invitations] Error processing assignment ${assignmentId}:`, error);
        results.push({
          assignmentId,
          success: false,
          error: error.message
        });
      }
    }

    // Actualizar estadísticas de la campaña
    await updateCampaignStats(orgId, campaignId);

    console.log(`[Send360Invitations] Processed ${assignmentIds.length} invitations for campaign ${campaignId}`);
    return {
      success: true,
      results,
      totalProcessed: assignmentIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('[Send360Invitations] Error:', error);
    throw new functions.https.HttpsError('internal', `Error sending invitations: ${error.message}`);
  }
});

/**
 * Actualizar estadísticas de la campaña
 */
async function updateCampaignStats(orgId, campaignId) {
  try {
    const db = admin.firestore();

    // Obtener todas las asignaciones de la campaña
    const assignmentsSnapshot = await db.collection('organizations').doc(orgId).collection('evaluatorAssignments')
      .where('campaignId', '==', campaignId)
      .get();

    const stats = {
      totalAssignments: assignmentsSnapshot.size,
      invitationsSent: 0,
      evaluationsCompleted: 0,
      byStatus: {}
    };

    assignmentsSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.emailSent) {
        stats.invitationsSent++;
      }

      if (data.status === 'completed') {
        stats.evaluationsCompleted++;
      }

      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
    });

    // Calcular tasa de completitud
    stats.completionRate = stats.totalAssignments > 0
      ? Math.round((stats.evaluationsCompleted / stats.totalAssignments) * 100)
      : 0;

    // Actualizar campaña
    await db.collection('organizations').doc(orgId).collection('campaigns').doc(campaignId).update({
      stats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[Send360Invitations] Updated campaign stats: ${stats.completionRate}% completion rate`);
  } catch (error) {
    console.error('[Send360Invitations] Error updating campaign stats:', error);
  }
}
