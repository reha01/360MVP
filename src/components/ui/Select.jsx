// src/components/ui/Select.jsx
import React, { useState, useRef, useEffect } from 'react';

/**
 * Select - Componente de select reutilizable con soporte para patrón compuesto
 */
const Select = ({ 
  value,
  onValueChange,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  error,
  required = false,
  disabled = false,
  className = '',
  children,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  
  // Si tiene children (patrón compuesto), renderizar estructura especial
  if (children) {
    return <SelectCompound value={value} onValueChange={onValueChange} disabled={disabled} error={error} className={className}>{children}</SelectCompound>;
  }
  
  // Si no tiene children, usar el select nativo simple
  const baseClasses = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer';
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (onValueChange) {
      onValueChange(newValue);
    }
    if (onChange) {
      onChange(e);
    }
  };
  
  return (
    <select
      ref={selectRef}
      value={value || ''}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        const optionLabel = typeof option === 'object' ? option.label : option;
        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
};

// Componente compuesto para Select.Trigger, Select.Value, Select.Content, Select.Item
const SelectCompound = ({ value, onValueChange, disabled, error, className, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  
  // Extraer children
  let trigger = null;
  let content = null;
  let valueComponent = null;
  const items = [];
  
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (child.type === SelectTrigger) trigger = child;
    else if (child.type === SelectValue) valueComponent = child;
    else if (child.type === SelectContent) content = child;
    else if (child.type === SelectItem) items.push(child);
  });
  
  // Encontrar el label del valor seleccionado
  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    
    if (content && content.props && content.props.children) {
      React.Children.forEach(content.props.children, (item) => {
        if (item && item.props && item.props.value) {
          // Comparar valores (puede ser string o JSON string)
          const itemValue = item.props.value;
          const currentValue = String(value);
          if (String(itemValue) === currentValue) {
            setSelectedLabel(item.props.children || '');
          }
        }
      });
    }
  }, [value, content]);
  
  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const handleItemClick = (itemValue, itemLabel) => {
    if (onValueChange) {
      onValueChange(itemValue);
    }
    setSelectedLabel(itemLabel);
    setIsOpen(false);
  };
  
  const baseClasses = 'w-full';
  const errorClasses = error ? 'border-red-500' : '';
  
  return (
    <div ref={selectRef} className={`${baseClasses} ${className} relative`}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white cursor-pointer hover:border-gray-400'}
          flex items-center justify-between
        `}
        style={{ minHeight: '38px', maxHeight: '38px' }}
      >
        <span className={`${value ? 'text-gray-900' : 'text-gray-500'} truncate flex-1 text-left`} style={{ fontSize: '14px' }}>
          {selectedLabel || (valueComponent?.props?.placeholder || 'Seleccionar...')}
        </span>
        <svg 
          className="w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2"
          style={{ width: '16px', height: '16px' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Content (Dropdown) */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto" style={{ maxHeight: '192px' }}>
          {content && content.props && content.props.children ? (
            React.Children.map(content.props.children, (item, index) => {
              if (!item || !item.props) return null;
              
              // Verificar si es SelectItem comparando el tipo
              const isSelectItem = item.type === SelectItem || 
                                   (item.type && item.type.displayName === 'SelectItem') ||
                                   (item.props && item.props.value !== undefined);
              
              if (isSelectItem && item.props.value !== undefined) {
                const itemValue = String(item.props.value);
                const currentValue = value ? String(value) : '';
                const isSelected = itemValue === currentValue;
                
                return (
                  <div
                    key={item.props.value || index}
                    onClick={() => {
                      const label = typeof item.props.children === 'string' 
                        ? item.props.children 
                        : React.Children.toArray(item.props.children).join('');
                      handleItemClick(item.props.value, label);
                    }}
                    className={`
                      px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-sm transition-colors
                      ${isSelected ? 'bg-blue-100 font-medium' : ''}
                    `}
                    style={{ fontSize: '14px', lineHeight: '1.4' }}
                  >
                    {item.props.children}
                  </div>
                );
              }
              return null;
            }).filter(Boolean)
          ) : items.length > 0 ? (
            items.map((item, index) => {
              if (!item || !item.props) return null;
              const itemValue = String(item.props.value || '');
              const currentValue = value ? String(value) : '';
              const isSelected = itemValue === currentValue;
              
              return (
                <div
                  key={item.props.value || index}
                  onClick={() => {
                    const label = typeof item.props.children === 'string' 
                      ? item.props.children 
                      : React.Children.toArray(item.props.children).join('');
                    handleItemClick(item.props.value, label);
                  }}
                  className={`
                    px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-sm transition-colors
                    ${isSelected ? 'bg-blue-100 font-medium' : ''}
                  `}
                  style={{ fontSize: '14px', lineHeight: '1.4' }}
                >
                  {item.props.children}
                </div>
              );
            }).filter(Boolean)
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No hay opciones disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponentes
const SelectTrigger = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const SelectValue = ({ placeholder, ...props }) => {
  return <div {...props} />;
};

const SelectContent = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const SelectItem = ({ value, children, ...props }) => {
  return <div {...props}>{children}</div>;
};

// Asignar subcomponentes
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem;

export default Select;

