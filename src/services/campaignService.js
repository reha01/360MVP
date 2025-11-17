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
 * Obtener campaÃ±as con filtros y paginaciÃ³n (para dashboard)
 */
export const getCampaigns = async (orgId, options = {}) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    // Mock data para desarrollo
    const mockCampaigns = [
      {
        id: 'campaign-1',
        name: 'EvaluaciÃ³n Q1 2024',
        description: 'EvaluaciÃ³n trimestral de liderazgo',
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
        evaluationCount: 45,
        testId: 'leadership-v1',
        testVersion: '1.0.0',
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'campaign-2',
        name: 'EvaluaciÃ³n Q2 2024',
        description: 'EvaluaciÃ³n de competencias tÃ©cnicas',
        status: 'completed',
        startDate: '2024-04-01',
        endDate: '2024-05-01',
        evaluationCount: 67,
        testId: 'technical-v2',
        testVersion: '2.0.0',
        createdAt: new Date('2024-03-15')
      },
      {
        id: 'campaign-3',
        name: 'EvaluaciÃ³n Anual 2024',
        description: 'EvaluaciÃ³n integral anual',
        status: 'active',
        startDate: '2024-10-01',
        endDate: '2024-11-30',
        evaluationCount: 120,
        testId: 'leadership-v1',
        testVersion: '1.0.0',
        createdAt: new Date('2024-09-20')
      },
      {
        id: 'campaign-4',
        name: 'EvaluaciÃ³n Ventas Q3',
        description: 'EvaluaciÃ³n del equipo de ventas',
        status: 'draft',
        startDate: '2024-07-01',
        endDate: '2024-07-31',
        evaluationCount: 0,
        testId: 'sales-v1',
        testVersion: '1.0.0',
        createdAt: new Date('2024-06-15')
      },
      {
        id: 'campaign-5',
        name: 'DST Test Campaign',
        description: 'CampaÃ±a que cruza cambio de hora',
        status: 'active',
        startDate: '2024-08-15',
        endDate: '2024-10-15',
        evaluationCount: 89,
        testId: 'leadership-v1',
        testVersion: '1.0.0',
        crossesDST: true,
        createdAt: new Date('2024-08-01')
      }
    ];

    // Aplicar filtros
    let filteredCampaigns = [...mockCampaigns];
    
    if (options.search) {
      filteredCampaigns = filteredCampaigns.filter(c => 
        c.name.toLowerCase().includes(options.search.toLowerCase()) ||
        c.description.toLowerCase().includes(options.search.toLowerCase())
      );
    }
    
    if (options.status && options.status !== 'all') {
      filteredCampaigns = filteredCampaigns.filter(c => c.status === options.status);
    }
    
    if (options.jobFamily && options.jobFamily !== 'all') {
      // Mapear job family basado en testId
      const jobFamilyMap = {
        'leadership': ['leadership-v1', 'leadership-v2'],
        'technical': ['technical-v1', 'technical-v2'],
        'sales': ['sales-v1', 'sales-v2']
      };
      const testIds = jobFamilyMap[options.jobFamily] || [];
      filteredCampaigns = filteredCampaigns.filter(c => testIds.includes(c.testId));
    }
    
    if (options.dateFrom) {
      filteredCampaigns = filteredCampaigns.filter(c => 
        new Date(c.startDate) >= new Date(options.dateFrom)
      );
    }
    
    if (options.dateTo) {
      filteredCampaigns = filteredCampaigns.filter(c => 
        new Date(c.endDate) <= new Date(options.dateTo)
      );
    }
    
    // PaginaciÃ³n
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredCampaigns.length;
    
    console.log(`[Campaign] Returning ${paginatedCampaigns.length} campaigns for org ${orgId} (page ${page})`);
    
    return {
      campaigns: paginatedCampaigns,
      total: filteredCampaigns.length,
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
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', campaignId);
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
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', newCampaign.campaignId);
    await updateDoc(campaignRef, {
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
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', campaignId);
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
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', campaignId);
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
    const campaignRef = doc(db, 'orgs', orgId, 'campaigns', campaignId);
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
 * Obtener sesiones de evaluaciÃ³n 360Â° de una campaÃ±a
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
      const sessionRef = doc(db, 'orgs', orgId, 'evaluation360Sessions', session.session360Id);
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
