/**
 * Temporary wrapper for orgStructureService due to export issues in current commit
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get all users from an organization
 * Uses composite key pattern: orgId:userId
 */
export const getOrgUsers = async (orgId) => {
  try {
    console.log(`[OrgStructure] Querying members collection for orgId: ${orgId}`);
    
    // Query members by orgId field (members are stored in root collection with orgId field)
    const membersRef = collection(db, 'members');
    const q = query(
      membersRef,
      where('orgId', '==', orgId)
    );
    
    console.log(`[OrgStructure] Executing Firestore query...`);
    const snapshot = await getDocs(q);
    console.log(`[OrgStructure] Query returned ${snapshot.docs.length} documents`);
    
    const members = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`[OrgStructure] Member document ${doc.id}:`, data);
      return {
        id: doc.id,
        ...data
      };
    });
    
    console.log(`[OrgStructure] Final result: ${members.length} members for org ${orgId}`);
    return members;
  } catch (error) {
    console.error('[OrgStructure] Error loading users:', error);
    console.error('[OrgStructure] Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export default {
  getOrgUsers
};

