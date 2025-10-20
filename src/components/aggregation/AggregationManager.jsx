/**
 * Componente para gestión de agregaciones 360°
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import evaluation360AggregationService from '../../services/evaluation360AggregationService';
import { 
  getAggregationStatusLabel, 
  getAggregationStatusColor,
  getScoringMethodLabel 
} from '../../models/Evaluation360Aggregation';
import { Button, Card, Badge, Alert, Spinner, Tabs } from '../ui';

// Subcomponentes
import AggregationCard from './AggregationCard';
import AggregationDetails from './AggregationDetails';

const AggregationManager = ({ orgId, campaignId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregations, setAggregations] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAggregation, setSelectedAggregation] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Cargar datos iniciales
  useEffect(() => {
    if (campaignId) {
      loadData();
    }
  }, [campaignId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [aggregationsData, statsData] = await Promise.all([
        evaluation360AggregationService.getCampaignAggregations(orgId, campaignId),
        evaluation360AggregationService.getAggregationStats(orgId, campaignId)
      ]);
      
      setAggregations(aggregationsData);
      setStats(statsData);
      
      console.log(`[AggregationManager] Loaded ${aggregationsData.length} aggregations`);
    } catch (err) {
      console.error('[AggregationManager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReprocessAggregation = async (aggregationId) => {
    try {
      await evaluation360AggregationService.reprocessAggregation(orgId, aggregationId, 'system');
      await loadData();
    } catch (err) {
      console.error('[AggregationManager] Error reprocessing aggregation:', err);
      setError(err.message);
    }
  };
  
  const handleViewAggregation = (aggregation) => {
    setSelectedAggregation(aggregation);
  };
  
  const handleCloseDetails = () => {
    setSelectedAggregation(null);
  };
  
  // Filtrar agregaciones por estado
  const filteredAggregations = aggregations.filter(aggregation => {
    if (activeTab === 'all') return true;
    return aggregation.status === activeTab;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando agregaciones...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert type="error" className="mb-4">
        <AlertCircle className="w-4 h-4" />
        <Alert.Description>{error}</Alert.Description>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Cerrar
        </Button>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Agregaciones 360°
          </h2>
          <p className="text-gray-600 mt-1">
            Procesamiento y análisis de respuestas de evaluaciones
          </p>
        </div>
        
        <Button
          onClick={loadData}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {stats.total}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Agregaciones</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total} agregaciones
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {stats.completed}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completadas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.completed} agregaciones
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {stats.averageScore}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Score Promedio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.averageScore}/5.0
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">
                      {stats.averageCompletionRate}%
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completitud</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.averageCompletionRate}% promedio
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="all">Todas ({aggregations.length})</Tabs.Trigger>
          <Tabs.Trigger value="pending">Pendientes ({stats?.pending || 0})</Tabs.Trigger>
          <Tabs.Trigger value="in_progress">En Progreso ({stats?.inProgress || 0})</Tabs.Trigger>
          <Tabs.Trigger value="completed">Completadas ({stats?.completed || 0})</Tabs.Trigger>
          <Tabs.Trigger value="failed">Fallidas ({stats?.failed || 0})</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAggregations.map(aggregation => (
              <AggregationCard
                key={aggregation.id}
                aggregation={aggregation}
                onView={() => handleViewAggregation(aggregation)}
                onReprocess={() => handleReprocessAggregation(aggregation.id)}
              />
            ))}
          </div>
          
          {filteredAggregations.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay agregaciones
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'all' 
                    ? 'No hay agregaciones para esta campaña'
                    : `No hay agregaciones en estado ${getAggregationStatusLabel(activeTab).toLowerCase()}`
                  }
                </p>
              </div>
            </Card>
          )}
        </Tabs.Content>
      </Tabs>
      
      {/* Aggregation Details Modal */}
      {selectedAggregation && (
        <AggregationDetails
          aggregation={selectedAggregation}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default AggregationManager;
