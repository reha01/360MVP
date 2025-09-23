// src/hooks/useMultiTenant.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isTenancyV1Enabled } from '../lib/featureFlags';
import { 
  getActiveOrgId, 
  getPersonalOrgId, 
  getUserOrganizations 
} from '../services/firestore';

/**
 * Hook para manejo de multi-tenancy
 * En Phase 0, siempre retorna la organización personal del usuario
 * En fases futuras, permitirá cambio entre organizaciones
 */
export const useMultiTenant = () => {
  const { user } = useAuth();
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMultiTenantEnabled = isTenancyV1Enabled();

  /**
   * Carga las organizaciones del usuario
   */
  const loadUserOrganizations = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (!isMultiTenantEnabled) {
        // Modo compatibilidad: solo org personal conceptual
        const personalOrgId = getPersonalOrgId(user.uid);
        setCurrentOrgId(personalOrgId);
        setUserOrganizations([{
          id: personalOrgId,
          name: 'Personal Space',
          type: 'personal',
          ownerId: user.uid,
          isDefault: true
        }]);
      } else {
        // Modo multi-tenant: cargar organizaciones reales
        const orgs = await getUserOrganizations(user.uid);
        setUserOrganizations(orgs);
        
        // Establecer org activa (en Phase 0, siempre personal)
        const activeOrgId = await getActiveOrgId(user.uid);
        setCurrentOrgId(activeOrgId);
      }
    } catch (err) {
      console.error('[useMultiTenant] Error loading organizations:', err);
      setError(err.message);
      
      // Fallback: usar org personal
      const personalOrgId = getPersonalOrgId(user.uid);
      setCurrentOrgId(personalOrgId);
      setUserOrganizations([{
        id: personalOrgId,
        name: 'Personal Space',
        type: 'personal',
        ownerId: user.uid,
        isDefault: true,
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isMultiTenantEnabled]);

  /**
   * Cambiar organización activa
   * En Phase 0, solo permite org personal
   */
  const switchOrganization = useCallback(async (orgId) => {
    if (!isMultiTenantEnabled) {
      console.warn('[useMultiTenant] Organization switching disabled - multi-tenancy not enabled');
      return false;
    }

    try {
      setError(null);
      
      // Validar que el usuario tenga acceso a esta org
      const hasAccess = userOrganizations.some(org => org.id === orgId);
      if (!hasAccess) {
        throw new Error(`Access denied to organization: ${orgId}`);
      }

      setCurrentOrgId(orgId);
      console.log('[useMultiTenant] Switched to organization:', orgId);
      return true;
    } catch (err) {
      console.error('[useMultiTenant] Error switching organization:', err);
      setError(err.message);
      return false;
    }
  }, [userOrganizations, isMultiTenantEnabled]);

  /**
   * Obtener organización actual
   */
  const getCurrentOrganization = useCallback(() => {
    if (!currentOrgId) return null;
    return userOrganizations.find(org => org.id === currentOrgId) || null;
  }, [currentOrgId, userOrganizations]);

  /**
   * Verificar si el usuario es owner de la org actual
   */
  const isCurrentOrgOwner = useCallback(() => {
    const currentOrg = getCurrentOrganization();
    return currentOrg ? currentOrg.ownerId === user?.uid : false;
  }, [getCurrentOrganization, user?.uid]);

  /**
   * Obtener configuración de scoping para queries
   */
  const getScopingConfig = useCallback(() => {
    return {
      orgId: currentOrgId,
      userId: user?.uid,
      enableOrgScoping: isMultiTenantEnabled && currentOrgId,
      enableUserScoping: true // Siempre filtrar por usuario como fallback
    };
  }, [currentOrgId, user?.uid, isMultiTenantEnabled]);

  // Cargar organizaciones al montar o cambiar usuario
  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

  // Debug logging
  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_LOGS === 'true' && currentOrgId) {
      console.log('[useMultiTenant] Current state:', {
        orgId: currentOrgId,
        orgCount: userOrganizations.length,
        isMultiTenantEnabled,
        userId: user?.uid
      });
    }
  }, [currentOrgId, userOrganizations, isMultiTenantEnabled, user?.uid]);

  return {
    // Estado
    currentOrgId,
    userOrganizations,
    loading,
    error,
    
    // Configuración
    isMultiTenantEnabled,
    
    // Acciones
    switchOrganization,
    refreshOrganizations: loadUserOrganizations,
    
    // Helpers
    getCurrentOrganization,
    isCurrentOrgOwner,
    getScopingConfig,
    
    // Utilities
    getPersonalOrgId: () => user?.uid ? getPersonalOrgId(user.uid) : null
  };
};

export default useMultiTenant;

