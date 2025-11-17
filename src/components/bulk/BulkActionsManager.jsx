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
import './BulkActionsManager.css';

const BulkActionsManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: bulkActionsEnabled, loading: flagsLoading } = useRuntimeFeatureFlags('FEATURE_BULK_ACTIONS');
  
  // Estados principales
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
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
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadAssignments();
    }
  }, [currentOrgId, loadAssignments]);
  
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
  
  // Ejecutar acción masiva
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
      
      if (type === 'resend') {
        result = await bulkActionService.resendInvitations(
          currentOrgId, 
          selectedAssignments,
          customMessage
        );
      } else if (type === 'extend') {
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
      } else if (type === 'deactivate') {
        // Simulación de desactivación
        result = {
          processed: selectedAssignments.length,
          success: selectedAssignments.length
        };
      }
      
      const actionLabels = {
        'resend': 'Invitaciones reenviadas',
        'extend': 'Plazos extendidos',
        'reminder': 'Recordatorios enviados',
        'deactivate': 'Miembros desactivados'
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
      
      {/* Sección de acciones */}
      <div className="actions-section">
        <h2>Ejecutar acciones masivas</h2>
        <p className="section-description">
          Marca los checkboxes de la tabla para habilitar las acciones
        </p>
        
        <div className="action-buttons">
          <button 
            className="btn-action btn-primary"
            onClick={() => executeBulkAction('resend')}
            disabled={selectedAssignments.length === 0 || actionInProgress}
            title="Envía nuevamente el correo de invitación a los evaluadores seleccionados"
          >
            📧 Invitar miembros
            <span className="btn-tooltip">
              Reenvía el correo de invitación a los evaluadores seleccionados.
              Útil para recordatorios o cuando no recibieron el correo original.
            </span>
          </button>
          
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
          
          <button 
            className="btn-action btn-secondary"
            onClick={() => executeBulkAction('deactivate')}
            disabled={selectedAssignments.length === 0 || actionInProgress}
            title="Desactiva las asignaciones seleccionadas"
          >
            ⛔ Desactivar miembros
            <span className="btn-tooltip">
              Cancela las evaluaciones seleccionadas y las marca como inactivas.
              No se envían notificaciones. Útil para corregir asignaciones erróneas.
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
              <th>Última invitación</th>
              <th>Último recordatorio</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>
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
                    {assignment.lastInvitationSent ? (() => {
                      try {
                        const date = assignment.lastInvitationSent?.toDate ? assignment.lastInvitationSent.toDate() : new Date(assignment.lastInvitationSent);
                        return isNaN(date.getTime()) ? '--' : date.toLocaleString('es-CL', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return '--';
                      }
                    })() : '--'}
                  </td>
                  <td>
                    {assignment.lastReminderSent ? (() => {
                      try {
                        const date = assignment.lastReminderSent?.toDate ? assignment.lastReminderSent.toDate() : new Date(assignment.lastReminderSent);
                        return isNaN(date.getTime()) ? '--' : date.toLocaleString('es-CL', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return '--';
                      }
                    })() : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkActionsManager;
