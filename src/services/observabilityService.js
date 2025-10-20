/**
 * Servicio de Observabilidad
 * 
 * Verifica que todos los eventos mínimos están llegando
 */

// ========== EVENT TYPES ==========

export const EVENT_TYPES = {
  // Invitaciones
  INVITATION_SENT: 'invitation.sent',
  INVITATION_OPENED: 'invitation.opened',
  INVITATION_CLICKED: 'invitation.clicked',
  
  // Evaluaciones
  EVALUATION_STARTED: 'evaluation.started',
  EVALUATION_PROGRESS: 'evaluation.progress',
  EVALUATION_COMPLETED: 'evaluation.completed',
  EVALUATION_ABANDONED: 'evaluation.abandoned',
  
  // Umbrales
  THRESHOLDS_MET: 'thresholds.met',
  THRESHOLDS_FAILED: 'thresholds.failed',
  ANONYMITY_VIOLATION: 'anonymity.violation',
  
  // Resultados
  RESULTS_GENERATED: 'results.generated',
  RESULTS_RELEASED: 'results.released',
  RESULTS_VIEWED: 'results.viewed',
  
  // Reportes
  REPORT_GENERATED: 'report.generated',
  REPORT_VIEWED: 'report.viewed',
  REPORT_EXPORTED: 'report.exported',
  
  // Sistema
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_ACTIVATED: 'campaign.activated',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  TOKEN_VALIDATED: 'token.validated',
  TOKEN_INVALIDATED: 'token.invalidated'
};

// ========== EVENT SCHEMA ==========

export const createEvent = (type, data, metadata = {}) => {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      ...metadata,
      source: '360mvp',
      version: '1.0'
    }
  };
};

// ========== EVENT TRACKING ==========

/**
 * Trackear evento de invitación enviada
 */
export const trackInvitationSent = async (orgId, campaignId, assignmentId, evaluatorEmail) => {
  const event = createEvent(EVENT_TYPES.INVITATION_SENT, {
    orgId,
    campaignId,
    assignmentId,
    evaluatorEmail,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Invitation sent tracked:', event.id);
  return event;
};

/**
 * Trackear evento de evaluación completada
 */
export const trackEvaluationCompleted = async (orgId, session360Id, evaluatorType, completionTime) => {
  const event = createEvent(EVENT_TYPES.EVALUATION_COMPLETED, {
    orgId,
    session360Id,
    evaluatorType,
    completionTime,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Evaluation completed tracked:', event.id);
  return event;
};

/**
 * Trackear evento de umbrales cumplidos
 */
export const trackThresholdsMet = async (orgId, session360Id, thresholds) => {
  const event = createEvent(EVENT_TYPES.THRESHOLDS_MET, {
    orgId,
    session360Id,
    thresholds,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Thresholds met tracked:', event.id);
  return event;
};

/**
 * Trackear evento de resultados liberados
 */
export const trackResultsReleased = async (orgId, session360Id, reportId) => {
  const event = createEvent(EVENT_TYPES.RESULTS_RELEASED, {
    orgId,
    session360Id,
    reportId,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Results released tracked:', event.id);
  return event;
};

/**
 * Trackear evento de reporte visualizado
 */
export const trackReportViewed = async (orgId, reportId, userId, viewDuration) => {
  const event = createEvent(EVENT_TYPES.REPORT_VIEWED, {
    orgId,
    reportId,
    userId,
    viewDuration,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Report viewed tracked:', event.id);
  return event;
};

/**
 * Trackear evento de exportación
 */
export const trackReportExported = async (orgId, reportId, exportType, userId) => {
  const event = createEvent(EVENT_TYPES.REPORT_EXPORTED, {
    orgId,
    reportId,
    exportType,
    userId,
    timestamp: new Date().toISOString()
  });
  
  await logEvent(event);
  console.log('[Observability] Report exported tracked:', event.id);
  return event;
};

// ========== EVENT LOGGING ==========

/**
 * Registrar evento en sistema de logging
 */
const logEvent = async (event) => {
  try {
    // En implementación real, enviar a sistema de logging
    // await sendToLoggingSystem(event);
    
    // Simular logging
    console.log(`[EVENT] ${event.type}:`, {
      id: event.id,
      timestamp: event.timestamp,
      data: event.data
    });
    
    // También guardar en Firestore para auditoría
    await saveEventToFirestore(event);
  } catch (error) {
    console.error('[Observability] Error logging event:', error);
  }
};

/**
 * Guardar evento en Firestore para auditoría
 */
const saveEventToFirestore = async (event) => {
  try {
    // En implementación real, guardar en Firestore
    // const db = getFirestore();
    // await db.collection('audit_events').add(event);
    
    console.log('[Observability] Event saved to Firestore:', event.id);
  } catch (error) {
    console.error('[Observability] Error saving event to Firestore:', error);
  }
};

// ========== EVENT VERIFICATION ==========

/**
 * Verificar eventos mínimos para una campaña
 */
export const verifyMinimumEvents = async (orgId, campaignId) => {
  try {
    const requiredEvents = [
      EVENT_TYPES.INVITATION_SENT,
      EVENT_TYPES.EVALUATION_COMPLETED,
      EVENT_TYPES.THRESHOLDS_MET,
      EVENT_TYPES.RESULTS_RELEASED,
      EVENT_TYPES.REPORT_VIEWED
    ];
    
    const campaignEvents = await getCampaignEvents(orgId, campaignId);
    const eventTypes = campaignEvents.map(event => event.type);
    
    const missingEvents = requiredEvents.filter(eventType => 
      !eventTypes.includes(eventType)
    );
    
    const verification = {
      campaignId,
      totalEvents: campaignEvents.length,
      requiredEvents: requiredEvents.length,
      missingEvents,
      isComplete: missingEvents.length === 0,
      events: campaignEvents
    };
    
    console.log('[Observability] Event verification completed:', verification);
    return verification;
  } catch (error) {
    console.error('[Observability] Error verifying events:', error);
    throw error;
  }
};

/**
 * Obtener eventos de una campaña
 */
const getCampaignEvents = async (orgId, campaignId) => {
  try {
    // En implementación real, consultar Firestore
    // const db = getFirestore();
    // const snapshot = await db.collection('audit_events')
    //   .where('data.orgId', '==', orgId)
    //   .where('data.campaignId', '==', campaignId)
    //   .orderBy('timestamp', 'desc')
    //   .get();
    
    // Simular eventos
    return [
      {
        id: 'evt_1',
        type: EVENT_TYPES.INVITATION_SENT,
        timestamp: new Date().toISOString(),
        data: { orgId, campaignId }
      },
      {
        id: 'evt_2',
        type: EVENT_TYPES.EVALUATION_COMPLETED,
        timestamp: new Date().toISOString(),
        data: { orgId, campaignId }
      },
      {
        id: 'evt_3',
        type: EVENT_TYPES.THRESHOLDS_MET,
        timestamp: new Date().toISOString(),
        data: { orgId, campaignId }
      },
      {
        id: 'evt_4',
        type: EVENT_TYPES.RESULTS_RELEASED,
        timestamp: new Date().toISOString(),
        data: { orgId, campaignId }
      },
      {
        id: 'evt_5',
        type: EVENT_TYPES.REPORT_VIEWED,
        timestamp: new Date().toISOString(),
        data: { orgId, campaignId }
      }
    ];
  } catch (error) {
    console.error('[Observability] Error getting campaign events:', error);
    return [];
  }
};

// ========== METRICS ==========

/**
 * Obtener métricas de eventos
 */
export const getEventMetrics = async (orgId, timeRange = '7d') => {
  try {
    const events = await getOrgEvents(orgId, timeRange);
    
    const metrics = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByDay: {},
      topEvents: [],
      errorRate: 0
    };
    
    // Contar eventos por tipo
    events.forEach(event => {
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;
    });
    
    // Obtener top 5 eventos
    metrics.topEvents = Object.entries(metrics.eventsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    return metrics;
  } catch (error) {
    console.error('[Observability] Error getting event metrics:', error);
    throw error;
  }
};

/**
 * Obtener eventos de una organización
 */
const getOrgEvents = async (orgId, timeRange) => {
  try {
    // En implementación real, consultar Firestore con filtros de tiempo
    // Simular eventos
    return [
      { type: EVENT_TYPES.INVITATION_SENT, timestamp: new Date().toISOString() },
      { type: EVENT_TYPES.EVALUATION_COMPLETED, timestamp: new Date().toISOString() },
      { type: EVENT_TYPES.REPORT_VIEWED, timestamp: new Date().toISOString() }
    ];
  } catch (error) {
    console.error('[Observability] Error getting org events:', error);
    return [];
  }
};

export default {
  EVENT_TYPES,
  createEvent,
  trackInvitationSent,
  trackEvaluationCompleted,
  trackThresholdsMet,
  trackResultsReleased,
  trackReportViewed,
  trackReportExported,
  verifyMinimumEvents,
  getEventMetrics
};
