# Configuración Manual de Firestore para Smoke Tests

**UID del usuario**: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

---

## 📋 Paso 1: Vincular Usuario a Organización

### Ir a Firestore Console
URL: https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore/data

### Crear/Actualizar Documentos

#### 1. Verificar Organización Existe
```
Colección: organizations
Documento: pilot-org-santiago
```

Si NO existe, crear con:
```json
{
  "name": "Pilot Org Santiago",
  "timezone": "America/Santiago",
  "plan": "starter",
  "active": true,
  "createdAt": [Timestamp: now],
  "featureFlags": {
    "FEATURE_BULK_ACTIONS": true,
    "FEATURE_DASHBOARD_360": true,
    "FEATURE_CAMPAIGN_COMPARISON": true,
    "FEATURE_ORG_POLICIES": true,
    "FEATURE_OPERATIONAL_ALERTS": true
  }
}
```

#### 2. Agregar Usuario como Miembro
```
Ruta: organizations/pilot-org-santiago/members/S1SE2ynl3dQ9ohjMz5hj5h2sJx02
```

Crear documento con este contenido:
```json
{
  "email": "admin@pilot-santiago.com",
  "role": "admin",
  "active": true,
  "joinedAt": [Timestamp: now],
  "displayName": "Admin Santiago"
}
```

**IMPORTANTE**: El ID del documento DEBE ser el UID: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

---

## 📋 Paso 2: Crear Datos de Prueba

### A. Test Definition

```
Ruta: organizations/pilot-org-santiago/testDefinitions/test-360-leadership-v1
```

```json
{
  "title": "Evaluación de Liderazgo 360°",
  "description": "Evaluación completa de competencias de liderazgo",
  "version": 1,
  "status": "published",
  "testType": "360",
  "categories": [
    {
      "id": "cat-1",
      "name": "Liderazgo Estratégico",
      "weight": 0.3,
      "questions": [
        {
          "id": "q1",
          "text": "¿Comunica la visión claramente?",
          "type": "likert-5",
          "weight": 1
        },
        {
          "id": "q2",
          "text": "¿Toma decisiones estratégicas efectivas?",
          "type": "likert-5",
          "weight": 1
        }
      ]
    },
    {
      "id": "cat-2",
      "name": "Gestión de Equipos",
      "weight": 0.4,
      "questions": [
        {
          "id": "q3",
          "text": "¿Motiva al equipo efectivamente?",
          "type": "likert-5",
          "weight": 1
        },
        {
          "id": "q4",
          "text": "¿Delega apropiadamente?",
          "type": "likert-5",
          "weight": 1
        }
      ]
    },
    {
      "id": "cat-3",
      "name": "Comunicación",
      "weight": 0.3,
      "questions": [
        {
          "id": "q5",
          "text": "¿Escucha activamente?",
          "type": "likert-5",
          "weight": 1
        },
        {
          "id": "q6",
          "text": "¿Proporciona feedback constructivo?",
          "type": "likert-5",
          "weight": 1
        }
      ]
    }
  ],
  "createdAt": [Timestamp: now],
  "createdBy": "system",
  "orgId": "pilot-org-santiago"
}
```

### B. Campaña

```
Ruta: organizations/pilot-org-santiago/campaigns/campaign-smoke-test-1
```

```json
{
  "name": "Smoke Test Campaign",
  "description": "Campaña de prueba para smoke tests",
  "status": "active",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "startDate": [Timestamp: now],
  "endDate": [Timestamp: now + 30 days],
  "timezone": "America/Santiago",
  "privacySettings": {
    "minResponsesForAnonymity": 3,
    "showIndividualResponses": false
  },
  "createdAt": [Timestamp: now],
  "createdBy": "system",
  "orgId": "pilot-org-santiago"
}
```

### C. Sesiones 360 (crear 3)

```
Ruta: organizations/pilot-org-santiago/evaluation360Sessions/session-evaluatee-1
```

```json
{
  "campaignId": "campaign-smoke-test-1",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "evaluateeId": "user-evaluatee-1",
  "evaluateeName": "Evaluado 1",
  "evaluateeEmail": "evaluatee1@pilot-santiago.com",
  "status": "in_progress",
  "startDate": [Timestamp: now],
  "endDate": [Timestamp: now + 14 days],
  "createdAt": [Timestamp: now],
  "orgId": "pilot-org-santiago"
}
```

**Repetir para**: `session-evaluatee-2`, `session-evaluatee-3` (cambiar emails)

### D. Asignaciones (crear 12)

**Asignación 1-9 (emails válidos)**:
```
Ruta: organizations/pilot-org-santiago/evaluatorAssignments/assignment-1
```

```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-1",
  "evaluatorEmail": "evaluator1@pilot-santiago.com",
  "evaluatorType": "peer",
  "evaluatorName": "Evaluador 1",
  "status": "pending",
  "token": "random-token-1",
  "tokenHash": "hash-1",
  "tokenUsed": false,
  "tokenExpiry": [Timestamp: now + 30 days],
  "deadline": [Timestamp: now + 14 days],
  "invitationCount": 1,
  "lastInvitationSent": [Timestamp: now],
  "createdAt": [Timestamp: now],
  "orgId": "pilot-org-santiago"
}
```

**Repetir 9 veces** cambiando:
- ID: `assignment-1` → `assignment-9`
- Email: `evaluator1@...` → `evaluator9@...`
- Alternar `evaluatorType`: peer, manager, direct, self
- Alternar `status`: pending (mayoría), completed (2-3)

**Asignación 10 (EMAIL INVÁLIDO - IMPORTANTE)**:
```
Ruta: organizations/pilot-org-santiago/evaluatorAssignments/assignment-10
```

```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-2",
  "evaluatorEmail": "invalid@test.local",
  "evaluatorType": "peer",
  "evaluatorName": "Email Inválido",
  "status": "pending",
  "token": "random-token-10",
  "tokenHash": "hash-10",
  "tokenUsed": false,
  "tokenExpiry": [Timestamp: now + 30 days],
  "deadline": [Timestamp: now + 14 days],
  "invitationCount": 1,
  "lastInvitationSent": [Timestamp: now],
  "createdAt": [Timestamp: now],
  "orgId": "pilot-org-santiago"
}
```

**Asignaciones 11-12**:
Repetir como 1-9 con IDs diferentes.

---

## ✅ Checklist de Verificación

Después de crear todo:

- [ ] Organización `pilot-org-santiago` existe con `featureFlags`
- [ ] Usuario `S1SE2ynl3dQ9ohjMz5hj5h2sJx02` en `members/` con rol `admin`
- [ ] Test Definition `test-360-leadership-v1` creado
- [ ] Campaña `campaign-smoke-test-1` creada con status `active`
- [ ] 3 sesiones 360 creadas
- [ ] 12 asignaciones creadas (1 con email `invalid@test.local`)

---

## 🚀 Siguiente Paso

Una vez completado, ejecutar:

```bash
npm run smoke:staging
```

