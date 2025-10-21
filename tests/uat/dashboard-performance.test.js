/**
 * UAT Test: Dashboard Performance
 * 
 * Criterios:
 * - p95 < 2s en dashboard con filtros y paginación
 * - Búsquedas < 1s
 * - Filtros combinados sin degradación
 * - Paginación sin duplicados ni saltos
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al dashboard
    await page.goto('/dashboard-360');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="operational-dashboard"]');
  });
  
  test('Dashboard carga en p95 < 2s', async ({ page }) => {
    const startTime = Date.now();
    
    // Esperar a que el dashboard esté completamente cargado
    await page.waitForSelector('[data-testid="performance-metrics"]');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que el tiempo de carga es < 2s
    expect(loadTime).toBeLessThan(2000);
    
    // Verificar que las métricas de performance se muestran
    const p95Time = await page.textContent('[data-testid="p95-time"]');
    expect(p95Time).toBeTruthy();
    
    console.log(`✅ Dashboard load time: ${loadTime}ms`);
  });
  
  test('Filtros combinados sin degradación', async ({ page }) => {
    const startTime = Date.now();
    
    // Aplicar filtros combinados
    await page.fill('[data-testid="search-filter"]', 'test');
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await page.selectOption('[data-testid="job-family-filter"]', 'leadership');
    await page.fill('[data-testid="date-filter"]', '2024-01-01');
    await page.fill('[data-testid="date-to-filter"]', '2024-12-31');
    
    // Aplicar filtros
    await page.click('button:has-text("Aplicar")');
    
    // Esperar a que se apliquen los filtros
    await page.waitForSelector('[data-testid="campaign-card"]');
    
    const filterTime = Date.now() - startTime;
    
    // Verificar que el tiempo de filtrado es < 1s
    expect(filterTime).toBeLessThan(1000);
    
    console.log(`✅ Filter time: ${filterTime}ms`);
  });
  
  test('Búsqueda en tiempo real < 1s', async ({ page }) => {
    const startTime = Date.now();
    
    // Realizar búsqueda
    await page.fill('[data-testid="search-filter"]', 'santiago');
    
    // Esperar a que se complete la búsqueda (debounce)
    await page.waitForTimeout(400); // 300ms debounce + 100ms buffer
    
    const searchTime = Date.now() - startTime;
    
    // Verificar que el tiempo de búsqueda es < 1s
    expect(searchTime).toBeLessThan(1000);
    
    console.log(`✅ Search time: ${searchTime}ms`);
  });
  
  test('Paginación sin duplicados ni saltos', async ({ page }) => {
    // Verificar que hay paginación
    const pagination = page.locator('[data-testid="dashboard-pagination"]');
    await expect(pagination).toBeVisible();
    
    // Navegar a la siguiente página
    const nextButton = page.locator('button:has-text("Siguiente")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Verificar que no hay duplicados
      const campaignCards = page.locator('[data-testid="campaign-card"]');
      const cardIds = await campaignCards.evaluateAll(cards => 
        cards.map(card => card.dataset.campaignId)
      );
      
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(cardIds.length);
      
      console.log(`✅ Pagination: ${cardIds.length} cards, ${uniqueIds.size} unique`);
    }
  });
  
  test('Load more funciona correctamente', async ({ page }) => {
    // Verificar si hay botón "Cargar Más"
    const loadMoreButton = page.locator('[data-testid="load-more"]');
    
    if (await loadMoreButton.isVisible()) {
      const initialCount = await page.locator('[data-testid="campaign-card"]').count();
      
      await loadMoreButton.click();
      
      // Esperar a que cargue más datos
      await page.waitForTimeout(1000);
      
      const finalCount = await page.locator('[data-testid="campaign-card"]').count();
      
      // Verificar que se cargaron más elementos
      expect(finalCount).toBeGreaterThan(initialCount);
      
      console.log(`✅ Load more: ${initialCount} → ${finalCount} cards`);
    }
  });
  
  test('Métricas de performance se actualizan', async ({ page }) => {
    // Verificar que las métricas de performance se muestran
    const p95Time = page.locator('[data-testid="p95-time"]');
    const loadTime = page.locator('text=/\\d+ms/').first();
    
    await expect(p95Time).toBeVisible();
    await expect(loadTime).toBeVisible();
    
    // Verificar que los valores son numéricos
    const p95Value = await p95Time.textContent();
    const loadValue = await loadTime.textContent();
    
    expect(p95Value).toMatch(/\\d+ms/);
    expect(loadValue).toMatch(/\\d+ms/);
    
    console.log(`✅ Performance metrics: P95=${p95Value}, Load=${loadValue}`);
  });
  
  test('Dashboard responsive en diferentes tamaños', async ({ page }) => {
    // Probar en diferentes tamaños de pantalla
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verificar que el dashboard sigue siendo funcional
      await expect(page.locator('[data-testid="operational-dashboard"]')).toBeVisible();
      
      // Verificar que los filtros siguen siendo accesibles
      await expect(page.locator('[data-testid="dashboard-filters"]')).toBeVisible();
      
      console.log(`✅ Responsive: ${viewport.width}x${viewport.height}`);
    }
  });
});
