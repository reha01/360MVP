# 🎯 Plan de Ejecución: Smoke Tests Staging

**Estado Actual**: ✅ Usuario creado con UID `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`

---

## 📋 Checklist de Pre-Ejecución

### ✅ Completado
- [x] Usuario creado en Firebase Auth: `admin@pilot-santiago.com`
- [x] UID obtenido: `S1SE2ynl3dQ9ohjMz5hj5h2sJx02`
- [x] Scripts de setup generados
- [x] Configuración de Playwright actualizada

### 🔄 Pendiente (TÚ)
- [ ] Copiar datos a Firestore (ver `FIRESTORE_SETUP_QUICK.md`)
  - [ ] Organización con feature flags
  - [ ] Miembro vinculado con rol admin
  - [ ] Test definition
  - [ ] Campaña activa
  - [ ] 3 sesiones 360
  - [ ] 12 asignaciones (incluye 1 email inválido)

### ⚡ Listo para ejecutar (YO)
- [ ] Ejecutar smoke tests
- [ ] Capturar resultados
- [ ] Generar reporte

---

## 🚀 Comandos de Ejecución

### Cuando termines el setup de Firestore:

```bash
# Opción 1: Ejecución completa (recomendada)
npm run smoke:staging

# Opción 2: Con auth manual
npx playwright test tests/auth/auth.setup.ts --project=chromium
npx playwright test tests/smoke/fase2-smoke.test.ts --project=chromium --grep @smoke
```

---

## 📊 Resultados Esperados

### Tests (9 total)
1. ✅ Rutas 200 OK (`/dashboard-360`, `/bulk-actions`, `/alerts`)
2. ⏭️ Feature flag OFF (skipped - usuario no piloto no existe)
3. ✅ Feature flag ON (org piloto accede)
4. ✅ Performance p95 (<2s en 2/3 cargas)
5. ✅ Reenviar invitaciones (progreso 0→100%)
6. ℹ️ Idempotencia (estructura OK, lógica comentada en dev)
7. ℹ️ Rate limits (verificación básica)
8. ✅ DLQ visible (página accesible)
9. ✅ Auditoría (sección visible)

### Criterio GO
- **Mínimo**: 6/9 tests PASS
- **Ideal**: 7-8/9 tests PASS
- **Críticos**: Tests 1, 3, 4, 5 DEBEN pasar

---

## 📸 Evidencias Generadas

Después de la ejecución:

```
test-results/
  smoke-fase2-smoke-*/
    test-*.png        # Screenshots en fallos
    video.webm        # Video de la ejecución

playwright-report/
  index.html          # Reporte interactivo
```

Abrir reporte:
```bash
npx playwright show-report
```

---

## 🐛 Si algo falla

### Auth timeout
```bash
# Verificar que el usuario existe y está vinculado
# Re-ejecutar solo el setup
npx playwright test tests/auth/auth.setup.ts --project=chromium
```

### No se ven datos
```bash
# Verificar en Firestore Console:
# - orgs/pilot-org-santiago/campaigns/
# - orgs/pilot-org-santiago/evaluatorAssignments/
```

### Feature flags no funcionan
```bash
# Verificar en Firestore:
# orgs/pilot-org-santiago → campo featureFlags
```

---

## 📝 Próximos Pasos

1. **TÚ**: Copiar datos a Firestore (15-20 min) usando `FIRESTORE_SETUP_QUICK.md`
2. **TÚ**: Verificar checklist en Firestore Console
3. **TÚ**: Avisar cuando esté listo
4. **YO**: Ejecutar `npm run smoke:staging`
5. **YO**: Capturar y reportar resultados

---

**¿Listo para comenzar?** 👉 Abre `FIRESTORE_SETUP_QUICK.md` y comienza a copiar datos.

**Tiempo estimado total**: ~25 minutos (15 min Firestore + 10 min tests)




