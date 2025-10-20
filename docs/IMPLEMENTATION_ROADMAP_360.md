# IMPLEMENTATION ROADMAP 360° - Documento Puente

**Versión**: 1.1 (Ajustes Aprobados)  
**Fecha**: 2025-01-20 (Actualizado: 2025-01-20)  
**Basado en**: `docs/blueprint_360_Full.md` v5.0

---

## RESUMEN EJECUTIVO

Este documento establece el puente entre el **Blueprint 360°** (sistema B2B completo de evaluaciones multi-evaluador) y el **MVP actual** (sistema B2C de autoevaluaciones individual con multi-tenancy). Define el roadmap para evolucionar el sistema actual hacia una plataforma enterprise-ready manteniendo compatibilidad hacia atrás.

**Veredicto**: El sistema actual posee **~40% de la infraestructura necesaria**. La migración es viable sin reescritura mayor.

### Ajustes v1.1 (Aprobados)

Este documento integra las siguientes precisiones aprobadas:

1. ✅ **Wizard de campaña**: Precarga inteligente de evaluadores (Job Family + Jerarquía)
2. ✅ **Privacidad visible en UI**: Badges de anonimato con estado de umbrales
3. ✅ **Raters externos**: TTL, revocación, rate limits, protección anti-bot
4. ✅ **Accesibilidad e i18n**: Componentes críticos auditables (WCAG 2.1 AA)
5. ✅ **Exports & retención**: Sin PII, con checksums y versionado
6. ✅ **Idempotencia & observabilidad**: Tests específicos y eventos mínimos
7. ✅ **Precedencia de políticas**: Jerarquía estricta (solo endurecer, no relajar)

---

# A. ESTADO ACTUAL - MAPA BLUEPRINT ↔ CÓDIGO

## A.1 Módulos del Blueprint vs Implementación

| Módulo Blueprint | Estado | Implementación Actual | Gap Principal |
|-----------------|--------|----------------------|---------------|
| **Módulo 1**: Org/Personas/Jerarquía | 🟡 Parcial | `OrgContext`, multi-tenant, `orgs/members` | Falta jerarquía (áreas/departamentos), Job Families, import CSV |
| **Módulo 2**: Catálogo Tests/Job Families | 🟢 80% | `TestDefinition`, `TestEditor`, catálogo global | Falta relación N:M con Job Families, recomendaciones |
| **Módulo 3**: Campañas 360° | 🔴 0% | No existe | Estructura completa faltante |
| **Módulo 4**: Tokens/Invitaciones | 🟡 Parcial | Sistema de emails básico | Falta tokens únicos, recordatorios automatizados |
| **Módulo 5**: Evaluación Multi-Rater | 🟡 40% | `EvaluationWizard` individual | Falta soporte para peer/manager/subordinate |
| **Módulo 6**: Agregación 360° | 🔴 0% | Solo scoring individual | Falta agregación multi-evaluador, umbrales anonimato |
| **Módulo 7**: Reportes 360° | 🟡 30% | Reporte individual básico | Falta reportes comparativos, liberación controlada |
| **Módulo 8**: Gestión Avanzada | 🔴 0% | No existe | Dashboard admin, monitoreo campañas |
| **Módulo 9**: Analytics/Benchmarking | 🟡 20% | Analytics básico | Falta benchmarks, comparativas temporales |

### Fortalezas Existentes ✅

1. **Multi-tenancy completo** (`orgId` scoping, roles RBAC)
2. **Tests dinámicos versionados** (inmutabilidad, estados, editor visual)
3. **Sistema de scoring sofisticado** (ponderaciones, reglas condicionales, subdimensiones)
4. **Infraestructura de comunicación** (emails transaccionales, templates)
5. **Arquitectura serverless escalable** (Firebase/Firestore)
6. **Feature flags** para rollout gradual

### Brechas Críticas ❌

1. **Campañas** No existe entidad para agrupar múltiples evaluaciones
2. **Evaluadores múltiples**: No hay soporte para asignar pares/jefes/subordinados
3. **Tokens únicos**: Las invitaciones no son vía tokens individuales
4. **Agregación 360°**: No existe lógica para combinar respuestas manteniendo anonimato
5. **Umbrales de anonimato**: No se implementan reglas de mínimos de evaluadores
6. **Jerarquía organizacional**: No existe estructura Área → Departamento
7. **Job Families**: Concepto no implementado

---

## A.2 Compatibilidad B2C (Autoevaluaciones) vs B2B (360°)

### Estrategia: **Separación Limpia con Reutilización**

**B2C (actual)**: Flujo individual donde `userId = evaluado = evaluador`

**B2B (nuevo)**: Flujo multi-evaluador donde `evaluado ≠ evaluadores`

### Plan de Coexistencia

```
Colecciones Actuales (mantener):
- orgs/{orgId}/evaluationSessions → Para autoevaluaciones B2C
  - Campos: userId, testId, version, answers, results
  - Uso: Usuarios individuales completando tests

Colecciones Nuevas (agregar):
- orgs/{orgId}/campaigns → Campañas 360° B2B
- orgs/{orgId}/evaluation360Sessions → Sesiones 360° por evaluado
  - Campos: evaluateeId, campaignId, testId, evaluators[], status
- orgs/{orgId}/evaluatorAssignments → Tokens/asignaciones individuales
  - Campos: eval360SessionId, evaluatorId, token, status, answers
- orgs/{orgId}/jobFamilies → Familias de puestos
- orgs/{orgId}/orgStructure → Áreas/departamentos
```

**Separación operativa**:
- B2C: Ruta `/evaluations` (usuario completa su propio test)
- B2B: Rutas `/campaigns`, `/360-evaluations` (admin orquesta, múltiples evalúan)

**Componentes reutilizables**:
- ✅ `EvaluationWizard` → Con prop `raterMode` (self/peer/manager)
- ✅ `TestEditor`, `TestPreview`
- ✅ `scoringEngine.js` → Extender para agregación
- ✅ `questionBank`, `TestDefinition`
- ✅ Emails transaccionales

---

## A.3 Plan de Migración (Idempotente + Rollback)

### Fase 0: Preparación (Pre-implementation)

```bash
# 1. Feature flags
VITE_FEATURE_360_CAMPAIGNS=false
VITE_FEATURE_JOB_FAMILIES=false
VITE_FEATURE_ORG_HIERARCHY=false

# 2. Índices Firestore (desplegar primero)
firebase deploy --only firestore:indexes

# 3. Reglas actualizadas (sin romper legacy)
firebase deploy --only firestore:rules
```

### Migración de Datos Existentes

**Usuarios actuales** → No requieren migración (ya tienen `orgId` personal)

**Tests existentes** → Mantener sin cambios (compatibles con 360°)

**Evaluaciones en progreso** → Continúan en colección actual

### Rollback Strategy

```javascript
// Kill-switch por feature flag
if (!isFeatureEnabled('360_CAMPAIGNS')) {
  // Ocultar UI de campañas
  // Deshabilitar rutas 360
  // Revertir a flujo B2C puro
}
```

### Script de Validación

```bash
# scripts/validate-360-readiness.js
npm run validate:360-readiness

Checks:
✓ Índices Firestore desplegados
✓ Colecciones nuevas creadas (vacías)
✓ Feature flags deshabilitados en prod
✓ Tests legacy funcionan
✓ Zero regressions en autoevaluaciones
```

---

## A.4 Assets Reutilizables (Paths Reales)

### Componentes UI (reutilización directa)

| Componente | Path | Uso en 360° | Modificaciones |
|------------|------|-------------|----------------|
| `EvaluationWizard` | `src/components/EvaluationWizard.jsx` | Evaluación multi-rater | Agregar prop `raterMode`, `anonymousMode` |
| `Question` | `src/components/Question.jsx` | Preguntas del test | Sin cambios |
| `ProgressBar` | `src/components/ProgressBar.jsx` | Progreso individual | Sin cambios |
| `TestEditor` | `src/components/TestEditor.jsx` | Edición de tests | Agregar opciones 360° |
| `TestPreview` | `src/components/TestPreview.jsx` | Preview tests | Sin cambios |

### Servicios Backend (extender)

| Servicio | Path | Uso 360° | Extensiones |
|----------|------|----------|-------------|
| `testDefinitionService` | `src/services/testDefinitionService.js` | CRUD tests | Agregar `is360Enabled`, `raterModes` |
| `scoringEngine` | `src/utils/scoringEngine.js` | Scoring | Agregar `aggregateScores()`, `applyAnonymityThresholds()` |
| `emailService` | `src/services/emailService.js` | Invitaciones | Agregar templates 360°, recordatorios |
| `reportService` | `src/services/reportService.js` | Reportes | Agregar reportes comparativos 360° |

### Modelos de Datos (extender)

| Modelo | Path | Extensiones 360° |
|--------|------|------------------|
| `TestDefinition` | `src/models/TestDefinition.js` | Agregar `is360Enabled`, `minEvaluatorsPerType` |

### Hooks (reutilizar)

| Hook | Path | Uso 360° | Cambios |
|------|------|----------|---------|
| `useEvaluation` | `src/context/EvaluationContextV2.jsx` | Evaluación individual | Extender para `raterMode` |
| `useMultiTenant` | `src/hooks/useMultiTenant.js` | Scoping por org | Sin cambios |
| `useOrgGuard` | `src/hooks/useOrgGuard.js` | Protección rutas | Sin cambios |

---

# B. ARQUITECTURA PROPUESTA

## B.1 Modelo de Datos (Entidades Principales)

### B.1.1 Nuevas Colecciones

#### **campaigns** (Campañas 360°)

```javascript
// orgs/{orgId}/campaigns/{campaignId}
{
  campaignId: string,
  orgId: string,
  title: string,
  description: string,
  type: 'org_wide' | 'area' | 'custom', // Alcance
  status: 'draft' | 'active' | 'closed' | 'completed',
  config: {
    startDate: timestamp,
    endDate: timestamp,
    reminderSchedule: [3, 7, 14], // Días para recordatorios
    anonymityThresholds: {
      peers: 3,
      subordinates: 3
    },
    requiredEvaluators: {
      self: true,
      manager: true,
      peers: { min: 3, max: 5 },
      subordinates: { min: 3 }
    }
  },
  createdBy: string,
  createdAt: timestamp,
  stats: {
    totalEvaluatees: number,
    totalInvitations: number,
    completionRate: number
  }
}
```

#### **evaluation360Sessions** (Sesión por Evaluado)

```javascript
// orgs/{orgId}/evaluation360Sessions/{session360Id}
{
  session360Id: string,
  orgId: string,
  campaignId: string,
  evaluateeId: string, // Persona evaluada
  evaluateeName: string,
  testId: string,
  testVersion: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled',
  evaluators: {
    self: { userId, status, completedAt },
    manager: [{ userId, status, completedAt, token }],
    peers: [{ userId, status, completedAt, token }],
    subordinates: [{ userId, status, completedAt, token }],
    external: [{ email, status, completedAt, token }]
  },
  results: {
    aggregated: { /* scores por categoría */ },
    byRaterType: { /* scores segregados */ },
    anonymized: boolean,
    releasedAt: timestamp | null
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **evaluatorAssignments** (Tokens Individuales)

```javascript
// orgs/{orgId}/evaluatorAssignments/{assignmentId}
{
  assignmentId: string,
  eval360SessionId: string,
  campaignId: string,
  evaluateeId: string,
  evaluatorId: string | null, // null para externos
  evaluatorEmail: string,
  raterType: 'self' | 'manager' | 'peer' | 'subordinate' | 'external',
  token: string, // XXX-XXXX-XXXX-XXX
  status: 'pending' | 'in_progress' | 'completed' | 'expired',
  answers: {}, // Respuestas del evaluador
  startedAt: timestamp | null,
  completedAt: timestamp | null,
  expiresAt: timestamp,
  reminders: [{ sentAt, type }],
  createdAt: timestamp
}
```

#### **jobFamilies** (Familias de Puestos)

```javascript
// orgs/{orgId}/jobFamilies/{familyId}
{
  familyId: string,
  orgId: string,
  name: string,
  description: string,
  level: 'individual_contributor' | 'manager' | 'director' | 'executive',
  testMappings: {
    recommended: [{ testId, reason }],
    allowed: [testId],
    excluded: [testId]
  },
  evaluatorConfig: {
    requireSelf: boolean,
    requireManager: boolean,
    peersMin: number,
    peersMax: number,
    subordinatesMin: number
  },
  createdAt: timestamp
}
```

#### **orgStructure** (Jerarquía Organizacional)

```javascript
// orgs/{orgId}/orgStructure/areas/{areaId}
{
  areaId: string,
  orgId: string,
  name: string,
  description: string,
  managerId: string | null,
  parentId: string | null, // Para sub-áreas
  level: 1 | 2 | 3,
  memberCount: number
}
```

### B.1.2 Colecciones Extendidas

#### **orgs/{orgId}/members** (extender)

```javascript
// Agregar campos:
{
  // ... campos existentes (userId, role, status)
  
  // NUEVOS:
  jobFamilyIds: [string], // Múltiples Job Families
  areaId: string | null,
  departmentId: string | null,
  managerId: string | null, // Jefe directo
  subordinateIds: [string], // Subordinados directos
  hireDate: timestamp,
  metadata: {
    displayName: string,
    email: string,
    jobTitle: string
  }
}
```

---

## B.2 Índices Firestore (Queries Frecuentes + Paginación)

### B.2.1 Índices Compuestos Críticos

```json
// firestore.indexes.json
{
  "indexes": [
    // Campañas por org + estado
    {
      "collectionGroup": "campaigns",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "orgId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    
    // Evaluation360Sessions por campaña + evaluado
    {
      "collectionGroup": "evaluation360Sessions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "orgId", "order": "ASCENDING"},
        {"fieldPath": "campaignId", "order": "ASCENDING"},
        {"fieldPath": "evaluateeId", "order": "ASCENDING"}
      ]
    },
    
    // Assignments por evaluador + estado (para "Mis Evaluaciones Pendientes")
    {
      "collectionGroup": "evaluatorAssignments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "orgId", "order": "ASCENDING"},
        {"fieldPath": "evaluatorId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "expiresAt", "order": "ASCENDING"}
      ]
    },
    
    // Assignments por token (único)
    {
      "collectionGroup": "evaluatorAssignments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "token", "order": "ASCENDING"}
      ]
    },
    
    // Members por jobFamily (para asignación en campañas)
    {
      "collectionGroup": "members",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "orgId", "order": "ASCENDING"},
        {"fieldPath": "jobFamilyIds", "arrayContains": true},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    },
    
    // Members por manager (para subordinados)
    {
      "collectionGroup": "members",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "orgId", "order": "ASCENDING"},
        {"fieldPath": "managerId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    }
  ]
}
```

### B.2.2 Estrategia de Paginación

```javascript
// Ejemplo: Listar evaluatorAssignments pendientes paginados
const q = query(
  collection(db, `orgs/${orgId}/evaluatorAssignments`),
  where('evaluatorId', '==', userId),
  where('status', 'in', ['pending', 'in_progress']),
  orderBy('expiresAt', 'asc'),
  limit(20) // Página de 20
);

// Página siguiente
const nextQ = query(q, startAfter(lastDoc));
```

---

## B.3 RBAC/Seguridad (Firestore Rules)

### B.3.1 Roles y Permisos

| Rol | Campaigns | 360Sessions | Evaluator Assignments | Job Families |
|-----|-----------|-------------|----------------------|--------------|
| **OWNER** | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **ADMIN** | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| **MANAGER** | Read own area | Read team | Read/Write own | Read |
| **MEMBER** | Read if participant | Read own | Read/Write own | Read |
| **ANON_RATER** | None | None | Read/Write token | None |

### B.3.2 Firestore Rules (Extensión)

```javascript
// firestore.rules - Agregar

// Campaigns: Admin/Owner CRUD, Manager/Member read if participant
match /orgs/{orgId}/campaigns/{campaignId} {
  allow read: if isMemberOf(orgId);
  allow create, update, delete: if isAdminOrOwner(orgId);
}

// Evaluation360Sessions: Admin ve todo, evaluado ve su propia
match /orgs/{orgId}/evaluation360Sessions/{sessionId} {
  allow read: if resource.data.evaluateeId == currentUserId() ||
                 isAdminOrOwner(orgId) ||
                 (hasRole(orgId, 'manager') && isInTeam(resource.data.evaluateeId));
  
  allow create: if isAdminOrOwner(orgId);
  allow update: if isAdminOrOwner(orgId) || 
                   resource.data.evaluateeId == currentUserId(); // Solo actualizar propio progreso
  allow delete: if isAdminOrOwner(orgId);
}

// EvaluatorAssignments: Solo el evaluador asignado o admin
match /orgs/{orgId}/evaluatorAssignments/{assignmentId} {
  allow read: if resource.data.evaluatorId == currentUserId() ||
                 resource.data.token in request.header('X-Eval-Token') || // Token anónimo
                 isAdminOrOwner(orgId);
  
  allow update: if (resource.data.evaluatorId == currentUserId() && 
                    request.resource.data.keys().hasAll(['answers', 'status', 'completedAt'])) ||
                   isAdminOrOwner(orgId);
  
  allow create, delete: if isAdminOrOwner(orgId);
}

// Job Families: Admin CRUD, otros read
match /orgs/{orgId}/jobFamilies/{familyId} {
  allow read: if isMemberOf(orgId);
  allow create, update, delete: if isAdminOrOwner(orgId);
}

// OrgStructure: Admin CRUD, otros read
match /orgs/{orgId}/orgStructure/{structureType}/{itemId} {
  allow read: if isMemberOf(orgId);
  allow write: if isAdminOrOwner(orgId);
}
```

---

## B.4 Matriz de Estados (Transiciones Válidas)

### Campaign States

```
DRAFT → ACTIVE → CLOSED → COMPLETED
  ↓        ↓        ↓
[Delete][Pause][Reopen]
  ↓        ↓
DELETED  DRAFT
```

**Transiciones válidas**:
- `DRAFT → ACTIVE`: Requiere validación (evaluatees, tests, fechas)
- `ACTIVE → CLOSED`: Manual o automático (fecha fin)
- `CLOSED → COMPLETED`: Después de procesamiento de resultados
- `ACTIVE → DRAFT`: Pausar (solo si 0% completitud)

### Evaluation360Session States

```
NOT_STARTED → IN_PROGRESS → COMPLETED
     ↓             ↓
 [Cancel]     [Cancel]
     ↓             ↓
 CANCELLED     CANCELLED
```

### EvaluatorAssignment States

```
PENDING → IN_PROGRESS → COMPLETED
   ↓          ↓
[Expire]  [Expire]
   ↓          ↓
EXPIRED    EXPIRED
```

---

## B.5 Precedencia de Políticas (Override Rules)

### Jerarquía Estricta

**Regla fundamental**: Los niveles inferiores **solo pueden ENDURECER**, nunca relajar, las políticas de privacidad y seguridad.

```
Sistema (defaults globales) 
  ↓ (puede sobrescribir: endurecer O personalizar)
Organización (org settings)
  ↓ (puede sobrescribir: endurecer O personalizar)
Campaña (campaign config)
  ↓ (NO puede sobrescribir políticas de campaña)
Evaluation360Session
```

### Reglas de Validación

```javascript
// src/utils/policyValidator.js

// Al crear/editar org settings
const validateOrgPolicy = (orgSettings, systemDefaults) => {
  const errors = [];
  
  // Umbrales de anonimato: solo puede aumentar, no reducir
  if (orgSettings.anonymityThresholds) {
    Object.keys(systemDefaults.anonymityThresholds).forEach(raterType => {
      const systemMin = systemDefaults.anonymityThresholds[raterType];
      const orgMin = orgSettings.anonymityThresholds[raterType];
      
      if (orgMin < systemMin) {
        errors.push(
          `Umbral de anonimato para ${raterType} no puede ser menor que el del sistema (${systemMin})`
        );
      }
    });
  }
  
  // Retención de datos: solo puede reducir, no extender
  if (orgSettings.retentionDays) {
    if (orgSettings.retentionDays > systemDefaults.retentionDays) {
      errors.push(
        `Retención de datos no puede exceder el límite del sistema (${systemDefaults.retentionDays} días)`
      );
    }
  }
  
  return { valid: errors.length === 0, errors };
};

// Al crear/editar campaña
const validateCampaignPolicy = (campaignConfig, orgSettings) => {
  const errors = [];
  
  // Umbrales: campaña no puede relajar los de la org
  if (campaignConfig.anonymityThresholds) {
    Object.keys(orgSettings.anonymityThresholds).forEach(raterType => {
      const orgMin = orgSettings.anonymityThresholds[raterType];
      const campaignMin = campaignConfig.anonymityThresholds[raterType];
      
      if (campaignMin < orgMin) {
        errors.push(
          `Umbral para ${raterType} no puede ser menor que el de la organización (${orgMin})`
        );
      }
    });
  }
  
  // TTL de tokens: campaña no puede extender más allá de lo permitido por org
  if (campaignConfig.tokenTTLDays > orgSettings.maxTokenTTLDays) {
    errors.push(
      `TTL de tokens no puede exceder el máximo de la organización (${orgSettings.maxTokenTTLDays} días)`
    );
  }
  
  return { valid: errors.length === 0, errors };
};
```

### Matriz de Políticas Sobrescribibles

| Política | Sistema → Org | Org → Campaña | Dirección Permitida |
|----------|---------------|---------------|---------------------|
| **Umbral anonimato** | ✅ Aumentar | ✅ Aumentar | Solo endurecer |
| **Retención de datos** | ✅ Reducir | ✅ Reducir | Solo endurecer |
| **TTL de tokens** | ✅ Reducir | ✅ Reducir | Solo endurecer |
| **Rate limits** | ✅ Reducir | ✅ Reducir | Solo endurecer |
| **Recordatorios** | ✅ Personalizar | ✅ Personalizar | Ambas direcciones |
| **Idioma/timezone** | ✅ Personalizar | ✅ Personalizar | Ambas direcciones |
| **Templates email** | ✅ Personalizar | ✅ Personalizar | Ambas direcciones |

### Ejemplos Concretos

**✅ VÁLIDO - Endurecer privacidad**:
```javascript
// Sistema: peers >= 3
// Org: peers >= 5 (más estricto)
// Campaña: peers >= 7 (aún más estricto)
// ✅ Permitido
```

**❌ INVÁLIDO - Relajar privacidad**:
```javascript
// Sistema: peers >= 3
// Org: peers >= 5
// Campaña: peers >= 2 (menos estricto que org)
// ❌ Rechazado con error
```

**✅ VÁLIDO - Personalizar operación**:
```javascript
// Sistema: reminders [3, 7, 14]
// Org: reminders [5, 10] (campaña urgente)
// Campaña: reminders [1, 2, 3] (campaña muy urgente)
// ✅ Permitido (no afecta privacidad)
```

**✅ VÁLIDO - Endurecer retención**:
```javascript
// Sistema: retención 730 días (2 años)
// Org: retención 365 días (1 año)
// Campaña: hereda de org (365 días)
// ✅ Permitido (reduce exposición de datos)
```

### Enforcement en UI

```jsx
// En CampaignWizard, al configurar umbrales
const AnonymityThresholdsConfig = ({ orgSettings }) => {
  const [thresholds, setThresholds] = useState({
    peers: orgSettings.anonymityThresholds.peers
  });
  
  const handleThresholdChange = (raterType, value) => {
    const orgMin = orgSettings.anonymityThresholds[raterType];
    
    if (value < orgMin) {
      showError(
        `El umbral para ${raterType} no puede ser menor que ${orgMin} 
         (configurado a nivel de organización)`
      );
      return;
    }
    
    setThresholds({ ...thresholds, [raterType]: value });
  };
  
  return (
    <div>
      <label>Umbral mínimo de Pares</label>
      <input 
        type="number" 
        min={orgSettings.anonymityThresholds.peers}
        value={thresholds.peers}
        onChange={(e) => handleThresholdChange('peers', Number(e.target.value))}
      />
      <small>
        Mínimo de la organización: {orgSettings.anonymityThresholds.peers}
      </small>
    </div>
  );
};
```

---

## B.6 Navegación y Rutas Principales

### B.6.1 Rutas B2C (mantener)

```
/evaluations          → Mis autoevaluaciones (lista)
/evaluations/:testId/:version → Completar evaluación individual
/reports/:reportId    → Ver reporte individual
```

### B.6.2 Rutas B2B Nuevas (360°)

```
/admin/campaigns           → Listado de campañas (ADMIN)
/admin/campaigns/new       → Wizard crear campaña
/admin/campaigns/:id       → Dashboard de campaña
/admin/campaigns/:id/edit  → Editar configuración

/my-360-evaluations        → Mis evaluaciones 360° (evaluado)
/my-360-evaluations/:sessionId → Ver progreso mi 360°

/eval/:token               → Landing evaluación anónima (evaluador)
/eval/:token/complete      → Completar evaluación como evaluador

/admin/job-families        → Gestión Job Families
/admin/org-structure       → Gestión jerarquía org

/360-reports/:sessionId    → Reporte 360° comparativo
```

### B.6.3 Separación UI

```jsx
// App.jsx - Rutas condicionales
{user.role === 'ADMIN' || user.role === 'OWNER' ? (
  <>
    <Route path="/admin/campaigns" element={<CampaignsAdmin />} />
    <Route path="/admin/job-families" element={<JobFamiliesAdmin />} />
  </>
) : null}

{/* Todos los usuarios */}
<Route path="/evaluations" element={<MyEvaluations />} />
<Route path="/my-360-evaluations" element={<My360Evaluations />} />

{/* Ruta pública con token */}
<Route path="/eval/:token" element={<TokenEvaluation />} />
```

---

## B.7 Flujos Críticos

### B.7.1 Flujo: Crear Campaña → Invitar → Evaluar → Reportar

```
1. ADMIN: Crear Campaña
   ↓
   - Define alcance (toda org, área, custom)
   - Selecciona evaluados (filtros por Job Family, área)
   - Asigna tests (automático por Job Family o manual)
   - Configura evaluadores (reglas globales)
   ↓
2. ADMIN: Personalizar por Evaluado
   ↓
   - Para cada evaluado:
     - Seleccionar pares manualmente o auto-sugeridos
     - Confirmar jefe (desde managerId)
     - Confirmar subordinados
   ↓
3. ADMIN: Activar Campaña
   ↓
   - Validación (todo completo)
   - Estado → ACTIVE
   - Trigger: Generación de tokens
   - Trigger: Envío masivo de invitaciones
   ↓
4. EVALUADORES: Reciben Email
   ↓
   - Contiene link único: /eval/{token}
   - Click → Landing con contexto
   - "Comenzar Evaluación"
   ↓
5. EVALUADORES: Completan Evaluación
   ↓
   - EvaluationWizard con raterMode = 'peer' | 'manager' | ...
   - Responden preguntas
   - Submit → Guarda en evaluatorAssignments.answers
   - Status → COMPLETED
   ↓
6. SISTEMA: Monitoreo Automático
   ↓
   - Recordatorios según calendario
   - Actualización de stats en campaign
   - Detección de umbrales alcanzados
   ↓
7. ADMIN: Cierre Manual o Automático
   ↓
   - Campaign.status → CLOSED
   - Trigger: Procesamiento de resultados
   ↓
8. SISTEMA: Agregación de Resultados
   ↓
   - Para cada evaluation360Session:
     - Combinar respuestas por raterType
     - Aplicar umbrales de anonimato
     - Calcular scores agregados
     - Guardar en session.results
   ↓
9. ADMIN: Liberar Resultados
   ↓
   - Decisión por evaluado o masiva
   - session.results.releasedAt → timestamp
   - Trigger: Notificación a evaluados
   ↓
10. EVALUADOS: Ven Resultados
    ↓
    - /my-360-evaluations/:sessionId
    - Reporte comparativo (self vs others)
    - Gráficos, narrativa, recomendaciones
```

---

# C. PLAN DE IMPLEMENTACIÓN

## C.1 Fases con Definition of Done

### FASE 1 (MVP 360°) - 6-8 semanas

**Objetivo**: *"Puedo ejecutar una campaña 360° completa end-to-end"*

#### Módulos a Implementar

**1.1 Jerarquía Organizacional Básica** (1 semana)

**Entregables**:
- Modelo `orgStructure` (áreas/departamentos)
- UI Admin: Crear/editar áreas
- UI Admin: Asignar miembros a áreas
- Extensión `members` con `areaId`, `managerId`

**DoD**:
- [ ] Puedo crear 3 niveles de jerarquía (Org → Área → Dpto)
- [ ] Puedo asignar manager a cada área
- [ ] Puedo asignar miembros a áreas/departamentos
- [ ] Vista de organigrama básico funcional

---

**1.2 Job Families Básicas** (1 semana)

**Entregables**:
- Modelo `jobFamilies`
- UI Admin: CRUD Job Families
- Relación N:M con TestDefinitions (recomendados/permitidos/excluidos)
- Extensión `members.jobFamilyIds[]`

**DoD**:
- [ ] Puedo crear Job Families con config de evaluadores
- [ ] Puedo asignar múltiples Job Families a un miembro
- [ ] Sistema sugiere tests según Job Family

---

**1.3 Campañas 360° Core** (2 semanas)

**Entregables**:
- Modelo `campaigns`, `evaluation360Sessions`
- UI Admin: Wizard de creación de campaña
  - Paso 1: Info general + fechas
  - Paso 2: Selección de evaluados (filtros básicos)
  - Paso 3: Asignación de tests (auto por Job Family)
  - Paso 4: Reglas de evaluadores (global)
  - Paso 5: Revisión + activación
- Estado básico (DRAFT, ACTIVE, CLOSED)

**DoD**:
- [ ] Puedo crear campaña seleccionando evaluados por Job Family
- [ ] Sistema asigna tests recomendados automáticamente
- [ ] Puedo definir reglas de evaluadores (mínimos/máximos)
- [ ] Puedo activar campaña → estado ACTIVE
- [ ] **Zona horaria**: Deadlines y recordatorios usan `org.timezone` (no servidor)
- [ ] **DST validation**: Sistema valida cambios de horario de verano
- [ ] **Rate limits por org/plan**: Cuotas de emails/día y campañas activas aplicadas

---

**1.4 Tokens e Invitaciones** (2 semanas)

**Entregables**:
- Modelo `evaluatorAssignments` con tokens únicos
- Generación automática de tokens al activar campaña
- Template de emails específicos 360°
- Landing page `/eval/:token` para evaluadores
- Validación de token + contextualización
- **Protección anti-abuso** para raters externos

**DoD**:
- [ ] Al activar campaña, se generan tokens únicos por evaluador
- [ ] Se envían emails con links tokenizados
- [ ] Evaluador puede acceder vía token sin login
- [ ] Sistema valida token (existencia, expiración, uso)
- [ ] Landing muestra contexto (evaluado, test, deadline)
- [ ] **Tokens externos protegidos**:
  - [ ] TTL configurable (default 30 días)
  - [ ] Revocación manual desde admin
  - [ ] Rate limits por IP (5 intentos/hora)
  - [ ] Rate limits por email (3 reenvíos máximo)
  - [ ] Protección reCAPTCHA v3 en landing público
  - [ ] Tokens single-use tras completar (no reutilizables)
  - [ ] Trazabilidad: enviado/abierto/clic/bounce/completado

**Protección Anti-Abuso**:
```javascript
// Validación en landing /eval/:token
const validateExternalToken = async (token, req) => {
  // 1. Verificar rate limit por IP
  const ipAttempts = await getRateLimitIP(req.ip);
  if (ipAttempts > 5) {
    throw new RateLimitError('Demasiados intentos desde esta IP');
  }
  
  // 2. Validar reCAPTCHA score
  const captchaScore = await verifyCaptcha(req.body.captchaToken);
  if (captchaScore < 0.5) {
    throw new BotDetectedError('Verificación de seguridad fallida');
  }
  
  // 3. Verificar token
  const assignment = await getAssignmentByToken(token);
  if (!assignment) throw new NotFoundError('Token inválido');
  if (assignment.status === 'completed') {
    throw new AlreadyUsedError('Esta evaluación ya fue completada');
  }
  if (assignment.expiresAt < new Date()) {
    throw new ExpiredError('Token expirado');
  }
  
  // 4. Registrar acceso
  await logTokenAccess(token, req.ip, req.userAgent);
  
  return assignment;
};
```

---

**1.5 Evaluación Multi-Rater** (1.5 semanas)

**Entregables**:
- Extensión `EvaluationWizard` con prop `raterMode`
- UI adaptada según raterMode (self/peer/manager/subordinate)
- Guardado en `evaluatorAssignments.answers`
- Actualización de estado assignment → COMPLETED

**DoD**:
- [ ] Evaluador puede completar evaluación vía token
- [ ] Wizard muestra instrucciones según raterType
- [ ] Respuestas se guardan en assignment (no en session)
- [ ] Al completar, status → COMPLETED
- [ ] Progreso se refleja en campaign stats

---

**1.6 Agregación Básica con Umbrales** (2 semanas)

**Entregables**:
- Función `aggregateResults(session360Id)`
- Lógica de combinación de respuestas por raterType
- Aplicación de umbrales de anonimato
- Guardado en `session.results.aggregated`
- Triggers automáticos al cerrar campaña

**DoD**:
- [ ] Al cerrar campaña, se procesan todas las sessions
- [ ] Sistema combina respuestas agrupadas por raterType
- [ ] Si raterType < umbral, no muestra segregado
- [ ] Resultados agregados guardados en session
- [ ] Evaluado NO puede ver respuestas individuales
- [ ] **Compatibilidad de versiones**: Si respuestas con testId@version diferentes:
  - [ ] No promediar directamente (error o warning)
  - [ ] Si se normaliza, marcar como "no directamente comparables"
  - [ ] Mostrar aviso en reporte sobre diferencias de versión
- [ ] **Pruebas con datasets límite**: Validado con umbral-1 (ej: 2 subordinados cuando mínimo es 3)
  - [ ] Sistema oculta grupo correctamente
  - [ ] Mensaje claro en reporte: "No se muestra por privacidad (solo 2 respuestas, mínimo 3)"

---

**1.7 Reporte Individual 360° Simple** (1 semana)

**Entregables**:
- Componente `Report360Simple`
- Vista comparativa: Self vs Peers vs Manager
- Gráfico radar con promedios por categoría
- Tabla de scores
- **Badges de privacidad** por grupo de evaluadores
- Sin narrativa avanzada (solo scores)

**DoD**:
- [ ] Evaluado puede ver su reporte 360°
- [ ] Muestra comparación entre raterTypes
- [ ] Gráfico radar funcional
- [ ] Respeta umbrales de anonimato (oculta si <min)
- [ ] **UI muestra badges de privacidad** por grupo:
  - [ ] Badge indica "Nominativo" o "Anónimo"
  - [ ] Badge muestra umbral requerido (ej: "Min 3")
  - [ ] Badge indica si está cumplido (✅ check o ⚠️ alerta)
- [ ] Solo visible si `session.results.releasedAt` existe

**Ejemplo UI de Badges**:
```
┌─────────────────────────────────────────┐
│ 📊 TUS RESULTADOS 360°                  │
├─────────────────────────────────────────┤
│                                         │
│ [👤 Self] Nominativo                    │
│ Score: 4.2/5.0                          │
│                                         │
│ [👔 Managers] Nominativo (2)           │
│ Score: 3.8/5.0                          │
│                                         │
│ [👥 Pares] ✅ Anónimo (Min 3) - 5 resp │
│ Score: 4.0/5.0                          │
│                                         │
│ [📊 Subordinados] ⚠️ Oculto (Min 3)     │
│ Solo 2 respuestas - No mostrado        │
│                                         │
└─────────────────────────────────────────┘
```

---

#### Criterios de Aceptación MVP Fase 1

**Funcionales**:
- [ ] Puedo crear org con 2 áreas y 3 departamentos
- [ ] Puedo crear 3 Job Families con tests recomendados
- [ ] Puedo crear campaña con 10 evaluados
- [ ] **Wizard precarga evaluadores sugeridos** automáticamente
- [ ] Sistema envía 40+ invitaciones (self + peers + manager)
- [ ] 5 evaluadores completan vía tokens
- [ ] Sistema agrega resultados respetando anonimato
- [ ] **UI muestra badges de privacidad** con estado de umbrales
- [ ] Evaluados ven reportes 360° básicos
- [ ] **Exports incluyen checksums** y NO incluyen PII de anónimos

**No Funcionales**:
- [ ] P95 < 3s en vistas principales (con 100 evaluados)
- [ ] Tokens únicos, no reversibles, con TTL y rate limits
- [ ] **Protección anti-abuso**: reCAPTCHA en tokens públicos
- [ ] Zero acceso cross-org
- [ ] Emails con >95% entregabilidad
- [ ] Mobile-friendly (evaluación responsive)
- [ ] **Tests de idempotencia** pasando (recordatorios sin duplicados)
- [ ] **Eventos mínimos** logueados (12+ tipos definidos)
- [ ] **Componentes críticos** auditados WCAG 2.1 AA (6 componentes)
- [ ] **Precedencia de políticas** validada (solo endurecer privacidad)

---

### FASE 2 (Avanzado) - 4-6 semanas

**Objetivo**: *"Reportes profesionales + gestión avanzada"*

#### Módulos

**2.1 Recordatorios Automatizados** (1 semana)
- Cloud Functions programadas
- Calendario configurable por campaña
- Envío inteligente (no enviar si completado)
- Escalamiento a manager/admin

**2.2 Dashboard de Campaña Avanzado** (2 semanas)
- Monitoreo en tiempo real
- KPIs (completitud, tasa respuesta, tiempo promedio)
- Vista por evaluado (quién completó, quién falta)
- Acciones: Reenviar invitaciones, extender plazos

**2.3 Reportes 360° Profesionales** (2 semanas)
- Narrativa automática (adaptar templates existentes)
- Comparativas temporales (si hay histórico)
- Recomendaciones por categoría
- Export PDF completo

**2.4 Gestión Avanzada** (1 semana)
- Asignación manual de pares/subordinados
- Importación CSV de estructura org
- Bulk actions en campañas

---

#### DoD Fase 2

- [ ] Recordatorios se envían automáticamente según calendario
- [ ] Admin puede monitorear campaña en tiempo real
- [ ] Reportes 360° incluyen narrativa y recomendaciones
- [ ] Sistema soporta importación CSV de 100+ miembros

---

### FASE 3 (Enterprise-Ready) - 3-4 semanas

**Objetivo**: *"Operación + governance enterprise"*

#### Módulos

**3.1 Analytics y Benchmarking** (2 semanas)
- Benchmarks por Job Family
- Comparativas entre áreas
- Evolución temporal (múltiples campañas)
- Dashboard ejecutivo

**3.2 Liberación Controlada** (1 semana)
- Workflow de aprobación de resultados
- Liberación escalonada
- Notificaciones de disponibilidad

**3.3 Auditoría y Compliance** (1 semana)
- Logs de accesos a resultados
- Exportación de auditoría
- Políticas de retención de datos
- Implementación GDPR/LGPD

---

#### DoD Fase 3

- [ ] Admin puede comparar scores entre áreas
- [ ] Sistema muestra evolución temporal de evaluados
- [ ] Liberación de resultados requiere aprobación manual
- [ ] Auditoría registra quién accedió a qué reporte y cuándo
- [ ] Política de retención implementada (borrado automático después de X meses)

---

## C.2 Feature Flags por Módulo

```javascript
// Feature flags progresivos
export const FEATURE_FLAGS = {
  // Fase 1
  ORG_HIERARCHY: {
    flag: 'VITE_FEATURE_ORG_HIERARCHY',
    rollout: 'org', // Por organización
    killSwitch: true
  },
  JOB_FAMILIES: {
    flag: 'VITE_FEATURE_JOB_FAMILIES',
    rollout: 'org',
    killSwitch: true
  },
  CAMPAIGNS_360: {
    flag: 'VITE_FEATURE_360_CAMPAIGNS',
    rollout: 'org',
    killSwitch: true
  },
  MULTI_RATER_EVAL: {
    flag: 'VITE_FEATURE_MULTI_RATER',
    rollout: 'org',
    killSwitch: true
  },
  
  // Fase 2
  AUTO_REMINDERS: {
    flag: 'VITE_FEATURE_AUTO_REMINDERS',
    rollout: 'campaign',
    killSwitch: true
  },
  ADVANCED_REPORTS: {
    flag: 'VITE_FEATURE_ADVANCED_REPORTS_360',
    rollout: 'org',
    killSwitch: false
  },
  
  // Fase 3
  BENCHMARKING: {
    flag: 'VITE_FEATURE_BENCHMARKING',
    rollout: 'plan', // Solo premium
    killSwitch: false
  },
  AUDIT_LOGS: {
    flag: 'VITE_FEATURE_AUDIT_LOGS',
    rollout: 'all',
    killSwitch: false
  }
};
```

**Estrategia de rollout**:
1. **Dev**: Todos los flags = `true`
2. **Staging**: Activación gradual por org piloto
3. **Producción**: 
   - Semana 1: 1 org beta
   - Semana 2: 5 orgs
   - Semana 3: 20% orgs
   - Semana 4: 100% (si métricas OK)

---

## C.3 Dependencias, Riesgos y Mitigaciones

### Dependencias Críticas

| Fase | Dependencia | Impacto | Mitigación |
|------|-------------|---------|------------|
| Fase 1 | Índices Firestore desplegados | Alto | Desplegar índices 2 semanas antes |
| Fase 1 | Feature flags funcionando | Alto | Testear kill-switch en staging |
| Fase 2 | Cloud Functions Scheduler | Medio | Alternativa: Polling manual |
| Fase 3 | Proveedor de email escalable | Medio | Usar Resend con fallback a SendGrid |

### Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance con 1000+ evaluaciones simultáneas | Media | Alto | Paginación, lazy loading, índices optimizados |
| Conflicto con evaluaciones B2C existentes | Baja | Alto | Separación estricta de colecciones |
| Anonimato comprometido por UI bug | Baja | Crítico | Tests E2E específicos, auditoría de queries |
| Emails marcados como spam | Media | Alto | SPF/DKIM/DMARC, warming de dominio |
| Rollback incompleto rompe prod | Baja | Crítico | Feature flags + script de validación |

---

## C.4 Métricas de Éxito

### KPIs Operacionales

| Métrica | Target MVP | Target Enterprise |
|---------|-----------|-------------------|
| **Tasa de respuesta** | >60% | >80% |
| **Tiempo medio de completitud** | <15 min | <12 min |
| **Entregabilidad emails** | >95% | >98% |
| **Tasa de error** | <1% | <0.5% |
| **P95 carga de página** | <3s | <2s |
| **Completitud de datos** | >90% preguntas respondidas | >95% |

### KPIs de Negocio

- **Adopción**: 10+ organizaciones usando campañas 360° en 3 meses
- **Engagement**: 70% de evaluados ven sus reportes
- **Retención**: 80% de orgs repiten campaña en 6 meses
- **NPS evaluadores**: >40

---

# D. LINEAMIENTOS TÉCNICOS CRÍTICOS (MUST)

## D.1 Multi-Tenant con Aislamiento Estricto

**Regla de oro**: Toda query DEBE incluir `orgId` como primer filtro.

```javascript
// ✅ CORRECTO
const q = query(
  collection(db, 'campaigns'),
  where('orgId', '==', currentOrgId),
  where('status', '==', 'active')
);

// ❌ INCORRECTO (no incluye orgId)
const q = query(
  collection(db, 'campaigns'),
  where('status', '==', 'active')
);
```

**Validación en runtime**:
```javascript
// src/services/scopingService.js (extender)
export const assertOrgScoped = (queryRef) => {
  const constraints = queryRef._query.filters;
  const hasOrgIdFilter = constraints.some(f => 
    f.field.canonicalString() === 'orgId'
  );
  
  if (!hasOrgIdFilter) {
    throw new Error('[SECURITY] Query must include orgId filter');
  }
};
```

---

## D.2 Versionado Inmutable con Snapshots

**Regla**: Al activar campaña, snapshot completo del test.

```javascript
// Al activar campaña
const campaign = { /* ... */ };
const testSnapshot = await getTest(orgId, testId, version);

// Guardar snapshot completo en campaign
campaign.testSnapshots = {
  [testId]: {
    version,
    categories: testSnapshot.categories,
    questions: testSnapshot.questions,
    scale: testSnapshot.scale,
    snapshotAt: serverTimestamp()
  }
};

// Evaluadores siempre usan snapshot (no versión live)
const test = campaign.testSnapshots[session.testId];
```

**Beneficio**: Tests pueden evolucionar sin afectar campañas en curso.

---

## D.3 Privacy & Compliance

### D.3.1 Anonimato con Umbrales Mínimos

```javascript
// src/utils/anonymityEngine.js
export const applyAnonymityThresholds = (results, thresholds) => {
  const anonymizedResults = {};
  
  for (const [raterType, responses] of Object.entries(results)) {
    const minRequired = thresholds[raterType] || 3;
    
    if (responses.length < minRequired) {
      // Ocultar grupo completo
      anonymizedResults[raterType] = {
        hidden: true,
        reason: `Menos de ${minRequired} evaluadores`,
        count: responses.length
      };
    } else {
      // Mostrar agregado (sin identidades)
      anonymizedResults[raterType] = {
        scores: aggregateScores(responses),
        count: responses.length,
        // NO incluir: evaluatorIds, timestamps individuales, IPs
      };
    }
  }
  
  return anonymizedResults;
};
```

### D.3.2 Política de Liberación de Resultados

```javascript
// Evaluados NO ven resultados hasta liberación explícita
const canViewResults = (session, userId) => {
  // Verificar ownership
  if (session.evaluateeId !== userId) return false;
  
  // Verificar liberación
  if (!session.results?.releasedAt) return false;
  
  // Verificar estado de campaña
  const campaign = getCampaign(session.campaignId);
  if (campaign.status !== 'completed') return false;
  
  return true;
};
```

### D.3.3 Retención y Borrado de Datos

```javascript
// Políticas de retención
const RETENTION_POLICIES = {
  evaluatorAssignments: {
    duration: 90, // días después de campaña
    action: 'soft_delete' // Mantener metadata, borrar answers
  },
  tokens: {
    duration: 90,
    action: 'hard_delete'
  },
  results: {
    duration: 365 * 2, // 2 años
    action: 'archive' // Mover a cold storage
  },
  auditLogs: {
    duration: 365 * 5, // 5 años (compliance)
    action: 'archive'
  }
};

// Cloud Function programada (diaria)
exports.applyRetentionPolicies = functions.pubsub
  .schedule('0 2 * * *') // 2 AM daily
  .onRun(async (context) => {
    for (const [collection, policy] of Object.entries(RETENTION_POLICIES)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.duration);
      
      const expiredDocs = await db.collection(collection)
        .where('createdAt', '<', cutoffDate)
        .get();
      
      // Aplicar acción según política
      if (policy.action === 'hard_delete') {
        // Borrar permanentemente
      } else if (policy.action === 'soft_delete') {
        // Borrar datos sensibles, mantener metadata
      } else if (policy.action === 'archive') {
        // Mover a cold storage
      }
    }
  });
```

### D.3.4 PII Handling

**Datos considerados PII**:
- Nombres completos de evaluadores (excepto en casos nominativos)
- Emails de evaluadores
- Respuestas individuales a preguntas abiertas
- IPs, timestamps exactos de completitud

**Acceso mínimo**:
```javascript
// Solo admin/owner puede ver IDs de evaluadores
const getEvaluatorDetails = (assignmentId, userId) => {
  const assignment = getAssignment(assignmentId);
  const user = getUser(userId);
  
  // Check permissions
  if (!user.role.includes('ADMIN', 'OWNER')) {
    // Retornar versión anónima
    return {
      raterType: assignment.raterType,
      status: assignment.status,
      completedAt: assignment.completedAt
      // NO incluir: evaluatorId, evaluatorEmail, IP
    };
  }
  
  // Admin ve todo
  return assignment;
};
```

### D.3.5 Auditoría de Acciones Críticas

```javascript
// src/services/auditService.js
export const logAuditEvent = async (event) => {
  await db.collection('auditLogs').add({
    orgId: event.orgId,
    userId: event.userId,
    action: event.action, // 'view_report', 'release_results', 'export_data'
    resource: event.resource, // {type: 'report360', id: '...'}
    timestamp: serverTimestamp(),
    ip: event.ip,
    userAgent: event.userAgent,
    metadata: event.metadata
  });
};

// Uso
await logAuditEvent({
  orgId: currentOrgId,
  userId: currentUserId,
  action: 'view_report_360',
  resource: { type: 'evaluation360Session', id: sessionId },
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  metadata: { raterTypes: ['peers', 'manager'] }
});
```

### D.3.6 Exports Sin PII + Checksums

**Garantía**: Exportaciones NUNCA incluyen PII de evaluadores anónimos.

```javascript
// src/services/exportService.js
export const exportCampaignResults = async (campaignId, orgId, userId) => {
  // 1. Verificar permisos
  await assertAdminOrOwner(orgId, userId);
  
  // 2. Obtener datos agregados (sin PII)
  const sessions = await get360Sessions(campaignId);
  
  const exportData = sessions.map(session => ({
    evaluateeId: session.evaluateeId,
    evaluateeName: session.evaluateeName,
    testId: session.testId,
    testVersion: session.testVersion,
    
    // Scores agregados (SIN identidades individuales)
    results: {
      overall: session.results.aggregated.overall,
      byCategory: session.results.aggregated.byCategory,
      
      // Grupos anónimos (sin nombres/IDs de evaluadores)
      byRaterType: {
        self: session.results.byRaterType.self?.scores || null,
        managers: session.results.byRaterType.managers?.scores || null,
        peers: session.results.byRaterType.peers?.scores || null,
        subordinates: session.results.byRaterType.subordinates?.scores || null
      },
      
      // Metadata de grupos (contadores, NO identidades)
      participationStats: {
        self: session.results.byRaterType.self?.count || 0,
        managers: session.results.byRaterType.managers?.count || 0,
        peers: session.results.byRaterType.peers?.count || 0,
        subordinates: session.results.byRaterType.subordinates?.count || 0
      }
    },
    
    // NO INCLUIR: evaluatorIds, evaluatorEmails, tokens, IPs, timestamps individuales
    
    completedAt: session.results.releasedAt,
    status: session.status
  }));
  
  // 3. Generar checksum para integridad
  const exportContent = JSON.stringify(exportData, null, 2);
  const checksum = generateSHA256(exportContent);
  
  // 4. Metadata del export
  const exportPackage = {
    metadata: {
      exportId: generateUUID(),
      campaignId,
      orgId,
      exportedBy: userId,
      exportedAt: new Date().toISOString(),
      testSnapshot: `${sessions[0].testId}@${sessions[0].testVersion}`,
      recordCount: exportData.length,
      checksum,
      format: 'json',
      version: '1.0'
    },
    data: exportData
  };
  
  // 5. Log de auditoría
  await logAuditEvent({
    orgId,
    userId,
    action: 'export_campaign_results',
    resource: { type: 'campaign', id: campaignId },
    metadata: {
      recordCount: exportData.length,
      checksum
    }
  });
  
  return exportPackage;
};

// Generar checksum SHA-256
const generateSHA256 = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};
```

**Verificación de integridad**:
```javascript
// Cliente puede verificar que el export no fue modificado
const verifyExportIntegrity = (exportPackage) => {
  const { metadata, data } = exportPackage;
  const content = JSON.stringify(data, null, 2);
  const computedChecksum = generateSHA256(content);
  
  return computedChecksum === metadata.checksum;
};
```

### D.3.7 Retención y Borrado (Política Reforzada)

```javascript
// Política de retención actualizada
const RETENTION_POLICIES = {
  evaluatorAssignments: {
    duration: 90, // días después de campaña
    action: 'soft_delete', // Borrar answers, mantener metadata
    piiFields: ['answers', 'ip', 'userAgent']
  },
  
  tokens: {
    duration: 90,
    action: 'hard_delete', // Borrar completamente
    piiFields: ['token', 'evaluatorEmail']
  },
  
  results: {
    duration: 365 * 2, // 2 años
    action: 'archive', // Mover a cold storage
    piiFields: [] // Sin PII en results agregados
  },
  
  auditLogs: {
    duration: 365 * 5, // 5 años (compliance)
    action: 'archive',
    piiFields: ['ip', 'userAgent'] // Mantener userId para trazabilidad
  },
  
  exports: {
    duration: 30, // 30 días
    action: 'log_only', // Solo log de que se descargó, no almacenar archivo
    auditDownloads: true
  }
};

// Auditoría de descargas
const logExportDownload = async (exportId, userId, orgId) => {
  await db.collection('exportDownloads').add({
    exportId,
    userId,
    orgId,
    downloadedAt: serverTimestamp(),
    ip: request.ip,
    userAgent: request.userAgent
  });
  
  // Alerta si usuario descarga demasiadas veces
  const recentDownloads = await db.collection('exportDownloads')
    .where('userId', '==', userId)
    .where('downloadedAt', '>', last24Hours)
    .get();
  
  if (recentDownloads.size > 10) {
    await alertSuspiciousActivity(userId, 'excessive_exports');
  }
};
```

---

## D.4 Idempotencia

### Tokens No Reversibles

```javascript
// Generación de tokens
import crypto from 'crypto';

export const generateUniqueToken = async () => {
  let token, exists;
  
  do {
    // Generar token alfanumérico (sin ambiguos)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin 0,O,1,I
    const segments = [3, 4, 4, 3]; // XXX-XXXX-XXXX-XXX
    
    token = segments
      .map(len => 
        Array.from({length: len}, () => 
          chars[crypto.randomInt(chars.length)]
        ).join('')
      )
      .join('-');
    
    // Verificar unicidad
    exists = await db.collection('evaluatorAssignments')
      .where('token', '==', token)
      .limit(1)
      .get();
      
  } while (!exists.empty);
  
  return token;
};

// Token hash para storage (opcional extra seguridad)
export const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token + process.env.TOKEN_SALT)
    .digest('hex');
};
```

### Recordatorios Sin Duplicados (Idempotencia)

```javascript
// Cloud Function de recordatorios
exports.sendReminders = functions.pubsub
  .schedule('0 9 * * *') // 9 AM daily
  .onRun(async (context) => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Buscar assignments pendientes
    const pendingAssignments = await db
      .collectionGroup('evaluatorAssignments')
      .where('status', 'in', ['pending', 'in_progress'])
      .where('expiresAt', '>', today)
      .get();
    
    let sent = 0, skipped = 0, errors = 0;
    
    for (const doc of pendingAssignments.docs) {
      const assignment = doc.data();
      
      // Calcular días restantes
      const daysUntilExpiry = Math.ceil(
        (assignment.expiresAt.toDate() - today) / (1000 * 60 * 60 * 24)
      );
      
      // Verificar si debe enviar recordatorio HOY
      const campaign = await getCampaign(assignment.campaignId);
      const shouldSend = campaign.config.reminderSchedule.includes(daysUntilExpiry);
      
      if (!shouldSend) {
        skipped++;
        continue;
      }
      
      // IDEMPOTENCIA: Verificar que NO se haya enviado hoy
      const lastReminder = assignment.reminders?.[assignment.reminders.length - 1];
      if (lastReminder) {
        const lastReminderDate = lastReminder.sentAt.toDate().toISOString().split('T')[0];
        if (lastReminderDate === todayKey) {
          console.log(`[Idempotent Skip] Reminder already sent today for ${doc.id}`);
          skipped++;
          continue;
        }
      }
      
      // Verificar límite de recordatorios (máximo 5)
      const reminderCount = assignment.reminders?.length || 0;
      if (reminderCount >= 5) {
        console.log(`[Max Reminders] Already sent 5 reminders for ${doc.id}`);
        skipped++;
        continue;
      }
      
      try {
        // Enviar recordatorio
        await sendReminderEmail(assignment);
        
        // Registrar envío (con idempotency key)
        await doc.ref.update({
          reminders: FieldValue.arrayUnion({
            sentAt: serverTimestamp(),
            type: 'scheduled',
            daysRemaining: daysUntilExpiry,
            idempotencyKey: `${doc.id}-${todayKey}` // Clave única por día
          })
        });
        
        sent++;
      } catch (error) {
        console.error(`[Error] Failed to send reminder for ${doc.id}:`, error);
        errors++;
      }
    }
    
    // Log de resultados
    console.log(`[Reminders Summary] Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);
    
    return {
      success: true,
      sent,
      skipped,
      errors,
      timestamp: today.toISOString()
    };
  });
```

**Tests de Idempotencia** (DoD):
```javascript
// tests/idempotency/reminders.test.js
describe('Reminders Idempotency', () => {
  it('should NOT send duplicate reminder on same day', async () => {
    // 1. Setup: Assignment pendiente
    const assignmentId = await createTestAssignment({
      status: 'pending',
      expiresAt: futureDate(5) // Expira en 5 días
    });
    
    // 2. Ejecutar función de recordatorios (primera vez)
    await sendReminders();
    
    // 3. Verificar que se envió 1 email
    expect(emailsSent).toHaveLength(1);
    
    // 4. Ejecutar función OTRA VEZ (mismo día)
    await sendReminders();
    
    // 5. Verificar que NO se envió otro email (idempotencia)
    expect(emailsSent).toHaveLength(1); // Sigue siendo 1
    
    // 6. Verificar log
    expect(logs).toContain('[Idempotent Skip]');
  });
  
  it('should respect max 5 reminders limit', async () => {
    const assignmentId = await createTestAssignment({
      reminders: Array(5).fill({ sentAt: timestamp }) // Ya tiene 5
    });
    
    await sendReminders();
    
    expect(emailsSent).toHaveLength(0); // No envía más
    expect(logs).toContain('[Max Reminders]');
  });
});
```

### Jobs con Reintentos + Dead Letter

```javascript
// Cloud Tasks para procesamiento asíncrono
const {CloudTasksClient} = require('@google-cloud/tasks');
const tasksClient = new CloudTasksClient();

export const enqueueAggregation = async (session360Id) => {
  const project = 'your-project';
  const queue = 'aggregation-queue';
  const location = 'us-central1';
  const url = 'https://your-function-url/aggregate';
  
  const parent = tasksClient.queuePath(project, location, queue);
  
  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      body: Buffer.from(JSON.stringify({ session360Id })).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    scheduleTime: {
      seconds: Date.now() / 1000 + 10, // 10 seconds from now
    },
  };
  
  // Cloud Tasks automáticamente reintenta con exponential backoff
  // Después de N fallos → dead letter queue
  const [response] = await tasksClient.createTask({parent, task});
  return response.name;
};
```

---

## D.5 Tests en Uso = Read-Only

```javascript
// En TestEditor, verificar si test está en uso
const canEditTest = async (orgId, testId, version) => {
  // Verificar si existe campaña activa usando este test
  const activeCampaigns = await db
    .collection(`orgs/${orgId}/campaigns`)
    .where('status', 'in', ['active', 'closed'])
    .get();
  
  for (const campaign of activeCampaigns.docs) {
    const data = campaign.data();
    const sessions = await db
      .collection(`orgs/${orgId}/evaluation360Sessions`)
      .where('campaignId', '==', campaign.id)
      .where('testId', '==', testId)
      .where('testVersion', '==', version)
      .limit(1)
      .get();
    
    if (!sessions.empty) {
      return {
        canEdit: false,
        reason: 'Test en uso en campaña activa',
        campaignId: campaign.id,
        campaignName: data.title
      };
    }
  }
  
  return { canEdit: true };
};

// En UI
const handleEditTest = async () => {
  const check = await canEditTest(orgId, testId, version);
  
  if (!check.canEdit) {
    showAlert({
      type: 'warning',
      title: 'Test en uso',
      message: `Este test está siendo usado en "${check.campaignName}". 
                 Para hacer cambios, crea una nueva versión.`,
      actions: [
        { label: 'Cancelar' },
        { label: 'Crear Nueva Versión', onClick: () => cloneTest() }
      ]
    });
    return;
  }
  
  // Permitir edición
  navigate(`/admin/tests/${testId}/${version}/edit`);
};
```

---

# E. STACK Y OPERACIÓN

## E.1 Stack Actual vs Propuesto

| Capa | Actual | Propuesto 360° | Justificación |
|------|--------|----------------|---------------|
| **Frontend** | React 18 + Vite | ✅ Mantener | Suficiente, moderno |
| **Backend** | Firebase Functions (Node 18) | ✅ Mantener | Serverless escalable |
| **Base de Datos** | Firestore | ✅ Mantener | Multi-tenant nativo |
| **Auth** | Firebase Auth | ✅ Mantener | + Token anónimo custom |
| **Hosting** | Firebase Hosting | ✅ Mantener | CDN global |
| **Emails** | Resend | ✅ Mantener | 3K/mes gratis, escalable |
| **Scheduler** | ❌ No existe | ➕ Cloud Scheduler + Pub/Sub | Recordatorios automáticos |
| **Queue** | ❌ No existe | ➕ Cloud Tasks | Agregación asíncrona |
| **Storage** | ❌ No existe | ➕ Cloud Storage (opcional) | PDFs generados |

**Cambios mínimos**:
- Agregar Cloud Scheduler para cron jobs
- Agregar Cloud Tasks para procesamiento asíncrono
- Considerar Cloud Storage para PDFs (alternativa: Firestore + base64)

---

## E.2 Scheduler/Colas (Decisión Crítica)

### Opción Recomendada: **Cloud Scheduler + Cloud Tasks (Serverless)**

**Ventajas**:
- ✅ Integración nativa con Firebase Functions
- ✅ Escalado automático
- ✅ Retry automático con exponential backoff
- ✅ Dead letter queue nativo
- ✅ Sin servidores que mantener
- ✅ Pricing basado en uso

**Arquitectura**:

```
Cloud Scheduler (cron)
  ↓ Pub/Sub
Cloud Function (trigger diario)
  → Procesa lote de recordatorios
  → Encola tareas individuales en Cloud Tasks
     ↓
Cloud Function (worker)
  → Procesa tarea individual (enviar 1 email)
  → Max 3 reintentos
  → Si falla → Dead Letter Queue
```

**Implementación**:

```javascript
// functions/src/schedulers/reminders.js

// Trigger diario via Pub/Sub
exports.dailyReminderScheduler = functions.pubsub
  .schedule('0 9 * * *') // 9 AM UTC diario
  .timeZone('America/Mexico_City')
  .onRun(async (context) => {
    const today = new Date();
    
    // Buscar assignments que necesitan recordatorio HOY
    const pendingAssignments = await getPendingAssignments(today);
    
    console.log(`Found ${pendingAssignments.length} assignments needing reminders`);
    
    // Encolar cada uno en Cloud Tasks
    for (const assignment of pendingAssignments) {
      await enqueueReminderTask(assignment.id);
    }
    
    return {success: true, enqueued: pendingAssignments.length};
  });

// Worker que procesa tarea individual con backoff exponencial + DLQ
exports.sendReminderWorker = functions.tasks
  .taskQueue({
    retryConfig: {
      maxAttempts: 5, // Hasta 5 reintentos
      minBackoffSeconds: 60, // 1 minuto inicial
      maxBackoffSeconds: 3600, // 1 hora máximo
      maxDoublings: 4, // Backoff exponencial: 1m, 2m, 4m, 8m, 16m
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
      maxDispatchesPerSecond: 5,
    },
  })
  .onDispatch(async (data) => {
    const { assignmentId, attemptNumber = 1 } = data;
    
    try {
      const assignment = await getAssignment(assignmentId);
      
      // Validar que todavía necesita recordatorio
      if (assignment.status === 'completed') {
        return { skipped: true, reason: 'Already completed' };
      }
      
      // Enviar email
      await sendReminderEmail(assignment);
      
      // Registrar envío exitoso
      await recordReminderSent(assignmentId);
      
      // Limpiar de DLQ si estaba ahí
      await removeFromDLQ(assignmentId);
      
      return { success: true, attemptNumber };
      
    } catch (error) {
      console.error(`[Attempt ${attemptNumber}] Error sending reminder for ${assignmentId}:`, error);
      
      // Si ya intentamos 5 veces, enviar a Dead Letter Queue
      if (attemptNumber >= 5) {
        await sendToDeadLetterQueue({
          type: 'reminder_failed',
          assignmentId,
          campaignId: assignment.campaignId,
          evaluatorEmail: assignment.evaluatorEmail,
          error: error.message,
          attempts: attemptNumber,
          timestamp: new Date().toISOString()
        });
        
        // Alerta crítica
        await alertAdmins({
          severity: 'critical',
          type: 'reminder_dlq',
          message: `Reminder falló 5 veces para ${assignmentId}`,
          assignmentId,
          campaignId: assignment.campaignId
        });
        
        // No re-throw (ya está en DLQ, no reintentar más)
        return { failed: true, dlq: true, attemptNumber };
      }
      
      // Re-throw para que Cloud Tasks reintente con backoff exponencial
      throw error;
    }
  });

// Dead Letter Queue Handler
exports.processDLQ = functions.pubsub
  .schedule('0 */6 * * *') // Cada 6 horas
  .onRun(async (context) => {
    const dlqItems = await getDLQItems({ limit: 100 });
    
    console.log(`[DLQ] Processing ${dlqItems.length} failed items`);
    
    for (const item of dlqItems) {
      // Análisis de errores comunes
      if (item.error.includes('Invalid email')) {
        await markEmailInvalid(item.evaluatorEmail);
      } else if (item.error.includes('Bounce')) {
        await handleBounce(item.evaluatorEmail);
      } else {
        // Error desconocido - requiere investigación manual
        await notifyOpsTeam({
          type: 'dlq_unknown_error',
          item
        });
      }
    }
    
    return { processed: dlqItems.length };
  });
```

**Deduplicación**:
```javascript
// Usar ID de tarea idempotente
const taskName = `reminder-${assignmentId}-${today.toISOString().split('T')[0]}`;
// Si tarea ya existe con ese nombre → skip (no duplicar)
```

---

## E.3 Email Transaccional

### Proveedor Actual: **Resend** (mantener)

**Specs**:
- 3,000 emails/mes gratis
- 100,000 emails/mes = $20 USD
- Bounce/complaints tracking nativo
- Métricas de open/click
- Templates versionados

### Templates 360° Nuevos

```javascript
// src/services/emailTemplates360.js

export const EMAIL_TEMPLATES_360 = {
  INVITATION_PEER: {
    subject: '🎯 Invitación: Evaluación 360° de {{evaluateeName}}',
    html: `...`,
    text: `...`
  },
  INVITATION_MANAGER: {
    subject: '👔 Solicitud de Evaluación 360° - {{evaluateeName}}',
    html: `...`,
    text: `...`
  },
  REMINDER_SOFT: {
    subject: '⏰ Recordatorio: Evaluación 360° pendiente',
    html: `...`,
    text: `...`
  },
  REMINDER_URGENT: {
    subject: '🚨 Último Aviso: Evaluación 360° vence en 24h',
    html: `...`,
    text: `...`
  },
  RESULTS_RELEASED: {
    subject: '📊 Tus Resultados de Evaluación 360° están listos',
    html: `...`,
    text: `...`
  }
};
```

### Bounce/Complaints Handling

```javascript
// Webhook de Resend
exports.handleEmailWebhook = functions.https.onRequest(async (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'email.bounced':
      // Hard bounce → marcar email inválido
      await markEmailInvalid(data.email);
      break;
      
    case 'email.complained':
      // Spam complaint → opt-out automático
      await optOutUser(data.email);
      break;
      
    case 'email.delivered':
      // Success → actualizar stats
      await updateDeliveryStats(data.emailId, 'delivered');
      break;
      
    case 'email.opened':
      // Tracking de apertura
      await trackEmailOpen(data.emailId);
      break;
      
    case 'email.clicked':
      // Tracking de clicks
      await trackEmailClick(data.emailId, data.link);
      break;
  }
  
  res.status(200).send('OK');
});
```

### Fallback Operativo

```javascript
// Si Resend falla (outage)
const sendEmailWithFallback = async (emailData) => {
  try {
    // Intentar Resend (primario)
    return await resend.emails.send(emailData);
  } catch (error) {
    console.error('Resend failed, trying fallback...', error);
    
    // Fallback a SendGrid (secundario)
    return await sendgrid.send({
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });
  }
};
```

---

## E.4 Observabilidad

### E.4.1 KPIs Operacionales

```javascript
// Dashboard métricas en tiempo real

export const OPERATIONAL_KPIS = {
  // Completitud
  completionRate: {
    formula: 'completedAssignments / totalAssignments',
    target: 0.70, // 70%
    alert: 0.50 // Alerta si < 50%
  },
  
  // Tiempo de respuesta
  avgResponseTime: {
    formula: 'avg(completedAt - createdAt)',
    target: 15 * 60 * 1000, // 15 minutos
    alert: 30 * 60 * 1000 // Alerta si >30min
  },
  
  // Bounces
  bounceRate: {
    formula: 'bouncedEmails / sentEmails',
    target: 0.02, // 2%
    alert: 0.05 // Alerta si >5%
  },
  
  // Colas
  queueBacklog: {
    formula: 'tasksPending in Cloud Tasks',
    target: 0,
    alert: 100 // Alerta si >100 tareas atrasadas
  }
};
```

### E.4.2 Alertas Críticas

```javascript
// Cloud Monitoring Alerts

const ALERTS = {
  HIGH_BOUNCE_RATE: {
    condition: 'bounceRate > 0.05 for 1 hour',
    action: 'Email admin + Slack #alerts',
    severity: 'high'
  },
  
  QUEUE_BACKLOG: {
    condition: 'queueBacklog > 100 for 10 minutes',
    action: 'Email admin + Auto-scale workers',
    severity: 'critical'
  },
  
  LOW_COMPLETION_RATE: {
    condition: 'completionRate < 0.30 when campaign >50% time',
    action: 'Notify campaign admin',
    severity: 'medium'
  },
  
  FIRESTORE_ERROR_RATE: {
    condition: 'errorRate > 0.01 for 5 minutes',
    action: 'Email admin + Rollback if recent deploy',
    severity: 'critical'
  }
};
```

### E.4.3 Eventos Clave para Logging (Mínimos Requeridos)

```javascript
// src/services/analyticsService.js

export const logBusinessEvent = async (event) => {
  await db.collection('businessEvents').add({
    orgId: event.orgId,
    type: event.type,
    timestamp: serverTimestamp(),
    data: event.data,
    severity: event.severity || 'info' // info/warning/error/critical
  });
  
  // También enviar a Google Analytics
  gtag('event', event.type, event.data);
  
  // Si es crítico, enviar alerta
  if (event.severity === 'critical' || event.severity === 'error') {
    await sendAlert(event);
  }
};

  // Eventos mínimos requeridos (para métricas y alertas)
const BUSINESS_EVENTS = {
  // Lifecycle de campaña
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_ACTIVATED: 'campaign.activated',
  CAMPAIGN_CLOSED: 'campaign.closed',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  
  // Invitaciones
  INVITATION_SENT: 'invitation.sent',
  INVITATION_BOUNCED: 'invitation.bounced',
  INVITATION_OPENED: 'invitation.opened',
  INVITATION_CLICKED: 'invitation.clicked',
  
  // Evaluaciones
  EVALUATION_STARTED: 'evaluation.started',
  EVALUATION_COMPLETED: 'evaluation.completed',
  EVALUATION_ABANDONED: 'evaluation.abandoned',
  
  // Umbrales y privacidad
  THRESHOLDS_MET: 'thresholds.met',
  THRESHOLDS_NOT_MET: 'thresholds.not_met',
  
  // Resultados
  RESULTS_AGGREGATED: 'results.aggregated',
  RESULTS_RELEASED: 'results.released',
  RESULTS_VIEWED: 'results.viewed',
  
  // Exports y auditoría
  EXPORT_GENERATED: 'export.generated',
  EXPORT_DOWNLOADED: 'export.downloaded',
  
  // Auditoría de lectura sensible (NUEVO)
  SENSITIVE_READ_RESULTS: 'audit.sensitive_read.results',
  SENSITIVE_READ_AGGREGATED: 'audit.sensitive_read.aggregated',
  SENSITIVE_READ_INDIVIDUAL: 'audit.sensitive_read.individual',
  SENSITIVE_READ_EXPORT: 'audit.sensitive_read.export',
  
  // Errores críticos
  TOKEN_ABUSE_DETECTED: 'security.token_abuse',
  CROSS_ORG_ACCESS_DENIED: 'security.cross_org_denied',
  PII_ACCESS_AUDIT: 'security.pii_accessed'
};

// Uso específico para lectura sensible
await logBusinessEvent({
  orgId: currentOrgId,
  type: BUSINESS_EVENTS.SENSITIVE_READ_RESULTS,
  data: {
    session360Id,
    evaluateeId,
    accessedBy: currentUserId,
    accessorRole: currentUserRole, // admin, manager, evaluatee
    raterTypesViewed: ['peers', 'subordinates'], // Qué grupos vio
    filterHash: generateFilterHash({ // Hash del filtro aplicado (para trazabilidad)
      raterTypes: ['peers', 'subordinates'],
      categories: ['leadership', 'communication']
    }),
    timestamp: new Date().toISOString()
  },
  severity: 'info'
});

// Generar hash de filtros para trazabilidad
const generateFilterHash = (filters) => {
  const filterString = JSON.stringify(filters, Object.keys(filters).sort());
  return crypto.createHash('sha256').update(filterString).digest('hex').slice(0, 16);
};

// Uso en el código
await logBusinessEvent({
  orgId: currentOrgId,
  type: BUSINESS_EVENTS.CAMPAIGN_ACTIVATED,
  data: {
    campaignId,
    evaluateesCount: 47,
    totalInvitations: 235
  },
  severity: 'info'
});

await logBusinessEvent({
  orgId: currentOrgId,
  type: BUSINESS_EVENTS.THRESHOLDS_NOT_MET,
  data: {
    session360Id,
    evaluateeName,
    raterType: 'subordinates',
    required: 3,
    actual: 2
  },
  severity: 'warning'
});

await logBusinessEvent({
  orgId: currentOrgId,
  type: BUSINESS_EVENTS.TOKEN_ABUSE_DETECTED,
  data: {
    token,
    ip: request.ip,
    attempts: 15
  },
  severity: 'critical'
});
```

**Métricas derivadas de eventos**:
```javascript
// Dashboard de métricas
const computeCampaignMetrics = async (campaignId) => {
  const events = await db.collection('businessEvents')
    .where('data.campaignId', '==', campaignId)
    .get();
  
  return {
    invitationsSent: countEvents(events, 'invitation.sent'),
    bounceRate: countEvents(events, 'invitation.bounced') / countEvents(events, 'invitation.sent'),
    openRate: countEvents(events, 'invitation.opened') / countEvents(events, 'invitation.sent'),
    clickRate: countEvents(events, 'invitation.clicked') / countEvents(events, 'invitation.sent'),
    completionRate: countEvents(events, 'evaluation.completed') / countEvents(events, 'invitation.sent'),
    abandonmentRate: countEvents(events, 'evaluation.abandoned') / countEvents(events, 'evaluation.started'),
    thresholdIssues: countEvents(events, 'thresholds.not_met'),
    securityIncidents: countEvents(events, /^security\./)
  };
};
```

---

## E.5 Límites por Plan

```javascript
// src/constants/planLimits.js

export const PLAN_LIMITS = {
  FREE: {
    maxActiveUsers: 5,
    maxConcurrentCampaigns: 1,
    maxEvaluateesPerCampaign: 10,
    maxEmailsPerDay: 50,
    maxEmailsPerMonth: 1000,
    maxExportsPerDay: 5,
    maxExportSize: 1000, // rows
    maxTokensPerCampaign: 50,
    features: {
      campaigns360: false,
      advancedReports: false,
      benchmarking: false,
      apiAccess: false
    }
  },
  
  PROFESSIONAL: {
    maxActiveUsers: 50,
    maxConcurrentCampaigns: 5,
    maxEvaluateesPerCampaign: 100,
    maxEmailsPerDay: 500,
    maxEmailsPerMonth: 10000,
    maxExportsPerDay: 20,
    maxExportSize: 10000,
    maxTokensPerCampaign: 500,
    features: {
      campaigns360: true,
      advancedReports: true,
      benchmarking: false,
      apiAccess: false
    }
  },
  
  ENTERPRISE: {
    maxActiveUsers: -1, // Unlimited
    maxConcurrentCampaigns: -1,
    maxEvaluateesPerCampaign: -1,
    maxEmailsPerDay: 5000,
    maxEmailsPerMonth: 100000,
    maxExportsPerDay: -1,
    maxExportSize: -1,
    maxTokensPerCampaign: -1,
    features: {
      campaigns360: true,
      advancedReports: true,
      benchmarking: true,
      apiAccess: true,
      customIntegrations: true,
      dedicatedSupport: true
    }
  }
};

// Middleware para validar cuotas por organización
export const checkOrgQuota = async (orgId, quotaType, increment = 1) => {
  const org = await getOrganization(orgId);
  const plan = org.plan || 'FREE';
  const limit = PLAN_LIMITS[plan][quotaType];
  
  if (limit === -1) return { allowed: true }; // Unlimited
  
  // Obtener uso actual del período
  const currentUsage = await getOrgUsage(orgId, quotaType, getCurrentPeriod());
  
  if (currentUsage + increment > limit) {
    return {
      allowed: false,
      reason: `Límite de ${quotaType} alcanzado`,
      current: currentUsage,
      limit,
      planUpgrade: getRecommendedPlan(org.plan)
    };
  }
  
  return { allowed: true, remaining: limit - currentUsage };
};

// Uso en código
const sendCampaignInvitations = async (campaignId, orgId) => {
  const invitations = await getInvitationsToSend(campaignId);
  
  // Verificar cuota diaria
  const quotaCheck = await checkOrgQuota(
    orgId, 
    'maxEmailsPerDay', 
    invitations.length
  );
  
  if (!quotaCheck.allowed) {
    throw new QuotaExceededError(
      `No puedes enviar ${invitations.length} emails. 
       Límite diario: ${quotaCheck.limit}. 
       Ya usaste: ${quotaCheck.current}.
       Considera actualizar a plan ${quotaCheck.planUpgrade}.`
    );
  }
  
  // Proceder con envío
  await sendInvitations(invitations);
  
  // Incrementar contador de uso
  await incrementOrgUsage(orgId, 'maxEmailsPerDay', invitations.length);
};

// Middleware para validar límites
export const checkPlanLimit = (org, limitKey) => {
  const plan = org.plan || 'FREE';
  const limit = PLAN_LIMITS[plan][limitKey];
  
  if (limit === -1) return true; // Unlimited
  
  const current = org.usage?.[limitKey] || 0;
  return current < limit;
};
```

---

# F. CRITERIOS DE ACEPTACIÓN

## F.1 Funcionales

- [ ] **Jerarquía Organizacional**: Puedo crear Org → 3 Áreas → 5 Departamentos
- [ ] **Job Families**: Puedo crear 5 Job Families con tests recomendados/excluidos
- [ ] **Import CSV**: Puedo importar 100 usuarios con áreas/managers desde CSV
- [ ] **Campaña end-to-end**: 
  - [ ] Crear campaña con 20 evaluados
  - [ ] Asignar 3-5 pares por evaluado
  - [ ] Activar → Enviar 100+ invitaciones
  - [ ] 10+ evaluadores completan vía token
  - [ ] Sistema agrega resultados
  - [ ] Liberar resultados a evaluados
- [ ] **Separación B2B/B2C**: Usuario puede completar autoevaluación (B2C) Y participar en campaña 360° (B2B) sin conflictos
- [ ] **Feature Flags**: Puedo desactivar `360_CAMPAIGNS` y sistema revierte a B2C puro

---

## F.2 No Funcionales

### Performance

- [ ] **P95 < 2s**: En vistas principales con 100 evaluados
  - Dashboard de campaña
  - Listado de assignments
  - Vista de reporte 360°
- [ ] **Paginación efectiva**: Listas de 1000+ items cargan en <1s primera página
- [ ] **Mobile responsive**: Evaluación completable en móvil <15min

### Escalabilidad

- [ ] **100+ usuarios concurrentes**: Sin degradación notable
- [ ] **1000 invitaciones simultáneas**: Se encolan y procesan en <5min
- [ ] **Agregación de 50+ evaluaciones**: Completa en <30s

### Privacy

- [ ] **Umbrales de anonimato aplicados**: Si peers < 3, no muestra segregado
- [ ] **PII protegida**: Evaluado NO puede ver IDs de evaluadores anónimos
- [ ] **Auditoría activa**: Accesos a reportes logged con timestamp/userId

### Accesibilidad (WCAG 2.1 AA)

- [ ] **Contraste mínimo 4.5:1** en todos los textos
- [ ] **Navegación por teclado** funcional en toda la UI
- [ ] **Screen reader compatible** (ARIA labels, roles, live regions)
- [ ] **Textos alternativos** en imágenes/iconos/gráficos
- [ ] **Componentes críticos auditados**:
  - [ ] Wizard de creación de campaña (5 pasos)
  - [ ] Formulario de evaluación (preguntas + navegación)
  - [ ] Tablas con paginación (campaigns, assignments)
  - [ ] Reportes 360° (gráficos radar, tablas)
  - [ ] Modales de confirmación/advertencia
  - [ ] Emails HTML (fallback texto plano)
- [ ] **Tests automatizados**: axe-core en E2E tests
- [ ] **Auditoría manual**: Lighthouse Accessibility Score >90

### i18n (Internacionalización)

- [ ] **ES/EN funcional**: Toda la UI traducida (100%)
- [ ] **Estructura para más idiomas**: Archivos `locales/` preparados
  - [ ] `locales/es.json` (español - base)
  - [ ] `locales/en.json` (inglés - completo)
  - [ ] `locales/pt.json` (portugués - estructura)
  - [ ] `locales/fr.json` (francés - estructura)
- [ ] **Emails multi-idioma**: Templates por locale
- [ ] **Fechas/números localizados**: Formato según idioma
- [ ] **Selector de idioma** en UI (navbar)

**Componentes Críticos a Auditar**:
```javascript
// Lista de componentes para auditoría WCAG 2.1 AA
const CRITICAL_A11Y_COMPONENTS = [
  'src/components/EvaluationWizard.jsx',        // Formulario evaluación
  'src/components/QuestionNavigator.jsx',       // Navegación preguntas
  'src/pages/admin/CampaignWizard.jsx',         // Wizard campaña (nuevo)
  'src/components/Report360Simple.jsx',         // Reporte 360° (nuevo)
  'src/components/ui/DataTable.jsx',            // Tablas paginadas
  'src/components/ui/Modal.jsx',                // Modales
  '360MVP-functions/.../templates/*.html',      // Emails HTML
];

// Cada componente debe pasar:
// - axe-core (0 violations críticas)
// - Keyboard navigation (Tab, Enter, Esc, Arrow keys)
// - Screen reader (NVDA/JAWS/VoiceOver)

// NUEVO: Accesibilidad en Emails HTML
const EMAIL_A11Y_REQUIREMENTS = {
  // 1. Texto alternativo en imágenes
  images: {
    rule: 'Toda imagen debe tener alt descriptivo',
    example: '<img src="logo.png" alt="Logo de 360MVP" />'
  },
  
  // 2. Contraste mínimo
  contrast: {
    rule: 'Ratio mínimo 4.5:1 para textos',
    colors: {
      background: '#ffffff',
      text: '#333333', // Ratio 12.63:1 ✓
      links: '#0066cc', // Ratio 7.27:1 ✓
      buttons: '#ffffff on #0066cc' // Ratio 14.17:1 ✓
    }
  },
  
  // 3. Versión plain text
  plainText: {
    rule: 'Siempre incluir versión text/plain del email',
    example: `
      multipart/alternative
        - text/plain (fallback)
        - text/html (principal)
    `
  },
  
  // 4. Semántica correcta
  semantic: {
    rule: 'Usar elementos semánticos correctos',
    tags: [
      '<h1>, <h2> para títulos',
      '<p> para párrafos',
      '<a> para links (no <span onclick>)',
      '<table> solo para datos tabulares (no layout)',
      'role="button" en CTAs'
    ]
  },
  
  // 5. Responsividad
  responsive: {
    rule: 'Mobile-first con media queries',
    breakpoints: {
      mobile: '320px - 480px',
      tablet: '481px - 768px',
      desktop: '769px+'
    }
  }
};

// Tests de accesibilidad para emails
const testEmailAccessibility = async (emailTemplate) => {
  const checks = {
    hasAltText: checkAllImagesHaveAlt(emailTemplate),
    contrastOK: checkColorContrast(emailTemplate),
    hasPlainText: emailTemplate.includes('text/plain'),
    semanticHTML: checkSemanticTags(emailTemplate),
    responsive: checkMediaQueries(emailTemplate)
  };
  
  const passed = Object.values(checks).every(check => check === true);
  
  if (!passed) {
    throw new A11yError('Email template failed accessibility checks', checks);
  }
  
  return { passed, checks };
};
```

### Observabilidad

- [ ] **Métricas en dashboard**: Completitud, bounces, tiempos de respuesta
- [ ] **Logs estructurados**: Todos los eventos críticos con orgId/userId
- [ ] **Alertas configuradas**: Bounces >5%, queue >100, errors >1%

---

# G. SUPUESTOS Y DECISIONES

## G.1 Ambigüedades del Blueprint Resueltas

| Ambigüedad | Decisión Tomada | Rationale |
|------------|-----------------|-----------|
| "Tokens de un solo uso vs reutilizables" | **Reutilizables durante validez** | Evaluador puede pausar y retomar |
| "Recordatorios: ¿cuántos antes de escalar?" | **3 recordatorios → escalar** | Balance entre insistencia y spam |
| "Umbrales de anonimato: ¿configurable por org?" | **Sí, con mínimo del sistema (3)** | Flexibilidad con piso de seguridad |
| "Subordinados: ¿se auto-detectan o asignan manualmente?" | **Auto-detectados + override manual** | Eficiencia con flexibilidad |
| "Tests en campaña cerrada: ¿se pueden editar?" | **NO, snapshot inmutable** | Integridad de datos históricos |

## G.2 Trade-offs Aceptados para MVP

| Trade-off | Decisión MVP | Plan Futuro |
|-----------|--------------|-------------|
| **Narrativa avanzada** | Solo templates básicos | Fase 2: IA generativa |
| **Benchmarking externo** | Solo interno (por org) | Fase 3: Benchmarks industria |
| **Integración SSO** | Solo email/password | Post-MVP: SAML, OAuth |
| **Evaluadores externos no-email** | No soportado | Post-MVP: SMS, WhatsApp |
| **Multi-idioma completo** | Solo ES/EN | Post-MVP: 10+ idiomas |
| **API REST pública** | No existe | Fase 3 Enterprise |

## G.3 Plan de Compatibilidad con Sistema Existente

### Garantías de No-Regresión

1. **B2C intacto**: 
   - Colección `evaluationSessions` no se toca
   - Rutas `/evaluations` sin cambios
   - Tests existentes funcionan igual

2. **Multi-tenancy reforzado**:
   - Reglas Firestore backward compatible
   - Queries legacy siguen funcionando
   - OrgContext sin breaking changes

3. **Feature flags como kill-switch**:
   - Desactivar `360_CAMPAIGNS` oculta toda UI nueva
   - Sistema revierte a estado pre-360°

### Plan de Rollback

```bash
# Si algo sale mal en producción

# 1. Kill-switch inmediato (sin deploy)
firebase firestore:set 
.env.production VITE_FEATURE_360_CAMPAIGNS=false

# 2. Rollback de código (si necesario)
git revert <commit-360-release>
npm run deploy:production

# 3. Validación post-rollback
npm run test:smoke -- --env=production

# 4. Verificar métricas
# - B2C autoevaluations funcionan
# - Zero cross-org leaks
# - Latencias normales
```

---

## G.4 Preguntas Críticas Respondidas

### 1. ¿El deployment es serverless?

**Respuesta**: **Sí, 100% serverless en Firebase/GCP**.

- Frontend: Firebase Hosting (CDN)
- Backend: Cloud Functions
- DB: Firestore (managed)
- Scheduler: Cloud Scheduler + Cloud Tasks
- Emails: Resend (managed SaaS)

**Impacto**: No hay servidores que provisionar. Escalado automático. Pricing basado en uso real.

---

### 2. ¿Hay datos B2C existentes?

**Respuesta**: **Sí, evaluaciones individuales en `orgs/{orgId}/evaluationSessions`**.

**Plan de migración**: **NO se migran**. Coexisten en colección separada.

- B2C usa: `evaluationSessions`
- B2B usa: `evaluation360Sessions`, `campaigns`, `evaluatorAssignments`

**Zero impacto** en usuarios existentes. Sistema B2C continúa funcionando idéntico.

---

### 3. ¿Qué compliance aplica?

**Respuesta**: **GDPR (Europa), LGPD (Brasil), CCPA (California)** como baseline.

**Implementación**:
- Consentimiento explícito para participar
- Derecho a acceder datos propios
- Derecho a eliminación (con restricciones por auditoría)
- Anonimato garantizado con umbrales
- Retención limitada (2 años results, 5 años audit logs)
- Exportación de datos en formato portable

---

### 4. ¿Límites operativos actuales?

**Respuesta**: Límites conocidos del stack:

| Recurso | Límite Actual | Plan 360° | Mitigación |
|---------|---------------|-----------|------------|
| **Firestore reads** | 50K/día gratis | 500K+/día con campañas | Paginación, cache client-side |
| **Cloud Functions invocations** | 2M/mes gratis | 5M+/mes | Optimizar triggers, batch processing |
| **Emails (Resend)** | 3K/mes gratis | 10K+/mes | Upgrade a plan paid ($20/100K) |
| **Cloud Storage** | 5GB gratis | Minimal (PDFs) | Usar Firestore para PDFs pequeños (<1MB) |

**Costo estimado** para 1000 usuarios activos/mes: **~$150-200 USD/mes** (Firebase + Resend + GCP).

---

### 5. ¿Infra de monitoring existente?

**Respuesta**: **Básica**. Actualmente solo logs de Firebase Console.

**Plan 360°**:
- Integrar **Google Cloud Monitoring** (gratis para Firebase)
- Dashboards custom para KPIs (completitud, bounces, latencias)
- Alertas por email + Slack webhook
- Structured logging con `orgId`, `campaignId`, `userId`

**Alternativa Enterprise**: Datadog/New Relic (si cliente lo requiere, costo extra).

---

# RESUMEN FINAL

## ¿Es viable implementar el sistema 360° sobre el MVP actual?

**✅ SÍ, altamente viable**.

### Fundamentos Sólidos

- ✅ Multi-tenancy robusto
- ✅ Tests dinámicos versionados
- ✅ Infraestructura serverless escalable
- ✅ Sistema de emails operativo
- ✅ RBAC implementado

### Brechas Manejables

- 🟡 Campañas: Nueva entidad, diseño claro
- 🟡 Multi-evaluador: Extensión de wizard existente
- 🟡 Agregación: Nueva lógica, patron definido
- 🟡 Tokens: Sistema independiente, bien acotado

### Riesgos Controlados

- 🔒 Feature flags para rollout gradual
- 🔒 Separación limpia B2C/B2B
- 🔒 Plan de rollback documentado
- 🔒 Tests E2E en cada fase

---

## Timeline Estimado

- **Fase 1 (MVP 360°)**: 6-8 semanas
- **Fase 2 (Avanzado)**: 4-6 semanas
- **Fase 3 (Enterprise)**: 3-4 semanas

**Total**: **3-4 meses** para sistema 360° enterprise-ready.

---

## Siguientes Pasos Inmediatos

### ✅ COMPLETADO
1. ✅ **Roadmap validado y aprobado** con ajustes v1.1
2. ✅ **Análisis del código existente** completo
3. ✅ **Arquitectura propuesta** definida

### 🚀 PRÓXIMO: Arrancar Fase 1

#### Pre-requisitos (Antes de Codear)

```bash
# 1. Provisionar Cloud Scheduler + Cloud Tasks en GCP
# (si aún no existe)
gcloud scheduler jobs create pubsub daily-reminders \
  --schedule="0 9 * * *" \
  --topic=reminders \
  --message-body='{"action":"send_reminders"}'

# 2. Desplegar índices Firestore
firebase deploy --only firestore:indexes

# 3. Crear feature flags en .env.*
cp env.example .env.local
# Agregar:
# VITE_FEATURE_ORG_HIERARCHY=false  # Activar cuando listo
# VITE_FEATURE_JOB_FAMILIES=false
# VITE_FEATURE_360_CAMPAIGNS=false
# VITE_FEATURE_MULTI_RATER=false

# 4. Validar sistema actual funciona
npm run test:smoke
npm run dev
```

#### Orden de Implementación (Fase 1)

**Semana 1-2**: Módulos 1.1 + 1.2 (Jerarquía + Job Families)

**Módulo 1.1 - Jerarquía Organizacional (DoD Mínimos)**:
- [ ] CRUD de Áreas/Subáreas/Deptos con validaciones
  - [ ] Nombres únicos por nivel y path (no duplicados)
  - [ ] Path validation (no ciclos, profundidad máxima 3 niveles)
- [ ] Asignación de manager por unidad (opcional)
  - [ ] Referencial consistente (no ciclos: A no puede ser manager de B si B es manager de A)
  - [ ] Validación al guardar
- [ ] Users extendidos con `areaId` y múltiples `managerIds` tipados
  - [ ] `managerIds: [{ userId, type: 'functional' | 'project' | 'dotted' }]`
  - [ ] Al menos un `managerIds[0].type === 'functional'` (principal)
- [ ] Import CSV con mapeo inteligente
  - [ ] Detección automática de columnas (nombre, email, área, manager)
  - [ ] Reporte de errores y advertencias por fila
  - [ ] Preview antes de confirmar importación
- [ ] RBAC: Solo Org Admin (y Super Admin) pueden crear/editar estructura
  - [ ] Firestore rules actualizadas
  - [ ] UI oculta opciones para roles menores
- [ ] Índices y paginación en listados
  - [ ] Índice: `orgId + parentId + name`
  - [ ] Paginación: 20 items por página

**Módulo 1.2 - Job Families**:
- Crear modelos de datos
- UI Admin básico
- CRUD operations
- Tests unitarios

**Semana 3-4**: Módulo 1.3 (Campañas Core)
- Wizard de campaña (5 pasos)
- Precarga inteligente de evaluadores
- Estados y validaciones

**Semana 5-6**: Módulo 1.4 (Tokens + Invitaciones)
- Generación de tokens únicos
- Protección anti-abuso
- Templates de emails

**Semana 7**: Módulo 1.5 (Evaluación Multi-Rater)
- Extensión de EvaluationWizard
- Guardado en assignments

**Semana 8-9**: Módulo 1.6 (Agregación)
- Lógica de agregación
- Umbrales de anonimato
- Tests de privacidad

**Semana 10**: Módulo 1.7 (Reporte Simple)
- Badges de privacidad
- Vista comparativa
- Liberación controlada

#### ✅ Gate de Arranque (Validación Pre-Implementación)

**CRÍTICO - Validar ANTES de codear**:

- [ ] ✅ **Zona horaria por org**: Explícita en modelo `campaigns` y `organizations`
  - Campo `org.timezone` (default: 'America/Mexico_City')
  - Recordatorios usan `org.timezone` no `server.timezone`
  - Validación de DST (Daylight Saving Time) implementada
  
- [ ] ✅ **Cuotas por plan/org**: Valores por defecto anotados
  - FREE: 50 emails/día, 1 campaña activa
  - PROFESSIONAL: 500 emails/día, 5 campañas activas
  - ENTERPRISE: 5000 emails/día, ilimitadas campañas
  - Middleware `checkOrgQuota()` documentado
  
- [ ] ✅ **Backoff + DLQ**: Explícitos en Scheduler/Colas
  - Backoff exponencial: 1m, 2m, 4m, 8m, 16m (max 5 intentos)
  - Dead Letter Queue para fallos crónicos
  - Alertas a admins cuando item va a DLQ
  - Handler de DLQ cada 6 horas

#### Checklist de Arranque

- [ ] Feature flags creados y en `false`
- [ ] Índices Firestore desplegados
- [ ] Branch `feature/360-mvp` creado
- [ ] Equipo notificado del inicio
- [ ] Ambiente de staging preparado
- [ ] Herramientas de monitoring configuradas

#### Registro de Decisiones Durante Implementación

Documentar en este mismo archivo cualquier:
- Desviación del plan original (con justificación)
- Nueva dependencia técnica descubierta
- Trade-off aceptado durante desarrollo
- Cambio en DoD de algún módulo

**Formato**:
```
### Decisión Fase 1 - [Fecha]
**Contexto**: [Qué surgió]
**Decisión**: [Qué se decidió]
**Alternativas consideradas**: [Qué más se evaluó]
**Consecuencias**: [Impacto]
```

---

**FIN DEL DOCUMENTO**

*Para preguntas o clarificaciones, consultar `docs/blueprint_360_Full.md` y este roadmap.*

**Próxima actualización**: Inicio de implementación Fase 1, Módulo 1.1 (Jerarquía Org)

---

## CHANGELOG DE AJUSTES

### v1.1.1 (2025-01-20) - Afinamientos Pre-Arranque

**Incorporado**:
1. ✅ Zona horaria por org + validación DST en Campañas/Recordatorios
2. ✅ Rate limits expandidos: cuotas por org/plan (emails, campañas, exports, tokens)
3. ✅ Backoff exponencial explícito + Dead Letter Queue con alertas
4. ✅ Pruebas de anonimato con datasets límite (umbral-1) en QA
5. ✅ Compatibilidad de versiones en reportes (no promediar test@v1 con test@v2)
6. ✅ Eventos de auditoría para lectura sensible (results.viewed con filterHash)
7. ✅ Accesibilidad en emails HTML (alt text, contraste, plain text, semántica)

**Gate de Arranque Validado**:
- ✅ Zona horaria explícita en modelo + recordatorios
- ✅ Cuotas por plan documentadas con middleware
- ✅ Backoff + DLQ con handler cada 6h

**DoD Módulo 1.1 Confirmados**:
- CRUD jerarquía con validaciones (nombres únicos, no ciclos)
- Managers tipados (functional/project/dotted)
- Import CSV con mapeo inteligente
- RBAC estricto (solo Org Admin)
- Índices + paginación

**UX/DX Improvements**:
- ✅ Valores por defecto visibles en UI (tooltips, help text)
- ✅ Mensajes de negocio exactos documentados
- ✅ Plantillas de export de ejemplo creadas:
  - `docs/export-template-example.csv` (CSV con estructura completa)
  - `docs/export-template-example-full.md` (PDF individual detallado)

---

## ANEXO A: VALORES POR DEFECTO Y MENSAJES DE NEGOCIO

### A.1 Valores por Defecto Visibles en UI

**Wizard de Campaña - Configuración de Evaluadores**:

```jsx
// UI muestra valores por defecto con tooltips explicativos

const DEFAULT_EVALUATOR_CONFIG = {
  self: {
    required: true,
    label: "Autoevaluación",
    help: "Siempre nominativa. El evaluado se evalúa a sí mismo."
  },
  
  managers: {
    min: 1,
    max: 2,
    required: true,
    label: "Jefes/Supervisores",
    help: "Mínimo 1 jefe requerido. Puede ser nominativo o anónimo según configuración.",
    defaultAnonymous: false
  },
  
  peers: {
    min: 3,
    max: 5,
    required: true,
    label: "Pares/Colegas",
    help: "Mínimo 3 para garantizar anonimato. Se recomienda 3-5 pares del mismo nivel jerárquico.",
    defaultAnonymous: true,
    anonymityThreshold: 3
  },
  
  subordinates: {
    min: 3,
    max: 10,
    required: false, // Solo para roles con equipo
    label: "Subordinados Directos",
    help: "Mínimo 3 para garantizar anonimato. Solo aplica a roles de liderazgo.",
    defaultAnonymous: true,
    anonymityThreshold: 3
  },
  
  external: {
    min: 0,
    max: 2,
    required: false,
    label: "Evaluadores Externos",
    help: "Opcional. Clientes, proveedores o colaboradores externos. Máximo 2.",
    defaultAnonymous: true,
    requiresApproval: true
  }
};

// Ejemplo UI en CampaignWizard
<FormSection title="Configuración de Evaluadores">
  <p className="help-text">
    Define cuántos evaluadores se requieren por tipo. Los valores mostrados son 
    recomendaciones basadas en mejores prácticas.
  </p>
  
  {/* Pares */}
  <FormField>
    <Label>
      Pares/Colegas
      <Tooltip>
        Mínimo 3 para garantizar anonimato. Se recomienda 3-5 pares del mismo 
        nivel jerárquico para obtener perspectivas diversas.
      </Tooltip>
    </Label>
    
    <div className="range-input">
      <span>Mínimo: </span>
      <Input 
        type="number" 
        min={3} 
        value={config.peers.min}
        onChange={handleChange}
      />
      <span className="help-inline">
        (recomendado: 3 - umbral de anonimato)
      </span>
    </div>
    
    <div className="range-input">
      <span>Máximo: </span>
      <Input 
        type="number" 
        max={10} 
        value={config.peers.max}
        onChange={handleChange}
      />
      <span className="help-inline">
        (recomendado: 5 - balance entre diversidad y carga)
      </span>
    </div>
    
    <Checkbox checked={config.peers.anonymous}>
      Mantener anónimos (recomendado)
    </Checkbox>
  </FormField>
  
  {/* Warning si se baja umbral */}
  {config.peers.min < 3 && (
    <Alert type="warning">
      ⚠️ Umbral menor a 3 compromete el anonimato. Los resultados de pares 
      podrían ser identificables. Se recomienda mantener mínimo en 3.
    </Alert>
  )}
</FormSection>
```

**Job Family - Configuración de Tests**:

```jsx
const DEFAULT_TEST_RECOMMENDATIONS = {
  label: "Tests Recomendados",
  help: "Estos tests se sugerirán automáticamente al crear campañas para esta Job Family.",
  placeholder: "Selecciona 1-3 tests recomendados",
  maxRecommended: 3,
  validationMessage: "Al menos 1 test recomendado es requerido"
};

// UI muestra valores por defecto claros
<FormField>
  <Label>
    Tests Recomendados
    <Tooltip>
      Los tests marcados como recomendados se pre-seleccionarán automáticamente 
      al crear una campaña. Máximo 3 recomendados.
    </Tooltip>
  </Label>
  
  <TestMultiSelect
    options={availableTests}
    value={jobFamily.recommendedTests}
    max={3}
    placeholder="Ej: Liderazgo v3, Competencias Gerenciales v2"
  />
  
  {jobFamily.recommendedTests.length === 0 && (
    <Alert type="info">
      💡 Sin tests recomendados, el admin deberá seleccionar manualmente 
      en cada campaña.
    </Alert>
  )}
</FormField>
```

---

### A.2 Mensajes de Negocio Exactos (Textos Finales)

**Para copiar directo al código UI**:

#### Umbrales de Anonimato

```javascript
// messages.js
export const ANONYMITY_MESSAGES = {
  // Cuando umbral NO se cumple
  THRESHOLD_NOT_MET: {
    title: "Grupo oculto por privacidad",
    body: (raterType, actual, required) => 
      `No se muestran resultados de ${raterType} porque solo ${actual} ${actual === 1 ? 'persona completó' : 'personas completaron'} la evaluación (mínimo requerido: ${required} para garantizar anonimato).`,
    example: "No se muestran resultados de Subordinados porque solo 2 personas completaron la evaluación (mínimo requerido: 3 para garantizar anonimato)."
  },
  
  // Cuando SÍ se cumple
  THRESHOLD_MET: {
    badge: (actual, required) => `✅ Anónimo (${actual}/${required}+)`,
    help: "Este grupo cumple el umbral mínimo de anonimato. Las respuestas individuales no son rastreables."
  },
  
  // Warning al crear campaña
  THRESHOLD_WARNING: {
    title: "Posible riesgo de anonimato",
    body: (evaluateeName, raterType, current, required) =>
      `${evaluateeName} solo tiene ${current} ${raterType} asignados, pero el umbral de anonimato es ${required}. Si no todos completan, este grupo podría quedar oculto en el reporte.`,
    action: "Considera asignar más evaluadores o reducir el umbral (no recomendado)."
  }
};
```

#### Compatibilidad de Versiones

```javascript
export const VERSION_COMPATIBILITY_MESSAGES = {
  // Error al intentar promediar versiones diferentes
  INCOMPATIBLE_VERSIONS_ERROR: {
    title: "Versiones de test incompatibles",
    body: (testId, versions) =>
      `No se pueden promediar respuestas del test "${testId}" con versiones diferentes (${versions.join(', ')}). Las preguntas y escalas pueden diferir entre versiones.`,
    action: "Selecciona respuestas de una sola versión o normalízalas manualmente."
  },
  
  // Warning en reporte cuando hay versiones mezcladas
  VERSION_MIX_WARNING: {
    icon: "⚠️",
    title: "Resultados de versiones diferentes (no directamente comparables)",
    body: (versions) =>
      `Este reporte incluye respuestas de diferentes versiones del test (${versions.join(', ')}). Los resultados han sido normalizados, pero pueden no ser directamente comparables debido a diferencias en preguntas o escalas.`,
    disclaimer: "Interpreta estos resultados con precaución."
  },
  
  // Info en export
  VERSION_INFO_EXPORT: {
    note: (testId, version) =>
      `Test usado: ${testId}@${version}. Los resultados solo son comparables con evaluaciones que usen la misma versión.`
  }
};
```

#### Cuotas por Plan Excedidas

```javascript
export const QUOTA_EXCEEDED_MESSAGES = {
  // Email diario
  EMAILS_PER_DAY: {
    title: "Límite de emails diarios alcanzado",
    body: (current, limit, plan) =>
      `Has enviado ${current} emails hoy. Tu plan ${plan} tiene un límite de ${limit} emails por día.`,
    action: (nextPlan, nextLimit) =>
      `Para enviar más emails, considera actualizar a plan ${nextPlan} (${nextLimit} emails/día).`,
    example: "Has enviado 50 emails hoy. Tu plan FREE tiene un límite de 50 emails por día. Para enviar más emails, considera actualizar a plan PROFESSIONAL (500 emails/día)."
  },
  
  // Campañas activas
  CONCURRENT_CAMPAIGNS: {
    title: "Límite de campañas activas alcanzado",
    body: (current, limit, plan) =>
      `Tienes ${current} campañas activas. Tu plan ${plan} permite un máximo de ${limit}.`,
    action: "Cierra o archiva campañas existentes, o actualiza tu plan para gestionar más campañas simultáneas.",
    cta: "Ver planes"
  },
  
  // Exports diarios
  EXPORTS_PER_DAY: {
    title: "Límite de exportaciones diarias alcanzado",
    body: (current, limit, plan) =>
      `Has generado ${current} exportaciones hoy. Tu plan ${plan} tiene un límite de ${limit} exportaciones por día.`,
    action: "Intenta mañana o actualiza a un plan superior para mayor capacidad.",
    remaining: (limit, current) => `Quedan ${limit - current} exportaciones disponibles hoy.`
  },
  
  // Tokens por campaña
  TOKENS_PER_CAMPAIGN: {
    title: "Límite de evaluadores alcanzado",
    body: (current, limit, plan) =>
      `Esta campaña tiene ${current} evaluadores. Tu plan ${plan} permite un máximo de ${limit} tokens por campaña.`,
    action: "Reduce el número de evaluadores o actualiza tu plan.",
    suggestion: "Considera dividir en múltiples campañas más pequeñas."
  },
  
  // Genérico con upgrade CTA
  QUOTA_UPGRADE_CTA: {
    title: "Actualiza tu plan",
    body: "Desbloquea más capacidad y funcionalidades premium.",
    features: (nextPlan) => [
      `✓ ${PLAN_LIMITS[nextPlan].maxEmailsPerDay} emails por día`,
      `✓ ${PLAN_LIMITS[nextPlan].maxConcurrentCampaigns} campañas simultáneas`,
      `✓ ${PLAN_LIMITS[nextPlan].maxExportsPerDay} exportaciones diarias`,
      `✓ Reportes avanzados y benchmarking`
    ],
    cta: "Actualizar ahora"
  }
};
```

#### Validaciones de Estructura Organizacional

```javascript
export const ORG_STRUCTURE_MESSAGES = {
  // Ciclo detectado en managers
  MANAGER_CYCLE_DETECTED: {
    title: "Relación circular detectada",
    body: (personA, personB) =>
      `No puedes asignar a ${personB} como manager de ${personA} porque ${personA} ya es manager (directo o indirecto) de ${personB}. Esto crearía una relación circular.`,
    action: "Verifica la estructura jerárquica y corrige las asignaciones."
  },
  
  // Nombre duplicado
  AREA_NAME_DUPLICATE: {
    title: "Nombre de área duplicado",
    body: (name, parentArea) =>
      `Ya existe un área llamada "${name}" en ${parentArea || 'este nivel'}. Los nombres deben ser únicos dentro del mismo nivel.`,
    action: "Usa un nombre diferente o combina las áreas duplicadas."
  },
  
  // Profundidad máxima
  MAX_DEPTH_EXCEEDED: {
    title: "Profundidad máxima excedida",
    body: "Solo se permiten 3 niveles de jerarquía (Organización → Área → Departamento).",
    action: "No puedes crear más subdivisiones. Reorganiza la estructura si necesitas más granularidad."
  },
  
  // Import CSV error row
  CSV_IMPORT_ERROR_ROW: {
    format: (row, errors) =>
      `Fila ${row}: ${errors.join(', ')}`,
    examples: [
      "Fila 5: Email inválido (juan@ejemplo)",
      "Fila 12: Manager no encontrado (ID: MGR789)",
      "Fila 18: Área inexistente (Ventas LATAM)"
    ]
  }
};
```

#### Estados y Transiciones

```javascript
export const STATE_TRANSITION_MESSAGES = {
  // Campaña no puede activarse
  CAMPAIGN_CANNOT_ACTIVATE: {
    title: "No se puede activar la campaña",
    reasons: {
      NO_EVALUATEES: "No hay evaluados seleccionados.",
      NO_TESTS_ASSIGNED: "Algunos evaluados no tienen test asignado.",
      NO_EVALUATORS: "Algunos evaluados no tienen evaluadores asignados.",
      INVALID_DATES: "Las fechas de inicio/fin son inválidas.",
      MISSING_EMAIL_TEMPLATE: "Falta configurar las plantillas de email."
    },
    action: "Completa la configuración antes de activar."
  },
  
  // Resultados no pueden liberarse
  RESULTS_CANNOT_RELEASE: {
    title: "Resultados no listos para liberación",
    body: (completionRate, minRequired) =>
      `Solo ${completionRate}% de evaluadores han completado (mínimo recomendado: ${minRequired}%). Liberar ahora podría resultar en reportes incompletos.`,
    options: [
      "Esperar a mayor completitud",
      "Enviar recordatorios",
      "Liberar de todas formas (no recomendado)"
    ]
  }
};
```

---

### A.3 Uso en Código

```jsx
// Ejemplo de uso en componente Report360Simple
import { ANONYMITY_MESSAGES } from '@/constants/messages';

const RaterGroupBadge = ({ raterType, count, threshold }) => {
  const isMet = count >= threshold;
  
  if (!isMet) {
    return (
      <Alert type="warning">
        <AlertIcon>🔒</AlertIcon>
        <AlertTitle>{ANONYMITY_MESSAGES.THRESHOLD_NOT_MET.title}</AlertTitle>
        <AlertBody>
          {ANONYMITY_MESSAGES.THRESHOLD_NOT_MET.body(raterType, count, threshold)}
        </AlertBody>
      </Alert>
    );
  }
  
  return (
    <Badge variant="success" tooltip={ANONYMITY_MESSAGES.THRESHOLD_MET.help}>
      {ANONYMITY_MESSAGES.THRESHOLD_MET.badge(count, threshold)}
    </Badge>
  );
};

// Ejemplo en QuotaCheck middleware
import { QUOTA_EXCEEDED_MESSAGES } from '@/constants/messages';

const handleQuotaExceeded = (quotaType, current, limit, plan) => {
  const message = QUOTA_EXCEEDED_MESSAGES[quotaType];
  
  showModal({
    title: message.title,
    body: message.body(current, limit, plan),
    actions: [
      { label: 'Entendido', onClick: closeModal },
      { label: message.cta || 'Ver planes', onClick: goToPlans, variant: 'primary' }
    ]
  });
};
```

