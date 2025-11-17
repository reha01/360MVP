# 📋 Tareas Pendientes - Sprint Actual

**Fecha de Revisión**: 2025-11-14  
**Estado del Sprint**: En progreso - Gestión de Miembros y Acciones Masivas

---

## ✅ Completado en este Sprint

### Gestión de Miembros (`/gestion/miembros`)
- ✅ Importación de miembros desde CSV
- ✅ Visualización de miembros en tabla
- ✅ Edición individual de miembros (nombre, apellidos, email, rol, estado)
- ✅ Eliminación de miembros con confirmación
- ✅ Template CSV actualizado (sin instrucciones)
- ✅ Columnas: Email, Nombre, Apellido Paterno, Apellido Materno, Rol, Estado

### Acciones Masivas (`/bulk-actions`)
- ✅ Página funcional (ya no está en blanco)
- ✅ Diseño visual limpio replicado
- ✅ Tabla de asignaciones con datos reales
- ✅ Botones de acción: Invitar, Enviar recordatorio, Extender plazo, Desactivar
- ✅ Tooltips informativos en botones y tarjetas
- ✅ Columna "Último recordatorio" funcionando
- ✅ Integración con datos reales de miembros importados
- ✅ Corrección de error "Extender plazo"

---

## 🔴 PENDIENTE - Alta Prioridad

### 1. **Persistencia en Firestore (Reemplazar localStorage)**

**Problema**: Actualmente varias funcionalidades usan `localStorage` como solución temporal:

#### 1.1 Recordatorios (`bulkActionService.js`)
- **Estado**: Guarda `lastReminderSent` en `localStorage`
- **Pendiente**: 
  - Crear colección `reminders` en Firestore
  - Guardar fecha de último recordatorio por asignación
  - Actualizar reglas de Firestore para permitir escritura
- **Archivo**: `src/services/bulkActionService.js` (línea ~150)
- **Impacto**: Los recordatorios se pierden al limpiar caché

#### 1.2 Extensiones de Plazo (`bulkActionService.js`)
- **Estado**: Guarda extensiones en `localStorage` con clave `extension_{orgId}_{assignmentId}`
- **Pendiente**:
  - Crear colección `deadlineExtensions` en Firestore
  - Guardar historial de extensiones
  - Calcular fechas de vencimiento actualizadas
- **Archivo**: `src/services/bulkActionService.js` (línea ~254)
- **Impacto**: Las extensiones no persisten entre sesiones

#### 1.3 Evaluaciones en Progreso (`EvaluationContextV2.jsx`)
- **Estado**: Guarda borradores en `localStorage`
- **Pendiente**: 
  - Guardar en colección `evaluationSessions` en Firestore
  - Sincronización automática
- **Archivo**: `src/context/EvaluationContextV2.jsx` (línea ~224)
- **Impacto**: Los borradores se pierden al cambiar de dispositivo

### 2. **Refinar Reglas de Firestore**

**Problema**: Reglas temporales muy permisivas para desarrollo

#### 2.1 Colección `members`
- **Estado**: Reglas temporales `allow read, write: if isSignedIn()`
- **Pendiente**:
  - Implementar reglas por `orgId` (solo miembros de la misma org)
  - Restringir eliminación a roles Admin/Owner
  - Validar estructura de datos en `create`
- **Archivo**: `firestore.rules` (líneas 442-456)
- **TODOs en código**: Línea 446: `// TODO: Refinar reglas una vez que la funcionalidad básica funcione`

#### 2.2 Colección `bulkActionAudit`
- **Estado**: No existe (usando `console.log`)
- **Pendiente**:
  - Crear colección para auditoría de acciones masivas
  - Implementar reglas de solo escritura por service account
  - Guardar historial de todas las acciones masivas
- **Archivo**: `src/services/bulkActionService.js` (línea ~244)

#### 2.3 Colección `bulkActionDLQ`
- **Estado**: No existe (usando `console.log`)
- **Pendiente**:
  - Crear Dead Letter Queue en Firestore
  - Implementar sistema de reintentos
  - UI para visualizar y retry items fallidos
- **Archivo**: `src/services/bulkActionService.js` (línea ~278)

### 3. **Implementar Servicios Faltantes**

#### 3.1 `observabilityService`
- **Estado**: Stub con `console.log`
- **Pendiente**:
  - Integrar con Firebase Analytics
  - Logging estructurado
  - Métricas de performance
- **Archivo**: `src/services/bulkActionService.js` (línea ~33)

#### 3.2 `rateLimitService`
- **Estado**: Stub que siempre retorna `allowed: true`
- **Pendiente**:
  - Implementar rate limiting real
  - Límites por organización
  - Límites de emails por día
  - Persistencia en Firestore
- **Archivo**: `src/services/bulkActionService.js` (línea ~38)

#### 3.3 `timezoneService`
- **Estado**: No existe
- **Pendiente**:
  - Detectar timezone del usuario
  - Convertir fechas según timezone
  - Mostrar fechas en formato local
- **Mencionado en**: `docs/DEPLOYMENT_REPORT_FASE2.md`

---

## 🟡 PENDIENTE - Media Prioridad

### 4. **Funcionalidades de Acciones Masivas**

#### 4.1 Invitar Miembros
- **Estado**: Botón existe pero puede tener errores de permisos
- **Pendiente**:
  - Verificar que envía emails correctamente
  - Guardar fecha de última invitación en Firestore
  - Mostrar estado de envío en la tabla
- **Archivo**: `src/services/bulkActionService.js` (función `sendInvitations`)

#### 4.2 Desactivar Miembros
- **Estado**: Botón existe
- **Pendiente**:
  - Implementar lógica de desactivación
  - Actualizar estado en colección `members`
  - Filtrar miembros desactivados en listados
- **Archivo**: `src/services/bulkActionService.js` (función `deactivateMembers`)

#### 4.3 Progreso en Tiempo Real
- **Estado**: No implementado
- **Pendiente**:
  - Mostrar progress bar durante acciones masivas
  - Actualizar contador de procesados/fallidos
  - Notificaciones toast de progreso
- **Mencionado en**: `docs/PHASE2_SPRINT_PLAN.md` (Sprint 2)

### 5. **Dashboard 360° Operacional**

#### 5.1 Métricas Reales
- **Estado**: Puede estar usando datos mock
- **Pendiente**:
  - Conectar con datos reales de Firestore
  - Calcular métricas en tiempo real
  - Actualización automática cada 30s
- **Archivo**: `src/components/dashboard/OperationalDashboard.jsx`

#### 5.2 Filtros Funcionales
- **Estado**: UI existe
- **Pendiente**:
  - Implementar filtros por fecha, área, job family
  - Aplicar filtros a queries de Firestore
  - Persistir filtros en URL
- **Archivo**: `src/components/dashboard/OperationalDashboard.jsx`

### 6. **Sistema de Alertas**

#### 6.1 Alert Manager
- **Estado**: Componente puede existir pero no funcional
- **Pendiente**:
  - Visualizar items de DLQ
  - Alertas de rate limits
  - Notificaciones de errores del sistema
- **Archivo**: `src/components/alerts/AlertManager.jsx`
- **Mencionado en**: `docs/PHASE2_SPRINT_PLAN.md` (Sprint 3)

#### 6.2 Dead Letter Queue Viewer
- **Estado**: No implementado
- **Pendiente**:
  - UI para ver items fallidos
  - Botón de retry individual
  - Retry masivo
  - Limpiar DLQ
- **Mencionado en**: `docs/PHASE2_SPRINT_PLAN.md` (Sprint 3)

---

## 🟢 PENDIENTE - Baja Prioridad

### 7. **Mejoras de UX/UI**

#### 7.1 Validación de Formularios
- **Estado**: Básica
- **Pendiente**:
  - Validación de email en importación CSV
  - Validación de campos requeridos
  - Mensajes de error más descriptivos
- **Archivo**: `src/components/members/MemberManager.jsx`

#### 7.2 Feedback Visual
- **Estado**: Básico
- **Pendiente**:
  - Skeleton loaders mientras carga
  - Animaciones de transición
  - Confirmaciones más claras
- **Archivos**: Varios componentes

#### 7.3 Responsive Design
- **Estado**: Parcial
- **Pendiente**:
  - Optimizar tablas para móvil
  - Menús colapsables
  - Touch-friendly buttons
- **Mencionado en**: `docs/PHASE2_SPRINT_PLAN.md`

### 8. **Testing**

#### 8.1 Tests E2E
- **Estado**: Tests existen pero pueden fallar
- **Pendiente**:
  - Actualizar tests con nuevos `data-testid`
  - Tests para importación CSV
  - Tests para acciones masivas
- **Archivos**: `tests/smoke/`

#### 8.2 Tests Unitarios
- **Estado**: Mínimos
- **Pendiente**:
  - Tests para servicios
  - Tests para componentes
  - Coverage > 60%
- **Mencionado en**: `docs/TODO.md`

### 9. **Documentación**

#### 9.1 Documentación de API
- **Estado**: Incompleta
- **Pendiente**:
  - Documentar servicios
  - Ejemplos de uso
  - Guías de integración
- **Archivo**: `docs/`

#### 9.2 Guías de Usuario
- **Estado**: No existe
- **Pendiente**:
  - Guía de importación CSV
  - Guía de acciones masivas
  - FAQ
- **Archivo**: `docs/`

---

## 📊 Resumen por Prioridad

### 🔴 Alta Prioridad (Esta Semana)
1. Persistencia en Firestore para recordatorios y extensiones
2. Refinar reglas de Firestore (seguridad)
3. Implementar servicios faltantes (observability, rateLimit, timezone)

### 🟡 Media Prioridad (Próximas 2 Semanas)
4. Completar funcionalidades de acciones masivas
5. Dashboard 360° con datos reales
6. Sistema de alertas y DLQ viewer

### 🟢 Baja Prioridad (Próximo Mes)
7. Mejoras de UX/UI
8. Testing completo
9. Documentación

---

## 🎯 Próximos Pasos Recomendados

### Inmediatos (Hoy/Mañana)
1. **Migrar recordatorios a Firestore**
   - Crear colección `reminders`
   - Actualizar `bulkActionService.sendReminders()`
   - Actualizar reglas de Firestore

2. **Migrar extensiones a Firestore**
   - Crear colección `deadlineExtensions`
   - Actualizar `bulkActionService.extendDeadlines()`
   - Calcular fechas de vencimiento

3. **Refinar reglas de `members`**
   - Implementar scope por `orgId`
   - Restringir eliminación a Admin/Owner
   - Validar estructura de datos

### Esta Semana
4. Implementar `rateLimitService` real
5. Implementar `observabilityService` con Firebase Analytics
6. Completar funcionalidad "Desactivar miembros"

### Próximas 2 Semanas
7. Dashboard 360° con datos reales
8. Sistema de alertas completo
9. DLQ viewer funcional

---

## 📝 Notas Técnicas

### Archivos con TODOs
- `firestore.rules` (línea 446): Refinar reglas de `members`
- `src/hooks/useFirestore.js` (línea 17): Implementar add, update, delete
- `src/hooks/useReports.js` (línea 8): Conectar con reportService real
- `src/hooks/useRecentActivity.js` (línea 7): Conectar con servicio real
- `src/hooks/useAssignedTasks.js` (línea 7): Conectar con Firestore real

### Servicios usando localStorage
- `bulkActionService.js`: Recordatorios y extensiones
- `evaluatorAssignmentService.js`: Lee `lastReminderSent` de localStorage
- `EvaluationContextV2.jsx`: Borradores de evaluaciones

### Reglas temporales en Firestore
- `members`: `allow read, write, delete: if isSignedIn()` (muy permisivo)
- Necesita scope por `orgId` y roles

---

**Última actualización**: 2025-11-14  
**Próxima revisión**: Al completar tareas de alta prioridad

