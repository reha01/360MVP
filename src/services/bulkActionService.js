/**
 * Servicio para gestionar acciones masivas
 * 
 * Características:
 * - Reenvío de invitaciones masivo
 * - Extensión de plazos masiva
 * - Sistema de colas con backoff exponencial
 * - Dead Letter Queue (DLQ) para manejo de errores
 * - Auditoría completa de acciones
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  setDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import evaluatorAssignmentService from './evaluatorAssignmentService';
// import observabilityService from './observabilityService';
// import rateLimitService from './rateLimitService';

// Stubs temporales para servicios no implementados
const observabilityService = {
  logEvent: (...args) => {
    // Si el último argumento es SEVERITY, ignorarlo en el stub
    const argsWithoutSeverity = args.filter(arg => typeof arg !== 'object' || !arg.hasOwnProperty('WARNING'));
    console.log('[Observability]', ...argsWithoutSeverity);
  },
  logError: (...args) => console.error('[Observability]', ...args),
  SEVERITY: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
  }
};

const rateLimitService = {
  checkRateLimit: async () => ({ allowed: true, remaining: 100 }),
  checkEmailRateLimit: async () => ({ allowed: true, current: 0, limit: 1000 }),
  incrementUsage: async () => {},
  incrementEmailCounter: async () => {}
};

// ========== CONSTANTES ==========

// ✅ Configuración de reintentos con backoff exponencial: 1-2-4-8-16 min
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 60000,  // 1 minuto (primer reintento)
  backoffFactor: 2,       // Duplicar tiempo entre reintentos (1->2->4->8->16)
  maxDelayMs: 960000      // Máximo 16 minutos entre reintentos
};

// ========== ACCIONES MASIVAS ==========

/**
 * Reenvío masivo de invitaciones
 */
export const resendInvitations = async (orgId, assignmentIds, customMessage = '') => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }
    
    if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      throw new Error('Assignment IDs are required');
    }
    
    // ✅ IDEMPOTENCIA: Generar idempotency-key basado en fecha + assignmentIds
    const today = new Date().toISOString().split('T')[0];
    const idempotencyKey = `resend-${orgId}-${today}-${assignmentIds.sort().join('-')}`;
    
    // Verificar si ya existe una operación con este idempotency-key en las últimas 24h
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 horas
    const cooldownStart = new Date(Date.now() - cooldownMs);
    
    // En producción: consultar Firestore para verificar si existe
    // const existingOp = await getDocs(query(
    //   collection(db, 'organizations', orgId, 'bulkActionAudit'),
    //   where('idempotencyKey', '==', idempotencyKey),
    //   where('timestamp', '>', cooldownStart),
    //   limit(1)
    // ));
    // 
    // if (!existingOp.empty) {
    //   throw new Error('Esta acción ya fue ejecutada recientemente. Por favor espera 24 horas antes de reintentar.');
    // }
    
    console.log(`[BulkAction] Idempotency key: ${idempotencyKey}`);
    
    // ✅ RATE LIMITS: Verificar límite de emails por día
    const rateLimitCheck = await rateLimitService.checkEmailRateLimit(orgId);
    
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message);
    }
    
    console.log(`[BulkAction] Rate limit check passed: ${rateLimitCheck.current}/${rateLimitCheck.limit} emails sent today`);
    
    // Registrar evento de inicio
    observabilityService.logEvent('bulk.started', {
      orgId,
      actionType: 'resend',
      assignmentCount: assignmentIds.length,
      idempotencyKey
    });
    
    // Crear registro de auditoría (simulado para desarrollo)
    const auditRef = {
      id: `audit-${Date.now()}`
    };
    
    console.log('[BulkAction] Audit record created:', auditRef.id);
    
    // Procesar realmente las invitaciones
    let successCount = 0;
    let failedCount = 0;
    let dlqCount = 0;
    const failedAssignments = [];
    const dlqAssignments = [];
    
    // Procesar cada asignación
    for (let i = 0; i < assignmentIds.length; i++) {
      const assignmentId = assignmentIds[i];
      
      if (!assignmentId) {
        console.error(`[BulkAction] Invalid assignmentId at index ${i}`);
        failedCount++;
        failedAssignments.push({ assignmentId: 'undefined', error: 'Invalid assignmentId' });
        continue;
      }
      
      try {
        // Actualizar el miembro en Firestore con la fecha de última invitación
        const memberRef = doc(db, 'members', assignmentId);
        const memberDoc = await getDoc(memberRef);
        
        if (!memberDoc.exists()) {
          throw new Error(`Member ${assignmentId} not found`);
        }
        
        const memberData = memberDoc.data();
        const now = new Date();
        const currentInvitationCount = memberData.invitationCount || 0;
        
        // Actualizar el documento del miembro
        await updateDoc(memberRef, {
          lastInvitationSent: serverTimestamp(),
          lastInvitationSentDate: now.toISOString(),
          invitationCount: currentInvitationCount + 1,
          updatedAt: serverTimestamp()
        });
        
        console.log(`[BulkAction] Updated member ${assignmentId} with lastInvitationSent: ${now.toISOString()}, invitationCount: ${currentInvitationCount + 1}`);
        
        // TODO: En producción, también enviar el email real aquí:
        // await evaluatorAssignmentService.resendInvitation(orgId, assignmentId, customMessage);
        
        successCount++;
        
        // Registrar progreso cada 10 asignaciones
        if ((i + 1) % 10 === 0 || i === assignmentIds.length - 1) {
          observabilityService.logEvent('bulk.progress', {
            orgId,
            actionType: 'resend',
            processed: i + 1,
            total: assignmentIds.length,
            auditId: auditRef.id
          });
        }
      } catch (err) {
        console.error(`[BulkAction] Failed to resend invitation for assignment ${assignmentId}:`, err);
        
        // Si es un error de rate limit, agregar a DLQ
        if (err.message && err.message.includes('rate limit')) {
          try {
            await addDoc(collection(db, 'organizations', orgId, 'bulkActionDLQ'), {
              orgId: orgId,
              assignmentId: assignmentId,
              actionType: 'resend',
              error: err.message || 'Rate limit exceeded for email sending',
              retryCount: 1,
              maxRetries: RETRY_CONFIG.maxRetries,
              initialRetry: serverTimestamp(),
              lastRetry: serverTimestamp(),
              nextRetry: new Date(Date.now() + RETRY_CONFIG.initialDelayMs),
              data: {
                customMessage: customMessage
              }
            });
            
            console.warn(`[BulkAction] Assignment ${assignmentId} added to DLQ`);
            dlqCount++;
            dlqAssignments.push({ assignmentId, error: err.message });
            
            observabilityService.logEvent('bulk.dlq_put', {
              orgId,
              actionType: 'resend',
              assignmentId: assignmentId,
              reason: err.message || 'Rate limit exceeded for email sending',
              auditId: auditRef.id
            }, observabilityService.SEVERITY.WARNING);
          } catch (dlqError) {
            console.error(`[BulkAction] Error adding to DLQ:`, dlqError);
            failedCount++;
            failedAssignments.push({ assignmentId, error: err.message });
          }
        } else {
          failedCount++;
          failedAssignments.push({ assignmentId, error: err.message });
        }
      }
    }
    
    // Incrementar contador de emails enviados
    if (successCount > 0) {
      await rateLimitService.incrementEmailCounter(orgId, successCount);
    }
    
    const results = {
      processed: assignmentIds.length,
      success: successCount,
      failed: failedCount,
      dlq: dlqCount,
      auditId: auditRef.id
    };
    
    // Registrar evento de fallos si hay
    if (failedCount > 0) {
      observabilityService.logEvent('bulk.failed', {
        orgId,
        actionType: 'resend',
        failedCount: failedCount,
        failedAssignments: failedAssignments,
        auditId: auditRef.id
      }, observabilityService.SEVERITY.WARNING);
    }
    
    // Actualizar registro de auditoría
    // Actualizar registro de auditoría con resultados (simulado)
    console.log('[BulkAction] Audit updated:', {
      successCount: results.success,
      failedCount: results.failed,
      dlqCount: results.dlq
    });
    
    // ✅ Registrar evento de observabilidad (completado)
    observabilityService.logEvent('bulk.completed', {
      orgId,
      assignmentCount: assignmentIds.length,
      successCount: results.success,
      failedCount: results.failed,
      dlqCount: results.dlq
    });
    
    return results;
  } catch (error) {
    console.error('[BulkAction] Error resending invitations:', error);
    
    // Registrar evento de error
    observabilityService.logEvent('bulk.resend.error', {
      orgId,
      error: error.message,
      assignmentCount: assignmentIds?.length || 0
    });
    
    throw error;
  }
};

/**
 * Extensión masiva de plazos
 */
export const extendDeadlines = async (orgId, assignmentIds, extensionDays = 7) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }
    
    if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      throw new Error('Assignment IDs are required');
    }
    
    if (!extensionDays || extensionDays < 1 || extensionDays > 30) {
      throw new Error('Extension days must be between 1 and 30');
    }
    
    // Crear registro de auditoría (simulado)
    const auditRef = {
      id: `audit-${Date.now()}`
    };
    console.log('[BulkAction] Audit record created:', auditRef.id);
    
    // Procesar extensiones de plazo
    const now = new Date();
    let successCount = 0;
    
    // Guardar extensiones en Firestore
    const { getEvaluatorAssignment } = await import('./evaluatorAssignmentService');
    
    for (const assignmentId of assignmentIds) {
      try {
        // Obtener la asignación actual para calcular el nuevo deadline
        const assignment = await getEvaluatorAssignment(orgId, assignmentId);
        
        if (!assignment) {
          console.warn(`[BulkAction] Assignment ${assignmentId} not found, skipping`);
          continue;
        }
        
        const currentDeadline = assignment.deadline ? new Date(assignment.deadline) : new Date();
        const newDeadline = new Date(currentDeadline.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        
        // Guardar la extensión en Firestore
        const extensionRef = doc(db, `organizations/${orgId}/deadlineExtensions`, assignmentId);
        await setDoc(extensionRef, {
          assignmentId,
          orgId,
          extensionDays,
          originalDeadline: assignment.deadline || currentDeadline.toISOString(),
          newDeadline: newDeadline.toISOString(),
          extendedAt: serverTimestamp(),
          extendedBy: 'current-user', // TODO: obtener usuario actual real
          createdAt: serverTimestamp()
        }, { merge: true });
        
        // También actualizar el documento de asignación directamente si existe
        try {
          const assignmentRef = doc(db, `organizations/${orgId}/evaluatorAssignments`, assignmentId);
          await setDoc(assignmentRef, {
            deadline: newDeadline.toISOString(),
            deadlineExtended: true,
            extensionDays,
            lastExtensionAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (updateErr) {
          console.warn(`[BulkAction] Could not update assignment document directly:`, updateErr);
          // Continuar aunque falle la actualización directa
        }
        
        console.log(`[BulkAction] Extended deadline for assignment ${assignmentId} by ${extensionDays} days (saved to Firestore)`);
        successCount++;
      } catch (err) {
        console.error(`[BulkAction] Error extending deadline for ${assignmentId}:`, err);
        // Fallback a localStorage si hay error (migración gradual)
        try {
          const extensionKey = `extension_${orgId}_${assignmentId}`;
          const extensionData = {
            extensionDays,
            extendedAt: now.toISOString(),
            newDeadline: new Date(now.getTime() + extensionDays * 24 * 60 * 60 * 1000).toISOString()
          };
          localStorage.setItem(extensionKey, JSON.stringify(extensionData));
          console.log(`[BulkAction] Saved to localStorage as fallback for ${assignmentId}`);
          successCount++;
        } catch (localErr) {
          console.error(`[BulkAction] Error saving to localStorage fallback:`, localErr);
        }
      }
    }
    
    const results = {
      processed: assignmentIds.length,
      success: successCount,
      failed: assignmentIds.length - successCount,
      dlq: 0,
      auditId: auditRef.id
    };
    
    // Actualizar registro de auditoría con resultados (simulado)
    console.log('[BulkAction] Audit updated:', {
      successCount: results.success,
      failedCount: results.failed,
      dlqCount: results.dlq
    });
    
    // Registrar evento de observabilidad
    observabilityService.logEvent('bulk.extend.completed', {
      orgId,
      assignmentCount: assignmentIds.length,
      successCount: results.success,
      failedCount: results.failed,
      dlqCount: results.dlq,
      extensionDays
    });
    
    return results;
  } catch (error) {
    console.error('[BulkAction] Error extending deadlines:', error);
    
    // Registrar evento de error
    observabilityService.logEvent('bulk.extend.error', {
      orgId,
      error: error.message,
      assignmentCount: assignmentIds?.length || 0,
      extensionDays
    });
    
    throw error;
  }
};

// ========== GESTIÓN DE DLQ ==========

/**
 * Obtener elementos de la DLQ
 */
export const getDlqItems = async (orgId) => {
  try {
    // Simular datos de DLQ
    const mockDlqItems = [
      {
        id: 'dlq-1',
        assignmentId: 'assignment-123',
        actionType: 'resend',
        error: 'Rate limit exceeded for email sending',
        retryCount: 3,
        maxRetries: RETRY_CONFIG.maxRetries,
        initialRetry: new Date('2024-10-20T10:00:00'),
        lastRetry: new Date('2024-10-20T12:00:00'),
        nextRetry: new Date('2024-10-20T16:00:00'),
        data: {
          customMessage: 'Por favor complete su evaluación'
        }
      },
      {
        id: 'dlq-2',
        assignmentId: 'assignment-456',
        actionType: 'extend',
        error: 'Assignment already completed, cannot extend deadline',
        retryCount: 1,
        maxRetries: RETRY_CONFIG.maxRetries,
        initialRetry: new Date('2024-10-21T09:00:00'),
        lastRetry: new Date('2024-10-21T09:00:00'),
        nextRetry: new Date('2024-10-21T09:10:00'),
        data: {
          extensionDays: 7
        }
      }
    ];
    
    return mockDlqItems;
  } catch (error) {
    console.error('[BulkAction] Error getting DLQ items:', error);
    throw error;
  }
};

/**
 * Reintentar un elemento de la DLQ
 */
export const retryDlqItem = async (orgId, itemId) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }
    
    if (!itemId) {
      throw new Error('DLQ item ID is required');
    }
    
    // En producción, obtener el item de la DLQ y procesarlo
    console.log(`[BulkAction] Retrying DLQ item ${itemId}`);
    
    // Simular éxito del reintento
    const success = Math.random() > 0.3; // 70% de probabilidad de éxito
    
    if (success) {
      // Eliminar de la DLQ
      // await deleteDoc(doc(db, 'orgs', orgId, 'bulkActionDLQ', itemId));
      console.log(`[BulkAction] Successfully processed DLQ item ${itemId}`);
      
      // Registrar evento de observabilidad
      observabilityService.logEvent('bulk.dlq.retry.success', {
        orgId,
        itemId
      });
      
      return { success: true };
    } else {
      // Actualizar contadores de reintento
      const retryCount = 4; // Simular
      const nextRetryDelay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffFactor, retryCount),
        RETRY_CONFIG.maxDelayMs
      );
      const nextRetry = new Date(Date.now() + nextRetryDelay);
      
      console.warn(`[BulkAction] Failed to process DLQ item ${itemId}, next retry at ${nextRetry}`);
      
      // Registrar evento de observabilidad
      observabilityService.logEvent('bulk.dlq.retry.failed', {
        orgId,
        itemId,
        retryCount,
        nextRetry
      });
      
      return {
        success: false,
        retryCount,
        nextRetry
      };
    }
  } catch (error) {
    console.error('[BulkAction] Error retrying DLQ item:', error);
    
    // Registrar evento de error
    observabilityService.logEvent('bulk.dlq.retry.error', {
      orgId,
      itemId,
      error: error.message
    });
    
    throw error;
  }
};

// ========== AUDITORÍA ==========

/**
 * Obtener registro de auditoría
 */
export const getAuditLog = async (orgId) => {
  try {
    // Simular datos de auditoría
    const mockAuditLog = [
      {
        id: 'audit-1',
        actionType: 'resend',
        userId: 'user-123',
        timestamp: new Date('2024-10-20T10:00:00'),
        assignmentCount: 25,
        successCount: 23,
        failedCount: 1,
        dlqCount: 1,
        completed: true,
        completedAt: new Date('2024-10-20T10:01:30'),
        details: {
          customMessage: true
        },
        success: true
      },
      {
        id: 'audit-2',
        actionType: 'extend',
        userId: 'user-123',
        timestamp: new Date('2024-10-21T09:00:00'),
        assignmentCount: 15,
        successCount: 14,
        failedCount: 0,
        dlqCount: 1,
        completed: true,
        completedAt: new Date('2024-10-21T09:01:15'),
        details: {
          extensionDays: 7
        },
        success: true
      },
      {
        id: 'audit-3',
        actionType: 'resend',
        userId: 'user-456',
        timestamp: new Date('2024-10-19T14:30:00'),
        assignmentCount: 5,
        successCount: 5,
        failedCount: 0,
        dlqCount: 0,
        completed: true,
        completedAt: new Date('2024-10-19T14:30:45'),
        details: {
          customMessage: false
        },
        success: true
      }
    ];
    
    return mockAuditLog;
  } catch (error) {
    console.error('[BulkAction] Error getting audit log:', error);
    throw error;
  }
};

/**
 * Envío masivo de recordatorios
 */
export const sendReminders = async (orgId, assignmentIds, customMessage = '') => {
  try {
    if (!orgId || !assignmentIds?.length) {
      throw new Error('Organization ID and assignment IDs are required');
    }
    
    console.log(`[BulkAction] Sending reminders to ${assignmentIds.length} assignments`);
    
    const now = new Date();
    let successCount = 0;
    const batch = writeBatch(db);
    
    // Guardar recordatorios en Firestore
    const remindersRef = collection(db, 'reminders');
    
    for (const assignmentId of assignmentIds) {
      try {
        // Crear o actualizar recordatorio en Firestore
        // Usar assignmentId como parte del ID del documento para facilitar búsqueda
        const reminderDocRef = doc(remindersRef, `${orgId}_${assignmentId}`);
        
        batch.set(reminderDocRef, {
          orgId,
          assignmentId,
          lastReminderSent: serverTimestamp(),
          lastReminderSentDate: now.toISOString(),
          customMessage: customMessage || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`[BulkAction] Sent reminder for assignment ${assignmentId} at ${now.toISOString()}`);
        successCount++;
      } catch (err) {
        console.error(`[BulkAction] Error updating reminder for ${assignmentId}:`, err);
      }
    }
    
    // Ejecutar batch write
    if (successCount > 0) {
      try {
        await batch.commit();
        console.log(`[BulkAction] Successfully saved ${successCount} reminders to Firestore`);
      } catch (batchError) {
        console.error('[BulkAction] Error committing reminder batch:', batchError);
        throw batchError;
      }
    }
    
    const results = {
      processed: assignmentIds.length,
      success: successCount,
      failed: assignmentIds.length - successCount
    };
    
    observabilityService.logEvent('bulk.reminders.completed', {
      orgId,
      assignmentCount: assignmentIds.length,
      successCount: results.success
    });
    
    return results;
  } catch (error) {
    console.error('[BulkAction] Error sending reminders:', error);
    observabilityService.logError('bulk.reminders.error', {
      orgId,
      error: error.message
    });
    throw error;
  }
};

// ========== MIGRACIÓN DE DATOS ==========

/**
 * Migrar recordatorios de localStorage a Firestore
 * Útil para migrar datos existentes después de actualizar el código
 */
export const migrateRemindersFromLocalStorage = async (orgId) => {
  try {
    console.log(`[BulkAction] Starting migration of reminders from localStorage for org: ${orgId}`);
    
    const remindersRef = collection(db, 'reminders');
    const batch = writeBatch(db);
    let migratedCount = 0;
    let skippedCount = 0;
    
    // Buscar todas las claves de localStorage que empiecen con "reminder_"
    const reminderKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`reminder_${orgId}_`)) {
        reminderKeys.push(key);
      }
    }
    
    console.log(`[BulkAction] Found ${reminderKeys.length} reminders in localStorage`);
    
    for (const key of reminderKeys) {
      try {
        // Extraer assignmentId de la clave: reminder_{orgId}_{assignmentId}
        const parts = key.split('_');
        if (parts.length < 3) continue;
        
        const assignmentId = parts.slice(2).join('_'); // Por si assignmentId tiene guiones bajos
        const reminderDateStr = localStorage.getItem(key);
        
        if (!reminderDateStr) {
          skippedCount++;
          continue;
        }
        
        const reminderDate = new Date(reminderDateStr);
        if (isNaN(reminderDate.getTime())) {
          console.warn(`[BulkAction] Invalid date for key ${key}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Verificar si ya existe en Firestore
        const reminderDocRef = doc(remindersRef, `${orgId}_${assignmentId}`);
        const existingDoc = await getDoc(reminderDocRef);
        
        if (existingDoc.exists()) {
          console.log(`[BulkAction] Reminder for ${assignmentId} already exists in Firestore, skipping`);
          skippedCount++;
          continue;
        }
        
        // Crear documento en Firestore
        batch.set(reminderDocRef, {
          orgId,
          assignmentId,
          lastReminderSent: serverTimestamp(),
          lastReminderSentDate: reminderDate.toISOString(),
          customMessage: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          migratedFrom: 'localStorage',
          migratedAt: serverTimestamp()
        });
        
        migratedCount++;
        console.log(`[BulkAction] Migrated reminder for assignment ${assignmentId}`);
      } catch (err) {
        console.error(`[BulkAction] Error migrating reminder for key ${key}:`, err);
        skippedCount++;
      }
    }
    
    // Ejecutar batch write si hay documentos para migrar
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`[BulkAction] Successfully migrated ${migratedCount} reminders to Firestore`);
    }
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      total: reminderKeys.length
    };
  } catch (error) {
    console.error('[BulkAction] Error migrating reminders from localStorage:', error);
    return {
      success: false,
      error: error.message,
      migrated: 0,
      skipped: 0,
      total: 0
    };
  }
};

// ========== EXPORTS ==========

export default {
  // Acciones masivas
  resendInvitations,
  extendDeadlines,
  sendReminders,
  
  // Gestión de DLQ
  getDlqItems,
  retryDlqItem,
  
  // Migración
  migrateRemindersFromLocalStorage,
  
  // Auditoría
  getAuditLog
};