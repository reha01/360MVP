# PROJECT_STATE.md

**Última actualización**: 2025-09-24  
**Versión**: v0.4.0-staging  
**Estado**: Staging Stabilization Complete

## 🎯 Estado Actual

### Infraestructura
- ✅ **Firebase Hosting**: Deploy automático a staging (`mvp-staging-3e1cd.web.app`)
- ✅ **PWA**: Service Worker funcional con cache-busting
- ✅ **Environment Detection**: `deriveEnv()` + emuladores OFF en staging
- ✅ **Debug Banner**: Visible en DEV, activable con `localStorage.DEBUG=1`

### Frontend
- ✅ **React Router**: Rutas protegidas con `AuthProtectedRoute` + `WorkspaceProtectedRoute`
- ✅ **OrgContext**: Loop infinito resuelto, carga única por UID, cache global
- ✅ **Workspace Switcher**: Nombres reales de organizaciones desde Firestore
- ✅ **Authentication**: Login/logout funcional, redirección post-login
- ✅ **Debug Tools**: Helper seguro `isDebug()`, `dlog()`, `dwarn()`, `dtrace()`

### Backend
- ✅ **Firestore Rules v1**: Multi-organización con roles (owner/admin/member/viewer)
- ✅ **Scoping Service**: `assertEvaluationBelongsToOrg`, `assertMemberCan`
- ✅ **Analytics Router**: Delegación a `scoped` vs `legacy` basado en feature flags
- ✅ **Telemetry**: Tracking de operaciones unscoped y documentos legacy

## 🏆 Hitos Completados

### Staging Stabilization (v0.4.0)
1. **Environment Detection**: `deriveEnv()` + emuladores OFF en staging
2. **Service Worker**: PWA funcional con cache-busting
3. **Debug Banner**: Sistema de debug con `DebugBannerWrapper`
4. **OrgContext Fix**: Resolución de loop infinito con cache global
5. **Workspace Switcher**: Nombres reales de organizaciones
6. **Authentication Hardening**: `AuthProvider` + `ProtectedRoute` + redirección
7. **Debug Helper**: Reemplazo de global `DEBUG` por utils seguros

### Multi-Tenant Foundation
1. **Scoping Service**: Funciones de validación y acceso
2. **Firestore Rules**: Estructura v1 con roles y organizaciones
3. **Analytics Router**: Separación scoped/legacy
4. **Telemetry**: Monitoreo de operaciones multi-tenant

## 🚧 En Curso

### Firestore Rules v1 Testing
- ✅ **Reglas implementadas**: Multi-organización con roles
- ✅ **Tests creados**: 30 tests con emulador local
- ⚠️ **Tests parciales**: 15 pasan, 15 necesitan ajustes en reglas
- 🔄 **Próximo**: Ajustar reglas para que todos los tests pasen

## ⚠️ Bloqueos/Pendientes

### Críticos
- **Tests de reglas**: Algunos tests fallan por ajustes menores en sintaxis
- **Cross-org validation**: Verificar que no hay acceso cruzado entre organizaciones

### Menores
- **Performance**: Chunks > 500KB (optimización de bundle)
- **Audit**: 7 vulnerabilidades npm (6 moderate, 1 high)

## 🚩 Feature Flags Activos

```bash
# Staging
VITE_TENANCY_V1=true          # Multi-tenant enforcement
VITE_FEATURE_ORG=true         # Organizations
VITE_FEATURE_PDF=true         # PDF generation
VITE_FEATURE_INVITES=true     # User invitations
VITE_FEATURE_WIZARD=true      # Setup wizard
VITE_FEATURE_CREDITS=false    # Credits system (disabled)
VITE_FEATURE_EMAIL=true       # Email integration
```

## ⚠️ Riesgos Abiertos + Mitigaciones

### Alto Impacto
1. **Firestore Rules**: Tests fallan → **Mitigación**: Ajustar sintaxis, validar en staging
2. **Bundle Size**: 1.7MB minificado → **Mitigación**: Code splitting, lazy loading
3. **Cross-org Access**: Potencial fuga de datos → **Mitigación**: Tests exhaustivos, monitoreo

### Medio Impacto
1. **Debug Mode**: Puede exponer info sensible → **Mitigación**: Solo en DEV, localStorage control
2. **PWA Cache**: Posibles problemas de actualización → **Mitigación**: Cache-busting, versioning

## 📋 Backlog Inmediato (3-5 tareas)

### Prioridad Alta
1. **Ajustar Firestore Rules**: Corregir sintaxis para que todos los tests pasen
2. **Validar Cross-org Security**: Verificar que no hay acceso cruzado
3. **Optimizar Bundle**: Implementar code splitting para reducir tamaño

### Prioridad Media
4. **Audit Fix**: Resolver vulnerabilidades npm
5. **Performance Monitoring**: Añadir métricas de rendimiento

## 📝 Changelog

### 2025-09-24 (v0.4.0-staging)
- ✅ Implementado sistema de nombres reales de organizaciones
- ✅ Resuelto loop infinito en OrgContext con cache global
- ✅ Hardened authentication con ProtectedRoute
- ✅ Reemplazado global DEBUG por utils seguros
- ✅ Creado Firestore Rules v1 con tests
- ✅ Añadido README-dev.md con herramientas de debug
- ✅ Eliminado emergency-fix.js (ya no necesario)
- ✅ Actualizado Firebase a v12.3.0 para compatibilidad
- ✅ Añadido vitest.config.ts para testing

### 2025-09-23 (v0.3.0-staging)
- ✅ Implementado DebugBanner con environment detection
- ✅ Configurado PWA con Service Worker
- ✅ Resuelto problema de emuladores en staging
- ✅ Mejorado WorkspaceGuard y WorkspaceSelector

---

**Próximo Milestone**: v0.5.0-production (Firestore Rules 100% verdes + optimizaciones)
