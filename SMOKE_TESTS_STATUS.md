# 🧪 Status de Smoke Tests - Nov 3, 2025

## ✅ Completado (Ítems 1-4)

### 1️⃣ Playwright Reporter Configurado
- ✅ Archivo: `playwright.config.ts` líneas 17-20
- ✅ Reporter: `['list']` + `['html', { open: 'never' }]`
- ✅ Listo para CI/CD

### 2️⃣ Script `smoke:ci` Creado
- ✅ Archivo: `package.json` línea 51
- ✅ Comando: `"smoke:ci": "playwright test tests/smoke --project=chromium --workers=1 --reporter=list"`
- ✅ Uso: `npm run smoke:ci`

### 3️⃣ Scripts de Seeding
- ⚠️ **Bloqueador**: Requieren Service Account credentials
- ✅ Archivos renombrados a `.cjs` para compatibilidad con ESM
  - `scripts/create-staging-user.cjs`
  - `scripts/seed-staging-data-real.cjs`
- ✅ Creado script alternativo: `scripts/seed-staging-web.cjs` (requiere auth)
- ✅ Documentación manual: `scripts/MANUAL_STAGING_SETUP.md`

**Alternativas para seeding:**
1. Firebase Console UI (manual)
2. Usar la aplicación web para crear datos
3. Ejecutar scripts con service account key (requiere archivo JSON)

### 4️⃣ Estado de Autenticación
- ✅ Archivo existe: `tests/.auth/state.json`
- ⚠️ Token expirado (exp: 1762198103)
- ✅ Usuario configurado: `admin@pilot-santiago.com`
- ✅ Org seleccionada: `pilot-org-santiago`

**Para refrescar:**
```bash
npm run test:auth:capture
# Seguir instrucciones en pantalla para login manual
```

## ⚠️ Pendiente

### 5️⃣ Smoke Tests Funcionales
- ❌ Servidor de desarrollo no está corriendo
- ❌ 28 tests fallidos por `ERR_CONNECTION_REFUSED`
- ✅ Test básico creado: `tests/smoke/basic-smoke.spec.ts`

**Para ejecutar:**
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar smoke tests (esperar ~30s para que el servidor inicie)
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

## 📊 Resumen de Tests Existentes

| Archivo | Tests | Estado | Bloqueador |
|---------|-------|--------|------------|
| `basic-smoke.spec.ts` | 8 | ❌ | Servidor no corriendo |
| `fase2-smoke-realistic.test.ts` | 4 | ❌ | Servidor + Auth + Datos |
| `fase2-smoke.test.ts` | 8 | ❌ | Servidor + Auth + Datos |
| `workspace.spec.ts` | 5 | ❌ | Servidor no corriendo |
| `workspace-authenticated.spec.ts` | 4 | ❌ | Servidor + Auth |

**Total**: 29 tests (28 fallidos, 1 skipped)

## 🚀 Próximos Pasos

### Opción A: Tests Locales (Desarrollo)
1. Iniciar servidor: `npm run dev`
2. Ejecutar tests básicos: `npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts`
3. Si pasan, intentar tests autenticados con token refrescado

### Opción B: Tests en Staging (QA)
1. Crear datos mínimos en Firestore Console (ver `MANUAL_STAGING_SETUP.md`)
2. Refrescar token de auth: `npm run test:auth:capture`
3. Ejecutar: `npm run smoke:staging`

### Opción C: CI/CD Automático
1. Configurar GitHub Actions con:
   - Servidor en background antes de tests
   - Variables de entorno para staging
   - Service account secret para seeding
2. Workflow ya configurado en `.github/workflows/ci.yml`

## 🔧 Configuración Verificada

- ✅ Playwright config con reporters correctos
- ✅ Script `smoke:ci` en package.json
- ✅ Tests básicos listos
- ✅ Firestore rules solo con `organizations/`
- ✅ Cero referencias a `orgs/` en código
- ✅ Feature flags runtime desde Firestore
- ✅ Rutas staging responden 200 OK

## 🎯 Para Usuario

**Comando para ejecutar smoke tests ahora:**

```powershell
# 1. Iniciar servidor (en terminal separada o background)
npm run dev

# 2. Esperar 30 segundos

# 3. Ejecutar smoke tests básicos
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

**Esperado después del paso 3:**
- 8 tests básicos pasando (homepage, login, rutas, assets, etc.)
- Reporte en consola + HTML en `playwright-report/index.html`

**Si falla:** Verificar que http://127.0.0.1:5178 responde en el navegador.








## ✅ Completado (Ítems 1-4)

### 1️⃣ Playwright Reporter Configurado
- ✅ Archivo: `playwright.config.ts` líneas 17-20
- ✅ Reporter: `['list']` + `['html', { open: 'never' }]`
- ✅ Listo para CI/CD

### 2️⃣ Script `smoke:ci` Creado
- ✅ Archivo: `package.json` línea 51
- ✅ Comando: `"smoke:ci": "playwright test tests/smoke --project=chromium --workers=1 --reporter=list"`
- ✅ Uso: `npm run smoke:ci`

### 3️⃣ Scripts de Seeding
- ⚠️ **Bloqueador**: Requieren Service Account credentials
- ✅ Archivos renombrados a `.cjs` para compatibilidad con ESM
  - `scripts/create-staging-user.cjs`
  - `scripts/seed-staging-data-real.cjs`
- ✅ Creado script alternativo: `scripts/seed-staging-web.cjs` (requiere auth)
- ✅ Documentación manual: `scripts/MANUAL_STAGING_SETUP.md`

**Alternativas para seeding:**
1. Firebase Console UI (manual)
2. Usar la aplicación web para crear datos
3. Ejecutar scripts con service account key (requiere archivo JSON)

### 4️⃣ Estado de Autenticación
- ✅ Archivo existe: `tests/.auth/state.json`
- ⚠️ Token expirado (exp: 1762198103)
- ✅ Usuario configurado: `admin@pilot-santiago.com`
- ✅ Org seleccionada: `pilot-org-santiago`

**Para refrescar:**
```bash
npm run test:auth:capture
# Seguir instrucciones en pantalla para login manual
```

## ⚠️ Pendiente

### 5️⃣ Smoke Tests Funcionales
- ❌ Servidor de desarrollo no está corriendo
- ❌ 28 tests fallidos por `ERR_CONNECTION_REFUSED`
- ✅ Test básico creado: `tests/smoke/basic-smoke.spec.ts`

**Para ejecutar:**
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar smoke tests (esperar ~30s para que el servidor inicie)
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

## 📊 Resumen de Tests Existentes

| Archivo | Tests | Estado | Bloqueador |
|---------|-------|--------|------------|
| `basic-smoke.spec.ts` | 8 | ❌ | Servidor no corriendo |
| `fase2-smoke-realistic.test.ts` | 4 | ❌ | Servidor + Auth + Datos |
| `fase2-smoke.test.ts` | 8 | ❌ | Servidor + Auth + Datos |
| `workspace.spec.ts` | 5 | ❌ | Servidor no corriendo |
| `workspace-authenticated.spec.ts` | 4 | ❌ | Servidor + Auth |

**Total**: 29 tests (28 fallidos, 1 skipped)

## 🚀 Próximos Pasos

### Opción A: Tests Locales (Desarrollo)
1. Iniciar servidor: `npm run dev`
2. Ejecutar tests básicos: `npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts`
3. Si pasan, intentar tests autenticados con token refrescado

### Opción B: Tests en Staging (QA)
1. Crear datos mínimos en Firestore Console (ver `MANUAL_STAGING_SETUP.md`)
2. Refrescar token de auth: `npm run test:auth:capture`
3. Ejecutar: `npm run smoke:staging`

### Opción C: CI/CD Automático
1. Configurar GitHub Actions con:
   - Servidor en background antes de tests
   - Variables de entorno para staging
   - Service account secret para seeding
2. Workflow ya configurado en `.github/workflows/ci.yml`

## 🔧 Configuración Verificada

- ✅ Playwright config con reporters correctos
- ✅ Script `smoke:ci` en package.json
- ✅ Tests básicos listos
- ✅ Firestore rules solo con `organizations/`
- ✅ Cero referencias a `orgs/` en código
- ✅ Feature flags runtime desde Firestore
- ✅ Rutas staging responden 200 OK

## 🎯 Para Usuario

**Comando para ejecutar smoke tests ahora:**

```powershell
# 1. Iniciar servidor (en terminal separada o background)
npm run dev

# 2. Esperar 30 segundos

# 3. Ejecutar smoke tests básicos
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

**Esperado después del paso 3:**
- 8 tests básicos pasando (homepage, login, rutas, assets, etc.)
- Reporte en consola + HTML en `playwright-report/index.html`

**Si falla:** Verificar que http://127.0.0.1:5178 responde en el navegador.








## ✅ Completado (Ítems 1-4)

### 1️⃣ Playwright Reporter Configurado
- ✅ Archivo: `playwright.config.ts` líneas 17-20
- ✅ Reporter: `['list']` + `['html', { open: 'never' }]`
- ✅ Listo para CI/CD

### 2️⃣ Script `smoke:ci` Creado
- ✅ Archivo: `package.json` línea 51
- ✅ Comando: `"smoke:ci": "playwright test tests/smoke --project=chromium --workers=1 --reporter=list"`
- ✅ Uso: `npm run smoke:ci`

### 3️⃣ Scripts de Seeding
- ⚠️ **Bloqueador**: Requieren Service Account credentials
- ✅ Archivos renombrados a `.cjs` para compatibilidad con ESM
  - `scripts/create-staging-user.cjs`
  - `scripts/seed-staging-data-real.cjs`
- ✅ Creado script alternativo: `scripts/seed-staging-web.cjs` (requiere auth)
- ✅ Documentación manual: `scripts/MANUAL_STAGING_SETUP.md`

**Alternativas para seeding:**
1. Firebase Console UI (manual)
2. Usar la aplicación web para crear datos
3. Ejecutar scripts con service account key (requiere archivo JSON)

### 4️⃣ Estado de Autenticación
- ✅ Archivo existe: `tests/.auth/state.json`
- ⚠️ Token expirado (exp: 1762198103)
- ✅ Usuario configurado: `admin@pilot-santiago.com`
- ✅ Org seleccionada: `pilot-org-santiago`

**Para refrescar:**
```bash
npm run test:auth:capture
# Seguir instrucciones en pantalla para login manual
```

## ⚠️ Pendiente

### 5️⃣ Smoke Tests Funcionales
- ❌ Servidor de desarrollo no está corriendo
- ❌ 28 tests fallidos por `ERR_CONNECTION_REFUSED`
- ✅ Test básico creado: `tests/smoke/basic-smoke.spec.ts`

**Para ejecutar:**
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar smoke tests (esperar ~30s para que el servidor inicie)
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

## 📊 Resumen de Tests Existentes

| Archivo | Tests | Estado | Bloqueador |
|---------|-------|--------|------------|
| `basic-smoke.spec.ts` | 8 | ❌ | Servidor no corriendo |
| `fase2-smoke-realistic.test.ts` | 4 | ❌ | Servidor + Auth + Datos |
| `fase2-smoke.test.ts` | 8 | ❌ | Servidor + Auth + Datos |
| `workspace.spec.ts` | 5 | ❌ | Servidor no corriendo |
| `workspace-authenticated.spec.ts` | 4 | ❌ | Servidor + Auth |

**Total**: 29 tests (28 fallidos, 1 skipped)

## 🚀 Próximos Pasos

### Opción A: Tests Locales (Desarrollo)
1. Iniciar servidor: `npm run dev`
2. Ejecutar tests básicos: `npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts`
3. Si pasan, intentar tests autenticados con token refrescado

### Opción B: Tests en Staging (QA)
1. Crear datos mínimos en Firestore Console (ver `MANUAL_STAGING_SETUP.md`)
2. Refrescar token de auth: `npm run test:auth:capture`
3. Ejecutar: `npm run smoke:staging`

### Opción C: CI/CD Automático
1. Configurar GitHub Actions con:
   - Servidor en background antes de tests
   - Variables de entorno para staging
   - Service account secret para seeding
2. Workflow ya configurado en `.github/workflows/ci.yml`

## 🔧 Configuración Verificada

- ✅ Playwright config con reporters correctos
- ✅ Script `smoke:ci` en package.json
- ✅ Tests básicos listos
- ✅ Firestore rules solo con `organizations/`
- ✅ Cero referencias a `orgs/` en código
- ✅ Feature flags runtime desde Firestore
- ✅ Rutas staging responden 200 OK

## 🎯 Para Usuario

**Comando para ejecutar smoke tests ahora:**

```powershell
# 1. Iniciar servidor (en terminal separada o background)
npm run dev

# 2. Esperar 30 segundos

# 3. Ejecutar smoke tests básicos
npm run smoke:ci -- tests/smoke/basic-smoke.spec.ts
```

**Esperado después del paso 3:**
- 8 tests básicos pasando (homepage, login, rutas, assets, etc.)
- Reporte en consola + HTML en `playwright-report/index.html`

**Si falla:** Verificar que http://127.0.0.1:5178 responde en el navegador.







