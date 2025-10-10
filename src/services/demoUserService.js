/**
 * DemoUserService - Servicio para configurar usuario demo
 * 
 * Funciones:
 * - ensureDemoUserPermissions: Asegurar que el usuario demo tenga permisos
 * - createPersonalWorkspace: Crear workspace personal para el usuario demo
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Asegurar que el usuario demo tenga permisos para crear tests
 */
export const ensureDemoUserPermissions = async (user) => {
  try {
    console.log('[DemoUserService] Ensuring demo user permissions for:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // 1. Crear workspace personal si no existe
    const personalOrgId = `org_personal_${user.uid}`;
    const personalOrgRef = doc(db, 'orgs', personalOrgId);
    
    const personalOrgExists = await getDoc(personalOrgRef);
    if (!personalOrgExists.exists()) {
      console.log('[DemoUserService] Creating personal workspace...');
      await setDoc(personalOrgRef, {
        id: personalOrgId,
        name: 'Personal Workspace',
        type: 'personal',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 2. Crear membresía personal si no existe
    const personalMemberId = `${personalOrgId}:${user.uid}`;
    const personalMemberRef = doc(db, `orgs/${personalOrgId}/members`, personalMemberId);
    
    const personalMemberExists = await getDoc(personalMemberRef);
    if (!personalMemberExists.exists()) {
      console.log('[DemoUserService] Creating personal membership...');
      await setDoc(personalMemberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 3. Crear organización de prueba si no existe
    const testOrgId = `org_demo_${user.uid}`;
    const testOrgRef = doc(db, 'orgs', testOrgId);
    
    const testOrgExists = await getDoc(testOrgRef);
    if (!testOrgExists.exists()) {
      console.log('[DemoUserService] Creating demo organization...');
      await setDoc(testOrgRef, {
        id: testOrgId,
        name: 'Organización Demo',
        type: 'business',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Crear membresía en la organización demo
      const demoMemberId = `${testOrgId}:${user.uid}`;
      const demoMemberRef = doc(db, `orgs/${testOrgId}/members`, demoMemberId);
      await setDoc(demoMemberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('[DemoUserService] Demo user permissions ensured successfully');

    return {
      success: true,
      personalOrgId,
      testOrgId
    };

  } catch (error) {
    console.error('[DemoUserService] Error ensuring demo user permissions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Crear workspace personal para el usuario demo
 */
export const createPersonalWorkspace = async (user) => {
  try {
    console.log('[DemoUserService] Creating personal workspace for:', user.uid);

    const orgId = `org_personal_${user.uid}`;
    const orgRef = doc(db, 'orgs', orgId);
    
    // Crear organización
    await setDoc(orgRef, {
      id: orgId,
      name: 'Personal Workspace',
      type: 'personal',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Crear membresía
    const memberId = `${orgId}:${user.uid}`;
    const memberRef = doc(db, `orgs/${orgId}/members`, memberId);
    await setDoc(memberRef, {
      userId: user.uid,
      email: user.email,
      role: 'owner',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('[DemoUserService] Personal workspace created:', orgId);

    return {
      success: true,
      orgId
    };

  } catch (error) {
    console.error('[DemoUserService] Error creating personal workspace:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
