import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserProfile, initializeUserOnFirstLogin } from '../services/firestore.js';

/**
 * useUserProfile - Hook que proporciona información extendida del perfil del usuario
 * Abstrae el acceso a los datos del usuario y permite expansión futura más allá de auth.currentUser
 */
export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buildProfile = async () => {
      if (authLoading) return;
      
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setProfile(null);
          return;
        }

        // Intentar conectar con Firestore (real)
        let firestoreProfile = null;
        
        try {
          firestoreProfile = await initializeUserOnFirstLogin(user);
          console.log('[360MVP] useUserProfile: Perfil Firestore cargado exitosamente');
        } catch (error) {
          console.warn('[360MVP] useUserProfile: Error con Firestore, usando datos locales:', error.message);
          // En caso de error, usar datos por defecto
        }
        
        // Construir perfil extendido con datos locales o Firestore
        const userProfile = {
          // Datos core de auth
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          
          // Datos de metadata de auth
          createdAt: user.metadata?.creationTime,
          lastSignIn: user.metadata?.lastSignInTime,
          
          // Datos extendidos (desde Firestore o valores por defecto)
          credits: firestoreProfile?.credits || 3, // Créditos iniciales
          evaluationsCompleted: firestoreProfile?.evaluationsCompleted || 0,
          plan: firestoreProfile?.plan || 'free',
          preferences: firestoreProfile?.preferences || {},
          
          // Campos computados
          isVerified: user.emailVerified,
          hasProfile: !!(user.displayName || user.photoURL),
          hasFirestoreProfile: !!firestoreProfile,
          isRealGoogleAuth: user.providerData?.some(provider => provider.providerId === 'google.com')
        };

        console.log('[360MVP] useUserProfile: Perfil construido para usuario:', user.email);
        setProfile(userProfile);

      } catch (err) {
        console.error('[360MVP] useUserProfile: Error construyendo perfil:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    buildProfile();
  }, [user, authLoading]);

  const refreshProfile = () => {
    // Disparar reconstrucción del perfil
    setLoading(true);
  };

  return {
    profile,
    loading: authLoading || loading,
    error,
    refreshProfile,
    // Getters de conveniencia
    isAuthenticated: !!user,
    needsVerification: user && !user.emailVerified,
    hasDisplayName: !!(user?.displayName)
  };
};

export default useUserProfile;
