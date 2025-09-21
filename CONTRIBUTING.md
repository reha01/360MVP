# 🤝 Guía de Contribución - 360MVP

## 📋 Flujo de Desarrollo

### 🌳 Estrategia de Ramas

```
main (producción)
├── develop (integración)
│   ├── feat/cleanup (limpieza y organización)
│   ├── feat/evaluation-wizard (sistema de evaluación)
│   ├── feat/reports-system (generación de reportes)
│   ├── feat/stripe-integration (monetización)
│   └── feat/testing (pruebas y optimización)
```

### 🔄 Proceso de Desarrollo

1. **Crear rama desde develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/nombre-funcionalidad
   ```

2. **Desarrollo y commits**
   ```bash
   # Commits semánticos
   git commit -m "feat: agregar nueva funcionalidad"
   git commit -m "fix: corregir bug en componente"
   git commit -m "docs: actualizar documentación"
   ```

3. **Pull Request**
   - Subir rama al repositorio
   - Crear PR hacia `develop`
   - Revisión de código
   - Merge después de aprobación

4. **Release**
   ```bash
   # Merge de develop a main para releases
   git checkout main
   git merge develop --no-ff
   git tag v1.x.0
   ```

## 🏷️ Convención de Commits

### Tipos de Commit
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización
- `test:` Pruebas
- `chore:` Tareas de mantenimiento

### Ejemplos
```bash
feat: implementar wizard de evaluación
fix: corregir cálculo de resultados en dashboard
docs: actualizar README con instrucciones de instalación
refactor: optimizar hook useEvaluation
test: agregar pruebas unitarias para componente Question
```

## 📁 Estructura del Proyecto

```
360MVP/
├── src/                     # Código fuente principal
│   ├── components/          # Componentes React reutilizables
│   ├── pages/              # Páginas principales
│   ├── context/            # Contextos de React
│   ├── hooks/              # Custom hooks
│   └── services/           # Servicios y APIs
├── 360MVP-functions/       # Cloud Functions de Firebase
├── docs/                   # Documentación técnica
├── mvp_clean/             # Versión organizada (temporal)
└── legacy_src/            # Código heredado
```

## 🧪 Testing

### Comandos de Testing
```bash
# Ejecutar todas las pruebas
npm test

# Pruebas con coverage
npm run test:coverage

# Pruebas en modo watch
npm run test:watch
```

### Estándares de Calidad
- **Coverage mínimo**: 80%
- **Pruebas requeridas**: Componentes críticos, hooks, servicios
- **E2E**: Flujos principales (autenticación, evaluación, pagos)

## 🚀 Despliegue

### Ambientes
- **Desarrollo**: Firebase Emulators local
- **Staging**: Firebase proyecto de pruebas
- **Producción**: Firebase proyecto principal

### Pipeline
1. **Desarrollo** → Emulators locales
2. **PR Review** → Deploy automático a staging
3. **Merge to main** → Deploy automático a producción

## 📝 Documentación

### Obligatoria
- README actualizado
- Comentarios en código complejo
- JSDoc para funciones públicas
- Changelog para releases

### Opcional pero recomendada
- Diagramas de arquitectura
- Ejemplos de uso
- FAQ de desarrollo
