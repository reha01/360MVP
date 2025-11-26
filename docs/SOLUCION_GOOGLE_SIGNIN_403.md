# 🔧 Solución: Error 403 al Iniciar Sesión con Google

## 🚨 Problema

Al intentar iniciar sesión con Google, aparece el error:
```
403 (Forbidden)
API_KEY_HTTP_REFERRER_BLOCKED
Requests from referer https://mvp-staging-3e1cd.firebaseapp.com/ are blocked.
```

## ✅ Solución: Configurar Dominios Permitidos en Google Cloud Console

### Paso 1: Acceder a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto: **`mvp-staging-3e1cd`**

### Paso 2: Navegar a Credenciales

1. En el menú lateral, ve a **"APIs & Services"** → **"Credentials"**
2. O usa este enlace directo:
   ```
   https://console.cloud.google.com/apis/credentials?project=mvp-staging-3e1cd
   ```

### Paso 3: Encontrar la API Key

1. Busca la API Key: `AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ`
2. Haz clic en el nombre de la API Key para editarla

### Paso 4: Configurar Restricciones de Dominio HTTP

1. En la sección **"Application restrictions"**, selecciona **"HTTP referrers (web sites)"**
2. En **"Website restrictions"**, haz clic en **"+ ADD AN ITEM"**
3. Agrega los siguientes dominios (uno por línea):

```
https://mvp-staging-3e1cd.web.app/*
https://mvp-staging-3e1cd.firebaseapp.com/*
https://*.mvp-staging-3e1cd.web.app/*
https://*.mvp-staging-3e1cd.firebaseapp.com/*
```

**Nota:** El asterisco `*` al final permite todas las rutas dentro del dominio.

### Paso 5: Guardar Cambios

1. Haz clic en **"SAVE"** (Guardar)
2. Espera unos segundos para que los cambios se propaguen (puede tomar hasta 5 minutos)

### Paso 6: Verificar

1. Vuelve a la aplicación: `https://mvp-staging-3e1cd.web.app/login`
2. Intenta iniciar sesión con Google nuevamente
3. El error debería desaparecer

---

## 🔍 Verificación Alternativa: Ver Restricciones Actuales

Si quieres verificar qué dominios están actualmente permitidos:

1. Ve a la API Key en Google Cloud Console
2. Revisa la sección **"Application restrictions"**
3. Si dice **"None"**, significa que no hay restricciones (pero el error sugiere que sí las hay)
4. Si dice **"HTTP referrers"**, verifica que los dominios listados arriba estén incluidos

---

## 🛠️ Solución Alternativa: Remover Restricciones Temporalmente

**⚠️ ADVERTENCIA:** Solo para desarrollo/testing. En producción, siempre usa restricciones.

Si necesitas una solución rápida para testing:

1. En la API Key, cambia **"Application restrictions"** a **"None"**
2. Guarda los cambios
3. Esto permitirá solicitudes desde cualquier dominio (menos seguro)

**IMPORTANTE:** Recuerda volver a agregar las restricciones después de las pruebas.

---

## 📋 Dominios que Deben Estar Permitidos

Para que Google Sign-In funcione correctamente, estos dominios deben estar en la lista:

- ✅ `https://mvp-staging-3e1cd.web.app/*`
- ✅ `https://mvp-staging-3e1cd.firebaseapp.com/*`
- ✅ `https://*.mvp-staging-3e1cd.web.app/*` (subdominios)
- ✅ `https://*.mvp-staging-3e1cd.firebaseapp.com/*` (subdominios)

Si tienes un dominio personalizado, también agrégalo:
- ✅ `https://tu-dominio.com/*`
- ✅ `https://*.tu-dominio.com/*`

---

## 🔐 Seguridad

**Mejores Prácticas:**

1. ✅ **Siempre usa restricciones de dominio** en producción
2. ✅ **Lista solo los dominios que realmente necesitas**
3. ✅ **No uses "None" en producción** (permite solicitudes desde cualquier dominio)
4. ✅ **Revisa periódicamente** las restricciones para asegurar que estén actualizadas

---

## 📞 Si el Problema Persiste

Si después de seguir estos pasos el error continúa:

1. Verifica que guardaste los cambios correctamente
2. Espera 5-10 minutos para la propagación
3. Limpia la caché del navegador (Ctrl+Shift+Delete)
4. Intenta en modo incógnito
5. Verifica que estás usando la API Key correcta en el código

---

## 🔗 Enlaces Útiles

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=mvp-staging-3e1cd)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/mvp-staging-3e1cd/authentication)
- [Documentación de Firebase Auth](https://firebase.google.com/docs/auth)





