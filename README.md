# 360MVP - Sistema de Evaluación 360° 🎯

Una aplicación React moderna con Firebase que permite realizar evaluaciones de liderazgo 360° completas con autenticación robusta, persistencia de datos y navegación intuitiva.

## ✅ ESTADO ACTUAL

### 🔐 **Autenticación Completa**
- ✅ Firebase Auth Emulator integrado 
- ✅ Login/Registro funcional
- ✅ Rutas protegidas con ProtectedRoute
- ✅ Estados de sesión persistentes
- ✅ Verificación visual de email

### 🎯 **Navegación & Dashboard**
- ✅ Dashboard moderno con navegación por cards
- ✅ Acceso directo a todas las funcionalidades
- ✅ UserProfileCard con información completa
- ✅ Indicadores de créditos y evaluaciones

### 🗄️ **Base de Datos & Persistencia** 
- ✅ Firestore Emulator configurado
- ✅ Estructuras de datos completas (users, evaluations, responses)
- ✅ Reglas de seguridad implementadas
- ✅ Servicio Firestore con CRUD operations
- ✅ Hook useUserProfile integrado con Firestore

### 📄 **Páginas Funcionales**
- ✅ **Dashboard**: Navegación principal con perfil de usuario
- ✅ **Evaluation**: Interface para evaluaciones con manejo de créditos  
- ✅ **Credits**: Sistema de compra de créditos con paquetes
- ✅ **ReportView**: Visualización de reportes y progreso
- ✅ **Login/Register**: Autenticación completa

## 🚀 INICIO RÁPIDO

Última actualización: 2025-09-21 (commit 2221c65)

### Prerrequisitos
```bash
- Node.js 16+ 
- Firebase CLI instalado globalmente
```

### Instalación
```bash
git clone [repository]
cd 360MVP
npm install
```

### Desarrollo
```bash
# Opción 1: Solo frontend (Auth emulator interno)
npm run dev

# Opción 2: Con emuladores Firebase completos  
npm run emulators:dev

# Opción 3: Solo emuladores (para testing)
npm run emulators
```

### URLs Importantes
- 🌐 **Frontend**: http://127.0.0.1:5178
- 🔐 **Auth Emulator**: http://127.0.0.1:9099
- 🗄️ **Firestore Emulator**: http://127.0.0.1:8080  
- 🎛️ **Emulator UI**: http://127.0.0.1:4000

## 🏗️ ARQUITECTURA

### Estructura de Directorios (app única en `src/`)
```
src/
├── components/           # Componentes reutilizables
│   ├── NavigationCard.jsx    # (eliminado en consolidación)
│   ├── UserProfileCard.jsx   # Perfil de usuario  
│   └── ProtectedRoute.jsx    # Rutas protegidas
├── context/             
│   └── AuthContext.jsx      # Context de autenticación
├── hooks/               
│   └── useUserProfile.js    # Hook de perfil extendido
├── pages/               # Páginas principales
│   ├── Dashboard.jsx        # Dashboard principal
│   ├── Login.jsx           # Página de login
│   ├── Register.jsx        # Página de registro  
│   ├── Evaluation.jsx      # Sistema de evaluaciones
│   ├── Credits.jsx         # Gestión de créditos
│   └── ReportView.jsx      # Visualización de reportes
├── services/            
│   ├── firebase.jsx        # Configuración Firebase (centralizada)
│   └── firestore.js        # Operaciones de base de datos
└── constants/
    └── routes.js           # Rutas de la aplicación
```

### Base de Datos (Firestore)
```
📁 users/{userId}
   ├── uid, email, displayName
   ├── credits, evaluationsCompleted
   ├── plan, preferences
   └── timestamps

📁 evaluations/{evaluationId}
   ├── userId, title, status
   ├── progress, totalQuestions
   └── subcollection: responses/{responseId}

📁 questions/{questionId} (futuro)
📁 reports/{reportId} (futuro)
```

## 🎯 FUNCIONALIDADES PRINCIPALES

### 1. **Sistema de Autenticación**
- Registro e inicio de sesión con email/password
- Persistencia automática de sesión
- Verificación visual del estado del email
- Integración completa con emuladores

### 2. **Dashboard Inteligente** 
- Navegación intuitiva por cards
- Información del perfil en tiempo real
- Estado de créditos y evaluaciones
- Acceso directo a todas las funcionalidades

### 3. **Gestión de Perfiles**
- Hook `useUserProfile()` extendido
- Combinación de datos Auth + Firestore
- Inicialización automática en primer login
- Información completa: créditos, plan, evaluaciones

### 4. **Sistema de Navegación**
- NavigationCard component reutilizable
- Estados disabled para funcionalidades futuras
- Navegación entre páginas fluida
- Botones "volver" en todas las páginas

## 🔧 CONFIGURACIÓN

### Variables de Entorno

#### Configuración por Entorno
Copia `env.example` como `.env.local` para desarrollo:
```bash
# Copia y personaliza según tu entorno
cp env.example .env.local
```

#### Variables Clave
```bash
# Firebase Config
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_USE_EMULATORS=true  # local: true, staging/prod: false

# Feature Flags
VITE_FEATURE_ORG=true      # Módulo organizacional
VITE_FEATURE_PDF=true      # Export PDF
VITE_FEATURE_INVITES=true  # Invitaciones por token
VITE_FEATURE_CREDITS=false # Sistema de pagos

# Environment
VITE_ENVIRONMENT=local     # local/staging/production
VITE_DEBUG_LOGS=true       # Logs de desarrollo
```

#### Archivos de Configuración
- `env.example` - Template con todas las variables
- `env.staging` - Configuración para staging (Firebase real)
- `env.production` - Configuración para producción

### Firebase Emulators
Los emuladores se configuran automáticamente:
- ✅ **Auth Emulator**: Puerto 9099
- ✅ **Firestore Emulator**: Puerto 8080
- ✅ **UI Emulator**: Puerto 4000

## 🚧 PRÓXIMAS FUNCIONALIDADES

### 🎯 **Alta Prioridad**
- [ ] **Wizard de Evaluación**: Sistema completo de preguntas
- [ ] **Generación de Reportes**: PDFs y análisis detallados  
- [ ] **Sistema de Pagos**: Integración con Stripe
- [ ] **Gestión de Preguntas**: CRUD de preguntas por categoría

### 🔄 **Media Prioridad**  
- [ ] **Dashboard Analytics**: Gráficos y métricas
- [ ] **Notificaciones**: Sistema de alerts y toasts
- [ ] **Perfil Extendido**: Configuración avanzada de usuario
- [ ] **Export/Import**: Datos y configuraciones

### 💡 **Baja Prioridad**
- [ ] **Temas**: Dark/Light mode
- [ ] **Multi-idioma**: i18n implementation  
- [ ] **PWA**: Service workers y offline support
- [ ] **API REST**: Endpoints para integraciones

## 🧪 TESTING

### Flujo de Pruebas
1. **Registro**: Crear cuenta nueva en `/register`
2. **Login**: Iniciar sesión en `/login` 
3. **Dashboard**: Verificar navegación y perfil
4. **Navegación**: Probar todas las cards del dashboard
5. **Páginas**: Verificar contenido y navegación de retorno
6. **Firestore**: Comprobar que se crean los documentos de usuario

### Datos de Prueba
El sistema inicializa usuarios nuevos con:
- 3 créditos iniciales
- Plan "free"
- 0 evaluaciones completadas

## 📋 CHANGELOG

### v1.2.0 (Actual)
- ✅ Sistema de navegación completo  
- ✅ Firestore Emulator configurado
- ✅ Hook useUserProfile() integrado
- ✅ Páginas funcionales completadas
- ✅ UserProfileCard mejorado con datos de Firestore

### v1.1.0 
- ✅ UserProfileCard con verificación de email
- ✅ Dashboard mejorado  
- ✅ Limpieza de código y duplicados

### v1.0.0
- ✅ Autenticación Firebase Auth  
- ✅ Rutas protegidas
- ✅ Estados de sesión persistentes

## 🤝 DESARROLLO

### Comandos Útiles
```bash
npm run dev              # Frontend + Auth emulator interno
npm run emulators        # Solo emuladores Firebase
npm run emulators:dev    # Frontend + Emuladores completos  
npm run build           # Build de producción
npm run db:reset        # Reset Firestore emulator
```

### Principios de Desarrollo
- **Autonomía**: Arquitectura preparada para escalabilidad
- **Robustez**: Manejo de errores y estados de carga
- **UX First**: Interfaces intuitivas y navegación clara
- **Data-Driven**: Decisiones basadas en datos de Firestore

---

## 📞 SOPORTE

Sistema desarrollado con React 18, Firebase 9, y Vite 3.

## 🚀 DEPLOYMENT

### Deploy a Staging
```bash
# Setup proyecto staging en Firebase Console
# Configura env.staging con tus claves Firebase

# Deploy manual
npm run deploy:staging

# Deploy vía GitHub Actions
# Actions → CI/CD Pipeline → Run workflow → staging
```

### Deploy a Production  
```bash
# Setup proyecto production en Firebase Console
# Configura env.production con tus claves Firebase

# Deploy manual
npm run deploy:production
```

### Feature Flags por Entorno
```bash
# Local (desarrollo)
VITE_FEATURE_ORG=true         # Todas las features habilitadas
VITE_DEBUG_LOGS=true          # Debug visible
VITE_USE_EMULATORS=true       # Emuladores activos

# Staging (testing)
VITE_FEATURE_ORG=true         # Testing completo
VITE_DEBUG_LOGS=false         # Sin debug logs
VITE_USE_EMULATORS=false      # Firebase real

# Production (live)
VITE_FEATURE_CREDITS=true     # Todas las features activas
VITE_DEBUG_LOGS=false         # Sin debug
VITE_PERFORMANCE_METRICS=false # Sin métricas
```

---

**Última actualización: 2025-09-21 (commit 36c22a0)**
