// src/hooks/useFeatureFlags.js
import { useMemo } from 'react';
import * as featureFlags from '../lib/featureFlags';

/**
 * useFeatureFlags - Hook para acceder fácilmente a feature flags
 * Wrapper del servicio FeatureFlags para uso en componentes
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => {
    try {
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
  }, []);

  return flags;
};

export default useFeatureFlags;
