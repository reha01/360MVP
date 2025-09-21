# Auditoría de Código Legacy para el MVP

## Índice
- [Introducción](#introducción)
- [Metodología de Auditoría](#metodología-de-auditoría)
- [FEAT-001: Gestión de Usuarios y Onboarding](#feat-001-gestión-de-usuarios-y-onboarding)
- [FEAT-002: Flujo de Evaluación Individual](#feat-002-flujo-de-evaluación-individual)
- [FEAT-003: Visualización de Informe y Upsell](#feat-003-visualización-de-informe-y-upsell)
- [FEAT-004: Monetización y Compra de Créditos](#feat-004-monetización-y-compra-de-créditos)
- [FEAT-005: Infraestructura Base](#feat-005-infraestructura-base)
- [FEAT-006: Base de Datos de Preguntas](#feat-006-base-de-datos-de-preguntas)
- [FEAT-007: Interfaz Responsiva y Experiencia de Usuario](#feat-007-interfaz-responsiva-y-experiencia-de-usuario)
- [FEAT-008: Seguridad y Protección de Datos](#feat-008-seguridad-y-protección-de-datos)
- [Tabla Resumen de Reutilización](#tabla-resumen-de-reutilización)
- [Recomendaciones Generales](#recomendaciones-generales)

## Introducción

Este documento presenta los resultados de la auditoría del código ubicado en la carpeta `legacy_src/` para evaluar qué componentes, funciones o estructuras pueden reutilizarse en el nuevo MVP según la documentación definida. El objetivo es determinar qué elementos pueden aprovecharse para acelerar el desarrollo, qué debe ser modificado y qué código debe descartarse completamente.

## Metodología de Auditoría

Para cada feature definida en el MVP (FEAT-001 a FEAT-008), se ha analizado:
1. **Código reutilizable**: Componentes y funciones que pueden utilizarse con pocos o ningún cambio
2. **Código a modificar**: Elementos que requieren adaptación para cumplir con los requerimientos del MVP
3. **Código a descartar**: Elementos que no son compatibles con la arquitectura o requisitos del nuevo sistema

La evaluación considera la compatibilidad con:
- Firebase Authentication y Firestore
- Funciones de Cloud Functions
- Estructura de SPA
- Seguridad y buenas prácticas

## FEAT-001: Gestión de Usuarios y Onboarding

### Código Reutilizable
- **Módulo de Autenticación**: El código en `main.js` para login con email/password y Google OAuth es reutilizable.
- **Gestión de Perfil**: La función `ensureUserProfile()` proporciona una buena base para la creación automática de perfiles.

```javascript
// Función reutilizable para crear perfiles de usuario
async function ensureUserProfile(user) {
    const userDocRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return docSnap.data(); 
    } else {
        try {
            const newUserProfile = {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                // Otros campos
            };
            await setDoc(userDocRef, newUserProfile);
            return newUserProfile;
        } catch (error) {
            console.error("Error creando el perfil de usuario:", error);
            return null;
        }
    }
}
```

### Código a Modificar
- **Estructura de Usuario**: El esquema de usuario en `ensureUserProfile()` debe actualizarse para incluir `creditosEvaluacion: 1` como crédito gratuito inicial.
- **Manejo de Sesión**: La función `handleAuthState()` debe adaptarse para redireccionar al dashboard después del registro.
- **Nombre de Colección**: Cambiar de "usuarios" a "users" según la especificación del MVP.

### Código a Descartar
- **Lógica de Roles**: La verificación de roles de superAdmin no forma parte del MVP y debería eliminarse.
- **Panel Admin**: No forma parte del alcance del MVP.

## FEAT-002: Flujo de Evaluación Individual

### Código Reutilizable
- **Estructura del Wizard**: El componente wizard en `wizard.js` es reutilizable con ajustes:

```javascript
// Estructura básica del wizard
export function initWizard(instrument) {
    // Referencias a elementos DOM
    // Reinicio de event listeners 
    // Inicialización de estado
    currentQuestionIndex = 0;
    userResponses = {};
    loadQuestion();
}

function loadQuestion() {
    // Carga de preguntas
    // Visualización de opciones
    updateNavigationButtons();
    updateProgressBar();
}
```

- **Guardado de Respuestas**: La función `saveEvaluation()` en `firestore-config.js` proporciona una buena base.

### Código a Modificar
- **Validación de Créditos**: Añadir verificación de créditos disponibles antes de iniciar.
- **Guardado Automático**: Implementar guardado automático con debounce (no presente en código legacy).
- **Navegación y Progreso**: La barra de progreso y la navegación entre preguntas deben refactorizarse para adaptarse al nuevo diseño.
- **Estructura de Datos**: Adaptar para utilizar la colección `evaluations` en lugar de `evaluaciones`.

### Código a Descartar
- **Carga de Instrumentos**: La carga desde `loadReportConfiguration()` debe reemplazarse por la carga directa desde `evaluationQuestions`.
- **Estructura de bloques**: El concepto de "bloques" debe sustituirse por "categorías" y "dimensiones" según el nuevo esquema.

## FEAT-003: Visualización de Informe y Upsell

### Código Reutilizable
- **Gráfico Radar**: La función `renderRadarChart()` en `utils.js` puede reutilizarse para mostrar el gráfico en el dashboard:

```javascript
export function renderRadarChart(blockScores, radarChartCanvas) {
    const labels = Object.values(blockScores).map(block => block.name);
    const data = Object.values(blockScores).map(block => {
        const percentage = block.max > 0 ? (block.score / block.max) : 0;
        return (percentage * 4) + 1;
    });
    
    const ctx = radarChartCanvas.getContext('2d');
    // Configuración del gráfico usando Chart.js
    // ...
}
```

### Código a Modificar
- **Dashboard**: El `renderNewDashboard()` en `dashboard.js` debe modificarse para:
  - Eliminar referencias a estilos específicos
  - Simplificar la presentación de resultados
  - Integrar CTA para compra del informe completo
- **Cálculo de Resultados**: La función `calculateAdvancedReportData()` debe simplificarse para ajustarse al nuevo modelo de datos.

### Código a Descartar
- **Generación de PDF Completo**: La lógica para generar PDF completos en `utils.js` debe reemplazarse por una versión más simple y alineada con el MVP.
- **Interpretación Compleja**: Las secciones sobre sinergia, sombras y horizontes son demasiado específicas y no aplican al MVP general.

## FEAT-004: Monetización y Compra de Créditos

### Código Reutilizable
- **Marcado de Informes**: La función `markReportAsPurchased()` puede adaptarse para la compra de informes:

```javascript
export async function markReportAsPurchased(db, evaluationId) {
    if (!db || !evaluationId) {
        console.error("Error: Faltan datos para actualizar la evaluación.");
        return false;
    }
    try {
        const evaluationRef = doc(db, "evaluaciones", evaluationId);
        await updateDoc(evaluationRef, {
            informeCompletoAdquirido: true
        });
        return true;
    } catch (error) {
        console.error("Error al marcar el informe como comprado:", error);
        return false;
    }
}
```

### Código a Modificar
- **Integración con Stripe**: No existe integración con Stripe en el código legacy, por lo que debe desarrollarse completamente.
- **Actualización de Créditos**: La estructura para actualizar créditos del usuario debe implementarse basada en la función `markReportAsPurchased()`.

### Código a Descartar
- **Todos los motores de PDF**: Los motores de PDF (`generatePdfReport` y `generatePdfWithPdfMake`) son demasiado complejos para el MVP y deben reemplazarse por una implementación más simple utilizando jsPDF.

## FEAT-005: Infraestructura Base

### Código Reutilizable
- **Configuración de Firebase**: El archivo `firebase-init.js` ofrece una estructura básica para inicializar los servicios:

```javascript
// firebase-init.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    // Configuración
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Código a Modificar
- **Configuración de Firebase**: Debe actualizarse con las nuevas credenciales y eliminar las hardcodeadas.
- **Estructura de Proyecto**: Adaptar para usar la nueva estructura de carpetas definida en el MVP.
- **Importaciones de Firebase**: Actualizar a la nueva sintaxis para trabajar con ESM en lugar de importaciones desde URL.

### Código a Descartar
- **Configuración Legacy**: Las importaciones por URL deben reemplazarse por importaciones de módulos estándar:
```javascript
// DESCARTAR:
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// REEMPLAZAR POR:
import { getAuth } from "firebase/auth";
```

## FEAT-006: Base de Datos de Preguntas

### Código Reutilizable
- **Estructura de Preguntas**: El formato JSON en `instrumento_prueba.json` puede servir como base para la estructura de preguntas:

```json
{
  "preguntas": [
    {
      "id": "lid_01",
      "bloqueId": "liderazgo",
      "textos": {
        "self": "¿Delegas tareas de forma efectiva a tu equipo?"
      }
    },
    // ...
  ]
}
```

- **Carga de Configuración**: La función `loadReportConfiguration()` ofrece un buen patrón para cargar y cachear datos de configuración.

### Código a Modificar
- **Estructura de Datos**: Adaptar para usar las nuevas colecciones `evaluationQuestions` con la estructura de categorías y dimensiones.
- **Cálculo de Resultados**: La lógica de `calculateAdvancedReportData()` debe simplificarse para ajustarse al nuevo modelo de datos del MVP.
- **Opciones de Preguntas**: Adaptación para soportar tipos Likert-5, Likert-7 y boolean.

### Código a Descartar
- **Lógica Específica del Modelo Antiguo**: Los cálculos para estilos, sinergia, sombra y semáforo son demasiado específicos para el contexto anterior y deben descartarse.

## FEAT-007: Interfaz Responsiva y Experiencia de Usuario

### Código Reutilizable
- **CSS Base**: El archivo `styles.css` puede servir como punto de partida para el diseño responsive.
- **Componentes de UI**: Los componentes para mensajes de error y estados de carga en el código legacy son reutilizables:
```javascript
// Ejemplo de mensaje de error
loginErrorMessage.textContent = error.message;
loginErrorMessage.classList.remove("hidden");

// Ejemplo de indicador de progreso
progressBar.style.width = `${progress}%`;
```

### Código a Modificar
- **Estructura CSS**: Reorganizar los estilos para seguir un enfoque mobile-first.
- **Feedback Visual**: Mejorar los estados de carga y error según la especificación del MVP.
- **Accesibilidad**: Agregar soporte para navegación por teclado y mejorar el contraste.

### Código a Descartar
- **Tipografías Específicas**: Las fuentes Lato y Montserrat cargadas directamente deberían reemplazarse por fuentes web estándar.
- **Estilos para PDF**: Los estilos específicos para PDF no son prioritarios para el MVP.

## FEAT-008: Seguridad y Protección de Datos

### Código Reutilizable
- **Manejo de Sesión**: El patrón de observador para cambios de autenticación:
```javascript
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Lógica de usuario autenticado
    } else {
        // Lógica de usuario no autenticado
    }
});
```

- **Validaciones Básicas**: Las validaciones en formularios como la verificación de coincidencia de contraseñas en el registro.

### Código a Modificar
- **Autenticación**: Actualizar para manejar de forma más segura la persistencia de sesión.
- **Variables de Entorno**: Implementar uso de variables de entorno para configuración de Firebase y Stripe.
- **Validaciones**: Reforzar validaciones en formularios y entradas.

### Código a Descartar
- **Claves API en Código**: Eliminar las claves hardcodeadas en `firebase-init.js`:
```javascript
// DESCARTAR:
const firebaseConfig = {
    apiKey: "AIzaSyDHqhG7KTrSnMH13GgLbMtDqVyYtouKIFE",
    // Otros valores de configuración...
};
```

- **Lógica de Autorización Básica**: La verificación de roles debe reemplazarse por reglas de seguridad de Firestore más robustas.

## Tabla Resumen de Reutilización

| ID        | Feature                                  | Reutilizable | Requiere Cambios | No Útil |
|-----------|------------------------------------------|:------------:|:----------------:|:-------:|
| FEAT-001  | Gestión de Usuarios y Onboarding        | ✅           | 🛠️              | ❌      |
| FEAT-002  | Flujo de Evaluación Individual          | ✅           | 🛠️              | ❌      |
| FEAT-003  | Visualización de Informe y Upsell       | ✅           | 🛠️              | ❌      |
| FEAT-004  | Monetización y Compra de Créditos       | ❌           | 🛠️              | ✅      |
| FEAT-005  | Infraestructura Base                    | ✅           | 🛠️              | ❌      |
| FEAT-006  | Base de Datos de Preguntas             | ✅           | 🛠️              | ❌      |
| FEAT-007  | Interfaz Responsiva y Experiencia de Usuario | ❌      | 🛠️              | ❌      |
| FEAT-008  | Seguridad y Protección de Datos         | ❌           | 🛠️              | ✅      |

## Recomendaciones Generales

1. **Enfoque de Migración Gradual**:
   - Comenzar por implementar la infraestructura base (FEAT-005)
   - Reutilizar el código de autenticación (FEAT-001)
   - Adaptar la estructura del wizard (FEAT-002)
   - Reimplementar por completo la integración con Stripe (FEAT-004)

2. **Prioridades de Refactorización**:
   - Eliminar todas las credenciales hardcodeadas
   - Migrar de importaciones URL a importaciones de módulos estándar
   - Reescribir la lógica de cálculo de resultados para que sea más genérica
   - Implementar la estructura de componentes React según el diseño del MVP

3. **Consideraciones de Seguridad**:
   - Implementar variables de entorno para todas las credenciales
   - Diseñar reglas de seguridad de Firestore más restrictivas
   - Validar todas las entradas de usuario tanto en cliente como en servidor
   - Asegurar que las operaciones críticas (como el descuento de créditos) se realicen en transacciones atómicas

4. **Plan de Implementación**:
   - Fase 1: Estructura base y autenticación
   - Fase 2: Wizard de evaluación y base de datos de preguntas
   - Fase 3: Dashboard y visualización de informes
   - Fase 4: Integración de pagos con Stripe
   - Fase 5: Optimización de UX y pruebas de seguridad
