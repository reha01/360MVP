// tests/debug/js-error-hunter.spec.ts
// Test específico para encontrar el error de JavaScript que bloquea la inicialización

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('JavaScript Error Hunter 🔍', () => {
  
  test('Encuentra el error de JS bloqueante', async ({ page }) => {
    console.log('🔍 Iniciando caza de errores de JavaScript...');
    
    // ✅ CAPTURAR TODOS LOS ERRORES DE CONSOLA
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️ [WARNING DE CONSOLA]: ${text}`);
      } else if (type === 'log' && (text.includes('error') || text.includes('Error') || text.includes('failed'))) {
        consoleMessages.push(text);
        console.log(`📝 [LOG SOSPECHOSO]: ${text}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE PÁGINA (Promesas no manejadas, etc.)
    const pageErrors: string[] = [];
    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}\nStack: ${exception.stack}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK TRACE]: ${exception.stack}`);
    });

    // ✅ CAPTURAR ERRORES DE REQUEST (404, 500, etc.)
    const requestErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR DE REQUEST]: ${errorMsg}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE REQUEST FALLIDOS
    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });

    console.log(`🎯 Navegando a: ${STAGING_URL}/dashboard-360`);
    
    try {
      // Navegar a la página
      await page.goto(`${STAGING_URL}/dashboard-360`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log('✅ Navegación completada, esperando 3 segundos para capturar errores...');
      
      // Esperar un poco para que se ejecute JavaScript y aparezcan errores
      await page.waitForTimeout(3000);
      
      // Intentar hacer click en body para activar cualquier JavaScript pendiente
      await page.locator('body').click();
      
      console.log('✅ Click en body realizado, esperando 2 segundos más...');
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log(`⚠️ Error durante navegación/espera: ${error.message}`);
    }

    // ✅ RESUMEN DE ERRORES ENCONTRADOS
    console.log('\n🔍 RESUMEN DE ERRORES ENCONTRADOS:');
    console.log('=====================================');
    
    console.log(`\n🚨 ERRORES DE CONSOLA (${consoleErrors.length}):`);
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n💥 ERRORES DE PÁGINA (${pageErrors.length}):`);
    pageErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n🌐 ERRORES DE REQUEST (${requestErrors.length}):`);
    requestErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n⚠️ WARNINGS DE CONSOLA (${consoleWarnings.length}):`);
    consoleWarnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
    
    console.log(`\n📝 LOGS SOSPECHOSOS (${consoleMessages.length}):`);
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });

    // ✅ CAPTURAR CONTENIDO HTML PARA DIAGNÓSTICO
    const htmlContent = await page.content();
    console.log('\n📄 CONTENIDO HTML (primeros 500 chars):');
    console.log(htmlContent.substring(0, 500) + '...');
    
    // ✅ VERIFICAR SI HAY SCRIPTS CARGADOS
    const scripts = await page.locator('script[src]').count();
    console.log(`\n📜 Scripts con src encontrados: ${scripts}`);
    
    if (scripts > 0) {
      console.log('📜 URLs de scripts:');
      const scriptUrls = await page.locator('script[src]').evaluateAll(scripts => 
        scripts.map(script => script.getAttribute('src'))
      );
      scriptUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

    // ✅ El test "pasa" siempre - solo queremos capturar errores
    console.log('\n✅ Caza de errores completada. Revisa los logs arriba para encontrar la causa raíz.');
  });
  
});






// Test específico para encontrar el error de JavaScript que bloquea la inicialización

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('JavaScript Error Hunter 🔍', () => {
  
  test('Encuentra el error de JS bloqueante', async ({ page }) => {
    console.log('🔍 Iniciando caza de errores de JavaScript...');
    
    // ✅ CAPTURAR TODOS LOS ERRORES DE CONSOLA
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️ [WARNING DE CONSOLA]: ${text}`);
      } else if (type === 'log' && (text.includes('error') || text.includes('Error') || text.includes('failed'))) {
        consoleMessages.push(text);
        console.log(`📝 [LOG SOSPECHOSO]: ${text}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE PÁGINA (Promesas no manejadas, etc.)
    const pageErrors: string[] = [];
    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}\nStack: ${exception.stack}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK TRACE]: ${exception.stack}`);
    });

    // ✅ CAPTURAR ERRORES DE REQUEST (404, 500, etc.)
    const requestErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR DE REQUEST]: ${errorMsg}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE REQUEST FALLIDOS
    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });

    console.log(`🎯 Navegando a: ${STAGING_URL}/dashboard-360`);
    
    try {
      // Navegar a la página
      await page.goto(`${STAGING_URL}/dashboard-360`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log('✅ Navegación completada, esperando 3 segundos para capturar errores...');
      
      // Esperar un poco para que se ejecute JavaScript y aparezcan errores
      await page.waitForTimeout(3000);
      
      // Intentar hacer click en body para activar cualquier JavaScript pendiente
      await page.locator('body').click();
      
      console.log('✅ Click en body realizado, esperando 2 segundos más...');
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log(`⚠️ Error durante navegación/espera: ${error.message}`);
    }

    // ✅ RESUMEN DE ERRORES ENCONTRADOS
    console.log('\n🔍 RESUMEN DE ERRORES ENCONTRADOS:');
    console.log('=====================================');
    
    console.log(`\n🚨 ERRORES DE CONSOLA (${consoleErrors.length}):`);
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n💥 ERRORES DE PÁGINA (${pageErrors.length}):`);
    pageErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n🌐 ERRORES DE REQUEST (${requestErrors.length}):`);
    requestErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n⚠️ WARNINGS DE CONSOLA (${consoleWarnings.length}):`);
    consoleWarnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
    
    console.log(`\n📝 LOGS SOSPECHOSOS (${consoleMessages.length}):`);
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });

    // ✅ CAPTURAR CONTENIDO HTML PARA DIAGNÓSTICO
    const htmlContent = await page.content();
    console.log('\n📄 CONTENIDO HTML (primeros 500 chars):');
    console.log(htmlContent.substring(0, 500) + '...');
    
    // ✅ VERIFICAR SI HAY SCRIPTS CARGADOS
    const scripts = await page.locator('script[src]').count();
    console.log(`\n📜 Scripts con src encontrados: ${scripts}`);
    
    if (scripts > 0) {
      console.log('📜 URLs de scripts:');
      const scriptUrls = await page.locator('script[src]').evaluateAll(scripts => 
        scripts.map(script => script.getAttribute('src'))
      );
      scriptUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

    // ✅ El test "pasa" siempre - solo queremos capturar errores
    console.log('\n✅ Caza de errores completada. Revisa los logs arriba para encontrar la causa raíz.');
  });
  
});






// Test específico para encontrar el error de JavaScript que bloquea la inicialización

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test.describe('JavaScript Error Hunter 🔍', () => {
  
  test('Encuentra el error de JS bloqueante', async ({ page }) => {
    console.log('🔍 Iniciando caza de errores de JavaScript...');
    
    // ✅ CAPTURAR TODOS LOS ERRORES DE CONSOLA
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`🚨 [ERROR DE CONSOLA]: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️ [WARNING DE CONSOLA]: ${text}`);
      } else if (type === 'log' && (text.includes('error') || text.includes('Error') || text.includes('failed'))) {
        consoleMessages.push(text);
        console.log(`📝 [LOG SOSPECHOSO]: ${text}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE PÁGINA (Promesas no manejadas, etc.)
    const pageErrors: string[] = [];
    page.on('pageerror', exception => {
      const errorMsg = `${exception.name}: ${exception.message}\nStack: ${exception.stack}`;
      pageErrors.push(errorMsg);
      console.log(`💥 [ERROR DE PÁGINA]: ${exception.name}: ${exception.message}`);
      console.log(`📍 [STACK TRACE]: ${exception.stack}`);
    });

    // ✅ CAPTURAR ERRORES DE REQUEST (404, 500, etc.)
    const requestErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        const errorMsg = `${response.status()} ${response.statusText()} - ${response.url()}`;
        requestErrors.push(errorMsg);
        console.log(`🌐 [ERROR DE REQUEST]: ${errorMsg}`);
      }
    });

    // ✅ CAPTURAR ERRORES DE REQUEST FALLIDOS
    page.on('requestfailed', request => {
      const errorMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
      requestErrors.push(errorMsg);
      console.log(`📡 [REQUEST FAILED]: ${errorMsg}`);
    });

    console.log(`🎯 Navegando a: ${STAGING_URL}/dashboard-360`);
    
    try {
      // Navegar a la página
      await page.goto(`${STAGING_URL}/dashboard-360`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log('✅ Navegación completada, esperando 3 segundos para capturar errores...');
      
      // Esperar un poco para que se ejecute JavaScript y aparezcan errores
      await page.waitForTimeout(3000);
      
      // Intentar hacer click en body para activar cualquier JavaScript pendiente
      await page.locator('body').click();
      
      console.log('✅ Click en body realizado, esperando 2 segundos más...');
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log(`⚠️ Error durante navegación/espera: ${error.message}`);
    }

    // ✅ RESUMEN DE ERRORES ENCONTRADOS
    console.log('\n🔍 RESUMEN DE ERRORES ENCONTRADOS:');
    console.log('=====================================');
    
    console.log(`\n🚨 ERRORES DE CONSOLA (${consoleErrors.length}):`);
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n💥 ERRORES DE PÁGINA (${pageErrors.length}):`);
    pageErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n🌐 ERRORES DE REQUEST (${requestErrors.length}):`);
    requestErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log(`\n⚠️ WARNINGS DE CONSOLA (${consoleWarnings.length}):`);
    consoleWarnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
    
    console.log(`\n📝 LOGS SOSPECHOSOS (${consoleMessages.length}):`);
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });

    // ✅ CAPTURAR CONTENIDO HTML PARA DIAGNÓSTICO
    const htmlContent = await page.content();
    console.log('\n📄 CONTENIDO HTML (primeros 500 chars):');
    console.log(htmlContent.substring(0, 500) + '...');
    
    // ✅ VERIFICAR SI HAY SCRIPTS CARGADOS
    const scripts = await page.locator('script[src]').count();
    console.log(`\n📜 Scripts con src encontrados: ${scripts}`);
    
    if (scripts > 0) {
      console.log('📜 URLs de scripts:');
      const scriptUrls = await page.locator('script[src]').evaluateAll(scripts => 
        scripts.map(script => script.getAttribute('src'))
      );
      scriptUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

    // ✅ El test "pasa" siempre - solo queremos capturar errores
    console.log('\n✅ Caza de errores completada. Revisa los logs arriba para encontrar la causa raíz.');
  });
  
});






