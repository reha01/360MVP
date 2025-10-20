/**
 * Formulario para crear/editar Job Families
 */

import React, { useState, useEffect } from 'react';
import { JOB_LEVELS } from '../../models/JobFamily';
import { Button, Input, Select, Textarea, Alert } from '../ui';

const JobFamilyForm = ({ jobFamily, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR,
    evaluatorConfig: {
      requireSelf: true,
      requireManager: true,
      peersMin: 3,
      peersMax: 5,
      subordinatesMin: 0
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Inicializar formulario
  useEffect(() => {
    if (jobFamily) {
      setFormData({
        name: jobFamily.name || '',
        description: jobFamily.description || '',
        level: jobFamily.level || JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR,
        evaluatorConfig: {
          requireSelf: jobFamily.evaluatorConfig?.requireSelf !== undefined ? jobFamily.evaluatorConfig.requireSelf : true,
          requireManager: jobFamily.evaluatorConfig?.requireManager !== undefined ? jobFamily.evaluatorConfig.requireManager : true,
          peersMin: jobFamily.evaluatorConfig?.peersMin || 3,
          peersMax: jobFamily.evaluatorConfig?.peersMax || 5,
          subordinatesMin: jobFamily.evaluatorConfig?.subordinatesMin || 0
        }
      });
    }
  }, [jobFamily]);
  
  const handleChange = (field, value) => {
    if (field.startsWith('evaluatorConfig.')) {
      const configField = field.replace('evaluatorConfig.', '');
      setFormData(prev => ({
        ...prev,
        evaluatorConfig: {
          ...prev.evaluatorConfig,
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
    
    // Validar nombre
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Nombre debe tener al menos 2 caracteres';
    }
    
    if (formData.name && formData.name.length > 100) {
      newErrors.name = 'Nombre no puede exceder 100 caracteres';
    }
    
    // Validar descripción
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descripción no puede exceder 500 caracteres';
    }
    
    // Validar nivel
    if (!Object.values(JOB_LEVELS).includes(formData.level)) {
      newErrors.level = 'Nivel inválido';
    }
    
    // Validar configuración de evaluadores
    const config = formData.evaluatorConfig;
    
    if (config.peersMin < 0 || config.peersMin > 10) {
      newErrors['evaluatorConfig.peersMin'] = 'Mínimo de pares debe estar entre 0 y 10';
    }
    
    if (config.peersMax < config.peersMin) {
      newErrors['evaluatorConfig.peersMax'] = 'Máximo de pares no puede ser menor al mínimo';
    }
    
    if (config.subordinatesMin < 0) {
      newErrors['evaluatorConfig.subordinatesMin'] = 'Mínimo de subordinados no puede ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const getLevelLabel = (level) => {
    switch (level) {
      case JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR: return 'Contribuidor Individual';
      case JOB_LEVELS.MANAGER: return 'Gerente';
      case JOB_LEVELS.DIRECTOR: return 'Director';
      case JOB_LEVELS.EXECUTIVE: return 'Ejecutivo';
      default: return 'Nivel';
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <Alert type="error">
          <Alert.Description>{errors.submit}</Alert.Description>
        </Alert>
      )}
      
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej: Gerente de Ventas, Analista Senior"
          error={errors.name}
          required
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
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
          placeholder="Descripción detallada del rol y responsabilidades..."
          rows={3}
          error={errors.description}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
      </div>
      
      {/* Nivel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nivel Jerárquico *
        </label>
        <Select
          value={formData.level}
          onValueChange={(value) => handleChange('level', value)}
          error={errors.level}
        >
          <Select.Trigger>
            <Select.Value placeholder="Seleccionar nivel" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR}>
              {getLevelLabel(JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR)}
            </Select.Item>
            <Select.Item value={JOB_LEVELS.MANAGER}>
              {getLevelLabel(JOB_LEVELS.MANAGER)}
            </Select.Item>
            <Select.Item value={JOB_LEVELS.DIRECTOR}>
              {getLevelLabel(JOB_LEVELS.DIRECTOR)}
            </Select.Item>
            <Select.Item value={JOB_LEVELS.EXECUTIVE}>
              {getLevelLabel(JOB_LEVELS.EXECUTIVE)}
            </Select.Item>
          </Select.Content>
        </Select>
        {errors.level && (
          <p className="text-sm text-red-600 mt-1">{errors.level}</p>
        )}
      </div>
      
      {/* Configuración de Evaluadores */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Evaluadores
        </h3>
        
        {/* Autoevaluación */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.evaluatorConfig.requireSelf}
              onChange={(e) => handleChange('evaluatorConfig.requireSelf', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Requerir autoevaluación
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            El evaluado debe completar su propia evaluación
          </p>
        </div>
        
        {/* Manager */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.evaluatorConfig.requireManager}
              onChange={(e) => handleChange('evaluatorConfig.requireManager', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Requerir evaluación del manager
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            El manager directo debe evaluar al empleado
          </p>
        </div>
        
        {/* Pares */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mínimo de Pares
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.evaluatorConfig.peersMin}
              onChange={(e) => handleChange('evaluatorConfig.peersMin', parseInt(e.target.value))}
              error={errors['evaluatorConfig.peersMin']}
            />
            {errors['evaluatorConfig.peersMin'] && (
              <p className="text-sm text-red-600 mt-1">{errors['evaluatorConfig.peersMin']}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo de Pares
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.evaluatorConfig.peersMax}
              onChange={(e) => handleChange('evaluatorConfig.peersMax', parseInt(e.target.value))}
              error={errors['evaluatorConfig.peersMax']}
            />
            {errors['evaluatorConfig.peersMax'] && (
              <p className="text-sm text-red-600 mt-1">{errors['evaluatorConfig.peersMax']}</p>
            )}
          </div>
        </div>
        
        {/* Subordinados */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mínimo de Subordinados
          </label>
          <Input
            type="number"
            min="0"
            value={formData.evaluatorConfig.subordinatesMin}
            onChange={(e) => handleChange('evaluatorConfig.subordinatesMin', parseInt(e.target.value))}
            error={errors['evaluatorConfig.subordinatesMin']}
          />
          {errors['evaluatorConfig.subordinatesMin'] && (
            <p className="text-sm text-red-600 mt-1">{errors['evaluatorConfig.subordinatesMin']}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Solo aplica para roles de liderazgo (Gerente, Director, Ejecutivo)
          </p>
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (jobFamily ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
};

export default JobFamilyForm;