/**
 * Script para habilitar el feature flag FEATURE_BULK_ACTIONS en Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

// Configuración de Firebase (staging)
const firebaseConfig = {
  apiKey: "AIzaSyDipMh3y0w3j5O9Z3kDZ00Q28jvOCCgj70",
  authDomain: "mvp-staging-3e1cd.firebaseapp.com",
  projectId: "mvp-staging-3e1cd",
  storageBucket: "mvp-staging-3e1cd.firebasestorage.app",
  messagingSenderId: "663565074472",
  appId: "1:663565074472:web:ba5a7b6e0fbb2a5f94cb30"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function enableBulkActionsFlag() {
  try {
    console.log('🚩 Habilitando FEATURE_BULK_ACTIONS para pilot-org-santiago...');
    
    const orgId = 'pilot-org-santiago';
    const orgRef = doc(db, 'organizations', orgId);
    
    // Verificar que la organización existe
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
      console.error(`❌ Organización ${orgId} no encontrada`);
      process.exit(1);
    }
    
    console.log(`✅ Organización encontrada: ${orgId}`);
    
    // Obtener flags actuales
    const orgData = orgDoc.data();
    const currentFlags = orgData.featureFlags || {};
    
    console.log('📊 Feature flags actuales:', currentFlags);
    
    // Actualizar con el nuevo flag
    const updatedFlags = {
      ...currentFlags,
      FEATURE_BULK_ACTIONS: true,
      FEATURE_DASHBOARD_360: true,
      FEATURE_CAMPAIGN_COMPARISON: true,
      FEATURE_ORG_POLICIES: true,
      FEATURE_OPERATIONAL_ALERTS: true
    };
    
    await updateDoc(orgRef, {
      featureFlags: updatedFlags,
      updatedAt: new Date()
    });
    
    console.log('✅ Feature flags actualizados:', updatedFlags);
    console.log('');
    console.log('🎉 FEATURE_BULK_ACTIONS habilitado exitosamente!');
    console.log('');
    console.log('💡 Recarga la página en el navegador para ver los cambios.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableBulkActionsFlag();



