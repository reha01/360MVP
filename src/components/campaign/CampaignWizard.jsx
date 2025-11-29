/**
 * Wizard para creación de campañas 360°
 * 
 * Proceso de 4 pasos:
 * 1. Estrategia: ¿Qué tipo de evaluación deseas crear?
 * 2. Identidad: Título, fechas y descripción
 * 3. Audiencia: Selección de evaluados (NUEVO)
 * 4. Reglas de Conexión: Test y opciones → Generar Borrador
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import { getTestsForOrg } from '../../services/globalTestDefinitionService';
import { CAMPAIGN_TYPE, CAMPAIGN_STATUS } from '../../models/Campaign';

// Subcomponentes (4 pasos)
import WizardStepper from './WizardStepper';
import StrategySelectionStep from './StrategySelectionStep';
import CampaignInfoStep from './CampaignInfoStep';
import EvaluateeSelectionStep from './EvaluateeSelectionStep'; // NUEVO
import ConnectionRulesStep from './ConnectionRulesStep';

// Estilos
import './CampaignWizard.css';

const CampaignWizard = ({ isOpen, onClose, onSuccess }) => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado del wizard - EMPIEZA EN PASO 1 (de 4 pasos)
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos del wizard
  const [campaignData, setCampaignData] = useState({
    // Paso 1: Estrategia
    selectedStrategy: null,
    evaluatorRules: {
      self: false,
      manager: false,
      peers: false,
      subordinates: false,
      external: false
    },
    // Paso 2: Identidad
    title: '',
    description: '',
    type: CAMPAIGN_TYPE.CUSTOM,
    config: {
      startDate: null,
      endDate: null,
      timezone: 'UTC',
      reminderSchedule: [3, 7, 14]
    },
    // Paso 3: Audiencia (NUEVO)
    selectedUsers: [], // Array de usuarios seleccionados
    audienceFilters: { // Filtros aplicados
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    },
    // Paso 4: Reglas de Conexión
    selectedTestId: null,
    testConfiguration: { // NUEVA ESTRUCTURA
      mode: 'unified', // 'unified' | 'segmented'
      defaultTestId: null,
      assignments: {} // { jobFamilyId: testId }
    },
    connectionRules: {
      allowMultipleManagers: false,
      restrictPeersToArea: true
    }
  });

  // Datos de referencia
  const [availableTests, setAvailableTests] = useState([]);

  // Cargar tests disponibles
  useEffect(() => {
    if (!currentOrgId || !isOpen) return;

    const loadTests = async () => {
      try {
        const testsData = await getTestsForOrg(currentOrgId).catch(() => []);
        setAvailableTests(testsData || []);
      } catch (err) {
        console.error('[CampaignWizard] Error loading tests:', err);
      }
    };

    loadTests();
  }, [currentOrgId, isOpen]);

  // Definición de pasos para el stepper (4 pasos)
  const stepDefinitions = [
    { title: 'Estrategia', subtitle: '¿Qué tipo de evaluación?' },
    { title: 'Identidad', subtitle: 'Información básica' },
    { title: 'Audiencia', subtitle: 'Selección de evaluados' }, // NUEVO
    { title: 'Reglas', subtitle: 'Configuración final' }
  ];

  // Handlers de pasos
  const handleStep1Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      selectedStrategy: updates.selectedStrategy,
      evaluatorRules: {
        ...prev.evaluatorRules,
        ...updates.evaluatorRules
      }
    }));
  }, []);

  const handleStep2Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      title: updates.title,
      description: updates.description,
      config: {
        ...prev.config,
        ...updates.config
      }
    }));
  }, []);

  // Handler Paso 3: Audiencia
  const handleStep3Change = useCallback((updates) => {
    // EvaluateeSelectionStep devuelve { filters, selectedUsers }
    // OJO: Depende de cómo esté implementado EvaluateeSelectionStep.
    // Asumimos que devuelve un objeto con lo que cambió.

    // Si EvaluateeSelectionStep usa onFilterChange, devuelve filters.
    // Si usa onSelectionChange, devuelve selectedUsers.
    // Adaptaremos según lo que vimos en el archivo.

    // En EvaluateeSelectionStep.jsx vimos:
    // onFilterChange(newFilters)
    // Pero no vimos un prop explícito para devolver selectedUsers al padre en tiempo real,
    // salvo que handleApplySelection lo haga.
    // Vamos a asumir que necesitamos pasarle un handler que capture ambos.

    setCampaignData(prev => ({
      ...prev,
      // Si updates tiene filters
      audienceFilters: updates.filters || prev.audienceFilters,
      // Si updates tiene selectedUsers (necesitaremos asegurar esto)
      selectedUsers: updates.selectedUsers || prev.selectedUsers
    }));
  }, []);

  // Wrapper para EvaluateeSelectionStep para adaptar sus eventos
  const handleAudienceFilterChange = (newFilters) => {
    setCampaignData(prev => ({
      ...prev,
      audienceFilters: newFilters
    }));
  };

  // Handler Paso 4: Reglas
  const handleStep4Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      selectedTestId: updates.selectedTestId,
      testConfiguration: updates.testConfiguration || prev.testConfiguration, // NUEVO
      connectionRules: {
        ...prev.connectionRules,
        ...updates.connectionRules
      }
    }));
  }, []);

  // Navegación
  const handleNext = () => {
    if (currentStep < stepDefinitions.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Creating campaign:', campaignData);

      // Preparar payload
      // Calculate potential evaluations based on selected users' relationships
      const selectedUsers = campaignData.selectedUsers || [];

      console.log('[CampaignWizard] Selected Users for Stats:', selectedUsers);

      const potentialPeers = selectedUsers.reduce((acc, user) => acc + (user.peersCount || 0), 0);
      const potentialSubordinates = selectedUsers.reduce((acc, user) => acc + (user.dependentsCount || 0), 0);
      const potentialManagers = selectedUsers.reduce((acc, user) => acc + (user.superiorsCount || 0), 0);

      console.log('[CampaignWizard] Calculated Potentials:', {
        potentialPeers,
        potentialSubordinates,
        potentialManagers
      });

      const initialStats = {
        totalEvaluatees: selectedUsers.length,
        totalInvitations: 0,
        completionRate: 0,
        selfCompleted: 0,
        selfTotal: campaignData.evaluatorRules?.self ? selectedUsers.length : 0,
        peersCompleted: 0,
        peersTotal: campaignData.evaluatorRules?.peers ? potentialPeers : 0,
        subordinatesCompleted: 0,
        subordinatesTotal: campaignData.evaluatorRules?.subordinates ? potentialSubordinates : 0,
        managerCompleted: 0,
        managerTotal: campaignData.evaluatorRules?.manager ? potentialManagers : 0
      };

      const payload = {
        ...campaignData,
        status: CAMPAIGN_STATUS.DRAFT,
        stats: initialStats,
        // Asegurar que evaluateeFilters tenga la estructura correcta
        evaluateeFilters: campaignData.audienceFilters
      };

      const newCampaign = await campaignService.createCampaign(
        currentOrgId,
        payload,
        user.uid
      );

      if (onSuccess) {
        onSuccess(newCampaign);
      }

      resetWizard();
      onClose();

      if (newCampaign.id) {
        navigate(`/gestion/campanas/${newCampaign.id}`);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Error al crear la campaña');
    } finally {
      setLoading(false);
    }
  };
};

// Reset wizard
const resetWizard = useCallback(() => {
  setCurrentStep(1);
  setError(null);
  setCampaignData({
    selectedStrategy: null,
    evaluatorRules: {
      self: false,
      manager: false,
      peers: false,
      subordinates: false,
      external: false
    },
    title: '',
    description: '',
    type: CAMPAIGN_TYPE.CUSTOM,
    config: {
      startDate: null,
      endDate: null,
      timezone: 'UTC',
      reminderSchedule: [3, 7, 14]
    },
    selectedUsers: [],
    audienceFilters: {
      jobFamilyIds: [],
      areaIds: [],
      userIds: []
    },
    selectedTestId: null,
    testConfiguration: {
      mode: 'unified',
      defaultTestId: null,
      assignments: {}
    },
    connectionRules: {
      allowMultipleManagers: false,
      restrictPeersToArea: true
    }
  });
}, []);

// Reset al cerrar
useEffect(() => {
  if (!isOpen) {
    resetWizard();
  }
}, [isOpen, resetWizard]);

// Renderizar paso actual
const renderStep = () => {
  switch (currentStep) {
    case 1:
      return (
        <StrategySelectionStep
          selectedStrategy={campaignData.selectedStrategy}
          onChange={handleStep1Change}
        />
      );
    case 2:
      return (
        <CampaignInfoStep
          data={campaignData}
          onChange={handleStep2Change}
        />
      );
    case 3:
      return (
        <EvaluateeSelectionStep
          filters={campaignData.audienceFilters}
          // Importante: EvaluateeSelectionStep debe soportar onFilterChange
          // y idealmente devolver los usuarios seleccionados.
          // Si no devuelve usuarios, ConnectionRulesStep tendrá que calcularlos o 
          // EvaluateeSelectionStep necesita un prop para notificar selección.
          onFilterChange={handleAudienceFilterChange}
          // Pasamos un prop extra por si el componente lo soporta o lo agregamos después
          onSelectionChange={(users) => setCampaignData(prev => ({ ...prev, selectedUsers: users }))}
        />
      );
    case 4:
      return (
        <ConnectionRulesStep
          data={campaignData}
          selectedUsers={campaignData.selectedUsers} // PASAMOS LA AUDIENCIA
          availableTests={availableTests}
          onChange={handleStep4Change}
        />
      );
    default:
      return null;
  }
};

if (!isOpen) return null;

return (
  <div className="campaign-wizard-overlay" onClick={(e) => {
    if (e.target.classList.contains('campaign-wizard-overlay')) {
      onClose();
    }
  }}>
    <div className="campaign-wizard-modal modern">
      {/* Header */}
      <div className="campaign-wizard-header modern">
        <h2>Crear Nueva Campaña de Evaluación</h2>
        <button className="campaign-wizard-close" onClick={onClose}>×</button>
      </div>

      {/* Modern Stepper */}
      <WizardStepper currentStep={currentStep} steps={stepDefinitions} />

      {/* Error Display */}
      {error && (
        <div className="alert alert-error modern">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Step Content */}
      <div className="campaign-wizard-content modern">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="campaign-wizard-footer modern">
        <button
          className="btn-wizard btn-secondary"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Anterior
        </button>

        <button
          className="btn-wizard btn-primary"
          onClick={handleNext}
          disabled={loading}
        >
          {currentStep === stepDefinitions.length ? (
            loading ? (
              <>
                <span className="spinner"></span>
                Generando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                Crear Borrador
              </>
            )
          ) : (
            <>
              Siguiente
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
};

export default CampaignWizard;
