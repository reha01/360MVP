# Documentación Frontend (SPA)

## Objetivo

Definir estructura de carpetas, rutas, contextos, hooks, componentes clave y convenciones del frontend (SPA) para cubrir FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-007, FEAT-008.

## Stack y dependencias (solo las aprobadas)

- **React**: Biblioteca para construir interfaces de usuario
- **React Router**: Manejo de rutas y navegación
- **Chart.js**: Visualización de datos con gráficos radar
- **jsPDF**: Generación de documentos PDF en el cliente
- **SDK Firebase para Web**: Autenticación, Firestore, Storage

## Estructura de carpetas

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
│   │   ├── core/                # Componentes base reutilizables
│   │   │   ├── Button.js        # Botón estándar con variantes
│   │   │   ├── Modal.js         # Ventana modal reutilizable
│   │   │   ├── Notification.js  # Notificaciones toast/alert
│   │   │   ├── ProgressIndicator.js  # Indicador de carga/progreso
│   │   │   └── FormElements/    # Inputs, selects, checkboxes, etc.
│   │   ├── auth/                # Componentes de autenticación
│   │   │   ├── LoginForm.js     # Formulario de inicio de sesión
│   │   │   ├── RegisterForm.js  # Formulario de registro
│   │   │   ├── ResetPasswordForm.js  # Recuperación de contraseña
│   │   │   └── SocialLoginButton.js  # Botones OAuth (Google)
│   │   ├── dashboard/           # Componentes del panel principal
│   │   │   ├── Dashboard.js     # Contenedor principal del dashboard
│   │   │   ├── ReportSummary.js # Resumen de resultados
│   │   │   ├── RadarChart.js    # Gráfico radar de resultados
│   │   │   └── UpgradePrompt.js # CTA para compra
│   │   ├── evaluation/          # Componentes del wizard
│   │   │   ├── EvaluationWizard.js  # Contenedor principal del wizard
│   │   │   ├── Question.js      # Componente de pregunta individual
│   │   │   ├── QuestionNavigator.js  # Navegación entre preguntas
│   │   │   └── ProgressBar.js   # Barra de progreso de evaluación
│   │   └── payment/             # Componentes de checkout
│   │       ├── CreditOptions.js # Opciones de compra de créditos
│   │       ├── CheckoutForm.js  # Formulario de pago Stripe
│   │       └── PaymentSuccess.js # Confirmación de pago exitoso
│   ├── context/                 # Gestores de estado global
│   │   ├── AuthContext.js       # Estado de autenticación y usuario
│   │   ├── EvaluationContext.js # Estado de la evaluación actual
│   │   └── UIContext.js         # Estado UI global (modales, notificaciones)
│   ├── hooks/                   # Hooks personalizados
│   │   ├── useFirestore.js      # Operaciones CRUD con Firestore
│   │   ├── useAuth.js           # Hook para gestión de autenticación
│   │   ├── usePayment.js        # Hook para operaciones de pago
│   │   ├── useEvaluation.js     # Hook para acceder al contexto de evaluación
│   │   └── useSaveProgress.js   # Hook para guardado automático con debounce
│   ├── services/                # Servicios e integraciones
│   │   ├── api.js               # Cliente para llamadas a Cloud Functions
│   │   ├── firebase.js          # Configuración e inicialización de Firebase
│   │   ├── stripe.js            # Configuración e inicialización de Stripe
│   │   └── report-generator.js  # Generación de informes PDF
│   ├── pages/                   # Páginas/vistas principales
│   │   ├── Home.js              # Landing page pública
│   │   ├── Login.js             # Página de inicio de sesión
│   │   ├── Register.js          # Página de registro
│   │   ├── Dashboard.js         # Panel principal (protegido)
│   │   ├── Evaluation.js        # Página del wizard de evaluación
│   │   ├── ReportView.js        # Vista detallada de resultados
│   │   └── Credits.js           # Página de compra de créditos
│   ├── utils/                   # Utilidades y helpers
│   │   ├── validators.js        # Funciones de validación de formularios
│   │   ├── formatters.js        # Formateo de fechas, números, etc.
│   │   ├── analytics.js         # Seguimiento de eventos de usuario
│   │   └── pdf-templates.js     # Plantillas para generación de PDF
│   ├── constants/               # Valores constantes
│   │   ├── routes.js            # Definición de rutas de la app
│   │   ├── questionBank.js      # Datos estáticos de preguntas (fallback)
│   │   └── reportTexts.js       # Textos para interpretación de resultados
│   ├── styles/                  # Estilos globales
│   │   ├── global.css           # Estilos base aplicados globalmente
│   │   └── variables.css        # Variables CSS (colores, tamaños, etc.)
│   ├── App.js                   # Componente raíz de la aplicación
│   ├── index.js                 # Punto de entrada de la aplicación
│   └── router.js                # Configuración de enrutamiento
├── .firebaserc                  # Configuración de proyecto Firebase
├── firebase.json                # Configuración de servicios Firebase
├── package.json                 # Dependencias y scripts
└── README.md                    # Documentación general
```

### Rutas clave

- `/` - Página de inicio pública
- `/login` - Inicio de sesión
- `/register` - Registro de usuario
- `/reset-password` - Restablecimiento de contraseña
- `/dashboard` - Panel principal (protegido)
- `/evaluation` - Inicio de nueva evaluación (protegido)
- `/evaluation/:evaluationId` - Continuar evaluación en progreso (protegido)
- `/report/:evaluationId` - Vista de resultados de una evaluación (protegido)
- `/credits` - Página de compra de créditos (protegido)

## Rutas y protección

### Mapa de rutas → páginas

| Ruta | Componente | Accesibilidad | Descripción |
|------|------------|---------------|-------------|
| `/` | Home.js | Pública | Landing page con información general |
| `/login` | Login.js | Pública | Inicio de sesión |
| `/register` | Register.js | Pública | Registro de usuario nuevo |
| `/reset-password` | ResetPassword.js | Pública | Restablecimiento de contraseña |
| `/dashboard` | Dashboard.js | Protegida | Panel principal del usuario |
| `/evaluation` | Evaluation.js | Protegida + Verificación de créditos | Inicio de nueva evaluación |
| `/evaluation/:evaluationId` | Evaluation.js | Protegida + Verificación de propiedad | Continuación de evaluación en progreso |
| `/report/:evaluationId` | ReportView.js | Protegida + Verificación de propiedad | Vista detallada de resultados |
| `/credits` | Credits.js | Protegida | Compra de créditos o informes |

### Protección de rutas

Implementación mediante componente `ProtectedRoute` o hook `useRequireAuth`:

```jsx
// Componente ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingScreen />;
  
  if (!currentUser) {
    // Redirigir a login, guardando la URL intentada para redirección post-login
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  
  return children;
};

// En router.js
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Estados de carga y error

- **Carga inicial**: Skeleton screens en dashboard y páginas principales
- **Durante autenticación**: Spinner centrado
- **Guardado de respuestas**: Indicador sutil "Guardando..." en esquina inferior
- **Procesamiento final de evaluación**: Pantalla overlay "Procesando resultados..."
- **Errores de red**: Toast con mensaje explicativo y opción "Reintentar"
- **Errores de formulario**: Mensajes inline bajo cada campo con error

## Contextos y hooks

### AuthContext

Gestiona el estado global de autenticación y perfil de usuario:

```jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  // Persistencia de sesión y suscripción a cambios de auth
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        // Suscribirse a cambios en el documento de perfil
        const profileUnsubscribe = db.collection('users').doc(user.uid)
          .onSnapshot(doc => {
            setUserProfile(doc.data());
          });
        
        return () => profileUnsubscribe();
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Métodos de autenticación
  const login = (email, password) => { /* ... */ };
  const register = (email, password, displayName) => { /* ... */ };
  const loginWithGoogle = () => { /* ... */ };
  const logout = () => { /* ... */ };
  const resetPassword = (email) => { /* ... */ };
  
  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### EvaluationContext

Gestiona el estado de la evaluación actual, incluyendo preguntas, respuestas y progreso:

```jsx
const EvaluationContext = createContext();

export function EvaluationProvider({ children }) {
  const [evaluationId, setEvaluationId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Hook personalizado para guardado con debounce
  const { saving } = useSaveProgress(evaluationId, answers, progress);
  
  // Iniciar evaluación
  const startEvaluation = async () => { /* ... */ };
  
  // Cargar evaluación existente
  const loadEvaluation = async (id) => { /* ... */ };
  
  // Guardar respuesta
  const saveAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        value,
        answeredAt: new Date()
      }
    }));
    
    // Calcular progreso
    const answered = Object.keys(answers).length + 1;
    const totalQuestions = questions.reduce((sum, cat) => sum + cat.questions.length, 0);
    setProgress(Math.round((answered / totalQuestions) * 100));
  };
  
  // Navegación entre preguntas
  const nextQuestion = () => { /* ... */ };
  const prevQuestion = () => { /* ... */ };
  
  // Finalizar evaluación
  const submitEvaluation = async () => { /* ... */ };
  
  // Gestión offline - guardar en localStorage
  useEffect(() => {
    if (evaluationId && Object.keys(answers).length > 0) {
      localStorage.setItem(`evaluation_${evaluationId}`, JSON.stringify({
        answers,
        progress,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [answers, progress, evaluationId]);
  
  const value = {
    evaluationId,
    questions,
    answers,
    currentIndex,
    progress,
    loading,
    error,
    saving,
    startEvaluation,
    loadEvaluation,
    saveAnswer,
    nextQuestion,
    prevQuestion,
    submitEvaluation
  };
  
  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
}
```

### UIContext

Gestiona el estado global de interfaz, notificaciones y modales:

```jsx
const UIContext = createContext();

export function UIProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [modalContent, setModalContent] = useState(null);
  
  // Mostrar notificación
  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-eliminar después de duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };
  
  // Mostrar/ocultar modal
  const showModal = (content) => {
    setModalContent(content);
  };
  
  const hideModal = () => {
    setModalContent(null);
  };
  
  const value = {
    notifications,
    showNotification,
    modalContent,
    showModal,
    hideModal
  };
  
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
```

### Hooks personalizados

| Hook | Responsabilidad | Firma |
|------|-----------------|-------|
| `useAuth` | Acceso al contexto de autenticación | `() => { currentUser, userProfile, login, register, logout, ... }` |
| `useFirestore` | Operaciones CRUD con Firestore | `() => { getDocument, addDocument, updateDocument, deleteDocument, ... }` |
| `usePayment` | Interacción con Stripe | `() => { createCheckout, buyCredits, buyReport, ... }` |
| `useEvaluation` | Acceso al contexto de evaluación | `() => { questions, answers, progress, saveAnswer, nextQuestion, ... }` |
| `useSaveProgress` | Guardado automático con debounce | `(evaluationId, answers, progress) => { saving, error }` |

## Componentes clave

### EvaluationWizard

Componente principal para el flujo de evaluación que orquesta:
- Carga inicial de preguntas
- Navegación entre preguntas
- Validación de respuestas
- Guardado automático
- Envío final

```jsx
const EvaluationWizard = () => {
  const { evaluationId, questions, currentIndex, progress, saveAnswer, nextQuestion, prevQuestion, submitEvaluation } = useEvaluation();
  
  // Componente que renderiza la pregunta actual o intro de categoría
  const renderCurrentStep = () => {
    // Lógica para determinar si estamos en una intro de categoría o pregunta
    // ...
    
    if (isIntroduction) {
      return <CategoryIntro category={currentCategory} onNext={nextQuestion} />;
    }
    
    return (
      <Question 
        question={currentQuestion}
        onChange={(value) => saveAnswer(currentQuestion.id, value)}
        value={answers[currentQuestion.id]?.value}
      />
    );
  };
  
  return (
    <div className="evaluation-wizard">
      <ProgressBar progress={progress} />
      
      <div className="wizard-content">
        {renderCurrentStep()}
      </div>
      
      <QuestionNavigator 
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < totalQuestions - 1}
        isLastQuestion={currentIndex === totalQuestions - 1}
        onPrevious={prevQuestion}
        onNext={nextQuestion}
        onFinish={submitEvaluation}
      />
    </div>
  );
};
```

### Dashboard

Componente del panel principal que muestra:
- Estado de evaluaciones
- Resultados de evaluación completada
- Créditos disponibles
- CTA para comprar crédito o informe completo

```jsx
const Dashboard = () => {
  const { userProfile } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  
  // Cargar evaluaciones del usuario
  useEffect(() => {
    if (userProfile?.uid) {
      // Cargar evaluaciones completadas
      // ...
    }
  }, [userProfile]);
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="credits-badge">
          {userProfile?.creditosEvaluacion || 0} créditos disponibles
        </div>
      </header>
      
      {userProfile?.evaluacionActual?.estado === 'completada' && (
        <ReportSummary 
          evaluation={selectedEvaluation || evaluations[0]} 
        />
      )}
      
      {userProfile?.evaluacionActual?.estado === 'completada' && (
        <UpgradePrompt evaluationId={selectedEvaluation?.id || evaluations[0]?.id} />
      )}
      
      {userProfile?.creditosEvaluacion > 0 && (
        <div className="start-evaluation">
          <h2>Iniciar nueva evaluación</h2>
          <Button to="/evaluation" primary>Iniciar mi Evaluación</Button>
        </div>
      )}
      
      {evaluations.length > 0 && (
        <div className="evaluation-history">
          <h2>Mis evaluaciones previas</h2>
          <ul>
            {evaluations.map(eval => (
              <li key={eval.id} onClick={() => setSelectedEvaluation(eval)}>
                {formatDate(eval.completedAt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### RadarChart

Componente que utiliza Chart.js para visualizar resultados en formato radar:

```jsx
const RadarChart = ({ dimensions }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!chartRef.current || !dimensions) return;
    
    const ctx = chartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: Object.keys(dimensions),
        datasets: [{
          label: 'Tus resultados',
          data: Object.values(dimensions),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        elements: {
          line: {
            borderWidth: 3
          }
        },
        scale: {
          ticks: {
            beginAtZero: true,
            max: 100,
            stepSize: 20
          }
        }
      }
    });
    
    return () => {
      chart.destroy();
    };
  }, [dimensions]);
  
  return (
    <div className="radar-chart-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};
```

## Convenciones de UI/UX y Accesibilidad

### Mobile-first

- Diseño base optimizado para móviles (ancho mínimo: 320px)
- Media queries para adaptación a pantallas más grandes
- Elementos táctiles con tamaño mínimo de 44x44px
- Sin desplazamiento horizontal en cualquier pantalla

### Navegación por teclado

- Todos los elementos interactivos son navegables por teclado
- Orden de tabulación lógico y consistente
- Indicadores visuales de foco claros
- Atajos de teclado para acciones frecuentes (opcional)

### Contraste y legibilidad

- Relación de contraste mínima texto/fondo: 4.5:1
- Tamaño de texto base: 16px (1rem)
- Jerarquía tipográfica clara
- No confiar solo en el color para transmitir información

### Mensajes de error amigables

- Mensajes específicos y orientados a soluciones
- Evitar jerga técnica
- Sugerir acción correctiva cuando sea posible
- Persistir errores de formulario hasta corrección

### Estados de feedback

- Skeleton screens para contenido en carga
- Spinners para acciones cortas
- Barras de progreso para procesos largos
- Animaciones sutiles para transiciones (max 300ms)

## Seguridad en frontend

### Validaciones de formularios

Implementadas en `validators.js`:

- Validación de email (formato, dominio válido)
- Contraseñas seguras (mínimo 8 caracteres, combinar letras, números y símbolos)
- Validación en tiempo real con feedback instantáneo
- Doble validación en cliente y servidor

### Sanitización

- Sanitización de inputs para prevenir XSS
- Renderizado seguro de contenido dinámico
- Escapado de HTML en textos interpretativos de resultados

### Bloqueo de flujos críticos

- Verificación de créditos antes de iniciar evaluación
- Bloqueo de UI durante envíos para prevenir doble submit
- Confirmaciones para acciones destructivas o irreversibles

### Manejo offline

- Detección de estado de conexión
- Almacenamiento local de respuestas durante evaluación
- Cola de sincronización para operaciones pendientes
- Feedback claro del estado offline al usuario

## Trazabilidad (FEAT-xxx)

| Componente/Feature | FEAT-001 | FEAT-002 | FEAT-003 | FEAT-004 | FEAT-007 | FEAT-008 |
|-------------------|----------|----------|----------|----------|----------|----------|
| **Contextos** |  |  |  |  |  |  |
| AuthContext | ✓ |  |  |  |  | ✓ |
| EvaluationContext |  | ✓ |  |  |  |  |
| UIContext |  |  |  |  | ✓ |  |
| **Hooks** |  |  |  |  |  |  |
| useAuth | ✓ |  |  |  |  | ✓ |
| useFirestore | ✓ | ✓ | ✓ | ✓ |  |  |
| usePayment |  |  |  | ✓ |  | ✓ |
| useEvaluation |  | ✓ |  |  |  |  |
| useSaveProgress |  | ✓ |  |  | ✓ |  |
| **Componentes** |  |  |  |  |  |  |
| LoginForm/RegisterForm | ✓ |  |  |  |  | ✓ |
| Dashboard | ✓ |  | ✓ |  | ✓ |  |
| EvaluationWizard |  | ✓ |  |  | ✓ |  |
| ReportSummary |  |  | ✓ |  |  |  |
| RadarChart |  |  | ✓ |  |  |  |
| UpgradePrompt |  |  | ✓ | ✓ |  |  |
| CreditOptions |  |  |  | ✓ |  |  |
| **Páginas** |  |  |  |  |  |  |
| Login/Register | ✓ |  |  |  | ✓ | ✓ |
| Dashboard | ✓ |  | ✓ |  | ✓ |  |
| Evaluation |  | ✓ |  |  | ✓ |  |
| ReportView |  |  | ✓ |  | ✓ |  |
| Credits |  |  |  | ✓ | ✓ | ✓ |
| **Servicios** |  |  |  |  |  |  |
| firebase.js | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| api.js | ✓ | ✓ | ✓ | ✓ |  | ✓ |
| report-generator.js |  |  | ✓ | ✓ |  |  |
| stripe.js |  |  |  | ✓ |  | ✓ |

## Definition of Done (DoD)

✅ **Rutas protegidas y persistencia de sesión**:
- Todas las rutas protegidas impiden acceso a usuarios no autenticados
- La sesión persiste entre recargas de página
- Los permisos de acceso a recursos específicos (ej. evaluaciones) se verifican

✅ **Wizard de evaluación**:
- Funciona el flujo completo de inicio a fin
- Implementado guardado automático con debounce
- Sistema de reintento ante errores de red
- Validación completa antes de envío final

✅ **Visualización de resultados**:
- Gráfico radar muestra correctamente las dimensiones
- Texto interpretativo refleja resultados reales
- CTA para informe completo es prominente y funcional
- Previsualización parcial del informe implementada

✅ **Requisitos técnicos**:
- No se han añadido dependencias fuera de las aprobadas
- Todos los linters pasan sin errores/warnings
- Build se completa exitosamente
- Diseño responsive verificado en múltiples dispositivos
- Cumple con estándares básicos de accesibilidad

