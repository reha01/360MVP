/**
 * BulkActionsManager - Componente para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Extensión de plazos masiva
 * - Sistema de colas con backoff exponencial
 * - Dead Letter Queue (DLQ) para manejo de errores
 * - Auditoría completa de acciones
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import bulkActionService from '../../services/bulkActionService';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { Card, Button, Spinner, Alert, Badge } from '../ui';
import { 
  Send, Clock, AlertTriangle, CheckCircle, 
  Filter, Download, RefreshCw, Search, 
  XCircle, RotateCw, FileText, Loader
} from 'lucide-react';

const BulkActionsManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: bulkActionsEnabled } = useFeatureFlags('FEATURE_BULK_ACTIONS');
  
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
  
  // Estados para DLQ
  const [dlqItems, setDlqItems] = useState([]);
  const [showDlq, setShowDlq] = useState(false);
  
  // Estados para auditoría
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  
  // Verificar feature flag
  if (!bulkActionsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            Las acciones masivas están habilitadas solo para organizaciones piloto.
            Esta función estará disponible para todas las organizaciones próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
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
  
  // Cargar DLQ
  const loadDlq = useCallback(async () => {
    try {
      const result = await bulkActionService.getDlqItems(currentOrgId);
      setDlqItems(result || []);
    } catch (err) {
      console.error('[BulkActionsManager] Error loading DLQ:', err);
    }
  }, [currentOrgId]);
  
  // Cargar auditoría
  const loadAuditLog = useCallback(async () => {
    try {
      const result = await bulkActionService.getAuditLog(currentOrgId);
      setAuditLog(result || []);
    } catch (err) {
      console.error('[BulkActionsManager] Error loading audit log:', err);
    }
  }, [currentOrgId]);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadAssignments();
      loadDlq();
      loadAuditLog();
    }
  }, [currentOrgId, loadAssignments, loadDlq, loadAuditLog]);
  
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
  
  // Aplicar filtros
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedAssignments([]);
  };
  
  // Cambiar página
  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    setSelectedAssignments([]);
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
      }
      
      setActionResult({
        success: true,
        message: `Acción "${type}" ejecutada exitosamente en ${result.processed} asignaciones`,
        details: result
      });
      
      // Recargar datos
      loadAssignments();
      loadDlq();
      loadAuditLog();
      
    } catch (err) {
      console.error(`[BulkActionsManager] Error executing ${type}:`, err);
      setActionResult({
        success: false,
        message: `Error al ejecutar la acción "${type}"`,
        error: err.message
      });
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Reintentar item de DLQ
  const retryDlqItem = async (itemId) => {
    try {
      await bulkActionService.retryDlqItem(currentOrgId, itemId);
      loadDlq();
      loadAuditLog();
    } catch (err) {
      console.error('[BulkActionsManager] Error retrying DLQ item:', err);
      setError(`Error al reintentar el item: ${err.message}`);
    }
  };
  
  // Renderizar estado de asignación
  const renderAssignmentStatus = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="success">Completada</Badge>;
      case 'expired':
        return <Badge variant="error">Expirada</Badge>;
      case 'in_progress':
        return <Badge variant="info">En Progreso</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Renderizar tipo de evaluador
  const renderEvaluatorType = (type) => {
    switch (type) {
      case 'self':
        return 'Auto-evaluación';
      case 'manager':
        return 'Manager';
      case 'peer':
        return 'Par';
      case 'direct':
        return 'Subordinado';
      case 'external':
        return 'Externo';
      default:
        return type;
    }
  };
  
  if (loading && assignments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando asignaciones...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="bulk-actions-manager">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Acciones Masivas</h1>
            <p className="text-gray-600">Gestión de invitaciones y plazos para evaluaciones</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                loadAssignments();
                loadDlq();
                loadAuditLog();
              }}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={() => setShowDlq(!showDlq)}
              variant={showDlq ? "default" : "outline"}
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              DLQ {dlqItems.length > 0 && `(${dlqItems.length})`}
            </Button>
            <Button
              onClick={() => setShowAudit(!showAudit)}
              variant={showAudit ? "default" : "outline"}
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Auditoría
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mensajes de error/resultado */}
      {error && (
        <div className="mb-6">
          <Alert type="error">
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        </div>
      )}
      
      {actionResult && (
        <div className="mb-6">
          <Alert type={actionResult.success ? "success" : "error"}>
            <Alert.Title>{actionResult.success ? "Éxito" : "Error"}</Alert.Title>
            <Alert.Description>
              {actionResult.message}
              {actionResult.details && (
                <div className="mt-2">
                  <div>Procesados: {actionResult.details.processed}</div>
                  <div>Exitosos: {actionResult.details.success}</div>
                  <div>Fallidos: {actionResult.details.failed}</div>
                  {actionResult.details.dlq > 0 && (
                    <div className="text-yellow-600">
                      En DLQ: {actionResult.details.dlq}
                    </div>
                  )}
                </div>
              )}
            </Alert.Description>
          </Alert>
        </div>
      )}
      
      {/* Filtros */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
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
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="expired">Expiradas</option>
                <option value="in_progress">En Progreso</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaña
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.campaignId}
                onChange={(e) => setFilters(prev => ({ ...prev, campaignId: e.target.value }))}
              >
                <option value="all">Todas</option>
                <option value="campaign-1">Evaluación Q1 2024</option>
                <option value="campaign-2">Evaluación Q2 2024</option>
                <option value="campaign-3">Evaluación Anual 2024</option>
                <option value="campaign-5">DST Test Campaign</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evaluador
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.evaluatorType}
                onChange={(e) => setFilters(prev => ({ ...prev, evaluatorType: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="self">Auto-evaluación</option>
                <option value="manager">Manager</option>
                <option value="peer">Par</option>
                <option value="direct">Subordinado</option>
                <option value="external">Externo</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => applyFilters(filters)}
                className="w-full"
                disabled={loading}
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Acciones Masivas */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-900">Acciones Masivas</h2>
              <p className="text-sm text-gray-600">
                {selectedAssignments.length} asignaciones seleccionadas de {pagination.total}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              {/* Reenviar Invitaciones */}
              <div className="flex-1">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mensaje personalizado (opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Mensaje personalizado para el reenvío..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    disabled={actionInProgress}
                  ></textarea>
                </div>
                <Button
                  onClick={() => executeBulkAction('resend')}
                  className="w-full"
                  disabled={selectedAssignments.length === 0 || actionInProgress}
                >
                  {actionInProgress && actionType === 'resend' ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Reenviar Invitaciones
                    </>
                  )}
                </Button>
              </div>
              
              {/* Extender Plazos */}
              <div className="flex-1">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Días de extensión
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="30"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value) || 7)}
                    disabled={actionInProgress}
                  />
                </div>
                <Button
                  onClick={() => executeBulkAction('extend')}
                  className="w-full"
                  disabled={selectedAssignments.length === 0 || actionInProgress}
                >
                  {actionInProgress && actionType === 'extend' ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Extendiendo...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Extender Plazos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Lista de Asignaciones */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded"
              checked={selectedAssignments.length === assignments.length && assignments.length > 0}
              onChange={handleSelectAll}
              disabled={assignments.length === 0}
            />
            <span className="ml-2 text-sm text-gray-700">
              Seleccionar todas ({assignments.length})
            </span>
          </div>
          
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron asignaciones con los filtros actuales
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`flex items-center p-4 border rounded-lg ${
                    selectedAssignments.includes(assignment.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={selectedAssignments.includes(assignment.id)}
                    onChange={() => handleSelectAssignment(assignment.id)}
                  />
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.evaluatorName || assignment.evaluatorEmail}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {assignment.evaluatorEmail}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="mb-1">
                          {renderAssignmentStatus(assignment.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {renderEvaluatorType(assignment.evaluatorType)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <div>
                        <span>Evaluado: {assignment.evaluateeName}</span>
                        <span className="mx-2">•</span>
                        <span>Campaña: {assignment.campaignName}</span>
                      </div>
                      
                      <div>
                        <span>Enviado: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>Plazo: {new Date(assignment.deadline).toLocaleDateString()}</span>
                        {assignment.lastInvitationSent && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Último envío: {new Date(assignment.lastInvitationSent).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      
      {/* Paginación */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} asignaciones
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => changePage(pagination.page - 1)}
              >
                Anterior
              </Button>
              
              <span className="px-3 py-1 text-sm text-gray-600">
                Página {pagination.page}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasMore}
                onClick={() => changePage(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* DLQ */}
      {showDlq && (
        <div className="mb-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dead Letter Queue (DLQ)</h2>
            
            {dlqItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay elementos en la DLQ. Todo funciona correctamente.
              </div>
            ) : (
              <div className="space-y-4">
                {dlqItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.actionType === 'resend' ? 'Reenvío de invitación' : 'Extensión de plazo'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {item.assignmentId}
                        </p>
                      </div>
                      
                      <div>
                        <Button
                          onClick={() => retryDlqItem(item.id)}
                          size="sm"
                          variant="outline"
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Reintentar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">
                        <span>Intentos: {item.retryCount}</span>
                        <span className="mx-2">•</span>
                        <span>Último intento: {new Date(item.lastRetry).toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span>Próximo intento: {new Date(item.nextRetry).toLocaleString()}</span>
                      </div>
                      
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-800">
                        <div><strong>Error:</strong> {item.error}</div>
                        {item.data && (
                          <div className="mt-1">
                            <strong>Datos:</strong> {JSON.stringify(item.data)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* Auditoría */}
      {showAudit && (
        <div className="mb-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registro de Auditoría</h2>
            
            {auditLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros de auditoría disponibles
              </div>
            ) : (
              <div className="space-y-4">
                {auditLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {log.actionType === 'resend' ? 'Reenvío de invitaciones' : 'Extensión de plazos'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Por: {log.userId} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      
                      <div>
                        {log.success ? (
                          <Badge variant="success" className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Exitoso
                          </Badge>
                        ) : (
                          <Badge variant="error" className="flex items-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            Fallido
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Asignaciones afectadas: {log.assignmentCount}</div>
                      <div>Exitosas: {log.successCount}</div>
                      <div>Fallidas: {log.failedCount}</div>
                      {log.dlqCount > 0 && (
                        <div className="text-yellow-600">En DLQ: {log.dlqCount}</div>
                      )}
                    </div>
                    
                    {log.details && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-800">
                        <strong>Detalles:</strong> {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default BulkActionsManager;