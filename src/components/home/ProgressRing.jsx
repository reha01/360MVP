// src/components/home/ProgressRing.jsx
import React from 'react';

/**
 * ProgressRing - Componente de anillo de progreso simple y elegante
 */
const ProgressRing = ({ 
  percentage = 0, 
  size = 64, 
  strokeWidth = 4,
  primaryColor = '#0A84FF',
  backgroundColor = '#E6EAF0'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="progress-ring__svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring__circle"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <style jsx>{`
        .progress-ring {
          position: relative;
          display: inline-block;
        }

        .progress-ring__svg {
          transform: rotate(0deg);
        }

        .progress-ring__circle {
          transition: stroke-dashoffset 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ProgressRing;
