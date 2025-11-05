/**
 * useRuntimeFeatureFlags - Hook para feature flags dinámicos desde Firestore
 */

import { useState, useEffect } from 'react';
import { useMultiTenant } from './useMultiTenant';
import { getOrgFeatureFlags } from '../services/featureFlagsService';

/**
 * Hook para obtener feature flags desde Firestore
 * @param {string} flagName - Nombre específico del flag (opcional)
 * @returns {Object} Estado del flag o flags
 */
export function useRuntimeFeatureFlags(flagName) {
  const { currentOrgId, loading: orgLoading } = useMultiTenant();
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // ✅ RESET cuando cambia el orgId
  useEffect(() => {
    setHasAttemptedLoad(false);
    setFlags(null);
    setError(null);
  }, [currentOrgId]);

  useEffect(() => {
    // ✅ SOLUCIÓN ROBUSTA: Patrón de suscripción reactiva
    
    // Estado 1: Esperando que useMultiTenant termine de cargar
    if (orgLoading) {
      console.log('[useRuntimeFeatureFlags] Waiting for useMultiTenant to finish loading...');
      setLoading(true);
      return;
    }
    
    // Estado 2: useMultiTenant terminó, pero no hay orgId
    if (!currentOrgId) {
      console.warn('[useRuntimeFeatureFlags] No currentOrgId available, using defaults');
      setLoading(false);
      setFlags(getDefaultFlags());
      setHasAttemptedLoad(true);
      return;
    }
    
    // Estado 3: Tenemos orgId, intentar cargar flags (solo una vez por orgId)
    if (!hasAttemptedLoad || flags === null) {
      console.log('[useRuntimeFeatureFlags] Loading flags for org:', currentOrgId);
      
      let mounted = true;

      async function loadFlags() {
        try {
          setLoading(true);
          setError(null);
          
          const orgFlags = await getOrgFeatureFlags(currentOrgId);
          
          if (mounted) {
            setFlags(orgFlags);
            setLoading(false);
            setHasAttemptedLoad(true);
            console.log('[useRuntimeFeatureFlags] Flags loaded successfully for:', currentOrgId);
          }
        } catch (err) {
          console.error('[useRuntimeFeatureFlags] Error loading flags:', err);
          if (mounted) {
            setError(err.message);
            setFlags(getDefaultFlags());
            setLoading(false);
            setHasAttemptedLoad(true);
          }
        }
      }

      loadFlags();

      return () => {
        mounted = false;
      };
    }
    
    // Estado 4: Ya tenemos flags, no hacer nada
    console.log('[useRuntimeFeatureFlags] Using cached flags for:', currentOrgId);
    
  }, [currentOrgId, orgLoading, hasAttemptedLoad, flags]);

  // Si se pidió un flag específico, retornar solo ese
  if (flagName) {
    return {
      isEnabled: flags ? flags[flagName] === true : false,
      loading,
      error
    };
  }

  // Retornar todos los flags
  return {
    flags: flags || getDefaultFlags(),
    loading,
    error
  };
}

function getDefaultFlags() {
  return {
    FEATURE_DASHBOARD_360: false,
    FEATURE_BULK_ACTIONS: false,
    FEATURE_CAMPAIGN_COMPARISON: false,
    FEATURE_ORG_POLICIES: false,
    FEATURE_OPERATIONAL_ALERTS: false,
    FEATURE_ORG: true,
    FEATURE_PDF: true,
    FEATURE_EMAIL: true,
    FEATURE_INVITES: true,
    FEATURE_WIZARD: true,
    FEATURE_CREDITS: false,
    TEST_CATALOG: false,
    TENANCY_V1: true
  };
}

export default useRuntimeFeatureFlags;



 */

import { useState, useEffect } from 'react';
import { useMultiTenant } from './useMultiTenant';
import { getOrgFeatureFlags } from '../services/featureFlagsService';

/**
 * Hook para obtener feature flags desde Firestore
 * @param {string} flagName - Nombre específico del flag (opcional)
 * @returns {Object} Estado del flag o flags
 */
export function useRuntimeFeatureFlags(flagName) {
  const { currentOrgId, loading: orgLoading } = useMultiTenant();
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // ✅ RESET cuando cambia el orgId
  useEffect(() => {
    setHasAttemptedLoad(false);
    setFlags(null);
    setError(null);
  }, [currentOrgId]);

  useEffect(() => {
    // ✅ SOLUCIÓN ROBUSTA: Patrón de suscripción reactiva
    
    // Estado 1: Esperando que useMultiTenant termine de cargar
    if (orgLoading) {
      console.log('[useRuntimeFeatureFlags] Waiting for useMultiTenant to finish loading...');
      setLoading(true);
      return;
    }
    
    // Estado 2: useMultiTenant terminó, pero no hay orgId
    if (!currentOrgId) {
      console.warn('[useRuntimeFeatureFlags] No currentOrgId available, using defaults');
      setLoading(false);
      setFlags(getDefaultFlags());
      setHasAttemptedLoad(true);
      return;
    }
    
    // Estado 3: Tenemos orgId, intentar cargar flags (solo una vez por orgId)
    if (!hasAttemptedLoad || flags === null) {
      console.log('[useRuntimeFeatureFlags] Loading flags for org:', currentOrgId);
      
      let mounted = true;

      async function loadFlags() {
        try {
          setLoading(true);
          setError(null);
          
          const orgFlags = await getOrgFeatureFlags(currentOrgId);
          
          if (mounted) {
            setFlags(orgFlags);
            setLoading(false);
            setHasAttemptedLoad(true);
            console.log('[useRuntimeFeatureFlags] Flags loaded successfully for:', currentOrgId);
          }
        } catch (err) {
          console.error('[useRuntimeFeatureFlags] Error loading flags:', err);
          if (mounted) {
            setError(err.message);
            setFlags(getDefaultFlags());
            setLoading(false);
            setHasAttemptedLoad(true);
          }
        }
      }

      loadFlags();

      return () => {
        mounted = false;
      };
    }
    
    // Estado 4: Ya tenemos flags, no hacer nada
    console.log('[useRuntimeFeatureFlags] Using cached flags for:', currentOrgId);
    
  }, [currentOrgId, orgLoading, hasAttemptedLoad, flags]);

  // Si se pidió un flag específico, retornar solo ese
  if (flagName) {
    return {
      isEnabled: flags ? flags[flagName] === true : false,
      loading,
      error
    };
  }

  // Retornar todos los flags
  return {
    flags: flags || getDefaultFlags(),
    loading,
    error
  };
}

function getDefaultFlags() {
  return {
    FEATURE_DASHBOARD_360: false,
    FEATURE_BULK_ACTIONS: false,
    FEATURE_CAMPAIGN_COMPARISON: false,
    FEATURE_ORG_POLICIES: false,
    FEATURE_OPERATIONAL_ALERTS: false,
    FEATURE_ORG: true,
    FEATURE_PDF: true,
    FEATURE_EMAIL: true,
    FEATURE_INVITES: true,
    FEATURE_WIZARD: true,
    FEATURE_CREDITS: false,
    TEST_CATALOG: false,
    TENANCY_V1: true
  };
}

export default useRuntimeFeatureFlags;



 */

import { useState, useEffect } from 'react';
import { useMultiTenant } from './useMultiTenant';
import { getOrgFeatureFlags } from '../services/featureFlagsService';

/**
 * Hook para obtener feature flags desde Firestore
 * @param {string} flagName - Nombre específico del flag (opcional)
 * @returns {Object} Estado del flag o flags
 */
export function useRuntimeFeatureFlags(flagName) {
  const { currentOrgId, loading: orgLoading } = useMultiTenant();
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // ✅ RESET cuando cambia el orgId
  useEffect(() => {
    setHasAttemptedLoad(false);
    setFlags(null);
    setError(null);
  }, [currentOrgId]);

  useEffect(() => {
    // ✅ SOLUCIÓN ROBUSTA: Patrón de suscripción reactiva
    
    // Estado 1: Esperando que useMultiTenant termine de cargar
    if (orgLoading) {
      console.log('[useRuntimeFeatureFlags] Waiting for useMultiTenant to finish loading...');
      setLoading(true);
      return;
    }
    
    // Estado 2: useMultiTenant terminó, pero no hay orgId
    if (!currentOrgId) {
      console.warn('[useRuntimeFeatureFlags] No currentOrgId available, using defaults');
      setLoading(false);
      setFlags(getDefaultFlags());
      setHasAttemptedLoad(true);
      return;
    }
    
    // Estado 3: Tenemos orgId, intentar cargar flags (solo una vez por orgId)
    if (!hasAttemptedLoad || flags === null) {
      console.log('[useRuntimeFeatureFlags] Loading flags for org:', currentOrgId);
      
      let mounted = true;

      async function loadFlags() {
        try {
          setLoading(true);
          setError(null);
          
          const orgFlags = await getOrgFeatureFlags(currentOrgId);
          
          if (mounted) {
            setFlags(orgFlags);
            setLoading(false);
            setHasAttemptedLoad(true);
            console.log('[useRuntimeFeatureFlags] Flags loaded successfully for:', currentOrgId);
          }
        } catch (err) {
          console.error('[useRuntimeFeatureFlags] Error loading flags:', err);
          if (mounted) {
            setError(err.message);
            setFlags(getDefaultFlags());
            setLoading(false);
            setHasAttemptedLoad(true);
          }
        }
      }

      loadFlags();

      return () => {
        mounted = false;
      };
    }
    
    // Estado 4: Ya tenemos flags, no hacer nada
    console.log('[useRuntimeFeatureFlags] Using cached flags for:', currentOrgId);
    
  }, [currentOrgId, orgLoading, hasAttemptedLoad, flags]);

  // Si se pidió un flag específico, retornar solo ese
  if (flagName) {
    return {
      isEnabled: flags ? flags[flagName] === true : false,
      loading,
      error
    };
  }

  // Retornar todos los flags
  return {
    flags: flags || getDefaultFlags(),
    loading,
    error
  };
}

function getDefaultFlags() {
  return {
    FEATURE_DASHBOARD_360: false,
    FEATURE_BULK_ACTIONS: false,
    FEATURE_CAMPAIGN_COMPARISON: false,
    FEATURE_ORG_POLICIES: false,
    FEATURE_OPERATIONAL_ALERTS: false,
    FEATURE_ORG: true,
    FEATURE_PDF: true,
    FEATURE_EMAIL: true,
    FEATURE_INVITES: true,
    FEATURE_WIZARD: true,
    FEATURE_CREDITS: false,
    TEST_CATALOG: false,
    TENANCY_V1: true
  };
}

export default useRuntimeFeatureFlags;


