# 📊 Reporte Completo: Error React #130 en Campaign Wizard

## 🔍 PROBLEMA IDENTIFICADO

### Error
**React Error #130**: "Cannot update a component while rendering a different component"

### Ubicación
- **Componente**: `EvaluateeSelectionStep` (Paso 2 del Campaign Wizard)
- **Momento**: Durante el render inicial del paso 2
- **Síntoma**: Pantalla en blanco con error capturado por `WizardErrorBoundary`

### Causa Raíz (Hipótesis)
El error ocurre porque hay una **cadena de actualizaciones de estado durante el render**:

1. `EvaluateeSelectionStep` se monta y inicializa `filters` desde `data.evaluateeFilters`
2. El `useEffect` detecta un cambio (porque `prevFiltersRef.current` está vacío inicialmente)
3. Llama a `onChange({ evaluateeFilters: filters })`
4. Esto actualiza `campaignData` en `CampaignWizard` (padre)
5. El cambio en `campaignData.evaluateeFilters` dispara el `useEffect` de `updateFilteredUsers`
6. `updateFilteredUsers` llama a `setFilteredUsers()` **durante el render del paso 2**
7. React detecta la actualización de estado durante el render → **Error #130**

---

## 🛠️ SOLUCIONES INTENTADAS

### Intento 1: setTimeout básico
**Qué hice:**
- Agregué `setTimeout(..., 0)` en `handleNext` y `handlePrevious`
- Agregué `setTimeout` en los `useEffect` de los pasos

**Por qué no funcionó:**
- `setTimeout(0)` no es suficiente para evitar actualizaciones durante el render
- Los efectos aún se ejecutaban demasiado pronto

---

### Intento 2: requestAnimationFrame + setTimeout
**Qué hice:**
- Combiné `requestAnimationFrame` + `setTimeout(50ms)` en los efectos
- Agregué flags `isMounted` para cleanup

**Por qué no funcionó:**
- Aunque difería las actualizaciones, aún ocurrían durante el ciclo de render
- El problema es que el efecto se ejecuta inmediatamente después del mount

---

### Intento 3: Flags de mount inicial
**Qué hice:**
- Agregué `isInitialMountRef` con delay de 200ms
- Prevení que los efectos se ejecuten durante el mount inicial

**Por qué no funcionó:**
- 200ms no es suficiente para asegurar que el render terminó completamente
- El problema persiste porque el efecto aún se ejecuta cuando el componente está renderizando

---

### Intento 4: React.memo + delays más largos
**Qué hice:**
- Envolví todos los pasos con `React.memo`
- Aumenté los delays a 800ms y 1000ms
- Agregué múltiples flags de protección (`hasMountedRef`, `isInitialMountRef`)

**Por qué no funcionó:**
- Aunque los delays son largos, el problema fundamental persiste:
  - El `useEffect` se ejecuta cuando `filters` cambia
  - Durante el mount inicial, `filters` se inicializa y esto dispara el efecto
  - Aunque diferimos la ejecución, React aún detecta la actualización

---

### Intento 5: useMemo para inicialización + flags dobles
**Qué hice:**
- Usé `useMemo` para calcular `initialFilters` una sola vez
- Inicialicé `prevFiltersRef` con el valor inicial
- Agregué doble flag (`step2MountRef` + `step2ReadyRef`) en `CampaignWizard`
- Múltiples deferencias (Promise → RAF → RAF → setTimeout)

**Por qué no funcionó:**
- Aunque `prevFiltersRef` está inicializado, el problema es más profundo:
  - El `useEffect` aún se ejecuta cuando `filters` cambia
  - Durante el mount, React ejecuta los efectos después del primer render
  - Aunque diferimos la actualización, React detecta que hay una actualización pendiente

---

## 🎯 ANÁLISIS DEL PROBLEMA REAL

### El Problema Fundamental
El error React #130 ocurre cuando:
- Un componente está renderizando
- Otro componente (o el mismo) intenta actualizar el estado
- Esto causa una inconsistencia en el árbol de componentes

### Por Qué Mis Soluciones No Funcionaron
1. **Los delays no resuelven el problema fundamental**: Aunque diferimos las actualizaciones, React aún las detecta como "durante el render"
2. **Los flags no previenen la ejecución del efecto**: El `useEffect` se ejecuta cuando sus dependencias cambian, independientemente de los flags
3. **El problema está en la arquitectura**: La comunicación entre `EvaluateeSelectionStep` y `CampaignWizard` causa actualizaciones durante el render

---

## 💡 SOLUCIÓN PROPUESTA (Nueva Estrategia)

### Opción 1: Lazy Loading del Paso 2
**Enfoque**: No renderizar `EvaluateeSelectionStep` hasta que esté completamente listo

```javascript
// En CampaignWizard.jsx
const [step2Ready, setStep2Ready] = useState(false);

useEffect(() => {
  if (currentStep === 2 && !step2Ready) {
    // Esperar múltiples ciclos de render antes de mostrar el paso 2
    const timer = setTimeout(() => {
      setStep2Ready(true);
    }, 1000);
    return () => clearTimeout(timer);
  } else if (currentStep !== 2) {
    setStep2Ready(false);
  }
}, [currentStep]);

// En renderCurrentStep:
case 2:
  if (!step2Ready) {
    return <div>Cargando paso 2...</div>;
  }
  return <EvaluateeSelectionStep ... />;
```

**Ventajas:**
- Evita completamente el render del paso 2 hasta que esté listo
- No hay efectos ejecutándose durante el render inicial

**Desventajas:**
- Hay un delay visible para el usuario
- No resuelve el problema si el usuario cambia de paso rápidamente

---

### Opción 2: Estado Controlado Completamente por el Padre
**Enfoque**: El padre controla todo el estado, los pasos son componentes "dumb"

```javascript
// En CampaignWizard.jsx
const [step2Filters, setStep2Filters] = useState({
  jobFamilyIds: [],
  areaIds: [],
  userIds: []
});

// EvaluateeSelectionStep solo recibe props y llama callbacks
const EvaluateeSelectionStep = ({ filters, onFilterChange, ... }) => {
  // NO tiene estado interno, solo usa props
  const handleChange = (type, value, checked) => {
    onFilterChange(type, value, checked); // Callback directo, sin useEffect
  };
  
  return (/* JSX */);
};
```

**Ventajas:**
- Elimina completamente los efectos que causan el problema
- El padre controla cuándo actualizar el estado
- Más predecible y fácil de debuggear

**Desventajas:**
- Requiere refactorizar `EvaluateeSelectionStep` completamente
- Más código en el componente padre

---

### Opción 3: Suspense + Error Boundary Mejorado
**Enfoque**: Usar React Suspense para manejar el estado de carga

```javascript
// En CampaignWizard.jsx
import { Suspense } from 'react';

case 2:
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorBoundary>
        <EvaluateeSelectionStep ... />
      </ErrorBoundary>
    </Suspense>
  );
```

**Ventajas:**
- React maneja el estado de carga automáticamente
- El Error Boundary captura errores de forma más elegante

**Desventajas:**
- Requiere que `EvaluateeSelectionStep` use recursos suspendidos
- Puede no resolver el problema fundamental

---

### Opción 4: Deshabilitar Completamente los Efectos Durante el Mount
**Enfoque**: No ejecutar NINGÚN efecto hasta que el componente esté completamente montado y renderizado

```javascript
// En EvaluateeSelectionStep.jsx
const hasRenderedRef = useRef(false);

useEffect(() => {
  // Marcar que el componente ha renderizado completamente
  hasRenderedRef.current = true;
  
  // Esperar múltiples ciclos antes de permitir efectos
  const timer = setTimeout(() => {
    // Ahora sí permitir efectos
  }, 2000); // Delay muy largo
  
  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  // NO hacer NADA si no ha renderizado completamente
  if (!hasRenderedRef.current) {
    return;
  }
  
  // ... resto del código
}, [filters]);
```

**Ventajas:**
- Previene completamente los efectos durante el mount
- Simple de implementar

**Desventajas:**
- Delay visible para el usuario
- Puede causar problemas si el usuario interactúa rápidamente

---

## 🎯 RECOMENDACIÓN FINAL

### Solución Recomendada: **Opción 2 (Estado Controlado por el Padre)**

**Razones:**
1. **Elimina el problema en la raíz**: No hay efectos que causen actualizaciones durante el render
2. **Más predecible**: El padre controla cuándo y cómo se actualiza el estado
3. **Mejor arquitectura**: Sigue el patrón de React de "lifting state up"
4. **Más fácil de debuggear**: Todo el estado está en un solo lugar

### Implementación Propuesta:

1. **Mover el estado de `filters` al padre** (`CampaignWizard`)
2. **Convertir `EvaluateeSelectionStep` en un componente controlado**
3. **Eliminar todos los `useEffect` que llaman a `onChange`**
4. **Usar callbacks directos** para actualizar el estado del padre

---

## 📝 PRÓXIMOS PASOS

1. **Implementar Opción 2** (Estado Controlado por el Padre)
2. **Probar exhaustivamente** el flujo completo del wizard
3. **Si persiste el error**, considerar Opción 1 (Lazy Loading)
4. **Como último recurso**, Opción 4 (Deshabilitar efectos completamente)

---

## 🔧 ARCHIVOS A MODIFICAR

1. `src/components/campaign/CampaignWizard.jsx`
   - Mover estado de `filters` aquí
   - Controlar completamente el estado del paso 2

2. `src/components/campaign/EvaluateeSelectionStep.jsx`
   - Eliminar estado interno de `filters`
   - Eliminar todos los `useEffect` que llaman a `onChange`
   - Convertir en componente controlado

3. `src/components/campaign/CampaignInfoStep.jsx` (para consistencia)
   - Considerar el mismo patrón si tiene problemas similares

---

## 📊 CONCLUSIÓN

El problema es **arquitectural**: la comunicación entre componentes hijos y padre mediante `useEffect` causa actualizaciones durante el render. La solución definitiva es **controlar el estado completamente desde el padre** y eliminar los efectos que causan el problema.




