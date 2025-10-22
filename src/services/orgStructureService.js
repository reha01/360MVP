/**
 * Servicio para gestión de Estructura Organizacional
 * 
 * Maneja CRUD de áreas/departamentos, validaciones, y relaciones jerárquicas
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
  createAreaModel, 
  createExtendedUserModel,
  validateArea, 
  validateExtendedUser,
  validateUniqueNames,
  detectManagerCycles,
  buildOrgTree,
  getAreaById,
  getUsersByArea,
  ORG_LEVELS,
  MANAGER_TYPES
} from '../models/OrgStructure';

// ========== AREA MANAGEMENT ==========

/**
 * Obtener todas las áreas de una organización
 */
export const getOrgAreas = async (orgId) => {
  try {
    const areasRef = collection(db, 'organizations', orgId, 'orgStructure');
    const q = query(
      areasRef,
      where('isActive', '==', true),
      orderBy('level', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const areas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[OrgStructure] Loaded ${areas.length} areas for org ${orgId}`);
    return areas;
  } catch (error) {
    console.error('[OrgStructure] Error loading areas:', error);
    throw new Error(`Error loading organizational structure: ${error.message}`);
  }
};

/**
 * Obtener área específica
 */
export const getArea = async (orgId, areaId) => {
  try {
    const areaRef = doc(db, 'orgs', orgId, 'orgStructure', areaId);
    const snapshot = await getDoc(areaRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Area ${areaId} not found`);
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('[OrgStructure] Error loading area:', error);
    throw error;
  }
};

/**
 * Crear nueva área
 */
export const createArea = async (orgId, areaData, userId) => {
  try {
    // Validar datos
    const validation = validateArea(areaData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener áreas existentes para validar nombres únicos
    const existingAreas = await getOrgAreas(orgId);
    const newArea = createAreaModel({
      ...areaData,
      orgId,
      createdBy: userId,
      updatedBy: userId
    });
    
    // Validar nombre único
    const nameValidation = validateUniqueNames(existingAreas, newArea);
    if (!nameValidation.isValid) {
      throw new Error(`Area name "${newArea.name}" already exists at this level`);
    }
    
    // Construir path jerárquico
    if (newArea.parentId) {
      const parentArea = getAreaById(newArea.parentId, existingAreas);
      if (!parentArea) {
        throw new Error(`Parent area ${newArea.parentId} not found`);
      }
      newArea.path = [...parentArea.path, newArea.areaId];
    } else {
      newArea.path = [newArea.areaId];
    }
    
    // Crear en Firestore
    const areaRef = doc(db, 'orgs', orgId, 'orgStructure', newArea.areaId);
    await updateDoc(areaRef, {
      ...newArea,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[OrgStructure] Created area: ${newArea.name} (${newArea.areaId})`);
    return newArea;
  } catch (error) {
    console.error('[OrgStructure] Error creating area:', error);
    throw error;
  }
};

/**
 * Actualizar área existente
 */
export const updateArea = async (orgId, areaId, updates, userId) => {
  try {
    // Validar datos
    const validation = validateArea(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener área actual
    const currentArea = await getArea(orgId, areaId);
    
    // Obtener áreas existentes para validar nombres únicos
    const existingAreas = await getOrgAreas(orgId);
    
    // Crear área actualizada
    const updatedArea = {
      ...currentArea,
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    };
    
    // Validar nombre único (si cambió)
    if (updates.name && updates.name !== currentArea.name) {
      const nameValidation = validateUniqueNames(existingAreas, updatedArea);
      if (!nameValidation.isValid) {
        throw new Error(`Area name "${updates.name}" already exists at this level`);
      }
    }
    
    // Actualizar en Firestore
    const areaRef = doc(db, 'orgs', orgId, 'orgStructure', areaId);
    await updateDoc(areaRef, updatedArea);
    
    console.log(`[OrgStructure] Updated area: ${updatedArea.name} (${areaId})`);
    return updatedArea;
  } catch (error) {
    console.error('[OrgStructure] Error updating area:', error);
    throw error;
  }
};

/**
 * Eliminar área (soft delete)
 */
export const deleteArea = async (orgId, areaId, userId) => {
  try {
    // Verificar que no tenga áreas hijas
    const childAreas = await getChildAreas(orgId, areaId);
    if (childAreas.length > 0) {
      throw new Error('Cannot delete area with child areas. Delete children first.');
    }
    
    // Verificar que no tenga usuarios asignados
    const areaUsers = await getUsersByArea(orgId, areaId);
    if (areaUsers.length > 0) {
      throw new Error('Cannot delete area with assigned users. Reassign users first.');
    }
    
    // Soft delete
    const areaRef = doc(db, 'orgs', orgId, 'orgStructure', areaId);
    await updateDoc(areaRef, {
      isActive: false,
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[OrgStructure] Deleted area: ${areaId}`);
    return true;
  } catch (error) {
    console.error('[OrgStructure] Error deleting area:', error);
    throw error;
  }
};

/**
 * Obtener áreas hijas
 */
export const getChildAreas = async (orgId, parentId) => {
  try {
    const areasRef = collection(db, 'organizations', orgId, 'orgStructure');
    const q = query(
      areasRef,
      where('parentId', '==', parentId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[OrgStructure] Error loading child areas:', error);
    throw error;
  }
};

// ========== USER MANAGEMENT ==========

/**
 * Obtener usuarios de una organización
 */
export const getOrgUsers = async (orgId) => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const q = query(
      membersRef,
      where('isActive', '==', true),
      orderBy('displayName', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[OrgStructure] Loaded ${users.length} users for org ${orgId}`);
    return users;
  } catch (error) {
    console.error('[OrgStructure] Error loading users:', error);
    throw new Error(`Error loading users: ${error.message}`);
  }
};

/**
 * Obtener usuarios por área
 */
export const getUsersByArea = async (orgId, areaId) => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const q = query(
      membersRef,
      where('areaId', '==', areaId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[OrgStructure] Error loading users by area:', error);
    throw error;
  }
};

/**
 * Actualizar usuario con estructura organizacional
 */
export const updateUserStructure = async (orgId, userId, updates, updatedBy) => {
  try {
    // Validar datos
    const validation = validateExtendedUser(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Obtener usuarios para validar ciclos de manager
    const allUsers = await getOrgUsers(orgId);
    
    // Crear usuario actualizado
    const updatedUser = {
      ...updates,
      updatedBy,
      updatedAt: serverTimestamp()
    };
    
    // Validar ciclos de manager (si cambió managerId)
    if (updates.managerId) {
      const testUsers = allUsers.map(user => 
        user.id === userId ? { ...user, ...updatedUser } : user
      );
      const cycles = detectManagerCycles(testUsers);
      if (cycles.length > 0) {
        throw new Error('Manager assignment would create a circular relationship');
      }
    }
    
    // Actualizar en Firestore
    const userRef = doc(db, 'orgs', orgId, 'members', userId);
    await updateDoc(userRef, updatedUser);
    
    console.log(`[OrgStructure] Updated user structure: ${userId}`);
    return updatedUser;
  } catch (error) {
    console.error('[OrgStructure] Error updating user structure:', error);
    throw error;
  }
};

// ========== BULK OPERATIONS ==========

/**
 * Importar estructura desde CSV
 */
export const importStructureFromCSV = async (orgId, csvData, userId) => {
  try {
    const batch = writeBatch(db);
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };
    
    // Procesar cada fila
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2; // +2 porque CSV tiene header y es 0-indexed
      
      try {
        // Validar datos de la fila
        const validation = validateArea(row);
        if (!validation.isValid) {
          results.errors.push({
            row: rowNum,
            errors: validation.errors
          });
          continue;
        }
        
        // Crear área
        const area = createAreaModel({
          ...row,
          orgId,
          createdBy: userId,
          updatedBy: userId
        });
        
        // Agregar a batch
        const areaRef = doc(db, 'orgs', orgId, 'orgStructure', area.areaId);
        batch.set(areaRef, {
          ...area,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        results.created++;
      } catch (error) {
        results.errors.push({
          row: rowNum,
          errors: [error.message]
        });
      }
    }
    
    // Ejecutar batch
    if (results.created > 0) {
      await batch.commit();
    }
    
    console.log(`[OrgStructure] CSV import completed: ${results.created} created, ${results.errors.length} errors`);
    return results;
  } catch (error) {
    console.error('[OrgStructure] Error importing from CSV:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener árbol completo de estructura
 */
export const getOrgTree = async (orgId) => {
  try {
    const areas = await getOrgAreas(orgId);
    return buildOrgTree(areas);
  } catch (error) {
    console.error('[OrgStructure] Error building org tree:', error);
    throw error;
  }
};

/**
 * Validar estructura completa
 */
export const validateOrgStructure = async (orgId) => {
  try {
    const [areas, users] = await Promise.all([
      getOrgAreas(orgId),
      getOrgUsers(orgId)
    ]);
    
    const issues = [];
    
    // Validar ciclos de manager
    const cycles = detectManagerCycles(users);
    if (cycles.length > 0) {
      issues.push({
        type: 'manager_cycles',
        message: 'Circular manager relationships detected',
        cycles
      });
    }
    
    // Validar áreas huérfanas
    const orphanAreas = areas.filter(area => 
      area.parentId && !getAreaById(area.parentId, areas)
    );
    if (orphanAreas.length > 0) {
      issues.push({
        type: 'orphan_areas',
        message: 'Areas with invalid parent references',
        areas: orphanAreas
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('[OrgStructure] Error validating structure:', error);
    throw error;
  }
};

// ========== EXPORT ==========

export default {
  // Area management
  getOrgAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
  getChildAreas,
  
  // User management
  getOrgUsers,
  getUsersByArea,
  updateUserStructure,
  
  // Bulk operations
  importStructureFromCSV,
  
  // Utilities
  getOrgTree,
  validateOrgStructure
};
