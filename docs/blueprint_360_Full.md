# 📘 SISTEMA DE EVALUACIÓN 360°
## Blueprint Definitivo - Estructura y Funcionalidades

**Versión:** 5.0 FINAL  
**Fecha:** 14 de Octubre, 2025  
**Autor:** Rodrigo Herrera  
**Estado:** Documento de especificación funcional sin código

---

# INTRODUCCIÓN

## Propósito del Sistema

El Sistema de Evaluación 360° es una plataforma profesional diseñada para orquestar procesos evaluativos integrales en organizaciones medianas y grandes. Su objetivo principal es facilitar la recolección, procesamiento y análisis de feedback multi-perspectiva sobre el desempeño y competencias de los colaboradores.

## Visión General

### ¿Qué problema resolvemos?

Las organizaciones enfrentan desafíos significativos al implementar evaluaciones 360°:
- **Complejidad operativa**: Coordinar múltiples evaluadores por cada evaluado
- **Gestión de privacidad**: Mantener anonimato mientras se asegura calidad del feedback
- **Escalabilidad**: Ejecutar procesos para cientos o miles de empleados simultáneamente
- **Análisis comparativo**: Identificar patrones, brechas y oportunidades de desarrollo
- **Flexibilidad**: Adaptar instrumentos a diferentes roles y contextos organizacionales

### Nuestra Solución

Un sistema que separa claramente tres capas fundamentales:

1. **CATÁLOGO** (¿Qué evaluamos?)
   - Instrumentos de evaluación (tests) versionados y reutilizables
   - Familias de puestos (Job Families) con configuraciones específicas
   - Relación inteligente entre perfiles y tests aplicables

2. **OPERACIÓN** (¿Cómo ejecutamos?)
   - Campañas que agrupan múltiples evaluaciones
   - Sesiones 360° individuales por evaluado
   - Sistema automatizado de invitaciones y recordatorios
   - Flujo de trabajo con estados y transiciones controladas

3. **RESULTADOS** (¿Qué obtenemos?)
   - Agregación automática con normalización estadística
   - Reportes comparativos multi-nivel
   - Análisis de brechas y consenso
   - Liberación controlada de resultados

## Diferenciadores Clave

### 1. Orquestación Centrada en el Evaluado
Cada colaborador tiene su **Evaluation360Session** que centraliza:
- El test específico que recibirá
- Sus evaluadores asignados (jefe, pares, subordinados, externos)
- El progreso individual de cada evaluador
- Los resultados agregados y análisis

### 2. Flexibilidad Guiada
- Relación N:M entre Job Families y Tests
- Sistema de recomendaciones: "sugerido", "permitido", "excluido"
- Admin puede elegir dentro de opciones válidas
- Validación estricta previene errores

### 3. Estructura Matricial Nativa
- Soporte para múltiples jefes (funcional, proyecto, matriz)
- Equipos cross-funcionales
- Roles duales o temporales
- Flexibilidad en asignación de evaluadores

### 4. Privacidad Robusta
- Anonimato configurable por tipo de evaluador
- Umbrales mínimos para proteger identidad
- Auditoría completa manteniendo confidencialidad
- Políticas diferenciadas por organización

### 5. Multi-Tenancy Empresarial
- Super Admin gestiona múltiples organizaciones
- Org Admin tiene autonomía dentro de su organización
- Aislamiento completo de datos entre organizaciones
- Personalización por organización manteniendo core común

## Principios de Diseño

### Claridad en Gobernanza
- **Super Admin**: Control total del sistema y organizaciones
- **Org Admin**: Autonomía completa dentro de su organización
- **Manager**: Visibilidad de su equipo directo
- **Evaluado**: Acceso a sus propios resultados cuando se liberan

### Prevención de Errores
- Wizards guiados con validaciones en cada paso
- Reglas por defecto basadas en mejores prácticas
- Vistas previas antes de confirmar acciones críticas
- Mensajes claros sobre consecuencias de acciones

### Trazabilidad y Auditoría
- Versionado inmutable de tests una vez utilizados
- Log completo de cambios y accesos
- Historial de estados y transiciones
- Registro de quién, cuándo y qué modificó

### Performance y Escalabilidad
- Diseñado para 10-500+ organizaciones simultáneas
- Paginación y lazy loading desde el diseño inicial
- Índices optimizados para consultas frecuentes
- Arquitectura preparada para crecimiento

---

# MÓDULO 1: ESTRUCTURA ORGANIZACIONAL Y PERSONAS

## 1.1 Propósito del Módulo

Gestionar la estructura organizacional y las personas que participarán en los procesos de evaluación 360°. Este módulo establece la base sobre la cual operarán todos los demás componentes del sistema.

## 1.2 Conceptos Fundamentales

### Organización
Entidad raíz que representa una empresa o institución completa. Cada organización opera de manera independiente con sus propios datos, configuraciones y usuarios.

**Atributos principales:**
- Identificador único
- Nombre de la organización
- Plan de suscripción (determina límites y funcionalidades)
- Estado (activa, suspendida, prueba)
- Configuraciones globales de privacidad
- Zona horaria por defecto
- Idioma preferido

### Estructura Jerárquica
Cada organización puede definir hasta 3 niveles de estructura:

**Nivel 1 - Organización**
- Representa la empresa completa
- Contiene todas las áreas y departamentos

**Nivel 2 - Área/División** (opcional)
- Agrupaciones principales (ej: Comercial, Operaciones, Finanzas)
- Pueden tener su propio responsable de área
- Permiten segmentación de campañas y reportes

**Nivel 3 - Departamento/Equipo** (opcional)
- Subdivisiones dentro de las áreas
- Unidad mínima de agrupación
- Facilita asignación de evaluadores del mismo equipo

### Persona/Usuario
Representa a un colaborador de la organización que puede participar como evaluado y/o evaluador.

**Atributos esenciales:**
- Información básica: nombre, email, ID empleado
- Cargo actual (Job Title)
- Familia de puesto (Job Family) - puede tener múltiples
- Ubicación en estructura (área, departamento)
- Relaciones jerárquicas (jefes, pares, subordinados)
- Estado (activo, inactivo, licencia)
- Fecha de ingreso a la organización

### Job Family (Familia de Puesto)
Agrupación de roles similares que comparten competencias y criterios de evaluación comunes.

**Características:**
- Define el "tipo" de rol (ej: Gerencia, Ventas, Análisis)
- Vincula con tests apropiados para ese perfil
- Establece reglas de evaluación (mínimos de evaluadores)
- Puede ser global (todas las orgs) o específica de una org

## 1.3 Funcionalidades del Módulo

### 1.3.1 Gestión de Organizaciones (Super Admin)

**Crear Nueva Organización**
- Formulario con datos básicos
- Asignación de plan y límites
- Designación de Org Admin inicial
- Configuración de zona horaria e idioma

**Configurar Estructura Organizacional**
- Definir si usará 1, 2 o 3 niveles
- Crear áreas y departamentos
- Establecer responsables por área
- Organigrama visual navegable

**Administrar Planes y Límites**
- Límite de usuarios activos
- Límite de evaluaciones simultáneas
- Funcionalidades habilitadas/deshabilitadas
- Fecha de renovación/vencimiento

### 1.3.2 Gestión de Personas (Org Admin)

**Alta Individual de Personas**
- Formulario completo con validaciones
- Asignación de Job Family (una o múltiples)
- Ubicación en estructura organizacional
- Definición de relaciones jerárquicas
- Configuración de permisos especiales

**Importación Masiva vía CSV**
- Template descargable con estructura requerida
- Validación previa mostrando:
  - Registros válidos a crear
  - Registros con errores (detalle de cada error)
  - Registros duplicados
- Mapeo inteligente de columnas
- Creación/actualización en lote con rollback en caso de error
- Log detallado de importación

**Gestión de Relaciones**

*Jefes Múltiples (Estructura Matricial):*
- Jefe funcional (principal)
- Jefe de proyecto (temporal o permanente)  
- Jefe matriz (en estructuras complejas)
- Indicador de "jefe evaluador por defecto"

*Equipos y Pares:*
- Asignación automática por departamento
- Ajuste manual para casos especiales
- Grupos cross-funcionales
- Exclusiones específicas

*Subordinados Directos:*
- Detección automática basada en jerarquía
- Confirmación y ajuste manual
- Subordinados funcionales vs. de proyecto

**Vista de Personas**
- Tabla principal con columnas configurables
- Filtros múltiples:
  - Por Job Family
  - Por área/departamento
  - Por estado (activo/inactivo)
  - Por antigüedad
  - Por participación en evaluaciones
- Búsqueda por nombre, email, ID empleado
- Acciones masivas (cambio de área, estado, etc.)
- Exportación a CSV/Excel

**Perfil Detallado de Persona**
- Información completa y editable
- Historial de cambios (cargo, área, jefe)
- Evaluaciones 360° recibidas (historial)
- Evaluaciones donde participó como evaluador
- Gráfico de evolución temporal
- Documentos asociados

### 1.3.3 Gestión de Job Families

**Catálogo Global (Super Admin)**
- Job Families predefinidas del sistema
- Aplicables a todas las organizaciones
- Templates de mejores prácticas
- No editables por Org Admin (solo visualización)

**Catálogo Organizacional (Org Admin)**
- Crear Job Families específicas para su organización
- Duplicar y personalizar del catálogo global
- Configurar para cada Job Family:
  - Nombre e identificador único
  - Descripción y propósito
  - Competencias clave asociadas
  - Tests recomendados (aparecen primero)
  - Tests permitidos (opciones válidas)
  - Tests excluidos (bloqueados)
  - Configuración de evaluadores mínimos

**Configuración Avanzada por Job Family**
- Mínimo de evaluadores por tipo:
  - Pares: mínimo y máximo
  - Subordinados: mínimo requerido
  - Jefe: obligatorio/opcional
  - Externos: permitidos/no permitidos
- Reglas de privacidad específicas
- Ponderación diferenciada por tipo de evaluador

## 1.4 Reglas de Negocio

### Validaciones Críticas
1. **Email único** por organización (puede repetirse entre orgs)
2. **Job Family obligatoria**: Toda persona debe tener al menos una
3. **Jefe requerido** para niveles no directivos (configurable)
4. **Subordinados coherentes**: Si alguien es jefe, debe tener subordinados
5. **Estado activo** para participar en nuevas evaluaciones

### Casos Especiales

**CEO/Director General**
- Puede no tener jefe asignado
- Evaluación 360° solo con pares y subordinados
- Opción de incluir board/directorio como evaluadores externos

**Nuevos Ingresos**
- Período de gracia configurable (ej: no evaluables primeros 3 meses)
- Pueden ser evaluadores antes de ser evaluables
- Indicador visual de "nuevo ingreso"

**Empleados en Transición**
- Cambio de área: mantiene historial
- Promoción: actualiza Job Family
- Reestructuración: reasignación masiva disponible

**Bajas y Licencias**
- Baja: marca como inactivo, no participa en nuevas evaluaciones
- Licencia temporal: estado especial, puede reactivarse
- Evaluaciones en curso: decisión caso por caso (completar/cancelar)

## 1.5 Interfaz de Usuario

### Panel Principal: Gestión de Personas

**Barra de Herramientas**
- Botón "Nueva Persona" (abre wizard)
- Botón "Importar CSV" (abre modal de importación)
- Búsqueda rápida (nombre/email)
- Selector de vista (tabla/cards/organigrama)
- Exportar datos visibles

**Área de Filtros (Panel Lateral)**
- Filtros jerárquicos colapsables
- Contadores en tiempo real
- Filtros guardados (personales/compartidos)
- Resetear filtros

**Tabla de Resultados**
- Columnas configurables y ordenables
- Checkbox para selección múltiple
- Acciones rápidas por fila (editar, ver perfil, crear evaluación)
- Paginación con selector de registros por página
- Indicadores visuales de estado

### Modal: Nueva/Editar Persona

**Wizard de 4 pasos:**

*Paso 1: Información Básica*
- Campos de identificación
- Datos de contacto
- Fecha de ingreso
- Estado inicial

*Paso 2: Ubicación Organizacional*
- Selección de área (dropdown jerárquico)
- Selección de departamento
- Cargo/Job Title
- Job Families (multiselect con principal marcada)

*Paso 3: Relaciones Jerárquicas*
- Asignación de jefe(s)
- Tipo de relación con cada jefe
- Identificación de pares (auto-sugeridos)
- Confirmación de subordinados

*Paso 4: Revisión y Confirmación*
- Resumen de todos los datos
- Validaciones finales
- Warnings si hay inconsistencias
- Confirmación para crear/actualizar

### Vista: Organigrama Interactivo

**Características:**
- Navegación drill-down/up
- Zoom y pan
- Búsqueda con highlight
- Tooltip con información resumida
- Click para ver perfil completo
- Exportar como imagen/PDF

---

# MÓDULO 2: CATÁLOGO DE TESTS Y JOB FAMILIES

## 2.1 Propósito del Módulo

Gestionar el catálogo de instrumentos de evaluación (tests) y su relación con las familias de puestos (Job Families). Este módulo establece QUÉ se evalúa y asegura que cada rol reciba evaluaciones apropiadas a sus responsabilidades.

## 2.2 Conceptos Fundamentales

### Test Definition (Instrumento de Evaluación)
Instrumento estructurado que define qué competencias se evalúan y cómo se miden.

**Arquitectura del Test:**
```
Test
└── Categorías (ej: Liderazgo)
    └── Subdimensiones (ej: Visión Estratégica)
        └── Preguntas (ej: "Define objetivos claros")
            └── Opciones de respuesta (escala 1-5)
```

**Características Clave:**
- **Versionado Inmutable**: Una vez usado, no se puede modificar (se crea nueva versión)
- **Reutilizable**: Un test puede usarse en múltiples campañas y organizaciones
- **Configurable**: Escalas, pesos, reglas condicionales
- **Multi-contexto**: Puede servir para evaluación individual o 360°

### Tipos de Tests

**Por Alcance:**
- **Globales**: Creados por Super Admin, disponibles para todas las orgs
- **Organizacionales**: Creados por Org Admin, exclusivos de su org
- **Derivados**: Copiados de globales y personalizados

**Por Propósito:**
- **Competencias Generales**: Aplicables a múltiples roles
- **Competencias Específicas**: Para Job Families particulares
- **Cultura Organizacional**: Valores y comportamientos
- **Objetivos y Resultados**: Cumplimiento de metas
- **Potencial**: Evaluación de desarrollo futuro

### Relación Test ↔ Job Family

**Modelo N:M Guiado:**
- Una Job Family puede tener múltiples tests asociados
- Un test puede aplicar a múltiples Job Families
- La relación se categoriza en tres niveles:

**1. Tests Recomendados**
- Primera opción mostrada al crear evaluación
- Mejores prácticas para ese rol
- Pre-seleccionados por defecto

**2. Tests Permitidos**
- Opciones alternativas válidas
- Disponibles en dropdown
- Requieren selección manual

**3. Tests Excluidos**
- Bloqueados para esa Job Family
- No aparecen como opción
- Validación estricta impide asignación

## 2.3 Funcionalidades del Módulo

### 2.3.1 Gestión del Catálogo Global (Super Admin)

**Biblioteca de Tests Maestros**
- Tests pre-construidos basados en mejores prácticas
- Categorizados por industria y tipo de organización
- Actualizaciones periódicas con nuevas versiones
- Documentación y guías de aplicación

**Crear/Editar Test Global**
- Designer visual de estructura
- Importación desde Excel/JSON
- Preview en diferentes modos (autoevaluación, 360°)
- Validación de coherencia y completitud

**Configuración de Distribución**
- Visibilidad: todas las orgs vs. orgs específicas
- Licenciamiento: gratuito vs. premium
- Restricciones de uso
- Fecha de vigencia

### 2.3.2 Gestión del Catálogo Organizacional (Org Admin)

**Visualización del Catálogo Disponible**
- Tests globales accesibles
- Tests propios de la organización  
- Filtros por categoría, Job Family, fecha
- Preview detallado de cada test

**Crear Test Organizacional**

*Opción 1: Desde Cero*
- Wizard de creación paso a paso
- Templates como punto de partida
- Constructor de preguntas con banco de ítems
- Configuración de scoring y reglas

*Opción 2: Duplicar y Personalizar*
- Seleccionar test global como base
- Modificar estructura, preguntas, escalas
- Mantener trazabilidad al origen
- Guardar como test organizacional

**Editor de Tests**

*Estructura del Test:*
- Gestión de categorías y subdimensiones
- Orden y agrupación de elementos
- Preguntas obligatorias vs. opcionales
- Lógica condicional entre secciones

*Configuración de Preguntas:*
- Texto de la pregunta (multiidioma)
- Tipo de respuesta:
  - Escala Likert (configurable 3-10 puntos)
  - Selección múltiple
  - Ranking/Ordenamiento
  - Texto abierto (opcional)
- Polaridad (positiva/negativa/neutra)
- Peso en el scoring
- Ayuda contextual para evaluadores

*Configuración de Evaluación 360°:*
- Habilitación para uso en 360° (`is360Enabled`)
- Personalización por tipo de evaluador:
  - Preguntas específicas para jefes
  - Preguntas específicas para pares
  - Preguntas específicas para subordinados
- Umbrales mínimos de respuesta
- Reglas de anonimato

*Scoring y Cálculo:*
- Método de agregación (promedio, mediana, percentiles)
- Normalización de escalas
- Ponderación por categoría
- Ponderación por tipo de evaluador
- Manejo de valores faltantes

### 2.3.3 Configuración de Job Families

**Panel de Job Families**
- Vista de tarjetas o tabla
- Indicadores de uso (cantidad de personas asignadas)
- Estado (activa/inactiva/deprecada)
- Acciones rápidas

**Crear/Editar Job Family**

*Información Básica:*
- Identificador único (sin espacios, inmutable)
- Nombre descriptivo
- Descripción detallada del rol
- Nivel jerárquico típico
- Competencias clave
- Departamentos típicos

*Asociación con Tests:*

**Selector de Tests Recomendados:**
- Búsqueda en catálogo disponible
- Multi-selección con orden de prioridad
- Justificación de la recomendación
- Indicador de versión del test

**Selector de Tests Permitidos:**
- Tests alternativos aceptables
- Casos de uso para cada uno
- Restricciones o consideraciones

**Selector de Tests Excluidos:**
- Tests no apropiados para el rol
- Razón de exclusión
- Prevención de errores

*Reglas de Evaluación:*
- Configuración de evaluadores:
  - ¿Autoevaluación obligatoria?
  - Mínimo de pares (ej: 2-3)
  - Máximo de pares (ej: 5)
  - Mínimo de subordinados (ej: 3)
  - ¿Jefe obligatorio?
  - ¿Permite evaluadores externos?
- Configuración de privacidad por defecto
- Ponderación sugerida por tipo de evaluador

**Validaciones y Reglas:**
- Un test no puede estar en múltiples categorías
- Tests excluidos tienen prioridad absoluta
- Al menos un test recomendado requerido
- Coherencia con nivel jerárquico

### 2.3.4 Versionado de Tests

**Control de Versiones**
- Versiones incrementales (v1, v2, v3...)
- Registro de cambios entre versiones
- Autor y fecha de cada versión
- Motivo del cambio

**Reglas de Inmutabilidad**
- Test en uso = no editable
- Cambios requieren nueva versión
- Evaluaciones en curso continúan con versión original
- Nuevas evaluaciones usan versión más reciente

**Gestión de Versiones**
- Comparador de versiones (diff visual)
- Migración de evaluaciones entre versiones
- Deprecación de versiones antiguas
- Archivo histórico

## 2.4 Casos de Uso Específicos

### Caso 1: Nueva Job Family en la Organización

**Situación:** La empresa crea un nuevo rol "Scrum Master"

**Proceso:**
1. Org Admin crea nueva Job Family "scrum_master"
2. Busca en catálogo tests relacionados con agilidad
3. Asigna como recomendado: "Liderazgo Ágil v2"
4. Asigna como permitidos: "Facilitación", "Gestión de Equipos"
5. Excluye: "Ventas", "Habilidades Técnicas"
6. Define mínimo 3 pares del equipo
7. Guarda y publica

**Resultado:** Al crear evaluación 360° para un Scrum Master, el sistema sugerirá automáticamente "Liderazgo Ágil v2"

### Caso 2: Personalización de Test Global

**Situación:** Test global "Liderazgo" no incluye competencias digitales importantes para la organización

**Proceso:**
1. Org Admin encuentra test "Liderazgo v3" global
2. Selecciona "Duplicar y personalizar"
3. Agrega categoría "Liderazgo Digital"
4. Incluye 5 preguntas sobre transformación digital
5. Ajusta pesos para reflejar importancia
6. Guarda como "Liderazgo Digital ACME v1"
7. Actualiza Job Family "management" para recomendar nueva versión

**Resultado:** Managers de ACME reciben evaluación con componente digital

### Caso 3: Deprecación de Test Obsoleto

**Situación:** Test "Competencias 2020" ya no refleja nuevas prácticas

**Proceso:**
1. Super Admin crea "Competencias 2025 v1"
2. Marca "Competencias 2020" como deprecado
3. Sistema notifica a Org Admins sobre nueva versión
4. Evaluaciones en curso continúan con versión antigua
5. Nuevas evaluaciones no pueden usar versión deprecada
6. Después de 6 meses, versión antigua se archiva

**Resultado:** Transición suave a nuevo instrumento sin afectar procesos en curso

## 2.5 Reglas de Negocio

### Validaciones Críticas

**Para Tests:**
1. Mínimo 1 categoría con 1 pregunta
2. Escalas consistentes dentro del test
3. Identificador único por organización
4. Versionado secuencial obligatorio
5. No eliminar tests con evaluaciones asociadas

**Para Job Families:**
1. Identificador único inmutable
2. Al menos 1 test recomendado
3. Tests mutuamente excluyentes entre categorías
4. Configuración de evaluadores coherente con jerarquía
5. No eliminar con personas asignadas

### Reglas de Visibilidad

**Tests Globales:**
- Super Admin: crear, editar, deprecar
- Org Admin: solo visualizar y copiar
- Usuarios: no tienen acceso

**Tests Organizacionales:**
- Org Admin: control total
- Managers: pueden ver catálogo (no editar)
- Usuarios: no tienen acceso

**Job Families:**
- Mismas reglas que tests
- Usuarios ven su propia Job Family

### Impacto de Cambios

**Modificar Job Family:**
- NO afecta evaluaciones en curso
- Aplica a nuevas evaluaciones inmediatamente
- Notificación a admins de evaluaciones planificadas

**Nueva Versión de Test:**
- Evaluaciones activas continúan con versión anterior
- Nuevas evaluaciones usan versión actual
- Opción de migrar evaluaciones en borrador

## 2.6 Interfaz de Usuario

### Panel Principal: Catálogo de Tests

**Vista de Tarjetas (Default)**
```
┌─────────────────────────────────────┐
│ 🎯 Liderazgo Transformacional v3    │
│ Global • 45 preguntas • 6 categorías│
│ Usado en: 1,234 evaluaciones        │
│ [Ver] [Copiar] [Asignar]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💼 Competencias Comerciales v2      │
│ Organizacional • 30 preguntas        │
│ Para: sales_specialist              │
│ [Editar] [Nueva versión] [Archivar] │
└─────────────────────────────────────┘
```

**Filtros y Búsqueda**
- Por tipo (global/organizacional)
- Por Job Family asociada
- Por categoría temática
- Por estado (activo/deprecado)
- Por frecuencia de uso
- Búsqueda de texto completo

### Modal: Editor de Test

**Diseño de Pestañas:**

*Pestaña 1: Estructura*
- Árbol navegable de categorías
- Drag & drop para reordenar
- Agregar/eliminar elementos
- Copiar/pegar secciones

*Pestaña 2: Preguntas*
- Editor de texto enriquecido
- Banco de preguntas sugeridas
- Preview de diferentes escalas
- Configuración de lógica condicional

*Pestaña 3: Configuración 360°*
- Toggle para habilitar 360°
- Personalización por tipo de evaluador
- Umbrales y reglas
- Configuración de anonimato

*Pestaña 4: Scoring*
- Definición de fórmulas
- Ponderaciones visuales (sliders)
- Simulador con datos de ejemplo
- Rangos de interpretación

*Pestaña 5: Preview y Test*
- Vista previa como evaluador
- Vista previa como evaluado
- Test con datos dummy
- Validación de coherencia

### Panel: Gestión de Job Families

**Tabla Expandible**
```
▼ Management (15 personas)
  Tests recomendados: Liderazgo v3
  Tests permitidos: 3
  Tests excluidos: 2
  [Editar] [Duplicar] [Estadísticas]

▶ Sales Specialist (32 personas)
▶ Technical Analyst (28 personas)
```

**Modal de Configuración**
- Wizard de 3 pasos
- Validación en tiempo real
- Sugerencias inteligentes basadas en industria
- Preview de impacto (personas afectadas)

### Indicadores Visuales

**Estados de Tests:**
- 🟢 Activo y actualizado
- 🟡 Deprecado (usar con precaución)
- 🔴 Archivado (no disponible)
- 🔵 Borrador (en construcción)

**Badges de Categorización:**
- [GLOBAL] [ORG] [PREMIUM]
- [360°] [INDIVIDUAL] [AMBOS]
- [v1] [v2] [v3] (versiones)

**Métricas en Tiempo Real:**
- Número de evaluaciones usando el test
- Última modificación
- Promedio de completitud
- Satisfacción de usuarios

---

## INTEGRACIÓN ENTRE MÓDULOS

### Flujo: Persona → Job Family → Test

1. **Alta de Persona**
   - Se asigna Job Family "analyst"
   - Sistema registra competencias esperadas
   - Perfil queda listo para evaluación

2. **Creación de Evaluación 360°**
   - Sistema detecta Job Family "analyst"
   - Sugiere tests recomendados para analyst
   - Muestra tests permitidos como alternativa
   - Bloquea tests excluidos

3. **Selección Final**
   - Admin elige test de opciones válidas
   - Sistema aplica configuración de la Job Family
   - Define evaluadores según reglas del rol

### Coherencia y Validaciones Cruzadas

**Persona sin Job Family:**
- No puede ser evaluada
- Warning al crear evaluación
- Debe asignarse Job Family primero

**Job Family sin Tests:**
- No puede usarse en evaluaciones
- Sistema pide configurar tests
- Sugiere tests basados en roles similares

**Test sin Job Families:**
- Disponible pero no sugerido
- Puede asignarse manualmente
- Warning sobre falta de validación

### Trazabilidad Completa

**Cada evaluación registra:**
- Versión exacta del test usado
- Job Family del evaluado al momento
- Configuración de la Job Family
- Razón de selección del test (recomendado/manual)
- Usuario que tomó las decisiones

---

## MÉTRICAS Y REPORTES DEL MÓDULO

### KPIs de Adopción
- % de personas con Job Family asignada
- % de Job Families con tests configurados
- Tests más utilizados por Job Family
- Tasa de personalización de tests globales

### Análisis de Uso
- Tests por cantidad de evaluaciones
- Job Families por cantidad de personas
- Evolución de versiones de tests
- Patrones de personalización

### Calidad de Configuración
- Job Families sin tests recomendados
- Tests sin uso en últimos 6 meses
- Inconsistencias entre roles similares
- Sugerencias de optimización

# MÓDULO 3: CAMPAÑAS DE EVALUACIÓN 360°

## 3.1 Propósito del Módulo

Orquestar procesos de evaluación 360° a escala organizacional, permitiendo la creación, configuración y gestión de campañas que agrupan múltiples evaluaciones individuales con configuraciones compartidas y gestión centralizada.

## 3.2 Conceptos Fundamentales

### Campaign (Campaña de Evaluación)
Contenedor que agrupa múltiples evaluaciones 360° individuales bajo un proceso unificado con reglas, plazos y configuraciones comunes.

**Características principales:**
- Agrupa evaluaciones de múltiples personas
- Configuración compartida (plazos, recordatorios, privacidad)
- Gestión centralizada del proceso
- Reportes consolidados
- Estados y flujo controlado

### Evaluation360Session
Instancia individual de evaluación 360° para una persona específica dentro de una campaña. Es la unidad atómica que orquesta todo el proceso para un evaluado.

**Componentes de una Evaluation360Session:**
- **Evaluado**: La persona que recibe la evaluación
- **Test asignado**: Instrumento específico y versión
- **Evaluadores**: Lista de personas que evaluarán
- **Tokens**: Identificadores únicos para cada evaluador
- **Estado individual**: Progreso de esta evaluación específica
- **Resultados**: Agregación de respuestas para este evaluado

### Tipos de Evaluadores

**1. Autoevaluación (Self)**
- El evaluado se evalúa a sí mismo
- Siempre nominativo (no anónimo)
- Generalmente obligatoria
- Sin token (usa autenticación normal)

**2. Jefatura (Manager)**
- Superior jerárquico directo
- Puede ser uno o múltiples (estructura matricial)
- Configuración de anonimato flexible
- Peso específico en agregación

**3. Pares (Peers)**
- Colegas del mismo nivel jerárquico
- Generalmente del mismo departamento/área
- Requiere mínimo para anonimato (ej: 3+)
- Selección puede ser por evaluado o admin

**4. Subordinados (Direct Reports)**
- Reportes directos del evaluado
- Crítico para roles de liderazgo
- Alto nivel de anonimato requerido
- Mínimo más alto (ej: 3-5)

**5. Externos (External)**
- Clientes, proveedores, partners
- Opcional según configuración
- Puede requerir registro simplificado
- Consideraciones especiales de acceso

### Estados de una Campaña

**1. Draft (Borrador)**
- En configuración
- Modificable libremente
- Sin notificaciones enviadas
- Validaciones en tiempo real

**2. Active (Activa)**
- Invitaciones enviadas
- Evaluadores pueden responder
- Cambios limitados permitidos
- Monitoreo en tiempo real

**3. Closed (Cerrada)**
- Plazo vencido
- No acepta más respuestas
- Listo para procesamiento
- Puede reabrirse excepcionalmente

**4. Completed (Completada)**
- Resultados procesados
- Reportes disponibles
- Inmutable
- Archivo histórico

## 3.3 Funcionalidades del Módulo

### 3.3.1 Creación de Campaña

**Wizard de Creación - Paso 1: Información General**

*Datos Básicos:*
- Nombre de la campaña (ej: "Evaluación 360° Q1 2025")
- Descripción y objetivos
- Tipo de campaña:
  - Toda la organización
  - Área/División específica
  - Grupo personalizado
  - Piloto/Prueba
- Período evaluado (ej: "Desempeño 2024")
- Sponsor ejecutivo (opcional)

*Configuración Temporal:*
- Fecha de inicio (cuándo se envían invitaciones)
- Fecha de cierre (deadline para responder)
- Zona horaria de referencia
- Extensiones permitidas (sí/no)
- Días hábiles solamente (sí/no)

*Configuración de Comunicaciones:*
- Idioma por defecto
- Plantilla de emails (estándar/personalizada)
- Remitente de emails (sistema/sponsor)
- Incluir logo y branding
- Canal adicional (SMS/Slack/Teams)

**Wizard de Creación - Paso 2: Selección de Evaluados**

*Métodos de Selección:*

**Opción A: Por Estructura Organizacional**
- Seleccionar área(s) completa(s)
- Seleccionar departamento(s)
- Aplicar filtros adicionales:
  - Antigüedad mínima (ej: >6 meses)
  - Tipo de contrato
  - Estado activo
  - Job Family específica

**Opción B: Por Job Family**
- Seleccionar una o múltiples Job Families
- Todos los empleados con esa clasificación
- Filtros adicionales disponibles

**Opción C: Selección Manual**
- Búsqueda y selección individual
- Importar lista de IDs/emails
- Combinar con criterios anteriores

**Opción D: Reglas Dinámicas**
- Criterios complejos (ej: "Todos los managers con equipos >5 personas")
- Expresiones lógicas AND/OR
- Preview en tiempo real

*Exclusiones:*
- Lista de exclusión manual
- Excluir nuevos ingresos (<X meses)
- Excluir en proceso de salida
- Excluir con evaluación reciente (<X meses)

*Vista Previa:*
```
Evaluados Seleccionados: 47 personas

Por Job Family:
├── Management: 12
├── Sales Specialist: 20
└── Analyst: 15

Por Área:
├── Comercial: 25
├── Operaciones: 15
└── Finanzas: 7

[Ver Lista Detallada] [Exportar] [Modificar Selección]
```

**Wizard de Creación - Paso 3: Asignación de Tests**

*Modalidad de Asignación:*

**Modo 1: Automático por Job Family**
- Sistema asigna test recomendado para cada Job Family
- Muestra asignaciones propuestas
- Permite override manual por excepción

**Modo 2: Test Único para Todos**
- Seleccionar un test del catálogo
- Aplicar a todos los evaluados
- Útil para cultura organizacional

**Modo 3: Asignación Personalizada**
- Tabla con evaluados y dropdown de tests
- Tests válidos según Job Family
- Asignación masiva por grupos
- Validación de tests excluidos

*Vista de Asignación:*
```
┌─────────────────────────────────────────┐
│ Persona         | Job Family | Test     │
├─────────────────────────────────────────┤
│ Juan Pérez      | Management | Liderazgo│
│ María García    | Management | Liderazgo│
│ Carlos López    | Sales      | Ventas   │
│ Ana Martínez    | Analyst    | Técnico  │
└─────────────────────────────────────────┘

Tests Únicos Utilizados: 3
[Revisar Tests] [Cambio Masivo] [Validar]
```

**Wizard de Creación - Paso 4: Configuración de Evaluadores**

*Reglas Globales de la Campaña:*

**Autoevaluación:**
- [ ] Obligatoria
- [ ] Opcional
- [ ] No incluir

**Evaluación por Jefatura:**
- [ ] Obligatoria para todos
- [ ] Solo donde existe jefe asignado
- [ ] Múltiples jefes evalúan
- [ ] Evaluado elige cuál jefe

**Evaluación por Pares:**
- Mínimo requerido: [3]
- Máximo permitido: [5]
- Método de selección:
  - [ ] Admin selecciona
  - [ ] Evaluado propone
  - [ ] Jefe selecciona
  - [ ] Mixto (propone evaluado, aprueba jefe)

**Evaluación por Subordinados:**
- [ ] Incluir todos los subordinados
- [ ] Mínimo requerido: [3]
- [ ] Máximo permitido: [10]
- [ ] Excluir subordinados recientes (<3 meses)

**Evaluadores Externos:**
- [ ] Permitir
- [ ] No permitir
- Requiere aprobación: [Admin/Jefe]
- Máximo permitido: [2]

*Configuración de Privacidad:*

**Nivel de Anonimato:**
- Autoevaluación: Siempre visible
- Jefatura: [Nominativo/Anónimo]
- Pares: [Anónimo si >= 3]
- Subordinados: [Anónimo si >= 3]
- Externos: [Configurable]

**Umbrales de Protección:**
- Si hay menos del mínimo: [No mostrar/Mostrar con aviso]
- Mezclar respuestas de: [Pares+Subordinados si <3]

**Wizard de Creación - Paso 5: Personalización por Evaluado**

*Tabla de Configuración Individual:*
```
┌────────────────────────────────────────────┐
│ Evaluado    | Test    | Evaluadores        │
├────────────────────────────────────────────┤
│ Juan Pérez  |Liderazgo| ✓ Auto             │
│ Management  |   v3    | ✓ Jefe: Ana M.     │
│             |         | ✓ Pares: [Selecc.] │
│             |         | ✓ Subord: 8 pers.  │
│ [Editar]    |[Cambiar]| [Gestionar]        │
└────────────────────────────────────────────┘
```

*Selección de Pares (Modal):*
```
Seleccionar 3-5 pares para Juan Pérez:

Sugeridos (mismo departamento):
☐ María García - Gerente Comercial
☐ Carlos López - Gerente Operaciones  
☐ Pedro Ruiz - Gerente Finanzas
☐ Laura Torres - Gerente RRHH

Otros disponibles:
☐ Roberto Silva - Gerente TI
☐ Carmen Díaz - Gerente Legal

[Confirmar Selección] [Cancelar]
```

**Wizard de Creación - Paso 6: Revisión y Activación**

*Resumen de Configuración:*
```
CAMPAÑA: Evaluación 360° Q1 2025
────────────────────────────────
Evaluados: 47 personas
Tests únicos: 3
Total evaluadores: 523
├── Autoevaluaciones: 47
├── Jefes: 47  
├── Pares: 188
├── Subordinados: 241
└── Externos: 0

Fecha inicio: 15/01/2025
Fecha cierre: 31/01/2025
Duración: 16 días

ALERTAS:
⚠ 3 personas sin jefe asignado
⚠ 5 personas con <3 subordinados
ℹ 12 evaluadores participan en múltiples evaluaciones

[Guardar Borrador] [Activar Campaña]
```

*Confirmación de Activación:*
```
¿Activar campaña ahora?

✓ Se enviarán 523 invitaciones por email
✓ Los evaluadores podrán responder inmediatamente
✓ Los cambios posteriores serán limitados
✓ Se activará el sistema de recordatorios

[Confirmar y Activar] [Volver a Revisar]
```

### 3.3.2 Gestión de Evaluation360Session

**Panel de Control por Evaluado**

*Vista General:*
```
Evaluation360Session: Juan Pérez
ID: 360_session_jp_2025q1
Test: Liderazgo v3
Estado: En progreso

PROGRESO DE EVALUADORES:
├── Auto: ✅ Completado (16/01)
├── Jefe: ✅ Completado (17/01)
├── Pares: ⚡ 3/5 completados
│   ├── ✅ María G. (17/01)
│   ├── ✅ Carlos L. (18/01)
│   ├── ✅ Pedro R. (19/01)
│   ├── ⏳ Laura T. (recordatorio enviado)
│   └── ⏳ Roberto S. (sin iniciar)
└── Subordinados: ⚡ 5/8 completados
    └── Ver detalles (anónimo)

[Enviar Recordatorio] [Extender Plazo] [Ver Respuestas]
```

*Gestión de Evaluadores:*

**Agregar Evaluador:**
- Solo en estado "Active"
- Validación contra reglas de campaña
- Generación automática de token
- Envío inmediato de invitación

**Remover Evaluador:**
- Si no ha completado: eliminación simple
- Si completó: decisión (mantener/eliminar respuestas)
- Recálculo de umbrales de anonimato
- Log de auditoría

**Reemplazar Evaluador:**
- Caso: evaluador no disponible
- Mantiene slot pero cambia persona
- Nuevo token generado
- Notificación a ambas partes

*Gestión de Excepciones:*

**Extensión Individual:**
- Extender plazo para evaluadores específicos
- Máximo X días adicionales
- Justificación requerida
- No afecta campaña global

**Cambio de Test:**
- Solo si no hay respuestas
- Validación contra Job Family
- Regeneración de invitaciones
- Alerta a evaluadores si ya accedieron

**Cancelación de Session:**
- Motivos: baja, licencia, reorganización
- Estado: "Cancelled"
- Opción de reactivar posteriormente
- Respuestas parciales se preservan

### 3.3.3 Monitoreo de Campaña

**Dashboard Principal**

*KPIs Generales:*
```
┌─────────────────────────────────────┐
│ EVALUACIÓN 360° Q1 2025            │
│ Estado: ACTIVA | Día 5 de 16       │
├─────────────────────────────────────┤
│ 📊 PROGRESO GLOBAL:      62%       │
│ ████████████░░░░░░░                │
├─────────────────────────────────────┤
│ 👥 Evaluados:          47/47       │
│ ✉️ Invitaciones:       523 enviadas │
│ ✅ Completadas:        324 (62%)    │
│ ⏳ En progreso:        87 (17%)     │
│ 🔔 Sin iniciar:        112 (21%)    │
└─────────────────────────────────────┘
```

*Progreso por Tipo de Evaluador:*
```
Autoevaluación:    ████████████░░░░  78%
Jefes:            ████████████████  95%
Pares:            ████████░░░░░░░░  52%
Subordinados:      ██████░░░░░░░░░░  41%
```

*Tabla Detallada de Evaluados:*
```
┌──────────────────────────────────────────┐
│ Evaluado    |Auto|Jefe|Pares|Sub.|Total  │
├──────────────────────────────────────────┤
│ Juan Pérez  | ✅ | ✅ | 3/5 |5/8 | 71%  │
│ María García| ✅ | ✅ | 4/4 |3/6 | 78%  │
│ Carlos López| ⏳ | ✅ | 2/5 |N/A | 43%  │
│ Ana Martínez| ✅ | ⏳ | 5/5 |7/10| 65%  │
└──────────────────────────────────────────┘

[Exportar] [Filtrar] [Enviar Recordatorios Masivos]
```

**Análisis de Participación**

*Vista Temporal:*
```
Respuestas por Día:
Día 1: ████████████ 45 respuestas
Día 2: ████████ 32 respuestas  
Día 3: ██████ 28 respuestas
Día 4: ████ 18 respuestas
Día 5: ███ 12 respuestas (hoy)

Proyección: 76% completitud al cierre
[Ver Detalles] [Ajustar Proyección]
```

*Identificación de Riesgos:*
```
⚠️ ALERTAS DE PARTICIPACIÓN:

Evaluados sin autoevaluación: 8
├── Carlos López (3 recordatorios)
├── Pedro Ruiz (2 recordatorios)
└── [Ver todos]

Evaluados con <50% de respuestas: 12
├── Laura Torres (2/8 evaluadores)
├── Roberto Silva (3/7 evaluadores)
└── [Ver todos]

Evaluadores sin responder (múltiples): 5
├── José Méndez (evalúa a 4 personas)
├── Carmen Díaz (evalúa a 3 personas)
└── [Ver todos]

[Gestionar Alertas] [Enviar Escalamiento]
```

### 3.3.4 Gestión de Estados y Transiciones

**Flujo de Estados de Campaña:**
```
DRAFT → ACTIVE → CLOSED → COMPLETED
  ↓        ↓        ↓         ↓
[Editar] [Pausar] [Extender] [Archivar]
         [Cancelar] [Reabrir]
```

**Acciones por Estado:**

*Draft (Borrador):*
- ✅ Modificar cualquier configuración
- ✅ Agregar/quitar evaluados
- ✅ Cambiar tests
- ✅ Ajustar evaluadores
- ❌ Enviar invitaciones

*Active (Activa):*
- ⚠️ Modificaciones limitadas
- ✅ Agregar evaluadores individuales
- ✅ Enviar recordatorios
- ✅ Extender plazos individuales
- ✅ Pausar temporalmente
- ❌ Cambiar tests
- ❌ Modificar configuración global

*Closed (Cerrada):*
- ❌ No acepta nuevas respuestas
- ✅ Procesar resultados
- ✅ Reabrir excepcionalmente
- ✅ Generar reportes preliminares

*Completed (Completada):*
- ❌ No modificable
- ✅ Acceso a reportes finales
- ✅ Exportar datos
- ✅ Archivar

**Validaciones de Transición:**

*Para Activar (Draft → Active):*
- Mínimo 1 evaluado configurado
- Todos los evaluados con test asignado
- Todos los evaluados con evaluadores
- Configuración de fechas válida
- Templates de email configurados

*Para Cerrar (Active → Closed):*
- Fecha de cierre alcanzada O cierre manual
- Confirmación si hay evaluaciones pendientes
- Notificación a evaluadores pendientes
- Generación de snapshot de datos

*Para Completar (Closed → Completed):*
- Procesamiento de resultados exitoso
- Cálculo de scores completado
- Reportes generados
- Aprobación de Admin

---

# MÓDULO 4: SISTEMA DE TOKENS E INVITACIONES

## 4.1 Propósito del Módulo

Gestionar el sistema de autenticación, invitaciones y comunicaciones automatizadas que permiten a los evaluadores acceder y completar las evaluaciones de manera segura, controlada y con seguimiento preciso.

## 4.2 Conceptos Fundamentales

### Token de Evaluación
Identificador único y seguro que permite a un evaluador acceder a una evaluación específica sin revelar información sensible sobre el proceso.

**Características del Token:**
- Único por evaluador y evaluación
- No reversible (no revela IDs internos)
- Tiempo de vida limitado
- Un solo uso o uso múltiple (configurable)
- Trazable pero anónimo

**Formato del Token:**
```
Estructura: XXX-XXXX-XXXX-XXX
Ejemplo: A7B-3KM9-P2QR-8ZX
Longitud: 15 caracteres
Caracteres: Alfanuméricos (sin ambiguos: 0,O,1,I,l)
```

### Sistema de Invitaciones

**Tipos de Invitación:**

*1. Invitación Inicial:*
- Enviada al activar campaña
- Contiene contexto completo
- Link único con token
- Instrucciones claras

*2. Recordatorio Suave:*
- Tono amigable
- Resalta importancia
- Muestra progreso general
- Link directo a evaluación

*3. Recordatorio Urgente:*
- Tono más directo
- Fecha límite prominente
- Consecuencias de no completar
- Opción de solicitar extensión

*4. Último Aviso:*
- 24-48 horas antes del cierre
- Urgencia máxima
- Link y token destacados
- Contacto de soporte

*5. Notificación de Extensión:*
- Cuando se extiende plazo
- Nueva fecha límite
- Agradecimiento por participación

### Canal de Comunicación

**Email (Principal):**
- HTML responsivo
- Texto plano alternativo
- Tracking de apertura/clicks
- Botones call-to-action claros

**SMS (Complementario):**
- Recordatorios cortos
- Link acortado
- Opt-in requerido
- Límite de frecuencia

**Notificación In-App:**
- Para usuarios autenticados
- Badge en navbar
- Centro de notificaciones
- Push notifications (opcional)

**Integraciones (Opcional):**
- Slack/Teams
- WhatsApp Business
- Calendar invites
- Mobile app push

## 4.3 Funcionalidades del Módulo

### 4.3.1 Generación y Gestión de Tokens

**Generación de Tokens**

*Proceso de Generación:*
1. Trigger: Asignación de evaluador a Evaluation360Session
2. Generación de string único
3. Validación de no colisión
4. Asociación a registro de evaluación
5. Almacenamiento seguro (hashed)

*Atributos del Token:*
```
Token: {
  token_id: "uuid",
  token_string: "A7B-3KM9-P2QR-8ZX",
  evaluation_session_id: "360_session_jp_2025q1",
  evaluator_id: "peer_001",
  evaluator_email: "maria@company.com",
  evaluatee_id: "user_789",
  test_id: "leadership_v3",
  created_at: "2025-01-15T10:00:00Z",
  expires_at: "2025-01-31T23:59:59Z",
  status: "active", // active/used/expired/revoked
  first_used_at: null,
  last_used_at: null,
  use_count: 0,
  max_uses: null, // null = unlimited during validity
  ip_restrictions: [], // opcional
  metadata: {
    campaign_id: "campaign_q1_2025",
    evaluator_type: "peer",
    anonymity_level: "anonymous"
  }
}
```

**Gestión de Tokens**

*Panel de Tokens Activos:*
```
┌────────────────────────────────────────┐
│ TOKENS DE CAMPAÑA Q1 2025             │
├────────────────────────────────────────┤
│ Total generados: 523                   │
│ Usados: 324 (62%)                     │
│ Sin usar: 199 (38%)                   │
│ Expirados: 0                          │
│ Revocados: 2                          │
└────────────────────────────────────────┘

Búsqueda: [________________] 🔍

┌──────────────────────────────────────────┐
│ Token      | Evaluador | Estado | Usos  │
├──────────────────────────────────────────┤
│ A7B-****-8ZX| María G. | Usado  | 3    │
│ B9C-****-7YW| Carlos L.| Activo | 0    │
│ C2D-****-6XV| Pedro R. | Usado  | 1    │
└──────────────────────────────────────────┘

[Revocar] [Regenerar] [Extender] [Exportar]
```

*Acciones sobre Tokens:*

**Revocar Token:**
- Invalida inmediatamente
- Genera nuevo si es necesario
- Notifica al evaluador
- Log de razón

**Regenerar Token:**
- Crea nuevo token
- Invalida anterior
- Reenvía invitación
- Mantiene progreso si existe

**Extender Validez:**
- Modifica fecha expiración
- Individual o masivo
- Notificación automática
- Justificación requerida

**Auditoría de Token:**
```
Token: A7B-3KM9-P2QR-8ZX
Historia:
├── 15/01 10:00 - Generado
├── 15/01 10:05 - Email enviado
├── 15/01 14:30 - Email abierto
├── 16/01 09:15 - Primer uso (IP: 192.168.1.1)
├── 16/01 09:45 - Evaluación iniciada
├── 16/01 10:30 - Evaluación completada
└── 16/01 10:31 - Token marcado como usado
```

### 4.3.2 Sistema de Invitaciones

**Configuración de Plantillas**

*Editor de Plantillas de Email:*
```
┌────────────────────────────────────────┐
│ PLANTILLA: Invitación Inicial         │
├────────────────────────────────────────┤
│ Asunto: [_________________________]   │
│                                        │
│ Cuerpo:                               │
│ ┌────────────────────────────────┐    │
│ │ Estimado/a {{evaluator_name}}, │    │
│ │                                │    │
│ │ Has sido seleccionado para     │    │
│ │ participar en la evaluación    │    │
│ │ 360° de {{evaluatee_name}}.    │    │
│ │                                │    │
│ │ [Completar Evaluación]         │    │
│ │ {{evaluation_link}}            │    │
│ │                                │    │
│ │ Fecha límite: {{deadline}}     │    │
│ └────────────────────────────────┘    │
│                                        │
│ Variables disponibles:                 │
│ {{evaluator_name}} {{evaluatee_name}} │
│ {{test_name}} {{deadline}}            │
│ {{evaluation_link}} {{token}}         │
│ {{progress}} {{campaign_name}}        │
│                                        │
│ [Preview] [Guardar] [Enviar Prueba]   │
└────────────────────────────────────────┘
```

*Tipos de Plantillas:*

**Set Completo por Campaña:**
1. Invitación inicial
2. Recordatorio amigable (3 días)
3. Recordatorio urgente (1 día)
4. Último aviso (horas)
5. Confirmación de completado
6. Extensión de plazo
7. Cancelación (si aplica)

*Personalización por Tipo de Evaluador:*
```
Plantillas diferenciadas para:
├── Autoevaluación (más contexto)
├── Jefes (énfasis en responsabilidad)
├── Pares (enfoque en colaboración)
├── Subordinados (garantía de anonimato)
└── Externos (instrucciones extra)
```

**Programación de Envíos**

*Configuración de Calendario:*
```
CALENDARIO DE COMUNICACIONES:
────────────────────────────────
Día 0: Invitación inicial
Día 3: Recordatorio (si no iniciado)
Día 7: Recordatorio (si <50% completo)
Día 10: Recordatorio urgente (todos sin completar)
Día 14: Último aviso (24h antes)
Día 15: Aviso final (4h antes del cierre)

Horario de envío: 9:00 AM (hora local)
Evitar fines de semana: ✓
Considerar festivos: ✓

[Personalizar Calendario] [Preview]
```

*Reglas de Envío Inteligente:*
```
Condiciones para Recordatorios:
├── No enviar si completó: ✓
├── No enviar si progreso >75%: ✓
├── Espaciado mínimo: 48 horas
├── Máximo recordatorios: 5
└── Escalamiento a jefe: Después de 3

Optimización:
├── Mejor día: Martes-Jueves
├── Mejor hora: 9-11 AM
├── Evitar: Lunes AM, Viernes PM
└── A/B testing: ✓ Habilitado
```

### 4.3.3 Proceso de Invitación

**Flujo de Envío Masivo**

*Preparación del Batch:*
```
ENVÍO MASIVO DE INVITACIONES:
─────────────────────────────
Campaña: Q1 2025
Total a enviar: 523 emails
Validados: 520 ✓
Con errores: 3 ⚠

Errores detectados:
├── pedro@[inválido] - Email inválido
├── maria.gonzalez@ - Email incompleto  
└── juan@empresa.c - Dominio inválido

[Corregir] [Omitir] [Cancelar]

Programación:
○ Enviar ahora
● Programar para: [15/01/2025] [09:00]

Envío escalonado:
○ Todos de una vez
● Por lotes de: [50] cada [5] minutos

[Iniciar Envío] [Guardar Borrador]
```

*Proceso de Envío:*
1. Validación de destinatarios
2. Generación de tokens faltantes
3. Compilación de plantillas
4. Personalización por destinatario
5. Queue de envío
6. Envío escalonado
7. Tracking de entrega
8. Manejo de bounces

*Monitoreo en Tiempo Real:*
```
PROGRESO DE ENVÍO:
██████████████░░░░░░ 70% (366/523)

Enviados: 366 ✓
En cola: 157 ⏳
Errores: 0 ✗

Tasa de apertura: 45% (165/366)
Tasa de clicks: 28% (102/366)

[Pausar] [Ver Detalles] [Exportar Log]
```

**Gestión de Respuestas Automáticas**

*Tipos de Respuesta:*
```
Bounces:
├── Hard bounce → Marcar email inválido
├── Soft bounce → Reintentar (3x)
└── Blocked → Verificar spam score

Auto-respuestas:
├── Out of office → Programar reenvío
├── No longer works → Notificar admin
└── Mailbox full → Reintentar después

Interacciones:
├── Click en link → Registrar engagement
├── Respuesta directa → Derivar a soporte
└── Unsubscribe → Respetar preferencia
```

### 4.3.4 Tracking y Analytics

**Dashboard de Comunicaciones**

*Métricas Globales:*
```
┌────────────────────────────────────────┐
│ RENDIMIENTO DE COMUNICACIONES         │
├────────────────────────────────────────┤
│ Emails Enviados:        2,456         │
│ Tasa de Entrega:        98.5%         │
│ Tasa de Apertura:       67.3%         │
│ Tasa de Click:          45.2%         │
│ Conversión (completado): 38.9%        │
└────────────────────────────────────────┘

Por Tipo de Mensaje:
├── Invitación:    72% apertura, 52% click
├── Recordatorio 1: 65% apertura, 41% click
├── Recordatorio 2: 61% apertura, 38% click
└── Último aviso:   78% apertura, 55% click
```

*Análisis por Segmento:*
```
Rendimiento por Tipo de Evaluador:
┌──────────────────────────────────────┐
│ Tipo         |Apertura|Click|Complet│
├──────────────────────────────────────┤
│ Jefes        | 85%    | 72% | 68%   │
│ Pares        | 68%    | 45% | 41%   │
│ Subordinados | 62%    | 38% | 35%   │
│ Externos     | 71%    | 48% | 43%   │
└──────────────────────────────────────┘

Mejor horario de envío:
Martes 10 AM: 78% apertura
Peor horario: 
Viernes 4 PM: 31% apertura
```

*Tracking Individual:*
```
Evaluador: María García
Email: maria@company.com
Token: A7B-****-8ZX

Timeline:
├── 15/01 09:00 - Email enviado
├── 15/01 09:15 - Email abierto
├── 15/01 09:16 - Click en link
├── 15/01 09:20 - Evaluación iniciada
├── 15/01 09:45 - Progreso 50%
├── 15/01 10:30 - Evaluación completada
├── 18/01 09:00 - Recordatorio (ignorado)
└── Status: ✅ Completado

[Ver Evaluación] [Historial Completo]
```

### 4.3.5 Gestión de Acceso

**Portal de Evaluación**

*Landing Page con Token:*
```
URL: https://sistema360.com/eval/A7B-3KM9-P2QR-8ZX

┌────────────────────────────────────────┐
│        EVALUACIÓN 360°                │
│                                        │
│   Bienvenido/a a la evaluación 360°   │
│   de Juan Pérez                       │
│                                        │
│   Test: Liderazgo Ejecutivo          │
│   Preguntas: 45                      │
│   Tiempo estimado: 15-20 minutos     │
│   Fecha límite: 31/01/2025           │
│                                        │
│   Tu participación es:                │
│   ✓ Confidencial                     │
│   ✓ Anónima                          │
│   ✓ Importante para el desarrollo    │
│                                        │
│   [Comenzar Evaluación]               │
│                                        │
│   ¿Necesitas ayuda? [Soporte]        │
└────────────────────────────────────────┘
```

*Validación de Acceso:*
```
Verificación del Token:
├── ¿Existe? → Sí
├── ¿Activo? → Sí  
├── ¿Expirado? → No
├── ¿Ya usado? → Verificar política
├── ¿IP permitida? → Sí
└── ✓ Acceso concedido

Si falla:
├── Token inválido → "Token no reconocido"
├── Token expirado → "Evaluación cerrada"
├── Token usado → "Ya completaste esta evaluación"
└── IP bloqueada → "Acceso no autorizado"
```

*Autenticación Adicional (Opcional):*
```
Para mayor seguridad, algunas organizaciones requieren:

┌────────────────────────────────────────┐
│ Verificación Adicional                │
│                                        │
│ Por favor ingresa tu email:           │
│ [_____________________]               │
│                                        │
│ Código de verificación:               │
│ [__ __ __ __]                        │
│                                        │
│ [Verificar y Continuar]               │
└────────────────────────────────────────┘

Opciones:
├── Email debe coincidir con registro
├── 2FA por SMS/Email
├── SSO corporativo
└── Captcha (anti-bot)
```

## 4.4 Automatizaciones y Reglas

### Reglas de Recordatorios

**Lógica de Recordatorios Automáticos:**
```
PARA cada evaluador en campaña activa:
  SI no ha iniciado Y han pasado 3 días:
    ENVIAR recordatorio_suave
  
  SI progreso < 50% Y han pasado 7 días:
    ENVIAR recordatorio_medio
  
  SI no completado Y faltan 48 horas:
    ENVIAR recordatorio_urgente
    
  SI no completado Y faltan 4 horas:
    ENVIAR ultimo_aviso
    SI es evaluador crítico:
      NOTIFICAR a admin
      NOTIFICAR a jefe del evaluador
```

**Excepciones y Casos Especiales:**
```
No enviar recordatorio si:
├── Evaluador en vacaciones (registro RRHH)
├── Evaluador marcó "recordar después"
├── Límite de recordatorios alcanzado
├── Evaluación cancelada/pospuesta
└── Preferencia de no contacto

Casos especiales:
├── CEO/Directores: recordatorios personalizados
├── Externos: frecuencia reducida
├── Nuevos empleados: tono más explicativo
└── Múltiples evaluaciones: consolidar en un email
```

### Sistema de Escalamiento

**Niveles de Escalamiento:**
```
Nivel 1 (Día 5):
├── Recordatorio automático estándar
└── Flag en dashboard

Nivel 2 (Día 10):
├── Email con copia a RRHH
├── Alerta en sistema
└── Inclusión en reporte diario

Nivel 3 (Día 14):
├── Notificación a jefe directo
├── Email desde RRHH
└── Llamada telefónica (opcional)

Nivel 4 (Último día):
├── Escalamiento a director de área
├── Decisión: extensión o cierre sin respuesta
└── Documentación del caso
```

## 4.5 Seguridad y Privacidad

### Protección de Tokens

**Medidas de Seguridad:**
```
Almacenamiento:
├── Tokens hasheados en DB
├── Salt único por token
├── No reversible
└── Encriptación en tránsito

Validación:
├── Rate limiting (5 intentos/hora)
├── Lockout temporal tras fallos
├── Log de intentos fallidos
└── Alertas de comportamiento anómalo

Expiración:
├── TTL configurable
├── Auto-revocación post-uso
├── Limpieza periódica
└── No reutilizable
```

### Garantía de Anonimato

**Protección de Identidad del Evaluador:**
```
Información NO visible para evaluado:
├── Email del evaluador
├── Nombre específico
├── Respuestas individuales
├── Tiempo de respuesta
└── IP o ubicación

Información SÍ visible (agregada):
├── Promedio por categoría de evaluador
├── Tendencias generales
├── Comentarios anonimizados
└── Scores consolidados

Umbral de anonimato:
SI evaluadores_tipo < 3:
  No mostrar resultados segregados
  Mezclar con otra categoría
  O no mostrar del todo
```

### Cumplimiento Normativo

**GDPR y Privacidad de Datos:**
```
Consentimiento:
├── Explícito para participación
├── Información clara sobre uso
├── Derecho a retirarse
└── Eliminación de datos

Retención de datos:
├── Tokens: 90 días post-campaña
├── Respuestas: según política org
├── Logs: 1 año
└── Emails: 6 meses

Derechos del evaluador:
├── Acceso a sus propias respuestas
├── Corrección de errores
├── Eliminación (con restricciones)
└── Portabilidad
```

## 4.6 Interfaz de Usuario

### Panel de Control de Invitaciones

**Vista Principal:**
```
┌────────────────────────────────────────┐
│ GESTIÓN DE INVITACIONES - Q1 2025     │
├────────────────────────────────────────┤
│ 📧 Estado de Envíos                   │
│                                        │
│ Próximo envío: Hoy 2:00 PM            │
│ Tipo: Recordatorio día 3               │
│ Destinatarios: 89 evaluadores         │
│                                        │
│ [Revisar] [Modificar] [Cancelar]      │
├────────────────────────────────────────┤
│ 📊 Métricas de la Semana              │
│                                        │
│ Enviados: 1,234                       │
│ Abiertos: 891 (72%)                   │
│ Clicks: 567 (46%)                     │
│ Completados: 234 (19%)                │
│                                        │
│ [Ver Detalle] [Exportar]              │
└────────────────────────────────────────┘
```

### Centro de Comunicaciones

**Editor de Campañas de Email:**
```
┌────────────────────────────────────────┐
│ CAMPAÑA: Recordatorios Semana 2       │
├────────────────────────────────────────┤
│ Segmento: Sin completar (187)         │
│                                        │
│ Plantilla: [Recordatorio Medio ▼]     │
│                                        │
│ Personalización:                       │
│ ☑ Incluir progreso actual             │
│ ☑ Mostrar deadline                    │
│ ☐ Incluir testimonio                  │
│                                        │
│ Test A/B:                              │
│ ☑ Habilitar                           │
│ Variante A: Asunto urgente (50%)      │
│ Variante B: Asunto amigable (50%)     │
│                                        │
│ Programación:                          │
│ ○ Enviar ahora                        │
│ ● Programar: [18/01] [10:00 AM]       │
│                                        │
│ [Preview] [Enviar Test] [Programar]   │
└────────────────────────────────────────┘
```

### Vista de Evaluador

**Portal Personal del Evaluador:**
```
┌────────────────────────────────────────┐
│ MIS EVALUACIONES PENDIENTES           │
├────────────────────────────────────────┤
│ Tienes 3 evaluaciones por completar:  │
│                                        │
│ 1. Juan Pérez (Jefe)                  │
│    ⏳ 0% completado                   │
│    📅 Vence: 31/01/2025               │
│    [Comenzar]                         │
│                                        │
│ 2. María García (Par)                 │
│    ⚡ 60% completado                  │
│    📅 Vence: 31/01/2025               │
│    [Continuar]                        │
│                                        │
│ 3. Carlos López (Par)                 │
│    ✅ 100% completado                 │
│    Enviado: 17/01/2025                │
│    [Ver Resumen]                      │
│                                        │
│ 💡 Tip: Completa tus evaluaciones     │
│    temprano para evitar la congestión │
│    de último momento.                 │
└────────────────────────────────────────┘
```

---

## INTEGRACIÓN ENTRE MÓDULOS 3 Y 4

### Flujo Completo: Campaña → Invitación → Evaluación

**1. Activación de Campaña:**
```
Campaña cambia a "Active"
    ↓
Por cada Evaluation360Session:
    ↓
  Por cada evaluador:
    ├── Generar token único
    ├── Crear registro de invitación
    ├── Agregar a cola de envío
    └── Programar recordatorios
    ↓
Ejecutar envío masivo
    ↓
Tracking y monitoreo
```

**2. Recepción y Acceso:**
```
Evaluador recibe email
    ↓
Click en link con token
    ↓
Sistema valida token
    ↓
Carga evaluación específica
    ↓
Evaluador completa
    ↓
Actualiza Evaluation360Session
    ↓
Notifica completitud
```

**3. Gestión de Excepciones:**
```
Si evaluador no responde:
    ↓
Sistema envía recordatorio
    ↓
Si persiste:
    ├── Escalar a admin
    ├── Notificar a jefe
    └── Considerar extensión
    ↓
Decisión administrativa
```

### Sincronización de Estados

**Estados Relacionados:**
```
Campaign.status affects → Token.validity
Campaign.deadline affects → Token.expires_at
Evaluation360Session.status affects → Invitation.type
Token.status affects → ReminderSchedule
Response.completed affects → NextReminder.cancelled
```

### Métricas Compartidas

**KPIs Integrados:**
```
Efectividad de Campaña:
├── Tokens generados vs. usados
├── Invitaciones enviadas vs. abiertas
├── Links clickeados vs. evaluaciones iniciadas
├── Evaluaciones iniciadas vs. completadas
└── Tiempo promedio desde invitación a completitud

Calidad de Participación:
├── Tasa de respuesta por tipo de evaluador
├── Número de recordatorios necesarios
├── Casos de escalamiento
├── Extensiones otorgadas
└── Abandonos después de iniciar
```

---

## CONSIDERACIONES TÉCNICAS

### Performance

**Optimizaciones Requeridas:**
- Envío asíncrono de emails (queues)
- Generación batch de tokens
- Caché de plantillas compiladas
- Rate limiting por destinatario
- CDN para imágenes de emails

### Escalabilidad

**Capacidad Esperada:**
- 10,000+ tokens simultáneos activos
- 100,000+ emails por campaña
- Picos de 1,000 evaluaciones/hora
- Respuesta <2s para validación de token

### Monitoreo

**Alertas Críticas:**
- Tasa de bounce >5%
- Tasa de apertura <30%
- Tokens con >10 intentos fallidos
- Evaluadores sin respuesta >80%
- Errores de envío masivo

### Integraciones

**Servicios Externos:**
- SendGrid/SES para email
- Twilio para SMS
- Slack/Teams APIs
- Google Calendar
- Analytics platforms

---

## SIGUIENTE FASE

Los Módulos 3 y 4 establecen la base operativa del sistema. Una vez implementados, permiten:

1. **Lanzar campañas piloto** con grupos pequeños
2. **Validar flujo de trabajo** end-to-end
3. **Ajustar comunicaciones** basado en métricas
4. **Optimizar tasas de respuesta**
5. **Preparar para Módulo 5** (Completar Evaluación)

El siguiente paso crítico es el Módulo 5, donde los evaluadores interactúan directamente con el sistema para proporcionar sus respuestas, lo cual alimentará los módulos de agregación y reporting.

---

# MÓDULO 5: COMPLETAR EVALUACIÓN

## 5.1 Propósito del Módulo

Proporcionar una experiencia de usuario optimizada para que los evaluadores completen las evaluaciones 360° de manera eficiente, intuitiva y sin fricciones, garantizando la calidad de las respuestas y maximizando la tasa de completitud.

## 5.2 Conceptos Fundamentales

### Evaluation Session
Instancia única de evaluación que representa la interacción entre un evaluador específico y el test asignado para evaluar a una persona determinada.

**Atributos de la Sesión:**
- Identificador único de sesión
- Token de acceso asociado
- Evaluador (quien responde)
- Evaluado (quien recibe la evaluación)
- Test y versión específica
- Tipo de relación (jefe, par, subordinado)
- Estado de progreso
- Respuestas parciales/completas
- Timestamps de actividad

### Modos de Evaluación

**1. Autoevaluación**
- Evaluado se evalúa a sí mismo
- Preguntas pueden tener variante reflexiva
- Sin restricciones de anonimato
- Generalmente obligatoria

**2. Evaluación de Terceros**
- Evaluador evalúa a otra persona
- Mantiene perspectiva del tipo de relación
- Sujeto a reglas de anonimato
- Puede incluir preguntas específicas por rol

**3. Evaluación Rápida**
- Versión simplificada para externos
- Menos preguntas
- Interfaz más guiada
- Sin registro requerido

### Estados de una Evaluation Session

```
Estados posibles:
├── not_started: Token válido, no iniciada
├── in_progress: Iniciada, guardado parcial
├── abandoned: >X días sin actividad
├── completed: Todas las respuestas enviadas
├── expired: Plazo vencido
└── cancelled: Administrativamente cancelada
```

### Tipos de Respuesta

**Escalas Likert**
- Más común (70-80% de preguntas)
- 5, 7 o 10 puntos típicamente
- Labels en extremos y/o todos los puntos
- Opción N/A configurable

**Selección Múltiple**
- Para competencias específicas
- Opción única o múltiple
- Validación de mínimo/máximo

**Ranking/Priorización**
- Ordenar competencias/comportamientos
- Drag & drop intuitivo
- Validación de completitud

**Texto Abierto**
- Comentarios cualitativos
- Límite de caracteres
- Opcional/obligatorio
- Guías de redacción

**Matriz de Evaluación**
- Múltiples ítems con misma escala
- Evaluación eficiente
- Visualización compacta

## 5.3 Funcionalidades del Módulo

### 5.3.1 Acceso y Autenticación

**Landing Page de Evaluación**

*Acceso con Token:*
```
URL: sistema360.com/eval/A7B-3KM9-P2QR-8ZX

┌────────────────────────────────────────┐
│     EVALUACIÓN 360° CONFIDENCIAL      │
├────────────────────────────────────────┤
│                                        │
│  Estás por evaluar a:                 │
│  👤 Juan Pérez                        │
│  📋 Gerente de Ventas                 │
│                                        │
│  Tu rol: Colega/Par                   │
│  Test: Competencias de Liderazgo      │
│                                        │
│  ⏱ Tiempo estimado: 15-20 minutos    │
│  📅 Fecha límite: 31/01/2025          │
│                                        │
│  🔒 Tu participación es:              │
│  • Completamente confidencial         │
│  • Anónima (no se revelará tu nombre) │
│  • Importante para su desarrollo      │
│                                        │
│  [Comenzar Evaluación]                │
│                                        │
│  ¿Problemas? [Soporte] [FAQ]          │
└────────────────────────────────────────┘
```

*Verificación de Identidad (si requerida):*
```
┌────────────────────────────────────────┐
│     Verificación Adicional            │
├────────────────────────────────────────┤
│                                        │
│  Por seguridad, confirma tu email:    │
│  [_________________________]          │
│                                        │
│  Te enviaremos un código de           │
│  verificación                          │
│                                        │
│  [Enviar Código]                      │
│                                        │
│  ¿No tienes acceso? [Contactar Admin] │
└────────────────────────────────────────┘
```

**Sesión Existente**

*Detección de Progreso Previo:*
```
┌────────────────────────────────────────┐
│     Continuar Evaluación              │
├────────────────────────────────────────┤
│                                        │
│  Encontramos una sesión previa:       │
│                                        │
│  Progreso: ████████░░░░ 65%           │
│  Última actividad: Hace 2 días        │
│  Sección actual: Comunicación         │
│                                        │
│  ¿Qué deseas hacer?                   │
│                                        │
│  [Continuar donde quedé]               │
│  [Revisar desde el inicio]            │
│  [Comenzar de nuevo]                  │
│                                        │
└────────────────────────────────────────┘
```

### 5.3.2 Wizard de Evaluación

**Estructura del Wizard**

*Componentes del Interface:*
```
┌────────────────────────────────────────┐
│ ← Evaluación de Juan Pérez      ✕     │
├────────────────────────────────────────┤
│ Liderazgo  Comunicación  Trabajo Equipo│
│ ●────────○────────────○────────────○   │
│                                        │
│ Sección 1 de 4: LIDERAZGO ESTRATÉGICO │
│ Pregunta 3 de 12                      │
├────────────────────────────────────────┤
│                                        │
│ ¿Con qué frecuencia Juan demuestra    │
│ visión estratégica en sus decisiones? │
│                                        │
│ ○ Nunca                               │
│ ○ Raramente                           │
│ ○ A veces                             │
│ ● Frecuentemente                      │
│ ○ Siempre                             │
│ ○ No aplica/No observado              │
│                                        │
│ 💡 Considera los últimos 6 meses      │
│                                        │
├────────────────────────────────────────┤
│ [← Anterior]  [Guardar]  [Siguiente →]│
└────────────────────────────────────────┘
```

**Navegación y Progreso**

*Barra de Progreso Multi-nivel:*
```
Progreso Global: ████████████░░░░░ 72%

Por Sección:
├── ✅ Liderazgo (12/12)
├── ✅ Comunicación (10/10)
├── ⚡ Trabajo en Equipo (6/8)
├── ○ Desarrollo de Personas (0/10)
└── ○ Comentarios Finales (0/2)

[Ir a Sección ▼]
```

*Navegación Inteligente:*
- Siguiente automático tras responder
- Saltar a sección específica
- Marcar preguntas para revisar
- Vista de todas las respuestas

**Tipos de Preguntas**

*Escala Likert Mejorada:*
```
┌────────────────────────────────────────┐
│ Define objetivos claros y alcanzables │
├────────────────────────────────────────┤
│                                        │
│  Nunca                        Siempre │
│  1    2    3    4    5    6    7     │
│  ○    ○    ○    ●    ○    ○    ○     │
│       ↑                               │
│   Necesita mejorar    Excelente      │
│                                        │
│ ☐ No he observado este comportamiento │
└────────────────────────────────────────┘
```

*Matriz de Competencias:*
```
┌────────────────────────────────────────┐
│ Evalúa las siguientes competencias:   │
├────────────────────────────────────────┤
│                    Bajo        Alto    │
│                    1  2  3  4  5  NA  │
│ Planificación      ○  ○  ●  ○  ○  ○   │
│ Organización       ○  ○  ○  ●  ○  ○   │
│ Delegación         ○  ●  ○  ○  ○  ○   │
│ Seguimiento        ○  ○  ●  ○  ○  ○   │
│ Control            ○  ○  ○  ●  ○  ○   │
└────────────────────────────────────────┘
```

*Ranking de Prioridades:*
```
┌────────────────────────────────────────┐
│ Ordena de mayor a menor importancia:  │
├────────────────────────────────────────┤
│                                        │
│ Arrastra para reordenar:              │
│                                        │
│ 1️⃣ ≡ Orientación a resultados         │
│ 2️⃣ ≡ Trabajo en equipo               │
│ 3️⃣ ≡ Innovación                      │
│ 4️⃣ ≡ Comunicación efectiva           │
│ 5️⃣ ≡ Desarrollo de personas          │
│                                        │
└────────────────────────────────────────┘
```

*Pregunta Abierta Guiada:*
```
┌────────────────────────────────────────┐
│ Comentarios sobre Liderazgo           │
├────────────────────────────────────────┤
│                                        │
│ Describe una situación específica     │
│ donde Juan demostró liderazgo         │
│ excepcional: (Opcional)                │
│                                        │
│ [________________________________]    │
│ [________________________________]    │
│ [________________________________]    │
│ [________________________________]    │
│                                        │
│ 127/500 caracteres                    │
│                                        │
│ Sugerencias:                          │
│ • Sé específico y objetivo            │
│ • Enfócate en comportamientos         │
│ • Evita juicios personales            │
└────────────────────────────────────────┘
```

### 5.3.3 Guardado y Recuperación

**Auto-guardado Inteligente**

*Estrategia de Guardado:*
```
Guardado automático:
├── Cada respuesta individual (onChange)
├── Cada 30 segundos (si hay cambios)
├── Al cambiar de sección
├── Al cambiar de pregunta
└── Antes de timeout de sesión

Indicador visual:
✓ Guardado (verde)
⟳ Guardando... (animación)
⚠ Error al guardar (amarillo)
✗ Sin conexión (rojo)
```

*Recuperación de Sesión:*
```
Casos de recuperación:
├── Cierre accidental del navegador
├── Pérdida de conexión
├── Timeout de sesión
├── Cambio de dispositivo
└── Error del sistema

Datos preservados:
├── Todas las respuestas
├── Posición actual
├── Preguntas marcadas
├── Tiempo transcurrido
└── Borradores de texto
```

**Gestión de Drafts**

*Estado de Respuestas:*
```
Por pregunta:
├── not_answered: Sin responder
├── draft: Respuesta parcial
├── answered: Respondida completa
├── flagged: Marcada para revisar
└── skipped: Omitida temporalmente

Validaciones:
├── Requeridas vs opcionales
├── Completitud por sección
├── Coherencia de respuestas
└── Alertas de inconsistencia
```

### 5.3.4 Experiencia de Usuario Optimizada

**Adaptación por Dispositivo**

*Responsive Design:*
```
Desktop (>1024px):
├── Wizard completo con sidebar
├── Navegación por secciones visible
├── Preview de preguntas próximas
└── Tooltips hover

Tablet (768-1024px):
├── Wizard sin sidebar
├── Menú colapsable
├── Botones más grandes
└── Orientación optimizada

Mobile (<768px):
├── Una pregunta por pantalla
├── Swipe para siguiente
├── Botones thumb-friendly
├── Teclado optimizado
```

**Asistencia Contextual**

*Sistema de Ayuda:*
```
┌────────────────────────────────────────┐
│ 💡 Ayuda Contextual                   │
├────────────────────────────────────────┤
│                                        │
│ Esta pregunta evalúa:                 │
│ La capacidad de establecer una        │
│ dirección clara y motivar al equipo   │
│ hacia objetivos comunes.               │
│                                        │
│ Considera:                            │
│ • Últimos 6 meses                     │
│ • Situaciones que hayas observado     │
│ • Comportamientos consistentes        │
│                                        │
│ [Entendido] [Más ejemplos]            │
└────────────────────────────────────────┘
```

*Ejemplos y Aclaraciones:*
```
"¿Qué significa 'Frecuentemente'?"

En el contexto de esta evaluación:
├── Siempre: 90-100% del tiempo
├── Frecuentemente: 70-89% 
├── A veces: 40-69%
├── Raramente: 10-39%
└── Nunca: 0-9%
```

**Validación en Tiempo Real**

*Alertas Inteligentes:*
```
⚠️ Patrón detectado:
Has respondido "5" a todas las preguntas
de esta sección. ¿Deseas revisar tus
respuestas para asegurar precisión?

[Revisar] [Continuar así]
```

*Consistencia Lógica:*
```
⚠️ Posible inconsistencia:
Indicaste que "Nunca delega tareas" pero
"Siempre desarrolla a su equipo".
¿Deseas ajustar alguna respuesta?

[Ver respuestas] [Está bien así]
```

### 5.3.5 Finalización y Envío

**Revisión Pre-envío**

*Pantalla de Revisión:*
```
┌────────────────────────────────────────┐
│     REVISIÓN FINAL                    │
├────────────────────────────────────────┤
│                                        │
│ ✅ Secciones Completadas:             │
│                                        │
│ ✓ Liderazgo (12/12)                   │
│ ✓ Comunicación (10/10)                │
│ ✓ Trabajo en Equipo (8/8)             │
│ ✓ Desarrollo (10/10)                  │
│ ✓ Comentarios (2/2)                   │
│                                        │
│ 📊 Resumen de respuestas:             │
│ • Respondidas: 42                     │
│ • No aplica: 3                        │
│ • Para revisar: 2 [Ver]               │
│                                        │
│ ⏱ Tiempo total: 18 minutos           │
│                                        │
│ [Revisar respuestas] [Enviar]         │
└────────────────────────────────────────┘
```

*Vista Compacta de Respuestas:*
```
┌────────────────────────────────────────┐
│ Tus Respuestas - Vista Rápida         │
├────────────────────────────────────────┤
│ LIDERAZGO                              │
│ 1. Visión estratégica: ●●●●○ (4/5)    │
│ 2. Toma decisiones: ●●●○○ (3/5)       │
│ 3. Inspiración: ●●●●● (5/5)           │
│ [Editar sección]                      │
│                                        │
│ COMUNICACIÓN                           │
│ 1. Claridad: ●●●●○ (4/5)              │
│ 2. Escucha activa: ●●●●● (5/5)        │
│ [Editar sección]                      │
└────────────────────────────────────────┘
```

**Confirmación de Envío**

*Modal de Confirmación:*
```
┌────────────────────────────────────────┐
│     ¿Enviar Evaluación?               │
├────────────────────────────────────────┤
│                                        │
│ Una vez enviada, no podrás modificar  │
│ tus respuestas.                       │
│                                        │
│ ✓ Has completado todas las secciones  │
│ ✓ Has revisado tus respuestas         │
│                                        │
│ Tu evaluación es anónima y            │
│ confidencial.                          │
│                                        │
│ [Cancelar] [Confirmar y Enviar]       │
└────────────────────────────────────────┘
```

*Pantalla de Éxito:*
```
┌────────────────────────────────────────┐
│     ✅ ¡Evaluación Enviada!           │
├────────────────────────────────────────┤
│                                        │
│ Gracias por completar la evaluación   │
│ 360° de Juan Pérez.                   │
│                                        │
│ Tu feedback es valioso para su        │
│ desarrollo profesional.                │
│                                        │
│ 📧 Recibirás un email de              │
│ confirmación en breve.                 │
│                                        │
│ ¿Tienes más evaluaciones pendientes?  │
│                                        │
│ • María García (vence en 5 días)      │
│   [Evaluar ahora]                     │
│                                        │
│ • Carlos López (vence en 7 días)      │
│   [Evaluar ahora]                     │
│                                        │
│ [Ir al inicio] [Cerrar]               │
└────────────────────────────────────────┘
```

## 5.4 Casos Especiales y Manejo de Errores

### Interrupciones y Recuperación

**Pérdida de Conexión:**
```
┌────────────────────────────────────────┐
│     ⚠️ Sin Conexión                   │
├────────────────────────────────────────┤
│                                        │
│ No hay conexión a internet.           │
│ Tus respuestas están guardadas        │
│ localmente.                            │
│                                        │
│ Se sincronizarán cuando se            │
│ restablezca la conexión.               │
│                                        │
│ [Continuar sin conexión]              │
│ [Intentar reconectar]                 │
└────────────────────────────────────────┘
```

**Timeout de Sesión:**
```
┌────────────────────────────────────────┐
│     Sesión Expirada                   │
├────────────────────────────────────────┤
│                                        │
│ Por seguridad, tu sesión ha           │
│ expirado después de 30 minutos        │
│ de inactividad.                        │
│                                        │
│ Tus respuestas han sido guardadas.    │
│                                        │
│ [Volver a ingresar]                   │
└────────────────────────────────────────┘
```

### Validaciones y Restricciones

**Evaluación Expirada:**
```
┌────────────────────────────────────────┐
│     Plazo Vencido                     │
├────────────────────────────────────────┤
│                                        │
│ El plazo para completar esta          │
│ evaluación venció el 31/01/2025.      │
│                                        │
│ Si necesitas una extensión,           │
│ contacta al administrador.            │
│                                        │
│ 📧 admin@empresa.com                  │
│ 📱 +1234567890                        │
│                                        │
│ [Solicitar extensión] [Cerrar]        │
└────────────────────────────────────────┘
```

**Evaluación ya Completada:**
```
┌────────────────────────────────────────┐
│     Evaluación Completada             │
├────────────────────────────────────────┤
│                                        │
│ Ya completaste esta evaluación        │
│ el 15/01/2025 a las 10:30 AM.        │
│                                        │
│ Las respuestas no pueden ser          │
│ modificadas una vez enviadas.         │
│                                        │
│ [Ver resumen] [Cerrar]                │
└────────────────────────────────────────┘
```

---

# MÓDULO 6: AGREGACIÓN Y SCORING

## 6.1 Propósito del Módulo

Procesar, agregar y calcular los resultados de las evaluaciones 360°, transformando las respuestas individuales en insights accionables mediante algoritmos de normalización, ponderación y análisis estadístico.

## 6.2 Conceptos Fundamentales

### Modelo de Agregación

**Niveles de Agregación:**
```
Respuestas Individuales
    ↓
Agregación por Pregunta
    ↓
Agregación por Subdimensión
    ↓
Agregación por Categoría
    ↓
Score por Tipo de Evaluador
    ↓
Score Global 360°
```

### Tipos de Cálculo

**1. Score Simple**
- Promedio aritmético básico
- Sin ponderación
- Útil para comparaciones rápidas

**2. Score Ponderado**
- Pesos por categoría
- Pesos por tipo de evaluador
- Pesos por pregunta (criticidad)

**3. Score Normalizado**
- Ajuste por sesgo de evaluador
- Normalización por escala
- Estandarización Z-score

**4. Score Percentil**
- Comparación con población
- Ranking relativo
- Benchmarking

### Métricas de Análisis

**Medidas de Tendencia Central:**
- Media (promedio)
- Mediana (valor central)
- Moda (más frecuente)

**Medidas de Dispersión:**
- Desviación estándar
- Rango (máximo - mínimo)
- Coeficiente de variación

**Medidas de Consenso:**
- Acuerdo inter-evaluador
- Índice de concordancia
- Análisis de outliers

**Análisis de Brechas:**
- Gap autoevaluación vs otros
- Gap por tipo de evaluador
- Gap vs objetivo/benchmark

## 6.3 Funcionalidades del Módulo

### 6.3.1 Procesamiento de Respuestas

**Recolección y Validación**

*Pipeline de Procesamiento:*
```
1. RECOLECCIÓN
   ├── Identificar evaluaciones completadas
   ├── Agrupar por Evaluation360Session
   └── Verificar integridad de datos

2. VALIDACIÓN
   ├── Verificar umbrales mínimos
   ├── Identificar respuestas inválidas
   ├── Marcar outliers potenciales
   └── Confirmar reglas de anonimato

3. TRANSFORMACIÓN
   ├── Normalizar escalas diferentes
   ├── Convertir a valores numéricos
   ├── Aplicar polaridad de preguntas
   └── Manejar valores faltantes

4. AGREGACIÓN
   ├── Calcular por evaluador
   ├── Agrupar por tipo
   ├── Consolidar por dimensión
   └── Generar score global
```

**Manejo de Datos Faltantes**

*Estrategias por Caso:*
```
Si falta pregunta individual:
├── Si <10% faltantes → Ignorar en cálculo
├── Si 10-30% → Imputar con media de categoría
├── Si >30% → Invalidar subdimensión
└── Marcar en reporte

Si falta evaluador completo:
├── Si cumple mínimo → Proceder normal
├── Si no cumple → Aplicar regla de fallback
└── Documentar en metadata

Si "No Aplica/No Observado":
├── Excluir del cálculo
├── Ajustar denominador
└── Reportar % de N/A
```

### 6.3.2 Algoritmos de Scoring

**Cálculo Base por Pregunta**

*Fórmula Simple:*
```
Score_pregunta = Σ(respuestas) / n_evaluadores

Donde:
- respuestas = valores numéricos normalizados
- n_evaluadores = total - NA_count

Ejemplo:
Pregunta: "Demuestra liderazgo"
Jefe: 5, Pares: [4,4,3], Subordinados: [4,5,4,3]
Score = (5 + 4 + 4 + 3 + 4 + 5 + 4 + 3) / 8 = 4.0
```

**Agregación por Subdimensión**

*Cálculo Ponderado:*
```
Score_subdimension = Σ(score_pregunta × peso_pregunta) / Σ(pesos)

Ejemplo: Subdimensión "Visión Estratégica"
├── P1: Define objetivos (peso: 1.5) = 4.2
├── P2: Comunica visión (peso: 1.0) = 3.8
├── P3: Inspira al equipo (peso: 1.2) = 4.5
Score = (4.2×1.5 + 3.8×1.0 + 4.5×1.2) / 3.7 = 4.17
```

**Agregación por Categoría**

*Promedio de Subdimensiones:*
```
Categoría: LIDERAZGO
├── Visión Estratégica: 4.17
├── Toma de Decisiones: 3.92
├── Gestión del Cambio: 4.33
└── Influencia: 4.08

Score_categoría = (4.17 + 3.92 + 4.33 + 4.08) / 4 = 4.13
```

**Score por Tipo de Evaluador**

*Agregación Segregada:*
```
PERSPECTIVAS SEPARADAS:

Autoevaluación: 4.5
├── Todas las respuestas del evaluado

Jefatura: 4.2
├── Promedio de todos los jefes

Pares: 3.8
├── Promedio de todos los pares
└── Mínimo 3 para mostrar

Subordinados: 4.1
├── Promedio de todos los subordinados
└── Mínimo 3 para mostrar

Externos: 3.9
├── Promedio de evaluadores externos
└── Si aplica
```

**Score Global 360°**

*Cálculo con Ponderación:*
```
Score_360 = Σ(score_tipo × peso_tipo) / Σ(pesos)

Ponderación típica:
├── Autoevaluación: 10%
├── Jefatura: 30%
├── Pares: 30%
├── Subordinados: 30%
└── Externos: 0% (informativo)

Ejemplo:
360° = (4.5×0.1 + 4.2×0.3 + 3.8×0.3 + 4.1×0.3) / 1.0
360° = 4.08
```

### 6.3.3 Normalización y Ajustes

**Normalización de Escalas**

*Conversión a Escala Común:*
```
Escala original → Escala 0-100

Escala 1-5:
normalized = ((valor - 1) / 4) × 100

Escala 1-7:
normalized = ((valor - 1) / 6) × 100

Escala 1-10:
normalized = ((valor - 1) / 9) × 100

Ejemplo:
4 en escala 1-5 = ((4-1)/4) × 100 = 75%
```

**Ajuste por Sesgo del Evaluador**

*Detección de Patrones:*
```
Sesgos comunes:
├── Leniente: Promedio >4.5 en escala 1-5
├── Severo: Promedio <2.5
├── Central: 80% respuestas en valores medios
└── Extremo: 80% respuestas en extremos

Ajuste Z-Score:
z = (x - μ_evaluador) / σ_evaluador
adjusted = μ_global + (z × σ_global)
```

**Identificación de Outliers**

*Criterios de Detección:*
```
Outlier si:
├── |z-score| > 2.5
├── Fuera de Q1 - 1.5×IQR o Q3 + 1.5×IQR
├── Diferencia >2 puntos del promedio grupo
└── Patrón sistemático (todo 1 o todo 5)

Manejo:
├── Marcar pero incluir
├── Análisis separado
├── Investigar si crítico
└── Documentar en reporte
```

### 6.3.4 Análisis Avanzados

**Análisis de Brechas (Gap Analysis)**

*Tipos de Brechas:*
```
1. BRECHA AUTOPERCEPCIÓN
   Gap = Autoevaluación - Promedio Otros
   
   Interpretación:
   ├── Gap > +0.5: Sobreestimación
   ├── Gap -0.5 a +0.5: Alineado
   └── Gap < -0.5: Subestimación

2. BRECHA JERÁRQUICA
   Gap_vertical = Jefe - Subordinados
   
   Interpretación:
   ├── Gap > +0.5: Percepción descendente
   ├── Gap < -0.5: Percepción ascendente
   └── Indica problemas de comunicación

3. BRECHA VS OBJETIVO
   Gap_objetivo = Score - Target
   
   Ejemplo:
   ├── Target Liderazgo: 4.0
   ├── Score actual: 3.7
   └── Gap: -0.3 (desarrollo requerido)
```

**Análisis de Consenso**

*Medición de Acuerdo:*
```
ÍNDICE DE CONSENSO (IC):
IC = 1 - (σ / σ_max)

Donde:
- σ = desviación estándar
- σ_max = desviación máxima posible

Interpretación:
├── IC > 0.8: Alto consenso
├── IC 0.6-0.8: Consenso moderado
├── IC < 0.6: Bajo consenso

Ejemplo por categoría:
Comunicación: IC = 0.85 (alto acuerdo)
Liderazgo: IC = 0.62 (opiniones mixtas)
```

**Análisis de Fortalezas y Oportunidades**

*Identificación Automática:*
```
FORTALEZAS (Top 5):
1. Trabajo en equipo: 4.6 ⭐
2. Comunicación: 4.5 ⭐
3. Orientación cliente: 4.4
4. Responsabilidad: 4.3
5. Adaptabilidad: 4.2

OPORTUNIDADES (Bottom 5):
1. Delegación: 2.8 ⚠️
2. Gestión conflictos: 3.0 ⚠️
3. Pensamiento estratégico: 3.2
4. Innovación: 3.3
5. Desarrollo de otros: 3.4

QUICK WINS (Alto impacto, fácil mejora):
- Retroalimentación regular
- Reconocimiento del equipo
```

**Benchmarking**

*Comparación con Referencias:*
```
COMPARACIÓN CON GRUPOS:

Vs. Mismo Rol (n=45):
Tu score: 4.1
Promedio grupo: 3.9
Percentil: 67 (superior al 67%)

Vs. Mismo Nivel:
Tu score: 4.1
Promedio nivel: 4.0
Percentil: 55

Vs. High Performers:
Tu score: 4.1
Promedio HP: 4.5
Gap: -0.4

Ranking:
En tu área: 3/15 🥉
En tu rol: 8/45
Global org: 23/150
```

### 6.3.5 Generación de Resultados

**Estructura de Resultados**

*Objeto de Resultados 360°:*
```javascript
Results360 = {
  session_id: "360_jp_2025q1",
  evaluatee_id: "user_789",
  process_date: "2025-02-01",
  
  // Scores globales
  global_score: 4.08,
  percentile: 72,
  
  // Scores por tipo evaluador
  scores_by_type: {
    self: { score: 4.5, n: 1 },
    manager: { score: 4.2, n: 1 },
    peers: { score: 3.8, n: 5 },
    direct_reports: { score: 4.1, n: 8 },
    external: null
  },
  
  // Scores por categoría
  scores_by_category: {
    leadership: {
      score: 4.13,
      subdimensions: {
        strategic_vision: 4.17,
        decision_making: 3.92,
        change_management: 4.33,
        influence: 4.08
      }
    },
    communication: { score: 3.95, ... },
    teamwork: { score: 4.21, ... }
  },
  
  // Análisis
  gaps: {
    self_others: 0.5,
    manager_reports: 0.1,
    vs_target: -0.2
  },
  
  consensus: {
    overall: 0.73,
    by_category: { ... }
  },
  
  strengths: ["teamwork", "responsibility"],
  opportunities: ["delegation", "conflict_mgmt"],
  
  // Metadata
  response_rate: 0.92,
  evaluators_count: 15,
  processing_notes: [],
  flags: ["low_consensus_leadership"]
}
```

**Cache y Performance**

*Estrategia de Procesamiento:*
```
Procesamiento Incremental:
├── Calcular al recibir cada respuesta
├── Cache parcial por evaluador
├── Recálculo solo de afectados
└── Resultado final on-demand

Procesamiento Batch:
├── Ejecutar al cerrar campaña
├── Procesar todas las sessions
├── Generar y cachear resultados
└── Optimizado para volumen

Híbrido (recomendado):
├── Preview en tiempo real (cache parcial)
├── Procesamiento final al cerrar
├── Recálculo si hay cambios
└── Balance performance/actualidad
```

## 6.4 Reglas de Negocio

### Umbrales y Validaciones

**Mínimos para Mostrar Resultados:**
```
Por tipo de evaluador:
├── Autoevaluación: Siempre (n=1)
├── Jefatura: Siempre (n>=1)
├── Pares: Si n >= 3
├── Subordinados: Si n >= 3
└── Externos: Si n >= 2

Si no cumple mínimo:
├── Opción 1: No mostrar categoría
├── Opción 2: Combinar con otra
├── Opción 3: Mostrar con advertencia
└── Configurable por organización
```

**Validación de Calidad:**
```
Criterios de calidad:
├── Completitud > 80%
├── Tiempo de respuesta > 5 min
├── Varianza en respuestas > 0.2
├── Sin patrones sistemáticos
└── Coherencia lógica

Si no cumple:
├── Flag para revisión
├── Incluir con advertencia
├── Peso reducido
└── Análisis separado
```

### Configuración por Organización

**Parámetros Configurables:**
```
CONFIGURACIÓN DE SCORING:

Ponderación por tipo:
├── [ ] Usar ponderación estándar
├── [x] Personalizada:
│   ├── Auto: [10]%
│   ├── Jefe: [35]%
│   ├── Pares: [30]%
│   └── Subordinados: [25]%

Normalización:
├── [x] Ajustar sesgo evaluador
├── [ ] Mantener valores originales

Outliers:
├── [ ] Excluir automáticamente
├── [x] Incluir con flag
├── [ ] Revisar caso por caso

Benchmarking:
├── [x] Comparar con mismo rol
├── [x] Comparar con nivel
├── [ ] Comparar con toda la org
```

## 6.5 Interfaz de Usuario

### Dashboard de Procesamiento

**Vista de Admin - Estado de Procesamiento:**
```
┌────────────────────────────────────────┐
│ PROCESAMIENTO DE RESULTADOS Q1 2025   │
├────────────────────────────────────────┤
│                                        │
│ Estado: Procesando...                 │
│ ████████████░░░░ 78% (37/47)          │
│                                        │
│ ✅ Completados: 37                    │
│ ⏳ En proceso: 5                      │
│ ⚠️ Con alertas: 3                     │
│ ⏸️ Pendientes: 2                      │
│                                        │
│ Tiempo estimado: 3 minutos            │
│                                        │
├────────────────────────────────────────┤
│ ALERTAS:                              │
│                                        │
│ ⚠ Juan Pérez: Solo 2 pares           │
│   (mínimo 3) - Combinando con subord. │
│                                        │
│ ⚠ María García: Outlier detectado     │
│   Evaluador #3 - Revisar              │
│                                        │
│ ⚠ Carlos López: Baja participación    │
│   Solo 60% evaluadores respondieron   │
│                                        │
│ [Ver todas] [Configurar reglas]       │
└────────────────────────────────────────┘
```

### Vista Previa de Resultados

**Preview para Admin (Pre-liberación):**
```
┌────────────────────────────────────────┐
│ RESULTADOS 360° - Juan Pérez          │
│ ⚠️ BORRADOR - No liberado             │
├────────────────────────────────────────┤
│                                        │
│ Score Global: 4.1/5.0 ⭐⭐⭐⭐          │
│ Percentil: 72 (Top 28%)               │
│                                        │
│ Por Evaluador:                        │
│ ├── Auto: 4.5 ████████████░           │
│ ├── Jefe: 4.2 ████████░░░░           │
│ ├── Pares: 3.8 ███████░░░░░          │
│ └── Subord: 4.1 ████████░░░░          │
│                                        │
│ Top Fortalezas:                       │
│ 1. Trabajo en equipo (4.6)            │
│ 2. Comunicación (4.5)                 │
│                                        │
│ Oportunidades:                        │
│ 1. Delegación (2.8)                   │
│ 2. Gestión conflictos (3.0)           │
│                                        │
│ [Ver detalle] [Ajustar] [Liberar]     │
└────────────────────────────────────────┘
```

### Panel de Configuración

**Configuración de Algoritmos:**
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN DE CÁLCULO              │
├────────────────────────────────────────┤
│                                        │
│ MÉTODO DE AGREGACIÓN:                 │
│ ○ Simple (promedio)                   │
│ ● Ponderado                          │
│ ○ Mediana                            │
│                                        │
│ PONDERACIÓN POR TIPO:                 │
│ Auto:     [▓▓▓░░] 10%                │
│ Jefe:     [▓▓▓▓▓▓▓] 35%             │
│ Pares:    [▓▓▓▓▓▓] 30%              │
│ Subord:   [▓▓▓▓▓] 25%               │
│           Total: 100% ✓               │
│                                        │
│ NORMALIZACIÓN:                         │
│ ☑ Ajustar sesgo del evaluador        │
│ ☑ Estandarizar escalas               │
│ ☐ Aplicar curva normal               │
│                                        │
│ MANEJO DE OUTLIERS:                   │
│ ● Incluir con flag                   │
│ ○ Excluir si z-score > 2.5          │
│ ○ Cap en percentil 5/95              │
│                                        │
│ [Guardar] [Aplicar a todas]           │
└────────────────────────────────────────┘
```

---

## INTEGRACIÓN ENTRE MÓDULOS 5 Y 6

### Flujo de Datos

**De Evaluación a Resultados:**
```
Evaluador completa (Módulo 5)
    ↓
Respuestas guardadas en DB
    ↓
Trigger de procesamiento
    ↓
Validación de integridad
    ↓
Agregación incremental (Módulo 6)
    ↓
Cache de resultados parciales
    ↓
Al completar todos:
    ↓
Procesamiento final
    ↓
Generación de resultados
    ↓
Disponible para reportes (Módulo 7)
```

### Sincronización

**Actualización en Tiempo Real:**
```
Cada respuesta guardada:
├── Update response_count
├── Update completion_rate
├── Recalcular si crítico
└── Notificar cambios

Al completar evaluación:
├── Marcar como completada
├── Trigger aggregation
├── Update dashboards
└── Check campaign status
```

### Validaciones Cruzadas

**Coherencia de Datos:**
```
Verificar:
├── Respuestas ↔ Test version
├── Evaluadores ↔ Configuración
├── Completitud ↔ Requerimientos
├── Anonimato ↔ Umbrales
└── Timestamps ↔ Deadlines
```

---

## MÉTRICAS Y KPIs

### Módulo 5 - Experiencia de Usuario

**Métricas de Usabilidad:**
```
Tasa de completitud: 92%
Tiempo promedio: 18 minutos
Abandonos: 3%
Retornos para completar: 15%
Preguntas más saltadas: Top 5
Dispositivos: 60% desktop, 40% mobile
```

### Módulo 6 - Calidad de Datos

**Métricas de Procesamiento:**
```
Evaluaciones procesadas: 523/hora
Tiempo de cálculo: <2s por evaluación
Outliers detectados: 2.3%
Ajustes por sesgo: 15% de evaluadores
Consenso promedio: 0.73
Cobertura de respuestas: 94%
```

---

## CONSIDERACIONES TÉCNICAS

### Performance Módulo 5

**Optimizaciones:**
- Auto-save con debounce 500ms
- Lazy loading de secciones
- Caché local de respuestas
- Compresión de payloads
- CDN para assets

### Performance Módulo 6

**Optimizaciones:**
- Cálculo incremental
- Paralelización de agregaciones
- Índices en queries frecuentes
- Cache de resultados
- Background processing

### Escalabilidad

**Capacidad Target:**
- 10,000 evaluaciones simultáneas
- 100,000 respuestas/hora
- Procesamiento <5min para 1000 evaluaciones
- Sin degradación hasta 1M registros

---

## PRÓXIMOS PASOS

Con los Módulos 5 y 6 completos, el sistema puede:

1. **Recolectar respuestas** de manera eficiente
2. **Procesar y agregar** resultados automáticamente
3. **Generar insights** mediante análisis avanzados
4. **Preparar datos** para visualización (Módulo 7)

El siguiente paso crítico es implementar el Módulo 7 (Reportes y Visualización) para que los usuarios puedan acceder y entender sus resultados de manera efectiva.


---

# MÓDULO 7: REPORTES Y VISUALIZACIÓN

## 7.1 Propósito del Módulo

Transformar los resultados procesados en insights visuales accionables mediante dashboards interactivos, reportes personalizados y análisis comparativos que faciliten la comprensión y toma de decisiones tanto para evaluados como para la organización.

## 7.2 Conceptos Fundamentales

### Tipos de Reportes

**1. Reporte Individual 360°**
- Para un evaluado específico
- Resultados detallados por dimensión
- Comparación de perspectivas
- Plan de desarrollo sugerido

**2. Reporte Comparativo**
- Múltiples evaluados
- Benchmarking entre pares
- Rankings por competencia
- Identificación de talentos

**3. Reporte Organizacional**
- Vista agregada por área/equipo
- Tendencias y patrones
- Brechas de competencias
- Necesidades de capacitación

**4. Reporte Evolutivo**
- Progreso temporal
- Comparación entre períodos
- Tendencias de mejora
- ROI de desarrollo

### Niveles de Acceso

**Evaluado:**
- Su propio reporte completo
- Comparación anónima con pares
- Recomendaciones personalizadas
- Historial de evaluaciones

**Manager:**
- Reportes de su equipo directo
- Comparaciones dentro del equipo
- Planes de desarrollo grupal
- Métricas de equipo

**HR/Admin:**
- Todos los reportes
- Análisis organizacional
- Exportación masiva
- Configuración de liberación

**Ejecutivo:**
- Dashboards estratégicos
- KPIs organizacionales
- Análisis de talento
- Tendencias macro

### Estados de Liberación

```
Estados del Reporte:
├── draft: En procesamiento
├── ready: Listo para liberar
├── released: Visible para evaluado
├── archived: Histórico
└── revised: Actualizado post-liberación
```

## 7.3 Funcionalidades del Módulo

### 7.3.1 Generación de Reportes

**Motor de Reportes**

*Pipeline de Generación:*
```
1. PREPARACIÓN DE DATOS
   ├── Recuperar resultados procesados
   ├── Aplicar filtros y segmentación
   ├── Calcular métricas adicionales
   └── Preparar datasets

2. APLICACIÓN DE PLANTILLA
   ├── Seleccionar template apropiado
   ├── Inyectar datos en estructura
   ├── Aplicar formato y estilos
   └── Generar visualizaciones

3. PERSONALIZACIÓN
   ├── Aplicar branding organizacional
   ├── Incluir/excluir secciones
   ├── Ajustar nivel de detalle
   └── Agregar comentarios custom

4. RENDERIZADO
   ├── Generar versión web (HTML)
   ├── Generar versión imprimible (PDF)
   ├── Optimizar para dispositivos
   └── Cachear resultado
```

**Plantillas de Reporte**

*Estructura Estándar Individual:*
```
REPORTE 360° INDIVIDUAL
├── 1. Resumen Ejecutivo
│   ├── Score global y percentil
│   ├── Top 3 fortalezas
│   ├── Top 3 oportunidades
│   └── Mensaje clave
│
├── 2. Resultados Generales
│   ├── Gráfico radar global
│   ├── Comparación por evaluador
│   ├── Benchmark con rol
│   └── Evolución temporal
│
├── 3. Análisis por Competencia
│   ├── Detalle por categoría
│   ├── Subdimensiones
│   ├── Preguntas específicas
│   └── Gaps identificados
│
├── 4. Perspectivas Comparadas
│   ├── Auto vs Otros
│   ├── Jefe vs Pares vs Subordinados
│   ├── Análisis de consenso
│   └── Puntos ciegos
│
├── 5. Comentarios Cualitativos
│   ├── Temas recurrentes
│   ├── Citas anonimizadas
│   ├── Sugerencias consolidadas
│   └── Word cloud
│
├── 6. Plan de Desarrollo
│   ├── Prioridades de mejora
│   ├── Acciones sugeridas
│   ├── Recursos recomendados
│   └── Timeline propuesto
│
└── 7. Anexos
    ├── Metodología
    ├── Escalas utilizadas
    ├── Glosario
    └── Siguiente pasos
```

### 7.3.2 Dashboard Interactivo - Evaluado

**Vista Principal del Evaluado**

*Dashboard Personal:*
```
┌────────────────────────────────────────┐
│ MI EVALUACIÓN 360° - Q1 2025          │
│ Juan Pérez | Gerente de Ventas        │
├────────────────────────────────────────┤
│                                        │
│ SCORE GLOBAL: 4.1/5.0 ⭐⭐⭐⭐          │
│ Percentil: 72° (Top 28%)              │
│                                        │
│ ┌──────────────────────────────┐      │
│ │    Gráfico Radar Principal    │      │
│ │         Liderazgo             │      │
│ │            5                  │      │
│ │      4  ◆━━━◆  4             │      │
│ │    ◆━━━━━━━━━━━◆            │      │
│ │  Trabajo    Comunicación      │      │
│ │  Equipo                       │      │
│ │      ◆━━━━━◆                │      │
│ │    Innovación                 │      │
│ └──────────────────────────────┘      │
│                                        │
│ [Ver Detalle] [Comparar] [Exportar]   │
└────────────────────────────────────────┘
```

*Comparación de Perspectivas:*
```
┌────────────────────────────────────────┐
│ CÓMO ME VEN DIFERENTES GRUPOS         │
├────────────────────────────────────────┤
│                                        │
│ Competencia    Auto Jefe Pares Subord │
│ ─────────────────────────────────────  │
│ Liderazgo      4.5  4.2  3.8   4.1    │
│                ▲    ━━━  ▼     ━━     │
│                                        │
│ Comunicación   4.2  4.0  3.9   4.3    │
│                ━━   ━━   ▼     ▲      │
│                                        │
│ Innovación     4.8  3.9  3.7   4.0    │
│                ▲▲   ▼    ▼     ━━     │
│                                        │
│ Trabajo Equipo 4.0  4.3  4.5   4.4    │
│                ▼    ━━   ▲     ▲      │
│                                        │
│ Leyenda: ▲ Alto ━━ Medio ▼ Bajo       │
│                                        │
│ 💡 Punto Ciego: Innovación            │
│ (Te ves mejor de lo que otros ven)    │
└────────────────────────────────────────┘
```

*Detalle por Competencia:*
```
┌────────────────────────────────────────┐
│ LIDERAZGO ESTRATÉGICO                 │
├────────────────────────────────────────┤
│                                        │
│ Score: 4.1/5.0                        │
│ ████████████░░░░                      │
│                                        │
│ Subdimensiones:                       │
│                                        │
│ Visión Estratégica         4.3 ████▓░ │
│ Toma de Decisiones         3.9 ████░░ │
│ Gestión del Cambio         4.2 ████▓░ │
│ Influencia                 4.0 ████░░ │
│                                        │
│ Top Comportamientos (+):              │
│ ✓ Define objetivos claros (4.5)       │
│ ✓ Inspira al equipo (4.4)            │
│ ✓ Comunica visión (4.3)              │
│                                        │
│ Áreas de Mejora (-):                  │
│ ⚠ Delega efectivamente (3.2)         │
│ ⚠ Gestiona conflictos (3.5)          │
│                                        │
│ [Ver todas las preguntas]             │
└────────────────────────────────────────┘
```

*Comentarios Cualitativos:*
```
┌────────────────────────────────────────┐
│ LO QUE DICEN DE TI (Anónimo)          │
├────────────────────────────────────────┤
│                                        │
│ 📝 Fortalezas mencionadas:            │
│                                        │
│ "Excelente comunicador, siempre       │
│ claro en sus expectativas"            │
│                                        │
│ "Inspira al equipo con su ejemplo     │
│ y dedicación"                          │
│                                        │
│ "Gran capacidad para resolver         │
│ problemas complejos"                   │
│                                        │
│ 📝 Sugerencias de mejora:             │
│                                        │
│ "Podría delegar más y confiar en      │
│ las capacidades del equipo"           │
│                                        │
│ "Sería bueno tener más sesiones       │
│ de retroalimentación 1:1"             │
│                                        │
│ Word Cloud:                           │
│ [Líder] [Comunicativo] [Estratégico]  │
│ [Comprometido] [Exigente] [Justo]     │
│                                        │
│ [Ver todos los comentarios]           │
└────────────────────────────────────────┘
```

### 7.3.3 Dashboard Interactivo - Manager

**Vista del Equipo**

*Panel Principal Manager:*
```
┌────────────────────────────────────────┐
│ MI EQUIPO - EVALUACIÓN 360° Q1 2025   │
│ 8 reportes directos evaluados         │
├────────────────────────────────────────┤
│                                        │
│ RESUMEN DEL EQUIPO:                   │
│ Score promedio: 3.9/5.0               │
│ Rango: 3.2 - 4.5                      │
│                                        │
│ Matriz de Talento:                    │
│ ┌─────────────────────────┐           │
│ │Alto │  ⚪  │ ⚫⚫ │ ⚫  │           │
│ │     │      │     │     │           │
│ │Medio│  ⚪  │ ⚫⚫ │     │           │
│ │     │      │     │     │           │
│ │Bajo │      │ ⚪  │     │           │
│ │     └──────┴─────┴─────┘           │
│ │      Bajo  Medio  Alto │           │
│ │      Desempeño         │           │
│ └─────────────────────────┘           │
│                                        │
│ Top Performers:                       │
│ 1. María García (4.5) ⭐              │
│ 2. Carlos López (4.3) ⭐              │
│                                        │
│ Necesitan apoyo:                      │
│ 1. Pedro Ruiz (3.2) ⚠️                │
│ 2. Laura Torres (3.4) ⚠️              │
│                                        │
│ [Ver detalle] [Comparar] [Exportar]   │
└────────────────────────────────────────┘
```

*Comparación del Equipo:*
```
┌────────────────────────────────────────┐
│ ANÁLISIS COMPARATIVO DEL EQUIPO       │
├────────────────────────────────────────┤
│                                        │
│ Por Competencia:                      │
│                                        │
│ Liderazgo                              │
│ María    ████████████ 4.5             │
│ Carlos   ███████████░ 4.3             │
│ Juan     ████████░░░░ 3.8             │
│ Ana      ████████░░░░ 3.7             │
│ Pedro    ██████░░░░░░ 3.2             │
│ Promedio ────────────  3.9            │
│                                        │
│ Comunicación                           │
│ Carlos   ████████████ 4.6             │
│ María    ███████████░ 4.4             │
│ Ana      █████████░░░ 4.1             │
│ Juan     ████████░░░░ 3.9             │
│ Pedro    ███████░░░░░ 3.5             │
│ Promedio ────────────  4.1            │
│                                        │
│ [Cambiar competencia ▼]               │
│                                        │
│ Fortalezas del Equipo:                │
│ ✓ Trabajo colaborativo (4.3)          │
│ ✓ Orientación al cliente (4.2)        │
│                                        │
│ Brechas del Equipo:                   │
│ ⚠ Innovación (3.4)                    │
│ ⚠ Gestión del tiempo (3.5)            │
└────────────────────────────────────────┘
```

### 7.3.4 Dashboard Organizacional

**Vista Ejecutiva**

*Dashboard C-Level:*
```
┌────────────────────────────────────────┐
│ DASHBOARD EJECUTIVO 360° - 2025       │
├────────────────────────────────────────┤
│                                        │
│ KPIs ORGANIZACIONALES:                │
│                                        │
│ Score Global Org: 3.95 (↑ 0.15)       │
│ Participación: 92% (523/568)          │
│ Engagement Score: 4.1/5               │
│                                        │
│ ┌──────────────────────────────┐      │
│ │ Evolución Trimestral         │      │
│ │ 4.2 ┤                        │      │
│ │ 4.0 ┤    ╱━━━━╲             │      │
│ │ 3.8 ┤━━━╱      ╲━━━         │      │
│ │ 3.6 ┤                       │      │
│ │     └─────────────────────   │      │
│ │     Q1  Q2  Q3  Q4   Q1     │      │
│ │     2024            2025     │      │
│ └──────────────────────────────┘      │
│                                        │
│ Por División:                         │
│ Comercial:    4.1 ████████▓░         │
│ Operaciones:  3.9 ████████░░         │
│ Tecnología:   4.2 █████████░         │
│ Finanzas:     3.8 ███████▓░░         │
│ RRHH:         4.0 ████████░░         │
│                                        │
│ [Drill down] [Exportar] [Compartir]   │
└────────────────────────────────────────┘
```

*Mapa de Calor Organizacional:*
```
┌────────────────────────────────────────┐
│ MATRIZ DE COMPETENCIAS ORG            │
├────────────────────────────────────────┤
│                                        │
│         Líder Comun Innov TeamW Cliente│
│ Comercial                              │
│ Gerencia  🟩   🟨   🟥   🟩    🟩   │
│ Mandos M  🟩   🟩   🟨   🟩    🟩   │
│ Operativ  🟨   🟩   🟨   🟩    🟨   │
│                                        │
│ Operaciones                            │
│ Gerencia  🟩   🟨   🟨   🟩    🟨   │
│ Mandos M  🟨   🟨   🟥   🟩    🟨   │
│ Operativ  🟨   🟩   🟨   🟩    🟩   │
│                                        │
│ Tecnología                             │
│ Gerencia  🟩   🟩   🟩   🟨    🟨   │
│ Mandos M  🟩   🟨   🟩   🟩    🟨   │
│ Operativ  🟨   🟨   🟩   🟩    🟩   │
│                                        │
│ 🟩 >4.0  🟨 3.5-4.0  🟥 <3.5         │
│                                        │
│ Gaps Críticos Identificados:          │
│ • Innovación en Mandos Medios Ops     │
│ • Comunicación cross-funcional        │
└────────────────────────────────────────┘
```

### 7.3.5 Liberación de Resultados

**Proceso de Liberación**

*Panel de Control de Liberación:*
```
┌────────────────────────────────────────┐
│ LIBERACIÓN DE RESULTADOS Q1 2025      │
├────────────────────────────────────────┤
│                                        │
│ Estado: 47 evaluaciones listas        │
│                                        │
│ ○ Liberar todos simultáneamente       │
│ ● Liberación por grupos:              │
│   ├── Gerencia: [15/01 9:00 AM]      │
│   ├── Mandos medios: [16/01 9:00 AM] │
│   └── Operativos: [17/01 9:00 AM]    │
│ ○ Liberación manual individual        │
│                                        │
│ Configuración de notificación:        │
│ ☑ Email al evaluado                  │
│ ☑ Email al jefe directo              │
│ ☐ Notificación in-app                │
│                                        │
│ Acceso a resultados:                  │
│ ☑ Reporte completo                   │
│ ☑ Comparación con rol (anónima)      │
│ ☐ Ranking (controvertido)            │
│ ☑ Plan de desarrollo                 │
│                                        │
│ Sesiones de feedback:                 │
│ ☑ Requerir sesión con jefe           │
│ ☐ Sesión con RRHH opcional           │
│ ☐ Coaching externo disponible        │
│                                        │
│ [Preview] [Programar] [Liberar ahora] │
└────────────────────────────────────────┘
```

*Estados de Liberación Individual:*
```
┌────────────────────────────────────────┐
│ CONTROL DE LIBERACIÓN INDIVIDUAL      │
├────────────────────────────────────────┤
│ Buscar: [________________] 🔍         │
│                                        │
│ Nombre        Estado    Acción        │
│ ───────────────────────────────────── │
│ Juan Pérez    ✅ Liberado  [Ver]      │
│               15/01 9:15 AM            │
│                                        │
│ María García  ⏳ Programado [Editar]  │
│               16/01 9:00 AM            │
│                                        │
│ Carlos López  🔒 Retenido  [Revisar]  │
│               Pending review           │
│                                        │
│ Ana Martínez  ⚠️ Pendiente [Liberar]  │
│               Falta sesión feedback    │
│                                        │
│ Filtrar por: [Estado ▼] [Área ▼]     │
└────────────────────────────────────────┘
```

### 7.3.6 Exportación y Compartir

**Formatos de Exportación**

*Opciones de Descarga:*
```
┌────────────────────────────────────────┐
│ EXPORTAR REPORTE                      │
├────────────────────────────────────────┤
│                                        │
│ Formato:                              │
│ ● PDF - Reporte completo              │
│ ○ PDF - Resumen ejecutivo             │
│ ○ Excel - Datos detallados            │
│ ○ PowerPoint - Presentación           │
│ ○ Word - Documento editable           │
│                                        │
│ Contenido:                            │
│ ☑ Resultados cuantitativos           │
│ ☑ Gráficos y visualizaciones         │
│ ☑ Comentarios (anonimizados)         │
│ ☑ Plan de desarrollo                 │
│ ☐ Comparaciones nominativas          │
│ ☐ Datos raw sin procesar             │
│                                        │
│ Personalización:                      │
│ ☑ Logo de la empresa                 │
│ ☑ Colores corporativos              │
│ ☐ Marca de agua "CONFIDENCIAL"       │
│                                        │
│ [Preview] [Generar y Descargar]       │
└────────────────────────────────────────┘
```

---

# MÓDULO 8: GESTIÓN AVANZADA

## 8.1 Propósito del Módulo

Proporcionar herramientas avanzadas de administración, auditoría y gestión de casos especiales que aseguren la integridad, trazabilidad y flexibilidad operativa del sistema 360°.

## 8.2 Conceptos Fundamentales

### Sistema de Auditoría

**Niveles de Logging:**
```
Niveles de registro:
├── CRITICAL: Errores del sistema, seguridad
├── ERROR: Fallos en procesos, datos corruptos
├── WARNING: Comportamientos anómalos, límites
├── INFO: Acciones importantes, cambios de estado
├── DEBUG: Detalles técnicos, trazas completas
└── AUDIT: Acciones de usuario, compliance
```

**Tipos de Eventos Auditados:**
- Acciones administrativas
- Cambios en configuración
- Acceso a datos sensibles
- Modificaciones de resultados
- Liberación de reportes
- Exportación de datos
- Intentos de acceso no autorizado

### Gestión de Casos Edge

**Casos Especiales Comunes:**
- Empleado dado de baja durante evaluación
- Cambio de jefe durante proceso
- Reorganización de áreas
- Fusión de equipos
- Evaluador no disponible
- Conflictos de interés
- Solicitudes de rectificación

### Políticas de Retención

**Períodos de Retención:**
```
Tipo de Datos         | Retención | Acción Post-Retención
─────────────────────────────────────────────────────
Respuestas raw       | 2 años    | Anonimizar
Resultados procesados| 5 años    | Archivar
Reportes PDF         | 3 años    | Comprimir
Logs de auditoría    | 7 años    | Cold storage
Tokens               | 90 días   | Eliminar
Emails               | 1 año     | Purgar
Analytics            | Indefinido| Agregado
```

## 8.3 Funcionalidades del Módulo

### 8.3.1 Sistema de Auditoría

**Log de Auditoría Completo**

*Visor de Logs:*
```
┌────────────────────────────────────────┐
│ REGISTRO DE AUDITORÍA                 │
├────────────────────────────────────────┤
│ Filtros:                              │
│ Fecha: [15/01/2025] - [31/01/2025]    │
│ Usuario: [Todos ▼] Acción: [Todas ▼] │
│ Nivel: [INFO+] Buscar: [___________]  │
│                                        │
│ 1,247 eventos encontrados             │
│                                        │
│ Tiempo    Usuario    Acción   Detalle │
│ ─────────────────────────────────────  │
│ 09:15:32  admin@co  RELEASE  Liberó   │
│ [INFO]              RESULTS  47 report│
│                              Q1 2025   │
│                                        │
│ 09:14:15  juan.p@   ACCESS   Accedió  │
│ [AUDIT]             REPORT   su report│
│                              360°      │
│                                        │
│ 09:12:47  system    PROCESS  Completó │
│ [INFO]              COMPLETE agregació│
│                              Campaign  │
│                                        │
│ 09:10:23  maria.g@  EXPORT   Exportó  │
│ [WARNING]           DATA     15 report│
│                              a Excel   │
│                                        │
│ [Ver más] [Exportar] [Analizar]       │
└────────────────────────────────────────┘
```

*Detalle de Evento:*
```
┌────────────────────────────────────────┐
│ DETALLE DE EVENTO #A2B5K9             │
├────────────────────────────────────────┤
│                                        │
│ Timestamp: 2025-01-31 09:15:32.456    │
│ Usuario: admin@company.com             │
│ IP: 192.168.1.100                     │
│ Sesión: sess_abc123xyz                │
│                                        │
│ Acción: RELEASE_RESULTS               │
│ Objeto: Campaign Q1 2025              │
│ Cambios:                              │
│ ├── status: "ready" → "released"      │
│ ├── released_at: null → "2025-01..."  │
│ ├── released_by: null → "admin@..."   │
│ └── affected_count: 47                │
│                                        │
│ Context:                              │
│ {                                     │
│   "campaign_id": "camp_q1_2025",     │
│   "total_evaluations": 47,           │
│   "notification_sent": true,         │
│   "method": "scheduled",             │
│   "client": "web_app"                │
│ }                                     │
│                                        │
│ Stack Trace: [Expandir]              │
│                                        │
│ [Cerrar] [Investigar] [Reportar]     │
└────────────────────────────────────────┘
```

**Dashboard de Auditoría**

*Métricas de Actividad:*
```
┌────────────────────────────────────────┐
│ ACTIVIDAD DEL SISTEMA - ÚLTIMOS 30D   │
├────────────────────────────────────────┤
│                                        │
│ Acciones por Tipo:                    │
│ ┌──────────────────────────────┐      │
│ │ LOGIN        ████████ 1,234  │      │
│ │ VIEW_REPORT  ██████ 987      │      │
│ │ EXPORT       ███ 234         │      │
│ │ MODIFY       ██ 156          │      │
│ │ DELETE       █ 12            │      │
│ └──────────────────────────────┘      │
│                                        │
│ Usuarios Más Activos:                 │
│ 1. admin@co (487 acciones)            │
│ 2. hr.manager@ (234 acciones)         │
│ 3. juan.perez@ (156 acciones)         │
│                                        │
│ Eventos Críticos: 3 ⚠️                │
│ ├── Intento de acceso no autorizado   │
│ ├── Exportación masiva de datos       │
│ └── Modificación post-liberación      │
│                                        │
│ [Ver detalles] [Configurar alertas]   │
└────────────────────────────────────────┘
```

### 8.3.2 Exportación Masiva de Datos

**Centro de Exportación**

*Wizard de Exportación:*
```
┌────────────────────────────────────────┐
│ EXPORTACIÓN MASIVA - PASO 1/4         │
├────────────────────────────────────────┤
│                                        │
│ Seleccionar Alcance:                  │
│                                        │
│ ○ Campaña completa                    │
│   [Q1 2025 ▼]                        │
│                                        │
│ ● Evaluaciones específicas            │
│   ☑ Juan Pérez                       │
│   ☑ María García                     │
│   ☐ Carlos López                     │
│   [Seleccionar todos] [Limpiar]      │
│                                        │
│ ○ Rango de fechas                     │
│   Desde: [__/__/____]                │
│   Hasta: [__/__/____]                │
│                                        │
│ ○ Por criterios                       │
│   Job Family: [Todas ▼]              │
│   Área: [Todas ▼]                    │
│   Score: [Min___] [Max___]           │
│                                        │
│ Total seleccionado: 23 evaluaciones   │
│                                        │
│ [Cancelar] [Siguiente →]              │
└────────────────────────────────────────┘
```

*Selección de Campos:*
```
┌────────────────────────────────────────┐
│ EXPORTACIÓN MASIVA - PASO 2/4         │
├────────────────────────────────────────┤
│                                        │
│ Campos a Exportar:                    │
│                                        │
│ IDENTIFICACIÓN:                       │
│ ☑ ID Evaluación                      │
│ ☑ Nombre Evaluado                    │
│ ☑ Email                              │
│ ☑ Job Family                         │
│ ☐ ID Empleado                        │
│                                        │
│ RESULTADOS:                           │
│ ☑ Score Global                       │
│ ☑ Scores por Categoría               │
│ ☑ Scores por Tipo Evaluador          │
│ ☐ Scores por Pregunta (detallado)    │
│ ☐ Respuestas raw                     │
│                                        │
│ ANÁLISIS:                             │
│ ☑ Percentiles                        │
│ ☑ Gaps                               │
│ ☑ Fortalezas/Oportunidades           │
│ ☐ Índices de consenso               │
│                                        │
│ METADATA:                             │
│ ☑ Fecha evaluación                   │
│ ☑ Tasa de respuesta                  │
│ ☐ Tiempos de completitud             │
│                                        │
│ [← Anterior] [Siguiente →]           │
└────────────────────────────────────────┘
```

*Formato y Privacidad:*
```
┌────────────────────────────────────────┐
│ EXPORTACIÓN MASIVA - PASO 3/4         │
├────────────────────────────────────────┤
│                                        │
│ Formato de Salida:                    │
│ ● Excel (.xlsx)                      │
│ ○ CSV (.csv)                         │
│ ○ JSON (.json)                       │
│ ○ SPSS (.sav)                        │
│                                        │
│ Estructura:                           │
│ ● Un archivo con múltiples hojas     │
│ ○ Múltiples archivos (uno por eval)  │
│ ○ Archivo ZIP con estructura         │
│                                        │
│ Privacidad:                           │
│ ☑ Anonimizar evaluadores             │
│ ☑ Remover comentarios identificables │
│ ☐ Ofuscar nombres (usar IDs)         │
│ ☑ Aplicar reglas de mínimos          │
│                                        │
│ Seguridad:                            │
│ ☐ Encriptar archivo (contraseña)     │
│ ☑ Agregar marca de agua              │
│ ☑ Incluir disclaimer legal           │
│                                        │
│ [← Anterior] [Siguiente →]           │
└────────────────────────────────────────┘
```

### 8.3.3 Gestión de Casos Especiales

**Panel de Casos Edge**

*Centro de Excepciones:*
```
┌────────────────────────────────────────┐
│ GESTIÓN DE CASOS ESPECIALES           │
├────────────────────────────────────────┤
│                                        │
│ Casos Activos: 7                      │
│                                        │
│ 🔴 URGENTE (2)                        │
│ ├── Empleado dado de baja            │
│ │   Juan Pérez - Evaluación activa   │
│ │   [Cancelar] [Completar] [Pausar]  │
│ │                                     │
│ └── Conflicto de interés reportado   │
│     María evalúa a Carlos (pareja)   │
│     [Reasignar] [Excluir] [Permitir] │
│                                        │
│ 🟡 ATENCIÓN (3)                       │
│ ├── Cambio de jefe durante proceso   │
│ │   Ana Martínez - 50% completado    │
│ │   [Mantener ambos] [Solo nuevo]    │
│ │                                     │
│ ├── Evaluador no disponible          │
│ │   Pedro fuera por enfermedad       │
│ │   [Esperar] [Reemplazar] [Omitir]  │
│ │                                     │
│ └── Solicitud de extensión           │
│     Carlos López - Vence mañana      │
│     [Aprobar +7d] [Aprobar +3d] [X] │
│                                        │
│ 🟢 RESUELTOS HOY (2)                 │
│ └── Ver historial                    │
│                                        │
│ [Políticas] [Automatizar] [Reportes] │
└────────────────────────────────────────┘
```

*Gestión de Bajas:*
```
┌────────────────────────────────────────┐
│ EMPLEADO DADO DE BAJA                 │
├────────────────────────────────────────┤
│                                        │
│ Evaluado: Juan Pérez                  │
│ Fecha de baja: 20/01/2025             │
│ Evaluación: Q1 2025 (70% completada)  │
│                                        │
│ Respuestas recibidas:                 │
│ ✅ Autoevaluación                     │
│ ✅ Jefe (1/1)                        │
│ ⚡ Pares (3/5)                       │
│ ⚡ Subordinados (4/8)                │
│                                        │
│ Opciones disponibles:                 │
│                                        │
│ ○ Cancelar evaluación                 │
│   - Se pierden todas las respuestas   │
│   - No aparece en reportes            │
│                                        │
│ ● Completar con datos actuales        │
│   - Procesar con respuestas recibidas │
│   - Marcar como "parcial"            │
│   - Incluir nota explicativa          │
│                                        │
│ ○ Pausar indefinidamente              │
│   - Mantener datos para futuro        │
│   - No procesar ahora                │
│                                        │
│ Nota para el registro:                │
│ [_________________________________]   │
│                                        │
│ [Cancelar] [Confirmar Acción]         │
└────────────────────────────────────────┘
```

### 8.3.4 Configuración del Sistema

**Panel de Configuración Global**

*Políticas de Privacidad:*
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN DE PRIVACIDAD           │
├────────────────────────────────────────┤
│                                        │
│ ANONIMATO DE EVALUADORES:             │
│                                        │
│ Umbrales mínimos para anonimato:      │
│ Pares:         [3] evaluadores        │
│ Subordinados:  [3] evaluadores        │
│ Externos:      [2] evaluadores        │
│                                        │
│ Si no cumple mínimo:                  │
│ ● Combinar categorías                 │
│   Combinar: [Pares + Subordinados ▼] │
│ ○ No mostrar resultados              │
│ ○ Mostrar con advertencia            │
│                                        │
│ VISIBILIDAD DE RESULTADOS:            │
│                                        │
│ Evaluado puede ver:                   │
│ ☑ Su score global                    │
│ ☑ Scores por categoría               │
│ ☑ Comparación anónima con pares      │
│ ☐ Ranking específico                 │
│ ☑ Comentarios (anonimizados)         │
│ ☐ Respuestas individuales            │
│                                        │
│ Manager puede ver de su equipo:       │
│ ☑ Resultados individuales            │
│ ☑ Comparaciones dentro del equipo    │
│ ☐ Respuestas detalladas              │
│ ☑ Planes de desarrollo               │
│                                        │
│ [Guardar] [Aplicar a todos]          │
└────────────────────────────────────────┘
```

*Configuración de Recordatorios:*
```
┌────────────────────────────────────────┐
│ AUTOMATIZACIÓN DE RECORDATORIOS       │
├────────────────────────────────────────┤
│                                        │
│ CALENDARIO DE RECORDATORIOS:          │
│                                        │
│ Recordatorio 1:                       │
│ Enviar a los [3] días si <[80]% comp │
│ Plantilla: [Recordatorio Amigable ▼] │
│                                        │
│ Recordatorio 2:                       │
│ Enviar a los [7] días si no completo │
│ Plantilla: [Recordatorio Medio ▼]    │
│                                        │
│ Recordatorio 3:                       │
│ Enviar [48] horas antes del cierre   │
│ Plantilla: [Recordatorio Urgente ▼]  │
│                                        │
│ Último aviso:                         │
│ Enviar [4] horas antes del cierre    │
│ Plantilla: [Último Aviso ▼]          │
│                                        │
│ REGLAS ESPECIALES:                    │
│                                        │
│ ☑ No enviar en fin de semana         │
│ ☑ Respetar horario laboral (9-18h)   │
│ ☑ Máximo [5] recordatorios por eval  │
│ ☑ Espaciado mínimo de [48] horas     │
│                                        │
│ ESCALAMIENTO:                         │
│ ☑ Notificar a jefe si no responde    │
│   Después de [3] recordatorios       │
│ ☑ Notificar a RRHH casos críticos    │
│                                        │
│ [Guardar] [Preview] [Test]           │
└────────────────────────────────────────┘
```

### 8.3.5 Análisis y Reportes Avanzados

**Analytics Dashboard**

*Insights del Sistema:*
```
┌────────────────────────────────────────┐
│ ANALYTICS AVANZADOS - SISTEMA 360°    │
├────────────────────────────────────────┤
│                                        │
│ MÉTRICAS DE ADOPCIÓN:                 │
│                                        │
│ Evolución de Uso:                     │
│ ┌──────────────────────────────┐      │
│ │ 600 ┤       ╱━━━━━           │      │
│ │ 400 ┤   ╱━━╱                 │      │
│ │ 200 ┤━━╱                     │      │
│ │   0 └─────────────────────    │      │
│ │     2023   2024    2025       │      │
│ └──────────────────────────────┘      │
│                                        │
│ Tasa de Completitud por Campaña:      │
│ Q1-23: 78% | Q2-23: 82% | Q3-23: 85% │
│ Q4-23: 88% | Q1-24: 91% | Q2-24: 92% │
│                                        │
│ PREDICTORES DE ÉXITO:                 │
│                                        │
│ Factores de alta completitud:         │
│ ✓ Recordatorios personalizados (+15%) │
│ ✓ Sesiones de orientación (+12%)     │
│ ✓ Mobile friendly (+18%)             │
│ ✓ Plazo >14 días (+10%)             │
│                                        │
│ PATRONES IDENTIFICADOS:               │
│                                        │
│ • Viernes: -40% tasa de respuesta    │
│ • Evaluadores frecuentes: +25% veloc │
│ • Autoevaluación primero: +30% comp  │
│                                        │
│ [Exportar] [Profundizar] [Compartir]  │
└────────────────────────────────────────┘
```

*ROI de Evaluaciones:*
```
┌────────────────────────────────────────┐
│ IMPACTO Y ROI DEL PROGRAMA 360°       │
├────────────────────────────────────────┤
│                                        │
│ INVERSIÓN:                            │
│ Licencias:         $12,000/año        │
│ Tiempo RRHH:       320 horas          │
│ Capacitación:      $3,000             │
│ Total:             ~$35,000           │
│                                        │
│ RETORNO MEDIBLE:                      │
│                                        │
│ Mejoras post-360°:                    │
│ ├── Engagement: +12% (encuesta)      │
│ ├── Retención: +8% (vs año anterior) │
│ ├── Promociones internas: +15%       │
│ └── Satisfacción cliente: +0.5 NPS   │
│                                        │
│ Valor estimado:                       │
│ ├── Menor rotación: $120,000         │
│ ├── Mayor productividad: $85,000     │
│ ├── Reducción reclutamiento: $45,000 │
│ └── Total beneficio: ~$250,000       │
│                                        │
│ ROI: 614% 📈                          │
│                                        │
│ Áreas de mayor impacto:               │
│ 1. Desarrollo de liderazgo           │
│ 2. Comunicación inter-equipos        │
│ 3. Identificación de HiPo            │
│                                        │
│ [Ver metodología] [Detalles]         │
└────────────────────────────────────────┘
```

## 8.4 Reglas de Negocio Avanzadas

### Manejo de Conflictos

**Matriz de Decisión para Conflictos:**
```
Situación               | Acción Default    | Alternativas
────────────────────────────────────────────────────────
Evaluador = pariente   | Excluir          | Permitir con flag
Ex-jefe evalúa         | Permitir         | Categoría especial
Conflicto declarado    | Reasignar        | Excluir
Evaluador competidor   | Revisar caso     | Excluir/Permitir
Romance oficina        | Excluir          | Jefe decide
Evaluador dejó empresa | Mantener resp.   | Excluir
Evaluado promovido     | Continuar        | Restart con nuevo rol
```

### Políticas de Des-liberación

**Casos para Revertir Liberación:**
```
Permitido des-liberar si:
├── Error en procesamiento detectado
├── Datos incorrectos identificados
├── Dentro de 48h de liberación
├── Aprobación de Director RRHH
└── Notificación a afectados

Proceso:
1. Documentar razón
2. Obtener aprobaciones
3. Revertir acceso
4. Notificar a evaluado
5. Corregir issue
6. Re-procesar si necesario
7. Re-liberar con explicación
```

## 8.5 Interfaz de Usuario - Herramientas Admin

### Command Center

**Panel de Control Maestro:**
```
┌────────────────────────────────────────┐
│ COMMAND CENTER 360° ⚙️                │
├────────────────────────────────────────┤
│                                        │
│ SALUD DEL SISTEMA:                    │
│ ██████████ 98% Operacional           │
│                                        │
│ Campañas activas: 3                   │
│ Evaluaciones en progreso: 234         │
│ Procesamiento pendiente: 12           │
│ Alertas activas: 2 ⚠️                 │
│                                        │
│ ACCIONES RÁPIDAS:                     │
│ [Pausar Todo] [Backup] [Diagnóstico] │
│                                        │
│ PRÓXIMAS TAREAS:                      │
│ • 10:00 - Liberación Grupo A (15)    │
│ • 14:00 - Cierre Campaña Q1          │
│ • 16:00 - Backup semanal             │
│                                        │
│ MÉTRICAS CLAVE HOY:                   │
│ Logins: 456 | Evaluaciones: 89       │
│ Exports: 23 | Errores: 0             │
│                                        │
│ [Dashboard] [Logs] [Config] [Help]    │
└────────────────────────────────────────┘
```

---

## INTEGRACIÓN ENTRE MÓDULOS 7 Y 8

### Flujo de Liberación y Auditoría

```
Procesamiento completo (Módulo 6)
    ↓
Generación de reportes (Módulo 7)
    ↓
Revisión y aprobación
    ↓
Log de auditoría (Módulo 8)
    ↓
Liberación controlada (Módulo 7)
    ↓
Tracking de acceso (Módulo 8)
    ↓
Exportaciones (Módulo 8)
    ↓
Analytics y ROI (Módulo 8)
```

### Seguridad y Compliance

**Controles Integrados:**
```
Cada acción:
├── Validación de permisos
├── Log en auditoría
├── Check de políticas
├── Aplicación de privacidad
└── Notificación si crítico

Exportación:
├── Verificación de autorización
├── Aplicación de filtros privacy
├── Marca de agua y metadata
├── Registro completo
└── Alerta si masivo
```

---

## MÉTRICAS Y KPIs CONSOLIDADOS

### KPIs del Módulo 7

```
Adopción de Reportes:
├── Tasa de visualización: 94%
├── Tiempo en reporte: 12 min promedio
├── Descargas: 2.3 por usuario
├── Compartidos: 15%
└── Satisfacción: 4.3/5

Performance:
├── Generación reporte: <3s
├── Renderizado PDF: <5s
├── Dashboard load: <2s
└── Export masivo: <30s para 100
```

### KPIs del Módulo 8

```
Gestión y Compliance:
├── Casos especiales resueltos: 95%
├── Tiempo resolución: <24h
├── Auditorías sin hallazgos: 98%
├── Cumplimiento GDPR: 100%
└── Disponibilidad sistema: 99.9%

Uso Avanzado:
├── Exports masivos: 45/mes
├── Análisis ROI generados: 12/año
├── Automatizaciones activas: 67
└── Reglas custom: 23
```

---

## CONSIDERACIONES FINALES

### Escalabilidad

**Capacidades Target:**
- 100,000 reportes generados/mes
- 10,000 usuarios concurrentes
- 1M registros de auditoría/mes
- Retención 7 años sin degradación

### Seguridad

**Medidas Críticas:**
- Encriptación en reposo y tránsito
- Autenticación multi-factor para admin
- Segregación de datos por tenant
- Backup automático cada 4 horas
- Disaster recovery <4h RTO

### Próximos Pasos

Con los Módulos 7 y 8 implementados:

1. **Sistema completo** de evaluación 360°
2. **Ciclo cerrado** desde configuración hasta insights
3. **Trazabilidad total** y compliance
4. **Base para mejora continua** con analytics

El siguiente documento cubrirá el Módulo 9 (Configuraciones) y el roadmap de implementación completo.

---

# MÓDULO 9: CONFIGURACIONES Y PERSONALIZACIÓN

## 9.1 Propósito del Módulo

Proporcionar un centro de control unificado para todas las configuraciones del sistema, permitiendo personalización profunda a nivel de plataforma, organización y campaña, manteniendo coherencia y gobernanza adecuada.

## 9.2 Conceptos Fundamentales

### Jerarquía de Configuración

```
Niveles de configuración (prioridad descendente):
├── 1. Sistema (Super Admin)
│   └── Configuraciones globales de plataforma
├── 2. Organización (Org Admin)
│   └── Personalizaciones por empresa
├── 3. Campaña (Campaign Admin)
│   └── Ajustes específicos del proceso
└── 4. Usuario (Preferencias personales)
    └── Interfaz y notificaciones
```

### Tipos de Configuración

**Configuraciones de Negocio:**
- Reglas de evaluación
- Políticas de privacidad
- Umbrales y validaciones
- Flujos de trabajo

**Configuraciones Técnicas:**
- Integraciones
- APIs y webhooks
- Límites y quotas
- Performance

**Configuraciones de UI/UX:**
- Branding y temas
- Idiomas y localización
- Formatos de fecha/hora
- Densidad de información

**Configuraciones de Comunicación:**
- Plantillas de email
- Canales habilitados
- Frecuencias y horarios
- Escalamientos

### Gestión de Cambios

```
Impacto de cambios de configuración:
├── Inmediato: UI, preferencias, idioma
├── Próxima sesión: Autenticación, permisos
├── Próxima campaña: Reglas de negocio, flujos
└── Requiere migración: Estructura de datos
```

## 9.3 Funcionalidades del Módulo

### 9.3.1 Centro de Configuración Global

**Panel Principal de Configuración**

*Vista General Super Admin:*
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN GLOBAL DEL SISTEMA      │
├────────────────────────────────────────┤
│                                        │
│ 🏢 ORGANIZACIONES                     │
│ Activas: 23 | Trial: 5 | Total: 28    │
│ [Gestionar] [Límites] [Planes]        │
│                                        │
│ 🔧 CONFIGURACIÓN TÉCNICA              │
│ API Rate Limits | Integraciones       │
│ Storage | Performance | Seguridad     │
│ [Configurar] [Monitorear] [Logs]      │
│                                        │
│ 📊 REGLAS DE NEGOCIO                  │
│ Políticas Default | Validaciones      │
│ Flujos | Automatizaciones             │
│ [Editar] [Templates] [Exportar]       │
│                                        │
│ 🎨 PLATAFORMA                         │
│ Temas | Idiomas | Localización        │
│ Email Templates | Notificaciones      │
│ [Personalizar] [Preview] [Deploy]     │
│                                        │
│ 🔐 SEGURIDAD Y COMPLIANCE            │
│ GDPR | SOC2 | ISO27001 | HIPAA       │
│ [Políticas] [Auditoría] [Reportes]   │
│                                        │
│ Última actualización: Hoy 09:15 AM    │
│ Por: superadmin@platform.com          │
└────────────────────────────────────────┘
```

**Gestión de Planes y Límites**

*Configuración de Planes:*
```
┌────────────────────────────────────────┐
│ PLANES Y LÍMITES DE SUSCRIPCIÓN       │
├────────────────────────────────────────┤
│                                        │
│ PLAN: ENTERPRISE                      │
│                                        │
│ Límites actuales:                     │
│ Usuarios activos:      [1000]         │
│ Evaluaciones/año:      [Ilimitado]    │
│ Campañas simultáneas:  [10]           │
│ Storage (GB):          [100]          │
│ Retención datos:       [7] años       │
│                                        │
│ Funcionalidades:                      │
│ ☑ Evaluaciones 360°                  │
│ ☑ Reportes avanzados                 │
│ ☑ API access                         │
│ ☑ Custom branding                    │
│ ☑ Multi-idioma                       │
│ ☑ SSO/SAML                          │
│ ☑ Exportación masiva                 │
│ ☑ Analytics avanzado                 │
│                                        │
│ Add-ons disponibles:                  │
│ ☐ AI-powered insights (+$500/mes)    │
│ ☐ Coaching integration (+$300/mes)   │
│ ☐ Pulse surveys (+$200/mes)          │
│                                        │
│ [Guardar] [Comparar planes]           │
└────────────────────────────────────────┘
```

### 9.3.2 Configuración Organizacional

**Panel de Org Admin**

*Configuración General de la Organización:*
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN DE MI ORGANIZACIÓN      │
├────────────────────────────────────────┤
│                                        │
│ INFORMACIÓN BÁSICA:                   │
│ Nombre: [ACME Corporation        ]    │
│ Dominio: [acme.com              ]     │
│ Industria: [Tecnología ▼        ]     │
│ Tamaño: [501-1000 empleados ▼   ]     │
│ País: [Estados Unidos ▼         ]     │
│ Zona horaria: [PST (UTC-8) ▼    ]     │
│                                        │
│ CONTACTO PRINCIPAL:                   │
│ Nombre: [John Smith             ]     │
│ Email: [john.smith@acme.com    ]     │
│ Teléfono: [+1 555-0100         ]     │
│ Rol: [VP of Human Resources    ]     │
│                                        │
│ CONFIGURACIÓN REGIONAL:               │
│ Idioma principal: [Español ▼    ]     │
│ Idiomas adicionales:                  │
│ ☑ Inglés ☑ Portugués ☐ Francés      │
│ Formato fecha: [DD/MM/YYYY ▼   ]     │
│ Formato hora: [24h ▼           ]     │
│ Moneda: [USD ▼                 ]     │
│ Inicio semana: [Lunes ▼        ]     │
│                                        │
│ [Guardar cambios] [Cancelar]          │
└────────────────────────────────────────┘
```

**Configuración de Políticas 360°**

*Reglas de Evaluación:*
```
┌────────────────────────────────────────┐
│ POLÍTICAS DE EVALUACIÓN 360°          │
├────────────────────────────────────────┤
│                                        │
│ REGLAS DE PARTICIPACIÓN:              │
│                                        │
│ Autoevaluación:                       │
│ ● Obligatoria                         │
│ ○ Opcional                           │
│ ○ No incluir                         │
│                                        │
│ Antigüedad mínima para evaluar:       │
│ [3] meses en la empresa               │
│                                        │
│ Antigüedad mínima para ser evaluado:  │
│ [6] meses en el puesto actual         │
│                                        │
│ CONFIGURACIÓN DE EVALUADORES:         │
│                                        │
│ Número de evaluadores:                │
│ ├── Mínimo pares: [3]                 │
│ ├── Máximo pares: [7]                 │
│ ├── Mínimo subordinados: [3]          │
│ └── Máximo subordinados: [10]         │
│                                        │
│ Selección de evaluadores:             │
│ ○ Admin selecciona todos             │
│ ● Mixto (propone evaluado, aprueba   │
│   jefe/admin)                        │
│ ○ Evaluado selecciona (con límites)  │
│                                        │
│ PRIVACIDAD Y ANONIMATO:               │
│                                        │
│ Política de anonimato:                │
│ Jefes: [Nominativo ▼]                │
│ Pares: [Anónimo si ≥3 ▼]            │
│ Subordinados: [Siempre anónimo ▼]    │
│ Externos: [Configurable ▼]           │
│                                        │
│ [Guardar] [Aplicar a futuras]        │
└────────────────────────────────────────┘
```

### 9.3.3 Branding y Personalización Visual

**Editor de Marca**

*Personalización Visual:*
```
┌────────────────────────────────────────┐
│ BRANDING Y PERSONALIZACIÓN            │
├────────────────────────────────────────┤
│                                        │
│ IDENTIDAD VISUAL:                     │
│                                        │
│ Logo principal:                       │
│ ┌──────────────┐ [Cambiar]           │
│ │              │ PNG/SVG              │
│ │  [ACME LOGO] │ Max: 2MB             │
│ │              │ Recom: 200x60px      │
│ └──────────────┘                      │
│                                        │
│ Favicon: [●] [Subir]                  │
│                                        │
│ ESQUEMA DE COLORES:                   │
│                                        │
│ Primario:    [■] #2C3E50             │
│ Secundario:  [■] #3498DB             │
│ Acento:      [■] #E74C3C             │
│ Éxito:       [■] #27AE60             │
│ Advertencia: [■] #F39C12             │
│ Error:       [■] #C0392B             │
│ Fondo:       [□] #FFFFFF             │
│ Texto:       [■] #2C3E50             │
│                                        │
│ [Paletas predefinidas ▼]             │
│                                        │
│ TIPOGRAFÍA:                           │
│                                        │
│ Fuente principal: [Inter ▼]          │
│ Fuente encabezados: [Montserrat ▼]   │
│ Tamaño base: [16px]                   │
│                                        │
│ [Preview] [Guardar] [Resetear]        │
└────────────────────────────────────────┘
```

**Temas Predefinidos**

*Selector de Temas:*
```
┌────────────────────────────────────────┐
│ TEMAS DISPONIBLES                     │
├────────────────────────────────────────┤
│                                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │Professional│ │Modern│  │Minimal│   │
│ │  ████   │ │  ████   │ │  ████   │  │
│ │  ████   │ │  ████   │ │  ████   │  │
│ │  ▓▓▓▓   │ │  ░░░░   │ │  ────   │  │
│ └─────────┘ └─────────┘ └─────────┘  │
│  [Aplicar]   [Aplicar]   [Aplicar]    │
│                                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ Dark    │ │Colorful │ │High     │  │
│ │  ░░░░   │ │  ████   │ │Contrast │  │
│ │  ████   │ │  ████   │ │  ████   │  │
│ │  ████   │ │  ████   │ │  ████   │  │
│ └─────────┘ └─────────┘ └─────────┘  │
│  [Aplicar]   [Aplicar]   [Aplicar]    │
│                                        │
│ Tema actual: Professional             │
│ [Personalizar] [Crear nuevo]          │
└────────────────────────────────────────┘
```

### 9.3.4 Plantillas de Comunicación

**Gestor de Plantillas de Email**

*Editor de Plantillas:*
```
┌────────────────────────────────────────┐
│ PLANTILLAS DE COMUNICACIÓN            │
├────────────────────────────────────────┤
│                                        │
│ Categoría: [Invitaciones ▼]          │
│ Plantilla: [Invitación inicial ▼]    │
│                                        │
│ CONFIGURACIÓN:                        │
│ Nombre: Invitación Evaluación 360°    │
│ Asunto: [{{evaluatee_name}} necesita │
│         tu feedback - {{campaign}}]   │
│                                        │
│ DISEÑO: [Visual] [HTML] [Texto]      │
│ ┌──────────────────────────────────┐ │
│ │ [Logo Empresa]                   │ │
│ │                                  │ │
│ │ Hola {{evaluator_name}},         │ │
│ │                                  │ │
│ │ Has sido seleccionado para       │ │
│ │ participar en la evaluación      │ │
│ │ 360° de {{evaluatee_name}}.      │ │
│ │                                  │ │
│ │ [Comenzar Evaluación]            │ │
│ │                                  │ │
│ │ Fecha límite: {{deadline}}       │ │
│ │                                  │ │
│ │ Tu participación es confidencial  │ │
│ │                                  │ │
│ │ Saludos,                         │ │
│ │ {{sender_name}}                  │ │
│ └──────────────────────────────────┘ │
│                                        │
│ Variables: {{evaluator_name}}         │
│ {{evaluatee_name}} {{deadline}}       │
│                                        │
│ [Preview] [Enviar test] [Guardar]     │
└────────────────────────────────────────┘
```

**Configuración de Notificaciones**

*Reglas de Notificación:*
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN DE NOTIFICACIONES       │
├────────────────────────────────────────┤
│                                        │
│ CANALES HABILITADOS:                  │
│ ☑ Email (principal)                  │
│ ☑ Notificación in-app                │
│ ☐ SMS (requiere config Twilio)       │
│ ☐ Slack (requiere integración)       │
│ ☐ Microsoft Teams                    │
│ ☐ WhatsApp Business                  │
│                                        │
│ EVENTOS Y DESTINATARIOS:              │
│                                        │
│ Nueva evaluación asignada:            │
│ → Evaluado: [Email + In-app ▼]       │
│ → Evaluadores: [Email ▼]             │
│ → Jefe: [In-app ▼]                   │
│                                        │
│ Evaluación completada:                │
│ → Evaluado: [Email ▼]                │
│ → Admin: [Email + In-app ▼]          │
│                                        │
│ Resultados liberados:                 │
│ → Evaluado: [Email + In-app ▼]       │
│ → Jefe: [Email ▼]                    │
│                                        │
│ FRECUENCIA Y HORARIOS:                │
│                                        │
│ Agrupar notificaciones:               │
│ ○ Enviar inmediatamente              │
│ ● Digest diario a las [09:00]        │
│ ○ Digest semanal                     │
│                                        │
│ Horario de envío:                     │
│ Solo entre [08:00] y [18:00]          │
│ ☑ Respetar zona horaria del usuario  │
│ ☑ No enviar en fines de semana       │
│                                        │
│ [Guardar] [Test]                      │
└────────────────────────────────────────┘
```

### 9.3.5 Integraciones y APIs

**Centro de Integraciones**

*Integraciones Disponibles:*
```
┌────────────────────────────────────────┐
│ INTEGRACIONES                         │
├────────────────────────────────────────┤
│                                        │
│ HRIS / HCM:                           │
│ ┌────────────────────────────────┐    │
│ │ Workday        [Configurar]   │    │
│ │ Estado: ● Conectado            │    │
│ │ Última sync: Hace 2 horas      │    │
│ └────────────────────────────────┘    │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ SAP SuccessFactors [Conectar] │    │
│ │ Estado: ○ Desconectado         │    │
│ └────────────────────────────────┘    │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ BambooHR      [Conectar]      │    │
│ │ Estado: ○ Desconectado         │    │
│ └────────────────────────────────┘    │
│                                        │
│ AUTENTICACIÓN:                        │
│ ┌────────────────────────────────┐    │
│ │ Active Directory  [Configurar] │    │
│ │ Estado: ● Conectado            │    │
│ │ Método: SAML 2.0               │    │
│ └────────────────────────────────┘    │
│                                        │
│ ┌────────────────────────────────┐    │
│ │ Google Workspace [Conectar]   │    │
│ │ OAuth 2.0                      │    │
│ └────────────────────────────────┘    │
│                                        │
│ [Ver todas] [Solicitar nueva]         │
└────────────────────────────────────────┘
```

**Configuración de API**

*API Management:*
```
┌────────────────────────────────────────┐
│ API CONFIGURATION                     │
├────────────────────────────────────────┤
│                                        │
│ API KEYS:                             │
│                                        │
│ Production Key:                       │
│ sk_live_************************3a2b  │
│ [Regenerar] [Copiar] [Revocar]       │
│                                        │
│ Test Key:                             │
│ sk_test_************************7x9y  │
│ [Regenerar] [Copiar]                  │
│                                        │
│ WEBHOOKS:                             │
│                                        │
│ Endpoint URL:                         │
│ [https://acme.com/webhooks/360  ]    │
│                                        │
│ Eventos suscritos:                    │
│ ☑ evaluation.completed                │
│ ☑ campaign.finished                  │
│ ☑ results.released                   │
│ ☐ user.created                       │
│ ☐ user.updated                       │
│                                        │
│ Secreto (para verificación):          │
│ [************************]            │
│                                        │
│ RATE LIMITS:                          │
│ Requests/hora: 10,000                 │
│ Burst: 100/segundo                    │
│ Concurrent: 50                        │
│                                        │
│ [Guardar] [Test webhook] [Ver logs]   │
└────────────────────────────────────────┘
```

### 9.3.6 Configuración de Seguridad

**Panel de Seguridad**

*Políticas de Seguridad:*
```
┌────────────────────────────────────────┐
│ CONFIGURACIÓN DE SEGURIDAD            │
├────────────────────────────────────────┤
│                                        │
│ AUTENTICACIÓN:                        │
│                                        │
│ Método principal:                     │
│ ● SSO (SAML 2.0)                     │
│ ○ Usuario/Contraseña                 │
│ ○ OAuth 2.0                          │
│                                        │
│ Multi-factor (MFA):                   │
│ ● Requerido para todos               │
│ ○ Requerido para admins              │
│ ○ Opcional                           │
│ ○ Deshabilitado                      │
│                                        │
│ POLÍTICAS DE CONTRASEÑA:              │
│                                        │
│ Longitud mínima: [12] caracteres     │
│ ☑ Requiere mayúsculas                │
│ ☑ Requiere minúsculas                │
│ ☑ Requiere números                   │
│ ☑ Requiere caracteres especiales     │
│ ☑ No permitir contraseñas comunes    │
│ Expiración: [90] días                │
│ Historia: No repetir últimas [5]     │
│                                        │
│ SESIONES:                             │
│                                        │
│ Timeout inactividad: [30] minutos    │
│ Duración máxima: [8] horas           │
│ Sesiones concurrentes: [3] máximo    │
│ ☑ Cerrar al cerrar navegador        │
│                                        │
│ RESTRICCIONES DE ACCESO:              │
│                                        │
│ ☐ Restringir por IP                  │
│ ☐ Restringir por país                │
│ ☑ Bloquear después de [5] intentos  │
│ Duración bloqueo: [30] minutos       │
│                                        │
│ [Guardar] [Auditar] [Test]           │
└────────────────────────────────────────┘
```

## 9.4 Configuraciones Avanzadas

### Automatizaciones y Reglas

**Motor de Reglas**

*Constructor de Automatizaciones:*
```
┌────────────────────────────────────────┐
│ AUTOMATIZACIONES Y REGLAS             │
├────────────────────────────────────────┤
│                                        │
│ REGLA: Auto-escalamiento              │
│                                        │
│ CUANDO:                                │
│ [Evaluador] [no responde] después de  │
│ [3] [recordatorios]                   │
│                                        │
│ ENTONCES:                              │
│ [Notificar] a [jefe del evaluador]   │
│ con plantilla [Escalamiento]          │
│ Y                                      │
│ [Marcar] en dashboard como [riesgo]  │
│                                        │
│ EXCEPTO SI:                           │
│ [Evaluador] está en [vacaciones]     │
│ O                                      │
│ [Campaña] tiene [<3 días] restantes  │
│                                        │
│ Estado: ● Activa ○ Inactiva          │
│                                        │
│ [Guardar] [Test] [Duplicar]          │
├────────────────────────────────────────┤
│                                        │
│ REGLAS ACTIVAS: 12                    │
│ ├── Auto-escalamiento (arriba)       │
│ ├── Liberación automática            │
│ ├── Asignación de evaluadores        │
│ └── [Ver todas]                      │
│                                        │
│ [Nueva regla] [Importar] [Exportar]  │
└────────────────────────────────────────┘
```

### Gestión de Idiomas

**Configuración Multi-idioma**

*Gestor de Traducciones:*
```
┌────────────────────────────────────────┐
│ GESTIÓN DE IDIOMAS                    │
├────────────────────────────────────────┤
│                                        │
│ IDIOMAS HABILITADOS:                  │
│                                        │
│ ☑ Español (es-ES) - Principal        │
│   100% traducido | [Editar]          │
│                                        │
│ ☑ Inglés (en-US)                     │
│   100% traducido | [Editar]          │
│                                        │
│ ☑ Portugués (pt-BR)                  │
│   95% traducido | [Completar]        │
│                                        │
│ ☐ Francés (fr-FR)                    │
│   60% traducido | [Activar]          │
│                                        │
│ CONFIGURACIÓN DE DETECCIÓN:           │
│                                        │
│ ● Auto-detectar por navegador        │
│ ○ Usar preferencia del usuario       │
│ ○ Forzar idioma de la organización   │
│                                        │
│ TRADUCCIONES PERSONALIZADAS:          │
│                                        │
│ Término         | Original | Custom   │
│ ─────────────────────────────────────  │
│ Evaluación 360° | 360°... | Feedback │
│ Competencia     | Skill   | Habilidad│
│ [Agregar término]                     │
│                                        │
│ [Exportar] [Importar] [Reset]        │
└────────────────────────────────────────┘
```

---

# ROADMAP DE IMPLEMENTACIÓN COMPLETO

## Visión General del Proyecto

### Timeline Global
```
ROADMAP SISTEMA 360° - 9 MESES TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE 1: MVP (Meses 1-4)
[███████████████████████░░░░░░░░░░░]

FASE 2: MEJORAS (Meses 5-7)
[░░░░░░░░░░░░░░░░███████████████░░░]

FASE 3: ENTERPRISE (Meses 8-9)
[░░░░░░░░░░░░░░░░░░░░░░░░░███████░]

Hitos principales:
M1 ─── M2 ─── M3 ─── M4 ─── M5 ─── M6 ─── M7 ─── M8 ─── M9
│      │      │      │      │      │      │      │      │
Setup  Módulos MVP    Beta   Mejoras Analytics Scale  Launch
       1-3    Ready   Pilot  UX      Avanzado  Perf   Full
```

## FASE 1: MVP (Meses 1-4)

### Mes 1: Fundación
```
Sprint 1-2: Setup y Arquitectura
├── Configuración de infraestructura
├── Setup de ambientes (Dev, QA, Prod)
├── Estructura base de datos
├── Autenticación y autorización
├── CI/CD pipeline
└── Frameworks y librerías base

Entregables:
✓ Ambiente de desarrollo funcional
✓ Arquitectura documentada
✓ Pipeline de deployment
✓ Sistema de autenticación básico
```

### Mes 2: Módulos Core
```
Sprint 3-4: Módulos 1 y 2
├── Módulo 1: Estructura y Personas
│   ├── CRUD organizaciones
│   ├── Gestión de usuarios
│   ├── Jerarquía organizacional
│   └── Importación CSV
│
└── Módulo 2: Tests y Job Families
    ├── Catálogo de tests
    ├── Editor de tests (adaptar existente)
    ├── Gestión Job Families
    └── Vinculación tests-roles

Entregables:
✓ Gestión completa de personas
✓ Catálogo de instrumentos
✓ UI administrativa funcional
```

### Mes 3: Proceso de Evaluación
```
Sprint 5-6: Módulos 3, 4 y 5
├── Módulo 3: Campañas
│   ├── Wizard de creación
│   ├── Gestión de evaluados
│   └── Asignación de evaluadores
│
├── Módulo 4: Invitaciones
│   ├── Sistema de tokens
│   ├── Envío de emails
│   └── Tracking básico
│
└── Módulo 5: Completar Evaluación
    ├── Wizard de evaluación
    ├── Tipos de preguntas
    └── Guardado automático

Entregables:
✓ Flujo completo de evaluación
✓ Sistema de invitaciones funcional
✓ Interface de evaluación responsive
```

### Mes 4: Resultados y Beta
```
Sprint 7-8: Módulos 6 y 7 básicos
├── Módulo 6: Agregación
│   ├── Procesamiento básico
│   ├── Cálculo de scores
│   └── Validaciones
│
├── Módulo 7: Reportes básicos
│   ├── Reporte individual
│   ├── Dashboard simple
│   └── Exportación PDF
│
└── Preparación Beta
    ├── Testing integral
    ├── Corrección de bugs
    └── Documentación usuario

Entregables:
✓ Sistema completo funcional (MVP)
✓ Reportes básicos disponibles
✓ Listo para piloto con clientes
```

## FASE 2: MEJORAS (Meses 5-7)

### Mes 5: Experiencia de Usuario
```
Sprint 9-10: UX/UI Refinements
├── Mejoras de usabilidad
├── Optimización mobile
├── Nuevas visualizaciones
├── Feedback de usuarios beta
├── A/B testing
└── Accesibilidad (WCAG 2.1)

Entregables:
✓ UI pulida y profesional
✓ Performance optimizado
✓ Mobile-first responsive
```

### Mes 6: Analytics y Reportes Avanzados
```
Sprint 11-12: Módulos 7 y 8 completos
├── Dashboards interactivos
├── Reportes comparativos
├── Analytics avanzados
├── Sistema de auditoría
├── Exportación masiva
└── Gestión de excepciones

Entregables:
✓ Suite completa de reportes
✓ Analytics y ROI
✓ Auditoría integral
```

### Mes 7: Configuración y Personalización
```
Sprint 13-14: Módulo 9 completo
├── Centro de configuración
├── Branding personalizado
├── Multi-idioma
├── Plantillas avanzadas
├── Automatizaciones
└── Integraciones básicas

Entregables:
✓ Sistema totalmente configurable
✓ White-label capability
✓ Automatizaciones funcionales
```

## FASE 3: ENTERPRISE (Meses 8-9)

### Mes 8: Escalabilidad y Performance
```
Sprint 15-16: Optimización Enterprise
├── Optimización de queries
├── Caching estratégico
├── Load balancing
├── Sharding de datos
├── CDN implementation
└── Performance monitoring

Entregables:
✓ Sistema escalable a 10,000+ usuarios
✓ Response time <2s garantizado
✓ 99.9% uptime SLA ready
```

### Mes 9: Integraciones y Launch
```
Sprint 17-18: Integraciones y Go-Live
├── Integración HRIS (Workday, SAP)
├── SSO/SAML completo
├── API pública documentada
├── Webhooks avanzados
├── Migración de datos
└── Launch preparation

Entregables:
✓ Integraciones enterprise
✓ API completa y documentada
✓ Sistema en producción
✓ Soporte 24/7 activo
```

---

# MÉTRICAS DE ÉXITO DEL PROYECTO

## KPIs Técnicos

```
PERFORMANCE:
├── Page load: <2s (p95)
├── API response: <200ms (p95)
├── Uptime: 99.9%
├── Error rate: <0.1%
├── Concurrent users: 1,000+
└── Evaluaciones/hora: 10,000+

CALIDAD:
├── Code coverage: >80%
├── Bug rate: <5 por sprint
├── Technical debt: <10%
├── Security score: A+
├── Accessibility: WCAG 2.1 AA
└── Browser support: 95%+
```

## KPIs de Negocio

```
ADOPCIÓN:
├── Organizaciones activas: 50+ (Año 1)
├── Usuarios totales: 10,000+
├── Evaluaciones completadas: 50,000+
├── Tasa de completitud: >85%
├── NPS del producto: >50
└── Retention rate: >90%

IMPACTO:
├── ROI demostrable: >300%
├── Tiempo de implementación: <1 semana
├── Reducción costos HR: 40%
├── Mejora en engagement: +15%
├── Satisfacción usuarios: 4.5/5
└── Case studies publicados: 10+
```

## KPIs de Proceso

```
DESARROLLO:
├── Velocity estable: ±10%
├── Sprint completion: >85%
├── Defect escape rate: <5%
├── Lead time: <2 semanas
├── MTTR: <4 horas
└── Deploy frequency: 2x/semana

EQUIPO:
├── Satisfacción equipo: >8/10
├── Rotación: <10% anual
├── Knowledge sharing: 2 sesiones/mes
├── Certificaciones: 1 por persona/año
├── Innovation time: 20%
└── Documentación actualizada: 100%
```

---

# EQUIPO REQUERIDO

## Estructura del Equipo

```
CORE TEAM (8-10 personas):

LIDERAZGO:
├── Product Owner (1)
├── Tech Lead (1)
└── Scrum Master (1)

DESARROLLO:
├── Backend Engineers (2-3)
├── Frontend Engineers (2)
├── Full Stack Engineer (1)
└── QA Engineer (1)

DISEÑO Y SOPORTE:
├── UX/UI Designer (1)
├── DevOps Engineer (0.5)
└── Data Analyst (0.5)

EXTENDED TEAM (según necesidad):
├── Security Specialist
├── Performance Engineer
├── Integration Specialist
├── Technical Writer
└── Customer Success
```

## Matriz de Responsabilidades

```
Rol              | Fase 1 | Fase 2 | Fase 3
─────────────────────────────────────────
Product Owner    |  100%  |  100%  |  100%
Tech Lead        |  100%  |  100%  |  100%
Scrum Master     |  100%  |  100%  |  50%
Backend Eng      |  100%  |  100%  |  75%
Frontend Eng     |  100%  |  100%  |  50%
QA Engineer      |  75%   |  100%  |  100%
UX/UI Designer   |  100%  |  75%   |  25%
DevOps          |  50%   |  50%   |  100%
Data Analyst    |  25%   |  75%   |  100%
```

---

# RIESGOS Y MITIGACIONES

## Matriz de Riesgos

```
RIESGO ALTO:
├── Complejidad de agregación de datos
│   → Mitigación: Prototipos early, algoritmos probados
├── Adopción de usuarios
│   → Mitigación: UX research, beta testing, onboarding
└── Performance con volumen
    → Mitigación: Load testing, arquitectura escalable

RIESGO MEDIO:
├── Integraciones HRIS complejas
│   → Mitigación: APIs estándar, partnerships
├── Requerimientos cambiantes
│   → Mitigación: Agile, feedback continuo
└── Cumplimiento GDPR
    → Mitigación: Privacy by design, auditorías

RIESGO BAJO:
├── Competencia en mercado
│   → Mitigación: Diferenciación clara, pricing
├── Cambios en equipo
│   → Mitigación: Documentación, knowledge transfer
└── Deuda técnica
    → Mitigación: Refactoring continuo, code reviews
```

---

# PRESUPUESTO ESTIMADO

## Costos de Desarrollo

```
RECURSOS HUMANOS (9 meses):
├── Core team (8 personas): $720,000
├── Extended team: $80,000
├── Consultoría especializada: $30,000
└── Total RRHH: $830,000

INFRAESTRUCTURA Y HERRAMIENTAS:
├── Cloud (AWS/GCP): $36,000
├── Licencias software: $15,000
├── Herramientas desarrollo: $10,000
├── Seguridad y compliance: $20,000
└── Total Infra: $81,000

OTROS COSTOS:
├── Marketing y lanzamiento: $50,000
├── Capacitación: $15,000
├── Contingencia (10%): $97,600
└── Total Otros: $162,600

INVERSIÓN TOTAL: ~$1,073,600
```

## ROI Proyectado

```
AÑO 1:
├── Clientes: 50 organizaciones
├── Ingreso promedio: $12,000/año
├── Ingresos totales: $600,000
├── Margen operativo: -45%
└── Punto de equilibrio: Mes 18

AÑO 2:
├── Clientes: 150 organizaciones
├── Ingreso promedio: $15,000/año
├── Ingresos totales: $2,250,000
├── Margen operativo: 35%
└── ROI: 110%

AÑO 3:
├── Clientes: 300 organizaciones
├── Ingreso promedio: $18,000/año
├── Ingresos totales: $5,400,000
├── Margen operativo: 45%
└── ROI acumulado: 403%
```

---

# CONCLUSIONES Y PRÓXIMOS PASOS

## Resumen Ejecutivo

El Sistema de Evaluación 360° representa una solución integral y escalable para la gestión del talento organizacional. Con sus 9 módulos interconectados, ofrece:

1. **Flexibilidad**: Adaptable a diferentes industrias y tamaños
2. **Escalabilidad**: Arquitectura preparada para crecimiento
3. **Usabilidad**: Interfaz intuitiva y moderna
4. **Inteligencia**: Analytics avanzados y insights accionables
5. **Integración**: Compatible con ecosistemas enterprise

## Factores Críticos de Éxito

```
MUST-HAVE para lanzamiento:
✓ Flujo completo de evaluación funcional
✓ Reportes básicos pero profesionales
✓ Performance acceptable (<3s)
✓ Seguridad y privacidad garantizadas
✓ Soporte multi-dispositivo

NICE-TO-HAVE para v1.0:
○ Integraciones HRIS completas
○ Analytics predictivos
○ IA para recomendaciones
○ Gamification elements
○ API pública completa
```

## Próximos Pasos Inmediatos

```
SEMANA 1-2:
1. Validar blueprint con stakeholders
2. Finalizar equipo core
3. Setup ambiente desarrollo
4. Kick-off meeting

SEMANA 3-4:
1. Sprint 0: Preparación
2. Definir arquitectura técnica detallada
3. Crear backlog priorizado
4. Iniciar Sprint 1

MES 1 COMPLETADO:
□ Infraestructura lista
□ Equipo onboarded
□ Primeros entregables
□ Ritmo de trabajo establecido
```

## Mensaje Final

Este blueprint representa la visión completa de un sistema profesional de evaluación 360° diseñado para escalar y evolucionar con las necesidades organizacionales. La implementación exitosa dependerá de:

- **Ejecución disciplinada** del roadmap
- **Feedback continuo** de usuarios
- **Calidad sin compromisos** en cada entregable
- **Agilidad para adaptarse** a cambios del mercado

Con el compromiso adecuado de recursos y la ejecución correcta, el Sistema 360° se posicionará como la solución líder en el mercado de evaluación del talento.

---

**FIN DEL BLUEPRINT**

**Versión:** 5.0 FINAL COMPLETA  
**Fecha:** 14 de Octubre, 2025  
**Páginas:** 9 Módulos detallados  
**Estado:** ✅ Aprobado para desarrollo

---

## APROBACIONES

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | Rodrigo Herrera | _______ | ___/___/2025 |
| Tech Lead | _______ | _______ | ___/___/2025 |
| UX Lead | _______ | _______ | ___/___/2025 |
| Director IT | _______ | _______ | ___/___/2025 |
| CFO | _______ | _______ | ___/___/2025 |

---

## ANEXOS Y DOCUMENTACIÓN COMPLEMENTARIA

### Documentos Relacionados
- Análisis de Mercado y Competencia
- Especificaciones Técnicas Detalladas
- Wireframes y Mockups
- Plan de Testing y QA
- Estrategia de Go-to-Market
- Manual de Usuario
- Documentación API

### Versiones del Documento
- v1.0 - Blueprint inicial (01/10/2025)
- v2.0 - Incorporación feedback stakeholders (05/10/2025)
- v3.0 - Ajustes técnicos y alcance (08/10/2025)
- v4.0 - Refinamiento módulos (11/10/2025)
- v5.0 - Versión final completa (14/10/2025)

### Contacto
**Rodrigo Herrera**  
Product Owner - Sistema 360°  
Email: rodrigo.herrera@company.com  
Tel: +XXX XXXX XXXX

---

**© 2025 - Sistema de Evaluación 360° - Todos los derechos reservados**