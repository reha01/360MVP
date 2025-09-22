// src/pages/home/sections/AssignedEvaluationsSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState, SkeletonList } from '../../../components/ui';
import useAssignedTasks from '../../../hooks/useAssignedTasks';

/**
 * AssignedEvaluationsSection - Sección de evaluaciones asignadas limpia
 */
const AssignedEvaluationsSection = () => {
  const { items: tasks, total, loading, error } = useAssignedTasks();

  if (loading) {
    return (
      <section className="assigned-evaluations-section">
        <Card>
          <CardHeader>
            <CardTitle>Evaluar a otras personas</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonList items={2} />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="assigned-evaluations-section">
        <Card>
          <CardHeader>
            <CardTitle>Evaluar a otras personas</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="⚠️"
              title="Error al cargar"
              description="No se pudieron cargar las evaluaciones asignadas."
              size="sm"
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  // Mostrar máximo 3 tareas
  const displayTasks = tasks.slice(0, 3);
  const hasMore = total > displayTasks.length;

  return (
    <section className="assigned-evaluations-section">
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>👥</div>
              <CardTitle>Evaluar a otras personas</CardTitle>
            </div>
            {total > 0 && (
              <Badge variant="default" size="sm">
                {total}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {displayTasks.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No hay evaluaciones asignadas"
              description="Te notificaremos cuando recibas nuevas evaluaciones para completar."
              size="sm"
            />
          ) : (
            <div className="tasks-list">
              {displayTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
              
              {hasMore && (
                <div className="view-all-container">
                  <Button
                    as={Link}
                    to="/evaluations/assigned"
                    variant="ghost"
                    size="sm"
                  >
                    Ver todas ({total})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .view-all-container {
          text-align: center;
          padding-top: 8px;
          margin-top: 8px;
          border-top: 1px solid #F1F5F9;
        }
      `}</style>
    </section>
  );
};

/**
 * TaskItem - Item individual de tarea asignada
 */
const TaskItem = ({ task }) => {
  const formatDeadline = (deadline) => {
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Vencida', variant: 'danger', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Hoy', variant: 'warning', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Mañana', variant: 'warning', urgent: true };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} días`, variant: 'warning', urgent: false };
    } else {
      return { text: `${diffDays} días`, variant: 'default', urgent: false };
    }
  };

  const getRoleInfo = (role) => {
    const roleMap = {
      peer: { label: 'Compañero', color: '#0A84FF' },
      manager: { label: 'Supervisor', color: '#8B5CF6' },
      direct: { label: 'Colaborador', color: '#10B981' }
    };
    return roleMap[role] || { label: role, color: '#6B7280' };
  };

  const deadline = formatDeadline(task.deadline);
  const roleInfo = getRoleInfo(task.role);

  return (
    <div className="task-item">
      <div className="task-item__header">
        <div className="task-item__avatar">
          {task.subjectName.charAt(0).toUpperCase()}
        </div>
        <div className="task-item__info">
          <div className="task-item__name">
            {task.subjectName}
          </div>
          <div className="task-item__meta">
            <span 
              className="task-item__role"
              style={{ color: roleInfo.color }}
            >
              {roleInfo.label}
            </span>
            <span className="task-item__separator">•</span>
            <Badge variant={deadline.variant} size="xs">
              {deadline.text}
            </Badge>
          </div>
        </div>
      </div>

      <div className="task-item__actions">
        <Button
          as={Link}
          to={task.url}
          variant="primary"
          size="sm"
        >
          {task.status === 'in_progress' ? 'Continuar' : 'Evaluar'}
        </Button>
      </div>

      <style jsx>{`
        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background-color: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          transition: all 0.2s ease;
          gap: 16px;
        }

        .task-item:hover {
          background-color: white;
          border-color: #E5E7EB;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .task-item__header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .task-item__avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #0A84FF 0%, #007AFF 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .task-item__info {
          flex: 1;
          min-width: 0;
        }

        .task-item__name {
          font-size: 15px;
          font-weight: 600;
          color: #0B0F14;
          margin-bottom: 4px;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .task-item__meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .task-item__role {
          font-weight: 500;
        }

        .task-item__separator {
          color: #CBD5E1;
        }

        .task-item__actions {
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .task-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .task-item__actions {
            align-self: stretch;
          }

          :global(.task-item__actions .ui-button) {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AssignedEvaluationsSection;
