/**
 * InitDemoUser - Inicializar usuario demo con permisos especiales
 * 
 * Esta función usa un enfoque diferente para evitar el problema circular
 * de permisos. En lugar de crear organizaciones, crea directamente
 * las estructuras necesarias.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const initDemoUser = async (user) => {
  try {
    console.log('[InitDemoUser] Initializing demo user:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // 1. Crear organización personal directamente
    const personalOrgId = `org_personal_${user.uid}`;
    console.log('[InitDemoUser] Creating personal org:', personalOrgId);
    
    // Usar addDoc en lugar de setDoc para evitar problemas de permisos
    const personalOrgRef = await addDoc(collection(db, 'orgs'), {
      id: personalOrgId,
      name: 'Personal Workspace',
      type: 'personal',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Crear membresía personal
    console.log('[InitDemoUser] Creating personal membership...');
    await addDoc(collection(db, `orgs/${personalOrgRef.id}/members`), {
      userId: user.uid,
      email: user.email,
      role: 'owner',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Crear organización demo
    const demoOrgId = `org_demo_${user.uid}`;
    console.log('[InitDemoUser] Creating demo org:', demoOrgId);
    
    const demoOrgRef = await addDoc(collection(db, 'orgs'), {
      id: demoOrgId,
      name: 'Organización Demo',
      type: 'business',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 4. Crear membresía en la organización demo
    console.log('[InitDemoUser] Creating demo membership...');
    await addDoc(collection(db, `orgs/${demoOrgRef.id}/members`), {
      userId: user.uid,
      email: user.email,
      role: 'owner',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('[InitDemoUser] Demo user initialized successfully');

    return {
      success: true,
      personalOrgId,
      demoOrgId,
      personalOrgRef: personalOrgRef.id,
      demoOrgRef: demoOrgRef.id,
      message: 'Usuario demo inicializado correctamente'
    };

  } catch (error) {
    console.error('[InitDemoUser] Error initializing demo user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
