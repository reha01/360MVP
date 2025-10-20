/**
 * Introducción de categoría
 */

import React from 'react';
import { Button, Card } from '../ui';

const CategoryIntro = ({ category, onStart }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-xl">📋</span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {category.name}
          </h2>
          
          <p className="text-gray-600">
            {category.description}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Preguntas en esta categoría:</h3>
          <p className="text-sm text-gray-600">
            {category.questions?.length || 0} preguntas
          </p>
        </div>
        
        <div className="text-center">
          <Button
            onClick={onStart}
            size="lg"
            className="w-full max-w-md"
          >
            Comenzar Preguntas
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CategoryIntro;
