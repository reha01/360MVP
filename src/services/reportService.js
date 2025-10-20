// src/services/reportService.js

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

class ReportService {
  constructor() {
    this.functions = getFunctions();
    this.auth = getAuth();
  }

  /**
   * Genera un nuevo reporte
   */
  async generateReport(evaluationId, type = 'individual', forceRegenerate = false) {
    try {
      const generateReport = httpsCallable(this.functions, 'generateReport');
      const result = await generateReport({
        evaluationId,
        type,
        forceRegenerate
      });
      return result.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Obtiene un reporte por ID
   */
  async getReport(reportId) {
    try {
      const getReport = httpsCallable(this.functions, 'getReport');
      const result = await getReport({ reportId });
      return result.data;
    } catch (error) {
      console.error('Error getting report:', error);
      throw new Error(`Failed to get report: ${error.message}`);
    }
  }

  /**
   * Lista los reportes del usuario
   */
  async listReports(options = {}) {
    try {
      const { limit = 10, startAfter = null, type = null } = options;
      const listReports = httpsCallable(this.functions, 'listReports');
      const result = await listReports({
        limit,
        startAfter,
        type
      });
      return result.data;
    } catch (error) {
      console.error('Error listing reports:', error);
      throw new Error(`Failed to list reports: ${error.message}`);
    }
  }

  /**
   * Prepara datos para gráficos
   */
  prepareChartData(report) {
    if (!report || !report.metrics) return null;

    const { dimensionScores, categoryScores, distribution, globalScore } = report.metrics;

    // Datos para gráfico radar
    const radarData = Object.entries(dimensionScores || {}).map(([dimension, data]) => ({
      dimension: this.formatDimensionName(dimension),
      score: Math.round(data.average || 0),
      fullMark: 100
    }));

    // Datos para gráfico de barras
    const barData = Object.entries(categoryScores || {}).map(([category, data]) => ({
      category: this.formatDimensionName(category),
      score: Math.round(data.average || 0)
    }));

    // Datos para gráfico de distribución
    const distributionData = Object.entries(distribution || {}).map(([value, count]) => ({
      value: `Nivel ${value}`,
      count
    }));

    // Datos para gráfico de comparación (si hay benchmarks)
    const comparisonData = report.benchmarks ? [
      {
        name: 'Tu Score',
        value: globalScore
      },
      {
        name: 'Promedio Industria',
        value: 65 // TODO: Usar valor real del benchmark
      },
      {
        name: 'Top Performers',
        value: 85 // TODO: Usar valor real del benchmark
      }
    ] : null;

    return {
      radarData,
      barData,
      distributionData,
      comparisonData
    };
  }

  /**
   * Formatea nombre de dimensión
   */
  formatDimensionName(dimension) {
    return dimension
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Genera colores para gráficos
   */
  getChartColors() {
    return {
      primary: '#3498db',
      secondary: '#2ecc71',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#9b59b6',
      success: '#27ae60',
      gradient: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6']
    };
  }

  /**
   * Calcula el nivel basado en el score
   */
  getLevel(score) {
    if (score >= 85) return { name: 'Avanzado', color: '#27ae60' };
    if (score >= 70) return { name: 'Competente', color: '#3498db' };
    if (score >= 50) return { name: 'En Desarrollo', color: '#f39c12' };
    return { name: 'Inicial', color: '#e74c3c' };
  }

  /**
   * Formatea fecha
   */
  formatDate(date) {
    if (!date) return 'N/A';
    
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calcula tiempo transcurrido
   */
  getTimeAgo(date) {
    if (!date) return 'N/A';
    
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }
}

export default new ReportService();











