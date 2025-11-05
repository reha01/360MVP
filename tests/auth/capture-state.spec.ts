/**
 * Script para capturar el estado de autenticación en Staging
 * 
 * Uso:
 *   npm run test:auth:capture
 * 
 * Esto creará tests/.auth/state.json con las cookies de sesión
 */

import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';
const authFile = path.join(__dirname, '../.auth/state.json');

test('capture auth state', async ({ page, context }) => {
  test.setTimeout(150000); // 150s para dar tiempo al login manual
  console.log('🔐 Capturando estado de autenticación...\n');
  console.log(`📍 URL Staging: ${STAGING_URL}`);
  console.log(`📁 Archivo destino: ${authFile}\n`);
  
  // ✅ MEJORA: Limpiar storage state para evitar auto-redirect
  console.log('🧹 Limpiando storage state previo...');
  await context.clearCookies();
  
  // Ir a login
  console.log(`🌐 Navegando a: ${STAGING_URL}/login`);
  await page.goto(`${STAGING_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  // ✅ MEJORA: Esperar a que la página esté estable antes de mostrar instrucciones
  console.log('⏱️ Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]', { 
    state: 'visible', 
    timeout: 10000 
  });
  
  console.log('\n📝 Por favor, completa el login manualmente:');
  console.log('   Email: admin@pilot-santiago.com');
  console.log('   Password: TestPilot2024!');
  console.log('\n⏳ Esperando login (timeout: 120 segundos)...\n');
  
  // Esperar a que el usuario haga login manualmente
  // Puede redirigir a /dashboard, /select-workspace, o /workspace-select
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select|home|evaluations)/, { timeout: 120000 });
  
  console.log('✅ Login exitoso! Esperando estabilización...\n');
  
  // ✅ MEJORA: Esperar un momento para que la sesión se establezca completamente
  await page.waitForTimeout(2000);
  
  // Guardar el estado de autenticación explícitamente
  console.log('💾 Guardando estado de autenticación...');
  await context.storageState({ path: authFile });
  
  console.log('📁 Estado guardado en: tests/.auth/state.json');
  console.log('\n▶️ Ahora puedes ejecutar:');
  console.log('   npm run smoke:staging');
  console.log('   npm run smoke:ci');
});
  // ✅ MEJORA: Esperar a que la página esté estable antes de mostrar instrucciones
  console.log('⏱️ Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]', { 
    state: 'visible', 
    timeout: 10000 
  });
  
  console.log('\n📝 Por favor, completa el login manualmente:');
  console.log('   Email: admin@pilot-santiago.com');
  console.log('   Password: TestPilot2024!');
  console.log('\n⏳ Esperando login (timeout: 120 segundos)...\n');
  
  // Esperar a que el usuario haga login manualmente
  // Puede redirigir a /dashboard, /select-workspace, o /workspace-select
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select|home|evaluations)/, { timeout: 120000 });
  
  console.log('✅ Login exitoso! Esperando estabilización...\n');
  
  // ✅ MEJORA: Esperar un momento para que la sesión se establezca completamente
  await page.waitForTimeout(2000);
  
  // Guardar el estado de autenticación explícitamente
  console.log('💾 Guardando estado de autenticación...');
  await context.storageState({ path: authFile });
  
  console.log('📁 Estado guardado en: tests/.auth/state.json');
  console.log('\n▶️ Ahora puedes ejecutar:');
  console.log('   npm run smoke:staging');
  console.log('   npm run smoke:ci');
});
  // ✅ MEJORA: Esperar a que la página esté estable antes de mostrar instrucciones
  console.log('⏱️ Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]', { 
    state: 'visible', 
    timeout: 10000 
  });
  
  console.log('\n📝 Por favor, completa el login manualmente:');
  console.log('   Email: admin@pilot-santiago.com');
  console.log('   Password: TestPilot2024!');
  console.log('\n⏳ Esperando login (timeout: 120 segundos)...\n');
  
  // Esperar a que el usuario haga login manualmente
  // Puede redirigir a /dashboard, /select-workspace, o /workspace-select
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select|home|evaluations)/, { timeout: 120000 });
  
  console.log('✅ Login exitoso! Esperando estabilización...\n');
  
  // ✅ MEJORA: Esperar un momento para que la sesión se establezca completamente
  await page.waitForTimeout(2000);
  
  // Guardar el estado de autenticación explícitamente
  console.log('💾 Guardando estado de autenticación...');
  await context.storageState({ path: authFile });
  
  console.log('📁 Estado guardado en: tests/.auth/state.json');
  console.log('\n▶️ Ahora puedes ejecutar:');
  console.log('   npm run smoke:staging');
  console.log('   npm run smoke:ci');
});