/**
 * EvaluationContextV2 - Gestión de Estado con TestDefinition Dinámica
 * 
 * Nueva versión que carga dinámicamente las TestDefinitions desde Firestore
 * y soporta múltiples tests/versiones por organización.
 * 
 * Cambios principales:
 * - Carga TestDefinition desde Firestore (no hardcode)
 * - Soporte para testId y version dinámicos
 * - Namespacing por org:user:test:version
 * - Auto-migración de questionBank si es necesario
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';
import { getTest } from '../services/testDefinitionService';
import { autoMigrateIfNeeded } from '../utils/migrateQuestionBank';
import { dlog, dwarn } from '../utils/debug';

const EvaluationContext = createContext();

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
};

export const EvaluationProvider = ({ children, testId, version }) => {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  
  // Estado principal
  const [testDefinition, setTestDefinition] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Estado de navegación
  const [viewMode, setViewMode] = useState('category');
  const [showCategoryIntro, setShowCategoryIntro] = useState(true);

  /**
   * Cargar TestDefinition desde Firestore
   */
  const loadTestDefinition = useCallback(async () => {
    if (!activeOrgId || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      dlog('[EvaluationContext] Loading test definition:', { activeOrgId, testId, version });

      let result;

      // Si no hay testId/version, buscar versión activa
      if (!testId) {
        // Auto-migración si es necesario
        await autoMigrateIfNeeded(activeOrgId, user.uid);
        
        // Buscar versión activa de leadership (default)
        result = await getTest(activeOrgId, 'leadership', 'v1');
      } else if (!version) {
        // Buscar versión activa del testId especificado
        result = await getTest(activeOrgId, testId, 'v1');
      } else {
        // Cargar versión específica
        result = await getTest(activeOrgId, testId, version);
      }

      if (!result.success) {
        throw new Error(result.error || 'Error cargando test definition');
      }

      if (!result.test) {
        throw new Error('Test definition no encontrado');
      }

      dlog('[EvaluationContext] Test definition loaded:', result.test);
      setTestDefinition(result.test);

    } catch (err) {
      dwarn('[EvaluationContext] Error loading test definition:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId, user, testId, version]);

  /**
   * Cargar test definition al montar
   */
  useEffect(() => {
    loadTestDefinition();
  }, [loadTestDefinition]);

  /**
   * Inicializar nueva evaluación
   */
  const startEvaluation = useCallback(() => {
    if (!testDefinition || !user || !activeOrgId) {
      dwarn('[EvaluationContext] Cannot start evaluation, missing dependencies');
      return null;
    }

    dlog('[EvaluationContext] Starting new evaluation');
    
    const newEvaluation = {
      id: `eval_${Date.now()}`,
      userId: user.uid,
      orgId: activeOrgId,
      testId: testDefinition.testId,
      version: testDefinition.version,
      testDefinitionId: testDefinition.id,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      totalQuestions: testDefinition.questions.length,
      completedQuestions: 0,
      currentCategory: testDefinition.categories[0]?.id
    };

    setEvaluation(newEvaluation);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentCategory(testDefinition.categories[0]);
    setShowCategoryIntro(true);
    setError(null);

    // Guardar en localStorage con namespacing
    saveToLocalStorage(newEvaluation, {});

    return newEvaluation;
  }, [testDefinition, user, activeOrgId]);

  /**
   * Guardar en localStorage con namespacing
   */
  const saveToLocalStorage = useCallback((evalData, answersData) => {
    if (!user || !activeOrgId || !testDefinition) return;

    try {
      const key = `eval:${activeOrgId}:${user.uid}:${testDefinition.testId}:${testDefinition.version}`;
      localStorage.setItem(key, JSON.stringify({
        evaluation: evalData,
        answers: answersData,
        timestamp: Date.now()
      }));
    } catch (err) {
      dwarn('[EvaluationContext] Failed to save to localStorage:', err);
    }
  }, [user, activeOrgId, testDefinition]);

  /**
   * Cargar desde localStorage
   */
  const loadFromLocalStorage = useCallback(() => {
    if (!user || !activeOrgId || !testDefinition) return false;

    try {
      const key = `eval:${activeOrgId}:${user.uid}:${testDefinition.testId}:${testDefinition.version}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        const { evaluation: savedEval, answers: savedAnswers, timestamp } = JSON.parse(saved);
        
        // Verificar que no sea muy antiguo (7 días)
        const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          dlog('[EvaluationContext] Loaded draft from localStorage');
          setEvaluation(savedEval);
          setAnswers(savedAnswers);
          setCurrentQuestionIndex(Object.keys(savedAnswers).length);
          return true;
        }
      }
    } catch (err) {
      dwarn('[EvaluationContext] Failed to load from localStorage:', err);
    }
    
    return false;
  }, [user, activeOrgId, testDefinition]);

  /**
   * Auto-iniciar evaluación si testDefinition está lista
   */
  useEffect(() => {
    if (testDefinition && !evaluation && !isLoading) {
      // Intentar cargar draft
      const loaded = loadFromLocalStorage();
      if (!loaded) {
        // Iniciar nueva
        startEvaluation();
      }
    }
  }, [testDefinition, evaluation, isLoading, loadFromLocalStorage, startEvaluation]);

  /**
   * Guardar respuesta
   */
  const saveAnswer = useCallback((questionId, value) => {
    if (!testDefinition) return;

    dlog('[EvaluationContext] Saving answer:', { questionId, value });
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: {
          value,
          answeredAt: new Date().toISOString()
        }
      };

      // Guardar en localStorage
      if (evaluation) {
        saveToLocalStorage(evaluation, newAnswers);
      }

      return newAnswers;
    });

    // Actualizar progreso
    setEvaluation(prev => ({
      ...prev,
      completedQuestions: Object.keys(answers).length + 1,
      lastAnsweredAt: new Date().toISOString()
    }));

    setLastSaved(new Date());
  }, [testDefinition, evaluation, answers, saveToLocalStorage]);

  /**
   * Ir a la siguiente pregunta
   */
  const nextQuestion = useCallback(() => {
    if (!testDefinition) return false;

    const currentQuestion = testDefinition.questions[currentQuestionIndex];
    const hasAnswer = answers[currentQuestion?.id];

    if (!hasAnswer) {
      setError('Por favor responde la pregunta antes de continuar');
      return false;
    }

    if (currentQuestionIndex < testDefinition.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const nextQuestion = testDefinition.questions[nextIndex];
      if (nextQuestion.categoryId !== currentQuestion.categoryId) {
        const newCategory = testDefinition.categories.find(
          cat => cat.id === nextQuestion.categoryId
        );
        setCurrentCategory(newCategory);
        setShowCategoryIntro(true);
      } else {
        setShowCategoryIntro(false);
      }
      
      setError(null);
      return true;
    }

    return false;
  }, [testDefinition, currentQuestionIndex, answers]);

  /**
   * Ir a la pregunta anterior
   */
  const previousQuestion = useCallback(() => {
    if (!testDefinition || currentQuestionIndex === 0) return false;

    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    
    const prevQuestion = testDefinition.questions[prevIndex];
    const currentQuestion = testDefinition.questions[currentQuestionIndex];
    
    if (prevQuestion.categoryId !== currentQuestion.categoryId) {
      const newCategory = testDefinition.categories.find(
        cat => cat.id === prevQuestion.categoryId
      );
      setCurrentCategory(newCategory);
    }
    setShowCategoryIntro(false);
    setError(null);
    return true;
  }, [testDefinition, currentQuestionIndex]);

  /**
   * Calcular progreso por categoría
   */
  const getCategoryProgress = useCallback(() => {
    if (!testDefinition) return {};

    const progress = {};
    
    testDefinition.categories.forEach(category => {
      const categoryQuestions = testDefinition.questions.filter(q => q.categoryId === category.id);
      const answeredQuestions = categoryQuestions.filter(q => answers[q.id]);
      
      progress[category.id] = {
        total: categoryQuestions.length,
        answered: answeredQuestions.length,
        percentage: (answeredQuestions.length / categoryQuestions.length) * 100
      };
    });

    return progress;
  }, [testDefinition, answers]);

  /**
   * Calcular progreso total
   */
  const getOverallProgress = useCallback(() => {
    if (!testDefinition) {
      return { answered: 0, total: 0, percentage: 0, isComplete: false };
    }

    const answeredCount = Object.keys(answers).length;
    const totalCount = testDefinition.questions.length;
    
    return {
      answered: answeredCount,
      total: totalCount,
      percentage: (answeredCount / totalCount) * 100,
      isComplete: answeredCount === totalCount
    };
  }, [testDefinition, answers]);

  /**
   * Verificar si la evaluación está completa
   */
  const isEvaluationComplete = useCallback(() => {
    if (!testDefinition) return false;
    return Object.keys(answers).length === testDefinition.questions.length;
  }, [testDefinition, answers]);

  /**
   * Enviar evaluación
   */
  const submitEvaluation = useCallback(async () => {
    if (!isEvaluationComplete() || !testDefinition) {
      setError('Debes completar todas las preguntas antes de enviar');
      return { success: false, error: 'Evaluación incompleta' };
    }

    setIsLoading(true);
    setError(null);

    try {
      dlog('[EvaluationContext] Submitting evaluation');

      // Calcular resultados usando la definición
      const { calculateResultsFromDefinition } = await import('../services/evaluationService');
      const results = calculateResultsFromDefinition(testDefinition, answers);

      const submittedEvaluation = {
        ...evaluation,
        status: 'completed',
        submittedAt: new Date().toISOString(),
        answers,
        results,
        questionSetVersion: testDefinition.versioning.questionSetVersion,
        scoringVersion: testDefinition.versioning.scoringVersion
      };

      setEvaluation(submittedEvaluation);

      // Limpiar localStorage
      if (user && activeOrgId) {
        const key = `eval:${activeOrgId}:${user.uid}:${testDefinition.testId}:${testDefinition.version}`;
        localStorage.removeItem(key);
      }

      // Telemetría
      dlog('[EvaluationContext] Evaluation submitted successfully');
      
      return {
        success: true,
        evaluationId: submittedEvaluation.id,
        results
      };

    } catch (err) {
      dwarn('[EvaluationContext] Error submitting evaluation:', err);
      setError('Error al enviar la evaluación. Por favor intenta de nuevo.');
      return {
        success: false,
        error: err.message
      };
    } finally {
      setIsLoading(false);
    }
  }, [evaluation, answers, isEvaluationComplete, testDefinition, user, activeOrgId]);

  /**
   * Obtener pregunta actual
   */
  const getCurrentQuestion = useCallback(() => {
    if (!testDefinition) return null;
    return testDefinition.questions[currentQuestionIndex];
  }, [testDefinition, currentQuestionIndex]);

  /**
   * Verificar si una pregunta tiene respuesta
   */
  const hasAnswer = useCallback((questionId) => {
    return !!answers[questionId];
  }, [answers]);

  /**
   * Obtener respuesta de una pregunta
   */
  const getAnswer = useCallback((questionId) => {
    return answers[questionId]?.value;
  }, [answers]);

  const value = {
    // Definición
    testDefinition,

    // Estado
    evaluation,
    answers,
    currentQuestionIndex,
    currentCategory,
    isLoading,
    isSaving,
    error,
    lastSaved,
    viewMode,
    showCategoryIntro,

    // Acciones
    startEvaluation,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitEvaluation,
    setShowCategoryIntro,
    setViewMode,

    // Helpers
    getCurrentQuestion,
    getCategoryProgress,
    getOverallProgress,
    isEvaluationComplete,
    hasAnswer,
    getAnswer,

    // Constantes dinámicas
    totalQuestions: testDefinition?.questions.length || 0,
    categories: testDefinition?.categories || [],
    scale: testDefinition?.scale || null
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export default EvaluationContext;

