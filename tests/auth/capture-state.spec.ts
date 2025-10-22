/**
 * Script para capturar el estado de autenticación en Staging
 * 
 * Uso:
 *   npm run test:auth:capture
 * 
 * Esto creará tests/.auth/state.json con las cookies de sesión
 */

import { test } from '@playwright/test';

const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

test('capture auth state', async ({ page }) => {
  console.log('🔐 Capturando estado de autenticación...\n');
  
  // Ir a login
  await page.goto(`${STAGING_URL}/login`);
  
  console.log('📝 Por favor, completa el login manualmente:');
  console.log('   Email: admin@pilot-santiago.com');
  console.log('   Password: TestPilot2024!\n');
  
  // Esperar a que el usuario haga login manualmente
  await page.waitForURL(`${STAGING_URL}/dashboard`, { timeout: 120000 });
  
  console.log('✅ Login exitoso! Estado capturado.\n');
  console.log('📁 El estado se guardará en: tests/.auth/state.json');
  console.log('\n▶️ Ahora puedes ejecutar:');
  console.log('   npm run smoke:staging');
  
  // Playwright guardará automáticamente el estado gracias a storageState en playwright.config
});