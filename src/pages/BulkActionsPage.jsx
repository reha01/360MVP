/**
 * BulkActionsPage - Página para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Extensión de plazos masiva
 * - Sistema de colas con backoff exponencial
 * - Dead Letter Queue (DLQ) para manejo de errores
 * - Auditoría completa de acciones
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import BulkActionsManager from '../components/bulk/BulkActionsManager';
import { Alert, Spinner } from '../components/ui';

const BulkActionsPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  
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
            Debes iniciar sesión para acceder a las acciones masivas.
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
  
  return <BulkActionsManager />;
};

export default BulkActionsPage;





/**
 * BulkActionsPage - Página para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Extensión de plazos masiva
 * - Sistema de colas con backoff exponencial
 * - Dead Letter Queue (DLQ) para manejo de errores
 * - Auditoría completa de acciones
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import BulkActionsManager from '../components/bulk/BulkActionsManager';
import { Alert, Spinner } from '../components/ui';

const BulkActionsPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  
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
            Debes iniciar sesión para acceder a las acciones masivas.
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
  
  return <BulkActionsManager />;
};

export default BulkActionsPage;





/**
 * BulkActionsPage - Página para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Extensión de plazos masiva
 * - Sistema de colas con backoff exponencial
 * - Dead Letter Queue (DLQ) para manejo de errores
 * - Auditoría completa de acciones
 */

import React from 'react';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { useAuth } from '../context/AuthContext';
import BulkActionsManager from '../components/bulk/BulkActionsManager';
import { Alert, Spinner } from '../components/ui';

const BulkActionsPage = () => {
  const { currentOrgId, loading: orgLoading, error: orgError } = useMultiTenant();
  const { user, loading: authLoading } = useAuth();
  
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
            Debes iniciar sesión para acceder a las acciones masivas.
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
  
  return <BulkActionsManager />;
};

export default BulkActionsPage;




