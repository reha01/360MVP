/**
 * Formulario para crear/editar Job Families
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Alert } from '../ui';

const JobFamilyForm = ({ jobFamily, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Inicializar formulario
  useEffect(() => {
    if (jobFamily) {
      setFormData({
        name: jobFamily.name || '',
        description: jobFamily.description || ''
      });
    }
  }, [jobFamily]);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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