/**
 * EvaluationContext - Gestión de Estado para Evaluaciones 360°
 * 
 * Gestiona:
 * - Estado actual de la evaluación
 * - Respuestas del usuario
 * - Progreso por categorías
 * - Navegación entre preguntas
 * - Guardado automático
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { QUESTION_BANK, LEADERSHIP_CATEGORIES } from '../constants/questionBank';
import { dlog, dwarn } from '../utils/debug';

const EvaluationContext = createContext();

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
};

export const EvaluationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Estado principal
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Estado de navegación
  const [viewMode, setViewMode] = useState('category'); // 'category' | 'linear'
  const [showCategoryIntro, setShowCategoryIntro] = useState(true);

  /**
   * Inicializar nueva evaluación
   */
  const startEvaluation = useCallback(() => {
    dlog('[EvaluationContext] Starting new evaluation');
    
    const newEvaluation = {
      id: `eval_${Date.now()}`,
      userId: user?.uid,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      totalQuestions: QUESTION_BANK.length,
      completedQuestions: 0,
      currentCategory: Object.keys(LEADERSHIP_CATEGORIES)[0]
    };

    setEvaluation(newEvaluation);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentCategory(Object.values(LEADERSHIP_CATEGORIES)[0]);
    setShowCategoryIntro(true);
    setError(null);

    // Guardar en localStorage como backup
    try {
      localStorage.setItem('evaluation_draft', JSON.stringify({
        evaluation: newEvaluation,
        answers: {},
        timestamp: Date.now()
      }));
    } catch (err) {
      dwarn('[EvaluationContext] Failed to save to localStorage:', err);
    }

    return newEvaluation;
  }, [user]);

  /**
   * Cargar evaluación en progreso desde localStorage
   */
  const loadDraftEvaluation = useCallback(() => {
    try {
      const draft = localStorage.getItem('evaluation_draft');
      if (draft) {
        const { evaluation: savedEval, answers: savedAnswers, timestamp } = JSON.parse(draft);
        
        // Verificar que no sea demasiado antigua (7 días)
        const daysSinceCreation = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          dlog('[EvaluationContext] Loaded draft evaluation from localStorage');
          setEvaluation(savedEval);
          setAnswers(savedAnswers);
          
          // Calcular índice actual basado en respuestas
          const answeredCount = Object.keys(savedAnswers).length;
          setCurrentQuestionIndex(answeredCount);
          
          return true;
        }
      }
    } catch (err) {
      dwarn('[EvaluationContext] Failed to load draft:', err);
    }
    return false;
  }, []);

  /**
   * Guardar respuesta
   */
  const saveAnswer = useCallback((questionId, value) => {
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
      try {
        const draft = localStorage.getItem('evaluation_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          localStorage.setItem('evaluation_draft', JSON.stringify({
            ...parsed,
            answers: newAnswers,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        dwarn('[EvaluationContext] Failed to save answer to localStorage:', err);
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
  }, [answers]);

  /**
   * Ir a la siguiente pregunta
   */
  const nextQuestion = useCallback(() => {
    const currentQuestion = QUESTION_BANK[currentQuestionIndex];
    const hasAnswer = answers[currentQuestion?.id];

    if (!hasAnswer) {
      setError('Por favor responde la pregunta antes de continuar');
      return false;
    }

    if (currentQuestionIndex < QUESTION_BANK.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Verificar si cambiamos de categoría
      const nextQuestion = QUESTION_BANK[nextIndex];
      if (nextQuestion.category !== currentQuestion.category) {
        const newCategory = Object.values(LEADERSHIP_CATEGORIES).find(
          cat => cat.id === nextQuestion.category
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
  }, [currentQuestionIndex, answers]);

  /**
   * Ir a la pregunta anterior
   */
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      
      // Verificar si cambiamos de categoría
      const prevQuestion = QUESTION_BANK[prevIndex];
      const currentQuestion = QUESTION_BANK[currentQuestionIndex];
      
      if (prevQuestion.category !== currentQuestion.category) {
        const newCategory = Object.values(LEADERSHIP_CATEGORIES).find(
          cat => cat.id === prevQuestion.category
        );
        setCurrentCategory(newCategory);
        setShowCategoryIntro(false); // No mostrar intro al retroceder
      } else {
        setShowCategoryIntro(false);
      }
      
      setError(null);
      return true;
    }
    return false;
  }, [currentQuestionIndex]);

  /**
   * Ir a una pregunta específica
   */
  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < QUESTION_BANK.length) {
      setCurrentQuestionIndex(index);
      
      const question = QUESTION_BANK[index];
      const newCategory = Object.values(LEADERSHIP_CATEGORIES).find(
        cat => cat.id === question.category
      );
      setCurrentCategory(newCategory);
      setShowCategoryIntro(false);
      setError(null);
      return true;
    }
    return false;
  }, []);

  /**
   * Calcular progreso por categoría
   */
  const getCategoryProgress = useCallback(() => {
    const progress = {};
    
    Object.values(LEADERSHIP_CATEGORIES).forEach(category => {
      const categoryQuestions = QUESTION_BANK.filter(q => q.category === category.id);
      const answeredQuestions = categoryQuestions.filter(q => answers[q.id]);
      
      progress[category.id] = {
        total: categoryQuestions.length,
        answered: answeredQuestions.length,
        percentage: (answeredQuestions.length / categoryQuestions.length) * 100
      };
    });

    return progress;
  }, [answers]);

  /**
   * Calcular progreso total
   */
  const getOverallProgress = useCallback(() => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = QUESTION_BANK.length;
    
    return {
      answered: answeredCount,
      total: totalCount,
      percentage: (answeredCount / totalCount) * 100,
      isComplete: answeredCount === totalCount
    };
  }, [answers]);

  /**
   * Validar si la evaluación está completa
   */
  const isEvaluationComplete = useCallback(() => {
    return Object.keys(answers).length === QUESTION_BANK.length;
  }, [answers]);

  /**
   * Enviar evaluación
   */
  const submitEvaluation = useCallback(async () => {
    if (!isEvaluationComplete()) {
      setError('Debes completar todas las preguntas antes de enviar');
      return { success: false, error: 'Evaluación incompleta' };
    }

    setIsLoading(true);
    setError(null);

    try {
      dlog('[EvaluationContext] Submitting evaluation');

      // Calcular resultados localmente
      const { calculateResults } = await import('../services/evaluationService');
      const results = calculateResults(answers);

      const submittedEvaluation = {
        ...evaluation,
        status: 'completed',
        submittedAt: new Date().toISOString(),
        answers,
        results
      };

      setEvaluation(submittedEvaluation);

      // Limpiar localStorage
      localStorage.removeItem('evaluation_draft');

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
  }, [evaluation, answers, isEvaluationComplete]);

  /**
   * Reiniciar evaluación
   */
  const resetEvaluation = useCallback(() => {
    setEvaluation(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentCategory(null);
    setError(null);
    setLastSaved(null);
    setShowCategoryIntro(true);
    localStorage.removeItem('evaluation_draft');
    dlog('[EvaluationContext] Evaluation reset');
  }, []);

  /**
   * Obtener pregunta actual
   */
  const getCurrentQuestion = useCallback(() => {
    return QUESTION_BANK[currentQuestionIndex];
  }, [currentQuestionIndex]);

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

  // Cargar draft al montar si existe
  useEffect(() => {
    if (user && !evaluation) {
      loadDraftEvaluation();
    }
  }, [user, evaluation, loadDraftEvaluation]);

  const value = {
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
    loadDraftEvaluation,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitEvaluation,
    resetEvaluation,
    setShowCategoryIntro,
    setViewMode,

    // Helpers
    getCurrentQuestion,
    getCategoryProgress,
    getOverallProgress,
    isEvaluationComplete,
    hasAnswer,
    getAnswer,

    // Constantes
    totalQuestions: QUESTION_BANK.length,
    categories: LEADERSHIP_CATEGORIES
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export default EvaluationContext;
