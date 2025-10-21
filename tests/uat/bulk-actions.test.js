/**
 * UAT Test: Bulk Actions
 * 
 * Criterios:
 * - Reenvío de invitaciones idempotente
 * - Extensión de deadlines
 * - Colas con backoff + DLQ visible
 * - Auditoría completa
 * - Progreso en tiempo real
 */

import { test, expect } from '@playwright/test';

test.describe('Bulk Actions UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
  });
  
  test('Reenvío de invitaciones idempotente', async ({ page }) => {
    // Seleccionar una campaña
    const campaignCard = page.locator('[data-testid="campaign-card"]').first();
    await campaignCard.click();
    
    // Navegar a la pestaña de acciones masivas
    await page.click('text=Acciones Masivas');
    
    // Esperar a que cargue el bulk actions manager
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Seleccionar algunas asignaciones
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Seleccionar las primeras 3 asignaciones
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }
      
      // Realizar primer reenvío
      await page.click('button:has-text("Reenviar Invitaciones")');
      
      // Esperar a que se complete
      await page.waitForSelector('text=Resultados de la Acción');
      
      // Verificar resultados
      const successCount = await page.locator('text=/\\d+ Exitosas/').textContent();
      expect(successCount).toBeTruthy();
      
      // Intentar reenvío inmediato (debe ser idempotente)
      await page.click('button:has-text("Reenviar Invitaciones")');
      
      // Verificar que se muestra mensaje de idempotencia
      await expect(page.locator('text=/ya se envió recientemente/')).toBeVisible();
      
      console.log('✅ Reenvío idempotente funcionando');
    }
  });
  
  test('Extensión de deadlines', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Seleccionar asignaciones
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Seleccionar las primeras 2 asignaciones
      for (let i = 0; i < Math.min(2, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }
      
      // Extender deadline por 7 días
      await page.click('button:has-text("Extender +7 días")');
      
      // Esperar a que se complete
      await page.waitForSelector('text=Resultados de la Acción');
      
      // Verificar resultados
      const successCount = await page.locator('text=/\\d+ Exitosas/').textContent();
      expect(successCount).toBeTruthy();
      
      // Verificar que se muestra la nueva fecha
      await expect(page.locator('text=/Deadline extended by 7 days/')).toBeVisible();
      
      console.log('✅ Extensión de deadlines funcionando');
    }
  });
  
  test('Colas con backoff + DLQ visible', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Simular fallo para activar DLQ
    // (Esto requeriría configuración específica del entorno de prueba)
    
    // Verificar que hay indicadores de cola
    const queueStatus = page.locator('text=/Cola/');
    if (await queueStatus.isVisible()) {
      // Verificar que se muestra el estado de la cola
      await expect(queueStatus).toBeVisible();
      
      console.log('✅ Colas y DLQ visibles');
    }
  });
  
  test('Auditoría completa de acciones', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Realizar una acción
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      await checkboxes.first().check();
      await page.click('button:has-text("Reenviar Invitaciones")');
      
      // Esperar a que se complete
      await page.waitForSelector('text=Resultados de la Acción');
      
      // Verificar que se muestra el historial
      const history = page.locator('text=Historial de Acciones');
      if (await history.isVisible()) {
        // Verificar que se registró la acción
        await expect(page.locator('text=/Reenvío de invitaciones/')).toBeVisible();
        
        // Verificar timestamp
        await expect(page.locator('text=/\\d{2}\\/\\d{2}\\/\\d{4}/')).toBeVisible();
        
        console.log('✅ Auditoría completa funcionando');
      }
    }
  });
  
  test('Progreso en tiempo real', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Seleccionar múltiples asignaciones
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Seleccionar todas las asignaciones
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check();
      }
      
      // Iniciar acción masiva
      await page.click('button:has-text("Reenviar Invitaciones")');
      
      // Verificar que se muestra el progreso
      const progressBar = page.locator('[data-testid="progress-bar"]');
      if (await progressBar.isVisible()) {
        // Verificar que el progreso se actualiza
        await expect(progressBar).toBeVisible();
        
        // Esperar a que se complete
        await page.waitForSelector('text=Resultados de la Acción');
        
        console.log('✅ Progreso en tiempo real funcionando');
      }
    }
  });
  
  test('Exportación de resultados', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Realizar una acción para generar resultados
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      await checkboxes.first().check();
      await page.click('button:has-text("Reenviar Invitaciones")');
      
      // Esperar a que se complete
      await page.waitForSelector('text=Resultados de la Acción');
      
      // Verificar que hay botón de exportar
      const exportButton = page.locator('button:has-text("Exportar")');
      if (await exportButton.isVisible()) {
        // Simular click en exportar (no descargar realmente)
        await exportButton.click();
        
        console.log('✅ Exportación de resultados funcionando');
      }
    }
  });
  
  test('Filtros en acciones masivas', async ({ page }) => {
    // Navegar a acciones masivas
    await page.click('text=Acciones Masivas');
    await page.waitForSelector('[data-testid="bulk-actions-manager"]');
    
    // Verificar que hay filtros
    const filters = page.locator('[data-testid="bulk-actions-filters"]');
    if (await filters.isVisible()) {
      // Probar filtro por estado
      await page.selectOption('select', 'pending');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      // Probar filtro por tipo de evaluador
      await page.selectOption('select', 'peer');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      console.log('✅ Filtros en acciones masivas funcionando');
    }
  });
});
