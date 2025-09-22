// src/components/home/CardLeaderPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CardLeaderPanel - Panel exclusivo para líderes con snapshot de procesos organizacionales
 * Solo se muestra si isLeader=true y VITE_FEATURE_ORG=true
 */
const CardLeaderPanel = () => {
  // Mock data - TODO: obtener datos reales de analytics
  const mockLeaderData = {
    activeProcesses: 3,
    averageProgress: 67, // Porcentaje
    pendingTasks: 12,
    teamMembers: 25,
    completedEvaluations: 8,
    upcomingDeadlines: 2
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const progressColor = getProgressColor(mockLeaderData.averageProgress);

  return (
    <div className="card-leader-panel">
      <div className="card-leader-panel__header">
        <div className="card-leader-panel__icon">
          👨‍💼
        </div>
        <div className="card-leader-panel__title-group">
          <h3 className="card-leader-panel__title">
            Mis equipos
          </h3>
          <div className="card-leader-panel__subtitle">
            Panel de líder
          </div>
        </div>
      </div>

      <div className="card-leader-panel__content">
        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-item__value">
              {mockLeaderData.activeProcesses}
            </div>
            <div className="metric-item__label">
              Procesos activos
            </div>
          </div>

          <div className="metric-item">
            <div 
              className="metric-item__value"
              style={{ color: progressColor }}
            >
              {mockLeaderData.averageProgress}%
            </div>
            <div className="metric-item__label">
              Progreso promedio
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-item__value">
              {mockLeaderData.pendingTasks}
            </div>
            <div className="metric-item__label">
              Tareas pendientes
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-section__header">
            <span className="progress-section__label">
              Progreso del equipo
            </span>
            <span className="progress-section__percentage">
              {mockLeaderData.averageProgress}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar__fill"
              style={{ 
                width: `${mockLeaderData.averageProgress}%`,
                backgroundColor: progressColor
              }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="quick-stat__icon">👥</span>
            <span className="quick-stat__text">
              {mockLeaderData.teamMembers} miembros del equipo
            </span>
          </div>
          
          <div className="quick-stat">
            <span className="quick-stat__icon">✅</span>
            <span className="quick-stat__text">
              {mockLeaderData.completedEvaluations} evaluaciones completadas
            </span>
          </div>

          {mockLeaderData.upcomingDeadlines > 0 && (
            <div className="quick-stat quick-stat--warning">
              <span className="quick-stat__icon">⏰</span>
              <span className="quick-stat__text">
                {mockLeaderData.upcomingDeadlines} deadlines próximos
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card-leader-panel__footer">
        <div className="card-leader-panel__actions">
          <Link 
            to="/analytics"
            className="card-leader-panel__primary-action"
          >
            <span className="action-icon">📊</span>
            Abrir Dashboard Analytics
          </Link>
          
          <Link 
            to="/org/processes/create"
            className="card-leader-panel__secondary-action"
          >
            <span className="action-icon">➕</span>
            Crear proceso 360°
          </Link>
        </div>
      </div>

      <style jsx>{`
        .card-leader-panel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .card-leader-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          pointer-events: none;
        }

        .card-leader-panel:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
        }

        .card-leader-panel__header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .card-leader-panel__icon {
          font-size: 32px;
          line-height: 1;
        }

        .card-leader-panel__title-group {
          flex: 1;
        }

        .card-leader-panel__title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .card-leader-panel__subtitle {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 500;
        }

        .card-leader-panel__content {
          position: relative;
          z-index: 1;
          margin-bottom: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .metric-item {
          text-align: center;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .metric-item__value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 6px;
        }

        .metric-item__label {
          font-size: 11px;
          opacity: 0.9;
          line-height: 1.2;
        }

        .progress-section {
          margin-bottom: 20px;
        }

        .progress-section__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .progress-section__label {
          font-size: 14px;
          font-weight: 500;
        }

        .progress-section__percentage {
          font-size: 14px;
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar__fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .quick-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          opacity: 0.9;
        }

        .quick-stat--warning {
          opacity: 1;
          font-weight: 500;
        }

        .quick-stat__icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .card-leader-panel__footer {
          position: relative;
          z-index: 1;
        }

        .card-leader-panel__actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-leader-panel__primary-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .card-leader-panel__primary-action:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .card-leader-panel__secondary-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          color: white;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .card-leader-panel__secondary-action:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .action-icon {
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .metric-item__value {
            font-size: 20px;
          }

          .metric-item__label {
            font-size: 10px;
          }

          .card-leader-panel__actions {
            gap: 10px;
          }

          .card-leader-panel__primary-action,
          .card-leader-panel__secondary-action {
            font-size: 13px;
            padding: 10px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CardLeaderPanel;
