/**
 * Script para sembrar datos de prueba en Staging
 * 
 * Ejecuta: node tests/fixtures/seed-data.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { pilotOrgs, testCampaigns, testEvaluations, testUsers, testJobFamilies, testTestDefinitions } from './pilot-orgs.js';
import { emailSandboxConfig, dlqSimulation, quotaSimulation } from './email-sandbox.js';

// Configuración de Firebase para Staging
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedPilotOrgs() {
  console.log('🌱 Sembrando organizaciones piloto...');
  
  const batch = writeBatch(db);
  
  // Sembrar organizaciones
  for (const [orgKey, org] of Object.entries(pilotOrgs)) {
    const orgRef = doc(db, 'orgs', org.id);
    batch.set(orgRef, {
      name: org.name,
      timezone: org.timezone,
      hasDST: org.hasDST,
      plan: org.plan,
      features: org.features,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Sembrar miembros
    for (const member of org.members) {
      const memberRef = doc(db, 'orgs', org.id, 'members', member.id);
      batch.set(memberRef, {
        email: member.email,
        role: member.role,
        name: member.name,
        orgId: org.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  await batch.commit();
  console.log('✅ Organizaciones piloto sembradas');
}

async function seedTestDefinitions() {
  console.log('🌱 Sembrando definiciones de test...');
  
  const batch = writeBatch(db);
  
  for (const testDef of testTestDefinitions) {
    const testRef = doc(db, 'testDefinitions', testDef.id);
    batch.set(testRef, {
      ...testDef,
      orgId: 'pilot-org-santiago', // Asignar a org piloto
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Definiciones de test sembradas');
}

async function seedJobFamilies() {
  console.log('🌱 Sembrando familias de trabajo...');
  
  const batch = writeBatch(db);
  
  for (const jobFamily of testJobFamilies) {
    const jobFamilyRef = doc(db, 'orgs', 'pilot-org-santiago', 'jobFamilies', jobFamily.id);
    batch.set(jobFamilyRef, {
      ...jobFamily,
      orgId: 'pilot-org-santiago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Familias de trabajo sembradas');
}

async function seedCampaigns() {
  console.log('🌱 Sembrando campañas...');
  
  const batch = writeBatch(db);
  
  // Sembrar campañas de Santiago
  for (const campaign of testCampaigns.santiago) {
    const campaignRef = doc(db, 'orgs', 'pilot-org-santiago', 'campaigns', campaign.id);
    batch.set(campaignRef, {
      ...campaign,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // Sembrar campañas de México
  for (const campaign of testCampaigns.mexico) {
    const campaignRef = doc(db, 'orgs', 'pilot-org-mexico', 'campaigns', campaign.id);
    batch.set(campaignRef, {
      ...campaign,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Campañas sembradas');
}

async function seedEvaluations() {
  console.log('🌱 Sembrando evaluaciones...');
  
  const batch = writeBatch(db);
  
  // Sembrar evaluaciones normales
  for (const evaluation of testEvaluations.evaluations) {
    const evaluationRef = doc(db, 'orgs', 'pilot-org-santiago', 'evaluation360Responses', evaluation.id);
    batch.set(evaluationRef, {
      ...evaluation,
      orgId: 'pilot-org-santiago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // Sembrar casos borde
  for (const evaluation of testEvaluations.edgeCases) {
    const evaluationRef = doc(db, 'orgs', 'pilot-org-santiago', 'evaluation360Responses', evaluation.id);
    batch.set(evaluationRef, {
      ...evaluation,
      orgId: 'pilot-org-santiago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Evaluaciones sembradas');
}

async function seedEmailEvents() {
  console.log('🌱 Sembrando eventos de email...');
  
  const batch = writeBatch(db);
  
  for (const event of emailSandboxConfig.emailEvents) {
    const eventRef = doc(db, 'orgs', 'pilot-org-santiago', 'emailEvents', event.id);
    batch.set(eventRef, {
      ...event,
      orgId: 'pilot-org-santiago',
      createdAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Eventos de email sembrados');
}

async function seedDLQJobs() {
  console.log('🌱 Sembrando trabajos en DLQ...');
  
  const batch = writeBatch(db);
  
  for (const job of dlqSimulation.failedJobs) {
    const jobRef = doc(db, 'orgs', 'pilot-org-santiago', 'dlqJobs', job.id);
    batch.set(jobRef, {
      ...job,
      orgId: 'pilot-org-santiago',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Trabajos en DLQ sembrados');
}

async function seedQuotaLimits() {
  console.log('🌱 Sembrando límites de cuota...');
  
  const batch = writeBatch(db);
  
  for (const quota of quotaSimulation.exceededQuotas) {
    const quotaRef = doc(db, 'orgs', quota.orgId, 'quotaLimits', quota.quotaType);
    batch.set(quotaRef, {
      ...quota,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  console.log('✅ Límites de cuota sembrados');
}

async function main() {
  try {
    console.log('🚀 Iniciando siembra de datos para UAT...');
    
    await seedPilotOrgs();
    await seedTestDefinitions();
    await seedJobFamilies();
    await seedCampaigns();
    await seedEvaluations();
    await seedEmailEvents();
    await seedDLQJobs();
    await seedQuotaLimits();
    
    console.log('🎉 ¡Siembra de datos completada exitosamente!');
    console.log('');
    console.log('📊 Resumen de datos sembrados:');
    console.log(`- ${Object.keys(pilotOrgs).length} organizaciones piloto`);
    console.log(`- ${testTestDefinitions.length} definiciones de test`);
    console.log(`- ${testJobFamilies.length} familias de trabajo`);
    console.log(`- ${testCampaigns.santiago.length + testCampaigns.mexico.length} campañas`);
    console.log(`- ${testEvaluations.evaluations.length + testEvaluations.edgeCases.length} evaluaciones`);
    console.log(`- ${emailSandboxConfig.emailEvents.length} eventos de email`);
    console.log(`- ${dlqSimulation.failedJobs.length} trabajos en DLQ`);
    console.log(`- ${quotaSimulation.exceededQuotas.length} límites de cuota excedidos`);
    console.log('');
    console.log('✅ Listo para ejecutar UAT en Staging');
    
  } catch (error) {
    console.error('❌ Error durante la siembra de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
