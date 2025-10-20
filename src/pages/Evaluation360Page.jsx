/**
 * Página de Evaluación 360°
 * 
 * Página principal para realizar evaluaciones 360° con token
 */

import React from 'react';
import { Evaluation360Provider } from '../context/Evaluation360Context';
import Evaluation360Wizard from '../components/evaluation360/Evaluation360Wizard';

const Evaluation360Page = () => {
  return (
    <Evaluation360Provider>
      <div className="min-h-screen bg-gray-50">
        <Evaluation360Wizard />
      </div>
    </Evaluation360Provider>
  );
};

export default Evaluation360Page;
