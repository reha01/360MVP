# 360MVP - End-to-End Testing with Playwright

## Overview

This directory contains Playwright tests for the 360MVP application, including smoke tests for staging environments and comprehensive end-to-end tests.

## Setup

### Prerequisites

1. **Node.js** (v16 or later)
2. **Playwright** browsers installed

### Installation

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install
```

## Test Structure

```
tests/
├── smoke/                           # Smoke tests for critical functionality
│   ├── workspace.spec.ts            # Workspace selection tests (unauthenticated)
│   └── workspace-authenticated.spec.ts # Workspace tests with authentication
├── auth/                            # Authentication capture tests
│   └── capture-state.ts            # Capture authentication state
├── .auth/                          # Authentication state files (gitignored)
│   ├── state.json                  # Captured authentication state
│   └── authenticated-state.png     # Screenshot verification
├── e2e/                            # Full end-to-end tests (future)
└── README.md                       # This file
```

## Environment Configuration

### Staging Tests

For staging tests, set the `STAGING_BASE_URL` environment variable:

```bash
# Option 1: Set inline
STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app npm run test:smoke:staging

# Option 2: Create .env.test.local (not tracked by git)
cp env.test.example .env.test.local
# Edit .env.test.local with your staging URL
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STAGING_BASE_URL` | Staging environment URL | `https://mvp-staging-3e1cd.web.app` |
| `PLAYWRIGHT_HEADLESS` | Run tests in headless mode | `true` |
| `PLAYWRIGHT_SLOWMO` | Slow down operations (ms) | `500` |

## Authentication Setup

### Capturing Authentication State

Before running authenticated tests against staging, you need to capture authentication state:

```bash
# 1. Start the authentication capture process
npm run test:auth:capture

# 2. This will open a browser with Playwright inspector
# 3. Complete login process in the browser
# 4. Navigate to an authenticated page (e.g., /dashboard)
# 5. Click the ▶️ (Resume) button in Playwright inspector
# 6. Authentication state will be saved to tests/.auth/state.json
```

### Authentication Workflow

1. **Open Browser**: The command opens Chrome in headed mode with Playwright inspector
2. **Manual Login**: Complete the login process using staging credentials
3. **Verify Authentication**: Navigate to `/dashboard` or another protected page
4. **Resume Test**: Click the play button in Playwright inspector
5. **State Saved**: Authentication state is captured automatically

### Using Authenticated Tests

Once authentication state is captured, run authenticated tests:

```bash
# Run authenticated smoke tests
npm run test:smoke:staging:auth

# Or run specific authenticated test files
npx playwright test tests/smoke/workspace-authenticated.spec.ts
```

## Running Tests

### Quick Start

```bash
# Run unauthenticated smoke tests against staging
npm run test:smoke:staging

# Run authenticated smoke tests (requires captured auth state)
npm run test:smoke:staging:auth

# Run smoke tests with browser visible (headed mode)
npm run test:smoke:headed

# Debug tests interactively
npm run test:smoke:debug
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all Playwright tests |
| `npm run test:e2e:ui` | Run tests with UI mode |
| `npm run test:smoke` | Run smoke tests (local) |
| `npm run test:smoke:staging` | Run smoke tests against staging |
| `npm run test:smoke:headed` | Run smoke tests with visible browser |
| `npm run test:smoke:debug` | Run tests in debug mode |
| `npm run test:auth:capture` | Capture authentication state for staging |
| `npm run test:smoke:staging:auth` | Run authenticated smoke tests against staging |

### Manual Commands

```bash
# Run specific test file
npx playwright test tests/smoke/workspace.spec.ts

# Run with custom base URL
STAGING_BASE_URL=https://your-staging-url.web.app npx playwright test tests/smoke

# Run in headed mode with slow motion
npx playwright test tests/smoke --headed --slowmo=1000

# Run specific browser
npx playwright test tests/smoke --project=chromium

# Generate and view test report
npx playwright test tests/smoke
npx playwright show-report
```

## Smoke Tests

### Workspace Selection Tests (`workspace.spec.ts`)

Tests the critical workspace selection functionality:

#### Test Cases

1. **Workspace Cards Display**
   - ✅ Navigate to `/select-workspace`
   - ✅ Verify 'Personal' workspace card appears
   - ✅ Verify 'Empresa Demo' workspace card appears
   - ✅ Check workspace metadata and badges

2. **Workspace Selection**
   - ✅ Click 'Empresa Demo' workspace
   - ✅ Verify navigation to `/dashboard`
   - ✅ Confirm dashboard content loads

3. **Permission Validation**
   - ✅ Navigate to `/evaluation` as viewer user
   - ✅ Verify redirect to `/403` or access denied page
   - ✅ Check appropriate error messages

4. **Loading States**
   - ✅ Verify loading indicators appear/disappear correctly
   - ✅ Test timeout handling
   - ✅ Ensure smooth user experience

#### Expected Behavior

```typescript
// Example test flow
await page.goto('/select-workspace');
await expect(page.locator('.workspace-card')).toHaveCount(2);

const empresaCard = page.locator('.workspace-card').filter({ hasText: 'Empresa Demo' });
await empresaCard.click();

await page.waitForURL('**/dashboard');
expect(page.url()).toContain('/dashboard');
```

## Test Data

### Expected Workspaces

The smoke tests expect these workspaces to be available:

1. **Personal Workspace**
   - Type: `personal`
   - Badge: "Personal"
   - Description: "Your personal evaluation space"

2. **Empresa Demo Workspace**
   - Type: `corporate`
   - Name: "Empresa Demo"
   - Role: Variable (admin/member/viewer)

### User Roles

Tests are designed to work with different user roles:

- **Viewer**: Limited access, redirected from `/evaluation`
- **Member**: Standard access to evaluations
- **Admin**: Full access to all features

## Debugging Tests

### Visual Debugging

```bash
# Run with browser visible
npm run test:smoke:headed

# Debug step by step
npm run test:smoke:debug

# Take screenshots on failure
npx playwright test tests/smoke --screenshot=only-on-failure
```

### Test Reports

```bash
# Generate HTML report
npx playwright test tests/smoke --reporter=html

# View report
npx playwright show-report
```

### Common Issues

1. **Authentication Required**
   ```bash
   # If tests fail due to login requirement
   # Check if staging requires authentication
   # Consider adding login steps to beforeEach
   ```

2. **Workspace Not Found**
   ```bash
   # Verify workspace data exists in staging
   # Check that test user has access to expected workspaces
   ```

3. **Timing Issues**
   ```bash
   # Increase timeouts if needed
   # Use waitForLoadState('networkidle') for slow networks
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Smoke Tests
on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run smoke tests
        run: npm run test:smoke:staging
        env:
          STAGING_BASE_URL: ${{ secrets.STAGING_BASE_URL }}
```

## Best Practices

### Writing Tests

1. **Use Page Object Model** for complex pages
2. **Add explicit waits** for dynamic content
3. **Test critical user journeys** in smoke tests
4. **Keep tests independent** and idempotent
5. **Use descriptive test names** and console logs

### Performance

1. **Parallel execution** when possible
2. **Minimize network requests** in setup
3. **Reuse authentication** across tests
4. **Clean up test data** after runs

### Maintenance

1. **Update selectors** when UI changes
2. **Review test data** regularly
3. **Monitor test execution times**
4. **Keep dependencies updated**

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate documentation
3. Test locally before committing
4. Update this README if needed

## Troubleshooting

### Common Commands

```bash
# Clear Playwright cache
npx playwright install --force

# Update Playwright
npm update @playwright/test
npx playwright install

# Check Playwright version
npx playwright --version
```

### Support

For issues with tests:
1. Check test output and screenshots
2. Review staging environment status
3. Verify test data availability
4. Check authentication requirements

---

**Note**: These smoke tests are designed to verify critical functionality in staging environments. They should pass consistently and serve as early warning indicators for deployment issues.
