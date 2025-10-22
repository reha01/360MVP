# Email Integration - PR#7

## Resumen

Este documento describe la implementación del sistema de emails transaccionales para el MVP 360°, incluyendo invitaciones, recordatorios, confirmaciones y tracking de entregabilidad.

## Arquitectura de Decisión

### Proveedor de Email: Resend
**Decisión:** Resend
**Justificación:**
- API simple y bien documentada
- Excelente developer experience
- Plan gratuito generoso (3,000 emails/mes)
- Templates HTML nativos
- Tracking básico incluido
- Configuración rápida para MVP

### Arquitectura de Envío: Cloud Functions
**Decisión:** Serverless (Cloud Functions) con endpoint seguro
**Justificación:**
- Seguridad: credenciales no expuestas al cliente
- Escalabilidad automática
- Integración nativa con Firestore
- Rate limiting y retry logic incorporados

### Programación de Recordatorios: Manual + Trigger
**Decisión:** Botón manual + trigger automático opcional
**Justificación:**
- MVP: control manual para flexibilidad
- Trigger automático para completar evaluación
- Futuro: Cloud Scheduler para recordatorios automáticos

## Estructura de Archivos

```
360MVP-functions/functions/src/email/
├── emailService.js          # Servicio principal de email
├── sendInvitations.js       # Cloud Function para invitaciones
├── sendReminders.js         # Cloud Function para recordatorios
├── sendThanks.js           # Cloud Function para confirmaciones
└── templates/
    ├── invite.html         # Template de invitación
    ├── reminder.html       # Template de recordatorio
    └── thanks.html         # Template de agradecimiento

src/services/
└── emailService.js         # Cliente frontend para email

src/pages/
├── FeatureAwareOrgProcesses.jsx  # UI de gestión de procesos
└── InvitePage.jsx               # Página pública de invitación
```

## Esquema de Base de Datos

### Colección `processes`
```javascript
{
  id: string,
  name: string,
  deadline: timestamp,
  tenantId: string,
  tenantName: string,
  supportEmail: string,
  status: 'draft' | 'active' | 'completed',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Colección `invitations`
```javascript
{
  id: string,
  processId: string,
  processOwnerId: string,
  toEmail: string,
  participantName: string,
  roleInProcess: string,
  token: string,
  status: 'pending' | 'completed' | 'expired',
  emailStatus: 'pending' | 'sent' | 'delivered' | 'failed',
  lastEmailSentAt: timestamp,
  lastReminderSentAt: timestamp,
  thanksEmailSent: boolean,
  createdAt: timestamp
}
```

### Colección `mailEvents`
```javascript
{
  id: string,
  invitationId: string,
  processId: string,
  processOwnerId: string,
  emailType: 'invite' | 'reminder' | 'thanks',
  toEmail: string,
  status: 'sent' | 'delivered' | 'failed',
  messageId: string,
  error: string | null,
  attempts: number,
  sentAt: timestamp,
  lastAttemptAt: timestamp
}
```

## Variables de Entorno

### Frontend (.env)
```bash
VITE_FEATURE_EMAIL=true
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_EMAIL_REPLY_TO=support@yourdomain.com
```

### Cloud Functions (Firebase Config)
```bash
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
APP_BASE_URL=https://yourdomain.com
```

## Configuración de Resend

### 1. Crear cuenta en Resend
1. Ir a https://resend.com
2. Registrarse con email
3. Verificar email

### 2. Obtener API Key
1. Dashboard → API Keys
2. Crear nueva key
3. Copiar key (formato: `re_xxxxxxxxx`)

### 3. Configurar dominio (opcional para staging)
1. Dashboard → Domains
2. Añadir dominio
3. Configurar DNS (SPF, DKIM, DMARC)

### 4. Configurar en Firebase
```bash
firebase functions:config:set resend.api_key="re_xxxxxxxxx"
firebase functions:config:set email.from="noreply@yourdomain.com"
firebase functions:config:set email.reply_to="support@yourdomain.com"
```

## Uso de la API

### Enviar Invitaciones
```javascript
import emailService from '../services/emailService';

const result = await emailService.sendInvitations(processId, invitationIds);
// { success: true, results: [...], totalProcessed: 5, successful: 4, failed: 1 }
```

### Enviar Recordatorios
```javascript
const result = await emailService.sendReminders(processId, 3); // 3 días antes
// { success: true, results: [...], totalProcessed: 3, successful: 3, failed: 0 }
```

### Enviar Agradecimiento
```javascript
const result = await emailService.sendThanks(invitationId, completionTime);
// { success: true, messageId: "msg_xxxxx", status: "sent" }
```

## Templates de Email

### Invitación
- **Subject:** "Invitación a Evaluación 360° - {processName}"
- **Variables:** participantName, processName, roleInProcess, deadline, inviteUrl, tenantName, supportEmail
- **CTA:** Botón "Comenzar Evaluación"

### Recordatorio
- **Subject:** "Recordatorio: Evaluación 360° - {processName} ({daysRemaining} días restantes)"
- **Variables:** participantName, processName, roleInProcess, deadline, daysRemaining, inviteUrl, tenantName, supportEmail
- **CTA:** Botón "Completar Evaluación Ahora"

### Agradecimiento
- **Subject:** "¡Gracias por completar la Evaluación 360° - {processName}"
- **Variables:** participantName, processName, roleInProcess, completionDate, timeSpent, dashboardUrl, tenantName, supportEmail
- **CTA:** Botón "Ver Dashboard"

## Seguridad

### Firestore Rules
```javascript
// Procesos: solo propietarios del tenant
match /processes/{processId} {
  allow read, write: if request.auth != null && 
    (resource.data.tenantId == request.auth.token.tenantId || 
     request.data.tenantId == request.auth.token.tenantId);
}

// Invitaciones: propietario del proceso o participante invitado
match /invitations/{invitationId} {
  allow read: if request.auth != null && 
    (resource.data.processOwnerId == request.auth.uid || 
     resource.data.toEmail == request.auth.token.email);
  allow write: if request.auth != null && 
    resource.data.processOwnerId == request.auth.uid;
}

// Eventos de email: solo propietarios del proceso
match /mailEvents/{eventId} {
  allow read: if request.auth != null && 
    resource.data.processOwnerId == request.auth.uid;
  allow write: if request.auth != null; // Solo Cloud Functions
}
```

### Rate Limiting
- Invitaciones: máximo 1 por hora por invitación
- Recordatorios: máximo 1 por día por invitación
- Agradecimientos: máximo 1 por invitación

## Testing

### Local (con mocks)
```bash
npm run dev
# Visitar /org-processes
# Usar botones de envío (usarán mocks)
```

### Staging (con Resend real)
```bash
# Configurar variables de entorno
firebase functions:config:set resend.api_key="re_xxxxxxxxx"

# Deploy functions
firebase deploy --only functions

# Visitar staging app
# Probar envío real de emails
```

### URLs de Prueba
- **Invitación:** `https://staging.app.com/invite/demo-token-123`
- **Dashboard:** `https://staging.app.com/org-processes`

## Monitoreo y Logs

### Cloud Functions Logs
```bash
firebase functions:log --only sendInvitations
firebase functions:log --only sendReminders
firebase functions:log --only sendThanks
```

### Firestore Queries
```javascript
// Ver eventos de email por proceso
db.collection('mailEvents')
  .where('processId', '==', 'proc-123')
  .orderBy('sentAt', 'desc')
  .get();

// Ver invitaciones pendientes
db.collection('invitations')
  .where('status', '==', 'pending')
  .where('emailStatus', '==', 'failed')
  .get();
```

## Limitaciones Actuales

1. **Templates estáticos:** HTML hardcodeado (futuro: CMS)
2. **Recordatorios manuales:** No hay scheduler automático
3. **Tracking básico:** Solo status, no open/click tracking
4. **Un solo proveedor:** Solo Resend (futuro: multi-provider)

## Roadmap Futuro

### PR#8 - Email Avanzado
- [ ] Cloud Scheduler para recordatorios automáticos
- [ ] Webhooks de Resend para tracking avanzado
- [ ] Templates dinámicos con CMS
- [ ] A/B testing de templates
- [ ] Métricas de engagement

### PR#9 - Multi-Provider
- [ ] Soporte para SendGrid
- [ ] Fallback automático entre proveedores
- [ ] Configuración por tenant

## Troubleshooting

### Error: "Invalid API key"
- Verificar que `RESEND_API_KEY` esté configurado correctamente
- Verificar que la key tenga permisos de envío

### Error: "Domain not verified"
- Para staging: usar `noreply@resend.dev` (dominio por defecto)
- Para producción: verificar dominio en Resend

### Error: "Rate limit exceeded"
- Resend: 10 emails/segundo por defecto
- Implementar backoff en Cloud Functions

### Emails no llegan
1. Verificar spam folder
2. Verificar logs de Cloud Functions
3. Verificar status en Resend dashboard
4. Verificar configuración de dominio

## Comandos Útiles

```bash
# Deploy solo email functions
firebase deploy --only functions:sendInvitations,functions:sendReminders,functions:sendThanks

# Ver configuración actual
firebase functions:config:get

# Logs en tiempo real
firebase functions:log --follow

# Test local con emuladores
npm run emulators:dev
```












