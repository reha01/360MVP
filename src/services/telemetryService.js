// src/services/telemetryService.js
// Telemetry service for tracking multi-tenant scoping compliance

import { isTenancyV1Enabled } from './featureFlags.js';

class TelemetryService {
  constructor() {
    this.unscopedCalls = [];
    this.legacyDocs = [];
    this.metrics = {
      totalReads: 0,
      scopedReads: 0,
      unscopedReads: 0,
      totalWrites: 0,
      scopedWrites: 0,
      unscopedWrites: 0,
      legacyDocsFound: 0,
      crossOrgAttempts: 0
    };
  }

  /**
   * Track a Firestore operation
   */
  trackOperation(operation, collection, hasOrgScope, orgId = null) {
    const timestamp = new Date();
    const stack = new Error().stack;
    
    // Update metrics
    if (operation === 'read') {
      this.metrics.totalReads++;
      if (hasOrgScope) {
        this.metrics.scopedReads++;
      } else {
        this.metrics.unscopedReads++;
        this.logUnscopedCall('read', collection, stack);
      }
    } else if (operation === 'write') {
      this.metrics.totalWrites++;
      if (hasOrgScope) {
        this.metrics.scopedWrites++;
      } else {
        this.metrics.unscopedWrites++;
        this.logUnscopedCall('write', collection, stack);
      }
    }

    // Log in development
    if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
      console.log(`[Telemetry] ${operation} on ${collection}`, {
        hasOrgScope,
        orgId,
        timestamp
      });
    }
  }

  /**
   * Log unscoped calls for debugging
   */
  logUnscopedCall(operation, collection, stack) {
    const call = {
      operation,
      collection,
      timestamp: new Date(),
      stack: stack.split('\n').slice(2, 5).join('\n') // Get relevant stack frames
    };
    
    this.unscopedCalls.push(call);
    
    // Warning in console if tenancy is enabled
    if (isTenancyV1Enabled()) {
      console.warn(`⚠️ [UNSCOPED ${operation.toUpperCase()}] Collection: ${collection}`);
      console.warn('Stack:', call.stack);
    }
  }

  /**
   * Track legacy document without org_id
   */
  trackLegacyDoc(collection, docId) {
    const doc = {
      collection,
      docId,
      timestamp: new Date()
    };
    
    this.legacyDocs.push(doc);
    this.metrics.legacyDocsFound++;
    
    if (isTenancyV1Enabled()) {
      console.warn(`⚠️ [LEGACY DOC] Collection: ${collection}, Doc: ${docId} missing org_id`);
    }
  }

  /**
   * Track cross-org access attempt (should be denied)
   */
  trackCrossOrgAttempt(userOrgId, attemptedOrgId, collection) {
    this.metrics.crossOrgAttempts++;
    
    console.error(`🚫 [CROSS-ORG DENIED] User org: ${userOrgId}, Attempted: ${attemptedOrgId}, Collection: ${collection}`);
  }

  /**
   * Track workspace UX events
   */
  trackWorkspaceEvent(event, orgId, metadata = {}) {
    const eventData = {
      event,
      orgId,
      timestamp: new Date(),
      metadata
    };

    // Log UX events
    console.log(`[UX Event] ${event}:`, eventData);

    // In production, this would send to analytics service
    if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
      this.sendToAnalytics('workspace_event', eventData);
    }
  }

  /**
   * Track workspace switch
   */
  trackWorkspaceSwitch(fromOrgId, toOrgId, source = 'manual') {
    this.trackWorkspaceEvent('workspace_switched', toOrgId, {
      fromOrgId,
      source,
      switchTime: new Date()
    });
  }

  /**
   * Track workspace auto-selection
   */
  trackWorkspaceAutoSelect(orgId, reason = 'personal_only') {
    this.trackWorkspaceEvent('workspace_autoselected_personal', orgId, {
      reason,
      autoSelectTime: new Date()
    });
  }

  /**
   * Track workspace opened
   */
  trackWorkspaceOpened(orgId, orgType = 'unknown') {
    this.trackWorkspaceEvent('workspace_opened', orgId, {
      orgType,
      openTime: new Date()
    });
  }

  /**
   * Send event to analytics (placeholder for real implementation)
   */
  sendToAnalytics(eventType, data) {
    // This would integrate with your analytics service (GA, Mixpanel, etc.)
    console.log(`[Analytics] ${eventType}:`, data);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      scopedReadPercentage: this.metrics.totalReads > 0 
        ? ((this.metrics.scopedReads / this.metrics.totalReads) * 100).toFixed(2) + '%'
        : '0%',
      scopedWritePercentage: this.metrics.totalWrites > 0
        ? ((this.metrics.scopedWrites / this.metrics.totalWrites) * 100).toFixed(2) + '%'
        : '0%',
      unscopedCallsCount: this.unscopedCalls.length,
      legacyDocsCount: this.legacyDocs.length
    };
  }

  /**
   * Get unscoped calls for debugging
   */
  getUnscopedCalls() {
    return this.unscopedCalls;
  }

  /**
   * Get legacy documents found
   */
  getLegacyDocs() {
    return this.legacyDocs;
  }

  /**
   * Print telemetry report
   */
  printReport() {
    console.group('📊 Multi-Tenant Telemetry Report');
    console.table(this.getMetrics());
    
    if (this.unscopedCalls.length > 0) {
      console.group('⚠️ Unscoped Calls');
      console.table(this.unscopedCalls.slice(-10)); // Last 10 calls
      console.groupEnd();
    }
    
    if (this.legacyDocs.length > 0) {
      console.group('📋 Legacy Documents');
      console.table(this.legacyDocs.slice(-10)); // Last 10 docs
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.unscopedCalls = [];
    this.legacyDocs = [];
    this.metrics = {
      totalReads: 0,
      scopedReads: 0,
      unscopedReads: 0,
      totalWrites: 0,
      scopedWrites: 0,
      unscopedWrites: 0,
      legacyDocsFound: 0,
      crossOrgAttempts: 0
    };
  }

  /**
   * Export metrics for monitoring systems
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      tenancyEnabled: isTenancyV1Enabled(),
      metrics: this.getMetrics(),
      unscopedCalls: this.unscopedCalls.map(call => ({
        ...call,
        timestamp: call.timestamp.toISOString()
      })),
      legacyDocs: this.legacyDocs.map(doc => ({
        ...doc,
        timestamp: doc.timestamp.toISOString()
      }))
    };
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Auto-print report in development every 30 seconds if there's activity
if (import.meta.env.VITE_DEBUG_LOGS === 'true') {
  setInterval(() => {
    const metrics = telemetry.getMetrics();
    if (metrics.totalReads > 0 || metrics.totalWrites > 0) {
      telemetry.printReport();
    }
  }, 30000);
}

export default telemetry;
