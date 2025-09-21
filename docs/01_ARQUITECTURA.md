### Funcionalidades de Lanzamiento (MVP)

#### Gestión de Usuarios y Onboarding
Resumen de la funcionalidad: Proporciona el flujo completo para que un nuevo usuario se registre, inicie sesión y acceda a su panel de control personal. Este sistema gestionará la identidad del usuario y su estado inicial en la plataforma.
*   **Requisitos:**
    *   Registro de usuario mediante correo electrónico y contraseña.
    *   Registro e inicio de sesión con proveedor OAuth (Google).
    *   Mecanismo de restablecimiento de contraseña.
    *   Creación automática de un perfil de usuario en la base de datos al registrarse, asignando 1 crédito de evaluación gratuita.
    *   Panel de control (dashboard) inicial que muestra el estado de la evaluación (no iniciada).

#### Flujo de Evaluación Individual
Resumen de la funcionalidad: Permite a un usuario con créditos disponibles realizar la autoevaluación completa a través de una interfaz guiada. El sistema guardará el progreso y las respuestas de forma segura.
*   **Requisitos:**
    *   Verificación de que el usuario tiene `creditosEvaluacion > 0` antes de iniciar.
    *   Interfaz de asistente (wizard) interactivo para presentar las preguntas secuencialmente.
    *   Almacenamiento de las respuestas del usuario en la base de datos.
    *   Al finalizar, se descuenta 1 `creditoEvaluacion` y se marca la evaluación como completada.
    *   Redirección automática al dashboard para ver el informe resumido.

#### Visualización de Informe y Upsell
Resumen de la funcionalidad: Tras completar la evaluación, el usuario visualiza un resumen de sus resultados directamente en su dashboard. Estratégicamente, se le presenta una oferta clara para comprar la versión completa y detallada del informe.
*   **Requisitos:**
    *   Generación y visualización de un gráfico radar (usando Chart.js) basado en las respuestas.
    *   Presentación de un texto interpretativo breve y automatizado.
    *   Botón de Llamada a la Acción (CTA) prominente: "Desbloquear Informe Completo en PDF".
    *   El CTA inicia el flujo de pago para la compra del informe completo o créditos adicionales.

#### Monetización y Compra de Créditos
Resumen de la funcionalidad: Gestiona el ciclo de vida del usuario después de su primera evaluación gratuita. Bloquea nuevos intentos y le guía hacia la compra de "créditos de evaluación" para fomentar el uso recurrente.
*   **Requisitos:**
    *   Sistema que detecta cuando un usuario con `creditosEvaluacion = 0` intenta realizar una nueva evaluación.
    *   Modal o página que explica el agotamiento de créditos y ofrece opciones de compra.
    *   Integración con un procesador de pagos (ej. Stripe) para gestionar transacciones de compra de créditos.
    *   Actualización del perfil del usuario con los nuevos créditos adquiridos tras una compra exitosa.
    *   Generación del informe completo en PDF (usando jsPDF) después de una compra exitosa.

### Funcionalidades Futuras (Post-MVP)

#### Cuentas Organizacionales (B2B)
*   **Requisitos:**
    *   Roles de administrador para líderes de ministerio.
    *   Panel de control para gestionar miembros del equipo (invitar, eliminar).
    *   Compra y asignación de créditos en volumen para el equipo.
    *   Visualización de informes agregados y anónimos del equipo para identificar tendencias de crecimiento.

#### Planes de Desarrollo Personalizado
*   **Requisitos:**
    *   Sugerencias de acciones y recursos (artículos, videos, libros) basadas en los resultados de la evaluación.
    *   Capacidad para que el usuario cree metas personales y realice un seguimiento de su progreso.
    *   Recordatorios y notificaciones para mantener al usuario comprometido con su plan.

#### Evaluaciones 360°
*   **Requisitos:**
    *   Permitir a los usuarios invitar a compañeros, mentores o supervisores a responder una versión de la evaluación sobre ellos.
    *   Consolidar los resultados de la autoevaluación y el feedback externo en un único informe comparativo.
    *   Garantizar el anonimato de los evaluadores externos.

### Diagrama del Sistema

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
    <defs>
        <style>
            .layer-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #333; }
            .component-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #fff; }
            .component-sublabel { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; fill: #eee; }
            .arrow-head { fill: #333; }
            .arrow-line { stroke: #333; stroke-width: 1.5; }
            .dashed-line { stroke: #555; stroke-width: 1; stroke-dasharray: 4 4; }
        </style>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="arrow-head" />
        </marker>
    </defs>

    <!-- Layers -->
    <rect x="10" y="30" width="940" height="120" rx="10" ry="10" fill="#E3F2FD" />
    <text x="30" y="20" class="layer-label">CLIENTE (Navegador Web)</text>
    <rect x="10" y="170" width="940" height="120" rx="10" ry="10" fill="#FFF9C4" />
    <text x="30" y="160" class="layer-label">HOSTING &amp; CDN</text>
    <rect x="10" y="310" width="940" height="180" rx="10" ry="10" fill="#C8E6C9" />
    <text x="30" y="300" class="layer-label">BACKEND (Serverless)</text>
    <rect x="10" y="510" width="940" height="120" rx="10" ry="10" fill="#FFCCBC" />
    <text x="30" y="500" class="layer-label">DATOS &amp; SERVICIOS DE TERCEROS</text>

    <!-- Client Layer Components -->
    <g transform="translate(380, 50)">
        <rect width="200" height="80" rx="8" ry="8" fill="#42A5F5" />
        <text x="100" y="35" text-anchor="middle" class="component-label">Single Page App (SPA)</text>
        <text x="100" y="55" text-anchor="middle" class="component-sublabel">JavaScript (ES6), Chart.js, jsPDF</text>
    </g>

    <!-- Hosting Layer Components -->
    <g transform="translate(380, 190)">
        <rect width="200" height="80" rx="8" ry="8" fill="#FFEE58" />
        <text x="100" y="45" text-anchor="middle" class="component-label" fill="#333">Firebase Hosting</text>
    </g>
    
    <!-- Backend Layer Components -->
    <g transform="translate(30, 330)">
        <rect width="900" height="140" rx="8" ry="8" fill="#81C784" />
        <text x="450" y="20" text-anchor="middle" class="component-label">Firebase Cloud Functions</text>
        
        <g transform="translate(20, 40)">
            <rect width="150" height="70" rx="5" ry="5" fill="#4CAF50" />
            <text x="75" y="30" text-anchor="middle" class="component-label">Gestión de</text>
            <text x="75" y="45" text-anchor="middle" class="component-label">Usuarios</text>
            <text x="75" y="60" text-anchor="middle" class="component-sublabel">(onUserCreate)</text>
        </g>
        <g transform="translate(190, 40)">
            <rect width="150" height="70" rx="5" ry="5" fill="#4CAF50" />
            <text x="75" y="30" text-anchor="middle" class="component-label">Lógica de</text>
            <text x="75" y="45" text-anchor="middle" class="component-label">Evaluación</text>
            <text x="75" y="60" text-anchor="middle" class="component-sublabel">(submitAnswers)</text>
        </g>
        <g transform="translate(360, 40)">
            <rect width="150" height="70" rx="5" ry="5" fill="#4CAF50" />
            <text x="75" y="30" text-anchor="middle" class="component-label">Generación de</text>
            <text x="75" y="45" text-anchor="middle" class="component-label">Informes</text>
            <text x="75" y="60" text-anchor="middle" class="component-sublabel">(generateReport)</text>
        </g>
        <g transform="translate(530, 40)">
            <rect width="150" height="70" rx="5" ry="5" fill="#4CAF50" />
            <text x="75" y="30" text-anchor="middle" class="component-label">Pasarela de</text>
            <text x="75" y="45" text-anchor="middle" class="component-label">Pagos</text>
            <text x="75" y="60" text-anchor="middle" class="component-sublabel">(createCheckout)</text>
        </g>
        <g transform="translate(700, 40)">
            <rect width="180" height="70" rx="5" ry="5" fill="#4CAF50" />
            <text x="90" y="30" text-anchor="middle" class="component-label">API Gateway</text>
             <text x="90" y="50" text-anchor="middle" class="component-sublabel">(Endpoints HTTPS)</text>
        </g>
    </g>

    <!-- Data/Services Layer Components -->
    <g transform="translate(100, 530)">
        <rect width="200" height="80" rx="8" ry="8" fill="#FF8A65" />
        <text x="100" y="35" text-anchor="middle" class="component-label">Firebase Authentication</text>
        <text x="100" y="55" text-anchor="middle" class="component-sublabel">(Email/Pass, Google)</text>
    </g>
    <g transform="translate(380, 530)">
        <rect width="200" height="80" rx="8" ry="8" fill="#FF8A65" />
        <text x="100" y="35" text-anchor="middle" class="component-label">Cloud Firestore (NoSQL)</text>
        <text x="100" y="55" text-anchor="middle" class="component-sublabel">/users, /answers, /reports</text>
    </g>
    <g transform="translate(660, 530)">
        <rect width="200" height="80" rx="8" ry="8" fill="#FF8A65" />
        <text x="100" y="35" text-anchor="middle" class="component-label">Stripe API</text>
        <text x="100" y="55" text-anchor="middle" class="component-sublabel">Procesador de Pagos</text>
    </g>
    
    <!-- Connections -->
    <path d="M 480 130 V 190" class="arrow-line" marker-end="url(#arrow)" />
    <path d="M 480 270 V 330" class="arrow-line" marker-end="url(#arrow)" />
    
    <path d="M 790 330 H 790 V 230 H 580" class="arrow-line" marker-end="url(#arrow)"/>
    <text x="690" y="245" font-size="10">Llamadas API (HTTPS)</text>
    
    <path d="M 125 470 V 530" class="arrow-line" marker-end="url(#arrow)" />
    <path d="M 265 470 V 550 H 380" class="arrow-line" marker-end="url(#arrow)" />
    <path d="M 435 470 V 530" class="arrow-line" marker-end="url(#arrow)" />

    <path d="M 200 530 H 200 V 470" class="arrow-line dashed-line" />
    <path d="M 480 530 H 480 V 470" class="arrow-line dashed-line" />
    
    <path d="M 605 470 V 550 H 660" class="arrow-line" marker-end="url(#arrow)" />
    <path d="M 760 530 H 760 V 470" class="arrow-line dashed-line" />

</svg>
```

### Preguntas y Aclaraciones

*   **Sobre el Producto:**
    1.  ¿Cuál es el ciclo de vida esperado de un "crédito de evaluación"? ¿Caducan? ¿Puede un usuario comprar múltiples informes del mismo tipo para medir su progreso a lo largo del tiempo?
    2.  En el informe resumido, ¿qué tan profundo debe ser el "texto interpretativo"? ¿Es un texto estático por cada arquetipo de resultado o se genera dinámicamente combinando frases según las puntuaciones?
    3.  Para el MVP, ¿cómo se gestionará el contenido de la evaluación (preguntas, ponderaciones, lógica de puntuación)? ¿Estará codificado directamente en la aplicación o se necesita una forma sencilla de actualizarlo sin tocar el código?
    4.  ¿Qué sucede si un usuario abandona la evaluación a mitad de camino? ¿Se guarda su progreso para que pueda continuar más tarde, o debe empezar de nuevo?

*   **Sobre la Arquitectura:**
    1.  **Generación de PDF:** La generación del PDF con `jsPDF` puede consumir bastantes recursos del navegador en dispositivos de gama baja. ¿Consideramos realizar esta generación en el backend (una Cloud Function dedicada) para asegurar la consistencia y descargar al cliente, aunque pueda incurrir en un costo y latencia ligeramente mayores?
    2.  **Seguridad de los Informes:** ¿Cómo se debe gestionar el acceso a los informes completos en PDF? ¿Se genera un enlace de descarga de un solo uso, se almacena en Cloud Storage con acceso restringido, o se genera al momento en cada solicitud?
    3.  **Escalabilidad de Lecturas en Firestore:** El modelo freemium podría generar un alto volumen de usuarios realizando la evaluación inicial. ¿Hemos diseñado las reglas de seguridad y la estructura de datos de Firestore para minimizar las lecturas y evitar que usuarios no autenticados o sin créditos accedan a la lógica de la evaluación?
    4.  **Gestión de "Secretos":** ¿Cuál será la estrategia para gestionar las claves de API de terceros (como Stripe) en el entorno serverless de Firebase? ¿Utilizaremos las variables de entorno de Cloud Functions o una solución más robusta como Google Secret Manager?