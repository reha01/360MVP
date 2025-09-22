# HomeDashboard - Documentación

## 📱 Nuevo Dashboard Unificado Post-Login

Se ha implementado un nuevo HomeDashboard que reemplaza el dashboard básico anterior por una experiencia moderna estilo Apple, unificando tanto usuarios individuales como colaboradores 180/360° y líderes organizacionales.

## 🎯 Características Principales

### Diseño Apple-like
- **Tipografía**: Inter/SF con tamaños H1 28-32px, H2 20-22px, body 15-16px
- **Colores**: Fondo `#F8FAFC`, texto `#0B0F14`, primario `#0A84FF`
- **Cards**: Esquinas redondeadas 16-20px, borde `#E6EAF0`, sombras sutiles
- **Espaciado**: Generoso (24-32px entre elementos)
- **Animaciones**: Microtransiciones suaves y skeletons durante carga

### Secciones Implementadas

#### 1. Header con Saludo Personalizado
- Saludo: "Hola, {firstName}"
- Subtítulo: "Este es tu espacio de crecimiento"
- Anillo de progreso con porcentaje de tareas completadas
- Indicador de créditos (si están habilitados)

#### 2. Acciones Rápidas
- **Acción primaria**: Comenzar/Continuar autoevaluación
- **Acciones secundarias**: Ver reportes, canjear evaluaciones
- Solo una acción primaria visible a la vez

#### 3. Mi Autodiagnóstico
- Estados: No iniciado / En curso / Completado
- Barra de progreso para evaluaciones en curso
- Selector de plantillas
- CTAs contextuales (Comenzar/Continuar/Repetir)

#### 4. Evaluar a otras personas (180/360)
- Lista de máximo 3 tareas asignadas
- Info: avatar, nombre, rol (peer/manager/direct), deadline, estado
- Indicadores visuales de urgencia (fechas próximas en amarillo/rojo)
- Barras de progreso para evaluaciones en curso

#### 5. Mis Informes
- Cards de reportes con badges de tipo (Auto/180°/360°)
- Fechas relativas ("Ayer", "Hace 3 días")
- Menús desplegables con opciones:
  - Descargar PDF (solo si `VITE_FEATURE_PDF=true`)
  - Compartir enlace
- Puntuaciones mostradas (X/10)

#### 6. Actividad Reciente
- Timeline de 5 eventos más recientes
- Tipos: report_ready, invitation_sent, evaluation_assigned, reminder, evaluation_completed
- Fechas relativas automáticas
- Indicadores de no leído (puntos azules)
- CTAs contextuales para acciones rápidas

#### 7. Panel de Líder (Condicional)
- **Solo si**: `isLeader=true` Y `VITE_FEATURE_ORG=true`
- Métricas: Procesos activos, progreso promedio, pendientes
- Barra de progreso del equipo con colores dinámicos
- CTAs: Dashboard Analytics, Crear proceso 360°

## 🔧 Implementación Técnica

### Estructura de Archivos
```
src/
├── components/home/
│   ├── HomeDashboard.jsx           # Componente principal
│   ├── HeaderGreeting.jsx          # Header con saludo y progreso
│   ├── QuickActions.jsx            # Acciones rápidas
│   ├── CardSelfAssessment.jsx      # Card de autoevaluación
│   ├── CardAssignedEvaluations.jsx # Card de evaluaciones asignadas
│   ├── CardMyReports.jsx           # Card de reportes
│   ├── CardRecentActivity.jsx      # Card de actividad
│   ├── CardLeaderPanel.jsx         # Panel de líder (condicional)
│   ├── ProgressRing.jsx            # Anillo de progreso
│   └── SkeletonCard.jsx            # Loading states
└── hooks/
    ├── useFeatureFlags.js          # Hook para feature flags
    ├── useAssignedTasks.js         # Hook para tareas asignadas (stub)
    ├── useReports.js               # Hook para reportes (stub)
    └── useRecentActivity.js        # Hook para actividad (stub)
```

### Hooks Stubs Implementados

#### useFeatureFlags()
```javascript
const { 
  orgEnabled, pdfEnabled, creditsEnabled, debugEnabled 
} = useFeatureFlags();
```

#### useAssignedTasks()
```javascript
const { 
  items, total, loading, error, refreshTasks 
} = useAssignedTasks();
```

#### useReports()
```javascript
const { 
  items, total, loading, error, refreshReports 
} = useReports();
```

#### useRecentActivity()
```javascript
const { 
  events, loading, error, formatRelativeDate, markAsRead 
} = useRecentActivity();
```

## 🎛️ Feature Flags Respetados

- **VITE_FEATURE_ORG**: Controla panel de líder y herramientas org
- **VITE_FEATURE_PDF**: Controla opción "Descargar PDF" en reportes
- **VITE_FEATURE_CREDITS**: Controla indicador de créditos y CTA canjear
- **VITE_DEBUG_LOGS**: Controla badge "Staging" en footer

## 📱 Responsividad

### Mobile (< 768px)
- Cards apiladas verticalmente
- Quick Actions grid 2×2
- Header adaptado con stats verticales
- Espaciado reducido (16px)

### Desktop (≥ 768px)
- Layout 2 columnas: Izq (self + assigned), Der (reports + activity + leader)
- Quick Actions horizontales
- Espaciado completo (24-32px)

### Large Desktop (≥ 1200px)
- Proporción optimizada 2fr : 1.5fr
- Max-width 1400px centrado

## ♿ Accesibilidad

- **Contraste AA**: Colores verificados para legibilidad
- **aria-label**: En botones y enlaces importantes
- **aria-expanded**: En menús desplegables
- **aria-hidden**: En iconos decorativos
- **Focus visible**: Bordes azules en elementos focusables
- **Navegación por teclado**: Soportada en todos los controles

## 🧪 Estados Manejados

### Loading States
- Skeletons animados con efecto shimmer
- Carga inmediata de estructura
- Datos cargados en paralelo

### Empty States
- Iconos descriptivos y mensajes claros
- Guías para primeros pasos
- Sin estados "fríos" o vacíos

### Error States  
- Iconos de advertencia
- Mensajes informativos
- Opciones de reintento (futuro)

## 🚀 Próximos Pasos (TODOs)

### Hooks - Conectar Backend Real
- [ ] `useAssignedTasks`: Conectar con Firestore para obtener evaluaciones asignadas
- [ ] `useReports`: Integrar con reportService para obtener reportes reales  
- [ ] `useRecentActivity`: Implementar servicio de notificaciones/actividad
- [ ] `useUserProfile`: Expandir con datos de liderazgo y permisos reales

### Funcionalidades
- [ ] Implementar descarga de PDF real
- [ ] Sistema de compartir enlaces
- [ ] Notificaciones push para recordatorios
- [ ] Métricas reales de progreso organizacional
- [ ] Sistema de onboarding para nuevos usuarios

### Performance
- [ ] Lazy loading de componentes pesados
- [ ] Optimización de imágenes y assets
- [ ] Service worker para cache offline
- [ ] Métricas de Core Web Vitals

## 📈 Métricas de Éxito

### UX Objetivos
- Tiempo hasta primera acción: < 3 segundos
- Tasa de finalización de autoevaluación: > 80%
- Engagement con reportes: > 60%

### Performance
- Lighthouse Accessibility: ≥ 90
- Lighthouse Performance: ≥ 90 (dev aproximado)
- First Contentful Paint: < 1.5s

---

**Implementado**: 2025-09-21  
**Versión**: v1.0  
**Estado**: ✅ Completado y funcional
