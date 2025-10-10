/**
 * Feature Flags - Control de funcionalidades
 * 
 * Flags disponibles:
 * - TENANCY_V1: Enforcement multi-tenant
 * - FEATURE_ORG: Módulo organizacional
 * - FEATURE_INVITES: Sistema de invitaciones
 * - FEATURE_PDF: Generación de PDF
 * - FEATURE_EMAIL: Sistema de emails
 * - FEATURE_CREDITS: Sistema de créditos/pagos
 * - TEST_CATALOG: Catálogo de tests administrable (NUEVO)
 */

import { deriveEnv } from '../utils/env';

const env = deriveEnv();

// Feature Flags desde variables de entorno
export const TENANCY_V1 = import.meta.env.VITE_TENANCY_V1 === 'true';
export const FEATURE_ORG = import.meta.env.VITE_FEATURE_ORG === 'true';
export const FEATURE_INVITES = import.meta.env.VITE_FEATURE_INVITES === 'true';
export const FEATURE_WIZARD = import.meta.env.VITE_FEATURE_WIZARD === 'true';
export const FEATURE_PDF = import.meta.env.VITE_FEATURE_PDF === 'true';
export const FEATURE_EMAIL = import.meta.env.VITE_FEATURE_EMAIL === 'true';
export const FEATURE_CREDITS = import.meta.env.VITE_FEATURE_CREDITS === 'true';

// NUEVO: Flag para catálogo de tests administrable
export const TEST_CATALOG = import.meta.env.VITE_TEST_CATALOG === 'true';

/**
 * Verificar si una feature está habilitada
 */
export const isFeatureEnabled = (featureName: string): boolean => {
  const features: Record<string, boolean> = {
    TENANCY_V1,
    FEATURE_ORG,
    FEATURE_INVITES,
    FEATURE_WIZARD,
    FEATURE_PDF,
    FEATURE_EMAIL,
    FEATURE_CREDITS,
    TEST_CATALOG
  };

  return features[featureName] === true;
};

/**
 * Obtener todas las features habilitadas
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries({
    TENANCY_V1,
    FEATURE_ORG,
    FEATURE_INVITES,
    FEATURE_WIZARD,
    FEATURE_PDF,
    FEATURE_EMAIL,
    FEATURE_CREDITS,
    TEST_CATALOG
  })
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
};

/**
 * Debug: Log de features habilitadas
 */
export const logFeatures = () => {
  if (env === 'local') {
    console.log('[FeatureFlags] Enabled features:', getEnabledFeatures());
  }
};

/**
 * Helper: Check if tenancy V1 is enabled
 */
export const isTenancyV1Enabled = (): boolean => TENANCY_V1;

/**
 * Helper: Check if organization feature is enabled
 */
export const isOrgEnabled = (): boolean => FEATURE_ORG;

/**
 * Helper: Check if PDF feature is enabled
 */
export const isPdfEnabled = (): boolean => FEATURE_PDF;

/**
 * Helper: Check if invites feature is enabled
 */
export const isInvitesEnabled = (): boolean => FEATURE_INVITES;

/**
 * Helper: Check if wizard feature is enabled
 */
export const isWizardEnabled = (): boolean => FEATURE_WIZARD;

/**
 * Helper: Check if credits feature is enabled
 */
export const isCreditsEnabled = (): boolean => FEATURE_CREDITS;

/**
 * Helper: Check if email feature is enabled
 */
export const isEmailEnabled = (): boolean => FEATURE_EMAIL;

/**
 * Helper: Check if test catalog is enabled
 */
export const isTestCatalogEnabled = (): boolean => TEST_CATALOG;

export default {
  TENANCY_V1,
  FEATURE_ORG,
  FEATURE_INVITES,
  FEATURE_WIZARD,
  FEATURE_PDF,
  FEATURE_EMAIL,
  FEATURE_CREDITS,
  TEST_CATALOG,
  isFeatureEnabled,
  getEnabledFeatures,
  logFeatures,
  isTenancyV1Enabled,
  isOrgEnabled,
  isPdfEnabled,
  isInvitesEnabled,
  isWizardEnabled,
  isCreditsEnabled,
  isEmailEnabled,
  isTestCatalogEnabled
};
