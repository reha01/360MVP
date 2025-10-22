# 🎯 Próximos Pasos - Implementación Fase 2

## Prioridad 1: Completar Dashboard 360 (2-3 horas)

### ✅ Ya tenemos:
- Ruta `/dashboard-360` responde 200
- Componente `OperationalDashboard.jsx` existe
- Feature flags configurados
- Autenticación funcionando

### ❌ Falta:
1. Agregar `data-testid="operational-dashboard"`
2. Conectar con datos reales de Firestore
3. Implementar filtros funcionales
4. Agregar paginación
5. Verificar performance < 2s

### Acciones:
```bash
# 1. Actualizar componente con data-testid
# 2. Crear datos de prueba
node scripts/seed-staging-data-real.js

# 3. Verificar
npm run smoke:staging -- --grep "dashboard"
```

---

## Prioridad 2: Completar Bulk Actions (2-3 horas)

### ✅ Ya tenemos:
- Ruta `/bulk-actions` responde 200
- Componente `BulkActionsManager.jsx` existe
- Servicio `bulkActionService.js` con lógica

### ❌ Falta:
1. Agregar `data-testid="bulk-actions-manager"`
2. Crear asignaciones de prueba
3. Implementar UI de selección
4. Conectar con servicio de emails
5. Implementar DLQ real

---

## Prioridad 3: Completar Alerts (1-2 horas)

### ✅ Ya tenemos:
- Ruta `/alerts` responde 200
- Lógica de DLQ en `bulkActionService.js`

### ❌ Falta:
1. Crear componente `AlertManager.jsx`
2. Agregar `data-testid="alert-manager"`
3. Mostrar alertas de DLQ
4. Implementar acciones de retry

---

## Prioridad 4: Datos de Prueba (1 hora)

### Script completo para Staging:
```javascript
// scripts/seed-complete-phase2.js
- 3 campañas activas
- 50+ asignaciones (5 con emails inválidos)
- 10+ sesiones 360
- Métricas simuladas
- Eventos de auditoría
```

---

## Criterios de Éxito:

| Ruta | Criterio | Test |
|------|----------|------|
| `/dashboard-360` | Carga < 2s, muestra datos | ✅ |
| `/bulk-actions` | Puede reenviar invitaciones | ✅ |
| `/alerts` | Muestra DLQ y errores | ✅ |
| `/comparison` | Muestra comparativas | ⚠️ |
| `/policies` | CRUD de políticas | ⚠️ |

---

## Orden de Ejecución Recomendado:

1. **HOY (2-3h)**:
   - Dashboard 360 completo
   - Smoke test pasando

2. **MAÑANA (3-4h)**:
   - Bulk Actions completo
   - Alerts básico
   - Datos de prueba

3. **PASADO MAÑANA (2-3h)**:
   - Comparison
   - Policies
   - UAT completo

---

## Comando para empezar:

```bash
# Branch para Fase 2
git checkout -b feature/phase2-ui-completion

# Empezar con Dashboard
code src/components/dashboard/OperationalDashboard.jsx
```
