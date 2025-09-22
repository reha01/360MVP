// src/components/home/CardAssignedEvaluations.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAssignedTasks from '../../hooks/useAssignedTasks';

/**
 * CardAssignedEvaluations - Card que muestra evaluaciones 180/360 asignadas
 */
const CardAssignedEvaluations = () => {
  const { items: tasks, total, loading, error } = useAssignedTasks();

  const formatDeadline = (deadline) => {
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Vencida', color: '#EF4444', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Hoy', color: '#F59E0B', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Mañana', color: '#F59E0B', urgent: true };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} días`, color: '#F59E0B', urgent: true };
    } else {
      return { text: `${diffDays} días`, color: '#64748B', urgent: false };
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      peer: { label: 'Compañero', color: '#0A84FF' },
      manager: { label: 'Supervisor', color: '#8B5CF6' },
      direct: { label: 'Colaborador', color: '#10B981' }
    };
    return roleMap[role] || { label: role, color: '#64748B' };
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: '#F59E0B' },
      in_progress: { label: 'En curso', color: '#0A84FF' },
      completed: { label: 'Completada', color: '#10B981' }
    };
    return statusMap[status] || { label: status, color: '#64748B' };
  };

  if (loading) {
    return (
      <div className="card-assigned-evaluations">
        <div className="card-assigned-evaluations__skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-list">
            {[1, 2].map(i => (
              <div key={i} className="skeleton-item"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-assigned-evaluations">
        <div className="card-assigned-evaluations__error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Error al cargar</h3>
            <p>No se pudieron cargar las evaluaciones asignadas</p>
          </div>
        </div>
      </div>
    );
  }

  const displayTasks = tasks.slice(0, 3); // Mostrar máximo 3
  const hasMore = total > displayTasks.length;

  return (
    <div className="card-assigned-evaluations">
      <div className="card-assigned-evaluations__header">
        <h3 className="card-assigned-evaluations__title">
          Evaluar a otras personas
        </h3>
        {total > 0 && (
          <div className="card-assigned-evaluations__count">
            {total} {total === 1 ? 'evaluación' : 'evaluaciones'}
          </div>
        )}
      </div>

      <div className="card-assigned-evaluations__content">
        {displayTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📝</div>
            <div className="empty-state__text">
              <p>Aún no tienes evaluaciones asignadas</p>
              <span>Te notificaremos cuando recibas nuevas asignaciones</span>
            </div>
          </div>
        ) : (
          <div className="task-list">
            {displayTasks.map((task) => {
              const deadline = formatDeadline(task.deadline);
              const role = getRoleLabel(task.role);
              const status = getStatusLabel(task.status);

              return (
                <div key={task.id} className="task-item">
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
                          style={{ color: role.color }}
                        >
                          {role.label}
                        </span>
                        <span className="task-item__separator">•</span>
                        <span 
                          className="task-item__deadline"
                          style={{ 
                            color: deadline.color,
                            fontWeight: deadline.urgent ? 600 : 400
                          }}
                        >
                          {deadline.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="task-item__footer">
                    <div 
                      className="task-item__status"
                      style={{ color: status.color }}
                    >
                      {status.label}
                    </div>
                    <Link 
                      to={task.url}
                      className="task-item__action"
                    >
                      {task.status === 'in_progress' ? 'Continuar' : 'Evaluar'}
                    </Link>
                  </div>

                  {task.progress && (
                    <div className="task-item__progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar__fill"
                          style={{ 
                            width: `${task.progress * 100}%`,
                            backgroundColor: '#0A84FF'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="card-assigned-evaluations__footer">
          <Link 
            to="/evaluations/assigned"
            className="view-all-link"
          >
            Ver todas ({total})
          </Link>
        </div>
      )}

      <style jsx>{`
        .card-assigned-evaluations {
          background-color: white;
          border: 1px solid #E6EAF0;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .card-assigned-evaluations:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #D1D5DB;
        }

        .card-assigned-evaluations__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-assigned-evaluations__title {
          font-size: 20px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0;
          line-height: 1.3;
        }

        .card-assigned-evaluations__count {
          font-size: 12px;
          color: #64748B;
          background-color: #F1F5F9;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 500;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 16px;
        }

        .empty-state__icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state__text p {
          font-size: 16px;
          color: #64748B;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .empty-state__text span {
          font-size: 14px;
          color: #94A3B8;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .task-item {
          padding: 16px;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          background-color: #FAFBFC;
          transition: all 0.2s ease;
        }

        .task-item:hover {
          border-color: #E6EAF0;
          background-color: white;
        }

        .task-item__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .task-item__avatar {
          width: 40px;
          height: 40px;
          background-color: #0A84FF;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .task-item__info {
          flex: 1;
        }

        .task-item__name {
          font-size: 15px;
          font-weight: 600;
          color: #0B0F14;
          margin-bottom: 4px;
        }

        .task-item__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .task-item__separator {
          color: #CBD5E1;
        }

        .task-item__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-item__status {
          font-size: 12px;
          font-weight: 500;
        }

        .task-item__action {
          padding: 6px 12px;
          background-color: #0A84FF;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .task-item__action:hover {
          background-color: #007AFF;
          transform: translateY(-1px);
        }

        .task-item__progress {
          margin-top: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background-color: #F1F5F9;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar__fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .card-assigned-evaluations__footer {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .view-all-link {
          color: #0A84FF;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-all-link:hover {
          background-color: #F0F9FF;
          text-decoration: underline;
        }

        /* Skeleton loading */
        .card-assigned-evaluations__skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-header {
          height: 24px;
          width: 200px;
          background-color: #E6EAF0;
          border-radius: 8px;
        }

        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-item {
          height: 80px;
          background-color: #F1F5F9;
          border-radius: 12px;
        }

        /* Error state */
        .card-assigned-evaluations__error {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          text-align: center;
        }

        .error-icon {
          font-size: 32px;
        }

        .error-text h3 {
          margin: 0 0 4px 0;
          color: #EF4444;
          font-size: 16px;
        }

        .error-text p {
          margin: 0;
          color: #64748B;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default CardAssignedEvaluations;
