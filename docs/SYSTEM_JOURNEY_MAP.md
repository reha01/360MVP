# 🗺️ Mapa de Viaje del Sistema: Organización-Tests

**Fecha**: 2025-01-XX  
**Objetivo**: Documentar la brecha entre el estado actual y el flujo objetivo para la asignación de tests a organizaciones

---

## 📊 PARTE 1: ESTADO ACTUAL (La Realidad)

### 1.1 Modelo de Tests Globales

**Ubicación**: `src/services/globalTestDefinitionService.js`

El sistema actual tiene un **catálogo global de tests** almacenado en:
```
Firestore: global/platform/testDefinitions/{testId}
```

**Estructura del Test Global**:
```javascript
{
  id: string,
  title: string,
  status: 'draft' | 'active' | 'archived' | 'deleted',
  visibility: 'public' | 'private',
  allowedOrgs: string[]  // Array de orgIds - SOLO para tests privados
}
```

**Puntos Clave**:
- ✅ Tests **públicos** (`visibility: 'public'`): Disponibles para **todas** las organizaciones automáticamente
- ✅ Tests **privados** (`visibility: 'private'`): Solo disponibles para organizaciones específicas listadas en `allowedOrgs[]`
- ✅ El Super Admin puede crear tests y asignarlos a organizaciones usando el campo `allowedOrgs`

### 1.2 Servicio de Obtención de Tests para Organización

**Función**: `getTestsForOrg(orgId)` en `globalTestDefinitionService.js`

**Lógica Actual**:
```javascript
// Filtra tests activos que:
// 1. Son públicos (visibility === 'public') → Disponibles para TODOS
// 2. Son privados Y la org está en allowedOrgs → Disponibles solo para esa org
const tests = snapshot.docs
  .filter(test => {
    if (test.status !== 'active') return false;
    if (test.visibility === 'public') return true;  // ← Todos ven tests públicos
    if (test.visibility === 'private') {
      return test.allowedOrgs && test.allowedOrgs.includes(orgId);  // ← Solo orgs en lista
    }
    return false;
  });
```

**Estado**: ✅ **FUNCIONAL** - El servicio existe y funciona correctamente

### 1.3 Modelo de Organization

**Ubicación**: `src/services/organizationService.js`

**Estructura Actual**:
```javascript
{
  id: string,
  orgId: string,
  name: string,
  // ... otros campos básicos
  // ❌ NO existe campo: allowedTests
  // ❌ NO existe campo: assignedTests
  // ❌ NO existe campo: enabledTests
}
```

**Estado**: ❌ **NO HAY CAMPO** en Organization que almacene tests asignados directamente

### 1.4 Flujo Actual en Campaign Wizard (Paso 3)

**Ubicación**: `src/components/campaign/CampaignWizard.jsx` (líneas 132-138)

**Código Actual**:
```javascript
// Cargar tests disponibles
setAvailableTests([
  { id: 'test1', name: 'Liderazgo Ejecutivo v3', version: '3.0' },
  { id: 'test2', name: 'Competencias Gerenciales v2', version: '2.0' },
  { id: 'test3', name: 'Habilidades de Comunicación v1', version: '1.0' },
  { id: 'test4', name: 'Gestión de Equipos v2', version: '2.0' }
]);
```

**Problema Identificado**:
- ❌ **Datos hardcodeados** - No consulta ningún servicio
- ❌ **No usa `getTestsForOrg()`** - Ignora completamente el sistema de visibilidad
- ❌ **No filtra por organización** - Muestra los mismos tests para todas las orgs
- ❌ **No respeta `allowedOrgs`** - No considera tests privados asignados

**Estado**: ❌ **NO FUNCIONAL** - El Wizard no está conectado al sistema real de tests

### 1.5 Roles: Super Admin vs Org Admin

**Super Admin**:
- **Identificación**: Email `reha01@gmail.com` (hardcodeado en `useSuperAdmin.js`)
- **Permisos en Firestore Rules**:
  ```javascript
  function isSuperAdmin() {
    return request.auth.token.email == 'reha01@gmail.com';
  }
  ```
- **Capacidades Actuales**:
  - ✅ Crear tests globales (`global/platform/testDefinitions`)
  - ✅ Editar tests globales
  - ✅ Eliminar tests globales
  - ✅ Configurar visibilidad (`public` / `private`)
  - ✅ Asignar tests a organizaciones específicas (`allowedOrgs[]`)
  - ✅ Ver todas las organizaciones (`/admin/tests`)

**Org Admin**:
- **Identificación**: Rol `admin` o `owner` en la organización
- **Permisos en Firestore Rules**:
  ```javascript
  function isAdminOrOwner(orgId) {
    return hasRole(orgId, 'admin');
  }
  ```
- **Capacidades Actuales**:
  - ✅ Crear tests organizacionales (`orgs/{orgId}/testDefinitions`)
  - ✅ Editar tests de su organización
  - ✅ Ver tests globales **públicos** (si el código los consulta)
  - ✅ Ver tests globales **privados** asignados a su org (si el código los consulta)
  - ❌ **NO puede asignar tests globales** a su organización (solo Super Admin)
  - ❌ **NO puede ver qué tests están asignados** a su org (no hay UI para esto)

**Estado**: ⚠️ **PARCIALMENTE DEFINIDO** - Los permisos existen pero el flujo de UI no está completo

---

## 🎯 PARTE 2: EL FLUJO OBJETIVO (Lo que necesitamos)

### 2.1 Flujo Deseado: Super Admin Asigna Tests

```
1. Super Admin crea/edita un test global
   ↓
2. Super Admin configura visibilidad:
   - Opción A: "Público" → Disponible para TODAS las organizaciones
   - Opción B: "Privado" → Selecciona organizaciones específicas
   ↓
3. Si es Privado:
   - Super Admin selecciona organizaciones del dropdown
   - Sistema actualiza `allowedOrgs: ['org1', 'org2', ...]`
   ↓
4. Test queda "asignado" a esas organizaciones
```

**Resultado Esperado**:
- Tests públicos: Todas las orgs los ven
- Tests privados: Solo las orgs en `allowedOrgs` los ven

### 2.2 Flujo Deseado: Org Admin Ve Solo Tests Asignados

```
1. Org Admin abre Campaign Wizard → Paso 3 (Asignación de Tests)
   ↓
2. Sistema consulta `getTestsForOrg(currentOrgId)`
   ↓
3. Sistema filtra automáticamente:
   - Tests públicos (visibility === 'public')
   - Tests privados donde currentOrgId está en allowedOrgs[]
   ↓
4. Org Admin ve SOLO los tests asignados a su organización
   ↓
5. Org Admin puede asignar esos tests a usuarios en la campaña
```

**Resultado Esperado**:
- Org Admin **NO ve** tests privados asignados a otras organizaciones
- Org Admin **SÍ ve** todos los tests públicos + sus tests privados asignados

### 2.3 Modelo de Organization Deseado (Opcional)

**Opción A: Mantener `allowedOrgs` en Test** (Actual - Recomendado)
- ✅ Ya implementado
- ✅ Tests "saben" a qué orgs pertenecen
- ✅ No requiere cambios en modelo Organization

**Opción B: Agregar `assignedTests` en Organization** (Alternativa)
```javascript
{
  id: string,
  orgId: string,
  name: string,
  assignedTests: string[]  // Array de testIds asignados
}
```
- ⚠️ Requiere sincronización bidireccional
- ⚠️ Más complejo de mantener
- ⚠️ No necesario si usamos `allowedOrgs`

**Recomendación**: **Opción A** (mantener `allowedOrgs` en Test)

---

## 🔍 PARTE 3: LA BRECHA (Gap Analysis)

### 3.1 Brechas Identificadas

| Aspecto | Estado Actual | Estado Objetivo | Brecha |
|---------|---------------|-----------------|--------|
| **Modelo de Tests** | ✅ Existe con `allowedOrgs` | ✅ Ya cumple | ✅ **Sin brecha** |
| **Servicio `getTestsForOrg()`** | ✅ Existe y funciona | ✅ Ya cumple | ✅ **Sin brecha** |
| **Campaign Wizard Paso 3** | ❌ Datos hardcodeados | ✅ Debe usar `getTestsForOrg()` | ❌ **Brecha crítica** |
| **UI Super Admin** | ✅ Puede asignar tests | ✅ Ya cumple | ✅ **Sin brecha** |
| **UI Org Admin** | ❌ No ve tests asignados | ✅ Debe ver solo asignados | ❌ **Brecha crítica** |
| **Modelo Organization** | ❌ No tiene campo tests | ⚠️ Opcional | ⚠️ **Brecha menor** |

### 3.2 Cambios Necesarios

#### 🔴 **CRÍTICO: Campaign Wizard Paso 3**

**Archivo**: `src/components/campaign/CampaignWizard.jsx`

**Cambio Requerido**:
```javascript
// ANTES (líneas 132-138):
setAvailableTests([
  { id: 'test1', name: 'Liderazgo Ejecutivo v3', version: '3.0' },
  // ... hardcoded
]);

// DESPUÉS:
import { getTestsForOrg } from '../../services/globalTestDefinitionService';

// En loadReferenceData():
const orgTests = await getTestsForOrg(currentOrgId);
setAvailableTests(orgTests.map(test => ({
  id: test.id,
  name: test.title,
  version: test.version || '1.0'
})));
```

**Impacto**: 
- ✅ Org Admin verá solo tests asignados a su organización
- ✅ Respeta tests públicos + privados asignados
- ✅ No requiere cambios en modelo Organization

#### 🟡 **MEJORA: UI para Super Admin Ver Tests por Org**

**Necesidad**: Super Admin necesita ver qué tests están asignados a cada organización

**Solución Opcional**:
- Agregar vista en `/admin/tests` que muestre:
  - Lista de organizaciones
  - Tests asignados a cada una
  - Opción de asignar/desasignar tests

**Impacto**: 
- ⚠️ Mejora UX pero no es crítico
- ⚠️ Puede hacerse después

#### 🟢 **OPCIONAL: Campo en Organization**

**Necesidad**: Ninguna si usamos `allowedOrgs` en Test

**Solución**: No requerida

---

## 📋 RESUMEN EJECUTIVO

### ✅ Lo que YA funciona:
1. Sistema de tests globales con visibilidad pública/privada
2. Campo `allowedOrgs` en tests privados
3. Servicio `getTestsForOrg()` que filtra correctamente
4. Super Admin puede asignar tests a organizaciones
5. Permisos y roles están definidos

### ❌ Lo que NO funciona:
1. **Campaign Wizard no usa el servicio real** - Usa datos hardcodeados
2. **Org Admin ve todos los tests** (hardcoded) en lugar de solo asignados
3. **No hay UI para Super Admin** ver asignaciones por organización

### 🎯 Solución Propuesta:
1. **Cambiar Campaign Wizard** para usar `getTestsForOrg(currentOrgId)`
2. **Eliminar datos hardcodeados** del Paso 3
3. **Verificar que el filtrado funcione** correctamente

### 📊 Complejidad Estimada:
- **Cambio crítico**: 1-2 horas (modificar `CampaignWizard.jsx`)
- **Testing**: 1 hora (verificar que orgs ven solo sus tests)
- **Total**: 2-3 horas

---

## 🔗 Referencias

- `src/services/globalTestDefinitionService.js` - Servicio de tests globales
- `src/components/campaign/CampaignWizard.jsx` - Wizard de campañas (líneas 132-138)
- `src/hooks/useSuperAdmin.js` - Hook de Super Admin
- `firestore.rules` - Reglas de permisos (líneas 374-393)
- `docs/PHASE3C_SUPER_ADMIN_REVIEW.md` - Documentación del sistema Super Admin

---

**Última actualización**: 2025-01-XX  
**Autor**: Análisis Arquitectónico  
**Estado**: ✅ Listo para implementación

