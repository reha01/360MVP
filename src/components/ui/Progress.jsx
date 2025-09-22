// src/components/ui/Progress.jsx
import React from 'react';

/**
 * Progress - Componente de barra de progreso accesible
 */
const ProgressBase = ({ 
  value = 0, 
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label = '',
  className = '',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return '#0A84FF';
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      case 'purple':
        return '#8B5CF6';
      default:
        return '#0A84FF';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: '6px', borderRadius: '3px' };
      case 'md':
        return { height: '8px', borderRadius: '4px' };
      case 'lg':
        return { height: '12px', borderRadius: '6px' };
      default:
        return { height: '8px', borderRadius: '4px' };
    }
  };

  return (
    <div 
      className={`ui-progress ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel || label || `${Math.round(percentage)}% complete`}
      {...props}
    >
      {(showLabel || label) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#64748B'
        }}>
          {label && <span>{label}</span>}
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          backgroundColor: '#F1F5F9',
          overflow: 'hidden',
          ...getSizeStyles()
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: getVariantColor(),
            borderRadius: getSizeStyles().borderRadius,
            transition: 'width 0.3s ease, background-color 0.2s ease',
            width: `${percentage}%`
          }}
        />
      </div>
    </div>
  );
};

/**
 * ProgressRing - Componente de progreso circular
 */
const ProgressRing = ({ 
  value = 0, 
  max = 100,
  size = 64,
  strokeWidth = 4,
  variant = 'primary',
  showLabel = true,
  className = '',
  ...props 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return '#0A84FF';
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      case 'purple':
        return '#8B5CF6';
      default:
        return '#0A84FF';
    }
  };

  return (
    <div 
      className={`ui-progress-ring ${className}`}
      style={{ 
        position: 'relative', 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getVariantColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.3s ease'
          }}
        />
      </svg>
      
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            fontSize: size > 64 ? '16px' : '14px',
            fontWeight: '600',
            color: '#0B0F14'
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Normalize exports for maximum compatibility
const Progress = ProgressBase;

export default Progress;
export { Progress, ProgressRing };
