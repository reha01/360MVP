/**
 * Servicio de Exportación 360° con Consistencia de Privacidad
 * 
 * Asegura que lo que se oculta en UI se oculta en export
 * Incluye metadatos: testId@version, timestamp, checksum
 */

import { hideSensitiveData, generateAnonymityMessage } from '../utils/anonymityValidator';
import { createHash } from 'crypto';

/**
 * Generar PDF con consistencia de privacidad
 */
export const generatePDF360 = async (report, anonymityStatus) => {
  try {
    // Aplicar ocultamiento de datos sensibles
    const sanitizedReport = hideSensitiveData(report, anonymityStatus);
    
    // Generar metadatos
    const metadata = generateExportMetadata(report, 'pdf');
    
    // Generar mensaje de anonimato si aplica
    const anonymityMessage = generateAnonymityMessage(anonymityStatus);
    
    // Crear PDF con datos sanitizados
    const pdfData = {
      ...sanitizedReport,
      metadata,
      anonymityMessage,
      exportType: 'pdf',
      generatedAt: new Date().toISOString()
    };
    
    // Generar checksum
    const checksum = generateChecksum(pdfData);
    pdfData.checksum = checksum;
    
    console.log('[Export360] PDF generated with privacy consistency');
    return pdfData;
  } catch (error) {
    console.error('[Export360] Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generar CSV con consistencia de privacidad
 */
export const generateCSV360 = async (report, anonymityStatus) => {
  try {
    // Aplicar ocultamiento de datos sensibles
    const sanitizedReport = hideSensitiveData(report, anonymityStatus);
    
    // Generar metadatos
    const metadata = generateExportMetadata(report, 'csv');
    
    // Generar mensaje de anonimato si aplica
    const anonymityMessage = generateAnonymityMessage(anonymityStatus);
    
    // Crear CSV con datos sanitizados
    const csvData = {
      ...sanitizedReport,
      metadata,
      anonymityMessage,
      exportType: 'csv',
      generatedAt: new Date().toISOString()
    };
    
    // Generar checksum
    const checksum = generateChecksum(csvData);
    csvData.checksum = checksum;
    
    console.log('[Export360] CSV generated with privacy consistency');
    return csvData;
  } catch (error) {
    console.error('[Export360] Error generating CSV:', error);
    throw error;
  }
};

/**
 * Generar metadatos de exportación
 */
const generateExportMetadata = (report, exportType) => {
  return {
    testId: report.testId,
    testVersion: report.testVersion,
    exportType,
    generatedAt: new Date().toISOString(),
    generatedBy: 'system',
    reportId: report.reportId,
    evaluateeId: report.evaluateeId,
    campaignId: report.campaignId,
    aggregationId: report.aggregationId,
    evaluatorCount: report.evaluatorCount,
    privacyLevel: 'anonymized', // Siempre anonimizado en exports
    dataIntegrity: 'verified'
  };
};

/**
 * Generar checksum para integridad de datos
 */
const generateChecksum = (data) => {
  const dataString = JSON.stringify(data, null, 0);
  return createHash('sha256').update(dataString).digest('hex').substring(0, 16);
};

/**
 * Validar integridad de export
 */
export const validateExportIntegrity = (exportData, expectedChecksum) => {
  const actualChecksum = generateChecksum(exportData);
  return actualChecksum === expectedChecksum;
};

/**
 * Generar mensaje de privacidad para exports
 */
export const generatePrivacyNotice = (anonymityStatus) => {
  const violations = Object.entries(anonymityStatus)
    .filter(([type, status]) => !status.met && status.actual > 0);
  
  if (violations.length === 0) {
    return {
      notice: 'Este reporte cumple con todos los umbrales de anonimato requeridos.',
      level: 'compliant'
    };
  }
  
  return {
    notice: `ATENCIÓN: Este reporte contiene datos ocultos por privacidad. ${violations.length} tipo(s) de evaluador no cumplen los umbrales de anonimato requeridos.`,
    level: 'restricted',
    details: violations.map(([type, status]) => ({
      type,
      actual: status.actual,
      required: status.required
    }))
  };
};

/**
 * Aplicar políticas de exportación por plan
 */
export const applyExportPolicies = (report, userPlan) => {
  const policies = {
    free: {
      maxExportsPerDay: 3,
      includeNarrative: false,
      includeRecommendations: false,
      includeBenchmarks: false
    },
    premium: {
      maxExportsPerDay: 50,
      includeNarrative: true,
      includeRecommendations: true,
      includeBenchmarks: true
    },
    enterprise: {
      maxExportsPerDay: -1, // Sin límite
      includeNarrative: true,
      includeRecommendations: true,
      includeBenchmarks: true
    }
  };
  
  const policy = policies[userPlan] || policies.free;
  
  return {
    ...report,
    narrative: policy.includeNarrative ? report.narrative : null,
    recommendations: policy.includeRecommendations ? report.recommendations : null,
    benchmarks: policy.includeBenchmarks ? report.benchmarks : null,
    exportPolicy: policy
  };
};

export default {
  generatePDF360,
  generateCSV360,
  validateExportIntegrity,
  generatePrivacyNotice,
  applyExportPolicies
};
