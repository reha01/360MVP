/**
 * Panel de Políticas por Organización - M9-PR1
 * 
 * Umbrales/retención, "solo endurecer" (no relajar)
 * Feature flag: VITE_FEATURE_ORG_POLICIES
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Alert, 
  Spinner,
  Badge,
  Tabs,
  Modal,
  Switch
} from '../ui';

// ========== POLICY TYPES ==========

const POLICY_TYPES = {
  ANONYMITY_THRESHOLDS: {
    id: 'anonymity_thresholds',
    name: 'Umbrales de Anonimato',
    description: 'Configurar umbrales mínimos para proteger la privacidad',
    icon: '🔒',
    category: 'privacy'
  },
  DATA_RETENTION: {
    id: 'data_retention',
    name: 'Retención de Datos',
    description: 'Políticas de retención y eliminación de datos',
    icon: '🗄️',
    category: 'compliance'
  },
  EMAIL_POLICIES: {
    id: 'email_policies',
    name: 'Políticas de Email',
    description: 'Configuración de envío de emails y recordatorios',
    icon: '📧',
    category: 'communication'
  },
  ACCESS_CONTROL: {
    id: 'access_control',
    name: 'Control de Acceso',
    description: 'Políticas de acceso y permisos por rol',
    icon: '👥',
    category: 'security'
  },
  EXPORT_POLICIES: {
    id: 'export_policies',
    name: 'Políticas de Exportación',
    description: 'Configuración de exportación de datos',
    icon: '📤',
    category: 'data'
  }
};

// ========== POLICY PRECEDENCE ==========

const POLICY_PRECEDENCE = {
  GLOBAL: 'global',
  ORG: 'org',
  CAMPAIGN: 'campaign'
};

const PRECEDENCE_ORDER = {
  [POLICY_PRECEDENCE.GLOBAL]: 1,
  [POLICY_PRECEDENCE.ORG]: 2,
  [POLICY_PRECEDENCE.CAMPAIGN]: 3
};

// ========== POLICY CARD ==========

const PolicyCard = ({ policy, currentValue, globalValue, onUpdate, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue);
  
  const handleSave = () => {
    onUpdate(policy.id, editValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditValue(currentValue);
    setIsEditing(false);
  };
  
  const canHarden = (current, global) => {
    // Solo se puede endurecer (aumentar restricciones), no relajar
    if (policy.id === 'anonymity_thresholds') {
      return current >= global; // Umbrales más altos = más restrictivo
    }
    if (policy.id === 'data_retention') {
      return current <= global; // Retención más corta = más restrictivo
    }
    return true;
  };
  
  const isHardened = canHarden(currentValue, globalValue);
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{policy.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {policy.name}
            </h3>
            <p className="text-sm text-gray-600">
              {policy.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isHardened && (
            <Badge variant="secondary">
              Endurecido
            </Badge>
          )}
          <Badge variant="outline">
            {policy.category}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Valor Global:</span>
            <div className="font-medium">{globalValue}</div>
          </div>
          <div>
            <span className="text-gray-500">Valor Actual:</span>
            <div className="font-medium">{currentValue}</div>
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Nuevo valor"
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!canHarden(editValue, globalValue)}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={disabled}
            >
              Editar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

// ========== POLICY FORM ==========

const PolicyForm = ({ policy, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(policy.id, formData);
  };
  
  const renderFormFields = () => {
    switch (policy.id) {
      case 'anonymity_thresholds':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo de Pares
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.peerMin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, peerMin: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo de Subordinados
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.subordinateMin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subordinateMin: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo de Superiores
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.managerMin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, managerMin: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        );
        
      case 'data_retention':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retención de Datos (días)
              </label>
              <Input
                type="number"
                min="30"
                max="3650"
                value={formData.retentionDays || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eliminación Automática
              </label>
              <Switch
                checked={formData.autoDelete || false}
                onChange={(checked) => setFormData(prev => ({ ...prev, autoDelete: checked }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notificación antes de Eliminar
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={formData.notificationDays || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationDays: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        );
        
      case 'email_policies':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Recordatorios
              </label>
              <Input
                type="number"
                min="0"
                max="10"
                value={formData.maxReminders || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxReminders: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo entre Recordatorios (días)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={formData.reminderInterval || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderInterval: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de Envío
              </label>
              <Select
                value={formData.sendTime || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, sendTime: value }))}
              >
                <option value="">Seleccionar horario...</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
              </Select>
            </div>
          </div>
        );
        
      case 'access_control':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de Sesión (minutos)
              </label>
              <Input
                type="number"
                min="15"
                max="480"
                value={formData.sessionTimeout || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requerir 2FA
              </label>
              <Switch
                checked={formData.require2FA || false}
                onChange={(checked) => setFormData(prev => ({ ...prev, require2FA: checked }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Intentos de Login
              </label>
              <Input
                type="number"
                min="3"
                max="10"
                value={formData.maxLoginAttempts || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        );
        
      case 'export_policies':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Exportaciones por Día
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.maxExportsPerDay || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxExportsPerDay: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incluir PII en Exports
              </label>
              <Switch
                checked={formData.includePII || false}
                onChange={(checked) => setFormData(prev => ({ ...prev, includePII: checked }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato de Exportación
              </label>
              <Select
                value={formData.exportFormat || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, exportFormat: value }))}
              >
                <option value="">Seleccionar formato...</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </Select>
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
              <span className="ml-2">Guardando...</span>
            </>
          ) : (
            'Guardar Política'
          )}
        </Button>
      </div>
    </form>
  );
};

// ========== MAIN COMPONENT ==========

const PolicyManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const { isEnabled: policiesEnabled } = useFeatureFlags('VITE_FEATURE_ORG_POLICIES');
  
  const [policies, setPolicies] = useState({});
  const [globalPolicies, setGlobalPolicies] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('privacy');
  const [showForm, setShowForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  
  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (!policiesEnabled) return;
    
    const loadPolicies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simular carga de políticas
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Políticas globales (valores por defecto)
        const global = {
          anonymity_thresholds: { peerMin: 3, subordinateMin: 2, managerMin: 1 },
          data_retention: { retentionDays: 365, autoDelete: false, notificationDays: 30 },
          email_policies: { maxReminders: 3, reminderInterval: 7, sendTime: '09:00' },
          access_control: { sessionTimeout: 120, require2FA: false, maxLoginAttempts: 5 },
          export_policies: { maxExportsPerDay: 10, includePII: false, exportFormat: 'csv' }
        };
        
        // Políticas de la organización (pueden endurecer las globales)
        const org = {
          anonymity_thresholds: { peerMin: 4, subordinateMin: 3, managerMin: 2 },
          data_retention: { retentionDays: 180, autoDelete: true, notificationDays: 15 },
          email_policies: { maxReminders: 2, reminderInterval: 5, sendTime: '10:00' },
          access_control: { sessionTimeout: 90, require2FA: true, maxLoginAttempts: 3 },
          export_policies: { maxExportsPerDay: 5, includePII: false, exportFormat: 'pdf' }
        };
        
        setGlobalPolicies(global);
        setPolicies(org);
      } catch (err) {
        setError('Error al cargar políticas');
        console.error('[PolicyManager] Error loading policies:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPolicies();
  }, [policiesEnabled]);
  
  // ========== HANDLERS ==========
  
  const handlePolicyUpdate = useCallback(async (policyId, newValue) => {
    setLoading(true);
    
    try {
      // Simular actualización de política
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPolicies(prev => ({
        ...prev,
        [policyId]: newValue
      }));
      
      console.log(`[PolicyManager] Policy updated: ${policyId}`, newValue);
    } catch (err) {
      setError('Error al actualizar política');
      console.error('[PolicyManager] Error updating policy:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handlePolicyFormSubmit = useCallback(async (policyId, formData) => {
    setLoading(true);
    
    try {
      // Simular guardado de política
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPolicies(prev => ({
        ...prev,
        [policyId]: formData
      }));
      
      setShowForm(false);
      setSelectedPolicy(null);
      
      console.log(`[PolicyManager] Policy saved: ${policyId}`, formData);
    } catch (err) {
      setError('Error al guardar política');
      console.error('[PolicyManager] Error saving policy:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handlePolicyFormCancel = useCallback(() => {
    setShowForm(false);
    setSelectedPolicy(null);
  }, []);
  
  // ========== RENDER ==========
  
  if (!policiesEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Panel de Políticas No Disponible</Alert.Title>
          <Alert.Description>
            Esta funcionalidad está en desarrollo. Contacta al administrador para habilitarla.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  if (loading && Object.keys(policies).length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando políticas...</span>
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
  
  const policiesByCategory = Object.values(POLICY_TYPES).reduce((acc, policy) => {
    if (!acc[policy.category]) {
      acc[policy.category] = [];
    }
    acc[policy.category].push(policy);
    return acc;
  }, {});
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Políticas
        </h1>
        <p className="text-gray-600">
          Configura políticas de la organización. Solo se pueden endurecer las políticas globales.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          {Object.keys(policiesByCategory).map(category => (
            <Tabs.Trigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        
        {Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (
          <Tabs.Content key={category} value={category} className="mt-6">
            <div className="space-y-6">
              {categoryPolicies.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  currentValue={policies[policy.id]}
                  globalValue={globalPolicies[policy.id]}
                  onUpdate={handlePolicyUpdate}
                  disabled={loading}
                />
              ))}
            </div>
          </Tabs.Content>
        ))}
      </Tabs>
      
      {/* Policy Form Modal */}
      {showForm && selectedPolicy && (
        <Modal isOpen={showForm} onClose={handlePolicyFormCancel}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedPolicy.name}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedPolicy.description}
            </p>
            
            <PolicyForm
              policy={selectedPolicy}
              onSave={handlePolicyFormSubmit}
              onCancel={handlePolicyFormCancel}
              loading={loading}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PolicyManager;
