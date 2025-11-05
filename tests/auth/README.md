# 🔐 Autenticación para Tests

## Captura Manual de Auth State (Para Staging)

### Comando
```bash
npm run test:auth:capture
```

### Qué hace
1. Abre Chrome en modo visible (`--headed`)
2. Navega a `https://mvp-staging-3e1cd.web.app/login`
3. **Espera que TÚ hagas login manualmente**
4. Detecta cuando llegas a `/dashboard` o `/select-workspace`
5. Guarda el estado en `tests/.auth/state.json`

### Credenciales
- **Email:** admin@pilot-santiago.com
- **Password:** TestPilot2024!

### Variables de Entorno
- `STAGING_BASE_URL`: URL de staging (ya configurada en el comando)
- Se lee correctamente como `process.env.STAGING_BASE_URL` en el script

### Flujo Esperado
```
🔐 Capturando estado de autenticación...

📍 URL Staging: https://mvp-staging-3e1cd.web.app
📁 Archivo destino: tests/.auth/state.json

🌐 Navegando a: https://mvp-staging-3e1cd.web.app/login

📝 Por favor, completa el login manualmente:
   Email: admin@pilot-santiago.com
   Password: TestPilot2024!

⏳ Esperando login (timeout: 120 segundos)...

[TÚ HACES LOGIN EN EL NAVEGADOR]

✅ Login exitoso! Guardando estado de autenticación...

📁 Estado guardado en: tests/.auth/state.json

▶️ Ahora puedes ejecutar:
   npm run smoke:staging
   npm run smoke:ci
```

### Troubleshooting

#### El navegador abre `about:blank`
- **Causa:** La variable `STAGING_BASE_URL` no se está pasando correctamente
- **Solución:** Ya corregido - el script ahora usa `STAGING_BASE_URL` correctamente
- **Verificar:** En la consola debe aparecer `📍 URL Staging: https://mvp-staging-3e1cd.web.app`

#### Timeout después de 120 segundos
- **Causa:** No completaste el login o la redirección falló
- **Solución:** Asegúrate de hacer login completo hasta ver `/dashboard` o `/select-workspace`

#### Error de permisos al guardar archivo
- **Causa:** No existe el directorio `tests/.auth/`
- **Solución:** 
  ```bash
  mkdir -p tests/.auth
  ```

#### El navegador se cierra inmediatamente
- **Causa:** Playwright detectó que ya estás en la URL esperada (poco probable)
- **Solución:** Borra el archivo anterior y vuelve a ejecutar:
  ```bash
  rm tests/.auth/state.json
  npm run test:auth:capture
  ```

### Configuración en playwright.config.ts

```typescript
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

### Después de Capturar

El archivo `state.json` contendrá:
- Cookies de sesión de Firebase Auth
- LocalStorage con:
  - `firebase:authUser:...`
  - `360mvp_auth_token`
  - `360mvp_user_uid`
  - `selectedOrgId_<uid>`

### Usar el Estado en Tests

```bash
# Smoke tests con autenticación
npm run smoke:staging

# Comando directo
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke
```

## Auth Setup Automático (Para CI)

Ver `auth.setup.ts` - se ejecuta automáticamente en el proyecto `setup` y NO requiere intervención manual.








## Captura Manual de Auth State (Para Staging)

### Comando
```bash
npm run test:auth:capture
```

### Qué hace
1. Abre Chrome en modo visible (`--headed`)
2. Navega a `https://mvp-staging-3e1cd.web.app/login`
3. **Espera que TÚ hagas login manualmente**
4. Detecta cuando llegas a `/dashboard` o `/select-workspace`
5. Guarda el estado en `tests/.auth/state.json`

### Credenciales
- **Email:** admin@pilot-santiago.com
- **Password:** TestPilot2024!

### Variables de Entorno
- `STAGING_BASE_URL`: URL de staging (ya configurada en el comando)
- Se lee correctamente como `process.env.STAGING_BASE_URL` en el script

### Flujo Esperado
```
🔐 Capturando estado de autenticación...

📍 URL Staging: https://mvp-staging-3e1cd.web.app
📁 Archivo destino: tests/.auth/state.json

🌐 Navegando a: https://mvp-staging-3e1cd.web.app/login

📝 Por favor, completa el login manualmente:
   Email: admin@pilot-santiago.com
   Password: TestPilot2024!

⏳ Esperando login (timeout: 120 segundos)...

[TÚ HACES LOGIN EN EL NAVEGADOR]

✅ Login exitoso! Guardando estado de autenticación...

📁 Estado guardado en: tests/.auth/state.json

▶️ Ahora puedes ejecutar:
   npm run smoke:staging
   npm run smoke:ci
```

### Troubleshooting

#### El navegador abre `about:blank`
- **Causa:** La variable `STAGING_BASE_URL` no se está pasando correctamente
- **Solución:** Ya corregido - el script ahora usa `STAGING_BASE_URL` correctamente
- **Verificar:** En la consola debe aparecer `📍 URL Staging: https://mvp-staging-3e1cd.web.app`

#### Timeout después de 120 segundos
- **Causa:** No completaste el login o la redirección falló
- **Solución:** Asegúrate de hacer login completo hasta ver `/dashboard` o `/select-workspace`

#### Error de permisos al guardar archivo
- **Causa:** No existe el directorio `tests/.auth/`
- **Solución:** 
  ```bash
  mkdir -p tests/.auth
  ```

#### El navegador se cierra inmediatamente
- **Causa:** Playwright detectó que ya estás en la URL esperada (poco probable)
- **Solución:** Borra el archivo anterior y vuelve a ejecutar:
  ```bash
  rm tests/.auth/state.json
  npm run test:auth:capture
  ```

### Configuración en playwright.config.ts

```typescript
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

### Después de Capturar

El archivo `state.json` contendrá:
- Cookies de sesión de Firebase Auth
- LocalStorage con:
  - `firebase:authUser:...`
  - `360mvp_auth_token`
  - `360mvp_user_uid`
  - `selectedOrgId_<uid>`

### Usar el Estado en Tests

```bash
# Smoke tests con autenticación
npm run smoke:staging

# Comando directo
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke
```

## Auth Setup Automático (Para CI)

Ver `auth.setup.ts` - se ejecuta automáticamente en el proyecto `setup` y NO requiere intervención manual.








## Captura Manual de Auth State (Para Staging)

### Comando
```bash
npm run test:auth:capture
```

### Qué hace
1. Abre Chrome en modo visible (`--headed`)
2. Navega a `https://mvp-staging-3e1cd.web.app/login`
3. **Espera que TÚ hagas login manualmente**
4. Detecta cuando llegas a `/dashboard` o `/select-workspace`
5. Guarda el estado en `tests/.auth/state.json`

### Credenciales
- **Email:** admin@pilot-santiago.com
- **Password:** TestPilot2024!

### Variables de Entorno
- `STAGING_BASE_URL`: URL de staging (ya configurada en el comando)
- Se lee correctamente como `process.env.STAGING_BASE_URL` en el script

### Flujo Esperado
```
🔐 Capturando estado de autenticación...

📍 URL Staging: https://mvp-staging-3e1cd.web.app
📁 Archivo destino: tests/.auth/state.json

🌐 Navegando a: https://mvp-staging-3e1cd.web.app/login

📝 Por favor, completa el login manualmente:
   Email: admin@pilot-santiago.com
   Password: TestPilot2024!

⏳ Esperando login (timeout: 120 segundos)...

[TÚ HACES LOGIN EN EL NAVEGADOR]

✅ Login exitoso! Guardando estado de autenticación...

📁 Estado guardado en: tests/.auth/state.json

▶️ Ahora puedes ejecutar:
   npm run smoke:staging
   npm run smoke:ci
```

### Troubleshooting

#### El navegador abre `about:blank`
- **Causa:** La variable `STAGING_BASE_URL` no se está pasando correctamente
- **Solución:** Ya corregido - el script ahora usa `STAGING_BASE_URL` correctamente
- **Verificar:** En la consola debe aparecer `📍 URL Staging: https://mvp-staging-3e1cd.web.app`

#### Timeout después de 120 segundos
- **Causa:** No completaste el login o la redirección falló
- **Solución:** Asegúrate de hacer login completo hasta ver `/dashboard` o `/select-workspace`

#### Error de permisos al guardar archivo
- **Causa:** No existe el directorio `tests/.auth/`
- **Solución:** 
  ```bash
  mkdir -p tests/.auth
  ```

#### El navegador se cierra inmediatamente
- **Causa:** Playwright detectó que ya estás en la URL esperada (poco probable)
- **Solución:** Borra el archivo anterior y vuelve a ejecutar:
  ```bash
  rm tests/.auth/state.json
  npm run test:auth:capture
  ```

### Configuración en playwright.config.ts

```typescript
{
  name: 'auth-capture',
  testMatch: /.*capture-state\.spec\.ts/,
  use: {
    ...devices['Desktop Chrome'],
    storageState: undefined,  // NO cargar estado existente
  },
}
```

### Después de Capturar

El archivo `state.json` contendrá:
- Cookies de sesión de Firebase Auth
- LocalStorage con:
  - `firebase:authUser:...`
  - `360mvp_auth_token`
  - `360mvp_user_uid`
  - `selectedOrgId_<uid>`

### Usar el Estado en Tests

```bash
# Smoke tests con autenticación
npm run smoke:staging

# Comando directo
cross-env STAGING_BASE_URL=https://mvp-staging-3e1cd.web.app \
         STORAGE_STATE=tests/.auth/state.json \
         playwright test tests/smoke
```

## Auth Setup Automático (Para CI)

Ver `auth.setup.ts` - se ejecuta automáticamente en el proyecto `setup` y NO requiere intervención manual.







