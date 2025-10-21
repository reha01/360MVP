/**
 * Comparativa entre Campañas - M8-PR3
 * 
 * Disclaimers por versión, comparativas temporales
 * Feature flag: VITE_FEATURE_CAMPAIGN_COMPARISON
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import campaignService from '../../services/campaignService';
import { 
  Card, 
  Button, 
  Select, 
  Alert, 
  Spinner,
  Badge,
  Tabs,
  Modal
} from '../ui';

// ========== COMPARISON TYPES ==========

const COMPARISON_TYPES = {
  TEMPORAL: {
    id: 'temporal',
    name: 'Comparativa Temporal',
    description: 'Comparar la misma campaña en diferentes períodos',
    icon: '📅'
  },
  CROSS_CAMPAIGN: {
    id: 'cross_campaign',
    name: 'Entre Campañas',
    description: 'Comparar diferentes campañas del mismo período',
    icon: '📊'
  },
  JOB_FAMILY: {
    id: 'job_family',
    name: 'Por Job Family',
    description: 'Comparar campañas de diferentes Job Families',
    icon: '👥'
  },
  VERSION: {
    id: 'version',
    name: 'Por Versión de Test',
    description: 'Comparar campañas con diferentes versiones del test',
    icon: '🔄'
  }
};

// ========== VERSION COMPATIBILITY ==========

const VERSION_COMPATIBILITY = {
  COMPATIBLE: 'compatible',
  INCOMPATIBLE: 'incompatible',
  PARTIAL: 'partial'
};

const getVersionCompatibility = (version1, version2) => {
  if (!version1 || !version2) return VERSION_COMPATIBILITY.INCOMPATIBLE;
  
  // Versiones idénticas
  if (version1 === version2) return VERSION_COMPATIBILITY.COMPATIBLE;
  
  // Versiones compatibles (mismo major version)
  const v1Major = version1.split('.')[0];
  const v2Major = version2.split('.')[0];
  
  if (v1Major === v2Major) return VERSION_COMPATIBILITY.PARTIAL;
  
  return VERSION_COMPATIBILITY.INCOMPATIBLE;
};

// ========== DISCLAIMER COMPONENT ==========

const VersionDisclaimer = ({ campaigns, comparisonType }) => {
  const versions = [...new Set(campaigns.map(c => c.testVersion))];
  const compatibility = getVersionCompatibility(versions[0], versions[1]);
  
  const getDisclaimerMessage = () => {
    switch (compatibility) {
      case VERSION_COMPATIBILITY.COMPATIBLE:
        return {
          type: 'success',
          title: 'Versiones Compatibles',
          message: 'Las campañas utilizan la misma versión del test. Los resultados son directamente comparables.'
        };
        
      case VERSION_COMPATIBILITY.PARTIAL:
        return {
          type: 'warning',
          title: 'Versiones Parcialmente Compatibles',
          message: 'Las campañas utilizan versiones diferentes del mismo test. Los resultados pueden no ser directamente comparables. Se recomienda interpretar las diferencias con cautela.'
        };
        
      case VERSION_COMPATIBILITY.INCOMPATIBLE:
        return {
          type: 'error',
          title: 'Versiones Incompatibles',
          message: 'Las campañas utilizan versiones incompatibles del test. Los resultados NO son comparables. Se recomienda no realizar comparaciones directas.'
        };
        
      default:
        return null;
    }
  };
  
  const disclaimer = getDisclaimerMessage();
  
  if (!disclaimer) return null;
  
  return (
    <Alert type={disclaimer.type}>
      <Alert.Title>{disclaimer.title}</Alert.Title>
      <Alert.Description>
        {disclaimer.message}
        {versions.length > 1 && (
          <div className="mt-2 text-sm">
            <strong>Versiones detectadas:</strong> {versions.join(', ')}
          </div>
        )}
      </Alert.Description>
    </Alert>
  );
};

// ========== COMPARISON METRICS ==========

const ComparisonMetrics = ({ campaigns, comparisonType }) => {
  const metrics = useMemo(() => {
    if (campaigns.length < 2) return null;
    
    const [campaign1, campaign2] = campaigns;
    
    return {
      responseRate: {
        campaign1: campaign1.responseRate || 0,
        campaign2: campaign2.responseRate || 0,
        difference: (campaign2.responseRate || 0) - (campaign1.responseRate || 0)
      },
      evaluateeCount: {
        campaign1: campaign1.evaluateeCount || 0,
        campaign2: campaign2.evaluateeCount || 0,
        difference: (campaign2.evaluateeCount || 0) - (campaign1.evaluateeCount || 0)
      },
      duration: {
        campaign1: campaign1.duration || 0,
        campaign2: campaign2.duration || 0,
        difference: (campaign2.duration || 0) - (campaign1.duration || 0)
      },
      completionRate: {
        campaign1: campaign1.completionRate || 0,
        campaign2: campaign2.completionRate || 0,
        difference: (campaign2.completionRate || 0) - (campaign1.completionRate || 0)
      }
    };
  }, [campaigns]);
  
  if (!metrics) return null;
  
  const formatDifference = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };
  
  const getDifferenceColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-500 mb-1">Tasa de Respuesta</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {metrics.responseRate.campaign2}%
        </div>
        <div className={`text-sm ${getDifferenceColor(metrics.responseRate.difference)}`}>
          {formatDifference(metrics.responseRate.difference)}% vs {metrics.responseRate.campaign1}%
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="text-sm text-gray-500 mb-1">Evaluados</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {metrics.evaluateeCount.campaign2}
        </div>
        <div className={`text-sm ${getDifferenceColor(metrics.evaluateeCount.difference)}`}>
          {formatDifference(metrics.evaluateeCount.difference)} vs {metrics.evaluateeCount.campaign1}
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="text-sm text-gray-500 mb-1">Duración (días)</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {metrics.duration.campaign2}
        </div>
        <div className={`text-sm ${getDifferenceColor(metrics.duration.difference)}`}>
          {formatDifference(metrics.duration.difference)} vs {metrics.duration.campaign1}
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="text-sm text-gray-500 mb-1">Tasa de Completitud</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {metrics.completionRate.campaign2}%
        </div>
        <div className={`text-sm ${getDifferenceColor(metrics.completionRate.difference)}`}>
          {formatDifference(metrics.completionRate.difference)}% vs {metrics.completionRate.campaign1}%
        </div>
      </Card>
    </div>
  );
};

// ========== COMPARISON CHART ==========

const ComparisonChart = ({ campaigns, comparisonType }) => {
  // Simular datos de gráfico
  const chartData = useMemo(() => {
    if (campaigns.length < 2) return null;
    
    const [campaign1, campaign2] = campaigns;
    
    return {
      labels: ['Tasa Respuesta', 'Evaluados', 'Duración', 'Completitud'],
      datasets: [
        {
          label: campaign1.name,
          data: [
            campaign1.responseRate || 0,
            campaign1.evaluateeCount || 0,
            campaign1.duration || 0,
            campaign1.completionRate || 0
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        },
        {
          label: campaign2.name,
          data: [
            campaign2.responseRate || 0,
            campaign2.evaluateeCount || 0,
            campaign2.duration || 0,
            campaign2.completionRate || 0
          ],
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }
      ]
    };
  }, [campaigns]);
  
  if (!chartData) return null;
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Comparativa Visual
      </h3>
      
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📊</span>
          </div>
          <p className="text-gray-600">
            Gráfico de comparativa
          </p>
          <p className="text-sm text-gray-500">
            Implementación pendiente
          </p>
        </div>
      </div>
    </Card>
  );
};

// ========== CAMPAIGN SELECTOR ==========

const CampaignSelector = ({ campaigns, selectedCampaigns, onSelectionChange, comparisonType }) => {
  const handleCampaignSelect = (index, campaignId) => {
    const newSelection = [...selectedCampaigns];
    newSelection[index] = campaignId;
    onSelectionChange(newSelection);
  };
  
  const getAvailableCampaigns = (index) => {
    const otherSelected = selectedCampaigns.filter((_, i) => i !== index);
    return campaigns.filter(c => !otherSelected.includes(c.id));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1].map(index => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaña {index + 1}
          </label>
          <Select
            value={selectedCampaigns[index] || ''}
            onChange={(value) => handleCampaignSelect(index, value)}
          >
            <option value="">Seleccionar campaña...</option>
            {getAvailableCampaigns(index).map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.testVersion})
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
};

// ========== MAIN COMPONENT ==========

const CampaignComparison = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const { isEnabled: comparisonEnabled } = useFeatureFlags('VITE_FEATURE_CAMPAIGN_COMPARISON');
  
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [comparisonType, setComparisonType] = useState(COMPARISON_TYPES.TEMPORAL.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (!comparisonEnabled) return;
    
    const loadCampaigns = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await campaignService.getCampaigns(currentOrgId);
        setCampaigns(data);
      } catch (err) {
        setError('Error al cargar campañas');
        console.error('[CampaignComparison] Error loading campaigns:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, [comparisonEnabled, currentOrgId]);
  
  // ========== HANDLERS ==========
  
  const handleComparisonTypeChange = (type) => {
    setComparisonType(type);
    setSelectedCampaigns([]);
    setShowComparison(false);
  };
  
  const handleCampaignSelectionChange = (selection) => {
    setSelectedCampaigns(selection);
    setShowComparison(selection.length === 2 && selection.every(id => id));
  };
  
  const handleStartComparison = () => {
    if (selectedCampaigns.length === 2) {
      setShowComparison(true);
    }
  };
  
  // ========== RENDER ==========
  
  if (!comparisonEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Comparativas No Disponibles</Alert.Title>
          <Alert.Description>
            Esta funcionalidad está en desarrollo. Contacta al administrador para habilitarla.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando campañas...</span>
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
  
  const selectedCampaignsData = campaigns.filter(c => selectedCampaigns.includes(c.id));
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Comparativa de Campañas
        </h1>
        <p className="text-gray-600">
          Compara campañas 360° y analiza diferencias en rendimiento
        </p>
      </div>
      
      <Tabs value={comparisonType} onValueChange={handleComparisonTypeChange}>
        <Tabs.List>
          {Object.values(COMPARISON_TYPES).map(type => (
            <Tabs.Trigger key={type.id} value={type.id}>
              <span className="mr-2">{type.icon}</span>
              {type.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        
        <Tabs.Content value={comparisonType} className="mt-6">
          <div className="space-y-6">
            {/* Tipo de comparación */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {COMPARISON_TYPES[comparisonType.toUpperCase()]?.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {COMPARISON_TYPES[comparisonType.toUpperCase()]?.description}
              </p>
              
              <CampaignSelector
                campaigns={campaigns}
                selectedCampaigns={selectedCampaigns}
                onSelectionChange={handleCampaignSelectionChange}
                comparisonType={comparisonType}
              />
              
              {selectedCampaigns.length === 2 && (
                <div className="mt-4">
                  <Button onClick={handleStartComparison}>
                    Iniciar Comparativa
                  </Button>
                </div>
              )}
            </Card>
            
            {/* Comparativa */}
            {showComparison && selectedCampaignsData.length === 2 && (
              <div className="space-y-6">
                {/* Disclaimer de versión */}
                <VersionDisclaimer 
                  campaigns={selectedCampaignsData} 
                  comparisonType={comparisonType}
                />
                
                {/* Métricas de comparación */}
                <ComparisonMetrics 
                  campaigns={selectedCampaignsData} 
                  comparisonType={comparisonType}
                />
                
                {/* Gráfico de comparación */}
                <ComparisonChart 
                  campaigns={selectedCampaignsData} 
                  comparisonType={comparisonType}
                />
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  );
};

export default CampaignComparison;
