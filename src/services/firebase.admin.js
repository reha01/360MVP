// src/services/firebase.admin.js
// Firebase Admin SDK for Node.js scripts (backfill, smoke-test, etc.)

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeAdmin = () => {
  if (adminDb) {
    return adminDb; // Already initialized
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "mvp-staging-3e1cd";
  const useEmulators = process.env.VITE_USE_EMULATORS !== 'false';  // Default to true for development

  try {
    let app;
    
    // Always prefer emulator for development/testing
    if (useEmulators) {
      console.log('[Firebase Admin] Initializing for emulator/development mode');
      
      try {
        // Initialize app with minimal config for emulator
        app = initializeApp({
          projectId: projectId
        });
      } catch (e) {
        // App might already be initialized
        console.log('[Firebase Admin] App already initialized, reusing instance');
      }
      
      // Get Firestore instance
      adminDb = getFirestore();
      
      // Configure for emulator
      const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
      
      // Set environment variable for Admin SDK to recognize emulator
      process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
      
      console.log(`[Firebase Admin] Using Firestore emulator at ${FIRESTORE_EMULATOR_HOST}`);
      console.log('[Firebase Admin] Emulator initialization successful');
      
      return adminDb;
      
    } else {
      // Production mode - use real credentials
      console.log('[Firebase Admin] Initializing for production mode');
      
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('[Firebase Admin] Using service account credentials');
        app = initializeApp({
          credential: applicationDefault(),
          projectId: projectId
        });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Support inline service account JSON
        console.log('[Firebase Admin] Using inline service account credentials');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId
        });
      } else {
        // Try to use default credentials (for CI/CD environments)
        console.log('[Firebase Admin] Attempting to use default application credentials');
        app = initializeApp({
          credential: applicationDefault(),
          projectId: projectId
        });
      }
      
      adminDb = getFirestore();
      console.log('[Firebase Admin] Production initialization successful');
      return adminDb;
    }
    
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error.message);
    
    // Ultimate fallback - mock mode for testing
    console.warn('[Firebase Admin] Falling back to mock mode for testing');
    
    try {
      // Initialize with projectId only - will work for emulator
      const app = initializeApp({
        projectId: projectId
      }, `mock-${Date.now()}`);
      
      adminDb = getFirestore(app);
      
      // Force emulator connection
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
      
      console.log('[Firebase Admin] Mock mode initialized - using emulator');
      return adminDb;
      
    } catch (mockError) {
      console.error('[Firebase Admin] Mock mode also failed:', mockError.message);
      throw new Error('Firebase Admin SDK initialization completely failed');
    }
  }
};

/**
 * Get Firestore Admin instance
 */
export const getAdminDb = () => {
  if (!adminDb) {
    return initializeAdmin();
  }
  return adminDb;
};

/**
 * Admin-specific utility functions
 */
export const adminUtils = {
  /**
   * Get all documents from a collection
   */
  async getAllDocs(collectionName) {
    const db = getAdminDb();
    const snapshot = await db.collection(collectionName).get();
    const docs = [];
    
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    return docs;
  },

  /**
   * Create document with ID
   */
  async createDoc(collectionName, docId, data) {
    const db = getAdminDb();
    await db.collection(collectionName).doc(docId).set(data);
    return { id: docId, ...data };
  },

  /**
   * Update document
   */
  async updateDoc(collectionName, docId, updates) {
    const db = getAdminDb();
    await db.collection(collectionName).doc(docId).update(updates);
  },

  /**
   * Get document by ID
   */
  async getDoc(collectionName, docId) {
    const db = getAdminDb();
    const doc = await db.collection(collectionName).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  /**
   * Query collection with where clause
   */
  async queryCollection(collectionName, field, operator, value) {
    const db = getAdminDb();
    const snapshot = await db.collection(collectionName).where(field, operator, value).get();
    const docs = [];
    
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    return docs;
  },

  /**
   * Batch operations
   */
  createBatch() {
    const db = getAdminDb();
    return db.batch();
  },

  /**
   * Server timestamp - Using FieldValue from firestore
   */
  serverTimestamp() {
    const { FieldValue } = require('firebase-admin/firestore');
    return FieldValue.serverTimestamp();
  }
};

// Default export
export default {
  initializeAdmin,
  getAdminDb,
  adminUtils
};
