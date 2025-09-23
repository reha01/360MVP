// src/lib/featureFlags.ts

import { deriveEnv, isPublicHost, type AppEnv } from '../utils/env';

/**
 * FeatureFlags - Sistema de feature flags híbrido
 * Build-time para performance, runtime para UI toggles
 */

interface FeatureFlagsConfig {
  // Módulo organizacional (dashboards, procesos, CSV)
  org: boolean;
  // Export PDF en reportes
  pdf: boolean;
  // Sistema de invitaciones por token
  invites: boolean;
  // Wizard de evaluación avanzado
  wizard: boolean;
  // Sistema de créditos y pagos
  credits: boolean;
  // Sistema de emails transaccionales
  email: boolean;
  // Logs de debug
  debugLogs: boolean;
  // Métricas de performance
  performanceMetrics: boolean;
  // Usar emuladores
  useEmulators: boolean;
  // Multi-Tenant Feature Flag (Phase 0)
  tenancyV1: boolean;
}

class FeatureFlagsService {
  public flags: FeatureFlagsConfig;
  public environment: AppEnv;
  
  constructor() {
    this.environment = deriveEnv();
    this.flags = this._loadFlags();
    
    console.info('[360MVP] FeatureFlags:', { 
      env: this.environment, 
      useEmulators: this.flags.useEmulators 
    });
  }

  /**
   * Cargar flags desde variables de entorno
   */
  private _loadFlags(): FeatureFlagsConfig {
    const baseFlags = {
      // Módulo organizacional (dashboards, procesos, CSV)
      org: this._getBooleanFlag('VITE_FEATURE_ORG', true),
      
      // Export PDF en reportes
      pdf: this._getBooleanFlag('VITE_FEATURE_PDF', true),
      
      // Sistema de invitaciones por token
      invites: this._getBooleanFlag('VITE_FEATURE_INVITES', true),
      
      // Wizard de evaluación avanzado
      wizard: this._getBooleanFlag('VITE_FEATURE_WIZARD', true),
      
      // Sistema de créditos y pagos
      credits: this._getBooleanFlag('VITE_FEATURE_CREDITS', false),
      
      // Sistema de emails transaccionales
      email: this._getBooleanFlag('VITE_FEATURE_EMAIL', true),
      
      // Logs de debug
      debugLogs: this._getBooleanFlag('VITE_DEBUG_LOGS', true),
      
      // Métricas de performance
      performanceMetrics: this._getBooleanFlag('VITE_PERFORMANCE_METRICS', true),
      
      // Usar emuladores - base value from env/localStorage
      useEmulators: this._getBooleanFlag('VITE_USE_EMULATORS', true),
      
      // Multi-Tenant Feature Flag (Phase 0)
      tenancyV1: this._getBooleanFlag('VITE_TENANCY_V1', false)
    };

    // Override useEmulators if we're on a public host
    if (isPublicHost()) {
      baseFlags.useEmulators = false;
    }

    return baseFlags;
  }

  /**
   * Helper para obtener boolean flag
   */
  private _getBooleanFlag(key: string, defaultValue = false): boolean {
    // First check environment variables
    const envValue = import.meta.env[key];
    if (envValue !== undefined) {
      return envValue === 'true' || envValue === '1' || envValue === 'yes';
    }

    // Fallback to localStorage for development/testing
    try {
      const localValue = localStorage.getItem(key.replace('VITE_', '').toLowerCase());
      if (localValue !== null) {
        return localValue === 'true' || localValue === '1' || localValue === 'yes';
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    return defaultValue;
  }

  /**
   * Verificar si el módulo organizacional está habilitado
   */
  isOrgEnabled(): boolean {
    return this.flags.org && this.environment !== 'demo';
  }

  /**
   * Verificar si PDF export está habilitado
   */
  isPdfEnabled(): boolean {
    return this.flags.pdf;
  }

  /**
   * Verificar si invitaciones por token están habilitadas
   */
  isInvitesEnabled(): boolean {
    return this.flags.invites;
  }

  /**
   * Verificar si wizard avanzado está habilitado
   */
  isWizardEnabled(): boolean {
    return this.flags.wizard;
  }

  /**
   * Verificar si sistema de créditos está habilitado
   */
  isCreditsEnabled(): boolean {
    return this.flags.credits;
  }

  /**
   * Verificar si usar emuladores
   * Forced to false on public hosts regardless of other settings
   */
  shouldUseEmulators(): boolean {
    return this.flags.useEmulators && (this.environment === 'local' || this.environment === 'development');
  }

  /**
   * Verificar si mostrar logs de debug
   */
  isDebugEnabled(): boolean {
    return this.flags.debugLogs && this.environment !== 'production';
  }

  /**
   * Verificar si mostrar métricas de performance
   */
  isPerformanceMetricsEnabled(): boolean {
    return this.flags.performanceMetrics;
  }

  /**
   * Verificar si multi-tenancy V1 está habilitado
   */
  isTenancyV1Enabled(): boolean {
    return this.flags.tenancyV1;
  }

  /**
   * Obtener configuración del tenant por defecto
   */
  getDefaultTenant(): string {
    return import.meta.env.VITE_TENANT_DEFAULT || 'demo-corp';
  }

  /**
   * Obtener URL base de la aplicación
   */
  getAppBaseUrl(): string {
    return import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  }

  /**
   * Obtener configuración completa para debugging
   */
  getConfiguration() {
    return {
      environment: this.environment,
      flags: this.flags,
      urls: {
        appBase: this.getAppBaseUrl(),
        authEmulator: import.meta.env.VITE_AUTH_EMULATOR_URL,
        firestoreEmulator: import.meta.env.VITE_FIRESTORE_EMULATOR_URL
      },
      tenant: this.getDefaultTenant()
    };
  }

  /**
   * Log configuración si debug está habilitado
   */
  logConfiguration(): void {
    if (this.isDebugEnabled()) {
      console.group('[360MVP] FeatureFlags Configuration');
      console.table(this.getConfiguration());
      console.groupEnd();
    }
  }
}

// Singleton instance
export const FeatureFlags = new FeatureFlagsService();

// Initialize logging
FeatureFlags.logConfiguration();

// Default export
export default FeatureFlags;

// Convenience exports
export const isOrgEnabled = () => FeatureFlags.isOrgEnabled();
export const isPdfEnabled = () => FeatureFlags.isPdfEnabled();
export const isInvitesEnabled = () => FeatureFlags.isInvitesEnabled();
export const isWizardEnabled = () => FeatureFlags.isWizardEnabled();
export const isCreditsEnabled = () => FeatureFlags.isCreditsEnabled();
export const shouldUseEmulators = () => FeatureFlags.shouldUseEmulators();
export const isDebugEnabled = () => FeatureFlags.isDebugEnabled();
export const isTenancyV1Enabled = () => FeatureFlags.isTenancyV1Enabled();
export const getDefaultTenant = () => FeatureFlags.getDefaultTenant();
export const getAppBaseUrl = () => FeatureFlags.getAppBaseUrl();

