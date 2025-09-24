// src/hooks/useFeatureFlags.js
import { useMemo } from 'react';
import { FeatureFlags } from '../lib/featureFlags';

/**
 * useFeatureFlags - Hook para acceder fácilmente a feature flags
 * Wrapper del servicio FeatureFlags para uso en componentes
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => {
    try {
      return {
        orgEnabled: FeatureFlags.isOrgEnabled(),
        pdfEnabled: FeatureFlags.isPdfEnabled(),
        invitesEnabled: FeatureFlags.isInvitesEnabled(),
        wizardEnabled: FeatureFlags.isWizardEnabled(),
        creditsEnabled: FeatureFlags.isCreditsEnabled(),
        debugEnabled: FeatureFlags.isDebugEnabled(),
        performanceMetricsEnabled: FeatureFlags.isPerformanceMetricsEnabled(),
        shouldUseEmulators: FeatureFlags.shouldUseEmulators(),
        
        // Environment info - with safety check
        environment: (typeof FeatureFlags.getEnvironment === 'function' 
          ? FeatureFlags.getEnvironment() 
          : 'production'),
        defaultTenant: FeatureFlags.getDefaultTenant(),
        appBaseUrl: FeatureFlags.getAppBaseUrl(),
        
        // Full configuration for debugging
        getFullConfig: () => FeatureFlags.getConfiguration()
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
        debugEnabled: false,
        performanceMetricsEnabled: false,
        shouldUseEmulators: false,
        environment: 'production',
        defaultTenant: 'default',
        appBaseUrl: window.location.origin,
        getFullConfig: () => ({})
      };
    }
  }, []);

  return flags;
};

export default useFeatureFlags;
