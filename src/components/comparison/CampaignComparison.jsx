/**
 * CampaignComparison - Componente de comparativas entre campañas
 * 
 * Características:
 * - Comparativas entre campañas
 * - Disclaimers automáticos por diferencias de versión
 * - Respeto de umbrales de anonimato
 * - Consistencia UI ↔ export CSV/PDF
 * - Validación de compatibilidad
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import campaignService from '../../services/campaignService';
import evaluation360AggregationService from '../../services/evaluation360AggregationService';
import anonymityValidator from '../../utils/anonymityValidator';
import { Card, Button, Spinner, Alert, Badge } from '../ui';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Download,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CampaignComparison = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: comparisonEnabled } = useFeatureFlags('campaignComparison');
  
  // Estados principales
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de validación
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);
  const [anonymityIssues, setAnonymityIssues] = useState([]);
  const [disclaimers, setDisclaimers] = useState([]);
  
  // Verificar feature flag
  if (!comparisonEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            Las comparativas entre campañas están en desarrollo. Esta función estará disponible próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Cargar campañas
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await campaignService.getCampaigns(currentOrgId, {
        status: 'completed',
        includeAggregations: true
      });
      
      setCampaigns(data.campaigns || []);
      
    } catch (err) {
      console.error('[CampaignComparison] Error loading campaigns:', err);
      setError('Error al cargar las campañas');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);
  
  // Efecto para cargar campañas
  useEffect(() => {
    if (currentOrgId) {
      loadCampaigns();
    }
  }, [currentOrgId, loadCampaigns]);
  
  // Validar compatibilidad entre campañas
  const validateCompatibility = useCallback((campaigns) => {
    const issues = [];
    const disclaimers = [];
    
    if (campaigns.length < 2) return { issues, disclaimers };
    
    // Verificar diferencias de versión
    const versions = campaigns.map(c => c.testVersion);
    const uniqueVersions = [...new Set(versions)];
    
    if (uniqueVersions.length > 1) {
      issues.push({
        type: 'version_mismatch',
        severity: 'warning',
        message: 'Las campañas utilizan diferentes versiones del test',
        details: `Versiones encontradas: ${uniqueVersions.join(', ')}`
      });
      
      disclaimers.push({
        type: 'version_disclaimer',
        message: '⚠️ Comparación entre versiones diferentes',
        description: 'Los resultados pueden no ser directamente comparables debido a diferencias en las versiones del test utilizadas.',
        campaigns: campaigns.map(c => ({ id: c.id, name: c.name, version: c.testVersion }))
      });
    }
    
    // Verificar diferencias en job families
    const jobFamilies = campaigns.map(c => c.jobFamilyIds || []);
    const allJobFamilies = [...new Set(jobFamilies.flat())];
    
    if (allJobFamilies.length > 1) {
      issues.push({
        type: 'job_family_mismatch',
        severity: 'info',
        message: 'Las campañas incluyen diferentes familias de trabajo',
        details: `Familias: ${allJobFamilies.join(', ')}`
      });
    }
    
    // Verificar diferencias en períodos de tiempo
    const dates = campaigns.map(c => ({
      start: new Date(c.startDate),
      end: new Date(c.endDate)
    }));
    
    const minStart = new Date(Math.min(...dates.map(d => d.start.getTime())));
    const maxEnd = new Date(Math.max(...dates.map(d => d.end.getTime())));
    const timeSpan = maxEnd.getTime() - minStart.getTime();
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    
    if (daysSpan > 365) {
      issues.push({
        type: 'time_span_large',
        severity: 'info',
        message: 'Las campañas abarcan un período de tiempo extenso',
        details: `${Math.round(daysSpan)} días entre la primera y última campaña`
      });
    }
    
    return { issues, disclaimers };
  }, []);
  
  // Validar umbrales de anonimato
  const validateAnonymity = useCallback(async (campaigns) => {
    const issues = [];
    
    for (const campaign of campaigns) {
      try {
        // Obtener agregaciones de la campaña
        const aggregations = await evaluation360AggregationService.getAggregations(
          currentOrgId,
          { campaignId: campaign.id }
        );
        
        // Validar cada agregación
        for (const aggregation of aggregations.aggregations || []) {
          const anonymityResult = anonymityValidator.validateAnonymity(aggregation);
          
          if (!anonymityResult.isValid) {
            issues.push({
              type: 'anonymity_threshold',
              severity: 'warning',
              campaignId: campaign.id,
              campaignName: campaign.name,
              aggregationId: aggregation.id,
              evaluateeId: aggregation.evaluateeId,
              message: 'Umbral de anonimato no cumplido',
              details: anonymityResult.reasons,
              hiddenData: anonymityResult.hiddenData
            });
          }
        }
      } catch (err) {
        console.error(`[CampaignComparison] Error validating anonymity for campaign ${campaign.id}:`, err);
      }
    }
    
    return issues;
  }, [currentOrgId]);
  
  // Generar comparación
  const generateComparison = useCallback(async () => {
    if (selectedCampaigns.length < 2) {
      setError('Selecciona al menos 2 campañas para comparar');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Validar compatibilidad
      const compatibilityResult = validateCompatibility(selectedCampaigns);
      setCompatibilityIssues(compatibilityResult.issues);
      setDisclaimers(compatibilityResult.disclaimers);
      
      // Validar anonimato
      const anonymityResult = await validateAnonymity(selectedCampaigns);
      setAnonymityIssues(anonymityResult);
      
      // Generar datos de comparación
      const comparisonData = await generateComparisonData(selectedCampaigns);
      setComparisonData(comparisonData);
      
    } catch (err) {
      console.error('[CampaignComparison] Error generating comparison:', err);
      setError('Error al generar la comparación');
    } finally {
      setLoading(false);
    }
  }, [selectedCampaigns, validateCompatibility, validateAnonymity]);
  
  // Generar datos de comparación
  const generateComparisonData = async (campaigns) => {
    const data = {
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        testVersion: c.testVersion,
        startDate: c.startDate,
        endDate: c.endDate,
        participantCount: c.participantCount || 0,
        completionRate: c.completionRate || 0
      })),
      metrics: {},
      categories: {},
      trends: {}
    };
    
    // Obtener métricas por campaña
    for (const campaign of campaigns) {
      try {
        const aggregations = await evaluation360AggregationService.getAggregations(
          currentOrgId,
          { campaignId: campaign.id }
        );
        
        // Calcular métricas promedio
        const validAggregations = aggregations.aggregations?.filter(a => 
          anonymityValidator.validateAnonymity(a).isValid
        ) || [];
        
        if (validAggregations.length > 0) {
          const avgScores = validAggregations.reduce((acc, agg) => {
            Object.entries(agg.categoryScores || {}).forEach(([category, score]) => {
              if (!acc[category]) acc[category] = { total: 0, count: 0 };
              acc[category].total += score;
              acc[category].count += 1;
            });
            return acc;
          }, {});
          
          data.metrics[campaign.id] = Object.entries(avgScores).reduce((acc, [category, data]) => {
            acc[category] = data.total / data.count;
            return acc;
          }, {});
        }
      } catch (err) {
        console.error(`[CampaignComparison] Error processing campaign ${campaign.id}:`, err);
      }
    }
    
    return data;
  };
  
  // Manejar selección de campañas
  const handleCampaignSelect = (campaignId) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        return [...prev, campaignId];
      }
    });
  };
  
  // Exportar comparación
  const handleExportComparison = (format) => {
    if (!comparisonData) return;
    
    if (format === 'csv') {
      exportToCSV(comparisonData);
    } else if (format === 'pdf') {
      exportToPDF(comparisonData);
    }
  };
  
  // Exportar a CSV
  const exportToCSV = (data) => {
    const csvContent = [
      ['Campaign ID', 'Campaign Name', 'Test Version', 'Start Date', 'End Date', 'Participants', 'Completion Rate'],
      ...data.campaigns.map(c => [
        c.id,
        c.name,
        c.testVersion,
        c.startDate,
        c.endDate,
        c.participantCount,
        c.completionRate
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Exportar a PDF
  const exportToPDF = (data) => {
    // Implementar exportación a PDF
    console.log('Exporting to PDF:', data);
    alert('Exportación a PDF en desarrollo');
  };
  
  if (loading && campaigns.length === 0) {
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
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="campaign-comparison">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comparativa entre Campañas</h2>
            <p className="text-gray-600">Compara resultados entre diferentes campañas de evaluación</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadCampaigns}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {comparisonData && (
              <>
                <Button
                  onClick={() => handleExportComparison('csv')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  onClick={() => handleExportComparison('pdf')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Disclaimers */}
      {disclaimers.length > 0 && (
        <div className="mb-6">
          {disclaimers.map((disclaimer, index) => (
            <Alert key={index} type="warning" className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <Alert.Title>{disclaimer.message}</Alert.Title>
              <Alert.Description>
                {disclaimer.description}
                {disclaimer.campaigns && (
                  <div className="mt-2">
                    <strong>Campañas:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {disclaimer.campaigns.map(c => (
                        <li key={c.id}>
                          {c.name} (v{c.version})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Alert.Description>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Issues de compatibilidad */}
      {compatibilityIssues.length > 0 && (
        <div className="mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas de Compatibilidad</h3>
            <div className="space-y-2">
              {compatibilityIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-3 rounded ${
                    issue.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    issue.severity === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                  {issue.severity === 'error' && <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                  {issue.severity === 'info' && <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />}
                  <div>
                    <div className="font-medium text-gray-900">{issue.message}</div>
                    <div className="text-sm text-gray-600">{issue.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Issues de anonimato */}
      {anonymityIssues.length > 0 && (
        <div className="mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas de Anonimato</h3>
            <div className="space-y-2">
              {anonymityIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-3 rounded bg-yellow-50 border border-yellow-200"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {issue.campaignName} - {issue.message}
                    </div>
                    <div className="text-sm text-gray-600">
                      Datos ocultos: {issue.hiddenData?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Selector de campañas */}
      <div className="mb-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Campañas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCampaigns.includes(campaign.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCampaignSelect(campaign.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                  <Badge variant={campaign.status === 'completed' ? 'success' : 'warning'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Versión: {campaign.testVersion}</div>
                  <div>Inicio: {new Date(campaign.startDate).toLocaleDateString()}</div>
                  <div>Fin: {new Date(campaign.endDate).toLocaleDateString()}</div>
                  <div>Participantes: {campaign.participantCount || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Botón de comparar */}
      <div className="mb-6 text-center">
        <Button
          onClick={generateComparison}
          disabled={selectedCampaigns.length < 2 || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Generando Comparación...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Comparar Campañas ({selectedCampaigns.length})
            </>
          )}
        </Button>
      </div>
      
      {/* Resultados de comparación */}
      {comparisonData && (
        <div className="mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados de Comparación</h3>
            
            {/* Métricas generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {comparisonData.campaigns.map((campaign) => (
                <div key={campaign.id} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {campaign.participantCount}
                  </div>
                  <div className="text-sm text-gray-600">Participantes</div>
                  <div className="text-xs text-gray-500">{campaign.name}</div>
                </div>
              ))}
            </div>
            
            {/* Gráfico de comparación */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center text-gray-600">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Gráfico de comparación en desarrollo</p>
                <p className="text-sm">Los datos están listos para visualización</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CampaignComparison;