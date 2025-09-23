import { test } from '@playwright/test';

test('capture storage state', async ({ context, page }) => {
  console.log('🚀 Starting authentication capture for staging...');
  
  // Navigate to staging
  const stagingUrl = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';
  console.log(`📍 Navigating to: ${stagingUrl}`);
  
  await page.goto(stagingUrl);
  
  console.log('⏸️  Test paused - Please complete the following steps:');
  console.log('1. Complete login process in the browser');
  console.log('2. Verify you are successfully authenticated'); 
  console.log('3. Navigate to a page that requires authentication (e.g., /dashboard)');
  console.log('4. Click the ▶️ (Resume) button in the Playwright inspector');
  
  // Pause for manual login - DevTools UI will open if run with --debug
  await page.pause();
  
  console.log('💾 Saving authentication state...');
  
  // Save the storage state (cookies, localStorage, sessionStorage)
  await context.storageState({ path: 'tests/.auth/state.json' });
  
  console.log('✅ Authentication state captured successfully!');
  console.log('📁 Saved to: tests/.auth/state.json');
  
  // Verify the current page to ensure we're authenticated
  const currentUrl = page.url();
  console.log(`🔍 Current URL after auth: ${currentUrl}`);
  
  // Optional: Take a screenshot for verification
  await page.screenshot({ 
    path: 'tests/.auth/authenticated-state.png',
    fullPage: true 
  });
  
  console.log('📸 Screenshot saved to: tests/.auth/authenticated-state.png');
});

