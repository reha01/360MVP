// 360MVP-functions/functions/src/reports/reportGenerator.js

const admin = require('firebase-admin');
const NarrativeTemplates = require('./narrativeTemplates');

/**
 * Generador principal de reportes
 * Combina datos, narrativa y estructura para crear reportes completos
 */
class ReportGenerator {
  constructor() {
    this.db = admin.firestore();
    this.narrativeTemplates = new NarrativeTemplates();
  }

  /**
   * Genera un reporte completo basado en una evaluación
   */
  async generateReport(evaluationId, options = {}) {
    const {
      type = 'individual', // individual, 360, organizational
      plan = 'premium', // gratuito, premium
      includeNarrative = true,
      includeBenchmarks = true,
      includeRecommendations = true
    } = options;

    try {
      // 1. Obtener datos de la evaluación
      const evaluationData = await this.getEvaluationData(evaluationId);
      
      // 2. Calcular métricas y scores
      const metrics = this.calculateMetrics(evaluationData);
      
      // 3. Generar benchmarks si es necesario
      const benchmarks = includeBenchmarks 
        ? await this.generateBenchmarks(metrics, evaluationData)
        : null;
      
      // 4. Preparar datos para narrativa
      const narrativeData = this.prepareNarrativeData(evaluationData, metrics, benchmarks);
      
      // 5. Generar narrativa
      const narrative = includeNarrative
        ? this.narrativeTemplates.generateNarrative(narrativeData, {
            plan,
            bloques: this.getBloquesForPlan(plan, type)
          })
        : null;
      
      // 6. Generar recomendaciones
      const recommendations = includeRecommendations && plan === 'premium'
        ? this.generateRecommendations(metrics, benchmarks)
        : null;
      
      // 7. Estructurar el reporte final
      const report = this.structureReport({
        evaluationData,
        metrics,
        benchmarks,
        narrative,
        recommendations,
        type,
        plan
      });
      
      // 8. Guardar en Firestore
      const reportId = await this.saveReport(report);
      
      return {
        success: true,
        reportId,
        report
      };
      
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Obtiene los datos de una evaluación
   */
  async getEvaluationData(evaluationId) {
    const evaluationDoc = await this.db.collection('evaluations').doc(evaluationId).get();
    
    if (!evaluationDoc.exists) {
      throw new Error('Evaluation not found');
    }
    
    const evaluation = evaluationDoc.data();
    
    // Obtener información del usuario
    const userDoc = await this.db.collection('users').doc(evaluation.userId).get();
    const user = userDoc.exists ? userDoc.data() : {};
    
    // Obtener respuestas
    const responsesSnapshot = await this.db
      .collection('evaluations')
      .doc(evaluationId)
      .collection('responses')
      .get();
    
    const responses = [];
    responsesSnapshot.forEach(doc => {
      responses.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      evaluationId,
      ...evaluation,
      user,
      responses
    };
  }

  /**
   * Calcula métricas y scores
   */
  calculateMetrics(evaluationData) {
    const { responses } = evaluationData;
    
    // Agrupar respuestas por categoría/dimensión
    const dimensionScores = {};
    const categoryScores = {};
    let totalScore = 0;
    let totalResponses = 0;
    
    responses.forEach(response => {
      const { dimension, category, value, weight = 1 } = response;
      
      // Normalizar valor a escala 0-100
      const normalizedValue = this.normalizeValue(value);
      const weightedValue = normalizedValue * weight;
      
      // Acumular por dimensión
      if (dimension) {
        if (!dimensionScores[dimension]) {
          dimensionScores[dimension] = { total: 0, count: 0, weighted: 0 };
        }
        dimensionScores[dimension].total += normalizedValue;
        dimensionScores[dimension].weighted += weightedValue;
        dimensionScores[dimension].count++;
      }
      
      // Acumular por categoría
      if (category) {
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, count: 0, weighted: 0 };
        }
        categoryScores[category].total += normalizedValue;
        categoryScores[category].weighted += weightedValue;
        categoryScores[category].count++;
      }
      
      totalScore += weightedValue;
      totalResponses += weight;
    });
    
    // Calcular promedios
    Object.keys(dimensionScores).forEach(key => {
      const dim = dimensionScores[key];
      dimensionScores[key] = {
        ...dim,
        average: dim.total / dim.count,
        weightedAverage: dim.weighted / dim.count
      };
    });
    
    Object.keys(categoryScores).forEach(key => {
      const cat = categoryScores[key];
      categoryScores[key] = {
        ...cat,
        average: cat.total / cat.count,
        weightedAverage: cat.weighted / cat.count
      };
    });
    
    const globalScore = totalResponses > 0 ? totalScore / totalResponses : 0;
    
    // Identificar fortalezas y debilidades
    const sortedDimensions = Object.entries(dimensionScores)
      .sort((a, b) => b[1].average - a[1].average);
    
    const strengths = sortedDimensions.slice(0, 3).map(([key, data]) => ({
      dimension: key,
      score: data.average
    }));
    
    const weaknesses = sortedDimensions.slice(-3).map(([key, data]) => ({
      dimension: key,
      score: data.average
    }));
    
    // Calcular distribución y estadísticas
    const distribution = this.calculateDistribution(responses);
    const statistics = this.calculateStatistics(responses);
    
    return {
      globalScore: Math.round(globalScore),
      dimensionScores,
      categoryScores,
      strengths,
      weaknesses,
      distribution,
      statistics,
      totalResponses: responses.length
    };
  }

  /**
   * Normaliza valores a escala 0-100
   */
  normalizeValue(value) {
    if (typeof value === 'boolean') {
      return value ? 100 : 0;
    }
    if (typeof value === 'number') {
      // Asumiendo escala 1-5
      return ((value - 1) / 4) * 100;
    }
    return 0;
  }

  /**
   * Calcula distribución de respuestas
   */
  calculateDistribution(responses) {
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    responses.forEach(response => {
      if (typeof response.value === 'number' && response.value >= 1 && response.value <= 5) {
        distribution[response.value]++;
      }
    });
    
    return distribution;
  }

  /**
   * Calcula estadísticas
   */
  calculateStatistics(responses) {
    const values = responses
      .filter(r => typeof r.value === 'number')
      .map(r => r.value);
    
    if (values.length === 0) {
      return { mean: 0, median: 0, mode: 0, stdDev: 0 };
    }
    
    // Media
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Mediana
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // Moda
    const frequency = {};
    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1;
    });
    const mode = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    
    // Desviación estándar
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean: Math.round(mean * 100) / 100,
      median,
      mode: Number(mode),
      stdDev: Math.round(stdDev * 100) / 100
    };
  }

  /**
   * Genera benchmarks comparativos
   */
  async generateBenchmarks(metrics, evaluationData) {
    // TODO: Implementar comparación con datos históricos
    // Por ahora, usar benchmarks simulados
    
    const { globalScore, dimensionScores } = metrics;
    
    const industryAverage = 65;
    const topPerformers = 85;
    
    const comparison = {
      vsIndustry: globalScore - industryAverage,
      vsTopPerformers: globalScore - topPerformers,
      percentile: this.calculatePercentile(globalScore),
      trend: 'stable' // TODO: Calcular tendencia real
    };
    
    const dimensionBenchmarks = {};
    Object.keys(dimensionScores).forEach(dimension => {
      dimensionBenchmarks[dimension] = {
        industryAverage: 60 + Math.random() * 20,
        topPerformers: 80 + Math.random() * 15,
        percentile: this.calculatePercentile(dimensionScores[dimension].average)
      };
    });
    
    return {
      globalComparison: comparison,
      dimensionBenchmarks,
      sampleSize: 500, // TODO: Usar datos reales
      lastUpdated: new Date()
    };
  }

  /**
   * Calcula percentil aproximado
   */
  calculatePercentile(score) {
    // Fórmula simplificada para percentil
    // TODO: Usar distribución real de datos
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 70;
    if (score >= 60) return 50;
    if (score >= 50) return 30;
    return 15;
  }

  /**
   * Prepara datos para la narrativa
   */
  prepareNarrativeData(evaluationData, metrics, benchmarks) {
    const { user } = evaluationData;
    const { globalScore, strengths, weaknesses, dimensionScores } = metrics;
    
    // Determinar nivel basado en score global
    const nivel = this.determineLevel(globalScore);
    
    // Formatear top 3 categorías
    const top3Categorias = strengths
      .map(s => this.formatDimensionName(s.dimension))
      .join(', ');
    
    // Formatear áreas débiles
    const areasDebiles = weaknesses
      .map(w => this.formatDimensionName(w.dimension))
      .join(', ');
    
    // Formatear scores débiles
    const scoresDebiles = weaknesses
      .map(w => `${Math.round(w.score)}%`)
      .join(', ');
    
    return {
      // Datos básicos
      nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
      fechaEvaluacion: new Date().toLocaleDateString('es-ES'),
      tipoEvaluacion: '360°',
      numDimensiones: Object.keys(dimensionScores).length,
      numPreguntas: evaluationData.responses.length,
      
      // Nivel
      nivel: nivel.nombre,
      descripcionNivel: nivel.descripcion,
      scoreGlobal: Math.round(globalScore),
      tipoPerfilGeneral: this.determineProfileType(metrics),
      
      // Fortalezas
      top3Categorias,
      fortalezasPrincipales: this.describeStrengths(strengths),
      competenciasDestacadas: this.identifyCompetencies(strengths),
      
      // Debilidades/Sombras
      areasDebiles,
      scoresDebiles,
      brechaPrincipal: weaknesses[0] ? this.formatDimensionName(weaknesses[0].dimension) : 'N/A',
      scoreActual: weaknesses[0] ? Math.round(weaknesses[0].score) : 0,
      scoreEsperado: 70, // Benchmark esperado
      
      // Comparaciones
      comparacionBenchmark: benchmarks 
        ? this.describeComparison(benchmarks.globalComparison.vsIndustry)
        : 'en línea con el promedio',
      
      // Horizonte y desarrollo
      oportunidadesFuturas: this.identifyOpportunities(metrics),
      areasClaveDesarrollo: areasDebiles,
      metaAspiracional: this.defineAspirationalGoal(globalScore),
      plazoEstimado: '6-12 meses',
      
      // Hoja de ruta - acciones específicas
      accion30_1: 'Realizar autoevaluación semanal en ' + (weaknesses[0] ? this.formatDimensionName(weaknesses[0].dimension) : 'áreas clave'),
      accion30_2: 'Buscar feedback específico de colegas y supervisores',
      accion30_3: 'Establecer métricas personales de seguimiento',
      
      accion60_1: 'Implementar plan de mejora con acciones concretas',
      accion60_2: 'Participar en formación específica o mentoría',
      accion60_3: 'Documentar progresos y aprendizajes clave',
      
      accion90_1: 'Evaluar progreso y ajustar estrategia',
      accion90_2: 'Compartir aprendizajes con el equipo',
      accion90_3: 'Planificar siguiente ciclo de desarrollo',
      
      // Recursos y apoyo
      recursosRecomendados: this.recommendResources(weaknesses),
      metricasSeguimiento: 'Evaluación mensual de progreso en dimensiones clave',
      apoyoSugerido: 'Mentoría quincenal y feedback 360° trimestral',
      
      // Mensaje final
      mensajeInspiracional: this.generateInspirationalMessage(globalScore, nivel)
    };
  }

  /**
   * Determina el nivel basado en el score
   */
  determineLevel(score) {
    if (score >= 85) {
      return {
        nombre: 'Avanzado',
        descripcion: 'excepcional que demuestra maestría'
      };
    } else if (score >= 70) {
      return {
        nombre: 'Competente',
        descripcion: 'sólido con competencias bien desarrolladas'
      };
    } else if (score >= 50) {
      return {
        nombre: 'En Desarrollo',
        descripcion: 'prometedor con áreas claras de crecimiento'
      };
    } else {
      return {
        nombre: 'Inicial',
        descripcion: 'fundacional con amplio potencial de desarrollo'
      };
    }
  }

  /**
   * Determina el tipo de perfil
   */
  determineProfileType(metrics) {
    const { globalScore, strengths } = metrics;
    
    if (globalScore >= 80) return 'de alto rendimiento';
    if (globalScore >= 65) return 'equilibrado y consistente';
    if (globalScore >= 50) return 'en evolución';
    return 'con potencial emergente';
  }

  /**
   * Formatea nombre de dimensión
   */
  formatDimensionName(dimension) {
    // Convertir snake_case o camelCase a formato legible
    return dimension
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Describe fortalezas
   */
  describeStrengths(strengths) {
    if (strengths.length === 0) return 'áreas en desarrollo';
    
    const avgScore = strengths.reduce((acc, s) => acc + s.score, 0) / strengths.length;
    
    if (avgScore >= 85) return 'capacidades excepcionales y diferenciadas';
    if (avgScore >= 70) return 'competencias sólidas y confiables';
    if (avgScore >= 55) return 'habilidades en consolidación';
    return 'bases en construcción';
  }

  /**
   * Identifica competencias basadas en fortalezas
   */
  identifyCompetencies(strengths) {
    const competencyMap = {
      liderazgo: 'de influencia y dirección de equipos',
      comunicacion: 'de expresión clara y persuasiva',
      innovacion: 'de creatividad y pensamiento disruptivo',
      colaboracion: 'de trabajo en equipo y sinergia',
      estrategia: 'de visión y planificación',
      ejecucion: 'de implementación y resultados'
    };
    
    return strengths
      .map(s => competencyMap[s.dimension] || 'profesionales clave')
      .slice(0, 2)
      .join(' y ');
  }

  /**
   * Describe comparación con benchmark
   */
  describeComparison(difference) {
    if (difference >= 20) return 'significativamente por encima del promedio de la industria';
    if (difference >= 10) return 'por encima del promedio de la industria';
    if (difference >= 0) return 'en línea con el promedio de la industria';
    if (difference >= -10) return 'ligeramente por debajo del promedio';
    return 'con oportunidad de alcanzar el estándar de la industria';
  }

  /**
   * Identifica oportunidades futuras
   */
  identifyOpportunities(metrics) {
    const { globalScore } = metrics;
    
    if (globalScore >= 80) return 'roles de liderazgo senior y proyectos estratégicos';
    if (globalScore >= 65) return 'liderar iniciativas clave y mentorear equipos';
    if (globalScore >= 50) return 'asumir mayores responsabilidades y proyectos desafiantes';
    return 'consolidar competencias fundamentales y ganar experiencia';
  }

  /**
   * Define meta aspiracional
   */
  defineAspirationalGoal(currentScore) {
    const targetScore = Math.min(currentScore + 20, 95);
    return `un nivel de excelencia del ${targetScore}%`;
  }

  /**
   * Recomienda recursos
   */
  recommendResources(weaknesses) {
    if (weaknesses.length === 0) return 'Material avanzado de liderazgo';
    
    const resources = [];
    weaknesses.slice(0, 2).forEach(w => {
      const dimension = w.dimension.toLowerCase();
      if (dimension.includes('lider')) resources.push('Curso de Liderazgo Transformacional');
      else if (dimension.includes('comun')) resources.push('Taller de Comunicación Efectiva');
      else if (dimension.includes('innov')) resources.push('Workshop de Innovación y Creatividad');
      else resources.push('Programa de Desarrollo de Competencias');
    });
    
    return resources.join(', ');
  }

  /**
   * Genera mensaje inspiracional
   */
  generateInspirationalMessage(score, nivel) {
    if (score >= 85) {
      return 'Tu excelencia actual es el trampolín hacia un impacto extraordinario. Continúa siendo referente e inspiración.';
    } else if (score >= 70) {
      return 'Estás en el camino correcto. Tu consistencia y dedicación están construyendo un perfil profesional sólido y respetado.';
    } else if (score >= 50) {
      return 'Cada paso que das es progreso. Tu compromiso con el crecimiento es tu mayor fortaleza.';
    } else {
      return 'El potencial está en ti. Este es el momento perfecto para iniciar tu transformación profesional.';
    }
  }

  /**
   * Genera recomendaciones específicas
   */
  generateRecommendations(metrics, benchmarks) {
    const { weaknesses, strengths, globalScore } = metrics;
    
    const recommendations = {
      immediate: [], // Acciones para los próximos 30 días
      shortTerm: [], // 1-3 meses
      mediumTerm: [], // 3-6 meses
      longTerm: [] // 6-12 meses
    };
    
    // Recomendaciones inmediatas basadas en debilidades
    weaknesses.slice(0, 2).forEach(w => {
      recommendations.immediate.push({
        dimension: w.dimension,
        action: `Buscar feedback específico sobre ${this.formatDimensionName(w.dimension)}`,
        impact: 'Alto',
        effort: 'Bajo'
      });
    });
    
    // Recomendaciones a corto plazo
    recommendations.shortTerm.push({
      action: 'Establecer plan de desarrollo personal con métricas claras',
      impact: 'Alto',
      effort: 'Medio'
    });
    
    // Recomendaciones a medio plazo
    if (globalScore < 70) {
      recommendations.mediumTerm.push({
        action: 'Participar en programa de mentoría o coaching',
        impact: 'Alto',
        effort: 'Alto'
      });
    }
    
    // Recomendaciones a largo plazo
    recommendations.longTerm.push({
      action: 'Prepararse para roles de mayor responsabilidad',
      impact: 'Muy Alto',
      effort: 'Alto'
    });
    
    return recommendations;
  }

  /**
   * Define bloques narrativos según plan y tipo
   */
  getBloquesForPlan(plan, type) {
    if (plan === 'gratuito') {
      return ['introduccion', 'nivel', 'conclusion'];
    }
    
    if (type === 'individual') {
      return ['introduccion', 'nivel', 'sombra', 'horizonte', 'hojaDeRuta', 'conclusion'];
    }
    
    if (type === '360') {
      return ['introduccion', 'nivel', 'sombra', 'horizonte', 'hojaDeRuta', 'conclusion'];
    }
    
    if (type === 'organizational') {
      return ['introduccion', 'nivel', 'horizonte', 'conclusion'];
    }
    
    return ['introduccion', 'nivel', 'conclusion'];
  }

  /**
   * Estructura el reporte final
   */
  structureReport(data) {
    const {
      evaluationData,
      metrics,
      benchmarks,
      narrative,
      recommendations,
      type,
      plan
    } = data;
    
    const report = {
      id: null, // Se asignará al guardar
      type,
      plan,
      generatedAt: new Date(),
      
      // Metadatos
      metadata: {
        evaluationId: evaluationData.evaluationId,
        userId: evaluationData.userId,
        userName: evaluationData.user.displayName || evaluationData.user.email,
        evaluationType: type,
        completedAt: evaluationData.completedAt,
        totalQuestions: evaluationData.responses.length
      },
      
      // Métricas principales
      metrics: {
        globalScore: metrics.globalScore,
        dimensionScores: metrics.dimensionScores,
        categoryScores: metrics.categoryScores,
        strengths: metrics.strengths,
        weaknesses: metrics.weaknesses,
        distribution: metrics.distribution,
        statistics: metrics.statistics
      },
      
      // Benchmarks (si aplica)
      benchmarks: plan === 'premium' ? benchmarks : null,
      
      // Narrativa
      narrative: narrative,
      
      // Recomendaciones (solo premium)
      recommendations: plan === 'premium' ? recommendations : null,
      
      // Configuración de visualización
      visualization: {
        charts: this.defineCharts(plan, type),
        tables: this.defineTables(plan, type),
        layout: plan === 'gratuito' ? 'compact' : 'full'
      }
    };
    
    return report;
  }

  /**
   * Define qué gráficos incluir
   */
  defineCharts(plan, type) {
    const charts = [];
    
    // Gráfico principal siempre incluido
    charts.push({
      type: 'radar',
      title: 'Perfil de Competencias',
      data: 'dimensionScores'
    });
    
    if (plan === 'premium') {
      charts.push(
        {
          type: 'bar',
          title: 'Comparación con Benchmarks',
          data: 'benchmarks'
        },
        {
          type: 'line',
          title: 'Distribución de Respuestas',
          data: 'distribution'
        },
        {
          type: 'pie',
          title: 'Balance de Fortalezas y Oportunidades',
          data: 'strengthsWeaknesses'
        }
      );
    }
    
    return charts;
  }

  /**
   * Define qué tablas incluir
   */
  defineTables(plan, type) {
    const tables = [];
    
    // Tabla resumen siempre incluida
    tables.push({
      type: 'summary',
      title: 'Resumen Ejecutivo',
      data: 'metrics'
    });
    
    if (plan === 'premium') {
      tables.push(
        {
          type: 'detailed',
          title: 'Análisis Detallado por Dimensión',
          data: 'dimensionScores'
        },
        {
          type: 'recommendations',
          title: 'Plan de Acción Recomendado',
          data: 'recommendations'
        }
      );
    }
    
    return tables;
  }

  /**
   * Guarda el reporte en Firestore
   */
  async saveReport(report) {
    const reportRef = this.db.collection('reports').doc();
    report.id = reportRef.id;
    
    await reportRef.set(report);
    
    // También actualizar referencia en la evaluación
    await this.db
      .collection('evaluations')
      .doc(report.metadata.evaluationId)
      .update({
        reportId: reportRef.id,
        reportGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    return reportRef.id;
  }
}

module.exports = ReportGenerator;



