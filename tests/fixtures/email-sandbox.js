/**
 * Fixtures para UAT - Email Sandbox
 * 
 * Simulación de bounce/complaint para testing
 */

export const emailSandboxConfig = {
  provider: 'resend',
  mode: 'sandbox',
  testEmails: {
    valid: [
      'test-valid-1@example.com',
      'test-valid-2@example.com',
      'test-valid-3@example.com'
    ],
    bounce: [
      'test-bounce-1@example.com',
      'test-bounce-2@example.com'
    ],
    complaint: [
      'test-complaint-1@example.com',
      'test-complaint-2@example.com'
    ],
    invalid: [
      'test-invalid-1@example.com',
      'test-invalid-2@example.com'
    ]
  },
  
  // Simulación de eventos de email
  emailEvents: [
    {
      id: 'email-event-1',
      type: 'delivered',
      email: 'test-valid-1@example.com',
      timestamp: new Date().toISOString(),
      campaignId: 'campaign-santiago-1',
      assignmentId: 'assignment-1'
    },
    {
      id: 'email-event-2',
      type: 'bounced',
      email: 'test-bounce-1@example.com',
      timestamp: new Date().toISOString(),
      campaignId: 'campaign-santiago-1',
      assignmentId: 'assignment-2',
      bounceType: 'hard',
      bounceReason: 'Invalid email address'
    },
    {
      id: 'email-event-3',
      type: 'complained',
      email: 'test-complaint-1@example.com',
      timestamp: new Date().toISOString(),
      campaignId: 'campaign-santiago-1',
      assignmentId: 'assignment-3',
      complaintReason: 'Spam'
    }
  ],
  
  // Configuración de rate limits por plan
  rateLimits: {
    free: {
      emailsPerDay: 100,
      campaignsActive: 1,
      exportsPerDay: 5
    },
    pro: {
      emailsPerDay: 1000,
      campaignsActive: 5,
      exportsPerDay: 50
    },
    enterprise: {
      emailsPerDay: 10000,
      campaignsActive: 50,
      exportsPerDay: 500
    }
  }
};

export const dlqSimulation = {
  // Simulación de trabajos en Dead Letter Queue
  failedJobs: [
    {
      id: 'job-failed-1',
      type: 'send-invitation',
      payload: {
        assignmentId: 'assignment-1',
        email: 'test-bounce-1@example.com',
        campaignId: 'campaign-santiago-1'
      },
      attempts: 3,
      maxAttempts: 3,
      lastError: 'Invalid email address',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 horas atrás
      status: 'failed'
    },
    {
      id: 'job-failed-2',
      type: 'send-reminder',
      payload: {
        assignmentId: 'assignment-2',
        email: 'test-invalid-1@example.com',
        campaignId: 'campaign-santiago-1'
      },
      attempts: 2,
      maxAttempts: 3,
      lastError: 'Rate limit exceeded',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      status: 'retrying'
    }
  ],
  
  // Configuración de backoff
  backoffConfig: {
    initialDelay: 1000, // 1 segundo
    maxDelay: 300000,   // 5 minutos
    multiplier: 2,
    jitter: true
  }
};

export const quotaSimulation = {
  // Simulación de cuotas excedidas
  exceededQuotas: [
    {
      orgId: 'pilot-org-santiago',
      quotaType: 'emailsPerDay',
      current: 10000,
      limit: 10000,
      exceeded: true,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      orgId: 'pilot-org-mexico',
      quotaType: 'campaignsActive',
      current: 50,
      limit: 50,
      exceeded: true,
      resetAt: null
    }
  ]
};

export default {
  emailSandboxConfig,
  dlqSimulation,
  quotaSimulation
};
