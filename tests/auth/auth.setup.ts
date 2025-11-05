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

setup('authenticate', async ({ page, context }) => {
  console.log('🔐 Autenticando en Staging...');
  
  // ✅ MEJORA 1: Limpiar storage state para evitar auto-redirect
  console.log('   → Limpiando storage state previo...');
  await context.clearCookies();
  
  // ✅ MEJORA 2: Ir a la página de login y esperar estabilidad
  console.log('   → Navegando a /login...');
  await page.goto(`${STAGING_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  // Esperar a que el botón de submit esté visible y habilitado (indica que la página terminó de cargar)
  console.log('   → Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]:not([disabled])', { 
    state: 'visible', 
    timeout: 10000 
  });
  
  // Esperar un momento adicional para asegurar que no hay redirects pendientes
  await page.waitForTimeout(500);
  
  // ✅ MEJORA 3 y 4: Usar locators y verificar visibilidad antes de interactuar
  console.log('   → Preparando credenciales...');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  // Verificar que los elementos están presentes antes de interactuar
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  
  // ✅ MEJORA 5: Logs de progreso para debugging
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // Esperar a que se complete el login - puede redirigir a diferentes páginas
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  // Verificar que estamos autenticados - buscar el email del usuario
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // Fijar la organización activa en localStorage
  console.log('   → Configurando organización activa...');
  await page.evaluate(() => {
    const uid = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
    localStorage.setItem(`selectedOrgId_${uid}`, 'pilot-org-santiago');
    console.log('📍 Organización activa fijada: pilot-org-santiago');
  });
  
  // Guardar el estado de autenticación
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});





  // ✅ MEJORA 5: Logs de progreso para debugging
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // Esperar a que se complete el login - puede redirigir a diferentes páginas
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  // Verificar que estamos autenticados - buscar el email del usuario
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // Fijar la organización activa en localStorage
  console.log('   → Configurando organización activa...');
  await page.evaluate(() => {
    const uid = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
    localStorage.setItem(`selectedOrgId_${uid}`, 'pilot-org-santiago');
    console.log('📍 Organización activa fijada: pilot-org-santiago');
  });
  
  // Guardar el estado de autenticación
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});





  // ✅ MEJORA 5: Logs de progreso para debugging
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // Esperar a que se complete el login - puede redirigir a diferentes páginas
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  // Verificar que estamos autenticados - buscar el email del usuario
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // Fijar la organización activa en localStorage
  console.log('   → Configurando organización activa...');
  await page.evaluate(() => {
    const uid = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02';
    localStorage.setItem(`selectedOrgId_${uid}`, 'pilot-org-santiago');
    console.log('📍 Organización activa fijada: pilot-org-santiago');
  });
  
  // Guardar el estado de autenticación
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});




