// src/components/ui/Badge.jsx
import React from 'react';

/**
 * Badge - Componente de badge micro-acento
 */
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm',
  className = '',
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          border: '1px solid #E2E8F0'
        };
      case 'primary':
        return {
          backgroundColor: '#F0F9FF',
          color: '#0369A1',
          border: '1px solid #BAE6FD'
        };
      case 'success':
        return {
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1px solid #BBF7D0'
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          border: '1px solid #FDE68A'
        };
      case 'danger':
        return {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA'
        };
      case 'purple':
        return {
          backgroundColor: '#F3E8FF',
          color: '#7C3AED',
          border: '1px solid #DDD6FE'
        };
      case 'emerald':
        return {
          backgroundColor: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0'
        };
      default:
        return {
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          border: '1px solid #E2E8F0'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '6px'
        };
      case 'sm':
        return {
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '8px'
        };
      case 'md':
        return {
          padding: '6px 12px',
          fontSize: '14px',
          borderRadius: '10px'
        };
      default:
        return {
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '8px'
        };
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...getSizeStyles(),
    ...getVariantStyles()
  };

  return (
    <span
      className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`}
      style={baseStyles}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
