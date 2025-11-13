// src/hooks/useRecentActivity.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useRecentActivity - Hook para obtener actividad reciente del usuario
 * TODO: Conectar con servicio real de actividad/notificaciones
 */
export const useRecentActivity = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // TODO: Reemplazar con llamada real a servicio de actividad
        // Simulando delay de red
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock data - representa eventos de actividad reciente
        const mockEvents = [
          {
            id: 'event_1',
            type: 'report_ready',
            label: 'Tu informe "AutoevaluaciÃ³n Liderazgo" estÃ¡ listo',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
            icon: 'ðŸ“Š',
            action: {
              text: 'Ver informe',
              url: '/report/report_1'
            },
            metadata: {
              reportId: 'report_1',
              reportType: 'self'
            }
          },
          {
            id: 'event_2',
            type: 'invitation_sent',
            label: 'Se enviÃ³ invitaciÃ³n para evaluar a MarÃ­a GonzÃ¡lez',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000), // hace 6 horas
            icon: 'ðŸ“§',
            metadata: {
              subjectName: 'MarÃ­a GonzÃ¡lez',
              evaluationType: '360'
            }
          },
          {
            id: 'event_3',
            type: 'evaluation_assigned',
            label: 'Nueva evaluaciÃ³n asignada: Carlos Ruiz',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hace 1 dÃ­a
            icon: 'ðŸŽ¯',
            action: {
              text: 'Comenzar evaluaciÃ³n',
              url: '/evaluation/assigned_task_2'
            },
            metadata: {
              subjectName: 'Carlos Ruiz',
              role: 'direct',
              deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            }
          },
          {
            id: 'event_4',
            type: 'reminder',
            label: 'Recordatorio: 2 dÃ­as para finalizar evaluaciÃ³n de Ana MartÃ­n',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 dÃ­as
            icon: 'â°',
            priority: 'medium', // low, medium, high
            action: {
              text: 'Continuar evaluaciÃ³n',
              url: '/evaluation/assigned_task_3'
            },
            metadata: {
              subjectName: 'Ana MartÃ­n',
              daysRemaining: 2
            }
          },
          {
            id: 'event_5',
            type: 'evaluation_completed',
            label: 'Completaste la autoevaluaciÃ³n de ComunicaciÃ³n',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // hace 3 dÃ­as
            icon: 'âœ…',
            metadata: {
              evaluationType: 'self',
              category: 'communication'
            }
          }
        ];

        // En desarrollo, mostrar algunos eventos
        setEvents(mockEvents.slice(0, 4)); // Mostrar los primeros 4
        
      } catch (err) {
        console.error('[360MVP] useRecentActivity: Error fetching activity:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [user]);

  // Helper function para marcar evento como leÃ­do
  const markAsRead = (eventId) => {
    // TODO: Implementar marcado como leÃ­do en backend
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, read: true } : event
      )
    );
  };

  // Helper function para obtener eventos no leÃ­dos
  const getUnreadCount = () => {
    return events.filter(event => !event.read).length;
  };

  // Helper function para refrescar actividad
  const refreshActivity = () => {
    setLoading(true);
    // Re-trigger the effect
  };

  // Helper function para formatear fecha relativa
  const formatRelativeDate = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Hace ${diffInDays} dÃ­a${diffInDays > 1 ? 's' : ''}`;
      } else {
        return date.toLocaleDateString('es-ES');
      }
    }
  };

  return {
    events,
    loading,
    error,
    unreadCount: getUnreadCount(),
    markAsRead,
    refreshActivity,
    formatRelativeDate
  };
};



export default useRecentActivity;
