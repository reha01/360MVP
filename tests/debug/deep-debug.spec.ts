/**
 * Debug profundo para entender por qué los componentes no se renderizan
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Deep debug: What renders on /bulk-actions', async ({ page }) => {
  console.log('🔍 Debug profundo de /bulk-actions...\n');
  
  // Capturar todos los logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  // Ir a bulk-actions
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Esperar que se ejecuten todos los hooks
  
  // Obtener información completa de la página
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.textContent.substring(0, 500),
      localStorage: {
        uid: localStorage.getItem('360mvp_user_uid'),
        email: localStorage.getItem('360mvp_user_email'),
        selectedOrgId: localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'),
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing'
      },
      elements: {
        bulkActionsManager: !!document.querySelector('[data-testid="bulk-actions-manager"]'),
        funcionNoDisponible: !!document.querySelector('text=Función no disponible') || document.body.textContent.includes('no disponible'),
        loadingSpinner: !!document.querySelector('.loading-spinner') || document.body.textContent.includes('Cargando'),
        errorMessage: !!document.querySelector('[data-testid="error"]') || document.body.textContent.includes('Error'),
        authError: document.body.textContent.includes('No autenticado') || document.body.textContent.includes('Iniciar sesión')
      }
    };
  });
  
  console.log('📊 Información de la página:');
  console.log('   URL:', pageInfo.url);
  console.log('   Título:', pageInfo.title);
  console.log('\n🔐 Estado de autenticación:');
  console.log('   UID:', pageInfo.localStorage.uid);
  console.log('   Email:', pageInfo.localStorage.email);
  console.log('   Selected Org:', pageInfo.localStorage.selectedOrgId);
  console.log('   Auth User:', pageInfo.localStorage.authUser);
  
  console.log('\n🎯 Elementos encontrados:');
  console.log('   bulk-actions-manager:', pageInfo.elements.bulkActionsManager ? '✅' : '❌');
  console.log('   Función no disponible:', pageInfo.elements.funcionNoDisponible ? '⚠️' : '❌');
  console.log('   Loading spinner:', pageInfo.elements.loadingSpinner ? '⏳' : '❌');
  console.log('   Error message:', pageInfo.elements.errorMessage ? '❌' : '✅');
  console.log('   Auth error:', pageInfo.elements.authError ? '🚨' : '✅');
  
  console.log('\n📄 Contenido de la página (primeros 500 chars):');
  console.log('   ', pageInfo.bodyText);
  
  // Filtrar logs relevantes
  const relevantLogs = logs.filter(log => 
    log.text.includes('FeatureFlags') || 
    log.text.includes('OrgContext') || 
    log.text.includes('useRuntimeFeatureFlags') ||
    log.text.includes('pilot-org-santiago') ||
    log.text.includes('FEATURE_BULK_ACTIONS')
  );
  
  if (relevantLogs.length > 0) {
    console.log('\n📝 Logs relevantes:');
    relevantLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // El test debe fallar si no encuentra el componente, para que podamos ver el debug
  console.log('\n🎯 Resultado del debug:');
  if (pageInfo.elements.bulkActionsManager) {
    console.log('✅ BulkActionsManager se renderiza correctamente');
  } else if (pageInfo.elements.funcionNoDisponible) {
    console.log('⚠️ Muestra mensaje "Función no disponible" - Feature flag OFF');
  } else if (pageInfo.elements.authError) {
    console.log('🚨 Error de autenticación - Usuario no logueado');
  } else if (pageInfo.elements.loadingSpinner) {
    console.log('⏳ Página en estado de carga');
  } else {
    console.log('❓ Estado desconocido - Ver contenido de página arriba');
  }
  
  // Permitir que el test falle para ver el debug completo
  expect(pageInfo.elements.bulkActionsManager).toBeTruthy();
});






 * Debug profundo para entender por qué los componentes no se renderizan
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Deep debug: What renders on /bulk-actions', async ({ page }) => {
  console.log('🔍 Debug profundo de /bulk-actions...\n');
  
  // Capturar todos los logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  // Ir a bulk-actions
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Esperar que se ejecuten todos los hooks
  
  // Obtener información completa de la página
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.textContent.substring(0, 500),
      localStorage: {
        uid: localStorage.getItem('360mvp_user_uid'),
        email: localStorage.getItem('360mvp_user_email'),
        selectedOrgId: localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'),
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing'
      },
      elements: {
        bulkActionsManager: !!document.querySelector('[data-testid="bulk-actions-manager"]'),
        funcionNoDisponible: !!document.querySelector('text=Función no disponible') || document.body.textContent.includes('no disponible'),
        loadingSpinner: !!document.querySelector('.loading-spinner') || document.body.textContent.includes('Cargando'),
        errorMessage: !!document.querySelector('[data-testid="error"]') || document.body.textContent.includes('Error'),
        authError: document.body.textContent.includes('No autenticado') || document.body.textContent.includes('Iniciar sesión')
      }
    };
  });
  
  console.log('📊 Información de la página:');
  console.log('   URL:', pageInfo.url);
  console.log('   Título:', pageInfo.title);
  console.log('\n🔐 Estado de autenticación:');
  console.log('   UID:', pageInfo.localStorage.uid);
  console.log('   Email:', pageInfo.localStorage.email);
  console.log('   Selected Org:', pageInfo.localStorage.selectedOrgId);
  console.log('   Auth User:', pageInfo.localStorage.authUser);
  
  console.log('\n🎯 Elementos encontrados:');
  console.log('   bulk-actions-manager:', pageInfo.elements.bulkActionsManager ? '✅' : '❌');
  console.log('   Función no disponible:', pageInfo.elements.funcionNoDisponible ? '⚠️' : '❌');
  console.log('   Loading spinner:', pageInfo.elements.loadingSpinner ? '⏳' : '❌');
  console.log('   Error message:', pageInfo.elements.errorMessage ? '❌' : '✅');
  console.log('   Auth error:', pageInfo.elements.authError ? '🚨' : '✅');
  
  console.log('\n📄 Contenido de la página (primeros 500 chars):');
  console.log('   ', pageInfo.bodyText);
  
  // Filtrar logs relevantes
  const relevantLogs = logs.filter(log => 
    log.text.includes('FeatureFlags') || 
    log.text.includes('OrgContext') || 
    log.text.includes('useRuntimeFeatureFlags') ||
    log.text.includes('pilot-org-santiago') ||
    log.text.includes('FEATURE_BULK_ACTIONS')
  );
  
  if (relevantLogs.length > 0) {
    console.log('\n📝 Logs relevantes:');
    relevantLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // El test debe fallar si no encuentra el componente, para que podamos ver el debug
  console.log('\n🎯 Resultado del debug:');
  if (pageInfo.elements.bulkActionsManager) {
    console.log('✅ BulkActionsManager se renderiza correctamente');
  } else if (pageInfo.elements.funcionNoDisponible) {
    console.log('⚠️ Muestra mensaje "Función no disponible" - Feature flag OFF');
  } else if (pageInfo.elements.authError) {
    console.log('🚨 Error de autenticación - Usuario no logueado');
  } else if (pageInfo.elements.loadingSpinner) {
    console.log('⏳ Página en estado de carga');
  } else {
    console.log('❓ Estado desconocido - Ver contenido de página arriba');
  }
  
  // Permitir que el test falle para ver el debug completo
  expect(pageInfo.elements.bulkActionsManager).toBeTruthy();
});






 * Debug profundo para entender por qué los componentes no se renderizan
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Deep debug: What renders on /bulk-actions', async ({ page }) => {
  console.log('🔍 Debug profundo de /bulk-actions...\n');
  
  // Capturar todos los logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  // Ir a bulk-actions
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Esperar que se ejecuten todos los hooks
  
  // Obtener información completa de la página
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.textContent.substring(0, 500),
      localStorage: {
        uid: localStorage.getItem('360mvp_user_uid'),
        email: localStorage.getItem('360mvp_user_email'),
        selectedOrgId: localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'),
        authUser: localStorage.getItem('firebase:authUser:AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ:[DEFAULT]') ? 'present' : 'missing'
      },
      elements: {
        bulkActionsManager: !!document.querySelector('[data-testid="bulk-actions-manager"]'),
        funcionNoDisponible: !!document.querySelector('text=Función no disponible') || document.body.textContent.includes('no disponible'),
        loadingSpinner: !!document.querySelector('.loading-spinner') || document.body.textContent.includes('Cargando'),
        errorMessage: !!document.querySelector('[data-testid="error"]') || document.body.textContent.includes('Error'),
        authError: document.body.textContent.includes('No autenticado') || document.body.textContent.includes('Iniciar sesión')
      }
    };
  });
  
  console.log('📊 Información de la página:');
  console.log('   URL:', pageInfo.url);
  console.log('   Título:', pageInfo.title);
  console.log('\n🔐 Estado de autenticación:');
  console.log('   UID:', pageInfo.localStorage.uid);
  console.log('   Email:', pageInfo.localStorage.email);
  console.log('   Selected Org:', pageInfo.localStorage.selectedOrgId);
  console.log('   Auth User:', pageInfo.localStorage.authUser);
  
  console.log('\n🎯 Elementos encontrados:');
  console.log('   bulk-actions-manager:', pageInfo.elements.bulkActionsManager ? '✅' : '❌');
  console.log('   Función no disponible:', pageInfo.elements.funcionNoDisponible ? '⚠️' : '❌');
  console.log('   Loading spinner:', pageInfo.elements.loadingSpinner ? '⏳' : '❌');
  console.log('   Error message:', pageInfo.elements.errorMessage ? '❌' : '✅');
  console.log('   Auth error:', pageInfo.elements.authError ? '🚨' : '✅');
  
  console.log('\n📄 Contenido de la página (primeros 500 chars):');
  console.log('   ', pageInfo.bodyText);
  
  // Filtrar logs relevantes
  const relevantLogs = logs.filter(log => 
    log.text.includes('FeatureFlags') || 
    log.text.includes('OrgContext') || 
    log.text.includes('useRuntimeFeatureFlags') ||
    log.text.includes('pilot-org-santiago') ||
    log.text.includes('FEATURE_BULK_ACTIONS')
  );
  
  if (relevantLogs.length > 0) {
    console.log('\n📝 Logs relevantes:');
    relevantLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // El test debe fallar si no encuentra el componente, para que podamos ver el debug
  console.log('\n🎯 Resultado del debug:');
  if (pageInfo.elements.bulkActionsManager) {
    console.log('✅ BulkActionsManager se renderiza correctamente');
  } else if (pageInfo.elements.funcionNoDisponible) {
    console.log('⚠️ Muestra mensaje "Función no disponible" - Feature flag OFF');
  } else if (pageInfo.elements.authError) {
    console.log('🚨 Error de autenticación - Usuario no logueado');
  } else if (pageInfo.elements.loadingSpinner) {
    console.log('⏳ Página en estado de carga');
  } else {
    console.log('❓ Estado desconocido - Ver contenido de página arriba');
  }
  
  // Permitir que el test falle para ver el debug completo
  expect(pageInfo.elements.bulkActionsManager).toBeTruthy();
});






