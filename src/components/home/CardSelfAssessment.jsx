// src/components/home/CardSelfAssessment.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';

/**
 * CardSelfAssessment - Card de autoevaluación con estado y progreso
 */
const CardSelfAssessment = () => {
  const { profile, loading } = useUserProfile();

  // Mock data - TODO: obtener datos reales de autoevaluación
  const mockSelfData = {
    status: 'not_started', // not_started, in_progress, completed
    progress: 0, // 0-100
    lastTemplate: 'Liderazgo Ejecutivo',
    completedAt: null,
    canRepeat: true
  };

  const getStatusInfo = () => {
    switch (mockSelfData.status) {
      case 'in_progress':
        return {
          label: 'En curso',
          icon: '⏳',
          description: `${mockSelfData.progress}% completado`,
          action: 'Continuar',
          actionUrl: '/evaluation?continue=true',
          color: '#0A84FF'
        };
      case 'completed':
        return {
          label: 'Completado',
          icon: '✅',
          description: `Completado ${mockSelfData.completedAt ? 'hace 2 días' : 'recientemente'}`,
          action: 'Repetir evaluación',
          actionUrl: '/evaluation?repeat=true',
          color: '#28A745'
        };
      default:
        return {
          label: 'No iniciado',
          icon: '🎯',
          description: 'Comienza tu evaluación personal',
          action: 'Comenzar',
          actionUrl: '/evaluation',
          color: '#6C757D'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="card-self-assessment">
        <div className="card-self-assessment__skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-self-assessment">
      <div className="card-self-assessment__header">
        <div className="card-self-assessment__icon">
          {statusInfo.icon}
        </div>
        <div className="card-self-assessment__title-group">
          <h3 className="card-self-assessment__title">
            Mi Autodiagnóstico
          </h3>
          <div 
            className="card-self-assessment__status"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </div>
        </div>
      </div>

      <div className="card-self-assessment__content">
        <p className="card-self-assessment__description">
          {statusInfo.description}
        </p>

        {/* Progress bar for in-progress assessments */}
        {mockSelfData.status === 'in_progress' && (
          <div className="card-self-assessment__progress">
            <div className="progress-bar">
              <div 
                className="progress-bar__fill"
                style={{ 
                  width: `${mockSelfData.progress}%`,
                  backgroundColor: statusInfo.color 
                }}
              ></div>
            </div>
            <div className="progress-text">
              {mockSelfData.progress}% completado
            </div>
          </div>
        )}

        {/* Template selector link */}
        <div className="card-self-assessment__template">
          <span className="template-label">Plantilla actual:</span>
          <Link 
            to="/evaluation/templates" 
            className="template-link"
            aria-label="Cambiar plantilla de evaluación"
          >
            {mockSelfData.lastTemplate}
          </Link>
        </div>
      </div>

      <div className="card-self-assessment__footer">
        <Link 
          to={statusInfo.actionUrl}
          className="card-self-assessment__action"
          style={{ backgroundColor: statusInfo.color }}
        >
          {statusInfo.action}
        </Link>
      </div>

      <style jsx>{`
        .card-self-assessment {
          background-color: white;
          border: 1px solid #E6EAF0;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .card-self-assessment:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #D1D5DB;
        }

        .card-self-assessment__header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-self-assessment__icon {
          font-size: 32px;
          line-height: 1;
        }

        .card-self-assessment__title-group {
          flex: 1;
        }

        .card-self-assessment__title {
          font-size: 20px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .card-self-assessment__status {
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
        }

        .card-self-assessment__content {
          margin-bottom: 24px;
        }

        .card-self-assessment__description {
          font-size: 15px;
          color: #64748B;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .card-self-assessment__progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #F1F5F9;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-bar__fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }

        .card-self-assessment__template {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .template-label {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
        }

        .template-link {
          font-size: 14px;
          color: #0A84FF;
          text-decoration: none;
          font-weight: 500;
        }

        .template-link:hover {
          text-decoration: underline;
        }

        .card-self-assessment__footer {
          display: flex;
          justify-content: flex-start;
        }

        .card-self-assessment__action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          background-color: #0A84FF;
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .card-self-assessment__action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-self-assessment__action:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
        }

        /* Skeleton loading */
        .card-self-assessment__skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-header {
          height: 48px;
          background-color: #E6EAF0;
          border-radius: 12px;
        }

        .skeleton-content {
          height: 60px;
          background-color: #F1F5F9;
          border-radius: 8px;
        }

        .skeleton-button {
          height: 44px;
          width: 120px;
          background-color: #E6EAF0;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default CardSelfAssessment;
