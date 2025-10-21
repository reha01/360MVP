/**
 * UAT 7: Zona Horaria & DST Testing
 * 
 * Validar recordatorios programados en TZ de la org
 * Validar una campaña que cruce cambio de hora
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 7: Zona Horaria & DST', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
  });

  test('Recordatorios programados en TZ de la org', async ({ page }) => {
    // Ir a configuración de la organización
    await page.goto('/policies');
    await page.waitForSelector('[data-testid="policies-page"]');
    
    // Verificar configuración de zona horaria
    const timezoneConfig = page.locator('[data-testid="timezone-config"]');
    await expect(timezoneConfig).toBeVisible();
    
    const timezoneValue = await timezoneConfig.textContent();
    expect(timezoneValue).toContain('America/Mexico_City');
    
    // Ir a campañas
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña activa
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de recordatorios
    await page.click('[data-testid="reminders-tab"]');
    await page.waitForSelector('[data-testid="reminders-config"]');
    
    // Verificar que los recordatorios están programados en TZ de la org
    const reminderSchedule = page.locator('[data-testid="reminder-schedule"]');
    await expect(reminderSchedule).toBeVisible();
    
    const scheduleText = await reminderSchedule.textContent();
    expect(scheduleText).toContain('Zona horaria: America/Mexico_City');
    expect(scheduleText).toContain('Próximo recordatorio:');
    
    // Verificar que se muestra la hora en TZ de la org
    const nextReminder = page.locator('[data-testid="next-reminder"]');
    await expect(nextReminder).toBeVisible();
    
    const reminderTime = await nextReminder.textContent();
    expect(reminderTime).toMatch(/\d{2}:\d{2} (AM|PM) CST/); // Hora en TZ de la org
    
    // Verificar que se muestra la diferencia con UTC
    const utcDifference = page.locator('[data-testid="utc-difference"]');
    await expect(utcDifference).toBeVisible();
    
    const utcText = await utcDifference.textContent();
    expect(utcText).toContain('UTC-6'); // Diferencia con UTC
  });

  test('Campaña que cruza cambio de hora (DST)', async ({ page }) => {
    // Crear campaña que cruce cambio de hora
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Crear nueva campaña
    await page.click('[data-testid="create-campaign"]');
    await page.waitForSelector('[data-testid="campaign-wizard"]');
    
    // Configurar campaña que cruce cambio de hora
    await page.fill('[data-testid="campaign-name"]', 'Campaña DST Test');
    await page.fill('[data-testid="campaign-description"]', 'Campaña que cruza cambio de hora');
    
    // Configurar fechas que crucen el cambio de hora (marzo 2024)
    await page.fill('[data-testid="start-date"]', '2024-03-01');
    await page.fill('[data-testid="end-date"]', '2024-04-15');
    
    // Configurar recordatorios
    await page.click('[data-testid="reminders-step"]');
    await page.waitForSelector('[data-testid="reminders-config"]');
    
    // Configurar recordatorio que cruce el cambio de hora
    await page.fill('[data-testid="reminder-1-date"]', '2024-03-10'); // Antes del cambio
    await page.fill('[data-testid="reminder-2-date"]', '2024-03-15'); // Después del cambio
    
    // Verificar que se muestra advertencia de DST
    const dstWarning = page.locator('[data-testid="dst-warning"]');
    await expect(dstWarning).toBeVisible();
    
    const warningText = await dstWarning.textContent();
    expect(warningText).toContain('Cambio de hora detectado');
    expect(warningText).toContain('10 de marzo de 2024');
    expect(warningText).toContain('Horario de verano');
    
    // Verificar que se muestran los horarios ajustados
    const adjustedTimes = page.locator('[data-testid="adjusted-times"]');
    await expect(adjustedTimes).toBeVisible();
    
    const adjustedText = await adjustedTimes.textContent();
    expect(adjustedText).toContain('Horarios ajustados:');
    expect(adjustedText).toContain('Antes del cambio: CST (UTC-6)');
    expect(adjustedText).toContain('Después del cambio: CDT (UTC-5)');
    
    // Verificar que se muestran los recordatorios con horarios correctos
    const reminder1 = page.locator('[data-testid="reminder-1-time"]');
    await expect(reminder1).toBeVisible();
    
    const reminder1Time = await reminder1.textContent();
    expect(reminder1Time).toContain('CST'); // Antes del cambio
    
    const reminder2 = page.locator('[data-testid="reminder-2-time"]');
    await expect(reminder2).toBeVisible();
    
    const reminder2Time = await reminder2.textContent();
    expect(reminder2Time).toContain('CDT'); // Después del cambio
    
    // Guardar campaña
    await page.click('[data-testid="save-campaign"]');
    await page.waitForSelector('[data-testid="campaign-saved"]');
    
    // Verificar que la campaña se guardó correctamente
    const campaignSaved = page.locator('[data-testid="campaign-saved"]');
    await expect(campaignSaved).toBeVisible();
    
    const savedText = await campaignSaved.textContent();
    expect(savedText).toContain('Campaña guardada');
    expect(savedText).toContain('Recordatorios programados con ajuste DST');
  });

  test('Validación de horarios en diferentes zonas horarias', async ({ page }) => {
    // Ir a configuración de la organización
    await page.goto('/policies');
    await page.waitForSelector('[data-testid="policies-page"]');
    
    // Cambiar zona horaria
    await page.click('[data-testid="edit-timezone"]');
    await page.waitForSelector('[data-testid="timezone-selector"]');
    
    // Seleccionar zona horaria diferente
    await page.selectOption('[data-testid="timezone-select"]', 'Europe/Madrid');
    await page.click('[data-testid="save-timezone"]');
    await page.waitForSelector('[data-testid="timezone-saved"]');
    
    // Verificar que se actualizó la zona horaria
    const timezoneConfig = page.locator('[data-testid="timezone-config"]');
    await expect(timezoneConfig).toBeVisible();
    
    const timezoneValue = await timezoneConfig.textContent();
    expect(timezoneValue).toContain('Europe/Madrid');
    
    // Ir a campañas
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña activa
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de recordatorios
    await page.click('[data-testid="reminders-tab"]');
    await page.waitForSelector('[data-testid="reminders-config"]');
    
    // Verificar que los recordatorios se ajustaron a la nueva zona horaria
    const reminderSchedule = page.locator('[data-testid="reminder-schedule"]');
    await expect(reminderSchedule).toBeVisible();
    
    const scheduleText = await reminderSchedule.textContent();
    expect(scheduleText).toContain('Zona horaria: Europe/Madrid');
    
    // Verificar que se muestra la hora en la nueva TZ
    const nextReminder = page.locator('[data-testid="next-reminder"]');
    await expect(nextReminder).toBeVisible();
    
    const reminderTime = await nextReminder.textContent();
    expect(reminderTime).toMatch(/\d{2}:\d{2} (AM|PM) CET/); // Hora en TZ de Madrid
    
    // Verificar que se muestra la diferencia con UTC
    const utcDifference = page.locator('[data-testid="utc-difference"]');
    await expect(utcDifference).toBeVisible();
    
    const utcText = await utcDifference.textContent();
    expect(utcText).toContain('UTC+1'); // Diferencia con UTC
  });

  test('Recordatorios automáticos con ajuste DST', async ({ page }) => {
    // Ir a campañas
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña que cruce cambio de hora
    await page.click('[data-testid="campaign-dst"]');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Ir a pestaña de recordatorios
    await page.click('[data-testid="reminders-tab"]');
    await page.waitForSelector('[data-testid="reminders-config"]');
    
    // Verificar que se muestran los recordatorios programados
    const scheduledReminders = page.locator('[data-testid="scheduled-reminder"]');
    const reminderCount = await scheduledReminders.count();
    expect(reminderCount).toBeGreaterThan(0);
    
    // Verificar que los recordatorios están programados correctamente
    for (let i = 0; i < reminderCount; i++) {
      const reminder = scheduledReminders.nth(i);
      await expect(reminder).toBeVisible();
      
      const reminderText = await reminder.textContent();
      expect(reminderText).toContain('Programado para:');
      expect(reminderText).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
      
      // Verificar que se muestra la zona horaria correcta
      if (reminderText.includes('2024-03-10')) {
        expect(reminderText).toContain('CST'); // Antes del cambio
      } else if (reminderText.includes('2024-03-15')) {
        expect(reminderText).toContain('CDT'); // Después del cambio
      }
    }
    
    // Verificar que se muestra el próximo recordatorio
    const nextReminder = page.locator('[data-testid="next-reminder"]');
    await expect(nextReminder).toBeVisible();
    
    const nextReminderText = await nextReminder.textContent();
    expect(nextReminderText).toContain('Próximo recordatorio:');
    expect(nextReminderText).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    
    // Verificar que se muestra el tiempo restante
    const timeRemaining = page.locator('[data-testid="time-remaining"]');
    await expect(timeRemaining).toBeVisible();
    
    const timeRemainingText = await timeRemaining.textContent();
    expect(timeRemainingText).toContain('Tiempo restante:');
    expect(timeRemainingText).toMatch(/\d+ días, \d+ horas/);
  });

  test('Validación de fechas en diferentes zonas horarias', async ({ page }) => {
    // Ir a configuración de la organización
    await page.goto('/policies');
    await page.waitForSelector('[data-testid="policies-page"]');
    
    // Verificar que se muestra la zona horaria actual
    const currentTimezone = page.locator('[data-testid="current-timezone"]');
    await expect(currentTimezone).toBeVisible();
    
    const currentTzText = await currentTimezone.textContent();
    expect(currentTzText).toContain('Zona horaria actual:');
    expect(currentTzText).toMatch(/[A-Za-z_]+\/[A-Za-z_]+/);
    
    // Verificar que se muestra la hora actual
    const currentTime = page.locator('[data-testid="current-time"]');
    await expect(currentTime).toBeVisible();
    
    const currentTimeText = await currentTime.textContent();
    expect(currentTimeText).toContain('Hora actual:');
    expect(currentTimeText).toMatch(/\d{2}:\d{2}:\d{2}/);
    
    // Verificar que se muestra la diferencia con UTC
    const utcOffset = page.locator('[data-testid="utc-offset"]');
    await expect(utcOffset).toBeVisible();
    
    const utcOffsetText = await utcOffset.textContent();
    expect(utcOffsetText).toContain('Diferencia con UTC:');
    expect(utcOffsetText).toMatch(/UTC[+-]\d+/);
    
    // Verificar que se muestra información de DST
    const dstInfo = page.locator('[data-testid="dst-info"]');
    await expect(dstInfo).toBeVisible();
    
    const dstInfoText = await dstInfo.textContent();
    expect(dstInfoText).toContain('Horario de verano:');
    expect(dstInfoText).toContain('Activo' || 'Inactivo');
  });
});
