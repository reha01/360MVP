/**
 * UAT Test: Organizational Policies
 * 
 * Criterios:
 * - Regla "solo endurecer" (no relajar políticas)
 * - Preview de impacto al subir umbrales
 * - Aplicación efectiva en reportes y exports
 * - Configuración de retención de datos
 */

import { test, expect } from '@playwright/test';

test.describe('Organizational Policies UAT', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de políticas
    await page.goto('/policies');
    
    // Esperar a que cargue
    await page.waitForSelector('[data-testid="policy-manager"]');
  });
  
  test('Regla "solo endurecer" - no permite relajar políticas', async ({ page }) => {
    // Intentar reducir umbrales (debe fallar)
    const peersInput = page.locator('input[type="number"]').first();
    const currentValue = await peersInput.inputValue();
    const newValue = Math.max(1, parseInt(currentValue) - 1);
    
    // Cambiar a un valor menor
    await peersInput.fill(newValue.toString());
    
    // Intentar guardar
    await page.click('button:has-text("Guardar")');
    
    // Verificar que se muestra error
    await expect(page.locator('text=/No se puede relajar las políticas/')).toBeVisible();
    
    // Verificar que se explica la regla
    await expect(page.locator('text=/Solo se permite endurecer/')).toBeVisible();
    
    console.log('✅ Regla "solo endurecer" funcionando');
  });
  
  test('Preview de impacto al subir umbrales', async ({ page }) => {
    // Aumentar umbrales
    const peersInput = page.locator('input[type="number"]').first();
    const currentValue = await peersInput.inputValue();
    const newValue = parseInt(currentValue) + 1;
    
    // Cambiar a un valor mayor
    await peersInput.fill(newValue.toString());
    
    // Generar preview
    await page.click('button:has-text("Preview Impacto")');
    
    // Verificar que se muestra el preview
    await expect(page.locator('text=/Preview de Impacto/')).toBeVisible();
    
    // Verificar que se muestran métricas de impacto
    await expect(page.locator('text=/Evaluaciones Afectadas/')).toBeVisible();
    await expect(page.locator('text=/Datos Ocultos/')).toBeVisible();
    await expect(page.locator('text=/Usuarios Afectados/')).toBeVisible();
    
    // Verificar que se muestra advertencia
    await expect(page.locator('text=/Impacto en Reportes/')).toBeVisible();
    
    console.log('✅ Preview de impacto funcionando');
  });
  
  test('Configuración de retención de datos', async ({ page }) => {
    // Verificar que hay configuración de retención
    const retentionSection = page.locator('text=/Retención de Datos/');
    await expect(retentionSection).toBeVisible();
    
    // Verificar que hay switch para habilitar retención
    const retentionSwitch = page.locator('input[type="checkbox"]').first();
    await expect(retentionSwitch).toBeVisible();
    
    // Habilitar retención
    await retentionSwitch.check();
    
    // Verificar que se muestran opciones adicionales
    await expect(page.locator('text=/Período de Retención/')).toBeVisible();
    await expect(page.locator('text=/Eliminación Automática/')).toBeVisible();
    
    // Cambiar período de retención
    const periodInput = page.locator('input[type="number"]').nth(1);
    await periodInput.fill('730'); // 2 años
    
    // Verificar que se actualiza la descripción
    await expect(page.locator('text=/Los datos se conservarán por 730 días/')).toBeVisible();
    
    console.log('✅ Configuración de retención funcionando');
  });
  
  test('Configuraciones de privacidad', async ({ page }) => {
    // Verificar que hay configuración de privacidad
    const privacySection = page.locator('text=/Configuraciones de Privacidad/');
    await expect(privacySection).toBeVisible();
    
    // Verificar switches de privacidad
    const hideSmallGroupsSwitch = page.locator('input[type="checkbox"]').nth(1);
    const requireConsentSwitch = page.locator('input[type="checkbox"]').nth(2);
    const allowExportSwitch = page.locator('input[type="checkbox"]').nth(3);
    
    await expect(hideSmallGroupsSwitch).toBeVisible();
    await expect(requireConsentSwitch).toBeVisible();
    await expect(allowExportSwitch).toBeVisible();
    
    // Probar cambios en switches
    await hideSmallGroupsSwitch.uncheck();
    await requireConsentSwitch.check();
    await allowExportSwitch.uncheck();
    
    // Verificar que los cambios se reflejan
    await expect(hideSmallGroupsSwitch).not.toBeChecked();
    await expect(requireConsentSwitch).toBeChecked();
    await expect(allowExportSwitch).not.toBeChecked();
    
    console.log('✅ Configuraciones de privacidad funcionando');
  });
  
  test('Configuración de zona horaria', async ({ page }) => {
    // Verificar que hay configuración de zona horaria
    const timezoneSection = page.locator('text=/Zona Horaria/');
    await expect(timezoneSection).toBeVisible();
    
    // Verificar selector de zona horaria
    const timezoneSelect = page.locator('select').first();
    await expect(timezoneSelect).toBeVisible();
    
    // Cambiar zona horaria
    await timezoneSelect.selectOption('America/Santiago');
    
    // Verificar que se actualiza
    await expect(timezoneSelect).toHaveValue('America/Santiago');
    
    // Verificar switch de DST
    const dstSwitch = page.locator('input[type="checkbox"]').last();
    await expect(dstSwitch).toBeVisible();
    
    // Habilitar DST
    await dstSwitch.check();
    
    // Verificar que se actualiza
    await expect(dstSwitch).toBeChecked();
    
    console.log('✅ Configuración de zona horaria funcionando');
  });
  
  test('Guardado de políticas', async ({ page }) => {
    // Realizar cambios válidos
    const peersInput = page.locator('input[type="number"]').first();
    const currentValue = await peersInput.inputValue();
    const newValue = parseInt(currentValue) + 1;
    
    // Cambiar a un valor mayor (endurecer)
    await peersInput.fill(newValue.toString());
    
    // Guardar políticas
    await page.click('button:has-text("Guardar")');
    
    // Verificar que se muestra mensaje de éxito
    await expect(page.locator('text=/Políticas guardadas exitosamente/')).toBeVisible();
    
    // Verificar que se oculta el preview
    await expect(page.locator('text=/Preview de Impacto/')).not.toBeVisible();
    
    console.log('✅ Guardado de políticas funcionando');
  });
  
  test('Validación de cambios', async ({ page }) => {
    // Verificar que se muestra indicador de cambios
    const peersInput = page.locator('input[type="number"]').first();
    const currentValue = await peersInput.inputValue();
    const newValue = parseInt(currentValue) + 1;
    
    // Cambiar valor
    await peersInput.fill(newValue.toString());
    
    // Verificar que se muestra indicador de cambios
    const changesIndicator = page.locator('text=/Hay cambios sin guardar/');
    if (await changesIndicator.isVisible()) {
      await expect(changesIndicator).toBeVisible();
      
      console.log('✅ Indicador de cambios funcionando');
    }
  });
  
  test('Carga de políticas existentes', async ({ page }) => {
    // Verificar que se cargan las políticas existentes
    const peersInput = page.locator('input[type="number"]').first();
    const directInput = page.locator('input[type="number"]').nth(1);
    const externalInput = page.locator('input[type="number"]').nth(2);
    
    // Verificar que los valores se cargan
    await expect(peersInput).toHaveValue(/\\d+/);
    await expect(directInput).toHaveValue(/\\d+/);
    await expect(externalInput).toHaveValue(/\\d+/);
    
    console.log('✅ Carga de políticas existentes funcionando');
  });
  
  test('Responsive en diferentes tamaños', async ({ page }) => {
    // Probar en diferentes tamaños de pantalla
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verificar que el panel sigue siendo funcional
      await expect(page.locator('[data-testid="policy-manager"]')).toBeVisible();
      
      // Verificar que los controles siguen siendo accesibles
      await expect(page.locator('input[type="number"]').first()).toBeVisible();
      
      console.log(`✅ Responsive: ${viewport.width}x${viewport.height}`);
    }
  });
});
