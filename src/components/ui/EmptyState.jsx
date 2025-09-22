// src/components/ui/EmptyState.jsx
import React from 'react';
import Button from './Button';

/**
 * EmptyState - Componente para estados vacíos elegantes
 */
const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  actionText = 'Comenzar',
  onAction,
  size = 'md',
  className = '',
  ...props 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '24px 16px',
          iconSize: '32px',
          titleSize: '16px',
          descSize: '14px'
        };
      case 'md':
        return {
          padding: '40px 24px',
          iconSize: '48px',
          titleSize: '18px',
          descSize: '15px'
        };
      case 'lg':
        return {
          padding: '56px 32px',
          iconSize: '64px',
          titleSize: '20px',
          descSize: '16px'
        };
      default:
        return {
          padding: '40px 24px',
          iconSize: '48px',
          titleSize: '18px',
          descSize: '15px'
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <div
      className={`ui-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: styles.padding,
        color: '#64748B'
      }}
      {...props}
    >
      {icon && (
        <div
          style={{
            fontSize: styles.iconSize,
            marginBottom: '16px',
            opacity: 0.8
          }}
        >
          {icon}
        </div>
      )}
      
      {title && (
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: styles.titleSize,
            fontWeight: '600',
            color: '#374151',
            lineHeight: 1.3
          }}
        >
          {title}
        </h3>
      )}
      
      {description && (
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: styles.descSize,
            color: '#6B7280',
            lineHeight: 1.5,
            maxWidth: '400px'
          }}
        >
          {description}
        </p>
      )}
      
      {(action || onAction) && (
        <div>
          {action || (
            <Button
              variant="secondary"
              size={size === 'lg' ? 'md' : 'sm'}
              onClick={onAction}
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * EmptyStateCard - Empty state dentro de una card
 */
export const EmptyStateCard = ({ children, ...props }) => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden'
    }}
  >
    <EmptyState {...props}>
      {children}
    </EmptyState>
  </div>
);

export default EmptyState;
