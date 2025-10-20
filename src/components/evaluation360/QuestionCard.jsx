/**
 * Tarjeta de pregunta individual
 */

import React, { useState, useEffect } from 'react';
import { useEvaluation360 } from '../../context/Evaluation360Context';
import { QUESTION_TYPES, LIKERT_SCALES } from '../../models/Evaluation360Response';
import { Button, Card, RadioGroup, Checkbox, Textarea } from '../ui';

const QuestionCard = ({ question, questionNumber, totalQuestions, category }) => {
  const { answers, saveAnswer } = useEvaluation360();
  const [selectedValue, setSelectedValue] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [textValue, setTextValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Cargar respuesta existente
  useEffect(() => {
    const existingAnswer = answers[question.id];
    if (existingAnswer) {
      if (question.type === QUESTION_TYPES.LIKERT) {
        setSelectedValue(existingAnswer.value);
      } else if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
        setSelectedOptions(existingAnswer.options || []);
      } else if (question.type === QUESTION_TYPES.TEXT_OPEN) {
        setTextValue(existingAnswer.text || '');
      }
    }
  }, [answers, question.id, question.type]);
  
  // Guardar respuesta
  const handleSaveAnswer = async (answerData) => {
    try {
      setIsSaving(true);
      await saveAnswer(question.id, answerData);
    } catch (error) {
      console.error('[QuestionCard] Error saving answer:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Manejar cambio de valor Likert
  const handleLikertChange = (value) => {
    setSelectedValue(value);
    handleSaveAnswer({
      value: parseInt(value),
      answer: value
    });
  };
  
  // Manejar cambio de opciones múltiples
  const handleMultipleChoiceChange = (option, checked) => {
    let newOptions;
    if (checked) {
      newOptions = [...selectedOptions, option];
    } else {
      newOptions = selectedOptions.filter(opt => opt !== option);
    }
    
    setSelectedOptions(newOptions);
    handleSaveAnswer({
      options: newOptions,
      answer: newOptions.join(', ')
    });
  };
  
  // Manejar cambio de texto
  const handleTextChange = (value) => {
    setTextValue(value);
    handleSaveAnswer({
      text: value,
      answer: value
    });
  };
  
  const renderQuestionType = () => {
    switch (question.type) {
      case QUESTION_TYPES.LIKERT:
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Escala: {question.scale?.min || 1} = Muy en desacuerdo, {question.scale?.max || 5} = Muy de acuerdo
            </div>
            
            <RadioGroup
              value={selectedValue?.toString()}
              onValueChange={handleLikertChange}
            >
              {Array.from({ length: question.scale?.max || 5 }, (_, i) => {
                const value = i + 1;
                const label = LIKERT_SCALES.FIVE_POINT.labels[value] || `${value}`;
                
                return (
                  <div key={value} className="flex items-center space-x-3">
                    <RadioGroup.Item value={value.toString()} id={`${question.id}-${value}`} />
                    <label htmlFor={`${question.id}-${value}`} className="text-sm text-gray-700">
                      {value} - {label}
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );
        
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => handleMultipleChoiceChange(option, checked)}
                />
                <label className="text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
        
      case QUESTION_TYPES.TEXT_OPEN:
        return (
          <div className="space-y-2">
            <Textarea
              value={textValue}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={4}
              maxLength={question.maxLength || 500}
            />
            {question.maxLength && (
              <div className="text-xs text-gray-500 text-right">
                {textValue.length}/{question.maxLength} caracteres
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="text-gray-500 text-sm">
            Tipo de pregunta no soportado: {question.type}
          </div>
        );
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-600">
                Pregunta {questionNumber} de {totalQuestions}
              </span>
              {question.required && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Requerida
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {question.text}
            </h3>
            
            {category && (
              <div className="text-sm text-gray-600">
                Categoría: {category.name}
              </div>
            )}
          </div>
          
          {isSaving && (
            <div className="text-blue-600 text-sm">
              Guardando...
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {renderQuestionType()}
        </div>
        
        {question.helpText && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 {question.helpText}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuestionCard;
