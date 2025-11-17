#!/usr/bin/env node

/**
 * Script to verify organization setup and membership
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc,
  collection,
  getDocs
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

const USER_UID = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
const ORG_ID = 'pilot-org-santiago';

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN');
console.log('==================================\n');

async function verifySetup() {
  try {
    // 1. Login como admin
    console.log('🔐 Autenticando...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@pilot-santiago.com', 
      'TestPilot2024!'
    );
    console.log('   ✅ Autenticado como:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    
    // 2. Verificar organización
    console.log('\n🏢 Verificando organización...');
    const orgRef = doc(db, 'organizations', ORG_ID);
    const orgDoc = await getDoc(orgRef);
    
    if (orgDoc.exists()) {
      const orgData = orgDoc.data();
      console.log('   ✅ Organización existe:', orgData.name || ORG_ID);
      
      if (orgData.featureFlags) {
        console.log('\n   📋 Feature Flags:');
        const phase2Flags = [
          'FEATURE_DASHBOARD_360',
          'FEATURE_BULK_ACTIONS', 
          'FEATURE_CAMPAIGN_COMPARISON',
          'FEATURE_ORG_POLICIES',
          'FEATURE_OPERATIONAL_ALERTS'
        ];
        
        phase2Flags.forEach(flag => {
          const status = orgData.featureFlags[flag] === true ? '✅' : '❌';
          console.log(`      ${status} ${flag}`);
        });
      } else {
        console.log('   ⚠️  Sin feature flags configurados');
      }
    } else {
      console.error('   ❌ Organización no encontrada');
      return;
    }
    
    // 3. Verificar miembro en subcolección
    console.log('\n👤 Verificando membresía...');
    
    // Intentar varios patrones de ID de documento
    const possibleMemberIds = [
      USER_UID,
      `${ORG_ID}:${USER_UID}`,
      `${USER_UID}:${ORG_ID}`
    ];
    
    let memberFound = false;
    for (const memberId of possibleMemberIds) {
      const memberRef = doc(db, `organizations/${ORG_ID}/members`, memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (memberDoc.exists()) {
        memberFound = true;
        const memberData = memberDoc.data();
        console.log(`   ✅ Miembro encontrado con ID: ${memberId}`);
        console.log('   - email:', memberData.email);
        console.log('   - role:', memberData.role);
        console.log('   - active:', memberData.active);
        break;
      }
    }
    
    if (!memberFound) {
      console.log('   ❌ Miembro no encontrado en ningún formato de ID');
      
      // Listar todos los miembros para debug
      console.log('\n   📋 Listando todos los miembros:');
      const membersRef = collection(db, `organizations/${ORG_ID}/members`);
      const membersSnapshot = await getDocs(membersRef);
      
      if (membersSnapshot.empty) {
        console.log('      (Sin miembros)');
      } else {
        membersSnapshot.forEach(doc => {
          console.log(`      - ID: ${doc.id}`);
          const data = doc.data();
          console.log(`        email: ${data.email}, role: ${data.role}`);
        });
      }
    }
    
    // 4. Verificar datos de prueba
    console.log('\n📊 Verificando datos de prueba...');
    
    // Verificar campañas
    const campaignsRef = collection(db, `organizations/${ORG_ID}/campaigns`);
    const campaignsSnapshot = await getDocs(campaignsRef);
    console.log(`   - Campañas: ${campaignsSnapshot.size}`);
    
    // Verificar sesiones
    const sessionsRef = collection(db, `organizations/${ORG_ID}/evaluation360Sessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    console.log(`   - Sesiones 360: ${sessionsSnapshot.size}`);
    
    // Verificar asignaciones
    const assignmentsRef = collection(db, `organizations/${ORG_ID}/evaluatorAssignments`);
    const assignmentsSnapshot = await getDocs(assignmentsRef);
    console.log(`   - Asignaciones: ${assignmentsSnapshot.size}`);
    
    // Verificar DLQ
    const dlqRef = collection(db, `organizations/${ORG_ID}/bulkActionDLQ`);
    const dlqSnapshot = await getDocs(dlqRef);
    console.log(`   - Entradas DLQ: ${dlqSnapshot.size}`);
    
    console.log('\n=====================================');
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('=====================================\n');
    
    const checks = {
      'Organización existe': orgDoc.exists(),
      'Feature flags activos': orgDoc.exists() && orgDoc.data()?.featureFlags?.FEATURE_DASHBOARD_360 === true,
      'Miembro configurado': memberFound,
      'Datos de prueba': campaignsSnapshot.size > 0
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('\n✅ TODO LISTO PARA SMOKE TESTS');
    } else {
      console.log('\n⚠️  FALTAN CONFIGURACIONES');
      console.log('Ejecuta los siguientes scripts según sea necesario:');
      if (!memberFound) {
        console.log('- Configura el miembro manualmente en Firebase Console');
      }
      if (campaignsSnapshot.size === 0) {
        console.log('- node scripts/seed-phase2-web.js');
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
verifySetup();














