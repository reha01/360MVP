// src/pages/home/sections/HeroMetrics.jsx
import React from 'react';
import { Card } from '../../../components/ui';
import { ProgressRing } from '../../../components/ui/Progress';
import useAssignedTasks from '../../../hooks/useAssignedTasks';
import useReports from '../../../hooks/useReports';

/**
 * HeroMetrics - Fila de 3 mini-métricas: progreso personal, tareas, informes
 */
const HeroMetrics = ({ profile }) => {
  const { items: tasks, total: totalTasks } = useAssignedTasks();
  const { total: totalReports } = useReports();

  // Calcular progreso personal (mock - TODO: implementar lógica real)
  const calculatePersonalProgress = () => {
    if (!profile) return 0;
    
    // Mock: progreso basado en actividad general
    const completed = 2; // Evaluaciones completadas
    const pending = totalTasks || 0; // Tareas asignadas
    const total = completed + pending + 1; // +1 for self assessment
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Contar tareas pendientes
  const pendingTasks = tasks?.filter(task => task.status === 'pending' || task.status === 'in_progress').length || 0;

  const personalProgress = calculatePersonalProgress();

  const metrics = [
    {
      id: 'progress',
      title: 'Progreso personal',
      value: personalProgress,
      type: 'percentage',
      color: personalProgress >= 70 ? '#10B981' : personalProgress >= 40 ? '#F59E0B' : '#EF4444',
      icon: '📈'
    },
    {
      id: 'tasks',
      title: 'Tareas asignadas',
      value: pendingTasks,
      total: totalTasks,
      type: 'tasks',
      color: pendingTasks > 0 ? '#0A84FF' : '#6B7280',
      icon: '📋'
    },
    {
      id: 'reports',
      title: 'Informes disponibles',
      value: totalReports,
      type: 'count',
      color: totalReports > 0 ? '#8B5CF6' : '#6B7280',
      icon: '📊'
    }
  ];

  return (
    <section className="hero-metrics">
      <div className="hero-metrics__grid">
        {metrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <style jsx>{`
        .hero-metrics {
          margin-bottom: 32px;
        }

        .hero-metrics__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        @media (max-width: 480px) {
          .hero-metrics__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

/**
 * MetricCard - Card individual para cada métrica
 */
const MetricCard = ({ metric }) => {
  const renderValue = () => {
    switch (metric.type) {
      case 'percentage':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ProgressRing 
              value={metric.value} 
              size={48} 
              strokeWidth={3}
              variant={metric.color === '#10B981' ? 'success' : metric.color === '#F59E0B' ? 'warning' : 'danger'}
              showLabel={false}
            />
            <div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: metric.color,
                lineHeight: 1 
              }}>
                {metric.value}%
              </div>
            </div>
          </div>
        );
        
      case 'tasks':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '20px',
              lineHeight: 1
            }}>
              {metric.icon}
            </div>
            <div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: metric.color,
                lineHeight: 1 
              }}>
                {metric.value}
                {metric.total && (
                  <span style={{ 
                    fontSize: '16px', 
                    color: '#6B7280', 
                    fontWeight: '400' 
                  }}>
                    /{metric.total}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'count':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              fontSize: '20px',
              lineHeight: 1
            }}>
              {metric.icon}
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: metric.color,
              lineHeight: 1 
            }}>
              {metric.value}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card padding="md" className="metric-card">
      <div className="metric-content">
        {renderValue()}
        <div style={{
          fontSize: '14px',
          color: '#6B7280',
          marginTop: '8px',
          fontWeight: '500'
        }}>
          {metric.title}
        </div>
      </div>

      <style jsx>{`
        :global(.metric-card) {
          transition: all 0.2s ease;
          cursor: default;
        }

        :global(.metric-card):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
      `}</style>
    </Card>
  );
};

export default HeroMetrics;
