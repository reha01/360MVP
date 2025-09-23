import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Firestore Service - Abstrae las operaciones de base de datos
 */

// ========== USERS ==========
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userProfile = {
      uid,
      email: userData.email,
      displayName: userData.displayName || null,
      photoURL: userData.photoURL || null,
      emailVerified: userData.emailVerified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      preferences: {
        language: 'es',
        notifications: true
      },
      credits: 3, // Créditos iniciales
      evaluationsCompleted: 0,
      plan: 'free'
    };
    
    await setDoc(userRef, userProfile);
    console.log('[360MVP] Firestore: User profile created for:', uid);
    return userProfile;
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      console.log('[360MVP] Firestore: No user profile found for:', uid);
      return null;
    }
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('[360MVP] Firestore: User profile updated for:', uid);
  } catch (error) {
    console.error('[360MVP] Firestore: Error updating user profile:', error);
    throw error;
  }
};

// ========== EVALUATIONS ==========
export const createEvaluation = async (userId, evaluationData) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      const { createScopedDoc } = await import('./scopingService.js');
      const evaluation = {
        title: evaluationData.title || 'Evaluación 360°',
        status: 'draft', // draft, in_progress, completed
        progress: 0,
        totalQuestions: evaluationData.totalQuestions || 0,
        answeredQuestions: 0,
        category: evaluationData.category || 'leadership',
        ...evaluationData
      };
      
      const result = await createScopedDoc('evaluations', evaluation, userId);
      console.log('[360MVP] Firestore: Evaluation created with ID:', result.id);
      return result;
    }
    
    // Legacy path for compatibility - but still use scoping when possible
    const orgId = await getActiveOrgId(userId);
    
    // Track this operation for telemetry
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('write', 'evaluations', !!orgId, orgId);
    
    const evaluationRef = collection(db, 'evaluations');
    const evaluation = {
      userId,
      orgId: orgId || null, // Always include orgId even in legacy mode
      title: evaluationData.title || 'Evaluación 360°',
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      totalQuestions: evaluationData.totalQuestions || 0,
      answeredQuestions: 0,
      category: evaluationData.category || 'leadership',
      ...evaluationData
    };
    
    const docRef = await addDoc(evaluationRef, evaluation);
    console.log('[360MVP] Firestore: Evaluation created with ID:', docRef.id);
    return { id: docRef.id, ...evaluation };
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating evaluation:', error);
    throw error;
  }
};

export const getUserEvaluations = async (userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      const { getScopedCollection } = await import('./scopingService.js');
      const { orderBy } = await import('firebase/firestore');
      
      const evaluations = await getScopedCollection('evaluations', userId, [
        orderBy('createdAt', 'desc')
      ]);
      
      console.log('[360MVP] Firestore: Retrieved', evaluations.length, 'evaluations for user:', userId);
      return evaluations;
    }
    
    // Legacy path for compatibility
    const orgId = await getActiveOrgId(userId);
    const evaluationsRef = collection(db, 'evaluations');
    
    // If we have orgId, use it for scoping
    const q = orgId 
      ? query(
          evaluationsRef,
          where('orgId', '==', orgId),
          orderBy('createdAt', 'desc')
        )
      : query(
          evaluationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
    
    const querySnapshot = await getDocs(q);
    const evaluations = [];
    
    querySnapshot.forEach((doc) => {
      evaluations.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', evaluations.length, 'evaluations for user:', userId);
    return evaluations;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting user evaluations:', error);
    throw error;
  }
};

export const updateEvaluation = async (evaluationId, updates, userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      const { updateScopedDoc } = await import('./scopingService.js');
      await updateScopedDoc('evaluations', evaluationId, updates, userId);
      console.log('[360MVP] Firestore: Evaluation updated:', evaluationId);
      return;
    }
    
    // Legacy path for compatibility
    const evaluationRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(evaluationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('[360MVP] Firestore: Evaluation updated:', evaluationId);
  } catch (error) {
    console.error('[360MVP] Firestore: Error updating evaluation:', error);
    throw error;
  }
};

// ========== RESPONSES ==========
export const saveResponse = async (evaluationId, questionId, responseData, userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      // First verify evaluation belongs to user's org and user has membership
      const { assertEvaluationBelongsToOrg, assertMemberCan } = await import('./scopingService.js');
      await assertEvaluationBelongsToOrg(evaluationId, userId);
      await assertMemberCan(userId, 'write');
    }
    
    const responseRef = doc(db, 'evaluations', evaluationId, 'responses', questionId);
    const orgId = await getActiveOrgId(userId);
    
    // Track this operation for telemetry
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('write', 'responses', !!orgId, orgId);
    
    const response = {
      evaluationId,
      questionId,
      orgId: orgId || null, // Always include orgId for consistency
      userId,
      answer: responseData.answer,
      value: responseData.value || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(responseRef, response);
    console.log('[360MVP] Firestore: Response saved for question:', questionId);
    return response;
  } catch (error) {
    console.error('[360MVP] Firestore: Error saving response:', error);
    throw error;
  }
};

export const getEvaluationResponses = async (evaluationId, userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      // First verify evaluation belongs to user's org and user has membership
      const { assertEvaluationBelongsToOrg, assertMemberCan } = await import('./scopingService.js');
      await assertEvaluationBelongsToOrg(evaluationId, userId);
      await assertMemberCan(userId, 'read');
      
      // In tenancy mode, filter responses by orgId if available
      const responsesRef = collection(db, 'evaluations', evaluationId, 'responses');
      const orgId = await getActiveOrgId(userId);
      
      let querySnapshot;
      if (orgId) {
        // Filter by orgId if available
        const q = query(responsesRef, where('orgId', '==', orgId));
        querySnapshot = await getDocs(q);
      } else {
        // Fallback to all responses (compatibility)
        querySnapshot = await getDocs(responsesRef);
      }
      
      const responses = [];
      querySnapshot.forEach((doc) => {
        responses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('[360MVP] Firestore: Retrieved', responses.length, 'responses for evaluation:', evaluationId);
      return responses;
    }
    
    // Legacy path for compatibility - but still track for telemetry
    const orgId = await getActiveOrgId(userId);
    
    // Track this operation for telemetry
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('read', 'responses', !!orgId, orgId);
    
    const responsesRef = collection(db, 'evaluations', evaluationId, 'responses');
    const querySnapshot = await getDocs(responsesRef);
    const responses = [];
    
    querySnapshot.forEach((doc) => {
      responses.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', responses.length, 'responses for evaluation:', evaluationId);
    return responses;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting evaluation responses:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========
export const initializeUserOnFirstLogin = async (user) => {
  try {
    const existingProfile = await getUserProfile(user.uid);
    
    if (!existingProfile) {
      console.log('[360MVP] Firestore: First login detected, creating user profile...');
      return await createUserProfile(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      });
    }
    
    console.log('[360MVP] Firestore: User profile exists, returning existing profile');
    return existingProfile;
  } catch (error) {
    console.error('[360MVP] Firestore: Error initializing user:', error);
    throw error;
  }
};

// ========== ORGANIZATIONS ==========
export const createOrganization = async (orgData) => {
  try {
    const orgRef = doc(db, 'organizations', orgData.id);
    const organization = {
      id: orgData.id,
      name: orgData.name,
      type: orgData.type, // 'personal' | 'corporate'
      settings: {
        minAnonThreshold: orgData.type === 'corporate' ? 3 : null,
        branding: orgData.type === 'corporate' ? {} : null,
        features: {
          invitations: orgData.type === 'corporate',
          reports: true,
          analytics: orgData.type === 'corporate'
        },
        ...orgData.settings
      },
      ownerId: orgData.ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(orgRef, organization);
    console.log('[360MVP] Firestore: Organization created:', orgData.id);
    return organization;
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating organization:', error);
    throw error;
  }
};

export const getOrganization = async (orgId) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    
    if (orgSnap.exists()) {
      return { id: orgSnap.id, ...orgSnap.data() };
    } else {
      console.log('[360MVP] Firestore: No organization found for:', orgId);
      return null;
    }
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting organization:', error);
    throw error;
  }
};

export const getUserOrganizations = async (userId) => {
  try {
    // Get user's memberships first
    const membershipsRef = collection(db, 'organization_members');
    const membershipsQuery = query(
      membershipsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const orgIds = [];
    
    membershipsSnapshot.forEach((doc) => {
      orgIds.push(doc.data().orgId);
    });
    
    if (orgIds.length === 0) {
      return [];
    }
    
    // Get organizations data
    const organizations = [];
    for (const orgId of orgIds) {
      const org = await getOrganization(orgId);
      if (org) {
        organizations.push(org);
      }
    }
    
    console.log('[360MVP] Firestore: Retrieved', organizations.length, 'organizations for user:', userId);
    return organizations;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting user organizations:', error);
    throw error;
  }
};

// ========== ORGANIZATION MEMBERS ==========
export const createOrganizationMember = async (membershipData) => {
  try {
    const memberRef = collection(db, 'organization_members');
    const membership = {
      orgId: membershipData.orgId,
      userId: membershipData.userId,
      role: membershipData.role, // 'owner' | 'project_leader' | 'coordinator' | 'employee' | 'evaluator'
      status: membershipData.status || 'active', // 'active' | 'invited' | 'suspended'
      invitedBy: membershipData.invitedBy || null,
      invitedAt: membershipData.status === 'invited' ? serverTimestamp() : null,
      joinedAt: membershipData.status === 'active' ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(memberRef, membership);
    console.log('[360MVP] Firestore: Organization member created with ID:', docRef.id);
    return { id: docRef.id, ...membership };
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating organization member:', error);
    throw error;
  }
};

export const getOrganizationMembers = async (orgId) => {
  try {
    const membersRef = collection(db, 'organization_members');
    const q = query(
      membersRef,
      where('orgId', '==', orgId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const members = [];
    
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', members.length, 'members for org:', orgId);
    return members;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting organization members:', error);
    throw error;
  }
};

// ========== MULTI-TENANT HELPERS ==========
export const getPersonalOrgId = (userId) => {
  return `org_personal_${userId}`;
};

export const getActiveOrgId = async (userId) => {
  // Phase 2: Try to read from OrgContext first, fallback to legacy
  try {
    const { getActiveOrgIdFromContext } = await import('../context/OrgContext.jsx');
    const contextOrgId = getActiveOrgIdFromContext();
    
    if (contextOrgId) {
      return contextOrgId;
    }
  } catch (error) {
    // Context not available, use legacy approach
    console.log('[getActiveOrgId] Context not available, using legacy approach');
  }
  
  // Fallback to personal org (Phase 0/1 behavior)
  return getPersonalOrgId(userId);
};

export const orgScope = (baseQuery, orgId) => {
  // Helper to add org_id filter to queries
  // Usage: orgScope(query(collection(db, 'evaluations')), orgId)
  return query(baseQuery, where('orgId', '==', orgId));
};

// ========== BACKFILL UTILITIES ==========
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', users.length, 'users for backfill');
    return users;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting all users:', error);
    throw error;
  }
};

export const getAllEvaluations = async () => {
  try {
    const evaluationsRef = collection(db, 'evaluations');
    const querySnapshot = await getDocs(evaluationsRef);
    const evaluations = [];
    
    querySnapshot.forEach((doc) => {
      evaluations.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', evaluations.length, 'evaluations for backfill');
    return evaluations;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting all evaluations:', error);
    throw error;
  }
};

export const getAllReports = async (userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      // First verify user has membership
      const { assertMemberCan, getScopedCollection } = await import('./scopingService.js');
      await assertMemberCan(userId, 'read');
      
      const { orderBy } = await import('firebase/firestore');
      
      const reports = await getScopedCollection('reports', userId, [
        orderBy('createdAt', 'desc')
      ]);
      
      console.log('[360MVP] Firestore: Retrieved', reports.length, 'scoped reports');
      return reports;
    }
    
    // Legacy path for compatibility
    const orgId = await getActiveOrgId(userId);
    
    // Track this operation for telemetry
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('read', 'reports', !!orgId, orgId);
    
    const reportsRef = collection(db, 'reports');
    
    // If we have orgId, use it for scoping
    const q = orgId 
      ? query(
          reportsRef,
          where('orgId', '==', orgId),
          orderBy('createdAt', 'desc')
        )
      : query(
          reportsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', reports.length, 'reports');
    return reports;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting all reports:', error);
    throw error;
  }
};

export const deleteEvaluation = async (evaluationId, userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      // First verify evaluation belongs to user's org and user has membership
      const { assertEvaluationBelongsToOrg, assertMemberCan, deleteScopedDoc } = await import('./scopingService.js');
      await assertEvaluationBelongsToOrg(evaluationId, userId);
      await assertMemberCan(userId, 'write');
      
      await deleteScopedDoc('evaluations', evaluationId, userId);
      console.log('[360MVP] Firestore: Evaluation deleted:', evaluationId);
      return;
    }
    
    // Legacy path for compatibility - verify ownership first
    const evaluationRef = doc(db, 'evaluations', evaluationId);
    const evaluationSnap = await getDoc(evaluationRef);
    
    if (!evaluationSnap.exists()) {
      throw new Error('Evaluation not found');
    }
    
    const evaluation = evaluationSnap.data();
    if (evaluation.userId !== userId) {
      throw new Error('Access denied: You can only delete your own evaluations');
    }
    
    // Track this operation for telemetry
    const orgId = await getActiveOrgId(userId);
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('write', 'evaluations', !!orgId, orgId);
    
    await deleteDoc(evaluationRef);
    console.log('[360MVP] Firestore: Evaluation deleted:', evaluationId);
  } catch (error) {
    console.error('[360MVP] Firestore: Error deleting evaluation:', error);
    throw error;
  }
};

export const generateReport = async (evaluationId, reportData, userId) => {
  try {
    // Use scoping service if tenancy is enabled
    const { isTenancyV1Enabled } = await import('./featureFlags.js');
    
    if (isTenancyV1Enabled()) {
      // First verify evaluation belongs to user's org and user has membership
      const { assertEvaluationBelongsToOrg, assertMemberCan, createScopedDoc } = await import('./scopingService.js');
      const evaluation = await assertEvaluationBelongsToOrg(evaluationId, userId);
      await assertMemberCan(userId, 'write');
      
      const report = {
        evaluationId,
        title: reportData.title || `Report for ${evaluation.title}`,
        data: reportData.data || {},
        generatedAt: new Date(),
        ...reportData
      };
      
      const result = await createScopedDoc('reports', report, userId);
      console.log('[360MVP] Firestore: Report generated with ID:', result.id);
      return result;
    }
    
    // Legacy path for compatibility
    const reportsRef = collection(db, 'reports');
    const orgId = await getActiveOrgId(userId);
    
    // Track this operation for telemetry
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('write', 'reports', !!orgId, orgId);
    
    const report = {
      evaluationId,
      userId,
      orgId: orgId || null, // Always include orgId for consistency
      title: reportData.title || `Report for evaluation`,
      data: reportData.data || {},
      generatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...reportData
    };
    
    const docRef = await addDoc(reportsRef, report);
    console.log('[360MVP] Firestore: Report generated with ID:', docRef.id);
    return { id: docRef.id, ...report };
  } catch (error) {
    console.error('[360MVP] Firestore: Error generating report:', error);
    throw error;
  }
};
