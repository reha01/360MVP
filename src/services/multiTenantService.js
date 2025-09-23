// src/services/multiTenantService.js
import { 
  createOrganization, 
  createOrganizationMember, 
  getPersonalOrgId,
  getAllUsers,
  getAllEvaluations,
  getAllReports,
  getOrganization,
  getOrganizationMembers
} from './firestore.js';
import { 
  updateDoc,
  doc,
  writeBatch,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Multi-Tenant Service - Handles organization setup and backfill operations
 */

// ========== FEATURE FLAG ==========
export const getTenancyV1Flag = () => {
  return import.meta.env.VITE_TENANCY_V1 === 'true' || false;
};

export const isTenancyEnabled = () => {
  return getTenancyV1Flag();
};

// ========== BACKFILL OPERATIONS ==========

/**
 * Creates personal organization and membership for a user
 * @param {Object} user - User object with id, displayName, email
 * @param {Boolean} dryRun - If true, only logs what would be created
 * @returns {Object} Result with success status and details
 */
export const createPersonalOrgForUser = async (user, dryRun = false) => {
  try {
    const orgId = getPersonalOrgId(user.id);
    const orgName = `Personal Space`;
    
    if (dryRun) {
      console.log(`[DRY-RUN] Would create org: ${orgId} for user: ${user.id} (${user.email})`);
      return { success: true, orgId, action: 'dry-run' };
    }
    
    // Check if organization already exists
    const existingOrg = await getOrganization(orgId);
    if (existingOrg) {
      console.log(`[360MVP] MultiTenant: Personal org already exists: ${orgId}`);
      
      // Check if membership exists
      const members = await getOrganizationMembers(orgId);
      const userMembership = members.find(m => m.userId === user.id);
      
      if (!userMembership) {
        // Create missing membership
        const membershipData = {
          orgId,
          userId: user.id,
          role: 'owner',
          status: 'active'
        };
        
        const membership = await createOrganizationMember(membershipData);
        console.log(`[360MVP] MultiTenant: Created missing membership: ${membership.id}`);
        return { success: true, orgId, membershipId: membership.id, action: 'membership-created' };
      }
      
      return { success: true, orgId, action: 'already-exists' };
    }
    
    // Create organization
    const orgData = {
      id: orgId,
      name: orgName,
      type: 'personal',
      ownerId: user.id
    };
    
    const organization = await createOrganization(orgData);
    console.log(`[360MVP] MultiTenant: Created personal org: ${orgId}`);
    
    // Create membership
    const membershipData = {
      orgId: orgId,
      userId: user.id,
      role: 'owner',
      status: 'active'
    };
    
    const membership = await createOrganizationMember(membershipData);
    console.log(`[360MVP] MultiTenant: Created membership: ${membership.id}`);
    
    return { 
      success: true, 
      orgId, 
      membershipId: membership.id, 
      action: 'created' 
    };
    
  } catch (error) {
    console.error(`[360MVP] MultiTenant: Error creating personal org for user ${user.id}:`, error);
    return { success: false, error: error.message, userId: user.id };
  }
};

/**
 * Backfills personal organizations for all existing users
 * @param {Boolean} dryRun - If true, only logs what would be created
 * @returns {Object} Results summary
 */
export const backfillPersonalOrganizations = async (dryRun = true) => {
  console.log(`[360MVP] MultiTenant: Starting personal organizations backfill (dryRun: ${dryRun})`);
  
  try {
    const users = await getAllUsers();
    console.log(`[360MVP] MultiTenant: Found ${users.length} users to process`);
    
    const results = {
      total: users.length,
      success: 0,
      errors: 0,
      skipped: 0,
      actions: {
        created: 0,
        'already-exists': 0,
        'membership-created': 0,
        'dry-run': 0
      },
      errors: []
    };
    
    // Process users in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`[360MVP] MultiTenant: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`);
      
      const batchPromises = batch.map(user => createPersonalOrgForUser(user, dryRun));
      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        if (result.success) {
          results.success++;
          results.actions[result.action]++;
        } else {
          results.errors++;
          results.errors.push(result);
        }
      });
      
      // Small delay between batches to avoid overwhelming Firestore
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('[360MVP] MultiTenant: Personal organizations backfill completed');
    console.log('Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('[360MVP] MultiTenant: Error in backfill process:', error);
    throw error;
  }
};

/**
 * Adds org_id field to an evaluation document
 * @param {Object} evaluation - Evaluation object with id and userId
 * @param {Boolean} dryRun - If true, only logs what would be updated
 * @returns {Object} Result with success status
 */
export const addOrgIdToEvaluation = async (evaluation, dryRun = false) => {
  try {
    const orgId = getPersonalOrgId(evaluation.userId);
    
    if (dryRun) {
      console.log(`[DRY-RUN] Would add orgId ${orgId} to evaluation: ${evaluation.id}`);
      return { success: true, evaluationId: evaluation.id, orgId, action: 'dry-run' };
    }
    
    // Check if already has orgId
    if (evaluation.orgId) {
      return { success: true, evaluationId: evaluation.id, action: 'already-has-orgid' };
    }
    
    // Update evaluation with orgId
    const evaluationRef = doc(db, 'evaluations', evaluation.id);
    await updateDoc(evaluationRef, {
      orgId: orgId,
      updatedAt: new Date()
    });
    
    console.log(`[360MVP] MultiTenant: Added orgId to evaluation: ${evaluation.id}`);
    return { success: true, evaluationId: evaluation.id, orgId, action: 'updated' };
    
  } catch (error) {
    console.error(`[360MVP] MultiTenant: Error adding orgId to evaluation ${evaluation.id}:`, error);
    return { success: false, error: error.message, evaluationId: evaluation.id };
  }
};

/**
 * Adds org_id field to all responses under an evaluation
 * @param {String} evaluationId - Evaluation ID
 * @param {String} orgId - Organization ID to assign
 * @param {Boolean} dryRun - If true, only logs what would be updated
 * @returns {Object} Result with success status
 */
export const addOrgIdToEvaluationResponses = async (evaluationId, orgId, dryRun = false) => {
  try {
    // Get all responses for this evaluation
    const responsesRef = collection(db, 'evaluations', evaluationId, 'responses');
    const responsesSnapshot = await getDocs(responsesRef);
    
    if (responsesSnapshot.empty) {
      return { success: true, action: 'no-responses', responsesCount: 0 };
    }
    
    if (dryRun) {
      console.log(`[DRY-RUN] Would add orgId ${orgId} to ${responsesSnapshot.size} responses in evaluation: ${evaluationId}`);
      return { success: true, action: 'dry-run', responsesCount: responsesSnapshot.size };
    }
    
    // Update responses in batch
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    responsesSnapshot.forEach((responseDoc) => {
      const responseData = responseDoc.data();
      if (!responseData.orgId) {
        batch.update(responseDoc.ref, {
          orgId: orgId,
          updatedAt: new Date()
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`[360MVP] MultiTenant: Added orgId to ${updatedCount} responses in evaluation: ${evaluationId}`);
    }
    
    return { 
      success: true, 
      action: 'updated', 
      responsesCount: responsesSnapshot.size,
      updatedCount 
    };
    
  } catch (error) {
    console.error(`[360MVP] MultiTenant: Error adding orgId to responses for evaluation ${evaluationId}:`, error);
    return { success: false, error: error.message, evaluationId };
  }
};

/**
 * Backfills org_id field to all existing evaluations and their responses
 * @param {Boolean} dryRun - If true, only logs what would be updated
 * @returns {Object} Results summary
 */
export const backfillEvaluationOrgIds = async (dryRun = true) => {
  console.log(`[360MVP] MultiTenant: Starting evaluations org_id backfill (dryRun: ${dryRun})`);
  
  try {
    const evaluations = await getAllEvaluations();
    console.log(`[360MVP] MultiTenant: Found ${evaluations.length} evaluations to process`);
    
    const results = {
      total: evaluations.length,
      success: 0,
      errors: 0,
      actions: {
        updated: 0,
        'already-has-orgid': 0,
        'dry-run': 0
      },
      responsesTotal: 0,
      responsesUpdated: 0,
      errors: []
    };
    
    // Process evaluations in batches
    const batchSize = 5;
    for (let i = 0; i < evaluations.length; i += batchSize) {
      const batch = evaluations.slice(i, i + batchSize);
      console.log(`[360MVP] MultiTenant: Processing evaluation batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(evaluations.length/batchSize)}`);
      
      for (const evaluation of batch) {
        // Add orgId to evaluation
        const evalResult = await addOrgIdToEvaluation(evaluation, dryRun);
        
        if (evalResult.success) {
          results.success++;
          results.actions[evalResult.action]++;
          
          // Add orgId to responses if evaluation was updated or in dry-run
          if (evalResult.action === 'updated' || evalResult.action === 'dry-run') {
            const orgId = getPersonalOrgId(evaluation.userId);
            const responsesResult = await addOrgIdToEvaluationResponses(evaluation.id, orgId, dryRun);
            
            if (responsesResult.success) {
              results.responsesTotal += responsesResult.responsesCount || 0;
              results.responsesUpdated += responsesResult.updatedCount || 0;
            }
          }
        } else {
          results.errors++;
          results.errors.push(evalResult);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < evaluations.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log('[360MVP] MultiTenant: Evaluations org_id backfill completed');
    console.log('Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('[360MVP] MultiTenant: Error in evaluations backfill:', error);
    throw error;
  }
};

/**
 * Adds org_id field to a report document
 * @param {Object} report - Report object with id and userId
 * @param {Boolean} dryRun - If true, only logs what would be updated
 * @returns {Object} Result with success status
 */
export const addOrgIdToReport = async (report, dryRun = false) => {
  try {
    const orgId = getPersonalOrgId(report.userId);
    
    if (dryRun) {
      console.log(`[DRY-RUN] Would add orgId ${orgId} to report: ${report.id}`);
      return { success: true, reportId: report.id, orgId, action: 'dry-run' };
    }
    
    // Check if already has orgId
    if (report.orgId) {
      return { success: true, reportId: report.id, action: 'already-has-orgid' };
    }
    
    // Update report with orgId
    const reportRef = doc(db, 'reports', report.id);
    await updateDoc(reportRef, {
      orgId: orgId,
      updatedAt: new Date()
    });
    
    console.log(`[360MVP] MultiTenant: Added orgId to report: ${report.id}`);
    return { success: true, reportId: report.id, orgId, action: 'updated' };
    
  } catch (error) {
    console.error(`[360MVP] MultiTenant: Error adding orgId to report ${report.id}:`, error);
    return { success: false, error: error.message, reportId: report.id };
  }
};

/**
 * Backfills org_id field to all existing reports
 * @param {Boolean} dryRun - If true, only logs what would be updated
 * @returns {Object} Results summary
 */
export const backfillReportOrgIds = async (dryRun = true) => {
  console.log(`[360MVP] MultiTenant: Starting reports org_id backfill (dryRun: ${dryRun})`);
  
  try {
    const reports = await getAllReports();
    console.log(`[360MVP] MultiTenant: Found ${reports.length} reports to process`);
    
    const results = {
      total: reports.length,
      success: 0,
      errors: 0,
      actions: {
        updated: 0,
        'already-has-orgid': 0,
        'dry-run': 0
      },
      errors: []
    };
    
    // Process reports in batches
    const batchSize = 10;
    for (let i = 0; i < reports.length; i += batchSize) {
      const batch = reports.slice(i, i + batchSize);
      console.log(`[360MVP] MultiTenant: Processing report batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(reports.length/batchSize)}`);
      
      const batchPromises = batch.map(report => addOrgIdToReport(report, dryRun));
      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        if (result.success) {
          results.success++;
          results.actions[result.action]++;
        } else {
          results.errors++;
          results.errors.push(result);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < reports.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log('[360MVP] MultiTenant: Reports org_id backfill completed');
    console.log('Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('[360MVP] MultiTenant: Error in reports backfill:', error);
    throw error;
  }
};

/**
 * Complete backfill process: organizations + evaluations + reports
 * @param {Boolean} dryRun - If true, only logs what would be done
 * @returns {Object} Complete results summary
 */
export const runCompleteBackfill = async (dryRun = true) => {
  console.log(`[360MVP] MultiTenant: Starting complete backfill process (dryRun: ${dryRun})`);
  
  const startTime = new Date();
  const results = {
    startTime,
    dryRun,
    organizations: null,
    evaluations: null,
    reports: null,
    success: false,
    totalDuration: null
  };
  
  try {
    // Step 1: Create personal organizations
    console.log('Step 1: Personal Organizations Backfill');
    results.organizations = await backfillPersonalOrganizations(dryRun);
    
    // Step 2: Backfill evaluations org_id
    console.log('\\nStep 2: Evaluations org_id Backfill');
    results.evaluations = await backfillEvaluationOrgIds(dryRun);
    
    // Step 3: Backfill reports org_id
    console.log('\\nStep 3: Reports org_id Backfill'); 
    results.reports = await backfillReportOrgIds(dryRun);
    
    results.success = true;
    results.totalDuration = new Date() - startTime;
    
    console.log('\\n[360MVP] MultiTenant: Complete backfill finished successfully');
    console.log(`Total duration: ${results.totalDuration}ms`);
    console.log('Final summary:', {
      organizations: `${results.organizations.success}/${results.organizations.total}`,
      evaluations: `${results.evaluations.success}/${results.evaluations.total}`,
      reports: `${results.reports.success}/${results.reports.total}`
    });
    
    return results;
    
  } catch (error) {
    results.success = false;
    results.error = error.message;
    results.totalDuration = new Date() - startTime;
    
    console.error('[360MVP] MultiTenant: Complete backfill failed:', error);
    throw error;
  }
};

// ========== VALIDATION UTILITIES ==========

/**
 * Validates the current state of multi-tenant data
 * @returns {Object} Validation results
 */
export const validateMultiTenantData = async () => {
  console.log('[360MVP] MultiTenant: Starting data validation');
  
  try {
    const users = await getAllUsers();
    const evaluations = await getAllEvaluations();
    const reports = await getAllReports();
    
    const validation = {
      users: {
        total: users.length,
        withPersonalOrg: 0,
        withMembership: 0
      },
      evaluations: {
        total: evaluations.length,
        withOrgId: evaluations.filter(e => e.orgId).length,
        withoutOrgId: evaluations.filter(e => !e.orgId).length
      },
      reports: {
        total: reports.length,
        withOrgId: reports.filter(r => r.orgId).length,
        withoutOrgId: reports.filter(r => !r.orgId).length
      },
      success: true
    };
    
    // Check personal orgs and memberships
    for (const user of users) {
      const orgId = getPersonalOrgId(user.id);
      const org = await getOrganization(orgId);
      if (org) {
        validation.users.withPersonalOrg++;
        
        const members = await getOrganizationMembers(orgId);
        const userMembership = members.find(m => m.userId === user.id);
        if (userMembership) {
          validation.users.withMembership++;
        }
      }
    }
    
    console.log('[360MVP] MultiTenant: Validation completed:', validation);
    return validation;
    
  } catch (error) {
    console.error('[360MVP] MultiTenant: Validation failed:', error);
    return { success: false, error: error.message };
  }
};
