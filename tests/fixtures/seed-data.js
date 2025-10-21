/**
 * Fixtures para UAT - Seed Data
 * 
 * Script para poblar datos de prueba
 * ≥200 evaluaciones, mezcla de testId@version, 2 TZ distintas
 */

import { pilotOrgs, testCampaigns, testEvaluations, testUsers, testJobFamilies, testTestDefinitions } from './pilot-orgs.js';
import { emailSandboxConfig, emailTestScenarios } from './email-sandbox.js';

export const seedData = {
  // Organizaciones piloto
  organizations: Object.values(pilotOrgs),
  
  // Campañas de prueba
  campaigns: [
    ...testCampaigns.santiago,
    ...testCampaigns.mexico
  ],
  
  // Evaluaciones (≥200)
  evaluations: [
    ...testEvaluations.evaluations,
    ...testEvaluations.edgeCases
  ],
  
  // Usuarios
  users: [
    ...testUsers.santiago,
    ...testUsers.mexico
  ],
  
  // Job Families
  jobFamilies: testJobFamilies,
  
  // Test Definitions
  testDefinitions: testTestDefinitions,
  
  // Configuración de email
  emailConfig: emailSandboxConfig
};

export const seedStats = {
  totalOrganizations: 2,
  totalCampaigns: 6,
  totalEvaluations: 253, // 250 + 3 edge cases
  totalUsers: 4,
  totalJobFamilies: 1,
  totalTestDefinitions: 2,
  
  // Distribución por tipo de evaluador
  evaluatorDistribution: {
    self: 50,
    manager: 50,
    peer: 50,
    direct: 50,
    external: 50
  },
  
  // Distribución por campaña
  campaignDistribution: {
    'campaign-santiago-1': 85,
    'campaign-santiago-2': 85,
    'campaign-santiago-3': 80,
    'campaign-mexico-1': 85,
    'campaign-mexico-2': 85,
    'campaign-mexico-3': 80
  },
  
  // Distribución por versión
  versionDistribution: {
    '1.0.0': 170,
    '2.0.0': 80,
    'mixed': 3
  },
  
  // Casos borde
  edgeCases: {
    thresholdViolations: 2,
    versionMismatches: 1,
    timezoneCrossings: 1
  }
};

export const seedScript = `
// Script para poblar datos de prueba en Staging
// Ejecutar en consola del navegador o como script de Node.js

const seedData = ${JSON.stringify(seedData, null, 2)};

// Función para poblar organizaciones
async function seedOrganizations() {
  console.log('🌱 Seeding organizations...');
  
  for (const org of seedData.organizations) {
    try {
      // Crear organización
      await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org)
      });
      
      console.log(\`✅ Created organization: \${org.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating organization \${org.name}:\`, error);
    }
  }
}

// Función para poblar campañas
async function seedCampaigns() {
  console.log('🌱 Seeding campaigns...');
  
  for (const campaign of seedData.campaigns) {
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });
      
      console.log(\`✅ Created campaign: \${campaign.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating campaign \${campaign.name}:\`, error);
    }
  }
}

// Función para poblar evaluaciones
async function seedEvaluations() {
  console.log('🌱 Seeding evaluations...');
  
  for (const evaluation of seedData.evaluations) {
    try {
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation)
      });
      
      console.log(\`✅ Created evaluation: \${evaluation.id}\`);
    } catch (error) {
      console.error(\`❌ Error creating evaluation \${evaluation.id}:\`, error);
    }
  }
}

// Función para poblar usuarios
async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  for (const user of seedData.users) {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      console.log(\`✅ Created user: \${user.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating user \${user.name}:\`, error);
    }
  }
}

// Función para poblar job families
async function seedJobFamilies() {
  console.log('🌱 Seeding job families...');
  
  for (const jobFamily of seedData.jobFamilies) {
    try {
      await fetch('/api/job-families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobFamily)
      });
      
      console.log(\`✅ Created job family: \${jobFamily.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating job family \${jobFamily.name}:\`, error);
    }
  }
}

// Función para poblar test definitions
async function seedTestDefinitions() {
  console.log('🌱 Seeding test definitions...');
  
  for (const testDef of seedData.testDefinitions) {
    try {
      await fetch('/api/test-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testDef)
      });
      
      console.log(\`✅ Created test definition: \${testDef.name}\`);
    } catch (error) {
      console.error(\`❌ Error creating test definition \${testDef.name}:\`, error);
    }
  }
}

// Función principal para poblar todos los datos
async function seedAll() {
  console.log('🚀 Starting data seeding...');
  console.log('📊 Expected stats:', ${JSON.stringify(seedStats, null, 2)});
  
  try {
    await seedOrganizations();
    await seedJobFamilies();
    await seedTestDefinitions();
    await seedUsers();
    await seedCampaigns();
    await seedEvaluations();
    
    console.log('✅ Data seeding completed successfully!');
    console.log('📊 Final stats:', ${JSON.stringify(seedStats, null, 2)});
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
  }
}

// Ejecutar seeding
seedAll();
`;

export const validationQueries = {
  // Queries para validar que los datos se poblaron correctamente
  organizations: `
    // Validar organizaciones
    db.organizations.find({}).count();
  `,
  
  campaigns: `
    // Validar campañas
    db.campaigns.find({}).count();
  `,
  
  evaluations: `
    // Validar evaluaciones
    db.evaluations.find({}).count();
  `,
  
  users: `
    // Validar usuarios
    db.users.find({}).count();
  `,
  
  jobFamilies: `
    // Validar job families
    db.jobFamilies.find({}).count();
  `,
  
  testDefinitions: `
    // Validar test definitions
    db.testDefinitions.find({}).count();
  `,
  
  // Queries específicas para UAT
  edgeCases: `
    // Validar casos borde
    db.evaluations.find({
      $or: [
        { thresholdViolation: true },
        { versionMismatch: true }
      ]
    }).count();
  `,
  
  timezoneCrossings: `
    // Validar cruces de zona horaria
    db.campaigns.find({
      crossesDST: true
    }).count();
  `,
  
  versionDistribution: `
    // Validar distribución de versiones
    db.campaigns.aggregate([
      { $group: { _id: "$testVersion", count: { $sum: 1 } } }
    ]);
  `
};

export const cleanupScript = `
// Script para limpiar datos de prueba
// Ejecutar después del UAT

async function cleanupData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Limpiar evaluaciones
    await fetch('/api/evaluations', { method: 'DELETE' });
    console.log('✅ Cleaned evaluations');
    
    // Limpiar campañas
    await fetch('/api/campaigns', { method: 'DELETE' });
    console.log('✅ Cleaned campaigns');
    
    // Limpiar usuarios
    await fetch('/api/users', { method: 'DELETE' });
    console.log('✅ Cleaned users');
    
    // Limpiar job families
    await fetch('/api/job-families', { method: 'DELETE' });
    console.log('✅ Cleaned job families');
    
    // Limpiar test definitions
    await fetch('/api/test-definitions', { method: 'DELETE' });
    console.log('✅ Cleaned test definitions');
    
    // Limpiar organizaciones
    await fetch('/api/organizations', { method: 'DELETE' });
    console.log('✅ Cleaned organizations');
    
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Ejecutar cleanup
cleanupData();
`;

export default {
  seedData,
  seedStats,
  seedScript,
  validationQueries,
  cleanupScript
};
