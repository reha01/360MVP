/**
 * DashboardPage - Página principal del dashboard operativo 360°
 * 
 * Características:
 * - Dashboard operativo con métricas
 * - Filtros y búsqueda avanzada
 * - Paginación eficiente
 * - Performance optimizada
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import OperationalDashboard from '../components/dashboard/OperationalDashboard';
import { Alert, Spinner } from '../components/ui';

const DashboardPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: dashboardEnabled } = useFeatureFlags('dashboard360');
  
  // Estados de carga
  if (authLoading || orgLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando dashboard...</span>
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
            Debes iniciar sesión para acceder al dashboard.
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
  
  return (
    <div data-testid="dashboard-page">
      <OperationalDashboard />
    </div>
  );
};

export default DashboardPage;