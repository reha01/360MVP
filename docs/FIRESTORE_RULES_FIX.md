# 🔒 Solución: Reglas de Firestore - Permitir List de Organizations

## 🐛 Problema

Los tests muestran que la app usa `org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02` en lugar de `pilot-org-santiago`.

**Evidencia del log:**
```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
```

Esto significa que la app NO PUEDE descubrir la organización `pilot-org-santiago` a la que el usuario pertenece.

## 🔍 Causa Raíz

Las reglas de Firestore para `/organizations/{orgId}` solo permitían `read` (que incluye `get`), pero NO tenían una regla específica para `list`.

### Problema con la función `isMemberOf`

La función `isMemberOf` original buscaba en la **subcolección** legacy:
```javascript
function isMemberOf(orgId) {
  return isSignedIn() && 
         exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(orgId + ':' + currentUserId()));
}
```

Pero la app usa la **colección raíz** `organization_members`:
```javascript
// src/context/OrgContext.jsx líneas 136-143
const col = collection(db, 'organization_members');
const queries = [
  query(col, where('user_id', '==', uid), where('status', '==', 'active')),
  query(col, where('userId', '==', uid), where('status', '==', 'active')),
];
```

## ✅ Solución Implementada

### 1. Nueva función helper para la colección raíz

```javascript
// ✅ NUEVO: Verificar si el usuario es miembro usando la colección raíz organization_members
function isMemberOfViaRootCollection(orgId) {
  return isSignedIn() &&
         exists(/databases/$(database)/documents/organization_members/$(orgId + ':' + currentUserId()));
}
```

### 2. Separación de reglas `get` y `list` para organizations

```javascript
match /organizations/{orgId} {
  // ✅ CORREGIDO: Separar get y list para permitir descubrimiento de organizaciones
  
  // Get específico: solo miembros (usando subcolección legacy o colección raíz)
  allow get: if isMemberOf(orgId) || isMemberOfViaRootCollection(orgId);
  
  // ✅ NUEVO: List permite al usuario "descubrir" organizaciones
  // Esta regla se evalúa DESPUÉS del filtro de Firestore, no antes
  // El cliente puede hacer: db.collection('organizations').where(...).get()
  // y Firestore solo devolverá docs donde esta regla sea true
  allow list: if isSignedIn() && isMemberOfViaRootCollection(resource.id);
  
  // Crear: cualquier usuario autenticado (para workspace personal)
  allow create: if isSignedIn() && 
                   request.resource.data.ownerId == currentUserId();
  
  // Actualizar/Eliminar: solo owner
  allow update, delete: if hasRole(orgId, 'owner');
}
```

### 3. Reglas para la colección raíz `organization_members`

```javascript
match /organization_members/{membershipId} {
  // ✅ NUEVO: Permitir a los usuarios leer sus propias memberships
  // El membershipId tiene formato "orgId:userId"
  // El usuario puede leer si su userId está en el documento
  allow read: if isSignedIn() && 
                 (resource.data.userId == currentUserId() || 
                  resource.data.user_id == currentUserId());
  
  // Crear/Actualizar/Eliminar: solo admins/owners de la org
  // (Por ahora, solo permitimos lectura desde el cliente)
  allow write: if false; // Solo via backend/admin
}
```

## 📊 Cómo Funciona

### Flujo de Descubrimiento de Organizaciones

1. **Usuario se autentica** → `AuthContext` obtiene el `user.uid`

2. **OrgContext busca memberships:**
   ```javascript
   // Query en organization_members (colección raíz)
   query(col, where('user_id', '==', uid), where('status', '==', 'active'))
   ```
   
   **Regla aplicada:**
   ```javascript
   allow read: if resource.data.user_id == currentUserId()
   ```
   ✅ Permite leer el documento `pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

3. **OrgContext carga metadata de organizaciones:**
   ```javascript
   // Para cada orgId en memberships
   const orgDoc = doc(db, 'organizations', orgId);
   const snap = await getDoc(orgDoc);
   ```
   
   **Regla aplicada:**
   ```javascript
   allow get: if isMemberOfViaRootCollection(orgId)
   ```
   ✅ Verifica que existe `organization_members/pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
   ✅ Permite leer `organizations/pilot-org-santiago`

4. **useMultiTenant recibe las organizaciones** → sincroniza con `OrgContext`

5. **useRuntimeFeatureFlags obtiene el orgId correcto** → carga flags desde `pilot-org-santiago`

## 🧪 Para Verificar el Fix

### 1. Desplegar las nuevas reglas

```bash
# Desplegar solo reglas de Firestore
firebase deploy --only firestore:rules --project staging

# O desplegar todo staging
npm run deploy:staging
```

### 2. Recapturar el estado de autenticación

```bash
# El storage state actual puede tener permisos antiguos
# Necesitamos recapturarlo después de desplegar las nuevas reglas
npm run test:auth:capture
```

### 3. Ejecutar los tests

```bash
# Smoke tests
npm run smoke:staging

# Test específico
npx playwright test tests/smoke/simple-flags-test.spec.ts
```

## 🎯 Resultado Esperado

Después de desplegar las reglas, los tests deberían mostrar:

```
Selected Org: pilot-org-santiago  ✅
Dashboard visible: ✅
Feature flags loaded: ✅
```

En lugar de:

```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02  ❌
```

## 📁 Archivos Modificados

1. ✅ `firestore.rules` - Reglas de seguridad actualizadas
2. ✅ `docs/FIRESTORE_RULES_FIX.md` - Documentación de la solución

## 🔑 Conceptos Clave

### Diferencia entre `get` y `list`

- **`get`**: Operación de documento único (e.g., `doc(db, 'organizations', 'pilot-org-santiago')`)
- **`list`**: Operación de colección (e.g., `getDocs(collection(db, 'organizations'))`)

### Formato de MembershipId

- Formato: `"orgId:userId"` (e.g., `"pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02"`)
- Permite lookups eficientes sin índices adicionales
- Asegura unicidad de membresías por org

### Por qué necesitamos `isMemberOfViaRootCollection`

La arquitectura usa **dos estructuras de datos**:

1. **Colección raíz** `organization_members` (nueva, recomendada):
   - Documentos planos con ID `orgId:userId`
   - Queries eficientes: `where('user_id', '==', uid)`
   - **Usada por la app actual**

2. **Subcolección** `organizations/{orgId}/members/{memberId}` (legacy):
   - Anidada dentro de cada organización
   - Más difícil de consultar
   - Mantenida para compatibilidad

Por lo tanto, necesitamos funciones helper para ambas estructuras.





## 🐛 Problema

Los tests muestran que la app usa `org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02` en lugar de `pilot-org-santiago`.

**Evidencia del log:**
```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
```

Esto significa que la app NO PUEDE descubrir la organización `pilot-org-santiago` a la que el usuario pertenece.

## 🔍 Causa Raíz

Las reglas de Firestore para `/organizations/{orgId}` solo permitían `read` (que incluye `get`), pero NO tenían una regla específica para `list`.

### Problema con la función `isMemberOf`

La función `isMemberOf` original buscaba en la **subcolección** legacy:
```javascript
function isMemberOf(orgId) {
  return isSignedIn() && 
         exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(orgId + ':' + currentUserId()));
}
```

Pero la app usa la **colección raíz** `organization_members`:
```javascript
// src/context/OrgContext.jsx líneas 136-143
const col = collection(db, 'organization_members');
const queries = [
  query(col, where('user_id', '==', uid), where('status', '==', 'active')),
  query(col, where('userId', '==', uid), where('status', '==', 'active')),
];
```

## ✅ Solución Implementada

### 1. Nueva función helper para la colección raíz

```javascript
// ✅ NUEVO: Verificar si el usuario es miembro usando la colección raíz organization_members
function isMemberOfViaRootCollection(orgId) {
  return isSignedIn() &&
         exists(/databases/$(database)/documents/organization_members/$(orgId + ':' + currentUserId()));
}
```

### 2. Separación de reglas `get` y `list` para organizations

```javascript
match /organizations/{orgId} {
  // ✅ CORREGIDO: Separar get y list para permitir descubrimiento de organizaciones
  
  // Get específico: solo miembros (usando subcolección legacy o colección raíz)
  allow get: if isMemberOf(orgId) || isMemberOfViaRootCollection(orgId);
  
  // ✅ NUEVO: List permite al usuario "descubrir" organizaciones
  // Esta regla se evalúa DESPUÉS del filtro de Firestore, no antes
  // El cliente puede hacer: db.collection('organizations').where(...).get()
  // y Firestore solo devolverá docs donde esta regla sea true
  allow list: if isSignedIn() && isMemberOfViaRootCollection(resource.id);
  
  // Crear: cualquier usuario autenticado (para workspace personal)
  allow create: if isSignedIn() && 
                   request.resource.data.ownerId == currentUserId();
  
  // Actualizar/Eliminar: solo owner
  allow update, delete: if hasRole(orgId, 'owner');
}
```

### 3. Reglas para la colección raíz `organization_members`

```javascript
match /organization_members/{membershipId} {
  // ✅ NUEVO: Permitir a los usuarios leer sus propias memberships
  // El membershipId tiene formato "orgId:userId"
  // El usuario puede leer si su userId está en el documento
  allow read: if isSignedIn() && 
                 (resource.data.userId == currentUserId() || 
                  resource.data.user_id == currentUserId());
  
  // Crear/Actualizar/Eliminar: solo admins/owners de la org
  // (Por ahora, solo permitimos lectura desde el cliente)
  allow write: if false; // Solo via backend/admin
}
```

## 📊 Cómo Funciona

### Flujo de Descubrimiento de Organizaciones

1. **Usuario se autentica** → `AuthContext` obtiene el `user.uid`

2. **OrgContext busca memberships:**
   ```javascript
   // Query en organization_members (colección raíz)
   query(col, where('user_id', '==', uid), where('status', '==', 'active'))
   ```
   
   **Regla aplicada:**
   ```javascript
   allow read: if resource.data.user_id == currentUserId()
   ```
   ✅ Permite leer el documento `pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

3. **OrgContext carga metadata de organizaciones:**
   ```javascript
   // Para cada orgId en memberships
   const orgDoc = doc(db, 'organizations', orgId);
   const snap = await getDoc(orgDoc);
   ```
   
   **Regla aplicada:**
   ```javascript
   allow get: if isMemberOfViaRootCollection(orgId)
   ```
   ✅ Verifica que existe `organization_members/pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
   ✅ Permite leer `organizations/pilot-org-santiago`

4. **useMultiTenant recibe las organizaciones** → sincroniza con `OrgContext`

5. **useRuntimeFeatureFlags obtiene el orgId correcto** → carga flags desde `pilot-org-santiago`

## 🧪 Para Verificar el Fix

### 1. Desplegar las nuevas reglas

```bash
# Desplegar solo reglas de Firestore
firebase deploy --only firestore:rules --project staging

# O desplegar todo staging
npm run deploy:staging
```

### 2. Recapturar el estado de autenticación

```bash
# El storage state actual puede tener permisos antiguos
# Necesitamos recapturarlo después de desplegar las nuevas reglas
npm run test:auth:capture
```

### 3. Ejecutar los tests

```bash
# Smoke tests
npm run smoke:staging

# Test específico
npx playwright test tests/smoke/simple-flags-test.spec.ts
```

## 🎯 Resultado Esperado

Después de desplegar las reglas, los tests deberían mostrar:

```
Selected Org: pilot-org-santiago  ✅
Dashboard visible: ✅
Feature flags loaded: ✅
```

En lugar de:

```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02  ❌
```

## 📁 Archivos Modificados

1. ✅ `firestore.rules` - Reglas de seguridad actualizadas
2. ✅ `docs/FIRESTORE_RULES_FIX.md` - Documentación de la solución

## 🔑 Conceptos Clave

### Diferencia entre `get` y `list`

- **`get`**: Operación de documento único (e.g., `doc(db, 'organizations', 'pilot-org-santiago')`)
- **`list`**: Operación de colección (e.g., `getDocs(collection(db, 'organizations'))`)

### Formato de MembershipId

- Formato: `"orgId:userId"` (e.g., `"pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02"`)
- Permite lookups eficientes sin índices adicionales
- Asegura unicidad de membresías por org

### Por qué necesitamos `isMemberOfViaRootCollection`

La arquitectura usa **dos estructuras de datos**:

1. **Colección raíz** `organization_members` (nueva, recomendada):
   - Documentos planos con ID `orgId:userId`
   - Queries eficientes: `where('user_id', '==', uid)`
   - **Usada por la app actual**

2. **Subcolección** `organizations/{orgId}/members/{memberId}` (legacy):
   - Anidada dentro de cada organización
   - Más difícil de consultar
   - Mantenida para compatibilidad

Por lo tanto, necesitamos funciones helper para ambas estructuras.





## 🐛 Problema

Los tests muestran que la app usa `org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02` en lugar de `pilot-org-santiago`.

**Evidencia del log:**
```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02
```

Esto significa que la app NO PUEDE descubrir la organización `pilot-org-santiago` a la que el usuario pertenece.

## 🔍 Causa Raíz

Las reglas de Firestore para `/organizations/{orgId}` solo permitían `read` (que incluye `get`), pero NO tenían una regla específica para `list`.

### Problema con la función `isMemberOf`

La función `isMemberOf` original buscaba en la **subcolección** legacy:
```javascript
function isMemberOf(orgId) {
  return isSignedIn() && 
         exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(orgId + ':' + currentUserId()));
}
```

Pero la app usa la **colección raíz** `organization_members`:
```javascript
// src/context/OrgContext.jsx líneas 136-143
const col = collection(db, 'organization_members');
const queries = [
  query(col, where('user_id', '==', uid), where('status', '==', 'active')),
  query(col, where('userId', '==', uid), where('status', '==', 'active')),
];
```

## ✅ Solución Implementada

### 1. Nueva función helper para la colección raíz

```javascript
// ✅ NUEVO: Verificar si el usuario es miembro usando la colección raíz organization_members
function isMemberOfViaRootCollection(orgId) {
  return isSignedIn() &&
         exists(/databases/$(database)/documents/organization_members/$(orgId + ':' + currentUserId()));
}
```

### 2. Separación de reglas `get` y `list` para organizations

```javascript
match /organizations/{orgId} {
  // ✅ CORREGIDO: Separar get y list para permitir descubrimiento de organizaciones
  
  // Get específico: solo miembros (usando subcolección legacy o colección raíz)
  allow get: if isMemberOf(orgId) || isMemberOfViaRootCollection(orgId);
  
  // ✅ NUEVO: List permite al usuario "descubrir" organizaciones
  // Esta regla se evalúa DESPUÉS del filtro de Firestore, no antes
  // El cliente puede hacer: db.collection('organizations').where(...).get()
  // y Firestore solo devolverá docs donde esta regla sea true
  allow list: if isSignedIn() && isMemberOfViaRootCollection(resource.id);
  
  // Crear: cualquier usuario autenticado (para workspace personal)
  allow create: if isSignedIn() && 
                   request.resource.data.ownerId == currentUserId();
  
  // Actualizar/Eliminar: solo owner
  allow update, delete: if hasRole(orgId, 'owner');
}
```

### 3. Reglas para la colección raíz `organization_members`

```javascript
match /organization_members/{membershipId} {
  // ✅ NUEVO: Permitir a los usuarios leer sus propias memberships
  // El membershipId tiene formato "orgId:userId"
  // El usuario puede leer si su userId está en el documento
  allow read: if isSignedIn() && 
                 (resource.data.userId == currentUserId() || 
                  resource.data.user_id == currentUserId());
  
  // Crear/Actualizar/Eliminar: solo admins/owners de la org
  // (Por ahora, solo permitimos lectura desde el cliente)
  allow write: if false; // Solo via backend/admin
}
```

## 📊 Cómo Funciona

### Flujo de Descubrimiento de Organizaciones

1. **Usuario se autentica** → `AuthContext` obtiene el `user.uid`

2. **OrgContext busca memberships:**
   ```javascript
   // Query en organization_members (colección raíz)
   query(col, where('user_id', '==', uid), where('status', '==', 'active'))
   ```
   
   **Regla aplicada:**
   ```javascript
   allow read: if resource.data.user_id == currentUserId()
   ```
   ✅ Permite leer el documento `pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

3. **OrgContext carga metadata de organizaciones:**
   ```javascript
   // Para cada orgId en memberships
   const orgDoc = doc(db, 'organizations', orgId);
   const snap = await getDoc(orgDoc);
   ```
   
   **Regla aplicada:**
   ```javascript
   allow get: if isMemberOfViaRootCollection(orgId)
   ```
   ✅ Verifica que existe `organization_members/pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
   ✅ Permite leer `organizations/pilot-org-santiago`

4. **useMultiTenant recibe las organizaciones** → sincroniza con `OrgContext`

5. **useRuntimeFeatureFlags obtiene el orgId correcto** → carga flags desde `pilot-org-santiago`

## 🧪 Para Verificar el Fix

### 1. Desplegar las nuevas reglas

```bash
# Desplegar solo reglas de Firestore
firebase deploy --only firestore:rules --project staging

# O desplegar todo staging
npm run deploy:staging
```

### 2. Recapturar el estado de autenticación

```bash
# El storage state actual puede tener permisos antiguos
# Necesitamos recapturarlo después de desplegar las nuevas reglas
npm run test:auth:capture
```

### 3. Ejecutar los tests

```bash
# Smoke tests
npm run smoke:staging

# Test específico
npx playwright test tests/smoke/simple-flags-test.spec.ts
```

## 🎯 Resultado Esperado

Después de desplegar las reglas, los tests deberían mostrar:

```
Selected Org: pilot-org-santiago  ✅
Dashboard visible: ✅
Feature flags loaded: ✅
```

En lugar de:

```
Selected Org: org_personal_S1SE2ynl3dQ9ohjMz5hj5h2sJx02  ❌
```

## 📁 Archivos Modificados

1. ✅ `firestore.rules` - Reglas de seguridad actualizadas
2. ✅ `docs/FIRESTORE_RULES_FIX.md` - Documentación de la solución

## 🔑 Conceptos Clave

### Diferencia entre `get` y `list`

- **`get`**: Operación de documento único (e.g., `doc(db, 'organizations', 'pilot-org-santiago')`)
- **`list`**: Operación de colección (e.g., `getDocs(collection(db, 'organizations'))`)

### Formato de MembershipId

- Formato: `"orgId:userId"` (e.g., `"pilot-org-santiago:S1SE2ynl3dQ9ohjMz5hj5h2sJx02"`)
- Permite lookups eficientes sin índices adicionales
- Asegura unicidad de membresías por org

### Por qué necesitamos `isMemberOfViaRootCollection`

La arquitectura usa **dos estructuras de datos**:

1. **Colección raíz** `organization_members` (nueva, recomendada):
   - Documentos planos con ID `orgId:userId`
   - Queries eficientes: `where('user_id', '==', uid)`
   - **Usada por la app actual**

2. **Subcolección** `organizations/{orgId}/members/{memberId}` (legacy):
   - Anidada dentro de cada organización
   - Más difícil de consultar
   - Mantenida para compatibilidad

Por lo tanto, necesitamos funciones helper para ambas estructuras.




