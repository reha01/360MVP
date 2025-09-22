// src/components/home/HeaderGreeting.jsx
import React from 'react';
import ProgressRing from './ProgressRing';

/**
 * HeaderGreeting - Header del dashboard con saludo personalizado y progreso
 */
const HeaderGreeting = ({ firstName, profile }) => {
  // Mock progress calculation - TODO: calculate real progress
  const calculateProgress = () => {
    if (!profile) return 0;
    
    // Mock calculation based on pending tasks
    // In real implementation, this would come from various data sources
    const totalTasks = 5; // Self assessment + assigned evaluations + other tasks
    const completedTasks = 2; // Mock completed count
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const progressPercentage = calculateProgress();
  const credits = profile?.credits || 0;
  
  return (
    <header className="header-greeting">
      <div className="header-greeting__content">
        {/* Left side - Greeting */}
        <div className="header-greeting__text">
          <h1 className="header-greeting__title">
            Hola, {firstName}
          </h1>
          <p className="header-greeting__subtitle">
            Este es tu espacio de crecimiento
          </p>
        </div>

        {/* Right side - Progress & Credits */}
        <div className="header-greeting__stats">
          {/* Progress Ring */}
          <div className="header-greeting__progress">
            <ProgressRing 
              percentage={progressPercentage} 
              size={64}
              strokeWidth={4}
            />
            <div className="header-greeting__progress-label">
              <span className="header-greeting__progress-value">
                {progressPercentage}%
              </span>
              <span className="header-greeting__progress-text">
                Progreso
              </span>
            </div>
          </div>

          {/* Credits (if enabled) */}
          {credits > 0 && (
            <div className="header-greeting__credits">
              <div className="header-greeting__credits-value">
                {credits}
              </div>
              <div className="header-greeting__credits-label">
                Créditos
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header-greeting {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 0 32px 0;
        }

        .header-greeting__content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .header-greeting__text {
          flex: 1;
        }

        .header-greeting__title {
          font-size: 32px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .header-greeting__subtitle {
          font-size: 16px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        .header-greeting__stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .header-greeting__progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-greeting__progress-label {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .header-greeting__progress-value {
          font-size: 20px;
          font-weight: 600;
          color: #0B0F14;
          line-height: 1;
        }

        .header-greeting__progress-text {
          font-size: 14px;
          color: #64748B;
          line-height: 1;
        }

        .header-greeting__credits {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 16px;
          background-color: #F0F9FF;
          border: 1px solid #BAE6FD;
          border-radius: 16px;
          min-width: 64px;
        }

        .header-greeting__credits-value {
          font-size: 20px;
          font-weight: 600;
          color: #0369A1;
          line-height: 1;
        }

        .header-greeting__credits-label {
          font-size: 12px;
          color: #0369A1;
          line-height: 1;
          margin-top: 4px;
        }

        /* Responsive */
        @media (max-width: 767px) {
          .header-greeting__content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .header-greeting__title {
            font-size: 28px;
          }

          .header-greeting__stats {
            justify-content: space-between;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .header-greeting__stats {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .header-greeting__progress {
            justify-content: center;
          }

          .header-greeting__progress-label {
            align-items: center;
          }
        }
      `}</style>
    </header>
  );
};

export default HeaderGreeting;
