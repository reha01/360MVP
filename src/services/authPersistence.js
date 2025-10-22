/**
 * Auth Persistence Service
 * 
 * Mejora la persistencia de sesión en Firebase Auth
 */

import { 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Configurar persistencia según el entorno
 */
export const setupAuthPersistence = async () => {
  try {
    // En producción/staging usar localStorage para persistencia entre sesiones
    if (window.location.hostname.includes('web.app') || 
        window.location.hostname.includes('firebaseapp.com')) {
      await setPersistence(auth, browserLocalPersistence);
      console.log('[Auth] Persistencia configurada: localStorage');
    } 
    // En desarrollo usar sessionStorage
    else {
      await setPersistence(auth, browserSessionPersistence);
      console.log('[Auth] Persistencia configurada: sessionStorage');
    }
  } catch (error) {
    console.error('[Auth] Error configurando persistencia:', error);
    // Fallback a memoria
    await setPersistence(auth, inMemoryPersistence);
  }
};

/**
 * Verificar y restaurar sesión
 */
export const checkAndRestoreSession = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        if (user) {
          console.log('[Auth] Sesión restaurada:', user.email);
          resolve(user);
        } else {
          console.log('[Auth] No hay sesión activa');
          resolve(null);
        }
      },
      (error) => {
        unsubscribe();
        console.error('[Auth] Error verificando sesión:', error);
        reject(error);
      }
    );
  });
};

/**
 * Guardar token adicional en localStorage para verificación
 */
export const saveAuthToken = async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      localStorage.setItem('360mvp_auth_token', token);
      localStorage.setItem('360mvp_user_email', user.email);
      localStorage.setItem('360mvp_user_uid', user.uid);
      console.log('[Auth] Token guardado en localStorage');
    } catch (error) {
      console.error('[Auth] Error guardando token:', error);
    }
  }
};

/**
 * Limpiar tokens guardados
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('360mvp_auth_token');
  localStorage.removeItem('360mvp_user_email');
  localStorage.removeItem('360mvp_user_uid');
  console.log('[Auth] Tokens limpiados');
};

/**
 * Verificar si hay un token guardado
 */
export const hasStoredToken = () => {
  return !!localStorage.getItem('360mvp_auth_token');
};

/**
 * Obtener información del usuario guardada
 */
export const getStoredUserInfo = () => {
  return {
    email: localStorage.getItem('360mvp_user_email'),
    uid: localStorage.getItem('360mvp_user_uid'),
    token: localStorage.getItem('360mvp_auth_token')
  };
};

// Configurar persistencia al cargar el módulo
setupAuthPersistence();
