# Características del MVP: Modelo Integral de Perfiles de Discipulado

## Índice
- [Introducción](#introducción)
- [Convención de Priorización](#convención-de-priorización)
- [[P0] FEAT-001: Gestión de Usuarios y Onboarding](#p0-feat-001-gestión-de-usuarios-y-onboarding)
- [[P0] FEAT-002: Flujo de Evaluación Individual](#p0-feat-002-flujo-de-evaluación-individual)
- [[P0] FEAT-003: Visualización de Informe y Upsell](#p0-feat-003-visualización-de-informe-y-upsell)
- [[P0] FEAT-004: Monetización y Compra de Créditos](#p0-feat-004-monetización-y-compra-de-créditos)
- [[P0] FEAT-005: Infraestructura Base](#p0-feat-005-infraestructura-base)
- [[P1] FEAT-006: Base de Datos de Preguntas](#p1-feat-006-base-de-datos-de-preguntas)
- [[P1] FEAT-007: Interfaz Responsiva y Experiencia de Usuario](#p1-feat-007-interfaz-responsiva-y-experiencia-de-usuario)
- [[P0] FEAT-008: Seguridad y Protección de Datos](#p0-feat-008-seguridad-y-protección-de-datos)
- [[P1] FEAT-009: Insights Avanzados (Sombras & Sinergía)](#p1-feat-009-insights-avanzados-sombras-y-sinergía)
- [Matriz de Trazabilidad](#matriz-de-trazabilidad)

## Introducción

Este documento define las características (features) que conforman el MVP de la plataforma de evaluación "Modelo Integral de Perfiles de Discipulado", priorizadas según criticidad. Se especifican los criterios de aceptación, el alcance y las dependencias de cada funcionalidad para guiar el desarrollo.

## Convención de Priorización

- **P0**: Características esenciales sin las cuales el producto no puede lanzarse
- **P1**: Características importantes pero no bloqueantes para el lanzamiento inicial

## [P0] FEAT-001: Gestión de Usuarios y Onboarding

**Descripción**: Sistema completo para el registro, autenticación y configuración inicial de usuarios, asegurando que cada nuevo usuario reciba su crédito gratuito y sea dirigido a un dashboard personalizado.

### Criterios de Aceptación

#### AC1: Registro de Usuario con Email y Contraseña
- **Given** un usuario no registrado visita la plataforma
- **When** completa el formulario de registro con email y contraseña válidos
- **Then** se crea una cuenta nueva con Firebase Auth
- **And** se crea automáticamente un perfil en Firestore con 1 crédito de evaluación
- **And** es redirigido al dashboard con mensaje de bienvenida

#### AC2: Registro con Google
- **Given** un usuario no registrado visita la plataforma
- **When** hace clic en "Continuar con Google" y selecciona su cuenta
- **Then** se crea una cuenta asociada a su perfil de Google
- **And** se crea automáticamente un perfil en Firestore con 1 crédito de evaluación
- **And** es redirigido al dashboard con mensaje de bienvenida

#### AC3: Inicio de Sesión
- **Given** un usuario registrado visita la plataforma
- **When** introduce sus credenciales correctamente
- **Then** accede a su dashboard personal
- **And** su sesión persiste entre recargas de página

#### AC4: Restablecimiento de Contraseña
- **Given** un usuario ha olvidado su contraseña
- **When** solicita un restablecimiento proporcionando su email
- **Then** recibe un correo con instrucciones para crear una nueva contraseña
- **And** puede establecer una nueva contraseña segura

#### AC5: Dashboard Inicial
- **Given** un usuario recién registrado accede por primera vez
- **When** es redirigido al dashboard después del registro
- **Then** ve información sobre su evaluación gratuita disponible
- **And** puede acceder al botón para iniciar su evaluación

### Alcance

**Incluido en MVP:**
- Registro con email/contraseña y Google
- Asignación automática de 1 crédito de evaluación gratuito
- Panel de control básico mostrando estado de evaluación
- Persistencia de sesión
- Restablecimiento de contraseña

**No incluido en MVP:**
- Verificación de email (opcional)
- Edición de perfil avanzado
- Gestión de múltiples dispositivos
- Otros métodos de autenticación (Facebook, Apple, etc.)

### Dependencias
- Firebase Authentication configurado
- Colección `users` en Firestore
- Cloud Function `onUserCreate` operativa
- Reglas de seguridad de Firestore implementadas

## [P0] FEAT-002: Flujo de Evaluación Individual

**Descripción**: Experiencia fluida para completar la autoevaluación de discipulado mediante un wizard interactivo que presenta preguntas secuencialmente, guarda respuestas de forma segura y actualiza el estado de créditos al finalizar.

### Criterios de Aceptación

#### AC1: Verificación de Créditos
- **Given** un usuario autenticado intenta iniciar la evaluación
- **When** el sistema verifica sus créditos disponibles
- **Then** solo puede acceder si tiene al menos 1 crédito de evaluación
- **And** si no tiene créditos, se muestra mensaje explicativo con opción de compra

#### AC2: Wizard de Evaluación
- **Given** un usuario con créditos inicia la evaluación
- **When** accede a la interfaz del wizard
- **Then** puede ver las preguntas presentadas secuencialmente
- **And** puede navegar entre preguntas (anterior/siguiente)
- **And** visualiza claramente su progreso actual

#### AC3: Guardado Automático
- **Given** un usuario está completando la evaluación
- **When** responde a una pregunta y pasa a la siguiente
- **Then** sus respuestas se guardan automáticamente
- **And** puede cerrar la sesión y continuar más tarde desde el mismo punto

#### AC4: Finalización y Procesamiento
- **Given** un usuario completa todas las preguntas de la evaluación
- **When** hace clic en "Finalizar Evaluación"
- **Then** se procesan sus respuestas y calculan los resultados
- **And** se descuenta 1 crédito de evaluación de su cuenta
- **And** es redirigido al dashboard para ver el resumen de resultados

#### AC5: Validación de Respuestas
- **Given** un usuario intenta finalizar la evaluación
- **When** hay preguntas obligatorias sin responder
- **Then** se muestra un mensaje indicando las preguntas faltantes
- **And** no se procesa la evaluación hasta que todas las preguntas requeridas estén respondidas

### Alcance

**Incluido en MVP:**
- Verificación de créditos antes de iniciar
- Interfaz de wizard responsiva para preguntas
- Navegación entre preguntas anterior/siguiente
- Guardado automático del progreso
- Capacidad para retomar evaluación interrumpida
- Descuento automático de 1 crédito al finalizar
- Validación de preguntas obligatorias

**No incluido en MVP:**
- Modalidad offline completa (aunque se almacena progreso localmente)
- Tiempo límite para completar la evaluación
- Preguntas condicionales basadas en respuestas previas
- Evaluaciones comparativas (historiales)

### Dependencias
- Colección `evaluationQuestions` poblada en Firestore
- Colección `evaluations` configurada en Firestore
- Cloud Functions `getQuestions`, `saveProgress` y `submitAnswers` operativas
- Componentes de UI para el wizard implementados

## [P0] FEAT-003: Visualización de Informe y Upsell

**Descripción**: Interfaz para mostrar un resumen visual de los resultados de la evaluación con un gráfico radar y texto interpretativo básico, incluyendo un botón de llamada a la acción para la compra del informe completo.

### Criterios de Aceptación

#### AC1: Visualización del Gráfico Radar
- **Given** un usuario ha completado la evaluación
- **When** accede a su dashboard
- **Then** puede ver un gráfico radar que representa visualmente sus resultados
- **And** el gráfico muestra claramente las diferentes dimensiones evaluadas

#### AC2: Texto Interpretativo Básico
- **Given** un usuario visualiza sus resultados en el dashboard
- **When** examina la sección de interpretación
- **Then** puede leer un breve texto explicativo sobre sus resultados
- **And** el texto refleja apropiadamente sus puntuaciones en las dimensiones principales

#### AC3: Llamada a la Acción para Informe Completo
- **Given** un usuario está viendo el resumen de sus resultados
- **When** examina la página completa
- **Then** ve un botón prominente "Desbloquear Informe Completo en PDF"
- **And** al hacer clic es dirigido al flujo de pago

#### AC4: Previsualización Limitada
- **Given** un usuario está considerando comprar el informe completo
- **When** hace clic en "Ver ejemplo" o similar
- **Then** puede ver una previsualización parcial del informe completo
- **And** esta previsualización muestra el valor adicional del informe pagado

#### AC5: Acceso a Resultados Históricos
- **Given** un usuario ha completado al menos una evaluación
- **When** accede a su dashboard
- **Then** puede ver un listado de sus evaluaciones previas
- **And** puede seleccionar cualquiera para ver los resultados

### Alcance

**Incluido en MVP:**
- Gráfico radar usando Chart.js
- Texto interpretativo básico automatizado
- CTA prominente para compra de informe completo
- Previsualización limitada del informe completo
- Listado simple de evaluaciones históricas (si existen)

**No incluido en MVP:**
- Informes comparativos entre evaluaciones
- Descarga de informes básicos en formato digital
- Compartir resultados en redes sociales
- Gráficos adicionales más allá del radar

### Dependencias
- Chart.js integrado correctamente
- Lógica de cálculo de resultados implementada
- Colección en Firestore para almacenar resultados
- Integración con sistema de pagos para el CTA
- **Nota sobre PDF engine**: se usará `pdfMake` encapsulado en `services/report-generator.js` para mantener una interfaz estable y permitir futuros reemplazos.

## [P0] FEAT-004: Monetización y Compra de Créditos

**Descripción**: Sistema que gestiona el ciclo de vida del usuario después de su evaluación gratuita, detectando cuando intenta realizar una nueva evaluación sin créditos y guiándolo hacia la compra de créditos adicionales o informes PDF.

### Criterios de Aceptación

#### AC1: Detección de Ausencia de Créditos
- **Given** un usuario sin créditos intenta iniciar una evaluación
- **When** el sistema verifica su balance de créditos
- **Then** muestra un modal explicativo sobre el agotamiento de créditos
- **And** ofrece opciones para adquirir más créditos

#### AC2: Opciones de Compra
- **Given** un usuario accede a la página de compra de créditos
- **When** examina las opciones disponibles
- **Then** puede ver claramente diferentes paquetes de créditos con sus precios
- **And** también ve la opción de comprar solo el informe completo de su evaluación anterior

#### AC3: Proceso de Checkout
- **Given** un usuario selecciona un paquete de créditos para comprar
- **When** hace clic en "Comprar Ahora"
- **Then** es dirigido a un formulario de pago seguro integrado con Stripe
- **And** puede completar la transacción con tarjeta de crédito/débito

#### AC4: Actualización de Créditos Post-Compra
- **Given** un usuario completa exitosamente una compra de créditos
- **When** la transacción es procesada por Stripe
- **Then** su cuenta es actualizada inmediatamente con los nuevos créditos
- **And** recibe una confirmación visual del éxito de la transacción

#### AC5: Generación de PDF Post-Compra
- **Given** un usuario compra un informe completo en PDF
- **When** la transacción es procesada exitosamente
- **Then** se genera automáticamente el documento PDF
- **And** puede descargarlo inmediatamente o recibirlo por email

### Alcance

**Incluido en MVP:**
- Detección de usuario sin créditos con mensaje explicativo
- Integración con Stripe para procesamiento de pagos
- Opciones de compra para créditos adicionales
- Compra única de informe completo en PDF
- Actualización inmediata de créditos post-compra
- Generación de informe PDF usando jsPDF

**No incluido en MVP:**
- Suscripciones recurrentes
- Cupones o códigos promocionales
- Facturación empresarial
- Múltiples métodos de pago alternativos
- Sistema de afiliados o referidos

### Dependencias
- Cuenta de Stripe configurada con productos y precios
- Cloud Functions para interactuar con API de Stripe
- jsPDF integrado para generación de PDFs
- Webhooks de Stripe configurados para actualizar estado de transacciones
- Transacciones atómicas en Firestore para actualización de créditos

## [P0] FEAT-005: Infraestructura Base

**Descripción**: Configuración fundamental de la infraestructura y servicios cloud necesarios para el funcionamiento de todas las funcionalidades del MVP.

### Criterios de Aceptación

#### AC1: Configuración de Firebase
- **Given** el equipo de desarrollo inicia la implementación del proyecto
- **When** configura un nuevo proyecto en Firebase Console
- **Then** todos los servicios necesarios (Auth, Firestore, Functions, Hosting) son habilitados
- **And** las credenciales de acceso están correctamente configuradas

#### AC2: Estructura de Base de Datos
- **Given** el proyecto Firebase está configurado
- **When** se implementan las colecciones en Firestore
- **Then** existen correctamente estructuradas todas las colecciones necesarias (users, evaluationQuestions, evaluations)
- **And** tienen las reglas de seguridad adecuadas aplicadas

#### AC3: Despliegue de Cloud Functions
- **Given** el código de las Cloud Functions está desarrollado
- **When** se despliegan al entorno de Firebase
- **Then** todas las funciones están operativas y responden correctamente
- **And** manejan adecuadamente errores y casos límite

#### AC4: Despliegue Frontend
- **Given** el código frontend está completo
- **When** se despliega a Firebase Hosting
- **Then** la aplicación es accesible públicamente
- **And** funciona correctamente en dispositivos móviles y desktop

#### AC5: Monitorización y Logging
- **Given** la aplicación está desplegada
- **When** los usuarios interactúan con ella
- **Then** se registran logs estructurados de eventos clave
- **And** el equipo puede monitorizar el rendimiento y errores

### Alcance

**Incluido en MVP:**
- Proyecto Firebase completamente configurado
- Estructura de datos en Firestore optimizada
- Despliegue de Cloud Functions
- Frontend desplegado en Firebase Hosting
- Configuración básica de logging y monitoreo
- Reglas de seguridad de Firestore

**No incluido en MVP:**
- CI/CD automatizado
- Entornos separados para desarrollo/staging/producción
- Pruebas automatizadas exhaustivas
- Monitorización avanzada con alertas
- Optimización avanzada de costos de Firebase

### Dependencias
- Cuenta de Google Cloud/Firebase
- Equipo con acceso y permisos adecuados
- Dominio web (opcional, puede usar el proporcionado por Firebase)

## [P1] FEAT-006: Base de Datos de Preguntas

**Descripción**: Sistema para gestionar el conjunto de preguntas, categorías y dimensiones de la evaluación, incluyendo sus pesos y tipos.

### Criterios de Aceptación

#### AC1: Estructura de Preguntas
- **Given** el sistema está configurado
- **When** se cargan las preguntas iniciales en Firestore
- **Then** cada pregunta tiene correctamente definidos sus atributos (id, texto, tipo, dimensión, peso)
- **And** están organizadas en categorías con orden específico

#### AC2: Tipos de Preguntas Soportados
- **Given** un usuario está realizando la evaluación
- **When** navega por las diferentes preguntas
- **Then** puede responder diferentes tipos (Likert-5, Likert-7, boolean)
- **And** cada tipo se visualiza con la interfaz de usuario adecuada

#### AC3: Cálculo de Resultados
- **Given** un usuario completa todas las preguntas
- **When** finaliza la evaluación
- **Then** el sistema calcula correctamente los resultados por dimensión
- **And** aplica adecuadamente los pesos de cada pregunta

#### AC4: Organización por Categorías
- **Given** un usuario está realizando la evaluación
- **When** avanza por el wizard
- **Then** las preguntas están agrupadas lógicamente por categorías
- **And** cada categoría tiene una introducción explicativa

#### AC5: Adaptabilidad de Contenido
- **Given** un administrador necesita actualizar las preguntas
- **When** modifica la colección en Firestore
- **Then** los cambios se reflejan en futuras evaluaciones
- **And** no afectan a evaluaciones ya completadas

### Alcance

**Incluido en MVP:**
- Conjunto inicial de preguntas cargado en Firestore
- Soporte para tipos de pregunta Likert-5, Likert-7 y boolean
- Organización por categorías y dimensiones
- Algoritmo básico de cálculo de resultados
- Textos interpretativos básicos basados en puntajes

**No incluido en MVP:**
- Interfaz administrativa para gestionar preguntas
- Versiones alternativas de cuestionarios
- Personalización dinámica de preguntas
- A/B testing de formulaciones de preguntas
- Análisis avanzados de resultados por dimensiones

### Dependencias
- Colección `evaluationQuestions` en Firestore
- Componentes de UI para los distintos tipos de pregunta
- Algoritmo de cálculo de resultados implementado

## [P1] FEAT-007: Interfaz Responsiva y Experiencia de Usuario

**Descripción**: Diseño visual consistente y experiencia de usuario fluida optimizada tanto para dispositivos móviles como para escritorio.

### Criterios de Aceptación

#### AC1: Diseño Mobile-First
- **Given** un usuario accede desde un smartphone
- **When** navega por cualquier sección de la aplicación
- **Then** todos los elementos son legibles y utilizables
- **And** no hay desplazamiento horizontal ni elementos cortados

#### AC2: Adaptación a Pantallas Grandes
- **Given** un usuario accede desde un desktop
- **When** navega por la aplicación
- **Then** la interfaz aprovecha eficientemente el espacio disponible
- **And** mantiene un diseño coherente con la versión móvil

#### AC3: Estados de Carga y Feedback
- **Given** un usuario realiza una acción que requiere procesamiento
- **When** espera la respuesta del sistema
- **Then** ve indicadores de carga apropiados (spinners, skeleton screens)
- **And** recibe feedback visual sobre el éxito o fracaso de su acción

#### AC4: Accesibilidad Básica
- **Given** cualquier usuario utiliza la aplicación
- **When** interactúa con sus elementos
- **Then** puede navegar mediante teclado
- **And** los elementos tienen suficiente contraste y tamaño tocable

#### AC5: Mensajes de Error Amigables
- **Given** ocurre un error durante el uso de la aplicación
- **When** el error debe ser comunicado al usuario
- **Then** recibe un mensaje claro y orientado a soluciones
- **And** tiene opciones para resolver o reportar el problema

### Alcance

**Incluido en MVP:**
- Diseño responsive completamente funcional
- Estados de carga para todas las operaciones asíncronas
- Mensajes de error amigables y accionables
- Navegación intuitiva entre secciones
- Soporte básico para accesibilidad mediante teclado

**No incluido en MVP:**
- Temas o personalización visual
- Animaciones complejas
- Cumplimiento completo de WCAG 2.1 AA
- Modo oscuro
- Internacionalización (i18n)

### Dependencias
- Estilos CSS organizados y modulares
- Componentes de UI para estados de carga
- Sistema de notificaciones para mensajes de error/éxito

## [P0] FEAT-008: Seguridad y Protección de Datos

**Descripción**: Medidas de seguridad para proteger datos de usuarios, respuestas de evaluación y transacciones de pago.

### Criterios de Aceptación

#### AC1: Autenticación Segura
- **Given** un atacante intenta acceder a cuentas de usuarios
- **When** prueba diferentes técnicas comunes de ataque
- **Then** el sistema resiste debido a prácticas de seguridad implementadas
- **And** los intentos sospechosos son registrados y/o bloqueados

#### AC2: Protección de Datos en Firestore
- **Given** un usuario autenticado accede a la aplicación
- **When** intenta leer o modificar datos de otro usuario
- **Then** las reglas de seguridad de Firestore lo impiden
- **And** solo puede acceder a sus propios datos

#### AC3: Seguridad en Transacciones
- **Given** un usuario realiza una compra de créditos
- **When** introduce información de pago
- **Then** los datos son procesados directamente por Stripe
- **And** nunca se almacenan datos sensibles de tarjetas en nuestros sistemas

#### AC4: Validación de Entradas
- **Given** un usuario interactúa con formularios
- **When** introduce datos potencialmente maliciosos
- **Then** el sistema valida y sanitiza todas las entradas
- **And** previene ataques de inyección o XSS

#### AC5: Protección de Información Sensible
- **Given** el sistema maneja claves API o secretos
- **When** se despliega el código
- **Then** ninguna información sensible está hardcodeada
- **And** se utilizan variables de entorno o servicios de gestión de secretos

### Alcance

**Incluido en MVP:**
- Autenticación segura con Firebase Auth
- Reglas de seguridad estrictas en Firestore
- Integración segura con Stripe para pagos
- Validación y sanitización de todas las entradas
- Gestión segura de secretos y claves API

**No incluido en MVP:**
- Auditoría de seguridad externa
- 2FA (autenticación de dos factores)
- Cifrado de datos en reposo personalizado
- Panel de administración de usuarios
- Sistema de detección de fraudes

### Dependencias
- Firebase Authentication correctamente configurado
- Reglas de seguridad de Firestore implementadas
- Variables de entorno para secretos configuradas
- Integración con SDK seguro de Stripe

## [P1] FEAT-009: Insights Avanzados (Sombras & Sinergía)

**Descripción**: Módulo opcional para calcular y mostrar análisis más profundos sobre el perfil del usuario, como sus "sombras" (riesgos) y "sinergias" (combinaciones de fortalezas). Esta funcionalidad estará desactivada por defecto y se habilitará mediante una feature flag.

### Criterios de Aceptación

#### AC1: Desactivado por Defecto
- **Given** la configuración inicial del sistema
- **When** un administrador revisa las feature flags
- **Then** la variable de entorno `enableAdvancedInsights` está configurada como `false`
- **And** no se realizan cálculos de insights avanzados para los usuarios

#### AC2: Habilitación por Feature Flag
- **Given** la feature flag `enableAdvancedInsights` está configurada como `true`
- **When** un usuario completa una evaluación
- **Then** la Cloud Function `calculateAdvancedInsights` se invoca para procesar los resultados
- **And** los insights (sombras y sinergia) se guardan en el documento de la evaluación correspondiente en Firestore

#### AC3: Visualización Condicional en el Informe
- **Given** un usuario ha comprado el informe completo y los insights avanzados están habilitados y calculados
- **When** visualiza su informe
- **Then** ve las secciones adicionales correspondientes a "Sombras" y "Sinergia"
- **And** si los insights no están calculados o la función está deshabilitada, estas secciones no aparecen

### Alcance

**Incluido en MVP (como P1):**
- Lógica de cálculo de insights en una Cloud Function dedicada (`calculateAdvancedInsights`)
- Feature flag para controlar la activación de la funcionalidad
- Almacenamiento de los resultados en la colección `evaluations`
- Visualización condicional de los insights en el informe completo

**No incluido en MVP:**
- Interfaz de usuario para gestionar la feature flag (se gestionará por variables de entorno)
- Múltiples modelos de cálculo de insights
- Comparación de insights a lo largo del tiempo

### Dependencias
- Cloud Function `calculateAdvancedInsights` implementada
- Estructura de la colección `evaluations` debe soportar los nuevos campos para insights
- Lógica en el frontend para renderizar condicionalmente las nuevas secciones

## Matriz de Trazabilidad

| ID        | Feature                                     | APIs/Funciones/Colecciones Relacionadas |
|-----------|---------------------------------------------|----------------------------------------|
| FEAT-001  | Gestión de Usuarios y Onboarding           | Firebase Auth, Cloud Function `onUserCreate`, Colección `users`, `getUserProfile` |
| FEAT-002  | Flujo de Evaluación Individual             | Cloud Functions `getQuestions`, `saveProgress`, `submitAnswers`, Colecciones `evaluationQuestions`, `evaluations` |
| FEAT-003  | Visualización de Informe y Upsell          | Chart.js, Colección `evaluations`, `generateSummary` |
| FEAT-004  | Monetización y Compra de Créditos          | API Stripe, Cloud Functions `createCheckoutSession`, `handleWebhook`, `updateCredits`, jsPDF, `generateFullReport` |
| FEAT-005  | Infraestructura Base                       | Firebase Hosting, Firebase Auth, Firestore, Cloud Functions |
| FEAT-006  | Base de Datos de Preguntas                 | Colección `evaluationQuestions`, Cloud Function `calculateResults` |
| FEAT-007  | Interfaz Responsiva y Experiencia de Usuario | SPA (JavaScript ES6), CSS responsivo |
| FEAT-008  | Seguridad y Protección de Datos            | Reglas de seguridad Firestore, Firebase Auth, variables de entorno |
| FEAT-009  | Insights Avanzados (Sombras & Sinergía)    | Cloud Functions `calculateAdvancedInsights`, `reports/generateFullReport` (opcional), Colección `evaluations` |

