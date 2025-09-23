import { test, expect } from '@playwright/test';

test.describe('Authenticated Workspace Selection - Staging Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // This test suite assumes authentication state is already loaded via playwright.config.ts
    console.log('🔐 Using authenticated state for workspace tests');
  });

  test('should display authenticated user workspace selection', async ({ page }) => {
    // Navigate directly to workspace selection - should work with auth
    await page.goto('/select-workspace');

    // Wait for the page to load with authenticated content
    await page.waitForLoadState('networkidle');

    // Check that we can see workspace cards without being redirected to login
    await expect(page.locator('.workspace-selector-container')).toBeVisible({ timeout: 10000 });

    // Wait for workspace options to load using data-testid
    await expect(page.getByTestId('workspace-options')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('workspace-grid')).toBeVisible();

    // Verify that workspace cards are displayed for authenticated user using data-testid
    const workspaceCards = page.locator('[data-testid^="ws-select-"]');
    await expect(workspaceCards).toHaveCountGreaterThan(0, { timeout: 10000 });

    // Log found workspaces
    const cardCount = await workspaceCards.count();
    console.log(`✓ Found ${cardCount} workspace cards for authenticated user`);

    // Check for expected workspaces using data-testid
    const personalCard = page.getByTestId('ws-select-personal');
    const empresaCard = page.getByTestId('ws-select-empresa-demo');

    if (await personalCard.count() > 0) {
      await expect(personalCard).toBeVisible();
      console.log('✓ Personal workspace found');
    }

    if (await empresaCard.count() > 0) {
      await expect(empresaCard).toBeVisible();
      console.log('✓ Empresa Demo workspace found');
    }
  });

  test('should successfully select workspace and navigate to dashboard', async ({ page }) => {
    await page.goto('/select-workspace');
    
    // Wait for workspace grid to load
    await page.getByTestId('workspace-grid').waitFor({ timeout: 10000 });

    // Find any available workspace card (prioritize Empresa Demo if available) using data-testid
    let selectedCard = page.getByTestId('ws-select-empresa-demo');
    
    if (await selectedCard.count() === 0) {
      // Fallback to any workspace card
      selectedCard = page.locator('[data-testid^="ws-select-"]').first();
    }

    await expect(selectedCard).toBeVisible();
    
    // Get the workspace name for logging
    const workspaceName = await selectedCard.textContent();
    console.log(`🎯 Selecting workspace: ${workspaceName}`);

    // Click the workspace card
    await selectedCard.click();

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
    console.log('✓ Successfully navigated to dashboard');
    
    // Check that dashboard content is loaded
    await expect(page.locator('main')).toBeVisible();
    
    // Look for workspace switcher in header (should appear after workspace selection)
    const workspaceSwitcher = page.locator('[data-testid="workspace-switcher"], .workspace-switcher');
    if (await workspaceSwitcher.count() > 0) {
      await expect(workspaceSwitcher).toBeVisible();
      console.log('✓ Workspace switcher visible in header');
    }

    // Look for user profile or authentication indicators
    const authIndicators = [
      page.locator('[data-testid="user-menu"]'),
      page.locator('.user-profile'),
      page.locator('button[aria-label*="user"]'),
      page.locator('text=Sign out'),
      page.locator('text=Logout')
    ];

    let foundAuthIndicator = false;
    for (const indicator of authIndicators) {
      if (await indicator.isVisible()) {
        console.log('✓ Authentication indicator found in UI');
        foundAuthIndicator = true;
        break;
      }
    }

    if (!foundAuthIndicator) {
      console.log('ℹ️  No obvious authentication indicators found in UI');
    }
  });

  test('should maintain authentication across page navigation', async ({ page }) => {
    // Test that authentication persists across different pages
    const pages = ['/dashboard', '/select-workspace'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Should not be redirected to login
      expect(page.url()).not.toContain('/login');
      expect(page.url()).not.toContain('/register');
      
      console.log(`✓ Authentication maintained on ${pagePath}`);
    }
  });

  test('should show appropriate content for authenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see dashboard content, not login prompts
    const loginElements = page.locator('text=Sign in, text=Login, text=Iniciar sesión');
    await expect(loginElements).toHaveCount(0);

    // Should see authenticated content
    const dashboardContent = page.locator('main, .dashboard, [data-testid="dashboard"]');
    await expect(dashboardContent.first()).toBeVisible();

    console.log('✓ Authenticated dashboard content visible');
  });
});

// Utility function to check if storage state exists
test.beforeAll(async () => {
  const fs = await import('fs');
  const stateExists = fs.existsSync('tests/.auth/state.json');
  
  if (!stateExists) {
    console.warn('⚠️  No authentication state found at tests/.auth/state.json');
    console.warn('⚠️  Run "npm run test:auth:capture" first to capture authentication state');
  } else {
    console.log('✅ Authentication state loaded from tests/.auth/state.json');
  }
});
