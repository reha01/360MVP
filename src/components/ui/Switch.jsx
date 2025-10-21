/**
 * Componente Switch
 */

import React from 'react';

const Switch = ({ checked, onChange, disabled = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  };
  
  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };
  
  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0'
  };
  
  return (
    <button
      type="button"
      className={`
        ${sizeClasses[size]}
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full
        transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2
        focus:ring-offset-2 focus:ring-blue-500
      `}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span
        className={`
          ${thumbSizeClasses[size]}
          ${translateClasses[size]}
          pointer-events-none inline-block rounded-full bg-white shadow
          transform ring-0 transition ease-in-out duration-200
        `}
      />
    </button>
  );
};

export default Switch;
