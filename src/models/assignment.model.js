/**
 * Assignment Model
 * Represents an evaluation assignment for a user in a campaign
 */

export const AssignmentStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

export const AssignmentRole = {
  SELF: 'self',
  PEER: 'peer',
  MANAGER: 'manager',
  SUBORDINATE: 'subordinate',
  EXTERNAL: 'external'
};

export class Assignment {
  constructor(data = {}) {
    this.id = data.id || null;
    this.campaignId = data.campaignId || null;
    this.orgId = data.orgId || null;
    
    // Participants
    this.evaluatorId = data.evaluatorId || null; // Who is evaluating
    this.evaluatorEmail = data.evaluatorEmail || '';
    this.evaluatorName = data.evaluatorName || '';
    this.evaluateeId = data.evaluateeId || null; // Who is being evaluated
    this.evaluateeName = data.evaluateeName || '';
    
    // Assignment details
    this.role = data.role || AssignmentRole.SELF;
    this.status = data.status || AssignmentStatus.PENDING;
    this.testId = data.testId || null;
    
    // Dates
    this.assignedAt = data.assignedAt || new Date().toISOString();
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.expiresAt = data.expiresAt || null;
    this.lastReminderAt = data.lastReminderAt || null;
    
    // Communication
    this.invitationToken = data.invitationToken || null;
    this.invitationSentAt = data.invitationSentAt || null;
    this.invitationOpenedAt = data.invitationOpenedAt || null;
    this.reminderCount = data.reminderCount || 0;
    this.emailStatus = data.emailStatus || 'pending'; // pending, sent, delivered, failed, bounced
    
    // Results
    this.answers = data.answers || {};
    this.score = data.score || null;
    this.comments = data.comments || '';
    this.progress = data.progress || 0; // 0-100
    
    // Metadata
    this.metadata = {
      userAgent: data.metadata?.userAgent || null,
      ipAddress: data.metadata?.ipAddress || null,
      completionTime: data.metadata?.completionTime || null, // in seconds
      device: data.metadata?.device || null
    };
    
    // Error tracking
    this.lastError = data.lastError || null;
    this.errorCount = data.errorCount || 0;
  }
  
  /**
   * Check if assignment is overdue
   */
  isOverdue() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt) && 
           this.status !== AssignmentStatus.COMPLETED;
  }
  
  /**
   * Check if reminder should be sent
   */
  shouldSendReminder(frequencyDays = 7) {
    if (this.status !== AssignmentStatus.PENDING) return false;
    if (!this.lastReminderAt && !this.invitationSentAt) return true;
    
    const lastContact = this.lastReminderAt || this.invitationSentAt;
    const daysSinceContact = (Date.now() - new Date(lastContact)) / (1000 * 60 * 60 * 24);
    
    return daysSinceContact >= frequencyDays;
  }
  
  /**
   * Get status color for UI
   */
  getStatusColor() {
    const colors = {
      [AssignmentStatus.PENDING]: 'yellow',
      [AssignmentStatus.IN_PROGRESS]: 'blue',
      [AssignmentStatus.COMPLETED]: 'green',
      [AssignmentStatus.EXPIRED]: 'gray',
      [AssignmentStatus.CANCELLED]: 'gray',
      [AssignmentStatus.FAILED]: 'red'
    };
    return colors[this.status] || 'gray';
  }
  
  /**
   * Get status badge text
   */
  getStatusBadge() {
    if (this.isOverdue()) return 'Overdue';
    return this.status.replace('_', ' ').toUpperCase();
  }
  
  /**
   * Calculate days until expiration
   */
  getDaysUntilExpiration() {
    if (!this.expiresAt) return null;
    const days = Math.ceil((new Date(this.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }
  
  /**
   * Generate unique invitation token
   */
  generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.invitationToken = token;
    return token;
  }
  
  /**
   * Convert to Firestore document
   */
  toFirestore() {
    return {
      campaignId: this.campaignId,
      orgId: this.orgId,
      evaluatorId: this.evaluatorId,
      evaluatorEmail: this.evaluatorEmail,
      evaluatorName: this.evaluatorName,
      evaluateeId: this.evaluateeId,
      evaluateeName: this.evaluateeName,
      role: this.role,
      status: this.status,
      testId: this.testId,
      assignedAt: this.assignedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      expiresAt: this.expiresAt,
      lastReminderAt: this.lastReminderAt,
      invitationToken: this.invitationToken,
      invitationSentAt: this.invitationSentAt,
      invitationOpenedAt: this.invitationOpenedAt,
      reminderCount: this.reminderCount,
      emailStatus: this.emailStatus,
      answers: this.answers,
      score: this.score,
      comments: this.comments,
      progress: this.progress,
      metadata: this.metadata,
      lastError: this.lastError,
      errorCount: this.errorCount
    };
  }
  
  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    return new Assignment({
      id: doc.id,
      ...doc.data()
    });
  }
  
  /**
   * Validate assignment data
   */
  validate() {
    const errors = [];
    
    if (!this.campaignId) errors.push('Campaign ID is required');
    if (!this.evaluatorEmail) errors.push('Evaluator email is required');
    if (!this.evaluateeId && this.role !== AssignmentRole.SELF) {
      errors.push('Evaluatee ID is required for non-self evaluations');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.evaluatorEmail && !emailRegex.test(this.evaluatorEmail)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

