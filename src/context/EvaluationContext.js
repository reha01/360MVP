// src/context/EvaluationContext.js
import React, { createContext, useState } from 'react';

const EvaluationContext = createContext();

export const EvaluationProvider = ({ children }) => {
  const [evaluation, setEvaluation] = useState(null);
  // TODO: Add state for answers, progress, etc.

  const value = {
    evaluation,
    setEvaluation,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};

export default EvaluationContext;
