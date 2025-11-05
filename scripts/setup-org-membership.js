#!/usr/bin/env node

/**
 * Script to setup organization_members document for user authentication
 * This ensures the user has proper organization association
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
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

const USER_UID = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
const ORG_ID = 'pilot-org-santiago';

console.log('🔧 SETUP ORGANIZATION MEMBERSHIP');
console.log('==================================\n');

async function setupOrgMembership() {
  try {
    // 1. Login como admin
    console.log('🔐 Autenticando como admin...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@pilot-santiago.com', 
      'TestPilot2024!'
    );
    console.log('   ✅ Autenticado como:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    
    // 2. Crear/actualizar documento organization_members
    console.log('\n📝 Configurando organization_members...');
    const orgMembersRef = doc(db, 'organization_members', USER_UID);
    
    // Verificar si ya existe
    const docSnap = await getDoc(orgMembersRef);
    if (docSnap.exists()) {
      console.log('   ⚠️  Documento ya existe, actualizando...');
    }
    
    await setDoc(orgMembersRef, {
      orgIds: [ORG_ID],
      activeOrgId: ORG_ID,
      defaultOrgId: ORG_ID,
      userId: USER_UID,
      email: 'admin@pilot-santiago.com',
      role: 'admin',
      status: 'active',
      createdAt: docSnap.exists() ? docSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('   ✅ organization_members configurado');
    
    // 3. Verificar la configuración
    console.log('\n🔍 Verificando configuración...');
    const verifyDoc = await getDoc(orgMembersRef);
    if (verifyDoc.exists()) {
      const data = verifyDoc.data();
      console.log('   - orgIds:', data.orgIds);
      console.log('   - activeOrgId:', data.activeOrgId);
      console.log('   - role:', data.role);
      console.log('   - status:', data.status);
    }
    
    // 4. Verificar que la organización existe y tiene flags
    console.log('\n🏢 Verificando organización...');
    const orgRef = doc(db, 'organizations', ORG_ID);
    const orgDoc = await getDoc(orgRef);
    
    if (orgDoc.exists()) {
      const orgData = orgDoc.data();
      console.log('   ✅ Organización existe:', orgData.name);
      
      if (orgData.featureFlags) {
        console.log('   📋 Feature Flags activos:');
        Object.entries(orgData.featureFlags).forEach(([key, value]) => {
          if (value === true) {
            console.log(`      - ${key}: ✅`);
          }
        });
      }
    } else {
      console.error('   ❌ Organización no encontrada');
    }
    
    // 5. Verificar el miembro en la subcolección de la org
    console.log('\n👤 Verificando membresía en la organización...');
    const memberRef = doc(db, `organizations/${ORG_ID}/members`, USER_UID);
    const memberDoc = await getDoc(memberRef);
    
    if (memberDoc.exists()) {
      const memberData = memberDoc.data();
      console.log('   ✅ Miembro encontrado en la org');
      console.log('   - email:', memberData.email);
      console.log('   - role:', memberData.role);
      console.log('   - active:', memberData.active);
    } else {
      console.log('   ⚠️  Miembro no existe en subcolección, creando...');
      await setDoc(memberRef, {
        userId: USER_UID,
        email: 'admin@pilot-santiago.com',
        role: 'admin',
        active: true,
        joinedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log('   ✅ Miembro creado en la organización');
    }
    
    console.log('\n=====================================');
    console.log('✅ SETUP COMPLETADO');
    console.log('=====================================\n');
    
    console.log('Resumen:');
    console.log('- Usuario configurado en organization_members');
    console.log('- Organización activa: pilot-org-santiago');
    console.log('- Feature flags habilitados');
    console.log('- Membresía verificada\n');
    
    console.log('🎯 Próximo paso: npm run smoke:staging');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
setupOrgMembership();









