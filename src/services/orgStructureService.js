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

    // Intentar consulta con índice compuesto primero
    let q;
    let snapshot;

    try {
      q = query(
        areasRef,
        where('isActive', '==', true),
        orderBy('level', 'asc'),
        orderBy('name', 'asc')
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      // Si falla por índice faltante, intentar consulta más simple
      console.warn('[OrgStructure] Index query failed, trying simpler query:', indexError);
      try {
        // Intentar solo con isActive y ordenar por name
        q = query(
          areasRef,
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
        snapshot = await getDocs(q);
      } catch (simpleError) {
        // Si aún falla, obtener todos y filtrar/ordenar en memoria
        console.warn('[OrgStructure] Simple query failed, loading all and filtering in memory:', simpleError);
        q = query(areasRef);
        snapshot = await getDocs(q);
      }
    }

    let areas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar y ordenar en memoria si no se pudo hacer en Firestore
    areas = areas.filter(area => area.isActive !== false);
    areas.sort((a, b) => {
      // Ordenar por level primero, luego por name
      if (a.level !== b.level) {
        return (a.level || 0) - (b.level || 0);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log(`[OrgStructure] Loaded ${areas.length} areas for org ${orgId}`);
    return areas;
  } catch (error) {
    console.error('[OrgStructure] Error loading areas:', error);
    // Retornar array vacío en lugar de lanzar error para que la UI no se rompa
    console.warn('[OrgStructure] Returning empty array due to error');
    return [];
  }
};

/**
 * Obtener área específica
 */
export const getArea = async (orgId, areaId) => {
  try {
    const areaRef = doc(db, 'organizations', orgId, 'orgStructure', areaId);
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

    // Crear en Firestore usando la ruta correcta y addDoc
    const areasRef = collection(db, 'organizations', orgId, 'orgStructure');
    const docRef = await addDoc(areasRef, {
      ...newArea,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[OrgStructure] Created area: ${newArea.name} (${docRef.id})`);
    return {
      ...newArea,
      id: docRef.id
    };
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
    const areaRef = doc(db, 'organizations', orgId, 'orgStructure', areaId);
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
    const areaRef = doc(db, 'organizations', orgId, 'orgStructure', areaId);
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

    // Intentar consulta con índice compuesto primero
    let q;
    let snapshot;

    try {
      q = query(
        areasRef,
        where('parentId', '==', parentId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      // Si falla por índice faltante, intentar consulta más simple
      console.warn('[OrgStructure] Index query failed for child areas, trying simpler query:', indexError);
      try {
        // Intentar solo con parentId y isActive, sin orderBy
        q = query(
          areasRef,
          where('parentId', '==', parentId),
          where('isActive', '==', true)
        );
        snapshot = await getDocs(q);
      } catch (simpleError) {
        // Si aún falla, obtener todas las áreas y filtrar en memoria
        console.warn('[OrgStructure] Simple query failed for child areas, loading all and filtering in memory:', simpleError);
        q = query(areasRef);
        snapshot = await getDocs(q);
      }
    }

    let childAreas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en memoria si no se pudo filtrar en Firestore
    childAreas = childAreas.filter(area =>
      area.parentId === parentId && area.isActive !== false
    );

    // Ordenar por nombre si no se pudo ordenar en Firestore
    childAreas.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return childAreas;
  } catch (error) {
    console.error('[OrgStructure] Error loading child areas:', error);
    // Retornar array vacío en lugar de lanzar error para que la UI no se rompa
    return [];
  }
};

// ========== USER MANAGEMENT ==========

/**
 * Obtener usuarios de una organización
 */
export const getOrgUsers = async (orgId) => {
  try {
    const membersRef = collection(db, 'organizations', orgId, 'members');

    // Intentar con filtro isActive primero, si falla (por índice o campo faltante), obtener todos
    let q;
    let snapshot;

    try {
      q = query(
        membersRef,
        where('isActive', '==', true),
        orderBy('displayName', 'asc')
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      // Si falla por índice o campo faltante, obtener todos y filtrar en memoria
      console.warn('[OrgStructure] isActive filter failed, loading all users:', indexError);
      q = query(membersRef, orderBy('displayName', 'asc'));
      snapshot = await getDocs(q);
    }

    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrar en memoria si no se pudo filtrar en Firestore
      .filter(user => user.isActive !== false); // Incluir si isActive es true o undefined

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

    // Intentar consulta con filtros primero
    let q;
    let snapshot;

    try {
      q = query(
        membersRef,
        where('areaId', '==', areaId),
        where('isActive', '==', true)
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      // Si falla por índice faltante, obtener todos y filtrar en memoria
      console.warn('[OrgStructure] Index query failed for users by area, loading all and filtering in memory:', indexError);
      q = query(membersRef);
      snapshot = await getDocs(q);
    }

    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar en memoria si no se pudo filtrar en Firestore
    users = users.filter(user =>
      user.areaId === areaId && user.isActive !== false
    );

    return users;
  } catch (error) {
    console.error('[OrgStructure] Error loading users by area:', error);
    // Retornar array vacío en lugar de lanzar error para que la UI no se rompa
    return [];
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

    // Actualizar en Firestore - Los miembros están en la colección raíz 'members' con campo orgId
    const userRef = doc(db, 'members', userId);
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
        const areaRef = doc(db, 'organizations', orgId, 'orgStructure', area.areaId);
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
    if (!areas || areas.length === 0) {
      return null;
    }
    return buildOrgTree(areas);
  } catch (error) {
    console.error('[OrgStructure] Error building org tree:', error);
    // Retornar null en lugar de lanzar error para que la UI no se rompa
    return null;
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

/**
 * Obtener un usuario específico
 */
export const getOrgUser = async (orgId, userId) => {
  try {
    const memberRef = doc(db, 'organizations', orgId, 'members', userId);
    const snapshot = await getDoc(memberRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }

    // Fallback: try root 'members' collection
    const rootMemberRef = doc(db, 'members', userId);
    const rootSnapshot = await getDoc(rootMemberRef);
    if (rootSnapshot.exists() && rootSnapshot.data().orgId === orgId) {
      return { id: rootSnapshot.id, ...rootSnapshot.data() };
    }

    return null;
  } catch (error) {
    console.error(`[OrgStructure] Error loading user ${userId}:`, error);
    return null;
  }
};

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
  getOrgUser, // Added this
  getUsersByArea,
  updateUserStructure,

  // Bulk operations
  importStructureFromCSV,

  // Utilities
  getOrgTree,
  validateOrgStructure
};

// Added for Sprint 7 - Member Manager
export const updateOrgMember = async (orgId, memberId, updates) => {
  try {
    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[OrgStructure] Error updating member:', error);
    throw error;
  }
};

