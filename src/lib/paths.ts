/**
 * Centralized Firestore path helpers
 * 
 * This module provides consistent path generation for Firestore collections
 * to prevent hardcoded collection names throughout the codebase.
 */

import { doc, collection } from 'firebase/firestore';
import { db } from './firebase';

// Main collection name - SINGLE SOURCE OF TRUTH
export const ORG_COLLECTION = 'organizations';

/**
 * Get a reference to an organization document
 * @param orgId The organization ID
 * @returns DocumentReference to the organization
 */
export const orgDoc = (orgId: string) => doc(db, ORG_COLLECTION, orgId);

/**
 * Get a reference to a subcollection within an organization
 * @param orgId The organization ID
 * @param col The subcollection name
 * @returns CollectionReference to the subcollection
 */
export const orgCol = (orgId: string, col: string) => 
  collection(db, ORG_COLLECTION, orgId, col);

/**
 * Get a reference to a document within an organization subcollection
 * @param orgId The organization ID
 * @param col The subcollection name
 * @param docId The document ID
 * @returns DocumentReference to the document
 */
export const orgSubDoc = (orgId: string, col: string, docId: string) => 
  doc(db, ORG_COLLECTION, orgId, col, docId);

/**
 * Get the full path string for an organization
 * @param orgId The organization ID
 * @returns Path string
 */
export const orgPath = (orgId: string) => `${ORG_COLLECTION}/${orgId}`;

/**
 * Get the full path string for a subcollection
 * @param orgId The organization ID
 * @param col The subcollection name
 * @returns Path string
 */
export const orgSubPath = (orgId: string, col: string) => 
  `${ORG_COLLECTION}/${orgId}/${col}`;
