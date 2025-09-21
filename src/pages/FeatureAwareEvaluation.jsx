// src/pages/FeatureAwareEvaluation.jsx
import React from 'react';
import FeatureGate from '../components/FeatureGate';
import Evaluation from './Evaluation';

const FeatureAwareEvaluation = () => {
  return (
    <FeatureGate 
      feature="wizard" 
      showDisabledMessage={true}
      fallback={
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Evaluación No Disponible</h2>
          <p>El sistema de evaluaciones está deshabilitado en este entorno.</p>
        </div>
      }
    >
      <Evaluation />
    </FeatureGate>
  );
};

export default FeatureAwareEvaluation;
