// src/components/home/QuickActions.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useFeatureFlags from '../../hooks/useFeatureFlags';

/**
 * QuickActions - Acciones rápidas con un botón primario y otros secundarios
 */
const QuickActions = ({ profile }) => {
  const { creditsEnabled } = useFeatureFlags();
  
  // Determinar el estado del usuario para mostrar la acción principal correcta
  const hasDraftSelf = profile?.hasDraftSelf || false;
  const hasCredits = profile?.credits > 0 || true; // Mock - siempre true en desarrollo
  
  // Determinar acción primaria
  const getPrimaryAction = () => {
    if (hasDraftSelf) {
      return {
        text: 'Continuar donde lo dejaste',
        url: '/evaluation?continue=true',
        icon: '▶️'
      };
    }
    
    return {
      text: 'Comenzar autoevaluación',
      url: '/evaluation',
      icon: '🎯'
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <section className="quick-actions">
      <div className="quick-actions__content">
        {/* Primary Action */}
        <Link 
          to={primaryAction.url}
          className="quick-actions__primary"
          aria-label={primaryAction.text}
        >
          <span className="quick-actions__primary-icon" aria-hidden="true">
            {primaryAction.icon}
          </span>
          <span className="quick-actions__primary-text">
            {primaryAction.text}
          </span>
        </Link>

        {/* Secondary Actions */}
        <div className="quick-actions__secondary">
          <Link 
            to="/reports" 
            className="quick-actions__secondary-button"
            aria-label="Ver mis reportes"
          >
            <span className="quick-actions__secondary-icon" aria-hidden="true">📄</span>
            <span>Ver mis reportes</span>
          </Link>

          {/* Credits action - only if enabled and user has no credits */}
          {creditsEnabled && !hasCredits && (
            <Link 
              to="/credits" 
              className="quick-actions__secondary-button"
              aria-label="Canjear o comprar evaluación"
            >
              <span className="quick-actions__secondary-icon" aria-hidden="true">💳</span>
              <span>Canjear evaluación</span>
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .quick-actions {
          max-width: 1400px;
          margin: 0 auto 32px;
        }

        .quick-actions__content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quick-actions__primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 32px;
          background-color: #0A84FF;
          color: white;
          text-decoration: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          min-height: 56px;
        }

        .quick-actions__primary:hover {
          background-color: #007AFF;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(10, 132, 255, 0.3);
        }

        .quick-actions__primary:focus {
          outline: none;
          border-color: #005FCC;
          box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
        }

        .quick-actions__primary-icon {
          font-size: 20px;
        }

        .quick-actions__primary-text {
          font-size: 16px;
        }

        .quick-actions__secondary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .quick-actions__secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background-color: white;
          color: #0B0F14;
          text-decoration: none;
          border: 1px solid #E6EAF0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-height: 44px;
        }

        .quick-actions__secondary-button:hover {
          border-color: #0A84FF;
          color: #0A84FF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .quick-actions__secondary-button:focus {
          outline: none;
          border-color: #0A84FF;
          box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
        }

        .quick-actions__secondary-icon {
          font-size: 16px;
        }

        /* Responsive */
        @media (min-width: 768px) {
          .quick-actions__content {
            flex-direction: row;
            align-items: stretch;
          }

          .quick-actions__primary {
            flex: 0 0 auto;
            min-width: 280px;
          }

          .quick-actions__secondary {
            flex: 1;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .quick-actions__secondary {
            grid-template-columns: 1fr;
          }
          
          .quick-actions__primary {
            padding: 14px 24px;
          }
          
          .quick-actions__primary-text {
            font-size: 15px;
          }
        }
      `}</style>
    </section>
  );
};

export default QuickActions;
