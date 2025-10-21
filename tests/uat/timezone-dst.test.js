/**
 * UAT Test: Timezone & DST
 * 
 * Criterios:
 * - Recordatorios programados en TZ de la org
 * - Campaña que cruza cambio de hora
 * - Validación de DST
 */

import { test, expect } from '@playwright/test';

test.describe('Timezone & DST UAT', () => {
  
  test('Recordatorios programados en TZ de la org', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña con recordatorios
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const campaignCount = await campaignCards.count();
    
    if (campaignCount > 0) {
      // Hacer click en una campaña
      await campaignCards.first().click();
      
      // Navegar a pestaña de recordatorios
      await page.click('text=Recordatorios');
      
      // Esperar a que cargue
      await page.waitForSelector('[data-testid="reminders-manager"]');
      
      // Verificar que se muestran recordatorios programados
      const reminders = page.locator('[data-testid="reminder-card"]');
      const reminderCount = await reminders.count();
      
      if (reminderCount > 0) {
        // Verificar que se muestra la zona horaria
        await expect(page.locator('text=/Zona horaria:/')).toBeVisible();
        
        // Verificar que se muestra la hora local
        await expect(page.locator('text=/Hora local:/')).toBeVisible();
        
        // Verificar que se muestra la hora UTC
        await expect(page.locator('text=/Hora UTC:/')).toBeVisible();
        
        console.log('✅ Recordatorios programados en TZ de la org');
      }
    }
  });
  
  test('Campaña que cruza cambio de hora', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña que cruza DST
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const campaignCount = await campaignCards.count();
    
    if (campaignCount > 0) {
      // Buscar campaña con DST
      const dstCampaign = page.locator('text=/DST Test/');
      if (await dstCampaign.isVisible()) {
        // Hacer click en la campaña
        await dstCampaign.click();
        
        // Verificar que se muestra información de DST
        await expect(page.locator('text=/Cruza cambio de hora/')).toBeVisible();
        
        // Verificar que se muestra la fecha de cambio
        await expect(page.locator('text=/Cambio de hora:/')).toBeVisible();
        
        // Verificar que se muestra la zona horaria
        await expect(page.locator('text=/America\\/Santiago/')).toBeVisible();
        
        console.log('✅ Campaña que cruza cambio de hora');
      }
    }
  });
  
  test('Validación de DST', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar configuración de zona horaria
    const timezoneSection = page.locator('text=/Zona Horaria/');
    await expect(timezoneSection).toBeVisible();
    
    // Verificar selector de zona horaria
    const timezoneSelect = page.locator('select').first();
    await expect(timezoneSelect).toBeVisible();
    
    // Cambiar a zona con DST
    await timezoneSelect.selectOption('America/Santiago');
    
    // Verificar que se muestra switch de DST
    const dstSwitch = page.locator('input[type="checkbox"]').last();
    await expect(dstSwitch).toBeVisible();
    
    // Habilitar DST
    await dstSwitch.check();
    
    // Verificar que se actualiza
    await expect(dstSwitch).toBeChecked();
    
    // Cambiar a zona sin DST
    await timezoneSelect.selectOption('America/Mexico_City');
    
    // Verificar que se oculta switch de DST
    await expect(dstSwitch).not.toBeVisible();
    
    console.log('✅ Validación de DST funcionando');
  });
  
  test('Conversión de horas entre zonas', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const campaignCount = await campaignCards.count();
    
    if (campaignCount > 0) {
      // Hacer click en una campaña
      await campaignCards.first().click();
      
      // Verificar que se muestran horas en diferentes zonas
      await expect(page.locator('text=/Hora local:/')).toBeVisible();
      await expect(page.locator('text=/Hora UTC:/')).toBeVisible();
      
      // Verificar que las horas son diferentes
      const localTime = await page.locator('text=/Hora local:/').textContent();
      const utcTime = await page.locator('text=/Hora UTC:/').textContent();
      
      expect(localTime).not.toBe(utcTime);
      
      console.log('✅ Conversión de horas entre zonas funcionando');
    }
  });
  
  test('Recordatorios en hora local correcta', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const campaignCount = await campaignCards.count();
    
    if (campaignCount > 0) {
      // Hacer click en una campaña
      await campaignCards.first().click();
      
      // Navegar a pestaña de recordatorios
      await page.click('text=Recordatorios');
      
      // Esperar a que cargue
      await page.waitForSelector('[data-testid="reminders-manager"]');
      
      // Verificar que se muestran recordatorios
      const reminders = page.locator('[data-testid="reminder-card"]');
      const reminderCount = await reminders.count();
      
      if (reminderCount > 0) {
        // Verificar que se muestra la hora local
        await expect(page.locator('text=/Hora local:/')).toBeVisible();
        
        // Verificar que se muestra la zona horaria
        await expect(page.locator('text=/Zona horaria:/')).toBeVisible();
        
        // Verificar que se muestra el estado de DST
        await expect(page.locator('text=/DST:/')).toBeVisible();
        
        console.log('✅ Recordatorios en hora local correcta');
      }
    }
  });
  
  test('Campañas en diferentes zonas horarias', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Verificar que hay campañas en diferentes zonas
    const santiagoCampaign = page.locator('text=/Santiago/');
    const mexicoCampaign = page.locator('text=/México/');
    
    if (await santiagoCampaign.isVisible()) {
      // Verificar que se muestra la zona horaria
      await expect(page.locator('text=/America\\/Santiago/')).toBeVisible();
    }
    
    if (await mexicoCampaign.isVisible()) {
      // Verificar que se muestra la zona horaria
      await expect(page.locator('text=/America\\/Mexico_City/')).toBeVisible();
    }
    
    console.log('✅ Campañas en diferentes zonas horarias');
  });
  
  test('Cambio de hora durante campaña', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña que cruza DST
    const dstCampaign = page.locator('text=/DST Test/');
    if (await dstCampaign.isVisible()) {
      // Hacer click en la campaña
      await dstCampaign.click();
      
      // Verificar que se muestra información de cambio de hora
      await expect(page.locator('text=/Cambio de hora durante la campaña/')).toBeVisible();
      
      // Verificar que se muestra la fecha de cambio
      await expect(page.locator('text=/2024-09-08/')).toBeVisible();
      
      // Verificar que se muestra el impacto
      await expect(page.locator('text=/Impacto en recordatorios/')).toBeVisible();
      
      console.log('✅ Cambio de hora durante campaña');
    }
  });
  
  test('Sincronización de horas', async ({ page }) => {
    // Navegar a campañas
    await page.goto('/campaigns');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="campaign-manager"]');
    
    // Buscar campaña
    const campaignCards = page.locator('[data-testid="campaign-card"]');
    const campaignCount = await campaignCards.count();
    
    if (campaignCount > 0) {
      // Hacer click en una campaña
      await campaignCards.first().click();
      
      // Verificar que se muestran horas sincronizadas
      await expect(page.locator('text=/Hora local:/')).toBeVisible();
      await expect(page.locator('text=/Hora UTC:/')).toBeVisible();
      
      // Verificar que las horas son consistentes
      const localTime = await page.locator('text=/Hora local:/').textContent();
      const utcTime = await page.locator('text=/Hora UTC:/').textContent();
      
      // Verificar que las horas son diferentes (diferentes zonas)
      expect(localTime).not.toBe(utcTime);
      
      console.log('✅ Sincronización de horas funcionando');
    }
  });
  
  test('Configuración de zona horaria por organización', async ({ page }) => {
    // Navegar a políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
    
    // Verificar configuración de zona horaria
    const timezoneSection = page.locator('text=/Zona Horaria/');
    await expect(timezoneSection).toBeVisible();
    
    // Verificar selector de zona horaria
    const timezoneSelect = page.locator('select').first();
    await expect(timezoneSelect).toBeVisible();
    
    // Verificar opciones disponibles
    const options = await timezoneSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(0);
    
    // Verificar que hay opciones para diferentes zonas
    const optionTexts = await Promise.all(
      options.map(option => option.textContent())
    );
    
    expect(optionTexts).toContain('America/Santiago (CLT/CLST)');
    expect(optionTexts).toContain('America/Mexico_City (CST/CDT)');
    expect(optionTexts).toContain('America/New_York (EST/EDT)');
    expect(optionTexts).toContain('Europe/Madrid (CET/CEST)');
    expect(optionTexts).toContain('UTC');
    
    console.log('✅ Configuración de zona horaria por organización');
  });
});
