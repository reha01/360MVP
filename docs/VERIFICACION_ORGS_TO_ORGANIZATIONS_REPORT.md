# 🔍 Reporte de Verificación: orgs → organizations

**Fecha**: $(date)  
**Estado**: ❌ **CRÍTICO - MÚLTIPLES REFERENCIAS PENDIENTES**

---

## 📊 Resumen Ejecutivo

**❌ FALLO**: Se encontraron **100+ referencias** a `orgs` que necesitan ser corregidas a `organizations`.

**Criterio de salida**: ❌ **NO CUMPLIDO**
- ❌ 0 referencias a orgs en el repo
- ❌ Rules/Indexes no compilan correctamente  
- ❌ Smoke tests fallan por autenticación

---

## 🚨 Hallazgos Críticos

### 1. **Firestore Rules (CRÍTICO)**
**Archivo**: `firestore.rules`
**Estado**: ❌ **FALLO CRÍTICO**

```firestore
// LÍNEAS 22, 27, 268, 283 - TODAS USAN 'orgs'
exists(/databases/$(database)/documents/orgs/$(orgId)/members/...)
get(/databases/$(database)/documents/orgs/$(orgId)/members/...)
```

**Impacto**: Las reglas de seguridad NO funcionarán con la colección `organizations`.

### 2. **Servicios de Aplicación (CRÍTICO)**
**Archivos afectados**: 15+ servicios
**Estado**: ❌ **FALLO CRÍTICO**

#### Servicios con referencias a `orgs`:
- `src/services/bulkActionService.js` (5 referencias)
- `src/services/evaluatorAssignmentService.js` (3 referencias)  
- `src/services/campaignService.js` (3 referencias)
- `src/services/testDefinitionService.js` (8 referencias)
- `src/services/organizationService.js` (1 referencia)
- `src/services/orgStructureService.js` (4 referencias)
- `src/services/jobFamilyService.js` (3 referencias)
- `src/services/initDemoUser.js` (4 referencias)
- `src/services/evaluation360ResponseService.js` (3 referencias)
- `src/services/report360Service.js` (2 referencias)
- `src/services/evaluation360AggregationService.js` (2 referencias)

### 3. **Scripts de Seeding (CRÍTICO)**
**Archivos afectados**: 3 scripts
**Estado**: ❌ **FALLO CRÍTICO**

- `scripts/seed-staging-data-real.js` (4 referencias)
- `scripts/create-staging-user.js` (2 referencias)  
- `scripts/seed-staging-data.js` (3 referencias comentadas)

### 4. **Documentación (MEDIO)**
**Archivos afectados**: 8+ archivos de docs
**Estado**: ⚠️ **INCONSISTENTE**

- `docs/SMOKE_TESTS_EXECUTION_GUIDE.md`
- `docs/SMOKE_TESTS_UNBLOCK_COMPLETE.md`
- `docs/SMOKE_TESTS_UNBLOCK_SUMMARY.md`
- `docs/STAGING_SETUP_INSTRUCTIONS.md`
- `SMOKE_TEST_EXECUTION_PLAN.md`
- `firestore-import.json`

---

## ✅ Áreas Verificadas Correctamente

### 1. **Archivos ya corregidos** ✅
- `FIRESTORE_SETUP_QUICK.md` ✅
- `scripts/generate-firestore-json.js` ✅  
- `scripts/firestore-setup-manual.md` ✅

### 2. **Tests básicos** ✅
- `npm run typecheck` ✅ (sin errores)
- `npm run lint` ✅ (sin errores)

---

## 🚨 Tests Fallidos

### 1. **Smoke Tests** ❌
```bash
npm run smoke:staging
# Error: Authentication failed
# Locator: 'text=Dashboard, text=Inicio' not found
```

**Causa**: Los tests fallan porque:
1. Las reglas de Firestore usan `orgs` pero los datos están en `organizations`
2. La autenticación no puede acceder a los datos correctos

---

## 📋 Checklist de Verificación

| Área | Estado | Detalles |
|------|--------|----------|
| **Firestore Rules** | ❌ | 4+ referencias a `orgs` |
| **Firestore Indexes** | ✅ | No usa `orgs` directamente |
| **Seeds/Scripts** | ❌ | 9+ referencias en 3 archivos |
| **Services** | ❌ | 34+ referencias en 11 archivos |
| **UI/Router** | ❌ | 4+ referencias en páginas |
| **Tests** | ❌ | Smoke tests fallan por auth |
| **Documentation** | ⚠️ | 8+ archivos con referencias |

---

## 🎯 Acciones Requeridas (PRIORIDAD P0)

### 1. **Corregir Firestore Rules** (CRÍTICO)
```bash
# Cambiar en firestore.rules:
orgs/$(orgId) → organizations/$(orgId)
```

### 2. **Corregir Servicios** (CRÍTICO)
```bash
# Cambiar en todos los servicios:
collection(db, 'orgs', orgId, ...) → collection(db, 'organizations', orgId, ...)
```

### 3. **Corregir Scripts** (CRÍTICO)
```bash
# Cambiar en scripts de seeding:
db.collection('orgs') → db.collection('organizations')
```

### 4. **Actualizar Documentación** (MEDIO)
```bash
# Cambiar referencias en docs/
orgs/pilot-org-santiago → organizations/pilot-org-santiago
```

---

## 📈 Métricas de Impacto

- **Archivos afectados**: 25+
- **Referencias a corregir**: 100+
- **Servicios críticos**: 11
- **Scripts de seeding**: 3
- **Documentación**: 8+

---

## 🚀 Plan de Corrección (ETA: 2-3 horas)

### Fase 1: Core (1 hora)
1. ✅ Corregir `firestore.rules` 
2. ✅ Corregir servicios principales
3. ✅ Corregir scripts de seeding

### Fase 2: Tests (30 min)
1. ✅ Re-ejecutar smoke tests
2. ✅ Verificar autenticación
3. ✅ Validar funcionalidad

### Fase 3: Documentación (30 min)
1. ✅ Actualizar docs restantes
2. ✅ Verificar consistencia

---

## 🎯 Criterio de Éxito

**PASS cuando**:
- ✅ 0 referencias a `orgs` en el repo
- ✅ Rules/Indexes compilan sin errores
- ✅ Seeds corren sin error contra `organizations`
- ✅ Smoke tests pasan la fase de login
- ✅ Al menos una página carga datos de `organizations`

**Estado actual**: ❌ **NO CUMPLIDO**

---

*Reporte generado automáticamente por verificación integral del cambio orgs → organizations*
