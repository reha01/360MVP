/**
 * Servicio de observabilidad para monitoreo y logging
 * 
 * Características:
 * - Registro centralizado de eventos
 * - Monitoreo de performance
 * - Alertas operativas
 * - Auditoría de acciones sensibles
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ========== CONSTANTES ==========

// Niveles de severidad para eventos
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Tipos de eventos críticos que generan alertas
const ALERT_EVENT_TYPES = [
  'bulk.dlq.max_retries',
  'rate_limit.exceeded',
  'email.bounce',
  'email.complaint',
  'security.anomaly',
  'data.anonymity_risk'
];

// ========== LOGGING ==========

/**
 * Registrar evento en el sistema de observabilidad
 */
export const logEvent = async (eventType, data = {}, severity = SEVERITY.INFO) => {
  try {
    const timestamp = new Date();
    const userId = 'current-user'; // En producción, obtener del contexto de auth
    const orgId = data.orgId || 'unknown';
    
    // Construir evento
    const event = {
      eventType,
      severity,
      timestamp,
      userId,
      orgId,
      data,
      clientInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };
    
    // Registrar en consola para desarrollo
    console.log(`[Observability] ${severity.toUpperCase()} - ${eventType}:`, data);
    
    // En producción, guardar en Firestore
    // await addDoc(collection(db, 'events'), event);
    
    // Verificar si el evento debe generar una alerta
    if (ALERT_EVENT_TYPES.includes(eventType) || severity === SEVERITY.ERROR || severity === SEVERITY.CRITICAL) {
      await createAlert(eventType, data, severity);
    }
    
    return { success: true, eventId: `mock-event-${Date.now()}` };
  } catch (error) {
    console.error('[Observability] Error logging event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Registrar evento de auditoría (acciones sensibles)
 */
export const logAuditEvent = async (action, resourceType, resourceId, details = {}) => {
  try {
    const timestamp = new Date();
    const userId = 'current-user'; // En producción, obtener del contexto de auth
    const orgId = details.orgId || 'unknown';
    
    // Construir evento de auditoría
    const auditEvent = {
      action,
      resourceType,
      resourceId,
      timestamp,
      userId,
      orgId,
      details,
      clientInfo: {
        ip: '127.0.0.1', // En producción, obtener del request
        userAgent: navigator.userAgent
      }
    };
    
    // Registrar en consola para desarrollo
    console.log(`[Audit] ${action} - ${resourceType}/${resourceId}:`, details);
    
    // En producción, guardar en Firestore
    // await addDoc(collection(db, 'auditLog'), auditEvent);
    
    return { success: true, auditId: `mock-audit-${Date.now()}` };
  } catch (error) {
    console.error('[Observability] Error logging audit event:', error);
    return { success: false, error: error.message };
  }
};

// ========== MÉTRICAS ==========

/**
 * Registrar métrica de performance
 */
export const recordPerformanceMetric = async (metricName, value, tags = {}) => {
  try {
    const timestamp = new Date();
    const orgId = tags.orgId || 'unknown';
    
    // Construir métrica
    const metric = {
      name: metricName,
      value,
      timestamp,
      orgId,
      tags
    };
    
    // Registrar en consola para desarrollo
    console.log(`[Metrics] ${metricName}: ${value}`, tags);
    
    // En producción, guardar en Firestore o enviar a servicio de métricas
    // await addDoc(collection(db, 'metrics'), metric);
    
    return { success: true };
  } catch (error) {
    console.error('[Observability] Error recording metric:', error);
    return { success: false, error: error.message };
  }
};

// ========== ALERTAS ==========

/**
 * Crear alerta operativa
 */
export const createAlert = async (eventType, data = {}, severity = SEVERITY.WARNING) => {
  try {
    const timestamp = new Date();
    const orgId = data.orgId || 'unknown';
    
    // Generar título y descripción basados en el tipo de evento
    let title, description, actionLink;
    
    switch (eventType) {
      case 'bulk.dlq.max_retries':
        title = 'Máximo de reintentos alcanzado en DLQ';
        description = `Una acción masiva ha alcanzado el máximo de reintentos en la DLQ: ${data.itemId}`;
        actionLink = '/alerts?filter=dlq';
        break;
      case 'rate_limit.exceeded':
        title = 'Límite de tasa excedido';
        description = `Se ha excedido el límite de tasa para: ${data.limitType}`;
        actionLink = '/policies';
        break;
      case 'email.bounce':
        title = 'Email rebotado';
        description = `Un email ha rebotado: ${data.email}`;
        actionLink = '/alerts?filter=email';
        break;
      case 'email.complaint':
        title = 'Queja de email recibida';
        description = `Se ha recibido una queja para el email: ${data.email}`;
        actionLink = '/alerts?filter=email';
        break;
      default:
        title = `Alerta: ${eventType}`;
        description = `Se ha generado una alerta para el evento: ${eventType}`;
        actionLink = '/alerts';
    }
    
    // Construir alerta
    const alert = {
      eventType,
      title,
      description,
      severity,
      timestamp,
      orgId,
      data,
      actionLink,
      status: 'active',
      acknowledged: false,
      resolved: false
    };
    
    // Registrar en consola para desarrollo
    console.log(`[Alert] ${severity.toUpperCase()} - ${title}:`, description);
    
    // En producción, guardar en Firestore
    // await addDoc(collection(db, 'alerts'), alert);
    
    return { success: true, alertId: `mock-alert-${Date.now()}` };
  } catch (error) {
    console.error('[Observability] Error creating alert:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener alertas activas
 */
export const getActiveAlerts = async (orgId, options = {}) => {
  try {
    // Simular alertas para desarrollo
    const mockAlerts = [
      {
        id: 'alert-1',
        eventType: 'bulk.dlq.max_retries',
        title: 'Máximo de reintentos alcanzado en DLQ',
        description: 'Una acción masiva ha alcanzado el máximo de reintentos en la DLQ: dlq-1',
        severity: SEVERITY.ERROR,
        timestamp: new Date('2024-10-20T15:30:00'),
        orgId,
        data: {
          itemId: 'dlq-1',
          assignmentId: 'assignment-123',
          actionType: 'resend'
        },
        actionLink: '/alerts?filter=dlq',
        status: 'active',
        acknowledged: true,
        resolved: false
      },
      {
        id: 'alert-2',
        eventType: 'email.bounce',
        title: 'Email rebotado',
        description: 'Un email ha rebotado: user@example.com',
        severity: SEVERITY.WARNING,
        timestamp: new Date('2024-10-21T10:15:00'),
        orgId,
        data: {
          email: 'user@example.com',
          reason: 'mailbox-full',
          campaignId: 'campaign-1'
        },
        actionLink: '/alerts?filter=email',
        status: 'active',
        acknowledged: false,
        resolved: false
      },
      {
        id: 'alert-3',
        eventType: 'rate_limit.exceeded',
        title: 'Límite de tasa excedido',
        description: 'Se ha excedido el límite de tasa para: email-sending',
        severity: SEVERITY.WARNING,
        timestamp: new Date('2024-10-21T09:45:00'),
        orgId,
        data: {
          limitType: 'email-sending',
          limit: 100,
          current: 105
        },
        actionLink: '/policies',
        status: 'active',
        acknowledged: true,
        resolved: false
      }
    ];
    
    // Aplicar filtros si existen
    let filteredAlerts = [...mockAlerts];
    
    if (options.severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === options.severity);
    }
    
    if (options.eventType) {
      filteredAlerts = filteredAlerts.filter(a => a.eventType === options.eventType);
    }
    
    if (options.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter(a => a.acknowledged === options.acknowledged);
    }
    
    // Ordenar por timestamp (más recientes primero)
    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
    
    return filteredAlerts;
  } catch (error) {
    console.error('[Observability] Error getting active alerts:', error);
    throw error;
  }
};

/**
 * Actualizar estado de alerta
 */
export const updateAlertStatus = async (orgId, alertId, updates) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }
    
    if (!alertId) {
      throw new Error('Alert ID is required');
    }
    
    // En producción, actualizar en Firestore
    // const alertRef = doc(db, 'orgs', orgId, 'alerts', alertId);
    // await updateDoc(alertRef, updates);
    
    console.log(`[Alert] Updated alert ${alertId}:`, updates);
    
    return { success: true };
  } catch (error) {
    console.error('[Observability] Error updating alert:', error);
    throw error;
  }
};

// ========== EXPORTS ==========

export default {
  // Logging
  logEvent,
  logAuditEvent,
  
  // Métricas
  recordPerformanceMetric,
  
  // Alertas
  createAlert,
  getActiveAlerts,
  updateAlertStatus,
  
  // Constantes
  SEVERITY
};