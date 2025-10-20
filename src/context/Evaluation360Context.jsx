/**
 * Evaluation360Context - Gestión de Estado para Evaluaciones 360°
 * 
 * Gestiona:
 * - Estado actual de la evaluación 360°
 * - Respuestas del evaluador
 * - Progreso por categorías
 * - Navegación entre preguntas
 * - Guardado automático
 * - Validación de respuestas
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import evaluatorAssignmentService from '../services/evaluatorAssignmentService';
import evaluation360ResponseService from '../services/evaluation360ResponseService';
import { 
  createEvaluation360ResponseModel,
  createAnswerModel,
  validateAnswer,
  validateEvaluation360Response,
  calculateProgress,
  RESPONSE_STATUS,
  QUESTION_TYPES
} from '../models/Evaluation360Response';
import { dlog, dwarn } from '../utils/debug';

const Evaluation360Context = createContext();

export const useEvaluation360 = () => {
  const context = useContext(Evaluation360Context);
  if (!context) {
    throw new Error('useEvaluation360 must be used within Evaluation360Provider');
  }
  return context;
};

export const Evaluation360Provider = ({ children }) => {
  const { token } = useParams();
  const location = useLocation();
  
  // Estado principal
  const [assignment, setAssignment] = useState(null);
  const [response, setResponse] = useState(null);
  const [testDefinition, setTestDefinition] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Estado de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Estado de navegación
  const [viewMode, setViewMode] = useState('category'); // 'category' | 'linear'
  const [showCategoryIntro, setShowCategoryIntro] = useState(true);
  
  // Cargar datos iniciales
  useEffect(() => {
    if (token) {
      loadEvaluationData();
    }
  }, [token]);
  
  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!autoSaveEnabled || !response || Object.keys(answers).length === 0) {
      return;
    }
    
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveProgress();
      }
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [answers, autoSaveEnabled, response]);
  
  /**
   * Cargar datos de la evaluación
   */
  const loadEvaluationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar token y obtener asignación
      const assignmentData = await evaluatorAssignmentService.validateToken(token);
      setAssignment(assignmentData);
      
      // Obtener o crear respuesta
      let responseData = await evaluation360ResponseService.getResponseByAssignment(
        assignmentData.orgId, 
        assignmentData.id
      );
      
      if (!responseData) {
        // Crear nueva respuesta
        responseData = await evaluation360ResponseService.createEvaluation360Response(
          assignmentData.orgId,
          {
            assignmentId: assignmentData.id,
            testId: assignmentData.testId,
            testVersion: assignmentData.testVersion,
            testSnapshot: assignmentData.testSnapshot
          },
          'system'
        );
      }
      
      setResponse(responseData);
      setAnswers(responseData.answers || {});
      
      // Obtener definición del test
      if (responseData.testSnapshot) {
        setTestDefinition(responseData.testSnapshot);
      } else {
        // Cargar test definition (en implementación real)
        console.warn('[Evaluation360] Test snapshot not found, using mock data');
        setTestDefinition(createMockTestDefinition());
      }
      
      // Establecer categoría actual
      if (testDefinition && testDefinition.categories.length > 0) {
        setCurrentCategory(testDefinition.categories[0]);
      }
      
      dlog('[Evaluation360] Data loaded:', {
        assignmentId: assignmentData.id,
        responseId: responseData.responseId,
        evaluatorType: assignmentData.evaluatorType
      });
      
    } catch (err) {
      console.error('[Evaluation360] Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Guardar progreso
   */
  const saveProgress = useCallback(async () => {
    if (!response || !assignment) return;
    
    try {
      setIsSaving(true);
      
      // Calcular progreso
      const progress = calculateProgress({ ...response, answers }, testDefinition);
      
      // Actualizar respuesta
      await evaluation360ResponseService.updateEvaluation360Response(
        assignment.orgId,
        response.responseId,
        {
          answers,
          answeredQuestions: progress.answeredQuestions,
          completionRate: progress.completionRate,
          status: RESPONSE_STATUS.IN_PROGRESS
        },
        'system'
      );
      
      setLastSaved(new Date());
      dlog('[Evaluation360] Progress saved');
      
    } catch (err) {
      console.error('[Evaluation360] Error saving progress:', err);
      dwarn('[Evaluation360] Failed to save progress:', err.message);
    } finally {
      setIsSaving(false);
    }
  }, [response, assignment, answers, testDefinition]);
  
  /**
   * Guardar respuesta individual
   */
  const saveAnswer = useCallback(async (questionId, answerData) => {
    if (!response || !assignment) return;
    
    try {
      // Crear respuesta
      const answer = createAnswerModel({
        questionId,
        ...answerData,
        answeredAt: new Date()
      });
      
      // Validar respuesta
      const question = testDefinition?.questions.find(q => q.id === questionId);
      if (question) {
        const validation = validateAnswer(answer, question);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Actualizar estado local
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      
      // Guardar en servidor
      await evaluation360ResponseService.saveAnswer(
        assignment.orgId,
        response.responseId,
        questionId,
        answerData,
        'system'
      );
      
      dlog('[Evaluation360] Answer saved:', questionId);
      
    } catch (err) {
      console.error('[Evaluation360] Error saving answer:', err);
      throw err;
    }
  }, [response, assignment, testDefinition]);
  
  /**
   * Completar evaluación
   */
  const completeEvaluation = useCallback(async () => {
    if (!response || !assignment) return;
    
    try {
      setIsSaving(true);
      
      // Validar evaluación completa
      const validation = validateEvaluation360Response({ ...response, answers }, testDefinition);
      if (!validation.isValid) {
        throw new Error(`Evaluation not complete: ${validation.errors.join(', ')}`);
      }
      
      // Completar evaluación
      const completedResponse = await evaluation360ResponseService.completeEvaluation360Response(
        assignment.orgId,
        response.responseId,
        'system'
      );
      
      setResponse(completedResponse);
      dlog('[Evaluation360] Evaluation completed');
      
      return completedResponse;
      
    } catch (err) {
      console.error('[Evaluation360] Error completing evaluation:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [response, assignment, answers, testDefinition]);
  
  /**
   * Enviar evaluación
   */
  const submitEvaluation = useCallback(async () => {
    if (!response || !assignment) return;
    
    try {
      setIsSaving(true);
      
      // Completar evaluación primero
      const completedResponse = await completeEvaluation();
      
      // Enviar evaluación
      const submittedResponse = await evaluation360ResponseService.submitEvaluation360Response(
        assignment.orgId,
        response.responseId,
        'system'
      );
      
      setResponse(submittedResponse);
      dlog('[Evaluation360] Evaluation submitted');
      
      return submittedResponse;
      
    } catch (err) {
      console.error('[Evaluation360] Error submitting evaluation:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [response, assignment, completeEvaluation]);
  
  /**
   * Navegación entre preguntas
   */
  const goToQuestion = useCallback((questionIndex) => {
    if (!testDefinition) return;
    
    const question = testDefinition.questions[questionIndex];
    if (question) {
      setCurrentQuestionIndex(questionIndex);
      setCurrentCategory(question.category);
    }
  }, [testDefinition]);
  
  const goToNextQuestion = useCallback(() => {
    if (!testDefinition) return;
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < testDefinition.questions.length) {
      goToQuestion(nextIndex);
    }
  }, [currentQuestionIndex, testDefinition, goToQuestion]);
  
  const goToPreviousQuestion = useCallback(() => {
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      goToQuestion(prevIndex);
    }
  }, [currentQuestionIndex, goToQuestion]);
  
  /**
   * Navegación entre categorías
   */
  const goToCategory = useCallback((categoryId) => {
    if (!testDefinition) return;
    
    const category = testDefinition.categories.find(c => c.id === categoryId);
    if (category) {
      setCurrentCategory(category);
      setShowCategoryIntro(true);
    }
  }, [testDefinition]);
  
  /**
   * Obtener progreso
   */
  const getProgress = useCallback(() => {
    if (!testDefinition) {
      return { completionRate: 0, answeredQuestions: 0, totalQuestions: 0 };
    }
    
    return calculateProgress({ ...response, answers }, testDefinition);
  }, [response, answers, testDefinition]);
  
  /**
   * Obtener preguntas de la categoría actual
   */
  const getCurrentCategoryQuestions = useCallback(() => {
    if (!testDefinition || !currentCategory) return [];
    
    return testDefinition.questions.filter(q => q.category.id === currentCategory.id);
  }, [testDefinition, currentCategory]);
  
  /**
   * Verificar si la evaluación está completa
   */
  const isComplete = useCallback(() => {
    if (!testDefinition) return false;
    
    const requiredQuestions = testDefinition.questions.filter(q => q.required);
    const answeredQuestions = Object.keys(answers);
    
    return requiredQuestions.every(question => 
      answeredQuestions.includes(question.id)
    );
  }, [testDefinition, answers]);
  
  /**
   * Obtener tiempo transcurrido
   */
  const getTimeSpent = useCallback(() => {
    if (!response || !response.startedAt) return 0;
    
    const startTime = new Date(response.startedAt);
    const endTime = response.completedAt ? new Date(response.completedAt) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    
    return Math.round(diffMs / (1000 * 60)); // en minutos
  }, [response]);
  
  // Crear mock test definition para desarrollo
  const createMockTestDefinition = () => {
    return {
      id: 'mock-test',
      name: 'Evaluación de Liderazgo 360°',
      version: '1.0',
      categories: [
        {
          id: 'vision',
          name: 'Visión Estratégica',
          description: 'Capacidad para definir y comunicar una visión clara',
          questions: [
            {
              id: 'vision-1',
              text: 'Define claramente los objetivos y metas del equipo',
              type: QUESTION_TYPES.LIKERT,
              required: true,
              scale: { min: 1, max: 5 }
            },
            {
              id: 'vision-2',
              text: 'Comunica efectivamente la visión estratégica',
              type: QUESTION_TYPES.LIKERT,
              required: true,
              scale: { min: 1, max: 5 }
            }
          ]
        },
        {
          id: 'communication',
          name: 'Comunicación',
          description: 'Habilidades de comunicación efectiva',
          questions: [
            {
              id: 'comm-1',
              text: 'Escucha activamente a los miembros del equipo',
              type: QUESTION_TYPES.LIKERT,
              required: true,
              scale: { min: 1, max: 5 }
            },
            {
              id: 'comm-2',
              text: 'Proporciona feedback constructivo y oportuno',
              type: QUESTION_TYPES.LIKERT,
              required: true,
              scale: { min: 1, max: 5 }
            }
          ]
        }
      ],
      questions: [
        {
          id: 'vision-1',
          text: 'Define claramente los objetivos y metas del equipo',
          type: QUESTION_TYPES.LIKERT,
          required: true,
          scale: { min: 1, max: 5 },
          category: { id: 'vision', name: 'Visión Estratégica' }
        },
        {
          id: 'vision-2',
          text: 'Comunica efectivamente la visión estratégica',
          type: QUESTION_TYPES.LIKERT,
          required: true,
          scale: { min: 1, max: 5 },
          category: { id: 'vision', name: 'Visión Estratégica' }
        },
        {
          id: 'comm-1',
          text: 'Escucha activamente a los miembros del equipo',
          type: QUESTION_TYPES.LIKERT,
          required: true,
          scale: { min: 1, max: 5 },
          category: { id: 'communication', name: 'Comunicación' }
        },
        {
          id: 'comm-2',
          text: 'Proporciona feedback constructivo y oportuno',
          type: QUESTION_TYPES.LIKERT,
          required: true,
          scale: { min: 1, max: 5 },
          category: { id: 'communication', name: 'Comunicación' }
        }
      ]
    };
  };
  
  const value = {
    // Estado
    assignment,
    response,
    testDefinition,
    answers,
    currentQuestionIndex,
    currentCategory,
    
    // UI State
    isLoading,
    isSaving,
    error,
    lastSaved,
    autoSaveEnabled,
    
    // Navegación
    viewMode,
    showCategoryIntro,
    
    // Acciones
    saveAnswer,
    saveProgress,
    completeEvaluation,
    submitEvaluation,
    
    // Navegación
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToCategory,
    setViewMode,
    setShowCategoryIntro,
    
    // Utilidades
    getProgress,
    getCurrentCategoryQuestions,
    isComplete,
    getTimeSpent,
    setAutoSaveEnabled,
    setError
  };
  
  return (
    <Evaluation360Context.Provider value={value}>
      {children}
    </Evaluation360Context.Provider>
  );
};
