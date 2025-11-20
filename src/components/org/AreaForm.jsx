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
    level: ORG_LEVELS.AREA, // Valor por defecto, pero no se muestra en el formulario
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
    <form onSubmit={handleSubmit} style={{ padding: '0', margin: '0' }}>
      {errors.submit && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <div>{errors.submit}</div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Nombre */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '500', 
            color: '#495057', 
            marginBottom: '8px' 
          }}>
            Nombre <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Ventas, Marketing, IT"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: errors.name ? '1px solid #dc2626' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.name ? '#dc2626' : '#ced4da';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.name && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', marginBottom: 0 }}>
              {errors.name}
            </p>
          )}
        </div>
        
        {/* Descripción */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '500', 
            color: '#495057', 
            marginBottom: '8px' 
          }}>
            Descripción <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'normal' }}>(Opcional)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descripción opcional del área..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: errors.description ? '1px solid #dc2626' : '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.description ? '#dc2626' : '#ced4da';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.description && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', marginBottom: 0 }}>
              {errors.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Botones */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '12px', 
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #dee2e6'
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '10px 20px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: 'white',
            color: '#212529',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#adb5bd';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#dee2e6';
            }
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#6c757d' : '#0d6efd',
            color: 'white',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#0b5ed7';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(13, 110, 253, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#0d6efd';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          {loading ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default AreaForm;
