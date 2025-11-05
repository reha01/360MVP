/**
 * Phase 2 Services Index
 * Central export point for all Phase 2 services
 */

import campaignService from './campaignService';
import metricsService from './metricsService';
import dlqService from './dlqService';

export {
  campaignService,
  metricsService,
  dlqService
};

// Default export with all services
export default {
  campaign: campaignService,
  metrics: metricsService,
  dlq: dlqService
};
