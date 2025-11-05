/**
 * Feature Flags Service - Runtime feature flags from Firestore
 * 
 * Este servicio lee los feature flags directamente desde Firestore
 * para cada organización, permitiendo control dinámico por org.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Cache de feature flags por organización
const flagsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener feature flags de una organización desde Firestore
 * @param {string} orgId - ID de la organización
 * @returns {Object} Feature flags de la organización
 */
export async function getOrgFeatureFlags(orgId) {
  if (!orgId) {
    console.warn('[FeatureFlags] No orgId provided, returning defaults');
    return getDefaultFlags();
  }

  // Verificar cache
  const cached = flagsCache.get(orgId);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log('[FeatureFlags] Using cached flags for:', orgId);
    return cached.flags;
  }

  try {
    // Leer desde Firestore
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      console.warn('[FeatureFlags] Organization not found:', orgId);
      return getDefaultFlags();
    }

    const orgData = orgDoc.data();
    const featureFlags = orgData.featureFlags || {};

    // Mapear los nombres exactos de los flags
    const flags = {
      FEATURE_DASHBOARD_360: featureFlags.FEATURE_DASHBOARD_360 === true,
      FEATURE_BULK_ACTIONS: featureFlags.FEATURE_BULK_ACTIONS === true,
      FEATURE_CAMPAIGN_COMPARISON: featureFlags.FEATURE_CAMPAIGN_COMPARISON === true,
      FEATURE_ORG_POLICIES: featureFlags.FEATURE_ORG_POLICIES === true,
      FEATURE_OPERATIONAL_ALERTS: featureFlags.FEATURE_OPERATIONAL_ALERTS === true,
      // Flags legacy/generales
      FEATURE_ORG: featureFlags.FEATURE_ORG !== false,
      FEATURE_PDF: featureFlags.FEATURE_PDF !== false,
      FEATURE_EMAIL: featureFlags.FEATURE_EMAIL !== false,
      FEATURE_INVITES: featureFlags.FEATURE_INVITES !== false,
      FEATURE_WIZARD: featureFlags.FEATURE_WIZARD !== false,
      FEATURE_CREDITS: featureFlags.FEATURE_CREDITS !== false,
      TEST_CATALOG: featureFlags.TEST_CATALOG !== false,
      TENANCY_V1: featureFlags.TENANCY_V1 !== false
    };

    // Guardar en cache
    flagsCache.set(orgId, {
      flags,
      timestamp: Date.now()
    });

    console.log('[FeatureFlags] Loaded flags for org:', orgId, flags);
    return flags;

  } catch (error) {
    console.error('[FeatureFlags] Error loading flags:', error);
    return getDefaultFlags();
  }
}

/**
 * Verificar si un feature flag específico está habilitado
 * @param {string} flagName - Nombre del flag
 * @param {string} orgId - ID de la organización
 * @returns {Promise<boolean>} Si el flag está habilitado
 */
export async function isFeatureEnabledAsync(flagName, orgId) {
  const flags = await getOrgFeatureFlags(orgId);
  return flags[flagName] === true;
}

/**
 * Limpiar cache de flags
 * @param {string} orgId - ID de la organización (opcional)
 */
export function clearFlagsCache(orgId) {
  if (orgId) {
    flagsCache.delete(orgId);
  } else {
    flagsCache.clear();
  }
}

/**
 * Obtener flags por defecto
 * @returns {Object} Flags por defecto
 */
function getDefaultFlags() {
  return {
    // Phase 2 flags - OFF by default
    FEATURE_DASHBOARD_360: false,
    FEATURE_BULK_ACTIONS: false,
    FEATURE_CAMPAIGN_COMPARISON: false,
    FEATURE_ORG_POLICIES: false,
    FEATURE_OPERATIONAL_ALERTS: false,
    // Legacy flags - ON by default
    FEATURE_ORG: true,
    FEATURE_PDF: true,
    FEATURE_EMAIL: true,
    FEATURE_INVITES: true,
    FEATURE_WIZARD: true,
    FEATURE_CREDITS: false,
    TEST_CATALOG: false,
    TENANCY_V1: true
  };
}

export default {
  getOrgFeatureFlags,
  isFeatureEnabledAsync,
  clearFlagsCache
};









