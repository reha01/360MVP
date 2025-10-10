/**
 * EvaluationWizard - Componente principal del flujo de evaluación
 * 
 * Orquesta:
 * - Context de evaluación
 * - Navegación entre preguntas
 * - Guardado de respuestas
 * - Indicadores de progreso
 * - Transiciones entre categorías
 */

import React, { useState, useEffect } from 'react';
import Question from './Question';
import QuestionNavigator from './QuestionNavigator';
import ProgressBar from './ProgressBar';
import { LEADERSHIP_CATEGORIES } from '../constants/questionBank';
import './EvaluationWizard.css';

// Hook que detecta automáticamente qué contexto usar
const useEvaluationContext = () => {
  try {
    // Intentar usar EvaluationContextV2 primero (si TEST_CATALOG está activo)
    const { useEvaluation: useEvaluationV2 } = require('../context/EvaluationContextV2.jsx');
    return useEvaluationV2();
  } catch (error) {
    // Fallback a EvaluationContext V1
    const { useEvaluation } = require('../context/EvaluationContext.jsx');
    return useEvaluation();
  }
};

const EvaluationWizard = ({ onComplete }) => {
  const {
    evaluation,
    currentQuestionIndex,
    currentCategory,
    showCategoryIntro,
    isLoading,
    error,
    lastSaved,
    startEvaluation,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitEvaluation,
    getCurrentQuestion,
    getCategoryProgress,
    getOverallProgress,
    isEvaluationComplete,
    hasAnswer,
    getAnswer,
    setShowCategoryIntro
  } = useEvaluationContext();

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = getCurrentQuestion();
  const overallProgress = getOverallProgress();
  const categoryProgress = getCategoryProgress();
  const isLastQuestion = currentQuestionIndex === overallProgress.total - 1;
  const currentAnswer = currentQuestion ? getAnswer(currentQuestion.id) : null;

  // Iniciar evaluación si no existe
  useEffect(() => {
    if (!evaluation) {
      startEvaluation();
    }
  }, [evaluation, startEvaluation]);

  /**
   * Manejar respuesta de pregunta
   */
  const handleAnswer = (questionId, value) => {
    saveAnswer(questionId, value);
    setShowValidation(false);
  };

  /**
   * Navegar a la siguiente pregunta
   */
  const handleNext = () => {
    if (!hasAnswer(currentQuestion.id)) {
      setShowValidation(true);
      return;
    }

    const success = nextQuestion();
    if (success) {
      setShowValidation(false);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Navegar a la pregunta anterior
   */
  const handlePrevious = () => {
    const success = previousQuestion();
    if (success) {
      setShowValidation(false);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Enviar evaluación
   */
  const handleSubmit = async () => {
    if (!isEvaluationComplete()) {
      alert('Por favor completa todas las preguntas antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitEvaluation();
      
      if (result.success) {
        // Notificar al componente padre
        if (onComplete) {
          onComplete(result.evaluationId);
        }
      } else {
        alert('Error al enviar la evaluación. Por favor intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      alert('Error al enviar la evaluación. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cerrar intro de categoría
   */
  const handleCloseCategoryIntro = () => {
    setShowCategoryIntro(false);
  };

  // Loading state
  if (isLoading || !currentQuestion) {
    return (
      <div className="wizard-loading">
        <div className="spinner-large" />
        <p>Cargando evaluación...</p>
      </div>
    );
  }

  // Category intro screen
  if (showCategoryIntro && currentCategory) {
    return (
      <div className="wizard-container">
        <CategoryIntro
          category={currentCategory}
          progress={categoryProgress[currentCategory.id]}
          onContinue={handleCloseCategoryIntro}
        />
      </div>
    );
  }

  return (
    <div className="wizard-container">
      {/* Header with save indicator */}
      <div className="wizard-header">
        <h2 className="wizard-title">Evaluación de Liderazgo 360°</h2>
        {lastSaved && (
          <div className="save-indicator">
            ✓ Guardado automáticamente
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar
        overallProgress={overallProgress}
        categoryProgress={categoryProgress}
        currentCategory={currentCategory}
        compact={false}
      />

      {/* Current Category Badge */}
      {currentCategory && (
        <div 
          className="current-category-badge"
          style={{ borderLeftColor: currentCategory.color }}
        >
          <span className="category-icon">{currentCategory.icon}</span>
          <div className="category-info">
            <span className="category-label">Categoría Actual</span>
            <span className="category-name">{currentCategory.name}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="wizard-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Question Component */}
      <Question
        question={currentQuestion}
        answer={currentAnswer}
        onAnswer={handleAnswer}
        showValidation={showValidation}
      />

      {/* Navigator */}
      <QuestionNavigator
        currentIndex={currentQuestionIndex}
        totalQuestions={overallProgress.total}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        canGoBack={currentQuestionIndex > 0}
        canGoForward={currentQuestionIndex < overallProgress.total - 1}
        isLastQuestion={isLastQuestion}
        hasAnswer={hasAnswer(currentQuestion.id)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

/**
 * CategoryIntro Component - Pantalla de introducción de categoría
 */
const CategoryIntro = ({ category, progress, onContinue }) => {
  return (
    <div className="category-intro">
      <div className="category-intro-content">
        <div 
          className="category-icon-large"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>

        <h2 className="category-title" style={{ color: category.color }}>
          {category.name}
        </h2>

        <p className="category-description">
          {category.description}
        </p>

        {progress && progress.answered > 0 && (
          <div className="category-progress-info">
            <p>
              Ya has respondido {progress.answered} de {progress.total} preguntas
              en esta categoría
            </p>
            <div className="category-progress-bar">
              <div 
                className="category-progress-fill"
                style={{ 
                  width: `${progress.percentage}%`,
                  backgroundColor: category.color 
                }}
              />
            </div>
          </div>
        )}

        <button 
          className="category-continue-button"
          onClick={onContinue}
          style={{ backgroundColor: category.color }}
        >
          {progress && progress.answered > 0 ? 'Continuar' : 'Comenzar'}
        </button>
      </div>
    </div>
  );
};

export default EvaluationWizard;
