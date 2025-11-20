// src/components/ui/Checkbox.jsx
import React from 'react';

/**
 * Checkbox - Componente de checkbox reutilizable
 */
const Checkbox = ({ 
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props 
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };
  
  const baseClasses = 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      {...props}
    />
  );
};

export default Checkbox;




