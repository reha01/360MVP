/**
 * Mensajes de negocio exactos para el sistema 360Â°
 * 
 * Textos listos para copiar al cÃ³digo UI
 */

// ========== UMBRALES DE ANONIMATO ==========

export const ANONYMITY_MESSAGES = {
  // Cuando umbral NO se cumple
  THRESHOLD_NOT_MET: {
    title: "Grupo oculto por privacidad",
    body: (raterType, actual, required) => 
      `No se muestran resultados de ${raterType} porque solo ${actual} ${actual === 1 ? 'persona completÃ³' : 'personas completaron'} la evaluaciÃ³n (mÃ­nimo requerido: ${required} para garantizar anonimato).`,
    example: "No se muestran resultados de Subordinados porque solo 2 personas completaron la evaluaciÃ³n (mÃ­nimo requerido: 3 para garantizar anonimato)."
  },
  
  // Cuando SÃ se cumple
  THRESHOLD_MET: {
    badge: (actual, required) => `âœ… AnÃ³nimo (${actual}/${required}+)`,
    help: "Este grupo cumple el umbral mÃ­nimo de anonimato. Las respuestas individuales no son rastreables."
  },
  
  // Warning al crear campaÃ±a
  THRESHOLD_WARNING: {
    title: "Posible riesgo de anonimato",
    body: (evaluateeName, raterType, current, required) =>
      `${evaluateeName} solo tiene ${current} ${raterType} asignados, pero el umbral de anonimato es ${required}. Si no todos completan, este grupo podrÃ­a quedar oculto en el reporte.`,
    action: "Considera asignar mÃ¡s evaluadores o reducir el umbral (no recomendado)."
  }
};

// ========== COMPATIBILIDAD DE VERSIONES ==========

export const VERSION_COMPATIBILITY_MESSAGES = {
  // Error al intentar promediar versiones diferentes
  INCOMPATIBLE_VERSIONS_ERROR: {
    title: "Versiones de test incompatibles",
    body: (testId, versions) =>
      `No se pueden promediar respuestas del test "${testId}" con versiones diferentes (${versions.join(', ')}). Las preguntas y escalas pueden diferir entre versiones.`,
    action: "Selecciona respuestas de una sola versiÃ³n o normalÃ­zalas manualmente."
  },
  
  // Warning en reporte cuando hay versiones mezcladas
  VERSION_MIX_WARNING: {
    icon: "âš ï¸",
    title: "Resultados de versiones diferentes (no directamente comparables)",
    body: (versions) =>
      `Este reporte incluye respuestas de diferentes versiones del test (${versions.join(', ')}). Los resultados han sido normalizados, pero pueden no ser directamente comparables debido a diferencias en preguntas o escalas.`,
    disclaimer: "Interpreta estos resultados con precauciÃ³n."
  },
  
  // Info en export
  VERSION_INFO_EXPORT: {
    note: (testId, version) =>
      `Test usado: ${testId}@${version}. Los resultados solo son comparables con evaluaciones que usen la misma versiÃ³n.`
  }
};

// ========== CUOTAS POR PLAN EXCEDIDAS ==========

export const QUOTA_EXCEEDED_MESSAGES = {
  // Email diario
  EMAILS_PER_DAY: {
    title: "LÃ­mite de emails diarios alcanzado",
    body: (current, limit, plan) =>
      `Has enviado ${current} emails hoy. Tu plan ${plan} tiene un lÃ­mite de ${limit} emails por dÃ­a.`,
    action: (nextPlan, nextLimit) =>
      `Para enviar mÃ¡s emails, considera actualizar a plan ${nextPlan} (${nextLimit} emails/dÃ­a).`,
    example: "Has enviado 50 emails hoy. Tu plan FREE tiene un lÃ­mite de 50 emails por dÃ­a. Para enviar mÃ¡s emails, considera actualizar a plan PROFESSIONAL (500 emails/dÃ­a)."
  },
  
  // CampaÃ±as activas
  CONCURRENT_CAMPAIGNS: {
    title: "LÃ­mite de campaÃ±as activas alcanzado",
    body: (current, limit, plan) =>
      `Tienes ${current} campaÃ±as activas. Tu plan ${plan} permite un mÃ¡ximo de ${limit}.`,
    action: "Cierra o archiva campaÃ±as existentes, o actualiza tu plan para gestionar mÃ¡s campaÃ±as simultÃ¡neas.",
    cta: "Ver planes"
  },
  
  // Exports diarios
  EXPORTS_PER_DAY: {
    title: "LÃ­mite de exportaciones diarias alcanzado",
    body: (current, limit, plan) =>
      `Has generado ${current} exportaciones hoy. Tu plan ${plan} tiene un lÃ­mite de ${limit} exportaciones por dÃ­a.`,
    action: "Intenta maÃ±ana o actualiza a un plan superior para mayor capacidad.",
    remaining: (limit, current) => `Quedan ${limit - current} exportaciones disponibles hoy.`
  },
  
  // Tokens por campaÃ±a
  TOKENS_PER_CAMPAIGN: {
    title: "LÃ­mite de evaluadores alcanzado",
    body: (current, limit, plan) =>
      `Esta campaÃ±a tiene ${current} evaluadores. Tu plan ${plan} permite un mÃ¡ximo de ${limit} tokens por campaÃ±a.`,
    action: "Reduce el nÃºmero de evaluadores o actualiza tu plan.",
    suggestion: "Considera dividir en mÃºltiples campaÃ±as mÃ¡s pequeÃ±as."
  },
  
  // GenÃ©rico con upgrade CTA
  QUOTA_UPGRADE_CTA: {
    title: "Actualiza tu plan",
    body: "Desbloquea mÃ¡s capacidad y funcionalidades premium.",
    features: (nextPlan) => [
      `âœ“ ${PLAN_LIMITS[nextPlan].maxEmailsPerDay} emails por dÃ­a`,
      `âœ“ ${PLAN_LIMITS[nextPlan].maxConcurrentCampaigns} campaÃ±as simultÃ¡neas`,
      `âœ“ ${PLAN_LIMITS[nextPlan].maxExportsPerDay} exportaciones diarias`,
      `âœ“ Reportes avanzados y benchmarking`
    ],
    cta: "Actualizar ahora"
  }
};

// ========== VALIDACIONES DE ESTRUCTURA ORGANIZACIONAL ==========

export const ORG_STRUCTURE_MESSAGES = {
  // Ciclo detectado en managers
  MANAGER_CYCLE_DETECTED: {
    title: "RelaciÃ³n circular detectada",
    body: (personA, personB) =>
      `No puedes asignar a ${personB} como manager de ${personA} porque ${personA} ya es manager (directo o indirecto) de ${personB}. Esto crearÃ­a una relaciÃ³n circular.`,
    action: "Verifica la estructura jerÃ¡rquica y corrige las asignaciones."
  },
  
  // Nombre duplicado
  AREA_NAME_DUPLICATE: {
    title: "Nombre de Ã¡rea duplicado",
    body: (name, parentArea) =>
      `Ya existe un Ã¡rea llamada "${name}" en ${parentArea || 'este nivel'}. Los nombres deben ser Ãºnicos dentro del mismo nivel.`,
    action: "Usa un nombre diferente o combina las Ã¡reas duplicadas."
  },
  
  // Profundidad mÃ¡xima
  MAX_DEPTH_EXCEEDED: {
    title: "Profundidad mÃ¡xima excedida",
    body: "Solo se permiten 3 niveles de jerarquÃ­a (OrganizaciÃ³n â†’ Ãrea â†’ Departamento).",
    action: "No puedes crear mÃ¡s subdivisiones. Reorganiza la estructura si necesitas mÃ¡s granularidad."
  },
  
  // Import CSV error row
  CSV_IMPORT_ERROR_ROW: {
    format: (row, errors) =>
      `Fila ${row}: ${errors.join(', ')}`,
    examples: [
      "Fila 5: Email invÃ¡lido (juan@ejemplo)",
      "Fila 12: Manager no encontrado (ID: MGR789)",
      "Fila 18: Ãrea inexistente (Ventas LATAM)"
    ]
  }
};

// ========== ESTADOS Y TRANSICIONES ==========

export const STATE_TRANSITION_MESSAGES = {
  // CampaÃ±a no puede activarse
  CAMPAIGN_CANNOT_ACTIVATE: {
    title: "No se puede activar la campaÃ±a",
    reasons: {
      NO_EVALUATEES: "No hay evaluados seleccionados.",
      NO_TESTS_ASSIGNED: "Algunos evaluados no tienen test asignado.",
      NO_EVALUATORS: "Algunos evaluados no tienen evaluadores asignados.",
      INVALID_DATES: "Las fechas de inicio/fin son invÃ¡lidas.",
      MISSING_EMAIL_TEMPLATE: "Falta configurar las plantillas de email."
    },
    action: "Completa la configuraciÃ³n antes de activar."
  },
  
  // Resultados no pueden liberarse
  RESULTS_CANNOT_RELEASE: {
    title: "Resultados no listos para liberaciÃ³n",
    body: (completionRate, minRequired) =>
      `Solo ${completionRate}% de evaluadores han completado (mÃ­nimo recomendado: ${minRequired}%). Liberar ahora podrÃ­a resultar en reportes incompletos.`,
    options: [
      "Esperar a mayor completitud",
      "Enviar recordatorios",
      "Liberar de todas formas (no recomendado)"
    ]
  }
};

// ========== LÃMITES DE PLANES ==========

export const PLAN_LIMITS = {
  FREE: {
    maxEmailsPerDay: 50,
    maxConcurrentCampaigns: 1,
    maxExportsPerDay: 5,
    maxTokensPerCampaign: 20
  },
  PROFESSIONAL: {
    maxEmailsPerDay: 500,
    maxConcurrentCampaigns: 5,
    maxExportsPerDay: 50,
    maxTokensPerCampaign: 100
  },
  ENTERPRISE: {
    maxEmailsPerDay: 2000,
    maxConcurrentCampaigns: 20,
    maxExportsPerDay: 200,
    maxTokensPerCampaign: 500
  }
};

// ========== EXPORT DEFAULT ==========

export default {
  ANONYMITY_MESSAGES,
  VERSION_COMPATIBILITY_MESSAGES,
  QUOTA_EXCEEDED_MESSAGES,
  ORG_STRUCTURE_MESSAGES,
  STATE_TRANSITION_MESSAGES,
  PLAN_LIMITS
};
