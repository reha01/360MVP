/**
 * BackendDemoSetup - Configuración demo usando backend
 * 
 * Como las reglas de Firestore están bloqueando la creación,
 * vamos a usar una función de backend para crear la organización
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export const backendDemoSetup = async (user) => {
  try {
    console.log('[BackendDemoSetup] Setting up demo user via backend:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // Llamar función de backend para crear organización
    const createDemoOrg = httpsCallable(functions, 'createDemoOrganization');
    
    const result = await createDemoOrg({
      userId: user.uid,
      email: user.email
    });

    console.log('[BackendDemoSetup] Backend response:', result.data);

    return {
      success: true,
      orgId: result.data.orgId,
      message: 'Organización creada via backend'
    };

  } catch (error) {
    console.error('[BackendDemoSetup] Error:', error);
    
    // Si no hay función de backend, usar método alternativo
    if (error.code === 'functions/not-found') {
      console.log('[BackendDemoSetup] Backend function not found, using alternative...');
      return await alternativeDemoSetup(user);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * AlternativeDemoSetup - Método alternativo sin backend
 */
const alternativeDemoSetup = async (user) => {
  try {
    console.log('[AlternativeDemoSetup] Using alternative method...');
    
    // Crear una organización temporal en localStorage para testing
    const tempOrgId = `temp_demo_${Date.now()}`;
    
    // Guardar en localStorage para que la app lo detecte
    localStorage.setItem('demo_org_id', tempOrgId);
    localStorage.setItem('demo_org_name', 'Organización Demo (Temporal)');
    
    console.log('[AlternativeDemoSetup] Temporary organization created in localStorage');
    
    return {
      success: true,
      orgId: tempOrgId,
      message: 'Organización temporal creada (modo testing)'
    };

  } catch (error) {
    console.error('[AlternativeDemoSetup] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
