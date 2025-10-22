/**
 * Script REAL para seed de datos en Staging usando Firebase Admin
 * 
 * Crea:
 * - 1 campaña activa
 * - 10+ asignaciones (1 con email inválido)
 * - Sesiones 360
 * - TestDefinitions
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'mvp-staging-3e1cd'
  });
}

const db = admin.firestore();

// Configuración
const ORG_ID = 'pilot-org-santiago';
const CAMPAIGN_COUNT = 1;
const ASSIGNMENTS_PER_CAMPAIGN = 12;

// Helper: Generar token hash
function generateTokenHash() {
  const token = crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  
  const testId = 'test-360-leadership-v1';
  const testRef = db.collection('organizations').doc(ORG_ID).collection('testDefinitions').doc(testId);
  
  const testDoc = await testRef.get();
  if (testDoc.exists) {
    console.log(`   ✅ Test Definition ya existe: ${testId}`);
    return testId;
  }
  
  await testRef.set({
    title: 'Evaluación de Liderazgo 360°',
    description: 'Evaluación completa de competencias de liderazgo',
    version: 1,
    status: 'published',
    testType: '360',
    categories: [
      {
        id: 'cat-1',
        name: 'Liderazgo Estratégico',
        weight: 0.3,
        questions: [
          { id: 'q1', text: '¿Comunica la visión claramente?', type: 'likert-5', weight: 1 },
          { id: 'q2', text: '¿Toma decisiones estratégicas efectivas?', type: 'likert-5', weight: 1 }
        ]
      },
      {
        id: 'cat-2',
        name: 'Gestión de Equipos',
        weight: 0.4,
        questions: [
          { id: 'q3', text: '¿Motiva al equipo efectivamente?', type: 'likert-5', weight: 1 },
          { id: 'q4', text: '¿Delega apropiadamente?', type: 'likert-5', weight: 1 }
        ]
      },
      {
        id: 'cat-3',
        name: 'Comunicación',
        weight: 0.3,
        questions: [
          { id: 'q5', text: '¿Escucha activamente?', type: 'likert-5', weight: 1 },
          { id: 'q6', text: '¿Proporciona feedback constructivo?', type: 'likert-5', weight: 1 }
        ]
      }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system',
    orgId: ORG_ID
  });
  
  console.log(`   ✅ Test Definition creado: ${testId}`);
  return testId;
}

async function createCampaign(testId) {
  console.log('\n📋 Creando campaña...');
  
  const campaignId = `campaign-smoke-test-${Date.now()}`;
  const campaignRef = db.collection('organizations').doc(ORG_ID).collection('campaigns').doc(campaignId);
  
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 días
  
  await campaignRef.set({
    name: 'Smoke Test Campaign',
    description: 'Campaña de prueba para smoke tests',
    status: 'active',
    testId: testId,
    testVersion: 1,
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    timezone: 'America/Santiago',
    privacySettings: {
      minResponsesForAnonymity: 3,
      showIndividualResponses: false
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system',
    orgId: ORG_ID
  });
  
  console.log(`   ✅ Campaña creada: ${campaignId}`);
  return campaignId;
}

async function createSessions(campaignId, testId) {
  console.log('\n👥 Creando sesiones 360...');
  
  const sessionIds = [];
  
  // Crear 3 sesiones (evaluados)
  for (let i = 1; i <= 3; i++) {
    const sessionId = `session-${campaignId}-evaluatee-${i}`;
    const sessionRef = db.collection('organizations').doc(ORG_ID).collection('evaluation360Sessions').doc(sessionId);
    
    await sessionRef.set({
      campaignId,
      testId,
      testVersion: 1,
      evaluateeId: `user-evaluatee-${i}`,
      evaluateeName: `Evaluado ${i}`,
      evaluateeEmail: `evaluatee${i}@pilot-santiago.com`,
      status: 'in_progress',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      orgId: ORG_ID
    });
    
    sessionIds.push(sessionId);
    console.log(`   ✅ Sesión creada: ${sessionId}`);
  }
  
  return sessionIds;
}

async function createAssignments(campaignId, sessionIds) {
  console.log('\n📧 Creando asignaciones...');
  
  let assignmentCount = 0;
  const evaluatorTypes = ['self', 'manager', 'peer', 'peer', 'direct'];
  
  for (const sessionId of sessionIds) {
    // Crear 4 asignaciones por sesión
    for (let j = 0; j < 4; j++) {
      assignmentCount++;
      const assignmentId = `assignment-${sessionId}-${j}`;
      const assignmentRef = db.collection('organizations').doc(ORG_ID).collection('evaluatorAssignments').doc(assignmentId);
      
      // Crear 1 email inválido cada 10 asignaciones
      const isInvalid = assignmentCount % 10 === 0;
      const evaluatorEmail = isInvalid 
        ? 'invalid@test.local' 
        : `evaluator${assignmentCount}@pilot-santiago.com`;
      
      // Estados variados
      const statuses = ['pending', 'pending', 'pending', 'completed'];
      const status = statuses[j % statuses.length];
      
      await assignmentRef.set({
        campaignId,
        session360Id: sessionId,
        evaluatorEmail,
        evaluatorType: evaluatorTypes[j % evaluatorTypes.length],
        evaluatorName: `Evaluador ${assignmentCount}`,
        status,
        token: crypto.randomBytes(16).toString('hex'),
        tokenHash: generateTokenHash(),
        tokenUsed: status === 'completed',
        tokenExpiry: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        deadline: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
        invitationCount: 1,
        lastInvitationSent: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        orgId: ORG_ID
      });
      
      const emoji = isInvalid ? '⚠️ (inválido)' : '';
      console.log(`   ${assignmentCount}. ${evaluatorEmail} ${emoji} [${status}]`);
    }
  }
  
  console.log(`\n   ✅ ${assignmentCount} asignaciones creadas`);
  return assignmentCount;
}

async function main() {
  console.log('🌱 SEEDING STAGING DATA (REAL)\n');
  console.log('================================\n');
  console.log(`Organización: ${ORG_ID}`);
  console.log(`Staging: https://mvp-staging-3e1cd.web.app\n`);
  
  try {
    // 1. Crear Test Definition
    const testId = await createTestDefinition();
    
    // 2. Crear Campaña
    const campaignId = await createCampaign(testId);
    
    // 3. Crear Sesiones 360
    const sessionIds = await createSessions(campaignId, testId);
    
    // 4. Crear Asignaciones
    const assignmentCount = await createAssignments(campaignId, sessionIds);
    
    console.log('\n✨ SEEDING COMPLETADO\n');
    console.log('================================');
    console.log(`Test Definition: ${testId}`);
    console.log(`Campaña: ${campaignId}`);
    console.log(`Sesiones: ${sessionIds.length}`);
    console.log(`Asignaciones: ${assignmentCount}`);
    console.log('\n▶️ Próximo paso:');
    console.log('   npm run test:auth:capture');
    console.log('   npm run smoke:staging');
    
  } catch (error) {
    console.error('\n❌ Error durante seeding:', error);
    process.exit(1);
  }
}

main();




