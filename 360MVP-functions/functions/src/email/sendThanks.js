// 360MVP-functions/functions/src/email/sendThanks.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const EmailService = require('./emailService');

const emailService = new EmailService();

/**
 * Send thanks/confirmation email when evaluation is completed
 */
exports.sendThanks = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { invitationId, completionTime } = data;

  if (!invitationId) {
    throw new functions.https.HttpsError('invalid-argument', 'invitationId is required.');
  }

  const db = admin.firestore();

  try {
    // Get invitation details
    const invitationDoc = await db.collection('invitations').doc(invitationId).get();
    
    if (!invitationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invitation not found.');
    }

    const invitationData = invitationDoc.data();
    const { processId, toEmail, participantName, roleInProcess, token } = invitationData;

    // Get process details
    const processDoc = await db.collection('processes').doc(processId).get();
    if (!processDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Process not found.');
    }

    const processData = processDoc.data();
    const { name: processName, tenantName, supportEmail } = processData;

    // Check if thanks email already sent
    if (invitationData.thanksEmailSent) {
      return {
        success: true,
        message: 'Thanks email already sent for this invitation',
        alreadySent: true
      };
    }

    // Calculate time spent (if not provided)
    let timeSpent = '15-20 minutos'; // Default
    if (completionTime) {
      const minutes = Math.round(completionTime / 60);
      timeSpent = `${minutes} minutos`;
    }

    // Generate dashboard URL
    const dashboardUrl = `${process.env.APP_BASE_URL || 'http://localhost:5178'}/dashboard`;

    // Send thanks email
    const emailResult = await emailService.sendThanks({
      toEmail,
      participantName,
      processName,
      roleInProcess,
      completionDate: new Date().toLocaleDateString('es-ES'),
      timeSpent,
      dashboardUrl,
      tenantName,
      supportEmail
    });

    // Log email event
    await emailService.logEmailEvent({
      invitationId,
      processId,
      emailType: 'thanks',
      toEmail,
      status: emailResult.status,
      messageId: emailResult.messageId,
      error: emailResult.error
    });

    // Update invitation with thanks email status
    await db.collection('invitations').doc(invitationId).update({
      thanksEmailSent: true,
      thanksEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      thanksEmailStatus: emailResult.status,
      thanksEmailMessageId: emailResult.messageId,
      thanksEmailError: emailResult.error || null
    });

    return {
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error,
      status: emailResult.status
    };

  } catch (error) {
    console.error('Error in sendThanks:', error);
    throw new functions.https.HttpsError('internal', `Failed to send thanks email: ${error.message}`);
  }
});

/**
 * Trigger thanks email when evaluation is completed (via Firestore trigger)
 */
exports.onEvaluationCompleted = functions.firestore
  .document('evaluations/{evaluationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if evaluation was just completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const { invitationId } = after;

      if (invitationId) {
        try {
          // Call the sendThanks function
          const sendThanks = require('./sendThanks');
          await sendThanks.sendThanks({
            invitationId,
            completionTime: after.completionTime
          }, { auth: { uid: 'system' } }); // System context for trigger
        } catch (error) {
          console.error('Error sending thanks email via trigger:', error);
        }
      }
    }
  });












