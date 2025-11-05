# 🔧 Solución: Test de Login - "element was detached from the DOM"

## 🐛 Problema

Los tests de autenticación fallaban con:
- **Error**: `Test timeout of 30000ms exceeded`
- **Causa**: `element was detached from the DOM`
- **Línea**: `await page.fill('input[type="email"]', 'admin@pilot-santiago.com')`

## 🔍 Causa Raíz Identificada

El componente `Login.jsx` tiene un `useEffect` que **redirige automáticamente** si detecta un usuario autenticado:

```javascript
// src/pages/Login.jsx líneas 21-26
useEffect(() => {
  if (user) {
    console.log('[360MVP] Login: User already authenticated, redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
  }
}, [user, navigate, redirectPath]);
```

### Secuencia del Problema

1. Playwright navega a `/login`
2. La página carga y monta el componente
3. Si hay un token residual o sesión activa, `AuthContext` detecta al usuario
4. El `useEffect` ejecuta `navigate()` inmediatamente
5. Los elementos del DOM se desconectan durante la navegación
6. Playwright intenta escribir en elementos que ya no existen → **Error**

## ✅ Solución Implementada

### 1. Limpiar Storage State

```typescript
// Limpiar cookies antes de hacer login
await context.clearCookies();
```

Esto previene que el `useEffect` detecte una sesión existente y ejecute el redirect.

### 2. Esperar Estabilidad de la Página

```typescript
// Esperar a que el botón esté visible y habilitado
await page.waitForSelector('button[type="submit"]:not([disabled])', { 
  state: 'visible', 
  timeout: 10000 
});

// Esperar un momento adicional para asegurar estabilidad
await page.waitForTimeout(500);
```

Esto asegura que:
- La página terminó de cargar completamente
- No hay redirects pendientes
- Los elementos están estables en el DOM

### 3. Usar Locators en lugar de Selectores Directos

```typescript
// ❌ ANTES: Selector directo (frágil)
await page.fill('input[type="email"]', 'admin@pilot-santiago.com');

// ✅ DESPUÉS: Locator (robusto)
const emailInput = page.locator('input[type="email"]');
await expect(emailInput).toBeVisible({ timeout: 5000 });
await emailInput.fill('admin@pilot-santiago.com');
```

**Ventajas de Locators:**
- Auto-retry: Playwright reintenta automáticamente si el elemento cambia
- Mejor manejo de elementos que se reemplazan en el DOM
- Más resiliente a cambios dinámicos

### 4. Verificar Visibilidad Antes de Interactuar

```typescript
await expect(emailInput).toBeVisible({ timeout: 5000 });
await expect(passwordInput).toBeVisible({ timeout: 5000 });
```

Esto garantiza que los elementos están presentes y visibles antes de intentar escribir.

### 5. Logs de Progreso

```typescript
console.log('   → Escribiendo credenciales...');
console.log('   → Enviando formulario...');
console.log('   → Esperando redirección...');
console.log('   → Verificando usuario autenticado...');
```

Facilita el debugging si el test falla en el futuro.

## 📁 Archivos Corregidos

1. **`tests/auth/auth.setup.ts`** - Setup de autenticación (ejecutado con `npm run test:auth:capture`)
2. **`tests/smoke/fase2-smoke-realistic.test.ts`** - Test de smoke realista

## 📊 Comparación Antes/Después

### Antes (Frágil)

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto(`${STAGING_URL}/login`);
  await page.fill('input[type="email"]', 'admin@pilot-santiago.com'); // ❌ Falla aquí
  await page.fill('input[type="password"]', 'TestPilot2024!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
```

**Problemas:**
- No limpia storage state → puede haber sesión residual
- No espera estabilidad → elementos pueden desconectarse
- Usa selectores directos → menos resiliente

### Después (Robusto)

```typescript
setup('authenticate', async ({ page, context }) => {
  console.log('🔐 Autenticando en Staging...');
  
  // 1. Limpiar estado
  console.log('   → Limpiando storage state previo...');
  await context.clearCookies();
  
  // 2. Navegar y esperar estabilidad
  console.log('   → Navegando a /login...');
  await page.goto(`${STAGING_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  console.log('   → Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]:not([disabled])', { 
    state: 'visible', 
    timeout: 10000 
  });
  await page.waitForTimeout(500);
  
  // 3. Usar locators con verificación
  console.log('   → Preparando credenciales...');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  
  // 4. Interactuar de forma segura
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // 5. Verificar resultado
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // 6. Guardar estado
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});
```

**Mejoras:**
- ✅ Limpia storage state
- ✅ Espera estabilidad completa
- ✅ Usa locators resilientes
- ✅ Verifica visibilidad antes de interactuar
- ✅ Logs de progreso para debugging

## 🧪 Para Verificar el Fix

### Verificar el setup de autenticación:

```bash
# Ejecutar el script de captura de autenticación (el que estaba fallando)
npm run test:auth:capture

# O directamente con Playwright
npx playwright test tests/auth/auth.setup.ts
```

### Verificar los smoke tests:

```bash
# Ejecutar solo el test de autenticación
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts -g "Autenticación funciona"

# Ejecutar todos los smoke tests realistas
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts
```

## 📝 Lecciones Aprendidas

1. **Siempre limpiar storage state** en tests de autenticación
2. **Esperar estabilidad de la página** antes de interactuar con elementos
3. **Usar locators en lugar de selectores directos** para mayor robustez
4. **Verificar visibilidad explícitamente** antes de interactuar
5. **Agregar logs de progreso** para facilitar debugging

## 🎯 Resultado Esperado

El test de autenticación ahora debe:
- ✅ Pasar consistentemente sin timeouts
- ✅ No tener errores de "element detached"
- ✅ Ser más resiliente a cambios en la UI
- ✅ Proporcionar mejor feedback de progreso


## 🐛 Problema

Los tests de autenticación fallaban con:
- **Error**: `Test timeout of 30000ms exceeded`
- **Causa**: `element was detached from the DOM`
- **Línea**: `await page.fill('input[type="email"]', 'admin@pilot-santiago.com')`

## 🔍 Causa Raíz Identificada

El componente `Login.jsx` tiene un `useEffect` que **redirige automáticamente** si detecta un usuario autenticado:

```javascript
// src/pages/Login.jsx líneas 21-26
useEffect(() => {
  if (user) {
    console.log('[360MVP] Login: User already authenticated, redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
  }
}, [user, navigate, redirectPath]);
```

### Secuencia del Problema

1. Playwright navega a `/login`
2. La página carga y monta el componente
3. Si hay un token residual o sesión activa, `AuthContext` detecta al usuario
4. El `useEffect` ejecuta `navigate()` inmediatamente
5. Los elementos del DOM se desconectan durante la navegación
6. Playwright intenta escribir en elementos que ya no existen → **Error**

## ✅ Solución Implementada

### 1. Limpiar Storage State

```typescript
// Limpiar cookies antes de hacer login
await context.clearCookies();
```

Esto previene que el `useEffect` detecte una sesión existente y ejecute el redirect.

### 2. Esperar Estabilidad de la Página

```typescript
// Esperar a que el botón esté visible y habilitado
await page.waitForSelector('button[type="submit"]:not([disabled])', { 
  state: 'visible', 
  timeout: 10000 
});

// Esperar un momento adicional para asegurar estabilidad
await page.waitForTimeout(500);
```

Esto asegura que:
- La página terminó de cargar completamente
- No hay redirects pendientes
- Los elementos están estables en el DOM

### 3. Usar Locators en lugar de Selectores Directos

```typescript
// ❌ ANTES: Selector directo (frágil)
await page.fill('input[type="email"]', 'admin@pilot-santiago.com');

// ✅ DESPUÉS: Locator (robusto)
const emailInput = page.locator('input[type="email"]');
await expect(emailInput).toBeVisible({ timeout: 5000 });
await emailInput.fill('admin@pilot-santiago.com');
```

**Ventajas de Locators:**
- Auto-retry: Playwright reintenta automáticamente si el elemento cambia
- Mejor manejo de elementos que se reemplazan en el DOM
- Más resiliente a cambios dinámicos

### 4. Verificar Visibilidad Antes de Interactuar

```typescript
await expect(emailInput).toBeVisible({ timeout: 5000 });
await expect(passwordInput).toBeVisible({ timeout: 5000 });
```

Esto garantiza que los elementos están presentes y visibles antes de intentar escribir.

### 5. Logs de Progreso

```typescript
console.log('   → Escribiendo credenciales...');
console.log('   → Enviando formulario...');
console.log('   → Esperando redirección...');
console.log('   → Verificando usuario autenticado...');
```

Facilita el debugging si el test falla en el futuro.

## 📁 Archivos Corregidos

1. **`tests/auth/auth.setup.ts`** - Setup de autenticación (ejecutado con `npm run test:auth:capture`)
2. **`tests/smoke/fase2-smoke-realistic.test.ts`** - Test de smoke realista

## 📊 Comparación Antes/Después

### Antes (Frágil)

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto(`${STAGING_URL}/login`);
  await page.fill('input[type="email"]', 'admin@pilot-santiago.com'); // ❌ Falla aquí
  await page.fill('input[type="password"]', 'TestPilot2024!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
```

**Problemas:**
- No limpia storage state → puede haber sesión residual
- No espera estabilidad → elementos pueden desconectarse
- Usa selectores directos → menos resiliente

### Después (Robusto)

```typescript
setup('authenticate', async ({ page, context }) => {
  console.log('🔐 Autenticando en Staging...');
  
  // 1. Limpiar estado
  console.log('   → Limpiando storage state previo...');
  await context.clearCookies();
  
  // 2. Navegar y esperar estabilidad
  console.log('   → Navegando a /login...');
  await page.goto(`${STAGING_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  console.log('   → Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]:not([disabled])', { 
    state: 'visible', 
    timeout: 10000 
  });
  await page.waitForTimeout(500);
  
  // 3. Usar locators con verificación
  console.log('   → Preparando credenciales...');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  
  // 4. Interactuar de forma segura
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // 5. Verificar resultado
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // 6. Guardar estado
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});
```

**Mejoras:**
- ✅ Limpia storage state
- ✅ Espera estabilidad completa
- ✅ Usa locators resilientes
- ✅ Verifica visibilidad antes de interactuar
- ✅ Logs de progreso para debugging

## 🧪 Para Verificar el Fix

### Verificar el setup de autenticación:

```bash
# Ejecutar el script de captura de autenticación (el que estaba fallando)
npm run test:auth:capture

# O directamente con Playwright
npx playwright test tests/auth/auth.setup.ts
```

### Verificar los smoke tests:

```bash
# Ejecutar solo el test de autenticación
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts -g "Autenticación funciona"

# Ejecutar todos los smoke tests realistas
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts
```

## 📝 Lecciones Aprendidas

1. **Siempre limpiar storage state** en tests de autenticación
2. **Esperar estabilidad de la página** antes de interactuar con elementos
3. **Usar locators en lugar de selectores directos** para mayor robustez
4. **Verificar visibilidad explícitamente** antes de interactuar
5. **Agregar logs de progreso** para facilitar debugging

## 🎯 Resultado Esperado

El test de autenticación ahora debe:
- ✅ Pasar consistentemente sin timeouts
- ✅ No tener errores de "element detached"
- ✅ Ser más resiliente a cambios en la UI
- ✅ Proporcionar mejor feedback de progreso


## 🐛 Problema

Los tests de autenticación fallaban con:
- **Error**: `Test timeout of 30000ms exceeded`
- **Causa**: `element was detached from the DOM`
- **Línea**: `await page.fill('input[type="email"]', 'admin@pilot-santiago.com')`

## 🔍 Causa Raíz Identificada

El componente `Login.jsx` tiene un `useEffect` que **redirige automáticamente** si detecta un usuario autenticado:

```javascript
// src/pages/Login.jsx líneas 21-26
useEffect(() => {
  if (user) {
    console.log('[360MVP] Login: User already authenticated, redirecting to:', redirectPath);
    navigate(redirectPath, { replace: true });
  }
}, [user, navigate, redirectPath]);
```

### Secuencia del Problema

1. Playwright navega a `/login`
2. La página carga y monta el componente
3. Si hay un token residual o sesión activa, `AuthContext` detecta al usuario
4. El `useEffect` ejecuta `navigate()` inmediatamente
5. Los elementos del DOM se desconectan durante la navegación
6. Playwright intenta escribir en elementos que ya no existen → **Error**

## ✅ Solución Implementada

### 1. Limpiar Storage State

```typescript
// Limpiar cookies antes de hacer login
await context.clearCookies();
```

Esto previene que el `useEffect` detecte una sesión existente y ejecute el redirect.

### 2. Esperar Estabilidad de la Página

```typescript
// Esperar a que el botón esté visible y habilitado
await page.waitForSelector('button[type="submit"]:not([disabled])', { 
  state: 'visible', 
  timeout: 10000 
});

// Esperar un momento adicional para asegurar estabilidad
await page.waitForTimeout(500);
```

Esto asegura que:
- La página terminó de cargar completamente
- No hay redirects pendientes
- Los elementos están estables en el DOM

### 3. Usar Locators en lugar de Selectores Directos

```typescript
// ❌ ANTES: Selector directo (frágil)
await page.fill('input[type="email"]', 'admin@pilot-santiago.com');

// ✅ DESPUÉS: Locator (robusto)
const emailInput = page.locator('input[type="email"]');
await expect(emailInput).toBeVisible({ timeout: 5000 });
await emailInput.fill('admin@pilot-santiago.com');
```

**Ventajas de Locators:**
- Auto-retry: Playwright reintenta automáticamente si el elemento cambia
- Mejor manejo de elementos que se reemplazan en el DOM
- Más resiliente a cambios dinámicos

### 4. Verificar Visibilidad Antes de Interactuar

```typescript
await expect(emailInput).toBeVisible({ timeout: 5000 });
await expect(passwordInput).toBeVisible({ timeout: 5000 });
```

Esto garantiza que los elementos están presentes y visibles antes de intentar escribir.

### 5. Logs de Progreso

```typescript
console.log('   → Escribiendo credenciales...');
console.log('   → Enviando formulario...');
console.log('   → Esperando redirección...');
console.log('   → Verificando usuario autenticado...');
```

Facilita el debugging si el test falla en el futuro.

## 📁 Archivos Corregidos

1. **`tests/auth/auth.setup.ts`** - Setup de autenticación (ejecutado con `npm run test:auth:capture`)
2. **`tests/smoke/fase2-smoke-realistic.test.ts`** - Test de smoke realista

## 📊 Comparación Antes/Después

### Antes (Frágil)

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto(`${STAGING_URL}/login`);
  await page.fill('input[type="email"]', 'admin@pilot-santiago.com'); // ❌ Falla aquí
  await page.fill('input[type="password"]', 'TestPilot2024!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
```

**Problemas:**
- No limpia storage state → puede haber sesión residual
- No espera estabilidad → elementos pueden desconectarse
- Usa selectores directos → menos resiliente

### Después (Robusto)

```typescript
setup('authenticate', async ({ page, context }) => {
  console.log('🔐 Autenticando en Staging...');
  
  // 1. Limpiar estado
  console.log('   → Limpiando storage state previo...');
  await context.clearCookies();
  
  // 2. Navegar y esperar estabilidad
  console.log('   → Navegando a /login...');
  await page.goto(`${STAGING_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  console.log('   → Esperando estabilidad de la página...');
  await page.waitForSelector('button[type="submit"]:not([disabled])', { 
    state: 'visible', 
    timeout: 10000 
  });
  await page.waitForTimeout(500);
  
  // 3. Usar locators con verificación
  console.log('   → Preparando credenciales...');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  
  // 4. Interactuar de forma segura
  console.log('   → Escribiendo email...');
  await emailInput.fill('admin@pilot-santiago.com');
  
  console.log('   → Escribiendo contraseña...');
  await passwordInput.fill('TestPilot2024!');
  
  console.log('   → Enviando formulario...');
  await submitButton.click();
  
  // 5. Verificar resultado
  console.log('   → Esperando redirección post-login...');
  await page.waitForURL(/\/(dashboard|home|evaluations)/, { timeout: 10000 });
  
  console.log('   → Verificando autenticación...');
  await expect(page.locator('text=admin@pilot-santiago.com')).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Autenticación exitosa');
  
  // 6. Guardar estado
  console.log('   → Guardando estado de autenticación...');
  await page.context().storageState({ path: authFile });
  
  console.log(`📁 Estado guardado en: ${authFile}`);
});
```

**Mejoras:**
- ✅ Limpia storage state
- ✅ Espera estabilidad completa
- ✅ Usa locators resilientes
- ✅ Verifica visibilidad antes de interactuar
- ✅ Logs de progreso para debugging

## 🧪 Para Verificar el Fix

### Verificar el setup de autenticación:

```bash
# Ejecutar el script de captura de autenticación (el que estaba fallando)
npm run test:auth:capture

# O directamente con Playwright
npx playwright test tests/auth/auth.setup.ts
```

### Verificar los smoke tests:

```bash
# Ejecutar solo el test de autenticación
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts -g "Autenticación funciona"

# Ejecutar todos los smoke tests realistas
npx playwright test tests/smoke/fase2-smoke-realistic.test.ts
```

## 📝 Lecciones Aprendidas

1. **Siempre limpiar storage state** en tests de autenticación
2. **Esperar estabilidad de la página** antes de interactuar con elementos
3. **Usar locators en lugar de selectores directos** para mayor robustez
4. **Verificar visibilidad explícitamente** antes de interactuar
5. **Agregar logs de progreso** para facilitar debugging

## 🎯 Resultado Esperado

El test de autenticación ahora debe:
- ✅ Pasar consistentemente sin timeouts
- ✅ No tener errores de "element detached"
- ✅ Ser más resiliente a cambios en la UI
- ✅ Proporcionar mejor feedback de progreso

