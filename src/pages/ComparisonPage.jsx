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
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { Alert, Spinner } from '../components/ui';

const ComparisonPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: comparisonEnabled } = useFeatureFlags('campaignComparison');
  
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
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="comparison-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comparativas entre Campañas</h1>
        <p className="text-gray-600">Compara resultados entre diferentes campañas de evaluación</p>
      </div>
      
      <Alert type="info">
        <Alert.Title>En Desarrollo</Alert.Title>
        <Alert.Description>
          Esta funcionalidad está siendo implementada. Próximamente podrás comparar campañas con disclaimers automáticos por diferencias de versión.
        </Alert.Description>
      </Alert>
    </div>
  );
};

export default ComparisonPage;