/**
 * Paso 1: Información General de la Campaña
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Globe, Users } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Alert } from '../ui';
import { CAMPAIGN_TYPE, getCampaignTypeLabel } from '../../models/Campaign';

const CampaignInfoStep = ({ data, onChange }) => {
  const [formData, setFormData] = useState({
    title: data.title || '',
    description: data.description || '',
    type: data.type || CAMPAIGN_TYPE.CUSTOM,
    config: {
      startDate: data.config?.startDate || '',
      endDate: data.config?.endDate || '',
      timezone: data.config?.timezone || 'UTC',
      reminderSchedule: data.config?.reminderSchedule || [3, 7, 14]
    }
  });
  
  const [errors, setErrors] = useState({});
  
  // Notificar cambios al padre
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  const handleChange = (field, value) => {
    if (field.startsWith('config.')) {
      const configField = field.replace('config.', '');
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title || formData.title.length < 3) {
      newErrors.title = 'Título debe tener al menos 3 caracteres';
    }
    
    if (formData.config.startDate && formData.config.endDate) {
      const startDate = new Date(formData.config.startDate);
      const endDate = new Date(formData.config.endDate);
      
      if (startDate >= endDate) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      
      const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (durationDays < 1) {
        newErrors.endDate = 'La duración mínima es 1 día';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const getTimezones = () => {
    return [
      { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado)' },
      { value: 'America/New_York', label: 'EST/EDT (Nueva York)' },
      { value: 'America/Chicago', label: 'CST/CDT (Chicago)' },
      { value: 'America/Denver', label: 'MST/MDT (Denver)' },
      { value: 'America/Los_Angeles', label: 'PST/PDT (Los Ángeles)' },
      { value: 'Europe/London', label: 'GMT/BST (Londres)' },
      { value: 'Europe/Paris', label: 'CET/CEST (París)' },
      { value: 'Europe/Madrid', label: 'CET/CEST (Madrid)' },
      { value: 'America/Mexico_City', label: 'CST/CDT (Ciudad de México)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'ART (Buenos Aires)' }
    ];
  };
  
  const getReminderOptions = () => {
    return [
      { value: [1], label: '1 día antes' },
      { value: [3], label: '3 días antes' },
      { value: [7], label: '1 semana antes' },
      { value: [3, 7], label: '3 y 7 días antes' },
      { value: [3, 7, 14], label: '3, 7 y 14 días antes' },
      { value: [1, 3, 7], label: '1, 3 y 7 días antes' }
    ];
  };
  
  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Información Básica
          </h3>
          
          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Campaña *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ej: Evaluación 360° Q1 2025"
                error={errors.title}
                required
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>
            
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe el propósito y objetivos de esta campaña de evaluación..."
                rows={3}
              />
            </div>
            
            {/* Tipo de Campaña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Campaña
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar tipo" />
                </Select.Trigger>
                <Select.Content>
                  {Object.values(CAMPAIGN_TYPE).map(type => (
                    <Select.Item key={type} value={type}>
                      {getCampaignTypeLabel(type)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Configuración de Fechas */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Fechas y Duración
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <Input
                type="datetime-local"
                value={formData.config.startDate}
                onChange={(e) => handleChange('config.startDate', e.target.value)}
                required
              />
            </div>
            
            {/* Fecha de Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin *
              </label>
              <Input
                type="datetime-local"
                value={formData.config.endDate}
                onChange={(e) => handleChange('config.endDate', e.target.value)}
                error={errors.endDate}
                required
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
          
          {/* Duración calculada */}
          {formData.config.startDate && formData.config.endDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center text-sm text-blue-800">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  Duración: {Math.ceil((new Date(formData.config.endDate) - new Date(formData.config.startDate)) / (1000 * 60 * 60 * 24))} días
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Configuración de Zona Horaria */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Zona Horaria
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zona Horaria de la Organización
              </label>
              <Select
                value={formData.config.timezone}
                onValueChange={(value) => handleChange('config.timezone', value)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar zona horaria" />
                </Select.Trigger>
                <Select.Content>
                  {getTimezones().map(tz => (
                    <Select.Item key={tz.value} value={tz.value}>
                      {tz.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Las fechas y recordatorios se mostrarán en esta zona horaria
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Configuración de Recordatorios */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recordatorios Automáticos
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programación de Recordatorios
            </label>
            <Select
              value={JSON.stringify(formData.config.reminderSchedule)}
              onValueChange={(value) => handleChange('config.reminderSchedule', JSON.parse(value))}
            >
              <Select.Trigger>
                <Select.Value placeholder="Seleccionar programación" />
              </Select.Trigger>
              <Select.Content>
                {getReminderOptions().map(option => (
                  <Select.Item key={JSON.stringify(option.value)} value={JSON.stringify(option.value)}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Los evaluadores recibirán recordatorios automáticos según esta programación
            </p>
          </div>
        </div>
      </Card>
      
      {/* Validación */}
      {Object.keys(errors).length > 0 && (
        <Alert type="error">
          <Alert.Description>
            Por favor corrige los errores antes de continuar
          </Alert.Description>
        </Alert>
      )}
    </div>
  );
};

export default CampaignInfoStep;
