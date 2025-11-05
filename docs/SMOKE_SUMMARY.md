# 🧪 Smoke Tests Summary - Fase 2

**Fecha:** 2025-11-03  
**Entorno:** Staging (mvp-staging-3e1cd.web.app)  
**Usuario:** admin@pilot-santiago.com  
**Organización:** pilot-org-santiago

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Tests Totales** | 9 smoke tests Fase 2 | - |
| **Passed** | 0/9 | ❌ |
| **Failed** | 0/9 | - |
| **Skipped** | 9/9 | ⚠️ |
| **p95 Dashboard** | N/A | ⚠️ No ejecutado |
| **DLQ Items** | N/A | ⚠️ No verificado |
| **Idempotencia** | N/A | ⚠️ No verificado |

**Estado General:** ⚠️ **BLOQUEADO - Requiere intervención manual**

---

## 🚫 BLOQUEADORES CRÍTICOS

### 1. Servidor de Desarrollo No Disponible
- **Causa raíz:** Servidor local (127.0.0.1:5178) no se inició correctamente
- **Impacto:** Tests locales básicos fallaron (28 failed)
- **Fix propuesto:** 
  ```bash
  # Terminal dedicada:
  cd "C:\01 Apps\360MVP"
  npm run dev
  # Esperar mensaje "Server running at http://127.0.0.1:5178"
  ```

### 2. Autenticación de Staging Requiere Interacción Manual
- **Causa raíz:** `npm run test:auth:capture` requiere interacción manual del usuario
- **Impacto:** No se puede capturar token fresco automáticamente
- **Estado actual:** Token en `tests/.auth/state.json` expirado (exp: 1762198103)
- **Estado del script:** ✅ **CORREGIDO** - Ahora abre URL correcta de staging
- **Fix propuesto:**
  ```bash
  npm run test:auth:capture
  # El navegador abrirá https://mvp-staging-3e1cd.web.app/login
  # 1. Login con admin@pilot-santiago.com / TestPilot2024!
  # 2. Esperar redirección a /dashboard
  # 3. Token se guarda automáticamente en tests/.auth/state.json
  ```
- **Documentación:** Ver `tests/auth/README.md` y `AUTH_CAPTURE_FIX.md`

### 3. Datos Mínimos en Staging No Verificados
- **Causa raíz:** Sin acceso a Firebase Console o Admin SDK para verificar/crear datos
- **Impacto:** Tests de Fase 2 requieren:
  - ≥1 campaña activa en `organizations/pilot-org-santiago/campaigns`
  - ≥2 sesiones 360 en `evaluation360Sessions`
  - ≥8 asignaciones en `evaluatorAssignments` (1 con email inválido para DLQ)
- **Fix propuesto:**
  1. **Opción A - Firebase Console:**
     - Acceder a https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
     - Seguir guía en `scripts/MANUAL_STAGING_SETUP.md`
  2. **Opción B - Service Account:**
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
     node scripts/create-staging-user.cjs
     node scripts/seed-staging-data-real.cjs
     ```

---

## 📋 Tabla Detallada de Tests

### Fase 2 - Smoke Tests (@smoke)

| # | Test | Resultado | Tiempo | Notas |
|---|------|-----------|--------|-------|
| 1 | Rutas accesibles (200 OK) - Org Piloto | ⚠️ SKIP | - | Requiere auth + server |
| 2 | Feature flag gating - Org piloto | ⚠️ SKIP | - | Requiere auth + server |
| 3 | Bulk actions - Reenviar invitaciones | ⚠️ SKIP | - | Requiere auth + datos |
| 4 | Idempotencia - Bloqueo <24h | ⚠️ SKIP | - | Requiere auth + datos |
| 5 | Rate limits por plan | ⚠️ SKIP | - | Requiere auth |
| 6 | DLQ visible en /alerts | ⚠️ SKIP | - | Requiere auth + datos |
| 7 | Auditoría - Eventos registrados | ⚠️ SKIP | - | Requiere auth |
| 8 | Dashboard 360 performance | ⚠️ SKIP | - | Requiere auth + medición |
| 9 | Campaign comparison functional | ⚠️ SKIP | - | Requiere auth + datos |

### Tests Básicos (Intento Local)

| Categoría | Passed | Failed | Skipped | Total |
|-----------|--------|--------|---------|-------|
| Basic Smoke | 0 | 8 | 0 | 8 |
| Fase 2 Realistic | 0 | 4 | 0 | 4 |
| Fase 2 Smoke | 0 | 8 | 1 | 9 |
| Workspace | 0 | 8 | 0 | 8 |
| **TOTAL** | **0** | **28** | **1** | **29** |

**Causa de failures:** `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5178`

---

## ⚡ Performance Metrics

### p95 /dashboard-360

| Corrida | Tiempo (ms) | Estado | Target |
|---------|-------------|--------|--------|
| 1 | N/A | ⚠️ No ejecutado | <2000ms |
| 2 | N/A | ⚠️ No ejecutado | <2000ms |
| 3 | N/A | ⚠️ No ejecutado | <2000ms |

**p95 Final:** ⚠️ **No medido** (requiere 3 corridas exitosas)

**Criterio:** 2/3 corridas < 2s → **NO CUMPLIDO**

---

## 🔍 Verificaciones Específicas

### DLQ (Dead Letter Queue)

- **Verificado:** ❌ No
- **Esperado:** ≥1 ítem en `/alerts` con email inválido
- **Estado:** Requiere ejecución de tests de bulk actions
- **Fuente:** `organizations/pilot-org-santiago/evaluatorAssignments` con `evaluatorEmail: "invalid@test.local"`

### Idempotencia Bulk Actions

- **Verificado:** ❌ No
- **Esperado:** Reenvío bloqueado si <24h desde último envío
- **Estado:** Requiere test con 2 ejecuciones consecutivas
- **Mecanismo:** `lastBulkActionAt` timestamp + `idempotencyWindow: 86400000` (24h)

---

## 🎯 Criterios de Éxito vs Resultados

| Criterio | Target | Resultado | Estado |
|----------|--------|-----------|--------|
| Tests PASS/SKIP | ≥7/9 | 0/9 | ❌ **FAIL** |
| p95 dashboard | <2s (2/3) | N/A | ⚠️ **N/A** |
| DLQ items | ≥1 | N/A | ⚠️ **N/A** |
| Idempotencia activa | <24h block | N/A | ⚠️ **N/A** |

**Estado Final:** ❌ **NO CUMPLIDO** - Requiere intervención manual para desbloquear

---

## 📁 Artefactos Generados

| Tipo | Ruta | Estado |
|------|------|--------|
| Reporte HTML | `playwright-report/index.html` | ✅ Generado |
| Screenshots | `test-results/*/test-failed-*.png` | ✅ 28 capturas |
| Videos | `test-results/*/video.webm` | ✅ 28 videos |
| Auth State | `tests/.auth/state.json` | ⚠️ Expirado |
| Resumen | `docs/SMOKE_SUMMARY.md` | ✅ Este archivo |

---

## 🔧 Configuración Verificada

| Componente | Estado | Detalle |
|------------|--------|---------|
| Playwright reporter | ✅ OK | `list` + `html {open:'never'}` |
| Script smoke:ci | ✅ OK | `package.json` línea 51 |
| Firestore rules | ✅ OK | Solo `organizations/`, cero `orgs/` |
| Feature flags runtime | ✅ OK | Leen desde Firestore por orgId |
| Rutas staging | ✅ OK | `/dashboard-360`, `/comparison`, `/policies`, `/alerts` → 200 |
| Build | ✅ OK | Pasa sin errores (14s) |

---

## 🚀 Próximos Pasos (Orden Prioritario)

### 1. Desbloquear Servidor Local (Opcional - para tests locales)
```bash
# Terminal dedicada
cd "C:\01 Apps\360MVP"
npm run dev
# Mantener abierta
```

### 2. Capturar Auth Staging (CRÍTICO)
```bash
npm run test:auth:capture
# Login manual con admin@pilot-santiago.com / TestPilot2024!
```

### 3. Verificar/Crear Datos en Staging (CRÍTICO)
**Opción A - Firebase Console (más rápida):**
1. https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
2. Verificar `organizations/pilot-org-santiago/campaigns` tiene ≥1 doc
3. Si no existe, seguir `scripts/MANUAL_STAGING_SETUP.md`

**Opción B - Script con Service Account:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

### 4. Ejecutar Smoke Tests Staging
```bash
npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts
```

### 5. Medir Performance
```bash
# 3 corridas con medición de tiempos
for i in {1..3}; do
  echo "Corrida $i"
  curl -w "@curl-format.txt" -o /dev/null -s "https://mvp-staging-3e1cd.web.app/dashboard-360"
done
```

### 6. Verificar DLQ e Idempotencia
- Ejecutar tests de bulk actions (test #3 y #4)
- Verificar `/alerts` muestra email inválido
- Verificar reenvío bloqueado en <24h

---

## 📝 Notas Adicionales

1. **Auth Manual**: `test:auth:capture` es inherentemente manual (requiere login en navegador)
2. **Seeding**: Sin service account o acceso a Console, no es automatizable
3. **Performance**: p95 requiere 3 corridas exitosas con auth + datos
4. **DLQ**: Requiere asignación con email inválido en Firestore
5. **Tests locales**: Opcionales; staging es el target real

---

## 🎯 Recomendación

**Para QA completo:**
1. Usuario ejecuta `npm run test:auth:capture` (login manual)
2. DevOps/Admin verifica datos en Console o ejecuta scripts con service account
3. Re-ejecutar: `npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts`
4. Medir p95 con 3 requests a `/dashboard-360`
5. Verificar DLQ y logs de idempotencia

**Tiempo estimado:** 30-45 min (con datos existentes) | 1-2h (creando datos desde cero)

---

**Estado:** ⚠️ **Pendiente de intervención manual**  
**Próxima acción:** Capturar auth + verificar datos staging


**Fecha:** 2025-11-03  
**Entorno:** Staging (mvp-staging-3e1cd.web.app)  
**Usuario:** admin@pilot-santiago.com  
**Organización:** pilot-org-santiago

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Tests Totales** | 9 smoke tests Fase 2 | - |
| **Passed** | 0/9 | ❌ |
| **Failed** | 0/9 | - |
| **Skipped** | 9/9 | ⚠️ |
| **p95 Dashboard** | N/A | ⚠️ No ejecutado |
| **DLQ Items** | N/A | ⚠️ No verificado |
| **Idempotencia** | N/A | ⚠️ No verificado |

**Estado General:** ⚠️ **BLOQUEADO - Requiere intervención manual**

---

## 🚫 BLOQUEADORES CRÍTICOS

### 1. Servidor de Desarrollo No Disponible
- **Causa raíz:** Servidor local (127.0.0.1:5178) no se inició correctamente
- **Impacto:** Tests locales básicos fallaron (28 failed)
- **Fix propuesto:** 
  ```bash
  # Terminal dedicada:
  cd "C:\01 Apps\360MVP"
  npm run dev
  # Esperar mensaje "Server running at http://127.0.0.1:5178"
  ```

### 2. Autenticación de Staging Requiere Interacción Manual
- **Causa raíz:** `npm run test:auth:capture` requiere interacción manual del usuario
- **Impacto:** No se puede capturar token fresco automáticamente
- **Estado actual:** Token en `tests/.auth/state.json` expirado (exp: 1762198103)
- **Estado del script:** ✅ **CORREGIDO** - Ahora abre URL correcta de staging
- **Fix propuesto:**
  ```bash
  npm run test:auth:capture
  # El navegador abrirá https://mvp-staging-3e1cd.web.app/login
  # 1. Login con admin@pilot-santiago.com / TestPilot2024!
  # 2. Esperar redirección a /dashboard
  # 3. Token se guarda automáticamente en tests/.auth/state.json
  ```
- **Documentación:** Ver `tests/auth/README.md` y `AUTH_CAPTURE_FIX.md`

### 3. Datos Mínimos en Staging No Verificados
- **Causa raíz:** Sin acceso a Firebase Console o Admin SDK para verificar/crear datos
- **Impacto:** Tests de Fase 2 requieren:
  - ≥1 campaña activa en `organizations/pilot-org-santiago/campaigns`
  - ≥2 sesiones 360 en `evaluation360Sessions`
  - ≥8 asignaciones en `evaluatorAssignments` (1 con email inválido para DLQ)
- **Fix propuesto:**
  1. **Opción A - Firebase Console:**
     - Acceder a https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
     - Seguir guía en `scripts/MANUAL_STAGING_SETUP.md`
  2. **Opción B - Service Account:**
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
     node scripts/create-staging-user.cjs
     node scripts/seed-staging-data-real.cjs
     ```

---

## 📋 Tabla Detallada de Tests

### Fase 2 - Smoke Tests (@smoke)

| # | Test | Resultado | Tiempo | Notas |
|---|------|-----------|--------|-------|
| 1 | Rutas accesibles (200 OK) - Org Piloto | ⚠️ SKIP | - | Requiere auth + server |
| 2 | Feature flag gating - Org piloto | ⚠️ SKIP | - | Requiere auth + server |
| 3 | Bulk actions - Reenviar invitaciones | ⚠️ SKIP | - | Requiere auth + datos |
| 4 | Idempotencia - Bloqueo <24h | ⚠️ SKIP | - | Requiere auth + datos |
| 5 | Rate limits por plan | ⚠️ SKIP | - | Requiere auth |
| 6 | DLQ visible en /alerts | ⚠️ SKIP | - | Requiere auth + datos |
| 7 | Auditoría - Eventos registrados | ⚠️ SKIP | - | Requiere auth |
| 8 | Dashboard 360 performance | ⚠️ SKIP | - | Requiere auth + medición |
| 9 | Campaign comparison functional | ⚠️ SKIP | - | Requiere auth + datos |

### Tests Básicos (Intento Local)

| Categoría | Passed | Failed | Skipped | Total |
|-----------|--------|--------|---------|-------|
| Basic Smoke | 0 | 8 | 0 | 8 |
| Fase 2 Realistic | 0 | 4 | 0 | 4 |
| Fase 2 Smoke | 0 | 8 | 1 | 9 |
| Workspace | 0 | 8 | 0 | 8 |
| **TOTAL** | **0** | **28** | **1** | **29** |

**Causa de failures:** `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5178`

---

## ⚡ Performance Metrics

### p95 /dashboard-360

| Corrida | Tiempo (ms) | Estado | Target |
|---------|-------------|--------|--------|
| 1 | N/A | ⚠️ No ejecutado | <2000ms |
| 2 | N/A | ⚠️ No ejecutado | <2000ms |
| 3 | N/A | ⚠️ No ejecutado | <2000ms |

**p95 Final:** ⚠️ **No medido** (requiere 3 corridas exitosas)

**Criterio:** 2/3 corridas < 2s → **NO CUMPLIDO**

---

## 🔍 Verificaciones Específicas

### DLQ (Dead Letter Queue)

- **Verificado:** ❌ No
- **Esperado:** ≥1 ítem en `/alerts` con email inválido
- **Estado:** Requiere ejecución de tests de bulk actions
- **Fuente:** `organizations/pilot-org-santiago/evaluatorAssignments` con `evaluatorEmail: "invalid@test.local"`

### Idempotencia Bulk Actions

- **Verificado:** ❌ No
- **Esperado:** Reenvío bloqueado si <24h desde último envío
- **Estado:** Requiere test con 2 ejecuciones consecutivas
- **Mecanismo:** `lastBulkActionAt` timestamp + `idempotencyWindow: 86400000` (24h)

---

## 🎯 Criterios de Éxito vs Resultados

| Criterio | Target | Resultado | Estado |
|----------|--------|-----------|--------|
| Tests PASS/SKIP | ≥7/9 | 0/9 | ❌ **FAIL** |
| p95 dashboard | <2s (2/3) | N/A | ⚠️ **N/A** |
| DLQ items | ≥1 | N/A | ⚠️ **N/A** |
| Idempotencia activa | <24h block | N/A | ⚠️ **N/A** |

**Estado Final:** ❌ **NO CUMPLIDO** - Requiere intervención manual para desbloquear

---

## 📁 Artefactos Generados

| Tipo | Ruta | Estado |
|------|------|--------|
| Reporte HTML | `playwright-report/index.html` | ✅ Generado |
| Screenshots | `test-results/*/test-failed-*.png` | ✅ 28 capturas |
| Videos | `test-results/*/video.webm` | ✅ 28 videos |
| Auth State | `tests/.auth/state.json` | ⚠️ Expirado |
| Resumen | `docs/SMOKE_SUMMARY.md` | ✅ Este archivo |

---

## 🔧 Configuración Verificada

| Componente | Estado | Detalle |
|------------|--------|---------|
| Playwright reporter | ✅ OK | `list` + `html {open:'never'}` |
| Script smoke:ci | ✅ OK | `package.json` línea 51 |
| Firestore rules | ✅ OK | Solo `organizations/`, cero `orgs/` |
| Feature flags runtime | ✅ OK | Leen desde Firestore por orgId |
| Rutas staging | ✅ OK | `/dashboard-360`, `/comparison`, `/policies`, `/alerts` → 200 |
| Build | ✅ OK | Pasa sin errores (14s) |

---

## 🚀 Próximos Pasos (Orden Prioritario)

### 1. Desbloquear Servidor Local (Opcional - para tests locales)
```bash
# Terminal dedicada
cd "C:\01 Apps\360MVP"
npm run dev
# Mantener abierta
```

### 2. Capturar Auth Staging (CRÍTICO)
```bash
npm run test:auth:capture
# Login manual con admin@pilot-santiago.com / TestPilot2024!
```

### 3. Verificar/Crear Datos en Staging (CRÍTICO)
**Opción A - Firebase Console (más rápida):**
1. https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
2. Verificar `organizations/pilot-org-santiago/campaigns` tiene ≥1 doc
3. Si no existe, seguir `scripts/MANUAL_STAGING_SETUP.md`

**Opción B - Script con Service Account:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

### 4. Ejecutar Smoke Tests Staging
```bash
npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts
```

### 5. Medir Performance
```bash
# 3 corridas con medición de tiempos
for i in {1..3}; do
  echo "Corrida $i"
  curl -w "@curl-format.txt" -o /dev/null -s "https://mvp-staging-3e1cd.web.app/dashboard-360"
done
```

### 6. Verificar DLQ e Idempotencia
- Ejecutar tests de bulk actions (test #3 y #4)
- Verificar `/alerts` muestra email inválido
- Verificar reenvío bloqueado en <24h

---

## 📝 Notas Adicionales

1. **Auth Manual**: `test:auth:capture` es inherentemente manual (requiere login en navegador)
2. **Seeding**: Sin service account o acceso a Console, no es automatizable
3. **Performance**: p95 requiere 3 corridas exitosas con auth + datos
4. **DLQ**: Requiere asignación con email inválido en Firestore
5. **Tests locales**: Opcionales; staging es el target real

---

## 🎯 Recomendación

**Para QA completo:**
1. Usuario ejecuta `npm run test:auth:capture` (login manual)
2. DevOps/Admin verifica datos en Console o ejecuta scripts con service account
3. Re-ejecutar: `npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts`
4. Medir p95 con 3 requests a `/dashboard-360`
5. Verificar DLQ y logs de idempotencia

**Tiempo estimado:** 30-45 min (con datos existentes) | 1-2h (creando datos desde cero)

---

**Estado:** ⚠️ **Pendiente de intervención manual**  
**Próxima acción:** Capturar auth + verificar datos staging


**Fecha:** 2025-11-03  
**Entorno:** Staging (mvp-staging-3e1cd.web.app)  
**Usuario:** admin@pilot-santiago.com  
**Organización:** pilot-org-santiago

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Tests Totales** | 9 smoke tests Fase 2 | - |
| **Passed** | 0/9 | ❌ |
| **Failed** | 0/9 | - |
| **Skipped** | 9/9 | ⚠️ |
| **p95 Dashboard** | N/A | ⚠️ No ejecutado |
| **DLQ Items** | N/A | ⚠️ No verificado |
| **Idempotencia** | N/A | ⚠️ No verificado |

**Estado General:** ⚠️ **BLOQUEADO - Requiere intervención manual**

---

## 🚫 BLOQUEADORES CRÍTICOS

### 1. Servidor de Desarrollo No Disponible
- **Causa raíz:** Servidor local (127.0.0.1:5178) no se inició correctamente
- **Impacto:** Tests locales básicos fallaron (28 failed)
- **Fix propuesto:** 
  ```bash
  # Terminal dedicada:
  cd "C:\01 Apps\360MVP"
  npm run dev
  # Esperar mensaje "Server running at http://127.0.0.1:5178"
  ```

### 2. Autenticación de Staging Requiere Interacción Manual
- **Causa raíz:** `npm run test:auth:capture` requiere interacción manual del usuario
- **Impacto:** No se puede capturar token fresco automáticamente
- **Estado actual:** Token en `tests/.auth/state.json` expirado (exp: 1762198103)
- **Estado del script:** ✅ **CORREGIDO** - Ahora abre URL correcta de staging
- **Fix propuesto:**
  ```bash
  npm run test:auth:capture
  # El navegador abrirá https://mvp-staging-3e1cd.web.app/login
  # 1. Login con admin@pilot-santiago.com / TestPilot2024!
  # 2. Esperar redirección a /dashboard
  # 3. Token se guarda automáticamente en tests/.auth/state.json
  ```
- **Documentación:** Ver `tests/auth/README.md` y `AUTH_CAPTURE_FIX.md`

### 3. Datos Mínimos en Staging No Verificados
- **Causa raíz:** Sin acceso a Firebase Console o Admin SDK para verificar/crear datos
- **Impacto:** Tests de Fase 2 requieren:
  - ≥1 campaña activa en `organizations/pilot-org-santiago/campaigns`
  - ≥2 sesiones 360 en `evaluation360Sessions`
  - ≥8 asignaciones en `evaluatorAssignments` (1 con email inválido para DLQ)
- **Fix propuesto:**
  1. **Opción A - Firebase Console:**
     - Acceder a https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
     - Seguir guía en `scripts/MANUAL_STAGING_SETUP.md`
  2. **Opción B - Service Account:**
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
     node scripts/create-staging-user.cjs
     node scripts/seed-staging-data-real.cjs
     ```

---

## 📋 Tabla Detallada de Tests

### Fase 2 - Smoke Tests (@smoke)

| # | Test | Resultado | Tiempo | Notas |
|---|------|-----------|--------|-------|
| 1 | Rutas accesibles (200 OK) - Org Piloto | ⚠️ SKIP | - | Requiere auth + server |
| 2 | Feature flag gating - Org piloto | ⚠️ SKIP | - | Requiere auth + server |
| 3 | Bulk actions - Reenviar invitaciones | ⚠️ SKIP | - | Requiere auth + datos |
| 4 | Idempotencia - Bloqueo <24h | ⚠️ SKIP | - | Requiere auth + datos |
| 5 | Rate limits por plan | ⚠️ SKIP | - | Requiere auth |
| 6 | DLQ visible en /alerts | ⚠️ SKIP | - | Requiere auth + datos |
| 7 | Auditoría - Eventos registrados | ⚠️ SKIP | - | Requiere auth |
| 8 | Dashboard 360 performance | ⚠️ SKIP | - | Requiere auth + medición |
| 9 | Campaign comparison functional | ⚠️ SKIP | - | Requiere auth + datos |

### Tests Básicos (Intento Local)

| Categoría | Passed | Failed | Skipped | Total |
|-----------|--------|--------|---------|-------|
| Basic Smoke | 0 | 8 | 0 | 8 |
| Fase 2 Realistic | 0 | 4 | 0 | 4 |
| Fase 2 Smoke | 0 | 8 | 1 | 9 |
| Workspace | 0 | 8 | 0 | 8 |
| **TOTAL** | **0** | **28** | **1** | **29** |

**Causa de failures:** `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5178`

---

## ⚡ Performance Metrics

### p95 /dashboard-360

| Corrida | Tiempo (ms) | Estado | Target |
|---------|-------------|--------|--------|
| 1 | N/A | ⚠️ No ejecutado | <2000ms |
| 2 | N/A | ⚠️ No ejecutado | <2000ms |
| 3 | N/A | ⚠️ No ejecutado | <2000ms |

**p95 Final:** ⚠️ **No medido** (requiere 3 corridas exitosas)

**Criterio:** 2/3 corridas < 2s → **NO CUMPLIDO**

---

## 🔍 Verificaciones Específicas

### DLQ (Dead Letter Queue)

- **Verificado:** ❌ No
- **Esperado:** ≥1 ítem en `/alerts` con email inválido
- **Estado:** Requiere ejecución de tests de bulk actions
- **Fuente:** `organizations/pilot-org-santiago/evaluatorAssignments` con `evaluatorEmail: "invalid@test.local"`

### Idempotencia Bulk Actions

- **Verificado:** ❌ No
- **Esperado:** Reenvío bloqueado si <24h desde último envío
- **Estado:** Requiere test con 2 ejecuciones consecutivas
- **Mecanismo:** `lastBulkActionAt` timestamp + `idempotencyWindow: 86400000` (24h)

---

## 🎯 Criterios de Éxito vs Resultados

| Criterio | Target | Resultado | Estado |
|----------|--------|-----------|--------|
| Tests PASS/SKIP | ≥7/9 | 0/9 | ❌ **FAIL** |
| p95 dashboard | <2s (2/3) | N/A | ⚠️ **N/A** |
| DLQ items | ≥1 | N/A | ⚠️ **N/A** |
| Idempotencia activa | <24h block | N/A | ⚠️ **N/A** |

**Estado Final:** ❌ **NO CUMPLIDO** - Requiere intervención manual para desbloquear

---

## 📁 Artefactos Generados

| Tipo | Ruta | Estado |
|------|------|--------|
| Reporte HTML | `playwright-report/index.html` | ✅ Generado |
| Screenshots | `test-results/*/test-failed-*.png` | ✅ 28 capturas |
| Videos | `test-results/*/video.webm` | ✅ 28 videos |
| Auth State | `tests/.auth/state.json` | ⚠️ Expirado |
| Resumen | `docs/SMOKE_SUMMARY.md` | ✅ Este archivo |

---

## 🔧 Configuración Verificada

| Componente | Estado | Detalle |
|------------|--------|---------|
| Playwright reporter | ✅ OK | `list` + `html {open:'never'}` |
| Script smoke:ci | ✅ OK | `package.json` línea 51 |
| Firestore rules | ✅ OK | Solo `organizations/`, cero `orgs/` |
| Feature flags runtime | ✅ OK | Leen desde Firestore por orgId |
| Rutas staging | ✅ OK | `/dashboard-360`, `/comparison`, `/policies`, `/alerts` → 200 |
| Build | ✅ OK | Pasa sin errores (14s) |

---

## 🚀 Próximos Pasos (Orden Prioritario)

### 1. Desbloquear Servidor Local (Opcional - para tests locales)
```bash
# Terminal dedicada
cd "C:\01 Apps\360MVP"
npm run dev
# Mantener abierta
```

### 2. Capturar Auth Staging (CRÍTICO)
```bash
npm run test:auth:capture
# Login manual con admin@pilot-santiago.com / TestPilot2024!
```

### 3. Verificar/Crear Datos en Staging (CRÍTICO)
**Opción A - Firebase Console (más rápida):**
1. https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
2. Verificar `organizations/pilot-org-santiago/campaigns` tiene ≥1 doc
3. Si no existe, seguir `scripts/MANUAL_STAGING_SETUP.md`

**Opción B - Script con Service Account:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-staging-data-real.cjs
```

### 4. Ejecutar Smoke Tests Staging
```bash
npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts
```

### 5. Medir Performance
```bash
# 3 corridas con medición de tiempos
for i in {1..3}; do
  echo "Corrida $i"
  curl -w "@curl-format.txt" -o /dev/null -s "https://mvp-staging-3e1cd.web.app/dashboard-360"
done
```

### 6. Verificar DLQ e Idempotencia
- Ejecutar tests de bulk actions (test #3 y #4)
- Verificar `/alerts` muestra email inválido
- Verificar reenvío bloqueado en <24h

---

## 📝 Notas Adicionales

1. **Auth Manual**: `test:auth:capture` es inherentemente manual (requiere login en navegador)
2. **Seeding**: Sin service account o acceso a Console, no es automatizable
3. **Performance**: p95 requiere 3 corridas exitosas con auth + datos
4. **DLQ**: Requiere asignación con email inválido en Firestore
5. **Tests locales**: Opcionales; staging es el target real

---

## 🎯 Recomendación

**Para QA completo:**
1. Usuario ejecuta `npm run test:auth:capture` (login manual)
2. DevOps/Admin verifica datos en Console o ejecuta scripts con service account
3. Re-ejecutar: `npm run smoke:ci -- tests/smoke/fase2-smoke.test.ts`
4. Medir p95 con 3 requests a `/dashboard-360`
5. Verificar DLQ y logs de idempotencia

**Tiempo estimado:** 30-45 min (con datos existentes) | 1-2h (creando datos desde cero)

---

**Estado:** ⚠️ **Pendiente de intervención manual**  
**Próxima acción:** Capturar auth + verificar datos staging

