// 360MVP-functions/functions/src/email/sendInvitations.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const EmailService = require('./emailService');

const emailService = new EmailService();

/**
 * Send invitations for a process
 */
exports.sendInvitations = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { processId, invitationIds } = data;

  if (!processId || !invitationIds || !Array.isArray(invitationIds)) {
    throw new functions.https.HttpsError('invalid-argument', 'processId and invitationIds array are required.');
  }

  const db = admin.firestore();
  const results = [];

  try {
    // Get process details
    const processDoc = await db.collection('processes').doc(processId).get();
    if (!processDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Process not found.');
    }

    const processData = processDoc.data();
    const { name: processName, deadline, tenantName, supportEmail } = processData;

    // Process each invitation
    for (const invitationId of invitationIds) {
      try {
        const invitationDoc = await db.collection('invitations').doc(invitationId).get();
        
        if (!invitationDoc.exists) {
          results.push({
            invitationId,
            success: false,
            error: 'Invitation not found'
          });
          continue;
        }

        const invitationData = invitationDoc.data();
        const { toEmail, participantName, roleInProcess, token } = invitationData;

        // Check if already sent recently (prevent spam)
        const lastSent = invitationData.lastEmailSentAt;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        if (lastSent && lastSent.toDate() > oneHourAgo) {
          results.push({
            invitationId,
            success: false,
            error: 'Email sent recently, please wait before resending'
          });
          continue;
        }

        // Generate invite URL
        const inviteUrl = `${process.env.APP_BASE_URL || 'http://localhost:5178'}/invite/${token}`;

        // Send email
        const emailResult = await emailService.sendInvitation({
          toEmail,
          participantName,
          processName,
          roleInProcess,
          deadline: deadline.toDate().toLocaleDateString('es-ES'),
          inviteUrl,
          tenantName,
          supportEmail
        });

        // Log email event
        await emailService.logEmailEvent({
          invitationId,
          processId,
          emailType: 'invite',
          toEmail,
          status: emailResult.status,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

        // Update invitation status
        await emailService.updateInvitationStatus(
          invitationId,
          emailResult.status,
          emailResult.messageId,
          emailResult.error
        );

        results.push({
          invitationId,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

      } catch (error) {
        console.error(`Error processing invitation ${invitationId}:`, error);
        results.push({
          invitationId,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      totalProcessed: invitationIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('Error in sendInvitations:', error);
    throw new functions.https.HttpsError('internal', `Failed to send invitations: ${error.message}`);
  }
});
