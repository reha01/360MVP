/**
 * Cloud Function para enviar recordatorios 360°
 * 
 * Envía recordatorios a evaluadores con evaluaciones pendientes
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const email360Service = require('./360EmailService');

exports.send360Reminders = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { orgId, campaignId, assignmentIds, reminderType = 'normal' } = data;

  if (!orgId || !campaignId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  const db = admin.firestore();
  const results = [];

  try {
    // Obtener información de la campaña
    const campaignDoc = await db.collection('orgs').doc(orgId).collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Campaign not found');
    }

    const campaignData = campaignDoc.data();
    const { title: campaignTitle, config, stats } = campaignData;

    // Obtener información de la organización
    const orgDoc = await db.collection('orgs').doc(orgId).get();
    const orgData = orgDoc.data();
    const supportEmail = orgData.supportEmail || 'support@company.com';

    // Calcular fecha límite
    const deadlineDate = config.endDate.toDate();
    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Obtener asignaciones pendientes
    let assignmentsQuery = db.collection('orgs').doc(orgId).collection('evaluatorAssignments')
      .where('campaignId', '==', campaignId)
      .where('status', 'in', ['invited', 'in_progress']);

    // Si se especifican IDs específicos, filtrar por ellos
    if (assignmentIds && Array.isArray(assignmentIds) && assignmentIds.length > 0) {
      assignmentsQuery = assignmentsQuery.where('__name__', 'in', assignmentIds);
    }

    const assignmentsSnapshot = await assignmentsQuery.get();
    const assignments = [];

    assignmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const lastReminderSent = data.lastReminderSentAt;
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Solo enviar recordatorio si no se envió en las últimas 24 horas
      if (!lastReminderSent || lastReminderSent.toDate() < oneDayAgo) {
        assignments.push({ id: doc.id, ...data });
      }
    });

    // Procesar cada asignación
    for (const assignment of assignments) {
      try {
        const { 
          id: assignmentId,
          evaluatorEmail, 
          evaluatorName, 
          evaluatorType, 
          evaluateeId,
          token 
        } = assignment;

        // Obtener información del evaluado
        const evaluateeDoc = await db.collection('orgs').doc(orgId).collection('members').doc(evaluateeId).get();
        const evaluateeData = evaluateeDoc.data();
        const evaluateeName = evaluateeData?.displayName || 'Evaluado';

        // Generar URL de evaluación
        const evaluationUrl = `${functions.config().app?.base_url || 'http://localhost:5178'}/eval/${token}`;

        // Enviar email de recordatorio
        const emailResult = await email360Service.send360Reminder({
          toEmail: evaluatorEmail,
          evaluatorName,
          evaluateeName,
          evaluatorType,
          campaignTitle,
          deadline: deadlineDate,
          daysRemaining: Math.max(0, daysRemaining),
          evaluationUrl,
          supportEmail,
          orgName: orgData.name,
          completionRate: stats?.completionRate || 0,
          completedCount: stats?.evaluationsCompleted || 0,
          totalCount: stats?.totalAssignments || 0
        });

        // Log del evento de email
        await email360Service.logEmailEvent({
          assignmentId,
          campaignId,
          orgId,
          emailType: '360_reminder',
          reminderType,
          toEmail: evaluatorEmail,
          status: emailResult.status,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

        // Actualizar asignación con estado de recordatorio
        await db.collection('orgs').doc(orgId).collection('evaluatorAssignments').doc(assignmentId).update({
          lastReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReminderStatus: emailResult.status,
          lastReminderMessageId: emailResult.messageId,
          lastReminderError: emailResult.error || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        results.push({
          assignmentId,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

      } catch (error) {
        console.error(`[Send360Reminders] Error processing assignment ${assignment.id}:`, error);
        results.push({
          assignmentId: assignment.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[Send360Reminders] Processed ${assignments.length} reminders for campaign ${campaignId}`);
    return {
      success: true,
      results,
      totalProcessed: assignments.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      daysRemaining
    };

  } catch (error) {
    console.error('[Send360Reminders] Error:', error);
    throw new functions.https.HttpsError('internal', `Error sending reminders: ${error.message}`);
  }
});

/**
 * Función programada para recordatorios automáticos
 */
exports.scheduled360Reminders = functions.pubsub.schedule('0 9 * * *') // Diario a las 9 AM
  .timeZone('America/Mexico_City')
  .onRun(async (context) => {
    console.log('[Scheduled360Reminders] Starting scheduled reminder process');
    
    const db = admin.firestore();
    const now = new Date();
    
    try {
      // Obtener todas las campañas activas
      const campaignsSnapshot = await db.collectionGroup('campaigns')
        .where('status', '==', 'active')
        .get();

      for (const campaignDoc of campaignsSnapshot.docs) {
        const campaignData = campaignDoc.data();
        const { config } = campaignData;
        
        // Calcular días restantes
        const deadlineDate = config.endDate.toDate();
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Enviar recordatorios según días restantes
        if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
          console.log(`[Scheduled360Reminders] Sending reminders for campaign ${campaignDoc.id} (${daysRemaining} days remaining)`);
          
          // Obtener orgId del path del documento
          const orgId = campaignDoc.ref.parent.parent.id;
          
          // Enviar recordatorios
          await exports.send360Reminders({
            orgId,
            campaignId: campaignDoc.id,
            reminderType: daysRemaining === 1 ? 'urgent' : 'normal'
          }, { auth: { uid: 'system' } });
        }
      }
      
      console.log('[Scheduled360Reminders] Scheduled reminder process completed');
    } catch (error) {
      console.error('[Scheduled360Reminders] Error:', error);
    }
  });
