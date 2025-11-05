# ✅ Fix: Captura de Autenticación Corregida

## Problema Original
El script `test:auth:capture` abría `about:blank` en vez de la URL de login porque:
- El comando usaba `STAGING_BASE_URL`
- Pero el navegador usaba el proyecto `chromium` que tiene `baseURL` configurado con fallback a local
- El proyecto tenía dependencia de `setup` que ejecutaba auto-login

## Solución Implementada

### 1. Nuevo Proyecto `auth-capture` en playwright.config.ts

```typescript
// Proyecto dedicado para captura MANUAL (sin auto-login)
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

**Características:**
- ✅ NO tiene dependencia de `setup` (no ejecuta auto-login)
- ✅ `storageState: undefined` (empieza sin autenticación)
- ✅ Solo matchea `capture-state.spec.ts`

### 2. Actualizado `capture-state.spec.ts`

```typescript
const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';
const authFile = path.join(__dirname, '../.auth/state.json');

test('capture auth state', async ({ page, context }) => {
  console.log(`📍 URL Staging: ${STAGING_URL}`);
  await page.goto(`${STAGING_URL}/login`);
  
  // Espera login manual
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select)/, { timeout: 120000 });
  
  // Guarda estado explícitamente
  await context.storageState({ path: authFile });
});
```

**Mejoras:**
- ✅ Lee `STAGING_BASE_URL` correctamente
- ✅ Logs detallados (URL, archivo destino)
- ✅ Espera múltiples rutas posibles post-login
- ✅ Guarda estado explícitamente con `context.storageState()`

### 3. Actualizado comando en package.json

```json
"test:auth:capture": "cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app playwright test tests/auth/capture-state.spec.ts --project=auth-capture --headed"
```

**Cambios:**
- ✅ Usa `--project=auth-capture` (antes era `chromium`)
- ✅ Removido `--debug` (ya no necesario)
- ✅ Mantiene `--headed` (necesario para login manual)

### 4. Creado README de Auth

Archivo: `tests/auth/README.md`
- Instrucciones completas de uso
- Troubleshooting
- Ejemplos de flujo

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `playwright.config.ts` | + Proyecto `auth-capture` (líneas 47-56) |
| `tests/auth/capture-state.spec.ts` | Mejorado con logs, guardado explícito, rutas flexibles |
| `package.json` | Comando actualizado a `--project=auth-capture` |
| `tests/auth/README.md` | Nuevo - documentación completa |

## Cómo Usar Ahora

```bash
# Ejecutar captura de auth
npm run test:auth:capture

# El navegador abrirá en https://mvp-staging-3e1cd.web.app/login
# Hacer login con:
#   Email: admin@pilot-santiago.com
#   Password: TestPilot2024!

# Después de login exitoso, el estado se guarda automáticamente
# Archivo: tests/.auth/state.json
```

## Verificación

```bash
# Después de capturar auth, ejecutar smoke tests:
npm run smoke:staging

# O directamente:
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke/fase2-smoke.test.ts
```

## Antes vs Después

### Antes ❌
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto chromium
3. Proyecto chromium tiene baseURL local (fallback)
4. Navegador abre about:blank
5. STAGING_BASE_URL se ignora
```

### Después ✅
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto auth-capture
3. Script lee STAGING_BASE_URL directamente
4. Navegador abre https://mvp-staging-3e1cd.web.app/login
5. Usuario hace login manualmente
6. Estado se guarda en tests/.auth/state.json
```

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| Variable de entorno | ✅ `STAGING_BASE_URL` leída correctamente |
| Proyecto Playwright | ✅ `auth-capture` dedicado |
| Storage state | ✅ Guardado explícitamente |
| Navegación | ✅ URL correcta de staging |
| Login manual | ✅ Espera usuario (120s timeout) |
| Documentación | ✅ README completo |

## Próximos Pasos

1. **Ejecutar captura:**
   ```bash
   npm run test:auth:capture
   ```

2. **Verificar archivo generado:**
   ```bash
   cat tests/.auth/state.json | grep "email"
   # Debería mostrar: "admin@pilot-santiago.com"
   ```

3. **Usar en smoke tests:**
   ```bash
   npm run smoke:staging
   ```

---

**Fix aplicado:** ✅  
**Fecha:** 2025-11-03  
**Tests listos para:** Staging (mvp-staging-3e1cd.web.app)








## Problema Original
El script `test:auth:capture` abría `about:blank` en vez de la URL de login porque:
- El comando usaba `STAGING_BASE_URL`
- Pero el navegador usaba el proyecto `chromium` que tiene `baseURL` configurado con fallback a local
- El proyecto tenía dependencia de `setup` que ejecutaba auto-login

## Solución Implementada

### 1. Nuevo Proyecto `auth-capture` en playwright.config.ts

```typescript
// Proyecto dedicado para captura MANUAL (sin auto-login)
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

**Características:**
- ✅ NO tiene dependencia de `setup` (no ejecuta auto-login)
- ✅ `storageState: undefined` (empieza sin autenticación)
- ✅ Solo matchea `capture-state.spec.ts`

### 2. Actualizado `capture-state.spec.ts`

```typescript
const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';
const authFile = path.join(__dirname, '../.auth/state.json');

test('capture auth state', async ({ page, context }) => {
  console.log(`📍 URL Staging: ${STAGING_URL}`);
  await page.goto(`${STAGING_URL}/login`);
  
  // Espera login manual
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select)/, { timeout: 120000 });
  
  // Guarda estado explícitamente
  await context.storageState({ path: authFile });
});
```

**Mejoras:**
- ✅ Lee `STAGING_BASE_URL` correctamente
- ✅ Logs detallados (URL, archivo destino)
- ✅ Espera múltiples rutas posibles post-login
- ✅ Guarda estado explícitamente con `context.storageState()`

### 3. Actualizado comando en package.json

```json
"test:auth:capture": "cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app playwright test tests/auth/capture-state.spec.ts --project=auth-capture --headed"
```

**Cambios:**
- ✅ Usa `--project=auth-capture` (antes era `chromium`)
- ✅ Removido `--debug` (ya no necesario)
- ✅ Mantiene `--headed` (necesario para login manual)

### 4. Creado README de Auth

Archivo: `tests/auth/README.md`
- Instrucciones completas de uso
- Troubleshooting
- Ejemplos de flujo

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `playwright.config.ts` | + Proyecto `auth-capture` (líneas 47-56) |
| `tests/auth/capture-state.spec.ts` | Mejorado con logs, guardado explícito, rutas flexibles |
| `package.json` | Comando actualizado a `--project=auth-capture` |
| `tests/auth/README.md` | Nuevo - documentación completa |

## Cómo Usar Ahora

```bash
# Ejecutar captura de auth
npm run test:auth:capture

# El navegador abrirá en https://mvp-staging-3e1cd.web.app/login
# Hacer login con:
#   Email: admin@pilot-santiago.com
#   Password: TestPilot2024!

# Después de login exitoso, el estado se guarda automáticamente
# Archivo: tests/.auth/state.json
```

## Verificación

```bash
# Después de capturar auth, ejecutar smoke tests:
npm run smoke:staging

# O directamente:
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke/fase2-smoke.test.ts
```

## Antes vs Después

### Antes ❌
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto chromium
3. Proyecto chromium tiene baseURL local (fallback)
4. Navegador abre about:blank
5. STAGING_BASE_URL se ignora
```

### Después ✅
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto auth-capture
3. Script lee STAGING_BASE_URL directamente
4. Navegador abre https://mvp-staging-3e1cd.web.app/login
5. Usuario hace login manualmente
6. Estado se guarda en tests/.auth/state.json
```

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| Variable de entorno | ✅ `STAGING_BASE_URL` leída correctamente |
| Proyecto Playwright | ✅ `auth-capture` dedicado |
| Storage state | ✅ Guardado explícitamente |
| Navegación | ✅ URL correcta de staging |
| Login manual | ✅ Espera usuario (120s timeout) |
| Documentación | ✅ README completo |

## Próximos Pasos

1. **Ejecutar captura:**
   ```bash
   npm run test:auth:capture
   ```

2. **Verificar archivo generado:**
   ```bash
   cat tests/.auth/state.json | grep "email"
   # Debería mostrar: "admin@pilot-santiago.com"
   ```

3. **Usar en smoke tests:**
   ```bash
   npm run smoke:staging
   ```

---

**Fix aplicado:** ✅  
**Fecha:** 2025-11-03  
**Tests listos para:** Staging (mvp-staging-3e1cd.web.app)








## Problema Original
El script `test:auth:capture` abría `about:blank` en vez de la URL de login porque:
- El comando usaba `STAGING_BASE_URL`
- Pero el navegador usaba el proyecto `chromium` que tiene `baseURL` configurado con fallback a local
- El proyecto tenía dependencia de `setup` que ejecutaba auto-login

## Solución Implementada

### 1. Nuevo Proyecto `auth-capture` en playwright.config.ts

```typescript
// Proyecto dedicado para captura MANUAL (sin auto-login)
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

**Características:**
- ✅ NO tiene dependencia de `setup` (no ejecuta auto-login)
- ✅ `storageState: undefined` (empieza sin autenticación)
- ✅ Solo matchea `capture-state.spec.ts`

### 2. Actualizado `capture-state.spec.ts`

```typescript
const STAGING_URL = process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app';
const authFile = path.join(__dirname, '../.auth/state.json');

test('capture auth state', async ({ page, context }) => {
  console.log(`📍 URL Staging: ${STAGING_URL}`);
  await page.goto(`${STAGING_URL}/login`);
  
  // Espera login manual
  await page.waitForURL(/\/(dashboard|select-workspace|workspace-select)/, { timeout: 120000 });
  
  // Guarda estado explícitamente
  await context.storageState({ path: authFile });
});
```

**Mejoras:**
- ✅ Lee `STAGING_BASE_URL` correctamente
- ✅ Logs detallados (URL, archivo destino)
- ✅ Espera múltiples rutas posibles post-login
- ✅ Guarda estado explícitamente con `context.storageState()`

### 3. Actualizado comando en package.json

```json
"test:auth:capture": "cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app playwright test tests/auth/capture-state.spec.ts --project=auth-capture --headed"
```

**Cambios:**
- ✅ Usa `--project=auth-capture` (antes era `chromium`)
- ✅ Removido `--debug` (ya no necesario)
- ✅ Mantiene `--headed` (necesario para login manual)

### 4. Creado README de Auth

Archivo: `tests/auth/README.md`
- Instrucciones completas de uso
- Troubleshooting
- Ejemplos de flujo

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `playwright.config.ts` | + Proyecto `auth-capture` (líneas 47-56) |
| `tests/auth/capture-state.spec.ts` | Mejorado con logs, guardado explícito, rutas flexibles |
| `package.json` | Comando actualizado a `--project=auth-capture` |
| `tests/auth/README.md` | Nuevo - documentación completa |

## Cómo Usar Ahora

```bash
# Ejecutar captura de auth
npm run test:auth:capture

# El navegador abrirá en https://mvp-staging-3e1cd.web.app/login
# Hacer login con:
#   Email: admin@pilot-santiago.com
#   Password: TestPilot2024!

# Después de login exitoso, el estado se guarda automáticamente
# Archivo: tests/.auth/state.json
```

## Verificación

```bash
# Después de capturar auth, ejecutar smoke tests:
npm run smoke:staging

# O directamente:
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke/fase2-smoke.test.ts
```

## Antes vs Después

### Antes ❌
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto chromium
3. Proyecto chromium tiene baseURL local (fallback)
4. Navegador abre about:blank
5. STAGING_BASE_URL se ignora
```

### Después ✅
```
1. Comando usa STAGING_BASE_URL
2. Playwright usa proyecto auth-capture
3. Script lee STAGING_BASE_URL directamente
4. Navegador abre https://mvp-staging-3e1cd.web.app/login
5. Usuario hace login manualmente
6. Estado se guarda en tests/.auth/state.json
```

## Estado del Sistema

| Componente | Estado |
|------------|--------|
| Variable de entorno | ✅ `STAGING_BASE_URL` leída correctamente |
| Proyecto Playwright | ✅ `auth-capture` dedicado |
| Storage state | ✅ Guardado explícitamente |
| Navegación | ✅ URL correcta de staging |
| Login manual | ✅ Espera usuario (120s timeout) |
| Documentación | ✅ README completo |

## Próximos Pasos

1. **Ejecutar captura:**
   ```bash
   npm run test:auth:capture
   ```

2. **Verificar archivo generado:**
   ```bash
   cat tests/.auth/state.json | grep "email"
   # Debería mostrar: "admin@pilot-santiago.com"
   ```

3. **Usar en smoke tests:**
   ```bash
   npm run smoke:staging
   ```

---

**Fix aplicado:** ✅  
**Fecha:** 2025-11-03  
**Tests listos para:** Staging (mvp-staging-3e1cd.web.app)







