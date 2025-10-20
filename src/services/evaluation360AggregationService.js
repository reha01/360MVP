/**
 * Servicio para gestión de agregaciones de evaluaciones 360°
 * 
 * Maneja la agregación de respuestas, cálculo de scores,
 * y validación de umbrales de anonimato
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  createEvaluation360AggregationModel,
  validateAnonymityThresholds,
  validateAggregation,
  aggregateResponsesByQuestion,
  calculateScoresByType,
  calculateWeightedOverallScore,
  calculateConsensusIndex,
  detectOutliers,
  AGGREGATION_STATUS,
  EVALUATOR_TYPE_WEIGHTS,
  ANONYMITY_THRESHOLDS
} from '../models/Evaluation360Aggregation';
import evaluation360ResponseService from './evaluation360ResponseService';
import campaignService from './campaignService';

// ========== AGGREGATION MANAGEMENT ==========

/**
 * Obtener agregación de evaluación 360°
 */
export const getEvaluation360Aggregation = async (orgId, aggregationId) => {
  try {
    const aggregationRef = doc(db, 'orgs', orgId, 'evaluation360Aggregations', aggregationId);
    const snapshot = await getDoc(aggregationRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Evaluation360Aggregation ${aggregationId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error loading aggregation:', error);
    throw error;
  }
};

/**
 * Obtener agregación por sesión 360°
 */
export const getAggregationBySession = async (orgId, session360Id) => {
  try {
    const aggregationsRef = collection(db, 'orgs', orgId, 'evaluation360Aggregations');
    const q = query(
      aggregationsRef,
      where('session360Id', '==', session360Id),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error loading aggregation by session:', error);
    throw error;
  }
};

/**
 * Crear nueva agregación
 */
export const createEvaluation360Aggregation = async (orgId, aggregationData, userId) => {
  try {
    // Validar datos
    if (!aggregationData.session360Id || !aggregationData.testId) {
      throw new Error('session360Id and testId are required');
    }
    
    // Crear agregación
    const newAggregation = createEvaluation360AggregationModel({
      ...aggregationData,
      orgId,
      createdBy: userId
    });
    
    // Crear en Firestore
    const aggregationRef = doc(db, 'orgs', orgId, 'evaluation360Aggregations', newAggregation.aggregationId);
    await updateDoc(aggregationRef, {
      ...newAggregation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[Evaluation360Aggregation] Created aggregation: ${newAggregation.aggregationId}`);
    return newAggregation;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error creating aggregation:', error);
    throw error;
  }
};

/**
 * Actualizar agregación
 */
export const updateEvaluation360Aggregation = async (orgId, aggregationId, updates, userId) => {
  try {
    // Obtener agregación actual
    const currentAggregation = await getEvaluation360Aggregation(orgId, aggregationId);
    
    // Crear agregación actualizada
    const updatedAggregation = {
      ...currentAggregation,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Actualizar en Firestore
    const aggregationRef = doc(db, 'orgs', orgId, 'evaluation360Aggregations', aggregationId);
    await updateDoc(aggregationRef, updatedAggregation);
    
    console.log(`[Evaluation360Aggregation] Updated aggregation: ${aggregationId}`);
    return updatedAggregation;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error updating aggregation:', error);
    throw error;
  }
};

/**
 * Procesar agregación de sesión 360°
 */
export const processSessionAggregation = async (orgId, session360Id, userId) => {
  try {
    // Obtener respuestas de la sesión
    const responses = await evaluation360ResponseService.getSessionResponses(orgId, session360Id);
    
    if (responses.length === 0) {
      throw new Error('No responses found for session');
    }
    
    // Obtener información de la sesión
    const session = await campaignService.getCampaignSession(orgId, session360Id);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Obtener test definition
    const testDefinition = session.testSnapshot;
    if (!testDefinition) {
      throw new Error('Test definition not found');
    }
    
    // Crear agregación
    const aggregation = createEvaluation360AggregationModel({
      orgId,
      campaignId: session.campaignId,
      session360Id,
      evaluateeId: session.evaluateeId,
      testId: session.testId,
      testVersion: session.testVersion,
      testSnapshot: testDefinition,
      responses: responses,
      totalResponses: responses.length,
      validResponses: responses.filter(r => r.status === 'submitted').length,
      status: AGGREGATION_STATUS.IN_PROGRESS
    });
    
    // Procesar agregación
    const processedAggregation = await processAggregation(aggregation, testDefinition);
    
    // Guardar agregación
    const aggregationRef = doc(db, 'orgs', orgId, 'evaluation360Aggregations', aggregation.aggregationId);
    await updateDoc(aggregationRef, {
      ...processedAggregation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[Evaluation360Aggregation] Processed aggregation: ${aggregation.aggregationId}`);
    return processedAggregation;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error processing session aggregation:', error);
    throw error;
  }
};

/**
 * Procesar agregación
 */
export const processAggregation = async (aggregation, testDefinition) => {
  try {
    const responses = aggregation.responses;
    
    // Validar umbrales de anonimato
    const anonymityValidation = validateAnonymityThresholds(
      responses, 
      aggregation.anonymityThresholds
    );
    
    // Agregar respuestas por pregunta
    const aggregatedResponses = aggregateResponsesByQuestion(responses, testDefinition);
    
    // Calcular scores por tipo de evaluador
    const scoresByType = calculateScoresByType(aggregatedResponses, aggregation.evaluatorWeights);
    
    // Calcular score global ponderado
    const overallScore = calculateWeightedOverallScore(scoresByType, aggregation.evaluatorWeights);
    
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
    
    // Crear agregación procesada
    const processedAggregation = {
      ...aggregation,
      aggregatedResponses,
      scoresByType,
      overallScore,
      metrics,
      anonymityStatus: anonymityValidation.status,
      status: validation.isValid ? AGGREGATION_STATUS.COMPLETED : AGGREGATION_STATUS.FAILED,
      isValid: validation.isValid,
      validationErrors: validation.errors,
      warnings: validation.warnings,
      processedAt: new Date()
    };
    
    return processedAggregation;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error processing aggregation:', error);
    throw error;
  }
};

/**
 * Calcular métricas de agregación
 */
export const calculateAggregationMetrics = (responses, aggregatedResponses) => {
  const totalResponses = responses.length;
  const validResponses = responses.filter(r => r.status === 'submitted').length;
  const completionRate = totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;
  
  // Calcular índice de consenso general
  const allValues = [];
  Object.values(aggregatedResponses).forEach(aggregated => {
    allValues.push(...aggregated.responses.map(r => r.value));
  });
  
  const consensusIndex = calculateConsensusIndex(allValues);
  
  // Calcular análisis de brechas
  const gapAnalysis = calculateGapAnalysis(responses, aggregatedResponses);
  
  return {
    completionRate: Math.round(completionRate * 100) / 100,
    responseRate: Math.round(completionRate * 100) / 100,
    consensusIndex,
    gapAnalysis
  };
};

/**
 * Calcular análisis de brechas
 */
export const calculateGapAnalysis = (responses, aggregatedResponses) => {
  const gapAnalysis = {};
  
  // Obtener autoevaluación
  const selfResponse = responses.find(r => r.evaluatorType === 'self');
  const otherResponses = responses.filter(r => r.evaluatorType !== 'self');
  
  if (selfResponse && otherResponses.length > 0) {
    // Calcular brecha autoevaluación vs otros
    const selfScores = {};
    const otherScores = {};
    
    Object.entries(aggregatedResponses).forEach(([questionId, aggregated]) => {
      const selfAnswer = selfResponse.answers[questionId];
      if (selfAnswer) {
        selfScores[questionId] = selfAnswer.value;
      }
      
      const otherValues = aggregated.responses
        .filter(r => r.evaluatorType !== 'self')
        .map(r => r.value);
      
      if (otherValues.length > 0) {
        otherScores[questionId] = otherValues.reduce((sum, val) => sum + val, 0) / otherValues.length;
      }
    });
    
    // Calcular brechas por pregunta
    const questionGaps = {};
    Object.keys(selfScores).forEach(questionId => {
      if (otherScores[questionId] !== undefined) {
        questionGaps[questionId] = selfScores[questionId] - otherScores[questionId];
      }
    });
    
    // Calcular brecha promedio
    const gapValues = Object.values(questionGaps);
    const averageGap = gapValues.length > 0 
      ? gapValues.reduce((sum, gap) => sum + gap, 0) / gapValues.length 
      : 0;
    
    gapAnalysis.selfVsOthers = {
      averageGap: Math.round(averageGap * 100) / 100,
      questionGaps,
      selfScores,
      otherScores
    };
  }
  
  return gapAnalysis;
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener agregaciones de una campaña
 */
export const getCampaignAggregations = async (orgId, campaignId) => {
  try {
    const aggregationsRef = collection(db, 'orgs', orgId, 'evaluation360Aggregations');
    const q = query(
      aggregationsRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const aggregations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Evaluation360Aggregation] Loaded ${aggregations.length} aggregations for campaign ${campaignId}`);
    return aggregations;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error loading campaign aggregations:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de agregaciones
 */
export const getAggregationStats = async (orgId, campaignId) => {
  try {
    const aggregations = await getCampaignAggregations(orgId, campaignId);
    
    const stats = {
      total: aggregations.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      insufficientData: 0,
      averageScore: 0,
      averageCompletionRate: 0
    };
    
    let totalScore = 0;
    let totalCompletionRate = 0;
    
    aggregations.forEach(aggregation => {
      stats[aggregation.status] = (stats[aggregation.status] || 0) + 1;
      
      if (aggregation.overallScore > 0) {
        totalScore += aggregation.overallScore;
      }
      
      if (aggregation.metrics.completionRate > 0) {
        totalCompletionRate += aggregation.metrics.completionRate;
      }
    });
    
    if (aggregations.length > 0) {
      stats.averageScore = Math.round((totalScore / aggregations.length) * 100) / 100;
      stats.averageCompletionRate = Math.round((totalCompletionRate / aggregations.length) * 100) / 100;
    }
    
    return stats;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error loading aggregation stats:', error);
    throw error;
  }
};

/**
 * Reprocesar agregación
 */
export const reprocessAggregation = async (orgId, aggregationId, userId) => {
  try {
    const aggregation = await getEvaluation360Aggregation(orgId, aggregationId);
    
    if (!aggregation.testSnapshot) {
      throw new Error('Test snapshot not found');
    }
    
    // Reprocesar agregación
    const processedAggregation = await processAggregation(aggregation, aggregation.testSnapshot);
    
    // Actualizar agregación
    await updateEvaluation360Aggregation(orgId, aggregationId, processedAggregation, userId);
    
    console.log(`[Evaluation360Aggregation] Reprocessed aggregation: ${aggregationId}`);
    return processedAggregation;
  } catch (error) {
    console.error('[Evaluation360Aggregation] Error reprocessing aggregation:', error);
    throw error;
  }
};

// ========== EXPORT ==========

export default {
  // Aggregation management
  getEvaluation360Aggregation,
  getAggregationBySession,
  createEvaluation360Aggregation,
  updateEvaluation360Aggregation,
  processSessionAggregation,
  processAggregation,
  
  // Utilities
  getCampaignAggregations,
  getAggregationStats,
  reprocessAggregation
};
