/**
 * AlertManager - Gestor de alertas operativas
 * 
 * Características:
 * - Alertas operativas (DLQ, cuotas, bounces)
 * - Enlaces a acciones relacionadas
 * - Resolución de alertas
 * - Monitoreo en tiempo real
 * - Filtros y búsqueda
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { Card, Button, Spinner, Alert, Badge } from '../ui';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Database,
  Users,
  RefreshCw,
  Filter,
  Search,
  ExternalLink,
  Bell,
  BellOff
} from 'lucide-react';

const AlertManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: alertsEnabled } = useFeatureFlags('operationalAlerts');
  
  // Estados principales
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    severity: 'all',
    search: ''
  });
  
  // Estados de acciones
  const [resolvingAlerts, setResolvingAlerts] = useState(new Set());
  const [silencedAlerts, setSilencedAlerts] = useState(new Set());
  
  // Verificar feature flag
  if (!alertsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            El sistema de alertas está en desarrollo. Esta función estará disponible próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Cargar alertas
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de alertas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos de ejemplo
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'dlq',
          severity: 'high',
          status: 'active',
          title: 'Jobs en Dead Letter Queue',
          description: '5 trabajos fallidos en DLQ por más de 24 horas',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          count: 5,
          relatedAction: 'clear-dlq',
          metadata: {
            jobIds: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'],
            oldestJob: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
          }
        },
        {
          id: 'alert-2',
          type: 'quota',
          severity: 'medium',
          status: 'active',
          title: 'Cuota de emails excedida',
          description: 'Límite diario de emails alcanzado para la organización',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          count: 1,
          relatedAction: 'view-quotas',
          metadata: {
            quotaType: 'emailsPerDay',
            current: 10000,
            limit: 10000,
            resetAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
          }
        },
        {
          id: 'alert-3',
          type: 'bounce',
          severity: 'low',
          status: 'active',
          title: 'Emails rebotados',
          description: '3 emails rebotados en las últimas 2 horas',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          count: 3,
          relatedAction: 'view-bounces',
          metadata: {
            bounceEmails: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
            bounceReasons: ['Invalid email', 'Mailbox full', 'Domain not found']
          }
        },
        {
          id: 'alert-4',
          type: 'performance',
          severity: 'medium',
          status: 'resolved',
          title: 'Performance degradada',
          description: 'Tiempo de respuesta p95 > 3s en dashboard',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          count: 1,
          relatedAction: 'view-metrics',
          metadata: {
            p95Time: 3500,
            threshold: 2000
          }
        }
      ];
      
      setAlerts(mockAlerts);
      
    } catch (err) {
      console.error('[AlertManager] Error loading alerts:', err);
      setError('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Efecto para cargar alertas
  useEffect(() => {
    if (currentOrgId) {
      loadAlerts();
      
      // Simular actualizaciones en tiempo real
      const interval = setInterval(() => {
        loadAlerts();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [currentOrgId, loadAlerts]);
  
  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    if (filters.type !== 'all' && alert.type !== filters.type) return false;
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !alert.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  
  // Resolver alerta
  const resolveAlert = async (alertId) => {
    try {
      setResolvingAlerts(prev => new Set([...prev, alertId]));
      
      // Simular resolución
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
          : alert
      ));
      
    } catch (err) {
      console.error('[AlertManager] Error resolving alert:', err);
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };
  
  // Silenciar alerta
  const silenceAlert = (alertId) => {
    setSilencedAlerts(prev => new Set([...prev, alertId]));
  };
  
  // Activar alerta silenciada
  const unsilenceAlert = (alertId) => {
    setSilencedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.delete(alertId);
      return newSet;
    });
  };
  
  // Obtener icono por tipo de alerta
  const getAlertIcon = (type) => {
    switch (type) {
      case 'dlq': return <Database className="w-5 h-5" />;
      case 'quota': return <Users className="w-5 h-5" />;
      case 'bounce': return <Mail className="w-5 h-5" />;
      case 'performance': return <Clock className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };
  
  // Obtener color por severidad
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  // Obtener color por estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'silenced': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  // Manejar acción relacionada
  const handleRelatedAction = (alert) => {
    switch (alert.relatedAction) {
      case 'clear-dlq':
        alert('Función: Limpiar DLQ - En desarrollo');
        break;
      case 'view-quotas':
        alert('Función: Ver cuotas - En desarrollo');
        break;
      case 'view-bounces':
        alert('Función: Ver bounces - En desarrollo');
        break;
      case 'view-metrics':
        alert('Función: Ver métricas - En desarrollo');
        break;
      default:
        console.log('Acción relacionada:', alert.relatedAction);
    }
  };
  
  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando alertas...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="alert-manager">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alertas Operativas</h2>
            <p className="text-gray-600">Monitorea y gestiona alertas del sistema</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadAlerts}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Resumen de alertas */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Activas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.status === 'resolved').length}
                </div>
                <div className="text-sm text-gray-600">Resueltas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {silencedAlerts.size}
                </div>
                <div className="text-sm text-gray-600">Silenciadas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {alerts.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="active">Activas</option>
                <option value="resolved">Resueltas</option>
                <option value="silenced">Silenciadas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="dlq">DLQ</option>
                <option value="quota">Cuotas</option>
                <option value="bounce">Bounces</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alertas..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ status: 'all', type: 'all', severity: 'all', search: '' })}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Lista de alertas */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card
            key={alert.id}
            className={`p-4 ${
              silencedAlerts.has(alert.id) ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alert.title}
                    </h3>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                    {alert.count > 1 && (
                      <Badge variant="outline">
                        {alert.count} items
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {alert.status === 'resolved' ? 'Resuelta' : 'Creada'}: {' '}
                      {new Date(alert.resolvedAt || alert.timestamp).toLocaleString()}
                    </span>
                    {alert.metadata && (
                      <span>
                        Tipo: {alert.type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Metadata específica */}
                  {alert.metadata && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {alert.type === 'dlq' && (
                          <div>
                            <strong>Jobs en DLQ:</strong> {alert.metadata.jobIds?.join(', ')}
                            <br />
                            <strong>Job más antiguo:</strong> {new Date(alert.metadata.oldestJob).toLocaleString()}
                          </div>
                        )}
                        {alert.type === 'quota' && (
                          <div>
                            <strong>Cuota:</strong> {alert.metadata.quotaType}
                            <br />
                            <strong>Uso:</strong> {alert.metadata.current}/{alert.metadata.limit}
                            <br />
                            <strong>Reset:</strong> {new Date(alert.metadata.resetAt).toLocaleString()}
                          </div>
                        )}
                        {alert.type === 'bounce' && (
                          <div>
                            <strong>Emails:</strong> {alert.metadata.bounceEmails?.join(', ')}
                            <br />
                            <strong>Razones:</strong> {alert.metadata.bounceReasons?.join(', ')}
                          </div>
                        )}
                        {alert.type === 'performance' && (
                          <div>
                            <strong>P95 Time:</strong> {alert.metadata.p95Time}ms
                            <br />
                            <strong>Umbral:</strong> {alert.metadata.threshold}ms
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                {alert.relatedAction && (
                  <Button
                    onClick={() => handleRelatedAction(alert)}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Button>
                )}
                
                {alert.status === 'active' && (
                  <>
                    <Button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolvingAlerts.has(alert.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {resolvingAlerts.has(alert.id) ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Resolviendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolver
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => silenceAlert(alert.id)}
                      variant="outline"
                      size="sm"
                    >
                      <BellOff className="w-4 h-4 mr-2" />
                      Silenciar
                    </Button>
                  </>
                )}
                
                {silencedAlerts.has(alert.id) && (
                  <Button
                    onClick={() => unsilenceAlert(alert.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Activar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Sin alertas */}
      {filteredAlerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay alertas
          </h3>
          <p className="text-gray-600">
            {filters.status === 'all' && filters.type === 'all' && filters.severity === 'all' && !filters.search
              ? 'El sistema está funcionando correctamente'
              : 'No se encontraron alertas con los filtros aplicados'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertManager;
