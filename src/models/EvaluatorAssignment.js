/**
 * Modelo de EvaluatorAssignment para 360° Evaluations
 * 
 * Define las asignaciones de evaluadores con tokens únicos
 * para acceder a evaluaciones específicas
 */

// ========== CONSTANTS ==========

export const EVALUATOR_ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  INVITED: 'invited',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const EVALUATOR_TYPE = {
  SELF: 'self',
  MANAGER: 'manager',
  PEER: 'peer',
  SUBORDINATE: 'subordinate',
  EXTERNAL: 'external'
};

export const TOKEN_CONFIG = {
  LENGTH: 15,
  FORMAT: 'XXX-XXXX-XXXX-XXX',
  CHARACTERS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Sin 0,O,1,I,l
  EXPIRY_DAYS: 30,
  MAX_USES: 1 // Por defecto, un solo uso
};

// ========== DATA MODELS ==========

/**
 * Modelo de EvaluatorAssignment
 */
export const createEvaluatorAssignmentModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    assignmentId: data.assignmentId || `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    campaignId: data.campaignId,
    session360Id: data.session360Id,
    evaluateeId: data.evaluateeId,
    
    // Evaluador
    evaluatorId: data.evaluatorId, // null para evaluadores externos
    evaluatorEmail: data.evaluatorEmail,
    evaluatorName: data.evaluatorName,
    evaluatorType: data.evaluatorType || EVALUATOR_TYPE.PEER,
    
    // Token
    token: data.token || generateSecureToken(),
    tokenHash: data.tokenHash || hashToken(data.token || generateSecureToken()),
    tokenExpiresAt: data.tokenExpiresAt || new Date(now.getTime() + (TOKEN_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
    tokenUses: data.tokenUses || 0,
    maxTokenUses: data.maxTokenUses || TOKEN_CONFIG.MAX_USES,
    
    // Test
    testId: data.testId,
    testVersion: data.testVersion || '1.0',
    testSnapshot: data.testSnapshot || null,
    
    // Estado
    status: data.status || EVALUATOR_ASSIGNMENT_STATUS.PENDING,
    
    // Respuestas
    answers: data.answers || null,
    completedAt: data.completedAt || null,
    timeSpent: data.timeSpent || 0, // en minutos
    
    // Metadatos
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    invitedAt: data.invitedAt || null,
    lastAccessedAt: data.lastAccessedAt || null,
    
    // Tracking
    emailSent: data.emailSent || false,
    emailSentAt: data.emailSentAt || null,
    emailOpened: data.emailOpened || false,
    emailOpenedAt: data.emailOpenedAt || null,
    emailClicked: data.emailClicked || false,
    emailClickedAt: data.emailClickedAt || null,
    
    // Configuración
    isExternal: data.isExternal || false,
    requiresAuthentication: data.requiresAuthentication !== undefined ? data.requiresAuthentication : !data.isExternal,
    customInstructions: data.customInstructions || null
  };
};

// ========== TOKEN FUNCTIONS ==========

/**
 * Generar token seguro
 */
export const generateSecureToken = () => {
  const chars = TOKEN_CONFIG.CHARACTERS;
  let token = '';
  
  for (let i = 0; i < TOKEN_CONFIG.LENGTH; i++) {
    if (i === 3 || i === 8 || i === 13) {
      token += '-';
    } else {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return token;
};

/**
 * Hashear token para almacenamiento seguro
 */
export const hashToken = (token) => {
  // En implementación real, usar crypto.createHash('sha256')
  // Por ahora, usar un hash simple para desarrollo
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return hash.toString(36);
};

/**
 * Validar formato de token
 */
export const validateTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Verificar longitud
  if (token.length !== TOKEN_CONFIG.LENGTH) {
    return false;
  }
  
  // Verificar formato XXX-XXXX-XXXX-XXX
  const pattern = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;
  if (!pattern.test(token)) {
    return false;
  }
  
  // Verificar que no contenga caracteres ambiguos
  const ambiguousChars = ['0', 'O', '1', 'I', 'L'];
  for (const char of ambiguousChars) {
    if (token.includes(char)) {
      return false;
    }
  }
  
  return true;
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar EvaluatorAssignment
 */
export const validateEvaluatorAssignment = (assignment) => {
  const errors = [];
  
  // Validaciones básicas
  if (!assignment.evaluatorEmail || !/\S+@\S+\.\S+/.test(assignment.evaluatorEmail)) {
    errors.push('Email del evaluador requerido y válido');
  }
  
  if (!assignment.evaluatorName || assignment.evaluatorName.trim().length < 2) {
    errors.push('Nombre del evaluador requerido (mínimo 2 caracteres)');
  }
  
  if (!Object.values(EVALUATOR_TYPE).includes(assignment.evaluatorType)) {
    errors.push('Tipo de evaluador inválido');
  }
  
  if (!assignment.testId) {
    errors.push('ID del test requerido');
  }
  
  // Validar token
  if (!validateTokenFormat(assignment.token)) {
    errors.push('Formato de token inválido');
  }
  
  // Validar fechas
  if (assignment.tokenExpiresAt && new Date(assignment.tokenExpiresAt) <= new Date()) {
    errors.push('Token no puede expirar en el pasado');
  }
  
  // Validar uso de token
  if (assignment.tokenUses > assignment.maxTokenUses) {
    errors.push('Token excede el número máximo de usos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener estado de asignación como string legible
 */
export const getAssignmentStatusLabel = (status) => {
  switch (status) {
    case EVALUATOR_ASSIGNMENT_STATUS.PENDING: return 'Pendiente';
    case EVALUATOR_ASSIGNMENT_STATUS.INVITED: return 'Invitado';
    case EVALUATOR_ASSIGNMENT_STATUS.IN_PROGRESS: return 'En Progreso';
    case EVALUATOR_ASSIGNMENT_STATUS.COMPLETED: return 'Completado';
    case EVALUATOR_ASSIGNMENT_STATUS.EXPIRED: return 'Expirado';
    case EVALUATOR_ASSIGNMENT_STATUS.CANCELLED: return 'Cancelado';
    default: return 'Estado Desconocido';
  }
};

/**
 * Obtener color para estado de asignación
 */
export const getAssignmentStatusColor = (status) => {
  switch (status) {
    case EVALUATOR_ASSIGNMENT_STATUS.PENDING: return 'bg-gray-100 text-gray-800';
    case EVALUATOR_ASSIGNMENT_STATUS.INVITED: return 'bg-blue-100 text-blue-800';
    case EVALUATOR_ASSIGNMENT_STATUS.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
    case EVALUATOR_ASSIGNMENT_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
    case EVALUATOR_ASSIGNMENT_STATUS.EXPIRED: return 'bg-red-100 text-red-800';
    case EVALUATOR_ASSIGNMENT_STATUS.CANCELLED: return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener tipo de evaluador como string legible
 */
export const getEvaluatorTypeLabel = (type) => {
  switch (type) {
    case EVALUATOR_TYPE.SELF: return 'Autoevaluación';
    case EVALUATOR_TYPE.MANAGER: return 'Manager';
    case EVALUATOR_TYPE.PEER: return 'Par';
    case EVALUATOR_TYPE.SUBORDINATE: return 'Subordinado';
    case EVALUATOR_TYPE.EXTERNAL: return 'Externo';
    default: return 'Tipo Desconocido';
  }
};

/**
 * Obtener color para tipo de evaluador
 */
export const getEvaluatorTypeColor = (type) => {
  switch (type) {
    case EVALUATOR_TYPE.SELF: return 'bg-purple-100 text-purple-800';
    case EVALUATOR_TYPE.MANAGER: return 'bg-blue-100 text-blue-800';
    case EVALUATOR_TYPE.PEER: return 'bg-green-100 text-green-800';
    case EVALUATOR_TYPE.SUBORDINATE: return 'bg-orange-100 text-orange-800';
    case EVALUATOR_TYPE.EXTERNAL: return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Verificar si el token está expirado
 */
export const isTokenExpired = (assignment) => {
  if (!assignment.tokenExpiresAt) {
    return false;
  }
  
  return new Date(assignment.tokenExpiresAt) <= new Date();
};

/**
 * Verificar si el token puede ser usado
 */
export const canUseToken = (assignment) => {
  if (assignment.status === EVALUATOR_ASSIGNMENT_STATUS.CANCELLED) {
    return false;
  }
  
  if (isTokenExpired(assignment)) {
    return false;
  }
  
  if (assignment.tokenUses >= assignment.maxTokenUses) {
    return false;
  }
  
  return true;
};

/**
 * Generar URL de evaluación con token
 */
export const generateEvaluationUrl = (token, baseUrl = '') => {
  return `${baseUrl}/eval/${token}`;
};

/**
 * Calcular tiempo restante del token
 */
export const getTokenTimeRemaining = (assignment) => {
  if (!assignment.tokenExpiresAt) {
    return null;
  }
  
  const now = new Date();
  const expiresAt = new Date(assignment.tokenExpiresAt);
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { expired: false, days, hours, minutes };
};

/**
 * Obtener estadísticas de asignación
 */
export const getAssignmentStats = (assignments) => {
  const stats = {
    total: assignments.length,
    pending: 0,
    invited: 0,
    inProgress: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
    byType: {}
  };
  
  // Inicializar contadores por tipo
  Object.values(EVALUATOR_TYPE).forEach(type => {
    stats.byType[type] = 0;
  });
  
  assignments.forEach(assignment => {
    stats[assignment.status] = (stats[assignment.status] || 0) + 1;
    stats.byType[assignment.evaluatorType] = (stats.byType[assignment.evaluatorType] || 0) + 1;
  });
  
  return stats;
};

// ========== EXPORT DEFAULT ==========

export default {
  // Constants
  EVALUATOR_ASSIGNMENT_STATUS,
  EVALUATOR_TYPE,
  TOKEN_CONFIG,
  
  // Models
  createEvaluatorAssignmentModel,
  
  // Token functions
  generateSecureToken,
  hashToken,
  validateTokenFormat,
  
  // Validation
  validateEvaluatorAssignment,
  
  // Utilities
  getAssignmentStatusLabel,
  getAssignmentStatusColor,
  getEvaluatorTypeLabel,
  getEvaluatorTypeColor,
  isTokenExpired,
  canUseToken,
  generateEvaluationUrl,
  getTokenTimeRemaining,
  getAssignmentStats
};
