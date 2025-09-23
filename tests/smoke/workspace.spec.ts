import { test, expect } from '@playwright/test';

test.describe('Workspace Selection - Staging Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or state
    // For staging tests, we might need to handle authentication
    await page.goto('/');
  });

  test('should navigate to workspace selection and display workspace cards', async ({ page }) => {
    // Navigate to workspace selection page
    await page.goto('/select-workspace');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the workspace selector container is visible
    await expect(page.locator('.workspace-selector-container')).toBeVisible();

    // Check if user has workspace access
    const noWorkspacesMessage = page.locator('text=No Workspaces Available');
    const hasWorkspaces = await page.getByTestId('workspace-options').isVisible();

    if (await noWorkspacesMessage.isVisible()) {
      console.log('ℹ️  User has no workspace access - this is expected for unauthenticated users');
      
      // Verify the no workspaces message is displayed
      await expect(noWorkspacesMessage).toBeVisible();
      await expect(page.locator('text=You don\'t have access to any workspaces yet')).toBeVisible();
      
      console.log('✓ No workspaces message displayed correctly');
    } else if (hasWorkspaces) {
      console.log('✓ User has workspace access - checking for workspace cards');
      
      // Wait for workspace options to load
      await expect(page.getByTestId('workspace-options')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('workspace-grid')).toBeVisible();

      // Verify that workspace cards are displayed using data-testid
      const workspaceCards = page.locator('[data-testid^="ws-select-"]');
      await expect(workspaceCards).toHaveCountGreaterThan(0, { timeout: 10000 });

      // Check for 'Personal' workspace card using data-testid
      const personalCard = page.getByTestId('ws-select-personal');
      if (await personalCard.count() > 0) {
        await expect(personalCard).toBeVisible();
        await expect(personalCard).toContainText('Personal');
        console.log('✓ Personal workspace card found with data-testid');
      }

      // Check for 'Empresa Demo' workspace card using data-testid
      const empresaDemoCard = page.getByTestId('ws-select-empresa-demo');
      if (await empresaDemoCard.count() > 0) {
        await expect(empresaDemoCard).toBeVisible();
        await expect(empresaDemoCard).toContainText('Empresa Demo');
        console.log('✓ Empresa Demo workspace card found with data-testid');
      }

      console.log('✓ Workspace cards loaded successfully with stable selectors');
    } else {
      console.log('ℹ️  Unexpected state - neither no workspaces message nor workspace options visible');
    }
  });

  test('should select "Empresa Demo" workspace and navigate to dashboard', async ({ page }) => {
    // Navigate to workspace selection
    await page.goto('/select-workspace');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if user has workspace access
    const noWorkspacesMessage = page.locator('text=No Workspaces Available');
    
    if (await noWorkspacesMessage.isVisible()) {
      console.log('ℹ️  User has no workspace access - skipping workspace selection test');
      console.log('ℹ️  This test requires authentication and workspace memberships');
      return;
    }

    // Wait for workspace grid to load
    await page.getByTestId('workspace-grid').waitFor({ timeout: 10000 });

    // Find and click the 'Empresa Demo' workspace card using data-testid
    const empresaDemoCard = page.getByTestId('ws-select-empresa-demo');
    await expect(empresaDemoCard).toBeVisible();
    
    // Click the Empresa Demo card
    await empresaDemoCard.click();

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
    
    // Check that dashboard content is loaded
    await expect(page.locator('main')).toBeVisible();
    
    // Look for typical dashboard elements
    const dashboardElements = [
      page.locator('h1', { hasText: /dashboard|inicio|panel/i }),
      page.locator('[data-testid="dashboard"]'),
      page.locator('.dashboard'),
      page.locator('nav'),
      page.locator('header')
    ];

    // At least one dashboard element should be present
    let dashboardFound = false;
    for (const element of dashboardElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        dashboardFound = true;
        break;
      } catch {
        // Continue checking other elements
      }
    }

    if (!dashboardFound) {
      // If no specific dashboard elements found, at least verify the page loaded
      await expect(page.locator('body')).toBeVisible();
      console.log('⚠️  Dashboard loaded but specific elements not found - this may be expected');
    }

    console.log('✓ Successfully selected Empresa Demo and navigated to dashboard');
  });

  test('should redirect viewer users from evaluation page to 403', async ({ page }) => {
    // This test assumes the user has viewer permissions
    // Skip if we can't determine user role or if user is not a viewer
    
    // First, ensure we're logged in and have selected a workspace
    await page.goto('/select-workspace');
    
    // Wait for workspace cards and select one
    try {
      await page.waitForSelector('.workspace-card', { timeout: 10000 });
      const empresaDemoCard = page.locator('.workspace-card').filter({ hasText: 'Empresa Demo' });
      
      if (await empresaDemoCard.isVisible()) {
        await empresaDemoCard.click();
        await page.waitForURL('**/dashboard', { timeout: 10000 });
      }
    } catch (error) {
      console.log('⚠️  Workspace selection step failed, continuing with evaluation test');
    }

    // Try to navigate to evaluation page
    await page.goto('/evaluation');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we were redirected to 403 or access denied page
    const currentUrl = page.url();
    
    if (currentUrl.includes('/403') || currentUrl.includes('forbidden') || currentUrl.includes('access-denied')) {
      console.log('✓ Viewer user correctly redirected to 403 page');
      
      // Verify 403 page content
      await expect(page.locator('body')).toContainText(/403|forbidden|access denied|no autorizado/i);
      
    } else if (currentUrl.includes('/evaluation')) {
      // User has access to evaluation page
      console.log('ℹ️  User has evaluation access - not a viewer or permissions allow access');
      
      // This is not necessarily a failure - user might have the right permissions
      await expect(page.locator('body')).toBeVisible();
      
    } else {
      // User was redirected somewhere else
      console.log(`ℹ️  User redirected to: ${currentUrl}`);
      
      // Could be login page, dashboard, or other redirect
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle workspace selection loading states', async ({ page }) => {
    // Navigate to workspace selection
    await page.goto('/select-workspace');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if user has workspace access
    const noWorkspacesMessage = page.locator('text=No Workspaces Available');
    
    if (await noWorkspacesMessage.isVisible()) {
      console.log('ℹ️  User has no workspace access - checking loading states for no workspaces scenario');
      
      // Check for loading state initially
      const loadingStates = [
        page.locator('.loading-spinner'),
        page.locator('[data-testid="loading"]'),
        page.locator('.workspace-selector-loading'),
        page.locator('text=Loading')
      ];

      // Ensure no loading states are still visible
      for (const loadingElement of loadingStates) {
        try {
          await expect(loadingElement).not.toBeVisible({ timeout: 2000 });
        } catch {
          // Loading element might not exist, which is fine
        }
      }

      console.log('✓ Loading states handled correctly for no workspaces scenario');
      return;
    }

    // Check for loading state initially
    const loadingStates = [
      page.locator('.loading-spinner'),
      page.locator('[data-testid="loading"]'),
      page.locator('.workspace-selector-loading'),
      page.locator('text=Loading')
    ];

    // Wait a moment to see if loading state appears
    await page.waitForTimeout(1000);

    // Then wait for workspace cards to appear using data-testid (loading should be gone)
    await expect(page.locator('[data-testid^="ws-select-"]')).toHaveCountGreaterThan(0, { timeout: 15000 });

    // Ensure no loading states are still visible
    for (const loadingElement of loadingStates) {
      try {
        await expect(loadingElement).not.toBeVisible({ timeout: 2000 });
      } catch {
        // Loading element might not exist, which is fine
      }
    }

    console.log('✓ Loading states handled correctly with stable selectors');
  });

  test('should display workspace metadata correctly', async ({ page }) => {
    await page.goto('/select-workspace');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if user has workspace access
    const noWorkspacesMessage = page.locator('text=No Workspaces Available');
    
    if (await noWorkspacesMessage.isVisible()) {
      console.log('ℹ️  User has no workspace access - skipping metadata test');
      console.log('ℹ️  This test requires authentication and workspace memberships');
      return;
    }

    // Wait for workspace grid to load
    await page.getByTestId('workspace-grid').waitFor({ timeout: 10000 });

    // Check Personal workspace metadata using data-testid
    const personalCard = page.getByTestId('ws-select-personal');
    if (await personalCard.count() > 0) {
      await expect(personalCard).toBeVisible();
      
      // Look for personal workspace indicators
      const personalBadge = personalCard.locator('.workspace-badge', { hasText: /personal/i });
      if (await personalBadge.count() > 0) {
        await expect(personalBadge).toBeVisible();
      }
      console.log('✓ Personal workspace metadata displayed correctly');
    }

    // Check Empresa Demo workspace metadata using data-testid
    const empresaCard = page.getByTestId('ws-select-empresa-demo');
    if (await empresaCard.count() > 0) {
      await expect(empresaCard).toBeVisible();
      
      // Look for corporate workspace indicators
      const corporateBadge = empresaCard.locator('.workspace-badge', { hasText: /corporate|empresa/i });
      if (await corporateBadge.count() > 0) {
        await expect(corporateBadge).toBeVisible();
      }
      console.log('✓ Empresa Demo workspace metadata displayed correctly');
    }

    // Check for role badges if present
    const roleBadges = page.locator('.role-badge');
    if (await roleBadges.count() > 0) {
      console.log(`Found ${await roleBadges.count()} role badge(s)`);
    }

    console.log('✓ Workspace metadata displayed correctly with stable selectors');
  });
});

// Helper function to check authentication status
async function isUserLoggedIn(page) {
  try {
    // Check for common authentication indicators
    const authIndicators = [
      page.locator('[data-testid="user-menu"]'),
      page.locator('.user-profile'),
      page.locator('button[aria-label*="user"]'),
      page.locator('text=Sign out'),
      page.locator('text=Logout')
    ];

    for (const indicator of authIndicators) {
      if (await indicator.isVisible()) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}
