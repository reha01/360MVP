/**
 * TestPreview - Visualizador de Test
 * 
 * Muestra una vista previa EXACTA del test tal como lo verán los evaluadores
 * - Navegación pregunta por pregunta
 * - Validación obligatoria
 * - Auto-avance al responder
 * - Diseño minimalista estilo Apple
 */

import React, { useState, useEffect } from 'react';
import './TestPreview.css';

const TestPreview = ({ testDefinition, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState({});

  console.log('[TestPreview] Rendering with testDefinition:', testDefinition);

  if (!testDefinition) {
    console.log('[TestPreview] No testDefinition, returning null');
    return null;
  }

  const { title, description, categories, questions, scale } = testDefinition;
  
  // Obtener pregunta actual
  const currentQuestion = questions[currentQuestionIndex];
  const currentCategory = categories.find(cat => cat.id === currentQuestion?.category);
  const currentSubdimension = currentCategory?.subdimensions?.find(
    sub => sub.id === currentQuestion?.subdimension
  );
  
  // Calcular progreso
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isAnswered = previewAnswers[currentQuestion?.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerChange = (questionId, value) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Auto-avance después de seleccionar (con pequeño delay para feedback visual)
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 400);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    // Solo permitir avanzar si la pregunta actual está respondida
    if (isAnswered && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleFinish = () => {
    alert('¡Vista previa completada! Este es el flujo exacto que verán los evaluadores.');
    onClose();
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="test-preview-modal">
      <div className="test-preview-overlay" onClick={onClose}></div>
      
      <div className="test-preview-container">
        {/* Close Button - Minimalista */}
        <button 
          className="test-preview-close" 
          onClick={onClose}
          title="Cerrar vista previa"
        >
          ✕
        </button>

        {/* Progress Bar - Minimalista */}
        <div className="test-preview-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
        </div>

        {/* Content - Minimalista */}
        <div className="test-preview-content">
          
          {/* Context Info - Título, Categoría, Subdimensión */}
          <div className="preview-context-info">
            <div className="context-title">{title}</div>
            <div className="context-breadcrumb">
              {currentCategory?.name}
              {currentSubdimension?.description && (
                <span className="context-separator">→</span>
              )}
              {currentSubdimension?.description && (
                <span className="context-subdimension">{currentSubdimension.description}</span>
              )}
            </div>
          </div>

          {/* Question - Una sola pregunta visible (estilo Apple) */}
          <div className="preview-question-container">
            <h1 className="question-text-main">
              {currentQuestion.text}
            </h1>

            {currentQuestion.help && (
              <p className="question-help-text">
                {currentQuestion.help}
              </p>
            )}

            {/* Scale Options - Minimalista */}
            <div className="question-scale-modern">
              {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                const value = scale.min + i;
                const isSelected = previewAnswers[currentQuestion.id] === value;
                
                return (
                  <button
                    key={value}
                    className={`scale-option-modern ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <span className="scale-value-modern">{value}</span>
                    {scale.labels && scale.labels[value] && (
                      <span className="scale-label-modern">{scale.labels[value]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Navigation - Minimalista */}
        <div className="test-preview-footer">
          <button
            className="btn-nav-minimal btn-prev-minimal"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ←
          </button>

          <button
            className="btn-nav-minimal btn-next-minimal"
            onClick={isLastQuestion ? handleFinish : handleNextQuestion}
            disabled={!isAnswered}
            title={!isAnswered ? 'Debes responder la pregunta para continuar' : ''}
          >
            {isLastQuestion ? '✓' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPreview;

