// src/pages/home/sections/RecentActivitySection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, EmptyState, SkeletonList } from '../../../components/ui';
import useRecentActivity from '../../../hooks/useRecentActivity';

/**
 * RecentActivitySection - Sección de actividad reciente sutil
 */
const RecentActivitySection = () => {
  const { 
    events, 
    loading, 
    error, 
    formatRelativeDate,
    markAsRead 
  } = useRecentActivity();

  if (loading) {
    return (
      <section className="recent-activity-section">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonList items={4} itemHeight="40px" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recent-activity-section">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="⚠️"
              title="Error al cargar"
              description="No se pudo cargar la actividad reciente."
              size="sm"
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  // Mostrar máximo 5 eventos
  const displayEvents = events.slice(0, 5);

  return (
    <section className="recent-activity-section">
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>📋</div>
            <CardTitle>Actividad reciente</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {displayEvents.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Sin actividad reciente"
              description="Los eventos aparecerán aquí cuando tengas actividad."
              size="sm"
            />
          ) : (
            <div className="activity-list">
              {displayEvents.map(event => (
                <ActivityItem 
                  key={event.id} 
                  event={event}
                  formatRelativeDate={formatRelativeDate}
                  onRead={markAsRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </section>
  );
};

/**
 * ActivityItem - Item individual de actividad
 */
const ActivityItem = ({ event, formatRelativeDate, onRead }) => {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return { borderLeftColor: '#EF4444' };
      case 'medium':
        return { borderLeftColor: '#F59E0B' };
      default:
        return { borderLeftColor: 'transparent' };
    }
  };

  const isUnread = !event.read;

  const handleClick = () => {
    if (isUnread) {
      onRead(event.id);
    }
  };

  return (
    <div 
      className={`activity-item ${isUnread ? 'activity-item--unread' : ''}`}
      style={getPriorityStyle(event.priority)}
      onClick={handleClick}
    >
      <div className="activity-item__content">
        <div className="activity-item__header">
          <div className="activity-item__icon">
            {event.icon}
          </div>
          <div className="activity-item__text">
            <div className="activity-item__label">
              {event.label}
            </div>
            <div className="activity-item__time">
              {formatRelativeDate(event.date)}
            </div>
          </div>
          {isUnread && (
            <div className="activity-item__unread-dot" />
          )}
        </div>

        {event.action && (
          <div className="activity-item__action">
            <Button
              as={Link}
              to={event.action.url}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {event.action.text}
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        .activity-item {
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .activity-item--unread {
          background-color: #F0F9FF;
        }

        .activity-item:hover {
          background-color: #F8FAFC;
        }

        .activity-item--unread:hover {
          background-color: #E0F2FE;
        }

        .activity-item__content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item__header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .activity-item__icon {
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .activity-item__text {
          flex: 1;
          min-width: 0;
        }

        .activity-item__label {
          font-size: 14px;
          color: #0B0F14;
          line-height: 1.4;
          margin-bottom: 2px;
          word-wrap: break-word;
        }

        .activity-item__time {
          font-size: 12px;
          color: #6B7280;
          line-height: 1;
        }

        .activity-item__unread-dot {
          width: 6px;
          height: 6px;
          background-color: #0A84FF;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .activity-item__action {
          padding-left: 26px; /* Align with text content */
        }

        :global(.activity-item__action .ui-button) {
          padding: 4px 8px;
          font-size: 12px;
          min-height: 28px;
        }

        @media (max-width: 480px) {
          .activity-item {
            padding: 10px;
          }

          .activity-item__header {
            gap: 8px;
          }

          .activity-item__action {
            padding-left: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentActivitySection;
