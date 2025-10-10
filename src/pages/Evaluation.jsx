/**
 * Evaluation Page - Página de evaluación 360°
 * 
 * Contiene el wizard completo de evaluación con todas las preguntas
 * organizadas por categorías de liderazgo.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import EvaluationWizard from '../components/EvaluationWizard';
import { EvaluationProvider } from '../context/EvaluationContext.jsx';
import { EvaluationProvider as EvaluationProviderV2 } from '../context/EvaluationContextV2.jsx';
import { EvaluationProvider as EvaluationProviderSimple } from '../context/EvaluationContextSimple.jsx';
import { TEST_CATALOG } from '../lib/featureFlags';
import './Evaluation.css';

const Evaluation = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationId, setEvaluationId] = useState(null);

  // Extraer testId y version de params si están disponibles
  const { testId, version } = params;

  /**
   * Manejar completación de evaluación
   */
  const handleComplete = (evalId) => {
    setIsCompleted(true);
    setEvaluationId(evalId);
  };

  /**
   * Ver resultados
   */
  const handleViewResults = () => {
    if (evaluationId) {
      navigate(`${ROUTES.REPORTS}/${evaluationId}`);
    } else {
      navigate(ROUTES.REPORTS);
    }
  };

  /**
   * Volver al dashboard
   */
  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  // Si no hay testId/version y TEST_CATALOG está activo, mostrar selector
  if (TEST_CATALOG && !testId && !version) {
    return (
      <div className="evaluation-page">
        <div className="evaluation-header">
          <Link to={ROUTES.DASHBOARD} className="back-button">
            ← Volver al Dashboard
          </Link>
        </div>
        <div className="evaluation-content">
          <div className="test-selector">
            <h2>🚀 Evaluaciones 360°</h2>
            <p>¡Bienvenido al sistema de evaluaciones!</p>
            <div className="test-info">
              <div className="info-card">
                <h3>📊 Autoevaluación</h3>
                <p>Evalúa tus propias competencias y habilidades de liderazgo.</p>
                <Link to="/evaluations/leadership/v1" className="btn-primary">
                  Comenzar Autoevaluación
                </Link>
              </div>
              
              <div className="info-card">
                <h3>👥 Evaluación 360°</h3>
                <p>Recibe feedback de compañeros, superiores y colaboradores.</p>
                <button className="btn-secondary" disabled>
                  Próximamente
                </button>
              </div>
              
              <div className="info-card">
                <h3>⚙️ Administrar Tests</h3>
                <p>Crea y gestiona tests personalizados para tu organización.</p>
                <Link to="/admin/tests" className="btn-secondary">
                  Administrar Tests
                </Link>
              </div>
            </div>
            
            <div className="test-actions">
              <Link to={ROUTES.DASHBOARD} className="btn-link">
                ← Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Usar EvaluationProviderSimple temporalmente para evitar errores
  const Provider = EvaluationProviderSimple;
  const providerProps = { testId, version };

  return (
    <Provider {...providerProps}>
      <div className="evaluation-page">
        {/* Header */}
        <div className="evaluation-header">
          {!isCompleted && (
            <Link 
              to={ROUTES.DASHBOARD}
              className="back-button"
            >
              ← Volver al Dashboard
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="evaluation-content">
          {isCompleted ? (
            <CompletionScreen
              onViewResults={handleViewResults}
              onBackToDashboard={handleBackToDashboard}
            />
          ) : (
            <EvaluationWizard onComplete={handleComplete} />
          )}
        </div>
      </div>
    </Provider>
  );
};

/**
 * CompletionScreen - Pantalla de evaluación completada
 */
const CompletionScreen = ({ onViewResults, onBackToDashboard }) => {
  return (
    <div className="completion-screen">
      <div className="completion-content">
        <div className="success-icon">🎉</div>
        
        <h1 className="completion-title">
          ¡Evaluación Completada!
        </h1>
        
        <p className="completion-message">
          Felicitaciones por completar tu evaluación de liderazgo 360°.
          Tu compromiso con el desarrollo personal es admirable.
        </p>

        <div className="completion-info">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>Resultados Disponibles</h3>
            <p>Tu informe personalizado está listo para ser revisado</p>
          </div>

          <div className="info-card">
            <div className="info-icon">💡</div>
            <h3>Insights Personalizados</h3>
            <p>Descubre tus fortalezas y áreas de oportunidad</p>
          </div>

          <div className="info-card">
            <div className="info-icon">📈</div>
            <h3>Plan de Acción</h3>
            <p>Recomendaciones específicas para tu desarrollo</p>
          </div>
        </div>

        <div className="completion-actions">
          <button
            className="primary-action-button"
            onClick={onViewResults}
          >
            Ver Mis Resultados →
          </button>
          
          <button
            className="secondary-action-button"
            onClick={onBackToDashboard}
          >
            Volver al Dashboard
          </button>
        </div>

        <div className="completion-footer">
          <p className="footer-text">
            💾 Tus resultados han sido guardados y puedes acceder a ellos
            en cualquier momento desde tu dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
