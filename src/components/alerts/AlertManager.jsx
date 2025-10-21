/**
 * Gestor de Alertas Operativas - M9-PR2
 * 
 * DLQ, cuotas, bounces, monitoreo en tiempo real
 * Feature flag: VITE_FEATURE_OPERATIONAL_ALERTS
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { 
  Card, 
  Button, 
  Alert, 
  Spinner,
  Badge,
  Tabs,
  Modal,
  Progress
} from '../ui';

// ========== ALERT TYPES ==========

const ALERT_TYPES = {
  DLQ: {
    id: 'dlq',
    name: 'Dead Letter Queue',
    description: 'Elementos fallidos en colas de procesamiento',
    icon: '💀',
    severity: 'critical',
    category: 'system'
  },
  QUOTA_EXCEEDED: {
    id: 'quota_exceeded',
    name: 'Cuota Excedida',
    description: 'Límites de plan alcanzados',
    icon: '📊',
    severity: 'warning',
    category: 'usage'
  },
  EMAIL_BOUNCES: {
    id: 'email_bounces',
    name: 'Emails Rebotados',
    description: 'Emails no entregados o rebotados',
    icon: '📧',
    severity: 'warning',
    category: 'communication'
  },
  PERFORMANCE: {
    id: 'performance',
    name: 'Rendimiento',
    description: 'Métricas de rendimiento degradadas',
    icon: '⚡',
    severity: 'info',
    category: 'system'
  },
  SECURITY: {
    id: 'security',
    name: 'Seguridad',
    description: 'Eventos de seguridad detectados',
    icon: '🔒',
    severity: 'critical',
    category: 'security'
  }
};

// ========== ALERT SEVERITY ==========

const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

const SEVERITY_COLORS = {
  [ALERT_SEVERITY.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
  [ALERT_SEVERITY.WARNING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ALERT_SEVERITY.INFO]: 'bg-blue-100 text-blue-800 border-blue-200'
};

// ========== ALERT CARD ==========

const AlertCard = ({ alert, onAcknowledge, onResolve, onViewDetails }) => {
  const getSeverityColor = (severity) => {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS[ALERT_SEVERITY.INFO];
  };
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Activo</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary">Reconocido</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resuelto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{alert.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {alert.name}
            </h3>
            <p className="text-sm text-gray-600">
              {alert.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(alert.status)}
          <Badge variant="outline">
            {alert.category}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm text-gray-600">
          <strong>Detectado:</strong> {formatTimestamp(alert.detectedAt)}
        </div>
        {alert.lastOccurrence && (
          <div className="text-sm text-gray-600">
            <strong>Última ocurrencia:</strong> {formatTimestamp(alert.lastOccurrence)}
          </div>
        )}
        {alert.count && (
          <div className="text-sm text-gray-600">
            <strong>Ocurrencias:</strong> {alert.count}
          </div>
        )}
      </div>
      
      {alert.details && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700">
            {alert.details}
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(alert)}
        >
          Ver Detalles
        </Button>
        {alert.status === 'active' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
            >
              Reconocer
            </Button>
            <Button
              size="sm"
              onClick={() => onResolve(alert.id)}
            >
              Resolver
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

// ========== ALERT DETAILS MODAL ==========

const AlertDetailsModal = ({ alert, isOpen, onClose }) => {
  if (!alert) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-3xl">{alert.icon}</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {alert.name}
            </h2>
            <p className="text-gray-600">{alert.description}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Severidad
              </label>
              <div className="mt-1">
                <Badge className={SEVERITY_COLORS[alert.severity]}>
                  {alert.severity}
                </Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <div className="mt-1">
                <Badge variant="outline">{alert.status}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <div className="mt-1">
                <Badge variant="outline">{alert.category}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Detectado
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {new Date(alert.detectedAt).toLocaleString()}
              </div>
            </div>
          </div>
          
          {alert.details && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detalles
              </label>
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                {alert.details}
              </div>
            </div>
          )}
          
          {alert.metrics && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métricas
              </label>
              <div className="space-y-2">
                {Object.entries(alert.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ========== ALERT STATS ==========

const AlertStats = ({ alerts }) => {
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{stats.active}</div>
        <div className="text-sm text-gray-600">Activos</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</div>
        <div className="text-sm text-gray-600">Reconocidos</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        <div className="text-sm text-gray-600">Resueltos</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
        <div className="text-sm text-gray-600">Críticos</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
        <div className="text-sm text-gray-600">Advertencias</div>
      </Card>
      <Card className="p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
        <div className="text-sm text-gray-600">Informativos</div>
      </Card>
    </div>
  );
};

// ========== MAIN COMPONENT ==========

const AlertManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const { isEnabled: alertsEnabled } = useFeatureFlags('VITE_FEATURE_OPERATIONAL_ALERTS');
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (!alertsEnabled) return;
    
    const loadAlerts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simular carga de alertas
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAlerts = [
          {
            id: 'dlq_1',
            type: 'dlq',
            name: 'Dead Letter Queue - Invitaciones',
            description: '5 elementos fallidos en cola de invitaciones',
            icon: '💀',
            severity: 'critical',
            category: 'system',
            status: 'active',
            detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lastOccurrence: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            count: 5,
            details: 'Elementos fallidos después de 5 intentos. Revisar configuración de email.',
            metrics: {
              'Elementos en DLQ': 5,
              'Tiempo promedio': '2.5 min',
              'Último intento': '30 min ago'
            }
          },
          {
            id: 'quota_1',
            type: 'quota_exceeded',
            name: 'Cuota de Emails Excedida',
            description: 'Límite diario de emails alcanzado',
            icon: '📊',
            severity: 'warning',
            category: 'usage',
            status: 'active',
            detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            count: 1,
            details: 'Se ha alcanzado el límite de 100 emails por día. Considerar actualizar el plan.',
            metrics: {
              'Emails enviados': 100,
              'Límite diario': 100,
              'Reset en': '18 horas'
            }
          },
          {
            id: 'bounce_1',
            type: 'email_bounces',
            name: 'Emails Rebotados',
            description: '3 emails rebotados en la última hora',
            icon: '📧',
            severity: 'warning',
            category: 'communication',
            status: 'acknowledged',
            detectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            lastOccurrence: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            count: 3,
            details: 'Emails rebotados por direcciones inválidas o buzones llenos.',
            metrics: {
              'Rebotes': 3,
              'Tasa de rebote': '2.1%',
              'Último rebote': '15 min ago'
            }
          },
          {
            id: 'perf_1',
            type: 'performance',
            name: 'Rendimiento Degradado',
            description: 'Tiempo de respuesta P95 > 3s',
            icon: '⚡',
            severity: 'info',
            category: 'system',
            status: 'resolved',
            detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            count: 1,
            details: 'Tiempo de respuesta P95 excedió 3 segundos durante 15 minutos.',
            metrics: {
              'P95 actual': '2.1s',
              'P95 máximo': '3.2s',
              'Duración': '15 min'
            }
          }
        ];
        
        setAlerts(mockAlerts);
      } catch (err) {
        setError('Error al cargar alertas');
        console.error('[AlertManager] Error loading alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAlerts();
    
    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      setAlerts(prev => prev.map(alert => {
        if (alert.status === 'active' && Math.random() > 0.8) {
          return {
            ...alert,
            lastOccurrence: new Date().toISOString(),
            count: alert.count + 1
          };
        }
        return alert;
      }));
    }, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, [alertsEnabled]);
  
  // ========== HANDLERS ==========
  
  const handleAcknowledge = useCallback(async (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
        : alert
    ));
    
    console.log(`[AlertManager] Alert acknowledged: ${alertId}`);
  }, []);
  
  const handleResolve = useCallback(async (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
        : alert
    ));
    
    console.log(`[AlertManager] Alert resolved: ${alertId}`);
  }, []);
  
  const handleViewDetails = useCallback((alert) => {
    setSelectedAlert(alert);
    setShowDetails(true);
  }, []);
  
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    setSelectedAlert(null);
  }, []);
  
  // ========== FILTERED ALERTS ==========
  
  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return alerts.filter(alert => alert.status === 'active');
      case 'acknowledged':
        return alerts.filter(alert => alert.status === 'acknowledged');
      case 'resolved':
        return alerts.filter(alert => alert.status === 'resolved');
      case 'critical':
        return alerts.filter(alert => alert.severity === 'critical');
      case 'warning':
        return alerts.filter(alert => alert.severity === 'warning');
      case 'info':
        return alerts.filter(alert => alert.severity === 'info');
      default:
        return alerts;
    }
  }, [alerts, activeTab]);
  
  // ========== RENDER ==========
  
  if (!alertsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Alertas Operativas No Disponibles</Alert.Title>
          <Alert.Description>
            Esta funcionalidad está en desarrollo. Contacta al administrador para habilitarla.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Centro de Alertas
        </h1>
        <p className="text-gray-600">
          Monitoreo en tiempo real de eventos críticos del sistema
        </p>
      </div>
      
      {/* Estadísticas */}
      <AlertStats alerts={alerts} />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="all">Todas</Tabs.Trigger>
          <Tabs.Trigger value="active">Activas</Tabs.Trigger>
          <Tabs.Trigger value="acknowledged">Reconocidas</Tabs.Trigger>
          <Tabs.Trigger value="resolved">Resueltas</Tabs.Trigger>
          <Tabs.Trigger value="critical">Críticas</Tabs.Trigger>
          <Tabs.Trigger value="warning">Advertencias</Tabs.Trigger>
          <Tabs.Trigger value="info">Informativas</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onViewDetails={handleViewDetails}
              />
            ))}
            
            {filteredAlerts.length === 0 && (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">✅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay alertas
                </h3>
                <p className="text-gray-600">
                  No se encontraron alertas para el filtro seleccionado.
                </p>
              </Card>
            )}
          </div>
        </Tabs.Content>
      </Tabs>
      
      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          isOpen={showDetails}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default AlertManager;
