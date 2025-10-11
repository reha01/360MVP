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

// Operadores condicionales
export const CONDITIONAL_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than'
};

// Acciones condicionales
export const CONDITIONAL_ACTIONS = {
  EXCLUDE_FROM_SCORING: 'exclude_from_scoring',
  MARK_AS_NOT_APPLICABLE: 'mark_as_not_applicable'
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
        description: '',
        color: '#3b82f6',
        weight: 1,
        isConditional: false,
        conditionalRule: null,
        subdimensions: [
          {
            id: 'leadership_vision',
            name: 'Visión Estratégica',
            description: '',
            weight: 1
          }
        ]
      },
      {
        id: 'communication',
        name: 'Comunicación',
        description: '',
        color: '#10b981',
        weight: 1,
        isConditional: false,
        conditionalRule: null,
        subdimensions: [
          {
            id: 'communication_verbal',
            name: 'Comunicación Verbal',
            description: '',
            weight: 1
          }
        ]
      },
      {
        id: 'teamwork',
        name: 'Trabajo en Equipo',
        description: '',
        color: '#f59e0b',
        weight: 1,
        isConditional: false,
        conditionalRule: null,
        subdimensions: [
          {
            id: 'teamwork_collaboration',
            name: 'Colaboración',
            description: '',
            weight: 1
          }
        ]
      }
    ],
    questions: [
      {
        id: 'P_CAT1_SUB1_Q1',
        category: 'leadership',
        subdimension: 'leadership_vision',
        text: '¿Cómo evalúas tu liderazgo?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        isNegative: false,
        help: 'Evalúa tu capacidad para liderar equipos'
      },
      {
        id: 'P_CAT2_SUB1_Q1',
        category: 'communication',
        subdimension: 'communication_verbal',
        text: '¿Cómo evalúas tu comunicación?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        isNegative: false,
        help: 'Evalúa tu habilidad para comunicarte efectivamente'
      },
      {
        id: 'P_CAT3_SUB1_Q1',
        category: 'teamwork',
        subdimension: 'teamwork_collaboration',
        text: '¿Cómo evalúas tu trabajo en equipo?',
        weight: 1,
        type: QUESTION_TYPES.SCALE,
        isNegative: false,
        help: 'Evalúa tu capacidad para colaborar en equipo'
      }
    ],
    conditionalRules: [],
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
      
      // Validar subdimensiones
      if (category.subdimensions && category.subdimensions.length > 0) {
        category.subdimensions.forEach((subdim, subIndex) => {
          if (!subdim.id?.trim()) {
            errors.push(`Categoría ${index + 1}, Subdimensión ${subIndex + 1}: ID es requerido`);
          }
          if (!subdim.name?.trim()) {
            errors.push(`Categoría ${index + 1}, Subdimensión ${subIndex + 1}: Nombre es requerido`);
          }
          if (typeof subdim.weight !== 'number' || subdim.weight <= 0) {
            errors.push(`Categoría ${index + 1}, Subdimensión ${subIndex + 1}: Peso debe ser > 0`);
          }
        });
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
      const category = testDefinition.categories.find(cat => cat.id === question.category);
      if (!category) {
        errors.push(`Pregunta ${index + 1}: Categoría "${question.category}" no existe`);
      } else if (question.subdimension) {
        // Verificar que la subdimensión existe dentro de la categoría
        const subdimensionExists = category.subdimensions?.some(sub => sub.id === question.subdimension);
        if (!subdimensionExists) {
          errors.push(`Pregunta ${index + 1}: Subdimensión "${question.subdimension}" no existe en categoría "${question.category}"`);
        }
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

/**
 * Generar ID único para pregunta
 * Formato: P_CAT{catIndex}_SUB{subIndex}_Q{qIndex}
 */
export const generateQuestionId = (categoryIndex, subdimensionIndex, questionIndex) => {
  const catNum = String(categoryIndex + 1).padStart(1, '0');
  const subNum = String(subdimensionIndex + 1).padStart(1, '0');
  const qNum = String(questionIndex + 1).padStart(1, '0');
  return `P_CAT${catNum}_SUB${subNum}_Q${qNum}`;
};

/**
 * Regenerar todos los IDs de preguntas en un test
 * (Solo usar al crear tests, no al editar)
 */
export const regenerateQuestionIds = (testDefinition) => {
  const updatedQuestions = [];
  
  testDefinition.categories.forEach((category, catIndex) => {
    const subdimensions = category.subdimensions || [];
    
    subdimensions.forEach((subdimension, subIndex) => {
      // Encontrar todas las preguntas de esta subdimensión
      const subdimQuestions = testDefinition.questions.filter(
        q => q.category === category.id && q.subdimension === subdimension.id
      );
      
      subdimQuestions.forEach((question, qIndex) => {
        updatedQuestions.push({
          ...question,
          id: generateQuestionId(catIndex, subIndex, qIndex)
        });
      });
    });
  });
  
  return {
    ...testDefinition,
    questions: updatedQuestions
  };
};

/**
 * Crear una nueva subdimensión por defecto
 */
export const createDefaultSubdimension = (categoryId, index) => {
  return {
    id: `${categoryId}_sub${index + 1}`,
    name: `Subdimensión ${index + 1}`,
    description: '',
    weight: 1
  };
};

/**
 * Crear una nueva regla condicional por defecto
 */
export const createDefaultConditionalRule = (categoryId) => {
  return {
    id: `rule_${Date.now()}`,
    categoryId,
    condition: {
      questionId: '',
      operator: CONDITIONAL_OPERATORS.EQUALS,
      value: null
    },
    action: CONDITIONAL_ACTIONS.EXCLUDE_FROM_SCORING
  };
};