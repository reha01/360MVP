// src/services/emailService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

class EmailService {
  constructor() {
    this.functions = getFunctions();
    this.auth = getAuth();
  }

  /**
   * Send invitations for a process
   */
  async sendInvitations(processId, invitationIds) {
    try {
      const sendInvitations = httpsCallable(this.functions, 'sendInvitations');
      const result = await sendInvitations({
        processId,
        invitationIds
      });
      return result.data;
    } catch (error) {
      console.error('Error sending invitations:', error);
      throw new Error(`Failed to send invitations: ${error.message}`);
    }
  }

  /**
   * Send reminders for pending invitations
   */
  async sendReminders(processId, daysBeforeDeadline = 3) {
    try {
      const sendReminders = httpsCallable(this.functions, 'sendReminders');
      const result = await sendReminders({
        processId,
        daysBeforeDeadline
      });
      return result.data;
    } catch (error) {
      console.error('Error sending reminders:', error);
      throw new Error(`Failed to send reminders: ${error.message}`);
    }
  }

  /**
   * Send thanks email when evaluation is completed
   */
  async sendThanks(invitationId, completionTime = null) {
    try {
      const sendThanks = httpsCallable(this.functions, 'sendThanks');
      const result = await sendThanks({
        invitationId,
        completionTime
      });
      return result.data;
    } catch (error) {
      console.error('Error sending thanks email:', error);
      throw new Error(`Failed to send thanks email: ${error.message}`);
    }
  }

  /**
   * Get email status for invitations
   */
  async getEmailStatus(processId) {
    try {
      // This would typically be a separate Cloud Function
      // For now, we'll return mock data
      return {
        totalInvitations: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      throw new Error(`Failed to get email status: ${error.message}`);
    }
  }
}

export default new EmailService();










