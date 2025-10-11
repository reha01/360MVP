/**
 * Script de prueba para reglas condicionales
 * 
 * Este script crea un test de ejemplo con reglas condicionales
 * y demuestra cómo funciona el motor de scoring.
 */

import { calculateTestScore, getActiveConditionalRules } from './scoringEngine.js';

/**
 * Crear un test de ejemplo con reglas condicionales
 */
export const createExampleTestWithConditionals = () => {
  return {
    testId: 'example_conditional_test',
    version: 'v1',
    title: 'Test de Ejemplo con Reglas Condicionales',
    description: 'Test para demostrar el funcionamiento de reglas condicionales',
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
        description: 'Capacidades de liderazgo',
        color: '#3b82f6',
        weight: 1,
        isConditional: false,
        conditionalRule: null,
        subdimensions: [
          {
            id: 'vision',
            name: 'Visión Estratégica',
            description: 'Capacidad de visión a largo plazo',
            weight: 1
          }
        ]
      },
      {
        id: 'team_management',
        name: 'Gestión de Equipos',
        description: 'Habilidades para gestionar equipos',
        color: '#10b981',
        weight: 1,
        isConditional: true, // ← CATEGORÍA CONDICIONAL
        conditionalRule: {
          condition: {
            questionId: 'P_CAT2_SUB1_Q1', // ¿Tienes un equipo a tu cargo?
            operator: 'equals',
            value: 'No'
          },
          action: 'exclude_from_scoring'
        },
        subdimensions: [
          {
            id: 'team_leadership',
            name: 'Liderazgo de Equipo',
            description: 'Habilidades para liderar equipos',
            weight: 1
          }
        ]
      },
      {
        id: 'communication',
        name: 'Comunicación',
        description: 'Habilidades de comunicación',
        color: '#f59e0b',
        weight: 1,
        isConditional: false,
        conditionalRule: null,
        subdimensions: [
          {
            id: 'verbal_communication',
            name: 'Comunicación Verbal',
            description: 'Habilidades de comunicación hablada',
            weight: 1
          }
        ]
      }
    ],
    questions: [
      {
        id: 'P_CAT1_SUB1_Q1',
        category: 'leadership',
        subdimension: 'vision',
        text: '¿Cómo evalúas tu capacidad de visión estratégica?',
        weight: 1,
        type: 'scale',
        isNegative: false
      },
      {
        id: 'P_CAT2_SUB1_Q1',
        category: 'team_management',
        subdimension: 'team_leadership',
        text: '¿Tienes un equipo a tu cargo?',
        weight: 1,
        type: 'scale',
        isNegative: false
      },
      {
        id: 'P_CAT2_SUB1_Q2',
        category: 'team_management',
        subdimension: 'team_leadership',
        text: '¿Cómo evalúas tu capacidad para motivar a tu equipo?',
        weight: 2,
        type: 'scale',
        isNegative: false
      },
      {
        id: 'P_CAT3_SUB1_Q1',
        category: 'communication',
        subdimension: 'verbal_communication',
        text: '¿Cómo evalúas tu capacidad de comunicación verbal?',
        weight: 1,
        type: 'scale',
        isNegative: false
      }
    ]
  };
};

/**
 * Casos de prueba para reglas condicionales
 */
export const testCases = {
  // Caso 1: Usuario SIN equipo (debería excluir categoría "Gestión de Equipos")
  withoutTeam: {
    P_CAT1_SUB1_Q1: 4, // Liderazgo: 4
    P_CAT2_SUB1_Q1: 'No', // ¿Tienes equipo?: No
    P_CAT2_SUB1_Q2: 5, // Motivar equipo: 5 (NO debería contar)
    P_CAT3_SUB1_Q1: 3  // Comunicación: 3
  },
  
  // Caso 2: Usuario CON equipo (todas las categorías deberían contar)
  withTeam: {
    P_CAT1_SUB1_Q1: 4, // Liderazgo: 4
    P_CAT2_SUB1_Q1: 'Sí', // ¿Tienes equipo?: Sí
    P_CAT2_SUB1_Q2: 4, // Motivar equipo: 4 (SÍ debería contar)
    P_CAT3_SUB1_Q1: 3  // Comunicación: 3
  }
};

/**
 * Ejecutar pruebas de reglas condicionales
 */
export const runConditionalTests = () => {
  const testDefinition = createExampleTestWithConditionals();
  
  console.log('🧪 PRUEBAS DE REGLAS CONDICIONALES');
  console.log('=====================================\n');
  
  Object.entries(testCases).forEach(([caseName, answers]) => {
    console.log(`📋 CASO: ${caseName.toUpperCase()}`);
    console.log('Respuestas:', answers);
    
    // Calcular score
    const results = calculateTestScore(testDefinition, answers);
    
    console.log('\n📊 RESULTADOS:');
    console.log(`Score General: ${results.overallScore.toFixed(2)}`);
    console.log(`Completitud: ${results.completionPercentage.toFixed(1)}%`);
    console.log(`Categorías Excluidas: ${results.excludedCategories.length}`);
    
    if (results.excludedCategories.length > 0) {
      console.log(`Categorías excluidas: ${results.excludedCategories.join(', ')}`);
    }
    
    // Mostrar scores por categoría
    console.log('\n📈 SCORES POR CATEGORÍA:');
    results.categoryScores.forEach(catScore => {
      if (catScore.isExcluded) {
        console.log(`  ❌ ${catScore.categoryName}: EXCLUIDA - ${catScore.exclusionReason}`);
      } else {
        console.log(`  ✅ ${catScore.categoryName}: ${catScore.score?.toFixed(2) || 'N/A'} (${catScore.answeredQuestions}/${catScore.totalQuestions} preguntas)`);
      }
    });
    
    // Mostrar reglas activas
    if (results.conditionalRulesApplied) {
      console.log('\n⚡ REGLAS CONDICIONALES ACTIVAS:');
      results.activeConditionalRules.forEach(rule => {
        console.log(`  🔄 ${rule.categoryName}: "${rule.questionText}" ${rule.operator === 'equals' ? 'es igual a' : 'no es igual a'} "${rule.value}" (respuesta: ${rule.userAnswer})`);
      });
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  });
  
  return { testDefinition, testCases };
};

// Ejecutar las pruebas si se llama directamente
if (typeof window === 'undefined') {
  runConditionalTests();
}
