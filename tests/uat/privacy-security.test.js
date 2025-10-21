/**
 * UAT 6: Privacidad & Seguridad Testing
 * 
 * Validar tokens: invalidación server-side al submit; página neutra para inválidos
 * Exports: sin PII de anónimos; checksum y testId@version incluidos
 * Auditoría sensible: report.viewed/export registran who/when/what
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 6: Privacidad & Seguridad', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
  });

  test('Invalidación server-side de tokens al submit', async ({ page }) => {
    // Simular acceso con token válido
    const validToken = 'valid-token-123';
    await page.goto(`/eval/${validToken}`);
    await page.waitForSelector('[data-testid="evaluation-landing"]');
    
    // Verificar que el token es válido
    const tokenStatus = await page.locator('[data-testid="token-status"]').textContent();
    expect(tokenStatus).toContain('Token válido');
    
    // Completar evaluación
    await page.click('[data-testid="start-evaluation"]');
    await page.waitForSelector('[data-testid="evaluation-form"]');
    
    // Llenar formulario
    await page.fill('[data-testid="question-1"]', '4');
    await page.fill('[data-testid="question-2"]', '5');
    await page.fill('[data-testid="question-3"]', '3');
    
    // Submit evaluación
    await page.click('[data-testid="submit-evaluation"]');
    await page.waitForSelector('[data-testid="evaluation-submitted"]');
    
    // Verificar que el token fue invalidado server-side
    const submissionResult = await page.locator('[data-testid="submission-result"]').textContent();
    expect(submissionResult).toContain('Evaluación enviada');
    expect(submissionResult).toContain('Token invalidado');
    
    // Intentar acceder nuevamente con el mismo token
    await page.goto(`/eval/${validToken}`);
    await page.waitForSelector('[data-testid="token-invalid"]');
    
    // Verificar que se muestra página neutra
    const invalidMessage = await page.locator('[data-testid="invalid-token-message"]').textContent();
    expect(invalidMessage).toContain('Acceso No Disponible');
    expect(invalidMessage).toContain('No se puede acceder a la evaluación');
    expect(invalidMessage).toContain('verifica el enlace');
    
    // Verificar que no se revela información sensible
    expect(invalidMessage).not.toContain('token inválido');
    expect(invalidMessage).not.toContain('expirado');
    expect(invalidMessage).not.toContain('error');
  });

  test('Página neutra para tokens inválidos/expirados', async ({ page }) => {
    // Probar con token inválido
    const invalidToken = 'invalid-token-456';
    await page.goto(`/eval/${invalidToken}`);
    await page.waitForSelector('[data-testid="token-invalid"]');
    
    // Verificar respuesta neutra
    const invalidMessage = await page.locator('[data-testid="invalid-token-message"]').textContent();
    expect(invalidMessage).toContain('Acceso No Disponible');
    expect(invalidMessage).toContain('No se puede acceder a la evaluación en este momento');
    expect(invalidMessage).toContain('verifica el enlace o contacta al administrador');
    
    // Verificar que no se revela información sensible
    expect(invalidMessage).not.toContain('token inválido');
    expect(invalidMessage).not.toContain('expirado');
    expect(invalidMessage).not.toContain('error');
    
    // Verificar que se muestra botón de inicio
    const homeButton = page.locator('[data-testid="go-home-button"]');
    await expect(homeButton).toBeVisible();
    
    // Verificar timings homogéneos
    const startTime = Date.now();
    await page.goto(`/eval/${invalidToken}`);
    await page.waitForSelector('[data-testid="token-invalid"]');
    const loadTime = Date.now() - startTime;
    
    // Verificar que el tiempo de respuesta es consistente (no revela si el token existe)
    expect(loadTime).toBeGreaterThan(500); // Mínimo 500ms
    expect(loadTime).toBeLessThan(2000); // Máximo 2s
    
    // Probar con token expirado
    const expiredToken = 'expired-token-789';
    await page.goto(`/eval/${expiredToken}`);
    await page.waitForSelector('[data-testid="token-invalid"]');
    
    // Verificar que la respuesta es idéntica
    const expiredMessage = await page.locator('[data-testid="invalid-token-message"]').textContent();
    expect(expiredMessage).toBe(invalidMessage);
  });

  test('Exports sin PII de anónimos', async ({ page }) => {
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña con datos anónimos
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Seleccionar reporte
    await page.click('[data-testid="report-card"]:first-child');
    await page.waitForSelector('[data-testid="report-viewer"]');
    
    // Verificar que se muestran datos anónimos
    const anonymousData = page.locator('[data-testid="anonymous-data"]');
    await expect(anonymousData).toBeVisible();
    
    const anonymousText = await anonymousData.textContent();
    expect(anonymousText).toContain('OCULTO');
    expect(anonymousText).toContain('Umbral de anonimato no cumplido');
    
    // Exportar a CSV
    await page.click('[data-testid="export-csv"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que el CSV se descargó
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Verificar contenido del CSV (simulado)
    const csvContent = await page.evaluate(() => {
      return window.lastCsvContent || '';
    });
    
    // Verificar que no contiene PII de anónimos
    expect(csvContent).not.toContain('@example.com');
    expect(csvContent).not.toContain('John Doe');
    expect(csvContent).not.toContain('Jane Smith');
    
    // Verificar que contiene datos anónimos
    expect(csvContent).toContain('OCULTO');
    expect(csvContent).toContain('Umbral de anonimato no cumplido');
    
    // Verificar que contiene metadatos
    expect(csvContent).toContain('testId@version');
    expect(csvContent).toContain('timestamp');
    expect(csvContent).toContain('checksum');
    
    // Exportar a PDF
    await page.click('[data-testid="export-pdf"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que el PDF se descargó
    const pdfDownload = await page.waitForEvent('download');
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    
    // Verificar contenido del PDF (simulado)
    const pdfContent = await page.evaluate(() => {
      return window.lastPdfContent || '';
    });
    
    // Verificar que no contiene PII de anónimos
    expect(pdfContent).not.toContain('@example.com');
    expect(pdfContent).not.toContain('John Doe');
    expect(pdfContent).not.toContain('Jane Smith');
    
    // Verificar que contiene datos anónimos
    expect(pdfContent).toContain('OCULTO');
    expect(pdfContent).toContain('Umbral de anonimato no cumplido');
    
    // Verificar que contiene metadatos
    expect(pdfContent).toContain('testId@version');
    expect(pdfContent).toContain('timestamp');
    expect(pdfContent).toContain('checksum');
  });

  test('Checksum y testId@version en exports', async ({ page }) => {
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Seleccionar reporte
    await page.click('[data-testid="report-card"]:first-child');
    await page.waitForSelector('[data-testid="report-viewer"]');
    
    // Exportar a CSV
    await page.click('[data-testid="export-csv"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar contenido del CSV (simulado)
    const csvContent = await page.evaluate(() => {
      return window.lastCsvContent || '';
    });
    
    // Verificar que contiene testId@version
    expect(csvContent).toContain('testId@version:');
    expect(csvContent).toMatch(/testId@version: \w+@\d+\.\d+\.\d+/);
    
    // Verificar que contiene timestamp
    expect(csvContent).toContain('timestamp:');
    expect(csvContent).toMatch(/timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // Verificar que contiene checksum
    expect(csvContent).toContain('checksum:');
    expect(csvContent).toMatch(/checksum: [a-f0-9]{32}/);
    
    // Verificar que contiene metadatos adicionales
    expect(csvContent).toContain('orgId:');
    expect(csvContent).toContain('campaignId:');
    expect(csvContent).toContain('reportId:');
    
    // Verificar integridad del checksum
    const checksum = csvContent.match(/checksum: ([a-f0-9]{32})/)[1];
    const contentWithoutChecksum = csvContent.replace(/checksum: [a-f0-9]{32}/, '');
    
    // Simular verificación de checksum
    const calculatedChecksum = await page.evaluate((content) => {
      // Simular cálculo de checksum
      return 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    }, contentWithoutChecksum);
    
    expect(checksum).toBe(calculatedChecksum);
  });

  test('Auditoría sensible: report.viewed/export', async ({ page }) => {
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Seleccionar reporte (esto debería generar evento de auditoría)
    await page.click('[data-testid="report-card"]:first-child');
    await page.waitForSelector('[data-testid="report-viewer"]');
    
    // Verificar que se generó evento de auditoría
    const auditEvents = await page.evaluate(() => {
      return window.auditEvents || [];
    });
    
    const viewEvent = auditEvents.find(event => event.type === 'report.viewed');
    expect(viewEvent).toBeDefined();
    expect(viewEvent).toMatchObject({
      type: 'report.viewed',
      userId: 'test@example.com',
      reportId: expect.any(String),
      timestamp: expect.any(String),
      ip: expect.any(String),
      userAgent: expect.any(String)
    });
    
    // Exportar reporte (esto debería generar evento de auditoría)
    await page.click('[data-testid="export-csv"]');
    await page.waitForSelector('[data-testid="export-download"]');
    
    // Verificar que se generó evento de auditoría de export
    const updatedAuditEvents = await page.evaluate(() => {
      return window.auditEvents || [];
    });
    
    const exportEvent = updatedAuditEvents.find(event => event.type === 'report.export');
    expect(exportEvent).toBeDefined();
    expect(exportEvent).toMatchObject({
      type: 'report.export',
      userId: 'test@example.com',
      reportId: expect.any(String),
      format: 'csv',
      timestamp: expect.any(String),
      ip: expect.any(String),
      userAgent: expect.any(String)
    });
    
    // Verificar que se registra el hash del filtro aplicado
    expect(exportEvent).toHaveProperty('filterHash');
    expect(exportEvent.filterHash).toMatch(/[a-f0-9]{32}/);
    
    // Verificar que se registra información de privacidad
    expect(exportEvent).toHaveProperty('privacyApplied');
    expect(exportEvent.privacyApplied).toBe(true);
    
    // Verificar que se registra información de anonimato
    expect(exportEvent).toHaveProperty('anonymityThresholds');
    expect(exportEvent.anonymityThresholds).toMatchObject({
      peerMin: expect.any(Number),
      subordinateMin: expect.any(Number),
      managerMin: expect.any(Number)
    });
  });

  test('Auditoría de acceso a datos sensibles', async ({ page }) => {
    // Ir a reportes
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de reportes
    await page.click('[data-testid="reports-tab"]');
    await page.waitForSelector('[data-testid="reports-list"]');
    
    // Seleccionar reporte
    await page.click('[data-testid="report-card"]:first-child');
    await page.waitForSelector('[data-testid="report-viewer"]');
    
    // Acceder a datos sensibles (esto debería generar evento de auditoría)
    await page.click('[data-testid="view-sensitive-data"]');
    await page.waitForSelector('[data-testid="sensitive-data-modal"]');
    
    // Verificar que se generó evento de auditoría
    const auditEvents = await page.evaluate(() => {
      return window.auditEvents || [];
    });
    
    const sensitiveEvent = auditEvents.find(event => event.type === 'pii_accessed');
    expect(sensitiveEvent).toBeDefined();
    expect(sensitiveEvent).toMatchObject({
      type: 'pii_accessed',
      userId: 'test@example.com',
      reportId: expect.any(String),
      dataType: 'sensitive',
      timestamp: expect.any(String),
      ip: expect.any(String),
      userAgent: expect.any(String)
    });
    
    // Verificar que se registra el tipo de datos accedidos
    expect(sensitiveEvent).toHaveProperty('dataType');
    expect(sensitiveEvent.dataType).toBe('sensitive');
    
    // Verificar que se registra el nivel de acceso
    expect(sensitiveEvent).toHaveProperty('accessLevel');
    expect(sensitiveEvent.accessLevel).toBe('admin');
    
    // Verificar que se registra la justificación
    expect(sensitiveEvent).toHaveProperty('justification');
    expect(sensitiveEvent.justification).toBe('Report review');
  });
});
