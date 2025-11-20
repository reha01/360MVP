/**
 * Phase 2 Services Index
 * Central export point for all Phase 2 services
 * 
 * NOTA: campaignService ahora se importa desde el servicio principal consolidado
 */

import campaignService from '../campaignService';
import metricsService from './metricsService';
// import dlqService from './dlqService'; // UNUSED - Using bulkActionDLQ directly instead

export {
  campaignService,
  metricsService,
  // dlqService // UNUSED
};

// Default export with all services
export default {
  campaign: campaignService,
  metrics: metricsService,
  // dlq: dlqService // UNUSED
};
