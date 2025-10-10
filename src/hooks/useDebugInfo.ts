// src/hooks/useDebugInfo.ts
// Hook to provide debug information for DebugBanner

import { useMemo } from 'react';
import { deriveEnv, isPublicHost } from '../utils/env';
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
    useEmulators: import.meta.env.VITE_USE_EMULATORS === 'true',
    activeOrgId,
    tenant: import.meta.env.VITE_DEFAULT_TENANT || 'default'
  }), [activeOrgId]);
};








