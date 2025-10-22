# 🔍 Estado de Firebase - Verificación Post-Migración

## ✅ Estructura Actual en Firestore

Según la captura de pantalla, tenemos:

### ✅ Colección Principal
```
organizations/pilot-org-santiago
```

### ✅ Documento de Organización
```json
{
  "name": "Pilot Org Santiago",
  "plan": "starter", 
  "timezone": "America/Santiago",
  "featureFlags": {
    "FEATURE_BULK_ACTIONS": true,
    // ... otros flags
  }
}
```

## ⚠️ Verificaciones Pendientes

### 1. **Usuario en Firebase Auth**
Necesitas verificar que existe:
- Email: `admin@pilot-santiago.com`
- Password: `TestPilot2024!`
- UID: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02` (si ya fue creado)

### 2. **Miembro en Firestore**
Ruta esperada:
```
organizations/pilot-org-santiago/members/{UID}
```

Documento esperado:
```json
{
  "email": "admin@pilot-santiago.com",
  "role": "admin",
  "active": true,
  "displayName": "Admin Santiago"
}
```

### 3. **Subcollecciones Necesarias**
Para que los smoke tests pasen, necesitas estas subcollecciones en `organizations/pilot-org-santiago/`:

- `testDefinitions/test-360-leadership-v1`
- `campaigns/campaign-smoke-test-1`
- `evaluation360Sessions/` (al menos 3 documentos)
- `evaluatorAssignments/` (al menos 12 documentos)

## 📋 Checklist de Verificación

- [x] Colección `organizations` existe (NO `orgs`)
- [x] Documento `pilot-org-santiago` existe
- [ ] Usuario `admin@pilot-santiago.com` en Firebase Auth
- [ ] Miembro vinculado en `organizations/pilot-org-santiago/members/{UID}`
- [ ] Test definition creado
- [ ] Campaña activa creada
- [ ] Sesiones 360 creadas
- [ ] Asignaciones creadas

## 🔧 Siguiente Paso

Si faltan datos, puedes:

1. **Opción A**: Crear manualmente siguiendo `FIRESTORE_SETUP_QUICK.md`
2. **Opción B**: Ejecutar el script de seeding:
   ```bash
   node scripts/seed-staging-data-real.js
   ```

## ✅ Confirmación de Alineación

**IMPORTANTE**: Los cambios del PR están **correctamente alineados** con la estructura actual:
- ✅ Firestore usa `organizations` (no `orgs`)
- ✅ El código ahora busca en `organizations/*`
- ✅ Las reglas de Firestore apuntan a `organizations/*`

El único problema es que faltan los datos de prueba necesarios para los smoke tests.
