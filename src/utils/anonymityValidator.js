/**
 * Validador de Anonimato para Casos Borde
 * 
 * Implementa validación de umbrales de anonimato
 * para casos críticos de privacidad
 */

import { ANONYMITY_THRESHOLDS } from '../models/Evaluation360Aggregation';

/**
 * Validar umbrales de anonimato para casos borde
 */
export const validateAnonymityThresholds = (responses, thresholds = ANONYMITY_THRESHOLDS) => {
  const evaluatorTypeCounts = {};
  
  // Contar evaluadores por tipo
  responses.forEach(response => {
    const type = response.evaluatorType;
    evaluatorTypeCounts[type] = (evaluatorTypeCounts[type] || 0) + 1;
  });
  
  const anonymityStatus = {};
  let allThresholdsMet = true;
  const criticalViolations = [];
  
  // Verificar cada umbral
  Object.entries(thresholds).forEach(([type, threshold]) => {
    const count = evaluatorTypeCounts[type] || 0;
    const met = count >= threshold;
    
    anonymityStatus[type] = {
      required: threshold,
      actual: count,
      met,
      percentage: count > 0 ? Math.round((count / threshold) * 100) : 0,
      critical: count > 0 && count < threshold // Caso borde crítico
    };
    
    if (!met) {
      allThresholdsMet = false;
      
      // Identificar casos borde críticos
      if (count > 0 && count < threshold) {
        criticalViolations.push({
          type,
          actual: count,
          required: threshold,
          severity: count === 1 ? 'critical' : 'warning'
        });
      }
    }
  });
  
  return {
    isValid: allThresholdsMet,
    status: anonymityStatus,
    totalEvaluators: responses.length,
    criticalViolations,
    shouldHideData: criticalViolations.some(v => v.severity === 'critical')
  };
};

/**
 * Casos borde específicos para QA
 */
export const getAnonymityTestCases = () => {
  return [
    {
      name: 'Caso Borde 1: Pares=1 (Crítico)',
      description: 'Solo 1 par evaluando - debe ocultar datos',
      responses: [
        { evaluatorType: 'peer', evaluatorId: 'peer1' },
        { evaluatorType: 'manager', evaluatorId: 'manager1' },
        { evaluatorType: 'subordinate', evaluatorId: 'sub1' },
        { evaluatorType: 'subordinate', evaluatorId: 'sub2' }
      ],
      expectedResult: {
        shouldHideData: true,
        criticalViolations: 1,
        hiddenTypes: ['peer']
      }
    },
    {
      name: 'Caso Borde 2: Directos=2 (Advertencia)',
      description: 'Solo 2 subordinados - debe mostrar advertencia',
      responses: [
        { evaluatorType: 'peer', evaluatorId: 'peer1' },
        { evaluatorType: 'peer', evaluatorId: 'peer2' },
        { evaluatorType: 'peer', evaluatorId: 'peer3' },
        { evaluatorType: 'subordinate', evaluatorId: 'sub1' },
        { evaluatorType: 'subordinate', evaluatorId: 'sub2' }
      ],
      expectedResult: {
        shouldHideData: false,
        criticalViolations: 0,
        warnings: 1
      }
    },
    {
      name: 'Caso Borde 3: Mezcla de Versiones',
      description: 'Evaluaciones con diferentes versiones de test',
      responses: [
        { evaluatorType: 'peer', evaluatorId: 'peer1', testVersion: '1.0' },
        { evaluatorType: 'peer', evaluatorId: 'peer2', testVersion: '1.1' },
        { evaluatorType: 'peer', evaluatorId: 'peer3', testVersion: '1.0' },
        { evaluatorType: 'manager', evaluatorId: 'manager1', testVersion: '1.1' }
      ],
      expectedResult: {
        shouldHideData: false,
        versionMismatch: true,
        compatibilityWarning: true
      }
    }
  ];
};

/**
 * Ocultar datos sensibles en reportes
 */
export const hideSensitiveData = (data, anonymityStatus) => {
  const hiddenData = { ...data };
  
  // Ocultar scores por tipo si no cumple umbral
  Object.entries(anonymityStatus).forEach(([type, status]) => {
    if (!status.met && status.actual > 0) {
      // Ocultar datos de este tipo de evaluador
      if (hiddenData.scoresByType && hiddenData.scoresByType[type]) {
        hiddenData.scoresByType[type] = {
          ...hiddenData.scoresByType[type],
          score: null,
          data: 'OCULTO - Umbral de anonimato no cumplido'
        };
      }
      
      // Ocultar respuestas individuales
      if (hiddenData.responses) {
        hiddenData.responses = hiddenData.responses.map(response => {
          if (response.evaluatorType === type) {
            return {
              ...response,
              answers: 'OCULTO',
              evaluatorId: 'ANONIMO'
            };
          }
          return response;
        });
      }
    }
  });
  
  return hiddenData;
};

/**
 * Generar mensaje de anonimato
 */
export const generateAnonymityMessage = (anonymityStatus) => {
  const violations = Object.entries(anonymityStatus)
    .filter(([type, status]) => !status.met && status.actual > 0);
  
  if (violations.length === 0) {
    return null;
  }
  
  const messages = violations.map(([type, status]) => {
    const typeLabel = {
      peer: 'pares',
      subordinate: 'subordinados',
      manager: 'superiores',
      external: 'externos'
    }[type] || type;
    
    return `Solo ${status.actual} ${typeLabel} evaluaron (mínimo requerido: ${status.required}). Los datos de este tipo de evaluador han sido ocultados para proteger la privacidad.`;
  });
  
  return {
    type: 'warning',
    title: 'Datos Ocultos por Privacidad',
    messages,
    action: 'Los resultados mostrados excluyen los datos de evaluadores que no cumplen los umbrales de anonimato requeridos.'
  };
};

/**
 * Validar compatibilidad de versiones
 */
export const validateVersionCompatibility = (responses) => {
  const versions = [...new Set(responses.map(r => r.testVersion))];
  
  if (versions.length > 1) {
    return {
      compatible: false,
      versions,
      warning: 'Se detectaron evaluaciones con diferentes versiones del test. Los resultados pueden no ser directamente comparables.',
      recommendation: 'Considere regenerar las evaluaciones con la misma versión del test para mayor precisión.'
    };
  }
  
  return {
    compatible: true,
    version: versions[0]
  };
};

export default {
  validateAnonymityThresholds,
  getAnonymityTestCases,
  hideSensitiveData,
  generateAnonymityMessage,
  validateVersionCompatibility
};
