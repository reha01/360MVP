/**
 * Test simple para verificar que los feature flags se cargan correctamente
 * después del fix del loop infinito
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('Simple Feature Flags Test @smoke', () => {
  
  test('Dashboard 360 should render with correct flags', async ({ page }) => {
    console.log('🎯 Testing dashboard-360 rendering...');
    
    // 🔍 NUEVO: CAPTURAR TODOS LOS ERRORES DE JAVASCRIPT
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning' && (text.includes('error') || text.includes('Error'))) {
        console.log(`⚠️ [WARNING SOSPECHOSO]: ${text}`);
      }
    });

    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK]: ${exception.stack}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR HTTP]: ${errorMsg}`);
      }
    });

    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });
    
    // ✅ NUEVO: Establecer flag de test explícito sin interferir con Firebase Auth
    await page.addInitScript(() => {
      // Solo deshabilitar analytics explícitamente, no interferir con Firebase Auth
      localStorage.setItem('__EXPLICIT_TEST_MODE__', 'true');
      console.log('🧪 Test mode enabled (analytics only)');
    });
    
    const startTime = Date.now();
    
    // Ir a dashboard-360
    await page.goto(`${STAGING_URL}/dashboard-360`);
    
    // ✅ SOLUCIÓN: No esperar networkidle, solo elementos específicos
    try {
      // Esperar que aparezca ALGUNO de los elementos esperados
      await page.waitForSelector('[data-testid="operational-dashboard"], text=no disponible, text=Cargando, [data-testid="loading"]', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Timeout esperando elementos, pero continuando...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    // Verificar qué se renderiza
    const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    const loadingSpinner = await page.locator('.loading-spinner, [data-testid*="loading"]').count() > 0;
    
    // Obtener información de debug
    const debugInfo = await page.evaluate(() => {
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      return {
        uid,
        selectedOrgId,
        pageTitle: document.title,
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📊 Results:');
    console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Loading spinner:', loadingSpinner ? '⏳' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    console.log('   Selected Org:', debugInfo.selectedOrgId);
    
    // Test pasa si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
    const isAcceptable = dashboardVisible || (disabledMessage && loadTime < 10000);
    
    if (!isAcceptable) {
      console.log('❌ Neither dashboard visible nor fast disabled message');
      console.log('📄 Page content:', debugInfo.bodyText);
    }

    // 🔍 RESUMEN DE ERRORES CAPTURADOS
    console.log('\n🔍 RESUMEN DE ERRORES JAVASCRIPT:');
    console.log('=================================');
    console.log(`🚨 Errores de consola: ${consoleErrors.length}`);
    consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`💥 Errores de página: ${pageErrors.length}`);
    pageErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`🌐 Errores HTTP: ${requestErrors.length}`);
    requestErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));

    // Obtener contenido HTML para diagnóstico adicional
    const htmlContent = await page.content();
    console.log(`\n📄 HTML contiene React div: ${htmlContent.includes('<div id="root">')}`);
    console.log(`📄 HTML contiene scripts: ${htmlContent.includes('<script')}`);
    
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🚨 ERRORES CRÍTICOS ENCONTRADOS - Esta es probablemente la causa raíz del problema');
    }

    expect(isAcceptable).toBeTruthy();
  });
  
  test('Bulk actions should render or show disabled message', async ({ page }) => {
    console.log('🔄 Testing bulk-actions rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/bulk-actions`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Bulk manager visible:', bulkVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = bulkVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });

  test('Alerts should render or show disabled message', async ({ page }) => {
    console.log('🚨 Testing alerts rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/alerts`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Alert manager visible:', alertVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = alertVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });
});

 * después del fix del loop infinito
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('Simple Feature Flags Test @smoke', () => {
  
  test('Dashboard 360 should render with correct flags', async ({ page }) => {
    console.log('🎯 Testing dashboard-360 rendering...');
    
    // 🔍 NUEVO: CAPTURAR TODOS LOS ERRORES DE JAVASCRIPT
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning' && (text.includes('error') || text.includes('Error'))) {
        console.log(`⚠️ [WARNING SOSPECHOSO]: ${text}`);
      }
    });

    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK]: ${exception.stack}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR HTTP]: ${errorMsg}`);
      }
    });

    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });
    
    // ✅ NUEVO: Establecer flag de test explícito sin interferir con Firebase Auth
    await page.addInitScript(() => {
      // Solo deshabilitar analytics explícitamente, no interferir con Firebase Auth
      localStorage.setItem('__EXPLICIT_TEST_MODE__', 'true');
      console.log('🧪 Test mode enabled (analytics only)');
    });
    
    const startTime = Date.now();
    
    // Ir a dashboard-360
    await page.goto(`${STAGING_URL}/dashboard-360`);
    
    // ✅ SOLUCIÓN: No esperar networkidle, solo elementos específicos
    try {
      // Esperar que aparezca ALGUNO de los elementos esperados
      await page.waitForSelector('[data-testid="operational-dashboard"], text=no disponible, text=Cargando, [data-testid="loading"]', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Timeout esperando elementos, pero continuando...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    // Verificar qué se renderiza
    const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    const loadingSpinner = await page.locator('.loading-spinner, [data-testid*="loading"]').count() > 0;
    
    // Obtener información de debug
    const debugInfo = await page.evaluate(() => {
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      return {
        uid,
        selectedOrgId,
        pageTitle: document.title,
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📊 Results:');
    console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Loading spinner:', loadingSpinner ? '⏳' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    console.log('   Selected Org:', debugInfo.selectedOrgId);
    
    // Test pasa si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
    const isAcceptable = dashboardVisible || (disabledMessage && loadTime < 10000);
    
    if (!isAcceptable) {
      console.log('❌ Neither dashboard visible nor fast disabled message');
      console.log('📄 Page content:', debugInfo.bodyText);
    }

    // 🔍 RESUMEN DE ERRORES CAPTURADOS
    console.log('\n🔍 RESUMEN DE ERRORES JAVASCRIPT:');
    console.log('=================================');
    console.log(`🚨 Errores de consola: ${consoleErrors.length}`);
    consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`💥 Errores de página: ${pageErrors.length}`);
    pageErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`🌐 Errores HTTP: ${requestErrors.length}`);
    requestErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));

    // Obtener contenido HTML para diagnóstico adicional
    const htmlContent = await page.content();
    console.log(`\n📄 HTML contiene React div: ${htmlContent.includes('<div id="root">')}`);
    console.log(`📄 HTML contiene scripts: ${htmlContent.includes('<script')}`);
    
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🚨 ERRORES CRÍTICOS ENCONTRADOS - Esta es probablemente la causa raíz del problema');
    }

    expect(isAcceptable).toBeTruthy();
  });
  
  test('Bulk actions should render or show disabled message', async ({ page }) => {
    console.log('🔄 Testing bulk-actions rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/bulk-actions`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Bulk manager visible:', bulkVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = bulkVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });

  test('Alerts should render or show disabled message', async ({ page }) => {
    console.log('🚨 Testing alerts rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/alerts`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Alert manager visible:', alertVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = alertVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });
});

 * después del fix del loop infinito
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('Simple Feature Flags Test @smoke', () => {
  
  test('Dashboard 360 should render with correct flags', async ({ page }) => {
    console.log('🎯 Testing dashboard-360 rendering...');
    
    // 🔍 NUEVO: CAPTURAR TODOS LOS ERRORES DE JAVASCRIPT
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning' && (text.includes('error') || text.includes('Error'))) {
        console.log(`⚠️ [WARNING SOSPECHOSO]: ${text}`);
      }
    });

    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK]: ${exception.stack}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR HTTP]: ${errorMsg}`);
      }
    });

    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });
    
    // ✅ NUEVO: Establecer flag de test explícito sin interferir con Firebase Auth
    await page.addInitScript(() => {
      // Solo deshabilitar analytics explícitamente, no interferir con Firebase Auth
      localStorage.setItem('__EXPLICIT_TEST_MODE__', 'true');
      console.log('🧪 Test mode enabled (analytics only)');
    });
    
    const startTime = Date.now();
    
    // Ir a dashboard-360
    await page.goto(`${STAGING_URL}/dashboard-360`);
    
    // ✅ SOLUCIÓN: No esperar networkidle, solo elementos específicos
    try {
      // Esperar que aparezca ALGUNO de los elementos esperados
      await page.waitForSelector('[data-testid="operational-dashboard"], text=no disponible, text=Cargando, [data-testid="loading"]', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Timeout esperando elementos, pero continuando...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    // Verificar qué se renderiza
    const dashboardVisible = await page.locator('[data-testid="operational-dashboard"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    const loadingSpinner = await page.locator('.loading-spinner, [data-testid*="loading"]').count() > 0;
    
    // Obtener información de debug
    const debugInfo = await page.evaluate(() => {
      const uid = localStorage.getItem('360mvp_user_uid');
      const selectedOrgId = localStorage.getItem(`selectedOrgId_${uid}`);
      
      return {
        uid,
        selectedOrgId,
        pageTitle: document.title,
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📊 Results:');
    console.log('   Dashboard visible:', dashboardVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Loading spinner:', loadingSpinner ? '⏳' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    console.log('   Selected Org:', debugInfo.selectedOrgId);
    
    // Test pasa si el dashboard es visible O si hay mensaje de deshabilitado (pero carga rápida)
    const isAcceptable = dashboardVisible || (disabledMessage && loadTime < 10000);
    
    if (!isAcceptable) {
      console.log('❌ Neither dashboard visible nor fast disabled message');
      console.log('📄 Page content:', debugInfo.bodyText);
    }

    // 🔍 RESUMEN DE ERRORES CAPTURADOS
    console.log('\n🔍 RESUMEN DE ERRORES JAVASCRIPT:');
    console.log('=================================');
    console.log(`🚨 Errores de consola: ${consoleErrors.length}`);
    consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`💥 Errores de página: ${pageErrors.length}`);
    pageErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    
    console.log(`🌐 Errores HTTP: ${requestErrors.length}`);
    requestErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));

    // Obtener contenido HTML para diagnóstico adicional
    const htmlContent = await page.content();
    console.log(`\n📄 HTML contiene React div: ${htmlContent.includes('<div id="root">')}`);
    console.log(`📄 HTML contiene scripts: ${htmlContent.includes('<script')}`);
    
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n🚨 ERRORES CRÍTICOS ENCONTRADOS - Esta es probablemente la causa raíz del problema');
    }

    expect(isAcceptable).toBeTruthy();
  });
  
  test('Bulk actions should render or show disabled message', async ({ page }) => {
    console.log('🔄 Testing bulk-actions rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/bulk-actions`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const bulkVisible = await page.locator('[data-testid="bulk-actions-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Bulk manager visible:', bulkVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = bulkVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });

  test('Alerts should render or show disabled message', async ({ page }) => {
    console.log('🚨 Testing alerts rendering...');
    
    const startTime = Date.now();
    
    await page.goto(`${STAGING_URL}/alerts`);
    
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (error) {
      console.log('⚠️ DOMContentLoaded timeout, but continuing...');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    const alertVisible = await page.locator('[data-testid="alert-manager"]').isVisible();
    const disabledMessage = await page.locator('text=no disponible, text=no está habilitado').count() > 0;
    
    console.log('📊 Results:');
    console.log('   Alert manager visible:', alertVisible ? '✅' : '❌');
    console.log('   Disabled message:', disabledMessage ? '⚠️' : '❌');
    console.log('   Load time:', loadTime < 10000 ? '✅ Good' : '❌ Slow', `(${loadTime}ms)`);
    
    const isAcceptable = alertVisible || (disabledMessage && loadTime < 10000);
    expect(isAcceptable).toBeTruthy();
  });
});
