// src/components/ui/Textarea.jsx
import React from 'react';

/**
 * Textarea - Componente de textarea reutilizable
 */
const Textarea = ({ 
  value,
  onChange,
  placeholder = '',
  rows = 4,
  error,
  required = false,
  disabled = false,
  className = '',
  maxLength,
  ...props 
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
      {...props}
    />
  );
};

export default Textarea;




