# 📋 Plan de Sprints - Fase 2: Dashboard 360° y Gestión Avanzada

**Fecha de Inicio**: 2025-01-20  
**Duración Estimada**: 15-20 horas (4-5 sprints)  
**Objetivo**: Implementar Dashboard 360°, Bulk Actions, Alerts y funcionalidades de gestión avanzada

---

## 📊 Resumen Ejecutivo

La Fase 2 implementará las funcionalidades de gestión operacional que los tests ya esperan. Los componentes base existen pero necesitan:
1. Agregar `data-testid` correctos
2. Conectar con datos reales
3. Implementar lógica de negocio
4. Integrar servicios

---

## 🎯 Sprint 0: Preparación y Datos (2 horas)

### Objetivo
Crear infraestructura de datos y servicios base para soportar las funcionalidades de Fase 2.

### Tareas

#### 0.1 Crear Modelos de Datos
```javascript
// src/models/campaign.model.js
- Campaign (id, name, status, created, metrics)
- Assignment (id, campaignId, userId, status, email)
- BulkAction (id, type, status, items, result)
- Alert (id, type, severity, message, timestamp)
```

#### 0.2 Crear Servicios Base
```javascript
// src/services/
- campaignService.js (CRUD campañas)
- assignmentService.js (gestión asignaciones)
- metricsService.js (cálculo métricas)
- dlqService.js (dead letter queue)
```

#### 0.3 Seed Data para Development
```javascript
// scripts/seed-phase2-dev.js
- 5 campañas con diferentes estados
- 100+ asignaciones (10% con errores)
- Métricas simuladas
- Eventos DLQ de prueba
```

### Entregables
- [ ] Modelos de datos definidos
- [ ] Servicios base creados
- [ ] Scripts de seed funcionando
- [ ] Datos en Firestore local

### Criterios de Éxito
- ✅ `npm run seed:dev` crea datos de prueba
- ✅ Servicios pueden hacer CRUD básico
- ✅ Modelos tienen TypeScript/PropTypes

---

## 🚀 Sprint 1: Dashboard 360° Operacional (4 horas)

### Objetivo
Completar el Dashboard 360° con métricas reales, filtros funcionales y performance optimizada.

### Tareas

#### 1.1 Componente Principal
```jsx
// src/components/dashboard/OperationalDashboard.jsx
- ✅ Agregar data-testid="operational-dashboard"
- Estructura de layout con grid
- Estado para filtros y paginación
- Hook useMetrics() para datos
```

#### 1.2 Widgets de Métricas
```jsx
// src/components/dashboard/widgets/
- MetricCard.jsx (KPI individual)
- CampaignProgress.jsx (barras progreso)
- ResponseRateChart.jsx (gráfico línea)
- StatusDistribution.jsx (pie chart)
```

#### 1.3 Filtros y Controles
```jsx
// src/components/dashboard/filters/
- DateRangePicker.jsx
- CampaignSelector.jsx
- StatusFilter.jsx
- ExportButton.jsx
```

#### 1.4 Integración con Backend
```javascript
// src/hooks/useDashboardData.js
- Fetch métricas agregadas
- Cache con React Query/SWR
- Polling cada 30s
- Error handling
```

### Entregables
- [ ] Dashboard con `data-testid` correcto
- [ ] 4+ widgets de métricas funcionando
- [ ] Filtros aplicando correctamente
- [ ] Datos actualizándose en real-time
- [ ] Performance < 2s carga inicial

### Criterios de Éxito
- ✅ Test `Dashboard 360 should render` pasa
- ✅ Métricas se actualizan cada 30s
- ✅ Filtros modifican datos mostrados
- ✅ Responsive en móvil y desktop
- ✅ Loading states implementados

### Tests a Pasar
```javascript
✓ Dashboard visible con data-testid="operational-dashboard"
✓ Load time < 2000ms
✓ Muestra al menos 3 métricas
✓ Filtros funcionan
✓ Export genera CSV/PDF
```

---

## 💼 Sprint 2: Bulk Actions Manager (4 horas)

### Objetivo
Implementar sistema completo de acciones masivas con UI de selección, preview y ejecución.

### Tareas

#### 2.1 Componente Principal
```jsx
// src/components/bulk/BulkActionsManager.jsx
- ✅ Agregar data-testid="bulk-actions-manager"
- Tabla con checkboxes
- Barra de acciones flotante
- Modal de confirmación
```

#### 2.2 Tabla de Asignaciones
```jsx
// src/components/bulk/AssignmentTable.jsx
- Columnas: checkbox, nombre, email, estado, fecha
- Selección múltiple (all, none, invert)
- Sorting por columnas
- Búsqueda/filtrado
- Paginación (25/50/100 items)
```

#### 2.3 Acciones Disponibles
```jsx
// src/components/bulk/actions/
- ResendInvitation.jsx
- CancelAssignment.jsx
- ExtendDeadline.jsx
- ExportSelected.jsx
```

#### 2.4 Sistema de Ejecución
```javascript
// src/services/bulkActionService.js
- executeAction(type, items, options)
- Batch processing (10 items/batch)
- Progress tracking
- Error handling con DLQ
- Rollback en caso de fallo
```

#### 2.5 Dead Letter Queue
```javascript
// src/services/dlqService.js
- logFailure(action, item, error)
- getFailedItems()
- retryItem(id)
- clearDLQ()
```

### Entregables
- [ ] BulkActionsManager con `data-testid` correcto
- [ ] Tabla con selección múltiple funcionando
- [ ] 3+ acciones implementadas
- [ ] Sistema de batch processing
- [ ] DLQ capturando errores

### Criterios de Éxito
- ✅ Test `Bulk actions should render` pasa
- ✅ Puede seleccionar múltiples items
- ✅ Reenvío de invitaciones funciona
- ✅ Progress bar durante ejecución
- ✅ Errores van a DLQ

### Tests a Pasar
```javascript
✓ Bulk manager visible con data-testid="bulk-actions-manager"
✓ Puede seleccionar al menos 5 items
✓ Botón "Reenviar" habilitado con selección
✓ Muestra progreso durante ejecución
✓ Confirmación antes de ejecutar
✓ Maneja errores gracefully
```

---

## 🚨 Sprint 3: Alert System (3 horas)

### Objetivo
Implementar sistema de alertas con visualización de DLQ, notificaciones y acciones de recuperación.

### Tareas

#### 3.1 Componente Principal
```jsx
// src/components/alerts/AlertManager.jsx
- ✅ Agregar data-testid="alert-manager"
- Lista de alertas activas
- Filtros por severidad
- Acciones por alerta
```

#### 3.2 Tipos de Alertas
```jsx
// src/components/alerts/types/
- DLQAlert.jsx (items en dead letter queue)
- RateLimitAlert.jsx (límites alcanzados)
- SystemAlert.jsx (errores sistema)
- PerformanceAlert.jsx (métricas lentas)
```

#### 3.3 Visualización DLQ
```jsx
// src/components/alerts/DLQViewer.jsx
- Tabla de items fallidos
- Detalles del error
- Botón retry individual
- Bulk retry
- Clear/archive opciones
```

#### 3.4 Sistema de Notificaciones
```javascript
// src/services/notificationService.js
- showAlert(type, message, options)
- Toast notifications
- Sound alerts (opcional)
- Browser notifications API
```

### Entregables
- [ ] AlertManager con `data-testid` correcto
- [ ] DLQ viewer funcionando
- [ ] 3+ tipos de alertas
- [ ] Acciones de retry
- [ ] Sistema de notificaciones

### Criterios de Éxito
- ✅ Test `Alerts should render` pasa
- ✅ Muestra items de DLQ
- ✅ Retry funciona
- ✅ Filtros por severidad
- ✅ Notificaciones toast

### Tests a Pasar
```javascript
✓ Alert manager visible con data-testid="alert-manager"
✓ Muestra al menos 1 alerta de DLQ
✓ Botón retry disponible
✓ Puede filtrar por severidad
✓ Toast notification al retry
```

---

## 🔄 Sprint 4: Integración y Testing (3 horas)

### Objetivo
Integrar todos los componentes, optimizar performance y asegurar que todos los tests pasen.

### Tareas

#### 4.1 Integración de Rutas
```javascript
// src/App.jsx
- Verificar rutas de Fase 2
- Lazy loading de componentes
- Error boundaries
- Loading states
```

#### 4.2 Optimización Performance
```javascript
// Optimizaciones
- React.memo en componentes pesados
- useMemo/useCallback donde corresponda
- Virtual scrolling en tablas grandes
- Debounce en búsquedas
- Compression de assets
```

#### 4.3 Testing Completo
```bash
# Ejecutar todos los smoke tests
npm run test:auth:capture
npm run smoke:staging -- --grep "@smoke"

# Verificar cada ruta
- /dashboard-360 ✓
- /bulk-actions ✓
- /alerts ✓
- /comparison ⚠️
- /policies ⚠️
```

#### 4.4 Documentación
```markdown
// docs/PHASE2_IMPLEMENTATION.md
- Arquitectura implementada
- Decisiones técnicas
- Guía de uso
- Troubleshooting
```

### Entregables
- [ ] Todos los tests de Fase 2 pasando
- [ ] Performance < 2s en todas las rutas
- [ ] Documentación completa
- [ ] Sin errores en consola
- [ ] Build de producción optimizado

### Criterios de Éxito
- ✅ 18+ smoke tests pasando (de 29 total)
- ✅ Lighthouse score > 80
- ✅ Bundle size < 2MB
- ✅ No memory leaks
- ✅ Responsive design

---

## 📈 Sprint 5 (Opcional): Comparison & Policies (4 horas)

### Objetivo
Completar las funcionalidades restantes de Fase 2 si el tiempo lo permite.

### Tareas

#### 5.1 Campaign Comparison
```jsx
// src/pages/ComparisonPage.jsx
- Selector de 2-4 campañas
- Tabla comparativa side-by-side
- Gráficos comparativos
- Export a PDF/Excel
```

#### 5.2 Organizational Policies
```jsx
// src/pages/PolicyPage.jsx
- CRUD de políticas
- Editor de reglas
- Aplicación a campañas
- Historial de cambios
```

### Entregables
- [ ] Comparison page funcional
- [ ] Policy manager completo
- [ ] Tests pasando
- [ ] Documentación

---

## 📅 Timeline Estimado

| Sprint | Duración | Inicio | Fin | Estado |
|--------|----------|--------|-----|--------|
| **Sprint 0** | 2h | Día 1 AM | Día 1 PM | 🔄 Pending |
| **Sprint 1** | 4h | Día 1 PM | Día 2 AM | 🔄 Pending |
| **Sprint 2** | 4h | Día 2 PM | Día 3 AM | 🔄 Pending |
| **Sprint 3** | 3h | Día 3 PM | Día 4 AM | 🔄 Pending |
| **Sprint 4** | 3h | Día 4 PM | Día 5 AM | 🔄 Pending |
| **Sprint 5** | 4h | Día 5 PM | Día 6 AM | 📌 Optional |

**Total**: 16-20 horas

---

## 🎯 Definition of Done

Para considerar un sprint completo:

1. ✅ Código implementado y funcionando
2. ✅ Tests específicos pasando
3. ✅ Sin errores en consola
4. ✅ Responsive design verificado
5. ✅ Documentación actualizada
6. ✅ Code review (self)
7. ✅ Commit con mensaje descriptivo
8. ✅ Push a GitHub

---

## 🚦 Métricas de Éxito Global

### Fase 2 Completa cuando:

| Métrica | Target | Actual | Status |
|---------|--------|--------|--------|
| **Smoke Tests Pasando** | >60% (18/29) | 11/29 | ❌ |
| **Dashboard Load Time** | <2s | - | ⏳ |
| **Bulk Actions Working** | 3+ acciones | 0 | ❌ |
| **DLQ Visible** | ✓ | - | ❌ |
| **No Console Errors** | 0 errors | - | ⏳ |
| **Lighthouse Score** | >80 | - | ⏳ |
| **Bundle Size** | <2MB | 1.85MB | ✅ |

---

## 🛠️ Stack Técnico

### Frontend
- React 18.x
- React Router 6.x
- TailwindCSS (estilos)
- Chart.js (gráficos)
- React Query/SWR (cache)
- Playwright (testing)

### Backend
- Firebase Firestore
- Firebase Functions (opcional)
- Firebase Auth
- Firebase Hosting

### Herramientas
- Vite (build)
- ESLint (linting)
- Prettier (formato)
- Git (versión)

---

## 🔄 Proceso de Desarrollo

Para cada sprint:

1. **Planning** (30 min)
   - Revisar tareas
   - Preparar entorno
   - Crear branch

2. **Development** (2-3h)
   - Implementar features
   - Test mientras desarrollas
   - Commits frecuentes

3. **Testing** (30 min)
   - Ejecutar smoke tests
   - Verificar en navegador
   - Fix bugs encontrados

4. **Documentation** (30 min)
   - Actualizar docs
   - Comentar código
   - Update README

5. **Delivery** (15 min)
   - Merge a main
   - Push a GitHub
   - Tag version

---

## 📝 Notas Importantes

### Prioridades
1. **CRÍTICO**: Hacer que tests pasen (data-testid)
2. **IMPORTANTE**: Funcionalidad real con datos
3. **NICE TO HAVE**: Polish UI/UX
4. **OPCIONAL**: Features adicionales

### Riesgos
- ⚠️ Performance con datos grandes
- ⚠️ Rate limits de Firebase
- ⚠️ Compatibilidad navegadores
- ⚠️ Estado de autenticación

### Dependencias
- ✅ Firebase configurado
- ✅ Autenticación funcionando
- ✅ Multi-tenancy activo
- ✅ Feature flags ON para pilot-org

---

## 🎉 Resultado Esperado

Al completar la Fase 2:

1. **Dashboard 360°** mostrando métricas en tiempo real
2. **Bulk Actions** procesando acciones masivas eficientemente
3. **Alert System** monitoreando y notificando problemas
4. **18+ tests pasando** (de 29 totales)
5. **Sistema production-ready** para gestión operacional

---

**Última actualización**: 2025-01-20  
**Próxima revisión**: Al completar Sprint 1
