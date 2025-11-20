/**
 * Paso 2: Selección de Evaluados
 * SOLUCIÓN SIMPLIFICADA: Formulario simple sin componentes complejos
 */

import React, { useState, useRef, useEffect } from 'react';
import { Users, Filter, Search, CheckCircle } from 'lucide-react';
import { getJobLevelLabel, getJobLevelColor } from '../../models/JobFamily';

const EvaluateeSelectionStep = ({ 
  filters: controlledFilters = { jobFamilyIds: [], areaIds: [], userIds: [] },
  onFilterChange,
  jobFamilies = [], 
  areas = [], 
  users = [], 
  filteredUsers = [], 
}) => {
  // Estado local simple
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  
  // Flag para prevenir callbacks durante mount
  const isReadyRef = useRef(false);
  
  useEffect(() => {
    // Esperar antes de permitir callbacks
    const timer = setTimeout(() => {
      isReadyRef.current = true;
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Handlers simples
  const handleFilterChange = (filterType, value, checked) => {
    if (!isReadyRef.current) return;
    
    const newFilters = {
      ...controlledFilters,
      [filterType]: checked 
        ? [...(controlledFilters[filterType] || []), value]
        : (controlledFilters[filterType] || []).filter(id => id !== value)
    };
    
    setTimeout(() => {
      if (onFilterChange && isReadyRef.current) {
        onFilterChange(newFilters);
      }
    }, 0);
  };
  
  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  const handleApplySelection = () => {
    if (!isReadyRef.current) return;
    
    const newFilters = {
      ...controlledFilters,
      userIds: Array.from(selectedUsers)
    };
    
    setTimeout(() => {
      if (onFilterChange && isReadyRef.current) {
        onFilterChange(newFilters);
      }
    }, 0);
  };
  
  // Filtrado simple para búsqueda manual
  // Usar 'users' (todos los usuarios disponibles) en lugar de 'filteredUsers' (que solo muestra usuarios que cumplen filtros)
  const displayUsers = (users || []).filter(user =>
    !searchTerm || 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Estilos inline simples
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    marginBottom: '16px'
  };
  
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px'
  };
  
  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  };
  
  return (
    <div style={{ padding: '0' }}>
      {/* Job Families - Formulario simple */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Filtrar por Job Family
        </h3>
        {jobFamilies.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {jobFamilies.map(family => (
              <label key={family.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(controlledFilters.jobFamilyIds || []).includes(family.id)}
                  onChange={(e) => handleFilterChange('jobFamilyIds', family.id, e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px' }}>{family.name || 'Sin nombre'}</span>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: '14px' }}>No hay Job Families configuradas</p>
        )}
      </div>
      
      {/* Áreas - Formulario simple */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Filtrar por Área/Departamento
        </h3>
        {areas.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {areas.map(area => (
              <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(controlledFilters.areaIds || []).includes(area.id)}
                  onChange={(e) => handleFilterChange('areaIds', area.id, e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px' }}>{area.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: '14px' }}>No hay áreas configuradas</p>
        )}
      </div>
      
      {/* Selección de usuarios - Formulario simple */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Selección Manual de Usuarios
        </h3>
        
        {/* Búsqueda simple */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
        
        {/* Lista de usuarios simple */}
        {displayUsers.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px' }}>
            {displayUsers.map(user => (
              <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  style={{ width: '16px', height: '16px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{user.displayName || 'Sin nombre'}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{user.email}</div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
          </p>
        )}
        
        {/* Botón aplicar */}
        {selectedUsers.size > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button onClick={handleApplySelection} style={buttonStyle}>
              Aplicar Selección ({selectedUsers.size} usuarios)
            </button>
          </div>
        )}
      </div>
      
      {/* Resumen simple */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Resumen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>
              {filteredUsers.length}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Usuarios</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>
              {(controlledFilters.jobFamilyIds || []).length}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Job Families</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#F5F3FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6' }}>
              {(controlledFilters.areaIds || []).length}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Áreas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluateeSelectionStep;
