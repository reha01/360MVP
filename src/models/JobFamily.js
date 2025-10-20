/**
 * Modelo de Job Family (Familia de Puestos) para 360° Evaluations
 * 
 * Define agrupaciones de roles similares que comparten competencias
 * y criterios de evaluación comunes
 */

// ========== CONSTANTS ==========

export const JOB_LEVELS = {
  INDIVIDUAL_CONTRIBUTOR: 'individual_contributor',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  EXECUTIVE: 'executive'
};

export const TEST_MAPPING_TYPES = {
  RECOMMENDED: 'recommended',
  ALLOWED: 'allowed',
  EXCLUDED: 'excluded'
};

export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_RECOMMENDED_TESTS: 3,
  MIN_PEERS_REQUIRED: 3,
  MAX_PEERS_REQUIRED: 10
};

// ========== DATA MODELS ==========

/**
 * Modelo de Job Family
 */
export const createJobFamilyModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    familyId: data.familyId || `jobfamily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    
    // Información básica
    name: data.name?.trim(),
    description: data.description?.trim() || '',
    level: data.level || JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR,
    
    // Mapeo de tests
    testMappings: {
      recommended: data.testMappings?.recommended || [],
      allowed: data.testMappings?.allowed || [],
      excluded: data.testMappings?.excluded || []
    },
    
    // Configuración de evaluadores
    evaluatorConfig: {
      requireSelf: data.evaluatorConfig?.requireSelf !== undefined ? data.evaluatorConfig.requireSelf : true,
      requireManager: data.evaluatorConfig?.requireManager !== undefined ? data.evaluatorConfig.requireManager : true,
      peersMin: data.evaluatorConfig?.peersMin || VALIDATION_RULES.MIN_PEERS_REQUIRED,
      peersMax: data.evaluatorConfig?.peersMax || 5,
      subordinatesMin: data.evaluatorConfig?.subordinatesMin || 0
    },
    
    // Metadatos
    isActive: data.isActive !== undefined ? data.isActive : true,
    memberCount: data.memberCount || 0,
    
    // Timestamps
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy
  };
};

/**
 * Modelo de Test Mapping
 */
export const createTestMappingModel = (data) => {
  return {
    testId: data.testId,
    testName: data.testName || '',
    testVersion: data.testVersion || '1.0',
    reason: data.reason || '',
    priority: data.priority || 1,
    createdAt: data.createdAt || new Date()
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar Job Family
 */
export const validateJobFamily = (jobFamily) => {
  const errors = [];
  
  // Validaciones básicas
  if (!jobFamily.name || jobFamily.name.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    errors.push(`Nombre debe tener al menos ${VALIDATION_RULES.MIN_NAME_LENGTH} caracteres`);
  }
  
  if (jobFamily.name && jobFamily.name.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
    errors.push(`Nombre no puede exceder ${VALIDATION_RULES.MAX_NAME_LENGTH} caracteres`);
  }
  
  if (jobFamily.description && jobFamily.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descripción no puede exceder ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  
  // Validar nivel
  if (!Object.values(JOB_LEVELS).includes(jobFamily.level)) {
    errors.push(`Nivel inválido: ${jobFamily.level}`);
  }
  
  // Validar test mappings
  if (jobFamily.testMappings) {
    // Validar tests recomendados
    if (jobFamily.testMappings.recommended && jobFamily.testMappings.recommended.length > VALIDATION_RULES.MAX_RECOMMENDED_TESTS) {
      errors.push(`Máximo ${VALIDATION_RULES.MAX_RECOMMENDED_TESTS} tests recomendados permitidos`);
    }
    
    // Validar que no haya tests duplicados entre categorías
    const allTestIds = [
      ...(jobFamily.testMappings.recommended || []).map(t => t.testId),
      ...(jobFamily.testMappings.allowed || []),
      ...(jobFamily.testMappings.excluded || [])
    ];
    
    const duplicates = allTestIds.filter((id, index) => allTestIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Tests duplicados encontrados: ${duplicates.join(', ')}`);
    }
  }
  
  // Validar configuración de evaluadores
  if (jobFamily.evaluatorConfig) {
    const config = jobFamily.evaluatorConfig;
    
    if (config.peersMin < 0 || config.peersMin > VALIDATION_RULES.MAX_PEERS_REQUIRED) {
      errors.push(`Mínimo de pares debe estar entre 0 y ${VALIDATION_RULES.MAX_PEERS_REQUIRED}`);
    }
    
    if (config.peersMax < config.peersMin) {
      errors.push('Máximo de pares no puede ser menor al mínimo');
    }
    
    if (config.subordinatesMin < 0) {
      errors.push('Mínimo de subordinados no puede ser negativo');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar Test Mapping
 */
export const validateTestMapping = (mapping) => {
  const errors = [];
  
  if (!mapping.testId) {
    errors.push('Test ID requerido');
  }
  
  if (mapping.reason && mapping.reason.length > 200) {
    errors.push('Razón no puede exceder 200 caracteres');
  }
  
  if (mapping.priority && (mapping.priority < 1 || mapping.priority > 10)) {
    errors.push('Prioridad debe estar entre 1 y 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener Job Family por ID
 */
export const getJobFamilyById = (familyId, jobFamilies) => {
  return jobFamilies.find(family => family.familyId === familyId);
};

/**
 * Obtener Job Families por nivel
 */
export const getJobFamiliesByLevel = (level, jobFamilies) => {
  return jobFamilies.filter(family => family.level === level);
};

/**
 * Obtener Job Families activas
 */
export const getActiveJobFamilies = (jobFamilies) => {
  return jobFamilies.filter(family => family.isActive);
};

/**
 * Obtener tests recomendados para una Job Family
 */
export const getRecommendedTests = (jobFamily) => {
  return jobFamily.testMappings?.recommended || [];
};

/**
 * Obtener tests permitidos para una Job Family
 */
export const getAllowedTests = (jobFamily) => {
  return jobFamily.testMappings?.allowed || [];
};

/**
 * Obtener tests excluidos para una Job Family
 */
export const getExcludedTests = (jobFamily) => {
  return jobFamily.testMappings?.excluded || [];
};

/**
 * Verificar si un test está permitido para una Job Family
 */
export const isTestAllowedForJobFamily = (testId, jobFamily) => {
  const excluded = getExcludedTests(jobFamily);
  const allowed = getAllowedTests(jobFamily);
  const recommended = getRecommendedTests(jobFamily);
  
  // Si está excluido, no está permitido
  if (excluded.includes(testId)) {
    return false;
  }
  
  // Si está en allowed o recommended, está permitido
  return allowed.includes(testId) || recommended.some(t => t.testId === testId);
};

/**
 * Obtener configuración de evaluadores para una Job Family
 */
export const getEvaluatorConfig = (jobFamily) => {
  return jobFamily.evaluatorConfig || {
    requireSelf: true,
    requireManager: true,
    peersMin: VALIDATION_RULES.MIN_PEERS_REQUIRED,
    peersMax: 5,
    subordinatesMin: 0
  };
};

/**
 * Obtener usuarios asignados a una Job Family
 */
export const getUsersByJobFamily = (familyId, users) => {
  return users.filter(user => 
    user.jobFamilyIds && user.jobFamilyIds.includes(familyId)
  );
};

/**
 * Obtener Job Families de un usuario
 */
export const getJobFamiliesByUser = (userId, jobFamilies, users) => {
  const user = users.find(u => u.userId === userId);
  if (!user || !user.jobFamilyIds) {
    return [];
  }
  
  return jobFamilies.filter(family => 
    user.jobFamilyIds.includes(family.familyId)
  );
};

/**
 * Obtener nivel de Job Family como string legible
 */
export const getJobLevelLabel = (level) => {
  switch (level) {
    case JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR:
      return 'Contribuidor Individual';
    case JOB_LEVELS.MANAGER:
      return 'Gerente';
    case JOB_LEVELS.DIRECTOR:
      return 'Director';
    case JOB_LEVELS.EXECUTIVE:
      return 'Ejecutivo';
    default:
      return 'Nivel Desconocido';
  }
};

/**
 * Obtener color para nivel de Job Family
 */
export const getJobLevelColor = (level) => {
  switch (level) {
    case JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR:
      return 'bg-blue-100 text-blue-800';
    case JOB_LEVELS.MANAGER:
      return 'bg-green-100 text-green-800';
    case JOB_LEVELS.DIRECTOR:
      return 'bg-purple-100 text-purple-800';
    case JOB_LEVELS.EXECUTIVE:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Generar sugerencias de tests basadas en Job Family
 */
export const generateTestSuggestions = (jobFamily, availableTests) => {
  const suggestions = [];
  
  // Tests recomendados
  const recommended = getRecommendedTests(jobFamily);
  recommended.forEach(test => {
    suggestions.push({
      testId: test.testId,
      testName: test.testName,
      reason: test.reason,
      priority: 'high',
      type: 'recommended'
    });
  });
  
  // Tests permitidos (no recomendados)
  const allowed = getAllowedTests(jobFamily);
  const recommendedIds = recommended.map(t => t.testId);
  allowed.forEach(testId => {
    if (!recommendedIds.includes(testId)) {
      const test = availableTests.find(t => t.id === testId);
      if (test) {
        suggestions.push({
          testId: test.id,
          testName: test.name,
          reason: 'Test permitido para esta Job Family',
          priority: 'medium',
          type: 'allowed'
        });
      }
    }
  });
  
  return suggestions.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return 0;
  });
};

// ========== EXPORT DEFAULT ==========

export default {
  // Constants
  JOB_LEVELS,
  TEST_MAPPING_TYPES,
  VALIDATION_RULES,
  
  // Models
  createJobFamilyModel,
  createTestMappingModel,
  
  // Validation
  validateJobFamily,
  validateTestMapping,
  
  // Utilities
  getJobFamilyById,
  getJobFamiliesByLevel,
  getActiveJobFamilies,
  getRecommendedTests,
  getAllowedTests,
  getExcludedTests,
  isTestAllowedForJobFamily,
  getEvaluatorConfig,
  getUsersByJobFamily,
  getJobFamiliesByUser,
  getJobLevelLabel,
  getJobLevelColor,
  generateTestSuggestions
};
