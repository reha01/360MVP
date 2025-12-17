/**
 * Paso 1: Información General de la Campaña
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Globe, Users, User, UserPlus, Network } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Alert } from '../ui';
import { CAMPAIGN_TYPE, getCampaignTypeLabel } from '../../models/Campaign';
import './CampaignInfoStep.css';

// Componente interno para selección visual de tipo
const CampaignTypeCard = ({ type, selected, onSelect, icon: Icon, title, description }) => (
  <div
    onClick={() => onSelect(type)}
    style={{
      border: `2px solid ${selected ? '#3B82F6' : '#E5E7EB'}`,
      backgroundColor: selected ? '#EFF6FF' : 'white',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: 'flex-start',
      minHeight: '140px'
    }}
  >
    <div style={{
      backgroundColor: selected ? '#BFDBFE' : '#F3F4F6',
      padding: '10px',
      borderRadius: '50%'
    }}>
      <Icon size={24} color={selected ? '#2563EB' : '#6B7280'} />
    </div>
    <div>
      <h4 style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '16px', color: selected ? '#1E40AF' : '#1F2937' }}>
        {title}
      </h4>
      <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: '1.4' }}>
        {description}
      </p>
    </div>
  </div>
);

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
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialMountRef.current || skipNextUpdateRef.current) {
      skipNextUpdateRef.current = false;
      return;
    }

    let isMounted = true;
    let timeoutId = null;

    const formDataStr = JSON.stringify(formData);
    if (onChangeRef.current && formDataStr !== prevFormDataRef.current) {
      prevFormDataRef.current = formDataStr;

      Promise.resolve().then(() => {
        if (!isMounted) return;

        requestAnimationFrame(() => {
          if (!isMounted) return;

          timeoutId = setTimeout(() => {
            if (isMounted && onChangeRef.current && !isInitialMountRef.current) {
              onChangeRef.current(formData);
            }
          }, 150);
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
      { value: 'America/Santiago', label: 'Santiago (Chile)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
      { value: 'America/Sao_Paulo', label: 'São Paulo (Brasil)' },
      { value: 'America/Sao_Paulo', label: 'Río de Janeiro (Brasil)' },
      { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
      { value: 'America/Lima', label: 'Perú (Lima)' },
      { value: 'America/Guatemala', label: 'Guatemala' },
      { value: 'America/New_York', label: 'Miami (EE.UU.)' },
      { value: 'America/New_York', label: 'Nueva York (EE.UU.)' },
      { value: 'America/Chicago', label: 'Chicago (EE.UU.)' },
      { value: 'America/Denver', label: 'Denver (EE.UU.)' },
      { value: 'America/Los_Angeles', label: 'Los Ángeles (EE.UU.)' },
      { value: 'America/Mexico_City', label: 'Ciudad de México' },
      { value: 'Europe/Madrid', label: 'Madrid (España)' },
      { value: 'Europe/Paris', label: 'París (Francia)' }
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
                <Select.Item key={tz.label} value={tz.value}>
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
