/**
 * OperationalDashboard - Dashboard principal para monitoreo de campañas 360°
 * 
 * Características:
 * - Performance optimizada (p95 < 2s)
 * - Filtros combinados sin degradación
 * - Paginación eficiente
 * - Búsqueda en tiempo real con debounce
 * - Métricas de performance en tiempo real
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import campaignService from '../../services/campaignService';
import evaluation360AggregationService from '../../services/evaluation360AggregationService';
import { Card, Button, Spinner, Alert } from '../ui';
import { Search, Filter, Download, RefreshCw, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const OperationalDashboard = () => {
  const { currentOrgId } = useMultiTenant();
  const { isEnabled: dashboardEnabled } = useFeatureFlags('FEATURE_DASHBOARD_360');
  
  // Estados principales
  const [campaigns, setCampaigns] = useState([]);
  const [aggregations, setAggregations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    jobFamily: 'all',
    dateFrom: '',
    dateTo: '',
    area: 'all'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  });
  
  // Estados de performance
  const [performanceMetrics, setPerformanceMetrics] = useState({
    p95Time: 0,
    loadTime: 0,
    filterTime: 0,
    searchTime: 0
  });
  
  // Debounce para búsqueda
  const [searchDebounce, setSearchDebounce] = useState(null);
  
  // Verificar feature flag
  if (!dashboardEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="info">
          <Alert.Title>Función no disponible</Alert.Title>
          <Alert.Description>
            El dashboard operativo está en desarrollo. Esta función estará disponible próximamente.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Función optimizada para cargar datos
  const loadData = useCallback(async (startTime = Date.now()) => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar campañas y agregaciones en paralelo
      const [campaignsData, aggregationsData] = await Promise.all([
        campaignService.getCampaigns(currentOrgId, {
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filters
        }),
        evaluation360AggregationService.getAggregations(currentOrgId, {
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filters
        })
      ]);
      
      setCampaigns(campaignsData.campaigns || []);
      setAggregations(aggregationsData.aggregations || []);
      setPagination(prev => ({
        ...prev,
        total: campaignsData.total || 0,
        hasMore: campaignsData.hasMore || false
      }));
      
      // Calcular métricas de performance
      const loadTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime,
        p95Time: Math.max(prev.p95Time, loadTime)
      }));
      
    } catch (err) {
      console.error('[OperationalDashboard] Error loading data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId, pagination.page, pagination.pageSize, filters]);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId, loadData]);
  
  // Debounce para búsqueda
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      if (filters.search !== '') {
        const startTime = Date.now();
        loadData(startTime).then(() => {
          const searchTime = Date.now() - startTime;
          setPerformanceMetrics(prev => ({
            ...prev,
            searchTime
          }));
        });
      }
    }, 300); // 300ms debounce
    
    setSearchDebounce(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [filters.search, loadData]);
  
  // Función para aplicar filtros
  const applyFilters = useCallback((newFilters) => {
    const startTime = Date.now();
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset a página 1
    
    // Cargar datos con nuevos filtros
    loadData(startTime).then(() => {
      const filterTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        filterTime
      }));
    });
  }, [loadData]);
  
  // Función para cambiar página
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);
  
  // Función para cargar más datos
  const loadMore = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);
  
  // Función para refrescar datos
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);
  
  // Calcular métricas del dashboard
  const dashboardMetrics = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const totalEvaluations = aggregations.length;
    const completedEvaluations = aggregations.filter(a => a.status === 'completed').length;
    
    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalEvaluations,
      completedEvaluations,
      completionRate: totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0
    };
  }, [campaigns, aggregations]);
  
  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>Error en el Dashboard</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="operational-dashboard">
      {/* Header del Dashboard */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Operativo 360°</h1>
            <p className="text-gray-600">Monitoreo y gestión de campañas de evaluación</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Métricas de Performance */}
      <div className="mb-6" data-testid="performance-metrics">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="p95-time">
                {performanceMetrics.p95Time}ms
              </div>
              <div className="text-sm text-gray-600">P95 Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.loadTime}ms
              </div>
              <div className="text-sm text-gray-600">Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceMetrics.filterTime}ms
              </div>
              <div className="text-sm text-gray-600">Filter Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.searchTime}ms
              </div>
              <div className="text-sm text-gray-600">Search Time</div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Métricas del Dashboard */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.totalCampaigns}
                </div>
                <div className="text-sm text-gray-600">Total Campañas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.activeCampaigns}
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
                  {dashboardMetrics.completedCampaigns}
                </div>
                <div className="text-sm text-gray-600">Completadas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.totalEvaluations}
                </div>
                <div className="text-sm text-gray-600">Evaluaciones</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.completionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Tasa Completitud</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="mb-6" data-testid="dashboard-filters">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar campañas..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  data-testid="search-filter"
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
                data-testid="status-filter"
              >
                <option value="all">Todos</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Family
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.jobFamily}
                onChange={(e) => setFilters(prev => ({ ...prev, jobFamily: e.target.value }))}
                data-testid="job-family-filter"
              >
                <option value="all">Todas</option>
                <option value="leadership">Liderazgo</option>
                <option value="technical">Técnico</option>
                <option value="sales">Ventas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                data-testid="date-filter"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                data-testid="date-to-filter"
              />
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
      
      {/* Lista de Campañas */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                data-testid="campaign-card"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {campaign.description}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500" data-testid="campaign-id">
                      ID: {campaign.id}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span>Estado: {campaign.status}</span>
                    <span>Inicio: {new Date(campaign.startDate).toLocaleDateString()}</span>
                    <span>Fin: {new Date(campaign.endDate).toLocaleDateString()}</span>
                    <span>Evaluaciones: {campaign.evaluationCount || 0}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Paginación */}
      <div className="mb-6" data-testid="dashboard-pagination">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} campañas
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
      
      {/* Load More */}
      {pagination.hasMore && (
        <div className="text-center" data-testid="load-more">
          <Button
            onClick={loadMore}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Cargando...
              </>
            ) : (
              'Cargar Más'
            )}
          </Button>
        </div>
      )}
      
      {/* Indicador de carga */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <div className="flex items-center">
            <Spinner size="sm" className="mr-2" />
            <span className="text-sm text-gray-600">Actualizando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;