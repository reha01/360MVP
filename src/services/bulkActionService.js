/**
 * BulkActionService - Servicio para acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones idempotente
 * - Extensión de deadlines
 * - Colas con backoff + DLQ
 * - Auditoría completa
 * - Progreso en tiempo real
 */

import evaluatorAssignmentService from './evaluatorAssignmentService';
import observabilityService from './observabilityService';

class BulkActionService {
  constructor() {
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.dlq = [];
    this.maxRetries = 3;
    this.backoffConfig = {
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: true
    };
  }
  
  /**
   * Reenviar invitaciones de forma masiva
   */
  async resendInvitations(orgId, assignmentIds, options = {}) {
    const jobId = `resend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Registrar inicio del job
      await observabilityService.logEvent('bulk_action_started', {
        orgId,
        jobId,
        actionType: 'resend_invitations',
        assignmentCount: assignmentIds.length,
        timestamp: new Date().toISOString()
      });
      
      // Procesar asignaciones en lotes
      const batchSize = 10;
      const results = [];
      let processed = 0;
      
      for (let i = 0; i < assignmentIds.length; i += batchSize) {
        const batch = assignmentIds.slice(i, i + batchSize);
        
        // Procesar lote en paralelo
        const batchResults = await Promise.allSettled(
          batch.map(assignmentId => this.processResendInvitation(orgId, assignmentId, options))
        );
        
        // Procesar resultados del lote
        batchResults.forEach((result, index) => {
          const assignmentId = batch[index];
          
          if (result.status === 'fulfilled') {
            results.push({
              assignmentId,
              status: 'success',
              message: result.value.message,
              timestamp: new Date().toISOString()
            });
          } else {
            results.push({
              assignmentId,
              status: 'error',
              error: result.reason.message,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        processed += batch.length;
        
        // Actualizar progreso
        const progress = Math.round((processed / assignmentIds.length) * 100);
        options.onProgress?.(progress);
        
        // Pequeña pausa entre lotes para evitar sobrecarga
        if (i + batchSize < assignmentIds.length) {
          await this.delay(100);
        }
      }
      
      // Registrar finalización del job
      await observabilityService.logEvent('bulk_action_completed', {
        orgId,
        jobId,
        actionType: 'resend_invitations',
        totalProcessed: assignmentIds.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length,
        timestamp: new Date().toISOString()
      });
      
      return results;
      
    } catch (error) {
      console.error('[BulkActionService] Error in resendInvitations:', error);
      
      // Registrar error del job
      await observabilityService.logEvent('bulk_action_failed', {
        orgId,
        jobId,
        actionType: 'resend_invitations',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  /**
   * Procesar reenvío de invitación individual
   */
  async processResendInvitation(orgId, assignmentId, options = {}) {
    try {
      // Verificar si ya se envió recientemente (idempotencia)
      const assignment = await evaluatorAssignmentService.getEvaluatorAssignment(orgId, assignmentId);
      
      if (!assignment) {
        throw new Error('Assignment not found');
      }
      
      // Verificar si ya se envió en las últimas 5 minutos
      const lastSent = assignment.lastInvitationSent;
      if (lastSent) {
        const timeSinceLastSent = Date.now() - new Date(lastSent).getTime();
        if (timeSinceLastSent < 5 * 60 * 1000) { // 5 minutos
          return {
            message: 'Invitation already sent recently, skipped',
            skipped: true
          };
        }
      }
      
      // Reenviar invitación
      await evaluatorAssignmentService.resendInvitation(
        orgId,
        assignmentId,
        options.customMessage
      );
      
      return {
        message: 'Invitation resent successfully'
      };
      
    } catch (error) {
      console.error(`[BulkActionService] Error processing resend for ${assignmentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Extender deadlines de forma masiva
   */
  async extendDeadlines(orgId, assignmentIds, extensionDays, options = {}) {
    const jobId = `extend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Registrar inicio del job
      await observabilityService.logEvent('bulk_action_started', {
        orgId,
        jobId,
        actionType: 'extend_deadlines',
        assignmentCount: assignmentIds.length,
        extensionDays,
        timestamp: new Date().toISOString()
      });
      
      // Procesar asignaciones en lotes
      const batchSize = 10;
      const results = [];
      let processed = 0;
      
      for (let i = 0; i < assignmentIds.length; i += batchSize) {
        const batch = assignmentIds.slice(i, i + batchSize);
        
        // Procesar lote en paralelo
        const batchResults = await Promise.allSettled(
          batch.map(assignmentId => this.processExtendDeadline(orgId, assignmentId, extensionDays))
        );
        
        // Procesar resultados del lote
        batchResults.forEach((result, index) => {
          const assignmentId = batch[index];
          
          if (result.status === 'fulfilled') {
            results.push({
              assignmentId,
              status: 'success',
              message: result.value.message,
              newDeadline: result.value.newDeadline,
              timestamp: new Date().toISOString()
            });
          } else {
            results.push({
              assignmentId,
              status: 'error',
              error: result.reason.message,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        processed += batch.length;
        
        // Actualizar progreso
        const progress = Math.round((processed / assignmentIds.length) * 100);
        options.onProgress?.(progress);
        
        // Pequeña pausa entre lotes
        if (i + batchSize < assignmentIds.length) {
          await this.delay(100);
        }
      }
      
      // Registrar finalización del job
      await observabilityService.logEvent('bulk_action_completed', {
        orgId,
        jobId,
        actionType: 'extend_deadlines',
        totalProcessed: assignmentIds.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length,
        extensionDays,
        timestamp: new Date().toISOString()
      });
      
      return results;
      
    } catch (error) {
      console.error('[BulkActionService] Error in extendDeadlines:', error);
      
      // Registrar error del job
      await observabilityService.logEvent('bulk_action_failed', {
        orgId,
        jobId,
        actionType: 'extend_deadlines',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  /**
   * Procesar extensión de deadline individual
   */
  async processExtendDeadline(orgId, assignmentId, extensionDays) {
    try {
      // Extender deadline
      await evaluatorAssignmentService.extendDeadline(orgId, assignmentId, extensionDays);
      
      // Obtener la nueva fecha de deadline
      const assignment = await evaluatorAssignmentService.getEvaluatorAssignment(orgId, assignmentId);
      
      return {
        message: `Deadline extended by ${extensionDays} days`,
        newDeadline: assignment.deadline
      };
      
    } catch (error) {
      console.error(`[BulkActionService] Error processing extend deadline for ${assignmentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Agregar job a la cola
   */
  async queueJob(job) {
    this.jobQueue.push({
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempts: 0
    });
    
    // Procesar cola si no hay jobs activos
    if (this.activeJobs.size === 0) {
      this.processQueue();
    }
  }
  
  /**
   * Procesar cola de jobs
   */
  async processQueue() {
    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      
      try {
        this.activeJobs.set(job.id, job);
        job.status = 'processing';
        
        // Ejecutar job
        await this.executeJob(job);
        
        job.status = 'completed';
        this.activeJobs.delete(job.id);
        
      } catch (error) {
        console.error(`[BulkActionService] Job ${job.id} failed:`, error);
        
        job.attempts++;
        job.lastError = error.message;
        
        if (job.attempts >= this.maxRetries) {
          // Mover a DLQ
          job.status = 'failed';
          job.movedToDLQ = new Date().toISOString();
          this.dlq.push(job);
          
          await observabilityService.logEvent('job_moved_to_dlq', {
            jobId: job.id,
            jobType: job.type,
            attempts: job.attempts,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        } else {
          // Reintentar con backoff
          const delay = this.calculateBackoffDelay(job.attempts);
          job.status = 'retrying';
          job.nextRetry = new Date(Date.now() + delay).toISOString();
          
          setTimeout(() => {
            this.jobQueue.unshift(job);
            this.processQueue();
          }, delay);
        }
        
        this.activeJobs.delete(job.id);
      }
    }
  }
  
  /**
   * Ejecutar job
   */
  async executeJob(job) {
    switch (job.type) {
      case 'resend_invitations':
        return await this.resendInvitations(job.orgId, job.assignmentIds, job.options);
      case 'extend_deadlines':
        return await this.extendDeadlines(job.orgId, job.assignmentIds, job.extensionDays, job.options);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }
  
  /**
   * Calcular delay de backoff
   */
  calculateBackoffDelay(attempt) {
    const { initialDelay, maxDelay, multiplier, jitter } = this.backoffConfig;
    
    let delay = initialDelay * Math.pow(multiplier, attempt - 1);
    delay = Math.min(delay, maxDelay);
    
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }
  
  /**
   * Obtener estado de la cola
   */
  getQueueStatus() {
    return {
      queued: this.jobQueue.length,
      active: this.activeJobs.size,
      dlq: this.dlq.length,
      activeJobs: Array.from(this.activeJobs.values())
    };
  }
  
  /**
   * Limpiar DLQ
   */
  clearDLQ() {
    const clearedCount = this.dlq.length;
    this.dlq = [];
    
    observabilityService.logEvent('dlq_cleared', {
      clearedCount,
      timestamp: new Date().toISOString()
    });
    
    return clearedCount;
  }
  
  /**
   * Reintentar jobs de DLQ
   */
  async retryDLQJobs(jobIds = null) {
    const jobsToRetry = jobIds 
      ? this.dlq.filter(job => jobIds.includes(job.id))
      : this.dlq;
    
    const retriedJobs = [];
    
    for (const job of jobsToRetry) {
      job.attempts = 0;
      job.status = 'queued';
      job.nextRetry = null;
      job.movedToDLQ = null;
      
      this.jobQueue.push(job);
      retriedJobs.push(job);
    }
    
    // Remover de DLQ
    this.dlq = this.dlq.filter(job => !retriedJobs.includes(job));
    
    // Procesar cola si no hay jobs activos
    if (this.activeJobs.size === 0) {
      this.processQueue();
    }
    
    return retriedJobs;
  }
  
  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new BulkActionService();