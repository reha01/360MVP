/**
 * Cloud Function para procesar agregaciones 360°
 * 
 * Procesa automáticamente las agregaciones cuando se completan
 * las evaluaciones de una sesión 360°
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.process360Aggregations = functions.firestore
  .document('orgs/{orgId}/evaluation360Responses/{responseId}')
  .onUpdate(async (change, context) => {
    const { orgId, responseId } = context.params;
    const before = change.before.data();
    const after = change.after.data();
    
    // Solo procesar si el estado cambió a 'submitted'
    if (before.status !== 'submitted' && after.status === 'submitted') {
      console.log(`[Process360Aggregations] Response ${responseId} submitted, processing aggregation`);
      
      try {
        const db = admin.firestore();
        const session360Id = after.session360Id;
        
        // Verificar si ya existe una agregación para esta sesión
        const existingAggregation = await db.collection('orgs').doc(orgId)
          .collection('evaluation360Aggregations')
          .where('session360Id', '==', session360Id)
          .limit(1)
          .get();
        
        if (!existingAggregation.empty) {
          console.log(`[Process360Aggregations] Aggregation already exists for session ${session360Id}`);
          return;
        }
        
        // Obtener todas las respuestas de la sesión
        const responsesSnapshot = await db.collection('orgs').doc(orgId)
          .collection('evaluation360Responses')
          .where('session360Id', '==', session360Id)
          .get();
        
        const responses = responsesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Verificar si hay suficientes respuestas para procesar
        const submittedResponses = responses.filter(r => r.status === 'submitted');
        if (submittedResponses.length < 1) {
          console.log(`[Process360Aggregations] Insufficient responses for session ${session360Id}`);
          return;
        }
        
        // Obtener información de la sesión
        const sessionDoc = await db.collection('orgs').doc(orgId)
          .collection('evaluation360Sessions')
          .doc(session360Id)
          .get();
        
        if (!sessionDoc.exists) {
          console.error(`[Process360Aggregations] Session ${session360Id} not found`);
          return;
        }
        
        const sessionData = sessionDoc.data();
        
        // Crear agregación
        const aggregationData = {
          orgId,
          campaignId: sessionData.campaignId,
          session360Id,
          evaluateeId: sessionData.evaluateeId,
          evaluateeName: sessionData.evaluateeName,
          testId: sessionData.testId,
          testVersion: sessionData.testVersion,
          testSnapshot: sessionData.testSnapshot,
          responses: submittedResponses,
          totalResponses: submittedResponses.length,
          validResponses: submittedResponses.length,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Guardar agregación
        const aggregationRef = await db.collection('orgs').doc(orgId)
          .collection('evaluation360Aggregations')
          .add(aggregationData);
        
        console.log(`[Process360Aggregations] Created aggregation ${aggregationRef.id} for session ${session360Id}`);
        
        // Procesar agregación
        await processAggregation(orgId, aggregationRef.id, sessionData.testSnapshot);
        
      } catch (error) {
        console.error(`[Process360Aggregations] Error processing aggregation:`, error);
      }
    }
  });

/**
 * Procesar agregación
 */
async function processAggregation(orgId, aggregationId, testDefinition) {
  try {
    const db = admin.firestore();
    
    // Obtener agregación
    const aggregationDoc = await db.collection('orgs').doc(orgId)
      .collection('evaluation360Aggregations')
      .doc(aggregationId)
      .get();
    
    if (!aggregationDoc.exists) {
      throw new Error('Aggregation not found');
    }
    
    const aggregation = aggregationDoc.data();
    
    // Procesar agregación
    const processedAggregation = await processAggregationData(aggregation, testDefinition);
    
    // Actualizar agregación
    await db.collection('orgs').doc(orgId)
      .collection('evaluation360Aggregations')
      .doc(aggregationId)
      .update({
        ...processedAggregation,
        status: processedAggregation.isValid ? 'completed' : 'failed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`[Process360Aggregations] Processed aggregation ${aggregationId}`);
    
  } catch (error) {
    console.error(`[Process360Aggregations] Error processing aggregation ${aggregationId}:`, error);
    
    // Marcar como fallida
    const db = admin.firestore();
    await db.collection('orgs').doc(orgId)
      .collection('evaluation360Aggregations')
      .doc(aggregationId)
      .update({
        status: 'failed',
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }
}

/**
 * Procesar datos de agregación
 */
async function processAggregationData(aggregation, testDefinition) {
  const responses = aggregation.responses;
  
  // Validar umbrales de anonimato
  const anonymityValidation = validateAnonymityThresholds(responses);
  
  // Agregar respuestas por pregunta
  const aggregatedResponses = aggregateResponsesByQuestion(responses, testDefinition);
  
  // Calcular scores por tipo de evaluador
  const scoresByType = calculateScoresByType(aggregatedResponses);
  
  // Calcular score global ponderado
  const overallScore = calculateWeightedOverallScore(scoresByType);
  
  // Calcular métricas
  const metrics = calculateAggregationMetrics(responses, aggregatedResponses);
  
  // Validar agregación
  const validation = validateAggregation({
    ...aggregation,
    anonymityStatus: anonymityValidation.status,
    scoresByType,
    overallScore,
    metrics
  });
  
  return {
    aggregatedResponses,
    scoresByType,
    overallScore,
    metrics,
    anonymityStatus: anonymityValidation.status,
    isValid: validation.isValid,
    validationErrors: validation.errors,
    warnings: validation.warnings
  };
}

/**
 * Validar umbrales de anonimato
 */
function validateAnonymityThresholds(responses) {
  const thresholds = {
    peer: 3,
    subordinate: 3,
    external: 1,
    manager: 1
  };
  
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
}

/**
 * Agregar respuestas por pregunta
 */
function aggregateResponsesByQuestion(responses, testDefinition) {
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
}

/**
 * Calcular estadísticas
 */
function calculateStatistics(values) {
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
}

/**
 * Calcular scores por tipo de evaluador
 */
function calculateScoresByType(aggregatedResponses) {
  const evaluatorWeights = {
    self: 0.1,
    manager: 0.3,
    peer: 0.25,
    subordinate: 0.25,
    external: 0.1
  };
  
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
}

/**
 * Calcular score global ponderado
 */
function calculateWeightedOverallScore(scoresByType) {
  const evaluatorWeights = {
    self: 0.1,
    manager: 0.3,
    peer: 0.25,
    subordinate: 0.25,
    external: 0.1
  };
  
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
}

/**
 * Calcular métricas de agregación
 */
function calculateAggregationMetrics(responses, aggregatedResponses) {
  const totalResponses = responses.length;
  const validResponses = responses.filter(r => r.status === 'submitted').length;
  const completionRate = totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;
  
  // Calcular índice de consenso general
  const allValues = [];
  Object.values(aggregatedResponses).forEach(aggregated => {
    allValues.push(...aggregated.responses.map(r => r.value));
  });
  
  const consensusIndex = calculateConsensusIndex(allValues);
  
  return {
    completionRate: Math.round(completionRate * 100) / 100,
    responseRate: Math.round(completionRate * 100) / 100,
    consensusIndex
  };
}

/**
 * Calcular índice de consenso
 */
function calculateConsensusIndex(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Índice de consenso (inverso de la desviación estándar normalizada)
  const maxPossibleSD = 2; // Para escala 1-5
  const consensusIndex = Math.max(0, 1 - (standardDeviation / maxPossibleSD));
  
  return Math.round(consensusIndex * 100) / 100;
}

/**
 * Validar agregación
 */
function validateAggregation(aggregation) {
  const errors = [];
  const warnings = [];
  
  // Validar respuestas mínimas
  if (aggregation.totalResponses < 1) {
    errors.push('No hay respuestas para agregar');
  }
  
  // Validar umbrales de anonimato
  if (!aggregation.anonymityStatus) {
    errors.push('Estado de anonimato no disponible');
  } else {
    const anonymityValidation = validateAnonymityThresholds(aggregation.responses);
    if (!anonymityValidation.isValid) {
      errors.push('No se cumplen los umbrales de anonimato requeridos');
    }
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
    warnings
  };
}
