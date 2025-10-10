/**
 * ProgressBar Component - Indicador visual de progreso de evaluación
 * 
 * Muestra:
 * - Progreso general (% completado)
 * - Progreso por categoría
 * - Número de preguntas respondidas
 */

import React from 'react';
import { LEADERSHIP_CATEGORIES } from '../constants/questionBank';
import './ProgressBar.css';

const ProgressBar = ({ 
  overallProgress, 
  categoryProgress, 
  currentCategory,
  compact = false 
}) => {
  const { answered, total, percentage } = overallProgress;

  const renderCompactView = () => (
    <div className="progress-bar-compact">
      <div className="progress-info">
        <span className="progress-label">Progreso</span>
        <span className="progress-count">{answered} / {total}</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="progress-percentage">{Math.round(percentage)}%</span>
    </div>
  );

  const renderFullView = () => (
    <div className="progress-bar-full">
      <div className="progress-header">
        <h3 className="progress-title">Tu Progreso</h3>
        <div className="progress-stats">
          <span className="stat-answered">{answered} respondidas</span>
          <span className="stat-divider">•</span>
          <span className="stat-remaining">{total - answered} restantes</span>
        </div>
      </div>

      {/* Barra de progreso general */}
      <div className="progress-overall">
        <div className="progress-track-large">
          <div 
            className="progress-fill-large"
            style={{ width: `${percentage}%` }}
          >
            <span className="progress-percentage-overlay">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progreso por categorías */}
      <div className="progress-categories">
        <h4 className="categories-title">Por Categoría</h4>
        <div className="categories-grid">
          {Object.values(LEADERSHIP_CATEGORIES).map((category) => {
            const catProgress = categoryProgress[category.id] || { answered: 0, total: 0, percentage: 0 };
            const isActive = currentCategory?.id === category.id;
            const isComplete = catProgress.answered === catProgress.total;

            return (
              <div 
                key={category.id}
                className={`category-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              >
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">
                      {catProgress.answered} / {catProgress.total}
                    </span>
                  </div>
                  {isComplete && (
                    <span className="category-check">✓</span>
                  )}
                </div>
                <div className="category-progress">
                  <div 
                    className="category-fill"
                    style={{ 
                      width: `${catProgress.percentage}%`,
                      backgroundColor: category.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational message */}
      {percentage > 0 && (
        <div className="progress-message">
          {getMotivationalMessage(percentage)}
        </div>
      )}
    </div>
  );

  return compact ? renderCompactView() : renderFullView();
};

/**
 * Mensaje motivacional basado en el progreso
 */
const getMotivationalMessage = (percentage) => {
  if (percentage === 100) {
    return '🎉 ¡Excelente! Has completado todas las preguntas';
  } else if (percentage >= 75) {
    return '🚀 ¡Casi terminas! Solo un poco más';
  } else if (percentage >= 50) {
    return '💪 ¡Vas por la mitad! Sigue adelante';
  } else if (percentage >= 25) {
    return '👍 ¡Buen progreso! Continúa así';
  } else if (percentage > 0) {
    return '🌟 ¡Excelente inicio! Cada pregunta cuenta';
  }
  return '';
};

export default ProgressBar;
