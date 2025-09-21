# Documentación Backend (Cloud Functions & Firestore)

## Estado actual tras consolidación

Última actualización: 2025-09-21 (commit 2221c65)

- Emuladores activos utilizados en desarrollo:
  - Auth Emulator: http://127.0.0.1:9099
  - Firestore Emulator: http://127.0.0.1:8080
  - Emulator UI: http://127.0.0.1:4000
- Scripts npm:
  - `npm run emulators` (auth, firestore, ui)
  - `npm run emulators:dev` (emuladores + frontend)
- Variables `.env` (frontend) con fallbacks: ver README; `VITE_USE_EMULATORS` habilita conexión a emuladores.

## Objetivo
Definir la estructura de Cloud Functions, reglas de Firestore, transacciones, webhooks y configuración para cubrir las features FEAT-001 a FEAT-006, FEAT-008 y FEAT-009.

## Estructura del Repositorio Backend
```
/360MVP-functions/
├── functions/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── onUserCreate.js      # Trigger para crear perfil de usuario
│   │   │   └── getUserProfile.js    # Endpoint para obtener perfil
│   │   ├── evaluation/
│   │   │   ├── getQuestions.js      # Endpoint para obtener preguntas
│   │   │   ├── saveProgress.js      # Endpoint para guardar progreso
│   │   │   ├── submitAnswers.js     # Endpoint para enviar respuestas
│   │   │   └── calculateResults.js  # Lógica para calcular resultados básicos
│   │   ├── reports/
│   │   │   ├── generateSummary.js   # Endpoint para generar resumen
│   │   │   ├── generateFullReport.js # Endpoint para preparar datos del PDF
│   │   │   └── calculateAdvancedInsights.js # (STUB) Lógica para Sinergia/Sombra
│   │   ├── payments/
│   │   │   ├── createCheckoutSession.js # Endpoint para crear sesión de Stripe
│   │   │   ├── handleWebhook.js     # Webhook para eventos de Stripe
│   │   │   └── updateCredits.js     # Lógica para actualizar créditos
│   │   ├── admin/
│   │   │   └── setCustomClaim.js    # Endpoint para asignar rol de admin
│   │   ├── utils/
│   │   │   ├── firestore.js         # Helpers de Firestore
│   │   │   ├── validators.js        # Validadores de datos
│   │   │   └── logger.js            # Sistema de logging estructurado
│   │   ├── config/
│   │   │   ├── serviceAccountKey.json # (Ignorado por .gitignore)
│   │   │   └── constants.js         # Constantes de la aplicación
│   │   └── index.js                 # Punto de entrada de las Cloud Functions
│   ├── .firebaserc
│   ├── firebase.json
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── package.json
```

## Endpoints y Triggers

| Dominio      | Función/Endpoint                | Propósito                                                               | Entradas/Salidas esperadas                       |
|--------------|---------------------------------|-------------------------------------------------------------------------|--------------------------------------------------|
| **auth**     | `onUserCreate` (Trigger)        | Crea un perfil en Firestore con 1 crédito al registrarse un nuevo usuario.| `auth.UserRecord` -> `firestore.Document`        |
|              | `getUserProfile`                | Obtiene el perfil de usuario autenticado.                               | Autenticado -> `UserProfile`                     |
| **evaluation**| `getQuestions`                  | Obtiene el banco de preguntas para la evaluación.                       | - -> `EvaluationQuestions[]`                     |
|              | `saveProgress`                  | Guarda el progreso parcial de una evaluación.                           | `{ evaluationId, answers }` -> `{ success: true }` |
|              | `submitAnswers`                 | Envía las respuestas finales y dispara el cálculo de resultados.        | `{ answers }` -> `{ evaluationId }`              |
|              | `calculateResults`              | Calcula los resultados básicos de la evaluación.                        | Interno -> Actualiza `evaluations`               |
| **reports**  | `generateSummary`               | Prepara los datos para el resumen del dashboard.                        | `{ evaluationId }` -> `ReportSummary`            |
|              | `generateFullReport`            | Prepara todos los datos necesarios para el informe PDF completo.        | `{ evaluationId }` -> `FullReportData`           |
|              | `calculateAdvancedInsights`     | **(STUB)** Calcula Sinergia y Sombras si `enableAdvancedInsights` es true.| `{ evaluationId }` -> Actualiza `evaluations`    |
| **payments** | `createCheckoutSession`         | Crea una sesión de pago en Stripe.                                      | `{ productId, quantity }` -> `{ sessionId }`     |
|              | `handleWebhook`                 | Escucha eventos de Stripe (p.ej., `checkout.session.completed`).        | `Stripe.Event` -> Actualiza créditos             |
|              | `updateCredits`                 | Actualiza los créditos del usuario (transaccional).                     | Interno -> Actualiza `users`                     |
| **admin**    | `setCustomClaim`                | Asigna un rol a un usuario (solo para super-admins).                    | `{ uid, role: "admin" }` -> `{ success: true }`  |

## Seguridad y Datos

### Custom Claims y Roles
Firebase Auth Custom Claims se utilizarán para gestionar roles.
- **Roles definidos**: `admin`, `user` (por defecto).
- **Asignación**: Un super-admin (configurado manualmente en Firebase Console) podrá asignar el rol `admin` a otros usuarios a través de la función `admin/setCustomClaim`. Esta función verificará que el invocador sea super-admin antes de ejecutarse.

### Reglas de Firestore
Las reglas de seguridad (`firestore.rules`) serán la principal línea de defensa.
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, update, delete: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
    }
    
    // Las evaluaciones solo pueden ser leídas/escritas por su propietario
    match /evaluations/{evaluationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }

    // Las preguntas solo pueden ser leídas por usuarios autenticados
    // La escritura está restringida a administradores
    match /evaluationQuestions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == "admin";
    }

    // Los créditos de un usuario solo pueden ser modificados por Cloud Functions
    // (Regla implícita: sin 'allow update' directo, solo el backend puede cambiarlo)
  }
}
```

### Transacciones
Se usarán transacciones atómicas de Firestore para operaciones críticas:
- **Descuento de créditos**: Al finalizar una evaluación (`submitAnswers`).
- **Añadir créditos**: Tras una compra exitosa (`handleWebhook` -> `updateCredits`).

## Webhooks y Configuración

- **Flujo de Stripe**: `createCheckoutSession` (cliente/backend) -> `Stripe Checkout` (UI externa) -> `handleWebhook` (backend) -> `updateCredits` (backend).
- **Variables de Entorno**: Todas las claves secretas (Stripe, Firebase Service Account) se gestionarán mediante variables de entorno de Cloud Functions, nunca hardcodeadas. Un archivo `.env.example` definirá las variables requeridas.
- **Feature Flags**: Funcionalidades como los Insights Avanzados se controlarán con variables de entorno (`ENABLE_ADVANCED_INSIGHTS=true/false`).

## Dependencias y Aclaraciones
- **pdfMake**: Es una dependencia del **frontend**. El backend **no genera PDFs**. Su responsabilidad es únicamente proveer los datos necesarios (`generateFullReport`) que el cliente utilizará para construir el documento. Esta encapsulación permite cambiar el motor de PDF en el futuro sin afectar al backend.

## Trazabilidad (FEAT-xxx)

| Función/Endpoint          | FEAT-001 | FEAT-002 | FEAT-003 | FEAT-004 | FEAT-005 | FEAT-006 | FEAT-008 | FEAT-009 |
|---------------------------|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| `onUserCreate`            |    ✅    |          |          |          |    ✅    |          |    ✅    |          |
| `getQuestions`            |          |    ✅    |          |          |          |    ✅    |          |          |
| `submitAnswers`           |          |    ✅    |          |          |          |          |    ✅    |          |
| `generateSummary`         |          |          |    ✅    |          |          |          |          |          |
| `calculateAdvancedInsights`|         |          |          |          |          |          |          |    ✅    |
| `createCheckoutSession`   |          |          |          |    ✅    |          |          |    ✅    |          |
| `handleWebhook`           |          |          |          |    ✅    |          |          |    ✅    |          |
| `setCustomClaim`          |          |          |          |          |          |          |    ✅    |          |
| Reglas de Firestore       |    ✅    |    ✅    |    ✅    |    ✅    |    ✅    |    ✅    |    ✅    |          |

## Definition of Done (DoD)
- ✅ Todas las funciones están registradas en `index.js` y se despliegan correctamente.
- ✅ Las reglas de Firestore pasan las pruebas de simulación para los roles `user` y `admin`.
- ✅ El webhook de Stripe se prueba en modo test y los créditos se actualizan correctamente tras una transacción.
- ✅ No se han añadido dependencias nuevas fuera de las aprobadas en `package.json`.
- ✅ El emulador de Firebase funciona correctamente con la configuración local.
