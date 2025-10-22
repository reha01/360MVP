# Instrucciones para Configurar Staging - Smoke Tests Fase 2

**Objetivo**: Preparar Staging con usuarios y datos necesarios para ejecutar smoke tests

---

## 🔐 Paso 1: Crear Usuarios de Prueba (5-10 min)

### Opción A: Firebase Console (RECOMENDADO)

1. **Ir a Firebase Console**: https://console.firebase.google.com/project/mvp-staging-3e1cd/authentication/users

2. **Crear Usuario 1 - Org Santiago**:
   ```
   Email: admin@pilot-santiago.com
   Password: TestPilot2024!
   Display Name: Admin Santiago
   ```
   - Clic en "Add user"
   - Guardar credenciales en 1Password

3. **Crear Usuario 2 - Org Mexico**:
   ```
   Email: admin@pilot-mexico.com
   Password: TestPilot2024!
   Display Name: Admin Mexico
   ```
   - Clic en "Add user"
   - Guardar credenciales en 1Password

4. **Asignar a organizaciones**:
   - Ir a Firestore: https://console.firebase.google.com/project/mvp-staging-3e1cd/firestore
   - Colección: `orgs/pilot-org-santiago/members`
   - Agregar documento con el UID del usuario creado:
     ```json
     {
       "email": "admin@pilot-santiago.com",
       "role": "admin",
       "joinedAt": [timestamp actual],
       "active": true
     }
     ```
   - Repetir para `pilot-org-mexico`

### Opción B: Firebase CLI

```bash
# Instalar Firebase tools si no está instalado
npm install -g firebase-tools

# Login y seleccionar proyecto
firebase login
firebase use mvp-staging-3e1cd

# Crear usuarios (requiere Firebase Admin SDK)
# Ver script: scripts/create-staging-users.js
```

---

## 📊 Paso 2: Verificar/Crear Datos Mínimos (10-15 min)

### 2.1 Verificar Organizaciones

En Firestore Console, verificar que existen:

```
orgs/
  pilot-org-santiago/
    name: "Pilot Org Santiago"
    timezone: "America/Santiago"
    plan: "starter"
    createdAt: [timestamp]
    
  pilot-org-mexico/
    name: "Pilot Org Mexico"
    timezone: "America/Mexico_City"
    plan: "starter"
    createdAt: [timestamp]
```

Si no existen, crearlas manualmente en Firestore.

### 2.2 Crear Campaña de Prueba

Para cada org, crear al menos 1 campaña:

```
orgs/{orgId}/campaigns/campaign-test-1/
  name: "Campaña de Prueba - Smoke Tests"
  status: "active"
  startDate: [hoy]
  endDate: [+30 días]
  createdAt: [timestamp]
  testId: "test-360-v1"
  testVersion: 1
```

### 2.3 Crear Asignaciones de Prueba

Para cada campaña, crear 10-15 asignaciones:

```
orgs/{orgId}/evaluatorAssignments/assignment-test-{1-15}/
  campaignId: "campaign-test-1"
  session360Id: "session-test-{n}"
  evaluatorEmail: "evaluator{n}@test.com"
  evaluatorType: "peer" | "manager" | "direct"
  status: "pending"
  tokenHash: [hash generado]
  createdAt: [timestamp]
  deadline: [+14 días]
```

**IMPORTANTE**: Crear 1 asignación con email inválido para probar DLQ:
```
evaluatorEmail: "invalid@test.local"
```

---

## 🧪 Paso 3: Configurar Variables de Entorno

### Opción A: Archivo .env.staging

Crear archivo `.env.staging` en la raíz:

```bash
# Staging Configuration
STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app

# Pilot Org Santiago
PILOT_SANTIAGO_EMAIL=admin@pilot-santiago.com
PILOT_SANTIAGO_PASSWORD=TestPilot2024!

# Pilot Org Mexico
PILOT_MEXICO_EMAIL=admin@pilot-mexico.com
PILOT_MEXICO_PASSWORD=TestPilot2024!

# Non-Pilot Org (opcional)
NON_PILOT_EMAIL=user@regular-org.com
NON_PILOT_PASSWORD=password123
```

### Opción B: Variables de sistema

```bash
# Windows PowerShell
$env:PILOT_SANTIAGO_EMAIL="admin@pilot-santiago.com"
$env:PILOT_SANTIAGO_PASSWORD="TestPilot2024!"

# Linux/Mac
export PILOT_SANTIAGO_EMAIL="admin@pilot-santiago.com"
export PILOT_SANTIAGO_PASSWORD="TestPilot2024!"
```

### Opción C: Playwright Auth Storage (MEJOR)

```bash
# Capturar estado de autenticación una vez
npm run test:auth:capture

# Esto crea: tests/.auth/state.json
# Usar en todos los tests automáticamente
```

---

## ✅ Paso 4: Verificar Configuración

```bash
# Test rápido de conexión
node -e "console.log('Staging URL:', process.env.STAGING_BASE_URL || 'https://mvp-staging-3e1cd.web.app')"

# Verificar que las credenciales están configuradas
node -e "console.log('Santiago Email:', process.env.PILOT_SANTIAGO_EMAIL)"
```

---

## 🚀 Paso 5: Ejecutar Smoke Tests

### Primera ejecución (capturar auth)

```bash
# Capturar autenticación
npm run test:auth:capture

# Esto abrirá un navegador
# 1. Login con admin@pilot-santiago.com / TestPilot2024!
# 2. El estado se guardará en tests/.auth/state.json
```

### Ejecución normal

```bash
# Con auth storage (recomendado)
npm run test:smoke:staging:auth

# O con variables de entorno
PILOT_SANTIAGO_EMAIL=admin@pilot-santiago.com \
PILOT_SANTIAGO_PASSWORD=TestPilot2024! \
npm run smoke:staging
```

### Ver reporte HTML

```bash
# Playwright genera un reporte automáticamente
# Se abrirá en http://localhost:9323
```

---

## 📋 Checklist de Verificación

Antes de ejecutar smoke tests, verificar:

- [ ] Usuarios creados en Firebase Auth
  - [ ] admin@pilot-santiago.com
  - [ ] admin@pilot-mexico.com
- [ ] Usuarios asignados a organizaciones en Firestore
  - [ ] `orgs/pilot-org-santiago/members/{uid}`
  - [ ] `orgs/pilot-org-mexico/members/{uid}`
- [ ] Organizaciones existen en Firestore
  - [ ] `orgs/pilot-org-santiago`
  - [ ] `orgs/pilot-org-mexico`
- [ ] Al menos 1 campaña activa por org
  - [ ] `orgs/pilot-org-santiago/campaigns/campaign-test-1`
  - [ ] `orgs/pilot-org-mexico/campaigns/campaign-test-1`
- [ ] Al menos 10 asignaciones por campaña
  - [ ] Con 1 email inválido: `invalid@test.local`
- [ ] Feature flags configurados
  - [ ] `FEATURE_BULK_ACTIONS` ON para orgs piloto
  - [ ] OFF para otras orgs
- [ ] Variables de entorno o auth storage configurado
  - [ ] `.env.staging` O
  - [ ] `tests/.auth/state.json`

---

## 🔍 Troubleshooting

### Problema: "User not found" al login

**Causa**: Usuario no existe en Firebase Auth  
**Solución**: Crear usuario en Firebase Console

### Problema: "Permission denied" al acceder a /bulk-actions

**Causa**: Feature flag no está habilitado para la org  
**Solución**: Verificar que el orgId es `pilot-org-santiago` o `pilot-org-mexico`

### Problema: "No assignments found"

**Causa**: No hay datos en Firestore  
**Solución**: Crear asignaciones manualmente o ejecutar script de seeding

### Problema: Tests timeout en navegación

**Causa**: Ruta post-login incorrecta  
**Solución**: Verificar que el usuario se redirecciona a `/dashboard` después del login

---

## 📞 Soporte

Si los problemas persisten:

1. **Verificar logs de Firebase**: Console > Functions > Logs
2. **Verificar Firestore Rules**: Console > Firestore > Rules
3. **Revisar Network tab**: En DevTools durante el login
4. **Contactar**: Compartir screenshots de error y logs

---

**Última actualización**: 2025-10-21  
**Versión**: 1.0.0




