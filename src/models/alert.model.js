/**
 * Alert Model
 * Represents system alerts, notifications, and DLQ entries
 */

export const AlertType = {
  DLQ_ENTRY: 'dlq_entry',          // Dead Letter Queue entry
  RATE_LIMIT: 'rate_limit',        // Rate limit exceeded
  SYSTEM_ERROR: 'system_error',    // System error
  PERFORMANCE: 'performance',       // Performance issue
  SECURITY: 'security',            // Security alert
  DATA_INTEGRITY: 'data_integrity', // Data integrity issue
  QUOTA_WARNING: 'quota_warning',  // Quota warning
  EMAIL_FAILURE: 'email_failure',  // Email delivery failure
  INTEGRATION: 'integration'        // Third-party integration issue
};

export const AlertSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const AlertStatus = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  IGNORED: 'ignored',
  ESCALATED: 'escalated'
};

export class Alert {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orgId = data.orgId || null;
    
    // Alert details
    this.type = data.type || AlertType.SYSTEM_ERROR;
    this.severity = data.severity || AlertSeverity.MEDIUM;
    this.status = data.status || AlertStatus.NEW;
    this.title = data.title || '';
    this.message = data.message || '';
    this.details = data.details || {};
    
    // Timing
    this.createdAt = data.createdAt || new Date().toISOString();
    this.acknowledgedAt = data.acknowledgedAt || null;
    this.resolvedAt = data.resolvedAt || null;
    this.lastOccurredAt = data.lastOccurredAt || new Date().toISOString();
    this.expiresAt = data.expiresAt || null; // Auto-dismiss time
    
    // Occurrence tracking
    this.occurrenceCount = data.occurrenceCount || 1;
    this.firstOccurredAt = data.firstOccurredAt || new Date().toISOString();
    
    // Context
    this.source = data.source || 'system'; // system, user, integration, etc.
    this.sourceId = data.sourceId || null; // ID of the source entity
    this.userId = data.userId || null; // User associated with alert
    this.userName = data.userName || null;
    
    // For DLQ entries
    this.dlq = data.dlq || {
      originalAction: null,    // What action failed
      originalPayload: null,   // Original data
      errorMessage: null,      // Error message
      errorStack: null,        // Error stack trace
      retryCount: 0,          // Number of retry attempts
      maxRetries: 3,          // Maximum retries allowed
      lastRetryAt: null,      // Last retry timestamp
      canRetry: true          // Whether retry is possible
    };
    
    // For rate limits
    this.rateLimit = data.rateLimit || {
      limit: null,            // Rate limit threshold
      current: null,          // Current usage
      resetAt: null,          // When limit resets
      resource: null          // What resource is limited
    };
    
    // For performance
    this.performance = data.performance || {
      metric: null,           // What metric (e.g., 'page_load')
      value: null,           // Actual value
      threshold: null,       // Expected threshold
      duration: null         // Duration in ms
    };
    
    // Actions
    this.actions = data.actions || {
      canRetry: false,
      canDismiss: true,
      canEscalate: false,
      customActions: []      // Array of { label, action } objects
    };
    
    // Metadata
    this.metadata = data.metadata || {};
    this.tags = data.tags || [];
    
    // Tracking
    this.acknowledgedBy = data.acknowledgedBy || null;
    this.resolvedBy = data.resolvedBy || null;
    this.notes = data.notes || [];
  }
  
  /**
   * Check if alert is active
   */
  isActive() {
    return [AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS].includes(this.status);
  }
  
  /**
   * Check if alert has expired
   */
  hasExpired() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }
  
  /**
   * Check if DLQ item can be retried
   */
  canRetryDLQ() {
    return this.type === AlertType.DLQ_ENTRY &&
           this.dlq.canRetry &&
           this.dlq.retryCount < this.dlq.maxRetries;
  }
  
  /**
   * Get severity color for UI
   */
  getSeverityColor() {
    const colors = {
      [AlertSeverity.LOW]: 'blue',
      [AlertSeverity.MEDIUM]: 'yellow',
      [AlertSeverity.HIGH]: 'orange',
      [AlertSeverity.CRITICAL]: 'red'
    };
    return colors[this.severity] || 'gray';
  }
  
  /**
   * Get severity icon
   */
  getSeverityIcon() {
    const icons = {
      [AlertSeverity.LOW]: 'info',
      [AlertSeverity.MEDIUM]: 'alert-triangle',
      [AlertSeverity.HIGH]: 'alert-circle',
      [AlertSeverity.CRITICAL]: 'alert-octagon'
    };
    return icons[this.severity] || 'alert-circle';
  }
  
  /**
   * Get type icon
   */
  getTypeIcon() {
    const icons = {
      [AlertType.DLQ_ENTRY]: 'inbox',
      [AlertType.RATE_LIMIT]: 'zap-off',
      [AlertType.SYSTEM_ERROR]: 'x-octagon',
      [AlertType.PERFORMANCE]: 'activity',
      [AlertType.SECURITY]: 'shield',
      [AlertType.DATA_INTEGRITY]: 'database',
      [AlertType.QUOTA_WARNING]: 'pie-chart',
      [AlertType.EMAIL_FAILURE]: 'mail-x',
      [AlertType.INTEGRATION]: 'link'
    };
    return icons[this.type] || 'alert-circle';
  }
  
  /**
   * Get human-readable type name
   */
  getTypeName() {
    const names = {
      [AlertType.DLQ_ENTRY]: 'Failed Operation',
      [AlertType.RATE_LIMIT]: 'Rate Limit',
      [AlertType.SYSTEM_ERROR]: 'System Error',
      [AlertType.PERFORMANCE]: 'Performance Issue',
      [AlertType.SECURITY]: 'Security Alert',
      [AlertType.DATA_INTEGRITY]: 'Data Integrity',
      [AlertType.QUOTA_WARNING]: 'Quota Warning',
      [AlertType.EMAIL_FAILURE]: 'Email Failure',
      [AlertType.INTEGRATION]: 'Integration Issue'
    };
    return names[this.type] || this.type;
  }
  
  /**
   * Calculate time since creation
   */
  getAge() {
    const ms = Date.now() - new Date(this.createdAt).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }
  
  /**
   * Add a note to the alert
   */
  addNote(userId, userName, text) {
    this.notes.push({
      userId,
      userName,
      text,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Acknowledge the alert
   */
  acknowledge(userId, userName) {
    this.status = AlertStatus.ACKNOWLEDGED;
    this.acknowledgedAt = new Date().toISOString();
    this.acknowledgedBy = { userId, userName };
    this.addNote(userId, userName, 'Alert acknowledged');
  }
  
  /**
   * Resolve the alert
   */
  resolve(userId, userName, note = '') {
    this.status = AlertStatus.RESOLVED;
    this.resolvedAt = new Date().toISOString();
    this.resolvedBy = { userId, userName };
    this.addNote(userId, userName, note || 'Alert resolved');
  }
  
  /**
   * Increment occurrence count
   */
  incrementOccurrence() {
    this.occurrenceCount++;
    this.lastOccurredAt = new Date().toISOString();
    
    // Escalate severity if occurring frequently
    if (this.occurrenceCount > 10 && this.severity === AlertSeverity.LOW) {
      this.severity = AlertSeverity.MEDIUM;
    } else if (this.occurrenceCount > 25 && this.severity === AlertSeverity.MEDIUM) {
      this.severity = AlertSeverity.HIGH;
    } else if (this.occurrenceCount > 50) {
      this.severity = AlertSeverity.CRITICAL;
    }
  }
  
  /**
   * Convert to Firestore document
   */
  toFirestore() {
    return {
      orgId: this.orgId,
      type: this.type,
      severity: this.severity,
      status: this.status,
      title: this.title,
      message: this.message,
      details: this.details,
      createdAt: this.createdAt,
      acknowledgedAt: this.acknowledgedAt,
      resolvedAt: this.resolvedAt,
      lastOccurredAt: this.lastOccurredAt,
      expiresAt: this.expiresAt,
      occurrenceCount: this.occurrenceCount,
      firstOccurredAt: this.firstOccurredAt,
      source: this.source,
      sourceId: this.sourceId,
      userId: this.userId,
      userName: this.userName,
      dlq: this.dlq,
      rateLimit: this.rateLimit,
      performance: this.performance,
      actions: this.actions,
      metadata: this.metadata,
      tags: this.tags,
      acknowledgedBy: this.acknowledgedBy,
      resolvedBy: this.resolvedBy,
      notes: this.notes
    };
  }
  
  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    return new Alert({
      id: doc.id,
      ...doc.data()
    });
  }
  
  /**
   * Create DLQ alert
   */
  static createDLQAlert(orgId, action, payload, error) {
    return new Alert({
      orgId,
      type: AlertType.DLQ_ENTRY,
      severity: AlertSeverity.HIGH,
      title: `Failed: ${action}`,
      message: error.message || 'Operation failed and has been queued for retry',
      dlq: {
        originalAction: action,
        originalPayload: payload,
        errorMessage: error.message,
        errorStack: error.stack,
        retryCount: 0,
        maxRetries: 3,
        canRetry: true
      },
      actions: {
        canRetry: true,
        canDismiss: true,
        canEscalate: true
      }
    });
  }
}

export default Alert;
