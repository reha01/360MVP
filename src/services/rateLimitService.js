/**
 * Servicio de Rate Limiting
 * 
 * Gestiona límites de tasa por organización y plan
 */

import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ========== CONSTANTES ==========

// Límites por plan
const PLAN_LIMITS = {
  free: {
    emailsPerDay: 50,
    activeCampaigns: 2,
    exportsPerDay: 10
  },
  starter: {
    emailsPerDay: 200,
    activeCampaigns: 5,
    exportsPerDay: 50
  },
  professional: {
    emailsPerDay: 1000,
    activeCampaigns: 20,
    exportsPerDay: 200
  },
  enterprise: {
    emailsPerDay: 5000,
    activeCampaigns: 100,
    exportsPerDay: 1000
  }
};

// ========== FUNCIONES DE RATE LIMITING ==========

/**
 * Verificar si una organización ha excedido el límite de emails por día
 */
export const checkEmailRateLimit = async (orgId) => {
  try {
    // Obtener plan de la organización
    const orgDoc = await getDoc(doc(db, 'orgs', orgId));
    const orgData = orgDoc.data();
    const plan = orgData?.plan || 'free';
    
    // Obtener límites del plan
    const limits = PLAN_LIMITS[plan];
    const dailyLimit = limits.emailsPerDay;
    
    // Obtener contador de emails del día
    const today = new Date().toISOString().split('T')[0];
    const counterDoc = await getDoc(doc(db, 'orgs', orgId, 'rateLimits', today));
    const emailsSent = counterDoc.exists() ? (counterDoc.data().emailsSent || 0) : 0;
    
    // Verificar si se ha excedido el límite
    if (emailsSent >= dailyLimit) {
      return {
        allowed: false,
        limit: dailyLimit,
        current: emailsSent,
        message: `Has alcanzado el límite diario de ${dailyLimit} emails para tu plan ${plan}. Por favor espera hasta mañana o actualiza tu plan para enviar más emails.`,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0))
      };
    }
    
    return {
      allowed: true,
      limit: dailyLimit,
      current: emailsSent,
      remaining: dailyLimit - emailsSent
    };
  } catch (error) {
    console.error('[RateLimit] Error checking email rate limit:', error);
    // En caso de error, permitir la operación (fail-open)
    return { allowed: true, error: error.message };
  }
};

/**
 * Incrementar contador de emails enviados
 */
export const incrementEmailCounter = async (orgId, count = 1) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const counterRef = doc(db, 'orgs', orgId, 'rateLimits', today);
    
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      const currentCount = counterDoc.data().emailsSent || 0;
      await updateDoc(counterRef, {
        emailsSent: currentCount + count,
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(counterRef, {
        emailsSent: count,
        date: today,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }
    
    console.log(`[RateLimit] Email counter incremented: ${count} for ${orgId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error incrementing email counter:', error);
    return false;
  }
};

/**
 * Verificar límite de campañas activas
 */
export const checkActiveCampaignsLimit = async (orgId) => {
  try {
    // Obtener plan de la organización
    const orgDoc = await getDoc(doc(db, 'orgs', orgId));
    const orgData = orgDoc.data();
    const plan = orgData?.plan || 'free';
    
    // Obtener límites del plan
    const limits = PLAN_LIMITS[plan];
    const campaignLimit = limits.activeCampaigns;
    
    // Simular conteo de campañas activas
    const activeCampaigns = 3; // En producción: contar desde Firestore
    
    if (activeCampaigns >= campaignLimit) {
      return {
        allowed: false,
        limit: campaignLimit,
        current: activeCampaigns,
        message: `Has alcanzado el límite de ${campaignLimit} campañas activas para tu plan ${plan}. Finaliza una campaña existente o actualiza tu plan.`
      };
    }
    
    return {
      allowed: true,
      limit: campaignLimit,
      current: activeCampaigns,
      remaining: campaignLimit - activeCampaigns
    };
  } catch (error) {
    console.error('[RateLimit] Error checking campaigns limit:', error);
    return { allowed: true, error: error.message };
  }
};

/**
 * Verificar límite de exports por día
 */
export const checkExportRateLimit = async (orgId) => {
  try {
    // Obtener plan de la organización
    const orgDoc = await getDoc(doc(db, 'orgs', orgId));
    const orgData = orgDoc.data();
    const plan = orgData?.plan || 'free';
    
    // Obtener límites del plan
    const limits = PLAN_LIMITS[plan];
    const dailyLimit = limits.exportsPerDay;
    
    // Obtener contador de exports del día
    const today = new Date().toISOString().split('T')[0];
    const counterDoc = await getDoc(doc(db, 'orgs', orgId, 'rateLimits', today));
    const exportsCreated = counterDoc.exists() ? (counterDoc.data().exportsCreated || 0) : 0;
    
    if (exportsCreated >= dailyLimit) {
      return {
        allowed: false,
        limit: dailyLimit,
        current: exportsCreated,
        message: `Has alcanzado el límite diario de ${dailyLimit} exports para tu plan ${plan}. Por favor espera hasta mañana o actualiza tu plan.`,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0))
      };
    }
    
    return {
      allowed: true,
      limit: dailyLimit,
      current: exportsCreated,
      remaining: dailyLimit - exportsCreated
    };
  } catch (error) {
    console.error('[RateLimit] Error checking export rate limit:', error);
    return { allowed: true, error: error.message };
  }
};

/**
 * Incrementar contador de exports
 */
export const incrementExportCounter = async (orgId, count = 1) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const counterRef = doc(db, 'orgs', orgId, 'rateLimits', today);
    
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      const currentCount = counterDoc.data().exportsCreated || 0;
      await updateDoc(counterRef, {
        exportsCreated: currentCount + count,
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(counterRef, {
        exportsCreated: count,
        date: today,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }
    
    console.log(`[RateLimit] Export counter incremented: ${count} for ${orgId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error incrementing export counter:', error);
    return false;
  }
};

/**
 * Obtener información completa de rate limits
 */
export const getRateLimitInfo = async (orgId) => {
  try {
    const orgDoc = await getDoc(doc(db, 'orgs', orgId));
    const orgData = orgDoc.data();
    const plan = orgData?.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    
    const today = new Date().toISOString().split('T')[0];
    const counterDoc = await getDoc(doc(db, 'orgs', orgId, 'rateLimits', today));
    const counters = counterDoc.exists() ? counterDoc.data() : {};
    
    return {
      plan,
      limits,
      current: {
        emailsSent: counters.emailsSent || 0,
        exportsCreated: counters.exportsCreated || 0,
        activeCampaigns: 3 // Simular
      },
      resetAt: new Date(new Date().setHours(24, 0, 0, 0))
    };
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit info:', error);
    throw error;
  }
};

// ========== EXPORTS ==========

export default {
  checkEmailRateLimit,
  incrementEmailCounter,
  checkActiveCampaignsLimit,
  checkExportRateLimit,
  incrementExportCounter,
  getRateLimitInfo,
  PLAN_LIMITS
};