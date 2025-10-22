# Smoke Tests Fase 2 - Reporte de Ejecución

**Fecha**: 2025-10-21  
**Entorno**: Staging (https://mvp-staging-3e1cd.web.app)  
**Ejecutor**: AI Assistant  
**Estado**: ❌ FAILED (8/9 fallos por autenticación)

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests ejecutados | 9 |
| Tests pasados | 0 |
| Tests fallidos | 8 |
| Tests omitidos | 1 |
| Cobertura | 0% |
| Tiempo total | ~30s |

**Criterio GO**: ❌ NO CUMPLIDO (requiere 8/8 PASS)

---

## 🚨 Problema Principal

**Todos los tests fallan por el mismo motivo**: Timeout en autenticación

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation to "https://mvp-staging-3e1cd.web.app/dashboard" until "load"
```

**Causa Raíz**: Las credenciales de prueba no existen en Staging o la ruta post-login es diferente.

---

## 📋 Resultados por Test

### ❌ Test 1: Rutas accesibles (200 OK)
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)
- **Screenshot**: `test-results/smoke-fase2-smoke-Fase-2---f64b5-00-OK---Org-Piloto-Santiago-chromium/test-failed-1.png`

### ⏭️ Test 2: Feature flag gating - Org NO piloto
- **Estado**: SKIPPED
- **Causa**: Usuario no existe, test se omitió intencionalmente
- **Severidad**: P2 (informativo)

### ❌ Test 2b: Feature flag gating - Org piloto
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 3: Performance p95 informal
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 4: Acciones masivas - Reenviar
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 5: Idempotencia
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 6: Rate limits
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 7: DLQ visible
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

### ❌ Test 8: Auditoría mínima
- **Estado**: FAILED
- **Causa**: Login timeout
- **Severidad**: P0 (bloqueante)

---

## 🔍 Análisis de Issues

### Issue #1: Credenciales de Staging no existen
- **Label**: `phase2-smoke`
- **Severidad**: P0
- **Título**: Credenciales de prueba no existen en Staging
- **Descripción**: 
  - Las credenciales hardcodeadas en los tests no existen en Staging
  - Usuario: `admin@pilot-santiago.com` / `password123`
  - Usuario: `admin@pilot-mexico.com` / `password123`
- **Impacto**: Bloquea TODOS los smoke tests
- **Pasos para reproducir**:
  1. Ir a https://mvp-staging-3e1cd.web.app/login
  2. Intentar login con `admin@pilot-santiago.com` / `password123`
  3. Error: Usuario no existe o credenciales incorrectas
- **Evidencia**: 
  - 8 screenshots en `test-results/`
  - Timeout consistente en `page.waitForURL('/dashboard')`
- **Timestamp**: 2025-10-21T14:00:00Z

### Issue #2: Falta seeding de datos en Staging
- **Label**: `phase2-smoke`, `data-seeding`
- **Severidad**: P0
- **Título**: Datos mínimos no existen en orgs piloto
- **Descripción**:
  - Aún si el login funcionara, faltan datos para los tests:
    - ≥1 campaña activa
    - ≥10 asignaciones
    - 1 email inválido para DLQ
- **Impacto**: Tests 4-8 fallarían por falta de datos
- **Solución requerida**: Ejecutar script de seeding

---

## 🛠️ Plan de Corrección

### Acción 1: Crear usuarios de prueba en Staging (P0)
**ETA**: 1 hora  
**Responsable**: DevOps / Admin

**Opciones**:

#### Opción A: Crear usuarios manualmente en Firebase
```bash
# En Firebase Console > Authentication
1. Crear usuario: admin@pilot-santiago.com
   - Password: [usar password seguro]
   - Asignar a organización: pilot-org-santiago
   
2. Crear usuario: admin@pilot-mexico.com
   - Password: [usar password seguro]
   - Asignar a organización: pilot-org-mexico
```

#### Opción B: Usar variables de entorno con credenciales reales
```bash
# En .env.staging o GitHub Secrets
PILOT_SANTIAGO_EMAIL=admin@real-org.com
PILOT_SANTIAGO_PASSWORD=real-password-from-1password
PILOT_MEXICO_EMAIL=admin@real-org-mexico.com
PILOT_MEXICO_PASSWORD=real-password-from-1password
```

#### Opción C: Usar Playwright auth storage (RECOMENDADO)
```bash
# Capturar estado de autenticación una vez
npm run test:auth:capture

# Usar en todos los tests
STORAGE_STATE=tests/.auth/state.json playwright test
```

### Acción 2: Seed de datos en Staging (P0)
**ETA**: 30 minutos

```bash
# Ejecutar script de seeding
node scripts/seed-staging-data.js

# Verificar datos creados
- 2 orgs piloto (santiago, mexico)
- ≥2 campañas activas
- ≥20 asignaciones (10 por org)
- 2 emails inválidos (invalid@test.local)
```

### Acción 3: Re-ejecutar smoke tests (P0)
**ETA**: 15 minutos

```bash
# Con credenciales correctas
PILOT_SANTIAGO_EMAIL=real@email.com \
PILOT_SANTIAGO_PASSWORD=real-pass \
npm run smoke:staging

# O con auth storage
npm run test:smoke:staging:auth
```

---

## 📝 Recomendaciones

### Inmediatas (P0)
1. ✅ **Crear script de setup de Staging**: Automatizar creación de usuarios y datos
2. ✅ **Documentar credenciales**: En 1Password o similar, no en código
3. ✅ **Usar Playwright auth storage**: Más robusto que login en cada test

### Corto plazo (P1)
4. **Implementar health check endpoint**: `/api/health` que retorne estado de datos
5. **Crear script de cleanup**: Limpiar datos de prueba después de smoke tests
6. **CI/CD integration**: Ejecutar smoke tests automáticamente en cada deploy

### Largo plazo (P2)
7. **Entorno de staging permanente**: Con datos sintéticos persistentes
8. **Monitoreo de smoke tests**: Alertas si fallan > 2 veces consecutivas

---

## 🎯 Criterios de Éxito (Re-ejecución)

Para considerar los smoke tests como **PASS**:

- ✅ 8/9 tests pasando (mínimo)
- ✅ Test 1: Rutas 200 OK
- ✅ Test 2b: Feature flags funcionando
- ✅ Test 3: Performance < 2s (2/3 cargas)
- ✅ Test 4: Reenvío de invitaciones completo
- ✅ Test 5: Idempotencia validada
- ✅ Test 6: Rate limits verificados
- ✅ Test 7: DLQ visible con al menos 1 item
- ✅ Test 8: Auditoría con eventos mínimos

---

## 📦 Entregables

### Completados ✅
- ✅ Script de smoke tests: `tests/smoke/fase2-smoke.test.ts`
- ✅ Configuración npm: `smoke:staging` en `package.json`
- ✅ Reporte de ejecución: Este documento

### Pendientes ⏳
- ⏳ Credenciales válidas en Staging
- ⏳ Datos seedeados en orgs piloto
- ⏳ Re-ejecución exitosa de smoke tests
- ⏳ Screenshots de tests pasando
- ⏳ Métricas de performance reales

---

## 🔄 Próximos Pasos

### Paso 1: Configurar Staging (1-2 horas)
```bash
# 1. Crear usuarios en Firebase Auth
# 2. Ejecutar seeding
node scripts/seed-staging-data.js --org pilot-org-santiago --org pilot-org-mexico

# 3. Verificar datos
node scripts/verify-staging-data.js
```

### Paso 2: Capturar auth state (5 min)
```bash
# Usar credenciales reales
npm run test:auth:capture
```

### Paso 3: Re-ejecutar smoke tests (15 min)
```bash
# Con auth storage
npm run test:smoke:staging:auth

# O con variables de entorno
PILOT_SANTIAGO_EMAIL=... \
PILOT_SANTIAGO_PASSWORD=... \
npm run smoke:staging
```

### Paso 4: Validar resultados
- ✅ 8/9 tests PASS
- ✅ Screenshots sin errores
- ✅ Métricas dentro de SLAs
- ✅ DLQ con items visibles
- ✅ Auditoría con eventos

---

## 🚦 Estado Final

**Status**: ❌ **BLOQUEADO** por falta de credenciales y datos en Staging

**Acción Requerida**: 
1. Crear usuarios de prueba en Staging
2. Ejecutar seeding de datos
3. Re-ejecutar smoke tests

**ETA para GO**: 2-3 horas (incluyendo setup y re-ejecución)

---

**Firma**: AI Assistant  
**Fecha**: 2025-10-21  
**Versión**: 1.0.0




