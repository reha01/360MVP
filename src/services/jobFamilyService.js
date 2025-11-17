
/**
 * Servicio para gestión de Job Families
 * 
 * Maneja CRUD de familias de puestos, mapeo de tests,
 * y configuración de evaluadores
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
  createJobFamilyModel, 
  createTestMappingModel,
  validateJobFamily, 
  validateTestMapping,
  getJobFamilyById,
  getActiveJobFamilies,
  JOB_LEVELS
} from '../models/JobFamily';

// ========== JOB FAMILY MANAGEMENT ==========

/**
 * Obtener todas las Job Families de una organización
 */
export const getOrgJobFamilies = async (orgId) => {
  try {
    const jobFamiliesRef = collection(db, 'organizations', orgId, 'jobFamilies');
    const q = query(
      jobFamiliesRef,
      where('isActive', '==', true),
      orderBy('level', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const jobFamilies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[JobFamily] Loaded ${jobFamilies.length} job families for org ${orgId}`);
    return jobFamilies;
  } catch (error) {
    console.error('[JobFamily] Error loading job families:', error);
    throw new Error(`Error loading job families: ${error.message}`);
  }
};

/**
 * Obtener Job Family específica
 */
export const getJobFamily = async (orgId, familyId) => {
  try {
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    const snapshot = await getDoc(jobFamilyRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Job Family ${familyId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[JobFamily] Error loading job family:', error);
    throw error;
  }
};

/**
 * Crear nueva Job Family
 */
export const createJobFamily = async (orgId, jobFamilyData, userId) => {
  try {
    // Validar datos
    const validation = validateJobFamily(jobFamilyData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener Job Families existentes para validar nombres únicos
    const existingJobFamilies = await getOrgJobFamilies(orgId);
    
    // Validar nombre único
    const duplicateName = existingJobFamilies.find(family => 
      family.name.toLowerCase() === jobFamilyData.name.toLowerCase()
    );
    if (duplicateName) {
      throw new Error(`Job Family name "${jobFamilyData.name}" already exists`);
    }
    
    // Crear Job Family
    const newJobFamily = createJobFamilyModel({
      ...jobFamilyData,
      orgId,
      createdBy: userId,
      updatedBy: userId
    });
    
    // Crear en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', newJobFamily.familyId);
    await updateDoc(jobFamilyRef, {
      ...newJobFamily,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[JobFamily] Created job family: ${newJobFamily.name} (${newJobFamily.familyId})`);
    return newJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error creating job family:', error);
    throw error;
  }
};

/**
 * Actualizar Job Family existente
 */
export const updateJobFamily = async (orgId, familyId, updates, userId) => {
  try {
    // Validar datos
    const validation = validateJobFamily(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener Job Family actual
    const currentJobFamily = await getJobFamily(orgId, familyId);
    
    // Obtener Job Families existentes para validar nombres únicos
    const existingJobFamilies = await getOrgJobFamilies(orgId);
    
    // Validar nombre único (si cambió)
    if (updates.name && updates.name !== currentJobFamily.name) {
      const duplicateName = existingJobFamilies.find(family => 
        family.id !== familyId && 
        family.name.toLowerCase() === updates.name.toLowerCase()
      );
      if (duplicateName) {
        throw new Error(`Job Family name "${updates.name}" already exists`);
      }
    }
    
    // Crear Job Family actualizada
    const updatedJobFamily = {
      ...currentJobFamily,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Actualizar en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, updatedJobFamily);
    
    console.log(`[JobFamily] Updated job family: ${updatedJobFamily.name} (${familyId})`);
    return updatedJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error updating job family:', error);
    throw error;
  }
};

/**
 * Eliminar Job Family (soft delete)
 */
export const deleteJobFamily = async (orgId, familyId, userId) => {
  try {
    // Verificar que no tenga usuarios asignados
    const users = await getUsersByJobFamily(orgId, familyId);
    if (users.length > 0) {
      throw new Error('Cannot delete job family with assigned users. Reassign users first.');
    }
    
    // Soft delete
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, {
      isActive: false,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[JobFamily] Deleted job family: ${familyId}`);
    return true;
  } catch (error) {
    console.error('[JobFamily] Error deleting job family:', error);
    throw error;
  }
};

// ========== TEST MAPPING MANAGEMENT ==========

/**
 * Agregar test recomendado a Job Family
 */
export const addRecommendedTest = async (orgId, familyId, testMapping, userId) => {
  try {
    // Validar test mapping
    const validation = validateTestMapping(testMapping);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener Job Family actual
    const jobFamily = await getJobFamily(orgId, familyId);
    
    // Verificar que no esté ya en recomendados
    const existingRecommended = jobFamily.testMappings.recommended.find(
      t => t.testId === testMapping.testId
    );
    if (existingRecommended) {
      throw new Error('Test already in recommended list');
    }
    
    // Verificar que no esté en excluidos
    if (jobFamily.testMappings.excluded.includes(testMapping.testId)) {
      throw new Error('Cannot add excluded test to recommended list');
    }
    
    // Crear test mapping
    const newTestMapping = createTestMappingModel(testMapping);
    
    // Actualizar Job Family
    const updatedJobFamily = {
      ...jobFamily,
      testMappings: {
        ...jobFamily.testMappings,
        recommended: [...jobFamily.testMappings.recommended, newTestMapping]
      },
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Guardar en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, updatedJobFamily);
    
    console.log(`[JobFamily] Added recommended test: ${testMapping.testId} to ${familyId}`);
    return updatedJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error adding recommended test:', error);
    throw error;
  }
};

/**
 * Remover test recomendado de Job Family
 */
export const removeRecommendedTest = async (orgId, familyId, testId, userId) => {
  try {
    // Obtener Job Family actual
    const jobFamily = await getJobFamily(orgId, familyId);
    
    // Remover de recomendados
    const updatedRecommended = jobFamily.testMappings.recommended.filter(
      t => t.testId !== testId
    );
    
    // Actualizar Job Family
    const updatedJobFamily = {
      ...jobFamily,
      testMappings: {
        ...jobFamily.testMappings,
        recommended: updatedRecommended
      },
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Guardar en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, updatedJobFamily);
    
    console.log(`[JobFamily] Removed recommended test: ${testId} from ${familyId}`);
    return updatedJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error removing recommended test:', error);
    throw error;
  }
};

/**
 * Agregar test permitido a Job Family
 */
export const addAllowedTest = async (orgId, familyId, testId, userId) => {
  try {
    // Obtener Job Family actual
    const jobFamily = await getJobFamily(orgId, familyId);
    
    // Verificar que no esté ya en permitidos
    if (jobFamily.testMappings.allowed.includes(testId)) {
      throw new Error('Test already in allowed list');
    }
    
    // Verificar que no esté en excluidos
    if (jobFamily.testMappings.excluded.includes(testId)) {
      throw new Error('Cannot add excluded test to allowed list');
    }
    
    // Actualizar Job Family
    const updatedJobFamily = {
      ...jobFamily,
      testMappings: {
        ...jobFamily.testMappings,
        allowed: [...jobFamily.testMappings.allowed, testId]
      },
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Guardar en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, updatedJobFamily);
    
    console.log(`[JobFamily] Added allowed test: ${testId} to ${familyId}`);
    return updatedJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error adding allowed test:', error);
    throw error;
  }
};

/**
 * Agregar test excluido a Job Family
 */
export const addExcludedTest = async (orgId, familyId, testId, userId) => {
  try {
    // Obtener Job Family actual
    const jobFamily = await getJobFamily(orgId, familyId);
    
    // Verificar que no esté ya en excluidos
    if (jobFamily.testMappings.excluded.includes(testId)) {
      throw new Error('Test already in excluded list');
    }
    
    // Remover de recomendados y permitidos si está
    const updatedRecommended = jobFamily.testMappings.recommended.filter(
      t => t.testId !== testId
    );
    const updatedAllowed = jobFamily.testMappings.allowed.filter(
      id => id !== testId
    );
    
    // Actualizar Job Family
    const updatedJobFamily = {
      ...jobFamily,
      testMappings: {
        recommended: updatedRecommended,
        allowed: updatedAllowed,
        excluded: [...jobFamily.testMappings.excluded, testId]
      },
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Guardar en Firestore
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, updatedJobFamily);
    
    console.log(`[JobFamily] Added excluded test: ${testId} to ${familyId}`);
    return updatedJobFamily;
  } catch (error) {
    console.error('[JobFamily] Error adding excluded test:', error);
    throw error;
  }
};

// ========== USER ASSIGNMENT MANAGEMENT ==========

/**
 * Obtener usuarios asignados a una Job Family
 */
export const getUsersByJobFamily = async (orgId, familyId) => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const q = query(
      membersRef,
      where('jobFamilyIds', 'array-contains', familyId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[JobFamily] Found ${users.length} users assigned to job family ${familyId}`);
    return users;
  } catch (error) {
    console.error('[JobFamily] Error loading users by job family:', error);
    throw error;
  }
};

/**
 * Asignar Job Family a usuario
 */
export const assignJobFamilyToUser = async (orgId, userId, familyId, assignedBy) => {
  try {
    // Obtener usuario actual
    const userRef = doc(db, 'orgs', orgId, 'members', userId);
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = userSnapshot.data();
    const currentJobFamilyIds = user.jobFamilyIds || [];
    
    // Verificar que no esté ya asignado
    if (currentJobFamilyIds.includes(familyId)) {
      throw new Error('User already assigned to this job family');
    }
    
    // Actualizar usuario
    await updateDoc(userRef, {
      jobFamilyIds: [...currentJobFamilyIds, familyId],
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar contador de miembros en Job Family
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, {
      memberCount: (user.memberCount || 0) + 1,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[JobFamily] Assigned user ${userId} to job family ${familyId}`);
    return true;
  } catch (error) {
    console.error('[JobFamily] Error assigning job family to user:', error);
    throw error;
  }
};

/**
 * Remover Job Family de usuario
 */
export const removeJobFamilyFromUser = async (orgId, userId, familyId, updatedBy) => {
  try {
    // Obtener usuario actual
    const userRef = doc(db, 'orgs', orgId, 'members', userId);
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error(`User ${userId} not found`);
    }
    
    const user = userSnapshot.data();
    const currentJobFamilyIds = user.jobFamilyIds || [];
    
    // Verificar que esté asignado
    if (!currentJobFamilyIds.includes(familyId)) {
      throw new Error('User not assigned to this job family');
    }
    
    // Actualizar usuario
    await updateDoc(userRef, {
      jobFamilyIds: currentJobFamilyIds.filter(id => id !== familyId),
      updatedBy,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar contador de miembros en Job Family
    const jobFamilyRef = doc(db, 'orgs', orgId, 'jobFamilies', familyId);
    await updateDoc(jobFamilyRef, {
      memberCount: Math.max((user.memberCount || 0) - 1, 0),
      updatedBy,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[JobFamily] Removed user ${userId} from job family ${familyId}`);
    return true;
  } catch (error) {
    console.error('[JobFamily] Error removing job family from user:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener Job Families por nivel
 */
export const getJobFamiliesByLevel = async (orgId, level) => {
  try {
    const jobFamiliesRef = collection(db, 'organizations', orgId, 'jobFamilies');
    const q = query(
      jobFamiliesRef,
      where('level', '==', level),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[JobFamily] Error loading job families by level:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de Job Families
 */
export const getJobFamilyStats = async (orgId) => {
  try {
    const [jobFamilies, users] = await Promise.all([
      getOrgJobFamilies(orgId),
      getOrgUsers(orgId)
    ]);
    
    const stats = {
      totalJobFamilies: jobFamilies.length,
      totalUsers: users.length,
      byLevel: {},
      byTestMapping: {
        withRecommended: 0,
        withAllowed: 0,
        withExcluded: 0
      }
    };
    
    // Estadísticas por nivel
    Object.values(JOB_LEVELS).forEach(level => {
      stats.byLevel[level] = jobFamilies.filter(f => f.level === level).length;
    });
    
    // Estadísticas por mapeo de tests
    jobFamilies.forEach(family => {
      if (family.testMappings.recommended.length > 0) {
        stats.byTestMapping.withRecommended++;
      }
      if (family.testMappings.allowed.length > 0) {
        stats.byTestMapping.withAllowed++;
      }
      if (family.testMappings.excluded.length > 0) {
        stats.byTestMapping.withExcluded++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('[JobFamily] Error loading job family stats:', error);
    throw error;
  }
};

// ========== EXPORT ==========

export default {
  // Job Family management
  getOrgJobFamilies,
  getJobFamily,
  createJobFamily,
  updateJobFamily,
  deleteJobFamily,
  
  // Test mapping management
  addRecommendedTest,
  removeRecommendedTest,
  addAllowedTest,
  addExcludedTest,
  
  // User assignment management
  getUsersByJobFamily,
  assignJobFamilyToUser,
  removeJobFamilyFromUser,
  
  // Utilities
  getJobFamiliesByLevel,
  getJobFamilyStats
};
