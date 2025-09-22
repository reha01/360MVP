// src/pages/home/sections/LeaderAnalyticsSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Progress } from '../../../components/ui';

/**
 * LeaderAnalyticsSection - Panel mini de analytics para líderes
 */
const LeaderAnalyticsSection = () => {
  // Mock data - TODO: obtener datos reales de analytics
  const analyticsData = {
    activeProcesses: 3,
    averageProgress: 67,
    pendingTasks: 12,
    teamMembers: 25,
    completedEvaluations: 18,
    upcomingDeadlines: 2
  };

  const getProgressVariant = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  const progressVariant = getProgressVariant(analyticsData.averageProgress);

  return (
    <section className="leader-analytics-section">
      <Card className="analytics-card">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '20px' }}>📈</div>
              <div>
                <CardTitle>Panel Analytics</CardTitle>
                <Badge variant="primary" size="xs" style={{ marginTop: '4px' }}>
                  Equipos
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="analytics-content">
            {/* Main metrics */}
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-value">{analyticsData.activeProcesses}</div>
                <div className="metric-label">Procesos activos</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{analyticsData.pendingTasks}</div>
                <div className="metric-label">Pendientes</div>
              </div>
            </div>

            {/* Progress section */}
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Progreso del equipo</span>
                <span className="progress-percentage">{analyticsData.averageProgress}%</span>
              </div>
              <Progress 
                value={analyticsData.averageProgress} 
                variant={progressVariant}
                size="md"
              />
            </div>

            {/* Quick stats */}
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <span className="stat-text">{analyticsData.teamMembers} miembros</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <span className="stat-text">{analyticsData.completedEvaluations} evaluaciones completadas</span>
              </div>
              {analyticsData.upcomingDeadlines > 0 && (
                <div className="stat-item stat-item--warning">
                  <span className="stat-icon">⏰</span>
                  <span className="stat-text">{analyticsData.upcomingDeadlines} deadlines próximos</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            as={Link}
            to="/analytics"
            variant="primary"
            size="sm"
            icon="📊"
            style={{ flex: 1 }}
          >
            Abrir Analytics
          </Button>
          <Button
            as={Link}
            to="/org/processes/create"
            variant="secondary"
            size="sm"
            icon="➕"
            style={{ marginLeft: '8px' }}
          >
            Crear proceso
          </Button>
        </CardFooter>
      </Card>

      <style jsx>{`
        :global(.analytics-card) {
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
          border: 1px solid #E2E8F0;
        }

        .analytics-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .metric-item {
          text-align: center;
          padding: 12px;
          background-color: white;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #0A84FF;
          line-height: 1;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.2;
          font-weight: 500;
        }

        .progress-section {
          padding: 16px;
          background-color: white;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .progress-label {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .progress-percentage {
          font-size: 14px;
          color: #0A84FF;
          font-weight: 600;
        }

        .quick-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6B7280;
          padding: 6px 8px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.6);
        }

        .stat-item--warning {
          color: #92400E;
          background-color: #FFFBEB;
          font-weight: 500;
        }

        .stat-icon {
          font-size: 14px;
          line-height: 1;
        }

        .stat-text {
          line-height: 1.3;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          :global(.leader-analytics-section .ui-card-footer) {
            flex-direction: column;
            gap: 8px;
          }

          :global(.leader-analytics-section .ui-card-footer .ui-button) {
            width: 100%;
            margin-left: 0 !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LeaderAnalyticsSection;
