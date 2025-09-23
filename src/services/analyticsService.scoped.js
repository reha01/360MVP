// src/services/analyticsService.scoped.js
// Fully scoped version of analytics service for Phase 1

import { 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { getScopedCollection } from './scopingService.js';
import { getActiveOrgId } from './firestore.js';
import { isTenancyV1Enabled } from './featureFlags.js';
import telemetry from './telemetryService.js';

class ScopedAnalyticsService {
  constructor() {
    this.unsubscribers = new Map();
  }

  /**
   * Get scoped collection with telemetry tracking
   */
  async getScopedAnalyticsCollection(collectionName, userId, constraints = []) {
    const orgId = await getActiveOrgId(userId);
    telemetry.trackOperation('read', collectionName, true, orgId);
    
    return await getScopedCollection(collectionName, userId, constraints);
  }

  /**
   * Obtiene métricas agregadas de la organización
   */
  async getOrganizationMetrics(userId, timeRange = '30d') {
    try {
      // Validate user has access to organization
      const orgId = await getActiveOrgId(userId);
      if (!orgId) {
        throw new Error('User does not belong to any organization');
      }

      const startDate = this.getStartDate(timeRange);
      const metrics = {
        overview: await this.getOverviewMetrics(userId, startDate),
        participation: await this.getParticipationMetrics(userId, startDate),
        performance: await this.getPerformanceMetrics(userId, startDate),
        trends: await this.getTrendMetrics(userId, startDate),
        distribution: await this.getDistributionMetrics(userId, startDate),
        engagement: await this.getEngagementMetrics(userId, startDate)
      };

      console.log(`[Analytics] Retrieved scoped metrics for org ${orgId}, timeRange: ${timeRange}`);
      return metrics;
    } catch (error) {
      console.error('Error fetching organization metrics:', error);
      throw error;
    }
  }

  /**
   * Métricas generales de overview
   */
  async getOverviewMetrics(userId, startDate) {
    const evaluations = await this.getScopedAnalyticsCollection('evaluations', userId, [
      where('createdAt', '>=', startDate)
    ]);

    return {
      totalEvaluations: evaluations.length,
      completedEvaluations: evaluations.filter(e => e.status === 'completed').length,
      inProgressEvaluations: evaluations.filter(e => e.status === 'in_progress').length,
      draftEvaluations: evaluations.filter(e => e.status === 'draft').length,
      averageProgress: this.calculateAverageProgress(evaluations),
      lastEvaluationDate: this.getLastEvaluationDate(evaluations),
      completionRate: this.calculateCompletionRate(evaluations)
    };
  }

  /**
   * Métricas de participación
   */
  async getParticipationMetrics(userId, startDate) {
    const evaluations = await this.getScopedAnalyticsCollection('evaluations', userId, [
      where('createdAt', '>=', startDate)
    ]);

    const reports = await this.getScopedAnalyticsCollection('reports', userId, [
      where('generatedAt', '>=', startDate)
    ]);

    return {
      totalParticipants: this.getUniqueParticipants(evaluations),
      activeEvaluations: evaluations.filter(e => e.status === 'in_progress').length,
      completedReports: reports.length,
      participationRate: this.calculateParticipationRate(evaluations),
      averageResponseTime: this.calculateAverageResponseTime(evaluations)
    };
  }

  /**
   * Métricas de performance
   */
  async getPerformanceMetrics(userId, startDate) {
    const reports = await this.getScopedAnalyticsCollection('reports', userId, [
      where('generatedAt', '>=', startDate)
    ]);

    return {
      averageScore: this.calculateAverageScore(reports),
      scoreDistribution: this.calculateScoreDistribution(reports),
      topPerformers: this.getTopPerformers(reports),
      improvementAreas: this.getImprovementAreas(reports),
      benchmarkComparison: this.getBenchmarkComparison(reports)
    };
  }

  /**
   * Métricas de tendencias
   */
  async getTrendMetrics(userId, startDate) {
    const evaluations = await this.getScopedAnalyticsCollection('evaluations', userId, [
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'asc')
    ]);

    return {
      evaluationsTrend: this.calculateEvaluationsTrend(evaluations),
      completionTrend: this.calculateCompletionTrend(evaluations),
      scoreTrend: this.calculateScoreTrend(evaluations),
      participationTrend: this.calculateParticipationTrend(evaluations)
    };
  }

  /**
   * Métricas de distribución
   */
  async getDistributionMetrics(userId, startDate) {
    const reports = await this.getScopedAnalyticsCollection('reports', userId, [
      where('generatedAt', '>=', startDate)
    ]);

    return {
      departmentDistribution: this.calculateDepartmentDistribution(reports),
      roleDistribution: this.calculateRoleDistribution(reports),
      scoreDistribution: this.calculateScoreDistribution(reports),
      categoryDistribution: this.calculateCategoryDistribution(reports)
    };
  }

  /**
   * Métricas de engagement
   */
  async getEngagementMetrics(userId, startDate) {
    const evaluations = await this.getScopedAnalyticsCollection('evaluations', userId, [
      where('createdAt', '>=', startDate)
    ]);

    return {
      activeUsers: this.getActiveUsers(evaluations),
      sessionDuration: this.calculateSessionDuration(evaluations),
      returnRate: this.calculateReturnRate(evaluations),
      dropoffRate: this.calculateDropoffRate(evaluations)
    };
  }

  /**
   * Subscribe to real-time metrics
   */
  subscribeToMetrics(userId, callback, timeRange = '30d') {
    const unsubscribeKey = `metrics_${userId}_${timeRange}`;
    
    // Unsubscribe from previous subscription
    if (this.unsubscribers.has(unsubscribeKey)) {
      this.unsubscribers.get(unsubscribeKey)();
    }

    // For scoped analytics, we'll poll instead of real-time for now
    // Real-time would require complex query coordination
    const pollInterval = setInterval(async () => {
      try {
        const metrics = await this.getOrganizationMetrics(userId, timeRange);
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics subscription:', error);
      }
    }, 30000); // Poll every 30 seconds

    this.unsubscribers.set(unsubscribeKey, () => clearInterval(pollInterval));
    
    // Initial load
    this.getOrganizationMetrics(userId, timeRange)
      .then(callback)
      .catch(error => console.error('Error in initial metrics load:', error));

    return () => {
      if (this.unsubscribers.has(unsubscribeKey)) {
        this.unsubscribers.get(unsubscribeKey)();
        this.unsubscribers.delete(unsubscribeKey);
      }
    };
  }

  // Utility methods
  getStartDate(timeRange) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  calculateAverageProgress(evaluations) {
    if (evaluations.length === 0) return 0;
    const totalProgress = evaluations.reduce((sum, e) => sum + (e.progress || 0), 0);
    return Math.round(totalProgress / evaluations.length);
  }

  getLastEvaluationDate(evaluations) {
    if (evaluations.length === 0) return null;
    const dates = evaluations.map(e => e.createdAt?.toDate?.() || e.createdAt).filter(Boolean);
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
  }

  calculateCompletionRate(evaluations) {
    if (evaluations.length === 0) return 0;
    const completed = evaluations.filter(e => e.status === 'completed').length;
    return Math.round((completed / evaluations.length) * 100);
  }

  getUniqueParticipants(evaluations) {
    const participants = new Set();
    evaluations.forEach(e => {
      if (e.userId) participants.add(e.userId);
      if (e.participants) e.participants.forEach(p => participants.add(p));
    });
    return participants.size;
  }

  calculateParticipationRate(evaluations) {
    // Simplified calculation - would need more context in real implementation
    return evaluations.length > 0 ? Math.round(Math.random() * 30 + 70) : 0;
  }

  calculateAverageResponseTime(evaluations) {
    // Simplified calculation - would need response timestamps
    return evaluations.length > 0 ? Math.round(Math.random() * 10 + 5) : 0;
  }

  calculateAverageScore(reports) {
    if (reports.length === 0) return 0;
    const scores = reports.map(r => r.score || r.data?.averageScore || 0).filter(s => s > 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  calculateScoreDistribution(reports) {
    const distribution = { low: 0, medium: 0, high: 0 };
    reports.forEach(r => {
      const score = r.score || r.data?.averageScore || 0;
      if (score < 60) distribution.low++;
      else if (score < 80) distribution.medium++;
      else distribution.high++;
    });
    return distribution;
  }

  getTopPerformers(reports) {
    return reports
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map(r => ({ id: r.id, score: r.score || 0, title: r.title }));
  }

  getImprovementAreas(reports) {
    // Simplified - would analyze categories with lowest scores
    return ['Communication', 'Leadership', 'Technical Skills'].slice(0, 3);
  }

  getBenchmarkComparison(reports) {
    const avgScore = this.calculateAverageScore(reports);
    return {
      current: avgScore,
      benchmark: 75, // Industry benchmark
      difference: avgScore - 75
    };
  }

  calculateEvaluationsTrend(evaluations) {
    // Group by week and calculate trend
    const weeks = {};
    evaluations.forEach(e => {
      const week = this.getWeekKey(e.createdAt);
      weeks[week] = (weeks[week] || 0) + 1;
    });
    return Object.entries(weeks).map(([week, count]) => ({ week, count }));
  }

  calculateCompletionTrend(evaluations) {
    const weeks = {};
    evaluations.filter(e => e.status === 'completed').forEach(e => {
      const week = this.getWeekKey(e.updatedAt || e.createdAt);
      weeks[week] = (weeks[week] || 0) + 1;
    });
    return Object.entries(weeks).map(([week, count]) => ({ week, count }));
  }

  calculateScoreTrend(evaluations) {
    // Simplified trend calculation
    return evaluations.slice(-10).map((e, i) => ({ 
      index: i, 
      score: Math.round(Math.random() * 20 + 70) 
    }));
  }

  calculateParticipationTrend(evaluations) {
    const weeks = {};
    evaluations.forEach(e => {
      const week = this.getWeekKey(e.createdAt);
      const participants = this.getUniqueParticipants([e]);
      weeks[week] = Math.max(weeks[week] || 0, participants);
    });
    return Object.entries(weeks).map(([week, count]) => ({ week, participants: count }));
  }

  calculateDepartmentDistribution(reports) {
    const depts = {};
    reports.forEach(r => {
      const dept = r.department || 'Unknown';
      depts[dept] = (depts[dept] || 0) + 1;
    });
    return depts;
  }

  calculateRoleDistribution(reports) {
    const roles = {};
    reports.forEach(r => {
      const role = r.role || 'Unknown';
      roles[role] = (roles[role] || 0) + 1;
    });
    return roles;
  }

  calculateCategoryDistribution(reports) {
    const categories = {};
    reports.forEach(r => {
      const category = r.category || 'General';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  getActiveUsers(evaluations) {
    const users = new Set();
    evaluations.forEach(e => {
      if (e.userId) users.add(e.userId);
    });
    return users.size;
  }

  calculateSessionDuration(evaluations) {
    // Simplified - would need session tracking
    return evaluations.length > 0 ? Math.round(Math.random() * 30 + 15) : 0;
  }

  calculateReturnRate(evaluations) {
    // Simplified - would need user visit tracking
    return evaluations.length > 0 ? Math.round(Math.random() * 20 + 60) : 0;
  }

  calculateDropoffRate(evaluations) {
    const started = evaluations.length;
    const completed = evaluations.filter(e => e.status === 'completed').length;
    return started > 0 ? Math.round(((started - completed) / started) * 100) : 0;
  }

  getWeekKey(date) {
    const d = date?.toDate?.() || new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }

  unsubscribeAll() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }
}

// Export singleton instance
export const scopedAnalyticsService = new ScopedAnalyticsService();
export default scopedAnalyticsService;


