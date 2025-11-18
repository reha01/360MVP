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
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AuthContext = createContext();

// Función para actualizar lastLoginAt del miembro
const updateMemberLastLogin = async (firebaseUser) => {
  if (!firebaseUser || !firebaseUser.email) {
    return;
  }
  
  try {
    // Buscar el miembro por email
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('email', '==', firebaseUser.email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const now = new Date();
      // Actualizar todos los documentos encontrados (por si hay duplicados)
      const updatePromises = snapshot.docs.map(async (memberDoc) => {
        const memberRef = doc(db, 'members', memberDoc.id);
        await updateDoc(memberRef, {
          lastLoginAt: serverTimestamp(),
          lastLoginAtDate: now.toISOString(),
          updatedAt: serverTimestamp()
        });
        console.log(`[AuthContext] Updated lastLoginAt for member ${memberDoc.id} (${firebaseUser.email})`);
      });
      
      await Promise.all(updatePromises);
    } else {
      console.log(`[AuthContext] No member found with email ${firebaseUser.email}, skipping lastLoginAt update`);
    }
  } catch (error) {
    console.error('[AuthContext] Error updating member lastLoginAt:', error);
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[360MVP] AuthContext: Setting up authentication state listener...');
    console.log('[AuthContext] 🕐 Current time:', new Date().toISOString());
    
    // ✅ DEBUG: Timeout de seguridad para evitar loading infinito
    // REDUCIDO A 3 SEGUNDOS para que Playwright no se atore
    const safetyTimeout = setTimeout(() => {
      console.warn('[AuthContext] ⚠️ SAFETY TIMEOUT: Auth listener no se disparó en 3s, forzando fin de loading');
      console.warn('[AuthContext] 🕐 Timeout triggered at:', new Date().toISOString());
      console.warn('[AuthContext] 📊 Current user at timeout:', auth.currentUser?.email || 'none');
      
      // Si hay usuario actual, usarlo
      if (auth.currentUser) {
        console.log('[AuthContext] ✅ Usuario encontrado en auth.currentUser, usándolo');
        setUser(auth.currentUser);
      }
      
      setLoading(false);
    }, 3000); // 3 segundos (reducido de 10)
    
    // Primero intentar restaurar sesión existente
    console.log('[AuthContext] 🔍 Intentando restaurar sesión...');
    checkAndRestoreSession()
      .then(restoredUser => {
        console.log('[AuthContext] ✅ checkAndRestoreSession resolved:', !!restoredUser);
        if (restoredUser) {
          console.log('[AuthContext] Sesión restaurada para:', restoredUser.email);
          setUser(restoredUser);
          setLoading(false);
          clearTimeout(safetyTimeout); // ✅ Limpiar timeout si se resolvió
        }
      })
      .catch(err => {
        console.error('[AuthContext] ❌ checkAndRestoreSession error:', err);
        // ✅ CRÍTICO: Setear loading a false incluso con error
        setLoading(false);
        clearTimeout(safetyTimeout);
      });
    
    console.log('[AuthContext] 📡 Configurando onAuthStateChanged listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.info('[AuthContext] 🔔 onAuthStateChanged fired:', !!firebaseUser, firebaseUser ? `(${firebaseUser.email})` : '(none)');
      console.log('[AuthContext] 🕐 onAuthStateChanged time:', new Date().toISOString());
      
      // Limpiar timeout de seguridad
      console.log('[AuthContext] ⏱️ Clearing safety timeout');
      clearTimeout(safetyTimeout);
      
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
        
        // Actualizar lastLoginAt en el documento del miembro
        try {
          await updateMemberLastLogin(firebaseUser);
        } catch (err) {
          console.error('[AuthContext] Error updating member lastLoginAt:', err);
          // No bloquear el login si falla la actualización
        }
      } else {
        clearAuthTokens();
      }
      
      console.log('[AuthContext] ✅ Setting user and loading=false');
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[360MVP] AuthContext: Cleaning up auth listener');
      clearTimeout(safetyTimeout);
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