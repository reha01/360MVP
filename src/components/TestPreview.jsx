/**
 * TestPreview - Visualizador de Test
 * 
 * Muestra una vista previa completa del test tal como lo verán los evaluadores
 */

import React, { useState } from 'react';
import './TestPreview.css';

const TestPreview = ({ testDefinition, onClose }) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState({});

  if (!testDefinition) {
    return null;
  }

  const { title, description, categories, questions, scale } = testDefinition;
  const currentCategory = categories[currentCategoryIndex];

  // Obtener preguntas de la categoría actual
  const currentCategoryQuestions = questions.filter(
    q => q.category === currentCategory.id
  );

  // Agrupar preguntas por subdimensión
  const questionsBySubdimension = {};
  currentCategory.subdimensions?.forEach(subdim => {
    questionsBySubdimension[subdim.id] = currentCategoryQuestions.filter(
      q => q.subdimension === subdim.id
    );
  });

  const handleAnswerChange = (questionId, value) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handlePrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
  };

  const getTotalQuestions = () => {
    return questions.length;
  };

  const getAnsweredQuestions = () => {
    return Object.keys(previewAnswers).length;
  };

  return (
    <div className="test-preview-modal">
      <div className="test-preview-overlay" onClick={onClose}></div>
      
      <div className="test-preview-container">
        {/* Header */}
        <div className="test-preview-header">
          <div className="test-preview-header-content">
            <div className="test-preview-badge">Vista Previa</div>
            <h2 className="test-preview-title">{title}</h2>
            {description && (
              <p className="test-preview-description">{description}</p>
            )}
            <div className="test-preview-meta">
              <span className="meta-item">
                📊 {categories.length} Categorías
              </span>
              <span className="meta-item">
                ❓ {getTotalQuestions()} Preguntas
              </span>
              <span className="meta-item">
                📈 Escala {scale.min}-{scale.max}
              </span>
            </div>
          </div>
          <button 
            className="test-preview-close" 
            onClick={onClose}
            title="Cerrar vista previa"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="test-preview-progress">
          <div className="progress-info">
            <span className="progress-text">
              Categoría {currentCategoryIndex + 1} de {categories.length}
            </span>
            <span className="progress-percentage">
              {Math.round(((currentCategoryIndex + 1) / categories.length) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${((currentCategoryIndex + 1) / categories.length) * 100}%`,
                backgroundColor: currentCategory.color || '#3b82f6'
              }}
            />
          </div>
        </div>

        {/* Category Navigation */}
        <div className="test-preview-category-nav">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              className={`category-nav-item ${index === currentCategoryIndex ? 'active' : ''} ${index < currentCategoryIndex ? 'completed' : ''}`}
              onClick={() => setCurrentCategoryIndex(index)}
              style={{
                borderColor: index === currentCategoryIndex ? cat.color : '#e5e7eb'
              }}
            >
              <span 
                className="category-nav-dot"
                style={{ backgroundColor: cat.color }}
              />
              <span className="category-nav-name">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="test-preview-content">
          {/* Category Header */}
          <div 
            className="preview-category-header"
            style={{ borderColor: currentCategory.color }}
          >
            <div className="category-header-icon" style={{ backgroundColor: currentCategory.color }}>
              <span className="category-icon">📋</span>
            </div>
            <div className="category-header-info">
              <h3 className="category-header-title" style={{ color: currentCategory.color }}>
                {currentCategory.name}
              </h3>
              {currentCategory.description && (
                <p className="category-header-description">
                  {currentCategory.description}
                </p>
              )}
              <div className="category-header-stats">
                <span className="stat-item">
                  {currentCategoryQuestions.length} preguntas
                </span>
                {currentCategory.subdimensions && currentCategory.subdimensions.length > 0 && (
                  <span className="stat-item">
                    {currentCategory.subdimensions.length} subdimensiones
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Questions by Subdimension */}
          <div className="preview-questions-container">
            {currentCategory.subdimensions?.map((subdimension, subIndex) => {
              const subdimQuestions = questionsBySubdimension[subdimension.id] || [];
              
              if (subdimQuestions.length === 0) return null;

              return (
                <div key={subdimension.id} className="preview-subdimension-section">
                  {/* Subdimension Header */}
                  {currentCategory.subdimensions.length > 1 && (
                    <div className="preview-subdimension-header">
                      <div className="subdimension-header-content">
                        <h4 className="subdimension-title">
                          {subdimension.name}
                        </h4>
                        {subdimension.description && (
                          <p className="subdimension-description">
                            {subdimension.description}
                          </p>
                        )}
                      </div>
                      {subdimension.weight > 1 && (
                        <div className="subdimension-weight-badge">
                          Peso: {subdimension.weight}x
                        </div>
                      )}
                    </div>
                  )}

                  {/* Questions */}
                  {subdimQuestions.map((question, qIndex) => (
                    <div 
                      key={question.id} 
                      className={`preview-question-card ${question.isNegative ? 'negative-question' : 'positive-question'}`}
                    >
                      <div className="question-header">
                        <div className="question-number">
                          Pregunta {qIndex + 1}
                        </div>
                        <div className="question-badges">
                          {question.weight > 1 && (
                            <span className="question-weight-badge">
                              Peso {question.weight}x
                            </span>
                          )}
                          {question.isNegative && (
                            <span className="question-negative-badge" title="Pregunta negativa (inversión de escala)">
                              ⚠️ Negativa
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="question-text">{question.text}</p>

                      {question.help && (
                        <p className="question-help">💡 {question.help}</p>
                      )}

                      {/* Scale Options */}
                      <div className="question-scale">
                        {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                          const value = scale.min + i;
                          const isSelected = previewAnswers[question.id] === value;
                          
                          return (
                            <button
                              key={value}
                              className={`scale-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleAnswerChange(question.id, value)}
                              style={{
                                backgroundColor: isSelected ? currentCategory.color : 'white',
                                borderColor: isSelected ? currentCategory.color : '#d1d5db',
                                color: isSelected ? 'white' : '#374151'
                              }}
                            >
                              <span className="scale-value">{value}</span>
                              {scale.labels && scale.labels[value] && (
                                <span className="scale-label">{scale.labels[value]}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="test-preview-footer">
          <button
            className="btn-preview-nav btn-prev"
            onClick={handlePrevCategory}
            disabled={currentCategoryIndex === 0}
          >
            ← Anterior
          </button>

          <div className="preview-footer-info">
            <span className="footer-category">
              {currentCategory.name}
            </span>
            <span className="footer-questions">
              {currentCategoryQuestions.length} preguntas
            </span>
          </div>

          <button
            className="btn-preview-nav btn-next"
            onClick={handleNextCategory}
            disabled={currentCategoryIndex === categories.length - 1}
            style={{
              backgroundColor: currentCategoryIndex === categories.length - 1 ? '#10b981' : currentCategory.color
            }}
          >
            {currentCategoryIndex === categories.length - 1 ? (
              <>Finalizar Vista Previa ✓</>
            ) : (
              <>Siguiente →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPreview;

