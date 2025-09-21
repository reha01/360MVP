// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase.jsx";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // Login con Google (OAuth real)
  const loginWithGoogle = async () => {
    try {
      console.log('[360MVP] AuthContext: Iniciando login con Google real...');
      
      const provider = new GoogleAuthProvider();
      
      // Configurar el proveedor para obtener información completa
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configurar parámetros adicionales
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      console.log('[360MVP] AuthContext: Login con Google exitoso para:', result.user.email);
      console.log('[360MVP] AuthContext: Usuario Google completo:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified
      });
      
      return { 
        success: true, 
        user: result.user,
        message: '✅ Autenticación con Google exitosa'
      };
      
    } catch (error) {
      console.error('[360MVP] AuthContext: Error en login con Google:', error);
      
      let errorMessage = 'Error desconocido en el login con Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login cancelado: Cerraste la ventana de Google';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado: Habilita popups para este sitio';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Login cancelado: Otro popup ya estaba abierto';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Dominio no autorizado: Configura este dominio en Firebase Console';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google Sign-In no está habilitado en Firebase Console';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      return { 
        success: false, 
        error: error.code || 'unknown',
        message: errorMessage
      };
    }
  };

  // Simulación de verificación de email para modo emulador
  const simulateEmailVerification = async () => {
    if (!user) return false;

    try {
      console.log('[360MVP] AuthContext: Simulando verificación de email...');
      
      // En modo emulador, podemos forzar la actualización del estado
      // Creamos una copia del usuario con emailVerified = true
      const updatedUser = {
        ...user,
        emailVerified: true
      };

      // Forzamos la actualización del estado
      setUser(updatedUser);
      
      console.log('[360MVP] AuthContext: Email verificado simulado exitosamente');
      return true;
    } catch (error) {
      console.error('[360MVP] AuthContext: Error simulando verificación:', error);
      return false;
    }
  };

  const value = { user, loading, login, register, logout, loginWithGoogle, simulateEmailVerification };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
