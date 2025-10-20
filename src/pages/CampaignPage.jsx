/**
 * Página principal para gestión de campañas 360°
 */

import React, { useState } from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import CampaignManager from '../components/campaign/CampaignManager';
import AggregationManager from '../components/aggregation/AggregationManager';
import Report360Manager from '../components/reports/Report360Manager';
import { Alert, Spinner, Tabs } from '../components/ui';

const CampaignPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  
  if (authLoading || orgLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }
  
  if (orgError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>Error de Organización</Alert.Title>
          <Alert.Description>{orgError}</Alert.Description>
        </Alert>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>No autenticado</Alert.Title>
          <Alert.Description>
            Debes iniciar sesión para acceder a las campañas.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  if (!currentOrgId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>Sin organización</Alert.Title>
          <Alert.Description>
            No tienes acceso a ninguna organización. Contacta a tu administrador.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="campaigns">Campañas</Tabs.Trigger>
          <Tabs.Trigger value="aggregations">Agregaciones</Tabs.Trigger>
          <Tabs.Trigger value="reports">Reportes</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="campaigns" className="mt-6">
          <CampaignManager onCampaignSelect={setSelectedCampaignId} />
        </Tabs.Content>
        
        <Tabs.Content value="aggregations" className="mt-6">
          {selectedCampaignId ? (
            <AggregationManager 
              orgId={currentOrgId} 
              campaignId={selectedCampaignId}
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecciona una Campaña
              </h3>
              <p className="text-gray-600">
                Selecciona una campaña para ver sus agregaciones
              </p>
            </div>
          )}
        </Tabs.Content>
        
        <Tabs.Content value="reports" className="mt-6">
          {selectedCampaignId ? (
            <Report360Manager 
              orgId={currentOrgId} 
              campaignId={selectedCampaignId}
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecciona una Campaña
              </h3>
              <p className="text-gray-600">
                Selecciona una campaña para ver sus reportes
              </p>
            </div>
          )}
        </Tabs.Content>
      </Tabs>
    </div>
  );
};

export default CampaignPage;
