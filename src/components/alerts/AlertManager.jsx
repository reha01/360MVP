/**
 * AlertManager - Centro de gestión de alertas y errores
 * 
 * Características:
 * - Visualización de errores DLQ (Dead Letter Queue)
 * - Alertas de rate limits
 * - Notificaciones de bounces de email
 * - Acciones de retry y resolución
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useRuntimeFeatureFlags } from '../../hooks/useRuntimeFeatureFlags';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import HelpInstructions from '../ui/HelpInstructions';
import './AlertManager.css';

const AlertManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: alertsEnabled, loading: flagsLoading } = useRuntimeFeatureFlags('FEATURE_OPERATIONAL_ALERTS');
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, dlq, rate_limit, email_bounce
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Obtener alertas resueltas desde Firestore
  const getResolvedAlerts = useCallback(async () => {
    if (!currentOrgId) return [];
    
    try {
      const resolvedRef = collection(db, `organizations/${currentOrgId}/resolvedAlerts`);
      const snapshot = await getDocs(resolvedRef);
      return snapshot.docs.map(doc => doc.id); // Retornar array de IDs resueltos
    } catch (error) {
      console.warn('[AlertManager] Could not load resolved alerts from Firestore (non-critical):', error);
      // Fallback a localStorage si hay error (migración gradual)
      try {
        const stored = localStorage.getItem(`resolved_alerts_${currentOrgId}`);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  }, [currentOrgId]);
  
  // Guardar alerta resuelta en Firestore
  const markAlertAsResolved = async (alertId) => {
    if (!currentOrgId) return;
    
    try {
      const resolvedRef = doc(db, `organizations/${currentOrgId}/resolvedAlerts`, alertId);
      await setDoc(resolvedRef, {
        alertId,
        resolvedAt: serverTimestamp(),
        resolvedBy: 'current-user', // TODO: obtener usuario actual real
        createdAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`[AlertManager] Alert ${alertId} marked as resolved in Firestore`);
    } catch (error) {
      console.error('Error saving resolved alert to Firestore:', error);
      // Fallback a localStorage si hay error
      try {
        const stored = localStorage.getItem(`resolved_alerts_${currentOrgId}`);
        const resolved = stored ? JSON.parse(stored) : [];
        if (!resolved.includes(alertId)) {
          resolved.push(alertId);
          localStorage.setItem(`resolved_alerts_${currentOrgId}`, JSON.stringify(resolved));
        }
      } catch (localError) {
        console.error('Error saving to localStorage fallback:', localError);
      }
    }
  };

  // Cargar alertas
  const loadAlerts = useCallback(async () => {
    if (!currentOrgId) return;
    
    setLoading(true);
    try {
      // Cargar desde DLQ
      const dlqRef = collection(db, `organizations/${currentOrgId}/bulkActionDLQ`);
      let q = query(
        dlqRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (filter !== 'all') {
        q = query(
          dlqRef,
          where('type', '==', filter),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const alertsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Asegurar que el status se lea correctamente desde Firestore
          status: data.status || 'active',
          source: 'dlq'
        };
      });

      // Simular algunas alertas adicionales para demo
      const resolvedAlerts = await getResolvedAlerts();
      const demoAlerts = [
        {
          id: 'demo-1',
          type: 'rate_limit',
          title: 'Límite de emails excedido',
          message: 'Se alcanzó el límite diario de 100 emails para el plan Starter',
          severity: 'warning',
          createdAt: new Date(),
          status: resolvedAlerts.includes('demo-1') ? 'resolved' : 'active',
          source: 'system'
        },
        {
          id: 'demo-2',
          type: 'email_bounce',
          title: 'Email rechazado',
          message: 'El email bounce@simulator.com fue rechazado por el servidor',
          severity: 'error',
          assignmentId: 'assignment-123',
          createdAt: new Date(Date.now() - 3600000),
          status: resolvedAlerts.includes('demo-2') ? 'resolved' : 'pending_retry',
          retryCount: 1,
          source: 'email'
        }
      ];

      setAlerts([...alertsData, ...demoAlerts]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, filter]);

  // Cargar alertas al montar y cuando cambia el filtro
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!currentOrgId || !alertsEnabled) return;

    const interval = setInterval(() => {
      loadAlerts();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [currentOrgId, alertsEnabled, loadAlerts]);

  // Auto-ocultar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleRetry = async (alert) => {
    setRetrying(true);
    try {
      console.log('Retrying alert:', alert);
      
      // Actualizar estado en DLQ
      if (alert.source === 'dlq') {
        const alertRef = doc(db, `organizations/${currentOrgId}/bulkActionDLQ`, alert.id);
        await updateDoc(alertRef, {
          status: 'retrying',
          lastRetry: serverTimestamp(),
          retryCount: (alert.retryCount || 0) + 1
        });
      }

      await loadAlerts();
      setSuccessMessage('✅ Reintento iniciado correctamente');
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error retrying:', error);
      setSuccessMessage('❌ Error al reintentar: ' + error.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleResolve = async (alert) => {
    setResolving(true);
    try {
      if (alert.source === 'dlq') {
        const alertRef = doc(db, `organizations/${currentOrgId}/bulkActionDLQ`, alert.id);
        await updateDoc(alertRef, {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'current-user'
        });
      } else {
        // Para alertas demo, guardar en Firestore
        await markAlertAsResolved(alert.id);
      }

      // Recargar alertas para reflejar el cambio
      await loadAlerts();
      setSuccessMessage('✅ Alerta marcada como resuelta');
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error resolving:', error);
      setSuccessMessage('❌ Error al resolver: ' + error.message);
    } finally {
      setResolving(false);
    }
  };

  // Unificar lógica: priorizar severity sobre status para determinar crítico/advertencia
  const getStatusBadgeClass = (status, severity) => {
    if (status === 'resolved') return 'status-resolved';
    // Priorizar severity para determinar el badge
    if (severity === 'error') return 'status-error';
    if (severity === 'warning') return 'status-warning';
    if (severity === 'info') return 'status-info';
    // Si no hay severity, usar status
    if (status === 'retrying') return 'status-info';
    if (status === 'pending_retry') return 'status-warning';
    return 'status-pending';
  };

  const getStatusLabel = (status, severity) => {
    if (status === 'resolved') return 'Resuelta';
    // Priorizar severity para la etiqueta
    if (severity === 'error') return 'Crítica';
    if (severity === 'warning') return 'Advertencia';
    if (severity === 'info') return 'Información';
    // Si no hay severity, usar status
    if (status === 'retrying') return 'Reintentando';
    if (status === 'pending_retry') return 'Pendiente';
    return 'Activa';
  };

  const formatDateCompact = (dateValue) => {
    if (!dateValue) return '--';
    try {
      const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
      if (isNaN(date.getTime())) return '--';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return '--';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'dlq': 'Error DLQ',
      'rate_limit': 'Límite de cuota',
      'email_bounce': 'Email rechazado',
      'processing_error': 'Error de procesamiento'
    };
    return labels[type] || type || 'Alerta';
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return '';
    const now = new Date();
    const diff = Math.floor((now - lastRefresh) / 1000);
    if (diff < 60) return `Actualizado hace ${diff}s`;
    return `Actualizado hace ${Math.floor(diff / 60)}min`;
  };

  if (flagsLoading) {
    return (
      <div className="alert-manager-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!alertsEnabled) {
    return (
      <div className="alert-manager-container">
        <div className="alert alert-error">
          El centro de alertas no está habilitado para tu organización.
        </div>
      </div>
    );
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="alert-manager-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  // Unificar conteo: usar severity para críticas/advertencias, no status
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'error' && a.status !== 'resolved').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

  return (
    <div className="alert-manager-container" data-testid="alert-manager">
      {/* Header */}
      <div className="alert-manager-header">
        <h1>Centro de Alertas</h1>
        <p className="description">
          Gestiona errores, límites y notificaciones del sistema
        </p>
      </div>

      {/* Instrucciones con botón flotante */}
      <HelpInstructions title="📖 ¿Cómo usar esta pantalla?">
        <p><strong>¿Para qué sirve?</strong></p>
        <p>Esta pantalla muestra todas las alertas y errores del sistema que requieren tu atención. Las alertas se actualizan automáticamente cada 30 segundos.</p>
        
        <p><strong>¿Qué tipos de alertas se muestran?</strong></p>
        <ul>
          <li><strong>🔴 Errores DLQ (Dead Letter Queue):</strong> Operaciones que fallaron después de múltiples intentos. Requieren revisión manual y posible reintento.</li>
          <li><strong>⚠️ Límites de cuota:</strong> Alertas cuando se alcanza el límite de emails, solicitudes API u otros recursos del plan contratado.</li>
          <li><strong>📧 Emails rechazados:</strong> Notificaciones cuando un email no pudo ser entregado (bounce, rechazo del servidor, dirección inválida).</li>
          <li><strong>⚙️ Errores de procesamiento:</strong> Fallos durante el procesamiento de datos, importaciones, o ejecución de acciones masivas.</li>
        </ul>
        
        <p><strong>¿Cómo leerla?</strong></p>
        <ul>
          <li><strong>Tarjetas superiores:</strong> Muestra el resumen de alertas. Pasa el cursor sobre ellas para más información.</li>
          <li><strong>Tabla:</strong> Lista todas las alertas con su tipo, título, mensaje y estado. Haz clic en una fila para ver detalles completos.</li>
          <li><strong>Estados:</strong> 
            <span className="status-badge status-error" style={{marginLeft: '8px'}}>Crítica</span> requiere atención inmediata,
            <span className="status-badge status-warning" style={{marginLeft: '8px'}}>Advertencia</span> necesita revisión,
            <span className="status-badge status-resolved" style={{marginLeft: '8px'}}>Resuelta</span> ya fue atendida.
          </li>
          <li><strong>Filtros:</strong> Usa el menú desplegable para filtrar por tipo de alerta (DLQ, límites, emails, errores).</li>
        </ul>

        <p><strong>Acciones disponibles:</strong></p>
        <ul>
          <li><strong>🔄 Reintentar:</strong> Intenta ejecutar nuevamente la operación que falló. Útil para errores temporales.</li>
          <li><strong>✅ Resolver:</strong> Marca la alerta como resuelta cuando ya la hayas atendido manualmente o cuando ya no requiere acción.</li>
          <li><strong>🔄 Actualizar:</strong> Recarga manualmente las alertas (también se actualizan automáticamente cada 30 segundos).</li>
          <li><strong>📥 Exportar:</strong> Descarga todas las alertas filtradas en formato CSV para análisis externo.</li>
        </ul>
      </HelpInstructions>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className={`alert ${successMessage.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {successMessage}
        </div>
      )}

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Alertas</div>
          <div className="stat-value">{totalAlerts}</div>
          <div className="stat-tooltip">
            Número total de alertas registradas en el sistema, incluyendo activas y resueltas.
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Críticas</div>
          <div className="stat-value" style={{ color: '#842029' }}>{criticalAlerts}</div>
          <div className="stat-tooltip">
            Alertas de alta prioridad que requieren atención inmediata. Generalmente indican errores críticos del sistema que impiden el funcionamiento normal.
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Advertencias</div>
          <div className="stat-value" style={{ color: '#856404' }}>{warningAlerts}</div>
          <div className="stat-tooltip">
            Alertas de prioridad media que indican situaciones que pueden requerir atención pero no son críticas. El sistema sigue funcionando pero puede necesitar revisión.
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Resueltas</div>
          <div className="stat-value" style={{ color: '#0f5132' }}>{resolvedAlerts}</div>
          <div className="stat-tooltip">
            Alertas que han sido marcadas como resueltas por el administrador. Estas alertas ya fueron atendidas y no requieren acción adicional.
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filter-select">Filtrar por:</label>
          <select
            id="filter-select"
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las alertas</option>
            <option value="dlq">Errores DLQ</option>
            <option value="rate_limit">Límites de cuota</option>
            <option value="email_bounce">Emails rechazados</option>
            <option value="processing_error">Errores de procesamiento</option>
          </select>
        </div>

        <button
          onClick={loadAlerts}
          className="btn-filter"
          disabled={loading}
          title="Recargar alertas manualmente (también se actualizan automáticamente cada 30 segundos)"
        >
          🔄 Actualizar {lastRefresh && `(${formatLastRefresh()})`}
        </button>

        <button className="btn-filter" title="Exportar alertas a CSV">
          📥 Exportar
        </button>
      </div>

      {/* Tabla de Alertas */}
      <div className="table-container">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p className="empty-state-text">No hay alertas activas</p>
          </div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Reintentos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={selectedAlert?.id === alert.id ? 'selected' : ''}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td>
                    <span className="status-badge status-default">
                      {getTypeLabel(alert.type)}
                    </span>
                  </td>
                  <td>
                    <strong>{alert.title || getTypeLabel(alert.type)}</strong>
                  </td>
                  <td>
                    {alert.message || alert.error?.message || alert.error || 'Sin descripción'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(alert.status, alert.severity)}`}>
                      {getStatusLabel(alert.status, alert.severity)}
                    </span>
                  </td>
                  <td>{formatDateCompact(alert.createdAt)}</td>
                  <td>
                    {alert.retryCount > 0 ? (
                      <span>{alert.retryCount}/{alert.maxRetries || 3}</span>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {alert.status !== 'resolved' && (
                        <>
                          <button
                            className="btn-action-minimal btn-retry-minimal"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(alert);
                            }}
                            disabled={retrying || resolving}
                            title="Reintentar la operación que falló"
                          >
                            {retrying ? '⏳' : '🔄'}
                          </button>
                          <button
                            className="btn-action-minimal btn-resolve-minimal"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(alert);
                            }}
                            disabled={retrying || resolving}
                            title="Marcar esta alerta como resuelta"
                          >
                            {resolving ? '⏳' : '✅'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle de Alerta Seleccionada */}
      {selectedAlert && (
        <div className="alert-detail-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Detalles de la Alerta</h3>
            <button 
              className="btn-close-instructions"
              onClick={() => setSelectedAlert(null)}
              title="Cerrar detalles"
            >
              ✕
            </button>
          </div>
          <div className="detail-grid">
            <div className="detail-label">ID:</div>
            <div className="detail-value">{selectedAlert.id}</div>

            <div className="detail-label">Tipo:</div>
            <div className="detail-value">{getTypeLabel(selectedAlert.type)}</div>

            <div className="detail-label">Estado:</div>
            <div className="detail-value">
              <span className={`status-badge ${getStatusBadgeClass(selectedAlert.status, selectedAlert.severity)}`}>
                {getStatusLabel(selectedAlert.status, selectedAlert.severity)}
              </span>
            </div>

            {selectedAlert.assignmentId && (
              <>
                <div className="detail-label">Asignación:</div>
                <div className="detail-value">{selectedAlert.assignmentId}</div>
              </>
            )}

            {selectedAlert.campaignId && (
              <>
                <div className="detail-label">Campaña:</div>
                <div className="detail-value">{selectedAlert.campaignId}</div>
              </>
            )}

            <div className="detail-label">Creado:</div>
            <div className="detail-value">{formatDateCompact(selectedAlert.createdAt)}</div>

            {selectedAlert.lastRetry && (
              <>
                <div className="detail-label">Último reintento:</div>
                <div className="detail-value">{formatDateCompact(selectedAlert.lastRetry)}</div>
              </>
            )}

            {selectedAlert.retryCount > 0 && (
              <>
                <div className="detail-label">Reintentos:</div>
                <div className="detail-value">{selectedAlert.retryCount}/{selectedAlert.maxRetries || 3}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManager;
