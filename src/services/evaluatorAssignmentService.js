/**
 * Servicio para gestiÃ³n de EvaluatorAssignments
 * 
 * Maneja CRUD de asignaciones de evaluadores, generaciÃ³n de tokens,
 * y envÃ­o de invitaciones
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
import { getOrgUser, getOrgUsers } from './orgStructureService';
import { getOrgRoles, normalizeRole } from './roleService';

// ========== EVALUATOR ASSIGNMENT MANAGEMENT ==========

/**
 * Obtener asignaciones de evaluadores de una sesiÃ³n 360Â°
 */
export const getSessionAssignments = async (orgId, session360Id) => {
  try {
    const assignmentsRef = collection(db, 'organizations', orgId, 'evaluatorAssignments');
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
 * Obtener asignaciÃ³n especÃ­fica
 */
export const getEvaluatorAssignment = async (orgId, assignmentId) => {
  try {
    const assignmentRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', assignmentId);
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
 * Obtener asignaciÃ³n por token
 */
export const getAssignmentByToken = async (token) => {
  try {
    if (!validateTokenFormat(token)) {
      throw new Error('Invalid token format');
    }

    const tokenHash = hashToken(token);

    // Buscar en todas las organizaciones (en implementaciÃ³n real, optimizar)
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const assignmentsRef = collection(db, 'organizations', orgId, 'evaluatorAssignments');
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
 * Crear asignaciÃ³n de evaluador
 */
export const createEvaluatorAssignment = async (orgId, assignmentData, userId) => {
  try {
    // Validar datos
    const validation = validateEvaluatorAssignment(assignmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Crear asignaciÃ³n
    const newAssignment = createEvaluatorAssignmentModel({
      ...assignmentData,
      orgId,
      createdBy: userId
    });

    // Crear en Firestore
    const assignmentRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', newAssignment.assignmentId);
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
 * Actualizar asignaciÃ³n de evaluador
 */
export const updateEvaluatorAssignment = async (orgId, assignmentId, updates, userId) => {
  try {
    // Obtener asignaciÃ³n actual
    const currentAssignment = await getEvaluatorAssignment(orgId, assignmentId);

    // Crear asignaciÃ³n actualizada
    const updatedAssignment = {
      ...currentAssignment,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };

    // Actualizar en Firestore
    const assignmentRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', assignmentId);
    await updateDoc(assignmentRef, updatedAssignment);

    console.log(`[EvaluatorAssignment] Updated assignment: ${assignmentId}`);
    return updatedAssignment;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error updating assignment:', error);
    throw error;
  }
};

/**
 * Generar asignaciones automÃ¡ticas para una sesiÃ³n 360Â°
 */
export const generateSessionAssignments = async (orgId, session360Id, sessionData) => {
  try {
    const batch = writeBatch(db);
    const assignments = [];

    // Obtener informaciÃ³n del evaluado
    const evaluatee = await getOrgUser(orgId, sessionData.evaluateeId);
    if (!evaluatee) {
      throw new Error(`Evaluatee ${sessionData.evaluateeId} not found`);
    }

    // Obtener Job Family del evaluado para configuraciÃ³n
    const jobFamilies = await jobFamilyService.getOrgJobFamilies(orgId);
    const userJobFamily = evaluatee.jobFamilyIds && evaluatee.jobFamilyIds.length > 0
      ? jobFamilies.find(f => evaluatee.jobFamilyIds.includes(f.id))
      : null;

    // Generar asignaciones segÃºn configuraciÃ³n
    const config = sessionData.evaluatorConfig;

    // 1. AutoevaluaciÃ³n
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

      const selfRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', selfAssignment.assignmentId);
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
        const manager = await getOrgUser(orgId, managerRel.id);
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

          const managerRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', managerAssignment.assignmentId);
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

        const peerRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', peerAssignment.assignmentId);
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

        const subordinateRef = doc(db, 'organizations', orgId, 'evaluatorAssignments', subordinateAssignment.assignmentId);
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
    const users = await getOrgUsers(orgId);

    // Filtrar pares: mismo nivel jerÃ¡rquico, misma Ã¡rea/departamento
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
    const users = await getOrgUsers(orgId);

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
 * Validar token y obtener asignaciÃ³n
 */
export const validateToken = async (token) => {
  try {
    const assignment = await getAssignmentByToken(token);

    if (!canUseToken(assignment)) {
      throw new Error('Token cannot be used');
    }

    // Actualizar Ãºltimo acceso
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
 * Enviar invitaciÃ³n por email
 */
export const sendInvitationEmail = async (orgId, assignmentId, userId) => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);

    if (assignment.emailSent) {
      throw new Error('Invitation already sent');
    }

    // Obtener informaciÃ³n de la campaÃ±a y sesiÃ³n
    const [campaign, session] = await Promise.all([
      campaignService.getCampaign(orgId, assignment.campaignId),
      campaignService.getCampaignSession(orgId, assignment.session360Id)
    ]);

    // Generar URL de evaluaciÃ³n
    const evaluationUrl = generateEvaluationUrl(assignment.token);

    // Enviar email (en implementaciÃ³n real, usar Cloud Function)
    const emailResult = await sendEmail({
      to: assignment.evaluatorEmail,
      subject: `InvitaciÃ³n a EvaluaciÃ³n 360Â° - ${campaign.title}`,
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

    // Actualizar asignaciÃ³n
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

    // Obtener informaciÃ³n de la campaÃ±a
    const campaign = await campaignService.getCampaign(orgId, assignment.campaignId);

    // Generar URL de evaluaciÃ³n
    const evaluationUrl = generateEvaluationUrl(assignment.token);

    // Calcular dÃ­as restantes
    const daysRemaining = Math.ceil(
      (new Date(campaign.config.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Enviar email
    const emailResult = await sendEmail({
      to: assignment.evaluatorEmail,
      subject: `Recordatorio: EvaluaciÃ³n 360Â° - ${campaign.title}`,
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
 * Generar URL de evaluaciÃ³n
 */
export const generateEvaluationUrl = (token, baseUrl = '') => {
  return `${baseUrl}/eval/${token}`;
};

/**
 * Obtener estadÃ­sticas de asignaciones
 */
export const getAssignmentStats = async (orgId, campaignId) => {
  try {
    const assignmentsRef = collection(db, 'organizations', orgId, 'evaluatorAssignments');
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
 * Mock function para envÃ­o de emails
 */
const sendEmail = async (emailData) => {
  // En implementaciÃ³n real, esto serÃ­a una llamada a Cloud Function
  console.log('[EvaluatorAssignment] Mock email sent:', emailData);
  return { success: true, messageId: 'mock-message-id' };
};

// ========== EXPORT ==========

/**
 * Reenviar invitaciÃ³n (para acciones masivas)
 */
export const resendInvitation = async (orgId, assignmentId, customMessage = '') => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Actualizar timestamp de Ãºltimo envÃ­o
    await updateEvaluatorAssignment(orgId, assignmentId, {
      lastInvitationSent: new Date(),
      invitationCount: (assignment.invitationCount || 0) + 1,
      customMessage
    });

    console.log(`[EvaluatorAssignment] Invitation resent: ${assignmentId}`);
    return true;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error resending invitation:', error);
    throw error;
  }
};

/**
 * Extender plazo de evaluaciÃ³n
 */
export const extendDeadline = async (orgId, assignmentId, extensionDays) => {
  try {
    const assignment = await getEvaluatorAssignment(orgId, assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const currentDeadline = new Date(assignment.deadline);
    const newDeadline = new Date(currentDeadline.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    await updateEvaluatorAssignment(orgId, assignmentId, {
      deadline: newDeadline,
      originalDeadline: assignment.originalDeadline || assignment.deadline,
      deadlineExtended: true,
      extensionDays
    });

    console.log(`[EvaluatorAssignment] Deadline extended: ${assignmentId} by ${extensionDays} days`);
    return true;
  } catch (error) {
    console.error('[EvaluatorAssignment] Error extending deadline:', error);
    throw error;
  }
};

/**
 * Obtener todas las asignaciones con filtros y paginaciÃ³n (para acciones masivas)
 */
export const getAllAssignments = async (orgId, options = {}) => {
  try {
    // Intentar obtener miembros reales de Firestore
    let realMembers = [];
    try {
      const membersRef = collection(db, 'members');
      const membersQuery = query(
        membersRef,
        where('orgId', '==', orgId),
        where('isActive', '==', true)
      );
      const membersSnapshot = await getDocs(membersQuery);
      realMembers = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`[EvaluatorAssignment] Found ${realMembers.length} real members for org ${orgId}`);
    } catch (err) {
      console.warn('[EvaluatorAssignment] Could not load real members, using mock data:', err);
    }

    // Si hay miembros reales, convertirlos en asignaciones
    let assignments = [];
    if (realMembers.length > 0) {
      // Obtener todos los recordatorios de Firestore para esta org en un solo query
      const remindersRef = collection(db, 'reminders');
      const remindersQuery = query(
        remindersRef,
        where('orgId', '==', orgId)
      );
      const remindersSnapshot = await getDocs(remindersQuery);

      // Crear un mapa de assignmentId -> lastReminderSent para acceso rápido
      const remindersMap = new Map();
      remindersSnapshot.forEach((doc) => {
        const data = doc.data();
        const reminderDate = data.lastReminderSentDate
          ? new Date(data.lastReminderSentDate)
          : (data.lastReminderSent?.toDate ? data.lastReminderSent.toDate() : null);
        if (reminderDate) {
          remindersMap.set(data.assignmentId, reminderDate);
        }
      });

      // Obtener todas las extensiones de plazo de Firestore para esta org (opcional)
      const extensionsMap = new Map();
      try {
        const extensionsRef = collection(db, `organizations/${orgId}/deadlineExtensions`);
        const extensionsSnapshot = await getDocs(extensionsRef);

        // Crear un mapa de assignmentId -> extension data para acceso rápido
        extensionsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.newDeadline) {
            extensionsMap.set(data.assignmentId, {
              newDeadline: new Date(data.newDeadline),
              extensionDays: data.extensionDays || 0,
              extendedAt: data.extendedAt?.toDate ? data.extendedAt.toDate() : null
            });
          }
        });
        console.log(`[EvaluatorAssignment] Loaded ${extensionsMap.size} deadline extensions from Firestore`);
      } catch (extensionsErr) {
        console.warn('[EvaluatorAssignment] Could not load deadline extensions from Firestore (non-critical):', extensionsErr);
        // Continuar sin extensiones - no es crítico para mostrar las asignaciones
      }

      assignments = realMembers.map((member, index) => {
        // Obtener último recordatorio de Firestore
        const lastReminderSent = remindersMap.get(member.id) || null;

        // Obtener extensión de plazo de Firestore si existe
        const extension = extensionsMap.get(member.id);
        let deadline = member.deadline || null;
        if (extension && extension.newDeadline) {
          deadline = extension.newDeadline.toISOString();
        } else if (deadline) {
          deadline = deadline instanceof Date ? deadline.toISOString() : deadline;
        }

        // Determinar estado basado en datos del miembro y deadline extendido
        let status = 'pending';
        if (member.lastEvaluationCompleted) {
          status = 'completed';
        } else if (member.lastEvaluationStarted && !member.lastEvaluationCompleted) {
          status = 'in_progress';
        } else if (deadline && new Date(deadline) < new Date()) {
          status = 'expired';
        }

        // Obtener fecha de última invitación (puede venir como Timestamp o como string ISO)
        let lastInvitationSent = null;
        if (member.lastInvitationSentDate) {
          lastInvitationSent = new Date(member.lastInvitationSentDate);
        } else if (member.lastInvitationSent) {
          // Si es un Timestamp de Firestore, convertir a Date
          lastInvitationSent = member.lastInvitationSent?.toDate
            ? member.lastInvitationSent.toDate()
            : new Date(member.lastInvitationSent);
        } else if (member.createdAt) {
          lastInvitationSent = member.createdAt?.toDate
            ? member.createdAt.toDate()
            : new Date(member.createdAt);
        } else {
          lastInvitationSent = new Date();
        }

        // Normalizar rol usando los roles de la organización
        const normalizedRole = normalizeRole(member.role || member.memberRole || member.rol || 'member');

        return {
          id: member.id,
          evaluatorId: member.id,
          evaluatorEmail: member.email,
          evaluatorName: member.nombre || member.displayName || member.email,
          evaluatorType: normalizedRole, // Usar rol normalizado
          status: status,
          lastInvitationSent: lastInvitationSent,
          lastReminderSent: lastReminderSent,
          createdAt: member.createdAt || new Date(),
          deadline: deadline,
          area: member.area || '--',
          invitationCount: member.invitationCount || 0,
          deadlineExtended: extension ? true : false,
          extensionDays: extension?.extensionDays || 0
        };
      });
    } else {
      // Fallback a mock data si no hay miembros reales
      const mockAssignments = [
        {
          id: 'assignment-1',
          session360Id: 'session-1',
          campaignId: 'campaign-1',
          campaignName: 'EvaluaciÃ³n Q1 2024',
          evaluateeId: 'user-1',
          evaluateeName: 'Juan PÃ©rez',
          evaluatorId: 'user-2',
          evaluatorEmail: 'maria@example.com',
          evaluatorName: 'MarÃ­a GarcÃ­a',
          evaluatorType: 'peer',
          status: 'pending',
          token: 'xxx-token-1',
          tokenHash: 'hash-1',
          tokenUsed: false,
          tokenExpiry: new Date('2024-12-31'),
          createdAt: new Date('2024-01-15'),
          lastInvitationSent: new Date('2024-01-15'),
          invitationCount: 1,
          lastReminderSent: new Date('2024-01-20'),
          deadline: new Date('2024-02-15')
        },
        {
          id: 'assignment-2',
          session360Id: 'session-1',
          campaignId: 'campaign-1',
          campaignName: 'EvaluaciÃ³n Q1 2024',
          evaluateeId: 'user-1',
          evaluateeName: 'Juan PÃ©rez',
          evaluatorId: 'user-3',
          evaluatorEmail: 'carlos@example.com',
          evaluatorName: 'Carlos LÃ³pez',
          evaluatorType: 'manager',
          status: 'completed',
          token: 'xxx-token-2',
          tokenHash: 'hash-2',
          tokenUsed: true,
          tokenExpiry: new Date('2024-12-31'),
          createdAt: new Date('2024-01-15'),
          lastInvitationSent: new Date('2024-01-15'),
          invitationCount: 1,
          deadline: new Date('2024-02-15'),
          completedAt: new Date('2024-01-20')
        },
        {
          id: 'assignment-3',
          session360Id: 'session-2',
          campaignId: 'campaign-1',
          campaignName: 'EvaluaciÃ³n Q1 2024',
          evaluateeId: 'user-2',
          evaluateeName: 'MarÃ­a GarcÃ­a',
          evaluatorId: 'user-1',
          evaluatorEmail: 'juan@example.com',
          evaluatorName: 'Juan PÃ©rez',
          evaluatorType: 'peer',
          status: 'pending',
          token: 'xxx-token-3',
          tokenHash: 'hash-3',
          tokenUsed: false,
          tokenExpiry: new Date('2024-12-31'),
          createdAt: new Date('2024-01-15'),
          lastInvitationSent: new Date('2024-01-15'),
          invitationCount: 1,
          deadline: new Date('2024-02-15')
        },
        {
          id: 'assignment-4',
          session360Id: 'session-3',
          campaignId: 'campaign-2',
          campaignName: 'EvaluaciÃ³n Q2 2024',
          evaluateeId: 'user-3',
          evaluateeName: 'Carlos LÃ³pez',
          evaluatorId: 'user-4',
          evaluatorEmail: 'ana@example.com',
          evaluatorName: 'Ana MartÃ­nez',
          evaluatorType: 'direct',
          status: 'expired',
          token: 'xxx-token-4',
          tokenHash: 'hash-4',
          tokenUsed: false,
          tokenExpiry: new Date('2024-05-31'),
          createdAt: new Date('2024-04-01'),
          lastInvitationSent: new Date('2024-04-15'),
          invitationCount: 2,
          deadline: new Date('2024-05-01')
        },
        {
          id: 'assignment-5',
          session360Id: 'session-4',
          campaignId: 'campaign-3',
          campaignName: 'EvaluaciÃ³n Anual 2024',
          evaluateeId: 'user-4',
          evaluateeName: 'Ana MartÃ­nez',
          evaluatorId: 'user-5',
          evaluatorEmail: 'pedro@example.com',
          evaluatorName: 'Pedro RodrÃ­guez',
          evaluatorType: 'self',
          status: 'in_progress',
          token: 'xxx-token-5',
          tokenHash: 'hash-5',
          tokenUsed: true,
          tokenExpiry: new Date('2024-12-31'),
          createdAt: new Date('2024-10-01'),
          lastInvitationSent: new Date('2024-10-01'),
          invitationCount: 1,
          deadline: new Date('2024-11-30')
        },
        {
          id: 'assignment-6',
          session360Id: 'session-5',
          campaignId: 'campaign-5',
          campaignName: 'DST Test Campaign',
          evaluateeId: 'user-5',
          evaluateeName: 'Pedro RodrÃ­guez',
          evaluatorId: 'user-1',
          evaluatorEmail: 'juan@example.com',
          evaluatorName: 'Juan PÃ©rez',
          evaluatorType: 'manager',
          status: 'pending',
          token: 'xxx-token-6',
          tokenHash: 'hash-6',
          tokenUsed: false,
          tokenExpiry: new Date('2024-12-31'),
          createdAt: new Date('2024-08-15'),
          lastInvitationSent: new Date('2024-08-15'),
          invitationCount: 1,
          deadline: new Date('2024-10-15')
        }
      ];
      assignments = mockAssignments;
    }

    // Aplicar filtros
    let filteredAssignments = [...assignments];

    if (options.search) {
      filteredAssignments = filteredAssignments.filter(a =>
        a.evaluatorEmail.toLowerCase().includes(options.search.toLowerCase()) ||
        (a.evaluatorName && a.evaluatorName.toLowerCase().includes(options.search.toLowerCase())) ||
        (a.evaluateeName && a.evaluateeName.toLowerCase().includes(options.search.toLowerCase()))
      );
    }

    if (options.status && options.status !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.status === options.status);
    }

    if (options.campaignId && options.campaignId !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.campaignId === options.campaignId);
    }

    if (options.evaluatorType && options.evaluatorType !== 'all') {
      filteredAssignments = filteredAssignments.filter(a => a.evaluatorType === options.evaluatorType);
    }

    // PaginaciÃ³n
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredAssignments.length;

    console.log(`[EvaluatorAssignment] Returning ${paginatedAssignments.length} assignments (page ${page})`);

    return {
      assignments: paginatedAssignments,
      total: filteredAssignments.length,
      page,
      pageSize,
      hasMore
    };
  } catch (error) {
    console.error('[EvaluatorAssignment] Error getting all assignments:', error);
    throw error;
  }
};

// ========== EXPORTS ==========

export default {
  getSessionAssignments,
  getEvaluatorAssignment,
  getAssignmentByToken,
  createEvaluatorAssignment,
  updateEvaluatorAssignment,
  generateSessionAssignments,
  getPeersForUser,
  getSubordinatesForUser,
  validateToken,
  markTokenAsUsed,
  sendInvitationEmail,
  sendReminderEmail,
  generateEvaluationUrl,
  getAssignmentStats,
  resendInvitation,
  extendDeadline,
  getAllAssignments
};
