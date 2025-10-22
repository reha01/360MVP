# Guía de Ejecución: Smoke Tests Fase 2 - Staging

**Fecha**: 2025-10-21  
**Entorno**: Staging (https://mvp-staging-3e1cd.web.app)  
**Objetivo**: Desbloquear y ejecutar smoke tests end-to-end

---

## 🚀 Ejecución Rápida (Si ya tienes todo configurado)

```bash
# 1. Autenticar automáticamente
npm run smoke:staging

# O ejecutar setup + tests en un solo comando
playwright test tests/auth/auth.setup.ts tests/smoke/fase2-smoke.test.ts --project=chromium --grep @smoke
```

---

## 📋 Configuración Inicial (Primera vez)

### Paso 1: Crear Usuario en Firebase (MANUAL)

**⚠️ IMPORTANTE**: Esto debe hacerse manualmente en Firebase Console

1. Ir a: https://console.firebase.google.com/project/mvp-staging-3e1cd/authentication/users

2. Click en "Add user"

3. Crear usuario:
   ```
   Email: admin@pilot-santiago.com
   Password: TestPilot2024!
   ```

4. Copiar el UID generado  UID: S1SE2ynl3dQ9ohjMz5hj5h2sJx02

---

### Paso 2: Vincular Usuario a Organización (MANUAL O SCRIPT)

#### Opción A: Firebase Console (Manual)

1. Ir a: https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore

2. Navegar a: `orgs/pilot-org-santiago/members/`

3. Crear documento con ID = UID del usuario:
   ```json
   {
     "email": "admin@pilot-santiago.com",
     "role": "admin",
     "active": true,
     "joinedAt": [Timestamp actual],
     "displayName": "Admin Santiago"
   }
   ```

#### Opción B: Script (RECOMENDADO)

```bash
# Instalar dependencias si no están
npm install firebase-admin

# Configurar Firebase CLI
firebase login
firebase use mvp-staging-3e1cd

# Ejecutar script
node scripts/create-staging-user.js
```

---

### Paso 3: Activar Feature Flags

#### Opción A: Firebase Console (Manual)

1. Ir a Firestore: `orgs/pilot-org-santiago`

2. Agregar/actualizar campo:
   ```json
   {
     "featureFlags": {
       "FEATURE_BULK_ACTIONS": true,
       "FEATURE_DASHBOARD_360": true,
       "FEATURE_CAMPAIGN_COMPARISON": true,
       "FEATURE_ORG_POLICIES": true,
       "FEATURE_OPERATIONAL_ALERTS": true
     }
   }
   ```

#### Opción B: Script (incluido en create-staging-user.js)

```bash
# Ya incluido en el script anterior
node scripts/create-staging-user.js
```

---

### Paso 4: Seed de Datos

```bash
# Ejecutar script de seeding
node scripts/seed-staging-data-real.js
```

**Esto creará**:
- 1 Test Definition (evaluación 360°)
- 1 Campaña activa
- 3 Sesiones 360 (evaluados)
- 12 Asignaciones (1 con email inválido: invalid@test.local)
- Estados variados (pending/completed)

---

### Paso 5: Ejecutar Smoke Tests

#### Opción A: Con Auth Setup Automático (RECOMENDADO)

```bash
# Esto ejecutará auth.setup.ts primero, luego los tests
npm run smoke:staging
```

#### Opción B: Capturar Auth Manualmente

```bash
# Capturar estado de autenticación
npm run test:auth:capture

# Ejecutar tests con estado guardado
STORAGE_STATE=tests/.auth/state.json npm run smoke:staging
```

---

## 📊 Resultados Esperados

### Tests que deben PASAR (8/9)

1. ✅ **Rutas 200 OK**: `/dashboard-360`, `/bulk-actions`, `/alerts`
2. ⏭️ **Feature flag OFF**: Skipped (usuario no existe)
3. ✅ **Feature flag ON**: Org piloto accede correctamente
4. ✅ **Performance p95**: 2/3 cargas < 2s
5. ✅ **Reenviar invitaciones**: Progreso 0→100%, resultado OK
6. ✅ **Idempotencia**: (Nota: comentado en dev, pero estructura OK)
7. ✅ **Rate limits**: (Verificación básica)
8. ✅ **DLQ visible**: Página accesible (puede estar vacía)
9. ✅ **Auditoría**: Sección visible (puede estar vacía)

### Criterio GO

- ✅ 7/9 tests PASS (mínimo)
- ✅ Tests críticos (1, 3, 4, 5) deben pasar
- ⚠️ Tests 6, 7 pueden fallar por limitaciones de seeding (aceptable)

---

## 🐛 Troubleshooting

### Error: "TimeoutError: page.waitForURL"

**Causa**: Credenciales incorrectas o usuario no existe

**Solución**:
1. Verificar que el usuario existe en Firebase Auth
2. Verificar credenciales en auth.setup.ts
3. Re-ejecutar: `node scripts/create-staging-user.js`

### Error: "User not found"

**Causa**: Usuario no vinculado a la organización

**Solución**:
1. Verificar en Firestore: `orgs/pilot-org-santiago/members/{uid}`
2. Ejecutar: `node scripts/create-staging-user.js`

### Error: "Function no disponible"

**Causa**: Feature flags no activados

**Solución**:
1. Verificar en Firestore: `orgs/pilot-org-santiago/featureFlags`
2. Activar manualmente o ejecutar script

### Error: "No assignments found"

**Causa**: Datos no seedeados

**Solución**:
```bash
node scripts/seed-staging-data-real.js
```

### Tests pasan pero sin datos reales

**Solución**: Verificar en Firestore que existen:
- `orgs/pilot-org-santiago/campaigns/`
- `orgs/pilot-org-santiago/evaluatorAssignments/`

---

## 📸 Evidencias

Después de ejecutar los tests, encontrarás:

### Screenshots (en fallos)
```
test-results/
  smoke-fase2-smoke-Fase-2---{test-name}-chromium/
    test-failed-1.png
    video.webm
```

### Reporte HTML
```
playwright-report/index.html
```

Abrir automáticamente con:
```bash
playwright show-report
```

---

## 🎯 Checklist Final

Antes de reportar resultados:

- [ ] Usuario creado en Firebase Auth
- [ ] Usuario vinculado a `pilot-org-santiago`
- [ ] Feature flags activados
- [ ] Datos seedeados (campaña + asignaciones)
- [ ] Auth setup ejecutado correctamente
- [ ] Tests ejecutados: `npm run smoke:staging`
- [ ] Screenshots capturados (en fallos)
- [ ] Reporte HTML generado
- [ ] Resultados documentados

---

## 📝 Reportar Resultados

Después de ejecutar los tests, crear reporte con:

```markdown
# Smoke Tests Results - Fase 2

**Fecha**: [fecha]
**Ejecutor**: [nombre]
**Commit**: [git rev-parse HEAD]

## Resultados

- Tests ejecutados: 9
- Tests pasados: X/9
- Tests fallidos: Y/9
- Tests skipped: 1

## Detalles por Test

1. Rutas 200 OK: ✅ PASS
2. Feature flag gating: ⏭️ SKIP
3. Performance p95: ✅ PASS
... 

## Evidencias

- Screenshots: [carpeta]
- Reporte HTML: playwright-report/index.html
- Video: [link]

## Issues Encontrados

- [Describir issues si los hay]

## Notas

- [Observaciones adicionales]
```

---

**Última actualización**: 2025-10-21  
**Versión**: 2.0.0




