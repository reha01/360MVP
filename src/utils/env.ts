// src/utils/env.ts
// Environment derivation and public host detection utilities

export type AppEnv = 'local' | 'staging' | 'prod';

/**
 * Derive application environment from hostname
 * - localhost/127.0.0.1 → 'local'
 * - *staging*.web.app or *staging*.firebaseapp.com → 'staging'
 * - *.web.app or *.firebaseapp.com → 'prod'
 */
export const deriveEnv = (): AppEnv => {
  const h = location.hostname;
  
  if (h.endsWith('web.app') || h.endsWith('firebaseapp.com')) {
    return h.includes('staging') ? 'staging' : 'prod';
  }
  
  return 'local';
};

/**
 * Check if we're running on a public hosting domain
 * (Firebase Hosting domains)
 */
export const isPublicHost = (): boolean => {
  return location.hostname.endsWith('web.app') || location.hostname.endsWith('firebaseapp.com');
};









