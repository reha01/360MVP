/**
 * Fixtures para UAT - Email Sandbox
 * 
 * Configuración para simular bounces y complaints
 * Resend/SendGrid en modo sandbox
 */

export const emailSandboxConfig = {
  provider: 'resend',
  mode: 'sandbox',
  apiKey: process.env.RESEND_API_KEY || 'test-key',
  baseUrl: 'https://api.resend.com',
  
  // Configuración de simulación
  simulation: {
    enabled: true,
    bounceRate: 0.05, // 5% de bounces
    complaintRate: 0.01, // 1% de complaints
    delayMs: 1000 // 1 segundo de delay simulado
  },
  
  // Emails que siempre fallan (para testing)
  alwaysFailEmails: [
    'bounce@example.com',
    'invalid@example.com',
    'blocked@example.com'
  ],
  
  // Emails que siempre generan complaints
  alwaysComplaintEmails: [
    'complaint@example.com',
    'spam@example.com'
  ],
  
  // Templates de email
  templates: {
    invitation: {
      subject: 'Invitación a Evaluación 360°',
      html: `
        <html>
          <body>
            <h1>Invitación a Evaluación 360°</h1>
            <p>Has sido invitado a participar en una evaluación 360°.</p>
            <a href="{{evaluationUrl}}">Acceder a la Evaluación</a>
            <p>Token: {{token}}</p>
          </body>
        </html>
      `,
      text: `
        Invitación a Evaluación 360°
        
        Has sido invitado a participar en una evaluación 360°.
        
        Acceder a la Evaluación: {{evaluationUrl}}
        Token: {{token}}
      `
    },
    
    reminder: {
      subject: 'Recordatorio: Evaluación 360° Pendiente',
      html: `
        <html>
          <body>
            <h1>Recordatorio: Evaluación 360° Pendiente</h1>
            <p>Tu evaluación 360° está pendiente de completar.</p>
            <a href="{{evaluationUrl}}">Completar Evaluación</a>
            <p>Token: {{token}}</p>
          </body>
        </html>
      `,
      text: `
        Recordatorio: Evaluación 360° Pendiente
        
        Tu evaluación 360° está pendiente de completar.
        
        Completar Evaluación: {{evaluationUrl}}
        Token: {{token}}
      `
    }
  }
};

export const emailTestScenarios = {
  // Escenario 1: Envío exitoso
  success: {
    email: 'success@example.com',
    expectedResult: 'delivered',
    responseTime: 500
  },
  
  // Escenario 2: Bounce por email inválido
  bounce: {
    email: 'bounce@example.com',
    expectedResult: 'bounced',
    bounceReason: 'Invalid email address',
    responseTime: 200
  },
  
  // Escenario 3: Complaint por spam
  complaint: {
    email: 'complaint@example.com',
    expectedResult: 'complained',
    complaintReason: 'Spam complaint',
    responseTime: 300
  },
  
  // Escenario 4: Rate limit
  rateLimit: {
    email: 'ratelimit@example.com',
    expectedResult: 'rate_limited',
    rateLimitReason: 'Too many requests',
    responseTime: 1000
  },
  
  // Escenario 5: Timeout
  timeout: {
    email: 'timeout@example.com',
    expectedResult: 'timeout',
    timeoutReason: 'Request timeout',
    responseTime: 30000
  }
};

export const emailMetrics = {
  // Métricas de ejemplo para UAT
  daily: {
    sent: 1000,
    delivered: 950,
    bounced: 25,
    complained: 10,
    opened: 800,
    clicked: 200
  },
  
  // Métricas por organización
  byOrg: {
    'pilot-org-santiago': {
      sent: 500,
      delivered: 475,
      bounced: 15,
      complained: 5
    },
    'pilot-org-mexico': {
      sent: 500,
      delivered: 475,
      bounced: 10,
      complained: 5
    }
  },
  
  // Métricas por tipo de email
  byType: {
    invitation: {
      sent: 600,
      delivered: 570,
      bounced: 20,
      complained: 8
    },
    reminder: {
      sent: 400,
      delivered: 380,
      bounced: 5,
      complained: 2
    }
  }
};

export const emailWebhooks = {
  // Webhooks simulados para testing
  bounce: {
    type: 'email.bounced',
    data: {
      email: 'bounce@example.com',
      reason: 'Invalid email address',
      timestamp: new Date().toISOString(),
      messageId: 'msg_' + Math.random().toString(36).substr(2, 9)
    }
  },
  
  complaint: {
    type: 'email.complained',
    data: {
      email: 'complaint@example.com',
      reason: 'Spam complaint',
      timestamp: new Date().toISOString(),
      messageId: 'msg_' + Math.random().toString(36).substr(2, 9)
    }
  },
  
  delivered: {
    type: 'email.delivered',
    data: {
      email: 'success@example.com',
      timestamp: new Date().toISOString(),
      messageId: 'msg_' + Math.random().toString(36).substr(2, 9)
    }
  }
};

export const emailRateLimits = {
  // Límites por plan
  plans: {
    free: {
      emailsPerDay: 100,
      emailsPerHour: 10,
      emailsPerMinute: 2
    },
    pro: {
      emailsPerDay: 1000,
      emailsPerHour: 100,
      emailsPerMinute: 20
    },
    enterprise: {
      emailsPerDay: 10000,
      emailsPerHour: 1000,
      emailsPerMinute: 200
    }
  },
  
  // Límites por organización
  byOrg: {
    'pilot-org-santiago': {
      plan: 'enterprise',
      emailsPerDay: 10000,
      emailsPerHour: 1000,
      emailsPerMinute: 200,
      currentUsage: {
        today: 500,
        thisHour: 50,
        thisMinute: 10
      }
    },
    'pilot-org-mexico': {
      plan: 'enterprise',
      emailsPerDay: 10000,
      emailsPerHour: 1000,
      emailsPerMinute: 200,
      currentUsage: {
        today: 300,
        thisHour: 30,
        thisMinute: 5
      }
    }
  }
};

export const emailDLQ = {
  // Dead Letter Queue para emails fallidos
  items: [
    {
      id: 'dlq-1',
      email: 'bounce@example.com',
      type: 'invitation',
      campaignId: 'campaign-santiago-1',
      attempts: 3,
      lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      error: 'Invalid email address',
      status: 'failed'
    },
    {
      id: 'dlq-2',
      email: 'timeout@example.com',
      type: 'reminder',
      campaignId: 'campaign-santiago-2',
      attempts: 2,
      lastAttempt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      error: 'Request timeout',
      status: 'retrying'
    }
  ],
  
  // Configuración de DLQ
  config: {
    maxRetries: 3,
    retryDelay: 300000, // 5 minutos
    maxAge: 86400000, // 24 horas
    batchSize: 10
  }
};

export default {
  emailSandboxConfig,
  emailTestScenarios,
  emailMetrics,
  emailWebhooks,
  emailRateLimits,
  emailDLQ
};
