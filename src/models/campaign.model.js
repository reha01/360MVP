/**
 * Campaign Model
 * Represents a 360° evaluation campaign
 */

export const CampaignStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const CampaignType = {
  EVALUATION_360: '360',
  SELF_EVALUATION: 'self',
  PEER_REVIEW: 'peer',
  MANAGER_REVIEW: 'manager'
};

export class Campaign {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orgId = data.orgId || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || CampaignType.EVALUATION_360;
    this.status = data.status || CampaignStatus.DRAFT;
    
    // Dates
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // Metrics
    this.metrics = {
      totalAssignments: data.metrics?.totalAssignments || 0,
      completedAssignments: data.metrics?.completedAssignments || 0,
      pendingAssignments: data.metrics?.pendingAssignments || 0,
      failedAssignments: data.metrics?.failedAssignments || 0,
      responseRate: data.metrics?.responseRate || 0,
      averageScore: data.metrics?.averageScore || 0,
      lastUpdated: data.metrics?.lastUpdated || new Date().toISOString()
    };
    
    // Settings
    this.settings = {
      allowAnonymous: data.settings?.allowAnonymous || false,
      requireComments: data.settings?.requireComments || false,
      sendReminders: data.settings?.sendReminders || true,
      reminderFrequency: data.settings?.reminderFrequency || 7, // days
      maxAttempts: data.settings?.maxAttempts || 3
    };
    
    // Metadata
    this.createdBy = data.createdBy || null;
    this.tags = data.tags || [];
    this.testId = data.testId || null; // Reference to evaluation test
  }
  
  /**
   * Calculate response rate
   */
  getResponseRate() {
    if (this.metrics.totalAssignments === 0) return 0;
    return Math.round((this.metrics.completedAssignments / this.metrics.totalAssignments) * 100);
  }
  
  /**
   * Check if campaign is active
   */
  isActive() {
    return this.status === CampaignStatus.ACTIVE && 
           new Date() >= new Date(this.startDate) && 
           new Date() <= new Date(this.endDate);
  }
  
  /**
   * Get progress percentage
   */
  getProgress() {
    if (this.metrics.totalAssignments === 0) return 0;
    return Math.round((this.metrics.completedAssignments / this.metrics.totalAssignments) * 100);
  }
  
  /**
   * Get status color for UI
   */
  getStatusColor() {
    const colors = {
      [CampaignStatus.DRAFT]: 'gray',
      [CampaignStatus.ACTIVE]: 'green',
      [CampaignStatus.PAUSED]: 'yellow',
      [CampaignStatus.COMPLETED]: 'blue',
      [CampaignStatus.CANCELLED]: 'red'
    };
    return colors[this.status] || 'gray';
  }
  
  /**
   * Convert to Firestore document
   */
  toFirestore() {
    return {
      orgId: this.orgId,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString(),
      metrics: this.metrics,
      settings: this.settings,
      createdBy: this.createdBy,
      tags: this.tags,
      testId: this.testId
    };
  }
  
  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    return new Campaign({
      id: doc.id,
      ...doc.data()
    });
  }
  
  /**
   * Validate campaign data
   */
  validate() {
    const errors = [];
    
    if (!this.name) errors.push('Campaign name is required');
    if (!this.orgId) errors.push('Organization ID is required');
    if (!this.startDate) errors.push('Start date is required');
    if (!this.endDate) errors.push('End date is required');
    if (new Date(this.startDate) > new Date(this.endDate)) {
      errors.push('Start date must be before end date');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default Campaign;
