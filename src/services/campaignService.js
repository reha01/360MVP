/**
<<<<<<< Current (Your changes)
 * Servicio para gestiÃ³n de Campaigns 360Â°
=======
 * Servicio para gestión de Campaigns 360°
>>>>>>> Incoming (Background Agent changes)
 * 
 * Maneja CRUD de campañas, sesiones de evaluación 360°,
 * y generación automática de evaluadores
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
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
  createCampaignModel,
  createEvaluation360SessionModel,
  validateCampaign,
  validateEvaluation360Session,
  canActivateCampaign,
  calculateCampaignStats,
  generateEvaluatorConfigFromJobFamily,
  CAMPAIGN_STATUS
} from '../models/Campaign';
import jobFamilyService from './jobFamilyService';
import orgStructureService from './orgStructureServiceWrapper';
import evaluatorAssignmentService from './evaluatorAssignmentService';

// ========== CAMPAIGN MANAGEMENT ==========

/**
 * Obtener todas las campañas de una organización
 */
export const getOrgCampaigns = async (orgId) => {
  try {
    console.log('>>> CAMPAIGN SERVICE V6 LOADED - OrgID:', orgId);
    const campaignsRef = collection(db, 'organizations', orgId, 'campaigns');
    const q = query(
      campaignsRef,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[Campaign] Loaded ${campaigns.length} campaigns for org ${orgId}`);
    return campaigns;
  } catch (error) {
    console.error('[Campaign] Error loading campaigns:', error);
    throw new Error(`Error loading campaigns: ${error.message}`);
  }
};

/**
 * Obtener campa�as con filtros y paginaci�n (para dashboard)
 */
export const getCampaigns = async (orgId, options = {}) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    // Conectar con Firestore real
    const campaignsRef = collection(db, 'organizations', orgId, 'campaigns');
    let q = query(campaignsRef);

    // Aplicar filtros
    if (options.status && options.status !== 'all') {
      q = query(q, where('status', '==', options.status));
    }

    if (options.type && options.type !== 'all') {
      q = query(q, where('type', '==', options.type));
    }

    // Ordenar por fecha de creaci�n
    q = query(q, orderBy('createdAt', 'desc'));

    // Nota: Los filtros de fecha se aplican en memoria despu�s de obtener los datos
    // porque requieren �ndices compuestos en Firestore para campos anidados (config.startDate)

    // Paginaci�n
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const startIndex = (page - 1) * pageSize;

    // Obtener datos con l�mite
    q = query(q, limit(pageSize * page)); // Obtener hasta la p�gina actual
    const snapshot = await getDocs(q);

    let campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar por b�squeda de texto en memoria (si se proporciona)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      campaigns = campaigns.filter(c =>
        (c.title || '').toLowerCase().includes(searchLower) ||
        (c.description || '').toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por fecha en memoria (si se proporciona)
    if (options.dateFrom) {
      campaigns = campaigns.filter(c => {
        const startDate = c.config?.startDate || c.startDate;
        return startDate && new Date(startDate) >= new Date(options.dateFrom);
      });
    }

    if (options.dateTo) {
      campaigns = campaigns.filter(c => {
        const endDate = c.config?.endDate || c.endDate;
        return endDate && new Date(endDate) <= new Date(options.dateTo);
      });
    }

    // Filtrar por Job Family (si se proporciona)
    if (options.jobFamily && options.jobFamily !== 'all') {
      campaigns = campaigns.filter(c => {
        // Verificar si alg�n test asignado corresponde a la Job Family
        const testAssignments = c.testAssignments || {};
        return Object.values(testAssignments).some(assignment => {
          // Aqu� se podr�a verificar contra Job Family mappings
          // Por ahora, filtramos por testId si coincide
          return assignment.testId && assignment.testId.includes(options.jobFamily);
        });
      });
    }

    // Aplicar paginaci�n en memoria
    const paginatedCampaigns = campaigns.slice(startIndex, startIndex + pageSize);
    const hasMore = campaigns.length > startIndex + pageSize;

    console.log(`[Campaign] Returning ${paginatedCampaigns.length} campaigns for org ${orgId} (page ${page})`);

    return {
      campaigns: paginatedCampaigns,
      total: campaigns.length,
      page,
      pageSize,
      hasMore
    };
  } catch (error) {
    console.error('[Campaign] Error getting campaigns:', error);
    throw error;
  }
};

/**
 * Obtener campaña específica
 */
export const getCampaign = async (orgId, campaignId) => {
  try {
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', campaignId);
    const snapshot = await getDoc(campaignRef);

    if (!snapshot.exists()) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[Campaign] Error loading campaign:', error);
    throw error;
  }
};

/**
 * Crear nueva campaña
 */
export const createCampaign = async (orgId, campaignData, userId) => {
  try {
    // Validar datos
    const validation = validateCampaign(campaignData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Crear campaña
    const newCampaign = createCampaignModel({
      ...campaignData,
      orgId,
      createdBy: userId,
      updatedBy: userId
    });

    // Crear en Firestore
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', newCampaign.campaignId);
    await setDoc(campaignRef, {
      ...newCampaign,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[Campaign] Created campaign: ${newCampaign.title} (${newCampaign.campaignId})`);
    return newCampaign;
  } catch (error) {
    console.error('[Campaign] Error creating campaign:', error);
    throw error;
  }
};

/**
 * Duplicar campaña existente
 * Crea una copia con el nombre + numeración (ej: "Campaña 1" -> "Campaña 1 (2)")
 */
export const duplicateCampaign = async (orgId, campaignId, userId) => {
  try {
    // Obtener campaña original
    const originalCampaign = await getCampaign(orgId, campaignId);

    if (!originalCampaign) {
      throw new Error('Campaña original no encontrada');
    }

    // Generar nuevo nombre con numeración
    const baseName = originalCampaign.title.replace(/\s*\(\d+\)$/, ''); // Quitar numeración existente
    const newTitle = await generateUniqueTitle(orgId, baseName);

    // Limpiar campos que no deben duplicarse
    const {
      id,
      campaignId: oldCampaignId,
      createdAt,
      createdBy,
      updatedAt,
      updatedBy,
      status,
      sessions,
      ...cleanData
    } = originalCampaign;

    // Crear nueva campaña como borrador
    const duplicatedCampaign = await createCampaign(orgId, {
      ...cleanData,
      title: newTitle,
      status: 'draft' // Siempre inicia como borrador
    }, userId);

    console.log(`[Campaign] Duplicated campaign: ${originalCampaign.title} -> ${newTitle}`);
    return duplicatedCampaign;
  } catch (error) {
    console.error('[Campaign] Error duplicating campaign:', error);
    throw error;
  }
};

/**
 * Generar título único para campaña duplicada
 */
const generateUniqueTitle = async (orgId, baseName) => {
  try {
    // Buscar campañas con nombre similar
    const campaignsRef = collection(db, 'organizations', orgId, 'campaigns');
    const snapshot = await getDocs(campaignsRef);

    const existingTitles = snapshot.docs.map(doc => doc.data().title);

    // Encontrar el número más alto usado
    let maxNumber = 1;
    const regex = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)$`);

    existingTitles.forEach(title => {
      if (title === baseName) {
        maxNumber = Math.max(maxNumber, 1);
      }
      const match = title.match(regex);
      if (match) {
        maxNumber = Math.max(maxNumber, parseInt(match[1]));
      }
    });

    return `${baseName} (${maxNumber + 1})`;
  } catch (error) {
    console.error('[Campaign] Error generating unique title:', error);
    return `${baseName} (copia)`;
  }
};

/**
 * Actualizar campaña existente
 */
export const updateCampaign = async (orgId, campaignId, updates, userId) => {
  try {
    // Validar datos
    const validation = validateCampaign(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Obtener campaña actual
    const currentCampaign = await getCampaign(orgId, campaignId);

    // Crear campaña actualizada
    const updatedCampaign = {
      ...currentCampaign,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };

    // Actualizar en Firestore
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', campaignId);
    await updateDoc(campaignRef, updatedCampaign);

    console.log(`[Campaign] Updated campaign: ${updatedCampaign.title} (${campaignId})`);
    return updatedCampaign;
  } catch (error) {
    console.error('[Campaign] Error updating campaign:', error);
    throw error;
  }
};

/**
 * Eliminar campaña (solo borradores)
 */
export const deleteCampaign = async (orgId, campaignId) => {
  try {
    // Obtener campaña
    const campaign = await getCampaign(orgId, campaignId);

    // Verificar que sea borrador
    if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
      throw new Error('Solo se pueden eliminar campañas en estado borrador');
    }

    // Eliminar de Firestore
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', campaignId);
    await deleteDoc(campaignRef);

    console.log(`[Campaign] Deleted campaign: ${campaign.title} (${campaignId})`);
    return true;
  } catch (error) {
    console.error('[Campaign] Error deleting campaign:', error);
    throw error;
  }
};

/**
 * Activar campaña
 */
export const activateCampaign = async (orgId, campaignId, userId) => {
  try {
    // Obtener campaña actual
    const campaign = await getCampaign(orgId, campaignId);

    // Verificar que puede activarse
    const activationCheck = canActivateCampaign(campaign);
    if (!activationCheck.canActivate) {
      throw new Error(`Cannot activate campaign: ${activationCheck.issues.join(', ')}`);
    }

    // Generar sesiones de evaluación 360°
    const sessions = await generateEvaluation360Sessions(orgId, campaignId, campaign);

    // Actualizar campaña
    const updatedCampaign = {
      ...campaign,
      status: CAMPAIGN_STATUS.ACTIVE,
      activatedAt: serverTimestamp(),
      updatedBy: userId,
      updatedAt: serverTimestamp(),
      stats: {
        ...campaign.stats,
        totalEvaluatees: sessions.length
      }
    };

    // Guardar en Firestore
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', campaignId);
    await updateDoc(campaignRef, updatedCampaign);

    console.log(`[Campaign] Activated campaign: ${campaign.title} (${campaignId}) with ${sessions.length} sessions`);
    return { campaign: updatedCampaign, sessions };
  } catch (error) {
    console.error('[Campaign] Error activating campaign:', error);
    throw error;
  }
};

/**
 * Cerrar campaña
 */
export const closeCampaign = async (orgId, campaignId, userId) => {
  try {
    // Obtener campaña actual
    const campaign = await getCampaign(orgId, campaignId);

    if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      throw new Error('Only active campaigns can be closed');
    }

    // Actualizar campaña
    const updatedCampaign = {
      ...campaign,
      status: CAMPAIGN_STATUS.CLOSED,
      closedAt: serverTimestamp(),
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };

    // Guardar en Firestore
    const campaignRef = doc(db, 'organizations', orgId, 'campaigns', campaignId);
    await updateDoc(campaignRef, updatedCampaign);

    console.log(`[Campaign] Closed campaign: ${campaign.title} (${campaignId})`);
    return updatedCampaign;
  } catch (error) {
    console.error('[Campaign] Error closing campaign:', error);
    throw error;
  }
};

// ========== EVALUATION360SESSION MANAGEMENT ==========

/**
 * Obtener sesiones de evaluaci�n 360� de una campa�a
 */
export const getCampaignSessions = async (orgId, campaignId) => {
  try {
    const sessionsRef = collection(db, 'organizations', orgId, 'evaluation360Sessions');
    const q = query(
      sessionsRef,
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[Campaign] Loaded ${sessions.length} sessions for campaign ${campaignId}`);
    return sessions;
  } catch (error) {
    console.error('[Campaign] Error loading campaign sessions:', error);
    throw error;
  }
};

/**
 * Obtener sesi�n 360� espec�fica por ID
 */
export const getCampaignSession = async (orgId, session360Id) => {
  try {
    const sessionRef = doc(db, 'organizations', orgId, 'evaluation360Sessions', session360Id);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
      throw new Error(`Evaluation360Session ${session360Id} not found`);
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[Campaign] Error loading campaign session:', error);
    throw error;
  }
};

/**
 * Generar sesiones de evaluación 360° para una campaña
 */
export const generateEvaluation360Sessions = async (orgId, campaignId, campaign) => {
  try {
    let users = [];

    // ESTRATEGIA PRIORITARIA: USAR USUARIOS SELECCIONADOS MANUALMENTE
    // Esto evita depender de 'evaluateeFilters' que pueden estar desincronizados o vacíos
    // en el enfoque "Container First".
    if (campaign.selectedUsers && campaign.selectedUsers.length > 0) {
      console.log(`[Campaign] Using ${campaign.selectedUsers.length} manually selected users.`);

      // HYDRATION STEP:
      // Los usuarios en selectedUsers pueden ser parciales (solo id, name).
      // Necesitamos jobFamilyIds para asignar tests.
      // Intentamos hidratarlos obteniendo todos los usuarios (que sabemos que funciona en Dashboard)
      // y haciendo match.
      try {
        const allOrgUsers = await orgStructureService.getOrgUsers(orgId);
        const usersMap = allOrgUsers.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

        users = campaign.selectedUsers.map(partialUser => {
          const fullUser = usersMap[partialUser.id];
          if (fullUser) return fullUser;

          console.warn(`[Campaign] User ${partialUser.id} not found in Org users. Using partial data.`);
          return partialUser;
        });
      } catch (hydrationError) {
        console.warn('[Campaign] Failed to hydrate selected users, using partial data:', hydrationError);
        users = campaign.selectedUsers;
      }

    } else {
      // FALLBACK: USAR FILTROS (LEGACY)
      console.log('[Campaign] No selectedUsers found, falling back to evaluateeFilters.');
      users = await getUsersByFilters(orgId, campaign.evaluateeFilters);
    }

    if (!users || users.length === 0) {
      throw new Error('No users found matching the campaign filters');
    }

    // NORMALIZE USERS (Legacy Support): Ensure jobFamilyIds exists
    users = users.map(u => {
      if (!u.jobFamilyIds && u.jobFamilyId) {
        return { ...u, jobFamilyIds: [u.jobFamilyId] };
      }
      return u;
    });

    // Obtener Job Families para asignación automática de tests
    const jobFamilies = await jobFamilyService.getOrgJobFamilies(orgId);
    const jobFamiliesMap = jobFamilies.reduce((acc, family) => {
      acc[family.id] = family;
      return acc;
    }, {});

    // Crear sesiones
    const batch = writeBatch(db);
    const sessions = [];

    for (const user of users) {
      // 1. Check explicit assignment
      let testAssignment = campaign.testAssignments?.[user.id];

      // 2. Check implicit assignment (Job Family)
      if (!testAssignment) {
        testAssignment = getDefaultTestForUser(user, jobFamiliesMap);
      }

      // 3. CAMPAIGN-LEVEL FALLBACK: Use the test selected during wizard creation
      if (!testAssignment) {
        const campaignDefaultTestId = campaign.selectedTestId || campaign.testConfiguration?.defaultTestId;
        if (campaignDefaultTestId) {
          console.log(`[Campaign] Using campaign default test ${campaignDefaultTestId} for user ${user.id}`);
          testAssignment = {
            testId: campaignDefaultTestId,
            version: '1.0',
            reason: 'Campaign default test'
          };
        }
      }

      // 4. Final Check: If still no test, skip user
      if (!testAssignment) {
        console.warn(`[Campaign] CRITICAL: No test assigned for user ${user.id} (${user.name}). Skipping session generation.`);
        continue;
      }

      // Generar configuración de evaluadores basada en Job Family
      const userJobFamilies = user.jobFamilyIds || [];
      const primaryJobFamily = userJobFamilies.length > 0 ?
        jobFamiliesMap[userJobFamilies[0]] : null;

      const evaluatorConfig = generateEvaluatorConfigFromJobFamily(primaryJobFamily);

      // Crear sesión
      const session = createEvaluation360SessionModel({
        orgId,
        campaignId,
        evaluateeId: user.id,
        testId: testAssignment.testId,
        testVersion: testAssignment.version || '1.0',
        evaluatorConfig,
        createdBy: campaign.createdBy
      });

      // Agregar a batch
      const sessionRef = doc(db, 'organizations', orgId, 'evaluation360Sessions', session.session360Id);
      batch.set(sessionRef, {
        ...session,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      sessions.push(session);
    }

    if (sessions.length === 0) {
      throw new Error('No sessions could be generated. Please check Test Assignments or Job Family configurations.');
    }

    // Ejecutar batch
    await batch.commit();

    console.log(`[Campaign] Generated ${sessions.length} evaluation sessions for campaign ${campaignId}`);
    return sessions;
  } catch (error) {
    console.error('[Campaign] Error generating evaluation sessions:', error);
    throw error;
  }
};

/**
 * Obtener usuarios según filtros de campaña
 */
export const getUsersByFilters = async (orgId, filters) => {
  try {
    const users = await orgStructureService.getOrgUsers(orgId);

    let filteredUsers = users;

    // Filtrar por Job Families
    if (filters.jobFamilyIds && filters.jobFamilyIds.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        user.jobFamilyIds &&
        user.jobFamilyIds.some(familyId => filters.jobFamilyIds.includes(familyId))
      );
    }

    // Filtrar por Áreas
    if (filters.areaIds && filters.areaIds.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.areaIds.includes(user.areaId) ||
        filters.areaIds.includes(user.departmentId)
      );
    }

    // Filtrar por IDs específicos
    if (filters.userIds && filters.userIds.length > 0) {
      filteredUsers = filteredUsers.filter(user =>
        filters.userIds.includes(user.id)
      );
    }

    return filteredUsers;
  } catch (error) {
    console.error('[Campaign] Error filtering users:', error);
    throw error;
  }
};

/**
 * Obtener test por defecto para un usuario
 */
export const getDefaultTestForUser = (user, jobFamiliesMap) => {
  if (!user.jobFamilyIds || user.jobFamilyIds.length === 0) {
    return null;
  }

  // Buscar en Job Families del usuario
  for (const familyId of user.jobFamilyIds) {
    const jobFamily = jobFamiliesMap[familyId];
    if (jobFamily && jobFamily.testMappings.recommended.length > 0) {
      const recommendedTest = jobFamily.testMappings.recommended[0];
      return {
        testId: recommendedTest.testId,
        version: recommendedTest.testVersion || '1.0',
        reason: `Recomendado por Job Family: ${jobFamily.name}`
      };
    }
  }

  return null;
};

// ========== STATISTICS AND ANALYTICS ==========

/**
 * Obtener estadísticas de campaña
 */
export const getCampaignStats = async (orgId, campaignId) => {
  try {
    const [campaign, sessions] = await Promise.all([
      getCampaign(orgId, campaignId),
      getCampaignSessions(orgId, campaignId)
    ]);

    const stats = calculateCampaignStats(campaign, sessions);

    // Actualizar estadísticas en la campaña si han cambiado
    if (JSON.stringify(stats) !== JSON.stringify(campaign.stats)) {
      await updateCampaign(orgId, campaignId, { stats }, 'system');
    }

    return stats;
  } catch (error) {
    console.error('[Campaign] Error loading campaign stats:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas generales de campañas
 */
export const getCampaignsOverview = async (orgId) => {
  try {
    const campaigns = await getOrgCampaigns(orgId);

    const overview = {
      total: campaigns.length,
      byStatus: {
        draft: 0,
        active: 0,
        closed: 0,
        completed: 0
      },
      totalEvaluatees: 0,
      totalInvitations: 0,
      averageCompletionRate: 0
    };

    let totalCompletionRate = 0;
    let campaignsWithStats = 0;

    campaigns.forEach(campaign => {
      overview.byStatus[campaign.status] = (overview.byStatus[campaign.status] || 0) + 1;
      overview.totalEvaluatees += campaign.stats?.totalEvaluatees || 0;
      overview.totalInvitations += campaign.stats?.totalInvitations || 0;

      if (campaign.stats?.completionRate !== undefined) {
        totalCompletionRate += campaign.stats.completionRate;
        campaignsWithStats++;
      }
    });

    overview.averageCompletionRate = campaignsWithStats > 0 ?
      Math.round((totalCompletionRate / campaignsWithStats) * 100) / 100 : 0;

    return overview;
  } catch (error) {
    console.error('[Campaign] Error loading campaigns overview:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener campañas por estado
 */
export const getCampaignsByStatus = async (orgId, status) => {
  try {
    const campaignsRef = collection(db, 'organizations', orgId, 'campaigns');
    const q = query(
      campaignsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[Campaign] Error loading campaigns by status:', error);
    throw error;
  }
};

/**
 * Obtener campañas activas
 */
export const getActiveCampaigns = async (orgId) => {
  return getCampaignsByStatus(orgId, CAMPAIGN_STATUS.ACTIVE);
};

/**
 * Verificar si una campaña puede ser editada
 */
export const canEditCampaign = (campaign) => {
  return campaign.status === CAMPAIGN_STATUS.DRAFT;
};

/**
 * Verificar si una campaña puede ser eliminada
 */
export const canDeleteCampaign = (campaign) => {
  return campaign.status === CAMPAIGN_STATUS.DRAFT;
};

// ========== EXPORT ==========

export default {
  getOrgCampaigns,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  closeCampaign,
  getCampaignSessions,
  getCampaignSession,
  generateEvaluation360Sessions,
  getUsersByFilters,
  getDefaultTestForUser,
  getCampaignStats,
  getCampaignsOverview,
  getCampaignsByStatus,
  getActiveCampaigns,
  canEditCampaign,
  canDeleteCampaign
};
