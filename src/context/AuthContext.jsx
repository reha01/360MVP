import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ensureDemoUserPermissions } from '../services/demoUserService';
import { 
  checkAndRestoreSession, 
  saveAuthToken, 
  clearAuthTokens 
} from '../services/authPersistence';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[360MVP] AuthContext: Setting up authentication state listener...');
    
    // Primero intentar restaurar sesión existente
    checkAndRestoreSession().then(restoredUser => {
      if (restoredUser) {
        console.log('[AuthContext] Sesión restaurada para:', restoredUser.email);
        setUser(restoredUser);
        setLoading(false);
      }
    });
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.info('[AuthContext] user', !!firebaseUser, firebaseUser ? `(${firebaseUser.email})` : '(none)');
      
      // Si es usuario demo, asegurar permisos
      if (firebaseUser && firebaseUser.email === 'demo@360mvp.com') {
        console.log('[AuthContext] Demo user detected, ensuring permissions...');
        try {
          await ensureDemoUserPermissions(firebaseUser);
          console.log('[AuthContext] Demo user permissions ensured');
        } catch (error) {
          console.error('[AuthContext] Error ensuring demo user permissions:', error);
        }
      }
      
      // Guardar token para persistencia mejorada
      if (firebaseUser) {
        await saveAuthToken(firebaseUser);
      } else {
        clearAuthTokens();
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[360MVP] AuthContext: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    console.log('[360MVP] AuthContext: Attempting login for:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[360MVP] AuthContext: Login successful');
      return result;
    } catch (error) {
      console.error('[360MVP] AuthContext: Login failed:', error.message);
      throw error;
    }
  };

  const register = async (email, password) => {
    console.log('[360MVP] AuthContext: Attempting registration for:', email);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[360MVP] AuthContext: Registration successful');
      return result;
    } catch (error) {
      console.error('[360MVP] AuthContext: Registration failed:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[360MVP] AuthContext: Attempting logout');
    try {
      await signOut(auth);
      console.log('[360MVP] AuthContext: Logout successful');
    } catch (error) {
      console.error('[360MVP] AuthContext: Logout failed:', error.message);
      throw error;
    }
  };

  // Email verification simulation for emulator
  const simulateEmailVerification = async () => {
    if ((import.meta.env.VITE_USE_EMULATOR ?? 'true') !== 'true') return;
    // Forzar refresh del usuario y setear flag local mientras usamos emulador
    await auth.currentUser?.reload?.();
    // Actualiza el estado local para reflejar verificación en UI
    setUser({ ...auth.currentUser, emailVerified: true });
    console.log('[360MVP] AuthContext: Email verification simulated');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    simulateEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{marginTop: '20px', color: '#666'}}>🔐 Verificando autenticación...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};