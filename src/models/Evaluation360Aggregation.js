/**
 * Modelo de Agregación para Evaluaciones 360°
 * 
 * Define la agregación de respuestas con umbrales de anonimato
 * y cálculo de scores por tipo de evaluador
 */

// ========== CONSTANTS ==========

export const AGGREGATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  INSUFFICIENT_DATA: 'insufficient_data'
};

export const EVALUATOR_TYPE_WEIGHTS = {
  SELF: 0.1,        // Autoevaluación tiene menor peso
  MANAGER: 0.3,     // Manager tiene mayor peso
  PEER: 0.25,       // Pares tienen peso medio-alto
  SUBORDINATE: 0.25, // Subordinados tienen peso medio-alto
  EXTERNAL: 0.1     // Externos tienen menor peso
};

export const ANONYMITY_THRESHOLDS = {
  PEER: 3,          // Mínimo 3 pares
  SUBORDINATE: 3,   // Mínimo 3 subordinados
  EXTERNAL: 1,      // Mínimo 1 externo
  MANAGER: 1        // Mínimo 1 manager
};

export const SCORING_METHODS = {
  SIMPLE_AVERAGE: 'simple_average',
  WEIGHTED_AVERAGE: 'weighted_average',
  NORMALIZED_SCORE: 'normalized_score',
  PERCENTILE_RANK: 'percentile_rank'
};

// ========== DATA MODELS ==========

/**
 * Modelo de Agregación 360°
 */
export const createEvaluation360AggregationModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    aggregationId: data.aggregationId || `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    campaignId: data.campaignId,
    session360Id: data.session360Id,
    evaluateeId: data.evaluateeId,
    
    // Test
    testId: data.testId,
    testVersion: data.testVersion || '1.0',
    testSnapshot: data.testSnapshot || null,
    
    // Respuestas agregadas
    responses: data.responses || [],
    totalResponses: data.totalResponses || 0,
    validResponses: data.validResponses || 0,
    
    // Umbrales de anonimato
    anonymityThresholds: data.anonymityThresholds || ANONYMITY_THRESHOLDS,
    anonymityStatus: data.anonymityStatus || {},
    
    // Scores por tipo de evaluador
    scoresByType: data.scoresByType || {},
    
    // Scores agregados
    categoryScores: data.categoryScores || {},
    subdimensionScores: data.subdimensionScores || {},
    overallScore: data.overallScore || 0,
    
    // Métricas
    metrics: data.metrics || {
      completionRate: 0,
      responseRate: 0,
      consensusIndex: 0,
      gapAnalysis: {}
    },
    
    // Estado
    status: data.status || AGGREGATION_STATUS.PENDING,
    
    // Metadatos
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    processedAt: data.processedAt || null,
    
    // Configuración
    scoringMethod: data.scoringMethod || SCORING_METHODS.WEIGHTED_AVERAGE,
    evaluatorWeights: data.evaluatorWeights || EVALUATOR_TYPE_WEIGHTS,
    
    // Validación
    isValid: data.isValid || false,
    validationErrors: data.validationErrors || [],
    warnings: data.warnings || []
  };
};

/**
 * Modelo de respuesta agregada
 */
export const createAggregatedResponseModel = (data) => {
  return {
    questionId: data.questionId,
    questionText: data.questionText,
    categoryId: data.categoryId,
    subdimensionId: data.subdimensionId,
    
    // Respuestas por tipo de evaluador
    responsesByType: data.responsesByType || {},
    
    // Estadísticas
    statistics: data.statistics || {
      mean: 0,
      median: 0,
      mode: 0,
      standardDeviation: 0,
      range: 0,
      count: 0
    },
    
    // Score agregado
    aggregatedScore: data.aggregatedScore || 0,
    weightedScore: data.weightedScore || 0,
    
    // Validación
    isValid: data.isValid || false,
    anonymityMet: data.anonymityMet || false,
    outlierCount: data.outlierCount || 0
  };
};

/**
 * Modelo de score por tipo de evaluador
 */
export const createEvaluatorTypeScoreModel = (data) => {
  return {
    evaluatorType: data.evaluatorType,
    count: data.count || 0,
    weight: data.weight || 1,
    
    // Scores
    categoryScores: data.categoryScores || {},
    subdimensionScores: data.subdimensionScores || {},
    overallScore: data.overallScore || 0,
    
    // Métricas
    metrics: data.metrics || {
      completionRate: 0,
      responseRate: 0,
      consensusIndex: 0
    },
    
    // Validación
    anonymityMet: data.anonymityMet || false,
    isValid: data.isValid || false
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar umbrales de anonimato
 */
export const validateAnonymityThresholds = (responses, thresholds) => {
  const evaluatorTypeCounts = {};
  
  // Contar evaluadores por tipo
  responses.forEach(response => {
    const type = response.evaluatorType;
    evaluatorTypeCounts[type] = (evaluatorTypeCounts[type] || 0) + 1;
  });
  
  const anonymityStatus = {};
  let allThresholdsMet = true;
  
  // Verificar cada umbral
  Object.entries(thresholds).forEach(([type, threshold]) => {
    const count = evaluatorTypeCounts[type] || 0;
    const met = count >= threshold;
    
    anonymityStatus[type] = {
      required: threshold,
      actual: count,
      met,
      percentage: count > 0 ? Math.round((count / threshold) * 100) : 0
    };
    
    if (!met) {
      allThresholdsMet = false;
    }
  });
  
  return {
    isValid: allThresholdsMet,
    status: anonymityStatus,
    totalEvaluators: responses.length
  };
};

/**
 * Validar agregación
 */
export const validateAggregation = (aggregation) => {
  const errors = [];
  const warnings = [];
  
  // Validar respuestas mínimas
  if (aggregation.totalResponses < 1) {
    errors.push('No hay respuestas para agregar');
  }
  
  // Validar umbrales de anonimato
  const anonymityValidation = validateAnonymityThresholds(
    aggregation.responses, 
    aggregation.anonymityThresholds
  );
  
  if (!anonymityValidation.isValid) {
    errors.push('No se cumplen los umbrales de anonimato requeridos');
  }
  
  // Validar scores
  if (aggregation.overallScore < 0 || aggregation.overallScore > 5) {
    warnings.push('Score global fuera del rango esperado (0-5)');
  }
  
  // Validar completitud
  if (aggregation.metrics.completionRate < 50) {
    warnings.push('Tasa de completitud baja (< 50%)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    anonymityValidation
  };
};

// ========== AGGREGATION FUNCTIONS ==========

/**
 * Agregar respuestas por pregunta
 */
export const aggregateResponsesByQuestion = (responses, testDefinition) => {
  const aggregatedResponses = {};
  
  // Agrupar respuestas por pregunta
  responses.forEach(response => {
    Object.entries(response.answers).forEach(([questionId, answer]) => {
      if (!aggregatedResponses[questionId]) {
        const question = testDefinition.questions.find(q => q.id === questionId);
        if (!question) return;
        
        aggregatedResponses[questionId] = {
          questionId,
          questionText: question.text,
          categoryId: question.category.id,
          subdimensionId: question.subdimension?.id,
          responsesByType: {},
          responses: []
        };
      }
      
      // Agregar respuesta por tipo de evaluador
      const evaluatorType = response.evaluatorType;
      if (!aggregatedResponses[questionId].responsesByType[evaluatorType]) {
        aggregatedResponses[questionId].responsesByType[evaluatorType] = [];
      }
      
      aggregatedResponses[questionId].responsesByType[evaluatorType].push({
        value: answer.value,
        evaluatorId: response.evaluatorId,
        answeredAt: answer.answeredAt
      });
      
      aggregatedResponses[questionId].responses.push({
        value: answer.value,
        evaluatorType,
        evaluatorId: response.evaluatorId,
        answeredAt: answer.answeredAt
      });
    });
  });
  
  // Calcular estadísticas para cada pregunta
  Object.values(aggregatedResponses).forEach(aggregated => {
    const values = aggregated.responses.map(r => r.value).filter(v => v !== null && v !== undefined);
    
    if (values.length > 0) {
      aggregated.statistics = calculateStatistics(values);
      aggregated.aggregatedScore = aggregated.statistics.mean;
      aggregated.isValid = true;
    }
  });
  
  return aggregatedResponses;
};

/**
 * Calcular estadísticas de un conjunto de valores
 */
export const calculateStatistics = (values) => {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      standardDeviation: 0,
      range: 0,
      count: 0
    };
  }
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const n = values.length;
  
  // Media
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Mediana
  const median = n % 2 === 0 
    ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
    : sortedValues[Math.floor(n / 2)];
  
  // Moda
  const frequency = {};
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  const mode = Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  );
  
  // Desviación estándar
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  // Rango
  const range = sortedValues[n - 1] - sortedValues[0];
  
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    mode: parseFloat(mode),
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    range: Math.round(range * 100) / 100,
    count: n
  };
};

/**
 * Calcular scores por tipo de evaluador
 */
export const calculateScoresByType = (aggregatedResponses, evaluatorWeights) => {
  const scoresByType = {};
  
  Object.entries(aggregatedResponses).forEach(([questionId, aggregated]) => {
    Object.entries(aggregated.responsesByType).forEach(([evaluatorType, responses]) => {
      if (!scoresByType[evaluatorType]) {
        scoresByType[evaluatorType] = {
          evaluatorType,
          count: 0,
          weight: evaluatorWeights[evaluatorType] || 1,
          categoryScores: {},
          subdimensionScores: {},
          overallScore: 0,
          metrics: {
            completionRate: 0,
            responseRate: 0,
            consensusIndex: 0
          },
          anonymityMet: false,
          isValid: false
        };
      }
      
      // Calcular score para este tipo de evaluador
      const values = responses.map(r => r.value).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        const statistics = calculateStatistics(values);
        scoresByType[evaluatorType].count += values.length;
        scoresByType[evaluatorType].overallScore += statistics.mean;
      }
    });
  });
  
  // Calcular scores promedio por tipo
  Object.values(scoresByType).forEach(score => {
    if (score.count > 0) {
      score.overallScore = score.overallScore / score.count;
      score.isValid = true;
    }
  });
  
  return scoresByType;
};

/**
 * Calcular score global ponderado
 */
export const calculateWeightedOverallScore = (scoresByType, evaluatorWeights) => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.entries(scoresByType).forEach(([type, score]) => {
    if (score.isValid && score.count > 0) {
      const weight = evaluatorWeights[type] || 1;
      weightedSum += score.overallScore * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener estado de agregación como string legible
 */
export const getAggregationStatusLabel = (status) => {
  switch (status) {
    case AGGREGATION_STATUS.PENDING: return 'Pendiente';
    case AGGREGATION_STATUS.IN_PROGRESS: return 'En Progreso';
    case AGGREGATION_STATUS.COMPLETED: return 'Completado';
    case AGGREGATION_STATUS.FAILED: return 'Fallido';
    case AGGREGATION_STATUS.INSUFFICIENT_DATA: return 'Datos Insuficientes';
    default: return 'Estado Desconocido';
  }
};

/**
 * Obtener color para estado de agregación
 */
export const getAggregationStatusColor = (status) => {
  switch (status) {
    case AGGREGATION_STATUS.PENDING: return 'bg-gray-100 text-gray-800';
    case AGGREGATION_STATUS.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
    case AGGREGATION_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
    case AGGREGATION_STATUS.FAILED: return 'bg-red-100 text-red-800';
    case AGGREGATION_STATUS.INSUFFICIENT_DATA: return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener etiqueta para método de scoring
 */
export const getScoringMethodLabel = (method) => {
  switch (method) {
    case SCORING_METHODS.SIMPLE_AVERAGE: return 'Promedio Simple';
    case SCORING_METHODS.WEIGHTED_AVERAGE: return 'Promedio Ponderado';
    case SCORING_METHODS.NORMALIZED_SCORE: return 'Score Normalizado';
    case SCORING_METHODS.PERCENTILE_RANK: return 'Percentil';
    default: return 'Método Desconocido';
  }
};

/**
 * Calcular índice de consenso
 */
export const calculateConsensusIndex = (responses) => {
  if (responses.length < 2) return 0;
  
  const values = responses.map(r => r.value).filter(v => v !== null && v !== undefined);
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Índice de consenso (inverso de la desviación estándar normalizada)
  const maxPossibleSD = 2; // Para escala 1-5
  const consensusIndex = Math.max(0, 1 - (standardDeviation / maxPossibleSD));
  
  return Math.round(consensusIndex * 100) / 100;
};

/**
 * Detectar outliers
 */
export const detectOutliers = (values, threshold = 2) => {
  if (values.length < 3) return [];
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const standardDeviation = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  return values.filter(val => Math.abs(val - mean) > threshold * standardDeviation);
};

// ========== EXPORT DEFAULT ==========

export default {
  // Constants
  AGGREGATION_STATUS,
  EVALUATOR_TYPE_WEIGHTS,
  ANONYMITY_THRESHOLDS,
  SCORING_METHODS,
  
  // Models
  createEvaluation360AggregationModel,
  createAggregatedResponseModel,
  createEvaluatorTypeScoreModel,
  
  // Validation
  validateAnonymityThresholds,
  validateAggregation,
  
  // Aggregation
  aggregateResponsesByQuestion,
  calculateStatistics,
  calculateScoresByType,
  calculateWeightedOverallScore,
  
  // Utilities
  getAggregationStatusLabel,
  getAggregationStatusColor,
  getScoringMethodLabel,
  calculateConsensusIndex,
  detectOutliers
};
