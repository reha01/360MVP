/**
 * Modelo de Reporte 360Â°
 * 
 * Define la estructura y validaciÃ³n de reportes 360Â°
 */

// ========== CONSTANTS ==========

export const REPORT_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const REPORT_TYPES = {
  INDIVIDUAL: 'individual',
  TEAM: 'team',
  ORGANIZATIONAL: 'organizational'
};

export const REPORT_SECTIONS = {
  EXECUTIVE_SUMMARY: 'executive_summary',
  SCORES_BY_TYPE: 'scores_by_type',
  CATEGORY_ANALYSIS: 'category_analysis',
  GAP_ANALYSIS: 'gap_analysis',
  RECOMMENDATIONS: 'recommendations',
  BENCHMARKS: 'benchmarks'
};

export const VISUALIZATION_TYPES = {
  RADAR_CHART: 'radar_chart',
  BAR_CHART: 'bar_chart',
  LINE_CHART: 'line_chart',
  SCATTER_PLOT: 'scatter_plot',
  HEATMAP: 'heatmap',
  DONUT_CHART: 'donut_chart'
};

// ========== DATA MODELS ==========

/**
 * Modelo de Reporte 360Â°
 */
export const createReport360Model = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    reportId: data.reportId || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    campaignId: data.campaignId,
    session360Id: data.session360Id,
    aggregationId: data.aggregationId,
    evaluateeId: data.evaluateeId,
    
    // Metadatos
    evaluateeName: data.evaluateeName,
    evaluatorCount: data.evaluatorCount || 0,
    reportType: data.reportType || REPORT_TYPES.INDIVIDUAL,
    
    // Contenido del reporte
    executiveSummary: data.executiveSummary || null,
    scoresByType: data.scoresByType || {},
    categoryAnalysis: data.categoryAnalysis || {},
    gapAnalysis: data.gapAnalysis || {},
    recommendations: data.recommendations || {},
    benchmarks: data.benchmarks || {},
    
    // Visualizaciones
    visualizations: data.visualizations || {},
    
    // Narrativa
    narrative: data.narrative || null,
    
    // Estado
    status: data.status || REPORT_STATUS.PENDING,
    
    // Metadatos
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    generatedAt: data.generatedAt || null,
    
    // ConfiguraciÃ³n
    plan: data.plan || 'premium',
    language: data.language || 'es',
    includeNarrative: data.includeNarrative !== undefined ? data.includeNarrative : true,
    includeRecommendations: data.includeRecommendations !== undefined ? data.includeRecommendations : true,
    
    // ValidaciÃ³n
    isValid: data.isValid || false,
    validationErrors: data.validationErrors || [],
    warnings: data.warnings || []
  };
};

/**
 * Modelo de resumen ejecutivo
 */
export const createExecutiveSummaryModel = (data) => {
  return {
    overallScore: data.overallScore || 0,
    scoreLevel: data.scoreLevel || 'neutral',
    topStrengths: data.topStrengths || [],
    keyOpportunities: data.keyOpportunities || [],
    criticalGaps: data.criticalGaps || [],
    consensusLevel: data.consensusLevel || 'medium',
    keyInsights: data.keyInsights || [],
    summaryText: data.summaryText || ''
  };
};

/**
 * Modelo de anÃ¡lisis por categorÃ­a
 */
export const createCategoryAnalysisModel = (data) => {
  return {
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    score: data.score || 0,
    scoreLevel: data.scoreLevel || 'neutral',
    evaluatorCount: data.evaluatorCount || 0,
    consensusIndex: data.consensusIndex || 0,
    strengths: data.strengths || [],
    opportunities: data.opportunities || [],
    recommendations: data.recommendations || [],
    benchmark: data.benchmark || null
  };
};

/**
 * Modelo de anÃ¡lisis de brechas
 */
export const createGapAnalysisModel = (data) => {
  return {
    selfVsOthers: data.selfVsOthers || {
      averageGap: 0,
      categoryGaps: {},
      interpretation: 'neutral'
    },
    typeGaps: data.typeGaps || {},
    benchmarkGaps: data.benchmarkGaps || {},
    criticalGaps: data.criticalGaps || [],
    insights: data.insights || []
  };
};

/**
 * Modelo de recomendaciones
 */
export const createRecommendationsModel = (data) => {
  return {
    immediate: data.immediate || [],
    shortTerm: data.shortTerm || [],
    mediumTerm: data.mediumTerm || [],
    longTerm: data.longTerm || [],
    developmentPlan: data.developmentPlan || null,
    priorityMatrix: data.priorityMatrix || {}
  };
};

/**
 * Modelo de visualizaciÃ³n
 */
export const createVisualizationModel = (data) => {
  return {
    type: data.type,
    title: data.title,
    description: data.description,
    data: data.data || {},
    config: data.config || {},
    insights: data.insights || [],
    isInteractive: data.isInteractive !== undefined ? data.isInteractive : false
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar reporte 360Â°
 */
export const validateReport360 = (report) => {
  const errors = [];
  const warnings = [];
  
  // Validar datos bÃ¡sicos
  if (!report.evaluateeId) {
    errors.push('evaluateeId es requerido');
  }
  
  if (!report.aggregationId) {
    errors.push('aggregationId es requerido');
  }
  
  if (report.evaluatorCount < 1) {
    errors.push('Debe haber al menos un evaluador');
  }
  
  // Validar scores
  if (report.scoresByType && Object.keys(report.scoresByType).length === 0) {
    warnings.push('No hay scores por tipo de evaluador');
  }
  
  // Validar anÃ¡lisis de categorÃ­as
  if (report.categoryAnalysis && Object.keys(report.categoryAnalysis).length === 0) {
    warnings.push('No hay anÃ¡lisis de categorÃ­as');
  }
  
  // Validar narrativa
  if (report.includeNarrative && !report.narrative) {
    warnings.push('Narrativa requerida pero no disponible');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener nivel de score
 */
export const getScoreLevel = (score) => {
  if (score >= 4.5) return 'excellent';
  if (score >= 4.0) return 'very_good';
  if (score >= 3.5) return 'good';
  if (score >= 3.0) return 'satisfactory';
  if (score >= 2.5) return 'needs_improvement';
  return 'critical';
};

/**
 * Obtener etiqueta de nivel de score
 */
export const getScoreLevelLabel = (level) => {
  switch (level) {
    case 'excellent': return 'Excelente';
    case 'very_good': return 'Muy Bueno';
    case 'good': return 'Bueno';
    case 'satisfactory': return 'Satisfactorio';
    case 'needs_improvement': return 'Necesita Mejora';
    case 'critical': return 'CrÃ­tico';
    default: return 'Desconocido';
  }
};

/**
 * Obtener color para nivel de score
 */
export const getScoreLevelColor = (level) => {
  switch (level) {
    case 'excellent': return 'text-green-600';
    case 'very_good': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'satisfactory': return 'text-yellow-500';
    case 'needs_improvement': return 'text-orange-500';
    case 'critical': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

/**
 * Obtener nivel de consenso
 */
export const getConsensusLevel = (consensusIndex) => {
  if (consensusIndex >= 0.8) return 'high';
  if (consensusIndex >= 0.6) return 'medium';
  return 'low';
};

/**
 * Obtener etiqueta de nivel de consenso
 */
export const getConsensusLevelLabel = (level) => {
  switch (level) {
    case 'high': return 'Alto Consenso';
    case 'medium': return 'Consenso Medio';
    case 'low': return 'Bajo Consenso';
    default: return 'Consenso Desconocido';
  }
};

/**
 * Obtener interpretaciÃ³n de brecha
 */
export const getGapInterpretation = (gap) => {
  if (gap > 0.5) return 'overestimation';
  if (gap < -0.5) return 'underestimation';
  return 'aligned';
};

/**
 * Obtener etiqueta de interpretaciÃ³n de brecha
 */
export const getGapInterpretationLabel = (interpretation) => {
  switch (interpretation) {
    case 'overestimation': return 'SobreestimaciÃ³n';
    case 'underestimation': return 'SubestimaciÃ³n';
    case 'aligned': return 'Alineado';
    default: return 'Desconocido';
  }
};

/**
 * Obtener estado de reporte como string legible
 */
export const getReportStatusLabel = (status) => {
  switch (status) {
    case REPORT_STATUS.PENDING: return 'Pendiente';
    case REPORT_STATUS.GENERATING: return 'Generando';
    case REPORT_STATUS.COMPLETED: return 'Completado';
    case REPORT_STATUS.FAILED: return 'Fallido';
    default: return 'Estado Desconocido';
  }
};

/**
 * Obtener color para estado de reporte
 */
export const getReportStatusColor = (status) => {
  switch (status) {
    case REPORT_STATUS.PENDING: return 'bg-gray-100 text-gray-800';
    case REPORT_STATUS.GENERATING: return 'bg-yellow-100 text-yellow-800';
    case REPORT_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
    case REPORT_STATUS.FAILED: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Obtener etiqueta para tipo de reporte
 */
export const getReportTypeLabel = (type) => {
  switch (type) {
    case REPORT_TYPES.INDIVIDUAL: return 'Individual';
    case REPORT_TYPES.TEAM: return 'Equipo';
    case REPORT_TYPES.ORGANIZATIONAL: return 'Organizacional';
    default: return 'Tipo Desconocido';
  }
};

/**
 * Obtener etiqueta para tipo de visualizaciÃ³n
 */
export const getVisualizationTypeLabel = (type) => {
  switch (type) {
    case VISUALIZATION_TYPES.RADAR_CHART: return 'GrÃ¡fico Radar';
    case VISUALIZATION_TYPES.BAR_CHART: return 'GrÃ¡fico de Barras';
    case VISUALIZATION_TYPES.LINE_CHART: return 'GrÃ¡fico de LÃ­neas';
    case VISUALIZATION_TYPES.SCATTER_PLOT: return 'GrÃ¡fico de DispersiÃ³n';
    case VISUALIZATION_TYPES.HEATMAP: return 'Mapa de Calor';
    case VISUALIZATION_TYPES.DONUT_CHART: return 'GrÃ¡fico de Donut';
    default: return 'Tipo Desconocido';
  }
};

/**
 * Calcular fortalezas principales
 */
export const calculateTopStrengths = (categoryAnalysis, limit = 3) => {
  const strengths = Object.values(categoryAnalysis)
    .filter(category => category.score >= 4.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return strengths.map(strength => ({
    category: strength.categoryName,
    score: strength.score,
    level: getScoreLevel(strength.score)
  }));
};

/**
 * Calcular oportunidades principales
 */
export const calculateKeyOpportunities = (categoryAnalysis, limit = 3) => {
  const opportunities = Object.values(categoryAnalysis)
    .filter(category => category.score < 3.5)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
  
  return opportunities.map(opportunity => ({
    category: opportunity.categoryName,
    score: opportunity.score,
    level: getScoreLevel(opportunity.score),
    potential: 5.0 - opportunity.score
  }));
};

/**
 * Calcular brechas crÃ­ticas
 */
export const calculateCriticalGaps = (gapAnalysis, threshold = 0.5) => {
  if (!gapAnalysis.selfVsOthers) return [];
  
  const gaps = Object.entries(gapAnalysis.selfVsOthers.categoryGaps || {})
    .filter(([category, gap]) => Math.abs(gap) >= threshold)
    .map(([category, gap]) => ({
      category,
      gap,
      interpretation: getGapInterpretation(gap)
    }));
  
  return gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
};

// ========== EXPORT DEFAULT ==========

export default {

};
