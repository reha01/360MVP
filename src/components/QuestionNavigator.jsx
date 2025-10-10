/**
 * QuestionNavigator Component - Navegación entre preguntas
 * 
 * Proporciona:
 * - Botones Anterior/Siguiente
 * - Botón de Enviar (al final)
 * - Información de posición actual
 * - Validación antes de avanzar
 */

import React, { useState } from 'react';
import './QuestionNavigator.css';

const QuestionNavigator = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  canGoBack = true,
  canGoForward = true,
  isLastQuestion = false,
  hasAnswer = false,
  isSubmitting = false
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNext = () => {
    if (!hasAnswer) {
      // Mostrar validación visual (será manejado por el componente padre)
      return;
    }
    onNext();
  };

  const handleSubmit = () => {
    if (!hasAnswer) {
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    onSubmit();
  };

  const cancelSubmit = () => {
    setShowConfirm(false);
  };

  const questionNumber = currentIndex + 1;
  const progressPercentage = ((questionNumber) / totalQuestions) * 100;

  return (
    <div className="question-navigator">
      {/* Progress indicator */}
      <div className="navigator-progress">
        <span className="progress-text">
          Pregunta {questionNumber} de {totalQuestions}
        </span>
        <div className="progress-mini-bar">
          <div 
            className="progress-mini-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="navigator-buttons">
        <button
          className="nav-button nav-button-prev"
          onClick={onPrevious}
          disabled={!canGoBack || isSubmitting}
          aria-label="Pregunta anterior"
        >
          <span className="button-icon">←</span>
          <span className="button-text">Anterior</span>
        </button>

        {!isLastQuestion ? (
          <button
            className={`nav-button nav-button-next ${!hasAnswer ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={!canGoForward || isSubmitting}
            aria-label="Siguiente pregunta"
          >
            <span className="button-text">Siguiente</span>
            <span className="button-icon">→</span>
          </button>
        ) : (
          <button
            className={`nav-button nav-button-submit ${!hasAnswer ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label="Enviar evaluación"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span className="button-text">Enviando...</span>
              </>
            ) : (
              <>
                <span className="button-text">Enviar Evaluación</span>
                <span className="button-icon">✓</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-modal-overlay" onClick={cancelSubmit}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <h3>¿Enviar Evaluación?</h3>
            </div>
            <div className="confirm-body">
              <p>
                Estás a punto de enviar tu evaluación. Una vez enviada:
              </p>
              <ul>
                <li>No podrás modificar tus respuestas</li>
                <li>Se generará tu informe de liderazgo</li>
                <li>Recibirás los resultados inmediatamente</li>
              </ul>
              <p className="confirm-question">
                ¿Estás seguro de que deseas continuar?
              </p>
            </div>
            <div className="confirm-actions">
              <button
                className="confirm-button confirm-cancel"
                onClick={cancelSubmit}
              >
                Revisar respuestas
              </button>
              <button
                className="confirm-button confirm-submit"
                onClick={confirmSubmit}
              >
                Sí, enviar evaluación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!hasAnswer && (
        <div className="navigator-hint">
          💡 Selecciona una respuesta para continuar
        </div>
      )}
    </div>
  );
};

export default QuestionNavigator;
