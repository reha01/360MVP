/**
 * BulkActionsManager - Gestor de acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones idempotente
 * - Extensión de deadlines
 * - Colas con backoff + DLQ
 * - Auditoría completa de acciones
 * - Progreso en tiempo real
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import bulkActionService from '../../services/bulkActionService';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { Card, Button, Spinner, Alert, Progress } from '../ui';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Download,
  Users,
  Mail,
  Calendar
} from 'lucide-react';

const BulkActionsManager = ({ campaignId, onActionComplete }) => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: bulkActionsEnabled } = useFeatureFlags('bulkActions');
  
  // Estados principales
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de acciones
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const [actionResults, setActionResults] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    status: 'all',
    evaluatorType: 'all',
    daysOverdue: 'all'
  });
  
  // Verificar feature flag
  if (!bulkActionsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            Las acciones masivas están en desarrollo. Esta función estará disponible próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Cargar asignaciones
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await evaluatorAssignmentService.getSessionAssignments(currentOrgId, campaignId);
      setAssignments(data || []);
      
    } catch (err) {
      console.error('[BulkActionsManager] Error loading assignments:', err);
      setError('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, campaignId]);
  
  // Efecto para cargar asignaciones
  useEffect(() => {
    if (currentOrgId && campaignId) {
      loadAssignments();
    }
  }, [currentOrgId, campaignId, loadAssignments]);
  
  // Filtrar asignaciones
  const filteredAssignments = assignments.filter(assignment => {
    if (filters.status !== 'all' && assignment.status !== filters.status) return false;
    if (filters.evaluatorType !== 'all' && assignment.evaluatorType !== filters.evaluatorType) return false;
    if (filters.daysOverdue !== 'all') {
      const daysOverdue = Math.floor((Date.now() - new Date(assignment.deadline).getTime()) / (1000 * 60 * 60 * 24));
      if (filters.daysOverdue === 'overdue' && daysOverdue <= 0) return false;
      if (filters.daysOverdue === 'not-overdue' && daysOverdue > 0) return false;
    }
    return true;
  });
  
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
  
  // Seleccionar todas las asignaciones filtradas
  const handleSelectAll = () => {
    const allIds = filteredAssignments.map(a => a.id);
    setSelectedAssignments(allIds);
  };
  
  // Deseleccionar todas
  const handleDeselectAll = () => {
    setSelectedAssignments([]);
  };
  
  // Reenviar invitaciones
  const handleResendInvitations = async () => {
    if (selectedAssignments.length === 0) return;
    
    try {
      setActionInProgress(true);
      setActionProgress(0);
      setError(null);
      
      const results = await bulkActionService.resendInvitations(
        currentOrgId,
        selectedAssignments,
        {
          onProgress: (progress) => setActionProgress(progress),
          customMessage: 'Recordatorio de evaluación pendiente'
        }
      );
      
      setActionResults(results);
      setActionHistory(prev => [{
        id: Date.now(),
        type: 'resend_invitations',
        timestamp: new Date().toISOString(),
        assignments: selectedAssignments.length,
        results: results
      }, ...prev]);
      
      // Recargar asignaciones
      await loadAssignments();
      
      // Notificar al componente padre
      onActionComplete?.(results);
      
    } catch (err) {
      console.error('[BulkActionsManager] Error resending invitations:', err);
      setError('Error al reenviar invitaciones');
    } finally {
      setActionInProgress(false);
      setActionProgress(0);
    }
  };
  
  // Extender deadlines
  const handleExtendDeadlines = async (extensionDays) => {
    if (selectedAssignments.length === 0) return;
    
    try {
      setActionInProgress(true);
      setActionProgress(0);
      setError(null);
      
      const results = await bulkActionService.extendDeadlines(
        currentOrgId,
        selectedAssignments,
        extensionDays,
        {
          onProgress: (progress) => setActionProgress(progress)
        }
      );
      
      setActionResults(results);
      setActionHistory(prev => [{
        id: Date.now(),
        type: 'extend_deadlines',
        timestamp: new Date().toISOString(),
        assignments: selectedAssignments.length,
        extensionDays,
        results: results
      }, ...prev]);
      
      // Recargar asignaciones
      await loadAssignments();
      
      // Notificar al componente padre
      onActionComplete?.(results);
      
    } catch (err) {
      console.error('[BulkActionsManager] Error extending deadlines:', err);
      setError('Error al extender deadlines');
    } finally {
      setActionInProgress(false);
      setActionProgress(0);
    }
  };
  
  // Exportar resultados
  const handleExportResults = () => {
    if (!actionResults) return;
    
    const csvContent = [
      ['Assignment ID', 'Status', 'Error', 'Timestamp'],
      ...actionResults.map(result => [
        result.assignmentId,
        result.status,
        result.error || '',
        result.timestamp
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-action-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (loading && assignments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando asignaciones...</span>
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
    <div className="max-w-7xl mx-auto p-6" data-testid="bulk-actions-manager">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Acciones Masivas</h2>
            <p className="text-gray-600">Gestiona invitaciones y deadlines de forma masiva</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadAssignments}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {actionResults && (
              <Button
                onClick={handleExportResults}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="peer">Pares</option>
                <option value="direct">Subordinados</option>
                <option value="external">Externos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimiento
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.daysOverdue}
                onChange={(e) => setFilters(prev => ({ ...prev, daysOverdue: e.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="overdue">Vencidas</option>
                <option value="not-overdue">No vencidas</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
              >
                Seleccionar Todos
              </Button>
              <Button
                onClick={handleDeselectAll}
                variant="outline"
                size="sm"
              >
                Deseleccionar
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Acciones */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {selectedAssignments.length} asignaciones seleccionadas
              </div>
              <div className="text-sm text-gray-600">
                {filteredAssignments.length} asignaciones filtradas
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleResendInvitations}
                disabled={selectedAssignments.length === 0 || actionInProgress}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Reenviar Invitaciones
              </Button>
              
              <Button
                onClick={() => handleExtendDeadlines(7)}
                disabled={selectedAssignments.length === 0 || actionInProgress}
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Extender +7 días
              </Button>
              
              <Button
                onClick={() => handleExtendDeadlines(14)}
                disabled={selectedAssignments.length === 0 || actionInProgress}
                variant="outline"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Extender +14 días
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Progreso de acción */}
      {actionInProgress && (
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <Spinner size="sm" />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                  Procesando {selectedAssignments.length} asignaciones...
                </div>
                <Progress value={actionProgress} className="w-full" />
                <div className="text-xs text-gray-500 mt-1">
                  {actionProgress}% completado
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Resultados de acción */}
      {actionResults && (
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resultados de la Acción</h3>
              <Button
                onClick={() => setActionResults(null)}
                variant="outline"
                size="sm"
              >
                Cerrar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {actionResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {actionResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {actionResults.filter(r => r.status === 'skipped').length}
                </div>
                <div className="text-sm text-gray-600">Omitidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {actionResults.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            {/* Lista de resultados */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {actionResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    result.status === 'success' ? 'bg-green-50' :
                    result.status === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {result.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {result.status === 'skipped' && <Clock className="w-4 h-4 text-yellow-600" />}
                    <span className="text-sm font-medium">{result.assignmentId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.error || result.message || result.status}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Lista de asignaciones */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="space-y-2">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  selectedAssignments.includes(assignment.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(assignment.id)}
                    onChange={() => handleSelectAssignment(assignment.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {assignment.evaluatorName || assignment.evaluatorEmail}
                    </div>
                    <div className="text-sm text-gray-600">
                      {assignment.evaluatorType} • {assignment.status}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Invitaciones: {assignment.invitationCount || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Historial de acciones */}
      {actionHistory.length > 0 && (
        <div className="mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Acciones</h3>
            <div className="space-y-2">
              {actionHistory.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded"
                >
                  <div className="flex items-center space-x-2">
                    {action.type === 'resend_invitations' && <Mail className="w-4 h-4 text-blue-600" />}
                    {action.type === 'extend_deadlines' && <Calendar className="w-4 h-4 text-green-600" />}
                    <span className="text-sm font-medium">
                      {action.type === 'resend_invitations' ? 'Reenvío de invitaciones' : 'Extensión de deadlines'}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({action.assignments} asignaciones)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(action.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BulkActionsManager;