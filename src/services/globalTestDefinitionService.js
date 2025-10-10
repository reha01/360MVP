/**
 * Global Test Definition Service
 * 
 * Servicio para gestionar tests globales (solo Super Admin)
 * Los tests se almacenan en: global/testDefinitions/{testId}-{version}
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { dlog, dwarn, derror } from '../utils/debug';

const GLOBAL_TESTS_COLLECTION = 'global/platform/testDefinitions';

/**
 * Listar todos los tests globales
 */
export const listGlobalTests = async () => {
  try {
    dlog('[GlobalTestService] Listing all global tests');
    
    const testsRef = collection(db, GLOBAL_TESTS_COLLECTION);
    const q = query(testsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const tests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    dlog('[GlobalTestService] Found tests:', tests.length);
    return tests;
  } catch (error) {
    derror('[GlobalTestService] Error listing tests:', error);
    throw error;
  }
};

/**
 * Obtener un test específico
 */
export const getGlobalTest = async (testId, version) => {
  try {
    const docId = `${testId}-${version}`;
    dlog('[GlobalTestService] Getting test:', docId);
    
    const testRef = doc(db, GLOBAL_TESTS_COLLECTION, docId);
    const testSnap = await getDoc(testRef);
    
    if (!testSnap.exists()) {
      dwarn('[GlobalTestService] Test not found:', docId);
      return null;
    }
    
    return {
      id: testSnap.id,
      ...testSnap.data()
    };
  } catch (error) {
    derror('[GlobalTestService] Error getting test:', error);
    throw error;
  }
};

/**
 * Crear un nuevo test global
 */
export const createGlobalTest = async (testData, userId) => {
  try {
    const docId = `${testData.testId}-${testData.version}`;
    dlog('[GlobalTestService] Creating test:', docId);
    
    const testRef = doc(db, GLOBAL_TESTS_COLLECTION, docId);
    
    const newTest = {
      ...testData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };
    
    await setDoc(testRef, newTest);
    dlog('[GlobalTestService] Test created successfully');
    
    return { id: docId, ...newTest };
  } catch (error) {
    derror('[GlobalTestService] Error creating test:', error);
    throw error;
  }
};

/**
 * Actualizar un test global
 */
export const updateGlobalTest = async (testId, version, updates, userId) => {
  try {
    const docId = `${testId}-${version}`;
    dlog('[GlobalTestService] Updating test:', docId);
    
    const testRef = doc(db, GLOBAL_TESTS_COLLECTION, docId);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };
    
    await updateDoc(testRef, updateData);
    dlog('[GlobalTestService] Test updated successfully');
    
    return { id: docId, ...updateData };
  } catch (error) {
    derror('[GlobalTestService] Error updating test:', error);
    throw error;
  }
};

/**
 * Eliminar definitivamente un test global (función original)
 */
export const permanentDeleteGlobalTestOriginal = async (testId, version) => {
  try {
    const docId = `${testId}-${version}`;
    dlog('[GlobalTestService] Permanently deleting test:', docId);
    
    const testRef = doc(db, GLOBAL_TESTS_COLLECTION, docId);
    await deleteDoc(testRef);
    
    dlog('[GlobalTestService] Test permanently deleted');
  } catch (error) {
    derror('[GlobalTestService] Error permanently deleting test:', error);
    throw error;
  }
};

/**
 * Obtener tests disponibles para una organización
 * (tests públicos + tests privados donde la org está en allowedOrgs)
 */
export const getTestsForOrg = async (orgId) => {
  try {
    dlog('[GlobalTestService] Getting tests for org:', orgId);
    
    const testsRef = collection(db, GLOBAL_TESTS_COLLECTION);
    const snapshot = await getDocs(testsRef);
    
    const tests = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(test => {
        // Solo tests activos
        if (test.status !== 'active') return false;
        
        // Tests públicos están disponibles para todos
        if (test.visibility === 'public') return true;
        
        // Tests privados solo para orgs específicas
        if (test.visibility === 'private') {
          return test.allowedOrgs && test.allowedOrgs.includes(orgId);
        }
        
        return false;
      });
    
    dlog('[GlobalTestService] Found tests for org:', tests.length);
    return tests;
  } catch (error) {
    derror('[GlobalTestService] Error getting tests for org:', error);
    throw error;
  }
};

/**
 * Activar un test
 */
export const activateGlobalTest = async (testId, version, userId) => {
  try {
    dlog('[GlobalTestService] Activating test:', testId, version);
    
    await updateGlobalTest(testId, version, {
      status: 'active',
      publishedAt: serverTimestamp(),
      publishedBy: userId
    }, userId);
    
    dlog('[GlobalTestService] Test activated successfully');
  } catch (error) {
    derror('[GlobalTestService] Error activating test:', error);
    throw error;
  }
};

/**
 * Archivar un test
 */
export const archiveGlobalTest = async (testId, version, userId) => {
  try {
    dlog('[GlobalTestService] Archiving test:', testId, version);
    
    await updateGlobalTest(testId, version, {
      status: 'archived',
      archivedAt: serverTimestamp(),
      archivedBy: userId
    }, userId);
    
    dlog('[GlobalTestService] Test archived successfully');
  } catch (error) {
    derror('[GlobalTestService] Error archiving test:', error);
    throw error;
  }
};

/**
 * Desarchivar un test (volver a draft)
 */
export const unarchiveGlobalTest = async (testId, version, userId) => {
  try {
    dlog('[GlobalTestService] Unarchiving test:', testId, version);
    
    await updateGlobalTest(testId, version, {
      status: 'draft',
      archivedAt: null,
      archivedBy: null
    }, userId);
    
    dlog('[GlobalTestService] Test unarchived successfully');
  } catch (error) {
    derror('[GlobalTestService] Error unarchiving test:', error);
    throw error;
  }
};

/**
 * Eliminar un test (mover a papelera)
 */
export const deleteGlobalTest = async (testId, version, userId) => {
  try {
    dlog('[GlobalTestService] Deleting test:', testId, version);
    
    await updateGlobalTest(testId, version, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      deletedBy: userId
    }, userId);
    
    dlog('[GlobalTestService] Test moved to trash successfully');
  } catch (error) {
    derror('[GlobalTestService] Error deleting test:', error);
    throw error;
  }
};

/**
 * Restaurar un test desde la papelera
 */
export const restoreGlobalTest = async (testId, version, userId) => {
  try {
    dlog('[GlobalTestService] Restoring test:', testId, version);
    
    await updateGlobalTest(testId, version, {
      status: 'draft',
      deletedAt: null,
      deletedBy: null
    }, userId);
    
    dlog('[GlobalTestService] Test restored successfully');
  } catch (error) {
    derror('[GlobalTestService] Error restoring test:', error);
    throw error;
  }
};

/**
 * Eliminar definitivamente un test
 */
export const permanentDeleteGlobalTest = async (testId, version) => {
  try {
    dlog('[GlobalTestService] Permanently deleting test:', testId, version);
    
    const docId = `${testId}-${version}`;
    const testRef = doc(db, GLOBAL_TESTS_COLLECTION, docId);
    
    await deleteDoc(testRef);
    
    dlog('[GlobalTestService] Test permanently deleted');
  } catch (error) {
    derror('[GlobalTestService] Error permanently deleting test:', error);
    throw error;
  }
};

/**
 * Duplicar un test (crear nueva versión)
 */
export const duplicateGlobalTest = async (testId, oldVersion, newVersion, userId) => {
  try {
    dlog('[GlobalTestService] Duplicating test:', testId, oldVersion, '->', newVersion);
    
    // Obtener test original
    const originalTest = await getGlobalTest(testId, oldVersion);
    if (!originalTest) {
      throw new Error('Test original no encontrado');
    }
    
    // Crear nueva versión - limpiar campos de metadatos
    const { 
      id, 
      createdAt, 
      createdBy, 
      updatedAt, 
      updatedBy, 
      publishedAt, 
      publishedBy, 
      archivedAt, 
      archivedBy,
      ...cleanTestData 
    } = originalTest;
    
    const newTest = {
      ...cleanTestData,
      version: newVersion,
      status: 'draft' // Nueva versión comienza como draft
    };
    
    await createGlobalTest(newTest, userId);
    dlog('[GlobalTestService] Test duplicated successfully');
    
    return { testId: newTest.testId, version: newVersion };
  } catch (error) {
    derror('[GlobalTestService] Error duplicating test:', error);
    throw error;
  }
};

export default {
  listGlobalTests,
  getGlobalTest,
  createGlobalTest,
  updateGlobalTest,
  deleteGlobalTest,
  getTestsForOrg,
  activateGlobalTest,
  archiveGlobalTest,
  duplicateGlobalTest
};

