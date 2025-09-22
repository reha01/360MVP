// src/components/home/CardRecentActivity.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useRecentActivity from '../../hooks/useRecentActivity';

/**
 * CardRecentActivity - Card que muestra la actividad reciente del usuario
 */
const CardRecentActivity = () => {
  const { 
    events, 
    loading, 
    error, 
    formatRelativeDate,
    markAsRead 
  } = useRecentActivity();

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return { borderLeft: '3px solid #EF4444' };
      case 'medium':
        return { borderLeft: '3px solid #F59E0B' };
      default:
        return { borderLeft: '3px solid transparent' };
    }
  };

  const handleEventClick = (eventId) => {
    markAsRead(eventId);
  };

  if (loading) {
    return (
      <div className="card-recent-activity">
        <div className="card-recent-activity__skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-list">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-item"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-recent-activity">
        <div className="card-recent-activity__error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Error al cargar</h3>
            <p>No se pudo cargar la actividad reciente</p>
          </div>
        </div>
      </div>
    );
  }

  const displayEvents = events.slice(0, 5); // Mostrar máximo 5 eventos

  return (
    <div className="card-recent-activity">
      <div className="card-recent-activity__header">
        <h3 className="card-recent-activity__title">
          Actividad reciente
        </h3>
        {events.length > 0 && (
          <div className="card-recent-activity__count">
            {events.length} {events.length === 1 ? 'evento' : 'eventos'}
          </div>
        )}
      </div>

      <div className="card-recent-activity__content">
        {displayEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__text">
              <p>No hay actividad reciente</p>
              <span>Los eventos aparecerán aquí cuando tengas actividad</span>
            </div>
          </div>
        ) : (
          <div className="activity-list">
            {displayEvents.map((event) => {
              const priorityStyle = getPriorityStyle(event.priority);
              const isUnread = !event.read;

              return (
                <div 
                  key={event.id} 
                  className={`activity-item ${isUnread ? 'activity-item--unread' : ''}`}
                  style={priorityStyle}
                >
                  <div className="activity-item__header">
                    <div className="activity-item__icon">
                      {event.icon}
                    </div>
                    <div className="activity-item__content">
                      <div className="activity-item__label">
                        {event.label}
                      </div>
                      <div className="activity-item__time">
                        {formatRelativeDate(event.date)}
                      </div>
                    </div>
                    {isUnread && (
                      <div className="activity-item__unread-dot" aria-label="No leído"></div>
                    )}
                  </div>

                  {event.action && (
                    <div className="activity-item__footer">
                      <Link 
                        to={event.action.url}
                        className="activity-item__action"
                        onClick={() => handleEventClick(event.id)}
                        aria-label={event.action.text}
                      >
                        {event.action.text}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .card-recent-activity {
          background-color: white;
          border: 1px solid #E6EAF0;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .card-recent-activity:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #D1D5DB;
        }

        .card-recent-activity__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-recent-activity__title {
          font-size: 20px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0;
          line-height: 1.3;
        }

        .card-recent-activity__count {
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

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-item {
          padding: 12px 16px;
          border-radius: 12px;
          background-color: #FAFBFC;
          transition: all 0.2s ease;
          position: relative;
        }

        .activity-item--unread {
          background-color: #F0F9FF;
        }

        .activity-item:hover {
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .activity-item__header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .activity-item__icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }

        .activity-item__content {
          flex: 1;
          min-width: 0;
        }

        .activity-item__label {
          font-size: 14px;
          color: #0B0F14;
          line-height: 1.4;
          margin-bottom: 4px;
          word-wrap: break-word;
        }

        .activity-item__time {
          font-size: 12px;
          color: #64748B;
          line-height: 1;
        }

        .activity-item__unread-dot {
          width: 8px;
          height: 8px;
          background-color: #0A84FF;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .activity-item__footer {
          padding-left: 30px; /* Align with content */
        }

        .activity-item__action {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          background-color: #F8FAFC;
          color: #0A84FF;
          text-decoration: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #E6EAF0;
          transition: all 0.2s ease;
        }

        .activity-item__action:hover {
          background-color: #0A84FF;
          color: white;
          border-color: #0A84FF;
          transform: translateY(-1px);
        }

        /* Skeleton loading */
        .card-recent-activity__skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-header {
          height: 24px;
          width: 150px;
          background-color: #E6EAF0;
          border-radius: 8px;
        }

        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-item {
          height: 60px;
          background-color: #F1F5F9;
          border-radius: 12px;
        }

        /* Error state */
        .card-recent-activity__error {
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

        /* Responsive */
        @media (max-width: 480px) {
          .activity-item__header {
            gap: 10px;
          }

          .activity-item__footer {
            padding-left: 28px;
          }

          .activity-item__label {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default CardRecentActivity;
