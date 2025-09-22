// src/services/featureFlags.js

/**
 * FeatureFlags - Sistema de feature flags híbrido
 * Build-time para performance, runtime para UI toggles
 */

class FeatureFlagsService {
  constructor() {
    this.flags = this._loadFlags();
    this.environment = this._getEnvironment();
    
    console.log('[360MVP] FeatureFlags: Initialized for environment:', this.environment);
    console.log('[360MVP] FeatureFlags: Active flags:', this.flags);
  }

  /**
   * Cargar flags desde variables de entorno
   */
  _loadFlags() {
    return {
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
      
      // Usar emuladores
      useEmulators: this._getBooleanFlag('VITE_USE_EMULATORS', true)
    };
  }

  /**
   * Obtener entorno actual
   */
  _getEnvironment() {
    return import.meta.env.VITE_ENVIRONMENT || 'local';
  }

  /**
   * Helper para obtener boolean flag
   */
  _getBooleanFlag(key, defaultValue = false) {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1' || value === 'yes';
  }

  /**
   * Verificar si el módulo organizacional está habilitado
   */
  isOrgEnabled() {
    return this.flags.org && this.environment !== 'demo';
  }

  /**
   * Verificar si PDF export está habilitado
   */
  isPdfEnabled() {
    return this.flags.pdf;
  }

  /**
   * Verificar si invitaciones por token están habilitadas
   */
  isInvitesEnabled() {
    return this.flags.invites;
  }

  /**
   * Verificar si wizard avanzado está habilitado
   */
  isWizardEnabled() {
    return this.flags.wizard;
  }

  /**
   * Verificar si sistema de créditos está habilitado
   */
  isCreditsEnabled() {
    return this.flags.credits;
  }

  /**
   * Verificar si usar emuladores
   */
  shouldUseEmulators() {
    return this.flags.useEmulators && (this.environment === 'local' || this.environment === 'development');
  }

  /**
   * Verificar si mostrar logs de debug
   */
  isDebugEnabled() {
    return this.flags.debugLogs && this.environment !== 'production';
  }

  /**
   * Verificar si mostrar métricas de performance
   */
  isPerformanceMetricsEnabled() {
    return this.flags.performanceMetrics;
  }

  /**
   * Obtener configuración del tenant por defecto
   */
  getDefaultTenant() {
    return import.meta.env.VITE_TENANT_DEFAULT || 'demo-corp';
  }

  /**
   * Obtener URL base de la aplicación
   */
  getAppBaseUrl() {
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
  logConfiguration() {
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
export const getDefaultTenant = () => FeatureFlags.getDefaultTenant();
export const getAppBaseUrl = () => FeatureFlags.getAppBaseUrl();
