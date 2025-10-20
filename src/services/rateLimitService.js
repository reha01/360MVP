/**
 * Servicio de Rate Limiting y TTL por Plan
 * 
 * Simula topes por plan y valida mensajes de negocio
 */

// ========== PLAN LIMITS ==========

export const PLAN_LIMITS = {
  free: {
    emailsPerDay: 10,
    activeCampaigns: 1,
    exportsPerDay: 3,
    evaluationsPerMonth: 50,
    maxEvaluatorsPerCampaign: 20,
    reportRetentionDays: 30
  },
  premium: {
    emailsPerDay: 100,
    activeCampaigns: 5,
    exportsPerDay: 50,
    evaluationsPerMonth: 500,
    maxEvaluatorsPerCampaign: 100,
    reportRetentionDays: 90
  },
  enterprise: {
    emailsPerDay: -1, // Sin límite
    activeCampaigns: -1, // Sin límite
    exportsPerDay: -1, // Sin límite
    evaluationsPerMonth: -1, // Sin límite
    maxEvaluatorsPerCampaign: -1, // Sin límite
    reportRetentionDays: 365
  }
};

// ========== BUSINESS MESSAGES ==========

export const BUSINESS_MESSAGES = {
  quotaExceeded: {
    emails: 'Has alcanzado el límite diario de emails. Actualiza tu plan para enviar más invitaciones.',
    campaigns: 'Has alcanzado el límite de campañas activas. Finaliza una campaña o actualiza tu plan.',
    exports: 'Has alcanzado el límite diario de exportaciones. Actualiza tu plan para más exportaciones.',
    evaluations: 'Has alcanzado el límite mensual de evaluaciones. Actualiza tu plan para continuar.'
  },
  upgrade: {
    title: 'Límite de Plan Alcanzado',
    message: 'Tu plan actual tiene limitaciones. Considera actualizar para acceder a más funcionalidades.',
    cta: 'Actualizar Plan'
  }
};

/**
 * Verificar límite de emails por día
 */
export const checkEmailLimit = async (orgId, userPlan) => {
  const limit = PLAN_LIMITS[userPlan]?.emailsPerDay;
  
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Simular conteo de emails del día
  const todayEmails = await getTodayEmailCount(orgId);
  const remaining = Math.max(0, limit - todayEmails);
  
  return {
    allowed: todayEmails < limit,
    remaining,
    limit,
    message: todayEmails >= limit ? BUSINESS_MESSAGES.quotaExceeded.emails : null
  };
};

/**
 * Verificar límite de campañas activas
 */
export const checkCampaignLimit = async (orgId, userPlan) => {
  const limit = PLAN_LIMITS[userPlan]?.activeCampaigns;
  
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Simular conteo de campañas activas
  const activeCampaigns = await getActiveCampaignCount(orgId);
  const remaining = Math.max(0, limit - activeCampaigns);
  
  return {
    allowed: activeCampaigns < limit,
    remaining,
    limit,
    message: activeCampaigns >= limit ? BUSINESS_MESSAGES.quotaExceeded.campaigns : null
  };
};

/**
 * Verificar límite de exportaciones por día
 */
export const checkExportLimit = async (orgId, userPlan) => {
  const limit = PLAN_LIMITS[userPlan]?.exportsPerDay;
  
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Simular conteo de exportaciones del día
  const todayExports = await getTodayExportCount(orgId);
  const remaining = Math.max(0, limit - todayExports);
  
  return {
    allowed: todayExports < limit,
    remaining,
    limit,
    message: todayExports >= limit ? BUSINESS_MESSAGES.quotaExceeded.exports : null
  };
};

/**
 * Verificar límite de evaluadores por campaña
 */
export const checkEvaluatorLimit = async (campaignId, userPlan) => {
  const limit = PLAN_LIMITS[userPlan]?.maxEvaluatorsPerCampaign;
  
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Simular conteo de evaluadores en campaña
  const evaluatorCount = await getCampaignEvaluatorCount(campaignId);
  const remaining = Math.max(0, limit - evaluatorCount);
  
  return {
    allowed: evaluatorCount < limit,
    remaining,
    limit,
    message: evaluatorCount >= limit ? 'Límite de evaluadores por campaña alcanzado' : null
  };
};

/**
 * Verificar límite de evaluaciones por mes
 */
export const checkEvaluationLimit = async (orgId, userPlan) => {
  const limit = PLAN_LIMITS[userPlan]?.evaluationsPerMonth;
  
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Simular conteo de evaluaciones del mes
  const monthEvaluations = await getMonthEvaluationCount(orgId);
  const remaining = Math.max(0, limit - monthEvaluations);
  
  return {
    allowed: monthEvaluations < limit,
    remaining,
    limit,
    message: monthEvaluations >= limit ? BUSINESS_MESSAGES.quotaExceeded.evaluations : null
  };
};

/**
 * Verificar todos los límites de un plan
 */
export const checkAllLimits = async (orgId, userPlan, context = {}) => {
  const checks = await Promise.all([
    checkEmailLimit(orgId, userPlan),
    checkCampaignLimit(orgId, userPlan),
    checkExportLimit(orgId, userPlan),
    checkEvaluationLimit(orgId, userPlan),
    context.campaignId ? checkEvaluatorLimit(context.campaignId, userPlan) : { allowed: true }
  ]);
  
  const violations = checks.filter(check => !check.allowed);
  
  return {
    allowed: violations.length === 0,
    violations,
    plan: userPlan,
    limits: PLAN_LIMITS[userPlan],
    upgradeMessage: violations.length > 0 ? BUSINESS_MESSAGES.upgrade : null
  };
};

/**
 * Generar mensaje de límite alcanzado
 */
export const generateLimitMessage = (violation) => {
  const { type, remaining, limit, message } = violation;
  
  return {
    type: 'warning',
    title: 'Límite de Plan Alcanzado',
    message: message || `Has alcanzado el límite de ${type}`,
    details: {
      used: limit - remaining,
      limit,
      remaining
    },
    action: 'Considera actualizar tu plan para continuar usando esta funcionalidad.'
  };
};

// ========== SIMULATION FUNCTIONS ==========

/**
 * Simular conteo de emails del día
 */
const getTodayEmailCount = async (orgId) => {
  // En implementación real, consultar Firestore
  return Math.floor(Math.random() * 15); // Simular 0-15 emails
};

/**
 * Simular conteo de campañas activas
 */
const getActiveCampaignCount = async (orgId) => {
  // En implementación real, consultar Firestore
  return Math.floor(Math.random() * 3); // Simular 0-3 campañas
};

/**
 * Simular conteo de exportaciones del día
 */
const getTodayExportCount = async (orgId) => {
  // En implementación real, consultar Firestore
  return Math.floor(Math.random() * 5); // Simular 0-5 exportaciones
};

/**
 * Simular conteo de evaluadores en campaña
 */
const getCampaignEvaluatorCount = async (campaignId) => {
  // En implementación real, consultar Firestore
  return Math.floor(Math.random() * 25); // Simular 0-25 evaluadores
};

/**
 * Simular conteo de evaluaciones del mes
 */
const getMonthEvaluationCount = async (orgId) => {
  // En implementación real, consultar Firestore
  return Math.floor(Math.random() * 100); // Simular 0-100 evaluaciones
};

export default {
  PLAN_LIMITS,
  BUSINESS_MESSAGES,
  checkEmailLimit,
  checkCampaignLimit,
  checkExportLimit,
  checkEvaluatorLimit,
  checkEvaluationLimit,
  checkAllLimits,
  generateLimitMessage
};
