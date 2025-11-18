/**
 * Role Service - Gestión de roles por organización
 * 
 * Permite definir y validar roles personalizados por organización
 */

import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Obtener roles definidos para una organización
 * @param {string} orgId - ID de la organización
 * @returns {Promise<Array<string>>} Array de roles válidos
 */
export const getOrgRoles = async (orgId) => {
  try {
    if (!orgId) {
      // Roles por defecto si no hay orgId
      return ['member', 'admin', 'owner', 'manager'];
    }

    const rolesRef = doc(db, 'organizations', orgId, 'settings', 'roles');
    const rolesDoc = await getDoc(rolesRef);

    if (rolesDoc.exists()) {
      const data = rolesDoc.data();
      return data.roles || ['member', 'admin', 'owner', 'manager'];
    }

    // Si no existe, crear con roles por defecto
    const defaultRoles = ['member', 'admin', 'owner', 'manager'];
    await setDoc(rolesRef, {
      roles: defaultRoles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return defaultRoles;
  } catch (error) {
    console.error('[RoleService] Error getting org roles:', error);
    // Retornar roles por defecto en caso de error
    return ['member', 'admin', 'owner', 'manager'];
  }
};

/**
 * Guardar roles para una organización
 * @param {string} orgId - ID de la organización
 * @param {Array<string>} roles - Array de roles válidos
 * @returns {Promise<void>}
 */
export const saveOrgRoles = async (orgId, roles) => {
  try {
    if (!orgId) {
      throw new Error('orgId es requerido');
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('roles debe ser un array no vacío');
    }

    const rolesRef = doc(db, 'organizations', orgId, 'settings', 'roles');
    await setDoc(rolesRef, {
      roles: roles,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[RoleService] Saved ${roles.length} roles for org ${orgId}`);
  } catch (error) {
    console.error('[RoleService] Error saving org roles:', error);
    throw error;
  }
};

/**
 * Validar si un rol es válido para una organización
 * @param {string} orgId - ID de la organización
 * @param {string} role - Rol a validar
 * @returns {Promise<boolean>}
 */
export const validateRole = async (orgId, role) => {
  try {
    const validRoles = await getOrgRoles(orgId);
    return validRoles.includes(role?.toLowerCase()?.trim());
  } catch (error) {
    console.error('[RoleService] Error validating role:', error);
    return false;
  }
};

/**
 * Normalizar rol (lowercase, trim)
 * @param {string} role - Rol a normalizar
 * @returns {string}
 */
export const normalizeRole = (role) => {
  if (!role) return '';
  return role.toLowerCase().trim();
};

export default {
  getOrgRoles,
  saveOrgRoles,
  validateRole,
  normalizeRole
};

