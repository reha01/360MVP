# PROJECT_STATE.md

**Última actualización**: 2025-09-24  
**Versión**: v0.4.0-staging  
**Estado**: Staging Stabilization Complete

## 📊 Resumen Ejecutivo

### Frontend
- ✅ **React Router**: Rutas protegidas con `AuthProtectedRoute` + `WorkspaceProtectedRoute`
- ✅ **OrgContext**: Single-shot loading, cache global, kill-switch solo DEV
- ✅ **Workspace Switcher**: Nombres reales desde `orgMeta.displayName`
- ✅ **Authentication**: Login/logout, redirección post-login funcional
- ✅ **Debug Tools**: `isDebug()`, `dlog()`, `dwarn()`, `dtrace()` seguros

### Backend
- ✅ **Firestore Rules v1**: Multi-org con roles (owner/admin/member/viewer)
- ✅ **Scoping Service**: `assertEvaluationBelongsToOrg`, `assertMemberCan`
- ✅ **Analytics Router**: Delegación scoped/legacy basado en flags
- ✅ **Telemetry**: Tracking operaciones unscoped y documentos legacy

### Datos
- ✅ **Organizations**: Metadatos con `displayName`, `type`, `avatarColor`
- ✅ **Memberships**: Convención `"<orgId>:<uid>"` para IDs únicos
- ✅ **Schema**: Compatibilidad `user_id`/`userId`, `org_id`/`orgId`

### Infraestructura
- ✅ **Firebase Hosting**: Deploy automático a staging (`mvp-staging-3e1cd.web.app`)
- ✅ **PWA**: Service Worker con `injectManifest`, no-cache en sw/manifest/index.html
- ✅ **Environment Detection**: `deriveEnv()` + emuladores OFF en staging
- ✅ **Debug Banner**: Visible en DEV, activable con `localStorage.DEBUG=1`

## 🏆 Hitos Completados

### Staging Stabilization (v0.4.0)
1. **deriveEnv + emuladores OFF**: Detección automática de entorno
2. **PWA SW + headers**: Service Worker con `injectManifest` + no-cache
3. **DebugBanner**: Sistema de debug con `DebugBannerWrapper`
4. **OrgContext single-shot**: Loading único, cache global, kill-switch solo DEV
5. **Workspace Switcher**: Nombres reales desde `orgMeta.displayName`
6. **Playwright smoke (auth)**: Tests autenticados contra staging
7. **kill-switch solo DEV**: Desactivado en producción
8. **reglas v1 + tests base**: Firestore Rules con 30 tests (15/30 pasan)

### Multi-Tenant Foundation
1. **Scoping Service**: Funciones de validación y acceso
2. **Firestore Rules**: Estructura v1 con roles y organizaciones
3. **Analytics Router**: Separación scoped/legacy
4. **Telemetry**: Monitoreo de operaciones multi-tenant

## 🚧 En Curso

### Firestore Rules v1 Testing → 100% verde
- ✅ **Reglas implementadas**: Multi-organización con roles
- ✅ **Tests creados**: 30 tests con emulador local
- ⚠️ **Tests parciales**: 15 pasan (verde), 15 fallan (rojo) - ajustes de sintaxis
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
VITE_FEATURE_INVITES=true     # User invitations
VITE_FEATURE_WIZARD=true      # Setup wizard
VITE_FEATURE_PDF=true         # PDF generation (según repo)
VITE_FEATURE_CREDITS=false    # Credits system (disabled)
VITE_FEATURE_EMAIL=true       # Email integration
```

## ⚠️ Riesgos Abiertos + Mitigaciones

### Alto Impacto
1. **Firestore Rules**: Tests fallan → **Mitigación**: Ajustar sintaxis, validar en staging
2. **Bundle Size**: 1.7MB minificado → **Mitigación**: Code splitting, lazy loading
3. **Cross-org Access**: Potencial fuga de datos → **Mitigación**: Tests exhaustivos, monitoreo

### Medio Impacto
1. **SW cache**: Problemas de actualización PWA → **Mitigación**: no-cache headers, versioning
2. **variación user_id/userId**: Inconsistencia de schema → **Mitigación**: Compatibilidad dual
3. **datos incompletos en organizations**: Metadatos faltantes → **Mitigación**: Validación y backfill

## 📋 Backlog Inmediato (4-5 tareas)

### Prioridad Alta
1. **Ajustar Firestore Rules**: Corregir sintaxis para que todos los tests pasen
2. **Validar Cross-org Security**: Verificar que no hay acceso cruzado
3. **Optimizar Bundle**: Implementar code splitting para reducir tamaño
4. **Audit Fix**: Resolver vulnerabilidades npm

### Prioridad Media
5. **Performance Monitoring**: Añadir métricas de rendimiento

## 📝 Changelog

### 2025-09-24 (v0.4.0-staging)
- ✅ Sistema nombres reales organizaciones desde `orgMeta.displayName`
- ✅ OrgContext single-shot loading, cache global, kill-switch solo DEV
- ✅ Authentication hardening con `AuthProvider` + `ProtectedRoute`
- ✅ Reemplazado global `DEBUG` por utils seguros `isDebug()`, `dlog()`
- ✅ Firestore Rules v1 con tests (15/30 pasan, ajustes pendientes)
- ✅ README-dev.md con herramientas de debug
- ✅ Eliminado emergency-fix.js (ya no necesario)
- ✅ Firebase v12.3.0 + vitest.config.ts para testing
- ✅ PWA con `injectManifest` + no-cache headers
- ✅ Playwright smoke tests autenticados contra staging
- ✅ CI estabilizado (lint/typecheck/build/rules) + smoke manual

### 2025-09-23 (v0.3.0-staging)
- ✅ Implementado DebugBanner con environment detection
- ✅ Configurado PWA con Service Worker
- ✅ Resuelto problema de emuladores en staging
- ✅ Mejorado WorkspaceGuard y WorkspaceSelector

---

**Próximo Milestone**: v0.5.0-production (Firestore Rules 100% verdes + optimizaciones)
