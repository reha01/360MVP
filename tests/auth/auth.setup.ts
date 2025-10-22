/**
 * Auth setup para Playwright
 * 
 * Este archivo se ejecuta automáticamente antes de los tests
 * y guarda el estado de autenticación en tests/.auth/state.json
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../.auth/state.json');
const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';

setup('authenticate', async ({ page }) => {
  console.log('🔐 Autenticando en Staging...');
  
  // Ir a la página de login
  await page.goto(`${STAGING_URL}/login`);
  
  // Llenar credenciales
  await page.fill('input[type="email"]', 'admin@pilot-santiago.com');
  await page.fill('input[type="password"]', 'TestPilot2024!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Esperar a que se complete el login
  await page.waitForURL(`${STAGING_URL}/dashboard`, { timeout: 10000 });
  
  // Verificar que estamos autenticados
  await expect(page.locator('text=Dashboard, text=Inicio')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // Guardar el estado de autenticación
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});




