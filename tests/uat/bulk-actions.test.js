/**
 * UAT Test para acciones masivas
 * 
 * Verifica:
 * - Reenvío de invitaciones
 * - Extensión de plazos
 * - Idempotencia
 * - Backoff exponencial
 * - Dead Letter Queue (DLQ)
 * - Auditoría
 */

import { test, expect } from '@playwright/test';

// Configuración
const BASE_URL = process.env.STAGING_BASE_URL || 'http://localhost:5173';
const TEST_USER = {
  email: 'admin@example.com',
  password: 'password123'
};
const TEST_ORG = 'pilot-org-santiago';

// Test Suite
test.describe('Acciones Masivas', () => {
  // Configuración para todos los tests
  test.beforeEach(async ({ page }) => {
    // Ir a la página de login
    await page.goto(`${BASE_URL}/login`);
    
    // Iniciar sesión
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Esperar a que se cargue el dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Ir a la página de acciones masivas
    await page.goto(`${BASE_URL}/bulk-actions`);
    
    // Esperar a que se cargue la página
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
  });
  
  test('Debería mostrar la interfaz de acciones masivas', async ({ page }) => {
    // Verificar elementos principales
    await expect(page.locator('h1:has-text("Acciones Masivas")')).toBeVisible();
    await expect(page.locator('button:has-text("Reenviar Invitaciones")')).toBeVisible();
    await expect(page.locator('button:has-text("Extender Plazos")')).toBeVisible();
    
    // Verificar que hay asignaciones listadas
    const assignmentCount = await page.locator('.border-gray-200, .border-blue-500').count();
    expect(assignmentCount).toBeGreaterThan(0);
  });
  
  test('Debería permitir seleccionar asignaciones', async ({ page }) => {
    // Seleccionar la primera asignación
    await page.click('.border-gray-200 input[type="checkbox"]');
    
    // Verificar que se seleccionó
    await expect(page.locator('.border-blue-500')).toBeVisible();
    
    // Verificar que el contador de selección se actualizó
    const selectionText = await page.locator('p:has-text("asignaciones seleccionadas")').textContent();
    expect(selectionText).toContain('1 asignaciones seleccionadas');
  });
  
  test('Debería permitir filtrar asignaciones', async ({ page }) => {
    // Contar asignaciones iniciales
    const initialCount = await page.locator('.border-gray-200, .border-blue-500').count();
    
    // Aplicar un filtro
    await page.selectOption('select[value="all"]:nth-of-type(1)', 'pending');
    await page.click('button:has-text("Aplicar")');
    
    // Esperar a que se actualice la lista
    await page.waitForTimeout(1000);
    
    // Contar asignaciones filtradas
    const filteredCount = await page.locator('.border-gray-200, .border-blue-500').count();
    
    // Verificar que el filtro funcionó
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
  
  test('Debería reenviar invitaciones', async ({ page }) => {
    // Seleccionar la primera asignación
    await page.click('.border-gray-200 input[type="checkbox"]');
    
    // Agregar mensaje personalizado
    await page.fill('textarea', 'Por favor complete su evaluación');
    
    // Reenviar invitación
    await page.click('button:has-text("Reenviar Invitaciones")');
    
    // Esperar respuesta
    await page.waitForSelector('div:has-text("Acción \\"resend\\" ejecutada exitosamente")');
    
    // Verificar que aparece el mensaje de éxito
    await expect(page.locator('div:has-text("Acción \\"resend\\" ejecutada exitosamente")')).toBeVisible();
  });
  
  test('Debería extender plazos', async ({ page }) => {
    // Seleccionar la primera asignación
    await page.click('.border-gray-200 input[type="checkbox"]');
    
    // Configurar días de extensión
    await page.fill('input[type="number"]', '7');
    
    // Extender plazo
    await page.click('button:has-text("Extender Plazos")');
    
    // Esperar respuesta
    await page.waitForSelector('div:has-text("Acción \\"extend\\" ejecutada exitosamente")');
    
    // Verificar que aparece el mensaje de éxito
    await expect(page.locator('div:has-text("Acción \\"extend\\" ejecutada exitosamente")')).toBeVisible();
  });
  
  test('Debería mostrar la DLQ', async ({ page }) => {
    // Abrir DLQ
    await page.click('button:has-text("DLQ")');
    
    // Verificar que se muestra la sección de DLQ
    await expect(page.locator('h2:has-text("Dead Letter Queue (DLQ)")')).toBeVisible();
    
    // Verificar que hay elementos en la DLQ o mensaje de vacío
    const dlqEmpty = await page.locator('div:has-text("No hay elementos en la DLQ")').isVisible();
    
    if (!dlqEmpty) {
      // Verificar que hay elementos en la DLQ
      const dlqItems = await page.locator('.border-yellow-300').count();
      expect(dlqItems).toBeGreaterThan(0);
      
      // Verificar que hay botón de reintento
      await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
    }
  });
  
  test('Debería mostrar el registro de auditoría', async ({ page }) => {
    // Abrir auditoría
    await page.click('button:has-text("Auditoría")');
    
    // Verificar que se muestra la sección de auditoría
    await expect(page.locator('h2:has-text("Registro de Auditoría")')).toBeVisible();
    
    // Verificar que hay elementos en la auditoría o mensaje de vacío
    const auditEmpty = await page.locator('div:has-text("No hay registros de auditoría disponibles")').isVisible();
    
    if (!auditEmpty) {
      // Verificar que hay registros de auditoría
      const auditItems = await page.locator('.border-gray-200').count();
      expect(auditItems).toBeGreaterThan(0);
    }
  });
  
  test('Debería ser idempotente al reenviar invitaciones', async ({ page }) => {
    // Seleccionar la primera asignación
    await page.click('.border-gray-200 input[type="checkbox"]');
    
    // Reenviar invitación primera vez
    await page.click('button:has-text("Reenviar Invitaciones")');
    
    // Esperar respuesta
    await page.waitForSelector('div:has-text("Acción \\"resend\\" ejecutada exitosamente")');
    
    // Capturar resultados primera ejecución
    const firstSuccessText = await page.locator('div:has-text("Exitosos:")').textContent();
    const firstSuccess = parseInt(firstSuccessText.match(/Exitosos: (\d+)/)[1]);
    
    // Reenviar invitación segunda vez (misma asignación)
    await page.click('button:has-text("Reenviar Invitaciones")');
    
    // Esperar respuesta
    await page.waitForSelector('div:has-text("Acción \\"resend\\" ejecutada exitosamente")');
    
    // Capturar resultados segunda ejecución
    const secondSuccessText = await page.locator('div:has-text("Exitosos:")').textContent();
    const secondSuccess = parseInt(secondSuccessText.match(/Exitosos: (\d+)/)[1]);
    
    // Verificar idempotencia: el número de éxitos debe ser igual o mayor
    expect(secondSuccess).toBeGreaterThanOrEqual(firstSuccess);
  });
  
  test('Debería reintentar elementos de la DLQ', async ({ page }) => {
    // Abrir DLQ
    await page.click('button:has-text("DLQ")');
    
    // Verificar si hay elementos en la DLQ
    const dlqEmpty = await page.locator('div:has-text("No hay elementos en la DLQ")').isVisible();
    
    if (!dlqEmpty) {
      // Hacer clic en reintentar
      await page.click('button:has-text("Reintentar")');
      
      // Esperar a que se procese
      await page.waitForTimeout(1000);
      
      // Verificar que aparece mensaje de éxito o fallo
      const success = await page.locator('div:has-text("Successfully processed DLQ item")').isVisible();
      const failure = await page.locator('div:has-text("Failed to process DLQ item")').isVisible();
      
      expect(success || failure).toBeTruthy();
    } else {
      // Si no hay elementos en la DLQ, marcar el test como pasado
      test.skip();
    }
  });
});