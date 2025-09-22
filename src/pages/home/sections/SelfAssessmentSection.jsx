// src/pages/home/sections/SelfAssessmentSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Progress } from '../../../components/ui';

/**
 * SelfAssessmentSection - Sección de autodiagnóstico limpia
 */
const SelfAssessmentSection = ({ profile }) => {
  // Mock data - TODO: obtener datos reales de autoevaluación
  const selfAssessment = {
    status: 'not_started', // not_started, in_progress, completed
    progress: 0,
    templateName: 'Liderazgo Ejecutivo',
    lastUpdated: null,
    canRepeat: true
  };

  const getStatusInfo = () => {
    switch (selfAssessment.status) {
      case 'in_progress':
        return {
          badge: { text: 'En curso', variant: 'primary' },
          title: 'Continúa tu evaluación',
          description: 'Tienes una autoevaluación en progreso. Continúa donde lo dejaste.',
          actionText: 'Continuar',
          actionUrl: '/evaluation?continue=true',
          showProgress: true
        };
      case 'completed':
        return {
          badge: { text: 'Completado', variant: 'success' },
          title: 'Evaluación completada',
          description: 'Has completado tu autoevaluación. Puedes repetirla cuando quieras.',
          actionText: 'Repetir evaluación',
          actionUrl: '/evaluation?repeat=true',
          showProgress: false
        };
      default:
        return {
          badge: null,
          title: 'Comienza tu autodiagnóstico',
          description: 'Evalúa tu desempeño y obtén insights personalizados para tu crecimiento profesional.',
          actionText: 'Comenzar evaluación',
          actionUrl: '/evaluation',
          showProgress: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <section className="self-assessment-section">
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>🎯</div>
            <div>
              <CardTitle>Autodiagnóstico</CardTitle>
              {statusInfo.badge && (
                <Badge variant={statusInfo.badge.variant} size="sm" style={{ marginTop: '4px' }}>
                  {statusInfo.badge.text}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="content-section">
            <h4 className="section-title">{statusInfo.title}</h4>
            <p className="section-description">{statusInfo.description}</p>

            {/* Progress bar for in-progress assessments */}
            {statusInfo.showProgress && selfAssessment.progress > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Progress 
                  value={selfAssessment.progress} 
                  variant="primary" 
                  size="md"
                  showLabel
                  label="Progreso"
                />
              </div>
            )}

            {/* Template selector */}
            <div className="template-section">
              <div className="template-label">
                Plantilla: 
                <Link 
                  to="/evaluation/templates" 
                  className="template-link"
                >
                  {selfAssessment.templateName}
                </Link>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            as={Link}
            to={statusInfo.actionUrl}
            variant="primary"
            size="md"
            icon={selfAssessment.status === 'in_progress' ? '▶️' : '🎯'}
          >
            {statusInfo.actionText}
          </Button>
          
          {selfAssessment.status !== 'not_started' && (
            <Button
              as={Link}
              to="/evaluation/templates"
              variant="ghost"
              size="md"
              style={{ marginLeft: '8px' }}
            >
              Cambiar plantilla
            </Button>
          )}
        </CardFooter>
      </Card>

      <style jsx>{`
        .content-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0;
          line-height: 1.3;
        }

        .section-description {
          font-size: 15px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        .template-section {
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .template-label {
          font-size: 13px;
          color: #6B7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .template-link {
          color: #0A84FF;
          text-decoration: none;
          font-weight: 500;
          font-size: 13px;
        }

        .template-link:hover {
          text-decoration: underline;
        }

        /* Ensure proper spacing in card footer */
        :global(.self-assessment-section .ui-card-footer) {
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </section>
  );
};

export default SelfAssessmentSection;
