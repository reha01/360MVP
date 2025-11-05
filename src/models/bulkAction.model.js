/**
 * BulkAction Model
 * Represents a bulk action performed on multiple items
 */

export const BulkActionType = {
  RESEND_INVITATION: 'resend_invitation',
  CANCEL_ASSIGNMENT: 'cancel_assignment',
  EXTEND_DEADLINE: 'extend_deadline',
  SEND_REMINDER: 'send_reminder',
  EXPORT_DATA: 'export_data',
  DELETE_ITEMS: 'delete_items',
  UPDATE_STATUS: 'update_status'
};

export const BulkActionStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial', // Some items succeeded, some failed
  CANCELLED: 'cancelled'
};

export class BulkAction {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orgId = data.orgId || null;
    this.userId = data.userId || null; // Who initiated the action
    this.userName = data.userName || '';
    
    // Action details
    this.type = data.type || null;
    this.status = data.status || BulkActionStatus.PENDING;
    this.description = data.description || '';
    
    // Items to process
    this.totalItems = data.totalItems || 0;
    this.processedItems = data.processedItems || 0;
    this.successCount = data.successCount || 0;
    this.failureCount = data.failureCount || 0;
    this.itemIds = data.itemIds || []; // IDs of items to process
    
    // Options/parameters for the action
    this.options = data.options || {};
    // For EXTEND_DEADLINE: { days: 7 }
    // For UPDATE_STATUS: { newStatus: 'active' }
    // For EXPORT_DATA: { format: 'csv', fields: [...] }
    
    // Timing
    this.createdAt = data.createdAt || new Date().toISOString();
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.estimatedCompletion = data.estimatedCompletion || null;
    
    // Progress tracking
    this.progress = data.progress || 0; // 0-100
    this.currentBatch = data.currentBatch || 0;
    this.totalBatches = data.totalBatches || 1;
    this.batchSize = data.batchSize || 10;
    
    // Results
    this.results = data.results || {
      successful: [], // Array of successful item IDs
      failed: [],     // Array of { itemId, error } objects
      skipped: []     // Array of skipped item IDs
    };
    
    // Error tracking
    this.lastError = data.lastError || null;
    this.errors = data.errors || [];
    
    // DLQ (Dead Letter Queue) reference
    this.dlqEntries = data.dlqEntries || []; // IDs of DLQ entries for failed items
    
    // Audit
    this.ipAddress = data.ipAddress || null;
    this.userAgent = data.userAgent || null;
  }
  
  /**
   * Calculate progress percentage
   */
  getProgress() {
    if (this.totalItems === 0) return 0;
    return Math.round((this.processedItems / this.totalItems) * 100);
  }
  
  /**
   * Check if action can be retried
   */
  canRetry() {
    return [
      BulkActionStatus.FAILED,
      BulkActionStatus.PARTIAL,
      BulkActionStatus.CANCELLED
    ].includes(this.status);
  }
  
  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining() {
    if (this.status !== BulkActionStatus.IN_PROGRESS) return null;
    if (this.processedItems === 0) return null;
    
    const elapsed = Date.now() - new Date(this.startedAt).getTime();
    const avgTimePerItem = elapsed / this.processedItems;
    const remainingItems = this.totalItems - this.processedItems;
    const estimatedMs = avgTimePerItem * remainingItems;
    
    return Math.round(estimatedMs / 1000); // Return in seconds
  }
  
  /**
   * Get status color for UI
   */
  getStatusColor() {
    const colors = {
      [BulkActionStatus.PENDING]: 'gray',
      [BulkActionStatus.IN_PROGRESS]: 'blue',
      [BulkActionStatus.COMPLETED]: 'green',
      [BulkActionStatus.FAILED]: 'red',
      [BulkActionStatus.PARTIAL]: 'yellow',
      [BulkActionStatus.CANCELLED]: 'gray'
    };
    return colors[this.status] || 'gray';
  }
  
  /**
   * Get action icon
   */
  getActionIcon() {
    const icons = {
      [BulkActionType.RESEND_INVITATION]: 'mail',
      [BulkActionType.CANCEL_ASSIGNMENT]: 'x-circle',
      [BulkActionType.EXTEND_DEADLINE]: 'clock',
      [BulkActionType.SEND_REMINDER]: 'bell',
      [BulkActionType.EXPORT_DATA]: 'download',
      [BulkActionType.DELETE_ITEMS]: 'trash',
      [BulkActionType.UPDATE_STATUS]: 'edit'
    };
    return icons[this.type] || 'activity';
  }
  
  /**
   * Get human-readable action name
   */
  getActionName() {
    const names = {
      [BulkActionType.RESEND_INVITATION]: 'Resend Invitations',
      [BulkActionType.CANCEL_ASSIGNMENT]: 'Cancel Assignments',
      [BulkActionType.EXTEND_DEADLINE]: 'Extend Deadline',
      [BulkActionType.SEND_REMINDER]: 'Send Reminders',
      [BulkActionType.EXPORT_DATA]: 'Export Data',
      [BulkActionType.DELETE_ITEMS]: 'Delete Items',
      [BulkActionType.UPDATE_STATUS]: 'Update Status'
    };
    return names[this.type] || this.type;
  }
  
  /**
   * Add error to the action
   */
  addError(itemId, error) {
    this.errors.push({
      itemId,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
    this.results.failed.push({ itemId, error: error.message || error });
    this.failureCount++;
  }
  
  /**
   * Mark item as successful
   */
  markSuccess(itemId) {
    this.results.successful.push(itemId);
    this.successCount++;
  }
  
  /**
   * Update progress
   */
  updateProgress() {
    this.processedItems = this.successCount + this.failureCount;
    this.progress = this.getProgress();
    
    // Update status based on results
    if (this.processedItems === this.totalItems) {
      if (this.failureCount === 0) {
        this.status = BulkActionStatus.COMPLETED;
      } else if (this.successCount === 0) {
        this.status = BulkActionStatus.FAILED;
      } else {
        this.status = BulkActionStatus.PARTIAL;
      }
      this.completedAt = new Date().toISOString();
    }
  }
  
  /**
   * Convert to Firestore document
   */
  toFirestore() {
    return {
      orgId: this.orgId,
      userId: this.userId,
      userName: this.userName,
      type: this.type,
      status: this.status,
      description: this.description,
      totalItems: this.totalItems,
      processedItems: this.processedItems,
      successCount: this.successCount,
      failureCount: this.failureCount,
      itemIds: this.itemIds,
      options: this.options,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      estimatedCompletion: this.estimatedCompletion,
      progress: this.progress,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      batchSize: this.batchSize,
      results: this.results,
      lastError: this.lastError,
      errors: this.errors,
      dlqEntries: this.dlqEntries,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    };
  }
  
  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    return new BulkAction({
      id: doc.id,
      ...doc.data()
    });
  }
  
  /**
   * Validate bulk action data
   */
  validate() {
    const errors = [];
    
    if (!this.type) errors.push('Action type is required');
    if (!this.orgId) errors.push('Organization ID is required');
    if (!this.userId) errors.push('User ID is required');
    if (!this.itemIds || this.itemIds.length === 0) {
      errors.push('At least one item must be selected');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BulkAction;
