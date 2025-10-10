/**
 * Question Component - Renderiza una pregunta de evaluación
 * 
 * Soporta diferentes tipos de preguntas:
 * - Likert Scale (1-5)
 * - Multiple Choice
 * - Text Input
 */

import React, { useState, useEffect } from 'react';
import { LIKERT_SCALE } from '../constants/questionBank';
import './Question.css';

const Question = ({ 
  question, 
  answer, 
  onAnswer, 
  showValidation = false 
}) => {
  const [selectedValue, setSelectedValue] = useState(answer || null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setSelectedValue(answer || null);
  }, [answer, question.id]);

  const handleSelect = (value) => {
    setSelectedValue(value);
    onAnswer(question.id, value);
  };

  const renderLikertScale = () => {
    return (
      <div className="question-likert">
        <div className="likert-options">
          {LIKERT_SCALE.map((option) => (
            <button
              key={option.value}
              className={`likert-button ${
                selectedValue === option.value ? 'selected' : ''
              } ${showValidation && !selectedValue ? 'validation-error' : ''}`}
              onClick={() => handleSelect(option.value)}
              aria-label={`${option.label} - ${option.value}`}
              title={option.description}
            >
              <span className="likert-value">{option.value}</span>
              <span className="likert-label">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Help toggle */}
        <button
          className="help-toggle"
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Ver descripción de opciones"
        >
          {showHelp ? '▼ Ocultar ayuda' : '▶ Ver descripción de opciones'}
        </button>

        {/* Help descriptions */}
        {showHelp && (
          <div className="likert-help">
            {LIKERT_SCALE.map((option) => (
              <div key={option.value} className="help-item">
                <strong>{option.value} - {option.label}:</strong>{' '}
                {option.description}
              </div>
            ))}
          </div>
        )}

        {showValidation && !selectedValue && (
          <div className="validation-message">
            Por favor selecciona una opción antes de continuar
          </div>
        )}
      </div>
    );
  };

  const renderMultipleChoice = () => {
    return (
      <div className="question-multiple-choice">
        {question.options?.map((option, index) => (
          <button
            key={index}
            className={`choice-button ${
              selectedValue === option.value ? 'selected' : ''
            }`}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  const renderTextInput = () => {
    return (
      <div className="question-text-input">
        <textarea
          className="text-answer"
          value={selectedValue || ''}
          onChange={(e) => handleSelect(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={4}
        />
      </div>
    );
  };

  const renderQuestionByType = () => {
    switch (question.type) {
      case 'likert':
        return renderLikertScale();
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'text':
        return renderTextInput();
      default:
        return renderLikertScale();
    }
  };

  if (!question) {
    return (
      <div className="question-container">
        <div className="question-error">
          No se pudo cargar la pregunta
        </div>
      </div>
    );
  }

  return (
    <div className="question-container">
      <div className="question-header">
        <h3 className="question-text">{question.text}</h3>
        {question.weight > 1 && (
          <span className="question-weight" title="Esta pregunta tiene mayor peso en el cálculo">
            ⭐ Importante
          </span>
        )}
      </div>

      <div className="question-body">
        {renderQuestionByType()}
      </div>
    </div>
  );
};

export default Question;
