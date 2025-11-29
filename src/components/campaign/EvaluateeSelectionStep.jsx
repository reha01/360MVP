/**
 * Paso 2: Selección de Evaluados
 * CARGA DIRECTA de datos para evitar problemas de sincronización
 */

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import jobFamilyService from '../../services/jobFamilyService';
import orgStructureService from '../../services/orgStructureService';

const EvaluateeSelectionStep = ({
  filters: controlledFilters = { jobFamilyIds: [], areaIds: [], userIds: [] },
  onFilterChange,
  onSelectionChange, // NUEVO
  jobFamilies: propJobFamilies = [],
  areas: propAreas = [],
  users: propUsers = [],
  filteredUsers = [],
}) => {
  const { currentOrgId } = useMultiTenant();

  // Estado local para datos cargados directamente
  const [localJobFamilies, setLocalJobFamilies] = useState([]);
  const [localAreas, setLocalAreas] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set(controlledFilters.userIds || []));

  // Auto-sync selection to parent
  useEffect(() => {
    // Sync filters
    if (onFilterChange) {
      onFilterChange({
        ...controlledFilters,
        userIds: Array.from(selectedUsers)
      });
    }

    // Sync full user objects
    if (onSelectionChange) {
      const sourceUsers = propUsers.length > 0 ? propUsers : localUsers;
      const selectedUserObjects = sourceUsers.filter(u => selectedUsers.has(u.id));
      onSelectionChange(selectedUserObjects);
    }
  }, [selectedUsers, onFilterChange, onSelectionChange, propUsers, localUsers]);

  // Usar datos de props si existen, sino cargar directamente
  const jobFamilies = propJobFamilies.length > 0 ? propJobFamilies : localJobFamilies;
  const areas = propAreas.length > 0 ? propAreas : localAreas;
  const users = propUsers.length > 0 ? propUsers : localUsers;

  // Cargar datos directamente si no vienen en props
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrgId) {
        console.log('[Step2] No orgId');
        setLoading(false);
        return;
      }

      console.log('[Step2] Loading data for org:', currentOrgId);

      try {
        const [jfData, areasData, usersData] = await Promise.all([
          jobFamilyService.getOrgJobFamilies(currentOrgId).catch(() => []),
          orgStructureService.getOrgAreas(currentOrgId).catch(() => []),
          orgStructureService.getOrgUsers(currentOrgId).catch(() => [])
        ]);

        console.log('[Step2] Loaded:', { jf: jfData.length, areas: areasData.length, users: usersData.length });

        setLocalJobFamilies(jfData);
        setLocalAreas(areasData);
        setLocalUsers(usersData);
      } catch (err) {
        console.error('[Step2] Error loading:', err);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si props están vacías
    if (propJobFamilies.length === 0 && propAreas.length === 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentOrgId, propJobFamilies.length, propAreas.length]);

  const handleFilterChange = (filterType, value, checked) => {
    const newFilters = {
      ...controlledFilters,
      [filterType]: checked
        ? [...(controlledFilters[filterType] || []), value]
        : (controlledFilters[filterType] || []).filter(id => id !== value)
    };

    if (onFilterChange) {
      onFilterChange(newFilters);
    }
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
    const newFilters = {
      ...controlledFilters,
      userIds: Array.from(selectedUsers)
    };

    if (onFilterChange) {
      onFilterChange(newFilters);
    }

    // NUEVO: Devolver objetos completos de usuario si se requiere
    if (onSelectionChange) {
      // Buscar los objetos completos de los usuarios seleccionados
      // Buscamos en 'users' (prop) o 'localUsers' (estado)
      const sourceUsers = propUsers.length > 0 ? propUsers : localUsers;
      const selectedUserObjects = sourceUsers.filter(u => selectedUsers.has(u.id));
      onSelectionChange(selectedUserObjects);
    }
  };

  const displayUsers = (users || []).filter(user =>
    !searchTerm ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ padding: '32px 48px' }}>
      {/* Header with Context */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px' }}>
        <h3 style={{ fontSize: '28px', fontWeight: '600', color: '#1F2937', marginBottom: '12px' }}>
          ¿Quiénes participarán en esta campaña?
        </h3>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: 0, lineHeight: '1.6' }}>
          Selecciona a los colaboradores. El sistema asignará sus evaluaciones según la estrategia elegida (180°, 360°, etc).
        </p>
      </div>

      {/* Job Families */}
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

      {/* Áreas */}
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

      {/* Selección de usuarios */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Selección Manual de Usuarios
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>

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
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{user.displayName || user.name || 'Sin nombre'}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{user.email}</div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            {searchTerm ? 'No se encontraron usuarios con esa búsqueda' : 'Usa el buscador para agregar colaboradores'}
          </p>
        )}

        {selectedUsers.size > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button onClick={handleApplySelection} style={buttonStyle}>
              Aplicar Selección ({selectedUsers.size} usuarios)
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Resumen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>
              {filteredUsers.length || users.length}
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