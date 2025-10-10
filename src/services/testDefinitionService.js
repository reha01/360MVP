/**
 * TestDefinitionService - Servicio para gestión de definiciones de tests
 * 
 * Funciones:
 * - listTests: Listar tests de una organización
 * - getTest: Obtener un test específico
 * - createTest: Crear nuevo test
 * - updateTest: Actualizar test existente
 * - activateTest: Activar test
 * - archiveTest: Archivar test
 * - duplicateTest: Duplicar test
 * - deleteTest: Eliminar test
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TEST_STATUS } from '../models/TestDefinition';

/**
 * Listar tests de una organización con filtros opcionales
 */
export const listTests = async (orgId, filters = {}) => {
  try {
    console.log('[TestDefinitionService] Listing tests:', { orgId, filters });

    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    // Construir query usando la estructura correcta de Firestore rules
    let q = query(
      collection(db, `orgs/${orgId}/testDefinitions`),
      orderBy('createdAt', 'desc')
    );

    // Aplicar filtros adicionales
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    const tests = [];

    snapshot.forEach((doc) => {
      tests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('[TestDefinitionService] Tests loaded:', tests.length);

    return {
      success: true,
      tests
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error listing tests:', error);
    return {
      success: false,
      error: error.message,
      tests: []
    };
  }
};

/**
 * Obtener un test específico
 */
export const getTest = async (orgId, testId, version = 'v1') => {
  try {
    console.log('[TestDefinitionService] Getting test:', { orgId, testId, version });

    const docId = `${testId}:${version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        test: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } else {
      return {
        success: false,
        error: 'Test not found'
      };
    }
  } catch (error) {
    console.error('[TestDefinitionService] Error getting test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Crear nuevo test
 */
export const createTest = async (orgId, testDefinition) => {
  try {
    console.log('[TestDefinitionService] Creating test:', { orgId, testDefinition });

    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    if (!testDefinition.testId || !testDefinition.title) {
      throw new Error('Test ID and title are required');
    }

    // Generar ID del documento
    const docId = `${testDefinition.testId}:${testDefinition.version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);

    // Verificar que no existe
    const existingDoc = await getDoc(docRef);
    if (existingDoc.exists()) {
      throw new Error('Test with this ID and version already exists');
    }

    // Preparar datos
    const testData = {
      ...testDefinition,
      orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: testDefinition.createdBy || 'system',
      updatedBy: testDefinition.updatedBy || 'system'
    };

    // Crear documento
    await setDoc(docRef, testData);

    console.log('[TestDefinitionService] Test created:', docId);

    return {
      success: true,
      testId: docId,
      test: testData
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error creating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Actualizar test existente
 */
export const updateTest = async (orgId, testId, version, updates) => {
  try {
    console.log('[TestDefinitionService] Updating test:', { orgId, testId, version, updates });

    const docId = `${testId}:${version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);

    // Verificar que existe
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Test not found');
    }

    // Verificar que no está activo (no se puede editar tests activos)
    const currentData = existingDoc.data();
    if (currentData.status === TEST_STATUS.ACTIVE) {
      throw new Error('Cannot edit active tests. Duplicate to create a new version.');
    }

    // Preparar actualizaciones
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: updates.updatedBy || 'system'
    };

    // Actualizar documento
    await updateDoc(docRef, updateData);

    console.log('[TestDefinitionService] Test updated:', docId);

    return {
      success: true,
      testId: docId
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error updating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Activar test
 */
export const activateTest = async (orgId, testId, version) => {
  try {
    console.log('[TestDefinitionService] Activating test:', { orgId, testId, version });

    const docId = `${testId}:${version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);

    // Verificar que existe
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Test not found');
    }

    // Desactivar otras versiones del mismo test
    const otherVersionsQuery = query(
      collection(db, `orgs/${orgId}/testDefinitions`),
      where('testId', '==', testId),
      where('status', '==', TEST_STATUS.ACTIVE)
    );

    const otherVersions = await getDocs(otherVersionsQuery);
    const updatePromises = [];

    otherVersions.forEach((doc) => {
      updatePromises.push(
        updateDoc(doc.ref, {
          status: TEST_STATUS.DRAFT,
          updatedAt: serverTimestamp(),
          updatedBy: 'system'
        })
      );
    });

    await Promise.all(updatePromises);

    // Activar esta versión
    await updateDoc(docRef, {
      status: TEST_STATUS.ACTIVE,
      publishedAt: serverTimestamp(),
      publishedBy: 'system',
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });

    console.log('[TestDefinitionService] Test activated:', docId);

    return {
      success: true,
      testId: docId
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error activating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Archivar test
 */
export const archiveTest = async (orgId, testId, version) => {
  try {
    console.log('[TestDefinitionService] Archiving test:', { orgId, testId, version });

    const docId = `${testId}:${version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);

    await updateDoc(docRef, {
      status: TEST_STATUS.ARCHIVED,
      archivedAt: serverTimestamp(),
      archivedBy: 'system',
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });

    console.log('[TestDefinitionService] Test archived:', docId);

    return {
      success: true,
      testId: docId
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error archiving test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Duplicar test para nueva versión
 */
export const duplicateTest = async (orgId, sourceTestId, sourceVersion) => {
  try {
    console.log('[TestDefinitionService] Duplicating test:', { orgId, sourceTestId, sourceVersion });

    // Obtener test fuente
    const sourceResult = await getTest(orgId, sourceTestId, sourceVersion);
    if (!sourceResult.success) {
      throw new Error(sourceResult.error);
    }

    const sourceTest = sourceResult.test;

    // Generar nueva versión
    const versionNumber = parseInt(sourceVersion.replace('v', '')) + 1;
    const newVersion = `v${versionNumber}`;

    // Crear nueva versión
    const newTest = {
      ...sourceTest,
      version: newVersion,
      status: TEST_STATUS.DRAFT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system',
      updatedBy: 'system',
      publishedAt: null,
      publishedBy: null,
      archivedAt: null,
      archivedBy: null
    };

    const createResult = await createTest(orgId, newTest);
    if (!createResult.success) {
      throw new Error(createResult.error);
    }

    console.log('[TestDefinitionService] Test duplicated:', createResult.testId);

    return {
      success: true,
      testId: createResult.testId,
      newVersion
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error duplicating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Eliminar test (solo drafts)
 */
export const deleteTest = async (orgId, testId, version) => {
  try {
    console.log('[TestDefinitionService] Deleting test:', { orgId, testId, version });

    const docId = `${testId}:${version}`;
    const docRef = doc(db, `orgs/${orgId}/testDefinitions`, docId);

    // Verificar que existe y es draft
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Test not found');
    }

    const testData = existingDoc.data();
    if (testData.status !== TEST_STATUS.DRAFT) {
      throw new Error('Can only delete draft tests');
    }

    // Eliminar documento
    await deleteDoc(docRef);

    console.log('[TestDefinitionService] Test deleted:', docId);

    return {
      success: true,
      testId: docId
    };
  } catch (error) {
    console.error('[TestDefinitionService] Error deleting test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};