/**
 * Paso 2: Selección de Audiencia (Rediseñado)
 * Enfoque: Selección masiva y por grupos, con ajuste manual secundario.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import jobFamilyService from '../../services/jobFamilyService';
import orgStructureService from '../../services/orgStructureService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';

const EvaluateeSelectionStep = ({
  filters: controlledFilters = { jobFamilyIds: [], areaIds: [], userIds: [] },
  onFilterChange,
  onSelectionChange,
  jobFamilies: propJobFamilies = [],
  areas: propAreas = [],
  users: propUsers = [],
}) => {
  const { currentOrgId } = useMultiTenant();

  // Estado local para datos
  const [localJobFamilies, setLocalJobFamilies] = useState([]);
  const [localAreas, setLocalAreas] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado de UI
  const [isManualSelectionOpen, setIsManualSelectionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado de Selección
  // Inicializamos con los IDs que vienen de props
  const [selectedUserIds, setSelectedUserIds] = useState(new Set(controlledFilters.userIds || []));

  // Usar datos de props si existen, sino cargar directamente
  const jobFamilies = propJobFamilies.length > 0 ? propJobFamilies : localJobFamilies;
  const areas = propAreas.length > 0 ? propAreas : localAreas;
  const users = propUsers.length > 0 ? propUsers : localUsers;

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      try {
        const [jfData, areasData, usersData] = await Promise.all([
          jobFamilyService.getOrgJobFamilies(currentOrgId).catch(() => []),
          orgStructureService.getOrgAreas(currentOrgId).catch(() => []),
          getOrgUsers(currentOrgId).catch(() => [])
        ]);

        setLocalJobFamilies(jfData);
        setLocalAreas(areasData);
        setLocalUsers(usersData);
      } catch (err) {
        console.error('[Step2] Error loading:', err);
      } finally {
        setLoading(false);
      }
    };

    if (propJobFamilies.length === 0 && propAreas.length === 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentOrgId, propJobFamilies.length, propAreas.length]);

  // Sincronizar selección con el padre
  useEffect(() => {
    const selectedIdsArray = Array.from(selectedUserIds);

    // Sync filters (legacy support)
    if (onFilterChange) {
      onFilterChange({
        ...controlledFilters,
        userIds: selectedIdsArray
      });
    }

    // Sync full objects
    if (onSelectionChange) {
      const selectedObjects = users.filter(u => selectedUserIds.has(u.id));
      onSelectionChange(selectedObjects);
    }
  }, [selectedUserIds, onFilterChange, onSelectionChange, users]);

  // --- Lógica de Selección ---

  const handleSelectAll = (checked) => {
    if (checked) {
      // Seleccionar todos los usuarios activos
      const allActiveIds = users
        .filter(u => u.isActive !== false) // Solo activos
        .map(u => u.id);
      setSelectedUserIds(new Set(allActiveIds));
    } else {
      // Deseleccionar todos
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectGroup = (type, groupId, checked) => {
    const targetUserIds = users
      .filter(u => {
        if (u.isActive === false) return false;
        if (type === 'jobFamily') return (u.jobFamilyIds || []).includes(groupId);
        if (type === 'area') return u.areaId === groupId; // Asumiendo areaId único o array
        return false;
      })
      .map(u => u.id);

    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      targetUserIds.forEach(id => {
        if (checked) newSet.add(id);
        else newSet.delete(id);
      });
      return newSet;
    });
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  // --- Helpers de UI ---

  const isAllSelected = users.length > 0 && selectedUserIds.size === users.filter(u => u.isActive !== false).length;

  // Calcular si un grupo está completamente seleccionado
  const getGroupSelectionState = (type, groupId) => {
    const groupUsers = users.filter(u => {
      if (u.isActive === false) return false;
      if (type === 'jobFamily') return (u.jobFamilyIds || []).includes(groupId);
      if (type === 'area') return u.areaId === groupId;
      return false;
    });

    if (groupUsers.length === 0) return false;

    const selectedCount = groupUsers.filter(u => selectedUserIds.has(u.id)).length;
    return selectedCount === groupUsers.length;
  };

  const filteredDisplayUsers = users.filter(user =>
    !searchTerm ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando colaboradores...</div>;

  return (
    <div className="evaluatee-selection-step">
      {/* Header & Counter */}
      <div className="selection-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3B82F6', lineHeight: '1' }}>
          {selectedUserIds.size}
        </div>
        <div style={{ fontSize: '16px', color: '#6B7280', fontWeight: '500' }}>
          Colaboradores Seleccionados
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
          de {users.filter(u => u.isActive !== false).length} activos disponibles
        </div>
      </div>

      {/* Main Actions */}
      <div className="selection-actions" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#F3F4F6', borderRadius: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          Incluir a todos los miembros activos de la organización
        </label>
      </div>

      {/* Group Filters */}
      <div className="group-filters" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Job Families Column */}
        <div className="filter-column" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Por Job Family
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {jobFamilies.map(jf => {
              const isSelected = getGroupSelectionState('jobFamily', jf.id);
              const count = users.filter(u => u.isActive !== false && (u.jobFamilyIds || []).includes(jf.id)).length;

              return (
                <label key={jf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '6px', backgroundColor: isSelected ? '#EFF6FF' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectGroup('jobFamily', jf.id, e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{jf.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '10px' }}>
                    {count}
                  </span>
                </label>
              );
            })}
            {jobFamilies.length === 0 && <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No hay Job Families configuradas</p>}
          </div>
        </div>

        {/* Areas Column */}
        <div className="filter-column" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Por Área
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {areas.map(area => {
              const isSelected = getGroupSelectionState('area', area.id);
              const count = users.filter(u => u.isActive !== false && u.areaId === area.id).length;

              return (
                <label key={area.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '6px', backgroundColor: isSelected ? '#EFF6FF' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectGroup('area', area.id, e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{area.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '10px' }}>
                    {count}
                  </span>
                </label>
              );
            })}
            {areas.length === 0 && <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>No hay Áreas configuradas</p>}
          </div>
        </div>
      </div>

      {/* Manual Exception Handling (Accordion) */}
      <div className="manual-selection" style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        <button
          onClick={() => setIsManualSelectionOpen(!isManualSelectionOpen)}
          style={{
            width: '100%',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563' }}>
            Ajustar selección manualmente / Ver lista detallada
          </span>
          <span style={{ transform: isManualSelectionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>

        {isManualSelectionOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
            <input
              type="text"
              placeholder="Buscar colaborador por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '14px'
              }}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
              {filteredDisplayUsers.map(user => (
                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
                      {user.displayName || user.name || 'Sin nombre'}
                      {user.isActive === false && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#EF4444', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>Inactivo</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {user.email} • {user.jobTitle || 'Sin cargo'}
                    </div>
                  </div>
                </label>
              ))}
              {filteredDisplayUsers.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluateeSelectionStep;