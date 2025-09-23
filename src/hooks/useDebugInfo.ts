// src/hooks/useDebugInfo.ts
// Hook to provide debug information for DebugBanner

import { useMemo } from 'react';
import { deriveEnv, isPublicHost } from '../utils/env';
import { FeatureFlags } from '../lib/featureFlags';
import { useOrg } from '../context/OrgContext';

export interface DebugInfo {
  env: string;
  publicHost: boolean;
  useEmulators: boolean;
  activeOrgId?: string | null;
  tenant?: string;
}

export const useDebugInfo = (): DebugInfo => {
  const { activeOrgId } = useOrg();

  return useMemo(() => ({
    env: deriveEnv(),
    publicHost: isPublicHost(),
    useEmulators: FeatureFlags.shouldUseEmulators(),
    activeOrgId,
    tenant: FeatureFlags.getDefaultTenant()
  }), [activeOrgId]);
};

