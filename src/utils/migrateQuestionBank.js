/**
 * Migración de questionBank.js a TestDefinition
 * 
 * Convierte el banco de preguntas hardcodeado en leadership@v1
 * como TestDefinition administrable.
 */

import {
  QUESTION_BANK,
  LEADERSHIP_CATEGORIES,
  LIKERT_SCALE
} from '../constants/questionBank';
import { createDefaultTestDefinition, TEST_STATUS, QUESTION_TYPES } from '../models/TestDefinition';
import { createTest } from '../services/testDefinitionService';
import { dlog, dwarn } from './debug';

/**
 * Convertir questionBank a TestDefinition
 */
const convertQuestionBankToTestDefinition = (orgId, userId) => {
  dlog('[Migration] Converting questionBank to TestDefinition');

  // Convertir categorías
  const categories = Object.values(LEADERSHIP_CATEGORIES).map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    weight: 1 // Por defecto, todas las categorías tienen el mismo peso
  }));

  // Convertir preguntas
  const questions = QUESTION_BANK.map((q, index) => ({
    id: q.id,
    categoryId: q.category,
    text: q.text,
    weight: q.weight || 1,
    type: 'likert', // Todas son Likert en el banco original
    help: null,
    reverse: q.reverse || false,
    order: index
  }));

  // Convertir escala Likert
  const scale = {
    type: 'likert',
    min: 1,
    max: 5,
    labels: LIKERT_SCALE.map(item => ({
      value: item.value,
      label: item.label,
      description: item.description
    }))
  };

  // Crear TestDefinition
  const testDef = {
    ...createDefaultTestDefinition(orgId, 'leadership', 'Evaluación de Liderazgo'),
    title: 'Evaluación de Liderazgo 360°',
    description: 'Evaluación integral de competencias de liderazgo en 8 dimensiones clave',
    scale,
    categories,
    questions,
    scoring: {
      method: 'weighted_average',
      rules: {
        categoryWeights: {},
        competencyLevels: [
          { min: 0, max: 1.5, level: 'beginner', label: 'Inicial - Necesita desarrollo significativo' },
          { min: 1.5, max: 2.5, level: 'developing', label: 'En Desarrollo - Requiere mejora' },
          { min: 2.5, max: 3.5, level: 'intermediate', label: 'Intermedio - Competente con oportunidades' },
          { min: 3.5, max: 4.5, level: 'advanced', label: 'Avanzado - Desempeño sólido' },
          { min: 4.5, max: 5.0, level: 'expert', label: 'Experto - Excelencia consistente' }
        ]
      }
    },
    raterModes: ['self'], // Solo auto-evaluación por ahora
    aggregation: null, // Para futuro 360
    createdBy: userId
  };

  dlog('[Migration] TestDefinition created:', testDef);

  return testDef;
};

/**
 * Migrar questionBank para una organización
 */
const migrateOrgQuestionBank = async (orgId, userId) => {
  try {
    dlog('[Migration] Starting migration for org:', orgId);

    // Convertir a TestDefinition
    const testDef = convertQuestionBankToTestDefinition(orgId, userId);

    // Crear en Firestore
    const result = await createTest(orgId, testDef, userId);

    if (!result.success) {
      dwarn('[Migration] Failed to create test:', result.error);
      return result;
    }

    dlog('[Migration] Migration successful:', result.testDefinitionId);

    return {
      success: true,
      testDefinitionId: result.testDefinitionId,
      message: 'questionBank migrado exitosamente a leadership@v1'
    };

  } catch (error) {
    dwarn('[Migration] Migration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar si ya existe leadership@v1 para una org
 */
const checkMigrationStatus = async (orgId) => {
  try {
    const { getTestByVersion } = await import('../services/testDefinitionService');
    const result = await getTestByVersion(orgId, 'leadership', 'v1');
    
    return {
      migrated: result.success && result.test !== null,
      test: result.test
    };
  } catch (error) {
    dwarn('[Migration] Error checking status:', error);
    return {
      migrated: false,
      test: null
    };
  }
};

/**
 * Auto-migración al iniciar si es necesario
 */
const autoMigrateIfNeeded = async (orgId, userId) => {
  try {
    dlog('[Migration] Checking if migration needed for org:', orgId);

    const status = await checkMigrationStatus(orgId);

    if (status.migrated) {
      dlog('[Migration] Already migrated, skipping');
      return {
        success: true,
        alreadyMigrated: true,
        test: status.test
      };
    }

    dlog('[Migration] Not migrated yet, starting auto-migration');
    const result = await migrateOrgQuestionBank(orgId, userId);

    return {
      ...result,
      alreadyMigrated: false
    };

  } catch (error) {
    dwarn('[Migration] Auto-migration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Alias para compatibilidad
export const migrateQuestionBankToFirestore = migrateOrgQuestionBank;

// Exportar funciones individuales
export {
  convertQuestionBankToTestDefinition,
  migrateOrgQuestionBank,
  checkMigrationStatus,
  autoMigrateIfNeeded
};

