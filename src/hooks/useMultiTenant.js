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
 * ✅ VERSIÓN ORIGINAL: Implementación con estado local (evita loops con OrgContext)
 * 
 * IMPORTANTE: OrgContext guarda activeOrgId en localStorage para que getActiveOrgId lo encuentre
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
        
        // ✅ CLAVE: Usar getActiveOrgId que lee desde localStorage (guardado por OrgContext)
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
   */
  const switchOrganization = useCallback(async (orgId) => {
    if (!isMultiTenantEnabled) {
      console.warn('[useMultiTenant] Organization switching disabled');
      return false;
    }

    try {
      setError(null);
      
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

  // Cargar organizaciones al montar o cambiar usuario
  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

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
    
    // Utilities
    getPersonalOrgId: () => user?.uid ? getPersonalOrgId(user.uid) : null
  };
};

export default useMultiTenant;

import { useAuth } from '../context/AuthContext';
import { isTenancyV1Enabled } from '../lib/featureFlags';
import { 
  getActiveOrgId, 
  getPersonalOrgId, 
  getUserOrganizations 
} from '../services/firestore';

/**
 * Hook para manejo de multi-tenancy
 * ✅ VERSIÓN ORIGINAL: Implementación con estado local (evita loops con OrgContext)
 * 
 * IMPORTANTE: OrgContext guarda activeOrgId en localStorage para que getActiveOrgId lo encuentre
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
        
        // ✅ CLAVE: Usar getActiveOrgId que lee desde localStorage (guardado por OrgContext)
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
   */
  const switchOrganization = useCallback(async (orgId) => {
    if (!isMultiTenantEnabled) {
      console.warn('[useMultiTenant] Organization switching disabled');
      return false;
    }

    try {
      setError(null);
      
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

  // Cargar organizaciones al montar o cambiar usuario
  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

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
    
    // Utilities
    getPersonalOrgId: () => user?.uid ? getPersonalOrgId(user.uid) : null
  };
};

export default useMultiTenant;

import { useAuth } from '../context/AuthContext';
import { isTenancyV1Enabled } from '../lib/featureFlags';
import { 
  getActiveOrgId, 
  getPersonalOrgId, 
  getUserOrganizations 
} from '../services/firestore';

/**
 * Hook para manejo de multi-tenancy
 * ✅ VERSIÓN ORIGINAL: Implementación con estado local (evita loops con OrgContext)
 * 
 * IMPORTANTE: OrgContext guarda activeOrgId en localStorage para que getActiveOrgId lo encuentre
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
        
        // ✅ CLAVE: Usar getActiveOrgId que lee desde localStorage (guardado por OrgContext)
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
   */
  const switchOrganization = useCallback(async (orgId) => {
    if (!isMultiTenantEnabled) {
      console.warn('[useMultiTenant] Organization switching disabled');
      return false;
    }

    try {
      setError(null);
      
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

  // Cargar organizaciones al montar o cambiar usuario
  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

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
    
    // Utilities
    getPersonalOrgId: () => user?.uid ? getPersonalOrgId(user.uid) : null
  };
};

export default useMultiTenant;
