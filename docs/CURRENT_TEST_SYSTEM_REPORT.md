# 📊 Reporte del Estado Actual del Sistema de Tests

**Fecha**: 2025-01-11  
**Versión**: v3d-collapsible-sections  
**Objetivo**: Documentar la estructura y funcionalidad actual para adaptación a 360°

---

## 🎯 Resumen Ejecutivo

El sistema actual implementa un **catálogo de tests administrable multi-tenant** con soporte completo para:

- ✅ **TestDefinitions** versionadas con estados (draft/active/archived/deleted)
- ✅ **Subdimensiones** anidadas dentro de categorías con pesos configurables
- ✅ **Reglas condicionales** para excluir categorías del scoring automáticamente
- ✅ **Motor de scoring avanzado** con normalización de preguntas negativas y pesos
- ✅ **Super Admin** con catálogo global y tests privados por organización
- ✅ **RBAC completo** con 5 roles (OWNER/ADMIN/MANAGER/MEMBER/ANON_RATER)
- ✅ **Multi-tenancy estricto** con aislamiento por `orgId`
- ✅ **Feature flags** para rollback controlado

---

## 🏗️ Diagrama Conceptual Actual

```
Organización (orgId)
├── TestDefinitions (orgs/{orgId}/testDefinitions)
│   ├── Test v1 (draft/active/archived)
│   ├── Test v2 (draft/active/archived)
│   └── Test vN...
│
├── Categories (dentro de TestDefinition)
│   ├── Category 1
│   │   ├── Subdimension 1 (weight: 1-3)
│   │   ├── Subdimension 2 (weight: 1-3)
│   │   └── Conditional Rule (opcional)
│   └── Category N...
│
├── Questions (dentro de TestDefinition)
│   ├── Question 1 (weight: 1-3, isNegative: boolean)
│   ├── Question 2 (weight: 1-3, isNegative: boolean)
│   └── Question N...
│
└── EvaluationSessions (orgs/{orgId}/evaluationSessions)
    ├── Session 1 (userId, testId, version, answers)
    ├── Session 2 (userId, testId, version, answers)
    └── Session N...
```

---

## 📋 Tabla de Entidades Actuales

| Entidad | Archivo Origen | Tipo | Persistencia | Campos Clave |
|---------|----------------|------|--------------|--------------|
| **TestDefinition** | `src/models/TestDefinition.js` | JavaScript Object | `orgs/{orgId}/testDefinitions/{testId}:{version}` | `orgId`, `testId`, `version`, `title`, `status`, `scale`, `categories`, `questions` |
| **Category** | Dentro de TestDefinition | JavaScript Object | Dentro de TestDefinition | `id`, `name`, `color`, `weight`, `isConditional`, `conditionalRule`, `subdimensions` |
| **Subdimension** | Dentro de Category | JavaScript Object | Dentro de Category | `id`, `name`, `description`, `weight` |
| **Question** | Dentro de TestDefinition | JavaScript Object | Dentro de TestDefinition | `id`, `category`, `subdimension`, `text`, `weight`, `type`, `isNegative` |
| **Scale** | Dentro de TestDefinition | JavaScript Object | Dentro de TestDefinition | `min`, `max`, `labels` |
| **Weight** | En Category/Subdimension/Question | Number | En cada entidad | `1-3` (configurable) |
| **Polarity** | En Question (`isNegative`) | Boolean | En Question | `true` = pregunta negativa (reverse scoring) |
| **Visibility** | En TestDefinition | String | En TestDefinition | `'public'` o `'private'` + `allowedOrgs[]` |
| **Version** | En TestDefinition | String | En TestDefinition | `'v1'`, `'v2'`, etc. |
| **Status** | En TestDefinition | String | En TestDefinition | `'draft'`, `'active'`, `'archived'`, `'deleted'` |
| **ConditionalRule** | En Category | JavaScript Object | En Category | `condition: {questionId, operator, value}`, `action` |

---

## 🔄 Flujos Actuales

### 1. Creación/Edición de Tests
```
Admin → TestEditor → TestDefinitionService → Firestore
```
- **Componente**: `src/components/TestEditor.jsx`
- **Servicio**: `src/services/testDefinitionService.js`
- **Validaciones**: `validateTestDefinition()` en `TestDefinition.js`
- **Estados**: Solo drafts son editables, activos requieren duplicación

### 2. Activación/Archivado
```
Admin → TestsAdmin → activateTest/archiveTest → Firestore
```
- **Componente**: `src/pages/admin/TestsAdmin.jsx`
- **Lógica**: Solo una versión activa por `testId`, otras se desactivan automáticamente

### 3. Evaluación Dinámica
```
Usuario → Evaluation.jsx → EvaluationContextV2 → TestDefinition → Wizard
```
- **Contexto**: `src/context/EvaluationContextV2.jsx`
- **Carga**: TestDefinition desde Firestore basado en `testId` y `version`
- **Namespacing**: `orgId:userId:testId:version`

### 4. Scoring Inteligente
```
Answers → scoringEngine.js → calculateTestScore() → Results
```
- **Motor**: `src/utils/scoringEngine.js`
- **Features**: Normalización de negativas, pesos, reglas condicionales, subdimensiones

---

## 📄 Ejemplo JSON Real

```json
{
  "orgId": "org_abc123",
  "testId": "leadership",
  "version": "v1",
  "title": "Evaluación de Liderazgo 360°",
  "description": "Test completo de habilidades de liderazgo",
  "status": "active",
  "visibility": "private",
  "allowedOrgs": ["org_xyz789"],
  "scale": {
    "min": 1,
    "max": 5,
    "labels": {
      "1": "Muy bajo",
      "2": "Bajo",
      "3": "Medio",
      "4": "Alto",
      "5": "Muy alto"
    }
  },
  "categories": [
    {
      "id": "vision",
      "name": "Visión Estratégica",
      "description": "Capacidad de visión a largo plazo",
      "color": "#3b82f6",
      "weight": 1,
      "isConditional": false,
      "conditionalRule": null,
      "subdimensions": [
        {
          "id": "strategic_thinking",
          "name": "Pensamiento Estratégico",
          "description": "Capacidad de análisis estratégico",
          "weight": 2
        },
        {
          "id": "future_planning",
          "name": "Planificación Futura",
          "description": "Habilidad para planificar a futuro",
          "weight": 1
        }
      ]
    },
    {
      "id": "team_management",
      "name": "Gestión de Equipos",
      "description": "Habilidades para gestionar equipos",
      "color": "#10b981",
      "weight": 1,
      "isConditional": true,
      "conditionalRule": {
        "condition": {
          "questionId": "P_CAT2_SUB1_Q1",
          "operator": "equals",
          "value": "No"
        },
        "action": "exclude_from_scoring"
      },
      "subdimensions": [
        {
          "id": "team_leadership",
          "name": "Liderazgo de Equipo",
          "description": "Habilidades para liderar equipos",
          "weight": 1
        }
      ]
    }
  ],
  "questions": [
    {
      "id": "P_CAT1_SUB1_Q1",
      "category": "vision",
      "subdimension": "strategic_thinking",
      "text": "¿Cómo evalúas tu capacidad de análisis estratégico?",
      "weight": 2,
      "type": "scale",
      "isNegative": false,
      "help": "Evalúa tu habilidad para analizar situaciones estratégicamente"
    },
    {
      "id": "P_CAT1_SUB2_Q1",
      "category": "vision",
      "subdimension": "future_planning",
      "text": "¿Planificas a largo plazo?",
      "weight": 1,
      "type": "scale",
      "isNegative": true,
      "help": "Pregunta negativa: respuestas altas se invierten"
    },
    {
      "id": "P_CAT2_SUB1_Q1",
      "category": "team_management",
      "subdimension": "team_leadership",
      "text": "¿Tienes un equipo a tu cargo?",
      "weight": 1,
      "type": "scale",
      "isNegative": false,
      "help": "Pregunta de filtro condicional"
    },
    {
      "id": "P_CAT2_SUB1_Q2",
      "category": "team_management",
      "subdimension": "team_leadership",
      "text": "¿Cómo evalúas tu capacidad para motivar a tu equipo?",
      "weight": 3,
      "type": "scale",
      "isNegative": false,
      "help": "Pregunta con peso alto"
    }
  ],
  "scoring": {
    "method": "weighted_average",
    "rules": {}
  },
  "createdAt": "2025-01-11T10:00:00Z",
  "updatedAt": "2025-01-11T10:30:00Z",
  "createdBy": "user_123",
  "updatedBy": "user_123",
  "publishedAt": "2025-01-11T10:30:00Z",
  "publishedBy": "user_123"
}
```

---

## 📁 Archivos y Paths Relevantes

### Modelos y Tipos
- `src/models/TestDefinition.js` - Modelo principal con validaciones
- `src/utils/scoringEngine.js` - Motor de scoring avanzado
- `src/utils/testConditionalRules.js` - Tests de validación

### Componentes UI
- `src/components/TestEditor.jsx` - Editor principal con secciones desplegables
- `src/components/TestEditor.css` - Estilos del editor
- `src/components/UnifiedTestManagement.jsx` - Gestión unificada de categorías/subdimensiones
- `src/components/UnifiedTestManagement.css` - Estilos de navegación jerárquica
- `src/pages/admin/TestsAdmin.jsx` - Panel de administración
- `src/pages/admin/TestsAdmin.css` - Estilos del panel admin

### Servicios y Persistencia
- `src/services/testDefinitionService.js` - CRUD para tests de organización
- `src/services/globalTestDefinitionService.js` - CRUD para tests globales (Super Admin)
- `src/services/organizationService.js` - Listado de organizaciones
- `firestore.rules` - Reglas de seguridad multi-tenant

### Contextos y Estado
- `src/context/EvaluationContextV2.jsx` - Contexto dinámico de evaluación
- `src/context/AuthContext.jsx` - Autenticación
- `src/context/OrgContext.jsx` - Contexto de organización

### Rutas y Navegación
- `src/App.jsx` - Rutas principales (`/admin/tests`, `/evaluations/:testId/:version`)
- `src/pages/Evaluation.jsx` - Página de evaluación con selector dinámico
- `src/components/EvaluationWizard.jsx` - Wizard de evaluación

### Legacy y Migración
- `src/constants/questionBank.js` - Banco de preguntas original (legacy)
- `src/utils/migrateQuestionBank.js` - Migración idempotente a TestDefinition
- `src/context/EvaluationContext.jsx` - Contexto legacy (V1)

---

## ❌ Gaps Conocidos (No Implementados)

### Funcionalidades 360° Específicas
- **Multi-evaluador**: No existe soporte para `raterModes` (self/peer/manager/direct)
- **Agregación de respuestas**: No hay lógica para combinar múltiples evaluadores
- **Anonimización**: No se implementa anonimización de respuestas entre pares
- **Tokens de evaluación**: No hay sistema de invitaciones por token
- **Asignaciones de equipo**: No existe gestión de `teamId` para MANAGER

### Tipos de Preguntas Avanzados
- **NPS**: No existe soporte para Net Promoter Score
- **Texto libre**: Solo existe `QUESTION_TYPES.TEXT` pero no se usa en la UI
- **Multiple choice**: Solo existe `QUESTION_TYPES.MULTIPLE_CHOICE` pero no se implementa
- **Boolean**: Solo existe `QUESTION_TYPES.BOOLEAN` pero no se usa

### Import/Export
- **Export JSON**: No existe funcionalidad de exportar tests
- **Import JSON**: No existe funcionalidad de importar tests
- **Schema Versioning**: No existe `schemaVersion` para compatibilidad
- **Biblioteca de templates**: No hay catálogo de tests predefinidos

### Analytics y Reportes
- **Comparativas 360°**: No existen reportes comparativos entre evaluadores
- **Tendencias temporales**: No hay seguimiento de evolución por evaluador
- **Benchmarks**: No existen comparativas con estándares de industria

### Funcionalidades Avanzadas
- **Branches condicionales**: Solo existen reglas de exclusión, no ramas de preguntas
- **Preguntas dependientes**: No hay lógica para mostrar preguntas basadas en respuestas anteriores
- **Timeouts**: No existe límite de tiempo para completar evaluaciones
- **Progreso granular**: Solo existe progreso por categoría, no por subdimensión individual

---

## 🔧 Limitaciones Técnicas Actuales

### Base de Datos
- **Índices limitados**: Solo existen índices básicos por `orgId` y `status`
- **Consultas complejas**: No hay soporte para consultas cross-collection eficientes
- **Paginación**: No se implementa paginación en listados de tests

### Performance
- **Carga completa**: Se cargan todos los tests de una organización en memoria
- **Sin caché**: No existe sistema de caché para TestDefinitions
- **Sin lazy loading**: Todas las preguntas se cargan de una vez

### Validaciones
- **Validaciones básicas**: Solo validaciones de estructura, no de lógica de negocio
- **Sin validación de reglas condicionales**: No se valida que las reglas sean coherentes
- **Sin validación de pesos**: No se valida que los pesos sumen correctamente

---

## 🎯 Conclusión

El sistema actual es **sólido y extensible** para adaptación a 360°. La arquitectura multi-tenant, el motor de scoring avanzado y la estructura de subdimensiones proporcionan una base excelente. Los principales gaps están en:

1. **Multi-evaluador**: Implementar `raterModes` y agregación
2. **Anonimización**: Sistema de tokens y ocultación de identidades
3. **Reportes 360°**: Comparativas y análisis multi-evaluador
4. **Asignaciones**: Gestión de equipos y evaluadores

La migración a 360° sería principalmente **extensión** de la estructura actual, no reescritura.
