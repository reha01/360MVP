/**
 * Resumen de la evaluación antes del envío
 */

import React from 'react';
import { useEvaluation360 } from '../../context/Evaluation360Context';
import { Button, Card, Badge } from '../ui';

const EvaluationSummary = ({ onEdit, onSubmit }) => {
  const {
    testDefinition,
    answers,
    getProgress,
    getTimeSpent,
    isComplete
  } = useEvaluation360();
  
  const progress = getProgress();
  const timeSpent = getTimeSpent();
  const evaluationComplete = isComplete();
  
  const getCategoryProgress = () => {
    if (!testDefinition) return [];
    
    return testDefinition.categories.map(category => {
      const categoryQuestions = testDefinition.questions.filter(q => q.category.id === category.id);
      const answeredQuestions = categoryQuestions.filter(q => answers[q.id]).length;
      const completionRate = categoryQuestions.length > 0 
        ? Math.round((answeredQuestions / categoryQuestions.length) * 100)
        : 0;
      
      return {
        ...category,
        answeredQuestions,
        totalQuestions: categoryQuestions.length,
        completionRate
      };
    });
  };
  
  const categoryProgress = getCategoryProgress();
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Resumen de la Evaluación
        </h2>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progress.completionRate}%
            </div>
            <div className="text-sm text-blue-800">Completado</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progress.answeredQuestions}
            </div>
            <div className="text-sm text-green-800">Preguntas Respondidas</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {timeSpent}
            </div>
            <div className="text-sm text-purple-800">Minutos</div>
          </div>
        </div>
        
        {/* Category Progress */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Progreso por Categoría
          </h3>
          
          {categoryProgress.map(category => (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {category.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {category.answeredQuestions} de {category.totalQuestions} preguntas
                  </p>
                </div>
                
                <Badge className={
                  category.completionRate === 100 
                    ? 'bg-green-100 text-green-800'
                    : category.completionRate > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }>
                  {category.completionRate}%
                </Badge>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    category.completionRate === 100 
                      ? 'bg-green-600'
                      : category.completionRate > 0
                      ? 'bg-yellow-600'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${category.completionRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Validation Status */}
        <div className="mb-6">
          {evaluationComplete ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-green-900">
                    Evaluación Completa
                  </h4>
                  <p className="text-sm text-green-700">
                    Todas las preguntas requeridas han sido respondidas
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900">
                    Evaluación Incompleta
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Faltan preguntas requeridas por responder
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onEdit}
          >
            Editar Respuestas
          </Button>
          
          <Button
            onClick={onSubmit}
            disabled={!evaluationComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            {evaluationComplete ? 'Enviar Evaluación' : 'Completar Evaluación'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EvaluationSummary;
