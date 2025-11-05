/**
 * Models Index
 * Central export point for all data models
 */

// Import all models
import Campaign, { CampaignStatus, CampaignType } from './campaign.model';
import Assignment, { AssignmentStatus, AssignmentRole } from './assignment.model';
import BulkAction, { BulkActionType, BulkActionStatus } from './bulkAction.model';
import Alert, { AlertType, AlertSeverity, AlertStatus } from './alert.model';

// Export models
export {
  // Campaign
  Campaign,
  CampaignStatus,
  CampaignType,
  
  // Assignment
  Assignment,
  AssignmentStatus,
  AssignmentRole,
  
  // BulkAction
  BulkAction,
  BulkActionType,
  BulkActionStatus,
  
  // Alert
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus
};

// Default export with all models
export default {
  Campaign,
  Assignment,
  BulkAction,
  Alert
};
