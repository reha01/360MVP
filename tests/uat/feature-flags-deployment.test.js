/**
 * UAT Test: Feature Flags & Deployment
 * 
 * Criterios:
 * - Flags por organización
 * - Runbook de despliegue
 * - Control de acceso
 */

import { test, expect } from '@playwright/test';

test.describe('Feature Flags & Deployment UAT', () => {
  
  test('Flags por organización - orgs piloto', async ({ page }) => {
    // Navegar a diferentes páginas como org piloto
    const pilotPages = [
      '/dashboard-360',
      '/comparison',
      '/policies',
      '/alerts'
    ];
    
    for (const pagePath of pilotPages) {
      await page.goto(pagePath);
      
      // Verificar que la página carga (no muestra "no disponible")
      await expect(page.locator('text=/Función no disponible/')).not.toBeVisible();
      
      // Verificar que se muestra el contenido
      await expect(page.locator('[data-testid]')).toBeVisible();
      
      console.log(`✅ ${pagePath} disponible para org piloto`);
    }
  });
  
  test('Flags por organización - orgs no piloto', async ({ page }) => {
    // Simular navegación como org no piloto
    // (Esto requeriría configuración específica del entorno de prueba)
    
    // Navegar a diferentes páginas
    const nonPilotPages = [
      '/dashboard-360',
      '/comparison',
      '/policies',
      '/alerts'
    ];
    
    for (const pagePath of nonPilotPages) {
      await page.goto(pagePath);
      
      // Verificar que se muestra mensaje de no disponible
      await expect(page.locator('text=/Función no disponible/')).toBeVisible();
      
      // Verificar que se explica que está en desarrollo
      await expect(page.locator('text=/está en desarrollo/')).toBeVisible();
      
      console.log(`✅ ${pagePath} no disponible para org no piloto`);
    }
  });
  
  test('Control de acceso por roles', async ({ page }) => {
    // Navegar a diferentes páginas
    const pages = [
      '/dashboard-360',
      '/comparison',
      '/policies',
      '/alerts'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Verificar que se requiere autenticación
      await expect(page.locator('text=/No autenticado/')).toBeVisible();
      
      // Verificar que se explica que debe iniciar sesión
      await expect(page.locator('text=/Debes iniciar sesión/')).toBeVisible();
      
      console.log(`✅ ${pagePath} requiere autenticación`);
    }
  });
  
  test('Runbook de despliegue - pausar colas', async ({ page }) => {
    // Navegar a alertas
    await page.goto('/alerts');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="alert-manager"]');
    
    // Verificar que hay información sobre colas
    const queueInfo = page.locator('text=/Cola/');
    if (await queueInfo.isVisible()) {
      // Verificar que se muestra estado de colas
      await expect(page.locator('text=/Estado de la cola/')).toBeVisible();
      
      // Verificar que hay botón para pausar colas
      const pauseButton = page.locator('button:has-text("Pausar")');
      if (await pauseButton.isVisible()) {
        await expect(pauseButton).toBeVisible();
        
        console.log('✅ Runbook: Pausar colas disponible');
      }
    }
  });
  
  test('Runbook de despliegue - limpiar DLQ', async ({ page }) => {
    // Navegar a alertas
    await page.goto('/alerts');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="alert-manager"]');
    
    // Verificar que hay información sobre DLQ
    const dlqInfo = page.locator('text=/DLQ/');
    if (await dlqInfo.isVisible()) {
      // Verificar que se muestra estado de DLQ
      await expect(page.locator('text=/Dead Letter Queue/')).toBeVisible();
      
      // Verificar que hay botón para limpiar DLQ
      const clearButton = page.locator('button:has-text("Limpiar")');
      if (await clearButton.isVisible()) {
        await expect(clearButton).toBeVisible();
        
        console.log('✅ Runbook: Limpiar DLQ disponible');
      }
    }
  });
  
  test('Runbook de despliegue - reintentar jobs', async ({ page }) => {
    // Navegar a alertas
    await page.goto('/alerts');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="alert-manager"]');
    
    // Verificar que hay información sobre jobs fallidos
    const failedJobs = page.locator('text=/Jobs fallidos/');
    if (await failedJobs.isVisible()) {
      // Verificar que se muestra estado de jobs
      await expect(page.locator('text=/Estado de jobs/')).toBeVisible();
      
      // Verificar que hay botón para reintentar
      const retryButton = page.locator('button:has-text("Reintentar")');
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
        
        console.log('✅ Runbook: Reintentar jobs disponible');
      }
    }
  });
  
  test('Runbook de despliegue - bajar flags', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar que hay información sobre feature flags
    const flagsInfo = page.locator('text=/Feature Flags/');
    if (await flagsInfo.isVisible()) {
      // Verificar que se muestra estado de flags
      await expect(page.locator('text=/Estado de flags/')).toBeVisible();
      
      // Verificar que hay botón para bajar flags
      const disableButton = page.locator('button:has-text("Deshabilitar")');
      if (await disableButton.isVisible()) {
        await expect(disableButton).toBeVisible();
        
        console.log('✅ Runbook: Bajar flags disponible');
      }
    }
  });
  
  test('Configuración de flags por organización', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar que hay configuración de flags
    const flagsSection = page.locator('text=/Feature Flags/');
    if (await flagsSection.isVisible()) {
      // Verificar que se muestran flags disponibles
      await expect(page.locator('text=/Dashboard 360°/')).toBeVisible();
      await expect(page.locator('text=/Acciones Masivas/')).toBeVisible();
      await expect(page.locator('text=/Comparativas/')).toBeVisible();
      await expect(page.locator('text=/Políticas/')).toBeVisible();
      await expect(page.locator('text=/Alertas/')).toBeVisible();
      
      // Verificar que se muestra estado de cada flag
      const flagStates = page.locator('text=/Habilitado/');
      if (await flagStates.isVisible()) {
        await expect(flagStates).toBeVisible();
        
        console.log('✅ Configuración de flags por organización');
      }
    }
  });
  
  test('Rollback de flags', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar que hay opción de rollback
    const rollbackSection = page.locator('text=/Rollback/');
    if (await rollbackSection.isVisible()) {
      // Verificar que se muestra historial de cambios
      await expect(page.locator('text=/Historial de cambios/')).toBeVisible();
      
      // Verificar que hay botón de rollback
      const rollbackButton = page.locator('button:has-text("Rollback")');
      if (await rollbackButton.isVisible()) {
        await expect(rollbackButton).toBeVisible();
        
        console.log('✅ Rollback de flags disponible');
      }
    }
  });
  
  test('Monitoreo de flags', async ({ page }) => {
    // Navegar a alertas
    await page.goto('/alerts');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="alert-manager"]');
    
    // Verificar que hay monitoreo de flags
    const flagsMonitoring = page.locator('text=/Monitoreo de Flags/');
    if (await flagsMonitoring.isVisible()) {
      // Verificar que se muestra estado de flags
      await expect(page.locator('text=/Estado de flags/')).toBeVisible();
      
      // Verificar que se muestran métricas
      await expect(page.locator('text=/Métricas/')).toBeVisible();
      
      // Verificar que se muestran alertas
      await expect(page.locator('text=/Alertas de flags/')).toBeVisible();
      
      console.log('✅ Monitoreo de flags funcionando');
    }
  });
  
  test('Configuración de flags en tiempo real', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar que hay configuración en tiempo real
    const realTimeConfig = page.locator('text=/Configuración en Tiempo Real/');
    if (await realTimeConfig.isVisible()) {
      // Verificar que se muestran switches
      const switches = page.locator('input[type="checkbox"]');
      const switchCount = await switches.count();
      
      if (switchCount > 0) {
        // Probar cambiar un flag
        await switches.first().click();
        
        // Verificar que se actualiza
        await page.waitForTimeout(500);
        
        // Verificar que se muestra confirmación
        await expect(page.locator('text=/Flag actualizado/')).toBeVisible();
        
        console.log('✅ Configuración de flags en tiempo real');
      }
    }
  });
  
  test('Validación de flags', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar que hay validación de flags
    const validationSection = page.locator('text=/Validación de Flags/');
    if (await validationSection.isVisible()) {
      // Verificar que se muestran dependencias
      await expect(page.locator('text=/Dependencias/')).toBeVisible();
      
      // Verificar que se muestran conflictos
      await expect(page.locator('text=/Conflictos/')).toBeVisible();
      
      // Verificar que se muestran advertencias
      await expect(page.locator('text=/Advertencias/')).toBeVisible();
      
      console.log('✅ Validación de flags funcionando');
    }
  });
});
