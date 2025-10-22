/**
 * FixDemoPermissions - Arreglar permisos del usuario demo manualmente
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const fixDemoPermissions = async (user) => {
  try {
    console.log('[FixDemoPermissions] Fixing permissions for:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // 1. Verificar si ya existe la organización personal
    const personalOrgId = `org_personal_${user.uid}`;
    const personalOrgRef = doc(db, 'orgs', personalOrgId);
    
    let personalOrgExists = false;
    try {
      const personalOrgDoc = await getDoc(personalOrgRef);
      personalOrgExists = personalOrgDoc.exists();
    } catch (error) {
      console.log('[FixDemoPermissions] Personal org not found, creating...');
    }

    if (!personalOrgExists) {
      console.log('[FixDemoPermissions] Creating personal organization...');
      await setDoc(personalOrgRef, {
        id: personalOrgId,
        name: 'Personal Workspace',
        type: 'personal',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 2. Crear membresía personal
    const personalMemberId = `${personalOrgId}:${user.uid}`;
    const personalMemberRef = doc(db, `organizations/${personalOrgId}/members`, personalMemberId);
    
    let personalMemberExists = false;
    try {
      const personalMemberDoc = await getDoc(personalMemberRef);
      personalMemberExists = personalMemberDoc.exists();
    } catch (error) {
      console.log('[FixDemoPermissions] Personal member not found, creating...');
    }

    if (!personalMemberExists) {
      console.log('[FixDemoPermissions] Creating personal membership...');
      await setDoc(personalMemberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 3. Crear organización demo
    const demoOrgId = `org_demo_${user.uid}`;
    const demoOrgRef = doc(db, 'orgs', demoOrgId);
    
    let demoOrgExists = false;
    try {
      const demoOrgDoc = await getDoc(demoOrgRef);
      demoOrgExists = demoOrgDoc.exists();
    } catch (error) {
      console.log('[FixDemoPermissions] Demo org not found, creating...');
    }

    if (!demoOrgExists) {
      console.log('[FixDemoPermissions] Creating demo organization...');
      await setDoc(demoOrgRef, {
        id: demoOrgId,
        name: 'Organización Demo',
        type: 'business',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Crear membresía en la organización demo
      const demoMemberId = `${demoOrgId}:${user.uid}`;
      const demoMemberRef = doc(db, `organizations/${demoOrgId}/members`, demoMemberId);
      await setDoc(demoMemberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('[FixDemoPermissions] Permissions fixed successfully');

    return {
      success: true,
      personalOrgId,
      demoOrgId,
      message: 'Permisos del usuario demo configurados correctamente'
    };

  } catch (error) {
    console.error('[FixDemoPermissions] Error fixing permissions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
