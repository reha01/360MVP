// src/services/analyticsService.js

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class AnalyticsService {
  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
    this.unsubscribers = new Map();
  }

  /**
   * Obtiene métricas agregadas de la organización
   */
  async getOrganizationMetrics(orgId, timeRange = '30d') {
    try {
      const startDate = this.getStartDate(timeRange);
      const metrics = {
        overview: await this.getOverviewMetrics(orgId, startDate),
        participation: await this.getParticipationMetrics(orgId, startDate),
        performance: await this.getPerformanceMetrics(orgId, startDate),
        trends: await this.getTrendMetrics(orgId, startDate),
        distribution: await this.getDistributionMetrics(orgId, startDate),
        engagement: await this.getEngagementMetrics(orgId, startDate)
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching organization metrics:', error);
      throw error;
    }
  }

  /**
   * Métricas generales de overview
   */
  async getOverviewMetrics(orgId, startDate) {
    const evaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      where('createdAt', '>=', startDate)
    );

    const snapshot = await getDocs(evaluationsQuery);
    const evaluations = [];
    snapshot.forEach(doc => evaluations.push({ id: doc.id, ...doc.data() }));

    // Calcular métricas
    const totalEvaluations = evaluations.length;
    const completedEvaluations = evaluations.filter(e => e.status === 'completed').length;
    const averageScore = this.calculateAverageScore(evaluations);
    const completionRate = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;

    // Calcular cambios vs período anterior
    const previousStartDate = this.getPreviousPeriodDate(startDate);
    const previousMetrics = await this.getPreviousPeriodMetrics(orgId, previousStartDate, startDate);

    return {
      totalEvaluations: {
        value: totalEvaluations,
        change: this.calculateChange(totalEvaluations, previousMetrics.totalEvaluations),
        trend: this.getTrend(totalEvaluations, previousMetrics.totalEvaluations)
      },
      completedEvaluations: {
        value: completedEvaluations,
        change: this.calculateChange(completedEvaluations, previousMetrics.completedEvaluations),
        trend: this.getTrend(completedEvaluations, previousMetrics.completedEvaluations)
      },
      averageScore: {
        value: Math.round(averageScore),
        change: this.calculateChange(averageScore, previousMetrics.averageScore),
        trend: this.getTrend(averageScore, previousMetrics.averageScore)
      },
      completionRate: {
        value: Math.round(completionRate),
        change: this.calculateChange(completionRate, previousMetrics.completionRate),
        trend: this.getTrend(completionRate, previousMetrics.completionRate)
      }
    };
  }

  /**
   * Métricas de participación
   */
  async getParticipationMetrics(orgId, startDate) {
    const processesQuery = query(
      collection(this.db, 'processes'),
      where('organizationId', '==', orgId),
      where('createdAt', '>=', startDate)
    );

    const snapshot = await getDocs(processesQuery);
    const processes = [];
    snapshot.forEach(doc => processes.push({ id: doc.id, ...doc.data() }));

    // Calcular participación por rol
    const participationByRole = {
      'Líder': 0,
      'Par': 0,
      'Reporte Directo': 0,
      'Cliente': 0,
      'Autoevaluación': 0
    };

    // Calcular tasa de respuesta por proceso
    const responseRates = [];
    for (const process of processes) {
      const invitationsQuery = query(
        collection(this.db, 'invitations'),
        where('processId', '==', process.id)
      );
      
      const invSnapshot = await getDocs(invitationsQuery);
      const totalInvitations = invSnapshot.size;
      const completedInvitations = invSnapshot.docs.filter(doc => 
        doc.data().status === 'completed'
      ).length;

      if (totalInvitations > 0) {
        responseRates.push({
          processName: process.name,
          rate: (completedInvitations / totalInvitations) * 100,
          total: totalInvitations,
          completed: completedInvitations
        });
      }

      // Contar por rol
      invSnapshot.forEach(doc => {
        const role = doc.data().roleInProcess;
        if (participationByRole[role] !== undefined) {
          participationByRole[role]++;
        }
      });
    }

    return {
      activeProcesses: processes.length,
      participationByRole,
      responseRates: responseRates.sort((a, b) => b.rate - a.rate).slice(0, 5),
      averageResponseRate: responseRates.length > 0 
        ? responseRates.reduce((acc, r) => acc + r.rate, 0) / responseRates.length 
        : 0
    };
  }

  /**
   * Métricas de desempeño
   */
  async getPerformanceMetrics(orgId, startDate) {
    const reportsQuery = query(
      collection(this.db, 'reports'),
      where('organizationId', '==', orgId),
      where('generatedAt', '>=', startDate)
    );

    const snapshot = await getDocs(reportsQuery);
    const reports = [];
    snapshot.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));

    // Agrupar scores por dimensión
    const dimensionScores = {};
    const categoryScores = {};

    reports.forEach(report => {
      if (report.metrics?.dimensionScores) {
        Object.entries(report.metrics.dimensionScores).forEach(([dimension, data]) => {
          if (!dimensionScores[dimension]) {
            dimensionScores[dimension] = [];
          }
          dimensionScores[dimension].push(data.average || 0);
        });
      }

      if (report.metrics?.categoryScores) {
        Object.entries(report.metrics.categoryScores).forEach(([category, data]) => {
          if (!categoryScores[category]) {
            categoryScores[category] = [];
          }
          categoryScores[category].push(data.average || 0);
        });
      }
    });

    // Calcular promedios
    const avgDimensionScores = {};
    Object.entries(dimensionScores).forEach(([dimension, scores]) => {
      avgDimensionScores[dimension] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    });

    const avgCategoryScores = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      avgCategoryScores[category] = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    });

    // Top performers
    const topPerformers = reports
      .filter(r => r.metrics?.globalScore)
      .sort((a, b) => b.metrics.globalScore - a.metrics.globalScore)
      .slice(0, 5)
      .map(r => ({
        name: r.metadata?.userName || 'Anónimo',
        score: r.metrics.globalScore,
        level: this.getLevel(r.metrics.globalScore)
      }));

    // Areas de mejora comunes
    const commonWeaknesses = {};
    reports.forEach(report => {
      if (report.metrics?.weaknesses) {
        report.metrics.weaknesses.forEach(weakness => {
          if (!commonWeaknesses[weakness.dimension]) {
            commonWeaknesses[weakness.dimension] = 0;
          }
          commonWeaknesses[weakness.dimension]++;
        });
      }
    });

    const topWeaknesses = Object.entries(commonWeaknesses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dimension, count]) => ({
        dimension: this.formatDimensionName(dimension),
        frequency: count,
        percentage: (count / reports.length) * 100
      }));

    return {
      dimensionScores: avgDimensionScores,
      categoryScores: avgCategoryScores,
      topPerformers,
      commonWeaknesses: topWeaknesses,
      averageGlobalScore: reports.length > 0
        ? reports.reduce((acc, r) => acc + (r.metrics?.globalScore || 0), 0) / reports.length
        : 0
    };
  }

  /**
   * Métricas de tendencias
   */
  async getTrendMetrics(orgId, startDate) {
    const endDate = new Date();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const interval = daysDiff <= 30 ? 'daily' : daysDiff <= 90 ? 'weekly' : 'monthly';

    const evaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(evaluationsQuery);
    const evaluations = [];
    snapshot.forEach(doc => evaluations.push({ id: doc.id, ...doc.data() }));

    // Agrupar por intervalo
    const trendData = this.groupByInterval(evaluations, interval);

    // Calcular tendencia de scores
    const scoreTrend = trendData.map(group => ({
      date: group.date,
      averageScore: group.items.length > 0
        ? group.items.reduce((acc, e) => acc + (e.score || 0), 0) / group.items.length
        : 0,
      count: group.items.length
    }));

    // Proyección simple
    const projection = this.calculateProjection(scoreTrend);

    return {
      scoreTrend,
      projection,
      interval,
      growthRate: this.calculateGrowthRate(scoreTrend)
    };
  }

  /**
   * Métricas de distribución
   */
  async getDistributionMetrics(orgId, startDate) {
    const reportsQuery = query(
      collection(this.db, 'reports'),
      where('organizationId', '==', orgId),
      where('generatedAt', '>=', startDate)
    );

    const snapshot = await getDocs(reportsQuery);
    const reports = [];
    snapshot.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));

    // Distribución de niveles
    const levelDistribution = {
      'Inicial': 0,
      'En Desarrollo': 0,
      'Competente': 0,
      'Avanzado': 0
    };

    // Distribución de scores
    const scoreRanges = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-100': 0
    };

    reports.forEach(report => {
      const score = report.metrics?.globalScore || 0;
      
      // Nivel
      const level = this.getLevel(score);
      if (levelDistribution[level]) {
        levelDistribution[level]++;
      }

      // Rango
      if (score <= 25) scoreRanges['0-25']++;
      else if (score <= 50) scoreRanges['26-50']++;
      else if (score <= 75) scoreRanges['51-75']++;
      else scoreRanges['76-100']++;
    });

    // Distribución por departamento (simulado)
    const departmentDistribution = {
      'Ventas': Math.floor(reports.length * 0.3),
      'Marketing': Math.floor(reports.length * 0.2),
      'Tecnología': Math.floor(reports.length * 0.25),
      'Operaciones': Math.floor(reports.length * 0.15),
      'RRHH': Math.floor(reports.length * 0.1)
    };

    return {
      levelDistribution,
      scoreRanges,
      departmentDistribution,
      medianScore: this.calculateMedian(reports.map(r => r.metrics?.globalScore || 0)),
      standardDeviation: this.calculateStandardDeviation(reports.map(r => r.metrics?.globalScore || 0))
    };
  }

  /**
   * Métricas de engagement
   */
  async getEngagementMetrics(orgId, startDate) {
    // Tiempo promedio de completado
    const evaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      where('status', '==', 'completed'),
      where('completedAt', '>=', startDate)
    );

    const snapshot = await getDocs(evaluationsQuery);
    const completionTimes = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.startedAt && data.completedAt) {
        const timeDiff = data.completedAt.toDate() - data.startedAt.toDate();
        completionTimes.push(timeDiff / (1000 * 60)); // En minutos
      }
    });

    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Tasa de abandono
    const allEvaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      where('createdAt', '>=', startDate)
    );

    const allSnapshot = await getDocs(allEvaluationsQuery);
    const totalStarted = allSnapshot.size;
    const totalCompleted = snapshot.size;
    const abandonmentRate = totalStarted > 0 
      ? ((totalStarted - totalCompleted) / totalStarted) * 100 
      : 0;

    // Actividad por día de la semana
    const activityByDay = {
      'Lunes': 0,
      'Martes': 0,
      'Miércoles': 0,
      'Jueves': 0,
      'Viernes': 0,
      'Sábado': 0,
      'Domingo': 0
    };

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.completedAt) {
        const day = data.completedAt.toDate().getDay();
        activityByDay[dayNames[day]]++;
      }
    });

    // Horario pico (simplificado)
    const activityByHour = new Array(24).fill(0);
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.completedAt) {
        const hour = data.completedAt.toDate().getHours();
        activityByHour[hour]++;
      }
    });

    const peakHour = activityByHour.indexOf(Math.max(...activityByHour));

    return {
      averageCompletionTime: Math.round(avgCompletionTime),
      abandonmentRate: Math.round(abandonmentRate),
      activityByDay,
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
      totalActiveUsers: new Set(snapshot.docs.map(doc => doc.data().userId)).size,
      sessionsPerUser: snapshot.size / new Set(snapshot.docs.map(doc => doc.data().userId)).size
    };
  }

  /**
   * Suscribirse a actualizaciones en tiempo real
   */
  subscribeToMetrics(orgId, callback) {
    const evaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(evaluationsQuery, (snapshot) => {
      const updates = [];
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          updates.push({
            type: change.type,
            data: { id: change.doc.id, ...change.doc.data() }
          });
        }
      });

      if (updates.length > 0) {
        callback(updates);
      }
    });

    this.unsubscribers.set(orgId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Desuscribirse de actualizaciones
   */
  unsubscribeFromMetrics(orgId) {
    const unsubscribe = this.unsubscribers.get(orgId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(orgId);
    }
  }

  // Métodos auxiliares

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }

  getPreviousPeriodDate(startDate) {
    const diff = new Date() - startDate;
    return new Date(startDate.getTime() - diff);
  }

  async getPreviousPeriodMetrics(orgId, startDate, endDate) {
    // Implementación simplificada
    return {
      totalEvaluations: 10,
      completedEvaluations: 8,
      averageScore: 70,
      completionRate: 80
    };
  }

  calculateAverageScore(evaluations) {
    const scores = evaluations
      .filter(e => e.score)
      .map(e => e.score);
    
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  getTrend(current, previous) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  getLevel(score) {
    if (score >= 85) return 'Avanzado';
    if (score >= 70) return 'Competente';
    if (score >= 50) return 'En Desarrollo';
    return 'Inicial';
  }

  formatDimensionName(dimension) {
    return dimension
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  groupByInterval(items, interval) {
    const groups = {};
    
    items.forEach(item => {
      const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      let key;
      
      switch (interval) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const week = Math.floor(date.getDate() / 7);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) {
        groups[key] = { date: key, items: [] };
      }
      groups[key].items.push(item);
    });
    
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }

  calculateProjection(trend) {
    if (trend.length < 2) return null;
    
    // Regresión lineal simple
    const n = trend.length;
    const sumX = trend.reduce((acc, _, i) => acc + i, 0);
    const sumY = trend.reduce((acc, t) => acc + t.averageScore, 0);
    const sumXY = trend.reduce((acc, t, i) => acc + i * t.averageScore, 0);
    const sumX2 = trend.reduce((acc, _, i) => acc + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Proyectar próximos 3 puntos
    const projection = [];
    for (let i = 0; i < 3; i++) {
      const x = n + i;
      const y = slope * x + intercept;
      projection.push({
        period: `P+${i + 1}`,
        projectedScore: Math.max(0, Math.min(100, y))
      });
    }
    
    return projection;
  }

  calculateGrowthRate(trend) {
    if (trend.length < 2) return 0;
    
    const first = trend[0].averageScore;
    const last = trend[trend.length - 1].averageScore;
    
    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
}

export default new AnalyticsService();
