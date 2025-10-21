/**
 * UAT 1: Dashboard Performance Testing
 * 
 * Validar cargas p95 < 2s con datos "reales" (≥5 campañas, ≥200 evaluaciones)
 * Filtros combinados sin degradar performance
 * Paginación sin duplicados ni saltos
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 1: Dashboard Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login y navegación a dashboard
    await page.goto('/dashboard-360');
    await page.waitForLoadState('networkidle');
  });

  test('Carga inicial p95 < 2s con datos reales', async ({ page }) => {
    const startTime = Date.now();
    
    // Esperar a que el dashboard cargue completamente
    await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que la carga sea < 2s (2000ms)
    expect(loadTime).toBeLessThan(2000);
    
    // Verificar que se muestren al menos 5 campañas
    const campaignCards = await page.locator('[data-testid="campaign-card"]').count();
    expect(campaignCards).toBeGreaterThanOrEqual(5);
    
    // Verificar que se muestren métricas de al menos 200 evaluaciones
    const totalEvaluations = await page.locator('[data-testid="total-evaluations"]').textContent();
    expect(parseInt(totalEvaluations)).toBeGreaterThanOrEqual(200);
  });

  test('Filtros combinados sin degradar performance', async ({ page }) => {
    // Aplicar filtros combinados
    await page.fill('[data-testid="search-filter"]', 'test campaign');
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await page.selectOption('[data-testid="job-family-filter"]', 'leadership');
    await page.fill('[data-testid="date-filter"]', '2024-01-01');
    
    const startTime = Date.now();
    
    // Esperar a que se apliquen los filtros
    await page.waitForSelector('[data-testid="filtered-results"]', { timeout: 5000 });
    
    const filterTime = Date.now() - startTime;
    
    // Verificar que los filtros se apliquen < 1s
    expect(filterTime).toBeLessThan(1000);
    
    // Verificar que los resultados estén filtrados correctamente
    const filteredCards = await page.locator('[data-testid="campaign-card"]').count();
    expect(filteredCards).toBeGreaterThan(0);
    
    // Verificar que todos los cards mostrados cumplan los filtros
    const campaignNames = await page.locator('[data-testid="campaign-name"]').allTextContents();
    campaignNames.forEach(name => {
      expect(name.toLowerCase()).toContain('test campaign');
    });
  });

  test('Paginación sin duplicados ni saltos', async ({ page }) => {
    // Verificar que hay paginación
    const pagination = page.locator('[data-testid="pagination"]');
    await expect(pagination).toBeVisible();
    
    // Obtener IDs de las primeras 20 campañas
    const firstPageIds = await page.locator('[data-testid="campaign-id"]').allTextContents();
    expect(firstPageIds).toHaveLength(20);
    
    // Ir a la página 2
    await page.click('[data-testid="page-2"]');
    await page.waitForSelector('[data-testid="page-2-active"]');
    
    // Obtener IDs de la segunda página
    const secondPageIds = await page.locator('[data-testid="campaign-id"]').allTextContents();
    expect(secondPageIds).toHaveLength(20);
    
    // Verificar que no hay duplicados entre páginas
    const hasDuplicates = firstPageIds.some(id => secondPageIds.includes(id));
    expect(hasDuplicates).toBe(false);
    
    // Volver a la página 1
    await page.click('[data-testid="page-1"]');
    await page.waitForSelector('[data-testid="page-1-active"]');
    
    // Verificar que los IDs de la página 1 son los mismos
    const firstPageIdsAgain = await page.locator('[data-testid="campaign-id"]').allTextContents();
    expect(firstPageIdsAgain).toEqual(firstPageIds);
  });

  test('Load more sin duplicados', async ({ page }) => {
    // Verificar que hay botón "Load More"
    const loadMoreButton = page.locator('[data-testid="load-more"]');
    await expect(loadMoreButton).toBeVisible();
    
    // Obtener IDs iniciales
    const initialIds = await page.locator('[data-testid="campaign-id"]').allTextContents();
    const initialCount = initialIds.length;
    
    // Hacer clic en "Load More"
    await loadMoreButton.click();
    await page.waitForSelector('[data-testid="loading-more"]', { state: 'hidden' });
    
    // Verificar que se cargaron más elementos
    const newIds = await page.locator('[data-testid="campaign-id"]').allTextContents();
    expect(newIds.length).toBeGreaterThan(initialCount);
    
    // Verificar que no hay duplicados
    const uniqueIds = [...new Set(newIds)];
    expect(uniqueIds.length).toBe(newIds.length);
    
    // Verificar que los IDs iniciales están incluidos
    initialIds.forEach(id => {
      expect(newIds).toContain(id);
    });
  });

  test('Búsqueda en tiempo real con debounce', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-filter"]');
    
    // Escribir "test" letra por letra
    await searchInput.fill('t');
    await page.waitForTimeout(100);
    await searchInput.fill('te');
    await page.waitForTimeout(100);
    await searchInput.fill('tes');
    await page.waitForTimeout(100);
    await searchInput.fill('test');
    
    // Verificar que solo se ejecutó una búsqueda (debounce)
    const searchRequests = await page.evaluate(() => {
      return window.searchRequestCount || 0;
    });
    expect(searchRequests).toBeLessThanOrEqual(2); // Máximo 2 requests por debounce
  });

  test('Métricas de performance en tiempo real', async ({ page }) => {
    // Verificar que se muestran métricas de performance
    const performanceMetrics = page.locator('[data-testid="performance-metrics"]');
    await expect(performanceMetrics).toBeVisible();
    
    // Verificar métricas específicas
    const p95Time = await page.locator('[data-testid="p95-time"]').textContent();
    expect(parseFloat(p95Time)).toBeLessThan(2000);
    
    const totalRequests = await page.locator('[data-testid="total-requests"]').textContent();
    expect(parseInt(totalRequests)).toBeGreaterThan(0);
    
    const cacheHitRate = await page.locator('[data-testid="cache-hit-rate"]').textContent();
    expect(parseFloat(cacheHitRate)).toBeGreaterThan(0.8); // 80% cache hit rate
  });
});
