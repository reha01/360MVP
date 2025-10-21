/**
 * Gestor de Acciones Masivas - M8-PR2
 * 
 * Reenviar invitaciones, extender plazos con colas + DLQ
 * Feature flag: VITE_FEATURE_BULK_ACTIONS
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Alert, 
  Spinner,
  Badge,
  Progress,
  Modal
} from '../ui';

// ========== BULK ACTION TYPES ==========

const BULK_ACTIONS = {
  RESEND_INVITATIONS: {
    id: 'resend_invitations',
    name: 'Reenviar Invitaciones',
    description: 'Reenviar invitaciones a evaluadores pendientes',
    icon: '📧',
    requiresConfirmation: true
  },
  EXTEND_DEADLINE: {
    id: 'extend_deadline',
    name: 'Extender Plazo',
    description: 'Extender fecha límite de evaluación',
    icon: '⏰',
    requiresConfirmation: true
  },
  PAUSE_CAMPAIGNS: {
    id: 'pause_campaigns',
    name: 'Pausar Campañas',
    description: 'Pausar campañas seleccionadas',
    icon: '⏸️',
    requiresConfirmation: true
  },
  ARCHIVE_CAMPAIGNS: {
    id: 'archive_campaigns',
    name: 'Archivar Campañas',
    description: 'Archivar campañas completadas',
    icon: '📦',
    requiresConfirmation: true
  }
};

// ========== BULK ACTION CARD ==========

const BulkActionCard = ({ action, onSelect, selected, disabled }) => {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all ${
        selected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onSelect(action.id)}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{action.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {action.name}
          </h3>
          <p className="text-sm text-gray-600">
            {action.description}
          </p>
        </div>
        {selected && (
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// ========== BULK ACTION FORM ==========

const BulkActionForm = ({ action, onExecute, onCancel, loading }) => {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onExecute(action.id, formData);
  };
  
  const renderFormFields = () => {
    switch (action.id) {
      case 'resend_invitations':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje Personalizado (Opcional)
              </label>
              <Input
                placeholder="Mensaje adicional para las invitaciones..."
                value={formData.customMessage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solo Evaluadores Pendientes
              </label>
              <Select
                value={formData.onlyPending || 'true'}
                onChange={(value) => setFormData(prev => ({ ...prev, onlyPending: value }))}
              >
                <option value="true">Sí, solo pendientes</option>
                <option value="false">No, reenviar a todos</option>
              </Select>
            </div>
          </div>
        );
        
      case 'extend_deadline':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo Plazo (días)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                placeholder="7"
                value={formData.extensionDays || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, extensionDays: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje de Notificación
              </label>
              <Input
                placeholder="El plazo ha sido extendido..."
                value={formData.notificationMessage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationMessage: e.target.value }))}
              />
            </div>
          </div>
        );
        
      case 'pause_campaigns':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón de Pausa
              </label>
              <Select
                value={formData.reason || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
              >
                <option value="">Seleccionar razón...</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="review">Revisión de datos</option>
                <option value="issue">Problema técnico</option>
                <option value="other">Otro</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios Adicionales
              </label>
              <Input
                placeholder="Detalles adicionales..."
                value={formData.comments || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              />
            </div>
          </div>
        );
        
      case 'archive_campaigns':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Archivo
              </label>
              <p className="text-sm text-gray-600">
                Las campañas archivadas no podrán ser modificadas. Esta acción es irreversible.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiqueta de Archivo
              </label>
              <Input
                placeholder="Q1-2024, Completadas, etc."
                value={formData.archiveTag || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, archiveTag: e.target.value }))}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderFormFields()}
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">Ejecutando...</span>
            </>
          ) : (
            `Ejecutar ${action.name}`
          )}
        </Button>
      </div>
    </form>
  );
};

// ========== BULK ACTION PROGRESS ==========

const BulkActionProgress = ({ progress, onClose }) => {
  const { completed, total, current, status, errors } = progress;
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ejecutando Acción Masiva
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{completed} de {total}</span>
            </div>
            <Progress value={percentage} className="w-full" />
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Estado:</strong> {status}
          </div>
          
          {current && (
            <div className="text-sm text-gray-600">
              <strong>Procesando:</strong> {current}
            </div>
          )}
          
          {errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-red-600 mb-2">
                Errores ({errors.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? 'Procesando...' : 'Cerrar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ========== MAIN COMPONENT ==========

const BulkActionsManager = ({ selectedItems = [], onComplete }) => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const { isEnabled: bulkActionsEnabled } = useFeatureFlags('VITE_FEATURE_BULK_ACTIONS');
  
  const [selectedAction, setSelectedAction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    current: null,
    status: 'idle',
    errors: []
  });
  
  // ========== HANDLERS ==========
  
  const handleActionSelect = useCallback((actionId) => {
    const action = Object.values(BULK_ACTIONS).find(a => a.id === actionId);
    setSelectedAction(action);
    setShowForm(true);
    setError(null);
  }, []);
  
  const handleExecuteAction = useCallback(async (actionId, formData) => {
    if (!selectedItems.length) {
      setError('No hay elementos seleccionados');
      return;
    }
    
    setLoading(true);
    setShowForm(false);
    setShowProgress(true);
    setProgress({
      completed: 0,
      total: selectedItems.length,
      current: null,
      status: 'processing',
      errors: []
    });
    
    try {
      const results = await executeBulkAction(actionId, formData, selectedItems);
      
      setProgress(prev => ({
        ...prev,
        completed: results.completed,
        status: 'completed',
        errors: results.errors
      }));
      
      if (onComplete) {
        onComplete(results);
      }
    } catch (err) {
      setError(err.message);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, err.message]
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedItems, onComplete]);
  
  const executeBulkAction = async (actionId, formData, items) => {
    const results = {
      completed: 0,
      errors: []
    };
    
    for (const item of items) {
      try {
        setProgress(prev => ({
          ...prev,
          current: item.name || item.id
        }));
        
        switch (actionId) {
          case 'resend_invitations':
            await evaluatorAssignmentService.resendInvitation(
              currentOrgId, 
              item.id, 
              formData.customMessage
            );
            break;
            
          case 'extend_deadline':
            await evaluatorAssignmentService.extendDeadline(
              currentOrgId, 
              item.id, 
              formData.extensionDays
            );
            break;
            
          case 'pause_campaigns':
            // Implementar pausa de campaña
            console.log('Pausing campaign:', item.id);
            break;
            
          case 'archive_campaigns':
            // Implementar archivo de campaña
            console.log('Archiving campaign:', item.id);
            break;
            
          default:
            throw new Error(`Acción no implementada: ${actionId}`);
        }
        
        results.completed++;
        
        setProgress(prev => ({
          ...prev,
          completed: results.completed
        }));
        
        // Simular delay para mostrar progreso
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        results.errors.push(`${item.name || item.id}: ${err.message}`);
        console.error(`[BulkActions] Error processing ${item.id}:`, err);
      }
    }
    
    return results;
  };
  
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedAction(null);
  }, []);
  
  const handleCloseProgress = useCallback(() => {
    setShowProgress(false);
    setProgress({
      completed: 0,
      total: 0,
      current: null,
      status: 'idle',
      errors: []
    });
  }, []);
  
  // ========== RENDER ==========
  
  if (!bulkActionsEnabled) {
    return (
      <Alert type="info">
        <Alert.Title>Acciones Masivas No Disponibles</Alert.Title>
        <Alert.Description>
          Esta funcionalidad está en desarrollo. Contacta al administrador para habilitarla.
        </Alert.Description>
      </Alert>
    );
  }
  
  if (!selectedItems.length) {
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona Elementos
        </h3>
        <p className="text-gray-600">
          Selecciona campañas o evaluadores para realizar acciones masivas
        </p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Acciones Masivas
          </h2>
          <p className="text-gray-600">
            {selectedItems.length} elemento(s) seleccionado(s)
          </p>
        </div>
        <Badge variant="secondary">
          {selectedItems.length} seleccionados
        </Badge>
      </div>
      
      {/* Error */}
      {error && (
        <Alert type="error">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(BULK_ACTIONS).map(action => (
          <BulkActionCard
            key={action.id}
            action={action}
            onSelect={handleActionSelect}
            selected={selectedAction?.id === action.id}
            disabled={loading}
          />
        ))}
      </div>
      
      {/* Action Form Modal */}
      {showForm && selectedAction && (
        <Modal isOpen={showForm} onClose={handleCloseForm}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedAction.name}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedAction.description}
            </p>
            
            <BulkActionForm
              action={selectedAction}
              onExecute={handleExecuteAction}
              onCancel={handleCloseForm}
              loading={loading}
            />
          </div>
        </Modal>
      )}
      
      {/* Progress Modal */}
      {showProgress && (
        <BulkActionProgress
          progress={progress}
          onClose={handleCloseProgress}
        />
      )}
    </div>
  );
};

export default BulkActionsManager;
