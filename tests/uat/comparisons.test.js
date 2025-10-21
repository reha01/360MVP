/**
 * UAT 3: Comparativas Testing
 * 
 * Validar comparativas entre campañas con disclaimer automático si testId@version difiere
 * Respeto de umbrales (no re-identificar grupos pequeños)
 * Consistencia UI ↔ export CSV/PDF
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 3: Comparativas', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login y navegación a comparativas
    await page.goto('/comparison');
    await page.waitForLoadState('networkidle');
  });

  test('Disclaimer automático para versiones diferentes', async ({ page }) => {
    // Seleccionar tipo de comparación
    await page.click('[data-testid="comparison-type-temporal"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    // Seleccionar primera campaña (versión 1.0)
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-v1-0');
    await page.waitForSelector('[data-testid="campaign-1-selected"]');
    
    // Seleccionar segunda campaña (versión 1.1)
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-v1-1');
    await page.waitForSelector('[data-testid="campaign-2-selected"]');
    
    // Iniciar comparativa
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Verificar que aparece disclaimer de versión
    const versionDisclaimer = page.locator('[data-testid="version-disclaimer"]');
    await expect(versionDisclaimer).toBeVisible();
    
    // Verificar contenido del disclaimer
    const disclaimerText = await versionDisclaimer.textContent();
    expect(disclaimerText).toContain('Versiones Parcialmente Compatibles');
    expect(disclaimerText).toContain('1.0, 1.1');
    expect(disclaimerText).toContain('no son directamente comparables');
    expect(disclaimerText).toContain('interpretar las diferencias con cautela');
    
    // Verificar que el disclaimer tiene el color de advertencia
    const disclaimerClass = await versionDisclaimer.getAttribute('class');
    expect(disclaimerClass).toContain('warning');
  });

  test('Disclaimer para versiones incompatibles', async ({ page }) => {
    // Seleccionar campañas con versiones incompatibles
    await page.click('[data-testid="comparison-type-cross-campaign"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-v1-0');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-v2-0');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Verificar disclaimer de incompatibilidad
    const versionDisclaimer = page.locator('[data-testid="version-disclaimer"]');
    await expect(versionDisclaimer).toBeVisible();
    
    const disclaimerText = await versionDisclaimer.textContent();
    expect(disclaimerText).toContain('Versiones Incompatibles');
    expect(disclaimerText).toContain('NO son comparables');
    expect(disclaimerText).toContain('no realizar comparaciones directas');
    
    // Verificar que el disclaimer tiene el color de error
    const disclaimerClass = await versionDisclaimer.getAttribute('class');
    expect(disclaimerClass).toContain('error');
  });

  test('Respeto de umbrales de anonimato', async ({ page }) => {
    // Seleccionar campañas para comparar
    await page.click('[data-testid="comparison-type-temporal"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-small-group');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-large-group');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Verificar que se respetan los umbrales de anonimato
    const anonymityWarning = page.locator('[data-testid="anonymity-warning"]');
    await expect(anonymityWarning).toBeVisible();
    
    const warningText = await anonymityWarning.textContent();
    expect(warningText).toContain('Umbral de anonimato no cumplido');
    expect(warningText).toContain('Datos ocultos por privacidad');
    
    // Verificar que los datos sensibles están ocultos
    const hiddenData = page.locator('[data-testid="hidden-data"]');
    await expect(hiddenData).toBeVisible();
    
    const hiddenText = await hiddenData.textContent();
    expect(hiddenText).toContain('OCULTO');
    expect(hiddenText).toContain('Umbral de anonimato no cumplido');
    
    // Verificar que no se muestran identificadores
    const evaluatorIds = page.locator('[data-testid="evaluator-id"]');
    const evaluatorCount = await evaluatorIds.count();
    expect(evaluatorCount).toBe(0);
  });

  test('Consistencia UI ↔ export CSV', async ({ page }) => {
    // Realizar comparativa
    await page.click('[data-testid="comparison-type-temporal"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-v1-0');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-v1-1');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Obtener datos de la UI
    const uiData = await page.evaluate(() => {
      const metrics = {};
      document.querySelectorAll('[data-testid="comparison-metric"]').forEach(metric => {
        const label = metric.querySelector('[data-testid="metric-label"]').textContent;
        const value = metric.querySelector('[data-testid="metric-value"]').textContent;
        metrics[label] = value;
      });
      return metrics;
    });
    
    // Exportar a CSV
    await page.click('[data-testid="export-csv"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que el CSV se descargó
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('comparison');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Verificar contenido del CSV (simulado)
    const csvContent = await page.evaluate(() => {
      return window.lastCsvContent || '';
    });
    
    // Verificar que el CSV contiene los mismos datos que la UI
    Object.entries(uiData).forEach(([label, value]) => {
      expect(csvContent).toContain(label);
      expect(csvContent).toContain(value);
    });
    
    // Verificar que el CSV incluye metadatos
    expect(csvContent).toContain('testId@version');
    expect(csvContent).toContain('timestamp');
    expect(csvContent).toContain('checksum');
    
    // Verificar que los datos ocultos en UI también están ocultos en CSV
    if (csvContent.includes('OCULTO')) {
      expect(csvContent).toContain('Umbral de anonimato no cumplido');
    }
  });

  test('Consistencia UI ↔ export PDF', async ({ page }) => {
    // Realizar comparativa
    await page.click('[data-testid="comparison-type-temporal"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-v1-0');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-v1-1');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Obtener datos de la UI
    const uiData = await page.evaluate(() => {
      const metrics = {};
      document.querySelectorAll('[data-testid="comparison-metric"]').forEach(metric => {
        const label = metric.querySelector('[data-testid="metric-label"]').textContent;
        const value = metric.querySelector('[data-testid="metric-value"]').textContent;
        metrics[label] = value;
      });
      return metrics;
    });
    
    // Exportar a PDF
    await page.click('[data-testid="export-pdf"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que el PDF se descargó
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('comparison');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Verificar contenido del PDF (simulado)
    const pdfContent = await page.evaluate(() => {
      return window.lastPdfContent || '';
    });
    
    // Verificar que el PDF contiene los mismos datos que la UI
    Object.entries(uiData).forEach(([label, value]) => {
      expect(pdfContent).toContain(label);
      expect(pdfContent).toContain(value);
    });
    
    // Verificar que el PDF incluye metadatos
    expect(pdfContent).toContain('testId@version');
    expect(pdfContent).toContain('timestamp');
    expect(pdfContent).toContain('checksum');
    
    // Verificar que el PDF incluye disclaimer de versión
    expect(pdfContent).toContain('Versiones Parcialmente Compatibles');
    expect(pdfContent).toContain('interpretar las diferencias con cautela');
  });

  test('Comparativa temporal con datos históricos', async ({ page }) => {
    // Seleccionar comparativa temporal
    await page.click('[data-testid="comparison-type-temporal"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    // Seleccionar campañas del mismo período pero diferentes años
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-2023-q1');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-2024-q1');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Verificar que se muestran métricas comparativas
    const comparisonMetrics = page.locator('[data-testid="comparison-metrics"]');
    await expect(comparisonMetrics).toBeVisible();
    
    // Verificar métricas específicas
    const responseRateDiff = await page.locator('[data-testid="response-rate-difference"]').textContent();
    expect(responseRateDiff).toMatch(/[+-]\d+%/);
    
    const evaluateeCountDiff = await page.locator('[data-testid="evaluatee-count-difference"]').textContent();
    expect(evaluateeCountDiff).toMatch(/[+-]\d+/);
    
    // Verificar que se muestra evolución temporal
    const temporalEvolution = page.locator('[data-testid="temporal-evolution"]');
    await expect(temporalEvolution).toBeVisible();
    
    const evolutionText = await temporalEvolution.textContent();
    expect(evolutionText).toContain('Evolución temporal');
    expect(evolutionText).toContain('2023 Q1');
    expect(evolutionText).toContain('2024 Q1');
  });

  test('Comparativa por Job Family', async ({ page }) => {
    // Seleccionar comparativa por Job Family
    await page.click('[data-testid="comparison-type-job-family"]');
    await page.waitForSelector('[data-testid="campaign-selector"]');
    
    // Seleccionar campañas de diferentes Job Families
    await page.selectOption('[data-testid="campaign-1-select"]', 'campaign-leadership');
    await page.selectOption('[data-testid="campaign-2-select"]', 'campaign-technical');
    
    await page.click('[data-testid="start-comparison"]');
    await page.waitForSelector('[data-testid="comparison-results"]');
    
    // Verificar que se muestran diferencias por Job Family
    const jobFamilyComparison = page.locator('[data-testid="job-family-comparison"]');
    await expect(jobFamilyComparison).toBeVisible();
    
    // Verificar que se muestran competencias específicas
    const leadershipCompetencies = page.locator('[data-testid="leadership-competencies"]');
    await expect(leadershipCompetencies).toBeVisible();
    
    const technicalCompetencies = page.locator('[data-testid="technical-competencies"]');
    await expect(technicalCompetencies).toBeVisible();
    
    // Verificar que se muestran benchmarks por Job Family
    const benchmarks = page.locator('[data-testid="job-family-benchmarks"]');
    await expect(benchmarks).toBeVisible();
    
    const benchmarkText = await benchmarks.textContent();
    expect(benchmarkText).toContain('Leadership');
    expect(benchmarkText).toContain('Technical');
  });
});
