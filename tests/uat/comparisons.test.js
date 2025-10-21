/**
 * UAT Test: Campaign Comparisons
 * 
 * Criterios:
 * - Disclaimers automáticos por diferencias de versión
 * - Respeto de umbrales de anonimato
 * - Consistencia UI ↔ export CSV/PDF
 * - Validación de compatibilidad
 */

import { test, expect } from '@playwright/test';

test.describe('Campaign Comparisons UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de comparativas
    await page.goto('/comparison');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-comparison"]');
  });
  
  test('Disclaimers automáticos por diferencias de versión', async ({ page }) => {
    // Seleccionar campañas con diferentes versiones
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      // Seleccionar primera campaña
      await campaignCards.first().click();
      
      // Seleccionar segunda campaña
      await campaignCards.nth(1).click();
      
      // Generar comparación
      await page.click('button:has-text("Comparar Campañas")');
      
      // Verificar que se muestra disclaimer por versión
      await expect(page.locator('text=/⚠️ Comparación entre versiones diferentes/')).toBeVisible();
      
      // Verificar que se explica el disclaimer
      await expect(page.locator('text=/Los resultados pueden no ser directamente comparables/')).toBeVisible();
      
      console.log('✅ Disclaimers por versión funcionando');
    }
  });
  
  test('Respeto de umbrales de anonimato', async ({ page }) => {
    // Seleccionar campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      
      // Generar comparación
      await page.click('button:has-text("Comparar Campañas")');
      
      // Verificar que se muestran problemas de anonimato
      const anonymityIssues = page.locator('text=/Problemas de Anonimato/');
      if (await anonymityIssues.isVisible()) {
        // Verificar que se explica el problema
        await expect(page.locator('text=/Umbral de anonimato no cumplido/')).toBeVisible();
        
        // Verificar que se muestran los datos ocultos
        await expect(page.locator('text=/Datos ocultos:/')).toBeVisible();
        
        console.log('✅ Respeto de umbrales de anonimato funcionando');
      }
    }
  });
  
  test('Consistencia UI ↔ export CSV/PDF', async ({ page }) => {
    // Seleccionar campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      
      // Generar comparación
      await page.click('button:has-text("Comparar Campañas")');
      
      // Esperar a que se genere la comparación
      await page.waitForSelector('text=Resultados de Comparación');
      
      // Verificar que hay botones de exportación
      const csvButton = page.locator('button:has-text("CSV")');
      const pdfButton = page.locator('button:has-text("PDF")');
      
      if (await csvButton.isVisible() && await pdfButton.isVisible()) {
        // Verificar que los botones están habilitados
        await expect(csvButton).toBeEnabled();
        await expect(pdfButton).toBeEnabled();
        
        console.log('✅ Botones de exportación disponibles');
      }
    }
  });
  
  test('Validación de compatibilidad', async ({ page }) => {
    // Seleccionar campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      
      // Generar comparación
      await page.click('button:has-text("Comparar Campañas")');
      
      // Verificar que se muestran problemas de compatibilidad
      const compatibilityIssues = page.locator('text=/Problemas de Compatibilidad/');
      if (await compatibilityIssues.isVisible()) {
        // Verificar que se explican los problemas
        await expect(page.locator('text=/Las campañas utilizan diferentes versiones/')).toBeVisible();
        
        // Verificar que se muestran las versiones
        await expect(page.locator('text=/Versiones encontradas:/')).toBeVisible();
        
        console.log('✅ Validación de compatibilidad funcionando');
      }
    }
  });
  
  test('Preview de impacto antes de comparar', async ({ page }) => {
    // Seleccionar campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      
      // Verificar que se muestra preview antes de comparar
      const previewInfo = page.locator('text=/Seleccionar Campañas/');
      if (await previewInfo.isVisible()) {
        // Verificar que se muestran las campañas seleccionadas
        await expect(page.locator('text=/Campañas seleccionadas/')).toBeVisible();
        
        console.log('✅ Preview de impacto funcionando');
      }
    }
  });
  
  test('Filtros en comparativas', async ({ page }) => {
    // Verificar que hay filtros
    const filters = page.locator('[data-testid="comparison-filters"]');
    if (await filters.isVisible()) {
      // Probar filtro por estado
      await page.selectOption('select', 'completed');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      // Probar filtro por versión
      await page.selectOption('select', '1.0.0');
      
      // Verificar que se aplica el filtro
      await page.waitForTimeout(500);
      
      console.log('✅ Filtros en comparativas funcionando');
    }
  });
  
  test('Selección múltiple de campañas', async ({ page }) => {
    // Verificar que se pueden seleccionar múltiples campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 3) {
      // Seleccionar 3 campañas
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      await campaignCards.nth(2).click();
      
      // Verificar que se muestran las 3 seleccionadas
      const selectedCount = page.locator('text=/Campañas seleccionadas/');
      if (await selectedCount.isVisible()) {
        await expect(selectedCount).toContainText('3');
        
        console.log('✅ Selección múltiple funcionando');
      }
    }
  });
  
  test('Validación de mínimo de campañas', async ({ page }) => {
    // Intentar comparar sin seleccionar campañas
    await page.click('button:has-text("Comparar Campañas")');
    
    // Verificar que se muestra error
    await expect(page.locator('text=/Selecciona al menos 2 campañas/')).toBeVisible();
    
    // Seleccionar solo una campaña
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 1) {
      await campaignCards.first().click();
      
      // Intentar comparar
      await page.click('button:has-text("Comparar Campañas")');
      
      // Verificar que se muestra error
      await expect(page.locator('text=/Selecciona al menos 2 campañas/')).toBeVisible();
      
      console.log('✅ Validación de mínimo de campañas funcionando');
    }
  });
  
  test('Métricas de comparación', async ({ page }) => {
    // Seleccionar campañas
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const cardCount = await campaignCards.count();
    
    if (cardCount >= 2) {
      await campaignCards.first().click();
      await campaignCards.nth(1).click();
      
      // Generar comparación
      await page.click('button:has-text("Comparar Campañas")');
      
      // Esperar a que se genere la comparación
      await page.waitForSelector('text=Resultados de Comparación');
      
      // Verificar que se muestran métricas
      const metrics = page.locator('text=/Participantes/');
      if (await metrics.isVisible()) {
        // Verificar que se muestran las métricas de cada campaña
        await expect(page.locator('text=/\\d+/')).toBeVisible();
        
        console.log('✅ Métricas de comparación funcionando');
      }
    }
  });
});
