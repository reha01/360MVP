import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useUserProfile - Hook that provides extended user profile information
 * Abstracts user data access and allows for future expansion beyond auth.currentUser
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

        // Build extended profile from auth user
        const userProfile = {
          // Core auth data
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          
          // Extended profile data (can be expanded with Firestore data)
          createdAt: user.metadata?.creationTime,
          lastSignIn: user.metadata?.lastSignInTime,
          
          // Computed fields
          isVerified: user.emailVerified,
          hasProfile: !!(user.displayName || user.photoURL),
          
          // Future extensions ready
          preferences: {},
          evaluations: [],
          credits: 0
        };

        console.log('[360MVP] useUserProfile: Profile built for user:', user.email);
        setProfile(userProfile);

      } catch (err) {
        console.error('[360MVP] useUserProfile: Error building profile:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    buildProfile();
  }, [user, authLoading]);

  const refreshProfile = () => {
    // Trigger profile rebuild
    setLoading(true);
  };

  return {
    profile,
    loading: authLoading || loading,
    error,
    refreshProfile,
    // Convenience getters
    isAuthenticated: !!user,
    needsVerification: user && !user.emailVerified,
    hasDisplayName: !!(user?.displayName)
  };
};

export default useUserProfile;