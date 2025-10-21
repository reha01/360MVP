/**
 * PolicyManager - Gestor de políticas organizacionales
 * 
 * Características:
 * - Panel de políticas por organización
 * - Regla "solo endurecer" (no relajar políticas)
 * - Preview de impacto al subir umbrales
 * - Aplicación efectiva en reportes y exports
 * - Configuración de retención de datos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { Card, Button, Spinner, Alert, Badge } from '../ui';
import { Switch } from '../ui/Switch';
import { 
  Shield, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const PolicyManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: policiesEnabled } = useFeatureFlags('orgPolicies');
  
  // Estados principales
  const [policies, setPolicies] = useState({
    anonymityThresholds: {
      peers: 3,
      direct: 2,
      external: 1
    },
    dataRetention: {
      enabled: true,
      period: 365, // días
      autoDelete: false
    },
    privacySettings: {
      hideSmallGroups: true,
      requireConsent: true,
      allowExport: true
    },
    timezone: 'America/Mexico_City',
    hasDST: false
  });
  
  const [originalPolicies, setOriginalPolicies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados de preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // Verificar feature flag
  if (!policiesEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            El panel de políticas está en desarrollo. Esta función estará disponible próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Cargar políticas
  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de políticas desde el servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Por ahora usar políticas por defecto
      setPolicies(prev => ({ ...prev }));
      setOriginalPolicies(prev => ({ ...prev }));
      
    } catch (err) {
      console.error('[PolicyManager] Error loading policies:', err);
      setError('Error al cargar las políticas');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Efecto para cargar políticas
  useEffect(() => {
    if (currentOrgId) {
      loadPolicies();
    }
  }, [currentOrgId, loadPolicies]);
  
  // Verificar si las políticas han cambiado
  const hasChanges = originalPolicies && JSON.stringify(policies) !== JSON.stringify(originalPolicies);
  
  // Verificar si se puede "endurecer" (solo aumentar umbrales)
  const canHarden = (newPolicies) => {
    if (!originalPolicies) return true;
    
    const original = originalPolicies.anonymityThresholds;
    const updated = newPolicies.anonymityThresholds;
    
    // Solo se puede endurecer (aumentar umbrales)
    return (
      updated.peers >= original.peers &&
      updated.direct >= original.direct &&
      updated.external >= original.external
    );
  };
  
  // Generar preview de impacto
  const generatePreview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simular cálculo de impacto
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const impact = {
        affectedEvaluations: Math.floor(Math.random() * 50) + 10,
        hiddenData: {
          peers: Math.floor(Math.random() * 20) + 5,
          direct: Math.floor(Math.random() * 15) + 3,
          external: Math.floor(Math.random() * 10) + 2
        },
        newReports: Math.floor(Math.random() * 30) + 5,
        affectedUsers: Math.floor(Math.random() * 100) + 20
      };
      
      setPreviewData(impact);
      setShowPreview(true);
      
    } catch (err) {
      console.error('[PolicyManager] Error generating preview:', err);
      setError('Error al generar preview de impacto');
    } finally {
      setLoading(false);
    }
  }, [policies]);
  
  // Guardar políticas
  const savePolicies = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validar que se puede endurecer
      if (!canHarden(policies)) {
        setError('No se puede relajar las políticas. Solo se permite endurecer (aumentar umbrales).');
        return;
      }
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalPolicies({ ...policies });
      setSuccess('Políticas guardadas exitosamente');
      setShowPreview(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('[PolicyManager] Error saving policies:', err);
      setError('Error al guardar las políticas');
    } finally {
      setSaving(false);
    }
  };
  
  // Manejar cambio de umbral
  const handleThresholdChange = (type, value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    
    setPolicies(prev => ({
      ...prev,
      anonymityThresholds: {
        ...prev.anonymityThresholds,
        [type]: newValue
      }
    }));
  };
  
  // Manejar cambio de retención
  const handleRetentionChange = (field, value) => {
    setPolicies(prev => ({
      ...prev,
      dataRetention: {
        ...prev.dataRetention,
        [field]: value
      }
    }));
  };
  
  // Manejar cambio de privacidad
  const handlePrivacyChange = (field, value) => {
    setPolicies(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value
      }
    }));
  };
  
  if (loading && !originalPolicies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando políticas...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="policy-manager">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Políticas Organizacionales</h2>
            <p className="text-gray-600">Configura las políticas de privacidad y retención de datos</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadPolicies}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={generatePreview}
              variant="outline"
              size="sm"
              disabled={!hasChanges || loading}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Impacto
            </Button>
            <Button
              onClick={savePolicies}
              disabled={!hasChanges || saving || !canHarden(policies)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mensajes */}
      {error && (
        <Alert type="error" className="mb-6">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}
      
      {success && (
        <Alert type="success" className="mb-6">
          <Alert.Title>Éxito</Alert.Title>
          <Alert.Description>{success}</Alert.Description>
        </Alert>
      )}
      
      {/* Preview de impacto */}
      {showPreview && previewData && (
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview de Impacto</h3>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                size="sm"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.affectedEvaluations}
                </div>
                <div className="text-sm text-gray-600">Evaluaciones Afectadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {previewData.hiddenData.peers + previewData.hiddenData.direct + previewData.hiddenData.external}
                </div>
                <div className="text-sm text-gray-600">Datos Ocultos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {previewData.newReports}
                </div>
                <div className="text-sm text-gray-600">Nuevos Reportes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {previewData.affectedUsers}
                </div>
                <div className="text-sm text-gray-600">Usuarios Afectados</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Impacto en Reportes</div>
                  <div className="text-sm text-yellow-700">
                    Los cambios afectarán {previewData.affectedEvaluations} evaluaciones y ocultarán datos de {previewData.affectedUsers} usuarios.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Umbrales de Anonimato */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Umbrales de Anonimato</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mínimo de Pares
              </label>
              <input
                type="number"
                min="1"
                value={policies.anonymityThresholds.peers}
                onChange={(e) => handleThresholdChange('peers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de evaluadores pares requeridos
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mínimo de Subordinados
              </label>
              <input
                type="number"
                min="1"
                value={policies.anonymityThresholds.direct}
                onChange={(e) => handleThresholdChange('direct', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de subordinados requeridos
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mínimo de Externos
              </label>
              <input
                type="number"
                min="1"
                value={policies.anonymityThresholds.external}
                onChange={(e) => handleThresholdChange('external', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de evaluadores externos requeridos
              </p>
            </div>
          </div>
          
          {!canHarden(policies) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Política de Endurecimiento</div>
                  <div className="text-sm text-red-700">
                    Solo se permite endurecer las políticas (aumentar umbrales). No se puede relajar.
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Retención de Datos */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Retención de Datos</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Habilitar Retención</div>
                <div className="text-sm text-gray-600">Configurar período de retención de datos</div>
              </div>
              <Switch
                checked={policies.dataRetention.enabled}
                onCheckedChange={(checked) => handleRetentionChange('enabled', checked)}
              />
            </div>
            
            {policies.dataRetention.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período de Retención (días)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="2555" // 7 años
                    value={policies.dataRetention.period}
                    onChange={(e) => handleRetentionChange('period', parseInt(e.target.value) || 365)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los datos se conservarán por {policies.dataRetention.period} días
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Eliminación Automática</div>
                    <div className="text-sm text-gray-600">Eliminar datos automáticamente al vencer</div>
                  </div>
                  <Switch
                    checked={policies.dataRetention.autoDelete}
                    onCheckedChange={(checked) => handleRetentionChange('autoDelete', checked)}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
      
      {/* Configuraciones de Privacidad */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuraciones de Privacidad</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Ocultar Grupos Pequeños</div>
                <div className="text-sm text-gray-600">Ocultar datos cuando no se cumplan umbrales</div>
              </div>
              <Switch
                checked={policies.privacySettings.hideSmallGroups}
                onCheckedChange={(checked) => handlePrivacyChange('hideSmallGroups', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Requerir Consentimiento</div>
                <div className="text-sm text-gray-600">Solicitar consentimiento explícito para evaluaciones</div>
              </div>
              <Switch
                checked={policies.privacySettings.requireConsent}
                onCheckedChange={(checked) => handlePrivacyChange('requireConsent', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Permitir Exportación</div>
                <div className="text-sm text-gray-600">Permitir exportar datos en CSV/PDF</div>
              </div>
              <Switch
                checked={policies.privacySettings.allowExport}
                onCheckedChange={(checked) => handlePrivacyChange('allowExport', checked)}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Configuración de Zona Horaria */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Zona Horaria</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
              </label>
              <select
                value={policies.timezone}
                onChange={(e) => setPolicies(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/Mexico_City">America/Mexico_City (CST/CDT)</option>
                <option value="America/Santiago">America/Santiago (CLT/CLST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Horario de Verano</div>
                <div className="text-sm text-gray-600">La zona horaria tiene cambio de hora</div>
              </div>
              <Switch
                checked={policies.hasDST}
                onCheckedChange={(checked) => setPolicies(prev => ({ ...prev, hasDST: checked }))}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Indicador de cambios */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Hay cambios sin guardar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManager;
