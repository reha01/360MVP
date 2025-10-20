/**
 * Formulario para asignar usuarios a estructura organizacional
 */

import React, { useState, useEffect } from 'react';
import { MANAGER_TYPES } from '../../models/OrgStructure';
import { ORG_STRUCTURE_MESSAGES } from '../../constants/messages';
import { Button, Input, Select, Alert } from '../ui';

const UserStructureForm = ({ user, areas, users, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    userId: '',
    areaId: null,
    departmentId: null,
    managerId: null,
    managerType: MANAGER_TYPES.FUNCTIONAL,
    jobTitle: '',
    jobFamilyIds: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Inicializar formulario
  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.id,
        areaId: user.areaId || null,
        departmentId: user.departmentId || null,
        managerId: user.managerId || null,
        managerType: user.managerType || MANAGER_TYPES.FUNCTIONAL,
        jobTitle: user.jobTitle || '',
        jobFamilyIds: user.jobFamilyIds || []
      });
    }
  }, [user]);
  
  // Obtener usuarios disponibles para manager
  const getAvailableManagers = () => {
    return users.filter(u => u.id !== formData.userId);
  };
  
  // Obtener áreas disponibles
  const getAvailableAreas = () => {
    return areas.filter(area => area.level <= 2); // Solo áreas, no departamentos
  };
  
  // Obtener departamentos disponibles para el área seleccionada
  const getAvailableDepartments = () => {
    if (!formData.areaId) return [];
    return areas.filter(area => 
      area.parentId === formData.areaId && area.level === 3
    );
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
    
    // Si cambia el área, limpiar departamento
    if (field === 'areaId') {
      setFormData(prev => ({
        ...prev,
        areaId: value,
        departmentId: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validar usuario
    if (!user && !formData.userId) {
      newErrors.userId = 'Usuario requerido';
    }
    
    // Validar job title
    if (!formData.jobTitle || formData.jobTitle.length < 2) {
      newErrors.jobTitle = 'Cargo debe tener al menos 2 caracteres';
    }
    
    // Validar manager type
    if (formData.managerType && !Object.values(MANAGER_TYPES).includes(formData.managerType)) {
      newErrors.managerType = 'Tipo de manager inválido';
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
      await onSubmit(formData.userId, formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
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
      
      {/* Usuario (solo si no está editando) */}
      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario *
          </label>
          <Select
            value={formData.userId}
            onValueChange={(value) => handleChange('userId', value)}
            error={errors.userId}
          >
            <Select.Trigger>
              <Select.Value placeholder="Seleccionar usuario" />
            </Select.Trigger>
            <Select.Content>
              {users.map(u => (
                <Select.Item key={u.id} value={u.id}>
                  {u.displayName} ({u.email})
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          {errors.userId && (
            <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
          )}
        </div>
      )}
      
      {/* Cargo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cargo *
        </label>
        <Input
          value={formData.jobTitle}
          onChange={(e) => handleChange('jobTitle', e.target.value)}
          placeholder="Ej: Gerente de Ventas, Analista Senior"
          error={errors.jobTitle}
          required
        />
        {errors.jobTitle && (
          <p className="text-sm text-red-600 mt-1">{errors.jobTitle}</p>
        )}
      </div>
      
      {/* Área */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área
        </label>
        <Select
          value={formData.areaId || ''}
          onValueChange={(value) => handleChange('areaId', value || null)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Seleccionar área (opcional)" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Sin área asignada</Select.Item>
            {getAvailableAreas().map(area => (
              <Select.Item key={area.id} value={area.id}>
                {area.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      
      {/* Departamento */}
      {formData.areaId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <Select
            value={formData.departmentId || ''}
            onValueChange={(value) => handleChange('departmentId', value || null)}
          >
            <Select.Trigger>
              <Select.Value placeholder="Seleccionar departamento (opcional)" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">Sin departamento asignado</Select.Item>
              {getAvailableDepartments().map(dept => (
                <Select.Item key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      )}
      
      {/* Manager */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Manager
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
                {manager.displayName} ({manager.jobTitle})
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
      
      {/* Job Families (placeholder para futura implementación) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Families
        </label>
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
          La asignación de Job Families estará disponible en el siguiente módulo.
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
          {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Asignar')}
        </Button>
      </div>
    </form>
  );
};

export default UserStructureForm;
