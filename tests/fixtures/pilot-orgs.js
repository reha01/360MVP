/**
 * Fixtures para UAT - Organizaciones Piloto
 * 
 * 2 orgs piloto con zonas horarias distintas
 * Una con DST: America/Santiago y America/Mexico_City
 */

export const pilotOrgs = {
  org1: {
    id: 'pilot-org-santiago',
    name: 'Empresa Piloto Santiago',
    timezone: 'America/Santiago',
    hasDST: true,
    dstStart: '2024-09-08', // Primer domingo de septiembre
    dstEnd: '2024-04-07',   // Primer domingo de abril
    plan: 'enterprise',
    features: {
      dashboard360: true,
      bulkActions: true,
      campaignComparison: true,
      orgPolicies: true,
      operationalAlerts: true
    },
    members: [
      {
        id: 'admin-santiago',
        email: 'admin@santiago-pilot.com',
        role: 'owner',
        name: 'Admin Santiago'
      },
      {
        id: 'manager-santiago',
        email: 'manager@santiago-pilot.com',
        role: 'admin',
        name: 'Manager Santiago'
      }
    ]
  },
  
  org2: {
    id: 'pilot-org-mexico',
    name: 'Empresa Piloto México',
    timezone: 'America/Mexico_City',
    hasDST: false,
    plan: 'enterprise',
    features: {
      dashboard360: true,
      bulkActions: true,
      campaignComparison: true,
      orgPolicies: true,
      operationalAlerts: true
    },
    members: [
      {
        id: 'admin-mexico',
        email: 'admin@mexico-pilot.com',
        role: 'owner',
        name: 'Admin México'
      },
      {
        id: 'manager-mexico',
        email: 'manager@mexico-pilot.com',
        role: 'admin',
        name: 'Manager México'
      }
    ]
  }
};

export const testCampaigns = {
  santiago: [
    {
      id: 'campaign-santiago-1',
      name: 'Campaña Q1 2024',
      orgId: 'pilot-org-santiago',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      status: 'completed',
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      timezone: 'America/Santiago'
    },
    {
      id: 'campaign-santiago-2',
      name: 'Campaña Q2 2024',
      orgId: 'pilot-org-santiago',
      startDate: '2024-04-01',
      endDate: '2024-05-01',
      status: 'completed',
      testId: 'leadership-v2',
      testVersion: '2.0.0',
      timezone: 'America/Santiago'
    },
    {
      id: 'campaign-santiago-3',
      name: 'Campaña DST Test',
      orgId: 'pilot-org-santiago',
      startDate: '2024-08-15',
      endDate: '2024-10-15',
      status: 'active',
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      timezone: 'America/Santiago',
      crossesDST: true,
      dstChangeDate: '2024-09-08'
    }
  ],
  
  mexico: [
    {
      id: 'campaign-mexico-1',
      name: 'Campaña Q1 2024',
      orgId: 'pilot-org-mexico',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      status: 'completed',
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      timezone: 'America/Mexico_City'
    },
    {
      id: 'campaign-mexico-2',
      name: 'Campaña Q2 2024',
      orgId: 'pilot-org-mexico',
      startDate: '2024-04-01',
      endDate: '2024-05-01',
      status: 'completed',
      testId: 'leadership-v2',
      testVersion: '2.0.0',
      timezone: 'America/Mexico_City'
    },
    {
      id: 'campaign-mexico-3',
      name: 'Campaña Q3 2024',
      orgId: 'pilot-org-mexico',
      startDate: '2024-07-01',
      endDate: '2024-08-01',
      status: 'active',
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      timezone: 'America/Mexico_City'
    }
  ]
};

export const testEvaluations = {
  // Evaluaciones distribuidas por rater type
  evaluations: [
    // Self evaluations
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `eval-self-${i}`,
      campaignId: i % 3 === 0 ? 'campaign-santiago-1' : i % 3 === 1 ? 'campaign-santiago-2' : 'campaign-santiago-3',
      evaluateeId: `user-${i}`,
      evaluatorType: 'self',
      status: 'completed',
      completedAt: new Date(2024, 0, 15 + i).toISOString(),
      responses: generateResponses('self')
    })),
    
    // Manager evaluations
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `eval-manager-${i}`,
      campaignId: i % 3 === 0 ? 'campaign-santiago-1' : i % 3 === 1 ? 'campaign-santiago-2' : 'campaign-santiago-3',
      evaluateeId: `user-${i}`,
      evaluatorType: 'manager',
      status: 'completed',
      completedAt: new Date(2024, 0, 15 + i).toISOString(),
      responses: generateResponses('manager')
    })),
    
    // Peer evaluations
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `eval-peer-${i}`,
      campaignId: i % 3 === 0 ? 'campaign-santiago-1' : i % 3 === 1 ? 'campaign-santiago-2' : 'campaign-santiago-3',
      evaluateeId: `user-${i}`,
      evaluatorType: 'peer',
      status: 'completed',
      completedAt: new Date(2024, 0, 15 + i).toISOString(),
      responses: generateResponses('peer')
    })),
    
    // Direct reports evaluations
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `eval-direct-${i}`,
      campaignId: i % 3 === 0 ? 'campaign-santiago-1' : i % 3 === 1 ? 'campaign-santiago-2' : 'campaign-santiago-3',
      evaluateeId: `user-${i}`,
      evaluatorType: 'direct',
      status: 'completed',
      completedAt: new Date(2024, 0, 15 + i).toISOString(),
      responses: generateResponses('direct')
    })),
    
    // External evaluations
    ...Array.from({ length: 50 }, (_, i) => ({
      id: `eval-external-${i}`,
      campaignId: i % 3 === 0 ? 'campaign-santiago-1' : i % 3 === 1 ? 'campaign-santiago-2' : 'campaign-santiago-3',
      evaluateeId: `user-${i}`,
      evaluatorType: 'external',
      status: 'completed',
      completedAt: new Date(2024, 0, 15 + i).toISOString(),
      responses: generateResponses('external')
    }))
  ],
  
  // Casos borde para testing de umbrales
  edgeCases: [
    {
      id: 'eval-edge-peers-1',
      campaignId: 'campaign-santiago-1',
      evaluateeId: 'user-edge-1',
      evaluatorType: 'peer',
      status: 'completed',
      responses: generateResponses('peer'),
      // Solo 1 peer - debe ocultarse en reportes
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
      responses: generateResponses('direct'),
      // Solo 2 direct reports - debe ocultarse en reportes
      thresholdViolation: true,
      thresholdType: 'direct',
      thresholdValue: 2
    },
    {
      id: 'eval-edge-mixed-versions',
      campaignId: 'campaign-santiago-1',
      evaluateeId: 'user-edge-3',
      evaluatorType: 'peer',
      status: 'completed',
      responses: generateResponses('peer'),
      // Mezcla de versiones - debe mostrar disclaimer
      versionMismatch: true,
      testId: 'leadership-v1',
      testVersion: '1.0.0',
      mixedWithVersion: '2.0.0'
    }
  ]
};

export const testUsers = {
  // Usuarios para las organizaciones piloto
  santiago: [
    {
      id: 'user-santiago-1',
      email: 'user1@santiago-pilot.com',
      name: 'Usuario Santiago 1',
      areaId: 'area-santiago-1',
      managerIds: ['user-santiago-manager-1'],
      jobFamilyIds: ['job-family-leadership']
    },
    {
      id: 'user-santiago-2',
      email: 'user2@santiago-pilot.com',
      name: 'Usuario Santiago 2',
      areaId: 'area-santiago-2',
      managerIds: ['user-santiago-manager-2'],
      jobFamilyIds: ['job-family-leadership']
    }
  ],
  
  mexico: [
    {
      id: 'user-mexico-1',
      email: 'user1@mexico-pilot.com',
      name: 'Usuario México 1',
      areaId: 'area-mexico-1',
      managerIds: ['user-mexico-manager-1'],
      jobFamilyIds: ['job-family-leadership']
    },
    {
      id: 'user-mexico-2',
      email: 'user2@mexico-pilot.com',
      name: 'Usuario México 2',
      areaId: 'area-mexico-2',
      managerIds: ['user-mexico-manager-2'],
      jobFamilyIds: ['job-family-leadership']
    }
  ]
};

export const testJobFamilies = [
  {
    id: 'job-family-leadership',
    name: 'Liderazgo',
    description: 'Competencias de liderazgo y gestión',
    testIds: ['leadership-v1', 'leadership-v2'],
    evaluatorConfig: {
      self: { required: true, weight: 0.1 },
      manager: { required: true, weight: 0.3 },
      peer: { required: true, weight: 0.3, minCount: 3 },
      direct: { required: true, weight: 0.2, minCount: 2 },
      external: { required: false, weight: 0.1, maxCount: 2 }
    }
  }
];

export const testTestDefinitions = [
  {
    id: 'leadership-v1',
    version: '1.0.0',
    name: 'Evaluación de Liderazgo v1',
    categories: [
      {
        id: 'vision',
        name: 'Visión Estratégica',
        weight: 0.3,
        questions: [
          {
            id: 'vision-1',
            text: 'Comunica claramente la visión de la organización',
            type: 'likert',
            scale: { min: 1, max: 5 },
            weight: 1.0
          }
        ]
      }
    ]
  },
  {
    id: 'leadership-v2',
    version: '2.0.0',
    name: 'Evaluación de Liderazgo v2',
    categories: [
      {
        id: 'vision',
        name: 'Visión Estratégica',
        weight: 0.3,
        questions: [
          {
            id: 'vision-1',
            text: 'Comunica claramente la visión de la organización',
            type: 'likert',
            scale: { min: 1, max: 5 },
            weight: 1.0
          }
        ]
      }
    ]
  }
];

// Función auxiliar para generar respuestas
function generateResponses(evaluatorType) {
  const responses = {};
  const categories = ['vision', 'communication', 'decision-making', 'team-building'];
  
  categories.forEach(category => {
    responses[category] = {
      questions: Array.from({ length: 3 }, (_, i) => ({
        questionId: `${category}-${i + 1}`,
        value: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date().toISOString()
      }))
    };
  });
  
  return responses;
}

export default {
  pilotOrgs,
  testCampaigns,
  testEvaluations,
  testUsers,
  testJobFamilies,
  testTestDefinitions
};
