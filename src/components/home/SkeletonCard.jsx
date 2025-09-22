// src/components/home/SkeletonCard.jsx
import React from 'react';

/**
 * SkeletonCard - Componente de loading state para cards
 */
const SkeletonCard = ({ height = 280 }) => {
  return (
    <div className="skeleton-card" style={{ height }}>
      {/* Header skeleton */}
      <div className="skeleton-card__header">
        <div className="skeleton-card__title"></div>
        <div className="skeleton-card__subtitle"></div>
      </div>

      {/* Content skeleton */}
      <div className="skeleton-card__content">
        <div className="skeleton-card__line skeleton-card__line--full"></div>
        <div className="skeleton-card__line skeleton-card__line--three-quarters"></div>
        <div className="skeleton-card__line skeleton-card__line--half"></div>
      </div>

      {/* Action skeleton */}
      <div className="skeleton-card__footer">
        <div className="skeleton-card__button"></div>
      </div>

      <style jsx>{`
        .skeleton-card {
          background-color: white;
          border: 1px solid #E6EAF0;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-card__header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-card__title {
          height: 24px;
          width: 60%;
          background-color: #E6EAF0;
          border-radius: 8px;
        }

        .skeleton-card__subtitle {
          height: 16px;
          width: 40%;
          background-color: #F1F5F9;
          border-radius: 6px;
        }

        .skeleton-card__content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .skeleton-card__line {
          height: 16px;
          background-color: #F1F5F9;
          border-radius: 6px;
        }

        .skeleton-card__line--full {
          width: 100%;
        }

        .skeleton-card__line--three-quarters {
          width: 75%;
        }

        .skeleton-card__line--half {
          width: 50%;
        }

        .skeleton-card__footer {
          display: flex;
          justify-content: flex-start;
          margin-top: auto;
        }

        .skeleton-card__button {
          height: 40px;
          width: 120px;
          background-color: #E6EAF0;
          border-radius: 12px;
        }

        /* Animation */
        .skeleton-card__title,
        .skeleton-card__subtitle,
        .skeleton-card__line,
        .skeleton-card__button {
          position: relative;
          overflow: hidden;
        }

        .skeleton-card__title::after,
        .skeleton-card__subtitle::after,
        .skeleton-card__line::after,
        .skeleton-card__button::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;
