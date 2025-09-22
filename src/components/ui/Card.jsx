// src/components/ui/Card.jsx
import React from 'react';

/**
 * Card - Componente de card reutilizable con variantes
 */
const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  hover = true,
  border = true,
  shadow = 'sm',
  ...props 
}) => {
  const getPaddingStyles = () => {
    switch (padding) {
      case 'sm':
        return { padding: '16px' };
      case 'md':
        return { padding: '24px' };
      case 'lg':
        return { padding: '32px' };
      case 'none':
        return { padding: '0' };
      default:
        return { padding: '24px' };
    }
  };

  const getShadowStyles = () => {
    switch (shadow) {
      case 'none':
        return { boxShadow: 'none' };
      case 'sm':
        return { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' };
      case 'md':
        return { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' };
      case 'lg':
        return { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)' };
      default:
        return { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' };
    }
  };

  const baseStyles = {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: border ? '1px solid #E5E7EB' : 'none',
    transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, cubic-bezier(0.4, 0.0, 0.2, 1))',
    ...getPaddingStyles(),
    ...getShadowStyles()
  };

  const hoverStyles = hover ? {
    transform: 'var(--hover-lift-subtle, translateY(-1px))',
    boxShadow: shadow === 'none' 
      ? 'var(--shadow-card, 0 4px 6px rgba(0, 0, 0, 0.05))' 
      : 'var(--shadow-hover, 0 8px 25px rgba(0, 0, 0, 0.1))',
    borderColor: '#D1D5DB'
  } : {};

  return (
    <div
      className={`ui-card ${className}`}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.target.style, { ...baseStyles, ...hoverStyles });
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.target.style, baseStyles);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader - Header section for cards
 */
export const CardHeader = ({ children, className = '', ...props }) => (
  <div 
    className={`ui-card-header ${className}`}
    style={{
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}
    {...props}
  >
    {children}
  </div>
);

/**
 * CardTitle - Title component for cards
 */
export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 
    className={`ui-card-title ${className}`}
    style={{
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
      color: '#0B0F14',
      lineHeight: 1.3
    }}
    {...props}
  >
    {children}
  </h3>
);

/**
 * CardContent - Content section for cards
 */
export const CardContent = ({ children, className = '', ...props }) => (
  <div 
    className={`ui-card-content ${className}`}
    style={{
      marginBottom: '16px',
      color: '#64748B',
      fontSize: '15px',
      lineHeight: 1.5
    }}
    {...props}
  >
    {children}
  </div>
);

/**
 * CardFooter - Footer section for cards
 */
export const CardFooter = ({ children, className = '', ...props }) => (
  <div 
    className={`ui-card-footer ${className}`}
    style={{
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}
    {...props}
  >
    {children}
  </div>
);

export default Card;
