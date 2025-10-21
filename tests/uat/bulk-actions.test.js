/**
 * UAT 2: Acciones Masivas Testing
 * 
 * Validar reenvío de invitaciones y extensión de deadlines
 * Idempotencia (no duplicar envíos)
 * Backoff + DLQ visible en Centro de Alertas
 * Auditoría: quién ejecuta, cuántos afectados, resultados
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 2: Acciones Masivas', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login y navegación a campañas
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
  });

  test('Reenvío de invitaciones con idempotencia', async ({ page }) => {
    // Seleccionar campaña activa
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de evaluadores
    await page.click('[data-testid="evaluators-tab"]');
    await page.waitForSelector('[data-testid="evaluators-list"]');
    
    // Seleccionar evaluadores pendientes
    await page.check('[data-testid="select-all-pending"]');
    const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
    expect(parseInt(selectedCount)).toBeGreaterThan(0);
    
    // Ejecutar reenvío de invitaciones
    await page.click('[data-testid="bulk-resend-invitations"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    
    // Configurar mensaje personalizado
    await page.fill('[data-testid="custom-message"]', 'Recordatorio de evaluación');
    await page.selectOption('[data-testid="only-pending"]', 'true');
    
    // Ejecutar acción
    await page.click('[data-testid="execute-bulk-action"]');
    await page.waitForSelector('[data-testid="bulk-progress"]');
    
    // Verificar progreso
    const progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow');
    expect(parseInt(progress)).toBeGreaterThan(0);
    
    // Esperar a que termine
    await page.waitForSelector('[data-testid="bulk-completed"]', { timeout: 30000 });
    
    // Verificar resultados
    const results = await page.locator('[data-testid="bulk-results"]').textContent();
    expect(results).toContain('Invitaciones reenviadas');
    
    // Verificar auditoría
    await page.click('[data-testid="view-audit-log"]');
    await page.waitForSelector('[data-testid="audit-log"]');
    
    const auditEntry = page.locator('[data-testid="audit-entry"]:first-child');
    await expect(auditEntry).toContainText('Reenvío de invitaciones');
    await expect(auditEntry).toContainText(selectedCount);
    await expect(auditEntry).toContainText('Ejecutado por');
  });

  test('Extensión de deadlines con validación', async ({ page }) => {
    // Seleccionar campaña activa
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de evaluadores
    await page.click('[data-testid="evaluators-tab"]');
    await page.waitForSelector('[data-testid="evaluators-list"]');
    
    // Seleccionar evaluadores con deadline próximo
    await page.check('[data-testid="select-deadline-soon"]');
    const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
    expect(parseInt(selectedCount)).toBeGreaterThan(0);
    
    // Ejecutar extensión de deadline
    await page.click('[data-testid="bulk-extend-deadline"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    
    // Configurar extensión
    await page.fill('[data-testid="extension-days"]', '7');
    await page.fill('[data-testid="notification-message"]', 'El plazo ha sido extendido 7 días');
    
    // Ejecutar acción
    await page.click('[data-testid="execute-bulk-action"]');
    await page.waitForSelector('[data-testid="bulk-progress"]');
    
    // Verificar progreso
    const progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow');
    expect(parseInt(progress)).toBeGreaterThan(0);
    
    // Esperar a que termine
    await page.waitForSelector('[data-testid="bulk-completed"]', { timeout: 30000 });
    
    // Verificar que los deadlines se extendieron
    const extendedDeadlines = await page.locator('[data-testid="extended-deadline"]').count();
    expect(extendedDeadlines).toBe(parseInt(selectedCount));
    
    // Verificar auditoría
    await page.click('[data-testid="view-audit-log"]');
    await page.waitForSelector('[data-testid="audit-log"]');
    
    const auditEntry = page.locator('[data-testid="audit-entry"]:first-child');
    await expect(auditEntry).toContainText('Extensión de deadline');
    await expect(auditEntry).toContainText('7 días');
    await expect(auditEntry).toContainText(selectedCount);
  });

  test('Idempotencia en reenvío de invitaciones', async ({ page }) => {
    // Seleccionar campaña activa
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de evaluadores
    await page.click('[data-testid="evaluators-tab"]');
    await page.waitForSelector('[data-testid="evaluators-list"]');
    
    // Seleccionar evaluadores
    await page.check('[data-testid="select-all-pending"]');
    const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
    
    // Ejecutar reenvío por primera vez
    await page.click('[data-testid="bulk-resend-invitations"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    await page.click('[data-testid="execute-bulk-action"]');
    await page.waitForSelector('[data-testid="bulk-completed"]', { timeout: 30000 });
    
    // Obtener timestamp del primer envío
    const firstSendTime = await page.locator('[data-testid="last-send-time"]').textContent();
    
    // Ejecutar reenvío por segunda vez (debería ser idempotente)
    await page.click('[data-testid="bulk-resend-invitations"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    await page.click('[data-testid="execute-bulk-action"]');
    await page.waitForSelector('[data-testid="bulk-completed"]', { timeout: 30000 });
    
    // Verificar que no se duplicaron envíos
    const secondSendTime = await page.locator('[data-testid="last-send-time"]').textContent();
    expect(secondSendTime).toBe(firstSendTime);
    
    // Verificar que el contador de invitaciones no se duplicó
    const invitationCount = await page.locator('[data-testid="invitation-count"]').textContent();
    expect(parseInt(invitationCount)).toBe(parseInt(selectedCount));
  });

  test('Backoff + DLQ visible en Centro de Alertas', async ({ page }) => {
    // Simular fallo en envío de invitaciones
    await page.route('**/api/bulk-actions/resend-invitations', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });
    
    // Ejecutar acción que fallará
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    await page.click('[data-testid="evaluators-tab"]');
    await page.waitForSelector('[data-testid="evaluators-list"]');
    await page.check('[data-testid="select-all-pending"]');
    await page.click('[data-testid="bulk-resend-invitations"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    await page.click('[data-testid="execute-bulk-action"]');
    
    // Esperar a que falle y vaya a DLQ
    await page.waitForSelector('[data-testid="bulk-failed"]', { timeout: 30000 });
    
    // Ir al Centro de Alertas
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que aparece alerta de DLQ
    const dlqAlert = page.locator('[data-testid="dlq-alert"]');
    await expect(dlqAlert).toBeVisible();
    
    // Verificar detalles de la alerta
    await dlqAlert.click();
    await page.waitForSelector('[data-testid="alert-details"]');
    
    const alertDetails = await page.locator('[data-testid="alert-details"]').textContent();
    expect(alertDetails).toContain('Dead Letter Queue');
    expect(alertDetails).toContain('Reenvío de invitaciones');
    expect(alertDetails).toContain('5 intentos fallidos');
    
    // Verificar que se muestra información de backoff
    const backoffInfo = await page.locator('[data-testid="backoff-info"]').textContent();
    expect(backoffInfo).toContain('Backoff exponencial');
    expect(backoffInfo).toContain('1m, 2m, 4m, 8m, 16m');
  });

  test('Auditoría completa de acciones masivas', async ({ page }) => {
    // Ejecutar acción masiva
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    await page.click('[data-testid="evaluators-tab"]');
    await page.waitForSelector('[data-testid="evaluators-list"]');
    await page.check('[data-testid="select-all-pending"]');
    await page.click('[data-testid="bulk-resend-invitations"]');
    await page.waitForSelector('[data-testid="bulk-action-modal"]');
    await page.click('[data-testid="execute-bulk-action"]');
    await page.waitForSelector('[data-testid="bulk-completed"]', { timeout: 30000 });
    
    // Ir a auditoría
    await page.click('[data-testid="view-audit-log"]');
    await page.waitForSelector('[data-testid="audit-log"]');
    
    // Verificar entrada de auditoría
    const auditEntry = page.locator('[data-testid="audit-entry"]:first-child');
    
    // Verificar quién ejecutó
    await expect(auditEntry).toContainText('Ejecutado por:');
    await expect(auditEntry).toContainText('user@example.com');
    
    // Verificar cuántos afectados
    await expect(auditEntry).toContainText('Elementos afectados:');
    await expect(auditEntry).toContainText(/\d+/);
    
    // Verificar resultados
    await expect(auditEntry).toContainText('Resultados:');
    await expect(auditEntry).toContainText('Exitosos:');
    await expect(auditEntry).toContainText('Fallidos:');
    
    // Verificar timestamp
    await expect(auditEntry).toContainText('Timestamp:');
    await expect(auditEntry).toContainText(/\d{4}-\d{2}-\d{2}/);
    
    // Verificar IP y user agent
    await expect(auditEntry).toContainText('IP:');
    await expect(auditEntry).toContainText('User Agent:');
  });
});
