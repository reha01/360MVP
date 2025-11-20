# Documentación: Módulos de Organización y Miembros

## 📋 Índice
1. [Módulo de Organización](#módulo-de-organización)
2. [Módulo de Miembros](#módulo-de-miembros)
3. [Integración entre Módulos](#integración-entre-módulos)
4. [Modelos de Datos](#modelos-de-datos)
5. [Servicios Backend](#servicios-backend)

---

## 🏢 Módulo de Organización

### **Ubicación**
- **Componente Principal**: `src/components/organization/OrganizationManager.jsx`
- **Estilos**: `src/components/organization/OrganizationManager.css`
- **Ruta**: `/gestion/organizacion`
- **Acceso**: Menú "Gestión" → "Organización" (primer elemento del menú)

### **Arquitectura General**

El módulo de Organización es un componente unificado que combina dos funcionalidades principales:
1. **Estructura Organizacional (Áreas)**
2. **Familias de Puestos (Job Families)**

Ambas funcionalidades están integradas en una sola página con navegación por pestañas (tabs) para mejorar la UX.

### **Características Principales**

#### **1. Navegación por Pestañas**
- **Toggle Principal**: Dos botones para alternar entre "Áreas" y "Familias de Puestos"
- **Estado Visual**: El botón activo se resalta con estilo diferente
- **Sin Iconos**: Los botones de toggle no incluyen iconos (solo texto)

#### **2. Tarjetas de Estadísticas**
- **Áreas**: Muestra el total de áreas creadas
- **Job Families**: Muestra el total de familias de puestos creadas
- **Diseño**: Cards con hover effect y tooltips informativos

#### **3. Ayuda Contextual**
- **Componente**: `HelpInstructions` (botón flotante de ampolleta 💡)
- **Contenido**: Explica la diferencia entre Áreas y Job Families
- **Flujo Recomendado**: Guía al usuario sobre el orden correcto de configuración

---

### **Sección: Estructura Organizacional (Áreas)**

#### **Vista Principal**
- **Tabla Simplificada**: Diseño limpio con columnas esenciales
- **Columnas**:
  - **Nombre**: Nombre del área
  - **Usuarios Asignados**: Contador de usuarios asociados al área
  - **Acciones**: Botones de editar y eliminar (iconos de `lucide-react`)

#### **Funcionalidades CRUD**

##### **Crear Área**
- **Botón**: "Crear Área" (pequeño, visible en header y en estado vacío)
- **Modal**: `AreaForm` component
- **Campos**:
  - **Nombre** (requerido): Texto libre
  - **Descripción** (opcional): Textarea
- **Validación**: Nombre requerido, longitud mínima/máxima
- **Servicio**: `orgStructureService.createArea()`

##### **Editar Área**
- **Acción**: Click en icono de lápiz (Pencil) en la columna "Acciones"
- **Modal**: Mismo `AreaForm` con datos precargados
- **Servicio**: `orgStructureService.updateArea()`

##### **Eliminar Área**
- **Acción**: Click en icono de basura (Trash2) en la columna "Acciones"
- **Validación**: Verifica que no tenga usuarios asignados
- **Confirmación**: Dialog de confirmación antes de eliminar
- **Soft Delete**: Marca `isActive: false` en lugar de eliminar físicamente
- **Servicio**: `orgStructureService.deleteArea()`

#### **Estado Vacío**
- **Mensaje**: "No hay áreas creadas"
- **Botón**: "Crear Área" (mismo estilo que el del header)

#### **Iconos de Acciones**
- **Editar**: `Pencil` de `lucide-react` (color: `#0dcaf0`)
- **Eliminar**: `Trash2` de `lucide-react` (color: `#dc2626`)
- **Hover Effect**: Fondo suave al pasar el mouse

---

### **Sección: Familias de Puestos (Job Families)**

#### **Vista Principal**
- **Tabla Simplificada**: Mismo diseño que la sección de Áreas
- **Columnas**:
  - **Nombre**: Nombre de la Job Family
  - **Usuarios Asignados**: Contador de usuarios asociados
  - **Acciones**: Botones de editar y eliminar

#### **Funcionalidades CRUD**

##### **Crear Job Family**
- **Botón**: "Crear Job Family" (pequeño, visible en header)
- **Modal**: `JobFamilyForm` component
- **Campos Simplificados**:
  - **Nombre** (requerido): Texto libre
  - **Descripción** (opcional): Textarea
- **Campos Eliminados** (simplificación UX):
  - ❌ Nivel Jerárquico
  - ❌ Configuración de Evaluadores (self, manager, peers, subordinates)
  - ❌ Mapeo de Tests
- **Valores por Defecto**: El servicio asigna valores por defecto para campos técnicos
- **Servicio**: `jobFamilyService.createJobFamily()`

##### **Editar Job Family**
- **Acción**: Click en icono de lápiz
- **Modal**: Mismo `JobFamilyForm` con datos precargados
- **Servicio**: `jobFamilyService.updateJobFamily()`

##### **Eliminar Job Family**
- **Acción**: Click en icono de basura
- **Validación**: Verifica que no tenga usuarios asignados
- **Confirmación**: Dialog de confirmación
- **Soft Delete**: Marca `isActive: false`
- **Servicio**: `jobFamilyService.deleteJobFamily()`

#### **Filtrado de Job Families Activas**
- **Lógica**: Solo muestra Job Families con `isActive === true`
- **Filtro Estricto**: Excluye documentos con `isActive: false`, `undefined` o `null`

---

### **Estilos y Diseño**

#### **Consistencia Visual**
- **Base**: Replica el diseño de `BulkActionsManager` y `MemberManager`
- **Colores**: 
  - Primario: `#0d6efd` (azul)
  - Info: `#0dcaf0` (cyan)
  - Peligro: `#dc2626` (rojo)
- **Tipografía**: Sistema de fuentes estándar (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)

#### **Componentes Reutilizables**
- **Modal**: `src/components/ui/Modal.jsx`
- **HelpInstructions**: `src/components/ui/HelpInstructions.jsx`
- **Alert/Spinner**: Componentes inline simples

#### **Responsive Design**
- **Desktop**: Grid de 2 columnas para stats
- **Mobile**: Stack vertical, tablas con scroll horizontal

---

### **Servicios Utilizados**

#### **orgStructureService**
- `getOrgAreas(orgId)`: Obtiene todas las áreas activas
- `getOrgUsers(orgId)`: Obtiene usuarios de la organización
- `createArea(orgId, areaData, userId)`: Crea nueva área
- `updateArea(orgId, areaId, areaData, userId)`: Actualiza área existente
- `deleteArea(orgId, areaId, userId)`: Soft delete de área
- `getChildAreas(orgId, parentId)`: Obtiene áreas hijas (con fallbacks para índices)
- `getUsersByArea(orgId, areaId)`: Obtiene usuarios por área

#### **jobFamilyService**
- `getOrgJobFamilies(orgId)`: Obtiene todas las Job Families activas
- `createJobFamily(orgId, jobFamilyData, userId)`: Crea nueva Job Family
- `updateJobFamily(orgId, familyId, jobFamilyData, userId)`: Actualiza Job Family
- `deleteJobFamily(orgId, familyId, userId)`: Soft delete de Job Family

#### **Manejo de Índices de Firestore**
- **Estrategia**: Consultas con fallback en cascada
  1. Intenta consulta con índice compuesto
  2. Si falla, intenta consulta más simple
  3. Si falla, carga todos y filtra/ordena en memoria
- **Objetivo**: Prevenir errores de "Missing index" y mejorar UX

---

## 👥 Módulo de Miembros

### **Ubicación**
- **Componente Principal**: `src/components/members/MemberManager.jsx`
- **Estilos**: `src/components/members/MemberManager.css`
- **Ruta**: `/gestion/miembros`
- **Acceso**: Menú "Gestión" → "Miembros" (segundo elemento del menú)

### **Arquitectura General**

El módulo de Miembros permite gestionar todos los usuarios/miembros de la organización, incluyendo:
- Visualización de miembros
- Importación masiva desde CSV/Excel
- Exportación a Excel
- Edición individual
- Eliminación (soft delete)
- Asignación de Áreas y Job Families

### **Características Principales**

#### **1. Tarjetas de Estadísticas**
- **TOTAL MIEMBROS**: Contador total de miembros
- **ACTIVOS**: Contador de miembros con `isActive !== false`
- **INACTIVOS**: Contador de miembros con `isActive === false`

#### **2. Secciones de Importación y Exportación**

##### **Layout Side-by-Side**
- **Grid de 2 Columnas**: "Importar Miembros" y "Exportar Miembros" están lado a lado
- **Misma Altura**: Ambas cards tienen la misma altura visual
- **Responsive**: En móviles se apilan verticalmente

##### **Importar Miembros**
- **Descripción**: "Descarga la plantilla CSV, complétala con los datos de tus miembros y súbela aquí"
- **Botones**:
  - **"Descargar Plantilla"**: Genera Excel dinámico con 2 hojas
  - **"Subir"**: Sube archivo CSV para importación
- **Indicador de Progreso**: Muestra "Importando miembros..." durante el proceso

##### **Exportar Miembros**
- **Descripción**: "Exporta todos los miembros actuales a un archivo Excel"
- **Botón**: "Exportar" (genera Excel con todos los miembros actuales)
- **Visibilidad**: Solo se muestra si hay miembros registrados

#### **3. Tabla de Miembros**

##### **Columnas**
1. **Nombre**: Nombre completo (name + lastNamePaternal + lastNameMaternal)
2. **Correo**: Email o workEmail
3. **Rol**: Role o memberRole (solo lectura para Org Admins, editable solo por Super Admin)
4. **Cargo**: Job Title (texto libre, opcional)
5. **Job Family**: Nombre de la Job Family asignada (obtenido de `jobFamilyName`, `jobFamilyId`, o `jobFamilyIds`)
6. **Área**: Nombre del área asignada (obtenido de `area`, `areaName`, `unit`, o `department`)
7. **Estado**: Badge "Activo" (verde) o "Inactivo" (rojo)
8. **Acciones**: Iconos de editar (✏️) y eliminar (🗑️)

##### **Paginación**
- **Activación**: Solo se muestra si hay más de 10 miembros
- **Opciones**: 10 o 50 elementos por página (dropdown)
- **Controles**:
  - Botón "Anterior" (deshabilitado en primera página)
  - Indicador "Página X de Y"
  - Botón "Siguiente" (deshabilitado en última página)
  - Contador "Mostrando X de Y miembros"
- **Reset**: Al cambiar el tamaño de página, vuelve a la página 1

##### **Filas Delgadas**
- **Padding**: `8px 12px` (reducido para filas más compactas)
- **Altura**: Filas más delgadas para mejor visualización

---

### **Funcionalidades Detalladas**

#### **1. Descargar Plantilla (Smart Template)**

##### **Formato**: Excel (.xlsx) con 2 hojas

##### **Hoja 1: "Plantilla"**
- **Columnas**:
  - **Email** (requerido)
  - **Nombre** (requerido)
  - **Apellido Paterno** (opcional)
  - **Apellido Materno** (opcional)
  - **Cargo** (opcional): Job Title (texto libre)
  - **Job Family** (opcional): Debe coincidir exactamente con nombres de la hoja "Referencia"
  - **Área** (opcional): Debe coincidir exactamente con nombres de la hoja "Referencia"
- **Nota**: La columna "Rol" fue eliminada (todos los usuarios importados tienen rol `member` por defecto)

##### **Hoja 2: "Referencia"**
- **Sección 1**: Lista de Roles disponibles (solo informativo, no se usa en importación)
- **Sección 2**: Lista de Job Families existentes (para copiar/pegar nombres exactos)
- **Sección 3**: Lista de Áreas existentes (para copiar/pegar nombres exactos)
- **Objetivo**: Evitar errores de importación por nombres incorrectos

##### **Implementación**
- **Librería**: `xlsx` (SheetJS)
- **Función**: `downloadTemplate()` en `MemberManager.jsx`
- **Datos Dinámicos**: Carga Job Families y Áreas desde la base de datos

#### **2. Importación de Miembros**

##### **Proceso**
1. **Upload**: Usuario sube archivo CSV
2. **Validación Local**: 
   - Verifica formato CSV
   - Valida headers requeridos
   - Valida datos de cada fila
3. **Matching de Referencias**:
   - Busca Job Family por nombre (case-insensitive)
   - Busca Área por nombre (case-insensitive)
   - Almacena `jobFamilyId` y `areaId` si encuentra match
4. **Creación de Job de Importación**: 
   - Crea documento en Firestore con estado `pending`
   - Sube CSV a Firebase Storage
5. **Procesamiento Backend**: 
   - Cloud Function `memberImportProcessor` procesa el CSV
   - Crea/actualiza usuarios en Firestore
   - Actualiza estado del job (`processing` → `completed` o `failed`)

##### **Validaciones**
- **Email**: Requerido, formato válido, único en la organización
- **Nombre**: Requerido
- **Job Family**: Si se proporciona, debe existir en la base de datos
- **Área**: Si se proporciona, debe existir en la base de datos
- **Rol**: Ignorado (siempre se asigna `member`)

##### **Errores**
- **Fila con Error**: Se marca como fallida pero no detiene el proceso
- **Resumen**: Al finalizar, se muestra resumen de filas procesadas vs. fallidas

##### **Servicios**
- **Frontend**: `memberImportService.uploadMemberCsv()`
- **Backend**: `360MVP-functions/functions/src/imports/memberImportWorker.js`

#### **3. Exportación de Miembros**

##### **Formato**: Excel (.xlsx)
- **Columnas**: Todas las columnas de la tabla más campos adicionales
- **Datos**: Todos los miembros activos e inactivos
- **Función**: `exportMembersToExcel()` en `MemberManager.jsx`

#### **4. Edición de Miembros**

##### **Modal de Edición**
- **Campos**:
  - **Nombre** (texto)
  - **Apellido Paterno** (texto)
  - **Apellido Materno** (texto)
  - **Email** (texto, requerido)
  - **Rol** (select):
    - **Org Admin**: Solo lectura (no puede modificar)
    - **Super Admin**: Editable (puede cambiar roles)
  - **Cargo** (texto libre, opcional): Job Title
  - **Job Family** (dropdown): Carga Job Families desde `jobFamilyService`
  - **Área** (dropdown): Carga Áreas desde `orgStructureService`
  - **Estado** (checkbox): Activo/Inactivo

##### **Validaciones**
- Email único en la organización
- Campos requeridos no vacíos

##### **Servicio**: `updateDoc()` en Firestore directamente

#### **5. Eliminación de Miembros**

##### **Proceso**
- **Confirmación**: Dialog de confirmación antes de eliminar
- **Soft Delete**: Marca `isActive: false` (no elimina físicamente)
- **Servicio**: `deleteDoc()` en Firestore (eliminación física)

---

### **Modelo de Datos de Miembros**

#### **Campos Principales**
```javascript
{
  // Identificadores
  id: string,                    // Document ID
  email: string,                 // Email (requerido, único)
  workEmail: string,            // Email alternativo
  
  // Información Personal
  name: string,                  // Nombre (requerido)
  lastNamePaternal: string,     // Apellido paterno
  lastNameMaternal: string,     // Apellido materno
  displayName: string,          // Nombre completo calculado
  
  // Organización
  orgId: string,                // ID de la organización
  role: string,                 // Rol (default: 'member')
  memberRole: string,           // Rol alternativo
  
  // Estructura Organizacional
  area: string,                 // Nombre del área (legacy)
  areaName: string,            // Nombre del área (nuevo)
  areaId: string,              // ID del área (nuevo)
  unit: string,                // Unidad (legacy)
  department: string,           // Departamento (legacy)
  
  // Job Family
  jobTitle: string,            // Cargo/Job Title (texto libre)
  jobFamilyName: string,       // Nombre de Job Family
  jobFamilyId: string,        // ID de Job Family (nuevo)
  jobFamilyIds: string[],     // Array de IDs (legacy, compatibilidad)
  
  // Estado
  isActive: boolean,           // Activo/Inactivo (default: true)
  
  // Metadatos
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  updatedBy: string,
  importedBy: string,         // Si fue importado
  invitationCount: number,    // Contador de invitaciones
  deactivatedAtDate: Date     // Fecha de desactivación
}
```

#### **Evolución del Modelo**
- **Legacy**: `area`, `unit`, `department` (solo nombres)
- **Nuevo**: `areaId`, `areaName` (ID + nombre para integridad)
- **Job Family**: Similar evolución de `jobFamilyIds[]` a `jobFamilyId` + `jobFamilyName`

---

### **Estilos y Diseño**

#### **Botones**
- **Tamaño**: Pequeños y compactos
- **Padding**: `4px 10px`
- **Font Size**: `12px`
- **Clases**: `btn-action btn-primary` (consistente con "Organización")
- **Texto Acortado**: "Subir" (en lugar de "Subir CSV"), "Exportar" (en lugar de "Exportar a Excel")

#### **Tabla**
- **Filas Delgadas**: Padding `8px 12px`
- **Headers**: Padding `8px 12px`
- **Hover**: Fondo gris claro al pasar el mouse

#### **Cards de Importación/Exportación**
- **Grid**: 2 columnas lado a lado
- **Altura**: Misma altura para ambas cards
- **Gap**: `16px` entre cards

---

### **Servicios Utilizados**

#### **orgStructureServiceWrapper**
- `getOrgUsers(orgId)`: Obtiene todos los usuarios de la organización

#### **orgStructureService**
- `getOrgAreas(orgId)`: Obtiene áreas para dropdown

#### **jobFamilyService**
- `getOrgJobFamilies(orgId)`: Obtiene Job Families para dropdown

#### **memberImportService**
- `uploadMemberCsv(orgId, file)`: Sube CSV y crea job de importación
- `createImportJob(orgId, jobData)`: Crea job en Firestore
- `subscribeToImportJobs(orgId, callback, limit)`: Suscripción a jobs de importación

#### **roleService**
- `getOrgRoles(orgId)`: Obtiene roles disponibles
- `validateRole(role)`: Valida rol
- `normalizeRole(role)`: Normaliza rol (siempre retorna 'member' para importación)

---

## 🔗 Integración entre Módulos

### **Flujo Recomendado**
1. **Configurar Organización**:
   - Crear Áreas (departamentos)
   - Crear Job Families (categorías de evaluación)
2. **Importar Miembros**:
   - Descargar plantilla Excel (incluye referencias de Áreas y Job Families)
   - Completar plantilla con datos de miembros
   - Subir CSV para importación
3. **Gestionar Miembros**:
   - Editar miembros individuales
   - Asignar/actualizar Áreas y Job Families
   - Activar/desactivar miembros

### **Dependencias**
- **Miembros → Organización**: Los miembros requieren que existan Áreas y Job Families antes de asignarlas
- **Validación**: El importador valida que los nombres de Área y Job Family existan en la base de datos

### **Consistencia de Datos**
- **IDs y Nombres**: Se almacenan tanto `areaId`/`jobFamilyId` como `areaName`/`jobFamilyName` para integridad
- **Soft Delete**: Las Áreas y Job Families eliminadas (`isActive: false`) no aparecen en dropdowns pero los miembros pueden mantener referencias

---

## 📊 Modelos de Datos

### **Área (OrgStructure)**
```javascript
{
  id: string,                    // Document ID (auto-generado)
  orgId: string,                 // ID de la organización
  name: string,                  // Nombre del área (requerido)
  description: string,           // Descripción (opcional)
  level: number,                 // Nivel jerárquico (ORG_LEVELS)
  parentId: string | null,       // ID del área padre (opcional)
  managerId: string | null,     // ID del manager (opcional)
  isActive: boolean,            // Activo/Inactivo (default: true)
  memberCount: number,          // Contador de miembros
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  updatedBy: string
}
```

### **Job Family**
```javascript
{
  id: string,                    // Document ID (auto-generado)
  familyId: string,              // ID alternativo (legacy)
  orgId: string,                 // ID de la organización
  name: string,                  // Nombre (requerido)
  description: string,           // Descripción (opcional)
  level: number,                 // Nivel jerárquico (JOB_LEVELS, default: INDIVIDUAL_CONTRIBUTOR)
  isActive: boolean,            // Activo/Inactivo (default: true)
  memberCount: number,          // Contador de miembros
  // Campos técnicos (asignados por defecto si no se proporcionan)
  testMappings: {
    recommended: string[],
    allowed: string[],
    excluded: string[]
  },
  evaluatorConfig: {
    requireSelf: boolean,
    requireManager: boolean,
    peersMin: number,
    peersMax: number,
    subordinatesMin: number
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  updatedBy: string
}
```

---

## 🔧 Servicios Backend

### **orgStructureService.js**

#### **Funciones Principales**
- `getOrgAreas(orgId)`: Obtiene áreas con fallback de índices
- `getOrgUsers(orgId)`: Obtiene usuarios con fallback de índices
- `createArea(orgId, areaData, userId)`: Crea área usando `addDoc()`
- `updateArea(orgId, areaId, areaData, userId)`: Actualiza área
- `deleteArea(orgId, areaId, userId)`: Soft delete (marca `isActive: false`)
- `getChildAreas(orgId, parentId)`: Obtiene áreas hijas con fallback
- `getUsersByArea(orgId, areaId)`: Obtiene usuarios por área con fallback

#### **Estrategia de Fallback para Índices**
1. Intenta consulta con índice compuesto (ej: `where('isActive', '==', true).orderBy('name')`)
2. Si falla, intenta consulta más simple (ej: solo `where('isActive', '==', true)`)
3. Si falla, carga todos los documentos y filtra/ordena en memoria
4. Retorna array vacío en caso de error (no lanza excepción)

### **jobFamilyService.js**

#### **Funciones Principales**
- `getOrgJobFamilies(orgId)`: Obtiene Job Families con fallback de índices
- `createJobFamily(orgId, jobFamilyData, userId)`: Crea Job Family usando `addDoc()`
- `updateJobFamily(orgId, familyId, jobFamilyData, userId)`: Actualiza Job Family
- `deleteJobFamily(orgId, familyId, userId)`: Soft delete (marca `isActive: false`)

#### **Filtrado Estricto**
- Solo retorna Job Families con `isActive === true` (excluye `undefined`, `null`, `false`)

### **memberImportWorker.js (Cloud Function)**

#### **Ubicación**
- `360MVP-functions/functions/src/imports/memberImportWorker.js`

#### **Trigger**
- Firebase Storage: Se activa cuando se sube un CSV a `member-imports/{orgId}/{jobId}.csv`

#### **Proceso**
1. **Parse CSV**: Usa `csv-parser` para leer el archivo
2. **Validación**: Valida cada fila
3. **Matching**:
   - Busca Job Family por nombre (case-insensitive)
   - Busca Área por nombre (case-insensitive)
4. **Creación/Actualización**:
   - Si el usuario existe (por email), actualiza
   - Si no existe, crea nuevo usuario en Firebase Auth y Firestore
5. **Rol**: Siempre asigna `role = 'member'` (ignora cualquier valor del CSV)
6. **Actualización de Job**: Actualiza estado del job en Firestore

#### **Campos Procesados**
- `email`, `name`, `lastNamePaternal`, `lastNameMaternal`
- `jobTitle` (Cargo)
- `jobFamilyName` → `jobFamilyId` + `jobFamilyName`
- `areaName` → `areaId` + `areaName`

---

## 🎨 UI/UX Consistente

### **Principios de Diseño**
1. **Consistencia**: Mismo estilo visual entre "Organización", "Miembros" y "Acciones Masivas"
2. **Simplicidad**: Formularios simplificados (solo campos esenciales)
3. **Feedback**: Indicadores claros de estado (loading, success, error)
4. **Ayuda Contextual**: `HelpInstructions` en página de Organización

### **Colores y Estilos**
- **Primario**: `#0d6efd` (azul)
- **Info**: `#0dcaf0` (cyan)
- **Peligro**: `#dc2626` (rojo)
- **Éxito**: Verde (badges de estado)
- **Fondo**: `#f8f9fa` (gris claro)
- **Cards**: Blanco con borde `#dee2e6`

### **Componentes Reutilizables**
- `Modal`: Para formularios y confirmaciones
- `HelpInstructions`: Para ayuda contextual
- `Alert`: Para mensajes de error/success
- `Spinner`: Para estados de carga

---

## 📝 Notas Técnicas

### **Firestore Collections**
- **Áreas**: `organizations/{orgId}/orgStructure`
- **Job Families**: `organizations/{orgId}/jobFamilies`
- **Miembros**: `members` (colección raíz, con `orgId` como campo)

### **Índices Requeridos**
Aunque los servicios tienen fallbacks, se recomienda crear índices compuestos para mejor rendimiento:
- `organizations/{orgId}/orgStructure`: `isActive` + `name`
- `organizations/{orgId}/jobFamilies`: `isActive` + `level` + `name`
- `members`: `orgId` + `isActive` + `displayName`

### **Soft Delete**
- Tanto Áreas como Job Families usan soft delete (`isActive: false`)
- Los miembros pueden usar eliminación física o soft delete según el caso

### **Performance**
- **Carga Paralela**: `Promise.allSettled()` para cargar datos en paralelo
- **Paginación**: Solo muestra 10 o 50 miembros a la vez
- **Lazy Loading**: Los dropdowns cargan datos solo cuando se necesitan

---

## 🔄 Cambios Recientes (Resumen)

### **Organización**
1. ✅ Unificación de "Estructura Org" y "Job Families" en una sola página
2. ✅ Simplificación de formularios (solo Nombre y Descripción)
3. ✅ Eliminación de columnas innecesarias (Nivel)
4. ✅ Iconos de acciones (Pencil, Trash2)
5. ✅ Botones pequeños y consistentes
6. ✅ Filtrado estricto de elementos activos

### **Miembros**
1. ✅ Separación de "Cargo" (Job Title) y "Job Family"
2. ✅ Plantilla Excel dinámica con hoja de referencia
3. ✅ Eliminación de campo "Rol" del importador (siempre `member`)
4. ✅ Paginación (10 o 50 elementos)
5. ✅ Filas delgadas en tabla
6. ✅ Botones compactos
7. ✅ Layout side-by-side para Importar/Exportar
8. ✅ Columna "Job Family" en tabla
9. ✅ Renombrado de "ÁREA / UNIDAD" a "ÁREA"

---

## 📚 Referencias

### **Archivos Clave**
- `src/components/organization/OrganizationManager.jsx`
- `src/components/organization/OrganizationManager.css`
- `src/components/members/MemberManager.jsx`
- `src/components/members/MemberManager.css`
- `src/services/orgStructureService.js`
- `src/services/jobFamilyService.js`
- `src/services/memberImportService.js`
- `360MVP-functions/functions/src/imports/memberImportWorker.js`

### **Componentes Relacionados**
- `src/components/org/AreaForm.jsx`
- `src/components/jobfamily/JobFamilyForm.jsx`
- `src/components/ui/Modal.jsx`
- `src/components/ui/HelpInstructions.jsx`

---

**Última Actualización**: Diciembre 2024
**Versión**: 1.0

