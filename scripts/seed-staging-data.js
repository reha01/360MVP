/**
 * Script para crear datos de prueba en Staging
 * 
 * Crea:
 * - 2 organizaciones piloto (santiago, mexico)
 * - Usuarios admin en cada org
 * - Campañas activas
 * - Asignaciones de evaluación
 * - Email inválido para probar DLQ
 */

console.log('🌱 SEEDING STAGING DATA');
console.log('================================\n');

// Datos a crear
const ORGS = [
  {
    id: 'pilot-org-santiago',
    name: 'Pilot Org Santiago',
    timezone: 'America/Santiago',
    plan: 'starter',
    admin: {
      email: 'admin@pilot-santiago.com',
      name: 'Admin Santiago',
      password: 'TestPilot2024!'
    }
  },
  {
    id: 'pilot-org-mexico',
    name: 'Pilot Org Mexico',
    timezone: 'America/Mexico_City',
    plan: 'starter',
    admin: {
      email: 'admin@pilot-mexico.com',
      name: 'Admin Mexico',
      password: 'TestPilot2024!'
    }
  }
];

const CAMPAIGNS_PER_ORG = 2;
const ASSIGNMENTS_PER_CAMPAIGN = 10;

console.log('📋 PLAN DE SEEDING');
console.log('================================');
console.log(`Organizaciones: ${ORGS.length}`);
console.log(`Campañas por org: ${CAMPAIGNS_PER_ORG}`);
console.log(`Asignaciones por campaña: ${ASSIGNMENTS_PER_CAMPAIGN}`);
console.log(`Total asignaciones: ${ORGS.length * CAMPAIGNS_PER_ORG * ASSIGNMENTS_PER_CAMPAIGN}`);
console.log('');

// Simular creación (en producción, conectar a Firebase Admin SDK)
async function seedOrganizations() {
  console.log('🏢 Creando organizaciones...');
  
  for (const org of ORGS) {
    console.log(`   → ${org.name} (${org.id})`);
    console.log(`      Timezone: ${org.timezone}`);
    console.log(`      Plan: ${org.plan}`);
    console.log(`      Admin: ${org.admin.email}`);
    
    // En producción:
    // await admin.firestore().collection('organizations').doc(org.id).set({
    //   name: org.name,
    //   timezone: org.timezone,
    //   plan: org.plan,
    //   createdAt: admin.firestore.FieldValue.serverTimestamp()
    // });
    
    // await admin.auth().createUser({
    //   email: org.admin.email,
    //   password: org.admin.password,
    //   displayName: org.admin.name
    // });
  }
  
  console.log('   ✅ Organizaciones creadas\n');
}

async function seedCampaigns() {
  console.log('📋 Creando campañas...');
  
  for (const org of ORGS) {
    for (let i = 1; i <= CAMPAIGNS_PER_ORG; i++) {
      const campaignId = `campaign-${org.id}-${i}`;
      const campaignName = `Evaluación Q${i} 2024 - ${org.name}`;
      
      console.log(`   → ${campaignName}`);
      console.log(`      ID: ${campaignId}`);
      console.log(`      Org: ${org.id}`);
      console.log(`      Status: active`);
      
      // En producción:
      // await admin.firestore()
      //   .collection('orgs').doc(org.id)
      //   .collection('campaigns').doc(campaignId)
      //   .set({
      //     name: campaignName,
      //     status: 'active',
      //     startDate: new Date(),
      //     endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      //     createdAt: admin.firestore.FieldValue.serverTimestamp()
      //   });
    }
  }
  
  console.log('   ✅ Campañas creadas\n');
}

async function seedAssignments() {
  console.log('👥 Creando asignaciones...');
  
  for (const org of ORGS) {
    for (let c = 1; c <= CAMPAIGNS_PER_ORG; c++) {
      const campaignId = `campaign-${org.id}-${c}`;
      
      console.log(`   → Campaña: ${campaignId}`);
      
      for (let a = 1; a <= ASSIGNMENTS_PER_CAMPAIGN; a++) {
        const assignmentId = `assignment-${campaignId}-${a}`;
        
        // Crear 1 email inválido por campaña para probar DLQ
        const isInvalid = a === ASSIGNMENTS_PER_CAMPAIGN;
        const email = isInvalid 
          ? 'invalid@test.local' 
          : `evaluator${a}@${org.id}.com`;
        
        console.log(`      ${a}. ${email}${isInvalid ? ' ⚠️ (inválido)' : ''}`);
        
        // En producción:
        // await admin.firestore()
        //   .collection('orgs').doc(org.id)
        //   .collection('evaluatorAssignments').doc(assignmentId)
        //   .set({
        //     campaignId,
        //     evaluatorEmail: email,
        //     evaluatorType: 'peer',
        //     status: 'pending',
        //     tokenHash: generateTokenHash(),
        //     createdAt: admin.firestore.FieldValue.serverTimestamp()
        //   });
      }
    }
  }
  
  console.log('   ✅ Asignaciones creadas\n');
}

async function main() {
  try {
    await seedOrganizations();
    await seedCampaigns();
    await seedAssignments();
    
    console.log('\n✨ SEEDING COMPLETADO');
    console.log('================================');
    console.log('');
    console.log('📝 CREDENCIALES PARA SMOKE TESTS:');
    console.log('');
    
    for (const org of ORGS) {
      console.log(`${org.name}:`);
      console.log(`  Email: ${org.admin.email}`);
      console.log(`  Password: ${org.admin.password}`);
      console.log(`  Org ID: ${org.id}`);
      console.log('');
    }
    
    console.log('🔐 IMPORTANTE:');
    console.log('1. Guarda estas credenciales en 1Password o similar');
    console.log('2. Actualiza las variables de entorno en los tests');
    console.log('3. O usa: npm run test:auth:capture');
    console.log('');
    console.log('▶️ Ejecutar smoke tests:');
    console.log('   PILOT_SANTIAGO_EMAIL=admin@pilot-santiago.com \\');
    console.log('   PILOT_SANTIAGO_PASSWORD=TestPilot2024! \\');
    console.log('   npm run smoke:staging');
    
  } catch (error) {
    console.error('❌ Error durante seeding:', error);
    process.exit(1);
  }
}

// Verificar que estamos en Staging
const isStaging = process.env.NODE_ENV === 'staging' || 
                  process.env.FIREBASE_PROJECT === 'mvp-staging-3e1cd';

if (!isStaging) {
  console.log('⚠️  ADVERTENCIA: Este script debe ejecutarse contra Staging');
  console.log('');
  console.log('Para ejecutar:');
  console.log('  NODE_ENV=staging node scripts/seed-staging-data.js');
  console.log('');
  console.log('O configurar Firebase:');
  console.log('  firebase use staging');
  console.log('  node scripts/seed-staging-data.js');
  console.log('');
  process.exit(1);
}

main();




