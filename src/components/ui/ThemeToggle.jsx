// src/components/ui/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle - Componente para alternar entre light/dark mode
 */
const ThemeToggle = ({ 
  size = 'md',
  variant = 'icon', // 'icon' | 'switch' | 'button'
  className = '',
  showLabel = false,
  ...props 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          width: '32px',
          height: '32px',
          fontSize: '14px'
        };
      case 'md':
        return {
          width: '40px',
          height: '40px',
          fontSize: '16px'
        };
      case 'lg':
        return {
          width: '48px',
          height: '48px',
          fontSize: '18px'
        };
      default:
        return {
          width: '40px',
          height: '40px',
          fontSize: '16px'
        };
    }
  };

  if (variant === 'switch') {
    return (
      <div className={`theme-toggle-switch ${className}`} {...props}>
        {showLabel && (
          <span className="theme-toggle-switch__label">
            {isDark ? 'Dark' : 'Light'} mode
          </span>
        )}
        <button
          onClick={toggleTheme}
          className="theme-toggle-switch__button"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          style={{
            width: '52px',
            height: '28px',
            borderRadius: '14px',
            border: 'none',
            background: isDark ? 'var(--color-primary)' : 'var(--color-border-primary)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, ease)',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = 'var(--shadow-focus)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '3px',
              left: isDark ? '27px' : '3px',
              transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, ease)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}
          >
            {isDark ? '🌙' : '☀️'}
          </div>
        </button>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-button ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={{
          padding: '8px 16px',
          borderRadius: '12px',
          border: '1px solid var(--color-border-primary)',
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, ease)',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: '500'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'var(--hover-lift-subtle, translateY(-1px))';
          e.target.style.boxShadow = 'var(--shadow-hover)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'var(--shadow-sm)';
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = 'var(--shadow-focus)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'var(--shadow-sm)';
        }}
        {...props}
      >
        <span style={{ fontSize: '16px' }}>
          {isDark ? '🌙' : '☀️'}
        </span>
        {showLabel && (
          <span>{isDark ? 'Dark' : 'Light'}</span>
        )}
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-icon ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        ...getSizeStyles(),
        borderRadius: '12px',
        border: 'none',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast, 0.15s) var(--ease-out-swift, ease)',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'var(--hover-lift-subtle, translateY(-1px))';
        e.target.style.boxShadow = 'var(--shadow-hover)';
        e.target.style.background = 'var(--color-bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'var(--color-bg-secondary)';
      }}
      onMouseDown={(e) => {
        e.target.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.target.style.transform = 'var(--hover-lift-subtle, translateY(-1px))';
      }}
      onFocus={(e) => {
        e.target.style.boxShadow = 'var(--shadow-focus)';
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    >
      <span style={{ 
        fontSize: getSizeStyles().fontSize,
        transition: 'transform var(--transition-fast, 0.15s) var(--ease-out-swift, ease)'
      }}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default ThemeToggle;
