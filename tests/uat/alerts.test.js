/**
 * UAT 5: Alertas Testing
 * 
 * Validar simulación de DLQ, cuotas y bounces
 * Alertas llegan y se silencian cuando se resuelve
 * Enlaces desde alerta → registro/acción relacionada
 * Rate-limit por plan realmente bloquea/avisa
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 5: Alertas', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login y navegación a alertas
    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');
  });

  test('Simulación de DLQ y alertas en tiempo real', async ({ page }) => {
    // Verificar que se muestran alertas de DLQ
    const dlqAlert = page.locator('[data-testid="dlq-alert"]');
    await expect(dlqAlert).toBeVisible();
    
    // Verificar contenido de la alerta
    const alertContent = await dlqAlert.textContent();
    expect(alertContent).toContain('Dead Letter Queue');
    expect(alertContent).toContain('5 elementos fallidos');
    expect(alertContent).toContain('Reenvío de invitaciones');
    
    // Verificar severidad crítica
    const alertClass = await dlqAlert.getAttribute('class');
    expect(alertClass).toContain('critical');
    
    // Verificar timestamp
    const timestamp = await dlqAlert.locator('[data-testid="alert-timestamp"]').textContent();
    expect(timestamp).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    
    // Verificar contador de ocurrencias
    const occurrenceCount = await dlqAlert.locator('[data-testid="occurrence-count"]').textContent();
    expect(parseInt(occurrenceCount)).toBeGreaterThan(0);
  });

  test('Simulación de cuotas excedidas', async ({ page }) => {
    // Verificar que se muestran alertas de cuota
    const quotaAlert = page.locator('[data-testid="quota-alert"]');
    await expect(quotaAlert).toBeVisible();
    
    // Verificar contenido de la alerta
    const alertContent = await quotaAlert.textContent();
    expect(alertContent).toContain('Cuota de Emails Excedida');
    expect(alertContent).toContain('Límite diario alcanzado');
    expect(alertContent).toContain('100/100 emails');
    
    // Verificar severidad de advertencia
    const alertClass = await quotaAlert.getAttribute('class');
    expect(alertClass).toContain('warning');
    
    // Verificar que se muestra tiempo de reset
    const resetTime = await quotaAlert.locator('[data-testid="reset-time"]').textContent();
    expect(resetTime).toContain('Reset en:');
    expect(resetTime).toMatch(/\d+ horas/);
  });

  test('Simulación de bounces de email', async ({ page }) => {
    // Verificar que se muestran alertas de bounce
    const bounceAlert = page.locator('[data-testid="bounce-alert"]');
    await expect(bounceAlert).toBeVisible();
    
    // Verificar contenido de la alerta
    const alertContent = await bounceAlert.textContent();
    expect(alertContent).toContain('Emails Rebotados');
    expect(alertContent).toContain('3 emails rebotados');
    expect(alertContent).toContain('última hora');
    
    // Verificar severidad de advertencia
    const alertClass = await bounceAlert.getAttribute('class');
    expect(alertClass).toContain('warning');
    
    // Verificar tasa de rebote
    const bounceRate = await bounceAlert.locator('[data-testid="bounce-rate"]').textContent();
    expect(bounceRate).toContain('2.1%');
    
    // Verificar último rebote
    const lastBounce = await bounceAlert.locator('[data-testid="last-bounce"]').textContent();
    expect(lastBounce).toContain('15 min ago');
  });

  test('Alertas se silencian cuando se resuelve', async ({ page }) => {
    // Verificar que hay alertas activas
    const activeAlerts = page.locator('[data-testid="active-alert"]');
    const activeCount = await activeAlerts.count();
    expect(activeCount).toBeGreaterThan(0);
    
    // Resolver una alerta
    const firstAlert = activeAlerts.first();
    await firstAlert.click();
    await page.waitForSelector('[data-testid="alert-details"]');
    
    // Hacer clic en resolver
    await page.click('[data-testid="resolve-alert"]');
    await page.waitForSelector('[data-testid="alert-resolved"]');
    
    // Verificar que la alerta se movió a resueltas
    await page.click('[data-testid="resolved-tab"]');
    await page.waitForSelector('[data-testid="resolved-alerts"]');
    
    const resolvedAlerts = page.locator('[data-testid="resolved-alert"]');
    const resolvedCount = await resolvedAlerts.count();
    expect(resolvedCount).toBeGreaterThan(0);
    
    // Verificar que se muestra timestamp de resolución
    const resolvedTimestamp = await resolvedAlerts.first().locator('[data-testid="resolved-timestamp"]').textContent();
    expect(resolvedTimestamp).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
  });

  test('Enlaces desde alerta a registro/acción relacionada', async ({ page }) => {
    // Seleccionar alerta de DLQ
    const dlqAlert = page.locator('[data-testid="dlq-alert"]');
    await dlqAlert.click();
    await page.waitForSelector('[data-testid="alert-details"]');
    
    // Verificar que hay enlace a la cola de trabajo
    const queueLink = page.locator('[data-testid="queue-link"]');
    await expect(queueLink).toBeVisible();
    
    const queueLinkText = await queueLink.textContent();
    expect(queueLinkText).toContain('Ver cola de trabajo');
    
    // Hacer clic en el enlace
    await queueLink.click();
    await page.waitForSelector('[data-testid="queue-details"]');
    
    // Verificar que se muestra la cola de trabajo
    const queueDetails = await page.locator('[data-testid="queue-details"]').textContent();
    expect(queueDetails).toContain('Cola de Reenvío de Invitaciones');
    expect(queueDetails).toContain('5 elementos fallidos');
    expect(queueDetails).toContain('Backoff exponencial');
    
    // Volver a alertas
    await page.goBack();
    await page.waitForSelector('[data-testid="alert-details"]');
    
    // Verificar que hay enlace a la acción relacionada
    const actionLink = page.locator('[data-testid="action-link"]');
    await expect(actionLink).toBeVisible();
    
    const actionLinkText = await actionLink.textContent();
    expect(actionLinkText).toContain('Reintentar envío');
    
    // Hacer clic en el enlace
    await actionLink.click();
    await page.waitForSelector('[data-testid="retry-action"]');
    
    // Verificar que se muestra la acción de reintento
    const retryAction = await page.locator('[data-testid="retry-action"]').textContent();
    expect(retryAction).toContain('Reintentar envío de invitaciones');
    expect(retryAction).toContain('5 elementos');
  });

  test('Rate-limit por plan realmente bloquea/avisa', async ({ page }) => {
    // Simular intento de envío de emails que exceda la cuota
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Intentar enviar invitaciones masivas
    await page.click('[data-testid="send-invitations"]');
    await page.waitForSelector('[data-testid="send-invitations-modal"]');
    
    // Configurar envío masivo
    await page.check('[data-testid="select-all-evaluators"]');
    await page.click('[data-testid="confirm-send"]');
    
    // Verificar que aparece alerta de cuota excedida
    const quotaExceededAlert = page.locator('[data-testid="quota-exceeded-alert"]');
    await expect(quotaExceededAlert).toBeVisible();
    
    const alertText = await quotaExceededAlert.textContent();
    expect(alertText).toContain('Cuota de emails excedida');
    expect(alertText).toContain('Límite diario alcanzado');
    expect(alertText).toContain('100/100 emails');
    
    // Verificar que se muestra opción de actualizar plan
    const upgradeOption = page.locator('[data-testid="upgrade-plan-option"]');
    await expect(upgradeOption).toBeVisible();
    
    const upgradeText = await upgradeOption.textContent();
    expect(upgradeText).toContain('Actualizar plan');
    expect(upgradeText).toContain('Professional: 500 emails/día');
    expect(upgradeText).toContain('Enterprise: 5000 emails/día');
    
    // Verificar que se muestra tiempo de reset
    const resetTime = await quotaExceededAlert.locator('[data-testid="reset-time"]').textContent();
    expect(resetTime).toContain('Reset en:');
    expect(resetTime).toMatch(/\d+ horas/);
    
    // Verificar que el envío está bloqueado
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeDisabled();
    
    // Verificar que se muestra mensaje de bloqueo
    const blockMessage = page.locator('[data-testid="block-message"]');
    await expect(blockMessage).toBeVisible();
    
    const blockText = await blockMessage.textContent();
    expect(blockText).toContain('Envío bloqueado por cuota');
    expect(blockText).toContain('Intenta mañana o actualiza tu plan');
  });

  test('Estadísticas de alertas en tiempo real', async ({ page }) => {
    // Verificar que se muestran estadísticas
    const alertStats = page.locator('[data-testid="alert-stats"]');
    await expect(alertStats).toBeVisible();
    
    // Verificar estadísticas específicas
    const totalAlerts = await page.locator('[data-testid="total-alerts"]').textContent();
    expect(parseInt(totalAlerts)).toBeGreaterThan(0);
    
    const activeAlerts = await page.locator('[data-testid="active-alerts"]').textContent();
    expect(parseInt(activeAlerts)).toBeGreaterThan(0);
    
    const criticalAlerts = await page.locator('[data-testid="critical-alerts"]').textContent();
    expect(parseInt(criticalAlerts)).toBeGreaterThan(0);
    
    const warningAlerts = await page.locator('[data-testid="warning-alerts"]').textContent();
    expect(parseInt(warningAlerts)).toBeGreaterThan(0);
    
    // Verificar que las estadísticas se actualizan en tiempo real
    const initialTotal = parseInt(totalAlerts);
    
    // Esperar un poco para ver si se actualiza
    await page.waitForTimeout(2000);
    
    const updatedTotal = await page.locator('[data-testid="total-alerts"]').textContent();
    expect(parseInt(updatedTotal)).toBeGreaterThanOrEqual(initialTotal);
  });

  test('Filtros de alertas por severidad y estado', async ({ page }) => {
    // Verificar que hay filtros
    const alertFilters = page.locator('[data-testid="alert-filters"]');
    await expect(alertFilters).toBeVisible();
    
    // Filtrar por alertas críticas
    await page.click('[data-testid="critical-filter"]');
    await page.waitForSelector('[data-testid="filtered-alerts"]');
    
    // Verificar que solo se muestran alertas críticas
    const criticalAlerts = page.locator('[data-testid="critical-alert"]');
    const criticalCount = await criticalAlerts.count();
    expect(criticalCount).toBeGreaterThan(0);
    
    // Verificar que no se muestran alertas de otras severidades
    const warningAlerts = page.locator('[data-testid="warning-alert"]');
    const warningCount = await warningAlerts.count();
    expect(warningCount).toBe(0);
    
    // Filtrar por alertas activas
    await page.click('[data-testid="active-filter"]');
    await page.waitForSelector('[data-testid="filtered-alerts"]');
    
    // Verificar que solo se muestran alertas activas
    const activeAlerts = page.locator('[data-testid="active-alert"]');
    const activeCount = await activeAlerts.count();
    expect(activeCount).toBeGreaterThan(0);
    
    // Verificar que no se muestran alertas resueltas
    const resolvedAlerts = page.locator('[data-testid="resolved-alert"]');
    const resolvedCount = await resolvedAlerts.count();
    expect(resolvedCount).toBe(0);
  });
});
