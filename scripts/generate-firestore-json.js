/**
 * Genera JSON para importar manualmente a Firestore
 * 
 * Uso: node scripts/generate-firestore-json.js > firestore-import.json
 */

const UID = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
const ORG_ID = 'pilot-org-santiago';
const CAMPAIGN_ID = 'campaign-smoke-test-1';
const TEST_ID = 'test-360-leadership-v1';

console.log(JSON.stringify({
  instructions: "Copiar y pegar estos documentos en Firestore Console",
  
  // 1. Organización
  org: {
    path: `organizations/${ORG_ID}`,
    data: {
      name: "Pilot Org Santiago",
      timezone: "America/Santiago",
      plan: "starter",
      active: true,
      featureFlags: {
        FEATURE_BULK_ACTIONS: true,
        FEATURE_DASHBOARD_360: true,
        FEATURE_CAMPAIGN_COMPARISON: true,
        FEATURE_ORG_POLICIES: true,
        FEATURE_OPERATIONAL_ALERTS: true
      }
    }
  },
  
  // 2. Usuario como miembro
  member: {
    path: `organizations/${ORG_ID}/members/${UID}`,
    data: {
      email: "admin@pilot-santiago.com",
      role: "admin",
      active: true,
      displayName: "Admin Santiago"
    }
  },
  
  // 3. Test Definition
  testDefinition: {
    path: `organizations/${ORG_ID}/testDefinitions/${TEST_ID}`,
    data: {
      title: "Evaluación de Liderazgo 360°",
      description: "Evaluación completa de competencias de liderazgo",
      version: 1,
      status: "published",
      testType: "360",
      categories: [
        {
          id: "cat-1",
          name: "Liderazgo Estratégico",
          weight: 0.3,
          questions: [
            { id: "q1", text: "¿Comunica la visión claramente?", type: "likert-5", weight: 1 },
            { id: "q2", text: "¿Toma decisiones estratégicas efectivas?", type: "likert-5", weight: 1 }
          ]
        },
        {
          id: "cat-2",
          name: "Gestión de Equipos",
          weight: 0.4,
          questions: [
            { id: "q3", text: "¿Motiva al equipo efectivamente?", type: "likert-5", weight: 1 },
            { id: "q4", text: "¿Delega apropiadamente?", type: "likert-5", weight: 1 }
          ]
        },
        {
          id: "cat-3",
          name: "Comunicación",
          weight: 0.3,
          questions: [
            { id: "q5", text: "¿Escucha activamente?", type: "likert-5", weight: 1 },
            { id: "q6", text: "¿Proporciona feedback constructivo?", type: "likert-5", weight: 1 }
          ]
        }
      ],
      createdBy: "system",
      orgId: ORG_ID
    }
  },
  
  // 4. Campaña
  campaign: {
    path: `organizations/${ORG_ID}/campaigns/${CAMPAIGN_ID}`,
    data: {
      name: "Smoke Test Campaign",
      description: "Campaña de prueba para smoke tests",
      status: "active",
      testId: TEST_ID,
      testVersion: 1,
      timezone: "America/Santiago",
      privacySettings: {
        minResponsesForAnonymity: 3,
        showIndividualResponses: false
      },
      createdBy: "system",
      orgId: ORG_ID
    }
  },
  
  // 5. Sesiones 360 (3)
  sessions: [1, 2, 3].map(i => ({
    path: `organizations/${ORG_ID}/evaluation360Sessions/session-evaluatee-${i}`,
    data: {
      campaignId: CAMPAIGN_ID,
      testId: TEST_ID,
      testVersion: 1,
      evaluateeId: `user-evaluatee-${i}`,
      evaluateeName: `Evaluado ${i}`,
      evaluateeEmail: `evaluatee${i}@pilot-santiago.com`,
      status: "in_progress",
      orgId: ORG_ID
    }
  })),
  
  // 6. Asignaciones (12)
  assignments: [
    ...Array.from({length: 9}, (_, i) => ({
      path: `organizations/${ORG_ID}/evaluatorAssignments/assignment-${i+1}`,
      data: {
        campaignId: CAMPAIGN_ID,
        session360Id: `session-evaluatee-${(i % 3) + 1}`,
        evaluatorEmail: `evaluator${i+1}@pilot-santiago.com`,
        evaluatorType: ['peer', 'manager', 'direct', 'self'][i % 4],
        evaluatorName: `Evaluador ${i+1}`,
        status: i < 7 ? 'pending' : 'completed',
        token: `token-${i+1}`,
        tokenHash: `hash-${i+1}`,
        tokenUsed: i >= 7,
        invitationCount: 1,
        orgId: ORG_ID
      }
    })),
    // Email inválido
    {
      path: `organizations/${ORG_ID}/evaluatorAssignments/assignment-10`,
      data: {
        campaignId: CAMPAIGN_ID,
        session360Id: "session-evaluatee-2",
        evaluatorEmail: "invalid@test.local",
        evaluatorType: "peer",
        evaluatorName: "Email Inválido (para DLQ)",
        status: "pending",
        token: "token-invalid",
        tokenHash: "hash-invalid",
        tokenUsed: false,
        invitationCount: 1,
        orgId: ORG_ID
      }
    },
    {
      path: `organizations/${ORG_ID}/evaluatorAssignments/assignment-11`,
      data: {
        campaignId: CAMPAIGN_ID,
        session360Id: "session-evaluatee-3",
        evaluatorEmail: "evaluator11@pilot-santiago.com",
        evaluatorType: "peer",
        evaluatorName: "Evaluador 11",
        status: "pending",
        token: "token-11",
        tokenHash: "hash-11",
        tokenUsed: false,
        invitationCount: 1,
        orgId: ORG_ID
      }
    },
    {
      path: `organizations/${ORG_ID}/evaluatorAssignments/assignment-12`,
      data: {
        campaignId: CAMPAIGN_ID,
        session360Id: "session-evaluatee-3",
        evaluatorEmail: "evaluator12@pilot-santiago.com",
        evaluatorType: "manager",
        evaluatorName: "Evaluador 12",
        status: "pending",
        token: "token-12",
        tokenHash: "hash-12",
        tokenUsed: false,
        invitationCount: 1,
        orgId: ORG_ID
      }
    }
  ]
  
}, null, 2));

console.error('\n✅ JSON generado exitosamente');
console.error('\nPasos siguientes:');
console.error('1. Guardar el output en firestore-import.json');
console.error('2. Copiar cada documento a Firestore Console');
console.error('3. Ejecutar: npm run smoke:staging\n');

