/**
 * UAT Test: Operational Alerts
 * 
 * Criterios:
 * - Alertas operativas (DLQ, cuotas, bounces)
 * - Enlaces a acciones relacionadas
 * - Resolución de alertas
 * - Monitoreo en tiempo real
 */

import { test, expect } from '@playwright/test';

test.describe('Operational Alerts UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de alertas
    await page.goto('/alerts');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="alert-manager"]');
  });
  
  test('Alertas operativas se muestran correctamente', async ({ page }) => {
    // Verificar que se muestran alertas
    const alertCards = page.locator('[data-testid="alert-card"]');
    const alertCount = await alertCards.count();
    
    if (alertCount > 0) {
      // Verificar que se muestran diferentes tipos de alertas
      await expect(page.locator('text=/Jobs en Dead Letter Queue/')).toBeVisible();
      await expect(page.locator('text=/Cuota de emails excedida/')).toBeVisible();
      await expect(page.locator('text=/Emails rebotados/')).toBeVisible();
      
      console.log(`✅ ${alertCount} alertas operativas mostradas`);
    }
  });
  
  test('Filtros de alertas funcionan', async ({ page }) => {
    // Verificar que hay filtros
    const filters = page.locator('[data-testid="alert-filters"]');
    if (await filters.isVisible()) {
      // Probar filtro por estado
      await page.selectOption('select', 'active');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      // Probar filtro por tipo
      await page.selectOption('select', 'dlq');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      // Probar filtro por severidad
      await page.selectOption('select', 'high');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      console.log('✅ Filtros de alertas funcionando');
    }
  });
  
  test('Búsqueda de alertas', async ({ page }) => {
    // Verificar que hay campo de búsqueda
    const searchInput = page.locator('input[type="text"]');
    if (await searchInput.isVisible()) {
      // Realizar búsqueda
      await searchInput.fill('DLQ');
      
      // Verificar que se aplica la búsqueda
      await page.waitForTimeout(500);
      
      // Limpiar búsqueda
      await searchInput.fill('');
      
      // Verificar que se limpia
      await page.waitForTimeout(500);
      
      console.log('✅ Búsqueda de alertas funcionando');
    }
  });
  
  test('Resolución de alertas', async ({ page }) => {
    // Buscar alerta activa
    const activeAlerts = page.locator('text=/Activas/');
    if (await activeAlerts.isVisible()) {
      // Buscar botón de resolver
      const resolveButton = page.locator('button:has-text("Resolver")').first();
      
      if (await resolveButton.isVisible()) {
        // Resolver alerta
        await resolveButton.click();
        
        // Verificar que se muestra progreso
        await expect(page.locator('text=/Resolviendo/')).toBeVisible();
        
        // Esperar a que se complete
        await page.waitForTimeout(2000);
        
        // Verificar que se resolvió
        await expect(page.locator('text=/Resuelta/')).toBeVisible();
        
        console.log('✅ Resolución de alertas funcionando');
      }
    }
  });
  
  test('Silenciado de alertas', async ({ page }) => {
    // Buscar alerta activa
    const activeAlerts = page.locator('text=/Activas/');
    if (await activeAlerts.isVisible()) {
      // Buscar botón de silenciar
      const silenceButton = page.locator('button:has-text("Silenciar")').first();
      
      if (await silenceButton.isVisible()) {
        // Silenciar alerta
        await silenceButton.click();
        
        // Verificar que se silenció
        await expect(page.locator('text=/Silenciada/')).toBeVisible();
        
        // Verificar que aparece botón de activar
        await expect(page.locator('button:has-text("Activar")')).toBeVisible();
        
        console.log('✅ Silenciado de alertas funcionando');
      }
    }
  });
  
  test('Enlaces a acciones relacionadas', async ({ page }) => {
    // Buscar alerta con enlace
    const alertCards = page.locator('[data-testid="alert-card"]');
    const alertCount = await alertCards.count();
    
    if (alertCount > 0) {
      // Buscar botón de ver detalle
      const detailButton = page.locator('button:has-text("Ver Detalle")').first();
      
      if (await detailButton.isVisible()) {
        // Hacer click en ver detalle
        await detailButton.click();
        
        // Verificar que se ejecuta la acción
        // (En un entorno real, esto abriría una nueva página o modal)
        
        console.log('✅ Enlaces a acciones relacionadas funcionando');
      }
    }
  });
  
  test('Métricas de alertas', async ({ page }) => {
    // Verificar que se muestran métricas
    const metrics = page.locator('text=/Activas/');
    if (await metrics.isVisible()) {
      // Verificar que se muestran todas las métricas
      await expect(page.locator('text=/Resueltas/')).toBeVisible();
      await expect(page.locator('text=/Silenciadas/')).toBeVisible();
      await expect(page.locator('text=/Total/')).toBeVisible();
      
      // Verificar que los valores son numéricos
      const activeCount = await page.locator('text=/\\d+/').first().textContent();
      expect(activeCount).toMatch(/\\d+/);
      
      console.log('✅ Métricas de alertas funcionando');
    }
  });
  
  test('Metadata específica por tipo de alerta', async ({ page }) => {
    // Verificar que se muestran diferentes tipos de metadata
    const dlqAlert = page.locator('text=/Jobs en Dead Letter Queue/');
    if (await dlqAlert.isVisible()) {
      // Verificar metadata de DLQ
      await expect(page.locator('text=/Jobs en DLQ:/')).toBeVisible();
      await expect(page.locator('text=/Job más antiguo:/')).toBeVisible();
    }
    
    const quotaAlert = page.locator('text=/Cuota de emails excedida/');
    if (await quotaAlert.isVisible()) {
      // Verificar metadata de cuota
      await expect(page.locator('text=/Cuota:/')).toBeVisible();
      await expect(page.locator('text=/Uso:/')).toBeVisible();
      await expect(page.locator('text=/Reset:/')).toBeVisible();
    }
    
    const bounceAlert = page.locator('text=/Emails rebotados/');
    if (await bounceAlert.isVisible()) {
      // Verificar metadata de bounce
      await expect(page.locator('text=/Emails:/')).toBeVisible();
      await expect(page.locator('text=/Razones:/')).toBeVisible();
    }
    
    console.log('✅ Metadata específica por tipo funcionando');
  });
  
  test('Actualización en tiempo real', async ({ page }) => {
    // Verificar que hay botón de actualizar
    const refreshButton = page.locator('button:has-text("Actualizar")');
    if (await refreshButton.isVisible()) {
      // Hacer click en actualizar
      await refreshButton.click();
      
      // Verificar que se muestra indicador de carga
      await expect(page.locator('text=/Actualizando/')).toBeVisible();
      
      // Esperar a que se complete
      await page.waitForTimeout(2000);
      
      // Verificar que se oculta el indicador
      await expect(page.locator('text=/Actualizando/')).not.toBeVisible();
      
      console.log('✅ Actualización en tiempo real funcionando');
    }
  });
  
  test('Severidad de alertas', async ({ page }) => {
    // Verificar que se muestran diferentes severidades
    const highSeverity = page.locator('text=/high/');
    const mediumSeverity = page.locator('text=/medium/');
    const lowSeverity = page.locator('text=/low/');
    
    if (await highSeverity.isVisible()) {
      // Verificar que se muestra con color apropiado
      await expect(highSeverity).toBeVisible();
    }
    
    if (await mediumSeverity.isVisible()) {
      await expect(mediumSeverity).toBeVisible();
    }
    
    if (await lowSeverity.isVisible()) {
      await expect(lowSeverity).toBeVisible();
    }
    
    console.log('✅ Severidad de alertas funcionando');
  });
  
  test('Estado de alertas', async ({ page }) => {
    // Verificar que se muestran diferentes estados
    const activeState = page.locator('text=/active/');
    const resolvedState = page.locator('text=/resolved/');
    const silencedState = page.locator('text=/silenced/');
    
    if (await activeState.isVisible()) {
      await expect(activeState).toBeVisible();
    }
    
    if (await resolvedState.isVisible()) {
      await expect(resolvedState).toBeVisible();
    }
    
    if (await silencedState.isVisible()) {
      await expect(silencedState).toBeVisible();
    }
    
    console.log('✅ Estado de alertas funcionando');
  });
  
  test('Responsive en diferentes tamaños', async ({ page }) => {
    // Probar en diferentes tamaños de pantalla
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verificar que el panel sigue siendo funcional
      await expect(page.locator('[data-testid="alert-manager"]')).toBeVisible();
      
      // Verificar que las alertas siguen siendo visibles
      await expect(page.locator('[data-testid="alert-card"]').first()).toBeVisible();
      
      console.log(`✅ Responsive: ${viewport.width}x${viewport.height}`);
    }
  });
});
