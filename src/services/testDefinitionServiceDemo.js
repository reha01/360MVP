/**
 * TestDefinitionServiceDemo - Servicio de tests para modo demo local
 * 
 * Usa localStorage en lugar de Firestore para permitir
 * creación y gestión de tests sin permisos de Firestore
 */

import { dlog, dwarn } from '../utils/debug';

// Clave para localStorage
const DEMO_TESTS_KEY = 'demo_test_definitions';
const DEMO_SESSIONS_KEY = 'demo_evaluation_sessions';

/**
 * Obtener tests desde localStorage
 */
export const listTests = async (orgId, filters = {}) => {
  try {
    dlog('[TestDefinitionServiceDemo] Listing tests for org:', orgId);
    
    const testsJson = localStorage.getItem(DEMO_TESTS_KEY);
    let tests = testsJson ? JSON.parse(testsJson) : [];
    
    // Filtrar por organización
    tests = tests.filter(test => test.orgId === orgId);
    
    // Aplicar filtros adicionales
    if (filters.status) {
      tests = tests.filter(test => test.status === filters.status);
    }
    
    dlog('[TestDefinitionServiceDemo] Found tests:', tests.length);
    
    return {
      success: true,
      tests,
      total: tests.length
    };
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error listing tests:', error);
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
    dlog('[TestDefinitionServiceDemo] Getting test:', { orgId, testId, version });
    
    const testsJson = localStorage.getItem(DEMO_TESTS_KEY);
    const tests = testsJson ? JSON.parse(testsJson) : [];
    
    const test = tests.find(t => 
      t.orgId === orgId && 
      t.testId === testId && 
      t.version === version
    );
    
    if (test) {
      return {
        success: true,
        test
      };
    } else {
      return {
        success: false,
        error: 'Test not found',
        test: null
      };
    }
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error getting test:', error);
    return {
      success: false,
      error: error.message,
      test: null
    };
  }
};

/**
 * Crear un nuevo test
 */
export const createTest = async (orgId, testDefinition, userId) => {
  try {
    dlog('[TestDefinitionServiceDemo] Creating test:', { orgId, testId: testDefinition.testId });
    
    const testsJson = localStorage.getItem(DEMO_TESTS_KEY);
    const tests = testsJson ? JSON.parse(testsJson) : [];
    
    // Verificar que no existe
    const exists = tests.find(t => 
      t.orgId === orgId && 
      t.testId === testDefinition.testId && 
      t.version === testDefinition.version
    );
    
    if (exists) {
      return {
        success: false,
        error: 'Test already exists'
      };
    }
    
    // Crear el test
    const newTest = {
      ...testDefinition,
      orgId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tests.push(newTest);
    localStorage.setItem(DEMO_TESTS_KEY, JSON.stringify(tests));
    
    dlog('[TestDefinitionServiceDemo] Test created successfully');
    
    return {
      success: true,
      testDefinitionId: `${orgId}:${testDefinition.testId}:${testDefinition.version}`,
      test: newTest
    };
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error creating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Actualizar un test
 */
export const updateTest = async (orgId, testId, version, updates, userId) => {
  try {
    dlog('[TestDefinitionServiceDemo] Updating test:', { orgId, testId, version });
    
    const testsJson = localStorage.getItem(DEMO_TESTS_KEY);
    const tests = testsJson ? JSON.parse(testsJson) : [];
    
    const testIndex = tests.findIndex(t => 
      t.orgId === orgId && 
      t.testId === testId && 
      t.version === version
    );
    
    if (testIndex === -1) {
      return {
        success: false,
        error: 'Test not found'
      };
    }
    
    // Actualizar el test
    tests[testIndex] = {
      ...tests[testIndex],
      ...updates,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };
    
    console.log('[TestDefinitionServiceDemo] Saving updated test:', tests[testIndex]);
    localStorage.setItem(DEMO_TESTS_KEY, JSON.stringify(tests));
    console.log('[TestDefinitionServiceDemo] Test saved to localStorage');
    
    return {
      success: true,
      test: tests[testIndex]
    };
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error updating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Activar un test
 */
export const activateTest = async (orgId, testId, version, userId) => {
  return updateTest(orgId, testId, version, { 
    status: 'active',
    publishedAt: new Date().toISOString(),
    publishedBy: userId
  }, userId);
};

/**
 * Archivar un test
 */
export const archiveTest = async (orgId, testId, version, userId) => {
  return updateTest(orgId, testId, version, { 
    status: 'archived',
    archivedAt: new Date().toISOString(),
    archivedBy: userId
  }, userId);
};

/**
 * Duplicar un test
 */
export const duplicateTest = async (orgId, testId, version, newVersion, userId) => {
  try {
    dlog('[TestDefinitionServiceDemo] Duplicating test:', { orgId, testId, version, newVersion });
    
    // Obtener el test original
    const result = await getTest(orgId, testId, version);
    if (!result.success) {
      return result;
    }
    
    const originalTest = result.test;
    
    // Crear nueva versión
    const newTest = {
      ...originalTest,
      version: newVersion,
      status: 'draft',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      publishedBy: null,
      archivedAt: null,
      archivedBy: null
    };
    
    return createTest(orgId, newTest, userId);
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error duplicating test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Eliminar un test
 */
export const deleteTest = async (orgId, testId, version, userId) => {
  try {
    dlog('[TestDefinitionServiceDemo] Deleting test:', { orgId, testId, version });
    
    const testsJson = localStorage.getItem(DEMO_TESTS_KEY);
    const tests = testsJson ? JSON.parse(testsJson) : [];
    
    const filteredTests = tests.filter(t => 
      !(t.orgId === orgId && t.testId === testId && t.version === version)
    );
    
    localStorage.setItem(DEMO_TESTS_KEY, JSON.stringify(filteredTests));
    
    return {
      success: true
    };
    
  } catch (error) {
    dwarn('[TestDefinitionServiceDemo] Error deleting test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
