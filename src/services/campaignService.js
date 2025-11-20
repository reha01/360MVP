/**
 * Servicio para gestiÃ³n de Campaigns 360Â°
 * 
 * Maneja CRUD de campaÃ±as, sesiones de evaluaciÃ³n 360Â°,
 * y generaciÃ³n automÃ¡tica de evaluadores
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
import orgStructureService from './orgStructureService';
import evaluatorAssignmentService from './evaluatorAssignmentService';

// ========== CAMPAIGN MANAGEMENT ==========

/**
 * Obtener todas las campaÃ±as de una organizaciÃ³n
 */
export const getOrgCampaigns = async (orgId) => {
  try {
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
 * Obtener campañas con filtros y paginación (para dashboard)
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

    // Ordenar por fecha de creación
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Nota: Los filtros de fecha se aplican en memoria después de obtener los datos
    // porque requieren índices compuestos en Firestore para campos anidados (config.startDate)

    // Paginación
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    
    // Obtener datos con límite
    q = query(q, limit(pageSize * page)); // Obtener hasta la página actual
    const snapshot = await getDocs(q);
    
    let campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar por búsqueda de texto en memoria (si se proporciona)
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
        // Verificar si algún test asignado corresponde a la Job Family
        const testAssignments = c.testAssignments || {};
        return Object.values(testAssignments).some(assignment => {
          // Aquí se podría verificar contra Job Family mappings
          // Por ahora, filtramos por testId si coincide
          return assignment.testId && assignment.testId.includes(options.jobFamily);
        });
      });
    }

    // Aplicar paginación en memoria
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
 * Obtener campaÃ±a especÃ­fica
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
 * Crear nueva campaÃ±a
 */
export const createCampaign = async (orgId, campaignData, userId) => {
  try {
    // Validar datos
    const validation = validateCampaign(campaignData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Crear campaÃ±a
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
 * Actualizar campaÃ±a existente
 */
export const updateCampaign = async (orgId, campaignId, updates, userId) => {
  try {
    // Validar datos
    const validation = validateCampaign(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener campaÃ±a actual
    const currentCampaign = await getCampaign(orgId, campaignId);
    
    // Crear campaÃ±a actualizada
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
 * Activar campaÃ±a
 */
export const activateCampaign = async (orgId, campaignId, userId) => {
  try {
    // Obtener campaÃ±a actual
    const campaign = await getCampaign(orgId, campaignId);
    
    // Verificar que puede activarse
    const activationCheck = canActivateCampaign(campaign);
    if (!activationCheck.canActivate) {
      throw new Error(`Cannot activate campaign: ${activationCheck.issues.join(', ')}`);
    }
    
    // Generar sesiones de evaluaciÃ³n 360Â°
    const sessions = await generateEvaluation360Sessions(orgId, campaignId, campaign);
    
    // Actualizar campaÃ±a
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
 * Cerrar campaÃ±a
 */
export const closeCampaign = async (orgId, campaignId, userId) => {
  try {
    // Obtener campaÃ±a actual
    const campaign = await getCampaign(orgId, campaignId);
    
    if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      throw new Error('Only active campaigns can be closed');
    }
    
    // Actualizar campaÃ±a
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
 * Obtener sesiones de evaluación 360° de una campaña
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
 * Obtener sesión 360° específica por ID
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
 * Generar sesiones de evaluaciÃ³n 360Â° para una campaÃ±a
 */
export const generateEvaluation360Sessions = async (orgId, campaignId, campaign) => {
  try {
    // Obtener usuarios segÃºn filtros
    const users = await getUsersByFilters(orgId, campaign.evaluateeFilters);
    
    if (users.length === 0) {
      throw new Error('No users found matching the campaign filters');
    }
    
    // Obtener Job Families para asignaciÃ³n automÃ¡tica de tests
    const jobFamilies = await jobFamilyService.getOrgJobFamilies(orgId);
    const jobFamiliesMap = jobFamilies.reduce((acc, family) => {
      acc[family.id] = family;
      return acc;
    }, {});
    
    // Crear sesiones
    const batch = writeBatch(db);
    const sessions = [];
    
    for (const user of users) {
      // Determinar test asignado
      const testAssignment = campaign.testAssignments[user.id] || 
                            getDefaultTestForUser(user, jobFamiliesMap);
      
      if (!testAssignment) {
        console.warn(`[Campaign] No test assigned for user ${user.id}, skipping`);
        continue;
      }
      
      // Generar configuraciÃ³n de evaluadores basada en Job Family
      const userJobFamilies = user.jobFamilyIds || [];
      const primaryJobFamily = userJobFamilies.length > 0 ? 
                              jobFamiliesMap[userJobFamilies[0]] : null;
      
      const evaluatorConfig = generateEvaluatorConfigFromJobFamily(primaryJobFamily);
      
      // Crear sesiÃ³n
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
 * Obtener usuarios segÃºn filtros de campaÃ±a
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
    
    // Filtrar por Ãreas
    if (filters.areaIds && filters.areaIds.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        filters.areaIds.includes(user.areaId) || 
        filters.areaIds.includes(user.departmentId)
      );
    }
    
    // Filtrar por IDs especÃ­ficos
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
 * Obtener estadÃ­sticas de campaÃ±a
 */
export const getCampaignStats = async (orgId, campaignId) => {
  try {
    const [campaign, sessions] = await Promise.all([
      getCampaign(orgId, campaignId),
      getCampaignSessions(orgId, campaignId)
    ]);
    
    const stats = calculateCampaignStats(campaign, sessions);
    
    // Actualizar estadÃ­sticas en la campaÃ±a si han cambiado
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
 * Obtener estadÃ­sticas generales de campaÃ±as
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
 * Obtener campaÃ±as por estado
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
 * Obtener campaÃ±as activas
 */
export const getActiveCampaigns = async (orgId) => {
  return getCampaignsByStatus(orgId, CAMPAIGN_STATUS.ACTIVE);
};

/**
 * Verificar si una campaÃ±a puede ser editada
 */
export const canEditCampaign = (campaign) => {
  return campaign.status === CAMPAIGN_STATUS.DRAFT;
};

/**
 * Verificar si una campaÃ±a puede ser eliminada
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
