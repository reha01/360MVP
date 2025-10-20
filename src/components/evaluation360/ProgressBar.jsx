/**
 * Barra de progreso de la evaluación
 */

import React from 'react';

const ProgressBar = ({ progress, answeredQuestions, totalQuestions }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Progreso de la Evaluación
        </span>
        <span className="text-sm text-gray-600">
          {answeredQuestions} de {totalQuestions} preguntas
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-center">
        <span className="text-sm font-medium text-gray-900">
          {progress}% completado
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
