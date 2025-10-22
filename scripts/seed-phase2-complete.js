#!/usr/bin/env node

/**
 * Script completo para sembrar datos de prueba de Fase 2
 * 
 * Crea:
 * - 3 campañas activas con diferentes estados
 * - 50+ asignaciones con variedad de estados
 * - 10+ sesiones 360
 * - Métricas y agregaciones
 * - Eventos de auditoría
 * - Alertas DLQ simuladas
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

// Configuración
const PROJECT_ID = 'mvp-staging-3e1cd';
const ORG_ID = 'pilot-org-santiago';

console.log('🌱 SEED COMPLETO FASE 2 - STAGING');
console.log('=====================================\n');

// Inicializar Firebase Admin
let app;
try {
  // Intentar con credenciales por defecto
  app = initializeApp({
    projectId: PROJECT_ID
  });
  console.log('✅ Firebase Admin inicializado\n');
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin');
  console.error('   Asegúrate de tener las credenciales configuradas');
  process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

// Helpers
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Datos base
const evaluatorTypes = ['self', 'manager', 'peer', 'direct', 'other'];
const campaignStatuses = ['active', 'paused', 'completed', 'draft'];
const assignmentStatuses = ['pending', 'in_progress', 'completed', 'expired'];

const evaluatees = [
  { id: 'eval-001', name: 'María González', email: 'maria.gonzalez@example.com', area: 'Ventas', jobFamily: 'Comercial' },
  { id: 'eval-002', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@example.com', area: 'TI', jobFamily: 'Tecnología' },
  { id: 'eval-003', name: 'Ana Martínez', email: 'ana.martinez@example.com', area: 'RRHH', jobFamily: 'Personas' },
  { id: 'eval-004', name: 'Luis Fernández', email: 'luis.fernandez@example.com', area: 'Finanzas', jobFamily: 'Administración' },
  { id: 'eval-005', name: 'Patricia López', email: 'patricia.lopez@example.com', area: 'Marketing', jobFamily: 'Comercial' },
  { id: 'eval-006', name: 'Roberto Sánchez', email: 'roberto.sanchez@example.com', area: 'Operaciones', jobFamily: 'Operaciones' },
  { id: 'eval-007', name: 'Isabel Ramírez', email: 'isabel.ramirez@example.com', area: 'Legal', jobFamily: 'Legal' },
  { id: 'eval-008', name: 'Diego Torres', email: 'diego.torres@example.com', area: 'Ventas', jobFamily: 'Comercial' },
  { id: 'eval-009', name: 'Carmen Díaz', email: 'carmen.diaz@example.com', area: 'TI', jobFamily: 'Tecnología' },
  { id: 'eval-010', name: 'Javier Morales', email: 'javier.morales@example.com', area: 'RRHH', jobFamily: 'Personas' }
];

const evaluators = [
  { name: 'Evaluador 1', email: 'evaluator1@example.com' },
  { name: 'Evaluador 2', email: 'evaluator2@example.com' },
  { name: 'Evaluador 3', email: 'evaluator3@example.com' },
  { name: 'Evaluador 4', email: 'evaluator4@example.com' },
  { name: 'Evaluador 5', email: 'evaluator5@example.com' },
  { name: 'Manager 1', email: 'manager1@example.com' },
  { name: 'Manager 2', email: 'manager2@example.com' },
  { name: 'Peer 1', email: 'peer1@example.com' },
  { name: 'Peer 2', email: 'peer2@example.com' },
  { name: 'Peer 3', email: 'peer3@example.com' },
  // Emails inválidos para probar DLQ
  { name: 'Invalid Email 1', email: 'invalid@test.local' },
  { name: 'Invalid Email 2', email: 'bounce@simulator.amazonses.com' },
  { name: 'Invalid Email 3', email: 'notexist@invaliddomain.xyz' }
];

// Funciones de creación

async function createTestDefinition() {
  console.log('📝 Creando Test Definition...');
  
  const testId = 'test-360-leadership-v2';
  const testRef = db.collection('organizations').doc(ORG_ID).collection('testDefinitions').doc(testId);
  
  const testDoc = await testRef.get();
  if (testDoc.exists) {
    console.log('   ✅ Test Definition ya existe\n');
    return testId;
  }
  
  await testRef.set({
    title: 'Evaluación de Liderazgo 360° v2',
    description: 'Evaluación completa de competencias de liderazgo - Versión mejorada',
    version: 2,
    status: 'published',
    testType: '360',
    orgId: ORG_ID,
    createdBy: 'system',
    createdAt: new Date(),
    categories: [
      {
        id: 'cat-1',
        name: 'Liderazgo Estratégico',
        weight: 0.3,
        questions: Array(5).fill(null).map((_, i) => ({
          id: `q1-${i+1}`,
          text: `Pregunta de liderazgo ${i+1}`,
          type: 'likert-5',
          weight: 1
        }))
      },
      {
        id: 'cat-2',
        name: 'Gestión de Equipos',
        weight: 0.4,
        questions: Array(5).fill(null).map((_, i) => ({
          id: `q2-${i+1}`,
          text: `Pregunta de gestión ${i+1}`,
          type: 'likert-5',
          weight: 1
        }))
      },
      {
        id: 'cat-3',
        name: 'Comunicación',
        weight: 0.3,
        questions: Array(5).fill(null).map((_, i) => ({
          id: `q3-${i+1}`,
          text: `Pregunta de comunicación ${i+1}`,
          type: 'likert-5',
          weight: 1
        }))
      }
    ]
  });
  
  console.log('   ✅ Test Definition creado\n');
  return testId;
}

async function createCampaigns(testId) {
  console.log('🎯 Creando Campañas...');
  
  const campaigns = [
    {
      id: `campaign-${Date.now()}-1`,
      name: 'Evaluación Q4 2024 - Liderazgo',
      description: 'Evaluación trimestral de líderes y gerentes',
      status: 'active',
      testId: testId,
      testVersion: 2,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-12-31'),
      evaluateeCount: 5,
      completionRate: 0.45
    },
    {
      id: `campaign-${Date.now()}-2`,
      name: 'Evaluación Anual 2024',
      description: 'Evaluación anual de todo el personal',
      status: 'active',
      testId: testId,
      testVersion: 2,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      evaluateeCount: 10,
      completionRate: 0.72
    },
    {
      id: `campaign-${Date.now()}-3`,
      name: 'Evaluación Especial - Nuevos Ingresos',
      description: 'Evaluación para empleados con menos de 1 año',
      status: 'paused',
      testId: testId,
      testVersion: 2,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-11-30'),
      evaluateeCount: 3,
      completionRate: 0.20
    }
  ];
  
  const createdCampaigns = [];
  
  for (const campaign of campaigns) {
    const campaignRef = db.collection('organizations').doc(ORG_ID)
      .collection('campaigns').doc(campaign.id);
    
    await campaignRef.set({
      ...campaign,
      timezone: 'America/Santiago',
      orgId: ORG_ID,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      privacySettings: {
        minResponsesForAnonymity: 3,
        showIndividualResponses: false
      },
      metrics: {
        totalAssignments: campaign.evaluateeCount * 5,
        completedAssignments: Math.floor(campaign.evaluateeCount * 5 * campaign.completionRate),
        pendingAssignments: Math.floor(campaign.evaluateeCount * 5 * (1 - campaign.completionRate)),
        avgCompletionTime: 15.5,
        participationRate: campaign.completionRate
      }
    });
    
    createdCampaigns.push(campaign);
    console.log(`   ✅ Campaña creada: ${campaign.name}`);
  }
  
  console.log('');
  return createdCampaigns;
}

async function createSessions(campaigns) {
  console.log('👥 Creando Sesiones 360...');
  
  let sessionCount = 0;
  const allSessions = [];
  
  for (const campaign of campaigns) {
    const sessionCount = Math.min(campaign.evaluateeCount, evaluatees.length);
    
    for (let i = 0; i < sessionCount; i++) {
      const evaluatee = evaluatees[i];
      const sessionId = `session-${campaign.id}-${evaluatee.id}`;
      
      const sessionRef = db.collection('organizations').doc(ORG_ID)
        .collection('evaluation360Sessions').doc(sessionId);
      
      const session = {
        campaignId: campaign.id,
        testId: campaign.testId,
        testVersion: campaign.testVersion,
        evaluateeId: evaluatee.id,
        evaluateeName: evaluatee.name,
        evaluateeEmail: evaluatee.email,
        evaluateeArea: evaluatee.area,
        evaluateeJobFamily: evaluatee.jobFamily,
        status: randomElement(['not_started', 'in_progress', 'completed']),
        progress: Math.random(),
        startedAt: campaign.startDate,
        deadline: campaign.endDate,
        orgId: ORG_ID,
        createdAt: new Date()
      };
      
      await sessionRef.set(session);
      allSessions.push({ ...session, id: sessionId });
      sessionCount++;
    }
  }
  
  console.log(`   ✅ ${sessionCount} sesiones creadas\n`);
  return allSessions;
}

async function createAssignments(sessions) {
  console.log('📧 Creando Asignaciones...');
  
  let assignmentCount = 0;
  let invalidEmailCount = 0;
  
  for (const session of sessions) {
    // Crear 5-7 asignaciones por sesión
    const numAssignments = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numAssignments; i++) {
      const evaluator = randomElement(evaluators);
      const isInvalidEmail = evaluator.email.includes('invalid') || 
                             evaluator.email.includes('bounce') ||
                             evaluator.email.includes('notexist');
      
      if (isInvalidEmail) invalidEmailCount++;
      
      const assignmentId = `assignment-${session.id}-${i}`;
      const token = generateToken();
      
      const assignmentRef = db.collection('organizations').doc(ORG_ID)
        .collection('evaluatorAssignments').doc(assignmentId);
      
      await assignmentRef.set({
        campaignId: session.campaignId,
        session360Id: session.id,
        evaluateeId: session.evaluateeId,
        evaluateeName: session.evaluateeName,
        evaluatorEmail: evaluator.email,
        evaluatorName: evaluator.name,
        evaluatorType: randomElement(evaluatorTypes),
        status: isInvalidEmail ? 'error' : randomElement(assignmentStatuses),
        token: token,
        tokenHash: generateHash(token),
        tokenUsed: Math.random() > 0.5,
        invitationCount: Math.floor(Math.random() * 3) + 1,
        lastInvitedAt: randomDate(new Date('2024-10-01'), new Date()),
        deadline: session.deadline,
        completedAt: Math.random() > 0.5 ? randomDate(new Date('2024-10-15'), new Date()) : null,
        orgId: ORG_ID,
        createdAt: new Date(),
        // Marcar emails inválidos para DLQ
        errorDetails: isInvalidEmail ? {
          type: 'invalid_email',
          message: 'Email bounce or invalid domain',
          retryCount: 3,
          lastRetry: new Date()
        } : null
      });
      
      assignmentCount++;
    }
  }
  
  console.log(`   ✅ ${assignmentCount} asignaciones creadas`);
  console.log(`   ⚠️  ${invalidEmailCount} con emails inválidos (para DLQ)\n`);
}

async function createAggregations(sessions) {
  console.log('📊 Creando Agregaciones...');
  
  let aggregationCount = 0;
  
  for (const session of sessions.slice(0, 10)) { // Solo las primeras 10 sesiones
    const aggregationId = `agg-${session.id}`;
    
    const aggregationRef = db.collection('organizations').doc(ORG_ID)
      .collection('evaluation360Aggregations').doc(aggregationId);
    
    await aggregationRef.set({
      session360Id: session.id,
      campaignId: session.campaignId,
      evaluateeId: session.evaluateeId,
      evaluateeName: session.evaluateeName,
      status: 'completed',
      responseCount: Math.floor(Math.random() * 10) + 3,
      scores: {
        overall: 3.5 + Math.random() * 1.5,
        byCategory: {
          'cat-1': 3 + Math.random() * 2,
          'cat-2': 3 + Math.random() * 2,
          'cat-3': 3 + Math.random() * 2
        },
        byEvaluatorType: {
          self: 4 + Math.random(),
          manager: 3.5 + Math.random(),
          peer: 3 + Math.random() * 2,
          direct: 3.5 + Math.random() * 1.5
        }
      },
      lastCalculatedAt: new Date(),
      orgId: ORG_ID,
      createdAt: new Date()
    });
    
    aggregationCount++;
  }
  
  console.log(`   ✅ ${aggregationCount} agregaciones creadas\n`);
}

async function createDLQEntries() {
  console.log('⚠️  Creando entradas DLQ...');
  
  const dlqEntries = [
    {
      id: `dlq-${Date.now()}-1`,
      type: 'email_bounce',
      assignmentId: 'assignment-xxx-1',
      error: 'Email bounced: invalid@test.local',
      retryCount: 3,
      maxRetries: 3,
      status: 'failed',
      createdAt: new Date(),
      lastRetry: new Date()
    },
    {
      id: `dlq-${Date.now()}-2`,
      type: 'rate_limit',
      campaignId: 'campaign-xxx',
      error: 'Rate limit exceeded for organization',
      retryCount: 1,
      maxRetries: 3,
      status: 'pending_retry',
      createdAt: new Date(Date.now() - 3600000),
      nextRetry: new Date(Date.now() + 3600000)
    },
    {
      id: `dlq-${Date.now()}-3`,
      type: 'processing_error',
      session360Id: 'session-xxx',
      error: 'Failed to calculate aggregations: timeout',
      retryCount: 2,
      maxRetries: 3,
      status: 'pending_retry',
      createdAt: new Date(Date.now() - 7200000),
      lastRetry: new Date(Date.now() - 1800000)
    }
  ];
  
  for (const entry of dlqEntries) {
    const dlqRef = db.collection('organizations').doc(ORG_ID)
      .collection('bulkActionDLQ').doc(entry.id);
    
    await dlqRef.set({
      ...entry,
      orgId: ORG_ID
    });
  }
  
  console.log(`   ✅ ${dlqEntries.length} entradas DLQ creadas\n`);
}

async function createAuditLogs() {
  console.log('📝 Creando logs de auditoría...');
  
  const auditLogs = [
    {
      action: 'bulk.started',
      userId: 'admin@pilot-santiago.com',
      details: { campaignId: 'campaign-xxx', count: 50 },
      timestamp: new Date(Date.now() - 86400000)
    },
    {
      action: 'bulk.completed',
      userId: 'admin@pilot-santiago.com',
      details: { campaignId: 'campaign-xxx', success: 45, failed: 5 },
      timestamp: new Date(Date.now() - 86000000)
    },
    {
      action: 'campaign.created',
      userId: 'admin@pilot-santiago.com',
      details: { campaignName: 'Evaluación Q4 2024' },
      timestamp: new Date(Date.now() - 172800000)
    },
    {
      action: 'alerts.dlq_put',
      userId: 'system',
      details: { error: 'Email bounce', assignmentId: 'assignment-xxx' },
      timestamp: new Date()
    }
  ];
  
  for (const log of auditLogs) {
    const auditRef = db.collection('organizations').doc(ORG_ID)
      .collection('auditLogs').doc();
    
    await auditRef.set({
      ...log,
      orgId: ORG_ID,
      createdAt: new Date()
    });
  }
  
  console.log(`   ✅ ${auditLogs.length} logs de auditoría creados\n`);
}

// Función principal
async function main() {
  try {
    console.log(`📍 Organización objetivo: ${ORG_ID}`);
    console.log(`🔗 Proyecto: ${PROJECT_ID}\n`);
    
    // 1. Crear test definition
    const testId = await createTestDefinition();
    
    // 2. Crear campañas
    const campaigns = await createCampaigns(testId);
    
    // 3. Crear sesiones
    const sessions = await createSessions(campaigns);
    
    // 4. Crear asignaciones
    await createAssignments(sessions);
    
    // 5. Crear agregaciones
    await createAggregations(sessions);
    
    // 6. Crear entradas DLQ
    await createDLQEntries();
    
    // 7. Crear logs de auditoría
    await createAuditLogs();
    
    console.log('=====================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('=====================================\n');
    
    console.log('📊 Resumen:');
    console.log(`   - ${campaigns.length} campañas`);
    console.log(`   - ${sessions.length} sesiones 360`);
    console.log(`   - ~${sessions.length * 6} asignaciones`);
    console.log(`   - Agregaciones con métricas`);
    console.log(`   - Entradas DLQ para testing`);
    console.log(`   - Logs de auditoría`);
    console.log('\n🎯 Próximo paso: Ejecutar smoke tests');
    
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
