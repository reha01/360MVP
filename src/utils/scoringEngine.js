/**
 * Motor de Scoring Avanzado
 * 
 * Soporta:
 * - Subdimensiones con pesos
 * - Preguntas negativas (reverse scoring)
 * - Reglas condicionales (excluir categorías)
 * - Pesos por pregunta (1-3)
 */

/**
 * Evaluar si una regla condicional se cumple
 */
export const evaluateConditionalRule = (rule, answers) => {
  const { questionId, operator, value } = rule.condition;
  const answer = answers[questionId];
  
  if (answer === undefined || answer === null) {
    return false;
  }
  
  switch (operator) {
    case 'equals':
      // Comparar tanto como string como número
      return answer == value || String(answer) === String(value);
    case 'not_equals':
      return answer != value && String(answer) !== String(value);
    case 'greater_than':
      return Number(answer) > Number(value);
    case 'less_than':
      return Number(answer) < Number(value);
    default:
      return false;
  }
};

/**
 * Evaluar si una regla condicional de categoría se cumple
 */
export const evaluateCategoryConditionalRule = (conditionalRule, answers) => {
  if (!conditionalRule || !conditionalRule.condition) {
    return false;
  }
  
  return evaluateConditionalRule(conditionalRule, answers);
};

/**
 * Obtener categorías excluidas por reglas condicionales
 */
export const getExcludedCategories = (testDefinition, answers) => {
  const excludedCategories = new Set();
  
  // Evaluar reglas condicionales definidas en cada categoría
  testDefinition.categories.forEach(category => {
    if (category.isConditional && category.conditionalRule) {
      if (evaluateCategoryConditionalRule(category.conditionalRule, answers)) {
        excludedCategories.add(category.id);
      }
    }
  });
  
  // También evaluar reglas globales (legacy support)
  if (testDefinition.conditionalRules && testDefinition.conditionalRules.length > 0) {
    testDefinition.conditionalRules.forEach(rule => {
      if (rule.action === 'exclude_from_scoring' && evaluateConditionalRule(rule, answers)) {
        excludedCategories.add(rule.categoryId);
      }
    });
  }
  
  return excludedCategories;
};

/**
 * Normalizar respuesta considerando si la pregunta es negativa
 */
export const normalizeAnswer = (answer, isNegative, scale) => {
  if (answer === null || answer === undefined) {
    return null;
  }
  
  const numAnswer = Number(answer);
  
  if (isNegative) {
    // Invertir la escala: 1→5, 2→4, 3→3, 4→2, 5→1
    const { min, max } = scale;
    return (max + min) - numAnswer;
  }
  
  return numAnswer;
};

/**
 * Calcular score de una subdimensión
 */
export const calculateSubdimensionScore = (subdimension, questions, answers, scale) => {
  // Filtrar preguntas de esta subdimensión
  const subdimQuestions = questions.filter(
    q => q.subdimension === subdimension.id
  );
  
  if (subdimQuestions.length === 0) {
    return {
      score: 0,
      weightedScore: 0,
      totalWeight: 0,
      answeredQuestions: 0,
      totalQuestions: 0
    };
  }
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let answeredQuestions = 0;
  
  subdimQuestions.forEach(question => {
    const answer = answers[question.id];
    
    if (answer !== null && answer !== undefined) {
      // Solo procesar respuestas numéricas para el scoring
      const numericAnswer = Number(answer);
      if (!isNaN(numericAnswer)) {
        const normalizedAnswer = normalizeAnswer(numericAnswer, question.isNegative, scale);
        const questionWeight = question.weight || 1;
        
        totalWeightedScore += normalizedAnswer * questionWeight;
        totalWeight += questionWeight;
      }
      answeredQuestions++;
    }
  });
  
  const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  return {
    score,
    weightedScore: score * (subdimension.weight || 1),
    totalWeight: subdimension.weight || 1,
    answeredQuestions,
    totalQuestions: subdimQuestions.length
  };
};

/**
 * Calcular score de una categoría (promedio de subdimensiones)
 */
export const calculateCategoryScore = (category, questions, answers, scale, isExcluded = false) => {
  if (isExcluded) {
    // Obtener información de la regla condicional que causó la exclusión
    let exclusionReason = 'Excluida por regla condicional';
    if (category.conditionalRule && category.conditionalRule.condition) {
      const { questionId, operator, value } = category.conditionalRule.condition;
      const question = questions.find(q => q.id === questionId);
      const questionText = question ? question.text : questionId;
      
      exclusionReason = `Excluida: "${questionText}" ${operator === 'equals' ? 'es igual a' : operator === 'not_equals' ? 'es diferente de' : operator === 'greater_than' ? 'es mayor que' : 'es menor que'} "${value}"`;
    }
    
    return {
      score: null,
      weightedScore: 0,
      totalWeight: 0,
      answeredQuestions: 0,
      totalQuestions: 0,
      subdimensionScores: [],
      isExcluded: true,
      exclusionReason
    };
  }
  
  const subdimensions = category.subdimensions || [];
  
  if (subdimensions.length === 0) {
    return {
      score: 0,
      weightedScore: 0,
      totalWeight: 0,
      answeredQuestions: 0,
      totalQuestions: 0,
      subdimensionScores: [],
      isExcluded: false
    };
  }
  
  const subdimensionScores = subdimensions.map(subdim => {
    const subdimScore = calculateSubdimensionScore(subdim, questions, answers, scale);
    return {
      subdimensionId: subdim.id,
      subdimensionName: subdim.name,
      ...subdimScore
    };
  });
  
  // Calcular score de categoría como promedio ponderado de subdimensiones
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalAnsweredQuestions = 0;
  let totalQuestions = 0;
  
  subdimensionScores.forEach(subScore => {
    totalWeightedScore += subScore.weightedScore;
    totalWeight += subScore.totalWeight;
    totalAnsweredQuestions += subScore.answeredQuestions;
    totalQuestions += subScore.totalQuestions;
  });
  
  const categoryScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  return {
    score: categoryScore,
    weightedScore: categoryScore * (category.weight || 1),
    totalWeight: category.weight || 1,
    answeredQuestions: totalAnsweredQuestions,
    totalQuestions,
    subdimensionScores,
    isExcluded: false
  };
};

/**
 * Calcular score total del test
 */
export const calculateTestScore = (testDefinition, answers) => {
  const { categories, questions, scale } = testDefinition;
  
  // Obtener categorías excluidas por reglas condicionales
  const excludedCategories = getExcludedCategories(testDefinition, answers);
  
  // Calcular scores por categoría
  const categoryScores = categories.map(category => {
    const isExcluded = excludedCategories.has(category.id);
    const categoryScore = calculateCategoryScore(category, questions, answers, scale, isExcluded);
    
    return {
      categoryId: category.id,
      categoryName: category.name,
      ...categoryScore
    };
  });
  
  // Calcular score total como promedio ponderado de categorías no excluidas
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalAnsweredQuestions = 0;
  let totalQuestions = 0;
  
  categoryScores.forEach(catScore => {
    if (!catScore.isExcluded) {
      totalWeightedScore += catScore.weightedScore;
      totalWeight += catScore.totalWeight;
      totalAnsweredQuestions += catScore.answeredQuestions;
      totalQuestions += catScore.totalQuestions;
    }
  });
  
  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const completionPercentage = totalQuestions > 0 
    ? (totalAnsweredQuestions / totalQuestions) * 100 
    : 0;
  
  // Obtener información sobre reglas condicionales activas
  const activeConditionalRules = getActiveConditionalRules(testDefinition, answers);
  
  return {
    overallScore,
    completionPercentage,
    categoryScores,
    totalAnsweredQuestions,
    totalQuestions,
    excludedCategories: Array.from(excludedCategories),
    activeConditionalRules,
    conditionalRulesApplied: activeConditionalRules.length > 0
  };
};

/**
 * Obtener información detallada sobre reglas condicionales activas
 */
export const getActiveConditionalRules = (testDefinition, answers) => {
  const activeRules = [];
  
  testDefinition.categories.forEach(category => {
    if (category.isConditional && category.conditionalRule) {
      const isActive = evaluateCategoryConditionalRule(category.conditionalRule, answers);
      
      if (isActive) {
        const { questionId, operator, value } = category.conditionalRule.condition;
        const question = testDefinition.questions.find(q => q.id === questionId);
        const questionText = question ? question.text : questionId;
        
        activeRules.push({
          categoryId: category.id,
          categoryName: category.name,
          questionId,
          questionText,
          operator,
          value,
          action: category.conditionalRule.action,
          userAnswer: answers[questionId]
        });
      }
    }
  });
  
  return activeRules;
};

/**
 * Validar que todas las preguntas han sido respondidas
 */
export const validateAllQuestionsAnswered = (testDefinition, answers) => {
  const { questions } = testDefinition;
  const excludedCategories = getExcludedCategories(testDefinition, answers);
  
  const unansweredQuestions = questions.filter(q => {
    // Ignorar preguntas de categorías excluidas
    if (excludedCategories.has(q.category)) {
      return false;
    }
    
    const answer = answers[q.id];
    return answer === null || answer === undefined;
  });
  
  return {
    isComplete: unansweredQuestions.length === 0,
    unansweredQuestions,
    totalQuestions: questions.filter(q => !excludedCategories.has(q.category)).length,
    excludedQuestionsCount: questions.filter(q => excludedCategories.has(q.category)).length
  };
};

