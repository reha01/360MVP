// src/context/UIContext.js
import React, { createContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // TODO: Add state for modals, notifications, etc.

  const value = {
    loading,
    setLoading,
    error,
    setError,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export default UIContext;
