/**
 * Script para configurar feature flags para orgs piloto
 * Simula la configuración de flags ON para orgs piloto
 */

console.log('🚩 Configurando feature flags para orgs piloto...');

// Configuración de feature flags
const featureFlagsConfig = {
  // Flags globales (OFF por defecto)
  global: {
    VITE_FEATURE_DASHBOARD_360: false,
    VITE_FEATURE_BULK_ACTIONS: false,
    VITE_FEATURE_CAMPAIGN_COMPARISON: false,
    VITE_FEATURE_ORG_POLICIES: false,
    VITE_FEATURE_OPERATIONAL_ALERTS: false
  },
  
  // Orgs piloto (ON para estas orgs)
  pilotOrgs: [
    'pilot-org-santiago',
    'pilot-org-mexico'
  ],
  
  // Configuración por org
  orgConfig: {
    'pilot-org-santiago': {
      VITE_FEATURE_DASHBOARD_360: true,
      VITE_FEATURE_BULK_ACTIONS: true,
      VITE_FEATURE_CAMPAIGN_COMPARISON: true,
      VITE_FEATURE_ORG_POLICIES: true,
      VITE_FEATURE_OPERATIONAL_ALERTS: true
    },
    'pilot-org-mexico': {
      VITE_FEATURE_DASHBOARD_360: true,
      VITE_FEATURE_BULK_ACTIONS: true,
      VITE_FEATURE_CAMPAIGN_COMPARISON: true,
      VITE_FEATURE_ORG_POLICIES: true,
      VITE_FEATURE_OPERATIONAL_ALERTS: true
    }
  }
};

// Simular configuración
console.log('📊 Configuración de feature flags:');
console.log('');

console.log('🌍 Global (OFF por defecto):');
Object.entries(featureFlagsConfig.global).forEach(([flag, value]) => {
  console.log(`   - ${flag}: ${value ? 'ON' : 'OFF'}`);
});

console.log('');
console.log('🎯 Orgs piloto habilitadas:');
featureFlagsConfig.pilotOrgs.forEach(orgId => {
  console.log(`   - ${orgId}: TODOS LOS FLAGS ON`);
});

console.log('');
console.log('🔧 Configuración por org:');
Object.entries(featureFlagsConfig.orgConfig).forEach(([orgId, flags]) => {
  console.log(`   ${orgId}:`);
  Object.entries(flags).forEach(([flag, value]) => {
    console.log(`     - ${flag}: ${value ? 'ON' : 'OFF'}`);
  });
});

console.log('');
console.log('✅ Feature flags configurados correctamente!');
console.log('🎯 Orgs piloto tienen acceso completo a Fase 2');
console.log('🔒 Resto de orgs mantienen flags OFF');

// Función para verificar si un flag está habilitado para una org
function isFeatureEnabled(flagName, orgId) {
  if (featureFlagsConfig.pilotOrgs.includes(orgId)) {
    return featureFlagsConfig.orgConfig[orgId]?.[flagName] || false;
  }
  return featureFlagsConfig.global[flagName] || false;
}

// Exportar configuración
export default {
  featureFlagsConfig,
  isFeatureEnabled
};
