# 🔄 Flujo de Trabajo Completo del Negocio - 360MVP

## 📋 Resumen Ejecutivo

**360MVP** es una plataforma B2B para evaluaciones 360° que permite a organizaciones gestionar evaluaciones multi-evaluador de sus miembros. El sistema evoluciona desde autoevaluaciones individuales (B2C) hacia evaluaciones 360° completas (B2B).

---

## 👥 Roles del Sistema

### **1. Super Admin** (Plataforma)
- **Identificación**: Email `reha01@gmail.com` (hardcodeado)
- **Scope**: Toda la plataforma (multi-tenant)
- **Capacidades**:
  - ✅ Crear/editar/eliminar tests globales
  - ✅ Asignar tests a organizaciones (públicos/privados)
  - ✅ Ver todas las organizaciones
  - ✅ Gestionar catálogo global de tests
  - ✅ Configurar visibilidad de tests (`public` / `private`)

### **2. Owner** (Organización)
- **Scope**: Su organización completa
- **Capacidades**:
  - ✅ CRUD completo de tests organizacionales
  - ✅ Gestionar miembros (importar, editar, eliminar)
  - ✅ Configurar estructura organizacional (Áreas, Job Families)
  - ✅ Crear y activar campañas 360°
  - ✅ Ver todas las evaluaciones y reportes
  - ✅ Gestionar roles de miembros

### **3. Admin** (Organización)
- **Scope**: Su organización completa
- **Capacidades**:
  - ✅ CRUD completo de tests organizacionales
  - ✅ Gestionar miembros (importar, editar)
  - ✅ Configurar estructura organizacional
  - ✅ Crear y activar campañas 360°
  - ✅ Ver todas las evaluaciones y reportes
  - ❌ No puede cambiar roles de miembros (solo Super Admin)

### **4. Manager** (Organización)
- **Scope**: Su equipo específico (`teamId`)
- **Capacidades**:
  - ✅ Ver tests activos
  - ✅ Asignar evaluaciones a su equipo
  - ✅ Ver evaluaciones de su equipo (agregadas/anonimizadas)
  - ✅ Ver reportes agregados de su equipo
  - ❌ No puede crear tests ni campañas
  - ❌ No ve datos individuales fuera de su scope

### **5. Member** (Organización)
- **Scope**: Solo sus propios datos
- **Capacidades**:
  - ✅ Ver tests activos asignados
  - ✅ Realizar auto-evaluaciones
  - ✅ Ver sus propios resultados
  - ✅ Responder evaluaciones 360° asignadas (como evaluador)
  - ❌ No puede ver datos de otros miembros
  - ❌ No puede crear tests ni campañas

### **6. ANON_RATER** (Externo)
- **Scope**: Solo evaluación asignada vía token
- **Capacidades**:
  - ✅ Responder evaluación 360° vía token único
  - ❌ Sin acceso a resultados
  - ❌ Sin acceso a la plataforma

---

## 🔄 Flujo de Trabajo Completo

### **FASE 1: Configuración Inicial (Super Admin + Org Admin)**

#### **1.1 Super Admin Configura Tests Globales**
```
Super Admin
  ↓
1. Crea test global en catálogo
   - Define preguntas, scoring, dimensiones
   - Configura visibilidad: 'public' o 'private'
  ↓
2. Si es 'private':
   - Selecciona organizaciones en 'allowedOrgs[]'
   - Test queda asignado solo a esas orgs
  ↓
3. Si es 'public':
   - Test disponible para TODAS las organizaciones
```

**Estado Actual**: ✅ **IMPLEMENTADO**
- Super Admin puede crear/editar tests
- Sistema de visibilidad funciona
- `getTestsForOrg()` filtra correctamente

---

#### **1.2 Org Admin Configura Organización**
```
Org Admin (Owner/Admin)
  ↓
1. Configura Estructura Organizacional
   - Crea Áreas (departamentos: Ventas, TI, Marketing)
   - Crea Job Families (categorías: Gerentes, Analistas)
  ↓
2. Importa Miembros
   - Descarga plantilla Excel (con referencias de Áreas/Job Families)
   - Completa datos: Email, Nombre, Job Family, Área
   - Sube CSV → Cloud Function procesa
   - Todos los miembros tienen role='member' por defecto
  ↓
3. Asigna Roles (Solo Super Admin puede cambiar roles)
   - Edita miembro individual
   - Cambia rol si es Super Admin
```

**Estado Actual**: ✅ **IMPLEMENTADO**
- Módulo Organización completo
- Módulo Miembros completo
- Importación masiva funcional

---

### **FASE 2: Creación de Campaña 360° (Org Admin)**

#### **2.1 Wizard de Campaña (5 Pasos)**
```
Org Admin
  ↓
Paso 1: Información General
  - Título, descripción, tipo de campaña
  - Fechas (inicio, fin)
  - Zona horaria
  - Recordatorios automáticos
  ↓
Paso 2: Selección de Evaluados
  - Filtros: Job Family, Área, o selección manual
  - Búsqueda de usuarios
  - Vista previa de evaluados seleccionados
  ↓
Paso 3: Asignación de Tests
  - Ve solo tests asignados a su org:
    * Tests públicos (visibility='public')
    * Tests privados donde orgId está en allowedOrgs[]
  - Asigna tests a evaluados (por Job Family o individual)
  ↓
Paso 4: Reglas de Evaluadores
  - Configura quién evalúa:
    * Self (auto-evaluación): ✅ requerido
    * Manager (jefe): ✅ requerido
    * Peers (pares): min 3, max 5
    * Subordinates (subordinados): min 0
    * External (externos): min 0
  - Umbrales de anonimato (mínimos para mostrar resultados)
  ↓
Paso 5: Revisión y Activación
  - Resumen completo de la campaña
  - Validación de datos
  - Opciones: "Guardar Borrador" o "Crear y Activar"
```

**Estado Actual**: ✅ **WIZARD COMPLETO** (falta activación real)
- Todos los pasos funcionan
- Datos se guardan correctamente
- Validaciones implementadas
- ❌ **PENDIENTE**: Generación automática de evaluadores
- ❌ **PENDIENTE**: Envío de invitaciones

---

### **FASE 3: Activación de Campaña (Sistema Automático)**

#### **3.1 Generación de Evaluadores** ⏳ **PENDIENTE**
```
Sistema (al activar campaña)
  ↓
Por cada evaluado en la campaña:
  1. Obtiene Job Family del evaluado
  2. Aplica reglas de evaluadores configuradas:
     - Self: Crea auto-evaluación
     - Manager: Busca jefe en jerarquía
     - Peers: Busca pares en misma Job Family/Área
     - Subordinates: Busca subordinados directos
     - External: Permite agregar evaluadores externos
  3. Valida umbrales de anonimato
  4. Crea documentos en Firestore:
     - evaluation360Sessions (sesión por evaluado)
     - evaluatorAssignments (asignación por evaluador)
```

**Estado Actual**: ❌ **NO IMPLEMENTADO**
- Lógica de generación automática pendiente
- Servicio `evaluatorAssignmentService` existe pero incompleto

---

#### **3.2 Envío de Invitaciones** ⏳ **PENDIENTE**
```
Sistema (después de generar evaluadores)
  ↓
Por cada evaluatorAssignment:
  1. Genera token único
  2. Crea documento en 'invitations':
     - token, evaluatorId, eval360SessionId
     - status: 'pending'
     - expiresAt, createdAt
  3. Envía email con link único:
     - Link: /evaluate/{token}
     - Incluye contexto: nombre del evaluado, test asignado
  4. Actualiza estado: 'sent'
```

**Estado Actual**: ❌ **NO IMPLEMENTADO**
- Sistema de tokens pendiente
- Envío masivo de emails pendiente
- Tracking de invitaciones pendiente

---

### **FASE 4: Evaluación 360° (Evaluadores)**

#### **4.1 Evaluador Recibe Invitación**
```
Evaluador (Member/Manager/External)
  ↓
1. Recibe email con link único
   - Link: /evaluate/{token}
  ↓
2. Click en link → Valida token
   - Verifica que token existe y no expiró
   - Verifica que evaluación está activa
  ↓
3. Accede a evaluación
   - Ve nombre del evaluado
   - Ve test asignado
   - Ve preguntas del test
  ↓
4. Completa evaluación
   - Responde preguntas
   - Guarda progreso (auto-save)
   - Puede pausar y continuar después
  ↓
5. Envía evaluación
   - Valida que todas las preguntas estén respondidas
   - Confirma envío
   - Estado cambia a 'completed'
```

**Estado Actual**: 🟡 **PARCIAL**
- `EvaluationWizard` existe para autoevaluaciones
- ❌ Falta adaptar para modo 360° (raterMode)
- ❌ Falta validación de tokens
- ❌ Falta ruta `/evaluate/{token}`

---

#### **4.2 Auto-Evaluación (Evaluado)**
```
Evaluado (Member)
  ↓
1. Accede a su dashboard
   - Ve campañas activas donde es evaluado
   - Ve evaluación pendiente (self)
  ↓
2. Completa auto-evaluación
   - Mismo flujo que evaluador externo
   - Ve sus propias respuestas
  ↓
3. Envía auto-evaluación
   - Estado: 'self_completed'
```

**Estado Actual**: ✅ **IMPLEMENTADO** (como autoevaluación B2C)
- Flujo de evaluación individual funciona
- Falta integrar con campañas 360°

---

### **FASE 5: Agregación y Resultados** ⏳ **PENDIENTE**

#### **5.1 Agregación de Respuestas**
```
Sistema (cuando se completa evaluación 360°)
  ↓
1. Verifica umbrales de anonimato
   - Peers: mínimo 3 respuestas
   - Subordinates: mínimo 3 respuestas
   - External: mínimo 1 respuesta
  ↓
2. Si se cumplen umbrales:
   - Agrega respuestas por dimensión
   - Calcula promedios
   - Mantiene anonimato (no muestra respuestas individuales)
  ↓
3. Si NO se cumplen umbrales:
   - Marca dimensión como "insuficientes evaluadores"
   - No muestra resultados agregados
   - Espera más respuestas
  ↓
4. Genera resultados finales
   - Score general
   - Scores por dimensión
   - Comparación con auto-evaluación
   - Insights y recomendaciones
```

**Estado Actual**: ❌ **NO IMPLEMENTADO**
- Lógica de agregación pendiente
- Umbrales de anonimato no aplicados
- Comparación auto vs 360° pendiente

---

#### **5.2 Liberación de Resultados**
```
Org Admin / Manager
  ↓
1. Monitorea progreso de campaña
   - Ve tasa de respuesta
   - Ve evaluaciones completadas vs pendientes
  ↓
2. Cuando está listo:
   - Libera resultados al evaluado
   - O programa liberación automática (fecha)
  ↓
3. Evaluado accede a resultados
   - Ve su reporte 360° completo
   - Ve comparación con auto-evaluación
   - Ve insights y recomendaciones
```

**Estado Actual**: ❌ **NO IMPLEMENTADO**
- Dashboard de monitoreo pendiente
- Sistema de liberación pendiente
- Reportes 360° pendientes

---

### **FASE 6: Acciones Masivas y Gestión** ⏳ **PENDIENTE**

#### **6.1 Reenvío de Invitaciones**
```
Org Admin
  ↓
1. Accede a "Acciones Masivas"
   - Ve campañas activas
   - Filtra por estado (pendientes, completadas)
  ↓
2. Selecciona evaluaciones pendientes
   - Múltiple selección
   - Filtros: por área, Job Family, fecha
  ↓
3. Reenvía invitaciones
   - Sistema envía emails idempotentes
   - No duplica invitaciones ya enviadas
   - Tracking de reenvíos
```

**Estado Actual**: 🟡 **PARCIAL**
- Componente `BulkActionsManager` existe
- ❌ Lógica de reenvío pendiente
- ❌ Persistencia en Firestore pendiente

---

#### **6.2 Extensión de Deadlines**
```
Org Admin
  ↓
1. Selecciona campaña/evaluaciones
  ↓
2. Extiende fecha de vencimiento
   - Nueva fecha límite
   - Notificación automática a evaluadores
  ↓
3. Sistema actualiza deadlines
   - Persiste en Firestore
   - Recalcula recordatorios
```

**Estado Actual**: ❌ **NO IMPLEMENTADO**
- Lógica de extensión pendiente
- Persistencia pendiente

---

## 🔗 Interacciones entre Roles

### **Super Admin ↔ Org Admin**
- **Super Admin asigna tests** → **Org Admin los ve en Wizard**
- **Super Admin crea tests públicos** → **Todas las orgs los ven**
- **Super Admin crea tests privados** → **Solo orgs en `allowedOrgs[]` los ven**

### **Org Admin ↔ Members**
- **Org Admin crea campaña** → **Members reciben invitaciones**
- **Org Admin importa miembros** → **Members tienen role='member' por defecto**
- **Org Admin configura estructura** → **Members se asignan a Áreas/Job Families**

### **Manager ↔ Team Members**
- **Manager ve evaluaciones de su equipo** (agregadas/anonimizadas)
- **Manager puede asignar evaluaciones** a su equipo
- **Manager NO ve datos individuales** fuera de su scope

### **Member ↔ Evaluadores**
- **Member es evaluado** → **Múltiples evaluadores responden**
- **Member también es evaluador** → **Evalúa a otros miembros**
- **Member ve sus propios resultados** → **Cuando Org Admin libera**

---

## 📊 Estado de Implementación por Fase

| Fase | Componente | Estado | Completitud |
|------|-----------|--------|-------------|
| **Fase 1** | Configuración Tests (Super Admin) | ✅ | 100% |
| **Fase 1** | Configuración Organización | ✅ | 100% |
| **Fase 1** | Importación Miembros | ✅ | 100% |
| **Fase 2** | Wizard de Campaña | ✅ | 100% |
| **Fase 3** | Generación Evaluadores | ❌ | 0% |
| **Fase 3** | Envío Invitaciones | ❌ | 0% |
| **Fase 4** | Evaluación 360° | 🟡 | 40% |
| **Fase 5** | Agregación Resultados | ❌ | 0% |
| **Fase 5** | Liberación Resultados | ❌ | 0% |
| **Fase 6** | Acciones Masivas | 🟡 | 30% |

**Progreso General**: ~45% del flujo completo implementado

---

## 🎯 Flujo Objetivo (Hacia Dónde Vamos)

### **Visión Completa**
```
1. Super Admin configura catálogo global de tests
   ↓
2. Org Admin configura organización (Áreas, Job Families, Miembros)
   ↓
3. Org Admin crea campaña 360° (Wizard 5 pasos)
   ↓
4. Sistema genera evaluadores automáticamente
   ↓
5. Sistema envía invitaciones masivas
   ↓
6. Evaluadores completan evaluaciones
   ↓
7. Sistema agrega respuestas (respetando anonimato)
   ↓
8. Org Admin libera resultados
   ↓
9. Evaluado ve su reporte 360° completo
   ↓
10. Org Admin puede comparar campañas, exportar datos, etc.
```

### **Próximos Pasos Críticos**
1. **Generación automática de evaluadores** (Fase 3)
2. **Sistema de tokens e invitaciones** (Fase 3)
3. **Agregación de respuestas 360°** (Fase 5)
4. **Dashboard de monitoreo** (Fase 5)
5. **Acciones masivas completas** (Fase 6)

---

## 📝 Notas Técnicas

### **Separación B2C vs B2B**
- **B2C (Actual)**: `evaluationSessions` - Autoevaluaciones individuales
- **B2B (Nuevo)**: `evaluation360Sessions` + `evaluatorAssignments` - Evaluaciones 360°

### **Multi-Tenancy**
- Todos los datos están scoped por `orgId`
- Roles y permisos validados en Firestore Rules
- Aislamiento completo entre organizaciones

### **Feature Flags**
- `VITE_FEATURE_360_CAMPAIGNS`: Controla visibilidad de campañas
- `VITE_FEATURE_JOB_FAMILIES`: Controla Job Families
- Permite rollout gradual sin romper producción

---

**Última Actualización**: Diciembre 2024  
**Estado**: Fase 1-2 completas, Fase 3-6 en desarrollo





