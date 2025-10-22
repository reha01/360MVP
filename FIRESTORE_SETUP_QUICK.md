# 🚀 Setup Rápido de Firestore para Smoke Tests

**UID del usuario**: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

---

## 📋 Pasos a Seguir (15-20 minutos)

### 🔗 URL Base de Firestore
https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore/data

---

## 1️⃣ ORGANIZACIÓN (organizations/pilot-org-santiago)

**Ruta**: `organizations` → crear documento `pilot-org-santiago`

```json
{
  "name": "Pilot Org Santiago",
  "timezone": "America/Santiago",
  "plan": "starter",
  "active": true,
  "featureFlags": {
    "FEATURE_BULK_ACTIONS": true,
    "FEATURE_DASHBOARD_360": true,
    "FEATURE_CAMPAIGN_COMPARISON": true,
    "FEATURE_ORG_POLICIES": true,
    "FEATURE_OPERATIONAL_ALERTS": true
  }
}
```

✅ Timestamp automático: **NO** necesitas agregar `createdAt`

---

## 2️⃣ MIEMBRO (organizations/pilot-org-santiago/members/{UID})

**Ruta**: `organizations/pilot-org-santiago` → abrir documento → pestaña "Subcollections"
→ crear subcolección `members` → crear documento `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

```json
{
  "email": "admin@pilot-santiago.com",
  "role": "admin",
  "active": true,
  "displayName": "Admin Santiago"
}
```

✅ **IMPORTANTE**: El ID del documento debe ser: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

---

## 3️⃣ TEST DEFINITION (testDefinitions/test-360-leadership-v1)

**Ruta**: `organizations/pilot-org-santiago` → Subcollections → `testDefinitions` → crear documento `test-360-leadership-v1`

```json
{
  "title": "Evaluación de Liderazgo 360°",
  "description": "Evaluación completa de competencias de liderazgo",
  "version": 1,
  "status": "published",
  "testType": "360",
  "orgId": "pilot-org-santiago",
  "createdBy": "system",
  "categories": [
    {
      "id": "cat-1",
      "name": "Liderazgo Estratégico",
      "weight": 0.3,
      "questions": [
        {"id": "q1", "text": "¿Comunica la visión claramente?", "type": "likert-5", "weight": 1},
        {"id": "q2", "text": "¿Toma decisiones estratégicas efectivas?", "type": "likert-5", "weight": 1}
      ]
    },
    {
      "id": "cat-2",
      "name": "Gestión de Equipos",
      "weight": 0.4,
      "questions": [
        {"id": "q3", "text": "¿Motiva al equipo efectivamente?", "type": "likert-5", "weight": 1},
        {"id": "q4", "text": "¿Delega apropiadamente?", "type": "likert-5", "weight": 1}
      ]
    },
    {
      "id": "cat-3",
      "name": "Comunicación",
      "weight": 0.3,
      "questions": [
        {"id": "q5", "text": "¿Escucha activamente?", "type": "likert-5", "weight": 1},
        {"id": "q6", "text": "¿Proporciona feedback constructivo?", "type": "likert-5", "weight": 1}
      ]
    }
  ]
}
```

---

## 4️⃣ CAMPAÑA (campaigns/campaign-smoke-test-1)

**Ruta**: `organizations/pilot-org-santiago` → Subcollections → `campaigns` → crear documento `campaign-smoke-test-1`

```json
{
  "name": "Smoke Test Campaign",
  "description": "Campaña de prueba para smoke tests",
  "status": "active",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "timezone": "America/Santiago",
  "orgId": "pilot-org-santiago",
  "createdBy": "system",
  "privacySettings": {
    "minResponsesForAnonymity": 3,
    "showIndividualResponses": false
  }
}
```

---

## 5️⃣ SESIONES 360 (crear 3 documentos)

**Ruta**: `organizations/pilot-org-santiago` → Subcollections → `evaluation360Sessions`

### Sesión 1: `session-evaluatee-1`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "evaluateeId": "user-evaluatee-1",
  "evaluateeName": "Evaluado 1",
  "evaluateeEmail": "evaluatee1@pilot-santiago.com",
  "status": "in_progress",
  "orgId": "pilot-org-santiago"
}
```

### Sesión 2: `session-evaluatee-2`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "evaluateeId": "user-evaluatee-2",
  "evaluateeName": "Evaluado 2",
  "evaluateeEmail": "evaluatee2@pilot-santiago.com",
  "status": "in_progress",
  "orgId": "pilot-org-santiago"
}
```

### Sesión 3: `session-evaluatee-3`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "testId": "test-360-leadership-v1",
  "testVersion": 1,
  "evaluateeId": "user-evaluatee-3",
  "evaluateeName": "Evaluado 3",
  "evaluateeEmail": "evaluatee3@pilot-santiago.com",
  "status": "in_progress",
  "orgId": "pilot-org-santiago"
}
```

---

## 6️⃣ ASIGNACIONES (crear 12 documentos)

**Ruta**: `organizations/pilot-org-santiago` → Subcollections → `evaluatorAssignments`

### ⚡ TRUCO RÁPIDO:
Crea el primero manualmente, luego **duplica** y cambia solo: ID, email, nombre, número

### Assignment 1-7 (PENDING): `assignment-1` hasta `assignment-7`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-1",
  "evaluatorEmail": "evaluator1@pilot-santiago.com",
  "evaluatorType": "peer",
  "evaluatorName": "Evaluador 1",
  "status": "pending",
  "token": "token-1",
  "tokenHash": "hash-1",
  "tokenUsed": false,
  "invitationCount": 1,
  "orgId": "pilot-org-santiago"
}
```

**Cambiar en cada uno**:
- `assignment-2`: email=`evaluator2@...`, name=`Evaluador 2`, session=`session-evaluatee-2`, type=`manager`
- `assignment-3`: email=`evaluator3@...`, name=`Evaluador 3`, session=`session-evaluatee-3`, type=`direct`
- `assignment-4`: email=`evaluator4@...`, name=`Evaluador 4`, session=`session-evaluatee-1`, type=`self`
- `assignment-5`: email=`evaluator5@...`, name=`Evaluador 5`, session=`session-evaluatee-2`, type=`peer`
- `assignment-6`: email=`evaluator6@...`, name=`Evaluador 6`, session=`session-evaluatee-3`, type=`manager`
- `assignment-7`: email=`evaluator7@...`, name=`Evaluador 7`, session=`session-evaluatee-1`, type=`direct`

### Assignment 8-9 (COMPLETED): `assignment-8` hasta `assignment-9`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-2",
  "evaluatorEmail": "evaluator8@pilot-santiago.com",
  "evaluatorType": "self",
  "evaluatorName": "Evaluador 8",
  "status": "completed",
  "token": "token-8",
  "tokenHash": "hash-8",
  "tokenUsed": true,
  "invitationCount": 1,
  "orgId": "pilot-org-santiago"
}
```

**Cambiar**:
- `assignment-9`: email=`evaluator9@...`, name=`Evaluador 9`, session=`session-evaluatee-3`, type=`peer`

### ⚠️ Assignment 10 (EMAIL INVÁLIDO): `assignment-10`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-2",
  "evaluatorEmail": "invalid@test.local",
  "evaluatorType": "peer",
  "evaluatorName": "Email Inválido (DLQ Test)",
  "status": "pending",
  "token": "token-invalid",
  "tokenHash": "hash-invalid",
  "tokenUsed": false,
  "invitationCount": 1,
  "orgId": "pilot-org-santiago"
}
```

### Assignment 11-12: `assignment-11`, `assignment-12`
```json
{
  "campaignId": "campaign-smoke-test-1",
  "session360Id": "session-evaluatee-3",
  "evaluatorEmail": "evaluator11@pilot-santiago.com",
  "evaluatorType": "peer",
  "evaluatorName": "Evaluador 11",
  "status": "pending",
  "token": "token-11",
  "tokenHash": "hash-11",
  "tokenUsed": false,
  "invitationCount": 1,
  "orgId": "pilot-org-santiago"
}
```

**Cambiar en 12**: email=`evaluator12@...`, name=`Evaluador 12`, type=`manager`, token=`token-12`, hash=`hash-12`

---

## ✅ Checklist Final

- [ ] 1 organización `pilot-org-santiago` con featureFlags
- [ ] 1 miembro con UID `S1SE2ynl3dQ9ohjMz5hj5h2sJx02` y role `admin`
- [ ] 1 test definition `test-360-leadership-v1`
- [ ] 1 campaña `campaign-smoke-test-1` con status `active`
- [ ] 3 sesiones 360 (`session-evaluatee-1`, `-2`, `-3`)
- [ ] 12 asignaciones (7 pending, 2 completed, 1 con email inválido)

---

## 🎯 Siguiente Paso

Una vez completado todo:

```bash
npm run smoke:staging
```

**Tiempo estimado**: 15-20 minutos (copiando y pegando con cuidado)

