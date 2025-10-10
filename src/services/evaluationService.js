/**
 * Evaluation Service - Integración con Backend
 * 
 * Maneja la comunicación con Firebase Functions para:
 * - Guardar progreso de evaluaciones
 * - Enviar respuestas finales
 * - Calcular resultados
 * - Obtener evaluaciones del usuario
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { dlog, dwarn } from '../utils/debug';

/**
 * Crear nueva evaluación
 */
export const createEvaluation = async (userId, orgId, evaluationData) => {
  try {
    dlog('[EvaluationService] Creating evaluation:', { userId, orgId });

    const evaluationRef = await addDoc(collection(db, 'evaluations'), {
      userId,
      orgId,
      ...evaluationData,
      status: 'in_progress',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    dlog('[EvaluationService] Evaluation created:', evaluationRef.id);
    
    return {
      success: true,
      evaluationId: evaluationRef.id
    };
  } catch (error) {
    dwarn('[EvaluationService] Error creating evaluation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Guardar progreso de evaluación
 */
export const saveEvaluationProgress = async (evaluationId, answers, progress) => {
  try {
    dlog('[EvaluationService] Saving progress:', { evaluationId, answersCount: Object.keys(answers).length });

    const evaluationRef = doc(db, 'evaluations', evaluationId);
    
    await updateDoc(evaluationRef, {
      answers,
      progress,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    dwarn('[EvaluationService] Error saving progress:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar evaluación completada
 */
export const submitEvaluation = async (evaluationId, answers) => {
  try {
    dlog('[EvaluationService] Submitting evaluation:', evaluationId);

    const evaluationRef = doc(db, 'evaluations', evaluationId);
    
    // Actualizar estado a submitted
    await updateDoc(evaluationRef, {
      status: 'submitted',
      answers,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Calcular resultados
    const results = calculateResults(answers);

    // Guardar resultados
    await updateDoc(evaluationRef, {
      results,
      status: 'completed'
    });

    dlog('[EvaluationService] Evaluation submitted successfully');

    return {
      success: true,
      evaluationId,
      results
    };
  } catch (error) {
    dwarn('[EvaluationService] Error submitting evaluation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener evaluación por ID
 */
export const getEvaluation = async (evaluationId) => {
  try {
    dlog('[EvaluationService] Getting evaluation:', evaluationId);

    const evaluationRef = doc(db, 'evaluations', evaluationId);
    const evaluationSnap = await getDoc(evaluationRef);

    if (!evaluationSnap.exists()) {
      return {
        success: false,
        error: 'Evaluation not found'
      };
    }

    return {
      success: true,
      evaluation: {
        id: evaluationSnap.id,
        ...evaluationSnap.data()
      }
    };
  } catch (error) {
    dwarn('[EvaluationService] Error getting evaluation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener evaluaciones del usuario
 */
export const getUserEvaluations = async (userId, orgId = null) => {
  try {
    dlog('[EvaluationService] Getting user evaluations:', { userId, orgId });

    let q;
    if (orgId) {
      q = query(
        collection(db, 'evaluations'),
        where('userId', '==', userId),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'evaluations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const evaluations = [];

    querySnapshot.forEach((doc) => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      evaluations
    };
  } catch (error) {
    dwarn('[EvaluationService] Error getting user evaluations:', error);
    return {
      success: false,
      error: error.message,
      evaluations: []
    };
  }
};

/**
 * Calcular resultados de evaluación
 * 
 * Este es un algoritmo básico que calcula:
 * - Puntaje por categoría
 * - Puntaje global
 * - Nivel de competencia por categoría
 */
/**
 * Calcular resultados usando TestDefinition (NUEVO - dinámico)
 */
export const calculateResultsFromDefinition = (testDefinition, answers) => {
  dlog('[EvaluationService] Calculating results from definition');

  if (!testDefinition) {
    throw new Error('TestDefinition is required');
  }

  const categoryScores = {};

  // Inicializar categorías
  testDefinition.categories.forEach(category => {
    categoryScores[category.id] = {
      total: 0,
      count: 0,
      weightedTotal: 0,
      weightedCount: 0
    };
  });

  // Calcular puntajes por categoría
  Object.entries(answers).forEach(([questionId, answerData]) => {
    const question = testDefinition.questions.find(q => q.id === questionId);
    if (!question) return;

    const value = answerData.value;
    const weight = question.weight || 1;

    categoryScores[question.categoryId].total += value;
    categoryScores[question.categoryId].count += 1;
    categoryScores[question.categoryId].weightedTotal += value * weight;
    categoryScores[question.categoryId].weightedCount += weight;
  });

  // Calcular promedios y niveles
  let globalTotal = 0;
  let globalCount = 0;
  let globalWeightedTotal = 0;
  let globalWeightedCount = 0;

  const categoryWeightedScores = {};

  Object.entries(categoryScores).forEach(([categoryId, scores]) => {
    if (scores.count === 0) return;

    const average = scores.total / scores.count;
    const weightedAverage = scores.weightedTotal / scores.weightedCount;

    // Usar niveles de la definición
    const level = getCompetencyLevelFromDefinition(
      testDefinition.scoring,
      weightedAverage
    );

    categoryWeightedScores[categoryId] = {
      score: weightedAverage,
      average: average,
      level: level,
      questionsAnswered: scores.count
    };

    globalTotal += scores.total;
    globalCount += scores.count;
    globalWeightedTotal += scores.weightedTotal;
    globalWeightedCount += scores.weightedCount;
  });

  // Calcular puntaje global
  const globalAverage = globalCount > 0 ? globalTotal / globalCount : 0;
  const globalWeightedAverage = globalWeightedCount > 0 ? globalWeightedTotal / globalWeightedCount : 0;

  // Identificar fortalezas y áreas de oportunidad
  const sortedCategories = Object.entries(categoryWeightedScores)
    .sort(([, a], [, b]) => b.score - a.score);

  const strengths = sortedCategories.slice(0, 3).map(([id]) => ({
    categoryId: id,
    score: categoryWeightedScores[id].score,
    level: categoryWeightedScores[id].level
  }));

  const opportunities = sortedCategories.slice(-3).map(([id]) => ({
    categoryId: id,
    score: categoryWeightedScores[id].score,
    level: categoryWeightedScores[id].level
  }));

  const globalLevel = getCompetencyLevelFromDefinition(
    testDefinition.scoring,
    globalWeightedAverage
  );

  const results = {
    overall: {
      score: globalWeightedAverage,
      average: globalAverage,
      level: globalLevel,
      totalQuestions: globalCount
    },
    categories: categoryWeightedScores,
    insights: {
      strengths,
      opportunities
    },
    calculatedAt: new Date().toISOString(),
    testId: testDefinition.testId,
    version: testDefinition.version,
    scoringVersion: testDefinition.versioning?.scoringVersion
  };

  dlog('[EvaluationService] Results calculated:', results);

  return results;
};

/**
 * Calcular resultados (LEGACY - hardcoded, para backward compatibility)
 */
export const calculateResults = (answers) => {
  dlog('[EvaluationService] Calculating results (legacy mode)');

  // Importar dinámicamente para evitar dependencias circulares
  const { QUESTION_BANK, LEADERSHIP_CATEGORIES } = require('../constants/questionBank');

  const categoryScores = {};
  const categoryWeightedScores = {};

  // Inicializar categorías
  Object.values(LEADERSHIP_CATEGORIES).forEach(category => {
    categoryScores[category.id] = {
      total: 0,
      count: 0,
      weightedTotal: 0,
      weightedCount: 0
    };
  });

  // Calcular puntajes por categoría
  Object.entries(answers).forEach(([questionId, answerData]) => {
    const question = QUESTION_BANK.find(q => q.id === questionId);
    if (!question) return;

    const value = answerData.value;
    const weight = question.weight || 1;

    categoryScores[question.category].total += value;
    categoryScores[question.category].count += 1;
    categoryScores[question.category].weightedTotal += value * weight;
    categoryScores[question.category].weightedCount += weight;
  });

  // Calcular promedios y niveles
  let globalTotal = 0;
  let globalCount = 0;
  let globalWeightedTotal = 0;
  let globalWeightedCount = 0;

  Object.entries(categoryScores).forEach(([categoryId, scores]) => {
    if (scores.count === 0) return;

    const average = scores.total / scores.count;
    const weightedAverage = scores.weightedTotal / scores.weightedCount;

    categoryWeightedScores[categoryId] = {
      score: weightedAverage,
      average: average,
      level: getCompetencyLevel(weightedAverage),
      questionsAnswered: scores.count
    };

    globalTotal += scores.total;
    globalCount += scores.count;
    globalWeightedTotal += scores.weightedTotal;
    globalWeightedCount += scores.weightedCount;
  });

  // Calcular puntaje global
  const globalAverage = globalCount > 0 ? globalTotal / globalCount : 0;
  const globalWeightedAverage = globalWeightedCount > 0 ? globalWeightedTotal / globalWeightedCount : 0;

  // Identificar fortalezas y áreas de oportunidad
  const sortedCategories = Object.entries(categoryWeightedScores)
    .sort(([, a], [, b]) => b.score - a.score);

  const strengths = sortedCategories.slice(0, 3).map(([id]) => ({
    categoryId: id,
    score: categoryWeightedScores[id].score,
    level: categoryWeightedScores[id].level
  }));

  const opportunities = sortedCategories.slice(-3).map(([id]) => ({
    categoryId: id,
    score: categoryWeightedScores[id].score,
    level: categoryWeightedScores[id].level
  }));

  const results = {
    overall: {
      score: globalWeightedAverage,
      average: globalAverage,
      level: getCompetencyLevel(globalWeightedAverage),
      totalQuestions: globalCount
    },
    categories: categoryWeightedScores,
    insights: {
      strengths,
      opportunities
    },
    calculatedAt: new Date().toISOString()
  };

  dlog('[EvaluationService] Results calculated:', results);

  return results;
};

/**
 * Determinar nivel de competencia desde TestDefinition
 */
const getCompetencyLevelFromDefinition = (scoring, score) => {
  if (!scoring || !scoring.rules || !scoring.rules.competencyLevels) {
    return getCompetencyLevel(score); // Fallback a legacy
  }

  const levels = scoring.rules.competencyLevels;
  
  for (const levelDef of levels) {
    if (score >= levelDef.min && score <= levelDef.max) {
      return levelDef.level;
    }
  }

  return 'intermediate'; // Fallback
};

/**
 * Determinar nivel de competencia basado en puntaje (LEGACY)
 */
const getCompetencyLevel = (score) => {
  if (score >= 4.5) return 'expert';
  if (score >= 3.5) return 'advanced';
  if (score >= 2.5) return 'intermediate';
  if (score >= 1.5) return 'developing';
  return 'beginner';
};

/**
 * Obtener texto descriptivo del nivel de competencia
 */
export const getCompetencyLevelText = (level) => {
  const levels = {
    expert: 'Experto - Excelencia consistente',
    advanced: 'Avanzado - Desempeño sólido',
    intermediate: 'Intermedio - Competente con oportunidades',
    developing: 'En Desarrollo - Requiere mejora',
    beginner: 'Inicial - Necesita desarrollo significativo'
  };

  return levels[level] || 'No evaluado';
};

/**
 * Obtener color asociado al nivel de competencia
 */
export const getCompetencyLevelColor = (level) => {
  const colors = {
    expert: '#28a745',
    advanced: '#6f42c1',
    intermediate: '#007bff',
    developing: '#ffc107',
    beginner: '#dc3545'
  };

  return colors[level] || '#6c757d';
};

export default {
  createEvaluation,
  saveEvaluationProgress,
  submitEvaluation,
  getEvaluation,
  getUserEvaluations,
  calculateResults,
  calculateResultsFromDefinition,
  getCompetencyLevelText,
  getCompetencyLevelColor
};

