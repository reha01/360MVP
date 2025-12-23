/**
 * Servicio de Email para Sistema 360°
 * 
 * Maneja el envío de invitaciones, recordatorios y confirmaciones
 * para evaluaciones 360°
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');

class Email360Service {
  constructor() {
    this.resendApiKey = functions.config().resend?.api_key;
    this.baseUrl = functions.config().app?.base_url || 'http://localhost:5178';
    this.templatesPath = path.join(__dirname, 'templates');
  }

  /**
   * Sanitizar valor para tags de Resend (solo ASCII, letras, números, guiones, guiones bajos)
   */
  sanitizeTagValue(value) {
    if (!value) return 'unknown';
    return String(value)
      .normalize('NFD')  // Descomponer acentos
      .replace(/[\u0300-\u036f]/g, '')  // Eliminar diacríticos
      .replace(/[^a-zA-Z0-9_-]/g, '_')  // Reemplazar caracteres no válidos con _
      .substring(0, 50);  // Limitar longitud
  }

  /**
   * Cargar template HTML
   */
  loadTemplate(templateName, variables) {
    try {
      const templatePath = path.join(this.templatesPath, `360-${templateName}.html`);
      let template = fs.readFileSync(templatePath, 'utf8');

      // Reemplazar variables
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key] || '');
      });

      return template;
    } catch (error) {
      console.error(`[Email360] Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Enviar invitación 360°
   */
  async send360Invitation(data) {
    try {
      const {
        toEmail,
        evaluatorName,
        evaluateeName,
        evaluatorType,
        campaignTitle,
        deadline,
        evaluationUrl,
        supportEmail,
        orgName
      } = data;

      // Mapear tipo de evaluador a etiqueta
      const evaluatorTypeLabel = this.getEvaluatorTypeLabel(evaluatorType);

      const template = this.loadTemplate('invitation', {
        evaluatorName,
        evaluateeName,
        evaluatorTypeLabel,
        campaignTitle,
        deadline: new Date(deadline).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        evaluationUrl,
        supportEmail: supportEmail || 'support@company.com',
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`
      });

      const emailData = {
        from: 'Evaluaciones 360° <noreply@welead360.com>',
        to: [toEmail],
        subject: `🎯 Evaluación 360° - ${campaignTitle}`,
        html: template,
        text: this.generatePlainTextInvitation(data),
        tags: [
          { name: 'type', value: '360_invitation' },
          { name: 'campaign', value: this.sanitizeTagValue(campaignTitle) },
          { name: 'org', value: this.sanitizeTagValue(orgName) }
        ]
      };

      const result = await this.sendEmail(emailData);

      console.log(`[Email360] Invitation sent to ${toEmail} for ${evaluateeName}`);
      return result;
    } catch (error) {
      console.error('[Email360] Error sending invitation:', error);
      throw error;
    }
  }

  /**
   * Enviar recordatorio 360°
   */
  async send360Reminder(data) {
    try {
      const {
        toEmail,
        evaluatorName,
        evaluateeName,
        evaluatorType,
        campaignTitle,
        deadline,
        daysRemaining,
        evaluationUrl,
        supportEmail,
        orgName,
        completionRate,
        completedCount,
        totalCount
      } = data;

      // Mapear tipo de evaluador a etiqueta
      const evaluatorTypeLabel = this.getEvaluatorTypeLabel(evaluatorType);

      const template = this.loadTemplate('reminder', {
        evaluatorName,
        evaluateeName,
        evaluatorTypeLabel,
        campaignTitle,
        deadline: new Date(deadline).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        daysRemaining,
        evaluationUrl,
        supportEmail: supportEmail || 'support@company.com',
        completionRate: completionRate || 0,
        completedCount: completedCount || 0,
        totalCount: totalCount || 0,
        isUrgent: daysRemaining <= 2,
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`
      });

      const emailData = {
        from: 'Evaluaciones 360° <noreply@welead360.com>',
        to: [toEmail],
        subject: `⏰ Recordatorio: Evaluación 360° - ${campaignTitle}`,
        html: template,
        text: this.generatePlainTextReminder(data),
        tags: [
          { name: 'type', value: '360_reminder' },
          { name: 'campaign', value: this.sanitizeTagValue(campaignTitle) },
          { name: 'org', value: this.sanitizeTagValue(orgName) },
          { name: 'urgency', value: daysRemaining <= 2 ? 'high' : 'normal' }
        ]
      };

      const result = await this.sendEmail(emailData);

      console.log(`[Email360] Reminder sent to ${toEmail} for ${evaluateeName} (${daysRemaining} days remaining)`);
      return result;
    } catch (error) {
      console.error('[Email360] Error sending reminder:', error);
      throw error;
    }
  }

  /**
   * Enviar confirmación de completado
   */
  async send360Completion(data) {
    try {
      const {
        toEmail,
        evaluatorName,
        evaluateeName,
        campaignTitle,
        completionTime,
        supportEmail,
        orgName
      } = data;

      const template = this.loadTemplate('completion', {
        evaluatorName,
        evaluateeName,
        campaignTitle,
        completionTime: new Date(completionTime).toLocaleDateString('es-ES'),
        supportEmail: supportEmail || 'support@company.com',
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}`,
        privacyUrl: `${this.baseUrl}/privacy`
      });

      const emailData = {
        from: 'Evaluaciones 360° <noreply@welead360.com>',
        to: [toEmail],
        subject: `✅ Evaluación 360° Completada - ${campaignTitle}`,
        html: template,
        text: this.generatePlainTextCompletion(data),
        tags: [
          { name: 'type', value: '360_completion' },
          { name: 'campaign', value: this.sanitizeTagValue(campaignTitle) },
          { name: 'org', value: this.sanitizeTagValue(orgName) }
        ]
      };

      const result = await this.sendEmail(emailData);

      console.log(`[Email360] Completion confirmation sent to ${toEmail}`);
      return result;
    } catch (error) {
      console.error('[Email360] Error sending completion confirmation:', error);
      throw error;
    }
  }

  /**
   * Enviar email usando Resend API
   */
  async sendEmail(emailData) {
    try {
      if (!this.resendApiKey) {
        console.warn('[Email360] Resend API key not configured, using mock');
        return this.mockSendEmail(emailData);
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('[Email360] Error sending email:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Mock para desarrollo
   */
  async mockSendEmail(emailData) {
    console.log('[Email360] Mock email sent:', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.tags?.find(t => t.name === 'type')?.value
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      status: 'sent'
    };
  }

  /**
   * Generar texto plano para invitación
   */
  generatePlainTextInvitation(data) {
    const { evaluatorName, evaluateeName, campaignTitle, deadline, evaluationUrl } = data;

    return `
Hola ${evaluatorName},

Has sido invitado a participar en una evaluación 360° para ${evaluateeName}.

Detalles:
- Campaña: ${campaignTitle}
- Fecha límite: ${new Date(deadline).toLocaleDateString('es-ES')}
- Tiempo estimado: 15-20 minutos

Para comenzar la evaluación, visita: ${evaluationUrl}

La evaluación es completamente anónima y tus respuestas ayudarán al desarrollo profesional.

Si tienes preguntas, contacta a support@company.com

---
Este es un email automático del sistema de evaluaciones 360°.
    `.trim();
  }

  /**
   * Generar texto plano para recordatorio
   */
  generatePlainTextReminder(data) {
    const { evaluatorName, evaluateeName, campaignTitle, deadline, daysRemaining, evaluationUrl } = data;

    return `
Hola ${evaluatorName},

Te recordamos que tienes una evaluación 360° pendiente para ${evaluateeName}.

Detalles:
- Campaña: ${campaignTitle}
- Fecha límite: ${new Date(deadline).toLocaleDateString('es-ES')}
- Días restantes: ${daysRemaining}

Para completar la evaluación, visita: ${evaluationUrl}

Tu participación es importante para el éxito de este proceso.

Si ya completaste la evaluación, puedes ignorar este recordatorio.

---
Este es un recordatorio automático del sistema de evaluaciones 360°.
    `.trim();
  }

  /**
   * Generar texto plano para confirmación
   */
  generatePlainTextCompletion(data) {
    const { evaluatorName, evaluateeName, campaignTitle, completionTime } = data;

    return `
Hola ${evaluatorName},

¡Gracias por completar la evaluación 360° para ${evaluateeName}!

Detalles:
- Campaña: ${campaignTitle}
- Completado el: ${new Date(completionTime).toLocaleDateString('es-ES')}

Tu feedback es valioso y contribuirá al desarrollo profesional.

Si tienes preguntas, contacta a support@company.com

---
Este es un email automático del sistema de evaluaciones 360°.
    `.trim();
  }

  /**
   * Obtener etiqueta para tipo de evaluador
   */
  getEvaluatorTypeLabel(type) {
    const labels = {
      'self': 'Autoevaluación',
      'manager': 'Manager',
      'peer': 'Par',
      'subordinate': 'Subordinado',
      'external': 'Externo'
    };

    return labels[type] || 'Evaluador';
  }

  /**
   * Log de eventos de email
   */
  async logEmailEvent(eventData) {
    try {
      const db = admin.firestore();
      const logRef = db.collection('email_logs').doc();

      await logRef.set({
        ...eventData,
        error: eventData.error || null, // Asegurar que no sea undefined
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        service: '360_email'
      });

      console.log(`[Email360] Email event logged: ${eventData.emailType}`);
    } catch (error) {
      console.error('[Email360] Error logging email event:', error);
    }
  }
}

module.exports = new Email360Service();
// Force update config
