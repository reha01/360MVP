// src/services/featureFlags.js

/**
 * FeatureFlags - Sistema de feature flags hÃ­brido
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
      // MÃ³dulo organizacional (dashboards, procesos, CSV)
      org: this._getBooleanFlag('VITE_FEATURE_ORG', true),
      
      // Export PDF en reportes
      pdf: this._getBooleanFlag('VITE_FEATURE_PDF', true),
      
      // Sistema de invitaciones por token
      invites: this._getBooleanFlag('VITE_FEATURE_INVITES', true),
      
      // Wizard de evaluaciÃ³n avanzado
      wizard: this._getBooleanFlag('VITE_FEATURE_WIZARD', true),
      
      // Sistema de crÃ©ditos y pagos
      credits: this._getBooleanFlag('VITE_FEATURE_CREDITS', false),
      
      // Sistema de emails transaccionales
      email: this._getBooleanFlag('VITE_FEATURE_EMAIL', true),
      
      // Logs de debug
      debugLogs: this._getBooleanFlag('VITE_DEBUG_LOGS', true),
      
      // MÃ©tricas de performance
      performanceMetrics: this._getBooleanFlag('VITE_PERFORMANCE_METRICS', true),
      
      // Usar emuladores
      useEmulators: this._getBooleanFlag('VITE_USE_EMULATORS', true),
      
      // Multi-Tenant Feature Flag (Phase 0)
      tenancyV1: this._getBooleanFlag('VITE_TENANCY_V1', false)
    };
  }

  /**
   * Obtener entorno actual (privado)
   */
  _getEnvironment() {
    return import.meta.env.VITE_ENVIRONMENT || 'local';
  }

  /**
   * Obtener entorno actual (pÃºblico)
   */
  getEnvironment() {
    return this._getEnvironment();
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
   * Verificar si el mÃ³dulo organizacional estÃ¡ habilitado
   */
  isOrgEnabled() {
    return this.flags.org && this.environment !== 'demo';
  }

  /**
   * Verificar si PDF export estÃ¡ habilitado
   */
  isPdfEnabled() {
    return this.flags.pdf;
  }

  /**
   * Verificar si invitaciones por token estÃ¡n habilitadas
   */
  isInvitesEnabled() {
    return this.flags.invites;
  }

  /**
   * Verificar si wizard avanzado estÃ¡ habilitado
   */
  isWizardEnabled() {
    return this.flags.wizard;
  }

  /**
   * Verificar si sistema de crÃ©ditos estÃ¡ habilitado
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
   * Verificar si mostrar mÃ©tricas de performance
   */
  isPerformanceMetricsEnabled() {
    return this.flags.performanceMetrics;
  }

  /**
   * Verificar si multi-tenancy V1 estÃ¡ habilitado
   */
  isTenancyV1Enabled() {
    return this.flags.tenancyV1;
  }

  /**
   * Obtener configuraciÃ³n del tenant por defecto
   */
  getDefaultTenant() {
    return import.meta.env.VITE_TENANT_DEFAULT || 'demo-corp';
  }

  /**
   * Obtener URL base de la aplicaciÃ³n
   */
  getAppBaseUrl() {
    return import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  }

  /**
   * Obtener configuraciÃ³n completa para debugging
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
   * Log configuraciÃ³n si debug estÃ¡ habilitado
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

// Export commonly used methods for convenience
export const isTenancyV1Enabled = () => FeatureFlags.isTenancyV1Enabled();
export const isFeatureEnabled = (flagName) => FeatureFlags.isFeatureEnabled(flagName);
export const getFeatureFlags = () => FeatureFlags.getFeatureFlags();

// Initialize logging
FeatureFlags.logConfiguration();

// Default export
