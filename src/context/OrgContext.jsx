// src/context/OrgContext.jsx
// CRITICAL FIX: Loop prevention with global cache and strict guards

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import telemetry from '../services/telemetryService';
import { isDebug, dlog, dwarn } from '../utils/debug';
import { getMultipleOrgMeta } from '../lib/orgs';

const OrgContext = createContext();

// ============================================================================
// GLOBAL CACHE & STATE MANAGEMENT - Prevents duplicate fetches across renders
// ============================================================================
const globalCache = new Map(); // uid -> { memberships, timestamp, status }
const loadingStates = new Map(); // uid -> Promise
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper: Log with timestamp (only in debug mode)
function debugLog(message, data = {}) {
  if (!isDebug()) return;
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  dlog(`[OrgCtx ${timestamp}] ${message}`, data);
}

// Helper: Check if cache is valid
function isCacheValid(cacheEntry) {
  if (!cacheEntry) return false;
  const age = Date.now() - cacheEntry.timestamp;
  return age < CACHE_DURATION;
}

// Helper: Create personal workspace
async function createPersonalWorkspace(uid, userEmail) {
  debugLog('Creating personal workspace', { uid });

  try {
    const orgId = `org_personal_${uid}`;
    const orgRef = doc(db, 'organizations', orgId);

    // Create organization
    await setDoc(orgRef, {
      id: orgId,
      name: 'Personal Workspace',
      type: 'personal',
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create membership
    const memberRef = doc(collection(db, 'organization_members'));
    await setDoc(memberRef, {
      orgId: orgId,
      org_id: orgId, // Both fields for compatibility
      userId: uid,
      user_id: uid, // Both fields for compatibility
      role: 'owner',
      status: 'active',
      email: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    debugLog('Personal workspace created successfully', { orgId });

    return {
      id: memberRef.id,
      orgId: orgId,
      org_id: orgId,
      userId: uid,
      user_id: uid,
      role: 'owner',
      status: 'active',
      organization: {
        id: orgId,
        name: 'Personal Workspace',
        type: 'personal'
      }
    };
  } catch (error) {
    console.error('[OrgContext] Failed to create personal workspace:', error);
    // Return a mock membership as fallback
    return {
      id: `mock_${uid}`,
      orgId: `org_personal_${uid}`,
      org_id: `org_personal_${uid}`,
      userId: uid,
      user_id: uid,
      role: 'owner',
      status: 'active',
      organization: {
        id: `org_personal_${uid}`,
        name: 'Personal Workspace',
        type: 'personal'
      }
    };
  }
}

// Main fetch function with all fallbacks
async function fetchUserMemberships(uid, userEmail) {
  debugLog('Fetching memberships', { uid });

  // Check for demo configuration in localStorage first
  const demoConfig = localStorage.getItem('demo_user_config');
  if (demoConfig && userEmail === 'demo@360mvp.com') {
    try {
      const config = JSON.parse(demoConfig);
      debugLog('Using demo configuration from localStorage', config);

      // Return demo membership
      return [{
        id: config.orgId,
        orgId: config.orgId,
        org_id: config.orgId,
        userId: config.userId,
        user_id: config.userId,
        email: config.email,
        role: config.role,
        status: config.status,
        orgName: config.orgName,
        orgType: 'business',
        isDemo: true
      }];
    } catch (error) {
      debugLog('Error parsing demo config', { error: error.message });
    }
  }

  try {
    const col = collection(db, 'organization_members');
    let memberships = [];

    // Try multiple field combinations
    // SECURITY: Strictly filter for status == 'active' to block access for inactive users
    const queries = [
      query(col, where('user_id', '==', uid), where('status', '==', 'active')),
      query(col, where('userId', '==', uid), where('status', '==', 'active')),
    ];

    for (const q of queries) {
      try {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          memberships = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          debugLog('Found memberships', { count: memberships.length, field: queries.indexOf(q) === 0 ? 'user_id' : 'userId' });
          break;
        }
      } catch (err) {
        debugLog('Query failed', { error: err.message });
      }
    }

    // If no memberships found, create personal workspace
    if (memberships.length === 0) {
      debugLog('No memberships found, creating personal workspace');
      const personalMembership = await createPersonalWorkspace(uid, userEmail);
      memberships = [personalMembership];
    }

    // Enrich with organization data
    const enrichedMemberships = memberships.map(m => {
      // Ensure we have both field variations for compatibility
      return {
        ...m,
        orgId: m.orgId || m.org_id,
        org_id: m.org_id || m.orgId,
        userId: m.userId || m.user_id,
        user_id: m.user_id || m.userId,
        organization: m.organization || {
          id: m.orgId || m.org_id,
          name: m.organizationName || 'Unknown Organization',
          type: m.organizationType || 'unknown'
        }
      };
    });

    // Load organization metadata concurrently
    const orgIds = enrichedMemberships.map(m => m.orgId).filter(Boolean);
    const orgMetaMap = await getMultipleOrgMeta(orgIds);

    // Enrich memberships with organization metadata
    const finalMemberships = enrichedMemberships.map(m => {
      const orgMeta = orgMetaMap.get(m.orgId);
      return {
        ...m,
        organization: {
          ...m.organization,
          ...(orgMeta && {
            displayName: orgMeta.displayName,
            avatarColor: orgMeta.avatarColor,
            type: orgMeta.type
          })
        },
        orgMeta
      };
    });

    debugLog('Memberships enriched with org metadata', {
      total: finalMemberships.length,
      withMeta: finalMemberships.filter(m => m.orgMeta).length
    });

    return finalMemberships;
  } catch (error) {
    console.error('[OrgContext] Critical error fetching memberships:', error);

    // Emergency fallback - return mock membership
    return [{
      id: `emergency_${uid}`,
      orgId: `org_personal_${uid}`,
      org_id: `org_personal_${uid}`,
      userId: uid,
      user_id: uid,
      role: 'owner',
      status: 'active',
      organization: {
        id: `org_personal_${uid}`,
        name: 'Personal Workspace (Offline)',
        type: 'personal'
      }
    }];
  }
}

export const OrgProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Component state
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | unauthenticated
  const [memberships, setMemberships] = useState([]);
  const [activeOrgId, setActiveOrgIdState] = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);

  // Refs for preventing loops
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const navigationRef = useRef(false);
  const renderCount = useRef(0);

  // Debug render tracking
  useEffect(() => {
    renderCount.current++;
    if (isDebug() && renderCount.current > 10) {
      dwarn('[OrgContext] Excessive renders detected:', renderCount.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Storage helpers
  const getStoredOrgId = useCallback(() => {
    if (!user?.uid) return null;
    return localStorage.getItem(`selectedOrgId_${user.uid}`);
  }, [user?.uid]);

  const storeOrgId = useCallback((orgId) => {
    if (!user?.uid) return;
    if (orgId) {
      localStorage.setItem(`selectedOrgId_${user.uid}`, orgId);
    } else {
      localStorage.removeItem(`selectedOrgId_${user.uid}`);
    }
  }, [user?.uid]);

  // Main loading effect with strict guards
  useEffect(() => {
    const uid = user?.uid;

    // Guard 1: No user - set unauthenticated state
    if (!uid) {
      debugLog('No user, setting unauthenticated state');
      setStatus('unauthenticated');
      setMemberships([]);
      setActiveOrgIdState(null);
      setActiveOrg(null);
      setOrganizations([]);
      setError(null);
      loadingRef.current = false;
      navigationRef.current = false;
      return;
    }

    // Guard 2: Auth still loading
    if (authLoading) {
      debugLog('Auth still loading, waiting...');
      return;
    }

    // Guard 3: Kill switch check (only in development)
    const killSwitch = import.meta.env.DEV && localStorage.getItem('ORGCTX_KILL') === '1';
    if (killSwitch) {
      console.warn('[OrgContext] KILL SWITCH ACTIVE - Using fallback (DEV ONLY)');
      const fallbackMembership = {
        id: `fallback_${uid}`,
        orgId: `org_personal_${uid}`,
        org_id: `org_personal_${uid}`,
        userId: uid,
        user_id: uid,
        role: 'owner',
        status: 'active',
        organization: {
          id: `org_personal_${uid}`,
          name: 'Personal Workspace',
          type: 'personal'
        }
      };
      setMemberships([fallbackMembership]);
      setOrganizations([fallbackMembership.organization]);
      setActiveOrgIdState(fallbackMembership.orgId);
      setActiveOrg(fallbackMembership.organization);
      setStatus('success');
      return;
    }

    // Guard 4: Already loading
    if (loadingRef.current) {
      debugLog('Already loading, skipping');
      return;
    }

    // Guard 5: Check cache first
    const cached = globalCache.get(uid);
    if (isCacheValid(cached)) {
      debugLog('Using cached data', { age: Date.now() - cached.timestamp });
      setMemberships(cached.memberships);
      setOrganizations(cached.organizations);
      setStatus('success');

      // Restore active org - prioritize pilot-org-santiago
      const storedOrgId = getStoredOrgId();
      const pilotOrg = cached.memberships.find(m => m.orgId === 'pilot-org-santiago');

      if (pilotOrg) {
        // If user is in pilot org, always set it as active
        setActiveOrgIdState(pilotOrg.orgId);
        setActiveOrg(pilotOrg.organization);
        storeOrgId(pilotOrg.orgId);
      } else if (storedOrgId && cached.memberships.some(m => m.orgId === storedOrgId)) {
        setActiveOrgIdState(storedOrgId);
        const org = cached.memberships.find(m => m.orgId === storedOrgId)?.organization;
        setActiveOrg(org);
      } else if (cached.memberships.length > 0) {
        const firstOrg = cached.memberships[0];
        setActiveOrgIdState(firstOrg.orgId);
        setActiveOrg(firstOrg.organization);
        storeOrgId(firstOrg.orgId);
      }
      return;
    }

    // Guard 6: Check if already loading globally
    if (loadingStates.has(uid)) {
      debugLog('Another instance is loading, waiting...');
      loadingStates.get(uid).then((result) => {
        if (!mountedRef.current) return;
        setMemberships(result.memberships);
        setOrganizations(result.organizations);
        setStatus('success');
      });
      return;
    }

    // Start loading
    loadingRef.current = true;
    setStatus('loading');
    debugLog('Starting fresh load');

    const loadPromise = (async () => {
      try {
        const memberships = await fetchUserMemberships(uid, user.email);

        const organizations = memberships
          .map(m => m.organization)
          .filter(Boolean)
          .filter((org, index, self) =>
            self.findIndex(o => o?.id === org?.id) === index
          );

        // Cache the result
        const cacheEntry = {
          memberships,
          organizations,
          timestamp: Date.now(),
          status: 'success'
        };
        globalCache.set(uid, cacheEntry);

        // Update state if still mounted
        if (mountedRef.current) {
          setMemberships(memberships);
          setOrganizations(organizations);
          setStatus('success');
          setError(null);

          // Set active org - prioritize pilot-org-santiago
          const storedOrgId = getStoredOrgId();
          const pilotOrg = memberships.find(m => m.orgId === 'pilot-org-santiago');

          if (pilotOrg) {
            // If user is in pilot org, always set it as active
            setActiveOrgIdState(pilotOrg.orgId);
            setActiveOrg(pilotOrg.organization);
            storeOrgId(pilotOrg.orgId);
          } else if (storedOrgId && memberships.some(m => m.orgId === storedOrgId)) {
            setActiveOrgIdState(storedOrgId);
            const org = memberships.find(m => m.orgId === storedOrgId)?.organization;
            setActiveOrg(org);
          } else if (memberships.length > 0) {
            const firstOrg = memberships[0];
            setActiveOrgIdState(firstOrg.orgId);
            setActiveOrg(firstOrg.organization);
            storeOrgId(firstOrg.orgId);
          }
        }

        return cacheEntry;
      } catch (error) {
        console.error('[OrgContext] Load failed:', error);

        // Create emergency fallback
        const fallbackMembership = {
          id: `error_${uid}`,
          orgId: `org_personal_${uid}`,
          org_id: `org_personal_${uid}`,
          userId: uid,
          user_id: uid,
          role: 'owner',
          status: 'active',
          organization: {
            id: `org_personal_${uid}`,
            name: 'Personal Workspace (Error Recovery)',
            type: 'personal'
          }
        };

        const cacheEntry = {
          memberships: [fallbackMembership],
          organizations: [fallbackMembership.organization],
          timestamp: Date.now(),
          status: 'error'
        };

        globalCache.set(uid, cacheEntry);

        if (mountedRef.current) {
          setMemberships([fallbackMembership]);
          setOrganizations([fallbackMembership.organization]);
          setActiveOrgIdState(fallbackMembership.orgId);
          setActiveOrg(fallbackMembership.organization);
          setStatus('success'); // Set to success even on error to prevent loops
          setError(error.message);
        }

        return cacheEntry;
      } finally {
        loadingRef.current = false;
        loadingStates.delete(uid);
      }
    })();

    loadingStates.set(uid, loadPromise);

  }, [user?.uid, user?.email, authLoading]); // âœ… CORREGIDO: Remover funciones de dependencias

  // Navigation effect - only navigate when truly needed AND user is authenticated
  useEffect(() => {
    // Don't navigate if user is not authenticated
    if (status === 'unauthenticated' || !user) {
      return;
    }

    if (status === 'success' && memberships.length === 0 && !navigationRef.current) {
      if (location.pathname !== '/select-workspace') {
        navigationRef.current = true;
        debugLog('Navigating to workspace selection');
        navigate('/select-workspace', { replace: true });
      }
    }
  }, [status, memberships.length, user?.uid]); // âœ… CORREGIDO: Remover navigate y location.pathname

  // Actions
  const setActiveOrgId = useCallback((orgId) => {
    if (!orgId) {
      setActiveOrgIdState(null);
      setActiveOrg(null);
      storeOrgId(null);
      return true;
    }

    const membership = memberships.find(m => m.orgId === orgId || m.org_id === orgId);
    if (!membership) {
      console.warn('[OrgContext] Invalid org selection:', orgId);
      return false;
    }

    setActiveOrgIdState(orgId);
    setActiveOrg(membership.organization);
    storeOrgId(orgId);

    if (telemetry?.trackOrgSwitch) {
      telemetry.trackOrgSwitch(orgId, 'manual');
    }

    debugLog('Active org changed', { orgId });
    return true;
  }, [memberships]); // âœ… CORREGIDO: Remover storeOrgId de dependencias

  const refreshMemberships = useCallback(() => {
    if (!user?.uid) return;

    debugLog('Refreshing memberships');
    globalCache.delete(user.uid);
    loadingStates.delete(user.uid);
    loadingRef.current = false;
    setStatus('idle');
  }, [user?.uid]);

  const clearWorkspace = useCallback(() => {
    setActiveOrgIdState(null);
    setActiveOrg(null);
    storeOrgId(null);
    navigationRef.current = false;
    debugLog('Workspace cleared');
  }, []); // âœ… CORREGIDO: Sin dependencias innecesarias

  // Computed values
  const isPersonalWorkspace = activeOrg?.type === 'personal';
  const canSwitchWorkspace = memberships.length > 1;
  const activeMembership = memberships.find(m =>
    (m.orgId === activeOrgId || m.org_id === activeOrgId)
  );

  // Create organizationsById map for easy lookup
  const organizationsById = memberships.reduce((acc, membership) => {
    if (membership.orgId && membership.orgMeta) {
      acc[membership.orgId] = membership.orgMeta;
    }
    return acc;
  }, {});

  // Context value
  const value = {
    // State
    activeOrgId,
    activeOrg,
    memberships,
    organizations,
    organizationsById,
    status,
    error,

    // Computed
    isPersonalWorkspace,
    canSwitchWorkspace,
    activeMembership,
    loading: status === 'loading',
    isReady: status === 'success' && activeOrgId !== null, // âœ… NUEVO: indica si estÃ¡ listo para feature flags

    // Actions
    setActiveOrg: setActiveOrgId,
    setActiveOrgId,
    refreshMemberships,
    clearWorkspace,

    // Legacy compatibility
    getActiveOrgId: () => activeOrgId
  };

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
};

// Hook to use organization context
export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};

// Legacy compatibility
export const getActiveOrgIdFromContext = () => {
  // Esta funciÃ³n debe ser llamada desde fuera del contexto de React
  // Retorna el orgId activo desde localStorage como fallback
  try {
    const uid = localStorage.getItem('360mvp_user_uid');
    if (uid) {
      return localStorage.getItem(`selectedOrgId_${uid}`);
    }
    return null;
  } catch (error) {
    console.warn('[getActiveOrgIdFromContext] Error accessing localStorage:', error);
    return null;
  }
};

// Debug helper (only available in debug mode)
if (typeof window !== 'undefined' && isDebug()) {
  window.__debugOrgContext = {
    cache: globalCache,
    loadingStates,
    debugOnly: () => isDebug(),
    forceReset: () => {
      globalCache.clear();
      loadingStates.clear();
      localStorage.removeItem('selectedOrgId');
      localStorage.removeItem('ORGCTX_KILL');
      localStorage.removeItem('DEBUG');
      console.log('[OrgContext] Debug state cleared, reloading...');
      location.reload();
    },
    enableDebug: () => {
      localStorage.setItem('DEBUG', '1');
      console.log('[OrgContext] Debug mode enabled, reload to see logs');
    },
    disableDebug: () => {
      localStorage.removeItem('DEBUG');
      console.log('[OrgContext] Debug mode disabled, reload to hide logs');
    }
  };

  console.log('ðŸ”§ OrgContext debug tools available:');
  console.log('  __debugOrgContext.forceReset() - Clear all state');
  console.log('  __debugOrgContext.enableDebug() - Enable debug logs');
  console.log('  __debugOrgContext.disableDebug() - Disable debug logs');
}

export default OrgContext;