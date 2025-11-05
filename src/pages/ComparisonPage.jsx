/**
 * ComparisonPage - Página de comparativas entre campañas
 * 
 * Características:
 * - Comparativas entre campañas
 * - Disclaimers por diferencias de versión
 * - Respeto de umbrales de anonimato
 * - Consistencia UI ↔ export
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import { useRuntimeFeatureFlags } from '../hooks/useRuntimeFeatureFlags';
import CampaignComparison from '../components/comparison/CampaignComparison';
import { Alert, Spinner } from '../components/ui';

const ComparisonPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: comparisonEnabled, loading: flagsLoading } = useRuntimeFeatureFlags('FEATURE_CAMPAIGN_COMPARISON');
  
  // Estados de carga
  if (authLoading || orgLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando comparativas...</span>
      </div>
    );
  }
  
  // Verificar autenticación
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error">
          <Alert.Title>No autenticado</Alert.Title>
          <Alert.Description>
            Debes iniciar sesión para acceder a las comparativas.
          </Alert.Description>
        </Alert>
      </div>
    );
  }
  
  // Verificar organización
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
    <div data-testid="comparison-page">
      <CampaignComparison />
    </div>
  );
};

export default ComparisonPage;