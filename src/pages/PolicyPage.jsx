/**
 * PolicyPage - Página de políticas organizacionales
 * 
 * Características:
 * - Panel de políticas por organización
 * - Regla "solo endurecer" (no relajar políticas)
 * - Preview de impacto al subir umbrales
 * - Aplicación efectiva en reportes y exports
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { Alert, Spinner } from '../components/ui';

const PolicyPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: policiesEnabled } = useFeatureFlags('orgPolicies');
  
  // Estados de carga
  if (authLoading || orgLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando políticas...</span>
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
            Debes iniciar sesión para acceder a las políticas.
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
  
  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="policies-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Políticas Organizacionales</h1>
        <p className="text-gray-600">Configura las políticas de privacidad y retención de datos</p>
      </div>
      
      <Alert type="info">
        <Alert.Title>En Desarrollo</Alert.Title>
        <Alert.Description>
          Esta funcionalidad está siendo implementada. Próximamente podrás configurar políticas con la regla "solo endurecer" y preview de impacto.
        </Alert.Description>
      </Alert>
    </div>
  );
};

export default PolicyPage;