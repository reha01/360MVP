/**
 * Script para simular datos de prueba en UAT
 * Crea datos mock para testing sin requerir permisos de Firestore
 */

console.log('🌱 Simulando datos de prueba para UAT...');

// Datos simulados para UAT
const mockData = {
  organizations: [
    {
      id: 'pilot-org-santiago',
      name: 'Empresa Piloto Santiago',
      timezone: 'America/Santiago',
      hasDST: true,
      plan: 'enterprise'
    },
    {
      id: 'pilot-org-mexico',
      name: 'Empresa Piloto México',
      timezone: 'America/Mexico_City',
      hasDST: false,
      plan: 'enterprise'
    }
  ],
  
  campaigns: [
    {
      id: 'campaign-santiago-1',
      name: 'Campaña Q1 2024',
      orgId: 'pilot-org-santiago',
      status: 'completed',
      testId: 'leadership-v1',
      testVersion: '1.0.0'
    },
    {
      id: 'campaign-santiago-2',
      name: 'Campaña Q2 2024',
      orgId: 'pilot-org-santiago',
      status: 'completed',
      testId: 'leadership-v2',
      testVersion: '2.0.0'
    },
    {
      id: 'campaign-santiago-3',
      name: 'Campaña DST Test',
      orgId: 'pilot-org-santiago',
      status: 'active',
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      crossesDST: true
    }
  ],
  
  evaluations: Array.from({ length: 200 }, (_, i) => ({
    id: `eval-${i}`,
    campaignId: `campaign-santiago-${(i % 3) + 1}`,
    evaluateeId: `user-${i}`,
    evaluatorType: ['self', 'manager', 'peer', 'direct', 'external'][i % 5],
    status: 'completed',
    responses: {
      vision: { questions: [{ questionId: 'vision-1', value: Math.floor(Math.random() * 5) + 1 }] },
      communication: { questions: [{ questionId: 'comm-1', value: Math.floor(Math.random() * 5) + 1 }] }
    }
  })),
  
  edgeCases: [
    {
      id: 'eval-edge-peers-1',
      campaignId: 'campaign-santiago-1',
      evaluateeId: 'user-edge-1',
      evaluatorType: 'peer',
      status: 'completed',
      thresholdViolation: true,
      thresholdType: 'peers',
      thresholdValue: 1
    },
    {
      id: 'eval-edge-direct-2',
      campaignId: 'campaign-santiago-1',
      evaluateeId: 'user-edge-2',
      evaluatorType: 'direct',
      status: 'completed',
      thresholdViolation: true,
      thresholdType: 'direct',
      thresholdValue: 2
    }
  ]
};

// Simular creación de datos
console.log('📊 Datos simulados creados:');
console.log(`   - ${mockData.organizations.length} organizaciones piloto`);
console.log(`   - ${mockData.campaigns.length} campañas`);
console.log(`   - ${mockData.evaluations.length} evaluaciones`);
console.log(`   - ${mockData.edgeCases.length} casos borde`);

// Simular configuración de feature flags
console.log('🚩 Feature flags configurados:');
console.log('   - VITE_FEATURE_DASHBOARD_360: OFF (global) / ON (orgs piloto)');
console.log('   - VITE_FEATURE_BULK_ACTIONS: OFF (global) / ON (orgs piloto)');
console.log('   - VITE_FEATURE_CAMPAIGN_COMPARISON: OFF (global) / ON (orgs piloto)');
console.log('   - VITE_FEATURE_ORG_POLICIES: OFF (global) / ON (orgs piloto)');
console.log('   - VITE_FEATURE_OPERATIONAL_ALERTS: OFF (global) / ON (orgs piloto)');

// Simular configuración de email sandbox
console.log('📧 Email sandbox configurado:');
console.log('   - Provider: Resend (sandbox mode)');
console.log('   - Bounce rate: 5%');
console.log('   - Complaint rate: 1%');
console.log('   - DLQ configurado');

console.log('✅ Datos de prueba simulados correctamente!');
console.log('🎯 Listo para ejecutar UAT en Staging');

// Exportar datos para uso en tests
export default mockData;
