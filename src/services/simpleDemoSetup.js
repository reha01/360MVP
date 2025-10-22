/**
 * SimpleDemoSetup - Configuración simple del usuario demo
 * 
 * Usa el contexto de organización existente o crea uno básico
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const simpleDemoSetup = async (user) => {
  try {
    console.log('[SimpleDemoSetup] Setting up demo user:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // Crear organización básica con ID simple
    const orgId = `demo_${user.uid.slice(-8)}`; // Usar solo los últimos 8 caracteres
    
    console.log('[SimpleDemoSetup] Creating organization:', orgId);
    
    // Crear la organización
    const orgRef = doc(db, 'orgs', orgId);
    await setDoc(orgRef, {
      id: orgId,
      name: 'Mi Organización',
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

    console.log('[SimpleDemoSetup] Demo setup completed successfully');

    return {
      success: true,
      orgId,
      message: 'Configuración demo completada'
    };

  } catch (error) {
    console.error('[SimpleDemoSetup] Error setting up demo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
