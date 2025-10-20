/**
 * Servicio para gestión de reportes 360°
 * 
 * Maneja la generación, almacenamiento y recuperación
 * de reportes 360° con visualizaciones y narrativa
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  createReport360Model,
  createExecutiveSummaryModel,
  createCategoryAnalysisModel,
  createGapAnalysisModel,
  createRecommendationsModel,
  createVisualizationModel,
  validateReport360,
  getScoreLevel,
  getConsensusLevel,
  getGapInterpretation,
  calculateTopStrengths,
  calculateKeyOpportunities,
  calculateCriticalGaps,
  REPORT_STATUS,
  REPORT_TYPES
} from '../models/Report360';
import evaluation360AggregationService from './evaluation360AggregationService';
import campaignService from './campaignService';

// ========== REPORT MANAGEMENT ==========

/**
 * Obtener reporte 360°
 */
export const getReport360 = async (orgId, reportId) => {
  try {
    const reportRef = doc(db, 'orgs', orgId, 'reports360', reportId);
    const snapshot = await getDoc(reportRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Report360 ${reportId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[Report360] Error loading report:', error);
    throw error;
  }
};

/**
 * Obtener reporte por agregación
 */
export const getReportByAggregation = async (orgId, aggregationId) => {
  try {
    const reportsRef = collection(db, 'orgs', orgId, 'reports360');
    const q = query(
      reportsRef,
      where('aggregationId', '==', aggregationId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Report360] Error loading report by aggregation:', error);
    throw error;
  }
};

/**
 * Crear nuevo reporte 360°
 */
export const createReport360 = async (orgId, reportData, userId) => {
  try {
    // Validar datos
    if (!reportData.aggregationId || !reportData.evaluateeId) {
      throw new Error('aggregationId and evaluateeId are required');
    }
    
    // Crear reporte
    const newReport = createReport360Model({
      ...reportData,
      orgId,
      createdBy: userId,
      status: REPORT_STATUS.PENDING
    });
    
    // Crear en Firestore
    const reportRef = doc(db, 'orgs', orgId, 'reports360', newReport.reportId);
    await updateDoc(reportRef, {
      ...newReport,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[Report360] Created report: ${newReport.reportId}`);
    return newReport;
  } catch (error) {
    console.error('[Report360] Error creating report:', error);
    throw error;
  }
};

/**
 * Actualizar reporte 360°
 */
export const updateReport360 = async (orgId, reportId, updates, userId) => {
  try {
    // Obtener reporte actual
    const currentReport = await getReport360(orgId, reportId);
    
    // Crear reporte actualizado
    const updatedReport = {
      ...currentReport,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Actualizar en Firestore
    const reportRef = doc(db, 'orgs', orgId, 'reports360', reportId);
    await updateDoc(reportRef, updatedReport);
    
    console.log(`[Report360] Updated report: ${reportId}`);
    return updatedReport;
  } catch (error) {
    console.error('[Report360] Error updating report:', error);
    throw error;
  }
};

/**
 * Generar reporte 360° completo
 */
export const generateReport360 = async (orgId, aggregationId, userId, options = {}) => {
  try {
    // Obtener agregación
    const aggregation = await evaluation360AggregationService.getEvaluation360Aggregation(orgId, aggregationId);
    
    if (!aggregation) {
      throw new Error('Aggregation not found');
    }
    
    if (aggregation.status !== 'completed') {
      throw new Error('Aggregation must be completed to generate report');
    }
    
    // Verificar si ya existe un reporte
    const existingReport = await getReportByAggregation(orgId, aggregationId);
    if (existingReport && !options.forceRegenerate) {
      return existingReport;
    }
    
    // Crear reporte
    const reportData = {
      aggregationId,
      campaignId: aggregation.campaignId,
      session360Id: aggregation.session360Id,
      evaluateeId: aggregation.evaluateeId,
      evaluateeName: aggregation.evaluateeName,
      evaluatorCount: aggregation.totalResponses,
      reportType: REPORT_TYPES.INDIVIDUAL,
      plan: options.plan || 'premium',
      language: options.language || 'es',
      includeNarrative: options.includeNarrative !== false,
      includeRecommendations: options.includeRecommendations !== false
    };
    
    const report = createReport360Model(reportData);
    
    // Guardar reporte inicial
    const reportRef = doc(db, 'orgs', orgId, 'reports360', report.reportId);
    await updateDoc(reportRef, {
      ...report,
      status: REPORT_STATUS.GENERATING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Generar contenido del reporte
    const generatedReport = await generateReportContent(aggregation, report, options);
    
    // Actualizar reporte con contenido generado
    await updateReport360(orgId, report.reportId, {
      ...generatedReport,
      status: REPORT_STATUS.COMPLETED,
      generatedAt: new Date(),
      isValid: true
    }, userId);
    
    console.log(`[Report360] Generated report: ${report.reportId}`);
    return generatedReport;
  } catch (error) {
    console.error('[Report360] Error generating report:', error);
    
    // Marcar reporte como fallido
    if (report?.reportId) {
      await updateReport360(orgId, report.reportId, {
        status: REPORT_STATUS.FAILED,
        validationErrors: [error.message]
      }, userId);
    }
    
    throw error;
  }
};

/**
 * Generar contenido del reporte
 */
export const generateReportContent = async (aggregation, report, options) => {
  try {
    // Generar resumen ejecutivo
    const executiveSummary = generateExecutiveSummary(aggregation);
    
    // Generar análisis por categoría
    const categoryAnalysis = generateCategoryAnalysis(aggregation);
    
    // Generar análisis de brechas
    const gapAnalysis = generateGapAnalysis(aggregation);
    
    // Generar recomendaciones
    const recommendations = generateRecommendations(aggregation, categoryAnalysis, gapAnalysis);
    
    // Generar visualizaciones
    const visualizations = generateVisualizations(aggregation, categoryAnalysis, gapAnalysis);
    
    // Generar narrativa
    const narrative = options.includeNarrative 
      ? generateNarrative(aggregation, executiveSummary, categoryAnalysis, gapAnalysis)
      : null;
    
    return {
      ...report,
      executiveSummary,
      categoryAnalysis,
      gapAnalysis,
      recommendations,
      visualizations,
      narrative
    };
  } catch (error) {
    console.error('[Report360] Error generating report content:', error);
    throw error;
  }
};

/**
 * Generar resumen ejecutivo
 */
export const generateExecutiveSummary = (aggregation) => {
  const overallScore = aggregation.overallScore;
  const scoreLevel = getScoreLevel(overallScore);
  const consensusLevel = getConsensusLevel(aggregation.metrics?.consensusIndex || 0);
  
  // Calcular fortalezas y oportunidades
  const categoryAnalysis = generateCategoryAnalysis(aggregation);
  const topStrengths = calculateTopStrengths(categoryAnalysis);
  const keyOpportunities = calculateKeyOpportunities(categoryAnalysis);
  
  // Generar texto de resumen
  const summaryText = generateSummaryText(overallScore, scoreLevel, topStrengths, keyOpportunities);
  
  return createExecutiveSummaryModel({
    overallScore,
    scoreLevel,
    topStrengths,
    keyOpportunities,
    consensusLevel,
    summaryText
  });
};

/**
 * Generar análisis por categoría
 */
export const generateCategoryAnalysis = (aggregation) => {
  const categoryAnalysis = {};
  
  if (aggregation.testSnapshot && aggregation.testSnapshot.categories) {
    aggregation.testSnapshot.categories.forEach(category => {
      // Calcular score promedio de la categoría
      const categoryQuestions = aggregation.testSnapshot.questions.filter(q => q.category.id === category.id);
      const categoryScores = [];
      
      categoryQuestions.forEach(question => {
        const questionData = aggregation.aggregatedResponses[question.id];
        if (questionData && questionData.aggregatedScore) {
          categoryScores.push(questionData.aggregatedScore);
        }
      });
      
      const averageScore = categoryScores.length > 0 
        ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
        : 0;
      
      const scoreLevel = getScoreLevel(averageScore);
      const consensusIndex = calculateCategoryConsensus(aggregation, category.id);
      
      categoryAnalysis[category.id] = createCategoryAnalysisModel({
        categoryId: category.id,
        categoryName: category.name,
        score: averageScore,
        scoreLevel,
        evaluatorCount: aggregation.totalResponses,
        consensusIndex,
        strengths: scoreLevel === 'excellent' || scoreLevel === 'very_good' ? [category.name] : [],
        opportunities: scoreLevel === 'needs_improvement' || scoreLevel === 'critical' ? [category.name] : []
      });
    });
  }
  
  return categoryAnalysis;
};

/**
 * Generar análisis de brechas
 */
export const generateGapAnalysis = (aggregation) => {
  const gapAnalysis = {
    selfVsOthers: {
      averageGap: 0,
      categoryGaps: {},
      interpretation: 'neutral'
    },
    typeGaps: {},
    criticalGaps: [],
    insights: []
  };
  
  // Análisis de brecha autoevaluación vs otros
  if (aggregation.metrics?.gapAnalysis?.selfVsOthers) {
    gapAnalysis.selfVsOthers = aggregation.metrics.gapAnalysis.selfVsOthers;
    gapAnalysis.selfVsOthers.interpretation = getGapInterpretation(gapAnalysis.selfVsOthers.averageGap);
  }
  
  // Calcular brechas críticas
  gapAnalysis.criticalGaps = calculateCriticalGaps(gapAnalysis);
  
  // Generar insights
  gapAnalysis.insights = generateGapInsights(gapAnalysis);
  
  return createGapAnalysisModel(gapAnalysis);
};

/**
 * Generar recomendaciones
 */
export const generateRecommendations = (aggregation, categoryAnalysis, gapAnalysis) => {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    mediumTerm: [],
    longTerm: []
  };
  
  // Recomendaciones inmediatas basadas en brechas críticas
  gapAnalysis.criticalGaps.forEach(gap => {
    recommendations.immediate.push({
      action: `Revisar percepción en ${gap.category}`,
      impact: 'Alto',
      effort: 'Bajo',
      category: gap.category,
      type: 'gap_analysis'
    });
  });
  
  // Recomendaciones basadas en oportunidades
  Object.values(categoryAnalysis).forEach(category => {
    if (category.scoreLevel === 'needs_improvement' || category.scoreLevel === 'critical') {
      recommendations.shortTerm.push({
        action: `Desarrollar competencias en ${category.categoryName}`,
        impact: 'Alto',
        effort: 'Medio',
        category: category.categoryName,
        type: 'development'
      });
    }
  });
  
  // Recomendaciones a mediano plazo
  recommendations.mediumTerm.push({
    action: 'Establecer plan de desarrollo personalizado',
    impact: 'Alto',
    effort: 'Alto',
    type: 'planning'
  });
  
  return createRecommendationsModel(recommendations);
};

/**
 * Generar visualizaciones
 */
export const generateVisualizations = (aggregation, categoryAnalysis, gapAnalysis) => {
  const visualizations = {};
  
  // Gráfico radar de categorías
  visualizations.radarChart = createVisualizationModel({
    type: 'radar_chart',
    title: 'Perfil de Competencias',
    description: 'Visualización de scores por categoría',
    data: {
      categories: Object.values(categoryAnalysis).map(cat => ({
        category: cat.categoryName,
        score: cat.score
      }))
    },
    config: {
      maxValue: 5,
      minValue: 1
    }
  });
  
  // Gráfico de barras por tipo de evaluador
  visualizations.barChart = createVisualizationModel({
    type: 'bar_chart',
    title: 'Scores por Tipo de Evaluador',
    description: 'Comparación de scores según el tipo de evaluador',
    data: {
      types: Object.entries(aggregation.scoresByType).map(([type, score]) => ({
        type,
        score: score.overallScore,
        count: score.count
      }))
    }
  });
  
  // Gráfico de brechas
  if (gapAnalysis.selfVsOthers.categoryGaps) {
    visualizations.gapChart = createVisualizationModel({
      type: 'bar_chart',
      title: 'Análisis de Brechas',
      description: 'Diferencia entre autoevaluación y evaluación de otros',
      data: {
        gaps: Object.entries(gapAnalysis.selfVsOthers.categoryGaps).map(([category, gap]) => ({
          category,
          gap
        }))
      }
    });
  }
  
  return visualizations;
};

/**
 * Generar narrativa
 */
export const generateNarrative = (aggregation, executiveSummary, categoryAnalysis, gapAnalysis) => {
  const narrative = {
    introduction: generateIntroductionNarrative(aggregation, executiveSummary),
    strengths: generateStrengthsNarrative(executiveSummary.topStrengths),
    opportunities: generateOpportunitiesNarrative(executiveSummary.keyOpportunities),
    gaps: generateGapsNarrative(gapAnalysis),
    recommendations: generateRecommendationsNarrative(executiveSummary, categoryAnalysis),
    conclusion: generateConclusionNarrative(executiveSummary, gapAnalysis)
  };
  
  return narrative;
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener reportes de una campaña
 */
export const getCampaignReports = async (orgId, campaignId) => {
  try {
    const reportsRef = collection(db, 'orgs', orgId, 'reports360');
    const q = query(
      reportsRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Report360] Loaded ${reports.length} reports for campaign ${campaignId}`);
    return reports;
  } catch (error) {
    console.error('[Report360] Error loading campaign reports:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de reportes
 */
export const getReportStats = async (orgId, campaignId) => {
  try {
    const reports = await getCampaignReports(orgId, campaignId);
    
    const stats = {
      total: reports.length,
      pending: 0,
      generating: 0,
      completed: 0,
      failed: 0,
      averageScore: 0,
      averageGenerationTime: 0
    };
    
    let totalScore = 0;
    let totalGenerationTime = 0;
    
    reports.forEach(report => {
      stats[report.status] = (stats[report.status] || 0) + 1;
      
      if (report.executiveSummary?.overallScore > 0) {
        totalScore += report.executiveSummary.overallScore;
      }
      
      if (report.generatedAt && report.createdAt) {
        const generationTime = new Date(report.generatedAt) - new Date(report.createdAt);
        totalGenerationTime += generationTime;
      }
    });
    
    if (reports.length > 0) {
      stats.averageScore = Math.round((totalScore / reports.length) * 100) / 100;
      stats.averageGenerationTime = Math.round(totalGenerationTime / reports.length / 1000); // en segundos
    }
    
    return stats;
  } catch (error) {
    console.error('[Report360] Error loading report stats:', error);
    throw error;
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Calcular consenso por categoría
 */
const calculateCategoryConsensus = (aggregation, categoryId) => {
  // Implementar cálculo de consenso por categoría
  return 0.7; // Placeholder
};

/**
 * Generar texto de resumen
 */
const generateSummaryText = (overallScore, scoreLevel, topStrengths, keyOpportunities) => {
  const scoreLabel = getScoreLevelLabel(scoreLevel);
  
  let text = `El evaluado muestra un desempeño ${scoreLabel.toLowerCase()} con un score global de ${overallScore.toFixed(2)}/5.0. `;
  
  if (topStrengths.length > 0) {
    text += `Sus principales fortalezas se encuentran en ${topStrengths.map(s => s.category).join(', ')}. `;
  }
  
  if (keyOpportunities.length > 0) {
    text += `Las áreas de oportunidad más importantes son ${keyOpportunities.map(o => o.category).join(', ')}.`;
  }
  
  return text;
};

/**
 * Generar insights de brechas
 */
const generateGapInsights = (gapAnalysis) => {
  const insights = [];
  
  if (gapAnalysis.selfVsOthers.interpretation === 'overestimation') {
    insights.push('El evaluado tiende a sobreestimar sus capacidades en comparación con la percepción de otros.');
  } else if (gapAnalysis.selfVsOthers.interpretation === 'underestimation') {
    insights.push('El evaluado subestima sus capacidades en comparación con la percepción de otros.');
  } else {
    insights.push('El evaluado tiene una percepción alineada con la evaluación de otros.');
  }
  
  return insights;
};

/**
 * Generar narrativa de introducción
 */
const generateIntroductionNarrative = (aggregation, executiveSummary) => {
  return `Este reporte presenta los resultados de la evaluación 360° de ${aggregation.evaluateeName}, basada en las respuestas de ${aggregation.totalResponses} evaluadores. El score global de ${executiveSummary.overallScore.toFixed(2)}/5.0 refleja un desempeño ${getScoreLevelLabel(executiveSummary.scoreLevel).toLowerCase()}.`;
};

/**
 * Generar narrativa de fortalezas
 */
const generateStrengthsNarrative = (topStrengths) => {
  if (topStrengths.length === 0) return 'No se identificaron fortalezas destacadas en esta evaluación.';
  
  return `Las principales fortalezas identificadas incluyen ${topStrengths.map(s => s.category).join(', ')}. Estas competencias representan áreas de excelencia que pueden ser aprovechadas para el desarrollo profesional.`;
};

/**
 * Generar narrativa de oportunidades
 */
const generateOpportunitiesNarrative = (keyOpportunities) => {
  if (keyOpportunities.length === 0) return 'No se identificaron áreas de oportunidad críticas.';
  
  return `Las áreas de oportunidad más importantes se encuentran en ${keyOpportunities.map(o => o.category).join(', ')}. Estas competencias requieren atención prioritaria para el desarrollo profesional.`;
};

/**
 * Generar narrativa de brechas
 */
const generateGapsNarrative = (gapAnalysis) => {
  if (gapAnalysis.criticalGaps.length === 0) return 'No se identificaron brechas significativas entre la autoevaluación y la evaluación de otros.';
  
  return `Se identificaron brechas importantes en ${gapAnalysis.criticalGaps.map(g => g.category).join(', ')}. Estas discrepancias requieren atención para alinear la percepción propia con la de otros evaluadores.`;
};

/**
 * Generar narrativa de recomendaciones
 */
const generateRecommendationsNarrative = (executiveSummary, categoryAnalysis) => {
  return `Basado en los resultados, se recomienda enfocar el desarrollo en las áreas de oportunidad identificadas, aprovechando las fortalezas existentes como base para el crecimiento.`;
};

/**
 * Generar narrativa de conclusión
 */
const generateConclusionNarrative = (executiveSummary, gapAnalysis) => {
  return `En conclusión, esta evaluación 360° proporciona una visión integral del desempeño y las oportunidades de desarrollo. El enfoque debe estar en cerrar las brechas identificadas y fortalecer las competencias clave.`;
};

// ========== EXPORT ==========

export default {
  // Report management
  getReport360,
  getReportByAggregation,
  createReport360,
  updateReport360,
  generateReport360,
  generateReportContent,
  
  // Utilities
  getCampaignReports,
  getReportStats
};
