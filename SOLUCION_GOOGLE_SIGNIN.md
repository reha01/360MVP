# 🔧 Solución Rápida: Error 403 Google Sign-In

## Problema
Error `API_KEY_HTTP_REFERRER_BLOCKED` al iniciar sesión con Google.

## Solución (5 minutos)

### 1. Ve a Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials?project=mvp-staging-3e1cd

### 2. Busca la API Key
🔑 `AIzaSyCozdMcZGpS-W7f1y5N02Vh089Qbm3giSQ`

### 3. Haz clic para editarla

### 4. En "Application restrictions"
- Selecciona **"HTTP referrers (web sites)"**

### 5. En "Website restrictions"
Agrega estos dominios (uno por línea):

```
https://mvp-staging-3e1cd.web.app/*
https://mvp-staging-3e1cd.firebaseapp.com/*
https://*.mvp-staging-3e1cd.web.app/*
https://*.mvp-staging-3e1cd.firebaseapp.com/*
```

### 6. Guarda y espera 2-5 minutos

### 7. Prueba de nuevo
✅ El login con Google debería funcionar ahora.

---

**Nota:** Si necesitas una solución rápida temporal, puedes cambiar "Application restrictions" a "None", pero **recuerda volver a agregar las restricciones después**.





