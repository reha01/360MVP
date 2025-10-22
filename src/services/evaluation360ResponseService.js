/**
 * Servicio para gestión de respuestas de evaluaciones 360°
 * 
 * Maneja CRUD de respuestas, guardado automático,
 * y validación de evaluaciones 360°
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
  createEvaluation360ResponseModel, 
  createAnswerModel,
  validateAnswer,
  validateEvaluation360Response,
  calculateProgress,
  RESPONSE_STATUS,
  QUESTION_TYPES
} from '../models/Evaluation360Response';
import evaluatorAssignmentService from './evaluatorAssignmentService';
import campaignService from './campaignService';

// ========== RESPONSE MANAGEMENT ==========

/**
 * Obtener respuesta de evaluación 360°
 */
export const getEvaluation360Response = async (orgId, responseId) => {
  try {
    const responseRef = doc(db, 'orgs', orgId, 'evaluation360Responses', responseId);
    const snapshot = await getDoc(responseRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Evaluation360Response ${responseId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[Evaluation360Response] Error loading response:', error);
    throw error;
  }
};

/**
 * Obtener respuesta por asignación
 */
export const getResponseByAssignment = async (orgId, assignmentId) => {
  try {
    const responsesRef = collection(db, 'organizations', orgId, 'evaluation360Responses');
    const q = query(
      responsesRef,
      where('assignmentId', '==', assignmentId),
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
    console.error('[Evaluation360Response] Error loading response by assignment:', error);
    throw error;
  }
};

/**
 * Crear nueva respuesta de evaluación 360°
 */
export const createEvaluation360Response = async (orgId, responseData, userId) => {
  try {
    // Validar datos
    if (!responseData.assignmentId || !responseData.testId) {
      throw new Error('assignmentId and testId are required');
    }
    
    // Obtener información de la asignación
    const assignment = await evaluatorAssignmentService.getEvaluatorAssignment(orgId, responseData.assignmentId);
    
    // Crear respuesta
    const newResponse = createEvaluation360ResponseModel({
      ...responseData,
      orgId,
      campaignId: assignment.campaignId,
      session360Id: assignment.session360Id,
      evaluatorId: assignment.evaluatorId,
      evaluatorEmail: assignment.evaluatorEmail,
      evaluatorType: assignment.evaluatorType,
      evaluateeId: assignment.evaluateeId,
      startedAt: new Date(),
      status: RESPONSE_STATUS.IN_PROGRESS
    });
    
    // Crear en Firestore
    const responseRef = doc(db, 'orgs', orgId, 'evaluation360Responses', newResponse.responseId);
    await updateDoc(responseRef, {
      ...newResponse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Actualizar asignación
    await evaluatorAssignmentService.updateEvaluatorAssignment(
      orgId, 
      responseData.assignmentId, 
      { 
        status: 'in_progress',
        lastAccessedAt: serverTimestamp()
      }, 
      userId
    );
    
    console.log(`[Evaluation360Response] Created response: ${newResponse.responseId}`);
    return newResponse;
  } catch (error) {
    console.error('[Evaluation360Response] Error creating response:', error);
    throw error;
  }
};

/**
 * Actualizar respuesta de evaluación 360°
 */
export const updateEvaluation360Response = async (orgId, responseId, updates, userId) => {
  try {
    // Obtener respuesta actual
    const currentResponse = await getEvaluation360Response(orgId, responseId);
    
    // Crear respuesta actualizada
    const updatedResponse = {
      ...currentResponse,
      ...updates,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    };
    
    // Actualizar en Firestore
    const responseRef = doc(db, 'orgs', orgId, 'evaluation360Responses', responseId);
    await updateDoc(responseRef, updatedResponse);
    
    console.log(`[Evaluation360Response] Updated response: ${responseId}`);
    return updatedResponse;
  } catch (error) {
    console.error('[Evaluation360Response] Error updating response:', error);
    throw error;
  }
};

/**
 * Guardar respuesta individual
 */
export const saveAnswer = async (orgId, responseId, questionId, answerData, userId) => {
  try {
    // Obtener respuesta actual
    const response = await getEvaluation360Response(orgId, responseId);
    
    // Crear respuesta
    const answer = createAnswerModel({
      questionId,
      ...answerData,
      answeredAt: new Date(),
      isAnswered: true
    });
    
    // Actualizar respuestas
    const updatedAnswers = {
      ...response.answers,
      [questionId]: answer
    };
    
    // Calcular progreso
    const progress = calculateProgress({ ...response, answers: updatedAnswers }, response.testSnapshot);
    
    // Actualizar respuesta
    await updateEvaluation360Response(orgId, responseId, {
      answers: updatedAnswers,
      answeredQuestions: progress.answeredQuestions,
      completionRate: progress.completionRate
    }, userId);
    
    console.log(`[Evaluation360Response] Saved answer for question ${questionId}`);
    return answer;
  } catch (error) {
    console.error('[Evaluation360Response] Error saving answer:', error);
    throw error;
  }
};

/**
 * Guardar múltiples respuestas
 */
export const saveAnswers = async (orgId, responseId, answers, userId) => {
  try {
    const batch = writeBatch(db);
    const responseRef = doc(db, 'orgs', orgId, 'evaluation360Responses', responseId);
    
    // Obtener respuesta actual
    const response = await getEvaluation360Response(orgId, responseId);
    
    // Crear respuestas
    const newAnswers = {};
    for (const [questionId, answerData] of Object.entries(answers)) {
      const answer = createAnswerModel({
        questionId,
        ...answerData,
        answeredAt: new Date(),
        isAnswered: true
      });
      newAnswers[questionId] = answer;
    }
    
    // Actualizar respuestas
    const updatedAnswers = {
      ...response.answers,
      ...newAnswers
    };
    
    // Calcular progreso
    const progress = calculateProgress({ ...response, answers: updatedAnswers }, response.testSnapshot);
    
    // Actualizar en batch
    batch.update(responseRef, {
      answers: updatedAnswers,
      answeredQuestions: progress.answeredQuestions,
      completionRate: progress.completionRate,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    });
    
    await batch.commit();
    
    console.log(`[Evaluation360Response] Saved ${Object.keys(answers).length} answers`);
    return updatedAnswers;
  } catch (error) {
    console.error('[Evaluation360Response] Error saving answers:', error);
    throw error;
  }
};

/**
 * Completar evaluación 360°
 */
export const completeEvaluation360Response = async (orgId, responseId, userId) => {
  try {
    // Obtener respuesta actual
    const response = await getEvaluation360Response(orgId, responseId);
    
    // Validar que esté completa
    const validation = validateEvaluation360Response(response, response.testSnapshot);
    if (!validation.isValid) {
      throw new Error(`Evaluation not complete: ${validation.errors.join(', ')}`);
    }
    
    // Actualizar estado
    const completedResponse = await updateEvaluation360Response(orgId, responseId, {
      status: RESPONSE_STATUS.COMPLETED,
      completedAt: new Date(),
      isValid: true,
      validationErrors: []
    }, userId);
    
    // Actualizar asignación
    await evaluatorAssignmentService.updateEvaluatorAssignment(
      orgId, 
      response.assignmentId, 
      { 
        status: 'completed',
        completedAt: serverTimestamp(),
        answers: response.answers
      }, 
      userId
    );
    
    // Marcar token como usado
    await evaluatorAssignmentService.markTokenAsUsed(orgId, response.assignmentId, userId);
    
    console.log(`[Evaluation360Response] Completed response: ${responseId}`);
    return completedResponse;
  } catch (error) {
    console.error('[Evaluation360Response] Error completing response:', error);
    throw error;
  }
};

/**
 * Enviar evaluación 360°
 */
export const submitEvaluation360Response = async (orgId, responseId, userId) => {
  try {
    // Completar evaluación primero
    const completedResponse = await completeEvaluation360Response(orgId, responseId, userId);
    
    // Actualizar estado a enviado
    const submittedResponse = await updateEvaluation360Response(orgId, responseId, {
      status: RESPONSE_STATUS.SUBMITTED,
      submittedAt: new Date()
    }, userId);
    
    // Actualizar estadísticas de la campaña
    await updateCampaignStats(orgId, completedResponse.campaignId);
    
    console.log(`[Evaluation360Response] Submitted response: ${responseId}`);
    return submittedResponse;
  } catch (error) {
    console.error('[Evaluation360Response] Error submitting response:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener respuestas de una sesión 360°
 */
export const getSessionResponses = async (orgId, session360Id) => {
  try {
    const responsesRef = collection(db, 'organizations', orgId, 'evaluation360Responses');
    const q = query(
      responsesRef,
      where('session360Id', '==', session360Id),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Evaluation360Response] Loaded ${responses.length} responses for session ${session360Id}`);
    return responses;
  } catch (error) {
    console.error('[Evaluation360Response] Error loading session responses:', error);
    throw error;
  }
};

/**
 * Obtener respuestas de una campaña
 */
export const getCampaignResponses = async (orgId, campaignId) => {
  try {
    const responsesRef = collection(db, 'organizations', orgId, 'evaluation360Responses');
    const q = query(
      responsesRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Evaluation360Response] Loaded ${responses.length} responses for campaign ${campaignId}`);
    return responses;
  } catch (error) {
    console.error('[Evaluation360Response] Error loading campaign responses:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de respuestas
 */
export const getResponseStats = async (orgId, campaignId) => {
  try {
    const responses = await getCampaignResponses(orgId, campaignId);
    
    const stats = {
      total: responses.length,
      draft: 0,
      inProgress: 0,
      completed: 0,
      submitted: 0,
      byType: {},
      averageCompletionRate: 0,
      averageTimeSpent: 0
    };
    
    let totalCompletionRate = 0;
    let totalTimeSpent = 0;
    
    responses.forEach(response => {
      stats[response.status] = (stats[response.status] || 0) + 1;
      stats.byType[response.evaluatorType] = (stats.byType[response.evaluatorType] || 0) + 1;
      
      totalCompletionRate += response.completionRate || 0;
      totalTimeSpent += response.timeSpent || 0;
    });
    
    if (responses.length > 0) {
      stats.averageCompletionRate = Math.round(totalCompletionRate / responses.length);
      stats.averageTimeSpent = Math.round(totalTimeSpent / responses.length);
    }
    
    return stats;
  } catch (error) {
    console.error('[Evaluation360Response] Error loading response stats:', error);
    throw error;
  }
};

/**
 * Actualizar estadísticas de campaña
 */
const updateCampaignStats = async (orgId, campaignId) => {
  try {
    const stats = await getResponseStats(orgId, campaignId);
    
    // Actualizar campaña
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      stats: {
        ...stats,
        lastUpdated: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    console.log(`[Evaluation360Response] Updated campaign stats: ${stats.averageCompletionRate}% completion rate`);
  } catch (error) {
    console.error('[Evaluation360Response] Error updating campaign stats:', error);
  }
};

// ========== EXPORT ==========

export default {
  // Response management
  getEvaluation360Response,
  getResponseByAssignment,
  createEvaluation360Response,
  updateEvaluation360Response,
  saveAnswer,
  saveAnswers,
  completeEvaluation360Response,
  submitEvaluation360Response,
  
  // Utilities
  getSessionResponses,
  getCampaignResponses,
  getResponseStats
};
