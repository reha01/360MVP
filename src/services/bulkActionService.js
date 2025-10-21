/**
 * Servicio de Acciones Masivas con Colas y DLQ
 * 
 * Implementa colas de trabajo, backoff exponencial y Dead Letter Queue
 */

import { createHash } from 'crypto';

// ========== QUEUE CONFIGURATION ==========

const QUEUE_CONFIG = {
  maxRetries: 5,
  backoffMultiplier: 2,
  initialDelay: 1000, // 1 segundo
  maxDelay: 300000,   // 5 minutos
  dlqThreshold: 3,    // Después de 3 fallos, ir a DLQ
  batchSize: 10,      // Procesar en lotes de 10
  concurrency: 3      // Máximo 3 operaciones concurrentes
};

// ========== QUEUE TYPES ==========

export const QUEUE_TYPES = {
  RESEND_INVITATIONS: 'resend_invitations',
  EXTEND_DEADLINE: 'extend_deadline',
  PAUSE_CAMPAIGNS: 'pause_campaigns',
  ARCHIVE_CAMPAIGNS: 'archive_campaigns',
  SEND_NOTIFICATIONS: 'send_notifications'
};

// ========== QUEUE ITEM ==========

class QueueItem {
  constructor(id, type, data, metadata = {}) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.metadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      nextRetry: null,
      status: 'pending'
    };
  }
  
  incrementAttempt() {
    this.metadata.attempts++;
    this.metadata.lastAttempt = new Date().toISOString();
    
    if (this.metadata.attempts >= QUEUE_CONFIG.maxRetries) {
      this.metadata.status = 'failed';
      this.metadata.nextRetry = null;
    } else {
      this.metadata.status = 'retrying';
      this.metadata.nextRetry = this.calculateNextRetry();
    }
  }
  
  calculateNextRetry() {
    const delay = Math.min(
      QUEUE_CONFIG.initialDelay * Math.pow(QUEUE_CONFIG.backoffMultiplier, this.metadata.attempts),
      QUEUE_CONFIG.maxDelay
    );
    
    return new Date(Date.now() + delay).toISOString();
  }
  
  shouldRetry() {
    return this.metadata.attempts < QUEUE_CONFIG.maxRetries && 
           this.metadata.status !== 'completed' &&
           this.metadata.status !== 'failed';
  }
  
  isReadyForRetry() {
    if (!this.metadata.nextRetry) return false;
    return new Date() >= new Date(this.metadata.nextRetry);
  }
}

// ========== DEAD LETTER QUEUE ==========

class DeadLetterQueue {
  constructor() {
    this.items = new Map();
  }
  
  add(item, reason) {
    const dlqItem = {
      ...item,
      dlqReason: reason,
      dlqTimestamp: new Date().toISOString()
    };
    
    this.items.set(item.id, dlqItem);
    console.log(`[DLQ] Item ${item.id} moved to DLQ: ${reason}`);
  }
  
  getItems() {
    return Array.from(this.items.values());
  }
  
  remove(itemId) {
    return this.items.delete(itemId);
  }
  
  clear() {
    this.items.clear();
  }
}

// ========== BULK ACTION QUEUE ==========

class BulkActionQueue {
  constructor() {
    this.queues = new Map();
    this.dlq = new DeadLetterQueue();
    this.processing = new Set();
    this.startProcessor();
  }
  
  // ========== QUEUE MANAGEMENT ==========
  
  enqueue(type, data, metadata = {}) {
    const id = this.generateId(type, data);
    const item = new QueueItem(id, type, data, metadata);
    
    if (!this.queues.has(type)) {
      this.queues.set(type, new Map());
    }
    
    this.queues.get(type).set(id, item);
    console.log(`[Queue] Enqueued ${type}: ${id}`);
    
    return id;
  }
  
  enqueueBulk(type, items, metadata = {}) {
    const ids = [];
    
    for (const data of items) {
      const id = this.enqueue(type, data, metadata);
      ids.push(id);
    }
    
    console.log(`[Queue] Enqueued ${items.length} items of type ${type}`);
    return ids;
  }
  
  dequeue(type) {
    const queue = this.queues.get(type);
    if (!queue) return null;
    
    for (const [id, item] of queue) {
      if (item.metadata.status === 'pending' || 
          (item.metadata.status === 'retrying' && item.isReadyForRetry())) {
        return item;
      }
    }
    
    return null;
  }
  
  // ========== PROCESSING ==========
  
  async processItem(item) {
    if (this.processing.has(item.id)) {
      return; // Ya está siendo procesado
    }
    
    this.processing.add(item.id);
    
    try {
      console.log(`[Queue] Processing ${item.type}: ${item.id}`);
      
      const result = await this.executeAction(item);
      
      item.metadata.status = 'completed';
      item.metadata.completedAt = new Date().toISOString();
      
      console.log(`[Queue] Completed ${item.type}: ${item.id}`);
      
      return result;
      
    } catch (error) {
      console.error(`[Queue] Error processing ${item.type}: ${item.id}`, error);
      
      item.incrementAttempt();
      
      if (item.metadata.attempts >= QUEUE_CONFIG.dlqThreshold) {
        // Mover a DLQ
        this.dlq.add(item, `Failed after ${item.metadata.attempts} attempts: ${error.message}`);
        this.removeItem(item.type, item.id);
      }
      
      throw error;
      
    } finally {
      this.processing.delete(item.id);
    }
  }
  
  async executeAction(item) {
    switch (item.type) {
      case QUEUE_TYPES.RESEND_INVITATIONS:
        return await this.resendInvitations(item.data);
        
      case QUEUE_TYPES.EXTEND_DEADLINE:
        return await this.extendDeadline(item.data);
        
      case QUEUE_TYPES.PAUSE_CAMPAIGNS:
        return await this.pauseCampaigns(item.data);
        
      case QUEUE_TYPES.ARCHIVE_CAMPAIGNS:
        return await this.archiveCampaigns(item.data);
        
      case QUEUE_TYPES.SEND_NOTIFICATIONS:
        return await this.sendNotifications(item.data);
        
      default:
        throw new Error(`Unknown action type: ${item.type}`);
    }
  }
  
  // ========== ACTION IMPLEMENTATIONS ==========
  
  async resendInvitations(data) {
    const { orgId, assignmentId, customMessage } = data;
    
    // Simular envío de invitación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // En implementación real, llamar al servicio de email
    console.log(`[Action] Resending invitation for assignment ${assignmentId}`);
    
    return {
      success: true,
      assignmentId,
      message: 'Invitation resent successfully'
    };
  }
  
  async extendDeadline(data) {
    const { orgId, assignmentId, extensionDays } = data;
    
    // Simular extensión de plazo
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`[Action] Extending deadline for assignment ${assignmentId} by ${extensionDays} days`);
    
    return {
      success: true,
      assignmentId,
      newDeadline: new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000).toISOString()
    };
  }
  
  async pauseCampaigns(data) {
    const { orgId, campaignId, reason } = data;
    
    // Simular pausa de campaña
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(`[Action] Pausing campaign ${campaignId} for reason: ${reason}`);
    
    return {
      success: true,
      campaignId,
      status: 'paused'
    };
  }
  
  async archiveCampaigns(data) {
    const { orgId, campaignId, archiveTag } = data;
    
    // Simular archivo de campaña
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log(`[Action] Archiving campaign ${campaignId} with tag: ${archiveTag}`);
    
    return {
      success: true,
      campaignId,
      status: 'archived'
    };
  }
  
  async sendNotifications(data) {
    const { orgId, userIds, message, type } = data;
    
    // Simular envío de notificaciones
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log(`[Action] Sending ${type} notifications to ${userIds.length} users`);
    
    return {
      success: true,
      sent: userIds.length,
      type
    };
  }
  
  // ========== PROCESSOR ==========
  
  startProcessor() {
    setInterval(() => {
      this.processQueues();
    }, 5000); // Procesar cada 5 segundos
  }
  
  async processQueues() {
    for (const [type, queue] of this.queues) {
      const items = Array.from(queue.values())
        .filter(item => item.metadata.status === 'pending' || 
                       (item.metadata.status === 'retrying' && item.isReadyForRetry()))
        .slice(0, QUEUE_CONFIG.concurrency);
      
      for (const item of items) {
        this.processItem(item).catch(error => {
          console.error(`[Queue] Failed to process item ${item.id}:`, error);
        });
      }
    }
  }
  
  // ========== UTILITIES ==========
  
  generateId(type, data) {
    const content = `${type}_${JSON.stringify(data)}_${Date.now()}`;
    return createHash('md5').update(content).digest('hex').substring(0, 16);
  }
  
  removeItem(type, id) {
    const queue = this.queues.get(type);
    if (queue) {
      queue.delete(id);
    }
  }
  
  getQueueStatus(type) {
    const queue = this.queues.get(type);
    if (!queue) return { pending: 0, retrying: 0, completed: 0, failed: 0 };
    
    const status = { pending: 0, retrying: 0, completed: 0, failed: 0 };
    
    for (const item of queue.values()) {
      status[item.metadata.status]++;
    }
    
    return status;
  }
  
  getAllQueueStatus() {
    const status = {};
    
    for (const type of this.queues.keys()) {
      status[type] = this.getQueueStatus(type);
    }
    
    return status;
  }
  
  getDLQStatus() {
    return {
      count: this.dlq.getItems().length,
      items: this.dlq.getItems()
    };
  }
  
  // ========== CLEANUP ==========
  
  cleanup() {
    // Limpiar items completados después de 24 horas
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [type, queue] of this.queues) {
      for (const [id, item] of queue) {
        if (item.metadata.status === 'completed' && 
            new Date(item.metadata.completedAt) < cutoff) {
          queue.delete(id);
        }
      }
    }
  }
}

// ========== SINGLETON INSTANCE ==========

const bulkActionQueue = new BulkActionQueue();

// ========== PUBLIC API ==========

export const enqueueBulkAction = (type, items, metadata = {}) => {
  return bulkActionQueue.enqueueBulk(type, items, metadata);
};

export const enqueueAction = (type, data, metadata = {}) => {
  return bulkActionQueue.enqueue(type, data, metadata);
};

export const getQueueStatus = (type) => {
  return bulkActionQueue.getQueueStatus(type);
};

export const getAllQueueStatus = () => {
  return bulkActionQueue.getAllQueueStatus();
};

export const getDLQStatus = () => {
  return bulkActionQueue.getDLQStatus();
};

export const cleanupQueues = () => {
  bulkActionQueue.cleanup();
};

// ========== BULK ACTION HELPERS ==========

export const createBulkResendInvitations = (orgId, assignmentIds, customMessage = '') => {
  const items = assignmentIds.map(assignmentId => ({
    orgId,
    assignmentId,
    customMessage
  }));
  
  return enqueueBulkAction(QUEUE_TYPES.RESEND_INVITATIONS, items, {
    orgId,
    action: 'bulk_resend_invitations',
    totalItems: items.length
  });
};

export const createBulkExtendDeadline = (orgId, assignmentIds, extensionDays) => {
  const items = assignmentIds.map(assignmentId => ({
    orgId,
    assignmentId,
    extensionDays
  }));
  
  return enqueueBulkAction(QUEUE_TYPES.EXTEND_DEADLINE, items, {
    orgId,
    action: 'bulk_extend_deadline',
    totalItems: items.length,
    extensionDays
  });
};

export const createBulkPauseCampaigns = (orgId, campaignIds, reason) => {
  const items = campaignIds.map(campaignId => ({
    orgId,
    campaignId,
    reason
  }));
  
  return enqueueBulkAction(QUEUE_TYPES.PAUSE_CAMPAIGNS, items, {
    orgId,
    action: 'bulk_pause_campaigns',
    totalItems: items.length,
    reason
  });
};

export const createBulkArchiveCampaigns = (orgId, campaignIds, archiveTag) => {
  const items = campaignIds.map(campaignId => ({
    orgId,
    campaignId,
    archiveTag
  }));
  
  return enqueueBulkAction(QUEUE_TYPES.ARCHIVE_CAMPAIGNS, items, {
    orgId,
    action: 'bulk_archive_campaigns',
    totalItems: items.length,
    archiveTag
  });
};

export default {
  QUEUE_TYPES,
  enqueueBulkAction,
  enqueueAction,
  getQueueStatus,
  getAllQueueStatus,
  getDLQStatus,
  cleanupQueues,
  createBulkResendInvitations,
  createBulkExtendDeadline,
  createBulkPauseCampaigns,
  createBulkArchiveCampaigns
};
