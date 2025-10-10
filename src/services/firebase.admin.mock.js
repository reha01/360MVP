// src/services/firebase.admin.mock.js
// Mock implementation for testing without real Firestore

/**
 * In-memory mock database
 */
class MockFirestore {
  constructor() {
    this.collections = {};
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = {};
    }
    return new MockCollection(this.collections[name], name);
  }
}

class MockCollection {
  constructor(data, name) {
    this.data = data;
    this.name = name;
  }

  doc(id) {
    return new MockDocument(this.data, id);
  }

  async get() {
    const docs = [];
    for (const [id, data] of Object.entries(this.data)) {
      docs.push({
        id,
        data: () => data,
        exists: true
      });
    }
    return {
      docs,
      forEach: (callback) => docs.forEach(callback),
      empty: docs.length === 0,
      size: docs.length
    };
  }

  where(field, operator, value) {
    const filtered = {};
    for (const [id, doc] of Object.entries(this.data)) {
      const fieldValue = doc[field];
      let matches = false;
      
      switch (operator) {
        case '==':
          matches = fieldValue === value;
          break;
        case '!=':
          matches = fieldValue !== value;
          break;
        case '>':
          matches = fieldValue > value;
          break;
        case '>=':
          matches = fieldValue >= value;
          break;
        case '<':
          matches = fieldValue < value;
          break;
        case '<=':
          matches = fieldValue <= value;
          break;
        case 'in':
          matches = value.includes(fieldValue);
          break;
        case 'array-contains':
          matches = Array.isArray(fieldValue) && fieldValue.includes(value);
          break;
      }
      
      if (matches) {
        filtered[id] = doc;
      }
    }
    
    return new MockCollection(filtered, this.name);
  }
}

class MockDocument {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }

  async set(data) {
    this.collection[this.id] = { ...data };
    return this;
  }

  async get() {
    const data = this.collection[this.id];
    return {
      id: this.id,
      exists: data !== undefined,
      data: () => data || null
    };
  }

  async update(updates) {
    if (!this.collection[this.id]) {
      throw new Error(`Document ${this.id} does not exist`);
    }
    this.collection[this.id] = {
      ...this.collection[this.id],
      ...updates
    };
    return this;
  }

  async delete() {
    delete this.collection[this.id];
    return this;
  }
}

class MockBatch {
  constructor(db) {
    this.db = db;
    this.operations = [];
  }

  set(docRef, data) {
    this.operations.push({ type: 'set', docRef, data });
    return this;
  }

  update(docRef, data) {
    this.operations.push({ type: 'update', docRef, data });
    return this;
  }

  delete(docRef) {
    this.operations.push({ type: 'delete', docRef });
    return this;
  }

  async commit() {
    for (const op of this.operations) {
      switch (op.type) {
        case 'set':
          await op.docRef.set(op.data);
          break;
        case 'update':
          await op.docRef.update(op.data);
          break;
        case 'delete':
          await op.docRef.delete();
          break;
      }
    }
    return this;
  }
}

// Singleton mock database
let mockDb = null;

/**
 * Initialize mock Firestore for testing
 */
export const initializeMockAdmin = () => {
  if (mockDb) {
    return mockDb;
  }
  
  console.log('[Firebase Admin Mock] Initializing mock Firestore for testing');
  mockDb = new MockFirestore();
  
  // Pre-populate with test data if needed
  if (process.env.VITE_MOCK_DATA === 'true') {
    // Add some test users
    mockDb.collection('users').doc('test_user_1').set({
      email: 'test1@example.com',
      displayName: 'Test User 1',
      createdAt: new Date()
    });
    
    mockDb.collection('users').doc('test_user_2').set({
      email: 'test2@example.com', 
      displayName: 'Test User 2',
      createdAt: new Date()
    });
    
    console.log('[Firebase Admin Mock] Test data populated');
  }
  
  return mockDb;
};

/**
 * Get mock Firestore instance
 */
export const getMockDb = () => {
  if (!mockDb) {
    return initializeMockAdmin();
  }
  return mockDb;
};

/**
 * Mock admin utilities matching the real adminUtils interface
 */
export const mockAdminUtils = {
  async getAllDocs(collectionName) {
    const db = getMockDb();
    const snapshot = await db.collection(collectionName).get();
    const docs = [];
    
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    return docs;
  },

  async createDoc(collectionName, docId, data) {
    const db = getMockDb();
    await db.collection(collectionName).doc(docId).set(data);
    return { id: docId, ...data };
  },

  async updateDoc(collectionName, docId, updates) {
    const db = getMockDb();
    await db.collection(collectionName).doc(docId).update(updates);
  },

  async getDoc(collectionName, docId) {
    const db = getMockDb();
    const doc = await db.collection(collectionName).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async queryCollection(collectionName, field, operator, value) {
    const db = getMockDb();
    const snapshot = await db.collection(collectionName).where(field, operator, value).get();
    const docs = [];
    
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    return docs;
  },

  createBatch() {
    const db = getMockDb();
    return new MockBatch(db);
  },

  serverTimestamp() {
    return new Date();
  },
  
  // Helper to reset mock data between tests
  resetMockData() {
    mockDb = null;
    initializeMockAdmin();
  }
};

export default {
  initializeMockAdmin,
  getMockDb,
  mockAdminUtils
};









