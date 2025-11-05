/**
 * Script para crear usuario de prueba en Staging
 * 
 * Uso:
 *   firebase use staging
 *   node scripts/create-staging-user.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
// NOTA: Este script requiere que estés autenticado con Firebase CLI
// Ejecuta: firebase login antes de usar este script
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'mvp-staging-3e1cd'
    });
  } catch (error) {
    console.error('⚠️  Error de credenciales. Intentando sin credenciales explícitas...');
    // Fallback: solo con projectId (usa credenciales del entorno)
    admin.initializeApp({
      projectId: 'mvp-staging-3e1cd'
    });
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function createUser() {
  console.log('🔐 Creando usuario en Firebase Auth...\n');
  
  const userEmail = 'admin@pilot-santiago.com';
  const userPassword = 'TestPilot2024!';
  const orgId = 'pilot-org-santiago';
  
  try {
    // Verificar si el usuario ya existe
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(userEmail);
      console.log(`✅ Usuario ya existe: ${userEmail}`);
      console.log(`   UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Crear usuario
        userRecord = await auth.createUser({
          email: userEmail,
          password: userPassword,
          displayName: 'Admin Santiago',
          emailVerified: true
        });
        console.log(`✅ Usuario creado: ${userEmail}`);
        console.log(`   UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }
    
    // Verificar/crear organización
    console.log(`\n🏢 Verificando organización: ${orgId}...`);
    const orgRef = db.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
      await orgRef.set({
        name: 'Pilot Org Santiago',
        timezone: 'America/Santiago',
        plan: 'starter',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        featureFlags: {
          FEATURE_BULK_ACTIONS: true,
          FEATURE_DASHBOARD_360: true,
          FEATURE_CAMPAIGN_COMPARISON: true,
          FEATURE_ORG_POLICIES: true,
          FEATURE_OPERATIONAL_ALERTS: true
        }
      });
      console.log(`✅ Organización creada: ${orgId}`);
    } else {
      // Actualizar feature flags
      await orgRef.update({
        featureFlags: {
          FEATURE_BULK_ACTIONS: true,
          FEATURE_DASHBOARD_360: true,
          FEATURE_CAMPAIGN_COMPARISON: true,
          FEATURE_ORG_POLICIES: true,
          FEATURE_OPERATIONAL_ALERTS: true
        }
      });
      console.log(`✅ Organización existe y feature flags actualizados`);
    }
    
    // Agregar usuario como miembro de la org
    console.log(`\n👤 Agregando usuario como admin de la org...`);
    const memberRef = db.collection('organizations').doc(orgId).collection('members').doc(userRecord.uid);
    const memberDoc = await memberRef.get();
    
    if (!memberDoc.exists) {
      await memberRef.set({
        email: userEmail,
        role: 'admin',
        active: true,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        displayName: 'Admin Santiago'
      });
      console.log(`✅ Usuario agregado como admin`);
    } else {
      await memberRef.update({
        role: 'admin',
        active: true
      });
      console.log(`✅ Usuario ya era miembro, rol actualizado a admin`);
    }
    
    console.log('\n✨ USUARIO LISTO PARA SMOKE TESTS\n');
    console.log('📋 Credenciales:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   Org ID: ${orgId}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log('\n🔗 URLs:');
    console.log(`   Staging: https://mvp-staging-3e1cd.web.app`);
    console.log(`   Login: https://mvp-staging-3e1cd.web.app/login`);
    console.log('\n▶️ Próximo paso:');
    console.log('   node scripts/seed-staging-data-real.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createUser();





    process.exit(1);
  }
}

createUser();





    process.exit(1);
  }
}

createUser();




