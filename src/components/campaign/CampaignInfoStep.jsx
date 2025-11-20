/**
 * Paso 1: Información General de la Campaña
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Globe, Users } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Alert } from '../ui';
import { CAMPAIGN_TYPE, getCampaignTypeLabel } from '../../models/Campaign';
import './CampaignInfoStep.css';

const CampaignInfoStep = React.memo(({ data, onChange }) => {
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
  
  // Notificar cambios al padre (solo cuando formData cambia realmente)
  const prevFormDataRef = React.useRef();
  const onChangeRef = React.useRef(onChange);
  const isInitialMountRef = React.useRef(true);
  const skipNextUpdateRef = React.useRef(false);
  
  // Mantener onChange actualizado sin causar re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Prevenir actualizaciones durante el mount inicial
  useEffect(() => {
    // Esperar 2 ciclos de render antes de permitir actualizaciones
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Saltar actualizaciones durante el mount inicial
    if (isInitialMountRef.current || skipNextUpdateRef.current) {
      skipNextUpdateRef.current = false;
      return;
    }
    
    let isMounted = true;
    let timeoutId = null;
    
    const formDataStr = JSON.stringify(formData);
    if (onChangeRef.current && formDataStr !== prevFormDataRef.current) {
      prevFormDataRef.current = formDataStr;
      
      // Usar doble defer para asegurar que el render terminó completamente
      Promise.resolve().then(() => {
        if (!isMounted) return;
        
        requestAnimationFrame(() => {
          if (!isMounted) return;
          
          timeoutId = setTimeout(() => {
            if (isMounted && onChangeRef.current && !isInitialMountRef.current) {
              onChangeRef.current(formData);
            }
          }, 150); // Delay más largo para asegurar que el render terminó
        });
      });
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [formData]);
  
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
    <div>
      {/* Información Básica */}
      <div className="step-section">
        <div className="step-section-header">
          <Users className="step-section-icon" />
          <h3 className="step-section-title">Información Básica</h3>
        </div>
        
        <div>
          {/* Título */}
          <div className="step-form-group">
            <label className="step-form-label required">
              Título de la Campaña
            </label>
            <input
              type="text"
              className={`step-form-input ${errors.title ? 'border-red-500' : ''}`}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Evaluación 360° Q1 2025"
              required
            />
            {errors.title && (
              <p className="step-form-error">{errors.title}</p>
            )}
          </div>
          
          {/* Descripción */}
          <div className="step-form-group">
            <label className="step-form-label">
              Descripción
            </label>
            <textarea
              className="step-form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe el propósito y objetivos de esta campaña de evaluación..."
              rows={3}
            />
          </div>
          
          {/* Tipo de Campaña */}
          <div className="step-form-group">
            <label className="step-form-label">
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
      
      {/* Configuración de Fechas */}
      <div className="step-section">
        <div className="step-section-header">
          <Calendar className="step-section-icon" />
          <h3 className="step-section-title">Fechas y Duración</h3>
        </div>
        
        <div className="step-form-grid">
          {/* Fecha de Inicio */}
          <div className="step-form-group">
            <label className="step-form-label required">
              Fecha de Inicio
            </label>
            <input
              type="datetime-local"
              className="step-form-input"
              value={formData.config.startDate || ''}
              onChange={(e) => handleChange('config.startDate', e.target.value)}
              required
            />
          </div>
          
          {/* Fecha de Fin */}
          <div className="step-form-group">
            <label className="step-form-label required">
              Fecha de Fin
            </label>
            <input
              type="datetime-local"
              className={`step-form-input ${errors.endDate ? 'border-red-500' : ''}`}
              value={formData.config.endDate || ''}
              onChange={(e) => handleChange('config.endDate', e.target.value)}
              required
            />
            {errors.endDate && (
              <p className="step-form-error">{errors.endDate}</p>
            )}
          </div>
        </div>
        
        {/* Duración calculada */}
        {formData.config.startDate && formData.config.endDate && (
          <div className="step-duration-info">
            <Clock className="step-duration-icon" />
            <span>
              Duración: {Math.ceil((new Date(formData.config.endDate) - new Date(formData.config.startDate)) / (1000 * 60 * 60 * 24))} días
            </span>
          </div>
        )}
      </div>
      
      {/* Configuración de Zona Horaria */}
      <div className="step-section">
        <div className="step-section-header">
          <Globe className="step-section-icon" />
          <h3 className="step-section-title">Zona Horaria</h3>
        </div>
        
        <div className="step-form-group">
          <label className="step-form-label">
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
          <p className="step-form-help">
            Las fechas y recordatorios se mostrarán en esta zona horaria
          </p>
        </div>
      </div>
      
      {/* Configuración de Recordatorios */}
      <div className="step-section">
        <div className="step-section-header">
          <Clock className="step-section-icon" />
          <h3 className="step-section-title">Recordatorios Automáticos</h3>
        </div>
        
        <div className="step-form-group">
          <label className="step-form-label">
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
          <p className="step-form-help">
            Los evaluadores recibirán recordatorios automáticos según esta programación
          </p>
        </div>
      </div>
      
      {/* Validación */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-error" style={{ marginTop: '20px' }}>
          <span>Por favor corrige los errores antes de continuar</span>
        </div>
      )}
    </div>
  );
});

CampaignInfoStep.displayName = 'CampaignInfoStep';

export default CampaignInfoStep;
