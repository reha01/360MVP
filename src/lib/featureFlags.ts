/**
 * Feature Flags para Fase 2
 * 
 * Mantener OFF por defecto; ON solo para orgs piloto
 */

export const FEATURE_FLAGS = {
  // Fase 2 - Módulo 8
  VITE_FEATURE_DASHBOARD_360: {
    enabled: false,
    description: 'Dashboard operativo 360° con filtros y paginación',
    pilotOrgs: ['org_pilot_1', 'org_pilot_2'],
    rolloutPercentage: 0
  },
  
  VITE_FEATURE_BULK_ACTIONS: {
    enabled: false,
    description: 'Acciones masivas en campañas (reenviar, extender)',
    pilotOrgs: ['org_pilot_1'],
    rolloutPercentage: 0
  },
  
  VITE_FEATURE_CAMPAIGN_COMPARISON: {
    enabled: false,
    description: 'Comparativas entre campañas con disclaimers',
    pilotOrgs: ['org_pilot_1'],
    rolloutPercentage: 0
  },
  
  // Fase 2 - Módulo 9
  VITE_FEATURE_ORG_POLICIES: {
    enabled: false,
    description: 'Panel de políticas por organización',
    pilotOrgs: ['org_pilot_1'],
    rolloutPercentage: 0
  },
  
  VITE_FEATURE_OPERATIONAL_ALERTS: {
    enabled: false,
    description: 'Alertas operativas (DLQ, cuotas, bounces)',
    pilotOrgs: ['org_pilot_1'],
    rolloutPercentage: 0
  }
};

/**
 * Verificar si un feature flag está habilitado
 */
export const isFeatureEnabled = (flagName: string, orgId?: string): boolean => {
  const flag = FEATURE_FLAGS[flagName as keyof typeof FEATURE_FLAGS];
  
  if (!flag) {
    console.warn(`[FeatureFlags] Unknown flag: ${flagName}`);
    return false;
  }
  
  // Si está explícitamente habilitado
  if (flag.enabled) {
    return true;
  }
  
  // Si la org está en pilot
  if (orgId && flag.pilotOrgs.includes(orgId)) {
    return true;
  }
  
  // Si hay rollout percentage
  if (flag.rolloutPercentage > 0) {
    // Simular rollout basado en hash del orgId
    if (orgId) {
      const hash = orgId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const percentage = Math.abs(hash) % 100;
      return percentage < flag.rolloutPercentage;
    }
  }
  
  return false;
};

/**
 * Obtener configuración de feature flag
 */
export const getFeatureConfig = (flagName: string) => {
  return FEATURE_FLAGS[flagName as keyof typeof FEATURE_FLAGS];
};

/**
 * Listar todos los feature flags
 */
export const getAllFeatureFlags = () => {
  return Object.entries(FEATURE_FLAGS).map(([name, config]) => ({
    name,
    ...config
  }));
};

export default {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getFeatureConfig,
  getAllFeatureFlags
};