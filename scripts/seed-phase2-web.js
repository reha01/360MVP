/**
 * Script de seeding usando Firebase Web SDK
 * No requiere credenciales de admin
 * 
 * IMPORTANTE: Ejecutar con un usuario que tenga permisos de admin en la org
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

// Configuración de Firebase (Staging)
const firebaseConfig = {
  apiKey: "AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ",
  authDomain: "mvp-staging-3e1cd.firebaseapp.com",
  projectId: "mvp-staging-3e1cd",
  storageBucket: "mvp-staging-3e1cd.firebasestorage.app",
  messagingSenderId: "537831427065",
  appId: "1:537831427065:web:3f10f1e837ecb83976cb28"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ORG_ID = 'pilot-org-santiago';

console.log('🌱 SEED FASE 2 - WEB SDK');
console.log('========================\n');

// Datos de prueba
const testDefinition = {
  title: 'Evaluación de Liderazgo 360° v2',
  description: 'Evaluación completa - Datos de prueba',
  version: 2,
  status: 'published',
  testType: '360',
  orgId: ORG_ID,
  createdBy: 'seed-script',
  createdAt: serverTimestamp(),
  categories: [
    {
      id: 'cat-1',
      name: 'Liderazgo',
      weight: 0.4,
      questions: [
        { id: 'q1', text: '¿Comunica la visión claramente?', type: 'likert-5', weight: 1 },
        { id: 'q2', text: '¿Toma decisiones efectivas?', type: 'likert-5', weight: 1 },
        { id: 'q3', text: '¿Inspira al equipo?', type: 'likert-5', weight: 1 }
      ]
    },
    {
      id: 'cat-2', 
      name: 'Colaboración',
      weight: 0.3,
      questions: [
        { id: 'q4', text: '¿Trabaja bien en equipo?', type: 'likert-5', weight: 1 },
        { id: 'q5', text: '¿Comparte conocimiento?', type: 'likert-5', weight: 1 }
      ]
    },
    {
      id: 'cat-3',
      name: 'Resultados',
      weight: 0.3,
      questions: [
        { id: 'q6', text: '¿Cumple objetivos?', type: 'likert-5', weight: 1 },
        { id: 'q7', text: '¿Gestiona recursos eficientemente?', type: 'likert-5', weight: 1 }
      ]
    }
  ]
};

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  const testId = 'test-360-v2-' + Date.now();
  const testRef = doc(db, `organizations/${ORG_ID}/testDefinitions`, testId);
  
  await setDoc(testRef, testDefinition);
  console.log('   ✅ Test creado:', testId);
  return testId;
}

async function createCampaigns(testId) {
  console.log('\n🎯 Creando Campañas...');
  
  const campaigns = [
    {
      name: 'Evaluación Q4 2024',
      description: 'Evaluación trimestral',
      status: 'active',
      testId: testId,
      testVersion: 2,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-12-31'),
      timezone: 'America/Santiago',
      orgId: ORG_ID,
      createdBy: 'seed-script',
      createdAt: serverTimestamp(),
      privacySettings: {
        minResponsesForAnonymity: 3,
        showIndividualResponses: false
      }
    },
    {
      name: 'Evaluación Anual 2024',
      description: 'Evaluación completa anual',
      status: 'active',
      testId: testId,
      testVersion: 2,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      timezone: 'America/Santiago',
      orgId: ORG_ID,
      createdBy: 'seed-script',
      createdAt: serverTimestamp(),
      privacySettings: {
        minResponsesForAnonymity: 3,
        showIndividualResponses: false
      }
    }
  ];
  
  const campaignIds = [];
  
  for (const campaign of campaigns) {
    const campaignId = 'campaign-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const campaignRef = doc(db, `organizations/${ORG_ID}/campaigns`, campaignId);
    
    await setDoc(campaignRef, campaign);
    console.log('   ✅ Campaña creada:', campaign.name);
    campaignIds.push(campaignId);
    
    // Pequeña pausa para evitar IDs duplicados
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return campaignIds;
}

async function createSessions(campaignIds) {
  console.log('\n👥 Creando Sesiones 360...');
  
  const evaluatees = [
    { id: 'eval-001', name: 'María González', email: 'maria@example.com' },
    { id: 'eval-002', name: 'Carlos Rodríguez', email: 'carlos@example.com' },
    { id: 'eval-003', name: 'Ana Martínez', email: 'ana@example.com' },
    { id: 'eval-004', name: 'Luis Fernández', email: 'luis@example.com' },
    { id: 'eval-005', name: 'Patricia López', email: 'patricia@example.com' }
  ];
  
  let sessionCount = 0;
  const sessionIds = [];
  
  for (const campaignId of campaignIds) {
    for (const evaluatee of evaluatees.slice(0, 3)) { // 3 por campaña
      const sessionId = `session-${Date.now()}-${evaluatee.id}`;
      const sessionRef = doc(db, `organizations/${ORG_ID}/evaluation360Sessions`, sessionId);
      
      await setDoc(sessionRef, {
        campaignId: campaignId,
        testId: 'test-360-v2',
        testVersion: 2,
        evaluateeId: evaluatee.id,
        evaluateeName: evaluatee.name,
        evaluateeEmail: evaluatee.email,
        status: 'in_progress',
        progress: Math.random(),
        startedAt: serverTimestamp(),
        deadline: new Date('2024-12-31'),
        orgId: ORG_ID,
        createdAt: serverTimestamp()
      });
      
      sessionIds.push(sessionId);
      sessionCount++;
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`   ✅ ${sessionCount} sesiones creadas`);
  return sessionIds;
}

async function createAssignments(sessionIds) {
  console.log('\n📧 Creando Asignaciones...');
  
  const evaluators = [
    { name: 'Evaluador 1', email: 'eval1@example.com', type: 'peer' },
    { name: 'Evaluador 2', email: 'eval2@example.com', type: 'manager' },
    { name: 'Evaluador 3', email: 'eval3@example.com', type: 'direct' },
    { name: 'Evaluador 4', email: 'eval4@example.com', type: 'self' },
    { name: 'Email Inválido', email: 'invalid@test.local', type: 'peer' }
  ];
  
  let assignmentCount = 0;
  
  for (const sessionId of sessionIds) {
    for (const evaluator of evaluators) {
      const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assignmentRef = doc(db, `organizations/${ORG_ID}/evaluatorAssignments`, assignmentId);
      
      await setDoc(assignmentRef, {
        campaignId: sessionId.split('-')[0],
        session360Id: sessionId,
        evaluatorEmail: evaluator.email,
        evaluatorName: evaluator.name,
        evaluatorType: evaluator.type,
        status: evaluator.email.includes('invalid') ? 'error' : 'pending',
        token: 'token-' + assignmentId,
        tokenHash: 'hash-' + assignmentId,
        tokenUsed: false,
        invitationCount: 1,
        lastInvitedAt: serverTimestamp(),
        deadline: new Date('2024-12-31'),
        orgId: ORG_ID,
        createdAt: serverTimestamp()
      });
      
      assignmentCount++;
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
  
  console.log(`   ✅ ${assignmentCount} asignaciones creadas`);
}

async function createDLQEntries() {
  console.log('\n⚠️  Creando entradas DLQ...');
  
  const dlqEntries = [
    {
      type: 'email_bounce',
      assignmentId: 'assignment-test-1',
      error: 'Email bounced: invalid@test.local',
      retryCount: 3,
      maxRetries: 3,
      status: 'failed',
      createdAt: serverTimestamp()
    },
    {
      type: 'rate_limit',
      campaignId: 'campaign-test',
      error: 'Rate limit exceeded',
      retryCount: 1,
      maxRetries: 3,
      status: 'pending_retry',
      createdAt: serverTimestamp()
    }
  ];
  
  for (const entry of dlqEntries) {
    const dlqId = `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dlqRef = doc(db, `organizations/${ORG_ID}/bulkActionDLQ`, dlqId);
    
    await setDoc(dlqRef, {
      ...entry,
      orgId: ORG_ID
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`   ✅ ${dlqEntries.length} entradas DLQ creadas`);
}

async function main() {
  try {
    // Login primero
    console.log('🔐 Autenticando...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@pilot-santiago.com', 
      'TestPilot2024!'
    );
    console.log('   ✅ Autenticado como:', userCredential.user.email);
    console.log('');
    
    // Crear datos
    const testId = await createTestDefinition();
    const campaignIds = await createCampaigns(testId);
    const sessionIds = await createSessions(campaignIds);
    await createAssignments(sessionIds);
    await createDLQEntries();
    
    console.log('\n=====================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('=====================================\n');
    
    console.log('📊 Resumen:');
    console.log(`   - 1 test definition`);
    console.log(`   - ${campaignIds.length} campañas`);
    console.log(`   - ${sessionIds.length} sesiones 360`);
    console.log(`   - ${sessionIds.length * 5} asignaciones`);
    console.log(`   - Entradas DLQ para testing`);
    
    console.log('\n🎯 Próximo paso: npm run smoke:staging');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
