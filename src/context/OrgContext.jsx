// src/context/OrgContext.jsx
// CRITICAL FIX: Loop prevention with global cache and strict guards

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import telemetry from '../services/telemetryService';

const OrgContext = createContext();

// ============================================================================
// GLOBAL CACHE & STATE MANAGEMENT - Prevents duplicate fetches across renders
// ============================================================================
const globalCache = new Map(); // uid -> { memberships, timestamp, status }
const loadingStates = new Map(); // uid -> Promise
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBUG = typeof window !== 'undefined' && (localStorage.getItem('DEBUG_ORGCTX') === '1' || import.meta.env.DEV);

// Helper: Log with timestamp
function debugLog(message, data = {}) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  console.log(`[OrgCtx ${timestamp}] ${message}`, data);
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
  
  try {
    const col = collection(db, 'organization_members');
    let memberships = [];
    
    // Try multiple field combinations
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
    
    return enrichedMemberships;
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
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
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
    if (DEBUG && renderCount.current > 10) {
      console.warn('[OrgContext] Excessive renders detected:', renderCount.current);
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
    
    // Guard 1: No user
    if (!uid) {
      debugLog('No user, clearing state');
      setStatus('idle');
      setMemberships([]);
      setActiveOrgIdState(null);
      setActiveOrg(null);
      setOrganizations([]);
      setError(null);
      loadingRef.current = false;
      return;
    }
    
    // Guard 2: Auth still loading
    if (authLoading) {
      debugLog('Auth still loading, waiting...');
      return;
    }
    
    // Guard 3: Kill switch check
    const killSwitch = localStorage.getItem('ORGCTX_KILL') === '1';
    if (killSwitch) {
      console.warn('[OrgContext] KILL SWITCH ACTIVE - Using fallback');
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
      
      // Restore active org
      const storedOrgId = getStoredOrgId();
      if (storedOrgId && cached.memberships.some(m => m.orgId === storedOrgId)) {
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
          
          // Set active org
          const storedOrgId = getStoredOrgId();
          if (storedOrgId && memberships.some(m => m.orgId === storedOrgId)) {
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
    
  }, [user?.uid, user?.email, authLoading, getStoredOrgId, storeOrgId]);
  
  // Navigation effect - only navigate when truly needed
  useEffect(() => {
    if (status === 'success' && memberships.length === 0 && !navigationRef.current) {
      if (location.pathname !== '/select-workspace') {
        navigationRef.current = true;
        debugLog('Navigating to workspace selection');
        navigate('/select-workspace', { replace: true });
      }
    }
  }, [status, memberships, navigate, location.pathname]);
  
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
  }, [memberships, storeOrgId]);
  
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
  }, [storeOrgId]);
  
  // Computed values
  const isPersonalWorkspace = activeOrg?.type === 'personal';
  const canSwitchWorkspace = memberships.length > 1;
  const activeMembership = memberships.find(m => 
    (m.orgId === activeOrgId || m.org_id === activeOrgId)
  );
  
  // Context value
  const value = {
    // State
    activeOrgId,
    activeOrg,
    memberships,
    organizations,
    status,
    error,
    
    // Computed
    isPersonalWorkspace,
    canSwitchWorkspace,
    activeMembership,
    loading: status === 'loading',
    
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

// Legacy compatibility exports
let globalOrgContext = null;

export const setGlobalOrgContext = (context) => {
  globalOrgContext = context;
};

export const getActiveOrgIdFromContext = () => {
  return globalOrgContext?.activeOrgId || null;
};

// TEMP: Debug helper - REMOVE before commit
if (typeof window !== 'undefined') {
  window.__debugOrgContext = {
    cache: globalCache,
    loadingStates,
    forceReset: () => {
      globalCache.clear();
      loadingStates.clear();
      localStorage.removeItem('selectedOrgId');
      localStorage.removeItem('ORGCTX_KILL');
      location.reload();
    }
  };
}

export default OrgContext;