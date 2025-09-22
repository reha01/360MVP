# Dashboard UX - Documentación

## 🏗️ Reestructuración del Dashboard

El dashboard ha sido completamente reestructurado con un **layout sidebar + contenido central** para mejorar la jerarquía visual, legibilidad y experiencia de usuario.

## 🎨 Tokens de Diseño

### Tipografía
- **Familia**: Inter (fallback: SF Pro, system fonts)
- **H1**: 28-32px, font-weight 600
- **H2**: 20-22px, font-weight 600  
- **Botones**: 15px, font-weight 500 (no bold)
- **Body**: 15-16px, font-weight 400/500, line-height ≥ 1.5

### Colores
- **Fondo**: `#F8FAFC` (gris muy suave)
- **Texto**: `#0B0F14` (casi negro)
- **Bordes**: `#E5E7EB` (gris neutro)
- **Primario**: `#0A84FF` (azul sistema, tono 500-600)
- **Cards**: fondo blanco, sombra `0 1px 2px rgba(0,0,0,0.04)`

### Espaciado
- **Secciones**: 24-32px
- **Entre elementos**: 16-20px
- **Cards**: radius 16-20px
- **Botones**: radius 12px

### Accesibilidad
- **Contraste**: Cumple AA en todos los textos
- **Focus**: Rings azules visibles `0 0 0 3px rgba(10,132,255,0.1)`
- **Targets**: Mínimo 40px para elementos clickeables

## 🧩 Arquitectura de Componentes

### Layout Principal
```
src/layouts/AppShell.jsx          # Container principal con sidebar + header + content
src/components/nav/SideNav.jsx    # Navegación lateral colapsable
src/components/nav/TopBar.jsx     # Header con saludo + búsqueda + badges
```

### Componentes UI Reutilizables
```
src/components/ui/
├── Button.jsx        # Variantes: primary, secondary, ghost, danger
├── Card.jsx          # + CardHeader, CardTitle, CardContent, CardFooter
├── Badge.jsx         # Micro-acentos en varios colores
├── Progress.jsx      # Barras + anillos circulares
├── EmptyState.jsx    # Estados vacíos elegantes
├── Skeleton.jsx      # Loading states animados
└── index.js          # Exports centralizados
```

### Página Home Secciones
```
src/pages/home/
├── Home.jsx                    # Container principal
└── sections/
    ├── HeroMetrics.jsx         # 3 mini-métricas (progreso, tareas, informes)
    ├── SelfAssessmentSection.jsx   # Autoevaluación con estado y CTA
    ├── AssignedEvaluationsSection.jsx  # Evaluaciones 180/360 asignadas
    ├── ReportsSection.jsx      # Mis informes con menús de acción
    ├── RecentActivitySection.jsx   # Timeline de actividad sutil
    └── LeaderAnalyticsSection.jsx  # Panel condicional para líderes
```

## 📱 Layout Responsive

### Desktop (≥769px)
- **Sidebar**: Fija 280px, navegación completa visible
- **Main content**: 2 columnas (2fr + 1fr)
- **Header**: Saludo + búsqueda + acciones

### Mobile (<768px)
- **Sidebar**: Colapsado (drawer offcanvas)
- **Main content**: 1 columna apilada
- **Header**: Hamburger menu + saludo + avatar
- **Overlay**: Fondo oscuro al abrir sidebar

## 🎛️ Navegación y Estados

### Sidebar Navigation
- **Inicio** (🏠) - Dashboard principal
- **Autoevaluación** (🎯) - Evaluación personal
- **Evaluar a otros** (👥) - Tareas 180/360 asignadas
- **Mis informes** (📊) - Reportes generados
- **Analytics** (📈) - Solo si `isLeader && VITE_FEATURE_ORG`
- **Ajustes** (⚙️) - Placeholder deshabilitado
- **Cerrar sesión** (🚪) - Logout funcional

### Estados de Interacción
- **Hover**: Cards levantan con `translateY(-1px)` + sombra
- **Active navigation**: Fondo azul + borde izquierdo + peso 600
- **Loading**: Skeletons animados con shimmer
- **Empty states**: Iconos + mensajes + CTAs opcionales

## 🚫 Principios de Diseño Limpio

### Un Solo CTA Primario
- Solo **un botón primario azul** visible por vista
- Demás acciones son secondary/ghost
- Jerarquía visual clara sin saturación

### Secciones Distinguibles
- Cards con bordes suaves, no "cajas azules" saturadas
- Espaciado generoso para respirar
- Títulos de sección H2 claros

### Estados UX Completos
- ✅ **Loading**: Skeletons inmediatos
- ✅ **Empty**: Mensajes educativos + primeros pasos
- ✅ **Error**: Iconos de advertencia + retry
- ✅ **Success**: Confirmaciones sutiles

## 🎯 Feature Flags Respetados

- **`VITE_FEATURE_ORG`**: Controla Analytics en sidebar + Panel líder
- **`VITE_FEATURE_PDF`**: Controla "Descargar PDF" en reportes
- **`VITE_FEATURE_CREDITS`**: Controla indicador créditos en header
- **`VITE_DEBUG_LOGS`**: Controla badge "Staging" en topbar

## 🧠 Decisiones de UX Clave

### 1. **Layout Sidebar vs TabBar**
**Decisión**: Sidebar fija desktop + colapsable mobile  
**Razón**: Mejor para aplicaciones de productividad, más espacio de navegación, menos clicks para cambiar de sección

### 2. **Cards vs Lista Plana**
**Decisión**: Cards individuales con hover effects  
**Razón**: Mejor agrupación visual, separación clara de contenido, más fácil escaneo

### 3. **Métricas Hero**
**Decisión**: 3 mini-cards horizontales  
**Razón**: Dashboard ejecutivo típico, información clave "above the fold", progreso visual con anillo

### 4. **Navegación Estados**
**Decisión**: Active state con borde izquierdo azul  
**Razón**: Patrón común, no invasivo, clara indicación sin ocupar espacio

### 5. **Responsive Strategy**
**Decisión**: Mobile-first con sidebar drawer  
**Razón**: Mayoría de usuarios móviles, drawer familiar en apps, conserva toda la funcionalidad

## 🔧 Implementación Técnica

### Hooks Stubs
- `useAssignedTasks()` - Mock data, listo para Firestore
- `useReports()` - Mock data, listo para reportService
- `useRecentActivity()` - Mock data, listo para notifications service
- `useFeatureFlags()` - Wrapper para FeatureFlags service

### Routing Anidado
- Todas las rutas protegidas usan `<AppShell />` como layout
- Nested routes con `<Outlet />` para contenido dinámico
- No breaking changes en URLs existentes

### Performance
- Skeletons instantáneos (no spinners)
- Parallel loading de componentes
- CSS-in-JS solo para estilos dinámicos
- Componentes UI reutilizables

---

## 📈 Métricas de Éxito

- **Jerarquía clara**: Usuario comprende "qué hacer" en < 3 segundos
- **Un CTA primario**: Sin confusión de acciones
- **Accesibilidad**: Contraste AA, navegación por teclado
- **Responsive**: Funcional en 320px - 1440px
- **Performance**: Carga instantánea de estructura

**Commit sugerido completado**:
```
feat(ui): sidebar layout + cleaner dashboard (typography, spacing, single CTA, clear sections, leader gate)
```

---

**Implementado**: 2025-09-21  
**Versión**: v2.0  
**Cambio**: Dashboard layout sidebar + UX refinado
