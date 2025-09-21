# Preguntas Arquitectónicas y Supuestos

Este documento contiene las preguntas abiertas y supuestos que deben resolverse antes de iniciar la construcción del MVP de la plataforma "Modelo Integral de Perfiles de Discipulado".

## 1. Negocio/Alcance

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-001 | ¿Cuál es el ciclo de vida esperado de un "crédito de evaluación"? ¿Caducan con el tiempo? | Alto | Negocio | Abierta | FEAT-004 |
| Q-002 | ¿Puede un usuario comprar múltiples informes del mismo tipo para medir su progreso a lo largo del tiempo? | Medio | Producto | Abierta | FEAT-003, FEAT-004 |
| Q-003 | ¿Qué precios se establecerán para los créditos individuales vs. paquetes de créditos? | Alto | Negocio | Abierta | FEAT-004 |
| Q-004 | ¿Se implementará algún mecanismo de prueba gratuita o demo más allá del crédito inicial? | Medio | Producto | Abierta | FEAT-001, FEAT-004 |
| Q-005 | ¿Existen métricas específicas de negocio que debamos seguir o eventos que debamos rastrear? | Medio | Negocio | Abierta | FEAT-004, FEAT-005 |

## 2. Usuarios/Onboarding

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-006 | ¿La verificación de email será obligatoria o opcional para el MVP? | Medio | Producto | Abierta | FEAT-001 |
| Q-007 | ¿Qué información de perfil adicional se solicitará durante el registro más allá del email? | Bajo | Producto | Abierta | FEAT-001 |
| Q-008 | ¿Se implementará alguna segmentación o encuesta inicial para personalizar la experiencia? | Medio | Producto | Abierta | FEAT-001 |
| Q-009 | ¿Qué contenido específico debe mostrarse en la pantalla de bienvenida para nuevos usuarios? | Bajo | Producto | Abierta | FEAT-001 |
| Q-010 | ¿Se implementará algún sistema de referidos o invitaciones para el MVP? | Bajo | Negocio | Abierta | FEAT-001 |

## 3. Datos/Modelo/Reglas

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-011 | ¿Cómo se gestionará el contenido de la evaluación (preguntas, ponderaciones, lógica de puntuación)? ¿Codificado o configurable? | Alto | Tech | Abierta | FEAT-002, FEAT-006 |
| Q-012 | ¿Cuántas dimensiones tendrá la evaluación y cómo se ponderan entre sí? | Alto | Producto | Abierta | FEAT-002, FEAT-006 |
| Q-013 | ¿Cuál es la estrategia de respaldo/migración de datos para la base de datos Firestore? | Medio | Tech | Abierta | FEAT-005 |
| Q-014 | ¿Qué estrategia de índices en Firestore se implementará para optimizar consultas frecuentes? | Medio | Tech | Abierta | FEAT-005 |
| Q-015 | ¿Cuánto tiempo debemos retener los datos de evaluaciones y respuestas? | Medio | Legal | Abierta | FEAT-008 |

## 4. Evaluación (UX + tipos de pregunta)

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-016 | ¿Qué sucede si un usuario abandona la evaluación a mitad de camino? ¿Se guarda su progreso para que pueda continuar más tarde, o debe empezar de nuevo? | Alto | Producto | Abierta | FEAT-002 |
| Q-017 | ¿Cuántas preguntas totales tendrá la evaluación y cómo estarán distribuidas por categoría? | Alto | Producto | Abierta | FEAT-002, FEAT-006 |
| Q-018 | ¿Existirá un tiempo límite para completar la evaluación una vez iniciada? | Medio | Producto | Abierta | FEAT-002 |
| Q-019 | ¿Se permitirá al usuario modificar respuestas anteriores durante la evaluación? | Medio | Producto | Abierta | FEAT-002 |
| Q-020 | ¿Cómo se manejarán los casos de "no aplica" o "prefiero no responder" en preguntas específicas? | Medio | Producto | Abierta | FEAT-002, FEAT-006 |

## 5. Resultados/Reportes/PDF

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-021 | ¿En el informe resumido, qué tan profundo debe ser el "texto interpretativo"? ¿Es un texto estático por cada arquetipo de resultado o se genera dinámicamente? | Alto | Producto | Abierta | FEAT-003 |
| Q-022 | ¿La generación del PDF debería realizarse en el frontend (cliente) o backend (servidor)? | Alto | Tech | Abierta | FEAT-003, FEAT-004 |
| Q-023 | ¿Cómo se debe gestionar el acceso a los informes completos en PDF? (enlaces de descarga de un solo uso, almacenamiento en Cloud Storage, etc.) | Alto | Tech | Abierta | FEAT-003, FEAT-008 |
| Q-024 | ¿Qué elementos visuales adicionales además del gráfico radar deberían incluirse en el informe completo? | Medio | Producto | Abierta | FEAT-003 |
| Q-025 | ¿Debe implementarse alguna función para compartir o exportar los resultados? | Bajo | Producto | Abierta | FEAT-003 |

## 6. Pagos/Stripe/Webhooks

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-026 | ¿Qué información fiscal/facturación debe incluirse en el proceso de pago? | Alto | Legal | Abierta | FEAT-004 |
| Q-027 | ¿Cómo manejar fallos en webhooks de Stripe que podrían resultar en créditos no actualizados? | Alto | Tech | Abierta | FEAT-004, FEAT-008 |
| Q-028 | ¿Qué proceso de reembolso se implementará para compras erróneas o insatisfactorias? | Alto | Negocio | Abierta | FEAT-004 |
| Q-029 | ¿Se ofrecerán diferentes métodos de pago además de tarjeta de crédito/débito en el MVP? | Medio | Negocio | Abierta | FEAT-004 |
| Q-030 | ¿Qué datos de transacción deben registrarse para cumplimiento fiscal/contable? | Alto | Legal | Abierta | FEAT-004, FEAT-008 |

## 7. Seguridad/Privacidad/Reglas Firestore

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-031 | ¿Cuál será la estrategia para gestionar las claves de API de terceros (como Stripe) en el entorno serverless? | Alto | Tech | Abierta | FEAT-008 |
| Q-032 | ¿Hemos diseñado las reglas de seguridad y estructura de Firestore para minimizar lecturas y optimizar costos? | Alto | Tech | Abierta | FEAT-005, FEAT-008 |
| Q-033 | ¿Qué nivel de anonimización de datos se requiere para las evaluaciones en caso de uso analítico o agregado? | Alto | Legal | Abierta | FEAT-008 |
| Q-034 | ¿Cómo se implementará el control de versiones y despliegue seguro de reglas de Firestore? | Medio | Tech | Abierta | FEAT-005, FEAT-008 |
| Q-035 | ¿Qué política de retención y eliminación de datos personales se implementará? | Alto | Legal | Abierta | FEAT-008 |

## 8. Frontend (rutas/estados)

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-036 | ¿Cómo se manejarán las URLs compartibles de resultados manteniendo la seguridad? | Medio | Tech | Abierta | FEAT-003, FEAT-007 |
| Q-037 | ¿Qué estrategia de lazy loading se implementará para optimizar el rendimiento inicial? | Medio | Tech | Abierta | FEAT-007 |
| Q-038 | ¿Cómo se gestionará el estado global vs. estado local en componentes complejos como el wizard? | Medio | Tech | Abierta | FEAT-002, FEAT-007 |
| Q-039 | ¿Qué estrategia de manejo de errores de red/disponibilidad se implementará en el frontend? | Alto | Tech | Abierta | FEAT-007, FEAT-008 |
| Q-040 | ¿Cómo se implementará el "tema" visual consistente en los componentes de la aplicación? | Bajo | Producto | Abierta | FEAT-007 |

## 9. Backend (CFs/transacciones)

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-041 | ¿Qué límites de tiempo de ejecución y memoria se configurarán para las Cloud Functions? | Alto | Tech | Abierta | FEAT-005 |
| Q-042 | ¿Cómo se manejarán los reintentos y la idempotencia en funciones críticas como procesamiento de pagos? | Alto | Tech | Abierta | FEAT-004, FEAT-008 |
| Q-043 | ¿Qué estrategia de versionado se aplicará a las APIs de Cloud Functions? | Medio | Tech | Abierta | FEAT-005 |
| Q-044 | ¿Cómo se organizarán las transacciones para garantizar integridad en operaciones multicolección? | Alto | Tech | Abierta | FEAT-002, FEAT-004 |
| Q-045 | ¿Qué políticas de throttling/rate limiting se implementarán para prevenir abusos? | Medio | Tech | Abierta | FEAT-005, FEAT-008 |
| Q-Context-MCP | ¿Adoptamos context7 como servidor MCP para Cursor (solo en dev), sin afectar el runtime del MVP? | Medio | Tech | Abierta | ADR-Context-MCP (pendiente) |
| Q-ADMIN-01 | ¿Cuál es la política para promover a un usuario al rol de "admin"? | Alto | Producto | Abierta | FEAT-008 |
| Q-ADMIN-02 | ¿El procedimiento para ejecutar `setCustomClaim` será manual (vía gcloud/script) o se creará una UI mínima? | Medio | Tech | Abierta | FEAT-008 |

## 10. Observabilidad/Logs

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-046 | ¿Qué métricas específicas se rastrearán para monitorear el rendimiento de la aplicación? | Medio | Tech | Abierta | FEAT-005 |
| Q-047 | ¿Se implementará algún sistema de alertas para errores críticos o anomalías? | Alto | Tech | Abierta | FEAT-005 |
| Q-048 | ¿Qué nivel de detalle de logs se mantendrá en producción vs. desarrollo? | Bajo | Tech | Abierta | FEAT-005 |
| Q-049 | ¿Cómo se estructurarán los logs para facilitar el diagnóstico de problemas? | Medio | Tech | Abierta | FEAT-005 |
| Q-050 | ¿Se implementará algún dashboard específico para seguimiento de métricas de negocio? | Medio | Producto | Abierta | FEAT-005 |

## 11. Despliegue/Entornos

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-051 | ¿Cuántos entornos se necesitarán (desarrollo, staging, producción) y cómo se configurarán? | Alto | Tech | Abierta | FEAT-005 |
| Q-052 | ¿Qué estrategia de CI/CD se implementará para automatizar pruebas y despliegues? | Alto | Tech | Abierta | FEAT-005 |
| Q-053 | ¿Cómo se gestionarán las migraciones de base de datos entre versiones? | Alto | Tech | Abierta | FEAT-005 |
| Q-054 | ¿Qué dominio/subdominio se utilizará para cada entorno? | Bajo | Producto | Abierta | FEAT-005 |
| Q-055 | ¿Cuál es la estrategia para rollbacks en caso de despliegues fallidos? | Alto | Tech | Abierta | FEAT-005, FEAT-008 |

## 12. Legal/Consentimiento

| ID | Pregunta/Supuesto | Impacto | Responsable | Estado | Decisión/Ticket |
|----|------------------|---------|------------|--------|----------------|
| Q-056 | ¿Qué términos y condiciones específicos se requerirán para el uso de la plataforma? | Alto | Legal | Abierta | FEAT-001, FEAT-008 |
| Q-057 | ¿Cómo se manejarán los consentimientos de uso de datos personales (GDPR, CCPA, etc.)? | Alto | Legal | Abierta | FEAT-001, FEAT-008 |
| Q-058 | ¿Qué información debe incluirse en la política de privacidad específica para esta aplicación? | Alto | Legal | Abierta | FEAT-001, FEAT-008 |
| Q-059 | ¿Se requiere algún disclaimer específico para los resultados e interpretaciones de la evaluación? | Alto | Legal | Abierta | FEAT-003, FEAT-008 |
| Q-060 | ¿Qué proceso se implementará para gestionar solicitudes de eliminación de cuenta/datos? | Alto | Legal | Abierta | FEAT-001, FEAT-008 |

## Sección de Decisiones Tomadas (ADR)

### ADR-001: Estrategia de Autenticación

**Contexto**: Necesitamos determinar qué métodos de autenticación ofrecer a los usuarios para equilibrar facilidad de acceso y seguridad.

**Decisión**: Implementar autenticación con email/contraseña y Google OAuth como métodos principales para el MVP. La verificación de email será opcional inicialmente.

**Consecuencia**: Simplifica el acceso inicial, pero podría requerir trabajo adicional para añadir otros proveedores de identidad en el futuro. La verificación opcional de email podría permitir algunas cuentas no verificadas.

**Referencias**: FEAT-001

### ADR-002: Arquitectura Serverless

**Contexto**: Necesitamos definir la arquitectura backend para optimizar costos y mantenimiento inicial.

**Decisión**: Utilizar arquitectura completamente serverless basada en Firebase (Authentication, Firestore, Cloud Functions, Hosting) sin servidores tradicionales.

**Consecuencia**: Menor costo inicial y mantenimiento más simple, pero posibles limitaciones en funcionalidades avanzadas y control. Posible lock-in con el ecosistema Google Cloud.

**Referencias**: FEAT-005

### ADR-003: Modelo de Datos Firestore

**Contexto**: Debemos definir la estructura de las colecciones principales para optimizar acceso y costos.

**Decisión**: Implementar colecciones separadas para `users`, `evaluations`, `evaluationQuestions` con referencias entre ellas en lugar de datos anidados profundos.

**Consecuencia**: Mejor flexibilidad para consultas y actualizaciones independientes, pero requiere gestión cuidadosa de referencias y posibles múltiples lecturas.

**Referencias**: FEAT-002, FEAT-006

### ADR-004: Estrategia de Créditos

**Contexto**: Necesitamos definir cómo gestionar los créditos de evaluación para el modelo freemium.

**Decisión**: Cada usuario recibe 1 crédito gratuito al registrarse. Los créditos no caducan. Transacciones atómicas para modificar créditos sólo desde Cloud Functions.

**Consecuencia**: Simple de entender para usuarios, pero podría limitar engagement si usuarios consumen su crédito inicial y no regresan. Las reglas de Firestore deben implementarse cuidadosamente.

**Referencias**: FEAT-001, FEAT-004

### ADR-005: Generación de PDF

**Contexto**: Debemos decidir dónde generar los informes PDF para equilibrar rendimiento y consistencia.

**Decisión**: Implementación híbrida: El cliente (browser) generará PDFs para dispositivos con capacidades adecuadas, con fallback a generación en servidor para dispositivos limitados o PDF complejos.

**Consecuencia**: Mejor experiencia de usuario y menor costo de servidor para la mayoría de casos, pero requiere implementación dual y detección de capacidades.

**Referencias**: FEAT-003, FEAT-004

### ADR-PDF: Selección de Motor PDF en Frontend

**Contexto**: Se debe decidir qué librería usar para la generación de PDFs en el cliente para asegurar un buen rendimiento, mantenibilidad y calidad del documento final. La decisión anterior (ADR-005) fue muy genérica.

**Decisión**: Se elige **pdfMake** como la librería para la generación de PDFs en el frontend. Su lógica estará encapsulada en `services/report-generator.js` para crear una interfaz estable que permita reemplazar el motor en el futuro si es necesario sin afectar el resto de la aplicación.

**Consecuencia**: pdfMake ofrece un control declarativo sobre el contenido del PDF, lo que facilita la creación de diseños complejos. La encapsulación asegura bajo acoplamiento y facilita futuras migraciones.

**Referencias**: FEAT-003, FEAT-004

### ADR-Insights: Gestión de Insights Avanzados como Feature Flag

**Contexto**: Los insights avanzados (Sombras & Sinergia) son una funcionalidad de alto valor pero computacionalmente más intensiva y no esencial para el flujo principal del MVP.

**Decisión**: Se implementarán como una feature P1, desactivada por defecto mediante una feature flag (`enableAdvancedInsights`). El cálculo se realizará en una Cloud Function dedicada (`calculateAdvancedInsights`) solo si la flag está activa.

**Consecuencia**: Permite lanzar el MVP sin esta funcionalidad, reduciendo la complejidad inicial. Facilita pruebas A/B o un lanzamiento controlado en el futuro. Requiere una correcta gestión de variables de entorno/configuración.

**Referencias**: FEAT-009

### ADR-Context-MCP: Adopción de MCP para Contexto de Desarrollo

**Contexto**: Se evalúa usar MCP para dar a Cursor contexto estructurado del repo, llaves por variables de entorno (sin secretos en código) y acceso a herramientas locales.

**Decisión (PENDIENTE)**: Adoptar / No adoptar context7 como servidor MCP solo para desarrollo; sin cambiar el stack del MVP ni dependencias de producción.

**Consecuencia**: Si se adopta, documentar setup local y scopes; si no, mantener flujo actual.

**Referencias**: FEAT-005, FEAT-008

## Bloqueantes para Inicio de Fase 2

- [ ] [Q-001: Ciclo de vida y caducidad de créditos](#1-negocioalcance)
- [ ] [Q-011: Estrategia para gestionar contenido de evaluación](#3-datosmodeloreglas)
- [ ] [Q-016: Manejo de evaluaciones abandonadas/incompletas](#4-evaluación-ux--tipos-de-pregunta)
- [ ] [Q-022: Estrategia de generación de PDF (cliente vs servidor)](#5-resultadosreportespdf)
- [ ] [Q-027: Manejo de fallos en webhooks de Stripe](#6-pagosstripewebhooks)
- [ ] [Q-031: Estrategia para gestión de claves API de terceros](#7-seguridadprivacidadreglas-firestore)
- [ ] [Q-032: Diseño de reglas de Firestore para optimización](#7-seguridadprivacidadreglas-firestore)
- [ ] [Q-044: Organización de transacciones para integridad de datos](#9-backend-cfstransacciones)
- [ ] [Q-051: Configuración de entornos (desarrollo, staging, producción)](#11-despliegueeentornos)
- [ ] [Q-057: Manejo de consentimientos de uso de datos personales](#12-legalconsentimiento)
