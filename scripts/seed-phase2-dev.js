#!/usr/bin/env node

/**
 * Seed Script for Phase 2 Development
 * Creates sample data for campaigns, assignments, and alerts
 * 
 * Usage: node scripts/seed-phase2-dev.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { Campaign, CampaignStatus, CampaignType } from '../src/models/campaign.model.js';
import { Assignment, AssignmentStatus, AssignmentRole } from '../src/models/assignment.model.js';
import { BulkAction, BulkActionType, BulkActionStatus } from '../src/models/bulkAction.model.js';
import { Alert, AlertType, AlertSeverity, AlertStatus } from '../src/models/alert.model.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Configuration
const ORG_ID = 'pilot-org-santiago'; // Use pilot org for testing
const ADMIN_EMAIL = 'admin@pilot-santiago.com';
const ADMIN_PASSWORD = 'TestPilot2024!';

// Sample data
const sampleUsers = [
  { id: 'user1', name: 'Ana García', email: 'ana.garcia@example.com' },
  { id: 'user2', name: 'Carlos López', email: 'carlos.lopez@example.com' },
  { id: 'user3', name: 'María Rodríguez', email: 'maria.rodriguez@example.com' },
  { id: 'user4', name: 'Juan Martínez', email: 'juan.martinez@example.com' },
  { id: 'user5', name: 'Laura Sánchez', email: 'laura.sanchez@example.com' },
  { id: 'user6', name: 'Pedro Gómez', email: 'pedro.gomez@example.com' },
  { id: 'user7', name: 'Isabel Fernández', email: 'isabel.fernandez@example.com' },
  { id: 'user8', name: 'Diego Torres', email: 'diego.torres@example.com' },
  { id: 'user9', name: 'Carmen Ruiz', email: 'carmen.ruiz@example.com' },
  { id: 'user10', name: 'Roberto Díaz', email: 'roberto.diaz@example.com' }
];

/**
 * Create campaigns
 */
async function createCampaigns() {
  console.log('📊 Creating campaigns...');
  
  const campaigns = [
    {
      name: 'Q1 2025 Performance Review',
      description: 'Quarterly 360° performance evaluation for all team members',
      type: CampaignType.EVALUATION_360,
      status: CampaignStatus.ACTIVE,
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-01-31').toISOString(),
      metrics: {
        totalAssignments: 45,
        completedAssignments: 28,
        pendingAssignments: 12,
        failedAssignments: 5,
        responseRate: 62,
        averageScore: 4.2
      }
    },
    {
      name: 'Leadership Assessment 2025',
      description: 'Annual leadership competency assessment',
      type: CampaignType.MANAGER_REVIEW,
      status: CampaignStatus.ACTIVE,
      startDate: new Date('2025-01-15').toISOString(),
      endDate: new Date('2025-02-15').toISOString(),
      metrics: {
        totalAssignments: 20,
        completedAssignments: 8,
        pendingAssignments: 10,
        failedAssignments: 2,
        responseRate: 40,
        averageScore: 3.8
      }
    },
    {
      name: 'Team Collaboration Feedback',
      description: 'Peer review for team collaboration and communication',
      type: CampaignType.PEER_REVIEW,
      status: CampaignStatus.PAUSED,
      startDate: new Date('2024-12-01').toISOString(),
      endDate: new Date('2025-01-15').toISOString(),
      metrics: {
        totalAssignments: 30,
        completedAssignments: 25,
        pendingAssignments: 3,
        failedAssignments: 2,
        responseRate: 83,
        averageScore: 4.5
      }
    },
    {
      name: 'Self-Assessment Q4 2024',
      description: 'Quarterly self-evaluation for personal development',
      type: CampaignType.SELF_EVALUATION,
      status: CampaignStatus.COMPLETED,
      startDate: new Date('2024-10-01').toISOString(),
      endDate: new Date('2024-10-31').toISOString(),
      metrics: {
        totalAssignments: 50,
        completedAssignments: 48,
        pendingAssignments: 0,
        failedAssignments: 2,
        responseRate: 96,
        averageScore: 4.1
      }
    },
    {
      name: 'New Employee Onboarding Feedback',
      description: 'Evaluation for new hires after 90 days',
      type: CampaignType.EVALUATION_360,
      status: CampaignStatus.DRAFT,
      startDate: new Date('2025-02-01').toISOString(),
      endDate: new Date('2025-02-28').toISOString(),
      metrics: {
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        failedAssignments: 0,
        responseRate: 0,
        averageScore: 0
      }
    }
  ];

  const batch = writeBatch(db);
  const campaignIds = [];

  for (const campaignData of campaigns) {
    const campaign = new Campaign({
      ...campaignData,
      orgId: ORG_ID,
      createdBy: 'admin',
      tags: ['phase2', 'test']
    });

    const docRef = doc(collection(db, 'organizations', ORG_ID, 'campaigns'));
    batch.set(docRef, campaign.toFirestore());
    campaignIds.push(docRef.id);
    console.log(`  ✓ Campaign: ${campaign.name}`);
  }

  await batch.commit();
  console.log(`✅ Created ${campaigns.length} campaigns`);
  return campaignIds;
}

/**
 * Create assignments
 */
async function createAssignments(campaignIds) {
  console.log('📝 Creating assignments...');
  
  const batch = writeBatch(db);
  let assignmentCount = 0;

  // Create assignments for first two campaigns
  for (let i = 0; i < 2; i++) {
    const campaignId = campaignIds[i];
    
    // Create 20-30 assignments per campaign
    const numAssignments = 20 + Math.floor(Math.random() * 10);
    
    for (let j = 0; j < numAssignments; j++) {
      const evaluator = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const evaluatee = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      
      // Random status distribution
      const statusRandom = Math.random();
      let status;
      if (statusRandom < 0.3) status = AssignmentStatus.COMPLETED;
      else if (statusRandom < 0.6) status = AssignmentStatus.PENDING;
      else if (statusRandom < 0.8) status = AssignmentStatus.IN_PROGRESS;
      else if (statusRandom < 0.9) status = AssignmentStatus.EXPIRED;
      else status = AssignmentStatus.FAILED;

      // Random email status (10% will have delivery issues)
      const emailStatus = Math.random() < 0.1 ? 'failed' : 'delivered';

      const assignment = new Assignment({
        campaignId,
        orgId: ORG_ID,
        evaluatorId: evaluator.id,
        evaluatorEmail: evaluator.email,
        evaluatorName: evaluator.name,
        evaluateeId: evaluatee.id,
        evaluateeName: evaluatee.name,
        role: [AssignmentRole.PEER, AssignmentRole.MANAGER, AssignmentRole.SELF][Math.floor(Math.random() * 3)],
        status,
        emailStatus,
        progress: status === AssignmentStatus.COMPLETED ? 100 : Math.floor(Math.random() * 80),
        score: status === AssignmentStatus.COMPLETED ? (3 + Math.random() * 2) : null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reminderCount: Math.floor(Math.random() * 3)
      });

      assignment.generateToken();

      const docRef = doc(collection(db, 'organizations', ORG_ID, 'assignments'));
      batch.set(docRef, assignment.toFirestore());
      assignmentCount++;
    }
  }

  await batch.commit();
  console.log(`✅ Created ${assignmentCount} assignments`);
}

/**
 * Create bulk actions
 */
async function createBulkActions() {
  console.log('🔄 Creating bulk actions...');
  
  const bulkActions = [
    {
      type: BulkActionType.RESEND_INVITATION,
      status: BulkActionStatus.COMPLETED,
      description: 'Resend invitations to pending evaluators',
      totalItems: 15,
      processedItems: 15,
      successCount: 12,
      failureCount: 3,
      userName: 'Admin User'
    },
    {
      type: BulkActionType.SEND_REMINDER,
      status: BulkActionStatus.IN_PROGRESS,
      description: 'Send reminder emails to incomplete assignments',
      totalItems: 25,
      processedItems: 10,
      successCount: 9,
      failureCount: 1,
      progress: 40,
      userName: 'Admin User'
    },
    {
      type: BulkActionType.EXTEND_DEADLINE,
      status: BulkActionStatus.PENDING,
      description: 'Extend deadline by 7 days for selected assignments',
      totalItems: 8,
      processedItems: 0,
      successCount: 0,
      failureCount: 0,
      options: { days: 7 },
      userName: 'Admin User'
    }
  ];

  const batch = writeBatch(db);

  for (const actionData of bulkActions) {
    const bulkAction = new BulkAction({
      ...actionData,
      orgId: ORG_ID,
      userId: 'admin',
      itemIds: Array(actionData.totalItems).fill(0).map((_, i) => `item_${i}`)
    });

    const docRef = doc(collection(db, 'organizations', ORG_ID, 'bulkActions'));
    batch.set(docRef, bulkAction.toFirestore());
    console.log(`  ✓ Bulk action: ${bulkAction.description}`);
  }

  await batch.commit();
  console.log(`✅ Created ${bulkActions.length} bulk actions`);
}

/**
 * Create alerts and DLQ entries
 */
async function createAlerts() {
  console.log('🚨 Creating alerts and DLQ entries...');
  
  const alerts = [
    Alert.createDLQAlert(
      ORG_ID,
      'send_email',
      { to: 'invalid@example.com', subject: 'Test' },
      new Error('Invalid email address')
    ),
    new Alert({
      orgId: ORG_ID,
      type: AlertType.RATE_LIMIT,
      severity: AlertSeverity.HIGH,
      status: AlertStatus.NEW,
      title: 'Rate limit approaching',
      message: 'Email sending rate limit at 90% capacity',
      rateLimit: {
        limit: 100,
        current: 90,
        resetAt: new Date(Date.now() + 3600000).toISOString(),
        resource: 'email_api'
      }
    }),
    new Alert({
      orgId: ORG_ID,
      type: AlertType.PERFORMANCE,
      severity: AlertSeverity.MEDIUM,
      status: AlertStatus.ACKNOWLEDGED,
      title: 'Slow page load detected',
      message: 'Dashboard load time exceeds threshold',
      performance: {
        metric: 'page_load',
        value: 3500,
        threshold: 2000,
        duration: 3500
      }
    }),
    new Alert({
      orgId: ORG_ID,
      type: AlertType.EMAIL_FAILURE,
      severity: AlertSeverity.HIGH,
      status: AlertStatus.NEW,
      title: 'Multiple email failures',
      message: '5 emails failed to deliver in the last hour',
      occurrenceCount: 5
    }),
    new Alert({
      orgId: ORG_ID,
      type: AlertType.SYSTEM_ERROR,
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.IN_PROGRESS,
      title: 'Database connection error',
      message: 'Failed to connect to Firestore',
      details: {
        errorCode: 'UNAVAILABLE',
        retryCount: 3
      }
    })
  ];

  const batch = writeBatch(db);

  // Create alerts
  for (const alert of alerts) {
    const docRef = doc(collection(db, 'organizations', ORG_ID, 'alerts'));
    batch.set(docRef, alert.toFirestore());
    console.log(`  ✓ Alert: ${alert.title}`);
  }

  // Create some DLQ entries
  const dlqEntries = [
    {
      action: 'send_invitation',
      payload: { email: 'bounce@example.com', campaignId: 'campaign1' },
      error: { message: 'Email bounced', code: 'BOUNCE' },
      retryCount: 1,
      maxRetries: 3,
      canRetry: true,
      status: 'pending'
    },
    {
      action: 'process_evaluation',
      payload: { evaluationId: 'eval1', userId: 'user1' },
      error: { message: 'Timeout processing evaluation', code: 'TIMEOUT' },
      retryCount: 3,
      maxRetries: 3,
      canRetry: false,
      status: 'failed'
    },
    {
      action: 'generate_report',
      payload: { campaignId: 'campaign2', format: 'pdf' },
      error: { message: 'PDF generation failed', code: 'PDF_ERROR' },
      retryCount: 0,
      maxRetries: 3,
      canRetry: true,
      status: 'pending'
    }
  ];

  for (const entry of dlqEntries) {
    const docRef = doc(collection(db, 'organizations', ORG_ID, 'dlq'));
    batch.set(docRef, {
      ...entry,
      orgId: ORG_ID,
      createdAt: new Date().toISOString(),
      lastRetryAt: null,
      nextRetryAt: new Date(Date.now() + 60000).toISOString()
    });
    console.log(`  ✓ DLQ entry: ${entry.action}`);
  }

  await batch.commit();
  console.log(`✅ Created ${alerts.length} alerts and ${dlqEntries.length} DLQ entries`);
}

/**
 * Main seed function
 */
async function seedPhase2Data() {
  try {
    console.log('🚀 Starting Phase 2 data seeding...\n');

    // Authenticate
    console.log('🔐 Authenticating...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log(`✅ Authenticated as ${userCredential.user.email}\n`);

    // Create data
    const campaignIds = await createCampaigns();
    await createAssignments(campaignIds);
    await createBulkActions();
    await createAlerts();

    console.log('\n✨ Phase 2 data seeding complete!');
    console.log('📌 Organization:', ORG_ID);
    console.log('📊 You can now test the Phase 2 features with this data.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed script
seedPhase2Data();
