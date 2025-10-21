/**
 * AlertPage - Página de alertas operativas
 * 
 * Características:
 * - Alertas operativas (DLQ, cuotas, bounces)
 * - Enlaces a acciones relacionadas
 * - Resolución de alertas
 * - Monitoreo en tiempo real
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import AlertManager from '../components/alerts/AlertManager';
import { Alert, Spinner } from '../components/ui';

const AlertPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  const { isEnabled: alertsEnabled } = useFeatureFlags('operationalAlerts');
  
  // Estados de carga
  if (authLoading || orgLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando alertas...</span>
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
            Debes iniciar sesión para acceder a las alertas.
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
    <div data-testid="alerts-page">
      <AlertManager />
    </div>
  );
};

export default AlertPage;
