# Multi-Tenant Deployment Guide - Fase 0

## Resumen
Esta guía cubre el despliegue del esqueleto multi-tenant para 360MVP. La implementación es aditiva y mantiene 100% de compatibilidad con el flujo freemium actual.

## Pre-requisitos

### Verificaciones antes del despliegue
```bash
# 1. Verificar que tengas acceso al proyecto Firebase
firebase projects:list

# 2. Verificar que estés en el proyecto correcto
firebase use --list

# 3. Backup de datos existentes (recomendado para producción)
# Exportar datos de Firestore
gcloud firestore export gs://[BUCKET_NAME]/firestore_backup_$(date +%Y%m%d_%H%M%S) --project=[PROJECT_ID]
```

### Variables de entorno requeridas
```bash
# En tu archivo .env apropiado (.env.local, .env.staging, .env.production)
VITE_TENANCY_V1=false  # Mantener en false para Fase 0
```

## Pasos de Despliegue

### Paso 1: Smoke Tests (Recomendado)
```bash
# Ejecutar smoke tests para validar que todo funciona
node scripts/smoke-test.js

# Debería mostrar:
# ✅ ALL TESTS PASSED - Multi-tenant implementation is backward compatible!
```

### Paso 2: Desplegar Índices
```bash
# Desplegar nuevos índices de Firestore
firebase deploy --only firestore:indexes

# Esperar a que los índices se construyan (puede tomar varios minutos)
# Verificar estado en: https://console.firebase.google.com/project/[PROJECT_ID]/firestore/indexes
```

### Paso 3: Desplegar Reglas de Seguridad
```bash
# Desplegar reglas actualizadas (modo compatibilidad)
firebase deploy --only firestore:rules
```

### Paso 4: Ejecutar Backfill (DRY RUN primero)
```bash
# SIEMPRE ejecutar dry-run primero para ver qué se haría
node scripts/backfill-organizations.js --dry-run

# Revisar cuidadosamente la salida, debería mostrar:
# - Número de usuarios que tendrán org personal
# - Número de evaluaciones que tendrán org_id
# - Número de reportes que tendrán org_id
```

### Paso 5: Ejecutar Backfill Real
```bash
# SOLO después de verificar dry-run
node scripts/backfill-organizations.js --execute

# El script pedirá confirmación:
# "Are you sure you want to proceed? Type 'yes' to continue:"
```

### Paso 6: Validar Resultados
```bash
# Verificar que el backfill fue exitoso
node scripts/backfill-organizations.js --validate

# Debería mostrar:
# ✅ SUCCESS y porcentajes del 100% para organizaciones y datos
```

### Paso 7: Smoke Tests Post-Deployment
```bash
# Verificar que la app sigue funcionando
node scripts/smoke-test.js

# Todos los tests deben pasar
```

## Verificación Manual

### 1. Verificar datos en Firestore Console
- Ir a [Firestore Console](https://console.firebase.google.com/project/[PROJECT_ID]/firestore)
- Verificar que existen las colecciones:
  - `organizations` (con documentos `org_personal_[userId]`)
  - `organization_members` (con memberships de tipo 'owner')
- Verificar que `evaluations` y `reports` tienen campo `orgId`

### 2. Probar la aplicación
```bash
# Iniciar la aplicación en desarrollo
npm run dev

# O probar con la versión desplegada
```

### 3. Verificar funcionalidad existente
- ✅ Registro de usuarios
- ✅ Inicio de sesión  
- ✅ Creación de evaluaciones
- ✅ Respuesta a evaluaciones
- ✅ Visualización de reportes
- ✅ Dashboard principal

## Rollback (Si es necesario)

### Rollback de Reglas
```bash
# Revertir a reglas anteriores
git checkout HEAD~1 -- firestore.rules
firebase deploy --only firestore:rules
```

### Rollback de Datos (Parcial)
```bash
# Las organizaciones y memberships pueden dejarse - no afectan funcionalidad
# Los campos org_id pueden dejarse - las reglas los ignoran en modo compatibilidad

# Si necesitas rollback completo, restaurar desde backup:
gcloud firestore import gs://[BUCKET_NAME]/firestore_backup_[TIMESTAMP] --project=[PROJECT_ID]
```

## Monitoreo Post-Deployment

### Métricas a vigilar
1. **Errores de aplicación**: Sin incremento en errores JS o errores de Firestore
2. **Performance**: Sin degradación en tiempos de carga
3. **Funcionalidad**: Todos los flujos existentes funcionando igual

### Logs importantes
```bash
# Ver logs de Cloud Functions (si aplica)
firebase functions:log

# Ver logs de hosting
firebase hosting:channel:list
```

## Activación de TENANCY_V1 (Opcional en Fase 0)

Una vez que todo esté funcionando correctamente, puedes activar opcionalmente la flag:

```bash
# En variables de entorno
VITE_TENANCY_V1=true
```

**Efectos de activar TENANCY_V1=true:**
- Los helpers multi-tenant funcionan con datos reales
- Se habilita el hook useMultiTenant
- Las queries empiezan a usar scoping por org_id
- **NO cambia la UI ni los flujos existentes**

## Troubleshooting

### Problema: Índices no construidos
**Error**: "The query requires an index"
**Solución**: 
- Esperar a que se construyan los índices (puede tomar hasta 30 minutos)
- Verificar estado en Firebase Console → Firestore → Indexes

### Problema: Reglas bloquean escrituras
**Error**: "Missing or insufficient permissions"
**Solución**:
- Verificar que las reglas tengan modo compatibilidad habilitado
- Para evaluaciones/reportes, debe permitir `orgId == null`

### Problema: Backfill falla parcialmente
**Error**: Algunos usuarios/evaluaciones no fueron procesados
**Solución**:
- Ejecutar nuevamente el backfill (es idempotente)
- Revisar logs para errores específicos
- Validar permisos de escritura

### Problema: App no funciona después del deployment
**Síntomas**: Pantalla blanca, errores en console
**Solución**:
1. Verificar que TENANCY_V1=false
2. Verificar que no hay errores de importación
3. Ejecutar smoke tests
4. Si persiste, hacer rollback de reglas

## Scripts de Utilidad

```json
// Agregar a package.json
{
  "scripts": {
    "multitenant:test": "node scripts/smoke-test.js",
    "multitenant:backfill:dry": "node scripts/backfill-organizations.js --dry-run",
    "multitenant:backfill": "node scripts/backfill-organizations.js --execute", 
    "multitenant:validate": "node scripts/backfill-organizations.js --validate",
    "deploy:indexes": "firebase deploy --only firestore:indexes",
    "deploy:rules": "firebase deploy --only firestore:rules"
  }
}
```

## Siguiente Fase

Una vez completada la Fase 0:
- ✅ Esqueleto multi-tenant funcional
- ✅ Datos preparados para futuras funcionalidades
- ✅ Zero downtime, zero cambios de UI
- 🚀 **Listo para Fase 1**: Funcionalidades 180°/360° corporativas

---

**⚠️ Recordatorio importante**: Esta implementación es preparatoria. No cambia nada visible para los usuarios finales, solo prepara la infraestructura para futuras funcionalidades corporativas.















