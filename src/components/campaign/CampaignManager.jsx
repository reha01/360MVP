/**
 * Componente principal para gestión de campañas 360°
 */

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import { CAMPAIGN_STATUS } from '../../models/Campaign';
import { getCampaignStatusLabel, getCampaignStatusColor } from '../../models/Campaign';

// Subcomponentes
import CampaignWizard from './CampaignWizard';
import CampaignCard from './CampaignCard';

// UI Components
import { 
  Button, 
  Card, 
  Tabs, 
  Alert, 
  Spinner,
  Badge,
  Input
} from '../ui';

const CampaignManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [overview, setOverview] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [campaignsData, overviewData] = await Promise.all([
        campaignService.getOrgCampaigns(currentOrgId),
        campaignService.getCampaignsOverview(currentOrgId)
      ]);
      
      setCampaigns(campaignsData);
      setOverview(overviewData);
      
      console.log('[CampaignManager] Data loaded:', {
        campaigns: campaignsData.length
      });
    } catch (err) {
      console.error('[CampaignManager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleCreateCampaign = async (campaignData) => {
    try {
      await campaignService.createCampaign(currentOrgId, campaignData, user.uid);
      await loadData();
      setShowCampaignWizard(false);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleActivateCampaign = async (campaignId) => {
    try {
      await campaignService.activateCampaign(currentOrgId, campaignId, user.uid);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleCloseCampaign = async (campaignId) => {
    try {
      await campaignService.closeCampaign(currentOrgId, campaignId, user.uid);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Filtrar campañas por búsqueda
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agrupar por estado
  const campaignsByStatus = Object.values(CAMPAIGN_STATUS).reduce((acc, status) => {
    acc[status] = filteredCampaigns.filter(campaign => campaign.status === status);
    return acc;
  }, {});
  
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
      <Alert type="error" className="mb-4">
        <Alert.Title>Error</Alert.Title>
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
          <h1 className="text-2xl font-bold text-gray-900">
            Campañas 360°
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona campañas de evaluación 360° para tu organización
          </p>
        </div>
        
        <Button
          onClick={() => setShowCampaignWizard(true)}
        >
          Nueva Campaña
        </Button>
      </div>
      
      {/* Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {overview.total}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Campañas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overview.total} campañas
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
                      {overview.byStatus.active || 0}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Activas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overview.byStatus.active || 0} campañas
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
                      {overview.totalEvaluatees}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Evaluados</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overview.totalEvaluatees} personas
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
                      {overview.averageCompletionRate}%
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completitud</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overview.averageCompletionRate}% promedio
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar campañas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="all">Todas</Tabs.Trigger>
          <Tabs.Trigger value="draft">Borradores</Tabs.Trigger>
          <Tabs.Trigger value="active">Activas</Tabs.Trigger>
          <Tabs.Trigger value="closed">Cerradas</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onActivate={handleActivateCampaign}
                onClose={handleCloseCampaign}
              />
            ))}
          </div>
          
          {filteredCampaigns.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay campañas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera campaña de evaluación 360°
                </p>
                <Button
                  onClick={() => setShowCampaignWizard(true)}
                >
                  Crear Campaña
                </Button>
              </div>
            </Card>
          )}
        </Tabs.Content>
        
        {Object.values(CAMPAIGN_STATUS).map(status => (
          <Tabs.Content key={status} value={status} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignsByStatus[status].map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onActivate={handleActivateCampaign}
                  onClose={handleCloseCampaign}
                />
              ))}
            </div>
            
            {campaignsByStatus[status].length === 0 && (
              <Card>
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay campañas {getCampaignStatusLabel(status).toLowerCase()}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {status === CAMPAIGN_STATUS.DRAFT 
                      ? 'Crea una nueva campaña para comenzar'
                      : `No hay campañas en estado ${getCampaignStatusLabel(status).toLowerCase()}`
                    }
                  </p>
                  {status === CAMPAIGN_STATUS.DRAFT && (
                    <Button
                      onClick={() => setShowCampaignWizard(true)}
                    >
                      Crear Campaña
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </Tabs.Content>
        ))}
      </Tabs>
      
      {/* Campaign Wizard */}
      {showCampaignWizard && (
        <CampaignWizard
          isOpen={showCampaignWizard}
          onClose={() => setShowCampaignWizard(false)}
          onSuccess={handleCreateCampaign}
        />
      )}
    </div>
  );
};

export default CampaignManager;
