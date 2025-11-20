/**
 * Wizard para creación de campañas 360°
 * 
 * Proceso de 5 pasos:
 * 1. Información general + fechas
 * 2. Selección de evaluados (filtros)
 * 3. Asignación de tests (auto por Job Family)
 * 4. Reglas de evaluadores (global)
 * 5. Revisión + activación
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import jobFamilyService from '../../services/jobFamilyService';
import orgStructureService from '../../services/orgStructureService';
import { getTestsForOrg } from '../../services/globalTestDefinitionService';
import { CAMPAIGN_TYPE, CAMPAIGN_STATUS, validateCampaign } from '../../models/Campaign';
import { getCampaignTypeLabel } from '../../models/Campaign';

// Subcomponentes
import CampaignInfoStep from './CampaignInfoStep';
// SOLUCIÓN ALTERNATIVA: Cargar los pasos complejos de forma diferida con React.lazy
// Esto los carga completamente fuera del ciclo de render del padre
const EvaluateeSelectionStepLazy = lazy(() => import('./EvaluateeSelectionStep'));
const TestAssignmentStepLazy = lazy(() => import('./TestAssignmentStep'));
const EvaluatorRulesStepLazy = lazy(() => import('./EvaluatorRulesStep'));
const CampaignReviewStepLazy = lazy(() => import('./CampaignReviewStep'));
import WizardErrorBoundary from './WizardErrorBoundary';

// Estilos
import './CampaignWizard.css';

const CampaignWizard = ({ isOpen, onClose, onSuccess }) => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos del wizard
  const [campaignData, setCampaignData] = useState({
    title: '',
    description: '',
    type: CAMPAIGN_TYPE.CUSTOM,
    config: {
      startDate: null,
      endDate: null,
      timezone: 'UTC',
      reminderSchedule: [3, 7, 14],
      anonymityThresholds: {
        peers: 3,
        subordinates: 3,
        external: 1
      },
      requiredEvaluators: {
        self: true,
        manager: true,
        peers: { min: 3, max: 5 },
        subordinates: { min: 0 },
        external: { min: 0 }
      }
    },
    evaluateeFilters: {
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    },
    testAssignments: {}
  });
  
  // Estado controlado para el paso 2 (evita efectos durante render)
  // Inicializar directamente desde campaignData para evitar efectos durante render
  const step2InitializedRef = useRef(false);
  const [step2Filters, setStep2Filters] = useState(() => {
    // Inicializar con valores por defecto seguros
    return {
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    };
  });
  
  // Datos de referencia
  const [jobFamilies, setJobFamilies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Refs para prevenir loops infinitos
  const isInitializedRef = useRef(false);
  const filtersRef = useRef(JSON.stringify(campaignData.evaluateeFilters));
  
  // Refs para mantener los valores más recientes del estado (para evitar problemas de closures)
  const campaignDataRef = useRef(campaignData);
  const step2FiltersRef = useRef(step2Filters);
  
  // Actualizar refs cuando cambia el estado
  useEffect(() => {
    campaignDataRef.current = campaignData;
  }, [campaignData]);
  
  useEffect(() => {
    step2FiltersRef.current = step2Filters;
  }, [step2Filters]);
  
  // Memoizar loadReferenceData para evitar recreaciones
  const loadReferenceData = useCallback(async () => {
    if (!currentOrgId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de referencia con manejo individual de errores
      const [jobFamiliesData, areasData, usersData] = await Promise.allSettled([
        jobFamilyService.getOrgJobFamilies(currentOrgId).catch(() => []),
        orgStructureService.getOrgAreas(currentOrgId).catch(() => []),
        orgStructureService.getOrgUsers(currentOrgId).catch(() => [])
      ]);
      
      setJobFamilies(jobFamiliesData.status === 'fulfilled' ? jobFamiliesData.value : []);
      setAreas(areasData.status === 'fulfilled' ? areasData.value : []);
      setUsers(usersData.status === 'fulfilled' ? usersData.value : []);
      
      // Cargar tests disponibles para la organización usando el servicio real
      // Esto respeta la visibilidad pública/privada y allowedOrgs
      try {
        const orgTests = await getTestsForOrg(currentOrgId);
        
        // Transformar los tests al formato esperado por el componente
        const formattedTests = orgTests.map(test => ({
          id: test.id,
          name: test.title || test.name || 'Test sin nombre',
          version: test.version || '1.0',
          // Mantener otros campos que puedan ser útiles
          ...test
        }));
        
        setAvailableTests(formattedTests);
        
        // Log para debugging
        console.log('[CampaignWizard] Loaded tests for org:', {
          orgId: currentOrgId,
          totalTests: formattedTests.length,
          tests: formattedTests.map(t => ({ id: t.id, name: t.name }))
        });
        
        // Validar si no hay tests disponibles
        if (formattedTests.length === 0) {
          console.warn('[CampaignWizard] No tests available for organization:', currentOrgId);
        }
      } catch (testError) {
        console.error('[CampaignWizard] Error loading tests for org:', testError);
        // En caso de error, establecer lista vacía en lugar de fallar completamente
        setAvailableTests([]);
        // No lanzar el error para que otros datos puedan cargarse
      }
    } catch (err) {
      console.error('[CampaignWizard] Unexpected error loading reference data:', err);
      setJobFamilies([]);
      setAreas([]);
      setUsers([]);
      setAvailableTests([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);
  
  // Memoizar updateFilteredUsers - usar step2Filters directamente cuando estamos en paso 2
  const updateFilteredUsers = useCallback(async () => {
    if (!currentOrgId || !isOpen) return;
    
    try {
      // Usar step2Filters si estamos en paso 2, sino usar campaignData.evaluateeFilters
      const filtersToUse = currentStep === 2 ? step2Filters : campaignData.evaluateeFilters;
      const filtered = await campaignService.getUsersByFilters(currentOrgId, filtersToUse);
      setFilteredUsers(filtered || []);
    } catch (err) {
      console.warn('[CampaignWizard] Error filtering users (non-critical):', err);
      setFilteredUsers(users || []);
    }
  }, [currentOrgId, step2Filters, campaignData.evaluateeFilters, users, isOpen, currentStep]);
  
  // Cargar datos de referencia cuando se abre el wizard
  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      setCurrentStep(1);
      setError(null);
      loadReferenceData();
    } else if (!isOpen) {
      isInitializedRef.current = false;
      setCurrentStep(1);
      setError(null);
      setLoading(false);
      // Resetear datos del wizard
      setCampaignData({
        title: '',
        description: '',
        type: CAMPAIGN_TYPE.CUSTOM,
        config: {
          startDate: null,
          endDate: null,
          timezone: 'UTC',
          reminderSchedule: [3, 7, 14],
          anonymityThresholds: {
            peers: 3,
            subordinates: 3,
            external: 1
          },
          requiredEvaluators: {
            self: true,
            manager: true,
            peers: { min: 3, max: 5 },
            subordinates: { min: 0 },
            external: { min: 0 }
          }
        },
        evaluateeFilters: {
          jobFamilyIds: [],
          areaIds: [],
          userIds: []
        },
        testAssignments: {}
      });
    }
  }, [isOpen, loadReferenceData]);
  
  // Ref para almacenar los filtros iniciales del paso 2 (sin causar re-renders)
  const step2InitialFiltersRef = useRef(null);
  
  // Calcular step2Filters directamente en el render (sin efectos) cuando estamos en paso 2
  // Esto evita actualizaciones de estado durante el render
  const currentStep2Filters = useMemo(() => {
    if (currentStep === 2) {
      // Si ya tenemos filtros iniciales guardados, usarlos
      if (step2InitialFiltersRef.current) {
        return step2InitialFiltersRef.current;
      }
      
      // Si no, calcular desde campaignData (solo cálculo, sin setState)
      const initialFilters = campaignData.evaluateeFilters || {
        jobFamilyIds: [],
        areaIds: [],
        userIds: []
      };
      
      const safeFilters = {
        jobFamilyIds: Array.isArray(initialFilters.jobFamilyIds) ? initialFilters.jobFamilyIds : [],
        areaIds: Array.isArray(initialFilters.areaIds) ? initialFilters.areaIds : [],
        userIds: Array.isArray(initialFilters.userIds) ? initialFilters.userIds : []
      };
      
      // Guardar en ref para próximos renders (sin causar re-render)
      step2InitialFiltersRef.current = safeFilters;
      
      return safeFilters;
    }
    
    // Si no estamos en paso 2, resetear ref y retornar valores por defecto
    step2InitialFiltersRef.current = null;
    return {
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    };
  }, [currentStep, campaignData.evaluateeFilters]);
  
  // NO usar useEffect aquí - cualquier actualización de estado durante el render causará el error
  // Los filtros se inicializan directamente en useMemo y se actualizan solo cuando el usuario interactúa
  
  // Callback para actualizar filtros del paso 2 (SOLO cuando el usuario interactúa)
  // CRÍTICO: NO ejecutar actualizaciones durante el render
  const handleStep2FilterChange = useCallback((newFilters) => {
    // Actualizar ref inmediatamente (sin causar re-render)
    step2InitialFiltersRef.current = newFilters;
    
    // Actualizar estado de forma completamente asíncrona
    // Usar setImmediate simulado con setTimeout(0) para salir completamente del ciclo de render
    setTimeout(() => {
      setStep2Filters(newFilters);
      
      setTimeout(() => {
        setCampaignData(prev => ({
          ...prev,
          evaluateeFilters: newFilters
        }));
        
        // Actualizar usuarios filtrados SOLO cuando el usuario cambia los filtros manualmente
        if (currentOrgId && isOpen && currentStep === 2) {
          setTimeout(() => {
            updateFilteredUsers();
          }, 100);
        }
      }, 0);
    }, 0);
  }, [currentOrgId, isOpen, currentStep, updateFilteredUsers]);
  
  // Ref para prevenir actualizaciones durante cambio de paso
  const isChangingStepRef = useRef(false);
  const pendingUpdatesRef = useRef(null);
  
  const handleStepDataChange = useCallback((stepData) => {
    // Prevenir actualizaciones durante cambio de paso
    if (isChangingStepRef.current) {
      // Acumular actualizaciones pendientes
      pendingUpdatesRef.current = stepData;
      return;
    }
    
    // Usar flushSync para actualizar inmediatamente pero fuera del render
    Promise.resolve().then(() => {
      if (!isChangingStepRef.current) {
        setCampaignData(prev => ({
          ...prev,
          ...stepData
        }));
      }
    });
  }, []);
  
  const handleNext = () => {
    if (currentStep < 5) {
      // Marcar que estamos cambiando de paso ANTES de cualquier actualización
      isChangingStepRef.current = true;
      
      // Sincronizar step2Filters con campaignData antes de cambiar de paso
      // Esto asegura que los filtros estén siempre en campaignData
      if (currentStep === 2) {
        const hasStep2Filters = step2Filters.jobFamilyIds?.length > 0 ||
                               step2Filters.areaIds?.length > 0 ||
                               step2Filters.userIds?.length > 0;
        
        if (hasStep2Filters) {
          setCampaignData(prev => ({
            ...prev,
            evaluateeFilters: step2Filters
          }));
        }
      }
      
      // Cambiar de paso de forma asíncrona para evitar bloqueos
      Promise.resolve().then(() => {
        setCurrentStep(prev => prev + 1);
        
        // Aplicar actualizaciones pendientes y resetear flag después del render
        setTimeout(() => {
          if (pendingUpdatesRef.current) {
            const updates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = null;
            setCampaignData(prev => ({
              ...prev,
              ...updates
            }));
          }
          // Resetear flag después de más tiempo para asegurar que el nuevo paso está montado
          setTimeout(() => {
            isChangingStepRef.current = false;
          }, 200);
        }, 500);
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      // Marcar que estamos cambiando de paso ANTES de cualquier actualización
      isChangingStepRef.current = true;
      
      // Sincronizar step2Filters con campaignData antes de cambiar de paso
      if (currentStep === 2) {
        setCampaignData(prev => ({
          ...prev,
          evaluateeFilters: step2Filters
        }));
      }
      
      // Cambiar de paso de forma asíncrona para evitar bloqueos
      Promise.resolve().then(() => {
        setCurrentStep(prev => prev - 1);
        
        // Aplicar actualizaciones pendientes y resetear flag después del render
        setTimeout(() => {
          if (pendingUpdatesRef.current) {
            const updates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = null;
            setCampaignData(prev => ({
              ...prev,
              ...updates
            }));
          }
          // Resetear flag después de más tiempo para asegurar que el nuevo paso está montado
          setTimeout(() => {
            isChangingStepRef.current = false;
          }, 200);
        }, 500);
      });
    }
  };
  
  // Función para obtener todos los datos sincronizados antes de crear la campaña
  const getSyncedCampaignData = useCallback(() => {
    // Sincronizar step2Filters con campaignData si estamos en paso 2 o más
    // Esto asegura que siempre usemos la fuente más actualizada
    const campaignFilters = campaignData.evaluateeFilters || {
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    };
    
    // Verificar si step2Filters tiene datos reales (prioridad si estamos en paso 2+)
    const hasStep2Filters = step2Filters.jobFamilyIds?.length > 0 ||
                           step2Filters.areaIds?.length > 0 ||
                           step2Filters.userIds?.length > 0;
    
    // Verificar si campaignFilters tiene datos reales
    const hasCampaignFilters = campaignFilters.jobFamilyIds?.length > 0 ||
                               campaignFilters.areaIds?.length > 0 ||
                               campaignFilters.userIds?.length > 0;
    
    // Usar step2Filters si tiene datos y estamos en paso 2+, sino usar campaignFilters
    const syncedEvaluateeFilters = (currentStep >= 2 && hasStep2Filters) ? step2Filters :
                                   (hasCampaignFilters ? campaignFilters : {
                                     jobFamilyIds: [],
                                     areaIds: [],
                                     userIds: []
                                   });
    
    // Obtener título limpio
    const cleanTitle = (campaignData.title || '').trim();
    
    // Log para debugging
    console.log('[CampaignWizard] Syncing campaign data:', {
      currentStep,
      hasCampaignFilters,
      hasStep2Filters,
      campaignFilters,
      step2Filters,
      syncedEvaluateeFilters,
      title: cleanTitle,
      titleLength: cleanTitle.length,
      filteredUsersCount: filteredUsers.length
    });
    
    return {
      ...campaignData,
      // Asegurar que el título esté presente y limpio
      title: cleanTitle,
      // Asegurar que evaluateeFilters esté sincronizado
      evaluateeFilters: syncedEvaluateeFilters,
      // Asegurar que testAssignments esté presente
      testAssignments: campaignData.testAssignments || {},
      // Asegurar que config esté completo
      config: {
        ...campaignData.config,
        requiredEvaluators: campaignData.config?.requiredEvaluators || {
          self: true,
          manager: true,
          peers: { min: 3, max: 5 },
          subordinates: { min: 0 },
          external: { min: 0 }
        },
        anonymityThresholds: campaignData.config?.anonymityThresholds || {
          peers: 3,
          subordinates: 3,
          external: 1
        }
      }
    };
  }, [campaignData, step2Filters, currentStep, filteredUsers.length]);
  
  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Esperar un momento para que todos los componentes hijos sincronicen sus datos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Construir datos sincronizados directamente desde los estados actuales
      // Usar los valores más recientes disponibles sin depender de setState asíncrono
      const currentTitle = (campaignData.title || '').trim();
      
      // Determinar filtros de evaluados: usar step2Filters si tiene datos, sino campaignData.evaluateeFilters
      const step2HasFilters = step2Filters.jobFamilyIds?.length > 0 ||
                             step2Filters.areaIds?.length > 0 ||
                             step2Filters.userIds?.length > 0;
      
      const campaignHasFilters = campaignData.evaluateeFilters?.jobFamilyIds?.length > 0 ||
                                campaignData.evaluateeFilters?.areaIds?.length > 0 ||
                                campaignData.evaluateeFilters?.userIds?.length > 0;
      
      const syncedEvaluateeFilters = step2HasFilters ? step2Filters :
                                    (campaignHasFilters ? campaignData.evaluateeFilters : {
                                      jobFamilyIds: [],
                                      areaIds: [],
                                      userIds: []
                                    });
      
      // Construir objeto de datos sincronizado
      const syncedData = {
        ...campaignData,
        title: currentTitle,
        evaluateeFilters: syncedEvaluateeFilters,
        testAssignments: campaignData.testAssignments || {},
        config: {
          ...campaignData.config,
          requiredEvaluators: campaignData.config?.requiredEvaluators || {
            self: true,
            manager: true,
            peers: { min: 3, max: 5 },
            subordinates: { min: 0 },
            external: { min: 0 }
          },
          anonymityThresholds: campaignData.config?.anonymityThresholds || {
            peers: 3,
            subordinates: 3,
            external: 1
          }
        }
      };
      
      console.log('[CampaignWizard] Synced data before validation:', {
        title: syncedData.title,
        titleLength: syncedData.title?.length,
        evaluateeFilters: syncedData.evaluateeFilters,
        hasJobFamilies: syncedData.evaluateeFilters?.jobFamilyIds?.length > 0,
        hasAreas: syncedData.evaluateeFilters?.areaIds?.length > 0,
        hasUsers: syncedData.evaluateeFilters?.userIds?.length > 0,
        filteredUsersCount: filteredUsers.length,
        step2HasFilters,
        campaignHasFilters
      });
      
      // Validar antes de crear
      const validation = validateCampaign(syncedData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join('. ');
        console.error('[CampaignWizard] Validation failed:', validation.errors);
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      console.log('[CampaignWizard] Creating campaign with data:', syncedData);
      
      const campaign = await campaignService.createCampaign(
        currentOrgId,
        syncedData,
        user.uid
      );
      
      console.log('[CampaignWizard] Campaign created successfully:', campaign.campaignId);
      
      if (onSuccess) {
        onSuccess(campaign);
      }
      
      onClose();
    } catch (err) {
      console.error('[CampaignWizard] Error creating campaign:', err);
      console.error('[CampaignWizard] Error stack:', err.stack);
      // Extraer mensaje de error más descriptivo
      const errorMessage = err.message || 'Error al crear la campaña';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleActivateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Esperar un momento para que todos los componentes hijos sincronicen sus datos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Construir datos sincronizados directamente desde los estados actuales
      // Usar los valores más recientes disponibles sin depender de setState asíncrono
      const currentTitle = (campaignData.title || '').trim();
      
      // Determinar filtros de evaluados: usar step2Filters si tiene datos, sino campaignData.evaluateeFilters
      const step2HasFilters = step2Filters.jobFamilyIds?.length > 0 ||
                             step2Filters.areaIds?.length > 0 ||
                             step2Filters.userIds?.length > 0;
      
      const campaignHasFilters = campaignData.evaluateeFilters?.jobFamilyIds?.length > 0 ||
                                campaignData.evaluateeFilters?.areaIds?.length > 0 ||
                                campaignData.evaluateeFilters?.userIds?.length > 0;
      
      const syncedEvaluateeFilters = step2HasFilters ? step2Filters :
                                    (campaignHasFilters ? campaignData.evaluateeFilters : {
                                      jobFamilyIds: [],
                                      areaIds: [],
                                      userIds: []
                                    });
      
      // Construir objeto de datos sincronizado
      const syncedData = {
        ...campaignData,
        title: currentTitle,
        evaluateeFilters: syncedEvaluateeFilters,
        testAssignments: campaignData.testAssignments || {},
        config: {
          ...campaignData.config,
          requiredEvaluators: campaignData.config?.requiredEvaluators || {
            self: true,
            manager: true,
            peers: { min: 3, max: 5 },
            subordinates: { min: 0 },
            external: { min: 0 }
          },
          anonymityThresholds: campaignData.config?.anonymityThresholds || {
            peers: 3,
            subordinates: 3,
            external: 1
          }
        }
      };
      
      console.log('[CampaignWizard] Synced data before validation:', {
        title: syncedData.title,
        titleLength: syncedData.title?.length,
        evaluateeFilters: syncedData.evaluateeFilters,
        hasJobFamilies: syncedData.evaluateeFilters?.jobFamilyIds?.length > 0,
        hasAreas: syncedData.evaluateeFilters?.areaIds?.length > 0,
        hasUsers: syncedData.evaluateeFilters?.userIds?.length > 0,
        filteredUsersCount: filteredUsers.length,
        step2HasFilters,
        campaignHasFilters
      });
      
      // Validar antes de crear
      const validation = validateCampaign(syncedData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join('. ');
        console.error('[CampaignWizard] Validation failed:', validation.errors);
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      console.log('[CampaignWizard] Creating and activating campaign with data:', syncedData);
      
      const campaign = await campaignService.createCampaign(
        currentOrgId,
        syncedData,
        user.uid
      );
      
      console.log('[CampaignWizard] Campaign created, activating:', campaign.campaignId);
      
      const result = await campaignService.activateCampaign(
        currentOrgId,
        campaign.campaignId,
        user.uid
      );
      
      console.log('[CampaignWizard] Campaign activated successfully:', result.campaign.campaignId);
      
      if (onSuccess) {
        onSuccess(result.campaign);
      }
      
      onClose();
    } catch (err) {
      console.error('[CampaignWizard] Error creating and activating campaign:', err);
      console.error('[CampaignWizard] Error stack:', err.stack);
      // Extraer mensaje de error más descriptivo
      const errorMessage = err.message || 'Error al crear y activar la campaña';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Información General';
      case 2: return 'Selección de Evaluados';
      case 3: return 'Asignación de Tests';
      case 4: return 'Reglas de Evaluadores';
      case 5: return 'Revisión y Activación';
      default: return 'Paso';
    }
  };
  
  const getStepDescription = (step) => {
    switch (step) {
      case 1: return 'Define el título, descripción y fechas de la campaña';
      case 2: return 'Selecciona quiénes serán evaluados usando filtros';
      case 3: return 'Asigna tests a los evaluados (automático por Job Family)';
      case 4: return 'Configura las reglas de evaluadores y umbrales';
      case 5: return 'Revisa la configuración y activa la campaña';
      default: return '';
    }
  };
  
  if (!isOpen) {
    return null;
  }

  // Función para renderizar el paso actual de forma segura
  const renderCurrentStep = () => {
    try {
      switch (currentStep) {
        case 1:
          return (
            <CampaignInfoStep
              data={campaignData}
              onChange={handleStepDataChange}
            />
          );
        case 2:
          // SOLUCIÓN ALTERNATIVA: Usar React.lazy + Suspense para cargar el paso 2
          // Esto lo carga completamente fuera del ciclo de render del padre
          if (!currentOrgId) {
            return (
              <div className="wizard-alert wizard-alert-error">
                <span>Error: No se pudo cargar la información de la organización</span>
              </div>
            );
          }
          
          return (
            <Suspense fallback={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#64748B', marginTop: '16px' }}>Cargando selección de evaluados...</p>
              </div>
            }>
              <EvaluateeSelectionStepLazy
                filters={currentStep2Filters}
                onFilterChange={handleStep2FilterChange}
                jobFamilies={jobFamilies || []}
                areas={areas || []}
                users={users || []}
                filteredUsers={filteredUsers || []}
              />
            </Suspense>
          );
        case 3:
          return (
            <Suspense fallback={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#64748B', marginTop: '16px' }}>Cargando asignación de tests...</p>
              </div>
            }>
              <TestAssignmentStepLazy
                data={campaignData}
                filteredUsers={filteredUsers || []}
                jobFamilies={jobFamilies || []}
                availableTests={availableTests || []}
                onChange={handleStepDataChange}
              />
            </Suspense>
          );
        case 4:
          return (
            <Suspense fallback={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#64748B', marginTop: '16px' }}>Cargando reglas de evaluadores...</p>
              </div>
            }>
              <EvaluatorRulesStepLazy
                data={campaignData}
                onChange={handleStepDataChange}
              />
            </Suspense>
          );
        case 5:
          return (
            <Suspense fallback={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#64748B', marginTop: '16px' }}>Cargando revisión...</p>
              </div>
            }>
              <CampaignReviewStepLazy
                data={campaignData}
                filteredUsers={filteredUsers || []}
                jobFamilies={jobFamilies || []}
                areas={areas || []}
                availableTests={availableTests || []}
              />
            </Suspense>
          );
        default:
          return (
            <Alert type="error">
              <Alert.Description>Paso no válido: {currentStep}</Alert.Description>
            </Alert>
          );
      }
    } catch (err) {
      console.error('[CampaignWizard] Error rendering step:', err);
      console.error('[CampaignWizard] Error stack:', err.stack);
      return (
        <div className="wizard-alert wizard-alert-error">
          <span>
            Error al cargar el paso {currentStep}. Por favor, intenta nuevamente.
            <br />
            <small style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              {err.message || 'Error desconocido'}
            </small>
          </span>
        </div>
      );
    }
  };

  if (!isOpen) return null;
  
  const progressPercentage = (currentStep / 5) * 100;
  
  return (
    <div 
      className="wizard-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="wizard-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="wizard-header">
          <h2>Crear Campaña 360°</h2>
          <p className="description">
            {getStepTitle(currentStep)} - {getStepDescription(currentStep)}
          </p>
        </div>
        
        {/* Progress */}
        <div className="wizard-progress">
          <div className="wizard-progress-bar">
            <div 
              className="wizard-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="wizard-progress-info">
            <span>Paso {currentStep} de 5</span>
            <span>{Math.round(progressPercentage)}% completado</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="wizard-content">
          {/* Error */}
          {error && (
            <div className="wizard-alert wizard-alert-error">
              <span>{error}</span>
              <button 
                className="wizard-alert-close"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Loading */}
          {loading && (
            <div className="wizard-loading">
              <div className="wizard-spinner"></div>
              <span>Cargando datos...</span>
            </div>
          )}
          
          {/* Step Content */}
          {!loading && (
            <WizardErrorBoundary
              onReset={() => {
                setError(null);
                setCurrentStep(1);
              }}
            >
              <div>
                {renderCurrentStep()}
              </div>
            </WizardErrorBoundary>
          )}
        </div>
        
        {/* Footer */}
        {!loading && (
          <div className="wizard-footer">
            <div className="wizard-footer-left">
              {currentStep > 1 && (
                <button
                  className="wizard-btn wizard-btn-outline"
                  onClick={handlePrevious}
                >
                  ← Anterior
                </button>
              )}
            </div>
            
            <div className="wizard-footer-right">
              <button
                className="wizard-btn wizard-btn-outline"
                onClick={onClose}
              >
                Cancelar
              </button>
              
              {currentStep < 5 ? (
                <button
                  className="wizard-btn wizard-btn-primary"
                  onClick={handleNext}
                >
                  Siguiente →
                </button>
              ) : (
                <>
                  <button
                    className="wizard-btn wizard-btn-outline"
                    onClick={handleCreateCampaign}
                  >
                    Guardar Borrador
                  </button>
                  <button
                    className="wizard-btn wizard-btn-primary"
                    onClick={handleActivateCampaign}
                  >
                    ✓ Crear y Activar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignWizard;
