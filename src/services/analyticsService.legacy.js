// src/services/analyticsService.legacy.js
// Legacy analytics service - will be replaced by scoped version in Phase 1

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
import { getActiveOrgId } from './firestore.js';

class LegacyAnalyticsService {
  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
    this.unsubscribers = new Map();
  }

  // This is the old analytics service - kept for backward compatibility
  // All new code should use analyticsService.scoped.js

  async getOrganizationMetrics(orgId, timeRange = '30d') {
    console.warn('[Analytics] Using legacy analytics service - consider migrating to scoped version');
    
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

  async getOverviewMetrics(orgId, startDate) {
    // Track this as unscoped operation
    const { default: telemetry } = await import('./telemetryService.js');
    telemetry.trackOperation('read', 'evaluations', false);

    const evaluationsQuery = query(
      collection(this.db, 'evaluations'),
      where('organizationId', '==', orgId),
      where('createdAt', '>=', startDate)
    );

    const snapshot = await getDocs(evaluationsQuery);
    const evaluations = [];
    snapshot.forEach(doc => evaluations.push({ id: doc.id, ...doc.data() }));

    return {
      totalEvaluations: evaluations.length,
      completedEvaluations: evaluations.filter(e => e.status === 'completed').length,
      averageScore: this.calculateAverageScore(evaluations),
      completionRate: evaluations.length > 0 ? (evaluations.filter(e => e.status === 'completed').length / evaluations.length) * 100 : 0
    };
  }

  // ... rest of legacy methods would be here
  // For now, just implement basic structure

  getStartDate(timeRange) {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  calculateAverageScore(evaluations) {
    if (evaluations.length === 0) return 0;
    const scores = evaluations.map(e => e.score || 0).filter(s => s > 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }
}

// Export singleton instance for backward compatibility
export const legacyAnalyticsService = new LegacyAnalyticsService();
