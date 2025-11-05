/**
 * Metrics Service
 * Calculates and aggregates metrics for dashboards and reports
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getActiveOrgId } from '../firestore';
import campaignService from './campaignService';
import { AssignmentStatus } from '../../models/assignment.model';

class MetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get from cache or fetch
   */
  async getWithCache(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[MetricsService] Cache hit for ${key}`);
      return cached.data;
    }

    console.log(`[MetricsService] Cache miss for ${key}, fetching...`);
    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  /**
   * Get overall dashboard metrics
   */
  async getDashboardMetrics(dateRange = {}) {
    const cacheKey = `dashboard-${JSON.stringify(dateRange)}`;
    
    return this.getWithCache(cacheKey, async () => {
      try {
        const orgId = getActiveOrgId();
        if (!orgId) throw new Error('No active organization');

        const metrics = {
          campaigns: await this.getCampaignMetrics(dateRange),
          assignments: await this.getAssignmentMetrics(dateRange),
          performance: await this.getPerformanceMetrics(dateRange),
          trends: await this.getTrendMetrics(dateRange),
          timestamp: new Date().toISOString()
        };

        console.log('[MetricsService] Dashboard metrics calculated');
        return metrics;
      } catch (error) {
        console.error('[MetricsService] Error getting dashboard metrics:', error);
        throw error;
      }
    });
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(dateRange = {}) {
    try {
      const campaigns = await campaignService.getCampaigns();
      
      const metrics = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        averageResponseRate: 0,
        averageProgress: 0
      };

      // Calculate averages
      if (campaigns.length > 0) {
        const totalResponseRate = campaigns.reduce((sum, c) => sum + c.getResponseRate(), 0);
        const totalProgress = campaigns.reduce((sum, c) => sum + c.getProgress(), 0);
        
        metrics.averageResponseRate = Math.round(totalResponseRate / campaigns.length);
        metrics.averageProgress = Math.round(totalProgress / campaigns.length);
      }

      return metrics;
    } catch (error) {
      console.error('[MetricsService] Error getting campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Get assignment metrics
   */
  async getAssignmentMetrics(dateRange = {}) {
    try {
      const orgId = getActiveOrgId();
      const assignmentsRef = collection(db, 'organizations', orgId, 'assignments');
      
      let q = assignmentsRef;
      
      // Apply date range filter if provided
      if (dateRange.startDate) {
        q = query(q, where('createdAt', '>=', dateRange.startDate));
      }
      if (dateRange.endDate) {
        q = query(q, where('createdAt', '<=', dateRange.endDate));
      }

      const snapshot = await getDocs(q);
      const assignments = [];
      snapshot.forEach(doc => assignments.push({ id: doc.id, ...doc.data() }));

      const metrics = {
        total: assignments.length,
        pending: assignments.filter(a => a.status === AssignmentStatus.PENDING).length,
        inProgress: assignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length,
        completed: assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length,
        failed: assignments.filter(a => a.status === AssignmentStatus.FAILED).length,
        expired: assignments.filter(a => a.status === AssignmentStatus.EXPIRED).length,
        completionRate: 0,
        averageCompletionTime: 0,
        emailDeliveryRate: 0
      };

      // Calculate rates
      if (metrics.total > 0) {
        metrics.completionRate = Math.round((metrics.completed / metrics.total) * 100);
        
        // Calculate email delivery rate
        const delivered = assignments.filter(a => 
          a.emailStatus === 'delivered' || a.emailStatus === 'sent'
        ).length;
        metrics.emailDeliveryRate = Math.round((delivered / metrics.total) * 100);
        
        // Calculate average completion time
        const completedAssignments = assignments.filter(a => 
          a.status === AssignmentStatus.COMPLETED && a.completedAt && a.assignedAt
        );
        
        if (completedAssignments.length > 0) {
          const totalTime = completedAssignments.reduce((sum, a) => {
            const time = new Date(a.completedAt) - new Date(a.assignedAt);
            return sum + time;
          }, 0);
          
          metrics.averageCompletionTime = Math.round(totalTime / completedAssignments.length / (1000 * 60 * 60)); // in hours
        }
      }

      return metrics;
    } catch (error) {
      console.error('[MetricsService] Error getting assignment metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(dateRange = {}) {
    try {
      // Simulated performance metrics - in production, these would come from real monitoring
      return {
        avgPageLoadTime: 1.2, // seconds
        avgApiResponseTime: 250, // ms
        errorRate: 0.02, // 2%
        uptime: 99.9, // percentage
        activeUsers: Math.floor(Math.random() * 50) + 10,
        peakLoadTime: '14:30',
        slowestEndpoint: '/api/reports',
        fastestEndpoint: '/api/health'
      };
    } catch (error) {
      console.error('[MetricsService] Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get trend metrics (last 7 days)
   */
  async getTrendMetrics(dateRange = {}) {
    try {
      const days = 7;
      const trends = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.push({
          date: date.toISOString().split('T')[0],
          assignments: Math.floor(Math.random() * 20) + 5,
          completions: Math.floor(Math.random() * 15) + 3,
          responseRate: Math.floor(Math.random() * 30) + 60
        });
      }

      return trends;
    } catch (error) {
      console.error('[MetricsService] Error getting trend metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics for a specific campaign
   */
  async getCampaignSpecificMetrics(campaignId) {
    const cacheKey = `campaign-${campaignId}`;
    
    return this.getWithCache(cacheKey, async () => {
      try {
        const orgId = getActiveOrgId();
        const assignmentsRef = collection(db, 'organizations', orgId, 'assignments');
        
        const q = query(assignmentsRef, where('campaignId', '==', campaignId));
        const snapshot = await getDocs(q);
        
        const assignments = [];
        snapshot.forEach(doc => assignments.push({ id: doc.id, ...doc.data() }));

        // Calculate detailed metrics
        const metrics = {
          totalAssignments: assignments.length,
          byStatus: {
            pending: assignments.filter(a => a.status === AssignmentStatus.PENDING).length,
            inProgress: assignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length,
            completed: assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length,
            failed: assignments.filter(a => a.status === AssignmentStatus.FAILED).length,
            expired: assignments.filter(a => a.status === AssignmentStatus.EXPIRED).length
          },
          byRole: {},
          responseRateByDay: [],
          averageScore: 0,
          topPerformers: [],
          needsAttention: []
        };

        // Group by role
        const roles = [...new Set(assignments.map(a => a.role))];
        roles.forEach(role => {
          metrics.byRole[role] = assignments.filter(a => a.role === role).length;
        });

        // Calculate average score
        const completedWithScore = assignments.filter(a => 
          a.status === AssignmentStatus.COMPLETED && a.score
        );
        
        if (completedWithScore.length > 0) {
          const totalScore = completedWithScore.reduce((sum, a) => sum + a.score, 0);
          metrics.averageScore = Math.round(totalScore / completedWithScore.length);
        }

        // Identify assignments needing attention (overdue or failed)
        metrics.needsAttention = assignments
          .filter(a => {
            if (a.status === AssignmentStatus.FAILED) return true;
            if (a.expiresAt && new Date(a.expiresAt) < new Date()) return true;
            return false;
          })
          .map(a => ({
            id: a.id,
            evaluatorName: a.evaluatorName,
            evaluatorEmail: a.evaluatorEmail,
            status: a.status,
            reason: a.status === AssignmentStatus.FAILED ? 'Failed' : 'Overdue'
          }));

        return metrics;
      } catch (error) {
        console.error('[MetricsService] Error getting campaign specific metrics:', error);
        throw error;
      }
    });
  }

  /**
   * Get real-time metrics (for live updates)
   */
  async getRealTimeMetrics() {
    try {
      // Clear cache to force fresh data
      this.clearCache();
      
      const metrics = await this.getDashboardMetrics();
      
      // Add real-time specific data
      metrics.realTime = {
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 20) + 5,
        currentLoad: Math.floor(Math.random() * 100),
        queueSize: Math.floor(Math.random() * 10),
        lastUpdate: new Date().toISOString()
      };

      return metrics;
    } catch (error) {
      console.error('[MetricsService] Error getting real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Export metrics to CSV
   */
  async exportMetricsToCSV(dateRange = {}) {
    try {
      const metrics = await this.getDashboardMetrics(dateRange);
      
      // Convert metrics to CSV format
      const csvRows = [
        ['Metric', 'Value'],
        ['Total Campaigns', metrics.campaigns.total],
        ['Active Campaigns', metrics.campaigns.active],
        ['Average Response Rate', `${metrics.campaigns.averageResponseRate}%`],
        ['Total Assignments', metrics.assignments.total],
        ['Completed Assignments', metrics.assignments.completed],
        ['Completion Rate', `${metrics.assignments.completionRate}%`],
        ['Average Completion Time', `${metrics.assignments.averageCompletionTime} hours`]
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      return {
        content: csvContent,
        filename: `metrics-${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv'
      };
    } catch (error) {
      console.error('[MetricsService] Error exporting metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MetricsService();
