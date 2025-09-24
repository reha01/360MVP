# DECISION_LOG.md

**Última actualización**: 2025-09-24  
**Formato**: [Fecha] - [Decisión] - [Contexto] - [Impacto]

---

## 2025-09-24 - Desactivar kill-switch en producción
**Contexto**: El kill-switch de OrgContext estaba activándose en producción, causando que la aplicación usara datos mock en lugar de datos reales de Firestore.

**Decisión**: Modificar OrgContext para que el kill-switch solo funcione en desarrollo:
```javascript
// Antes
const killSwitch = localStorage.getItem('ORGCTX_KILL') === '1';

// Después  
const killSwitch = import.meta.env.DEV && localStorage.getItem('ORGCTX_KILL') === '1';
```

**Impacto**: 
- ✅ Staging ahora usa datos reales de Firestore
- ✅ Kill-switch sigue disponible para debugging en desarrollo
- ✅ Eliminado `emergency-fix.js` (ya no necesario)

---

## 2025-09-24 - Mover OrgProvider dentro del Router
**Contexto**: Error de build porque `useNavigate` no funcionaba cuando `OrgProvider` estaba fuera del `Router`.

**Decisión**: Reordenar la jerarquía de providers:
```jsx
// Antes
<AuthProvider>
  <OrgProvider>
    <Router>...</Router>
  </OrgProvider>
</AuthProvider>

// Después
<AuthProvider>
  <Router>
    <OrgProvider>...</OrgProvider>
  </Router>
</AuthProvider>
```

**Impacto**:
- ✅ `useNavigate` funciona correctamente en OrgContext
- ✅ Eliminado `OrgContextBridge` (componente innecesario)
- ✅ Estructura más limpia y lógica

---

## 2025-09-24 - Reemplazar global DEBUG por utils isDebug/dlog
**Contexto**: `ReferenceError: DEBUG is not defined` en producción debido a referencias a variable global no definida.

**Decisión**: Crear helper centralizado `src/utils/debug.ts`:
```typescript
export const isDebug = () =>
  (import.meta as any).env?.DEV === true ||
  localStorage.getItem('DEBUG') === '1';

export const dlog = (...args: any[]) => { if (isDebug()) console.info(...args); };
export const dwarn = (...args: any[]) => { if (isDebug()) console.warn(...args); };
export const dtrace = (...args: any[]) => { if (isDebug()) console.trace(...args); };
```

**Impacto**:
- ✅ Eliminado `ReferenceError` en producción
- ✅ Debug logging consistente y seguro
- ✅ Resistente a minificación

---

## 2025-09-24 - PWA headers y cache-busting
**Contexto**: Service Worker causaba problemas de cache en staging, mostrando versiones antiguas.

**Decisión**: Implementar cache-busting en headers del Service Worker:
```javascript
// sw.ts
const CACHE_VERSION = 'v1.0.3';
const CACHE_NAME = `360mvp-cache-${CACHE_VERSION}`;
```

**Impacto**:
- ✅ Cache controlado y versionado
- ✅ Actualizaciones automáticas funcionan correctamente
- ✅ PWA funcional en staging

---

## 2025-09-24 - Convención de IDs organization_members: <orgId>:<uid>
**Contexto**: Necesidad de identificar memberships de forma única y consistente en Firestore Rules.

**Decisión**: Establecer convención de IDs para `organization_members`:
```javascript
// Formato: <orgId>:<uid>
const membershipId = `${orgId}:${userId}`;

// Ejemplo: "org_demo:user_123"
```

**Impacto**:
- ✅ IDs únicos y predecibles
- ✅ Firestore Rules pueden validar membresías fácilmente
- ✅ Consultas más eficientes

---

## 2025-09-23 - Environment Detection con deriveEnv()
**Contexto**: Necesidad de detectar automáticamente el entorno (local/staging/production) para configurar emuladores y debug.

**Decisión**: Implementar `deriveEnv()` basado en `window.location.hostname`:
```javascript
export const deriveEnv = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local';
  if (hostname.includes('staging')) return 'staging';
  return 'production';
};
```

**Impacto**:
- ✅ Emuladores OFF automáticamente en staging/production
- ✅ Debug banner muestra entorno correcto
- ✅ Configuración automática sin manual setup

---

## 2025-09-23 - Debug Banner con localStorage.DEBUG
**Contexto**: Necesidad de debug visual en staging sin exponer información sensible en producción.

**Decisión**: Implementar DebugBanner con activación manual:
```javascript
const shouldShow = 
  import.meta.env.MODE !== 'production' || 
  localStorage.getItem('DEBUG') === '1';
```

**Impacto**:
- ✅ Debug visible en desarrollo automáticamente
- ✅ Activación manual en producción con `localStorage.DEBUG=1`
- ✅ Información útil sin comprometer seguridad

---

## 2025-09-23 - OrgContext Loop Prevention con Global Cache
**Contexto**: Loop infinito en OrgContext causaba UI no responsiva y múltiples llamadas a Firestore.

**Decisión**: Implementar cache global fuera del componente:
```javascript
// Fuera del componente
const globalCache = new Map(); // uid -> { memberships, timestamp, status }
const loadingStates = new Map(); // uid -> Promise

// Dentro del componente
const cached = globalCache.get(uid);
if (cached && isCacheValid(cached)) {
  // Usar datos cacheados
  return;
}
```

**Impacto**:
- ✅ Una sola carga por UID
- ✅ UI responsiva sin loops
- ✅ Performance mejorada con cache

---

## Decisiones Pendientes

### Firestore Rules Testing Strategy
**Contexto**: Tests de reglas fallan parcialmente (15/30 pasan).
**Pendiente**: Decidir si ajustar reglas para que todos los tests pasen o modificar tests para reflejar comportamiento esperado.

### Bundle Size Optimization
**Contexto**: Bundle de 1.7MB es grande para una aplicación React.
**Pendiente**: Decidir estrategia de code splitting y lazy loading.

### Cross-Organization Security Validation
**Contexto**: Necesidad de validar que no hay acceso cruzado entre organizaciones.
**Pendiente**: Decidir nivel de validación y testing requerido.

---

**Próxima Revisión**: 2025-09-25 (post Firestore Rules fixes)
