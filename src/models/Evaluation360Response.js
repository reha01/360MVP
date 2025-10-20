/**
 * Modelo de Evaluation360Response para respuestas de evaluaciones 360°
 * 
 * Define las respuestas de evaluadores en evaluaciones 360°
 */

// ========== CONSTANTS ==========

export const RESPONSE_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted'
};

export const QUESTION_TYPES = {
  LIKERT: 'likert',
  MULTIPLE_CHOICE: 'multiple_choice',
  RANKING: 'ranking',
  TEXT_OPEN: 'text_open',
  MATRIX: 'matrix'
};

export const LIKERT_SCALES = {
  FIVE_POINT: {
    min: 1,
    max: 5,
    labels: {
      1: 'Muy en desacuerdo',
      2: 'En desacuerdo', 
      3: 'Neutral',
      4: 'De acuerdo',
      5: 'Muy de acuerdo'
    }
  },
  SEVEN_POINT: {
    min: 1,
    max: 7,
    labels: {
      1: 'Muy en desacuerdo',
      2: 'En desacuerdo',
      3: 'Ligeramente en desacuerdo',
      4: 'Neutral',
      5: 'Ligeramente de acuerdo',
      6: 'De acuerdo',
      7: 'Muy de acuerdo'
    }
  }
};

// ========== DATA MODELS ==========

/**
 * Modelo de Evaluation360Response
 */
export const createEvaluation360ResponseModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    responseId: data.responseId || `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    campaignId: data.campaignId,
    session360Id: data.session360Id,
    assignmentId: data.assignmentId,
    
    // Evaluador y evaluado
    evaluatorId: data.evaluatorId,
    evaluatorEmail: data.evaluatorEmail,
    evaluatorType: data.evaluatorType,
    evaluateeId: data.evaluateeId,
    evaluateeName: data.evaluateeName,
    
    // Test
    testId: data.testId,
    testVersion: data.testVersion || '1.0',
    testSnapshot: data.testSnapshot || null,
    
    // Respuestas
    answers: data.answers || {},
    totalQuestions: data.totalQuestions || 0,
    answeredQuestions: data.answeredQuestions || 0,
    completionRate: data.completionRate || 0,
    
    // Estado
    status: data.status || RESPONSE_STATUS.DRAFT,
    
    // Metadatos
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    startedAt: data.startedAt || null,
    completedAt: data.completedAt || null,
    submittedAt: data.submittedAt || null,
    
    // Tiempo
    timeSpent: data.timeSpent || 0, // en minutos
    lastActivityAt: data.lastActivityAt || now,
    
    // Validación
    isValid: data.isValid || false,
    validationErrors: data.validationErrors || [],
    
    // Configuración
    isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : true,
    allowPartialSave: data.allowPartialSave !== undefined ? data.allowPartialSave : true,
    autoSave: data.autoSave !== undefined ? data.autoSave : true
  };
};

/**
 * Modelo de respuesta individual
 */
export const createAnswerModel = (data) => {
  return {
    questionId: data.questionId,
    questionType: data.questionType,
    answer: data.answer, // Valor de la respuesta
    value: data.value, // Valor numérico para cálculos
    text: data.text, // Texto libre si aplica
    options: data.options || [], // Opciones seleccionadas
    ranking: data.ranking || [], // Orden de ranking
    matrix: data.matrix || {}, // Respuestas de matriz
    
    // Metadatos
    answeredAt: data.answeredAt || new Date(),
    timeSpent: data.timeSpent || 0, // tiempo en segundos
    isRequired: data.isRequired || false,
    isAnswered: data.isAnswered || false,
    
    // Validación
    isValid: data.isValid || false,
    validationMessage: data.validationMessage || null
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar respuesta individual
 */
export const validateAnswer = (answer, question) => {
  const errors = [];
  
  if (!answer || !question) {
    errors.push('Respuesta o pregunta no válida');
    return { isValid: false, errors };
  }
  
  // Validar tipo de pregunta
  if (!Object.values(QUESTION_TYPES).includes(question.type)) {
    errors.push('Tipo de pregunta no válido');
  }
  
  // Validar según tipo de pregunta
  switch (question.type) {
    case QUESTION_TYPES.LIKERT:
      if (answer.value === null || answer.value === undefined) {
        errors.push('Respuesta requerida');
      } else if (answer.value < question.scale.min || answer.value > question.scale.max) {
        errors.push(`Valor debe estar entre ${question.scale.min} y ${question.scale.max}`);
      }
      break;
      
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      if (!answer.options || answer.options.length === 0) {
        if (question.required) {
          errors.push('Debe seleccionar al menos una opción');
        }
      } else if (question.maxSelections && answer.options.length > question.maxSelections) {
        errors.push(`Máximo ${question.maxSelections} opciones permitidas`);
      }
      break;
      
    case QUESTION_TYPES.RANKING:
      if (!answer.ranking || answer.ranking.length === 0) {
        if (question.required) {
          errors.push('Debe ordenar todos los elementos');
        }
      } else if (answer.ranking.length !== question.items.length) {
        errors.push('Debe ordenar todos los elementos');
      }
      break;
      
    case QUESTION_TYPES.TEXT_OPEN:
      if (!answer.text || answer.text.trim().length === 0) {
        if (question.required) {
          errors.push('Respuesta de texto requerida');
        }
      } else if (question.maxLength && answer.text.length > question.maxLength) {
        errors.push(`Máximo ${question.maxLength} caracteres permitidos`);
      }
      break;
      
    case QUESTION_TYPES.MATRIX:
      if (!answer.matrix || Object.keys(answer.matrix).length === 0) {
        if (question.required) {
          errors.push('Debe responder todas las filas de la matriz');
        }
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar respuesta completa
 */
export const validateEvaluation360Response = (response, testDefinition) => {
  const errors = [];
  
  if (!response || !testDefinition) {
    errors.push('Respuesta o definición de test no válida');
    return { isValid: false, errors };
  }
  
  // Validar respuestas requeridas
  const requiredQuestions = testDefinition.questions.filter(q => q.required);
  const answeredQuestions = Object.keys(response.answers);
  
  for (const question of requiredQuestions) {
    if (!answeredQuestions.includes(question.id)) {
      errors.push(`Pregunta requerida no respondida: ${question.text}`);
    }
  }
  
  // Validar cada respuesta
  for (const [questionId, answer] of Object.entries(response.answers)) {
    const question = testDefinition.questions.find(q => q.id === questionId);
    if (question) {
      const validation = validateAnswer(answer, question);
      if (!validation.isValid) {
        errors.push(`Pregunta ${questionId}: ${validation.errors.join(', ')}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Calcular progreso de evaluación
 */
export const calculateProgress = (response, testDefinition) => {
  if (!response || !testDefinition) {
    return { completionRate: 0, answeredQuestions: 0, totalQuestions: 0 };
  }
  
  const totalQuestions = testDefinition.questions.length;
  const answeredQuestions = Object.keys(response.answers).length;
  const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  return {
    completionRate,
    answeredQuestions,
    totalQuestions
  };
};

/**
 * Obtener estado de respuesta como string legible
 */
export const getResponseStatusLabel = (status) => {
  switch (status) {
    case RESPONSE_STATUS.DRAFT: return 'Borrador';
    case RESPONSE_STATUS.IN_PROGRESS: return 'En Progreso';
    case RESPONSE_STATUS.COMPLETED: return 'Completado';
    case RESPONSE_STATUS.SUBMITTED: return 'Enviado';
    default: return 'Estado Desconocido';
  }
};

/**
 * Obtener color para estado de respuesta
 */
export const getResponseStatusColor = (status) => {
  switch (status) {
    case RESPONSE_STATUS.DRAFT: return 'bg-gray-100 text-gray-800';
    case RESPONSE_STATUS.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
    case RESPONSE_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
    case RESPONSE_STATUS.SUBMITTED: return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener etiqueta para tipo de pregunta
 */
export const getQuestionTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LIKERT: return 'Escala Likert';
    case QUESTION_TYPES.MULTIPLE_CHOICE: return 'Selección Múltiple';
    case QUESTION_TYPES.RANKING: return 'Ranking';
    case QUESTION_TYPES.TEXT_OPEN: return 'Texto Abierto';
    case QUESTION_TYPES.MATRIX: return 'Matriz';
    default: return 'Tipo Desconocido';
  }
};

/**
 * Calcular tiempo transcurrido
 */
export const calculateTimeSpent = (response) => {
  if (!response.startedAt) {
    return 0;
  }
  
  const startTime = new Date(response.startedAt);
  const endTime = response.completedAt ? new Date(response.completedAt) : new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  
  return Math.round(diffMs / (1000 * 60)); // en minutos
};

/**
 * Verificar si la evaluación está completa
 */
export const isEvaluationComplete = (response, testDefinition) => {
  if (!response || !testDefinition) {
    return false;
  }
  
  const requiredQuestions = testDefinition.questions.filter(q => q.required);
  const answeredQuestions = Object.keys(response.answers);
  
  return requiredQuestions.every(question => 
    answeredQuestions.includes(question.id)
  );
};

/**
 * Obtener estadísticas de respuesta
 */
export const getResponseStats = (response, testDefinition) => {
  if (!response || !testDefinition) {
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      completionRate: 0,
      timeSpent: 0,
      isComplete: false
    };
  }
  
  const progress = calculateProgress(response, testDefinition);
  const timeSpent = calculateTimeSpent(response);
  const isComplete = isEvaluationComplete(response, testDefinition);
  
  return {
    ...progress,
    timeSpent,
    isComplete
  };
};

// ========== EXPORT DEFAULT ==========

export default {
  // Constants
  RESPONSE_STATUS,
  QUESTION_TYPES,
  LIKERT_SCALES,
  
  // Models
  createEvaluation360ResponseModel,
  createAnswerModel,
  
  // Validation
  validateAnswer,
  validateEvaluation360Response,
  
  // Utilities
  calculateProgress,
  getResponseStatusLabel,
  getResponseStatusColor,
  getQuestionTypeLabel,
  calculateTimeSpent,
  isEvaluationComplete,
  getResponseStats
};
