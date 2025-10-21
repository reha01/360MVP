/**
 * Script para poblar datos de prueba en Staging
 * Crea orgs piloto, campañas, usuarios y evaluaciones
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Configuración de Firebase para Staging
const firebaseConfig = {
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "mvp-staging-3e1cd.firebaseapp.com",
  projectId: "mvp-staging-3e1cd",
  storageBucket: "mvp-staging-3e1cd.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de orgs piloto
const pilotOrgs = [
  {
    id: 'pilot-org-santiago',
    name: 'Empresa Piloto Santiago',
    timezone: 'America/Santiago',
    hasDST: true,
    plan: 'enterprise',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pilot-org-mexico',
    name: 'Empresa Piloto México',
    timezone: 'America/Mexico_City',
    hasDST: false,
    plan: 'enterprise',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Datos de usuarios piloto
const pilotUsers = [
  {
    id: 'admin-santiago',
    email: 'admin@santiago-pilot.com',
    name: 'Admin Santiago',
    role: 'owner',
    orgId: 'pilot-org-santiago',
    createdAt: new Date()
  },
  {
    id: 'admin-mexico',
    email: 'admin@mexico-pilot.com',
    name: 'Admin México',
    role: 'owner',
    orgId: 'pilot-org-mexico',
    createdAt: new Date()
  }
];

// Datos de campañas piloto
const pilotCampaigns = [
  {
    id: 'campaign-santiago-1',
    name: 'Campaña Q1 2024',
    orgId: 'pilot-org-santiago',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    status: 'completed',
    testId: 'leadership-v1',
    testVersion: '1.0.0',
    timezone: 'America/Santiago',
    createdAt: new Date()
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
    timezone: 'America/Santiago',
    createdAt: new Date()
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
    dstChangeDate: '2024-09-08',
    createdAt: new Date()
  }
];

// Función para poblar datos
async function seedPilotData() {
  console.log('🌱 Iniciando seeding de datos piloto...');
  
  try {
    // Crear organizaciones piloto
    console.log('📊 Creando organizaciones piloto...');
    for (const org of pilotOrgs) {
      await setDoc(doc(db, 'organizations', org.id), org);
      console.log(`✅ Creada organización: ${org.name}`);
    }
    
    // Crear usuarios piloto
    console.log('👥 Creando usuarios piloto...');
    for (const user of pilotUsers) {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`✅ Creado usuario: ${user.name}`);
    }
    
    // Crear campañas piloto
    console.log('📋 Creando campañas piloto...');
    for (const campaign of pilotCampaigns) {
      await setDoc(doc(db, 'campaigns', campaign.id), campaign);
      console.log(`✅ Creada campaña: ${campaign.name}`);
    }
    
    console.log('🎉 Seeding completado exitosamente!');
    console.log('📊 Datos creados:');
    console.log(`   - ${pilotOrgs.length} organizaciones`);
    console.log(`   - ${pilotUsers.length} usuarios`);
    console.log(`   - ${pilotCampaigns.length} campañas`);
    
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar seeding
seedPilotData();
