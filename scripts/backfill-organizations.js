#!/usr/bin/env node

/**
 * Backfill Script for Multi-Tenant Organizations
 * 
 * This script creates personal organizations for existing users and adds
 * org_id fields to evaluations, responses, and reports.
 * 
 * Usage:
 *   node scripts/backfill-organizations.js --dry-run        # Preview what would be done
 *   node scripts/backfill-organizations.js --execute       # Actually perform the backfill
 *   node scripts/backfill-organizations.js --validate      # Validate current state
 * 
 * Environment:
 *   Set FIREBASE_PROJECT_ID to target the correct Firebase project
 *   Example: FIREBASE_PROJECT_ID=mvp-staging-3e1cd node scripts/backfill-organizations.js --execute
 */

import { initializeAdmin } from '../src/services/firebase.admin.js';

// Import our multi-tenant service (admin version)
import { 
  runCompleteBackfill, 
  validateMultiTenantData,
  getTenancyV1Flag 
} from '../src/services/multiTenantService.admin.js';

// Initialize Firebase Admin
const adminDb = initializeAdmin();
console.log('[Backfill] Firebase Admin initialized');

const printBanner = () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                360MVP Multi-Tenant Backfill             ║');
  console.log('║                      Phase 0 Setup                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
};

const printUsage = () => {
  console.log('Usage:');
  console.log('  --dry-run    Preview what would be done (safe)');
  console.log('  --execute    Actually perform the backfill (destructive)');
  console.log('  --validate   Check current multi-tenant data state');
  console.log('');
  console.log('Environment Variables:');
  console.log('  FIREBASE_PROJECT_ID    Target Firebase project (required)');
  console.log('  VITE_USE_EMULATORS     Use local emulators (optional)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/backfill-organizations.js --dry-run');
  console.log('  FIREBASE_PROJECT_ID=my-prod-project node scripts/backfill-organizations.js --execute');
  console.log('');
};

const confirmExecution = () => {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  WARNING: This will modify your Firestore database!');
    console.log(`   Target project: ${firebaseConfig.projectId}`);
    console.log('');
    
    rl.question('Are you sure you want to proceed? Type "yes" to continue: ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

const formatResults = (results) => {
  console.log('');
  console.log('═══════════════════ RESULTS SUMMARY ═══════════════════');
  console.log(`Duration: ${results.totalDuration}ms`);
  console.log(`Status: ${results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('');
  
  if (results.organizations) {
    console.log('Organizations:');
    console.log(`  Total users: ${results.organizations.total}`);
    console.log(`  Successful: ${results.organizations.success}`);
    console.log(`  Errors: ${results.organizations.errors}`);
    console.log(`  Actions: Created: ${results.organizations.actions.created}, Already exists: ${results.organizations.actions['already-exists']}, Membership created: ${results.organizations.actions['membership-created']}`);
  }
  
  if (results.evaluations) {
    console.log('');
    console.log('Evaluations:');
    console.log(`  Total: ${results.evaluations.total}`);
    console.log(`  Successful: ${results.evaluations.success}`);
    console.log(`  Errors: ${results.evaluations.errors}`);
    console.log(`  Responses total: ${results.evaluations.responsesTotal}`);
    console.log(`  Responses updated: ${results.evaluations.responsesUpdated}`);
  }
  
  if (results.reports) {
    console.log('');
    console.log('Reports:');
    console.log(`  Total: ${results.reports.total}`);
    console.log(`  Successful: ${results.reports.success}`);
    console.log(`  Errors: ${results.reports.errors}`);
  }
  
  if (results.organizations?.errors.length > 0 || results.evaluations?.errors.length > 0 || results.reports?.errors.length > 0) {
    console.log('');
    console.log('🔥 ERRORS:');
    [...(results.organizations?.errors || []), ...(results.evaluations?.errors || []), ...(results.reports?.errors || [])]
      .forEach(error => {
        console.log(`  - ${error.userId || error.evaluationId || error.reportId}: ${error.error}`);
      });
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log('');
};

const formatValidation = (validation) => {
  console.log('');
  console.log('═══════════════════ VALIDATION RESULTS ═══════════════════');
  console.log(`Status: ${validation.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('');
  
  if (validation.success) {
    console.log('Users:');
    console.log(`  Total: ${validation.users.total}`);
    console.log(`  With personal org: ${validation.users.withPersonalOrg} (${Math.round(validation.users.withPersonalOrg/validation.users.total*100)}%)`);
    console.log(`  With membership: ${validation.users.withMembership} (${Math.round(validation.users.withMembership/validation.users.total*100)}%)`);
    console.log('');
    
    console.log('Evaluations:');
    console.log(`  Total: ${validation.evaluations.total}`);
    console.log(`  With org_id: ${validation.evaluations.withOrgId} (${Math.round(validation.evaluations.withOrgId/validation.evaluations.total*100)}%)`);
    console.log(`  Without org_id: ${validation.evaluations.withoutOrgId}`);
    console.log('');
    
    console.log('Reports:');
    console.log(`  Total: ${validation.reports.total}`);
    console.log(`  With org_id: ${validation.reports.withOrgId} (${Math.round(validation.reports.withOrgId/validation.reports.total*100)}%)`);
    console.log(`  Without org_id: ${validation.reports.withoutOrgId}`);
    console.log('');
    
    // Provide recommendations
    const allUsersHaveOrg = validation.users.withPersonalOrg === validation.users.total;
    const allEvaluationsHaveOrgId = validation.evaluations.withoutOrgId === 0;
    const allReportsHaveOrgId = validation.reports.withoutOrgId === 0;
    
    if (allUsersHaveOrg && allEvaluationsHaveOrgId && allReportsHaveOrgId) {
      console.log('🎉 READY: Multi-tenant backfill is complete! You can enable TENANCY_V1=true');
    } else {
      console.log('⚠️  INCOMPLETE: Some data still needs to be backfilled:');
      if (!allUsersHaveOrg) console.log('   - Run personal organizations backfill');
      if (!allEvaluationsHaveOrgId) console.log('   - Run evaluations org_id backfill');
      if (!allReportsHaveOrgId) console.log('   - Run reports org_id backfill');
    }
  } else {
    console.log(`Error: ${validation.error}`);
  }
  
  console.log('════════════════════════════════════════════════════════');
  console.log('');
};

const main = async () => {
  printBanner();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const isDryRun = args.includes('--dry-run');
  const isExecute = args.includes('--execute');
  const isValidate = args.includes('--validate');
  
  if (![isDryRun, isExecute, isValidate].filter(Boolean).length === 1) {
    console.error('❌ Error: Please specify exactly one of: --dry-run, --execute, or --validate');
    printUsage();
    process.exit(1);
  }
  
  console.log(`Target Firebase Project: ${process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "mvp-staging-3e1cd"}`);
  console.log(`Tenancy V1 Flag: ${getTenancyV1Flag()}`);
  console.log('');
  
  try {
    if (isValidate) {
      console.log('🔍 Validating current multi-tenant data state...');
      const validation = await validateMultiTenantData();
      formatValidation(validation);
      
    } else if (isDryRun) {
      console.log('🔍 DRY RUN: Analyzing what would be done...');
      const results = await runCompleteBackfill(true);
      formatResults(results);
      console.log('ℹ️  This was a dry run - no data was modified');
      
    } else if (isExecute) {
      const confirmed = await confirmExecution();
      
      if (!confirmed) {
        console.log('❌ Operation cancelled by user');
        process.exit(0);
      }
      
      console.log('🚀 EXECUTING: Running complete backfill...');
      console.log('⏳ This may take several minutes for large datasets...');
      console.log('');
      
      const results = await runCompleteBackfill(false);
      formatResults(results);
      
      if (results.success) {
        console.log('✅ Backfill completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Run validation: node scripts/backfill-organizations.js --validate');
        console.log('2. If validation passes, you can set TENANCY_V1=true');
        console.log('3. Test the application to ensure compatibility');
      } else {
        console.log('❌ Backfill completed with errors. Check the logs above.');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 Fatal Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();
