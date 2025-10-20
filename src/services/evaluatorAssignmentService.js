/**
 * Servicio para gestión de EvaluatorAssignments
 * 
 * Maneja CRUD de asignaciones de evaluadores, generación de tokens,
 * y envío de invitaciones
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  createEvaluatorAssignmentModel, 
  validateEvaluatorAssignment,
  generateSecureToken,
  hashToken,
  validateTokenFormat,
  isTokenExpired,
  canUseToken,
  EVALUATOR_ASSIGNMENT_STATUS,
  EVALUATOR_TYPE
} from '../models/EvaluatorAssignment';
import campaignService from './campaignService';
import jobFamilyService from './jobFamilyService';
import orgStructureService from './orgStructureService';

// ========== EVALUATOR ASSIGNMENT MANAGEMENT ==========

/**
 * Obtener asignaciones de evaluadores de una sesión 360°
 */
export const getSessionAssignments = async (orgId, session360Id) => {
  try {
    const assignmentsRef = collection(db, 'orgs', orgId, 'evaluatorAssignments');
    const q = query(
      assignmentsRef,
      where('session360Id', '==', session360Id),
      orderBy('evaluatorType', 'asc'),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[EvaluatorAssignment] Loaded ${assignments.length} assignments for session ${session360Id}`);
    return assignments;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error loading session assignments:', error);
    throw new Error(`Error loading session assignments: ${error.message}`);
  }
};

/**
 * Obtener asignación específica
 */
export const getEvaluatorAssignment = async (orgId, assignmentId) => {
  try {
    const assignmentRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', assignmentId);
    const snapshot = await getDoc(assignmentRef);
    
    if (!snapshot.exists()) {
      throw new Error(`EvaluatorAssignment ${assignmentId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[EvaluatorAssignment] Error loading assignment:', error);
    throw error;
  }
};

/**
 * Obtener asignación por token
 */
export const getAssignmentByToken = async (token) => {
  try {
    if (!validateTokenFormat(token)) {
      throw new Error('Invalid token format');
    }
    
    const tokenHash = hashToken(token);
    
    // Buscar en todas las organizaciones (en implementación real, optimizar)
    const orgsSnapshot = await getDocs(collection(db, 'orgs'));
    
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const assignmentsRef = collection(db, 'orgs', orgId, 'evaluatorAssignments');
      const q = query(assignmentsRef, where('tokenHash', '==', tokenHash));
      
      const assignmentsSnapshot = await getDocs(q);
      
      if (!assignmentsSnapshot.empty) {
        const assignment = assignmentsSnapshot.docs[0];
        return {
          id: assignment.id,
          orgId,
          ...assignment.data()
        };
      }
    }
    
    throw new Error('Assignment not found for token');
  } catch (error) {
    console.error('[EvaluatorAssignment] Error loading assignment by token:', error);
    throw error;
  }
};

/**
 * Crear asignación de evaluador
 */
export const createEvaluatorAssignment = async (orgId, assignmentData, userId) => {
  try {
    // Validar datos
    const validation = validateEvaluatorAssignment(assignmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Crear asignación
    const newAssignment = createEvaluatorAssignmentModel({
      ...assignmentData,
      orgId,
      createdBy: userId
    });
    
    // Crear en Firestore
    const assignmentRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', newAssignment.assignmentId);
    await updateDoc(assignmentRef, {
      ...newAssignment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[EvaluatorAssignment] Created assignment: ${newAssignment.evaluatorEmail} (${newAssignment.assignmentId})`);
    return newAssignment;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error creating assignment:', error);
    throw error;
  }
};

/**
 * Actualizar asignación de evaluador
 */
export const updateEvaluatorAssignment = async (orgId, assignmentId, updates, userId) => {
  try {
    // Obtener asignación actual
    const currentAssignment = await getEvaluatorAssignment(orgId, assignmentId);
    
    // Crear asignación actualizada
    const updatedAssignment = {
      ...currentAssignment,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Actualizar en Firestore
    const assignmentRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', assignmentId);
    await updateDoc(assignmentRef, updatedAssignment);
    
    console.log(`[EvaluatorAssignment] Updated assignment: ${assignmentId}`);
    return updatedAssignment;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error updating assignment:', error);
    throw error;
  }
};

/**
 * Generar asignaciones automáticas para una sesión 360°
 */
export const generateSessionAssignments = async (orgId, session360Id, sessionData) => {
  try {
    const batch = writeBatch(db);
    const assignments = [];
    
    // Obtener información del evaluado
    const evaluatee = await orgStructureService.getOrgUser(orgId, sessionData.evaluateeId);
    if (!evaluatee) {
      throw new Error(`Evaluatee ${sessionData.evaluateeId} not found`);
    }
    
    // Obtener Job Family del evaluado para configuración
    const jobFamilies = await jobFamilyService.getOrgJobFamilies(orgId);
    const userJobFamily = evaluatee.jobFamilyIds && evaluatee.jobFamilyIds.length > 0 
      ? jobFamilies.find(f => evaluatee.jobFamilyIds.includes(f.id))
      : null;
    
    // Generar asignaciones según configuración
    const config = sessionData.evaluatorConfig;
    
    // 1. Autoevaluación
    if (config.self.required) {
      const selfAssignment = createEvaluatorAssignmentModel({
        orgId,
        campaignId: sessionData.campaignId,
        session360Id,
        evaluateeId: sessionData.evaluateeId,
        evaluatorId: sessionData.evaluateeId,
        evaluatorEmail: evaluatee.email,
        evaluatorName: evaluatee.displayName,
        evaluatorType: EVALUATOR_TYPE.SELF,
        testId: sessionData.testId,
        testVersion: sessionData.testVersion,
        isExternal: false,
        requiresAuthentication: true
      });
      
      const selfRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', selfAssignment.assignmentId);
      batch.set(selfRef, {
        ...selfAssignment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      assignments.push(selfAssignment);
    }
    
    // 2. Manager
    if (config.manager.required && evaluatee.managerIds && evaluatee.managerIds.length > 0) {
      for (const managerRel of evaluatee.managerIds) {
        const manager = await orgStructureService.getOrgUser(orgId, managerRel.id);
        if (manager) {
          const managerAssignment = createEvaluatorAssignmentModel({
            orgId,
            campaignId: sessionData.campaignId,
            session360Id,
            evaluateeId: sessionData.evaluateeId,
            evaluatorId: manager.id,
            evaluatorEmail: manager.email,
            evaluatorName: manager.displayName,
            evaluatorType: EVALUATOR_TYPE.MANAGER,
            testId: sessionData.testId,
            testVersion: sessionData.testVersion,
            isExternal: false,
            requiresAuthentication: true
          });
          
          const managerRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', managerAssignment.assignmentId);
          batch.set(managerRef, {
            ...managerAssignment,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          assignments.push(managerAssignment);
        }
      }
    }
    
    // 3. Pares
    if (config.peers.required.min > 0) {
      const peers = await getPeersForUser(orgId, evaluatee);
      const selectedPeers = peers.slice(0, config.peers.required.max);
      
      for (const peer of selectedPeers) {
        const peerAssignment = createEvaluatorAssignmentModel({
          orgId,
          campaignId: sessionData.campaignId,
          session360Id,
          evaluateeId: sessionData.evaluateeId,
          evaluatorId: peer.id,
          evaluatorEmail: peer.email,
          evaluatorName: peer.displayName,
          evaluatorType: EVALUATOR_TYPE.PEER,
          testId: sessionData.testId,
          testVersion: sessionData.testVersion,
          isExternal: false,
          requiresAuthentication: true
        });
        
        const peerRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', peerAssignment.assignmentId);
        batch.set(peerRef, {
          ...peerAssignment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        assignments.push(peerAssignment);
      }
    }
    
    // 4. Subordinados
    if (config.subordinates.required.min > 0) {
      const subordinates = await getSubordinatesForUser(orgId, evaluatee);
      const selectedSubordinates = subordinates.slice(0, config.subordinates.required.min);
      
      for (const subordinate of selectedSubordinates) {
        const subordinateAssignment = createEvaluatorAssignmentModel({
          orgId,
          campaignId: sessionData.campaignId,
          session360Id,
          evaluateeId: sessionData.evaluateeId,
          evaluatorId: subordinate.id,
          evaluatorEmail: subordinate.email,
          evaluatorName: subordinate.displayName,
          evaluatorType: EVALUATOR_TYPE.SUBORDINATE,
          testId: sessionData.testId,
          testVersion: sessionData.testVersion,
          isExternal: false,
          requiresAuthentication: true
        });
        
        const subordinateRef = doc(db, 'orgs', orgId, 'evaluatorAssignments', subordinateAssignment.assignmentId);
        batch.set(subordinateRef, {
          ...subordinateAssignment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        assignments.push(subordinateAssignment);
      }
    }
    
    // Ejecutar batch
    await batch.commit();
    
    console.log(`[EvaluatorAssignment] Generated ${assignments.length} assignments for session ${session360Id}`);
    return assignments;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error generating session assignments:', error);
    throw error;
  }
};

/**
 * Obtener pares de un usuario
 */
export const getPeersForUser = async (orgId, user) => {
  try {
    const users = await orgStructureService.getOrgUsers(orgId);
    
    // Filtrar pares: mismo nivel jerárquico, misma área/departamento
    const peers = users.filter(u => 
      u.id !== user.id &&
      u.areaId === user.areaId &&
      u.departmentId === user.departmentId &&
      u.jobFamilyIds && user.jobFamilyIds &&
      u.jobFamilyIds.some(familyId => user.jobFamilyIds.includes(familyId))
    );
    
    return peers;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error getting peers:', error);
    throw error;
  }
};

/**
 * Obtener subordinados de un usuario
 */
export const getSubordinatesForUser = async (orgId, user) => {
  try {
    const users = await orgStructureService.getOrgUsers(orgId);
    
    // Filtrar subordinados: usuarios que tienen a este usuario como manager
    const subordinates = users.filter(u => 
      u.id !== user.id &&
      u.managerIds && 
      u.managerIds.some(managerRel => managerRel.id === user.id)
    );
    
    return subordinates;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error getting subordinates:', error);
    throw error;
  }
};

// ========== TOKEN MANAGEMENT ==========

/**
 * Validar token y obtener asignación
 */
export const validateToken = async (token) => {
  try {
    const assignment = await getAssignmentByToken(token);
    
    if (!canUseToken(assignment)) {
      throw new Error('Token cannot be used');
    }
    
    // Actualizar último acceso
    await updateEvaluatorAssignment(
      assignment.orgId,
      assignment.id,
      { lastAccessedAt: serverTimestamp() },
      'system'
    );
    
    return assignment;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error validating token:', error);
    throw error;
  }
};

/**
 * Marcar token como usado
 */
export const markTokenAsUsed = async (orgId, assignmentId, userId) => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);
    
    const newUses = assignment.tokenUses + 1;
    const updates = {
      tokenUses: newUses,
      status: newUses >= assignment.maxTokenUses ? 
        EVALUATOR_ASSIGNMENT_STATUS.COMPLETED : 
        EVALUATOR_ASSIGNMENT_STATUS.IN_PROGRESS
    };
    
    if (newUses >= assignment.maxTokenUses) {
      updates.completedAt = serverTimestamp();
    }
    
    return await updateEvaluatorAssignment(orgId, assignmentId, updates, userId);
  } catch (error) {
    console.error('[EvaluatorAssignment] Error marking token as used:', error);
    throw error;
  }
};

// ========== EMAIL MANAGEMENT ==========

/**
 * Enviar invitación por email
 */
export const sendInvitationEmail = async (orgId, assignmentId, userId) => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);
    
    if (assignment.emailSent) {
      throw new Error('Invitation already sent');
    }
    
    // Obtener información de la campaña y sesión
    const [campaign, session] = await Promise.all([
      campaignService.getCampaign(orgId, assignment.campaignId),
      campaignService.getCampaignSession(orgId, assignment.session360Id)
    ]);
    
    // Generar URL de evaluación
    const evaluationUrl = generateEvaluationUrl(assignment.token);
    
    // Enviar email (en implementación real, usar Cloud Function)
    const emailResult = await sendEmail({
      to: assignment.evaluatorEmail,
      subject: `Invitación a Evaluación 360° - ${campaign.title}`,
      template: 'invitation',
      data: {
        evaluatorName: assignment.evaluatorName,
        evaluateeName: session.evaluateeName,
        campaignTitle: campaign.title,
        deadline: campaign.config.endDate,
        evaluationUrl,
        evaluatorType: assignment.evaluatorType
      }
    });
    
    // Actualizar asignación
    await updateEvaluatorAssignment(orgId, assignmentId, {
      emailSent: true,
      emailSentAt: serverTimestamp(),
      status: EVALUATOR_ASSIGNMENT_STATUS.INVITED
    }, userId);
    
    console.log(`[EvaluatorAssignment] Sent invitation email to ${assignment.evaluatorEmail}`);
    return emailResult;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error sending invitation email:', error);
    throw error;
  }
};

/**
 * Enviar recordatorio por email
 */
export const sendReminderEmail = async (orgId, assignmentId, userId) => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);
    
    if (assignment.status === EVALUATOR_ASSIGNMENT_STATUS.COMPLETED) {
      throw new Error('Assignment already completed');
    }
    
    // Obtener información de la campaña
    const campaign = await campaignService.getCampaign(orgId, assignment.campaignId);
    
    // Generar URL de evaluación
    const evaluationUrl = generateEvaluationUrl(assignment.token);
    
    // Calcular días restantes
    const daysRemaining = Math.ceil(
      (new Date(campaign.config.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    // Enviar email
    const emailResult = await sendEmail({
      to: assignment.evaluatorEmail,
      subject: `Recordatorio: Evaluación 360° - ${campaign.title}`,
      template: 'reminder',
      data: {
        evaluatorName: assignment.evaluatorName,
        campaignTitle: campaign.title,
        deadline: campaign.config.endDate,
        daysRemaining: Math.max(0, daysRemaining),
        evaluationUrl
      }
    });
    
    console.log(`[EvaluatorAssignment] Sent reminder email to ${assignment.evaluatorEmail}`);
    return emailResult;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error sending reminder email:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Generar URL de evaluación
 */
export const generateEvaluationUrl = (token, baseUrl = '') => {
  return `${baseUrl}/eval/${token}`;
};

/**
 * Obtener estadísticas de asignaciones
 */
export const getAssignmentStats = async (orgId, campaignId) => {
  try {
    const assignmentsRef = collection(db, 'orgs', orgId, 'evaluatorAssignments');
    const q = query(
      assignmentsRef,
      where('campaignId', '==', campaignId)
    );
    
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: assignments.length,
      pending: 0,
      invited: 0,
      inProgress: 0,
      completed: 0,
      expired: 0,
      cancelled: 0,
      byType: {}
    };
    
    // Inicializar contadores por tipo
    Object.values(EVALUATOR_TYPE).forEach(type => {
      stats.byType[type] = 0;
    });
    
    assignments.forEach(assignment => {
      stats[assignment.status] = (stats[assignment.status] || 0) + 1;
      stats.byType[assignment.evaluatorType] = (stats.byType[assignment.evaluatorType] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error loading assignment stats:', error);
    throw error;
  }
};

// ========== MOCK FUNCTIONS (Para desarrollo) ==========

/**
 * Mock function para envío de emails
 */
const sendEmail = async (emailData) => {
  // En implementación real, esto sería una llamada a Cloud Function
  console.log('[EvaluatorAssignment] Mock email sent:', emailData);
  return { success: true, messageId: 'mock-message-id' };
};

// ========== EXPORT ==========

export default {
  // Assignment management
  getSessionAssignments,
  getEvaluatorAssignment,
  getAssignmentByToken,
  createEvaluatorAssignment,
  updateEvaluatorAssignment,
  generateSessionAssignments,
  
  // Token management
  validateToken,
  markTokenAsUsed,
  
  // Email management
  sendInvitationEmail,
  sendReminderEmail,
  
  // Utilities
  generateEvaluationUrl,
  getAssignmentStats
};
