/**
 * UAT 4: Políticas Testing
 * 
 * Validar regla "solo endurecer": no permite bajar umbrales/relajar retención
 * "Preview de impacto" al subir umbrales (qué se ocultará)
 * Aplicación efectiva en reportes y exports
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 4: Políticas', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login y navegación a políticas
    await page.goto('/policies');
    await page.waitForLoadState('networkidle');
  });

  test('Regla "solo endurecer" en umbrales de anonimato', async ({ page }) => {
    // Ir a pestaña de privacidad
    await page.click('[data-testid="privacy-tab"]');
    await page.waitForSelector('[data-testid="privacy-policies"]');
    
    // Buscar política de umbrales de anonimato
    const anonymityPolicy = page.locator('[data-testid="anonymity-thresholds-policy"]');
    await expect(anonymityPolicy).toBeVisible();
    
    // Verificar valores actuales
    const currentPeerMin = await page.locator('[data-testid="current-peer-min"]').textContent();
    const globalPeerMin = await page.locator('[data-testid="global-peer-min"]').textContent();
    
    expect(parseInt(currentPeerMin)).toBeGreaterThanOrEqual(parseInt(globalPeerMin));
    
    // Intentar editar para relajar (debería estar deshabilitado)
    await page.click('[data-testid="edit-anonymity-thresholds"]');
    await page.waitForSelector('[data-testid="policy-form"]');
    
    // Intentar poner un valor menor al global (debería estar deshabilitado)
    const peerMinInput = page.locator('[data-testid="peer-min-input"]');
    await peerMinInput.fill('2'); // Valor menor al global (3)
    
    // Verificar que el botón de guardar está deshabilitado
    const saveButton = page.locator('[data-testid="save-policy"]');
    await expect(saveButton).toBeDisabled();
    
    // Verificar que aparece mensaje de error
    const errorMessage = page.locator('[data-testid="policy-error"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('Solo se pueden endurecer las políticas');
    expect(errorText).toContain('No se puede relajar el umbral');
    
    // Intentar poner un valor mayor al global (debería estar habilitado)
    await peerMinInput.fill('5'); // Valor mayor al global (3)
    
    // Verificar que el botón de guardar está habilitado
    await expect(saveButton).toBeEnabled();
    
    // Verificar que no aparece mensaje de error
    await expect(errorMessage).not.toBeVisible();
  });

  test('Regla "solo endurecer" en retención de datos', async ({ page }) => {
    // Ir a pestaña de compliance
    await page.click('[data-testid="compliance-tab"]');
    await page.waitForSelector('[data-testid="compliance-policies"]');
    
    // Buscar política de retención de datos
    const retentionPolicy = page.locator('[data-testid="data-retention-policy"]');
    await expect(retentionPolicy).toBeVisible();
    
    // Verificar valores actuales
    const currentRetention = await page.locator('[data-testid="current-retention-days"]').textContent();
    const globalRetention = await page.locator('[data-testid="global-retention-days"]').textContent();
    
    expect(parseInt(currentRetention)).toBeLessThanOrEqual(parseInt(globalRetention));
    
    // Intentar editar para relajar (debería estar deshabilitado)
    await page.click('[data-testid="edit-data-retention"]');
    await page.waitForSelector('[data-testid="policy-form"]');
    
    // Intentar poner un valor mayor al global (debería estar deshabilitado)
    const retentionInput = page.locator('[data-testid="retention-days-input"]');
    await retentionInput.fill('500'); // Valor mayor al global (365)
    
    // Verificar que el botón de guardar está deshabilitado
    const saveButton = page.locator('[data-testid="save-policy"]');
    await expect(saveButton).toBeDisabled();
    
    // Verificar que aparece mensaje de error
    const errorMessage = page.locator('[data-testid="policy-error"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('Solo se pueden endurecer las políticas');
    expect(errorText).toContain('No se puede relajar la retención');
    
    // Intentar poner un valor menor al global (debería estar habilitado)
    await retentionInput.fill('180'); // Valor menor al global (365)
    
    // Verificar que el botón de guardar está habilitado
    await expect(saveButton).toBeEnabled();
    
    // Verificar que no aparece mensaje de error
    await expect(errorMessage).not.toBeVisible();
  });

  test('Preview de impacto al subir umbrales', async ({ page }) => {
    // Ir a pestaña de privacidad
    await page.click('[data-testid="privacy-tab"]');
    await page.waitForSelector('[data-testid="privacy-policies"]');
    
    // Editar umbrales de anonimato
    await page.click('[data-testid="edit-anonymity-thresholds"]');
    await page.waitForSelector('[data-testid="policy-form"]');
    
    // Cambiar umbral de pares a un valor más alto
    const peerMinInput = page.locator('[data-testid="peer-min-input"]');
    await peerMinInput.fill('5');
    
    // Verificar que aparece preview de impacto
    const impactPreview = page.locator('[data-testid="impact-preview"]');
    await expect(impactPreview).toBeVisible();
    
    // Verificar contenido del preview
    const previewText = await impactPreview.textContent();
    expect(previewText).toContain('Preview de Impacto');
    expect(previewText).toContain('Se ocultarán datos de');
    expect(previewText).toContain('grupos con menos de 5 pares');
    
    // Verificar que se muestran estadísticas específicas
    const hiddenGroups = page.locator('[data-testid="hidden-groups-count"]');
    await expect(hiddenGroups).toBeVisible();
    
    const hiddenGroupsCount = await hiddenGroups.textContent();
    expect(parseInt(hiddenGroupsCount)).toBeGreaterThan(0);
    
    // Verificar que se muestran ejemplos de grupos que se ocultarán
    const hiddenExamples = page.locator('[data-testid="hidden-examples"]');
    await expect(hiddenExamples).toBeVisible();
    
    const examplesText = await hiddenExamples.textContent();
    expect(examplesText).toContain('Ejemplos de grupos que se ocultarán:');
    expect(examplesText).toContain('Grupo A: 3 pares');
    expect(examplesText).toContain('Grupo B: 4 pares');
    
    // Verificar que se muestra impacto en reportes
    const reportImpact = page.locator('[data-testid="report-impact"]');
    await expect(reportImpact).toBeVisible();
    
    const reportImpactText = await reportImpact.textContent();
    expect(reportImpactText).toContain('Impacto en reportes:');
    expect(reportImpactText).toContain('Se ocultarán secciones de');
    expect(reportImpactText).toContain('reportes existentes');
  });

  test('Aplicación efectiva en reportes', async ({ page }) => {
    // Configurar política de umbrales más restrictiva
    await page.click('[data-testid="privacy-tab"]');
    await page.waitForSelector('[data-testid="privacy-policies"]');
    
    await page.click('[data-testid="edit-anonymity-thresholds"]');
    await page.waitForSelector('[data-testid="policy-form"]');
    
    const peerMinInput = page.locator('[data-testid="peer-min-input"]');
    await peerMinInput.fill('5');
    
    await page.click('[data-testid="save-policy"]');
    await page.waitForSelector('[data-testid="policy-saved"]');
    
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña con datos
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Ver un reporte
    await page.click('[data-testid="report-card"]:first-child');
    await page.waitForSelector('[data-testid="report-viewer"]');
    
    // Verificar que se aplican los umbrales de anonimato
    const hiddenSections = page.locator('[data-testid="hidden-section"]');
    await expect(hiddenSections).toBeVisible();
    
    const hiddenText = await hiddenSections.textContent();
    expect(hiddenText).toContain('OCULTO');
    expect(hiddenText).toContain('Umbral de anonimato no cumplido');
    expect(hiddenText).toContain('Menos de 5 pares');
    
    // Verificar que no se muestran identificadores
    const evaluatorIds = page.locator('[data-testid="evaluator-id"]');
    const evaluatorCount = await evaluatorIds.count();
    expect(evaluatorCount).toBe(0);
  });

  test('Aplicación efectiva en exports', async ({ page }) => {
    // Configurar política de retención más restrictiva
    await page.click('[data-testid="compliance-tab"]');
    await page.waitForSelector('[data-testid="compliance-policies"]');
    
    await page.click('[data-testid="edit-data-retention"]');
    await page.waitForSelector('[data-testid="policy-form"]');
    
    const retentionInput = page.locator('[data-testid="retention-days-input"]');
    await retentionInput.fill('180');
    
    await page.click('[data-testid="save-policy"]');
    await page.waitForSelector('[data-testid="policy-saved"]');
    
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña con datos
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Exportar reporte
    await page.click('[data-testid="export-report"]');
    await page.waitForSelector('[data-testid="export-options"]');
    
    // Seleccionar formato CSV
    await page.click('[data-testid="export-csv"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que el CSV se descargó
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Verificar contenido del CSV (simulado)
    const csvContent = await page.evaluate(() => {
      return window.lastCsvContent || '';
    });
    
    // Verificar que se aplican las políticas de retención
    expect(csvContent).toContain('Política de retención: 180 días');
    
    // Verificar que se aplican los umbrales de anonimato
    if (csvContent.includes('OCULTO')) {
      expect(csvContent).toContain('Umbral de anonimato no cumplido');
      expect(csvContent).toContain('Menos de 5 pares');
    }
    
    // Verificar que se incluyen metadatos de política
    expect(csvContent).toContain('Política aplicada:');
    expect(csvContent).toContain('Umbral de anonimato: 5 pares');
    expect(csvContent).toContain('Retención de datos: 180 días');
  });

  test('Validación de precedencia de políticas', async ({ page }) => {
    // Verificar que se muestra la precedencia de políticas
    const precedenceInfo = page.locator('[data-testid="policy-precedence"]');
    await expect(precedenceInfo).toBeVisible();
    
    const precedenceText = await precedenceInfo.textContent();
    expect(precedenceText).toContain('Precedencia de Políticas');
    expect(precedenceText).toContain('Global → Organización → Campaña');
    expect(precedenceText).toContain('Solo se pueden endurecer');
    
    // Verificar que se muestran los niveles de precedencia
    const precedenceLevels = page.locator('[data-testid="precedence-level"]');
    const levelCount = await precedenceLevels.count();
    expect(levelCount).toBe(3);
    
    // Verificar que se muestran los valores de cada nivel
    const globalLevel = page.locator('[data-testid="precedence-global"]');
    await expect(globalLevel).toBeVisible();
    
    const orgLevel = page.locator('[data-testid="precedence-org"]');
    await expect(orgLevel).toBeVisible();
    
    const campaignLevel = page.locator('[data-testid="precedence-campaign"]');
    await expect(campaignLevel).toBeVisible();
    
    // Verificar que se muestra el valor efectivo
    const effectiveValue = page.locator('[data-testid="effective-value"]');
    await expect(effectiveValue).toBeVisible();
    
    const effectiveText = await effectiveValue.textContent();
    expect(effectiveText).toContain('Valor efectivo:');
    expect(effectiveText).toMatch(/\d+/);
  });
});
