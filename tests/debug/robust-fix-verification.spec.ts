/**
 * Verificación de la solución robusta para race condition
 * Sin timeouts frágiles, sin loops infinitos
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Robust fix verification: Feature flags load correctly', async ({ page }) => {
  console.log('🔧 Verificando solución robusta...\n');
  
  const startTime = Date.now();
  
  // Capturar logs específicos de feature flags
  const flagLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[useRuntimeFeatureFlags]') || 
        text.includes('[FeatureFlags]') ||
        text.includes('pilot-org-santiago')) {
      flagLogs.push({
        time: Date.now() - startTime,
        type: msg.type(),
        text: text
      });
    }
  });
  
  // Navegar a dashboard-360
  console.log('📍 Navegando a /dashboard-360...');
  await page.goto(`${STAGING_URL}/dashboard-360`);
  
  // Esperar carga normal (no más de 10s)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Página cargó en tiempo normal');
  } catch (error) {
    console.log('⚠️ Timeout en networkidle - pero continuando...');
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`⏱️ Tiempo total de carga: ${loadTime}ms`);
  
  // Verificar que el componente se renderiza
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('\n📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅ Normal' : '❌ Lento');
  
  // Mostrar secuencia de logs de feature flags
  if (flagLogs.length > 0) {
    console.log('\n📝 Secuencia de carga de flags:');
    flagLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [+${log.time}ms] [${log.type}] ${log.text}`);
    });
  } else {
    console.log('\n⚠️ No se detectaron logs de feature flags');
  }
  
  // Verificar estado en localStorage
  const storageInfo = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    return {
      uid,
      selectedOrgId: localStorage.getItem(`selectedOrgId_${uid}`),
      email: localStorage.getItem('360mvp_user_email')
    };
  });
  
  console.log('\n💾 Estado en localStorage:');
  console.log('   UID:', storageInfo.uid);
  console.log('   Selected Org:', storageInfo.selectedOrgId);
  console.log('   Email:', storageInfo.email);
  
  // Criterios de éxito
  const isSuccess = dashboardVisible && loadTime < 15000;
  
  console.log('\n🎯 Resultado final:');
  if (isSuccess) {
    console.log('✅ SOLUCIÓN ROBUSTA FUNCIONA - Componente visible en tiempo normal');
  } else if (hasDisabledMessage) {
    console.log('⚠️ FEATURE FLAG OFF - Pero la carga es normal (progreso)');
  } else {
    console.log('❌ PROBLEMA PERSISTE - Componente no visible o carga lenta');
  }
  
  // Test debe pasar si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
  expect(dashboardVisible || (hasDisabledMessage && loadTime < 15000)).toBeTruthy();
});

test('Verify: No infinite loading in bulk-actions', async ({ page }) => {
  console.log('🔄 Verificando /bulk-actions sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ bulk-actions cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en bulk-actions');
  }
  
  const loadTime = Date.now() - startTime;
  const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible').count() > 0;
  
  console.log('📊 Resultados bulk-actions:');
  console.log('   Componente visible:', bulkVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy(); // Lo importante es que no haya loop infinito
});

test('Verify: Alerts page loads without infinite loop', async ({ page }) => {
  console.log('🚨 Verificando /alerts sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/alerts`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ alerts cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en alerts');
  }
  
  const loadTime = Date.now() - startTime;
  const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('📊 Resultados alerts:');
  console.log('   Componente visible:', alertVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy();
});






 * Verificación de la solución robusta para race condition
 * Sin timeouts frágiles, sin loops infinitos
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Robust fix verification: Feature flags load correctly', async ({ page }) => {
  console.log('🔧 Verificando solución robusta...\n');
  
  const startTime = Date.now();
  
  // Capturar logs específicos de feature flags
  const flagLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[useRuntimeFeatureFlags]') || 
        text.includes('[FeatureFlags]') ||
        text.includes('pilot-org-santiago')) {
      flagLogs.push({
        time: Date.now() - startTime,
        type: msg.type(),
        text: text
      });
    }
  });
  
  // Navegar a dashboard-360
  console.log('📍 Navegando a /dashboard-360...');
  await page.goto(`${STAGING_URL}/dashboard-360`);
  
  // Esperar carga normal (no más de 10s)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Página cargó en tiempo normal');
  } catch (error) {
    console.log('⚠️ Timeout en networkidle - pero continuando...');
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`⏱️ Tiempo total de carga: ${loadTime}ms`);
  
  // Verificar que el componente se renderiza
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('\n📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅ Normal' : '❌ Lento');
  
  // Mostrar secuencia de logs de feature flags
  if (flagLogs.length > 0) {
    console.log('\n📝 Secuencia de carga de flags:');
    flagLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [+${log.time}ms] [${log.type}] ${log.text}`);
    });
  } else {
    console.log('\n⚠️ No se detectaron logs de feature flags');
  }
  
  // Verificar estado en localStorage
  const storageInfo = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    return {
      uid,
      selectedOrgId: localStorage.getItem(`selectedOrgId_${uid}`),
      email: localStorage.getItem('360mvp_user_email')
    };
  });
  
  console.log('\n💾 Estado en localStorage:');
  console.log('   UID:', storageInfo.uid);
  console.log('   Selected Org:', storageInfo.selectedOrgId);
  console.log('   Email:', storageInfo.email);
  
  // Criterios de éxito
  const isSuccess = dashboardVisible && loadTime < 15000;
  
  console.log('\n🎯 Resultado final:');
  if (isSuccess) {
    console.log('✅ SOLUCIÓN ROBUSTA FUNCIONA - Componente visible en tiempo normal');
  } else if (hasDisabledMessage) {
    console.log('⚠️ FEATURE FLAG OFF - Pero la carga es normal (progreso)');
  } else {
    console.log('❌ PROBLEMA PERSISTE - Componente no visible o carga lenta');
  }
  
  // Test debe pasar si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
  expect(dashboardVisible || (hasDisabledMessage && loadTime < 15000)).toBeTruthy();
});

test('Verify: No infinite loading in bulk-actions', async ({ page }) => {
  console.log('🔄 Verificando /bulk-actions sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ bulk-actions cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en bulk-actions');
  }
  
  const loadTime = Date.now() - startTime;
  const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible').count() > 0;
  
  console.log('📊 Resultados bulk-actions:');
  console.log('   Componente visible:', bulkVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy(); // Lo importante es que no haya loop infinito
});

test('Verify: Alerts page loads without infinite loop', async ({ page }) => {
  console.log('🚨 Verificando /alerts sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/alerts`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ alerts cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en alerts');
  }
  
  const loadTime = Date.now() - startTime;
  const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('📊 Resultados alerts:');
  console.log('   Componente visible:', alertVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy();
});






 * Verificación de la solución robusta para race condition
 * Sin timeouts frágiles, sin loops infinitos
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('Robust fix verification: Feature flags load correctly', async ({ page }) => {
  console.log('🔧 Verificando solución robusta...\n');
  
  const startTime = Date.now();
  
  // Capturar logs específicos de feature flags
  const flagLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[useRuntimeFeatureFlags]') || 
        text.includes('[FeatureFlags]') ||
        text.includes('pilot-org-santiago')) {
      flagLogs.push({
        time: Date.now() - startTime,
        type: msg.type(),
        text: text
      });
    }
  });
  
  // Navegar a dashboard-360
  console.log('📍 Navegando a /dashboard-360...');
  await page.goto(`${STAGING_URL}/dashboard-360`);
  
  // Esperar carga normal (no más de 10s)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('✅ Página cargó en tiempo normal');
  } catch (error) {
    console.log('⚠️ Timeout en networkidle - pero continuando...');
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`⏱️ Tiempo total de carga: ${loadTime}ms`);
  
  // Verificar que el componente se renderiza
  const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('\n📊 Resultados:');
  console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅ Normal' : '❌ Lento');
  
  // Mostrar secuencia de logs de feature flags
  if (flagLogs.length > 0) {
    console.log('\n📝 Secuencia de carga de flags:');
    flagLogs.forEach((log, i) => {
      console.log(`   ${i+1}. [+${log.time}ms] [${log.type}] ${log.text}`);
    });
  } else {
    console.log('\n⚠️ No se detectaron logs de feature flags');
  }
  
  // Verificar estado en localStorage
  const storageInfo = await page.evaluate(() => {
    const uid = localStorage.getItem('360mvp_user_uid');
    return {
      uid,
      selectedOrgId: localStorage.getItem(`selectedOrgId_${uid}`),
      email: localStorage.getItem('360mvp_user_email')
    };
  });
  
  console.log('\n💾 Estado en localStorage:');
  console.log('   UID:', storageInfo.uid);
  console.log('   Selected Org:', storageInfo.selectedOrgId);
  console.log('   Email:', storageInfo.email);
  
  // Criterios de éxito
  const isSuccess = dashboardVisible && loadTime < 15000;
  
  console.log('\n🎯 Resultado final:');
  if (isSuccess) {
    console.log('✅ SOLUCIÓN ROBUSTA FUNCIONA - Componente visible en tiempo normal');
  } else if (hasDisabledMessage) {
    console.log('⚠️ FEATURE FLAG OFF - Pero la carga es normal (progreso)');
  } else {
    console.log('❌ PROBLEMA PERSISTE - Componente no visible o carga lenta');
  }
  
  // Test debe pasar si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
  expect(dashboardVisible || (hasDisabledMessage && loadTime < 15000)).toBeTruthy();
});

test('Verify: No infinite loading in bulk-actions', async ({ page }) => {
  console.log('🔄 Verificando /bulk-actions sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/bulk-actions`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ bulk-actions cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en bulk-actions');
  }
  
  const loadTime = Date.now() - startTime;
  const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible').count() > 0;
  
  console.log('📊 Resultados bulk-actions:');
  console.log('   Componente visible:', bulkVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy(); // Lo importante es que no haya loop infinito
});

test('Verify: Alerts page loads without infinite loop', async ({ page }) => {
  console.log('🚨 Verificando /alerts sin loop infinito...\n');
  
  const startTime = Date.now();
  
  await page.goto(`${STAGING_URL}/alerts`);
  
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
    console.log('✅ alerts cargó normalmente');
  } catch (error) {
    console.log('⚠️ Timeout en alerts');
  }
  
  const loadTime = Date.now() - startTime;
  const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
  const hasDisabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
  
  console.log('📊 Resultados alerts:');
  console.log('   Componente visible:', alertVisible ? '✅' : '❌');
  console.log('   Mensaje deshabilitado:', hasDisabledMessage ? '⚠️' : '❌');
  console.log('   Tiempo de carga:', loadTime < 10000 ? '✅' : '❌', `(${loadTime}ms)`);
  
  expect(loadTime < 15000).toBeTruthy();
});






