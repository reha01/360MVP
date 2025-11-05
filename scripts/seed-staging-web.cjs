/**
 * Script para seed en Staging usando Web SDK (sin admin)
 * Compatible con autenticación regular de Firebase CLI
 * 
 * Uso:
 *   firebase use staging
 *   node scripts/seed-staging-web.cjs
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const crypto = require('crypto');

// Configuración de Firebase Staging
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

// Configuración
const ORG_ID = 'pilot-org-santiago';
const CAMPAIGN_COUNT = 1;
const ASSIGNMENTS_PER_CAMPAIGN = 12;

// Helper: Generar token hash
function generateTokenHash() {
  const token = crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper: Generar ID único
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  
  const testId = generateId('test');
  const testRef = doc(db, 'organizations', ORG_ID, 'testDefinitions', testId);
  
  await setDoc(testRef, {
    orgId: ORG_ID,
    name: 'Evaluación 360° - Liderazgo',
    description: 'Evaluación de competencias de liderazgo',
    type: '360',
    status: 'active',
    categories: [
      { id: 'cat-1', name: 'Liderazgo Estratégico', weight: 0.3 },
      { id: 'cat-2', name: 'Comunicación', weight: 0.25 },
      { id: 'cat-3', name: 'Trabajo en Equipo', weight: 0.25 },
      { id: 'cat-4', name: 'Resultados', weight: 0.2 }
    ],
    questions: generateQuestions(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log(`   ✓ Test Definition creado: ${testId}`);
  return testId;
}

function generateQuestions() {
  const questions = [];
  const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  categories.forEach((catId, idx) => {
    for (let i = 1; i <= 5; i++) {
      questions.push({
        id: `q-${catId}-${i}`,
        categoryId: catId,
        text: `Pregunta ${i} de categoría ${idx + 1}`,
        type: 'likert',
        required: true,
        order: (idx * 5) + i
      });
    }
  });
  
  return questions;
}

async function createCampaign(testId) {
  console.log('📋 Creando Campaña...');
  
  const campaignId = generateId('campaign');
  const campaignRef = doc(db, 'organizations', ORG_ID, 'campaigns', campaignId);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  await setDoc(campaignRef, {
    orgId: ORG_ID,
    name: 'Q1 2025 - Evaluación de Liderazgo',
    description: 'Primera campaña de evaluación 360° del año',
    testDefinitionId: testId,
    status: 'active',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@pilot-santiago.com',
    stats: {
      totalSessions: 0,
      completedSessions: 0,
      pendingInvitations: 0
    }
  });
  
  console.log(`   ✓ Campaña creada: ${campaignId}`);
  return campaignId;
}

async function createSessions(campaignId, testId) {
  console.log('👥 Creando Sesiones 360...');
  
  const subjects = [
    { name: 'Juan Pérez', email: 'juan.perez@pilot-santiago.com', area: 'Ventas' },
    { name: 'María González', email: 'maria.gonzalez@pilot-santiago.com', area: 'Marketing' },
    { name: 'Carlos López', email: 'carlos.lopez@pilot-santiago.com', area: 'TI' }
  ];
  
  const sessionIds = [];
  
  for (const subject of subjects) {
    const sessionId = generateId('session360');
    const sessionRef = doc(db, 'organizations', ORG_ID, 'evaluation360Sessions', sessionId);
    
    await setDoc(sessionRef, {
      orgId: ORG_ID,
      campaignId,
      testDefinitionId: testId,
      subjectName: subject.name,
      subjectEmail: subject.email,
      subjectArea: subject.area,
      status: 'active',
      progress: {
        totalInvitations: 0,
        completedResponses: 0,
        pendingResponses: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    sessionIds.push(sessionId);
    console.log(`   ✓ Sesión creada: ${subject.name}`);
  }
  
  return sessionIds;
}

async function createAssignments(campaignId, sessionIds) {
  console.log('📨 Creando Asignaciones...');
  
  const evaluatorTypes = ['peer', 'manager', 'direct', 'self'];
  let assignmentCount = 0;
  
  for (const sessionId of sessionIds) {
    for (let i = 0; i < ASSIGNMENTS_PER_CAMPAIGN; i++) {
      const assignmentId = generateId('assignment');
      const assignmentRef = doc(db, 'organizations', ORG_ID, 'evaluatorAssignments', assignmentId);
      
      // Crear 1 email inválido por sesión para testing
      const isInvalid = i === ASSIGNMENTS_PER_CAMPAIGN - 1;
      const evaluatorEmail = isInvalid 
        ? 'invalid@test.local'
        : `evaluator${i + 1}@pilot-santiago.com`;
      
      const evaluatorType = evaluatorTypes[i % evaluatorTypes.length];
      
      await setDoc(assignmentRef, {
        orgId: ORG_ID,
        campaignId,
        session360Id: sessionId,
        evaluatorEmail,
        evaluatorType,
        status: 'pending',
        tokenHash: generateTokenHash(),
        invitationSentAt: null,
        completedAt: null,
        createdAt: new Date().toISOString()
      });
      
      assignmentCount++;
    }
  }
  
  console.log(`   ✓ ${assignmentCount} asignaciones creadas`);
  return assignmentCount;
}

async function main() {
  console.log('🌱 SEEDING STAGING DATA (Web SDK)\n');
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
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error durante seeding:', error);
    process.exit(1);
  }
}

main();







 * Script para seed en Staging usando Web SDK (sin admin)
 * Compatible con autenticación regular de Firebase CLI
 * 
 * Uso:
 *   firebase use staging
 *   node scripts/seed-staging-web.cjs
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const crypto = require('crypto');

// Configuración de Firebase Staging
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

// Configuración
const ORG_ID = 'pilot-org-santiago';
const CAMPAIGN_COUNT = 1;
const ASSIGNMENTS_PER_CAMPAIGN = 12;

// Helper: Generar token hash
function generateTokenHash() {
  const token = crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper: Generar ID único
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  
  const testId = generateId('test');
  const testRef = doc(db, 'organizations', ORG_ID, 'testDefinitions', testId);
  
  await setDoc(testRef, {
    orgId: ORG_ID,
    name: 'Evaluación 360° - Liderazgo',
    description: 'Evaluación de competencias de liderazgo',
    type: '360',
    status: 'active',
    categories: [
      { id: 'cat-1', name: 'Liderazgo Estratégico', weight: 0.3 },
      { id: 'cat-2', name: 'Comunicación', weight: 0.25 },
      { id: 'cat-3', name: 'Trabajo en Equipo', weight: 0.25 },
      { id: 'cat-4', name: 'Resultados', weight: 0.2 }
    ],
    questions: generateQuestions(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log(`   ✓ Test Definition creado: ${testId}`);
  return testId;
}

function generateQuestions() {
  const questions = [];
  const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  categories.forEach((catId, idx) => {
    for (let i = 1; i <= 5; i++) {
      questions.push({
        id: `q-${catId}-${i}`,
        categoryId: catId,
        text: `Pregunta ${i} de categoría ${idx + 1}`,
        type: 'likert',
        required: true,
        order: (idx * 5) + i
      });
    }
  });
  
  return questions;
}

async function createCampaign(testId) {
  console.log('📋 Creando Campaña...');
  
  const campaignId = generateId('campaign');
  const campaignRef = doc(db, 'organizations', ORG_ID, 'campaigns', campaignId);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  await setDoc(campaignRef, {
    orgId: ORG_ID,
    name: 'Q1 2025 - Evaluación de Liderazgo',
    description: 'Primera campaña de evaluación 360° del año',
    testDefinitionId: testId,
    status: 'active',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@pilot-santiago.com',
    stats: {
      totalSessions: 0,
      completedSessions: 0,
      pendingInvitations: 0
    }
  });
  
  console.log(`   ✓ Campaña creada: ${campaignId}`);
  return campaignId;
}

async function createSessions(campaignId, testId) {
  console.log('👥 Creando Sesiones 360...');
  
  const subjects = [
    { name: 'Juan Pérez', email: 'juan.perez@pilot-santiago.com', area: 'Ventas' },
    { name: 'María González', email: 'maria.gonzalez@pilot-santiago.com', area: 'Marketing' },
    { name: 'Carlos López', email: 'carlos.lopez@pilot-santiago.com', area: 'TI' }
  ];
  
  const sessionIds = [];
  
  for (const subject of subjects) {
    const sessionId = generateId('session360');
    const sessionRef = doc(db, 'organizations', ORG_ID, 'evaluation360Sessions', sessionId);
    
    await setDoc(sessionRef, {
      orgId: ORG_ID,
      campaignId,
      testDefinitionId: testId,
      subjectName: subject.name,
      subjectEmail: subject.email,
      subjectArea: subject.area,
      status: 'active',
      progress: {
        totalInvitations: 0,
        completedResponses: 0,
        pendingResponses: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    sessionIds.push(sessionId);
    console.log(`   ✓ Sesión creada: ${subject.name}`);
  }
  
  return sessionIds;
}

async function createAssignments(campaignId, sessionIds) {
  console.log('📨 Creando Asignaciones...');
  
  const evaluatorTypes = ['peer', 'manager', 'direct', 'self'];
  let assignmentCount = 0;
  
  for (const sessionId of sessionIds) {
    for (let i = 0; i < ASSIGNMENTS_PER_CAMPAIGN; i++) {
      const assignmentId = generateId('assignment');
      const assignmentRef = doc(db, 'organizations', ORG_ID, 'evaluatorAssignments', assignmentId);
      
      // Crear 1 email inválido por sesión para testing
      const isInvalid = i === ASSIGNMENTS_PER_CAMPAIGN - 1;
      const evaluatorEmail = isInvalid 
        ? 'invalid@test.local'
        : `evaluator${i + 1}@pilot-santiago.com`;
      
      const evaluatorType = evaluatorTypes[i % evaluatorTypes.length];
      
      await setDoc(assignmentRef, {
        orgId: ORG_ID,
        campaignId,
        session360Id: sessionId,
        evaluatorEmail,
        evaluatorType,
        status: 'pending',
        tokenHash: generateTokenHash(),
        invitationSentAt: null,
        completedAt: null,
        createdAt: new Date().toISOString()
      });
      
      assignmentCount++;
    }
  }
  
  console.log(`   ✓ ${assignmentCount} asignaciones creadas`);
  return assignmentCount;
}

async function main() {
  console.log('🌱 SEEDING STAGING DATA (Web SDK)\n');
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
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error durante seeding:', error);
    process.exit(1);
  }
}

main();







 * Script para seed en Staging usando Web SDK (sin admin)
 * Compatible con autenticación regular de Firebase CLI
 * 
 * Uso:
 *   firebase use staging
 *   node scripts/seed-staging-web.cjs
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const crypto = require('crypto');

// Configuración de Firebase Staging
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

// Configuración
const ORG_ID = 'pilot-org-santiago';
const CAMPAIGN_COUNT = 1;
const ASSIGNMENTS_PER_CAMPAIGN = 12;

// Helper: Generar token hash
function generateTokenHash() {
  const token = crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper: Generar ID único
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  
  const testId = generateId('test');
  const testRef = doc(db, 'organizations', ORG_ID, 'testDefinitions', testId);
  
  await setDoc(testRef, {
    orgId: ORG_ID,
    name: 'Evaluación 360° - Liderazgo',
    description: 'Evaluación de competencias de liderazgo',
    type: '360',
    status: 'active',
    categories: [
      { id: 'cat-1', name: 'Liderazgo Estratégico', weight: 0.3 },
      { id: 'cat-2', name: 'Comunicación', weight: 0.25 },
      { id: 'cat-3', name: 'Trabajo en Equipo', weight: 0.25 },
      { id: 'cat-4', name: 'Resultados', weight: 0.2 }
    ],
    questions: generateQuestions(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log(`   ✓ Test Definition creado: ${testId}`);
  return testId;
}

function generateQuestions() {
  const questions = [];
  const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  categories.forEach((catId, idx) => {
    for (let i = 1; i <= 5; i++) {
      questions.push({
        id: `q-${catId}-${i}`,
        categoryId: catId,
        text: `Pregunta ${i} de categoría ${idx + 1}`,
        type: 'likert',
        required: true,
        order: (idx * 5) + i
      });
    }
  });
  
  return questions;
}

async function createCampaign(testId) {
  console.log('📋 Creando Campaña...');
  
  const campaignId = generateId('campaign');
  const campaignRef = doc(db, 'organizations', ORG_ID, 'campaigns', campaignId);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  await setDoc(campaignRef, {
    orgId: ORG_ID,
    name: 'Q1 2025 - Evaluación de Liderazgo',
    description: 'Primera campaña de evaluación 360° del año',
    testDefinitionId: testId,
    status: 'active',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@pilot-santiago.com',
    stats: {
      totalSessions: 0,
      completedSessions: 0,
      pendingInvitations: 0
    }
  });
  
  console.log(`   ✓ Campaña creada: ${campaignId}`);
  return campaignId;
}

async function createSessions(campaignId, testId) {
  console.log('👥 Creando Sesiones 360...');
  
  const subjects = [
    { name: 'Juan Pérez', email: 'juan.perez@pilot-santiago.com', area: 'Ventas' },
    { name: 'María González', email: 'maria.gonzalez@pilot-santiago.com', area: 'Marketing' },
    { name: 'Carlos López', email: 'carlos.lopez@pilot-santiago.com', area: 'TI' }
  ];
  
  const sessionIds = [];
  
  for (const subject of subjects) {
    const sessionId = generateId('session360');
    const sessionRef = doc(db, 'organizations', ORG_ID, 'evaluation360Sessions', sessionId);
    
    await setDoc(sessionRef, {
      orgId: ORG_ID,
      campaignId,
      testDefinitionId: testId,
      subjectName: subject.name,
      subjectEmail: subject.email,
      subjectArea: subject.area,
      status: 'active',
      progress: {
        totalInvitations: 0,
        completedResponses: 0,
        pendingResponses: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    sessionIds.push(sessionId);
    console.log(`   ✓ Sesión creada: ${subject.name}`);
  }
  
  return sessionIds;
}

async function createAssignments(campaignId, sessionIds) {
  console.log('📨 Creando Asignaciones...');
  
  const evaluatorTypes = ['peer', 'manager', 'direct', 'self'];
  let assignmentCount = 0;
  
  for (const sessionId of sessionIds) {
    for (let i = 0; i < ASSIGNMENTS_PER_CAMPAIGN; i++) {
      const assignmentId = generateId('assignment');
      const assignmentRef = doc(db, 'organizations', ORG_ID, 'evaluatorAssignments', assignmentId);
      
      // Crear 1 email inválido por sesión para testing
      const isInvalid = i === ASSIGNMENTS_PER_CAMPAIGN - 1;
      const evaluatorEmail = isInvalid 
        ? 'invalid@test.local'
        : `evaluator${i + 1}@pilot-santiago.com`;
      
      const evaluatorType = evaluatorTypes[i % evaluatorTypes.length];
      
      await setDoc(assignmentRef, {
        orgId: ORG_ID,
        campaignId,
        session360Id: sessionId,
        evaluatorEmail,
        evaluatorType,
        status: 'pending',
        tokenHash: generateTokenHash(),
        invitationSentAt: null,
        completedAt: null,
        createdAt: new Date().toISOString()
      });
      
      assignmentCount++;
    }
  }
  
  console.log(`   ✓ ${assignmentCount} asignaciones creadas`);
  return assignmentCount;
}

async function main() {
  console.log('🌱 SEEDING STAGING DATA (Web SDK)\n');
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
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error durante seeding:', error);
    process.exit(1);
  }
}

main();







