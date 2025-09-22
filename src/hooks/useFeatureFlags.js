// src/hooks/useFeatureFlags.js
import { useMemo } from 'react';
import { FeatureFlags } from '../services/featureFlags';

/**
 * useFeatureFlags - Hook para acceder fácilmente a feature flags
 * Wrapper del servicio FeatureFlags para uso en componentes
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => ({
    orgEnabled: FeatureFlags.isOrgEnabled(),
    pdfEnabled: FeatureFlags.isPdfEnabled(),
    invitesEnabled: FeatureFlags.isInvitesEnabled(),
    wizardEnabled: FeatureFlags.isWizardEnabled(),
    creditsEnabled: FeatureFlags.isCreditsEnabled(),
    debugEnabled: FeatureFlags.isDebugEnabled(),
    performanceMetricsEnabled: FeatureFlags.isPerformanceMetricsEnabled(),
    shouldUseEmulators: FeatureFlags.shouldUseEmulators(),
    
    // Environment info
    environment: FeatureFlags._getEnvironment(),
    defaultTenant: FeatureFlags.getDefaultTenant(),
    appBaseUrl: FeatureFlags.getAppBaseUrl(),
    
    // Full configuration for debugging
    getFullConfig: () => FeatureFlags.getConfiguration()
  }), []);

  return flags;
};

export default useFeatureFlags;
