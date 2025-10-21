/**
 * Switch - Componente de interruptor reutilizable
 * 
 * Características:
 * - Interruptor on/off
 * - Accesibilidad (WCAG 2.1 AA)
 * - Estados disabled
 * - Animaciones suaves
 */

import React from 'react';

const Switch = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  className = '',
  ...props
}) => {
  const handleToggle = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
  };
  
  const sizeClasses = {
    small: 'w-8 h-4',
    default: 'w-11 h-6',
    large: 'w-14 h-8'
  };
  
  const thumbSizeClasses = {
    small: 'w-3 h-3',
    default: 'w-5 h-5',
    large: 'w-7 h-7'
  };
  
  const thumbTranslateClasses = {
    small: checked ? 'translate-x-4' : 'translate-x-0',
    default: checked ? 'translate-x-5' : 'translate-x-0',
    large: checked ? 'translate-x-6' : 'translate-x-0'
  };
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${checked 
          ? 'bg-blue-600' 
          : 'bg-gray-200'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow transform transition-transform
          ${thumbSizeClasses[size]}
          ${thumbTranslateClasses[size]}
        `}
      />
    </button>
  );
};

export default Switch;
