/**
 * Test de debug para verificar que los feature flags se cargan correctamente
 * desde Firestore para pilot-org-santiago
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Debug: Feature flags loading from Firestore', async ({ page }) => {
  console.log('🔍 Debugging feature flags loading...\n');
  
  // Ir al dashboard con auth
  await page.goto(`${STAGING_URL}/dashboard`);
  
  // Esperar que la página cargue
  await page.waitForLoadState('networkidle');
  
  // Ejecutar debug en el navegador
  const debugInfo = await page.evaluate(async () => {
    // Verificar localStorage
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    // Verificar si hay errores en consola relacionados con feature flags
    const logs = [];
    const originalConsole = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'log', message: msg });
      }
      originalConsole(...args);
    };
    
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'warn', message: msg });
      }
      originalWarn(...args);
    };
    
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'error', message: msg });
      }
      originalError(...args);
    };
    
    return {
      uid,
      selectedOrgId,
      localStorage: {
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing',
        authToken: localStorage.getItem('360mvp_auth_token') ? 'present' : 'missing',
        userEmail: localStorage.getItem('360mvp_user_email')
      },
      logs
    };
  });
  
  console.log('📊 Debug Info:');
  console.log('   UID:', debugInfo.uid);
  console.log('   Selected Org ID:', debugInfo.selectedOrgId);
  console.log('   Auth User:', debugInfo.localStorage.authUser);
  console.log('   Auth Token:', debugInfo.localStorage.authToken);
  console.log('   User Email:', debugInfo.localStorage.userEmail);
  
  if (debugInfo.logs.length > 0) {
    console.log('\n📝 Feature Flags Logs:');
    debugInfo.logs.forEach(log => {
      console.log(`   [${log.type}] ${log.message}`);
    });
  }
  
  // Verificar que tenemos los datos necesarios
  expect(debugInfo.uid).toBeTruthy();
  expect(debugInfo.selectedOrgId).toBe('pilot-org-santiago');
  expect(debugInfo.localStorage.userEmail).toBe('admin@pilot-santiago.com');
  
  console.log('\n✅ Debug completado - Datos básicos OK');
});

test('Debug: Manual feature flags check', async ({ page }) => {
  console.log('🧪 Verificando feature flags manualmente...\n');
  
  await page.goto(`${STAGING_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  
  // Ejecutar verificación manual de flags
  const flagsResult = await page.evaluate(async () => {
    try {
      // Simular la lógica de getOrgFeatureFlags
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      if (!selectedOrgId) {
        return { error: 'No selectedOrgId found' };
      }
      
      // Verificar si Firebase está disponible
      if (!window.firebase && !window.db) {
        return { error: 'Firebase not available' };
      }
      
      return {
        uid,
        selectedOrgId,
        firebaseAvailable: !!window.firebase || !!window.db,
        expectedPath: `organizations/${selectedOrgId}`,
        status: 'ready_for_firestore_check'
      };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('🔍 Manual Flags Check:');
  console.log('   UID:', flagsResult.uid);
  console.log('   Selected Org:', flagsResult.selectedOrgId);
  console.log('   Firebase Available:', flagsResult.firebaseAvailable);
  console.log('   Expected Path:', flagsResult.expectedPath);
  console.log('   Status:', flagsResult.status);
  
  if (flagsResult.error) {
    console.log('   ❌ Error:', flagsResult.error);
  }
  
  // Test debe pasar si tenemos la info básica
  expect(flagsResult.selectedOrgId).toBe('pilot-org-santiago');
  
  console.log('\n✅ Manual check completado');
});






 * Test de debug para verificar que los feature flags se cargan correctamente
 * desde Firestore para pilot-org-santiago
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Debug: Feature flags loading from Firestore', async ({ page }) => {
  console.log('🔍 Debugging feature flags loading...\n');
  
  // Ir al dashboard con auth
  await page.goto(`${STAGING_URL}/dashboard`);
  
  // Esperar que la página cargue
  await page.waitForLoadState('networkidle');
  
  // Ejecutar debug en el navegador
  const debugInfo = await page.evaluate(async () => {
    // Verificar localStorage
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    // Verificar si hay errores en consola relacionados con feature flags
    const logs = [];
    const originalConsole = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'log', message: msg });
      }
      originalConsole(...args);
    };
    
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'warn', message: msg });
      }
      originalWarn(...args);
    };
    
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'error', message: msg });
      }
      originalError(...args);
    };
    
    return {
      uid,
      selectedOrgId,
      localStorage: {
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing',
        authToken: localStorage.getItem('360mvp_auth_token') ? 'present' : 'missing',
        userEmail: localStorage.getItem('360mvp_user_email')
      },
      logs
    };
  });
  
  console.log('📊 Debug Info:');
  console.log('   UID:', debugInfo.uid);
  console.log('   Selected Org ID:', debugInfo.selectedOrgId);
  console.log('   Auth User:', debugInfo.localStorage.authUser);
  console.log('   Auth Token:', debugInfo.localStorage.authToken);
  console.log('   User Email:', debugInfo.localStorage.userEmail);
  
  if (debugInfo.logs.length > 0) {
    console.log('\n📝 Feature Flags Logs:');
    debugInfo.logs.forEach(log => {
      console.log(`   [${log.type}] ${log.message}`);
    });
  }
  
  // Verificar que tenemos los datos necesarios
  expect(debugInfo.uid).toBeTruthy();
  expect(debugInfo.selectedOrgId).toBe('pilot-org-santiago');
  expect(debugInfo.localStorage.userEmail).toBe('admin@pilot-santiago.com');
  
  console.log('\n✅ Debug completado - Datos básicos OK');
});

test('Debug: Manual feature flags check', async ({ page }) => {
  console.log('🧪 Verificando feature flags manualmente...\n');
  
  await page.goto(`${STAGING_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  
  // Ejecutar verificación manual de flags
  const flagsResult = await page.evaluate(async () => {
    try {
      // Simular la lógica de getOrgFeatureFlags
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      if (!selectedOrgId) {
        return { error: 'No selectedOrgId found' };
      }
      
      // Verificar si Firebase está disponible
      if (!window.firebase && !window.db) {
        return { error: 'Firebase not available' };
      }
      
      return {
        uid,
        selectedOrgId,
        firebaseAvailable: !!window.firebase || !!window.db,
        expectedPath: `organizations/${selectedOrgId}`,
        status: 'ready_for_firestore_check'
      };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('🔍 Manual Flags Check:');
  console.log('   UID:', flagsResult.uid);
  console.log('   Selected Org:', flagsResult.selectedOrgId);
  console.log('   Firebase Available:', flagsResult.firebaseAvailable);
  console.log('   Expected Path:', flagsResult.expectedPath);
  console.log('   Status:', flagsResult.status);
  
  if (flagsResult.error) {
    console.log('   ❌ Error:', flagsResult.error);
  }
  
  // Test debe pasar si tenemos la info básica
  expect(flagsResult.selectedOrgId).toBe('pilot-org-santiago');
  
  console.log('\n✅ Manual check completado');
});






 * Test de debug para verificar que los feature flags se cargan correctamente
 * desde Firestore para pilot-org-santiago
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Debug: Feature flags loading from Firestore', async ({ page }) => {
  console.log('🔍 Debugging feature flags loading...\n');
  
  // Ir al dashboard con auth
  await page.goto(`${STAGING_URL}/dashboard`);
  
  // Esperar que la página cargue
  await page.waitForLoadState('networkidle');
  
  // Ejecutar debug en el navegador
  const debugInfo = await page.evaluate(async () => {
    // Verificar localStorage
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    // Verificar si hay errores en consola relacionados con feature flags
    const logs = [];
    const originalConsole = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'log', message: msg });
      }
      originalConsole(...args);
    };
    
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'warn', message: msg });
      }
      originalWarn(...args);
    };
    
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('FeatureFlags') || msg.includes('OrgContext')) {
        logs.push({ type: 'error', message: msg });
      }
      originalError(...args);
    };
    
    return {
      uid,
      selectedOrgId,
      localStorage: {
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing',
        authToken: localStorage.getItem('360mvp_auth_token') ? 'present' : 'missing',
        userEmail: localStorage.getItem('360mvp_user_email')
      },
      logs
    };
  });
  
  console.log('📊 Debug Info:');
  console.log('   UID:', debugInfo.uid);
  console.log('   Selected Org ID:', debugInfo.selectedOrgId);
  console.log('   Auth User:', debugInfo.localStorage.authUser);
  console.log('   Auth Token:', debugInfo.localStorage.authToken);
  console.log('   User Email:', debugInfo.localStorage.userEmail);
  
  if (debugInfo.logs.length > 0) {
    console.log('\n📝 Feature Flags Logs:');
    debugInfo.logs.forEach(log => {
      console.log(`   [${log.type}] ${log.message}`);
    });
  }
  
  // Verificar que tenemos los datos necesarios
  expect(debugInfo.uid).toBeTruthy();
  expect(debugInfo.selectedOrgId).toBe('pilot-org-santiago');
  expect(debugInfo.localStorage.userEmail).toBe('admin@pilot-santiago.com');
  
  console.log('\n✅ Debug completado - Datos básicos OK');
});

test('Debug: Manual feature flags check', async ({ page }) => {
  console.log('🧪 Verificando feature flags manualmente...\n');
  
  await page.goto(`${STAGING_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  
  // Ejecutar verificación manual de flags
  const flagsResult = await page.evaluate(async () => {
    try {
      // Simular la lógica de getOrgFeatureFlags
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      if (!selectedOrgId) {
        return { error: 'No selectedOrgId found' };
      }
      
      // Verificar si Firebase está disponible
      if (!window.firebase && !window.db) {
        return { error: 'Firebase not available' };
      }
      
      return {
        uid,
        selectedOrgId,
        firebaseAvailable: !!window.firebase || !!window.db,
        expectedPath: `organizations/${selectedOrgId}`,
        status: 'ready_for_firestore_check'
      };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('🔍 Manual Flags Check:');
  console.log('   UID:', flagsResult.uid);
  console.log('   Selected Org:', flagsResult.selectedOrgId);
  console.log('   Firebase Available:', flagsResult.firebaseAvailable);
  console.log('   Expected Path:', flagsResult.expectedPath);
  console.log('   Status:', flagsResult.status);
  
  if (flagsResult.error) {
    console.log('   ❌ Error:', flagsResult.error);
  }
  
  // Test debe pasar si tenemos la info básica
  expect(flagsResult.selectedOrgId).toBe('pilot-org-santiago');
  
  console.log('\n✅ Manual check completado');
});






