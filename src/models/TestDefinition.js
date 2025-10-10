/**
 * TestDefinition - Modelo de datos para definiciones de tests
 */

// Estados del test
export const TEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// Tipos de preguntas
export const QUESTION_TYPES = {
  SCALE: 'scale',
  TEXT: 'text',
  MULTIPLE_CHOICE: 'multiple_choice',
  BOOLEAN: 'boolean'
};

// Métodos de scoring
export const SCORING_METHODS = {
  WEIGHTED_AVERAGE: 'weighted_average',
  SIMPLE_AVERAGE: 'simple_average',
  CUSTOM: 'custom'
};

/**
 * Crear una definición de test por defecto
 */
export const createDefaultTestDefinition = (orgId, testId, title) => {
  return {
    orgId,
    testId,
    version: 'v1',
    title,
    description: '',
    scale: {
      min: 1,
      max: 5,
      labels: {
        1: 'Muy bajo',
        2: 'Bajo',
        3: 'Medio',
        4: 'Alto',
        5: 'Muy alto'
      }
    },
    categories: [
      {
        id: 'leadership',
        name: 'Liderazgo',
        color: '#3b82f6',
        weight: 1
      },
      {
        id: 'communication',
        name: 'Comunicación',
        color: '#10b981',
        weight: 1
      },
      {
        id: 'teamwork',
        name: 'Trabajo en Equipo',
        color: '#f59e0b',
        weight: 1
      }
    ],
    questions: [
      {
        id: 'q_leadership_1',
        category: 'leadership',
        text: '¿Cómo evalúas tu liderazgo?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        help: 'Evalúa tu capacidad para liderar equipos'
      },
      {
        id: 'q_communication_1',
        category: 'communication',
        text: '¿Cómo evalúas tu comunicación?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        help: 'Evalúa tu habilidad para comunicarte efectivamente'
      },
      {
        id: 'q_teamwork_1',
        category: 'teamwork',
        text: '¿Cómo evalúas tu trabajo en equipo?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        help: 'Evalúa tu capacidad para colaborar en equipo'
      }
    ],
    scoring: {
      method: SCORING_METHODS.WEIGHTED_AVERAGE,
      rules: {}
    },
    status: TEST_STATUS.DRAFT,
    // Metadatos de auditoría
    createdAt: null, // Se llena con serverTimestamp()
    updatedAt: null,
    createdBy: null,
    updatedBy: null,
    publishedAt: null,
    publishedBy: null,
    archivedAt: null,
    archivedBy: null
  };
};

/**
 * Validar una definición de test
 */
export const validateTestDefinition = (testDefinition) => {
  const errors = [];

  // Validaciones básicas
  if (!testDefinition.testId?.trim()) {
    errors.push('Test ID es requerido');
  }

  if (!testDefinition.title?.trim()) {
    errors.push('Título es requerido');
  }

  if (!testDefinition.version?.trim()) {
    errors.push('Versión es requerida');
  }

  // Validar escala
  if (!testDefinition.scale) {
    errors.push('Escala es requerida');
  } else {
    if (typeof testDefinition.scale.min !== 'number' || testDefinition.scale.min < 1) {
      errors.push('Escala mínima debe ser >= 1');
    }
    if (typeof testDefinition.scale.max !== 'number' || testDefinition.scale.max <= testDefinition.scale.min) {
      errors.push('Escala máxima debe ser > mínima');
    }
  }

  // Validar categorías
  if (!testDefinition.categories || testDefinition.categories.length === 0) {
    errors.push('Al menos una categoría es requerida');
  } else {
    testDefinition.categories.forEach((category, index) => {
      if (!category.id?.trim()) {
        errors.push(`Categoría ${index + 1}: ID es requerido`);
      }
      if (!category.name?.trim()) {
        errors.push(`Categoría ${index + 1}: Nombre es requerido`);
      }
      if (typeof category.weight !== 'number' || category.weight <= 0) {
        errors.push(`Categoría ${index + 1}: Peso debe ser > 0`);
      }
    });
  }

  // Validar preguntas
  if (!testDefinition.questions || testDefinition.questions.length === 0) {
    errors.push('Al menos una pregunta es requerida');
  } else {
    testDefinition.questions.forEach((question, index) => {
      if (!question.id?.trim()) {
        errors.push(`Pregunta ${index + 1}: ID es requerido`);
      }
      if (!question.text?.trim()) {
        errors.push(`Pregunta ${index + 1}: Texto es requerido`);
      }
      if (!question.category?.trim()) {
        errors.push(`Pregunta ${index + 1}: Categoría es requerida`);
      }
      if (typeof question.weight !== 'number' || question.weight <= 0) {
        errors.push(`Pregunta ${index + 1}: Peso debe ser > 0`);
      }
      
      // Verificar que la categoría existe
      const categoryExists = testDefinition.categories.some(cat => cat.id === question.category);
      if (!categoryExists) {
        errors.push(`Pregunta ${index + 1}: Categoría "${question.category}" no existe`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generar ID único para documento de test
 */
export const generateTestDocId = (orgId, testId, version) => {
  return `${orgId}:${testId}:${version}`;
};

/**
 * Parsear ID de documento de test
 */
export const parseTestDocId = (docId) => {
  const parts = docId.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid test document ID format');
  }
  return {
    orgId: parts[0],
    testId: parts[1],
    version: parts[2]
  };
};