# 360MVP - Development Guide

## Toggles de Debug

### Activación de Modos de Debug

#### 1. **Debug Mode (Logs detallados)**
```javascript
// Activar logs detallados en consola
localStorage.setItem('DEBUG', '1');
location.reload();

// Desactivar logs
localStorage.removeItem('DEBUG');
location.reload();
```

#### 2. **Emergency Mode (Modo de emergencia)**
```javascript
// Activar modo de emergencia (solo en desarrollo o si está habilitado)
localStorage.setItem('EMERGENCY_MODE', '1');
location.reload();

// Desactivar modo de emergencia
localStorage.removeItem('EMERGENCY_MODE');
location.reload();
```

#### 3. **Kill Switch (Parada de emergencia)**
```javascript
// Activar kill switch para detener loops
localStorage.setItem('ORGCTX_KILL', '1');
location.reload();

// Desactivar kill switch
localStorage.removeItem('ORGCTX_KILL');
location.reload();
```

### Reset Completo de Debug

Para limpiar todos los toggles de debug y volver al estado por defecto:

```javascript
localStorage.removeItem('ORGCTX_KILL');
localStorage.removeItem('DEBUG');
localStorage.removeItem('EMERGENCY_MODE');
localStorage.removeItem('selectedOrgId');
location.reload();
```

### Herramientas de Debug Disponibles

Cuando el debug mode está activo, están disponibles en `window.__debugOrgContext`:

```javascript
// Ver estado actual
__debugOrgContext.debugOnly()

// Limpiar todo el estado y recargar
__debugOrgContext.forceReset()

// Activar/desactivar debug logs
__debugOrgContext.enableDebug()
__debugOrgContext.disableDebug()
```

### Herramientas de Emergency Mode

Cuando el emergency mode está activo, están disponibles en `window.emergencyMode`:

```javascript
// Ver estado del modo de emergencia
emergencyMode.status()

// Activar/desactivar kill switch
emergencyMode.activate()
emergencyMode.deactivate()

// Reset completo
emergencyMode.reset()

// Habilitar/deshabilitar emergency mode en producción
emergencyMode.enable()
emergencyMode.disable()
```

## Estados del Sistema

### OrgContext Status
- `idle` - Estado inicial
- `loading` - Cargando memberships
- `success` - Memberships cargados exitosamente
- `empty` - Sin memberships (usuario autenticado pero sin organizaciones)
- `error` - Error al cargar memberships
- `unauthenticated` - Usuario no autenticado

### Flujo de Autenticación
1. **Usuario no autenticado** → `status = 'unauthenticated'` → Redirect a `/login`
2. **Usuario autenticado** → Carga memberships → `status = 'success'/'empty'/'error'`
3. **Sin workspace** → Redirect a `/select-workspace`

## Troubleshooting

### Problema: Loop infinito en OrgContext
```javascript
// Solución rápida
localStorage.setItem('ORGCTX_KILL', '1');
location.reload();

// Verificar si se resolvió
emergencyMode.status();
```

### Problema: Logs excesivos en producción
```javascript
// Desactivar todos los logs
localStorage.removeItem('DEBUG');
localStorage.removeItem('EMERGENCY_MODE');
location.reload();
```

### Problema: Estado corrupto
```javascript
// Reset completo
__debugOrgContext.forceReset();
```

### Comando de Reset Rápido
```javascript
// Limpiar todo y recargar
localStorage.removeItem('ORGCTX_KILL'); 
localStorage.removeItem('DEBUG'); 
location.reload();
```

## Arquitectura de Debug

- **Development**: Todos los logs y herramientas están disponibles automáticamente
- **Production**: Solo logs de error, herramientas de debug requieren activación manual
- **Emergency Mode**: Sistema de seguridad para prevenir loops en producción
- **Kill Switch**: Parada de emergencia que previene carga de datos

## Notas de Seguridad

- Los toggles de debug NO afectan la funcionalidad de producción por defecto
- El kill switch solo se activa manualmente o en caso de loop detectado
- Todos los logs de debug están gated detrás de `debugOnly()`
- El emergency mode solo funciona en desarrollo o cuando está explícitamente habilitado
