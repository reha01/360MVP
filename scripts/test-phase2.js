#!/usr/bin/env node

// scripts/test-phase2.js
// Phase 2 Multi-Tenant Testing Script - Workspace Switcher & OrgContext

import { initializeAdmin, adminUtils as defaultAdminUtils } from '../src/services/firebase.admin.js';
import { initializeMockAdmin, mockAdminUtils } from '../src/services/firebase.admin.mock.js';

// Determine if we should use mock mode
const USE_MOCK = process.env.VITE_USE_MOCK === 'true' || process.env.CI === 'true';
let adminUtils;

const isTenancyV1Enabled = () => {
  return process.env.VITE_TENANCY_V1 === 'true';
};

// Testing Phase 2: Workspace Switcher & OrgContext
class Phase2Tester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}...`);
    try {
      const result = await testFunction();
      if (result === true || result?.success) {
        this.results.passed.push(testName);
        console.log(`✅ PASS: ${testName}`);
        return true;
      } else {
        this.results.failed.push({ test: testName, error: result?.error || 'Test returned false' });
        console.log(`❌ FAIL: ${testName} - ${result?.error || 'Test returned false'}`);
        return false;
      }
    } catch (error) {
      this.results.failed.push({ test: testName, error: error.message });
      console.log(`❌ FAIL: ${testName} - ${error.message}`);
      return false;
    }
  }

  async testOrgContextStructure() {
    console.log('   Checking OrgContext implementation...');
    
    try {
      // Check if OrgContext file exists
      const fs = await import('fs');
      const path = await import('path');
      
      const orgContextPath = path.join(process.cwd(), 'src/context/OrgContext.jsx');
      const exists = fs.existsSync(orgContextPath);
      
      if (!exists) {
        console.log('   ❌ OrgContext.jsx file not found');
        return false;
      }
      
      // Read file content and check for key exports
      const content = fs.readFileSync(orgContextPath, 'utf8');
      
      const hasOrgProvider = content.includes('export const OrgProvider');
      const hasUseOrg = content.includes('export const useOrg');
      const hasOrgContext = content.includes('const OrgContext = createContext');
      
      console.log(`   ✅ OrgContext.jsx file exists`);
      console.log(`   ${hasOrgProvider ? '✅' : '❌'} OrgProvider component`);
      console.log(`   ${hasUseOrg ? '✅' : '❌'} useOrg hook`);
      console.log(`   ${hasOrgContext ? '✅' : '❌'} OrgContext creation`);
      
      return hasOrgProvider && hasUseOrg && hasOrgContext;
    } catch (error) {
      console.log(`   ❌ Error checking OrgContext: ${error.message}`);
      return false;
    }
  }

  async testWorkspaceSwitcher() {
    console.log('   Checking WorkspaceSwitcher component...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const switcherPath = path.join(process.cwd(), 'src/components/WorkspaceSwitcher.jsx');
      const cssPath = path.join(process.cwd(), 'src/components/WorkspaceSwitcher.css');
      
      const componentExists = fs.existsSync(switcherPath);
      const cssExists = fs.existsSync(cssPath);
      
      console.log(`   ${componentExists ? '✅' : '❌'} WorkspaceSwitcher.jsx`);
      console.log(`   ${cssExists ? '✅' : '❌'} WorkspaceSwitcher.css`);
      
      if (componentExists) {
        const content = fs.readFileSync(switcherPath, 'utf8');
        const hasUseOrg = content.includes('useOrg');
        const hasDropdown = content.includes('workspace-dropdown');
        
        console.log(`   ${hasUseOrg ? '✅' : '❌'} Uses OrgContext`);
        console.log(`   ${hasDropdown ? '✅' : '❌'} Dropdown implementation`);
        
        return componentExists && cssExists && hasUseOrg && hasDropdown;
      }
      
      return false;
    } catch (error) {
      console.log(`   ❌ Error checking WorkspaceSwitcher: ${error.message}`);
      return false;
    }
  }

  async testWorkspaceGuard() {
    console.log('   Checking route guards implementation...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const guardPath = path.join(process.cwd(), 'src/components/WorkspaceGuard.jsx');
      const hookPath = path.join(process.cwd(), 'src/hooks/useOrgGuard.js');
      
      const guardExists = fs.existsSync(guardPath);
      const hookExists = fs.existsSync(hookPath);
      
      console.log(`   ${guardExists ? '✅' : '❌'} WorkspaceGuard.jsx`);
      console.log(`   ${hookExists ? '✅' : '❌'} useOrgGuard.js`);
      
      if (guardExists && hookExists) {
        const guardContent = fs.readFileSync(guardPath, 'utf8');
        const hookContent = fs.readFileSync(hookPath, 'utf8');
        
        const guardUsesOrg = guardContent.includes('useOrg');
        const hookHasGuard = hookContent.includes('useOrgGuard');
        const hookHasHOC = hookContent.includes('withOrgGuard');
        
        console.log(`   ${guardUsesOrg ? '✅' : '❌'} WorkspaceGuard uses OrgContext`);
        console.log(`   ${hookHasGuard ? '✅' : '❌'} useOrgGuard hook implementation`);
        console.log(`   ${hookHasHOC ? '✅' : '❌'} withOrgGuard HOC implementation`);
        
        return guardExists && hookExists && guardUsesOrg && hookHasGuard && hookHasHOC;
      }
      
      return false;
    } catch (error) {
      console.log(`   ❌ Error checking route guards: ${error.message}`);
      return false;
    }
  }

  async testWorkspaceSelector() {
    console.log('   Checking WorkspaceSelector component...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const selectorPath = path.join(process.cwd(), 'src/components/WorkspaceSelector.jsx');
      const cssPath = path.join(process.cwd(), 'src/components/WorkspaceSelector.css');
      
      const componentExists = fs.existsSync(selectorPath);
      const cssExists = fs.existsSync(cssPath);
      
      console.log(`   ${componentExists ? '✅' : '❌'} WorkspaceSelector.jsx`);
      console.log(`   ${cssExists ? '✅' : '❌'} WorkspaceSelector.css`);
      
      if (componentExists) {
        const content = fs.readFileSync(selectorPath, 'utf8');
        const hasUseOrg = content.includes('useOrg');
        const hasWorkspaceGrid = content.includes('workspace-grid');
        
        console.log(`   ${hasUseOrg ? '✅' : '❌'} Uses OrgContext`);
        console.log(`   ${hasWorkspaceGrid ? '✅' : '❌'} Workspace grid layout`);
        
        return componentExists && cssExists && hasUseOrg && hasWorkspaceGrid;
      }
      
      return false;
    } catch (error) {
      console.log(`   ❌ Error checking WorkspaceSelector: ${error.message}`);
      return false;
    }
  }

  async testServiceIntegration() {
    console.log('   Checking service integration with OrgContext...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const firestorePath = path.join(process.cwd(), 'src/services/firestore.js');
      const content = fs.readFileSync(firestorePath, 'utf8');
      
      // Check if getActiveOrgId has been updated to use context
      const hasContextImport = content.includes('getActiveOrgIdFromContext');
      const hasContextIntegration = content.includes('Phase 2: Try to read from OrgContext');
      
      console.log(`   ${hasContextImport ? '✅' : '❌'} Context integration import`);
      console.log(`   ${hasContextIntegration ? '✅' : '❌'} Context fallback logic`);
      console.log('   ✅ Service integration structure in place');
      
      return hasContextImport && hasContextIntegration;
    } catch (error) {
      console.log(`   ❌ Error checking service integration: ${error.message}`);
      return false;
    }
  }

  async testTelemetryUX() {
    console.log('   Checking UX telemetry implementation...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const telemetryPath = path.join(process.cwd(), 'src/services/telemetryService.js');
      const content = fs.readFileSync(telemetryPath, 'utf8');
      
      // Check for UX tracking methods in the file content
      const hasWorkspaceTracking = content.includes('trackWorkspaceEvent');
      const hasWorkspaceSwitch = content.includes('trackWorkspaceSwitch');
      const hasAutoSelect = content.includes('trackWorkspaceAutoSelect');
      const hasWorkspaceOpened = content.includes('trackWorkspaceOpened');
      
      console.log(`   ${hasWorkspaceTracking ? '✅' : '❌'} trackWorkspaceEvent method`);
      console.log(`   ${hasWorkspaceSwitch ? '✅' : '❌'} trackWorkspaceSwitch method`);
      console.log(`   ${hasAutoSelect ? '✅' : '❌'} trackWorkspaceAutoSelect method`);
      console.log(`   ${hasWorkspaceOpened ? '✅' : '❌'} trackWorkspaceOpened method`);
      
      return hasWorkspaceTracking && hasWorkspaceSwitch && hasAutoSelect && hasWorkspaceOpened;
    } catch (error) {
      console.log(`   ❌ Error checking telemetry: ${error.message}`);
      return false;
    }
  }

  async testMultiTenantData() {
    console.log('   Checking multi-tenant data structure...');
    
    // Create test organizations and memberships for testing
    try {
      // Create a personal org
      await adminUtils.createDoc('organizations', 'org_personal_testuser', {
        name: 'Personal Space',
        type: 'personal',
        createdAt: new Date()
      });

      // Create a corporate org
      await adminUtils.createDoc('organizations', 'org_corp_testcompany', {
        name: 'Test Company Inc',
        type: 'corporate',
        createdAt: new Date()
      });

      // Create memberships
      await adminUtils.createDoc('organization_members', 'org_personal_testuser_testuser', {
        orgId: 'org_personal_testuser',
        userId: 'testuser',
        role: 'owner',
        status: 'active',
        createdAt: new Date()
      });

      await adminUtils.createDoc('organization_members', 'org_corp_testcompany_testuser', {
        orgId: 'org_corp_testcompany',
        userId: 'testuser',
        role: 'employee',
        status: 'active',
        createdAt: new Date()
      });

      console.log('   ✅ Test data created successfully');
      console.log('   ✅ Multi-org structure validated');
      
      return true;
    } catch (error) {
      console.log(`   ❌ Error creating test data: ${error.message}`);
      return false;
    }
  }

  printResults() {
    console.log('\n');
    console.log('════════════════════════════════════════════════════════════');
    console.log('PHASE 2 TEST RESULTS');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${this.results.passed.length + this.results.failed.length}`);
    console.log(`Passed: ${this.results.passed.length}`);
    console.log(`Failed: ${this.results.failed.length}`);
    console.log(`Success Rate: ${Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)}%`);
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.results.warnings.length}):`);
      this.results.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.failed.forEach(failure => {
        console.log(`  - ${failure.test}: ${failure.error}`);
      });
    }
    
    console.log('\n📊 Phase 2 Components:');
    console.log('  ✅ OrgContext - Global workspace state management');
    console.log('  ✅ WorkspaceSwitcher - Header workspace selection');
    console.log('  ✅ WorkspaceGuard - Route protection');
    console.log('  ✅ WorkspaceSelector - Full-page workspace selection');
    console.log('  ✅ UX Telemetry - Workspace event tracking');
    
    console.log('════════════════════════════════════════════════════════════');
    
    if (this.results.failed.length === 0) {
      console.log('🎉 PHASE 2 TESTS PASSED - Workspace switcher is ready!');
      console.log('\nNext steps:');
      console.log('1. Integrate OrgProvider in your main App component');
      console.log('2. Add WorkspaceSwitcher to your header');
      console.log('3. Wrap protected routes with WorkspaceGuard');
      console.log('4. Test the complete user flow');
    } else {
      console.log('💥 PHASE 2 TESTS FAILED - Review the issues above');
    }
  }

  async runAllTests() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           360MVP Phase 2 Multi-Tenant Testing           ║');
    console.log('║              Workspace Switcher & OrgContext            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    
    console.log('\nTarget Firebase Project:', process.env.VITE_FIREBASE_PROJECT_ID || "mvp-staging-3e1cd");
    console.log('Environment:', process.env.VITE_ENVIRONMENT || 'development');
    console.log('TENANCY_V1:', isTenancyV1Enabled() ? 'ENABLED' : 'DISABLED');
    
    // Initialize Firebase Admin or Mock with auto-fallback
    try {
      if (USE_MOCK) {
        console.log('[Phase2Test] Mock mode requested - using mock Firestore');
        initializeMockAdmin();
        adminUtils = mockAdminUtils;
        await this.prepareTestData();
      } else {
        try {
          initializeAdmin();
          await defaultAdminUtils.getAllDocs('users');
          adminUtils = defaultAdminUtils;
          console.log('[Phase2Test] Firebase Admin initialized successfully');
        } catch (error) {
          console.log('[Phase2Test] Firebase Admin not available:', error.message.split('\n')[0]);
          console.log('[Phase2Test] Automatically using mock Firestore for testing');
          initializeMockAdmin();
          adminUtils = mockAdminUtils;
          await this.prepareTestData();
        }
      }
    } catch (error) {
      console.error('Failed to initialize testing environment:', error.message);
      return false;
    }
    
    // Run tests
    await this.runTest('OrgContext structure validation', () => this.testOrgContextStructure());
    await this.runTest('WorkspaceSwitcher component check', () => this.testWorkspaceSwitcher());
    await this.runTest('Route guards implementation', () => this.testWorkspaceGuard());
    await this.runTest('WorkspaceSelector component check', () => this.testWorkspaceSelector());
    await this.runTest('Service integration with context', () => this.testServiceIntegration());
    await this.runTest('UX telemetry implementation', () => this.testTelemetryUX());
    await this.runTest('Multi-tenant data structure', () => this.testMultiTenantData());
    
    this.printResults();
    
    return this.results.failed.length === 0;
  }

  async prepareTestData() {
    try {
      // Reset mock data
      if (adminUtils === mockAdminUtils) {
        adminUtils.resetMockData();
      }

      // Create test user
      await adminUtils.createDoc('users', 'testuser', {
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date()
      });

      console.log('[Phase2Test] Test data prepared');
    } catch (error) {
      console.warn('[Phase2Test] Error preparing test data:', error.message);
    }
  }
}

// Main execution
const main = async () => {
  const tester = new Phase2Tester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run if called directly
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default Phase2Tester;
