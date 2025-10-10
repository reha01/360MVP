// 360MVP-functions/functions/src/email/sendReminders.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const EmailService = require('./emailService');

const emailService = new EmailService();

/**
 * Send reminders for pending invitations
 */
exports.sendReminders = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { processId, daysBeforeDeadline = 3 } = data;

  if (!processId) {
    throw new functions.https.HttpsError('invalid-argument', 'processId is required.');
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

    // Calculate reminder date
    const deadlineDate = deadline.toDate();
    const reminderDate = new Date(deadlineDate.getTime() - (daysBeforeDeadline * 24 * 60 * 60 * 1000));
    const now = new Date();

    // Only send reminders if we're within the reminder window
    if (now < reminderDate) {
      return {
        success: true,
        message: `Reminders will be sent ${daysBeforeDeadline} days before deadline (${reminderDate.toLocaleDateString()})`,
        results: [],
        totalProcessed: 0
      };
    }

    // Get pending invitations (not completed, not sent reminder recently)
    const invitationsQuery = await db
      .collection('invitations')
      .where('processId', '==', processId)
      .where('status', '==', 'pending')
      .get();

    const invitations = [];
    invitationsQuery.forEach(doc => {
      const data = doc.data();
      const lastReminderSent = data.lastReminderSentAt;
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Only send reminder if not sent in last 24 hours
      if (!lastReminderSent || lastReminderSent.toDate() < oneDayAgo) {
        invitations.push({ id: doc.id, ...data });
      }
    });

    // Process each invitation
    for (const invitation of invitations) {
      try {
        const { id: invitationId, toEmail, participantName, roleInProcess, token } = invitation;

        // Calculate days remaining
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Generate invite URL
        const inviteUrl = `${process.env.APP_BASE_URL || 'http://localhost:5178'}/invite/${token}`;

        // Send reminder email
        const emailResult = await emailService.sendReminder({
          toEmail,
          participantName,
          processName,
          roleInProcess,
          deadline: deadlineDate.toLocaleDateString('es-ES'),
          daysRemaining: Math.max(0, daysRemaining),
          inviteUrl,
          tenantName,
          supportEmail
        });

        // Log email event
        await emailService.logEmailEvent({
          invitationId,
          processId,
          emailType: 'reminder',
          toEmail,
          status: emailResult.status,
          messageId: emailResult.messageId,
          error: emailResult.error
        });

        // Update invitation with reminder status
        await db.collection('invitations').doc(invitationId).update({
          lastReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReminderStatus: emailResult.status,
          lastReminderMessageId: emailResult.messageId,
          lastReminderError: emailResult.error || null
        });

        results.push({
          invitationId,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          daysRemaining
        });

      } catch (error) {
        console.error(`Error processing reminder for invitation ${invitation.id}:`, error);
        results.push({
          invitationId: invitation.id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      totalProcessed: invitations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      daysBeforeDeadline
    };

  } catch (error) {
    console.error('Error in sendReminders:', error);
    throw new functions.https.HttpsError('internal', `Failed to send reminders: ${error.message}`);
  }
});










