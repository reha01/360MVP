// src/lib/orgs.ts
// Organization metadata management with caching

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { dlog } from '../utils/debug';

export type OrgMeta = { 
  id: string; 
  displayName: string; 
  type: 'personal' | 'corporate'; 
  avatarColor?: string; 
};

// Cache for organization metadata
const cache = new Map<string, OrgMeta>();

/**
 * Get organization metadata with caching
 */
export async function getOrgMeta(orgId: string): Promise<OrgMeta | null> {
  // Check cache first
  if (cache.has(orgId)) {
    const cached = cache.get(orgId)!;
    dlog('[OrgMeta] cache hit', { orgId, displayName: cached.displayName });
    return cached;
  }

  try {
    dlog('[OrgMeta] fetching', { orgId });
    
    const orgDoc = doc(db, 'organizations', orgId);
    const snap = await getDoc(orgDoc);
    
    if (!snap.exists()) {
      dlog('[OrgMeta] not found', { orgId });
      return null;
    }
    
    const data = snap.data();
    const meta: OrgMeta = {
      id: orgId,
      displayName: data.displayName || data.name || orgId,
      type: data.type || 'corporate',
      avatarColor: data.avatarColor
    };
    
    // Cache the result
    cache.set(orgId, meta);
    
    dlog('[OrgMeta] hydrated', { orgId, hasMeta: !!meta, displayName: meta.displayName });
    return meta;
    
  } catch (error) {
    console.error('[OrgMeta] fetch error', { orgId, error });
    return null;
  }
}

/**
 * Get multiple organization metadata concurrently
 */
export async function getMultipleOrgMeta(orgIds: string[]): Promise<Map<string, OrgMeta>> {
  const result = new Map<string, OrgMeta>();
  
  if (orgIds.length === 0) {
    return result;
  }
  
  dlog('[OrgMeta] batch fetching', { count: orgIds.length, orgIds });
  
  // Filter out already cached
  const uncachedIds = orgIds.filter(id => !cache.has(id));
  
  // Fetch uncached in parallel
  const promises = uncachedIds.map(async (orgId) => {
    const meta = await getOrgMeta(orgId);
    if (meta) {
      result.set(orgId, meta);
    }
  });
  
  await Promise.all(promises);
  
  // Add cached results
  orgIds.forEach(orgId => {
    const cached = cache.get(orgId);
    if (cached) {
      result.set(orgId, cached);
    }
  });
  
  dlog('[OrgMeta] batch complete', { 
    total: orgIds.length, 
    found: result.size, 
    cached: orgIds.length - uncachedIds.length 
  });
  
  return result;
}

/**
 * Clear cache (useful for testing or when org data changes)
 */
export function clearOrgMetaCache(): void {
  cache.clear();
  dlog('[OrgMeta] cache cleared');
}

/**
 * Get cache stats for debugging
 */
export function getOrgMetaCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
