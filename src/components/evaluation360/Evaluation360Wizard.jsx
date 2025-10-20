/**
 * Wizard de Evaluación 360°
 * 
 * Componente principal para realizar evaluaciones 360°
 * con navegación por categorías y guardado automático
 */

import React, { useState, useEffect } from 'react';
import { useEvaluation360 } from '../../context/Evaluation360Context';
import { 
  getEvaluatorTypeLabel, 
  getEvaluatorTypeColor,
  getTokenTimeRemaining 
} from '../../models/EvaluatorAssignment';
import { 
  getResponseStatusLabel, 
  getResponseStatusColor 
} from '../../models/Evaluation360Response';
import { Button, Card, Progress, Alert, Spinner, Badge } from '../ui';

// Subcomponentes
import CategoryIntro from './CategoryIntro';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import EvaluationSummary from './EvaluationSummary';

const Evaluation360Wizard = () => {
  const {
    assignment,
    response,
    testDefinition,
    answers,
    currentCategory,
    isLoading,
    isSaving,
    error,
    lastSaved,
    getProgress,
    getCurrentCategoryQuestions,
    isComplete,
    getTimeSpent,
    goToCategory,
    setViewMode,
    viewMode,
    showCategoryIntro,
    setShowCategoryIntro
  } = useEvaluation360();
  
  const [currentStep, setCurrentStep] = useState('intro');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Obtener progreso
  const progress = getProgress();
  const timeSpent = getTimeSpent();
  
  // Obtener tiempo restante del token
  const timeRemaining = assignment ? getTokenTimeRemaining(assignment) : null;
  
  // Verificar si la evaluación está completa
  const evaluationComplete = isComplete();
  
  // Obtener preguntas de la categoría actual
  const currentQuestions = getCurrentCategoryQuestions();
  
  // Manejar selección de categoría
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentStep('category');
    setShowCategoryIntro(true);
  };
  
  // Manejar inicio de evaluación
  const handleStartEvaluation = () => {
    if (testDefinition && testDefinition.categories.length > 0) {
      handleCategorySelect(testDefinition.categories[0]);
    }
  };
  
  // Manejar finalización de categoría
  const handleCategoryComplete = () => {
    const currentIndex = testDefinition.categories.findIndex(c => c.id === selectedCategory.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < testDefinition.categories.length) {
      // Ir a la siguiente categoría
      handleCategorySelect(testDefinition.categories[nextIndex]);
    } else {
      // Evaluación completa
      setCurrentStep('summary');
    }
  };
  
  // Manejar envío de evaluación
  const handleSubmitEvaluation = async () => {
    try {
      // Enviar evaluación (implementar en contexto)
      console.log('[Evaluation360Wizard] Submitting evaluation');
      setCurrentStep('completed');
    } catch (err) {
      console.error('[Evaluation360Wizard] Error submitting evaluation:', err);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando evaluación...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert type="error" className="mb-4">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
      </Alert>
    );
  }
  
  if (!assignment || !testDefinition) {
    return (
      <Alert type="error" className="mb-4">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>
          No se pudo cargar la información de la evaluación
        </Alert.Description>
      </Alert>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Evaluación 360°
            </h1>
            <p className="text-gray-600 mt-1">
              {testDefinition.name} - {assignment.evaluateeName}
            </p>
          </div>
          
          <div className="text-right">
            <Badge className={getEvaluatorTypeColor(assignment.evaluatorType)}>
              {getEvaluatorTypeLabel(assignment.evaluatorType)}
            </Badge>
            <div className="text-sm text-gray-500 mt-1">
              Tiempo: {timeSpent} min
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <ProgressBar 
          progress={progress.completionRate}
          answeredQuestions={progress.answeredQuestions}
          totalQuestions={progress.totalQuestions}
        />
        
        {/* Status */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            {lastSaved && (
              <div className="text-sm text-gray-500">
                Guardado: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {isSaving && (
              <div className="flex items-center text-blue-600">
                <Spinner size="sm" />
                <span className="ml-1 text-sm">Guardando...</span>
              </div>
            )}
          </div>
          
          {timeRemaining && (
            <div className={`text-sm ${
              timeRemaining.expired ? 'text-red-600' : 
              timeRemaining.days < 1 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {timeRemaining.expired ? 'Token expirado' : 
               `Tiempo restante: ${timeRemaining.days}d ${timeRemaining.hours}h`}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-6">
        {currentStep === 'intro' && (
          <Card>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">🎯</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Bienvenido a la Evaluación 360°
              </h2>
              
              <p className="text-gray-600 mb-6">
                Estás a punto de evaluar a <strong>{assignment.evaluateeName}</strong> en 
                <strong> {testDefinition.name}</strong>. Tu feedback es valioso para su desarrollo profesional.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Instrucciones:</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• La evaluación es completamente anónima</li>
                  <li>• Toma aproximadamente 15-20 minutos completar</li>
                  <li>• Sé honesto y constructivo en tus respuestas</li>
                  <li>• Puedes guardar tu progreso y continuar después</li>
                  <li>• Completa todas las preguntas requeridas</li>
                </ul>
              </div>
              
              <Button
                onClick={handleStartEvaluation}
                size="lg"
                className="w-full max-w-md"
              >
                Comenzar Evaluación
              </Button>
            </div>
          </Card>
        )}
        
        {currentStep === 'category' && selectedCategory && (
          <div className="space-y-6">
            {/* Category Intro */}
            {showCategoryIntro && (
              <CategoryIntro
                category={selectedCategory}
                onStart={() => setShowCategoryIntro(false)}
              />
            )}
            
            {/* Questions */}
            {!showCategoryIntro && (
              <div className="space-y-4">
                {currentQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={index + 1}
                    totalQuestions={currentQuestions.length}
                    category={selectedCategory}
                  />
                ))}
                
                {/* Category Actions */}
                <Card>
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Categoría: {selectedCategory.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {currentQuestions.length} preguntas
                        </p>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCategoryIntro(true)}
                        >
                          Ver Introducción
                        </Button>
                        
                        <Button
                          onClick={handleCategoryComplete}
                          disabled={!evaluationComplete}
                        >
                          {evaluationComplete ? 'Continuar' : 'Completar Categoría'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 'summary' && (
          <EvaluationSummary
            onEdit={() => setCurrentStep('category')}
            onSubmit={handleSubmitEvaluation}
          />
        )}
        
        {currentStep === 'completed' && (
          <Card>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Evaluación Completada!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Gracias por completar la evaluación de <strong>{assignment.evaluateeName}</strong>. 
                Tu feedback ha sido enviado y será utilizado para su desarrollo profesional.
              </p>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Resumen:</h3>
                <ul className="text-sm text-green-800 text-left space-y-1">
                  <li>• Evaluación completada exitosamente</li>
                  <li>• Tiempo total: {timeSpent} minutos</li>
                  <li>• Preguntas respondidas: {progress.answeredQuestions}/{progress.totalQuestions}</li>
                  <li>• Tu feedback es anónimo y confidencial</li>
                </ul>
              </div>
              
              <Button
                onClick={() => window.close()}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Evaluation360Wizard;
