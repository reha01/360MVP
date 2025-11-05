# Manual de Configuración de Staging

## ⚠️ Limitación Actual

Los scripts automatizados de seeding requieren credenciales de Firebase Admin que no están configuradas en el entorno local.

## 📋 Alternativas para Crear Datos en Staging

### Opción 1: Firestore Console (Recomendado)

1. Abre [Firebase Console](https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore)
2. Navega a Firestore Database
3. Crea las siguientes estructuras:

#### A. Organización Piloto
```
organizations/pilot-org-santiago/
  - name: "Pilot Org Santiago"
  - displayName: "Organización Piloto Santiago"
  - ownerId: "<UID del usuario admin@pilot-santiago.com>"
  - timezone: "America/Santiago"
  - plan: "starter"
  - featureFlags:
      FEATURE_DASHBOARD_360: true
      FEATURE_BULK_ACTIONS: true
      FEATURE_CAMPAIGN_COMPARISON: true
      FEATURE_ORG_POLICIES: true
      FEATURE_OPERATIONAL_ALERTS: true
  - createdAt: <timestamp>
```

#### B. Usuario Admin Member
```
organizations/pilot-org-santiago/members/pilot-org-santiago:<UID>
  - userId: "<UID>"
  - email: "admin@pilot-santiago.com"
  - role: "owner"
  - joinedAt: <timestamp>
```

#### C. Test Definition
```
organizations/pilot-org-santiago/testDefinitions/test-leadership-360
  - orgId: "pilot-org-santiago"
  - name: "Evaluación 360° - Liderazgo"
  - type: "360"
  - status: "active"
  - categories: [...]
  - questions: [...]
```

#### D. Campaña
```
organizations/pilot-org-santiago/campaigns/campaign-q1-2025
  - orgId: "pilot-org-santiago"
  - name: "Q1 2025 - Liderazgo"
  - testDefinitionId: "test-leadership-360"
  - status: "active"
  - startDate: "2025-01-01T00:00:00Z"
  - endDate: "2025-03-31T23:59:59Z"
```

#### E. Sesiones 360
```
organizations/pilot-org-santiago/evaluation360Sessions/session-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - subjectName: "Juan Pérez"
  - subjectEmail: "juan.perez@pilot-santiago.com"
  - status: "active"
```

#### F. Asignaciones
```
organizations/pilot-org-santiago/evaluatorAssignments/assignment-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - session360Id: "session-001"
  - evaluatorEmail: "evaluator1@pilot-santiago.com"
  - evaluatorType: "peer"
  - status: "pending"
  - tokenHash: "<random-hash>"
```

### Opción 2: Usar la Aplicación Web

1. Accede a https://mvp-staging-3e1cd.web.app
2. Inicia sesión con `admin@pilot-santiago.com`
3. Navega a las secciones y crea datos manualmente:
   - Dashboard → Crear Test Definition
   - Campañas → Crear Campaña
   - Sesiones → Asignar Evaluadores

### Opción 3: Script con Service Account (Para DevOps)

Si tienes acceso a una service account key:

1. Descarga el JSON de service account desde Firebase Console
2. Guarda como `serviceAccountKey.json` en la raíz del proyecto
3. Ejecuta:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/create-staging-user.cjs
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

## 🎯 Datos Mínimos Requeridos para Smoke Tests

Para que los smoke tests pasen, necesitas:

- ✅ 1 organización: `pilot-org-santiago`
- ✅ 1 usuario owner: `admin@pilot-santiago.com`
- ✅ 1 campaña activa
- ✅ 3+ sesiones 360
- ✅ 12+ asignaciones (incluyendo 1 con email inválido)

## 🔍 Verificar Datos Existentes

Ejecuta este comando para verificar si ya existen datos:

```bash
firebase firestore:get organizations/pilot-org-santiago --project mvp-staging-3e1cd
```

O revisa directamente en:
https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore/data








## ⚠️ Limitación Actual

Los scripts automatizados de seeding requieren credenciales de Firebase Admin que no están configuradas en el entorno local.

## 📋 Alternativas para Crear Datos en Staging

### Opción 1: Firestore Console (Recomendado)

1. Abre [Firebase Console](https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore)
2. Navega a Firestore Database
3. Crea las siguientes estructuras:

#### A. Organización Piloto
```
organizations/pilot-org-santiago/
  - name: "Pilot Org Santiago"
  - displayName: "Organización Piloto Santiago"
  - ownerId: "<UID del usuario admin@pilot-santiago.com>"
  - timezone: "America/Santiago"
  - plan: "starter"
  - featureFlags:
      FEATURE_DASHBOARD_360: true
      FEATURE_BULK_ACTIONS: true
      FEATURE_CAMPAIGN_COMPARISON: true
      FEATURE_ORG_POLICIES: true
      FEATURE_OPERATIONAL_ALERTS: true
  - createdAt: <timestamp>
```

#### B. Usuario Admin Member
```
organizations/pilot-org-santiago/members/pilot-org-santiago:<UID>
  - userId: "<UID>"
  - email: "admin@pilot-santiago.com"
  - role: "owner"
  - joinedAt: <timestamp>
```

#### C. Test Definition
```
organizations/pilot-org-santiago/testDefinitions/test-leadership-360
  - orgId: "pilot-org-santiago"
  - name: "Evaluación 360° - Liderazgo"
  - type: "360"
  - status: "active"
  - categories: [...]
  - questions: [...]
```

#### D. Campaña
```
organizations/pilot-org-santiago/campaigns/campaign-q1-2025
  - orgId: "pilot-org-santiago"
  - name: "Q1 2025 - Liderazgo"
  - testDefinitionId: "test-leadership-360"
  - status: "active"
  - startDate: "2025-01-01T00:00:00Z"
  - endDate: "2025-03-31T23:59:59Z"
```

#### E. Sesiones 360
```
organizations/pilot-org-santiago/evaluation360Sessions/session-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - subjectName: "Juan Pérez"
  - subjectEmail: "juan.perez@pilot-santiago.com"
  - status: "active"
```

#### F. Asignaciones
```
organizations/pilot-org-santiago/evaluatorAssignments/assignment-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - session360Id: "session-001"
  - evaluatorEmail: "evaluator1@pilot-santiago.com"
  - evaluatorType: "peer"
  - status: "pending"
  - tokenHash: "<random-hash>"
```

### Opción 2: Usar la Aplicación Web

1. Accede a https://mvp-staging-3e1cd.web.app
2. Inicia sesión con `admin@pilot-santiago.com`
3. Navega a las secciones y crea datos manualmente:
   - Dashboard → Crear Test Definition
   - Campañas → Crear Campaña
   - Sesiones → Asignar Evaluadores

### Opción 3: Script con Service Account (Para DevOps)

Si tienes acceso a una service account key:

1. Descarga el JSON de service account desde Firebase Console
2. Guarda como `serviceAccountKey.json` en la raíz del proyecto
3. Ejecuta:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/create-staging-user.cjs
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

## 🎯 Datos Mínimos Requeridos para Smoke Tests

Para que los smoke tests pasen, necesitas:

- ✅ 1 organización: `pilot-org-santiago`
- ✅ 1 usuario owner: `admin@pilot-santiago.com`
- ✅ 1 campaña activa
- ✅ 3+ sesiones 360
- ✅ 12+ asignaciones (incluyendo 1 con email inválido)

## 🔍 Verificar Datos Existentes

Ejecuta este comando para verificar si ya existen datos:

```bash
firebase firestore:get organizations/pilot-org-santiago --project mvp-staging-3e1cd
```

O revisa directamente en:
https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore/data








## ⚠️ Limitación Actual

Los scripts automatizados de seeding requieren credenciales de Firebase Admin que no están configuradas en el entorno local.

## 📋 Alternativas para Crear Datos en Staging

### Opción 1: Firestore Console (Recomendado)

1. Abre [Firebase Console](https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore)
2. Navega a Firestore Database
3. Crea las siguientes estructuras:

#### A. Organización Piloto
```
organizations/pilot-org-santiago/
  - name: "Pilot Org Santiago"
  - displayName: "Organización Piloto Santiago"
  - ownerId: "<UID del usuario admin@pilot-santiago.com>"
  - timezone: "America/Santiago"
  - plan: "starter"
  - featureFlags:
      FEATURE_DASHBOARD_360: true
      FEATURE_BULK_ACTIONS: true
      FEATURE_CAMPAIGN_COMPARISON: true
      FEATURE_ORG_POLICIES: true
      FEATURE_OPERATIONAL_ALERTS: true
  - createdAt: <timestamp>
```

#### B. Usuario Admin Member
```
organizations/pilot-org-santiago/members/pilot-org-santiago:<UID>
  - userId: "<UID>"
  - email: "admin@pilot-santiago.com"
  - role: "owner"
  - joinedAt: <timestamp>
```

#### C. Test Definition
```
organizations/pilot-org-santiago/testDefinitions/test-leadership-360
  - orgId: "pilot-org-santiago"
  - name: "Evaluación 360° - Liderazgo"
  - type: "360"
  - status: "active"
  - categories: [...]
  - questions: [...]
```

#### D. Campaña
```
organizations/pilot-org-santiago/campaigns/campaign-q1-2025
  - orgId: "pilot-org-santiago"
  - name: "Q1 2025 - Liderazgo"
  - testDefinitionId: "test-leadership-360"
  - status: "active"
  - startDate: "2025-01-01T00:00:00Z"
  - endDate: "2025-03-31T23:59:59Z"
```

#### E. Sesiones 360
```
organizations/pilot-org-santiago/evaluation360Sessions/session-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - subjectName: "Juan Pérez"
  - subjectEmail: "juan.perez@pilot-santiago.com"
  - status: "active"
```

#### F. Asignaciones
```
organizations/pilot-org-santiago/evaluatorAssignments/assignment-001
  - orgId: "pilot-org-santiago"
  - campaignId: "campaign-q1-2025"
  - session360Id: "session-001"
  - evaluatorEmail: "evaluator1@pilot-santiago.com"
  - evaluatorType: "peer"
  - status: "pending"
  - tokenHash: "<random-hash>"
```

### Opción 2: Usar la Aplicación Web

1. Accede a https://mvp-staging-3e1cd.web.app
2. Inicia sesión con `admin@pilot-santiago.com`
3. Navega a las secciones y crea datos manualmente:
   - Dashboard → Crear Test Definition
   - Campañas → Crear Campaña
   - Sesiones → Asignar Evaluadores

### Opción 3: Script con Service Account (Para DevOps)

Si tienes acceso a una service account key:

1. Descarga el JSON de service account desde Firebase Console
2. Guarda como `serviceAccountKey.json` en la raíz del proyecto
3. Ejecuta:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/create-staging-user.cjs
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

## 🎯 Datos Mínimos Requeridos para Smoke Tests

Para que los smoke tests pasen, necesitas:

- ✅ 1 organización: `pilot-org-santiago`
- ✅ 1 usuario owner: `admin@pilot-santiago.com`
- ✅ 1 campaña activa
- ✅ 3+ sesiones 360
- ✅ 12+ asignaciones (incluyendo 1 con email inválido)

## 🔍 Verificar Datos Existentes

Ejecuta este comando para verificar si ya existen datos:

```bash
firebase firestore:get organizations/pilot-org-santiago --project mvp-staging-3e1cd
```

O revisa directamente en:
https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore/data







