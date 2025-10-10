/**
 * EvaluationContextSimple - Versión simplificada para testing
 * 
 * Usa el questionBank hardcodeado para evitar problemas con Firestore
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';
import { QUESTION_BANK, LEADERSHIP_CATEGORIES } from '../constants/questionBank';

const EvaluationContext = createContext();

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
};

export const EvaluationProvider = ({ children, testId = 'leadership', version = 'v1' }) => {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();

  // Estado principal
  const [evaluation, setEvaluation] = useState({
    id: null,
    userId: null,
    status: 'not_started',
    startedAt: null,
    completedAt: null,
    answers: {},
    currentQuestionIndex: 0,
    currentCategory: null,
    results: null
  });

  const [testDefinition, setTestDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [showCategoryIntro, setShowCategoryIntro] = useState(true);

  // Cargar test definition (hardcodeado por ahora)
  useEffect(() => {
    if (!user || !activeOrgId) return;

    console.log('[EvaluationContextSimple] Loading hardcoded test definition');
    
    // Usar questionBank hardcodeado
    const definition = {
      testId: 'leadership',
      version: 'v1',
      title: 'Evaluación de Liderazgo 360°',
      description: 'Evaluación integral de competencias de liderazgo',
      questions: QUESTION_BANK,
      categories: LEADERSHIP_CATEGORIES,
      scale: {
        min: 1,
        max: 5,
        labels: {
          1: 'Nunca',
          2: 'Raramente',
          3: 'A veces',
          4: 'Frecuentemente',
          5: 'Siempre'
        }
      }
    };

    setTestDefinition(definition);
    setError(null);
  }, [user, activeOrgId]);

  // Iniciar evaluación
  const startEvaluation = useCallback(() => {
    if (!user || !testDefinition) {
      console.error('[EvaluationContextSimple] Cannot start: missing user or test definition');
      return;
    }

    const evaluationId = `eval_${Date.now()}`;
    const firstCategory = testDefinition.categories[0];

    setEvaluation(prev => ({
      ...prev,
      id: evaluationId,
      userId: user.uid,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      currentCategory: firstCategory.id,
      currentQuestionIndex: 0
    }));

    console.log('[EvaluationContextSimple] Evaluation started:', evaluationId);
  }, [user, testDefinition]);

  // Guardar respuesta
  const saveAnswer = useCallback((questionId, value) => {
    setEvaluation(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
    setLastSaved(new Date());
    console.log('[EvaluationContextSimple] Answer saved:', { questionId, value });
  }, []);

  // Navegar a siguiente pregunta
  const nextQuestion = useCallback(() => {
    if (!testDefinition) return;

    const totalQuestions = testDefinition.questions.length;
    const nextIndex = evaluation.currentQuestionIndex + 1;

    if (nextIndex < totalQuestions) {
      const nextQuestion = testDefinition.questions[nextIndex];
      const currentCat = evaluation.currentCategory;
      
      // Verificar si cambiamos de categoría
      if (nextQuestion.category !== currentCat) {
        setShowCategoryIntro(true);
        setEvaluation(prev => ({
          ...prev,
          currentCategory: nextQuestion.category,
          currentQuestionIndex: nextIndex
        }));
      } else {
        setEvaluation(prev => ({
          ...prev,
          currentQuestionIndex: nextIndex
        }));
      }
    }
  }, [evaluation.currentQuestionIndex, evaluation.currentCategory, testDefinition]);

  // Navegar a pregunta anterior
  const previousQuestion = useCallback(() => {
    if (evaluation.currentQuestionIndex > 0) {
      setEvaluation(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  }, [evaluation.currentQuestionIndex]);

  // Enviar evaluación
  const submitEvaluation = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calcular resultados
      const results = calculateResults(evaluation.answers, testDefinition);
      
      setEvaluation(prev => ({
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
        results
      }));

      console.log('[EvaluationContextSimple] Evaluation submitted:', results);
      return { success: true, evaluationId: evaluation.id };
    } catch (error) {
      console.error('[EvaluationContextSimple] Submit error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [evaluation, testDefinition]);

  // Calcular resultados
  const calculateResults = (answers, definition) => {
    const categoryScores = {};
    const categoryQuestionCounts = {};

    // Agrupar respuestas por categoría
    definition.questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = 0;
          categoryQuestionCounts[question.category] = 0;
        }
        categoryScores[question.category] += parseInt(answer);
        categoryQuestionCounts[question.category]++;
      }
    });

    // Calcular promedios
    const categoryAverages = {};
    Object.keys(categoryScores).forEach(category => {
      categoryAverages[category] = categoryScores[category] / categoryQuestionCounts[category];
    });

    // Calcular promedio general
    const overallScore = Object.values(categoryAverages).reduce((a, b) => a + b, 0) / 
                         Object.keys(categoryAverages).length;

    return {
      overallScore,
      categoryScores: categoryAverages,
      totalQuestions: definition.questions.length,
      answeredQuestions: Object.keys(answers).length
    };
  };

  // Helpers
  const getCurrentQuestion = useCallback(() => {
    if (!testDefinition || !testDefinition.questions) return null;
    return testDefinition.questions[evaluation.currentQuestionIndex];
  }, [testDefinition, evaluation.currentQuestionIndex]);

  const getCategoryProgress = useCallback(() => {
    if (!testDefinition || !evaluation.currentCategory) return { current: 0, total: 0 };

    const categoryQuestions = testDefinition.questions.filter(
      q => q.category === evaluation.currentCategory
    );
    const answeredInCategory = categoryQuestions.filter(
      q => evaluation.answers[q.id]
    ).length;

    return {
      current: answeredInCategory,
      total: categoryQuestions.length
    };
  }, [testDefinition, evaluation]);

  const getOverallProgress = useCallback(() => {
    if (!testDefinition) return { current: 0, total: 0, percentage: 0 };

    const total = testDefinition.questions.length;
    const current = Object.keys(evaluation.answers).length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }, [testDefinition, evaluation.answers]);

  const isEvaluationComplete = useCallback(() => {
    if (!testDefinition) return false;
    return Object.keys(evaluation.answers).length === testDefinition.questions.length;
  }, [testDefinition, evaluation.answers]);

  const hasAnswer = useCallback((questionId) => {
    return !!evaluation.answers[questionId];
  }, [evaluation.answers]);

  const getAnswer = useCallback((questionId) => {
    return evaluation.answers[questionId] || null;
  }, [evaluation.answers]);

  const value = {
    // Estado
    evaluation,
    testDefinition,
    currentQuestionIndex: evaluation.currentQuestionIndex,
    currentCategory: evaluation.currentCategory,
    showCategoryIntro,
    isLoading,
    error,
    lastSaved,

    // Acciones
    startEvaluation,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitEvaluation,

    // Helpers
    getCurrentQuestion,
    getCategoryProgress,
    getOverallProgress,
    isEvaluationComplete,
    hasAnswer,
    getAnswer,
    setShowCategoryIntro
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export default EvaluationContext;
