/**
 * Mensajes de negocio exactos para el sistema 360°
 * 
 * Textos listos para copiar al código UI
 */

// ========== UMBRALES DE ANONIMATO ==========

export const ANONYMITY_MESSAGES = {
  // Cuando umbral NO se cumple
  THRESHOLD_NOT_MET: {
    title: "Grupo oculto por privacidad",
    body: (raterType, actual, required) => 
      `No se muestran resultados de ${raterType} porque solo ${actual} ${actual === 1 ? 'persona completó' : 'personas completaron'} la evaluación (mínimo requerido: ${required} para garantizar anonimato).`,
    example: "No se muestran resultados de Subordinados porque solo 2 personas completaron la evaluación (mínimo requerido: 3 para garantizar anonimato)."
  },
  
  // Cuando SÍ se cumple
  THRESHOLD_MET: {
    badge: (actual, required) => `✅ Anónimo (${actual}/${required}+)`,
    help: "Este grupo cumple el umbral mínimo de anonimato. Las respuestas individuales no son rastreables."
  },
  
  // Warning al crear campaña
  THRESHOLD_WARNING: {
    title: "Posible riesgo de anonimato",
    body: (evaluateeName, raterType, current, required) =>
      `${evaluateeName} solo tiene ${current} ${raterType} asignados, pero el umbral de anonimato es ${required}. Si no todos completan, este grupo podría quedar oculto en el reporte.`,
    action: "Considera asignar más evaluadores o reducir el umbral (no recomendado)."
  }
};

// ========== COMPATIBILIDAD DE VERSIONES ==========

export const VERSION_COMPATIBILITY_MESSAGES = {
  // Error al intentar promediar versiones diferentes
  INCOMPATIBLE_VERSIONS_ERROR: {
    title: "Versiones de test incompatibles",
    body: (testId, versions) =>
      `No se pueden promediar respuestas del test "${testId}" con versiones diferentes (${versions.join(', ')}). Las preguntas y escalas pueden diferir entre versiones.`,
    action: "Selecciona respuestas de una sola versión o normalízalas manualmente."
  },
  
  // Warning en reporte cuando hay versiones mezcladas
  VERSION_MIX_WARNING: {
    icon: "⚠️",
    title: "Resultados de versiones diferentes (no directamente comparables)",
    body: (versions) =>
      `Este reporte incluye respuestas de diferentes versiones del test (${versions.join(', ')}). Los resultados han sido normalizados, pero pueden no ser directamente comparables debido a diferencias en preguntas o escalas.`,
    disclaimer: "Interpreta estos resultados con precaución."
  },
  
  // Info en export
  VERSION_INFO_EXPORT: {
    note: (testId, version) =>
      `Test usado: ${testId}@${version}. Los resultados solo son comparables con evaluaciones que usen la misma versión.`
  }
};

// ========== CUOTAS POR PLAN EXCEDIDAS ==========

export const QUOTA_EXCEEDED_MESSAGES = {
  // Email diario
  EMAILS_PER_DAY: {
    title: "Límite de emails diarios alcanzado",
    body: (current, limit, plan) =>
      `Has enviado ${current} emails hoy. Tu plan ${plan} tiene un límite de ${limit} emails por día.`,
    action: (nextPlan, nextLimit) =>
      `Para enviar más emails, considera actualizar a plan ${nextPlan} (${nextLimit} emails/día).`,
    example: "Has enviado 50 emails hoy. Tu plan FREE tiene un límite de 50 emails por día. Para enviar más emails, considera actualizar a plan PROFESSIONAL (500 emails/día)."
  },
  
  // Campañas activas
  CONCURRENT_CAMPAIGNS: {
    title: "Límite de campañas activas alcanzado",
    body: (current, limit, plan) =>
      `Tienes ${current} campañas activas. Tu plan ${plan} permite un máximo de ${limit}.`,
    action: "Cierra o archiva campañas existentes, o actualiza tu plan para gestionar más campañas simultáneas.",
    cta: "Ver planes"
  },
  
  // Exports diarios
  EXPORTS_PER_DAY: {
    title: "Límite de exportaciones diarias alcanzado",
    body: (current, limit, plan) =>
      `Has generado ${current} exportaciones hoy. Tu plan ${plan} tiene un límite de ${limit} exportaciones por día.`,
    action: "Intenta mañana o actualiza a un plan superior para mayor capacidad.",
    remaining: (limit, current) => `Quedan ${limit - current} exportaciones disponibles hoy.`
  },
  
  // Tokens por campaña
  TOKENS_PER_CAMPAIGN: {
    title: "Límite de evaluadores alcanzado",
    body: (current, limit, plan) =>
      `Esta campaña tiene ${current} evaluadores. Tu plan ${plan} permite un máximo de ${limit} tokens por campaña.`,
    action: "Reduce el número de evaluadores o actualiza tu plan.",
    suggestion: "Considera dividir en múltiples campañas más pequeñas."
  },
  
  // Genérico con upgrade CTA
  QUOTA_UPGRADE_CTA: {
    title: "Actualiza tu plan",
    body: "Desbloquea más capacidad y funcionalidades premium.",
    features: (nextPlan) => [
      `✓ ${PLAN_LIMITS[nextPlan].maxEmailsPerDay} emails por día`,
      `✓ ${PLAN_LIMITS[nextPlan].maxConcurrentCampaigns} campañas simultáneas`,
      `✓ ${PLAN_LIMITS[nextPlan].maxExportsPerDay} exportaciones diarias`,
      `✓ Reportes avanzados y benchmarking`
    ],
    cta: "Actualizar ahora"
  }
};

// ========== VALIDACIONES DE ESTRUCTURA ORGANIZACIONAL ==========

export const ORG_STRUCTURE_MESSAGES = {
  // Ciclo detectado en managers
  MANAGER_CYCLE_DETECTED: {
    title: "Relación circular detectada",
    body: (personA, personB) =>
      `No puedes asignar a ${personB} como manager de ${personA} porque ${personA} ya es manager (directo o indirecto) de ${personB}. Esto crearía una relación circular.`,
    action: "Verifica la estructura jerárquica y corrige las asignaciones."
  },
  
  // Nombre duplicado
  AREA_NAME_DUPLICATE: {
    title: "Nombre de área duplicado",
    body: (name, parentArea) =>
      `Ya existe un área llamada "${name}" en ${parentArea || 'este nivel'}. Los nombres deben ser únicos dentro del mismo nivel.`,
    action: "Usa un nombre diferente o combina las áreas duplicadas."
  },
  
  // Profundidad máxima
  MAX_DEPTH_EXCEEDED: {
    title: "Profundidad máxima excedida",
    body: "Solo se permiten 3 niveles de jerarquía (Organización → Área → Departamento).",
    action: "No puedes crear más subdivisiones. Reorganiza la estructura si necesitas más granularidad."
  },
  
  // Import CSV error row
  CSV_IMPORT_ERROR_ROW: {
    format: (row, errors) =>
      `Fila ${row}: ${errors.join(', ')}`,
    examples: [
      "Fila 5: Email inválido (juan@ejemplo)",
      "Fila 12: Manager no encontrado (ID: MGR789)",
      "Fila 18: Área inexistente (Ventas LATAM)"
    ]
  }
};

// ========== ESTADOS Y TRANSICIONES ==========

export const STATE_TRANSITION_MESSAGES = {
  // Campaña no puede activarse
  CAMPAIGN_CANNOT_ACTIVATE: {
    title: "No se puede activar la campaña",
    reasons: {
      NO_EVALUATEES: "No hay evaluados seleccionados.",
      NO_TESTS_ASSIGNED: "Algunos evaluados no tienen test asignado.",
      NO_EVALUATORS: "Algunos evaluados no tienen evaluadores asignados.",
      INVALID_DATES: "Las fechas de inicio/fin son inválidas.",
      MISSING_EMAIL_TEMPLATE: "Falta configurar las plantillas de email."
    },
    action: "Completa la configuración antes de activar."
  },
  
  // Resultados no pueden liberarse
  RESULTS_CANNOT_RELEASE: {
    title: "Resultados no listos para liberación",
    body: (completionRate, minRequired) =>
      `Solo ${completionRate}% de evaluadores han completado (mínimo recomendado: ${minRequired}%). Liberar ahora podría resultar en reportes incompletos.`,
    options: [
      "Esperar a mayor completitud",
      "Enviar recordatorios",
      "Liberar de todas formas (no recomendado)"
    ]
  }
};

// ========== LÍMITES DE PLANES ==========

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
