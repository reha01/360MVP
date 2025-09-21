// src/hooks/useEvaluation.js
import { useContext } from 'react';
import EvaluationContext from '../context/EvaluationContext';

const useEvaluation = () => {
  return useContext(EvaluationContext);
};

export default useEvaluation;
