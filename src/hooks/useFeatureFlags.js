// src/hooks/useFeatureFlags.js
import { useMemo } from 'react';
import { useMultiTenant } from './useMultiTenant';
import * as featureFlags from '../lib/featureFlags';

/**
 * useFeatureFlags - Hook para acceder fÃ¡cilmente a feature flags
 * Wrapper del servicio FeatureFlags para uso en componentes
 */
export const useFeatureFlags = (flagName) => {
  const { currentOrgId } = useMultiTenant();
  
  const flags = useMemo(() => {
    try {
      // Si se especifica un flag especÃ­fico, verificar solo ese
      if (flagName) {
        return {
          isEnabled: featureFlags.isFeatureEnabled(flagName, currentOrgId),
          loading: false,
          error: null
        };
      }
      
      // Retornar todos los flags (comportamiento legacy)
      return {
        orgEnabled: featureFlags.FEATURE_ORG,
        pdfEnabled: featureFlags.FEATURE_PDF,
        invitesEnabled: featureFlags.FEATURE_INVITES,
        wizardEnabled: featureFlags.FEATURE_WIZARD,
        creditsEnabled: featureFlags.FEATURE_CREDITS,
        testCatalogEnabled: featureFlags.TEST_CATALOG,
        tenancyEnabled: featureFlags.TENANCY_V1,
        debugEnabled: import.meta.env.DEV,
        performanceMetricsEnabled: false,
        shouldUseEmulators: import.meta.env.VITE_USE_EMULATORS === 'true',
        
        // Environment info
        environment: import.meta.env.MODE || 'production',
        defaultTenant: import.meta.env.VITE_DEFAULT_TENANT || 'default',
        appBaseUrl: import.meta.env.VITE_APP_BASE_URL || window.location.origin,
        
        // Full configuration for debugging
        getFullConfig: () => featureFlags.getEnabledFeatures()
      };
    } catch (error) {
      console.error('[useFeatureFlags] Error loading flags, using defaults:', error);
      // Return safe defaults if anything fails
      if (flagName) {
        return {
          isEnabled: false,
          loading: false,
          error: error.message
        };
      }
      
      return {
        orgEnabled: false,
        pdfEnabled: false,
        invitesEnabled: false,
        wizardEnabled: false,
        creditsEnabled: false,
        testCatalogEnabled: false,
        tenancyEnabled: false,
        debugEnabled: false,
        performanceMetricsEnabled: false,
        shouldUseEmulators: false,
        environment: 'production',
        defaultTenant: 'default',
        appBaseUrl: window.location.origin,
        getFullConfig: () => []
      };
    }
  }, [flagName, currentOrgId]);

  return flags;
};



export default useFeatureFlags;
