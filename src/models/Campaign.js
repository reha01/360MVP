/**
 * Modelo de Campaign (Campaña 360°) para 360° Evaluations
 * 
 * Define campañas que agrupan múltiples evaluaciones 360° individuales
 * bajo un proceso unificado con reglas, plazos y configuraciones comunes
 */

// ========== CONSTANTS ==========

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  COMPLETED: 'completed'
};

export const CAMPAIGN_TYPE = {
  ORG_WIDE: 'org_wide',
  AREA: 'area',
  CUSTOM: 'custom'
};

export const EVALUATOR_TYPE = {
  SELF: 'self',
  MANAGER: 'manager',
  PEER: 'peer',
  SUBORDINATE: 'subordinate',
  EXTERNAL: 'external'
};

export const VALIDATION_RULES = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 365,
  MIN_EVALUATORS: {
    self: 1,
    manager: 1,
    peer: 3,
    subordinate: 3,
    external: 1
  },
  MAX_EVALUATORS: {
    self: 1,
    manager: 3,
    peer: 10,
    subordinate: 15,
    external: 5
  }
};

// ========== DATA MODELS ==========

/**
 * Modelo de Campaign
 */
export const createCampaignModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    campaignId: data.campaignId || `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    
    // Información básica
    title: data.title?.trim(),
    description: data.description?.trim() || '',
    type: data.type || CAMPAIGN_TYPE.CUSTOM,
    
    // Estado
    status: data.status || CAMPAIGN_STATUS.DRAFT,
    
    // Configuración
    config: {
      startDate: data.config?.startDate || null,
      endDate: data.config?.endDate || null,
      timezone: data.config?.timezone || 'UTC',
      reminderSchedule: data.config?.reminderSchedule || [3, 7, 14], // Días
      anonymityThresholds: {
        peers: data.config?.anonymityThresholds?.peers || 3,
        subordinates: data.config?.anonymityThresholds?.subordinates || 3,
        external: data.config?.anonymityThresholds?.external || 1
      },
      requiredEvaluators: {
        self: data.config?.requiredEvaluators?.self !== undefined ? data.config.requiredEvaluators.self : true,
        manager: data.config?.requiredEvaluators?.manager !== undefined ? data.config.requiredEvaluators.manager : true,
        peers: {
          min: data.config?.requiredEvaluators?.peers?.min || 3,
          max: data.config?.requiredEvaluators?.peers?.max || 5
        },
        subordinates: {
          min: data.config?.requiredEvaluators?.subordinates?.min || 0
        },
        external: {
          min: data.config?.requiredEvaluators?.external?.min || 0
        }
      },
      emailTemplates: {
        invitation: data.config?.emailTemplates?.invitation || null,
        reminder: data.config?.emailTemplates?.reminder || null,
        thanks: data.config?.emailTemplates?.thanks || null
      }
    },
    
    // Filtros de evaluados
    evaluateeFilters: {
      jobFamilyIds: data.evaluateeFilters?.jobFamilyIds || [],
      areaIds: data.evaluateeFilters?.areaIds || [],
      userIds: data.evaluateeFilters?.userIds || []
    },
    
    // Tests asignados
    testAssignments: data.testAssignments || {}, // { userId: { testId, version, reason } }
    
    // Metadatos
    createdBy: data.createdBy,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    activatedAt: data.activatedAt || null,
    closedAt: data.closedAt || null,
    
    // Estadísticas
    stats: {
      totalEvaluatees: data.stats?.totalEvaluatees || 0,
      totalInvitations: data.stats?.totalInvitations || 0,
      completionRate: data.stats?.completionRate || 0,
      lastUpdated: data.stats?.lastUpdated || now
    }
  };
};

/**
 * Modelo de Evaluation360Session
 */
export const createEvaluation360SessionModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    session360Id: data.session360Id || `session360_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    campaignId: data.campaignId,
    evaluateeId: data.evaluateeId,
    
    // Test asignado
    testId: data.testId,
    testVersion: data.testVersion || '1.0',
    testSnapshot: data.testSnapshot || null, // Snapshot del test al momento de la evaluación
    
    // Configuración de evaluadores
    evaluatorConfig: {
      self: {
        required: data.evaluatorConfig?.self?.required !== undefined ? data.evaluatorConfig.self.required : true,
        assigned: data.evaluatorConfig?.self?.assigned || null
      },
      manager: {
        required: data.evaluatorConfig?.manager?.required !== undefined ? data.evaluatorConfig.manager.required : true,
        assigned: data.evaluatorConfig?.manager?.assigned || []
      },
      peers: {
        required: data.evaluatorConfig?.peers?.required || { min: 3, max: 5 },
        assigned: data.evaluatorConfig?.peers?.assigned || []
      },
      subordinates: {
        required: data.evaluatorConfig?.subordinates?.required || { min: 0 },
        assigned: data.evaluatorConfig?.subordinates?.assigned || []
      },
      external: {
        required: data.evaluatorConfig?.external?.required || { min: 0 },
        assigned: data.evaluatorConfig?.external?.assigned || []
      }
    },
    
    // Estado
    status: data.status || 'pending', // pending, active, completed, closed
    
    // Resultados
    results: {
      self: data.results?.self || null,
      manager: data.results?.manager || null,
      peers: data.results?.peers || null,
      subordinates: data.results?.subordinates || null,
      external: data.results?.external || null,
      aggregated: data.results?.aggregated || null,
      releasedAt: data.results?.releasedAt || null
    },
    
    // Metadatos
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    completedAt: data.completedAt || null
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar Campaign
 */
export const validateCampaign = (campaign) => {
  const errors = [];
  
  // Validaciones básicas
  if (!campaign.title || campaign.title.length < VALIDATION_RULES.MIN_TITLE_LENGTH) {
    errors.push(`Título debe tener al menos ${VALIDATION_RULES.MIN_TITLE_LENGTH} caracteres`);
  }
  
  if (campaign.title && campaign.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push(`Título no puede exceder ${VALIDATION_RULES.MAX_TITLE_LENGTH} caracteres`);
  }
  
  if (campaign.description && campaign.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descripción no puede exceder ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  
  // Validar tipo
  if (!Object.values(CAMPAIGN_TYPE).includes(campaign.type)) {
    errors.push(`Tipo de campaña inválido: ${campaign.type}`);
  }
  
  // Validar fechas
  if (campaign.config.startDate && campaign.config.endDate) {
    const startDate = new Date(campaign.config.startDate);
    const endDate = new Date(campaign.config.endDate);
    
    if (startDate >= endDate) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (durationDays < VALIDATION_RULES.MIN_DURATION_DAYS) {
      errors.push(`La duración mínima es ${VALIDATION_RULES.MIN_DURATION_DAYS} día(s)`);
    }
    
    if (durationDays > VALIDATION_RULES.MAX_DURATION_DAYS) {
      errors.push(`La duración máxima es ${VALIDATION_RULES.MAX_DURATION_DAYS} días`);
    }
  }
  
  // Validar configuración de evaluadores
  if (campaign.config.requiredEvaluators) {
    const config = campaign.config.requiredEvaluators;
    
    // Validar pares
    if (config.peers && config.peers.min > config.peers.max) {
      errors.push('Mínimo de pares no puede ser mayor al máximo');
    }
    
    if (config.peers && config.peers.min < VALIDATION_RULES.MIN_EVALUATORS.peer) {
      errors.push(`Mínimo de pares debe ser al menos ${VALIDATION_RULES.MIN_EVALUATORS.peer}`);
    }
    
    // Validar subordinados
    if (config.subordinates && config.subordinates.min < 0) {
      errors.push('Mínimo de subordinados no puede ser negativo');
    }
  }
  
  // Validar filtros de evaluados
  if (campaign.evaluateeFilters) {
    const hasFilters = campaign.evaluateeFilters.jobFamilyIds.length > 0 ||
                      campaign.evaluateeFilters.areaIds.length > 0 ||
                      campaign.evaluateeFilters.userIds.length > 0;
    
    if (!hasFilters) {
      errors.push('Debe seleccionar al menos un filtro de evaluados');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar Evaluation360Session
 */
export const validateEvaluation360Session = (session) => {
  const errors = [];
  
  // Validaciones básicas
  if (!session.evaluateeId) {
    errors.push('ID del evaluado requerido');
  }
  
  if (!session.testId) {
    errors.push('ID del test requerido');
  }
  
  // Validar configuración de evaluadores
  if (session.evaluatorConfig) {
    const config = session.evaluatorConfig;
    
    // Validar que se cumplan los mínimos requeridos
    if (config.peers.required.min > 0 && config.peers.assigned.length < config.peers.required.min) {
      errors.push(`Se requieren al menos ${config.peers.required.min} evaluadores pares`);
    }
    
    if (config.subordinates.required.min > 0 && config.subordinates.assigned.length < config.subordinates.required.min) {
      errors.push(`Se requieren al menos ${config.subordinates.required.min} evaluadores subordinados`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener estado de campaña como string legible
 */
export const getCampaignStatusLabel = (status) => {
  switch (status) {
    case CAMPAIGN_STATUS.DRAFT: return 'Borrador';
    case CAMPAIGN_STATUS.ACTIVE: return 'Activa';
    case CAMPAIGN_STATUS.CLOSED: return 'Cerrada';
    case CAMPAIGN_STATUS.COMPLETED: return 'Completada';
    default: return 'Estado Desconocido';
  }
};

/**
 * Obtener color para estado de campaña
 */
export const getCampaignStatusColor = (status) => {
  switch (status) {
    case CAMPAIGN_STATUS.DRAFT: return 'bg-gray-100 text-gray-800';
    case CAMPAIGN_STATUS.ACTIVE: return 'bg-green-100 text-green-800';
    case CAMPAIGN_STATUS.CLOSED: return 'bg-yellow-100 text-yellow-800';
    case CAMPAIGN_STATUS.COMPLETED: return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener tipo de campaña como string legible
 */
export const getCampaignTypeLabel = (type) => {
  switch (type) {
    case CAMPAIGN_TYPE.ORG_WIDE: return 'Organización Completa';
    case CAMPAIGN_TYPE.AREA: return 'Por Área';
    case CAMPAIGN_TYPE.CUSTOM: return 'Personalizada';
    default: return 'Tipo Desconocido';
  }
};

/**
 * Verificar si una campaña puede activarse
 */
export const canActivateCampaign = (campaign) => {
  const issues = [];
  
  if (!campaign.title) {
    issues.push('Título requerido');
  }
  
  if (!campaign.config.startDate || !campaign.config.endDate) {
    issues.push('Fechas de inicio y fin requeridas');
  }
  
  const hasEvaluatees = campaign.evaluateeFilters.jobFamilyIds.length > 0 ||
                       campaign.evaluateeFilters.areaIds.length > 0 ||
                       campaign.evaluateeFilters.userIds.length > 0;
  
  if (!hasEvaluatees) {
    issues.push('Debe seleccionar evaluados');
  }
  
  if (Object.keys(campaign.testAssignments).length === 0) {
    issues.push('Debe asignar tests a los evaluados');
  }
  
  return {
    canActivate: issues.length === 0,
    issues
  };
};

/**
 * Calcular estadísticas de campaña
 */
export const calculateCampaignStats = (campaign, sessions) => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  // Calcular total de invitaciones (suma de todos los evaluadores asignados)
  const totalInvitations = sessions.reduce((total, session) => {
    const config = session.evaluatorConfig;
    return total + 
           (config.self.assigned ? 1 : 0) +
           config.manager.assigned.length +
           config.peers.assigned.length +
           config.subordinates.assigned.length +
           config.external.assigned.length;
  }, 0);
  
  return {
    totalEvaluatees: totalSessions,
    totalInvitations,
    completionRate: Math.round(completionRate * 100) / 100,
    lastUpdated: new Date()
  };
};

/**
 * Generar configuración de evaluadores basada en Job Family
 */
export const generateEvaluatorConfigFromJobFamily = (jobFamily) => {
  if (!jobFamily || !jobFamily.evaluatorConfig) {
    return {
      self: { required: true },
      manager: { required: true },
      peers: { required: { min: 3, max: 5 } },
      subordinates: { required: { min: 0 } },
      external: { required: { min: 0 } }
    };
  }
  
  return {
    self: { required: jobFamily.evaluatorConfig.requireSelf },
    manager: { required: jobFamily.evaluatorConfig.requireManager },
    peers: { 
      required: { 
        min: jobFamily.evaluatorConfig.peersMin, 
        max: jobFamily.evaluatorConfig.peersMax 
      } 
    },
    subordinates: { 
      required: { 
        min: jobFamily.evaluatorConfig.subordinatesMin 
      } 
    },
    external: { required: { min: 0 } }
  };
};

// ========== EXPORT DEFAULT ==========

export default {
  // Constants
  CAMPAIGN_STATUS,
  CAMPAIGN_TYPE,
  EVALUATOR_TYPE,
  VALIDATION_RULES,
  
  // Models
  createCampaignModel,
  createEvaluation360SessionModel,
  
  // Validation
  validateCampaign,
  validateEvaluation360Session,
  
  // Utilities
  getCampaignStatusLabel,
  getCampaignStatusColor,
  getCampaignTypeLabel,
  canActivateCampaign,
  calculateCampaignStats,
  generateEvaluatorConfigFromJobFamily
};
