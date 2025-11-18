/**
 * BulkActionsManager - Componente para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Envío de recordatorios
 * - Extensión de plazos masiva
 * - Desactivación de asignaciones
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useRuntimeFeatureFlags } from '../../hooks/useRuntimeFeatureFlags';
import bulkActionService from '../../services/bulkActionService';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './BulkActionsManager.css';

// Función helper para formatear fechas: dd-mm-yy HH:mm (24 horas)
const formatDateCompact = (dateValue) => {
  if (!dateValue) return '--';
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return '--';
    
    // Formato: dd-mm-yy HH:mm (24 horas)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Últimos 2 dígitos del año
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return '--';
  }
};

const BulkActionsManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: bulkActionsEnabled, loading: flagsLoading } = useRuntimeFeatureFlags('FEATURE_BULK_ACTIONS');
  
  // Estado para toggle entre vistas
  const [activeView, setActiveView] = useState('assignments'); // 'assignments' o 'members'
  
  // Estados principales
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Estados para acciones
  const [actionType, setActionType] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [extensionDays, setExtensionDays] = useState(7);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    campaignId: 'all',
    evaluatorType: 'all'
  });
  
  // Estados para paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  });
  
  // Cargar datos de asignaciones
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await evaluatorAssignmentService.getAllAssignments(currentOrgId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      });
      
      setAssignments(result.assignments || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        hasMore: result.hasMore || false
      }));
      
    } catch (err) {
      console.error('[BulkActionsManager] Error loading assignments:', err);
      setError('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, pagination.page, pagination.pageSize, filters]);
  
  // Cargar datos de miembros
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const users = await getOrgUsers(currentOrgId);
      setMembers(users || []);
      
    } catch (err) {
      console.error('[BulkActionsManager] Error loading members:', err);
      setError('Error al cargar los miembros');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);
  
  // Efecto para cargar datos según la vista activa
  useEffect(() => {
    if (currentOrgId) {
      if (activeView === 'assignments') {
        loadAssignments();
      } else if (activeView === 'members') {
        loadMembers();
      }
    }
  }, [currentOrgId, activeView, loadAssignments, loadMembers]);
  
  // Manejar selección de asignaciones
  const handleSelectAssignment = (assignmentId) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      } else {
        return [...prev, assignmentId];
      }
    });
  };
  
  // Manejar selección de todas las asignaciones
  const handleSelectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map(a => a.id));
    }
  };
  
  // Ejecutar acción masiva para Asignaciones
  const executeBulkAction = async (type) => {
    if (selectedAssignments.length === 0) {
      setError('Debes seleccionar al menos una asignación');
      return;
    }
    
    setActionType(type);
    setActionInProgress(true);
    setActionResult(null);
    setError(null);
    
    try {
      let result;
      
      if (type === 'extend') {
        result = await bulkActionService.extendDeadlines(
          currentOrgId, 
          selectedAssignments,
          extensionDays
        );
      } else if (type === 'reminder') {
        result = await bulkActionService.sendReminders(
          currentOrgId, 
          selectedAssignments,
          customMessage
        );
      }
      
      const actionLabels = {
        'extend': 'Plazos extendidos',
        'reminder': 'Recordatorios enviados'
      };
      
      setActionResult({
        success: true,
        message: `✅ ${actionLabels[type]}: ${result?.success || result?.processed || selectedAssignments.length} de ${selectedAssignments.length}`
      });
      
      // Limpiar selección y recargar datos
      setSelectedAssignments([]);
      setTimeout(() => loadAssignments(), 1000);
      
    } catch (err) {
      console.error(`[BulkActionsManager] Error executing ${type}:`, err);
      setActionResult({
        success: false,
        message: `❌ Error: ${err.message || 'No se pudo ejecutar la acción'}`
      });
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Ejecutar acción masiva para Miembros
  const executeMemberAction = async (type) => {
    if (selectedMembers.length === 0) {
      setError('Debes seleccionar al menos un miembro');
      return;
    }
    
    setActionType(type);
    setActionInProgress(true);
    setActionResult(null);
    setError(null);
    
    try {
      let result;
      
      if (type === 'resend') {
        // Invitar miembros seleccionados
        result = await bulkActionService.resendInvitations(
          currentOrgId, 
          selectedMembers,
          customMessage
        );
      } else if (type === 'deactivate') {
        // Desactivar miembros seleccionados y escribir deactivatedAt
        let successCount = 0;
        const now = new Date();
        
        for (const memberId of selectedMembers) {
          try {
            const memberRef = doc(db, 'members', memberId);
            await updateDoc(memberRef, {
              isActive: false,
              deactivatedAt: serverTimestamp(),
              deactivatedAtDate: now.toISOString(),
              updatedAt: serverTimestamp()
            });
            successCount++;
            console.log(`[BulkActionsManager] Deactivated member ${memberId} at ${now.toISOString()}`);
          } catch (err) {
            console.error(`[BulkActionsManager] Error deactivating member ${memberId}:`, err);
          }
        }
        
        result = {
          processed: selectedMembers.length,
          success: successCount
        };
      }
      
      const actionLabels = {
        'resend': 'Invitaciones enviadas',
        'deactivate': 'Miembros desactivados'
      };
      
      setActionResult({
        success: true,
        message: `✅ ${actionLabels[type]}: ${result?.success || result?.processed || selectedMembers.length} de ${selectedMembers.length}`
      });
      
      // Limpiar selección y recargar datos
      setSelectedMembers([]);
      // Recargar miembros después de cualquier acción para mostrar datos actualizados
      setTimeout(() => {
        loadMembers();
        // También recargar asignaciones si estamos en esa vista, ya que pueden haber cambiado
        if (activeView === 'assignments') {
          loadAssignments();
        }
      }, 1000);
      
    } catch (err) {
      console.error(`[BulkActionsManager] Error executing member action ${type}:`, err);
      setActionResult({
        success: false,
        message: `❌ Error: ${err.message || 'No se pudo ejecutar la acción'}`
      });
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Renderizar estado de asignación
  const renderStatus = (status) => {
    const statusConfig = {
      'pending': { label: 'Pendiente', class: 'status-pending' },
      'completed': { label: 'Completada', class: 'status-completed' },
      'expired': { label: 'Expirada', class: 'status-expired' },
      'in_progress': { label: 'En progreso', class: 'status-progress' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };
  
  // Calcular estadísticas
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    expired: assignments.filter(a => a.status === 'expired').length
  };
  
  // Esperar a que termine de cargar el feature flag
  if (flagsLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Cargando...</span>
      </div>
    );
  }
  
  if (loading && assignments.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Cargando asignaciones...</span>
      </div>
    );
  }
  
  return (
    <div className="bulk-actions-container">
      {/* Header */}
      <div className="bulk-actions-header">
        <h1>Acciones Masivas</h1>
        <p className="description">
          Gestión de invitaciones y plazos para evaluaciones 360°
        </p>
      </div>
      
      {/* Toggle entre vistas */}
      <div className="view-toggle-container">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeView === 'assignments' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('assignments');
              setSelectedAssignments([]);
              setSelectedMembers([]);
            }}
          >
            Asignaciones
          </button>
          <button
            className={`toggle-btn ${activeView === 'members' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('members');
              setSelectedAssignments([]);
              setSelectedMembers([]);
            }}
          >
            Miembros
          </button>
        </div>
      </div>
      
      {/* Vista de Asignaciones */}
      {activeView === 'assignments' && (
        <>
      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card" title="Número total de evaluaciones asignadas en el sistema">
          <div className="stat-label">Total asignaciones</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-tooltip">Total de evaluaciones asignadas</div>
        </div>
        
        <div className="stat-card" title="Invitaciones enviadas que aún no han sido completadas por los evaluadores. Acción recomendada: Reenviar invitaciones o verificar que los evaluadores hayan recibido el correo">
          <div className="stat-label">Pendiente</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-tooltip">
            Esperando que el evaluador complete la evaluación.
            <br />💡 Puedes reenviar invitaciones o extender el plazo
          </div>
        </div>
        
        <div className="stat-card" title="Evaluaciones que el evaluador ha iniciado pero no ha completado. Acción recomendada: Enviar recordatorio o extender el plazo si es necesario">
          <div className="stat-label">En progreso</div>
          <div className="stat-value">{stats.inProgress}</div>
          <div className="stat-tooltip">
            El evaluador comenzó pero no ha finalizado.
            <br />💡 Considera enviar un recordatorio
          </div>
        </div>
        
        <div className="stat-card" title="Evaluaciones finalizadas exitosamente por los evaluadores">
          <div className="stat-label">Completada</div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-tooltip">
            Evaluaciones completadas exitosamente
          </div>
        </div>
        
        <div className="stat-card" title="Evaluaciones cuyo plazo de respuesta ha vencido sin ser completadas. Acción recomendada: Extender el plazo o contactar directamente al evaluador">
          <div className="stat-label">Expirada</div>
          <div className="stat-value">{stats.expired}</div>
          <div className="stat-tooltip">
            Plazo vencido sin completar.
            <br />💡 Usa "Extender plazo" para dar más tiempo
          </div>
        </div>
      </div>
      
      {/* Sección de acciones - Solo para Asignaciones */}
      <div className="actions-section">
        <h2>Ejecutar acciones masivas</h2>
        <p className="section-description">
          Marca los checkboxes de la tabla para habilitar las acciones
        </p>
        
        <div className="action-buttons">
          <button 
            className="btn-action btn-info"
            onClick={() => executeBulkAction('reminder')}
            disabled={selectedAssignments.length === 0 || actionInProgress}
            title="Envía un correo de recordatorio amigable a los evaluadores seleccionados"
          >
            🔔 Enviar recordatorio
            <span className="btn-tooltip">
              Envía un correo recordatorio amigable a los evaluadores.
              No sustituye la invitación original, solo es un recordatorio.
              Ideal para evaluaciones pendientes o en progreso.
            </span>
          </button>
          
          <button 
            className="btn-action btn-warning"
            onClick={() => executeBulkAction('extend')}
            disabled={selectedAssignments.length === 0 || actionInProgress}
            title="Amplía el plazo de respuesta por 7 días adicionales"
          >
            ⏰ Extender plazo ({extensionDays} días)
            <span className="btn-tooltip">
              Extiende el plazo de respuesta por {extensionDays} días adicionales.
              Ideal para evaluaciones expiradas o próximas a vencer.
            </span>
          </button>
        </div>
        
        {actionResult && (
          <div className={`alert ${actionResult.success ? 'alert-success' : 'alert-error'}`}>
            {actionResult.message}
            <button className="alert-close" onClick={() => setActionResult(null)}>×</button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        <div className="search-section">
          <label>Buscar por nombre o correo</label>
          <input
            type="text"
            placeholder="Ej: maria.lopez@example.com"
            className="search-input"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          
          <select 
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completada</option>
            <option value="expired">Expirada</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de asignaciones */}
      <div className="table-container">
        <table className="assignments-table">
          <thead>
            <tr>
              <th style={{width: '40px'}}>
                <input
                  type="checkbox"
                  checked={selectedAssignments.length === assignments.length && assignments.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Área / Unidad</th>
              <th>Estado</th>
              <th>Último recordatorio</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
                  No se encontraron asignaciones
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedAssignments.includes(assignment.id)}
                      onChange={() => handleSelectAssignment(assignment.id)}
                    />
                  </td>
                  <td>{assignment.evaluatorName || '--'}</td>
                  <td>{assignment.evaluatorEmail}</td>
                  <td>{assignment.evaluatorType || 'employee'}</td>
                  <td>{assignment.area || '--'}</td>
                  <td>{renderStatus(assignment.status)}</td>
                  <td>
                    {formatDateCompact(assignment.lastReminderSent || assignment.lastReminderSentDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
      
      {/* Vista de Miembros */}
      {activeView === 'members' && (
        <div className="members-view">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total miembros</div>
              <div className="stat-value">{members.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Activos</div>
              <div className="stat-value">{members.filter(m => m.isActive !== false).length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Inactivos</div>
              <div className="stat-value">{members.filter(m => m.isActive === false).length}</div>
            </div>
          </div>
          
          {/* Sección de acciones para Miembros */}
          <div className="actions-section">
            <h2>Ejecutar acciones masivas</h2>
            <p className="section-description">
              Marca los checkboxes de la tabla para habilitar las acciones
            </p>
            
            <div className="action-buttons">
              <button 
                className="btn-action btn-primary"
                onClick={() => executeMemberAction('resend')}
                disabled={selectedMembers.length === 0 || actionInProgress}
                title="Envía invitaciones de bienvenida a los miembros seleccionados"
              >
                📧 Invitar miembros
                <span className="btn-tooltip">
                  Envía correos de invitación de bienvenida a los miembros seleccionados.
                  Útil para nuevos miembros o cuando necesitan acceso a la plataforma.
                </span>
              </button>
              
              <button 
                className="btn-action btn-secondary"
                onClick={() => executeMemberAction('deactivate')}
                disabled={selectedMembers.length === 0 || actionInProgress}
                title="Desactiva los miembros seleccionados"
              >
                ⛔ Desactivar miembros
                <span className="btn-tooltip">
                  Desactiva los miembros seleccionados y les revoca el acceso.
                  No se envían notificaciones. Útil para miembros que ya no pertenecen a la organización.
                </span>
              </button>
            </div>
            
            {actionResult && (
              <div className={`alert ${actionResult.success ? 'alert-success' : 'alert-error'}`}>
                {actionResult.message}
                <button className="alert-close" onClick={() => setActionResult(null)}>×</button>
              </div>
            )}
            
            {error && (
              <div className="alert alert-error">
                {error}
                <button className="alert-close" onClick={() => setError(null)}>×</button>
              </div>
            )}
          </div>
          
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th style={{width: '40px'}}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === members.length && members.length > 0}
                      onChange={() => {
                        if (selectedMembers.length === members.length) {
                          setSelectedMembers([]);
                        } else {
                          setSelectedMembers(members.map(m => m.id));
                        }
                      }}
                    />
                  </th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Área / Unidad</th>
                  <th>Estado</th>
                  <th>Última Invitación</th>
                  <th>Veces Enviado</th>
                  <th>Desactivación</th>
                  <th>Última sesión</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{textAlign: 'center', padding: '40px'}}>
                      No se encontraron miembros
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    // Construir nombre completo
                    const fullName = [
                      member.name,
                      member.lastNamePaternal || member.lastName,
                      member.lastNameMaternal
                    ].filter(Boolean).join(' ') || '--';
                    
                    return (
                      <tr key={member.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => {
                              setSelectedMembers(prev => {
                                if (prev.includes(member.id)) {
                                  return prev.filter(id => id !== member.id);
                                } else {
                                  return [...prev, member.id];
                                }
                              });
                            }}
                          />
                        </td>
                        <td>{fullName}</td>
                        <td>{member.email || member.workEmail || '--'}</td>
                        <td>{member.role || member.memberRole || '--'}</td>
                        <td>{member.area || member.unit || member.department || '--'}</td>
                        <td>
                          {member.isActive === false ? (
                            <span className="status-badge status-expired">Inactivo</span>
                          ) : (
                            <span className="status-badge status-completed">Activo</span>
                          )}
                        </td>
                        <td>{formatDateCompact(member.lastInvitationSent || member.lastInvitationSentDate)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            backgroundColor: member.invitationCount > 0 ? '#e3f2fd' : '#f5f5f5',
                            color: member.invitationCount > 0 ? '#1976d2' : '#757575',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {member.invitationCount || 0}
                          </span>
                        </td>
                        <td>{formatDateCompact(member.deactivatedAt || member.deactivatedAtDate)}</td>
                        <td>{formatDateCompact(member.lastLoginAt || member.lastLoginAtDate)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsManager;
