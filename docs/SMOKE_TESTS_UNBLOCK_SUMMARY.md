# Resumen: Desbloqueo de Smoke Tests Fase 2

**Estado**: ⏳ PENDIENTE EJECUCIÓN MANUAL  
**Bloqueador**: Requiere acceso a Firebase Console para crear usuario  
**ETA**: 30-45 minutos

---

## 🎯 Objetivo

Desbloquear y ejecutar exitosamente los smoke tests de Fase 2 en Staging.

---

## ✅ Trabajo Completado

### 1. Scripts Creados

| Script | Propósito | Status |
|--------|-----------|--------|
| `scripts/create-staging-user.js` | Crear usuario + vincular a org + feature flags | ✅ Listo |
| `scripts/seed-staging-data-real.js` | Crear campaña, sesiones, asignaciones | ✅ Listo |
| `tests/auth/auth.setup.ts` | Setup automático de autenticación | ✅ Listo |
| `tests/auth/capture-state.spec.ts` | Captura manual de auth state | ✅ Listo |

### 2. Tests Actualizados

| Test | Cambio | Status |
|------|--------|--------|
| `tests/smoke/fase2-smoke.test.ts` | Login condicional (usa storage state si existe) | ✅ Actualizado |
| `playwright.config.ts` | Proyecto 'setup' para auth automática | ✅ Configurado |

### 3. Documentación

| Documento | Contenido | Status |
|-----------|-----------|--------|
| `docs/SMOKE_TESTS_EXECUTION_GUIDE.md` | Guía completa paso a paso | ✅ Completo |
| `docs/SMOKE_TESTS_UNBLOCK_SUMMARY.md` | Este resumen | ✅ Completo |

---

## 🚨 Acciones Requeridas (MANUAL)

### Acción 1: Crear Usuario en Firebase Auth (5 min)

**⚠️ REQUIERE ACCESO A FIREBASE CONSOLE**

```
URL: https://console.firebase.google.com/project/mvp-staging-3e1cd/authentication/users

Pasos:
1. Click "Add user"
2. Email: admin@pilot-santiago.com
3. Password: TestPilot2024!
4. Save
5. Copiar UID generado
```

**O ejecutar script** (requiere Firebase Admin SDK configurado):
```bash
firebase login
firebase use mvp-staging-3e1cd
node scripts/create-staging-user.js
```

### Acción 2: Seed de Datos (5 min)

```bash
# Si Firebase Admin SDK está configurado
node scripts/seed-staging-data-real.js
```

**O crear manualmente en Firestore**:
- 1 campaña en `orgs/pilot-org-santiago/campaigns/`
- 12 asignaciones en `orgs/pilot-org-santiago/evaluatorAssignments/`
- 1 con email inválido: `invalid@test.local`

### Acción 3: Ejecutar Smoke Tests (5-10 min)

```bash
# Opción A: Con auth setup automático
npm run smoke:staging

# Opción B: Capturar auth manualmente primero
npm run test:auth:capture
playwright test tests/smoke --project=chromium --grep @smoke
```

---

## 📊 Resultados Esperados

### Tests (9 total)

| # | Test | Esperado | Notas |
|---|------|----------|-------|
| 1 | Rutas 200 OK | ✅ PASS | Crítico |
| 2 | Feature flag OFF | ⏭️ SKIP | Usuario no existe, esperado |
| 2b | Feature flag ON | ✅ PASS | Crítico |
| 3 | Performance p95 | ✅ PASS | 2/3 cargas < 2s |
| 4 | Reenviar invitaciones | ✅ PASS | Crítico |
| 5 | Idempotencia | ⚠️ PASS/INFO | Bloqueo comentado en dev |
| 6 | Rate limits | ⚠️ PASS/INFO | Verificación básica |
| 7 | DLQ visible | ✅ PASS | Página accesible |
| 8 | Auditoría | ✅ PASS | Sección visible |

**Criterio GO**: 7/9 PASS (tests críticos: 1, 2b, 3, 4)

### Evidencias

Después de ejecutar, se generará:

```
test-results/                     - Screenshots de fallos
playwright-report/index.html      - Reporte HTML interactivo
tests/.auth/state.json            - Estado de autenticación
```

---

## 🐛 Posibles Fallos y Soluciones

### Fallo: Auth timeout

**Causa**: Usuario no existe o credenciales incorrectas

**Solución**:
```bash
# Verificar usuario en Firebase Console
# O ejecutar
node scripts/create-staging-user.js
```

### Fallo: "Function no disponible"

**Causa**: Feature flags no activados

**Solución**:
```bash
# El script create-staging-user.js ya lo hace
# O activar manualmente en Firestore:
#   orgs/pilot-org-santiago/featureFlags
```

### Fallo: "No assignments found"

**Causa**: Datos no seedeados

**Solución**:
```bash
node scripts/seed-staging-data-real.js
```

### Fallo: Performance < 2s

**Causa**: Staging lento o datos pesados

**Solución**: Aceptable si 1/3 pasa (ajustar expectativa o mejorar infra)

---

## 📋 Checklist de Ejecución

```markdown
### Pre-Ejecución
- [ ] Firebase CLI configurado (`firebase use mvp-staging-3e1cd`)
- [ ] Acceso a Firebase Console
- [ ] Node.js instalado
- [ ] Playwright instalado (`npx playwright install`)

### Ejecución
- [ ] Paso 1: Crear usuario
  - [ ] Ejecutar: `node scripts/create-staging-user.js`
  - [ ] O crear manualmente en Firebase Console
  - [ ] Verificar: Usuario existe en Authentication
  - [ ] Verificar: Usuario en `orgs/pilot-org-santiago/members/`
  
- [ ] Paso 2: Seed de datos
  - [ ] Ejecutar: `node scripts/seed-staging-data-real.js`
  - [ ] Verificar: Campaña creada
  - [ ] Verificar: 12+ asignaciones creadas
  - [ ] Verificar: 1 email inválido (`invalid@test.local`)
  
- [ ] Paso 3: Ejecutar tests
  - [ ] Ejecutar: `npm run smoke:staging`
  - [ ] Esperar resultados (2-5 minutos)
  - [ ] Revisar reporte HTML
  
### Post-Ejecución
- [ ] Capturar screenshots de resultados
- [ ] Revisar `playwright-report/index.html`
- [ ] Documentar resultados en reporte
- [ ] Identificar fallos (si los hay)
- [ ] Crear issues para fallos P0/P1
```

---

## 📝 Template de Reporte

Después de ejecutar, completar este template:

```markdown
# Smoke Tests Results - Fase 2

**Fecha**: [YYYY-MM-DD HH:MM]
**Entorno**: Staging (mvp-staging-3e1cd)
**Ejecutor**: [Nombre]
**Commit**: [git hash]

## Resumen

- Tests ejecutados: 9
- Tests pasados: X/9
- Tests fallidos: Y/9
- Tests skipped: 1
- Duración total: Xm Ys

## Resultados Detallados

### ✅ Tests Pasados (X)

1. **Rutas 200 OK**: ✅ PASS
   - `/dashboard-360`: 200 OK, carga en Xms
   - `/bulk-actions`: 200 OK, carga en Xms
   - `/alerts`: 200 OK, carga en Xms

[Continuar con cada test...]

### ❌ Tests Fallidos (Y)

[Si hay fallos, documentar:]

X. **[Nombre del test]**: ❌ FAIL
   - Error: [mensaje de error]
   - Screenshot: [ruta]
   - Causa probable: [análisis]
   - Severidad: P0/P1/P2
   - Fix propuesto: [descripción]

### ⏭️ Tests Skipped (1)

2. **Feature flag gating - Org NO piloto**: ⏭️ SKIP
   - Razón: Usuario de prueba no existe (esperado)

## Evidencias

- Reporte HTML: `playwright-report/index.html`
- Screenshots: `test-results/`
- Video: `test-results/[test-name]/video.webm`
- Auth state: `tests/.auth/state.json`

## Métricas

- Performance p95: Xms (Target: <2000ms)
- Tasa de éxito: X/9 (XX%)
- Tiempo de ejecución: Xm Ys

## Issues Encontrados

[Si hay issues P0/P1:]

- **[ID]**: [Título] (P0/P1)
  - Descripción: [breve]
  - Pasos para reproducir: [lista]
  - Fix: [propuesta]

## Conclusión

**Estado**: ✅ GO / ❌ NO-GO

[Justificación basada en criterio: 7/9 PASS con tests críticos]

## Próximos Pasos

[Si GO:]
- [ ] Proceder con M8-PR3
- [ ] Documentar en changelog

[Si NO-GO:]
- [ ] Fix issues P0
- [ ] Re-ejecutar smoke tests
- [ ] Validar correcciones
```

---

## 🎯 Criterio de Éxito Final

**GO**: 7/9 tests PASS, incluyendo tests críticos (1, 2b, 3, 4)

**Tests críticos**:
- ✅ Rutas 200 OK
- ✅ Feature flag ON funcionando
- ✅ Performance aceptable
- ✅ Acciones masivas funcionando

**Tests opcionales** (pueden fallar sin bloquear):
- Idempotencia (implementación comentada)
- Rate limits (verificación básica)
- DLQ con datos (puede estar vacío)
- Auditoría con registros (puede estar vacío)

---

**Última actualización**: 2025-10-21  
**Versión**: 1.0.0




