/**
 * CreateDemoWorkspace - Crear workspace demo usando reglas existentes
 * 
 * En lugar de crear organizaciones, vamos a usar el sistema existente
 * de una manera más simple.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createDemoWorkspace = async (user) => {
  try {
    console.log('[CreateDemoWorkspace] Creating demo workspace for:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // Crear una organización simple que el usuario pueda gestionar
    const orgId = `demo_${user.uid}`;
    
    // Intentar crear la organización principal
    const orgRef = doc(db, 'orgs', orgId);
    
    // Verificar si ya existe
    const orgExists = await getDoc(orgRef);
    if (orgExists.exists()) {
      console.log('[CreateDemoWorkspace] Organization already exists');
      return {
        success: true,
        orgId,
        message: 'Organización ya existe'
      };
    }

    // Crear la organización
    await setDoc(orgRef, {
      id: orgId,
      name: 'Mi Organización Demo',
      type: 'business',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Crear la membresía
    const memberId = `${orgId}:${user.uid}`;
    const memberRef = doc(db, `organizations/${orgId}/members`, memberId);
    
    await setDoc(memberRef, {
      userId: user.uid,
      email: user.email,
      role: 'owner',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('[CreateDemoWorkspace] Demo workspace created successfully');

    return {
      success: true,
      orgId,
      message: 'Workspace demo creado correctamente'
    };

  } catch (error) {
    console.error('[CreateDemoWorkspace] Error creating demo workspace:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
