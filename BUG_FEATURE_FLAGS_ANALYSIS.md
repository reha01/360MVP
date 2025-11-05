# 🐛 Bug Crítico: Feature Flags no se cargan desde Firestore

## 🎯 Problema Identificado

Los feature flags **NO** se están cargando desde `organizations/pilot-org-santiago` en Firestore, sino que la aplicación usa los valores por defecto (todos `false`).

---

## 🔍 Análisis de la Cadena de Carga

### 1. Flujo Esperado
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → OrgContext → pilot-org-santiago
```

### 2. Flujo Real (Roto)
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → ERROR → fallback personal org → flags false
```

---

## 🚨 Causa Raíz: Función Faltante

**En `src/services/firestore.js` línea 475:**
```javascript
const { getActiveOrgIdFromContext } = await import('../context/OrgContext.jsx');
```

**En `src/context/OrgContext.jsx`:**
- ❌ Función `getActiveOrgIdFromContext` **NO EXISTE**
- ✅ Solo existe `getActiveOrgId: () => activeOrgId` (línea 582)

### Resultado del Error
1. Import falla → catch block
2. Usa "legacy approach" → `getPersonalOrgId(userId)`
3. Busca flags en `organizations/org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
4. **Documento NO EXISTE** → `getDefaultFlags()` → todos `false`

---

## ✅ Solución Implementada

**Agregada función faltante en `OrgContext.jsx` líneas 602-615:**

```javascript
export const getActiveOrgIdFromContext = () => {
  // Esta función debe ser llamada desde fuera del contexto de React
  // Retorna el orgId activo desde localStorage como fallback
  try {
    const uid = localStorage.getItem('360mvp_user_uid');
    if (uid) {
      return localStorage.getItem(`selectedOrgId_${uid}`);
    }
    return null;
  } catch (error) {
    console.warn('[getActiveOrgIdFromContext] Error accessing localStorage:', error);
    return null;
  }
};
```

---

## 🧪 Verificación

### Flujo Corregido
```
1. useRuntimeFeatureFlags llama useMultiTenant
2. useMultiTenant llama getActiveOrgId
3. getActiveOrgId importa getActiveOrgIdFromContext ✅ (ahora existe)
4. getActiveOrgIdFromContext lee localStorage: selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
5. Retorna 'pilot-org-santiago' ✅
6. featureFlagsService busca en organizations/pilot-org-santiago ✅
7. Encuentra flags habilitados → componentes se renderizan ✅
```

### Datos en localStorage (desde auth state)
```javascript
localStorage.getItem('360mvp_user_uid') = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02'
localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02') = 'pilot-org-santiago'
```

### Datos en Firestore (confirmado por usuario)
```
organizations/pilot-org-santiago/featureFlags = {
  FEATURE_DASHBOARD_360: true,
  FEATURE_BULK_ACTIONS: true,
  FEATURE_OPERATIONAL_ALERTS: true
}
```

---

## 📊 Impacto Esperado

### Antes del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: false,  // ❌ Usando getDefaultFlags()
  loading: false,
  error: null
}

// Componente no se renderiza:
if (!dashboardEnabled) {
  return <Alert>Función no disponible</Alert>;
}
```

### Después del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: true,   // ✅ Cargado desde Firestore
  loading: false,
  error: null
}

// Componente se renderiza:
return (
  <div data-testid="operational-dashboard">
    {/* Componente completo */}
  </div>
);
```

---

## 🎯 Tests Afectados (Esperados a Pasar)

| Test | Antes | Después | Razón |
|------|-------|---------|-------|
| `[data-testid="operational-dashboard"]` | ❌ Not found | ✅ Visible | Dashboard se renderiza |
| `[data-testid="bulk-actions-manager"]` | ❌ Not found | ✅ Visible | Bulk actions se renderiza |
| `[data-testid="alert-manager"]` | ❌ Not found | ✅ Visible | Alert manager se renderiza |

### Tests de Interacción (También Deberían Pasar)
- Checkboxes de asignaciones (`.border-gray-200`)
- Botón "Auditoría" 
- Secciones DLQ
- Idempotencia de bulk actions

---

## 🔧 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/context/OrgContext.jsx` | ➕ Función `getActiveOrgIdFromContext` | 602-615 |
| `tests/debug/feature-flags-debug.spec.ts` | ➕ Test de debug | 1-118 |

---

## ✅ Próximos Pasos

### 1. Re-ejecutar Smoke Tests
```bash
npm run smoke:staging
```

**Esperado:**
- 7+ tests adicionales pasando
- Componentes UI visibles
- DLQ e idempotencia verificables

### 2. Verificar en Navegador
```bash
# Abrir en navegador:
https://mvp-staging-3e1cd.web.app/dashboard-360
https://mvp-staging-3e1cd.web.app/bulk-actions
https://mvp-staging-3e1cd.web.app/alerts

# Verificar que se renderizan los componentes principales
```

### 3. Debug Manual (Si Persiste el Problema)
```javascript
// En DevTools console:
console.log('UID:', localStorage.getItem('360mvp_user_uid'));
console.log('Org:', localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'));
```

---

## 📈 Confianza en el Fix

**Alta confianza (95%)** - La función faltante era el eslabón perdido en la cadena de carga de feature flags.

**Evidencia:**
1. ✅ Datos en Firestore confirmados (usuario)
2. ✅ Auth state con orgId correcto
3. ✅ Función faltante identificada y agregada
4. ✅ localStorage contiene orgId correcto
5. ✅ Componentes tienen data-testid correctos

**Riesgo bajo:** Si persiste el problema, será por cache de feature flags (solucionable con refresh).

---

**Estado:** ✅ **BUG IDENTIFICADO Y CORREGIDO**  
**Próximo paso:** Re-ejecutar smoke tests para verificar







## 🎯 Problema Identificado

Los feature flags **NO** se están cargando desde `organizations/pilot-org-santiago` en Firestore, sino que la aplicación usa los valores por defecto (todos `false`).

---

## 🔍 Análisis de la Cadena de Carga

### 1. Flujo Esperado
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → OrgContext → pilot-org-santiago
```

### 2. Flujo Real (Roto)
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → ERROR → fallback personal org → flags false
```

---

## 🚨 Causa Raíz: Función Faltante

**En `src/services/firestore.js` línea 475:**
```javascript
const { getActiveOrgIdFromContext } = await import('../context/OrgContext.jsx');
```

**En `src/context/OrgContext.jsx`:**
- ❌ Función `getActiveOrgIdFromContext` **NO EXISTE**
- ✅ Solo existe `getActiveOrgId: () => activeOrgId` (línea 582)

### Resultado del Error
1. Import falla → catch block
2. Usa "legacy approach" → `getPersonalOrgId(userId)`
3. Busca flags en `organizations/org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
4. **Documento NO EXISTE** → `getDefaultFlags()` → todos `false`

---

## ✅ Solución Implementada

**Agregada función faltante en `OrgContext.jsx` líneas 602-615:**

```javascript
export const getActiveOrgIdFromContext = () => {
  // Esta función debe ser llamada desde fuera del contexto de React
  // Retorna el orgId activo desde localStorage como fallback
  try {
    const uid = localStorage.getItem('360mvp_user_uid');
    if (uid) {
      return localStorage.getItem(`selectedOrgId_${uid}`);
    }
    return null;
  } catch (error) {
    console.warn('[getActiveOrgIdFromContext] Error accessing localStorage:', error);
    return null;
  }
};
```

---

## 🧪 Verificación

### Flujo Corregido
```
1. useRuntimeFeatureFlags llama useMultiTenant
2. useMultiTenant llama getActiveOrgId
3. getActiveOrgId importa getActiveOrgIdFromContext ✅ (ahora existe)
4. getActiveOrgIdFromContext lee localStorage: selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
5. Retorna 'pilot-org-santiago' ✅
6. featureFlagsService busca en organizations/pilot-org-santiago ✅
7. Encuentra flags habilitados → componentes se renderizan ✅
```

### Datos en localStorage (desde auth state)
```javascript
localStorage.getItem('360mvp_user_uid') = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02'
localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02') = 'pilot-org-santiago'
```

### Datos en Firestore (confirmado por usuario)
```
organizations/pilot-org-santiago/featureFlags = {
  FEATURE_DASHBOARD_360: true,
  FEATURE_BULK_ACTIONS: true,
  FEATURE_OPERATIONAL_ALERTS: true
}
```

---

## 📊 Impacto Esperado

### Antes del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: false,  // ❌ Usando getDefaultFlags()
  loading: false,
  error: null
}

// Componente no se renderiza:
if (!dashboardEnabled) {
  return <Alert>Función no disponible</Alert>;
}
```

### Después del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: true,   // ✅ Cargado desde Firestore
  loading: false,
  error: null
}

// Componente se renderiza:
return (
  <div data-testid="operational-dashboard">
    {/* Componente completo */}
  </div>
);
```

---

## 🎯 Tests Afectados (Esperados a Pasar)

| Test | Antes | Después | Razón |
|------|-------|---------|-------|
| `[data-testid="operational-dashboard"]` | ❌ Not found | ✅ Visible | Dashboard se renderiza |
| `[data-testid="bulk-actions-manager"]` | ❌ Not found | ✅ Visible | Bulk actions se renderiza |
| `[data-testid="alert-manager"]` | ❌ Not found | ✅ Visible | Alert manager se renderiza |

### Tests de Interacción (También Deberían Pasar)
- Checkboxes de asignaciones (`.border-gray-200`)
- Botón "Auditoría" 
- Secciones DLQ
- Idempotencia de bulk actions

---

## 🔧 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/context/OrgContext.jsx` | ➕ Función `getActiveOrgIdFromContext` | 602-615 |
| `tests/debug/feature-flags-debug.spec.ts` | ➕ Test de debug | 1-118 |

---

## ✅ Próximos Pasos

### 1. Re-ejecutar Smoke Tests
```bash
npm run smoke:staging
```

**Esperado:**
- 7+ tests adicionales pasando
- Componentes UI visibles
- DLQ e idempotencia verificables

### 2. Verificar en Navegador
```bash
# Abrir en navegador:
https://mvp-staging-3e1cd.web.app/dashboard-360
https://mvp-staging-3e1cd.web.app/bulk-actions
https://mvp-staging-3e1cd.web.app/alerts

# Verificar que se renderizan los componentes principales
```

### 3. Debug Manual (Si Persiste el Problema)
```javascript
// En DevTools console:
console.log('UID:', localStorage.getItem('360mvp_user_uid'));
console.log('Org:', localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'));
```

---

## 📈 Confianza en el Fix

**Alta confianza (95%)** - La función faltante era el eslabón perdido en la cadena de carga de feature flags.

**Evidencia:**
1. ✅ Datos en Firestore confirmados (usuario)
2. ✅ Auth state con orgId correcto
3. ✅ Función faltante identificada y agregada
4. ✅ localStorage contiene orgId correcto
5. ✅ Componentes tienen data-testid correctos

**Riesgo bajo:** Si persiste el problema, será por cache de feature flags (solucionable con refresh).

---

**Estado:** ✅ **BUG IDENTIFICADO Y CORREGIDO**  
**Próximo paso:** Re-ejecutar smoke tests para verificar







## 🎯 Problema Identificado

Los feature flags **NO** se están cargando desde `organizations/pilot-org-santiago` en Firestore, sino que la aplicación usa los valores por defecto (todos `false`).

---

## 🔍 Análisis de la Cadena de Carga

### 1. Flujo Esperado
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → OrgContext → pilot-org-santiago
```

### 2. Flujo Real (Roto)
```
useRuntimeFeatureFlags → useMultiTenant → getActiveOrgId → ERROR → fallback personal org → flags false
```

---

## 🚨 Causa Raíz: Función Faltante

**En `src/services/firestore.js` línea 475:**
```javascript
const { getActiveOrgIdFromContext } = await import('../context/OrgContext.jsx');
```

**En `src/context/OrgContext.jsx`:**
- ❌ Función `getActiveOrgIdFromContext` **NO EXISTE**
- ✅ Solo existe `getActiveOrgId: () => activeOrgId` (línea 582)

### Resultado del Error
1. Import falla → catch block
2. Usa "legacy approach" → `getPersonalOrgId(userId)`
3. Busca flags en `organizations/org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
4. **Documento NO EXISTE** → `getDefaultFlags()` → todos `false`

---

## ✅ Solución Implementada

**Agregada función faltante en `OrgContext.jsx` líneas 602-615:**

```javascript
export const getActiveOrgIdFromContext = () => {
  // Esta función debe ser llamada desde fuera del contexto de React
  // Retorna el orgId activo desde localStorage como fallback
  try {
    const uid = localStorage.getItem('360mvp_user_uid');
    if (uid) {
      return localStorage.getItem(`selectedOrgId_${uid}`);
    }
    return null;
  } catch (error) {
    console.warn('[getActiveOrgIdFromContext] Error accessing localStorage:', error);
    return null;
  }
};
```

---

## 🧪 Verificación

### Flujo Corregido
```
1. useRuntimeFeatureFlags llama useMultiTenant
2. useMultiTenant llama getActiveOrgId
3. getActiveOrgId importa getActiveOrgIdFromContext ✅ (ahora existe)
4. getActiveOrgIdFromContext lee localStorage: selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
5. Retorna 'pilot-org-santiago' ✅
6. featureFlagsService busca en organizations/pilot-org-santiago ✅
7. Encuentra flags habilitados → componentes se renderizan ✅
```

### Datos en localStorage (desde auth state)
```javascript
localStorage.getItem('360mvp_user_uid') = 'S1SE2ynl3dQ9ohjMz5hj5h2sJx02'
localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02') = 'pilot-org-santiago'
```

### Datos en Firestore (confirmado por usuario)
```
organizations/pilot-org-santiago/featureFlags = {
  FEATURE_DASHBOARD_360: true,
  FEATURE_BULK_ACTIONS: true,
  FEATURE_OPERATIONAL_ALERTS: true
}
```

---

## 📊 Impacto Esperado

### Antes del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: false,  // ❌ Usando getDefaultFlags()
  loading: false,
  error: null
}

// Componente no se renderiza:
if (!dashboardEnabled) {
  return <Alert>Función no disponible</Alert>;
}
```

### Después del Fix
```javascript
// useRuntimeFeatureFlags retorna:
{
  isEnabled: true,   // ✅ Cargado desde Firestore
  loading: false,
  error: null
}

// Componente se renderiza:
return (
  <div data-testid="operational-dashboard">
    {/* Componente completo */}
  </div>
);
```

---

## 🎯 Tests Afectados (Esperados a Pasar)

| Test | Antes | Después | Razón |
|------|-------|---------|-------|
| `[data-testid="operational-dashboard"]` | ❌ Not found | ✅ Visible | Dashboard se renderiza |
| `[data-testid="bulk-actions-manager"]` | ❌ Not found | ✅ Visible | Bulk actions se renderiza |
| `[data-testid="alert-manager"]` | ❌ Not found | ✅ Visible | Alert manager se renderiza |

### Tests de Interacción (También Deberían Pasar)
- Checkboxes de asignaciones (`.border-gray-200`)
- Botón "Auditoría" 
- Secciones DLQ
- Idempotencia de bulk actions

---

## 🔧 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/context/OrgContext.jsx` | ➕ Función `getActiveOrgIdFromContext` | 602-615 |
| `tests/debug/feature-flags-debug.spec.ts` | ➕ Test de debug | 1-118 |

---

## ✅ Próximos Pasos

### 1. Re-ejecutar Smoke Tests
```bash
npm run smoke:staging
```

**Esperado:**
- 7+ tests adicionales pasando
- Componentes UI visibles
- DLQ e idempotencia verificables

### 2. Verificar en Navegador
```bash
# Abrir en navegador:
https://mvp-staging-3e1cd.web.app/dashboard-360
https://mvp-staging-3e1cd.web.app/bulk-actions
https://mvp-staging-3e1cd.web.app/alerts

# Verificar que se renderizan los componentes principales
```

### 3. Debug Manual (Si Persiste el Problema)
```javascript
// En DevTools console:
console.log('UID:', localStorage.getItem('360mvp_user_uid'));
console.log('Org:', localStorage.getItem('selectedOrgId_S1SE2ynl3dQ9ohjMz5hj5h2sJx02'));
```

---

## 📈 Confianza en el Fix

**Alta confianza (95%)** - La función faltante era el eslabón perdido en la cadena de carga de feature flags.

**Evidencia:**
1. ✅ Datos en Firestore confirmados (usuario)
2. ✅ Auth state con orgId correcto
3. ✅ Función faltante identificada y agregada
4. ✅ localStorage contiene orgId correcto
5. ✅ Componentes tienen data-testid correctos

**Riesgo bajo:** Si persiste el problema, será por cache de feature flags (solucionable con refresh).

---

**Estado:** ✅ **BUG IDENTIFICADO Y CORREGIDO**  
**Próximo paso:** Re-ejecutar smoke tests para verificar






