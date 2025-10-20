/**
 * Formulario para crear/editar áreas y departamentos
 */

import React, { useState, useEffect } from 'react';
import { ORG_LEVELS, MANAGER_TYPES } from '../../models/OrgStructure';
import { ORG_STRUCTURE_MESSAGES } from '../../constants/messages';
import { Button, Input, Select, Textarea, Alert } from '../ui';

const AreaForm = ({ area, areas, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: ORG_LEVELS.AREA,
    parentId: null,
    managerId: null,
    managerType: MANAGER_TYPES.FUNCTIONAL
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Inicializar formulario
  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || '',
        description: area.description || '',
        level: area.level || ORG_LEVELS.AREA,
        parentId: area.parentId || null,
        managerId: area.managerId || null,
        managerType: area.managerType || MANAGER_TYPES.FUNCTIONAL
      });
    }
  }, [area]);
  
  // Obtener áreas padre disponibles
  const getAvailableParents = () => {
    if (!area) {
      // Crear nueva área: solo áreas de nivel menor
      return areas.filter(a => a.level < ORG_LEVELS.DEPARTMENT);
    } else {
      // Editar: excluir la propia área y sus descendientes
      const excludeIds = [area.id];
      const addDescendants = (parentId) => {
        areas.filter(a => a.parentId === parentId).forEach(child => {
          excludeIds.push(child.id);
          addDescendants(child.id);
        });
      };
      addDescendants(area.id);
      
      return areas.filter(a => 
        !excludeIds.includes(a.id) && 
        a.level < ORG_LEVELS.DEPARTMENT
      );
    }
  };
  
  // Obtener usuarios disponibles para manager
  const getAvailableManagers = () => {
    // En una implementación real, esto vendría de la API
    return [
      { id: 'user1', name: 'Juan Pérez', email: 'juan@empresa.com' },
      { id: 'user2', name: 'María García', email: 'maria@empresa.com' },
      { id: 'user3', name: 'Carlos López', email: 'carlos@empresa.com' }
    ];
  };
  
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
    
    // Validar nivel
    if (formData.level < 1 || formData.level > 3) {
      newErrors.level = 'Nivel debe estar entre 1 y 3';
    }
    
    // Validar profundidad máxima
    if (formData.parentId) {
      const parent = areas.find(a => a.id === formData.parentId);
      if (parent && parent.level >= 3) {
        newErrors.parentId = 'No se pueden crear más subdivisiones (máximo 3 niveles)';
      }
    }
    
    // Validar nombre único
    const siblings = areas.filter(a => 
      a.parentId === formData.parentId && 
      a.id !== area?.id &&
      a.isActive
    );
    const duplicateName = siblings.find(a => 
      a.name.toLowerCase() === formData.name.toLowerCase()
    );
    if (duplicateName) {
      newErrors.name = `Ya existe un área llamada "${formData.name}" en este nivel`;
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
      case ORG_LEVELS.ORGANIZATION: return 'Organización';
      case ORG_LEVELS.AREA: return 'Área/División';
      case ORG_LEVELS.DEPARTMENT: return 'Departamento/Equipo';
      default: return 'Nivel';
    }
  };
  
  const getManagerTypeLabel = (type) => {
    switch (type) {
      case MANAGER_TYPES.FUNCTIONAL: return 'Funcional (Principal)';
      case MANAGER_TYPES.PROJECT: return 'Proyecto (Temporal)';
      case MANAGER_TYPES.MATRIX: return 'Matriz (Complejo)';
      default: return 'Tipo';
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
          placeholder="Ej: Ventas, Marketing, IT"
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
          placeholder="Descripción opcional del área..."
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
          Nivel *
        </label>
        <Select
          value={formData.level}
          onValueChange={(value) => handleChange('level', parseInt(value))}
          error={errors.level}
        >
          <Select.Trigger>
            <Select.Value placeholder="Seleccionar nivel" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ORG_LEVELS.ORGANIZATION}>
              {getLevelLabel(ORG_LEVELS.ORGANIZATION)}
            </Select.Item>
            <Select.Item value={ORG_LEVELS.AREA}>
              {getLevelLabel(ORG_LEVELS.AREA)}
            </Select.Item>
            <Select.Item value={ORG_LEVELS.DEPARTMENT}>
              {getLevelLabel(ORG_LEVELS.DEPARTMENT)}
            </Select.Item>
          </Select.Content>
        </Select>
        {errors.level && (
          <p className="text-sm text-red-600 mt-1">{errors.level}</p>
        )}
      </div>
      
      {/* Área Padre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área Padre
        </label>
        <Select
          value={formData.parentId || ''}
          onValueChange={(value) => handleChange('parentId', value || null)}
          error={errors.parentId}
        >
          <Select.Trigger>
            <Select.Value placeholder="Seleccionar área padre (opcional)" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Sin área padre</Select.Item>
            {getAvailableParents().map(parent => (
              <Select.Item key={parent.id} value={parent.id}>
                {parent.name} ({getLevelLabel(parent.level)})
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        {errors.parentId && (
          <p className="text-sm text-red-600 mt-1">{errors.parentId}</p>
        )}
      </div>
      
      {/* Manager */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Manager del Área
        </label>
        <Select
          value={formData.managerId || ''}
          onValueChange={(value) => handleChange('managerId', value || null)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Seleccionar manager (opcional)" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Sin manager asignado</Select.Item>
            {getAvailableManagers().map(manager => (
              <Select.Item key={manager.id} value={manager.id}>
                {manager.name} ({manager.email})
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      
      {/* Tipo de Manager */}
      {formData.managerId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Manager
          </label>
          <Select
            value={formData.managerType}
            onValueChange={(value) => handleChange('managerType', value)}
          >
            <Select.Trigger>
              <Select.Value placeholder="Seleccionar tipo" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={MANAGER_TYPES.FUNCTIONAL}>
                {getManagerTypeLabel(MANAGER_TYPES.FUNCTIONAL)}
              </Select.Item>
              <Select.Item value={MANAGER_TYPES.PROJECT}>
                {getManagerTypeLabel(MANAGER_TYPES.PROJECT)}
              </Select.Item>
              <Select.Item value={MANAGER_TYPES.MATRIX}>
                {getManagerTypeLabel(MANAGER_TYPES.MATRIX)}
              </Select.Item>
            </Select.Content>
          </Select>
        </div>
      )}
      
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
          {loading ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
};

export default AreaForm;
