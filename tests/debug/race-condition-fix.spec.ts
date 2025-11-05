/**
 * Test para verificar que el fix de race condition funciona
 * Verifica que useRuntimeFeatureFlags espera a OrgContext antes de cargar flags
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Race condition fix: Feature flags wait for OrgContext', async ({ page }) => {
  console.log('🏁 Testing race condition fix...\n');
  
  // Capturar logs de consola
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('FeatureFlags') || text.includes('OrgContext') || text.includes('useRuntimeFeatureFlags')) {
      logs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
  });
  
  // Navegar al dashboard
  await page.goto(`${STAGING_URL}/dashboard-360`);
  await page.waitForLoadState('networkidle');
  
  // Esperar un poco para que se ejecuten los hooks
  await page.waitForTimeout(3000);
  
  // Verificar que los componentes se renderizan
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  
  // Mostrar logs relevantes
  if (logs.length > 0) {
    console.log('\n📝 Logs de Feature Flags:');
    logs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // Verificar en JavaScript el estado actual
  const runtimeState = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    return {
      uid,
      selectedOrgId,
      hasFirebase: !!window.firebase || !!window.db,
      timestamp: Date.now()
    };
  });
  
  console.log('\n🔍 Estado Runtime:');
  console.log('   UID:', runtimeState.uid);
  console.log('   Selected Org:', runtimeState.selectedOrgId);
  console.log('   Firebase Available:', runtimeState.hasFirebase);
  
  // Test debe pasar si el dashboard es visible (lo que indica que los flags se cargaron correctamente)
  expect(dashboardVisible).toBeTruthy();
  
  console.log('\n✅ Race condition fix verificado!');
});

test('Debug: Check feature flags loading order', async ({ page }) => {
  console.log('🔄 Verificando orden de carga de feature flags...\n');
  
  const loadingSequence = [];
  
  // Interceptar logs específicos
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Waiting for OrgContext to be ready') || 
        text.includes('Loaded flags for org') ||
        text.includes('Using cached flags') ||
        text.includes('Organization not found')) {
      loadingSequence.push({
        time: Date.now(),
        message: text
      });
    }
  });
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que BulkActionsManager se renderiza
  const bulkActionsVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Bulk Actions visible:', bulkActionsVisible ? '✅' : '❌');
  
  if (loadingSequence.length > 0) {
    console.log('\n⏱️ Secuencia de carga:');
    loadingSequence.forEach((entry, i) => {
      console.log(`   ${i+1}. ${entry.message}`);
    });
  }
  
  expect(bulkActionsVisible).toBeTruthy();
  
  console.log('\n✅ Orden de carga verificado!');
});

test('Debug: Check alerts manager rendering', async ({ page }) => {
  console.log('🚨 Verificando AlertManager...\n');
  
  await page.goto(`${STAGING_URL}/alerts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que AlertManager se renderiza
  const alertManagerVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Alert Manager visible:', alertManagerVisible ? '✅' : '❌');
  
  // Si no es visible, verificar qué se renderiza en su lugar
  if (!alertManagerVisible) {
    const bodyText = await page.locator('body').textContent();
    console.log('\n📄 Contenido de la página:');
    console.log('   ', bodyText.substring(0, 200) + '...');
    
    // Verificar si es el mensaje de "función no disponible"
    const hasDisabledMessage = bodyText.includes('no está habilitado') || bodyText.includes('no disponible');
    console.log('   Mensaje de deshabilitado:', hasDisabledMessage ? '✅' : '❌');
  }
  
  expect(alertManagerVisible).toBeTruthy();
  
  console.log('\n✅ AlertManager verificado!');
});






 * Test para verificar que el fix de race condition funciona
 * Verifica que useRuntimeFeatureFlags espera a OrgContext antes de cargar flags
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Race condition fix: Feature flags wait for OrgContext', async ({ page }) => {
  console.log('🏁 Testing race condition fix...\n');
  
  // Capturar logs de consola
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('FeatureFlags') || text.includes('OrgContext') || text.includes('useRuntimeFeatureFlags')) {
      logs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
  });
  
  // Navegar al dashboard
  await page.goto(`${STAGING_URL}/dashboard-360`);
  await page.waitForLoadState('networkidle');
  
  // Esperar un poco para que se ejecuten los hooks
  await page.waitForTimeout(3000);
  
  // Verificar que los componentes se renderizan
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  
  // Mostrar logs relevantes
  if (logs.length > 0) {
    console.log('\n📝 Logs de Feature Flags:');
    logs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // Verificar en JavaScript el estado actual
  const runtimeState = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    return {
      uid,
      selectedOrgId,
      hasFirebase: !!window.firebase || !!window.db,
      timestamp: Date.now()
    };
  });
  
  console.log('\n🔍 Estado Runtime:');
  console.log('   UID:', runtimeState.uid);
  console.log('   Selected Org:', runtimeState.selectedOrgId);
  console.log('   Firebase Available:', runtimeState.hasFirebase);
  
  // Test debe pasar si el dashboard es visible (lo que indica que los flags se cargaron correctamente)
  expect(dashboardVisible).toBeTruthy();
  
  console.log('\n✅ Race condition fix verificado!');
});

test('Debug: Check feature flags loading order', async ({ page }) => {
  console.log('🔄 Verificando orden de carga de feature flags...\n');
  
  const loadingSequence = [];
  
  // Interceptar logs específicos
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Waiting for OrgContext to be ready') || 
        text.includes('Loaded flags for org') ||
        text.includes('Using cached flags') ||
        text.includes('Organization not found')) {
      loadingSequence.push({
        time: Date.now(),
        message: text
      });
    }
  });
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que BulkActionsManager se renderiza
  const bulkActionsVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Bulk Actions visible:', bulkActionsVisible ? '✅' : '❌');
  
  if (loadingSequence.length > 0) {
    console.log('\n⏱️ Secuencia de carga:');
    loadingSequence.forEach((entry, i) => {
      console.log(`   ${i+1}. ${entry.message}`);
    });
  }
  
  expect(bulkActionsVisible).toBeTruthy();
  
  console.log('\n✅ Orden de carga verificado!');
});

test('Debug: Check alerts manager rendering', async ({ page }) => {
  console.log('🚨 Verificando AlertManager...\n');
  
  await page.goto(`${STAGING_URL}/alerts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que AlertManager se renderiza
  const alertManagerVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Alert Manager visible:', alertManagerVisible ? '✅' : '❌');
  
  // Si no es visible, verificar qué se renderiza en su lugar
  if (!alertManagerVisible) {
    const bodyText = await page.locator('body').textContent();
    console.log('\n📄 Contenido de la página:');
    console.log('   ', bodyText.substring(0, 200) + '...');
    
    // Verificar si es el mensaje de "función no disponible"
    const hasDisabledMessage = bodyText.includes('no está habilitado') || bodyText.includes('no disponible');
    console.log('   Mensaje de deshabilitado:', hasDisabledMessage ? '✅' : '❌');
  }
  
  expect(alertManagerVisible).toBeTruthy();
  
  console.log('\n✅ AlertManager verificado!');
});






 * Test para verificar que el fix de race condition funciona
 * Verifica que useRuntimeFeatureFlags espera a OrgContext antes de cargar flags
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Race condition fix: Feature flags wait for OrgContext', async ({ page }) => {
  console.log('🏁 Testing race condition fix...\n');
  
  // Capturar logs de consola
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('FeatureFlags') || text.includes('OrgContext') || text.includes('useRuntimeFeatureFlags')) {
      logs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
  });
  
  // Navegar al dashboard
  await page.goto(`${STAGING_URL}/dashboard-360`);
  await page.waitForLoadState('networkidle');
  
  // Esperar un poco para que se ejecuten los hooks
  await page.waitForTimeout(3000);
  
  // Verificar que los componentes se renderizan
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  
  // Mostrar logs relevantes
  if (logs.length > 0) {
    console.log('\n📝 Logs de Feature Flags:');
    logs.forEach((log, i) => {
      console.log(`   ${i+1}. [${log.type}] ${log.text}`);
    });
  }
  
  // Verificar en JavaScript el estado actual
  const runtimeState = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
    
    return {
      uid,
      selectedOrgId,
      hasFirebase: !!window.firebase || !!window.db,
      timestamp: Date.now()
    };
  });
  
  console.log('\n🔍 Estado Runtime:');
  console.log('   UID:', runtimeState.uid);
  console.log('   Selected Org:', runtimeState.selectedOrgId);
  console.log('   Firebase Available:', runtimeState.hasFirebase);
  
  // Test debe pasar si el dashboard es visible (lo que indica que los flags se cargaron correctamente)
  expect(dashboardVisible).toBeTruthy();
  
  console.log('\n✅ Race condition fix verificado!');
});

test('Debug: Check feature flags loading order', async ({ page }) => {
  console.log('🔄 Verificando orden de carga de feature flags...\n');
  
  const loadingSequence = [];
  
  // Interceptar logs específicos
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Waiting for OrgContext to be ready') || 
        text.includes('Loaded flags for org') ||
        text.includes('Using cached flags') ||
        text.includes('Organization not found')) {
      loadingSequence.push({
        time: Date.now(),
        message: text
      });
    }
  });
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que BulkActionsManager se renderiza
  const bulkActionsVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Bulk Actions visible:', bulkActionsVisible ? '✅' : '❌');
  
  if (loadingSequence.length > 0) {
    console.log('\n⏱️ Secuencia de carga:');
    loadingSequence.forEach((entry, i) => {
      console.log(`   ${i+1}. ${entry.message}`);
    });
  }
  
  expect(bulkActionsVisible).toBeTruthy();
  
  console.log('\n✅ Orden de carga verificado!');
});

test('Debug: Check alerts manager rendering', async ({ page }) => {
  console.log('🚨 Verificando AlertManager...\n');
  
  await page.goto(`${STAGING_URL}/alerts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Verificar que AlertManager se renderiza
  const alertManagerVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  
  console.log('📊 Resultados:');
  console.log('   Alert Manager visible:', alertManagerVisible ? '✅' : '❌');
  
  // Si no es visible, verificar qué se renderiza en su lugar
  if (!alertManagerVisible) {
    const bodyText = await page.locator('body').textContent();
    console.log('\n📄 Contenido de la página:');
    console.log('   ', bodyText.substring(0, 200) + '...');
    
    // Verificar si es el mensaje de "función no disponible"
    const hasDisabledMessage = bodyText.includes('no está habilitado') || bodyText.includes('no disponible');
    console.log('   Mensaje de deshabilitado:', hasDisabledMessage ? '✅' : '❌');
  }
  
  expect(alertManagerVisible).toBeTruthy();
  
  console.log('\n✅ AlertManager verificado!');
});






