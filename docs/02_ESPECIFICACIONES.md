# Sistema de Archivos

## Estructura del Repositorio Frontend (SPA)

```
/360MVP-frontend/
├── public/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   ├── profile-placeholder.png
│   │   │   └── report-thumbnail.png
│   │   ├── icons/
│   │   └── fonts/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── core/
│   │   │   ├── Button.js
│   │   │   ├── Modal.js
│   │   │   ├── Notification.js
│   │   │   ├── ProgressIndicator.js
│   │   │   └── FormElements/
│   │   ├── auth/
│   │   │   ├── LoginForm.js
│   │   │   ├── RegisterForm.js
│   │   │   ├── ResetPasswordForm.js
│   │   │   └── SocialLoginButton.js
│   │   ├── dashboard/
│   │   │   ├── Dashboard.js
│   │   │   ├── ReportSummary.js
│   │   │   ├── RadarChart.js
│   │   │   └── UpgradePrompt.js
│   │   ├── evaluation/
│   │   │   ├── EvaluationWizard.js
│   │   │   ├── Question.js
│   │   │   ├── QuestionNavigator.js
│   │   │   └── ProgressBar.js
│   │   └── payment/
│   │       ├── CreditOptions.js
│   │       ├── CheckoutForm.js
│   │       └── PaymentSuccess.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── EvaluationContext.js
│   │   └── UIContext.js
│   ├── hooks/
│   │   ├── useFirestore.js
│   │   ├── useAuth.js
│   │   └── usePayment.js
│   ├── services/
│   │   ├── api.js
│   │   ├── firebase.js
│   │   ├── stripe.js
│   │   └── report-generator.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── Evaluation.js
│   │   ├── ReportView.js
│   │   └── Credits.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── analytics.js
│   │   └── pdf-templates.js
│   ├── constants/
│   │   ├── routes.js
│   │   ├── questionBank.js
│   │   └── reportTexts.js
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── App.js
│   ├── index.js
│   └── router.js
├── .firebaserc
├── firebase.json
├── package.json
└── README.md
```

## Estructura del Repositorio Backend (Cloud Functions)

```
/360MVP-functions/
├── functions/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── onCreate.js
│   │   │   └── onDelete.js
│   │   ├── evaluation/
│   │   │   ├── submitAnswers.js
│   │   │   ├── getQuestions.js
│   │   │   └── calculateResults.js
│   │   ├── reports/
│   │   │   ├── generateSummary.js
│   │   │   └── generateFullReport.js
│   │   ├── payments/
│   │   │   ├── createCheckoutSession.js
│   │   │   ├── handleWebhook.js
│   │   │   └── updateCredits.js
│   │   ├── utils/
│   │   │   ├── firestore.js
│   │   │   ├── validators.js
│   │   │   └── logger.js
│   │   ├── config/
│   │   │   ├── serviceAccountKey.json
│   │   │   └── constants.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

# Especificaciones de Funcionalidades

## Funcionalidad 1: Gestión de Usuarios y Onboarding

### Objetivo de la funcionalidad
Establecer un sistema robusto para el registro, autenticación y configuración inicial de usuarios, asegurando que cada nuevo usuario reciba su crédito de evaluación gratuito y sea dirigido a un dashboard personalizado que muestre claramente su estado actual.

### Relaciones con APIs
- **Firebase Authentication**: Para gestión de identidades, registro, inicio de sesión y restablecimiento de contraseñas
- **Cloud Functions - onUserCreate**: Función trigger que se ejecuta automáticamente cuando se crea un nuevo usuario
- **Firestore**: Para almacenar datos de perfil de usuario y el contador de créditos

### Requisitos detallados de la funcionalidad
1. Sistema de autenticación completo con registro por email/contraseña
2. Integración con proveedores OAuth (Google)
3. Validación de datos de registro en tiempo real
4. Creación automática de perfil en Firestore al registrarse
5. Asignación inicial de 1 crédito de evaluación gratuito
6. Restablecimiento de contraseña mediante email
7. Pantalla de bienvenida personalizada después del primer inicio de sesión
8. Dashboard inicial que muestra claramente el estado de la evaluación
9. Mensaje de confirmación después de completar el registro
10. Validación de correo electrónico mediante email de verificación (opcional para MVP)
11. Persistencia de sesión entre refrescos de página
12. Gestión de cierre de sesión y eliminación de datos locales

### Guía detallada de implementación

#### Visión General de la Arquitectura del Sistema
La funcionalidad de Gestión de Usuarios se implementa a través de tres capas principales:
1. **Capa Frontend (SPA)**: Componentes de autenticación (formularios de registro, inicio de sesión) y dashboard que consumen los servicios de Firebase Auth y Firestore.
2. **Capa de Servicios**: Firebase Authentication gestiona identidades y sesiones. 
3. **Capa Backend (Cloud Functions)**: Un trigger onUserCreate se ejecuta automáticamente cuando se registra un usuario nuevo, creando el perfil en Firestore con su crédito inicial.

El flujo de datos entre estas capas es:
- El usuario interactúa con el formulario frontend → Firebase Auth crea la cuenta → El trigger de Cloud Functions se dispara → Se crea el perfil en Firestore → Se redirige al usuario a su dashboard.

#### Diseño del Esquema de Base de Datos
Colección `users` en Firestore:

```
/users/{userId}/ {
  uid: string, // Igual al UID de Firebase Auth
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: timestamp,
  lastLoginAt: timestamp,
  isEmailVerified: boolean,
  creditosEvaluacion: number, // Inicia con valor 1
  evaluacionesCompletadas: array<string>, // Array vacío inicialmente
  evaluacionActual: {
    id: string | null,
    estado: 'no_iniciada' | 'en_progreso' | 'completada',
    fechaInicio: timestamp | null,
    ultimaActividad: timestamp | null,
    progresoActual: number // 0-100%
  },
  informesComprados: array<string>, // Array vacío inicialmente
  metadata: {
    registrationMethod: 'email' | 'google',
    userAgent: string,
    ipCountry: string
  }
}
```

**Reglas de seguridad para esta colección:**
```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId &&
                 (!request.resource.data.diff(resource.data).affectedKeys()
                   .hasAny(['creditosEvaluacion', 'evaluacionesCompletadas', 'informesComprados']));
  // Solo Cloud Functions puede actualizar campos críticos como créditos
}
```

#### Diseño Exhaustivo de la API
**Cloud Function: `onUserCreate`**
- **Tipo**: Trigger Auth (no expuesta como HTTP endpoint)
- **Activación**: Cuando un nuevo usuario se registra en Firebase Auth
- **Entradas**: 
  - Objeto `user` de Firebase Auth con propiedades como `uid`, `email`, etc.
- **Proceso**:
  1. Crear documento de usuario en colección `users`
  2. Asignar 1 crédito inicial
  3. Configurar estado inicial de evaluación
- **Respuesta**: No aplicable (es un trigger)
- **Ejemplo**:
```javascript
exports.onUserCreate = functions.auth.user().onCreate((user) => {
  // Implementación
});
```

**Endpoint: `getUserProfile`**
- **Tipo**: HTTP Callable
- **Método**: GET
- **Entradas**: 
  - Token de autenticación (implícito en el contexto de la función)
- **Proceso**:
  1. Verificar autenticación
  2. Buscar perfil de usuario por UID
- **Respuesta**: 
  - Status 200: Objeto con datos del perfil 
  - Status 404: Usuario no encontrado
  - Status 403: No autorizado
- **Ejemplo de respuesta exitosa**:
```json
{
  "uid": "abc123",
  "email": "usuario@ejemplo.com",
  "displayName": "Usuario Ejemplo",
  "creditosEvaluacion": 1,
  "evaluacionActual": {
    "estado": "no_iniciada",
    "progresoActual": 0
  }
}
```

#### Arquitectura del Frontend
La arquitectura frontend para esta funcionalidad consta de:

1. **Componentes**:
   - `LoginForm.js`: Formulario de inicio de sesión
   - `RegisterForm.js`: Formulario de registro
   - `ResetPasswordForm.js`: Formulario para restablecer contraseña
   - `SocialLoginButton.js`: Botón para autenticación con Google
   - `Dashboard.js`: Panel principal que muestra el estado de la evaluación

2. **Contexto**:
   - `AuthContext.js`: Proveedor de contexto para gestionar estado de autenticación y usuario
   ```javascript
   // Estructura simplificada
   const AuthContext = createContext();
   const AuthProvider = ({ children }) => {
     const [currentUser, setCurrentUser] = useState(null);
     const [loading, setLoading] = useState(true);
     // Métodos: login, register, logout, etc.
     return <AuthContext.Provider value={{currentUser, loading, login, register, logout}}>{children}</AuthContext.Provider>;
   };
   ```

3. **Rutas**:
   - `/`: Home público
   - `/login`: Pantalla de inicio de sesión
   - `/register`: Pantalla de registro
   - `/reset-password`: Pantalla para restablecer contraseña
   - `/dashboard`: Panel de control (protegido)

4. **Hooks personalizados**:
   - `useAuth.js`: Para acceder fácilmente al contexto de autenticación
   - `useFirestore.js`: Para operaciones CRUD con el perfil de usuario

#### Operaciones CRUD Detalladas
1. **Crear (C)**:
   - **Registro de Usuario**:
     1. Frontend: `RegisterForm.js` captura datos y llama a `firebase.auth().createUserWithEmailAndPassword()`
     2. Backend: Cloud Function `onUserCreate` se activa y crea documento en `/users/{uid}`
   
2. **Leer (R)**:
   - **Obtener Perfil**:
     1. Frontend: `Dashboard.js` al cargar llama a `useFirestore.getDocument('users', currentUser.uid)`
     2. Backend: Se ejecuta query a Firestore con las reglas de seguridad aplicadas

3. **Actualizar (U)**:
   - **Actualizar DisplayName**:
     1. Frontend: Formulario de perfil llama a `useAuth.updateProfile({displayName: newName})`
     2. Backend: Se actualiza Firebase Auth y luego se refleja en Firestore
   - **Actualizar Imagen de Perfil**:
     1. Proceso similar al anterior pero para photoURL

4. **Eliminar (D)**:
   - **No implementado en MVP**: Para fase posterior, con consideraciones de retención de datos

#### Flujo de Experiencia de Usuario
1. **Registro**:
   - Usuario llega a la página principal
   - Hace clic en "Registrarse"
   - Completa formulario o elige "Continuar con Google"
   - Sistema valida datos en tiempo real
   - Al enviar, aparece indicador de carga
   - Si hay éxito:
     - Se muestra mensaje de bienvenida
     - Se redirige a dashboard
   - Si hay error:
     - Se muestra mensaje explicativo
     - Se mantiene en formulario preservando datos

2. **Primer Acceso a Dashboard**:
   - Usuario ve mensaje de bienvenida personalizado
   - Dashboard muestra claramente "1 evaluación gratuita disponible"
   - Botón prominente "Iniciar mi Evaluación"
   - Panel lateral con instrucciones breves

3. **Estados de Carga**:
   - Durante autenticación: Spinner centrado
   - Durante carga de perfil: Skeleton screens en dashboard
   - Durante redirección: Barra de progreso superior

#### Consideraciones de Seguridad
1. **Autenticación**:
   - Implementar validación de contraseñas (mínimo 8 caracteres, incluir número y carácter especial)
   - Limitar intentos fallidos de inicio de sesión (usando Firebase Auth)
   - Almacenar solo hash de contraseñas (gestionado automáticamente por Firebase Auth)
   
2. **Reglas de Firestore**:
   - Garantizar que solo el propio usuario pueda leer/modificar su perfil
   - Proteger campos críticos (créditos) para que solo sean modificables por Cloud Functions
   - Verificar la consistencia entre request.auth.uid y el documento accedido

3. **Frontend**:
   - Implementar rutas protegidas (HOC withAuth o hook useRequireAuth)
   - Validar todas las entradas de usuario antes de enviar al backend
   - Sanitizar datos para prevenir XSS

#### Estrategia de Pruebas
1. **Pruebas Unitarias**:
   - Componentes de formularios (validaciones, estados de error)
   - Hooks personalizados (useAuth, useFirestore)
   - Funciones auxiliares de validación

2. **Pruebas de Integración**:
   - Flujo completo de registro
   - Flujo de inicio de sesión
   - Verificación de creación correcta del perfil
   - Integración Auth-Firestore

3. **Pruebas End-to-End**:
   - Escenario completo: registro → inicio de sesión → acceso a dashboard
   - Prueba de persistencia de sesión entre recargas
   - Simulación de errores de red durante autenticación

#### Gestión de Datos
1. **Ciclo de Vida de Datos**:
   - Datos de autenticación: Gestionados por Firebase Auth
   - Perfil de usuario: Persistente en Firestore
   - Estado de autenticación en cliente: Persistido mediante localStorage o sessionStorage según preferencia

2. **Estrategias de Caché**:
   - Perfil de usuario almacenado en `AuthContext` mientras la sesión está activa
   - Revalidación al iniciar sesión y periódicamente cada X minutos

3. **Actualizaciones en Tiempo Real**:
   - Suscripción a cambios en el documento de usuario mediante Firestore onSnapshot
   ```javascript
   useEffect(() => {
     if (currentUser?.uid) {
       const unsubscribe = db.collection('users').doc(currentUser.uid)
         .onSnapshot(doc => {
           setUserProfile(doc.data());
         });
       return () => unsubscribe();
     }
   }, [currentUser]);
   ```

#### Manejo de Errores y Registro
1. **Errores Específicos**:
   - Email ya registrado: Sugerir iniciar sesión o recuperar contraseña
   - Contraseña débil: Mostrar requisitos específicos no cumplidos
   - Red no disponible: Mensaje para verificar conexión, con botón para reintentar
   - Error de verificación de Google: Sugerir método alternativo (email)

2. **Registro (Logging)**:
   - Eventos de autenticación exitosos (login, registro, logout) en Firebase Analytics
   - Errores de autenticación enviados a Cloud Logging
   - Métricas de conversión (visita → registro completado)
   - Tiempo de permanencia en formularios (para mejorar UX)

3. **Manejo Frontend**:
   - Errores capturados en try/catch en componentes
   - Sistema centralizado de notificaciones mediante UIContext
   - Mensajes de error descriptivos sin revelar detalles técnicos sensibles

## Funcionalidad 2: Flujo de Evaluación Individual

### Objetivo de la funcionalidad
Proporcionar una experiencia fluida y atractiva para que los usuarios completen la autoevaluación de discipulado, con una interfaz de asistente (wizard) intuitiva que presente las preguntas secuencialmente, guarde las respuestas de forma segura, y actualice el estado de créditos del usuario al finalizar.

### Relaciones con APIs
- **Cloud Functions - getQuestions**: Endpoint para obtener la batería de preguntas para la evaluación
- **Cloud Functions - submitAnswers**: Endpoint para enviar las respuestas completas o parciales
- **Cloud Functions - calculateResults**: Endpoint para procesar las respuestas y generar resultados
- **Firestore**: Para almacenar/actualizar respuestas y estado de evaluación del usuario

### Requisitos detallados de la funcionalidad
1. Verificación automática de créditos disponibles antes de iniciar la evaluación
2. Interfaz de asistente (wizard) con navegación intuitiva entre preguntas
3. Diseño responsivo adaptado a dispositivos móviles y escritorio
4. Guardado automático del progreso durante la evaluación
5. Capacidad para retomar la evaluación en caso de abandono/interrupción
6. Sistema para navegar entre preguntas anterior/siguiente
7. Barra de progreso visual para mostrar avance en la evaluación
8. Validación en tiempo real para asegurar que todas las preguntas sean respondidas
9. Confirmación antes de envío final de la evaluación
10. Descuento automático de 1 crédito al completar la evaluación
11. Bloqueo de la interfaz para prevenir envíos duplicados accidentales
12. Redirección automática al dashboard después de completar la evaluación

### Guía detallada de implementación

#### Visión General de la Arquitectura del Sistema
Esta funcionalidad se implementa mediante la interacción coordinada de:
1. **Frontend (SPA)**: Componentes de wizard para presentar preguntas secuenciales, con gestión de estado local para mantener las respuestas temporalmente.
2. **Backend (Cloud Functions)**: Tres endpoints principales: uno para obtener las preguntas, otro para guardar respuestas parciales, y un tercero para procesar y calcular los resultados finales.
3. **Base de Datos (Firestore)**: Almacena tanto las preguntas de evaluación como las respuestas del usuario y su progreso actual.

El flujo completo es:
1. Frontend verifica créditos disponibles → Solicita preguntas al backend → Presenta interfaz de wizard → Usuario responde → Se guardan respuestas parciales → Al completar, se envían todas las respuestas → Se calculan resultados → Se descuenta crédito → Se redirige al dashboard con resumen.

#### Diseño del Esquema de Base de Datos
**Colección `evaluationQuestions`**:
```
/evaluationQuestions/{categoryId}/ {
  title: string,
  description: string,
  order: number,
  questions: [
    {
      id: string,
      text: string,
      type: 'likert5' | 'likert7' | 'boolean',
      weight: number,
      dimension: string,
      required: boolean
    }
  ]
}
```

**Colección `evaluations`**:
```
/evaluations/{evaluationId}/ {
  userId: string,
  startedAt: timestamp,
  lastUpdatedAt: timestamp,
  completedAt: timestamp | null,
  progress: number, // 0-100%
  status: 'in_progress' | 'completed' | 'abandoned',
  answers: {
    [questionId]: {
      value: number | boolean,
      answeredAt: timestamp
    }
  },
  results: {
    dimensions: {
      [dimensionName]: number // Puntaje 0-100
    },
    overall: number,
    timestamp: timestamp
  } | null
}
```

**Actualización en colección `users`**:
```
// Campo anidado que se actualizará
evaluacionActual: {
  id: string | null, // evaluationId cuando está en progreso
  estado: 'no_iniciada' | 'en_progreso' | 'completada',
  fechaInicio: timestamp | null,
  ultimaActividad: timestamp | null,
  progresoActual: number // 0-100%
}
```

**Reglas de seguridad**:
```
match /evaluationQuestions/{document=**} {
  allow read: if request.auth != null;
  allow write: if false; // Solo administradores vía Console
}

match /evaluations/{evaluationId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && 
                resource.data.userId == request.auth.uid && 
                resource.data.status != 'completed';
  allow delete: if false; // No permitir eliminación
}
```

#### Diseño Exhaustivo de la API
**Cloud Function: `getQuestions`**
- **Tipo**: HTTP Callable
- **Método**: GET
- **Entradas**: 
  - Token de autenticación (implícito)
- **Proceso**:
  1. Verificar autenticación
  2. Verificar usuario tiene créditos disponibles
  3. Buscar evaluación en curso o crear nueva
  4. Cargar preguntas de evaluación
- **Respuesta**: 
  - Status 200: Array de categorías y sus preguntas
  - Status 403: Usuario no autorizado o sin créditos
- **Ejemplo de respuesta exitosa**:
```json
{
  "evaluationId": "eval123",
  "categories": [
    {
      "id": "cat1",
      "title": "Conocimiento Bíblico",
      "description": "Evalúa tu comprensión de las escrituras",
      "order": 1,
      "questions": [
        {
          "id": "q1",
          "text": "¿Con qué frecuencia lees la Biblia?",
          "type": "likert5",
          "dimension": "knowledge"
        },
        // Más preguntas...
      ]
    },
    // Más categorías...
  ]
}
```

**Cloud Function: `saveProgress`**
- **Tipo**: HTTP Callable
- **Método**: POST
- **Entradas**:
  - `evaluationId`: ID de la evaluación actual
  - `answers`: Objeto con respuestas parciales
  - `progress`: Porcentaje de progreso
- **Proceso**:
  1. Verificar autenticación y propiedad de la evaluación
  2. Actualizar documento de evaluación con respuestas
  3. Actualizar progreso en perfil de usuario
- **Respuesta**:
  - Status 200: Confirmación de guardado
  - Status 403: No autorizado
  - Status 404: Evaluación no encontrada
- **Ejemplo de payload**:
```json
{
  "evaluationId": "eval123",
  "answers": {
    "q1": {"value": 4},
    "q2": {"value": true}
  },
  "progress": 25
}
```

**Cloud Function: `submitAnswers`**
- **Tipo**: HTTP Callable
- **Método**: POST
- **Entradas**:
  - `evaluationId`: ID de la evaluación
  - `answers`: Objeto completo con todas las respuestas
- **Proceso**:
  1. Verificar autenticación y propiedad
  2. Validar que todas las preguntas requeridas tengan respuesta
  3. Marcar evaluación como completada
  4. Calcular resultados por dimensiones
  5. Descontar 1 crédito al usuario
  6. Actualizar estado de evaluación del usuario
- **Respuesta**:
  - Status 200: Resultados procesados
  - Status 403: No autorizado
  - Status 400: Respuestas incompletas
- **Ejemplo de respuesta exitosa**:
```json
{
  "success": true,
  "results": {
    "dimensions": {
      "knowledge": 75,
      "practice": 60,
      "community": 82
    },
    "overall": 72.3
  },
  "creditsRemaining": 0
}
```

#### Arquitectura del Frontend
La arquitectura frontend para esta funcionalidad consta de:

1. **Componentes**:
   - `EvaluationWizard.js`: Contenedor principal del asistente
   - `Question.js`: Componente para renderizar cada pregunta individual
   - `QuestionNavigator.js`: UI para navegar entre preguntas (anterior/siguiente)
   - `ProgressBar.js`: Indicador visual del progreso
   - `CategoryIntro.js`: Introduce cada categoría de preguntas
   - `EvaluationSummary.js`: Resumen final antes de enviar respuestas

2. **Contexto**:
   - `EvaluationContext.js`: Gestiona el estado de la evaluación actual
   ```javascript
   // Estructura simplificada
   const EvaluationContext = createContext();
   const EvaluationProvider = ({ children }) => {
     const [questions, setQuestions] = useState([]);
     const [answers, setAnswers] = useState({});
     const [currentQuestion, setCurrentQuestion] = useState(0);
     const [evaluationId, setEvaluationId] = useState(null);
     const [progress, setProgress] = useState(0);
     // Métodos: saveAnswer, nextQuestion, prevQuestion, submitEvaluation...
     
     return <EvaluationContext.Provider value={{
       questions, answers, currentQuestion, evaluationId, progress,
       saveAnswer, nextQuestion, prevQuestion, submitEvaluation
     }}>{children}</EvaluationContext.Provider>;
   };
   ```

3. **Hooks personalizados**:
   - `useEvaluation.js`: Acceso al contexto de evaluación
   - `useSaveProgress.js`: Hook para gestionar guardado automático
   ```javascript
   function useSaveProgress(evaluationId, answers, progress) {
     const { currentUser } = useAuth();
     const [saving, setSaving] = useState(false);
     const [error, setError] = useState(null);
     
     // Lógica para guardado automático con debounce
     useEffect(() => {
       const saveTimeout = setTimeout(async () => {
         if (!evaluationId || Object.keys(answers).length === 0) return;
         
         setSaving(true);
         try {
           await saveProgressFunction({evaluationId, answers, progress});
         } catch (err) {
           setError(err);
         } finally {
           setSaving(false);
         }
       }, 2000); // Debounce de 2 segundos
       
       return () => clearTimeout(saveTimeout);
     }, [answers, progress, evaluationId]);
     
     return { saving, error };
   }
   ```

4. **Rutas**:
   - `/evaluation`: Punto de entrada para iniciar la evaluación
   - `/evaluation/:evaluationId`: Recupera una evaluación en progreso

#### Operaciones CRUD Detalladas
1. **Crear (C)**:
   - **Iniciar Nueva Evaluación**:
     1. Frontend: Usuario hace clic en "Iniciar Evaluación"
     2. Backend: `getQuestions` crea nuevo documento en `/evaluations/{evaluationId}`
     3. Frontend: Actualiza `EvaluationContext` con el nuevo `evaluationId`
   
2. **Leer (R)**:
   - **Cargar Evaluación en Progreso**:
     1. Frontend: Al acceder a `/evaluation/:evaluationId`, llama a `getQuestions` con ID
     2. Backend: Verifica propiedad y carga estado actual
     3. Frontend: Rellena formulario con respuestas previamente guardadas

3. **Actualizar (U)**:
   - **Guardar Respuesta Individual**:
     1. Frontend: Usuario responde una pregunta, se actualiza estado local
     2. Frontend: Hook `useSaveProgress` detecta cambio y guarda después de debounce
     3. Backend: `saveProgress` actualiza el documento en Firestore
   
   - **Completar Evaluación**:
     1. Frontend: Usuario hace clic en "Finalizar Evaluación"
     2. Backend: `submitAnswers` actualiza estado a 'completed', calcula resultados
     3. Backend: También actualiza contador de créditos en colección `users`

4. **Eliminar (D)**:
   - No se implementa eliminación directa en el MVP
   - Las evaluaciones abandonadas permanecen en estado 'in_progress'

#### Flujo de Experiencia de Usuario
1. **Inicio de Evaluación**:
   - Usuario accede a dashboard y ve botón "Iniciar mi Evaluación"
   - Al hacer clic, sistema verifica créditos (mensaje de error si no tiene)
   - Si tiene créditos, aparece pantalla de bienvenida/introducción a la evaluación
   - Botón "Comenzar" inicia el wizard

2. **Completando la Evaluación**:
   - Usuario ve preguntas una por una con opciones claras
   - Barra de progreso en la parte superior muestra avance
   - Navegación intuitiva con botones "Anterior" y "Siguiente"
   - Al cambiar de pregunta, se guarda automáticamente (indicador sutil)
   - Preguntas requeridas no permiten avanzar hasta ser respondidas
   - Cada categoría tiene introducción explicativa

3. **Finalización**:
   - Al responder última pregunta, se muestra pantalla de resumen
   - Usuario confirma envío con botón "Finalizar mi Evaluación"
   - Aparece indicador de carga mientras se procesan resultados
   - Mensaje de éxito y redirección automática al dashboard con resultados

4. **Estados de Carga/Error**:
   - Durante carga inicial: Skeleton screens de preguntas
   - Durante guardado: Pequeño indicador tipo "Guardando..." en esquina
   - Durante envío final: Pantalla completa de "Procesando resultados..."
   - En caso de error de red: Opción para reintentar guardado

#### Consideraciones de Seguridad
1. **Verificación de Créditos**:
   - Doble verificación de créditos (frontend y backend)
   - Bloqueo de rutas de evaluación si usuario no tiene créditos
   - Transacción atómica para descontar crédito al finalizar

2. **Propiedad de Datos**:
   - Cada documento de evaluación tiene campo `userId` verificado en reglas
   - Todas las operaciones verifican que el usuario autenticado sea el propietario

3. **Protección contra Manipulación**:
   - Las preguntas solo son lectura para usuarios normales
   - Validación en backend de todas las respuestas enviadas
   - Cálculo de resultados siempre en backend, nunca confiando en cálculos del cliente

4. **Transacciones**:
   - Uso de transacciones de Firestore para actualizar evaluación y descontar crédito atómicamente
   ```javascript
   const decrementCredit = async (userId, evaluationId) => {
     const db = admin.firestore();
     return db.runTransaction(async (transaction) => {
       const userRef = db.collection('users').doc(userId);
       const userDoc = await transaction.get(userRef);
       
       if (!userDoc.exists) throw new Error('Usuario no encontrado');
       
       const currentCredits = userDoc.data().creditosEvaluacion || 0;
       if (currentCredits < 1) throw new Error('Créditos insuficientes');
       
       // Actualizar créditos y registro de evaluaciones completadas
       transaction.update(userRef, {
         creditosEvaluacion: currentCredits - 1,
         evaluacionesCompletadas: admin.firestore.FieldValue.arrayUnion(evaluationId)
       });
       
       // Actualizar estado de evaluación actual
       transaction.update(userRef, {
         'evaluacionActual.estado': 'completada',
         'evaluacionActual.progresoActual': 100
       });
     });
   };
   ```

#### Estrategia de Pruebas
1. **Pruebas Unitarias**:
   - Componente `Question.js` (diferentes tipos de pregunta)
   - Lógica de navegación (anterior/siguiente, validación)
   - Funciones de cálculo de progreso

2. **Pruebas de Integración**:
   - Flujo de guardado automático
   - Recuperación de evaluación en progreso
   - Validación de respuestas completas
   - Descuento correcto de créditos

3. **Pruebas End-to-End**:
   - Escenario completo: iniciar → responder → guardar → continuar → finalizar
   - Prueba de recuperación tras cierre de navegador
   - Simulaciones de problemas de red durante guardado
   - Verificación de estado final en dashboard

4. **Test Cases Específicos**:
   - Verificar bloqueo si usuario sin créditos intenta iniciar
   - Comprobar que no se puede enviar evaluación incompleta
   - Validar que solo se descuenta un crédito por evaluación
   - Verificar que las preguntas requeridas sean validadas

#### Gestión de Datos
1. **Ciclo de Vida de Datos**:
   - Preguntas: Cargadas al inicio de la evaluación, almacenadas en estado del contexto
   - Respuestas: Almacenadas en estado local y sincronizadas periódicamente con Firestore
   - Resultados: Calculados en backend y almacenados permanentemente en Firestore

2. **Estrategias de Caché**:
   - Preguntas: Almacenadas en localStorage para rápida recuperación si se recarga página
   - Respuestas parciales: También en localStorage como respaldo al guardado en Firestore
   - Limpieza de caché al finalizar evaluación completa

3. **Manejo de Datos Offline**:
   - Implementar indicador de conexión (online/offline)
   - En modo offline, guardar respuestas localmente
   - Al recuperar conexión, sincronizar automáticamente con backend
   ```javascript
   // En EvaluationContext
   useEffect(() => {
     const handleOnlineStatus = () => {
       if (navigator.onLine && pendingAnswers.length > 0) {
         syncPendingAnswers();
       }
     };
     
     window.addEventListener('online', handleOnlineStatus);
     return () => window.removeEventListener('online', handleOnlineStatus);
   }, [pendingAnswers]);
   ```

#### Manejo de Errores y Registro
1. **Errores Específicos**:
   - Créditos insuficientes: Mensaje claro con botón de redirección a compra
   - Error de guardado: Reintento automático con backoff exponencial
   - Error de conexión: Indicador visual y guardado local
   - Error en envío final: Opción para guardar y reintentar

2. **Registro (Logging)**:
   - Tiempo promedio para completar evaluación completa
   - Tiempo por pregunta/categoría
   - Abandono (en qué pregunta/categoría)
   - Errores técnicos durante el proceso

3. **Recuperación**:
   - Sistema automático para detectar evaluaciones abandonadas (último acceso > 24h)
   - Notificación vía email para