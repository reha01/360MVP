// 360MVP-functions/functions/src/email/emailService.js
const { Resend } = require('resend');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    // Validar API key de Resend antes de crear instancia
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.trim() === '') {
      console.warn('[EmailService] RESEND_API_KEY no configurada. El envío de correos estará deshabilitado.');
      this.resend = null;
      this.emailEnabled = false;
    } else {
      try {
        this.resend = new Resend(resendApiKey);
        this.emailEnabled = true;
      } catch (error) {
        console.warn('[EmailService] Error inicializando Resend:', error.message);
        this.resend = null;
        this.emailEnabled = false;
      }
    }
    this.db = admin.firestore();
  }

  /**
   * Load HTML template and replace placeholders
   */
  loadTemplate(templateName, variables) {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all variables in the template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });
    
    return template;
  }

  /**
   * Send invitation email
   */
  async sendInvitation(data) {
    const {
      toEmail,
      participantName,
      processName,
      roleInProcess,
      deadline,
      inviteUrl,
      tenantName,
      supportEmail
    } = data;

    const variables = {
      participantName,
      processName,
      roleInProcess,
      deadline,
      inviteUrl,
      tenantName,
      supportEmail,
      currentYear: new Date().getFullYear()
    };

    const html = this.loadTemplate('invite', variables);

    // Si el servicio de email está deshabilitado, retornar sin enviar
    if (!this.emailEnabled || !this.resend) {
      console.warn('[EmailService] Email deshabilitado - no se envió invitación a', toEmail);
      return {
        success: false,
        error: 'Email service not configured',
        status: 'disabled'
      };
    }

    try {
      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@360mvp.com',
        to: [toEmail],
        replyTo: process.env.EMAIL_REPLY_TO || 'support@360mvp.com',
        subject: `Invitación a Evaluación 360° - ${processName}`,
        html
      });

      return {
        success: true,
        messageId: result.data?.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Send reminder email
   */
  async sendReminder(data) {
    const {
      toEmail,
      participantName,
      processName,
      roleInProcess,
      deadline,
      daysRemaining,
      inviteUrl,
      tenantName,
      supportEmail
    } = data;

    const variables = {
      participantName,
      processName,
      roleInProcess,
      deadline,
      daysRemaining,
      inviteUrl,
      tenantName,
      supportEmail,
      currentYear: new Date().getFullYear()
    };

    const html = this.loadTemplate('reminder', variables);

    // Si el servicio de email está deshabilitado, retornar sin enviar
    if (!this.emailEnabled || !this.resend) {
      console.warn('[EmailService] Email deshabilitado - no se envió recordatorio a', toEmail);
      return {
        success: false,
        error: 'Email service not configured',
        status: 'disabled'
      };
    }

    try {
      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@360mvp.com',
        to: [toEmail],
        replyTo: process.env.EMAIL_REPLY_TO || 'support@360mvp.com',
        subject: `Recordatorio: Evaluación 360° - ${processName} (${daysRemaining} días restantes)`,
        html
      });

      return {
        success: true,
        messageId: result.data?.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Send thanks/confirmation email
   */
  async sendThanks(data) {
    const {
      toEmail,
      participantName,
      processName,
      roleInProcess,
      completionDate,
      timeSpent,
      dashboardUrl,
      tenantName,
      supportEmail
    } = data;

    const variables = {
      participantName,
      processName,
      roleInProcess,
      completionDate,
      timeSpent,
      dashboardUrl,
      tenantName,
      supportEmail,
      currentYear: new Date().getFullYear()
    };

    const html = this.loadTemplate('thanks', variables);

    // Si el servicio de email está deshabilitado, retornar sin enviar
    if (!this.emailEnabled || !this.resend) {
      console.warn('[EmailService] Email deshabilitado - no se envió agradecimiento a', toEmail);
      return {
        success: false,
        error: 'Email service not configured',
        status: 'disabled'
      };
    }

    try {
      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@360mvp.com',
        to: [toEmail],
        replyTo: process.env.EMAIL_REPLY_TO || 'support@360mvp.com',
        subject: `¡Gracias por completar la Evaluación 360° - ${processName}`,
        html
      });

      return {
        success: true,
        messageId: result.data?.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending thanks email:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Log email event to Firestore
   */
  async logEmailEvent(eventData) {
    const {
      invitationId,
      processId,
      emailType,
      toEmail,
      status,
      messageId,
      error,
      attempts = 1
    } = eventData;

    const eventRef = this.db.collection('mailEvents').doc();
    
    await eventRef.set({
      invitationId,
      processId,
      emailType, // 'invite', 'reminder', 'thanks'
      toEmail,
      status, // 'sent', 'delivered', 'failed'
      messageId,
      error: error || null,
      attempts,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return eventRef.id;
  }

  /**
   * Update invitation with email status
   */
  async updateInvitationStatus(invitationId, status, messageId, error = null) {
    const invitationRef = this.db.collection('invitations').doc(invitationId);
    
    const updateData = {
      emailStatus: status,
      lastEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      emailAttempts: admin.firestore.FieldValue.increment(1)
    };

    if (messageId) {
      updateData.lastMessageId = messageId;
    }

    if (error) {
      updateData.lastEmailError = error;
    }

    await invitationRef.update(updateData);
  }
}

module.exports = EmailService;












