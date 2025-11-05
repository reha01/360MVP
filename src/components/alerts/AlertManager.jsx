/**
 * AlertManager - Centro de gestión de alertas y errores
 * 
 * Características:
 * - Visualización de errores DLQ (Dead Letter Queue)
 * - Alertas de rate limits
 * - Notificaciones de bounces de email
 * - Acciones de retry y resolución
 */

import React, { useState, useEffect } from 'react';
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock,
  Mail,
  Zap,
  CheckCircle,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

const AlertManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: alertsEnabled, loading: flagsLoading } = useRuntimeFeatureFlags('FEATURE_OPERATIONAL_ALERTS');
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, dlq, rate_limit, email_bounce
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Cargar alertas
  useEffect(() => {
    if (!currentOrgId) return;
    
    loadAlerts();
  }, [currentOrgId, filter]);

  const loadAlerts = async () => {
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
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'dlq'
      }));

      // Simular algunas alertas adicionales para demo
      const demoAlerts = [
        {
          id: 'demo-1',
          type: 'rate_limit',
          title: 'Límite de emails excedido',
          message: 'Se alcanzó el límite diario de 100 emails para el plan Starter',
          severity: 'warning',
          createdAt: new Date(),
          status: 'active',
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
          status: 'pending_retry',
          retryCount: 1,
          source: 'email'
        }
      ];

      setAlerts([...alertsData, ...demoAlerts]);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (alert) => {
    setRetrying(true);
    try {
      // Simular retry
      console.log('Retrying alert:', alert);
      
      // En producción, aquí se llamaría al servicio correspondiente
      // await retryBulkAction(alert.originalActionId);
      
      // Actualizar estado en DLQ
      if (alert.source === 'dlq') {
        const alertRef = doc(db, `organizations/${currentOrgId}/bulkActionDLQ`, alert.id);
        await updateDoc(alertRef, {
          status: 'retrying',
          lastRetry: serverTimestamp(),
          retryCount: (alert.retryCount || 0) + 1
        });
      }

      // Recargar alertas
      await loadAlerts();
      
      // Mostrar éxito
      alert('✅ Reintento iniciado correctamente');
    } catch (error) {
      console.error('Error retrying:', error);
      alert('❌ Error al reintentar: ' + error.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleResolve = async (alert) => {
    try {
      // Marcar como resuelto
      if (alert.source === 'dlq') {
        const alertRef = doc(db, `organizations/${currentOrgId}/bulkActionDLQ`, alert.id);
        await updateDoc(alertRef, {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'current-user' // En producción, usar el usuario actual
        });
      }

      // Recargar alertas
      await loadAlerts();
      
      alert('✅ Alerta marcada como resuelta');
    } catch (error) {
      console.error('Error resolving:', error);
      alert('❌ Error al resolver: ' + error.message);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'email_bounce':
        return <Mail className="w-5 h-5" />;
      case 'rate_limit':
        return <Zap className="w-5 h-5" />;
      case 'processing_error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('es-CL');
  };

  if (!alertsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            El centro de alertas no está habilitado para tu organización.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Cargando alertas...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="alert-manager">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Centro de Alertas
        </h1>
        <p className="text-gray-600">
          Gestiona errores, límites y notificaciones del sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>

        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Alertas</p>
              <p className="text-2xl font-semibold">{alerts.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Críticas</p>
              <p className="text-2xl font-semibold text-red-700">
                {alerts.filter(a => a.severity === 'error').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Advertencias</p>
              <p className="text-2xl font-semibold text-yellow-700">
                {alerts.filter(a => a.severity === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Resueltas</p>
              <p className="text-2xl font-semibold text-green-700">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white rounded-lg border border-gray-200">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No hay alertas activas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedAlert?.id === alert.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getAlertColor(alert.severity || 'info')}`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {alert.title || alert.type || 'Alerta'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.message || alert.error || 'Sin descripción'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(alert.createdAt)}
                          </span>
                          {alert.retryCount > 0 && (
                            <span>
                              Reintentos: {alert.retryCount}/{alert.maxRetries || 3}
                            </span>
                          )}
                          {alert.status && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full">
                              {alert.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status !== 'resolved' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(alert);
                              }}
                              disabled={retrying}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reintentar"
                            >
                              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(alert);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como resuelto"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detalle de Alerta Seleccionada */}
      {selectedAlert && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">Detalles de la Alerta</h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium w-32">ID:</span>
              <span className="text-gray-600">{selectedAlert.id}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Tipo:</span>
              <span className="text-gray-600">{selectedAlert.type}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Estado:</span>
              <span className="text-gray-600">{selectedAlert.status || 'active'}</span>
            </div>
            {selectedAlert.assignmentId && (
              <div className="flex">
                <span className="font-medium w-32">Asignación:</span>
                <span className="text-gray-600">{selectedAlert.assignmentId}</span>
              </div>
            )}
            {selectedAlert.campaignId && (
              <div className="flex">
                <span className="font-medium w-32">Campaña:</span>
                <span className="text-gray-600">{selectedAlert.campaignId}</span>
              </div>
            )}
            <div className="flex">
              <span className="font-medium w-32">Creado:</span>
              <span className="text-gray-600">{formatDate(selectedAlert.createdAt)}</span>
            </div>
            {selectedAlert.lastRetry && (
              <div className="flex">
                <span className="font-medium w-32">Último reintento:</span>
                <span className="text-gray-600">{formatDate(selectedAlert.lastRetry)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManager;