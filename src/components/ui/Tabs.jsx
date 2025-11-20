// src/components/ui/Tabs.jsx
import React, { createContext, useContext, useState } from 'react';

/**
 * Tabs Context
 */
const TabsContext = createContext();

/**
 * Tabs - Componente de pestañas reutilizable
 */
const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * Tabs.List - Contenedor de los triggers de las pestañas
 */
const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Tabs.Trigger - Botón de pestaña individual
 */
const TabsTrigger = ({ value, children, className = '' }) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext);
  const isActive = currentValue === value;
  
  const baseClasses = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors';
  const activeClasses = isActive 
    ? 'border-blue-500 text-blue-600' 
    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300';
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`${baseClasses} ${activeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Tabs.Content - Contenido de cada pestaña
 */
const TabsContent = ({ value, children, className = '' }) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) {
    return null;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Attach subcomponents
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export default Tabs;




