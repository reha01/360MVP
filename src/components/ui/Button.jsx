// src/components/ui/Button.jsx
import React from 'react';

/**
 * Button - Componente de botón reutilizable con variantes
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  as: Component = 'button',
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#94A3B8' : '#0A84FF',
          color: 'white',
          border: 'none',
          '&:hover': {
            backgroundColor: disabled ? '#94A3B8' : '#007AFF'
          }
        };
      case 'secondary':
        return {
          backgroundColor: 'white',
          color: '#0A84FF',
          border: '1px solid #E5E7EB',
          '&:hover': {
            backgroundColor: '#F8FAFC',
            borderColor: '#0A84FF'
          }
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#64748B',
          border: 'none',
          '&:hover': {
            backgroundColor: '#F1F5F9',
            color: '#0B0F14'
          }
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#94A3B8' : '#EF4444',
          color: 'white',
          border: 'none',
          '&:hover': {
            backgroundColor: disabled ? '#94A3B8' : '#DC2626'
          }
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '14px',
          minHeight: '32px'
        };
      case 'md':
        return {
          padding: '10px 16px',
          fontSize: '15px',
          minHeight: '40px'
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '16px',
          minHeight: '48px'
        };
      default:
        return {};
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    fontWeight: '500', // Not bold (600), regular medium
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, cubic-bezier(0.4, 0.0, 0.2, 1))',
    textDecoration: 'none',
    outline: 'none',
    position: 'relative',
    ...getSizeStyles(),
    ...getVariantStyles()
  };

  const focusStyles = {
    boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.1)'
  };

  // Only pass type and disabled to button elements
  const componentProps = {
    ...props,
    ...(Component === 'button' && { type, disabled: disabled || loading }),
    onClick,
    className: `ui-button ${className}`,
    style: baseStyles,
    onFocus: (e) => {
      Object.assign(e.target.style, focusStyles);
    },
    onBlur: (e) => {
      e.target.style.boxShadow = '';
    },
    onMouseEnter: (e) => {
      if (!disabled && !loading) {
        const hoverStyle = getVariantStyles()['&:hover'];
        if (hoverStyle) {
          Object.assign(e.target.style, hoverStyle);
        }
        e.target.style.transform = 'var(--hover-lift-subtle, translateY(-1px))';
        e.target.style.boxShadow = 'var(--shadow-hover, 0 8px 25px rgba(0, 0, 0, 0.1))';
      }
    },
    onMouseLeave: (e) => {
      Object.assign(e.target.style, baseStyles);
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '';
    },
    onMouseDown: (e) => {
      if (!disabled && !loading) {
        e.target.style.transform = 'scale(0.98)';
      }
    },
    onMouseUp: (e) => {
      if (!disabled && !loading) {
        e.target.style.transform = 'var(--hover-lift-subtle, translateY(-1px))';
      }
    }
  };

  return (
    <Component {...componentProps}>
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {icon && !loading && (
        <span style={{ fontSize: size === 'sm' ? '14px' : '16px' }}>
          {icon}
        </span>
      )}
      {children}
      
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Component>
  );
};

export default Button;
