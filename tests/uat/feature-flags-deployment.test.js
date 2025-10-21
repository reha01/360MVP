/**
 * UAT 8: Feature Flags y Despliegue Testing
 * 
 * Validar feature flags OFF por defecto
 * Validar habilitación por etapas
 * Validar runbook de operaciones
 */

import { test, expect } from '@playwright/test';

test.describe('UAT 8: Feature Flags y Despliegue', () => {
  test.beforeEach(async ({ page }) => {
    // Simular login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
  });

  test('Feature flags OFF por defecto', async ({ page }) => {
    // Verificar que las rutas de Fase 2 no están disponibles
    const phase2Routes = [
      '/dashboard-360',
      '/comparison',
      '/policies',
      '/alerts'
    ];
    
    for (const route of phase2Routes) {
      await page.goto(route);
      
      // Verificar que se muestra mensaje de feature no disponible
      const featureUnavailable = page.locator('[data-testid="feature-unavailable"]');
      await expect(featureUnavailable).toBeVisible();
      
      const unavailableText = await featureUnavailable.textContent();
      expect(unavailableText).toContain('Función no disponible');
      expect(unavailableText).toContain('Esta función está en desarrollo');
    }
    
    // Verificar que las acciones masivas no están disponibles
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Verificar que no hay botón de acciones masivas
    const bulkActionsButton = page.locator('[data-testid="bulk-actions-button"]');
    await expect(bulkActionsButton).not.toBeVisible();
    
    // Verificar que no hay pestaña de comparativas
    const comparisonTab = page.locator('[data-testid="comparison-tab"]');
    await expect(comparisonTab).not.toBeVisible();
  });

  test('Habilitación por etapas - Dashboard', async ({ page }) => {
    // Simular habilitación del feature flag de dashboard
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_dashboard_360', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Verificar que la ruta de dashboard está disponible
    await page.goto('/dashboard-360');
    await page.waitForSelector('[data-testid="dashboard-page"]');
    
    // Verificar que se muestra el dashboard
    const dashboard = page.locator('[data-testid="operational-dashboard"]');
    await expect(dashboard).toBeVisible();
    
    // Verificar que se muestran las métricas
    const metrics = page.locator('[data-testid="dashboard-metrics"]');
    await expect(metrics).toBeVisible();
    
    // Verificar que se muestran los filtros
    const filters = page.locator('[data-testid="dashboard-filters"]');
    await expect(filters).toBeVisible();
    
    // Verificar que se muestra la paginación
    const pagination = page.locator('[data-testid="dashboard-pagination"]');
    await expect(pagination).toBeVisible();
    
    // Verificar que las otras rutas siguen deshabilitadas
    const otherRoutes = ['/comparison', '/policies', '/alerts'];
    
    for (const route of otherRoutes) {
      await page.goto(route);
      
      const featureUnavailable = page.locator('[data-testid="feature-unavailable"]');
      await expect(featureUnavailable).toBeVisible();
    }
  });

  test('Habilitación por etapas - Acciones Masivas', async ({ page }) => {
    // Simular habilitación del feature flag de acciones masivas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_bulk_actions', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Ir a campañas
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Verificar que ahora hay botón de acciones masivas
    const bulkActionsButton = page.locator('[data-testid="bulk-actions-button"]');
    await expect(bulkActionsButton).toBeVisible();
    
    // Hacer clic en acciones masivas
    await page.click('[data-testid="bulk-actions-button"]');
    await page.waitForSelector('[data-testid="bulk-actions-modal"]');
    
    // Verificar que se muestra el modal de acciones masivas
    const bulkActionsModal = page.locator('[data-testid="bulk-actions-modal"]');
    await expect(bulkActionsModal).toBeVisible();
    
    // Verificar que se muestran las opciones de acciones masivas
    const resendButton = page.locator('[data-testid="resend-invitations"]');
    await expect(resendButton).toBeVisible();
    
    const extendButton = page.locator('[data-testid="extend-deadlines"]');
    await expect(extendButton).toBeVisible();
    
    // Verificar que las otras rutas siguen deshabilitadas
    const otherRoutes = ['/comparison', '/policies', '/alerts'];
    
    for (const route of otherRoutes) {
      await page.goto(route);
      
      const featureUnavailable = page.locator('[data-testid="feature-unavailable"]');
      await expect(featureUnavailable).toBeVisible();
    }
  });

  test('Habilitación por etapas - Comparativas', async ({ page }) => {
    // Simular habilitación del feature flag de comparativas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_campaign_comparison', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Verificar que la ruta de comparativas está disponible
    await page.goto('/comparison');
    await page.waitForSelector('[data-testid="comparison-page"]');
    
    // Verificar que se muestra la página de comparativas
    const comparisonPage = page.locator('[data-testid="comparison-page"]');
    await expect(comparisonPage).toBeVisible();
    
    // Verificar que se muestran los selectores de campañas
    const campaignSelectors = page.locator('[data-testid="campaign-selectors"]');
    await expect(campaignSelectors).toBeVisible();
    
    // Verificar que se muestran los disclaimers
    const disclaimers = page.locator('[data-testid="version-disclaimers"]');
    await expect(disclaimers).toBeVisible();
    
    // Verificar que las otras rutas siguen deshabilitadas
    const otherRoutes = ['/policies', '/alerts'];
    
    for (const route of otherRoutes) {
      await page.goto(route);
      
      const featureUnavailable = page.locator('[data-testid="feature-unavailable"]');
      await expect(featureUnavailable).toBeVisible();
    }
  });

  test('Habilitación por etapas - Políticas', async ({ page }) => {
    // Simular habilitación del feature flag de políticas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_org_policies', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Verificar que la ruta de políticas está disponible
    await page.goto('/policies');
    await page.waitForSelector('[data-testid="policies-page"]');
    
    // Verificar que se muestra la página de políticas
    const policiesPage = page.locator('[data-testid="policies-page"]');
    await expect(policiesPage).toBeVisible();
    
    // Verificar que se muestran las configuraciones de políticas
    const policyConfigs = page.locator('[data-testid="policy-configs"]');
    await expect(policyConfigs).toBeVisible();
    
    // Verificar que se muestran los umbrales de anonimato
    const anonymityThresholds = page.locator('[data-testid="anonymity-thresholds"]');
    await expect(anonymityThresholds).toBeVisible();
    
    // Verificar que se muestran las políticas de retención
    const retentionPolicies = page.locator('[data-testid="retention-policies"]');
    await expect(retentionPolicies).toBeVisible();
    
    // Verificar que la ruta de alertas sigue deshabilitada
    await page.goto('/alerts');
    
    const featureUnavailable = page.locator('[data-testid="feature-unavailable"]');
    await expect(featureUnavailable).toBeVisible();
  });

  test('Habilitación por etapas - Alertas', async ({ page }) => {
    // Simular habilitación del feature flag de alertas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_operational_alerts', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Verificar que la ruta de alertas está disponible
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que se muestra la página de alertas
    const alertsPage = page.locator('[data-testid="alerts-page"]');
    await expect(alertsPage).toBeVisible();
    
    // Verificar que se muestran las alertas activas
    const activeAlerts = page.locator('[data-testid="active-alerts"]');
    await expect(activeAlerts).toBeVisible();
    
    // Verificar que se muestran las alertas resueltas
    const resolvedAlerts = page.locator('[data-testid="resolved-alerts"]');
    await expect(resolvedAlerts).toBeVisible();
    
    // Verificar que se muestran las configuraciones de alertas
    const alertConfigs = page.locator('[data-testid="alert-configs"]');
    await expect(alertConfigs).toBeVisible();
  });

  test('Runbook - Pausar colas', async ({ page }) => {
    // Ir a página de alertas (si está habilitada)
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_operational_alerts', 'true');
    });
    
    await page.reload();
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que hay botón de pausar colas
    const pauseQueuesButton = page.locator('[data-testid="pause-queues"]');
    await expect(pauseQueuesButton).toBeVisible();
    
    // Hacer clic en pausar colas
    await page.click('[data-testid="pause-queues"]');
    await page.waitForSelector('[data-testid="pause-confirmation"]');
    
    // Verificar que se muestra confirmación
    const pauseConfirmation = page.locator('[data-testid="pause-confirmation"]');
    await expect(pauseConfirmation).toBeVisible();
    
    const confirmationText = await pauseConfirmation.textContent();
    expect(confirmationText).toContain('¿Estás seguro de pausar las colas?');
    expect(confirmationText).toContain('Esto detendrá el procesamiento de trabajos');
    
    // Confirmar pausa
    await page.click('[data-testid="confirm-pause"]');
    await page.waitForSelector('[data-testid="queues-paused"]');
    
    // Verificar que se muestra confirmación de pausa
    const queuesPaused = page.locator('[data-testid="queues-paused"]');
    await expect(queuesPaused).toBeVisible();
    
    const pausedText = await queuesPaused.textContent();
    expect(pausedText).toContain('Colas pausadas');
    expect(pausedText).toContain('El procesamiento se ha detenido');
    
    // Verificar que hay botón de reanudar colas
    const resumeQueuesButton = page.locator('[data-testid="resume-queues"]');
    await expect(resumeQueuesButton).toBeVisible();
  });

  test('Runbook - Limpiar DLQ', async ({ page }) => {
    // Ir a página de alertas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_operational_alerts', 'true');
    });
    
    await page.reload();
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que hay botón de limpiar DLQ
    const clearDLQButton = page.locator('[data-testid="clear-dlq"]');
    await expect(clearDLQButton).toBeVisible();
    
    // Hacer clic en limpiar DLQ
    await page.click('[data-testid="clear-dlq"]');
    await page.waitForSelector('[data-testid="clear-dlq-confirmation"]');
    
    // Verificar que se muestra confirmación
    const clearDLQConfirmation = page.locator('[data-testid="clear-dlq-confirmation"]');
    await expect(clearDLQConfirmation).toBeVisible();
    
    const confirmationText = await clearDLQConfirmation.textContent();
    expect(confirmationText).toContain('¿Estás seguro de limpiar la DLQ?');
    expect(confirmationText).toContain('Esto eliminará todos los trabajos fallidos');
    
    // Confirmar limpieza
    await page.click('[data-testid="confirm-clear-dlq"]');
    await page.waitForSelector('[data-testid="dlq-cleared"]');
    
    // Verificar que se muestra confirmación de limpieza
    const dlqCleared = page.locator('[data-testid="dlq-cleared"]');
    await expect(dlqCleared).toBeVisible();
    
    const clearedText = await dlqCleared.textContent();
    expect(clearedText).toContain('DLQ limpiada');
    expect(clearedText).toContain('Trabajos fallidos eliminados');
  });

  test('Runbook - Reintentar trabajos', async ({ page }) => {
    // Ir a página de alertas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_operational_alerts', 'true');
    });
    
    await page.reload();
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que hay botón de reintentar trabajos
    const retryJobsButton = page.locator('[data-testid="retry-jobs"]');
    await expect(retryJobsButton).toBeVisible();
    
    // Hacer clic en reintentar trabajos
    await page.click('[data-testid="retry-jobs"]');
    await page.waitForSelector('[data-testid="retry-jobs-modal"]');
    
    // Verificar que se muestra modal de reintento
    const retryJobsModal = page.locator('[data-testid="retry-jobs-modal"]');
    await expect(retryJobsModal).toBeVisible();
    
    // Verificar que se muestran los trabajos fallidos
    const failedJobs = page.locator('[data-testid="failed-job"]');
    const jobCount = await failedJobs.count();
    expect(jobCount).toBeGreaterThan(0);
    
    // Seleccionar trabajos para reintentar
    await page.click('[data-testid="select-all-jobs"]');
    
    // Verificar que se muestran las opciones de reintento
    const retryOptions = page.locator('[data-testid="retry-options"]');
    await expect(retryOptions).toBeVisible();
    
    // Configurar reintento
    await page.selectOption('[data-testid="retry-strategy"]', 'exponential-backoff');
    await page.fill('[data-testid="max-retries"]', '3');
    
    // Iniciar reintento
    await page.click('[data-testid="start-retry"]');
    await page.waitForSelector('[data-testid="retry-started"]');
    
    // Verificar que se muestra confirmación de reintento
    const retryStarted = page.locator('[data-testid="retry-started"]');
    await expect(retryStarted).toBeVisible();
    
    const startedText = await retryStarted.textContent();
    expect(startedText).toContain('Reintento iniciado');
    expect(startedText).toContain('Trabajos en cola para reintento');
  });

  test('Runbook - Bajar flags', async ({ page }) => {
    // Ir a página de alertas
    await page.addInitScript(() => {
      window.localStorage.setItem('feature_operational_alerts', 'true');
    });
    
    await page.reload();
    await page.goto('/alerts');
    await page.waitForSelector('[data-testid="alerts-page"]');
    
    // Verificar que hay botón de bajar flags
    const lowerFlagsButton = page.locator('[data-testid="lower-flags"]');
    await expect(lowerFlagsButton).toBeVisible();
    
    // Hacer clic en bajar flags
    await page.click('[data-testid="lower-flags"]');
    await page.waitForSelector('[data-testid="lower-flags-modal"]');
    
    // Verificar que se muestra modal de bajar flags
    const lowerFlagsModal = page.locator('[data-testid="lower-flags-modal"]');
    await expect(lowerFlagsModal).toBeVisible();
    
    // Verificar que se muestran los flags activos
    const activeFlags = page.locator('[data-testid="active-flag"]');
    const flagCount = await activeFlags.count();
    expect(flagCount).toBeGreaterThan(0);
    
    // Seleccionar flags para bajar
    await page.click('[data-testid="select-all-flags"]');
    
    // Verificar que se muestran las opciones de bajada
    const lowerOptions = page.locator('[data-testid="lower-options"]');
    await expect(lowerOptions).toBeVisible();
    
    // Configurar bajada
    await page.selectOption('[data-testid="lower-strategy"]', 'immediate');
    await page.fill('[data-testid="lower-reason"]', 'Problemas de rendimiento');
    
    // Confirmar bajada
    await page.click('[data-testid="confirm-lower"]');
    await page.waitForSelector('[data-testid="flags-lowered"]');
    
    // Verificar que se muestra confirmación de bajada
    const flagsLowered = page.locator('[data-testid="flags-lowered"]');
    await expect(flagsLowered).toBeVisible();
    
    const loweredText = await flagsLowered.textContent();
    expect(loweredText).toContain('Flags bajados');
    expect(loweredText).toContain('Funciones deshabilitadas');
  });

  test('Validación de flags por organización piloto', async ({ page }) => {
    // Simular organización piloto
    await page.addInitScript(() => {
      window.localStorage.setItem('pilot_org', 'true');
    });
    
    // Recargar página
    await page.reload();
    
    // Verificar que todas las rutas están disponibles para org piloto
    const pilotRoutes = [
      '/dashboard-360',
      '/comparison',
      '/policies',
      '/alerts'
    ];
    
    for (const route of pilotRoutes) {
      await page.goto(route);
      await page.waitForSelector('[data-testid*="page"]');
      
      // Verificar que la página se carga correctamente
      const pageElement = page.locator('[data-testid*="page"]');
      await expect(pageElement).toBeVisible();
    }
    
    // Verificar que las acciones masivas están disponibles
    await page.goto('/campaigns');
    await page.waitForSelector('[data-testid="campaigns-page"]');
    
    // Seleccionar campaña
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.waitForSelector('[data-testid="campaign-details"]');
    
    // Verificar que hay botón de acciones masivas
    const bulkActionsButton = page.locator('[data-testid="bulk-actions-button"]');
    await expect(bulkActionsButton).toBeVisible();
    
    // Verificar que hay pestaña de comparativas
    const comparisonTab = page.locator('[data-testid="comparison-tab"]');
    await expect(comparisonTab).toBeVisible();
  });
});
