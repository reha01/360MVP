// src/services/scopingService.js
// Service for managing organization-scoped queries

import { 
  query, 
  where, 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getActiveOrgId } from './firestore';
import { isTenancyV1Enabled } from './featureFlags';
import telemetry from './telemetryService';

/**
 * Multi-tenant scoping service
 */
class ScopingService {
  constructor() {
    this.tenancyEnabled = isTenancyV1Enabled();
  }

  /**
   * Get the current org ID for scoping
   */
  async getCurrentOrgId(userId) {
    return await getActiveOrgId(userId);
  }

  /**
   * Create a scoped query for a collection
   */
  async createScopedQuery(collectionName, userId, additionalConstraints = []) {
    const orgId = await this.getCurrentOrgId(userId);
    const baseRef = collection(db, collectionName);
    
    // Track the operation
    telemetry.trackOperation('read', collectionName, !!orgId, orgId);
    
    if (!orgId) {
      console.warn(`[ScopingService] No org_id for user ${userId} on ${collectionName}`);
      // In compatibility mode, fall back to user-based query
      return query(baseRef, where('userId', '==', userId), ...additionalConstraints);
    }
    
    // Apply org scoping
    return query(baseRef, where('orgId', '==', orgId), ...additionalConstraints);
  }

  /**
   * Get a scoped document
   */
  async getScopedDoc(collectionName, docId, userId) {
    const orgId = await this.getCurrentOrgId(userId);
    const docRef = doc(db, collectionName, docId);
    
    // Track the operation
    telemetry.trackOperation('read', collectionName, !!orgId, orgId);
    
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = { id: docSnap.id, ...docSnap.data() };
    
    // Check if document belongs to the user's org
    if (this.tenancyEnabled && orgId && data.orgId && data.orgId !== orgId) {
      telemetry.trackCrossOrgAttempt(orgId, data.orgId, collectionName);
      throw new Error(`Access denied: Document belongs to different organization`);
    }
    
    // Track legacy doc if missing orgId
    if (this.tenancyEnabled && !data.orgId) {
      telemetry.trackLegacyDoc(collectionName, docId);
    }
    
    return data;
  }

  /**
   * Create a scoped document
   */
  async createScopedDoc(collectionName, data, userId) {
    const orgId = await this.getCurrentOrgId(userId);
    
    // Track the operation
    telemetry.trackOperation('write', collectionName, !!orgId, orgId);
    
    // Add org_id to the data
    const scopedData = {
      ...data,
      orgId: orgId || null,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const collRef = collection(db, collectionName);
    const docRef = await addDoc(collRef, scopedData);
    
    return { id: docRef.id, ...scopedData };
  }

  /**
   * Update a scoped document
   */
  async updateScopedDoc(collectionName, docId, updates, userId) {
    const orgId = await this.getCurrentOrgId(userId);
    
    // First check if document belongs to user's org
    const existingDoc = await this.getScopedDoc(collectionName, docId, userId);
    
    if (!existingDoc) {
      throw new Error(`Document not found: ${docId}`);
    }
    
    // Track the operation
    telemetry.trackOperation('write', collectionName, !!orgId, orgId);
    
    const docRef = doc(db, collectionName, docId);
    const scopedUpdates = {
      ...updates,
      updatedAt: new Date()
    };
    
    // Ensure org_id doesn't change
    delete scopedUpdates.orgId;
    
    await updateDoc(docRef, scopedUpdates);
    
    return { id: docId, ...existingDoc, ...scopedUpdates };
  }

  /**
   * Delete a scoped document
   */
  async deleteScopedDoc(collectionName, docId, userId) {
    const orgId = await this.getCurrentOrgId(userId);
    
    // First check if document belongs to user's org
    const existingDoc = await this.getScopedDoc(collectionName, docId, userId);
    
    if (!existingDoc) {
      throw new Error(`Document not found: ${docId}`);
    }
    
    // Track the operation
    telemetry.trackOperation('write', collectionName, !!orgId, orgId);
    
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    
    return true;
  }

  /**
   * Get all scoped documents from a collection
   */
  async getScopedCollection(collectionName, userId, additionalConstraints = []) {
    const q = await this.createScopedQuery(collectionName, userId, additionalConstraints);
    const querySnapshot = await getDocs(q);
    
    const docs = [];
    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      
      // Track legacy doc if missing orgId
      if (this.tenancyEnabled && !data.orgId) {
        telemetry.trackLegacyDoc(collectionName, doc.id);
      }
      
      docs.push(data);
    });
    
    return docs;
  }

  /**
   * Create a batch operation with scoping
   */
  async createScopedBatch() {
    return writeBatch(db);
  }

  /**
   * Check if scoping is enforced
   */
  isScopingEnforced() {
    return this.tenancyEnabled;
  }

  /**
   * Assert that an evaluation belongs to the user's organization
   */
  async assertEvaluationBelongsToOrg(evaluationId, userId) {
    const evaluation = await this.getScopedDoc('evaluations', evaluationId, userId);
    if (!evaluation) {
      throw new Error(`Evaluation ${evaluationId} not found or access denied`);
    }
    return evaluation;
  }

  /**
   * Assert that a user can perform an action (has active membership)
   */
  async assertMemberCan(userId, action = 'read') {
    const orgId = await this.getCurrentOrgId(userId);
    if (!orgId) {
      throw new Error('User does not belong to any organization');
    }

    // Check if user has active membership
    const membersRef = collection(db, 'organization_members');
    const membershipQuery = query(
      membersRef,
      where('orgId', '==', orgId),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const membershipSnapshot = await getDocs(membershipQuery);
    if (membershipSnapshot.empty) {
      throw new Error(`User ${userId} does not have active membership in organization ${orgId}`);
    }

    const membership = membershipSnapshot.docs[0].data();
    return { orgId, membership };
  }

  /**
   * Get telemetry report
   */
  getTelemetryReport() {
    return telemetry.getMetrics();
  }
}

// Singleton instance
export const scopingService = new ScopingService();

// Export convenience functions
export const createScopedQuery = (collection, userId, constraints) => 
  scopingService.createScopedQuery(collection, userId, constraints);

export const getScopedDoc = (collection, docId, userId) =>
  scopingService.getScopedDoc(collection, docId, userId);

export const createScopedDoc = (collection, data, userId) =>
  scopingService.createScopedDoc(collection, data, userId);

export const updateScopedDoc = (collection, docId, updates, userId) =>
  scopingService.updateScopedDoc(collection, docId, updates, userId);

export const deleteScopedDoc = (collection, docId, userId) =>
  scopingService.deleteScopedDoc(collection, docId, userId);

export const getScopedCollection = (collection, userId, constraints) =>
  scopingService.getScopedCollection(collection, userId, constraints);

export const assertEvaluationBelongsToOrg = (evaluationId, userId) =>
  scopingService.assertEvaluationBelongsToOrg(evaluationId, userId);

export const assertMemberCan = (userId, action) =>
  scopingService.assertMemberCan(userId, action);

