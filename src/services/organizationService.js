/**
 * Organization Service
 * 
 * Servicio para gestionar organizaciones
 * Usado principalmente por Super Admin para listar todas las organizaciones
 */

import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { dlog, derror } from '../utils/debug';
import { ORG_COLLECTION } from '../lib/paths';

/**
 * Listar todas las organizaciones
 * Solo para Super Admin
 */
export const listAllOrganizations = async () => {
  try {
    dlog('[OrganizationService] Listing all organizations');
    
    const orgsRef = collection(db, ORG_COLLECTION);
    const q = query(orgsRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    
    const organizations = snapshot.docs.map(doc => ({
      id: doc.id,
      orgId: doc.id,
      ...doc.data()
    }));
    
    dlog('[OrganizationService] Found organizations:', organizations.length);
    return organizations;
  } catch (error) {
    derror('[OrganizationService] Error listing organizations:', error);
    throw error;
  }
};

export default {
  listAllOrganizations
};

