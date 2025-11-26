/**
 * Super Admin Service
 * 
 * Servicio para operaciones exclusivas del Super Admin
 * - Gestión de organizaciones (tenants)
 * - Creación de organizaciones con owner inicial
 */

import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Version marker to ensure fresh build - V5 (deleteDoc imported, using batch.delete only)
console.log('SuperAdmin Service: Fix Applied - V5');

/**
 * Generar slug/ID único para organización basado en nombre
 */
const generateOrgSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
    .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio/fin
    .substring(0, 50); // Limitar longitud
};

/**
 * Verificar si un orgId ya existe
 */
const orgIdExists = async (orgId) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    return orgDoc.exists();
  } catch (error) {
    console.error('[SuperAdmin] Error checking orgId:', error);
    return false;
  }
};

/**
 * Crear organización con owner inicial (Transacción/Batch)
 * 
 * Esta función garantiza integridad atómica:
 * 1. Crea documento en organizations
 * 2. Crea documento del owner en organizations/{orgId}/members
 * 3. Si el usuario existe en Auth, actualiza su perfil (opcional)
 * 
 * @param {Object} orgData - Datos de la organización
 * @param {string} orgData.name - Nombre de la organización
 * @param {string} orgData.orgId - ID/Slug de la organización (opcional, se genera si no se proporciona)
 * @param {Object} ownerData - Datos del owner inicial
 * @param {string} ownerData.name - Nombre del owner
 * @param {string} ownerData.email - Email del owner
 * @returns {Promise<Object>} Organización creada con ID
 */
export const createOrganizationWithAdmin = async (orgData, ownerData) => {
  try {
    console.log('[SuperAdmin] Creating organization with admin:', { orgData, ownerData });

    // Validaciones
    if (!orgData.name || !orgData.name.trim()) {
      throw new Error('El nombre de la organización es requerido');
    }
    if (!ownerData.email || !ownerData.email.trim()) {
      throw new Error('El email del owner es requerido');
    }
    if (!ownerData.name || !ownerData.name.trim()) {
      throw new Error('El nombre del owner es requerido');
    }

    // Generar o validar orgId
    let orgId = orgData.orgId?.trim();
    if (!orgId) {
      // Generar slug desde el nombre
      orgId = generateOrgSlug(orgData.name);
      
      // Asegurar unicidad: agregar sufijo numérico si existe
      let finalOrgId = orgId;
      let counter = 1;
      while (await orgIdExists(finalOrgId)) {
        finalOrgId = `${orgId}-${counter}`;
        counter++;
      }
      orgId = finalOrgId;
    } else {
      // Validar que el orgId proporcionado no exista
      if (await orgIdExists(orgId)) {
        throw new Error(`El ID "${orgId}" ya está en uso. Por favor, elige otro.`);
      }
    }

    // Usar Batch Write para garantizar atomicidad
    const batch = writeBatch(db);

    // 1. Crear documento de organización
    const orgRef = doc(db, 'organizations', orgId);
    const organization = {
      id: orgId,
      name: orgData.name.trim(),
      type: 'corporate', // Todas las organizaciones creadas por Super Admin son corporativas
      plan: orgData.plan || 'starter', // Plan por defecto
      active: orgData.active !== undefined ? orgData.active : true,
      ownerEmail: ownerData.email.trim(), // Guardar email del owner para referencia
      grupo: orgData.grupo || null, // Grupo de empresas (opcional)
      settings: {
        timezone: orgData.timezone || 'UTC',
        minAnonThreshold: 3, // Default para corporativas
        branding: {},
        features: {
          invitations: true,
          reports: true,
          analytics: true
        },
        ...orgData.settings
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    batch.set(orgRef, organization);

    // 2. Crear documento del owner en subcolección members
    // Nota: Por ahora creamos el registro con estado 'pending_invite'
    // El usuario puede ser creado en Auth después o invitado
    const ownerMemberRef = doc(db, 'organizations', orgId, 'members', ownerData.email.trim());
    const ownerMember = {
      email: ownerData.email.trim(),
      displayName: ownerData.name.trim(),
      role: 'owner',
      status: 'pending_invite', // Estado inicial hasta que el usuario se registre
      invitedBy: 'super_admin', // Sistema
      invitedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    batch.set(ownerMemberRef, ownerMember);

    // 3. También crear en colección raíz organization_members para compatibilidad
    const rootMemberRef = doc(db, 'organization_members', `${orgId}:${ownerData.email.trim()}`);
    const rootMember = {
      orgId: orgId,
      userId: null, // Se actualizará cuando el usuario se registre
      email: ownerData.email.trim(),
      role: 'owner',
      status: 'pending_invite',
      invitedBy: 'super_admin',
      invitedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    batch.set(rootMemberRef, rootMember);

    // Ejecutar batch (todas las operaciones son atómicas)
    await batch.commit();

    console.log('[SuperAdmin] Organization created successfully:', orgId);

    return {
      id: orgId,
      ...organization,
      ownerEmail: ownerData.email.trim()
    };
  } catch (error) {
    console.error('[SuperAdmin] Error creating organization:', error);
    throw error;
  }
};

/**
 * Listar todas las organizaciones
 * Solo para Super Admin
 */
export const getAllOrganizations = async () => {
  try {
    const orgsRef = collection(db, 'organizations');
    const q = query(orgsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const organizations = snapshot.docs.map(doc => ({
      id: doc.id,
      orgId: doc.id,
      ...doc.data()
    }));
    
    console.log('[SuperAdmin] Loaded organizations:', organizations.length);
    return organizations;
  } catch (error) {
    console.error('[SuperAdmin] Error listing organizations:', error);
    throw error;
  }
};

/**
 * Actualizar organización
 */
export const updateOrganization = async (orgId, updates) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('[SuperAdmin] Organization updated:', orgId);
    return true;
  } catch (error) {
    console.error('[SuperAdmin] Error updating organization:', error);
    throw error;
  }
};

/**
 * Desactivar/Activar organización
 */
export const toggleOrganizationStatus = async (orgId, active) => {
  try {
    return await updateOrganization(orgId, { active });
  } catch (error) {
    console.error('[SuperAdmin] Error toggling organization status:', error);
    throw error;
  }
};

/**
 * Obtener organización por ID
 */
export const getOrganization = async (orgId) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error(`Organización ${orgId} no encontrada`);
    }
    
    return {
      id: orgDoc.id,
      orgId: orgDoc.id,
      ...orgDoc.data()
    };
  } catch (error) {
    console.error('[SuperAdmin] Error getting organization:', error);
    throw error;
  }
};

/**
 * Eliminar organización permanentemente
 * Solo para Super Admin
 * Elimina la organización y todos sus miembros asociados
 */
export const deleteOrganization = async (orgId) => {
  try {
    console.log('[SuperAdmin] Deleting organization:', orgId);
    
    // Usar Batch Write para eliminar todo de forma atómica
    const batch = writeBatch(db);
    
    // 1. Eliminar todos los miembros de la subcolección
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    membersSnapshot.docs.forEach(memberDoc => {
      batch.delete(memberDoc.ref);
    });
    
    // 2. Eliminar todos los miembros de la colección raíz organization_members
    const rootMembersRef = collection(db, 'organization_members');
    const rootQuery = query(rootMembersRef, where('orgId', '==', orgId));
    const rootSnapshot = await getDocs(rootQuery);
    rootSnapshot.docs.forEach(memberDoc => {
      batch.delete(memberDoc.ref);
    });
    
    // 3. Eliminar el documento de la organización
    const orgRef = doc(db, 'organizations', orgId);
    batch.delete(orgRef);
    
    // Ejecutar batch (todas las operaciones son atómicas)
    await batch.commit();
    
    console.log('[SuperAdmin] Organization deleted successfully:', orgId);
    return true;
  } catch (error) {
    console.error('[SuperAdmin] Error deleting organization:', error);
    throw error;
  }
};

/**
 * Obtener información del owner de una organización
 */
export const getOrganizationOwner = async (orgId) => {
  try {
    // Intentar obtener desde la subcolección members
    const membersRef = collection(db, 'organizations', orgId, 'members');
    const membersQuery = query(membersRef, where('role', '==', 'owner'));
    const membersSnapshot = await getDocs(membersQuery);
    
    if (!membersSnapshot.empty) {
      const ownerDoc = membersSnapshot.docs[0];
      const ownerData = ownerDoc.data();
      return {
        name: ownerData.displayName || ownerData.name || '',
        email: ownerData.email || ''
      };
    }
    
    // Si no se encuentra, intentar desde organization_members
    const rootMembersRef = collection(db, 'organization_members');
    const rootQuery = query(
      rootMembersRef,
      where('orgId', '==', orgId),
      where('role', '==', 'owner')
    );
    const rootSnapshot = await getDocs(rootQuery);
    
    if (!rootSnapshot.empty) {
      const ownerDoc = rootSnapshot.docs[0];
      const ownerData = ownerDoc.data();
      return {
        name: ownerData.displayName || ownerData.name || '',
        email: ownerData.email || ''
      };
    }
    
    return { name: '', email: '' };
  } catch (error) {
    console.error('[SuperAdmin] Error getting organization owner:', error);
    return { name: '', email: '' };
  }
};

export default {
  createOrganizationWithAdmin,
  getAllOrganizations,
  updateOrganization,
  toggleOrganizationStatus,
  getOrganization,
  deleteOrganization,
  getOrganizationOwner
};

