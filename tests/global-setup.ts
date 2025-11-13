// tests/global-setup.ts
// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;







// tests/global-setup.ts
// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;







// tests/global-setup.ts
// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






// Setup global para establecer variables que deshabiliten analytics en tests

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 [Global Setup] Configurando entorno de testing...');
  
  // Crear navegador temporal para establecer variables globales
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Establecer variable global para deshabilitar analytics
  await page.addInitScript(() => {
    // Establecer variable global que detectará testingUtils.js
    (window as any).__PLAYWRIGHT_TEST__ = true;
    
    // También establecer en localStorage por si acaso
    localStorage.setItem('__PLAYWRIGHT_TEST__', 'true');
    
    console.log('🧪 [Playwright Setup] Analytics disabled - __PLAYWRIGHT_TEST__ = true');
  });
  
  await browser.close();
  
  console.log('✅ [Global Setup] Entorno configurado correctamente');
}

export default globalSetup;






