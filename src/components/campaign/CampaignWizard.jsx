/**
 * Wizard para creación de campañas 360° - SIMPLIFIED
 * 
 * Proceso de 3 pasos estratégicos:
 * 1. Estrategia: ¿Qué tipo de evaluación deseas crear?
 * 2. Identidad: Título, fechas y descripción
 * 3. Reglas de Conexión: Test y opciones → Generar Borrador
 * 
 * La audiencia (evaluatees) se agregará después en una pantalla dedicada
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import { getTestsForOrg } from '../../services/globalTestDefinitionService';
import { CAMPAIGN_TYPE, CAMPAIGN_STATUS } from '../../models/Campaign';

// Subcomponentes (3 pasos)
import WizardStepper from './WizardStepper';
import StrategySelectionStep from './StrategySelectionStep';
import CampaignInfoStep from './CampaignInfoStep';
import ConnectionRulesStep from './ConnectionRulesStep';

// Estilos
import './CampaignWizard.css';

const CampaignWizard = ({ isOpen, onClose, onSuccess }) => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado del wizard - EMPIEZA EN PASO 1 (de 3 pasos)
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos del wizard (3 pasos)
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
    // Paso 3: Reglas de Conexión
    selectedTestId: null,
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

  // Definición de pasos para el stepper (3 pasos)
  const stepDefinitions = [
    { title: 'Estrategia', subtitle: '¿Qué tipo de evaluación?' },
    { title: 'Identidad', subtitle: 'Información básica' },
    { title: 'Reglas', subtitle: 'Configuración final' }
  ];

  // Handlers de pasos (3 pasos)
  const handleStep1Change = useCallback((updates) => {
    // Paso 1: Estrategia
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
    // Paso 2: Identidad
    setCampaignData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const handleStep3Change = useCallback((updates) => {
    // Paso 3: Reglas de Conexión
    setCampaignData(prev => ({
      ...prev,
      selectedTestId: updates.selectedTestId,
      connectionRules: {
        ...prev.connectionRules,
        ...updates.connectionRules
      }
    }));
  }, []);

  // Navegación (3 pasos)
  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Generar borrador (último paso)
  const handleGenerateDraft = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar test seleccionado
      if (!campaignData.selectedTestId) {
        setError('Debes seleccionar un test');
        return;
      }

      // Crear campaña como borrador con evaluatees vacío
      const newCampaign = await campaignService.createCampaign(
        currentOrgId,
        {
          ...campaignData,
          evaluateeFilters: campaignData.evaluateeFilters || { jobFamilyIds: [], areaIds: [], userIds: [] },
          status: CAMPAIGN_STATUS.DRAFT
        },
        user.uid // userId como tercer parámetro
      );

      if (onSuccess) {
        onSuccess(newCampaign);
      }

      // Reset wizard
      resetWizard();

      // Cerrar modal
      onClose();

      // Redirigir a la página de detalle de campaña
      if (newCampaign.id) {
        navigate(`/gestion/campanas/${newCampaign.id}`);
      }
    } catch (err) {
      console.error('[CampaignWizard] Error creating campaign:', err);
      setError(err.message || 'Error al crear la campaña');
    } finally {
      setLoading(false);
    }
  }, [campaignData, currentOrgId, user, onSuccess, onClose, navigate]);

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
      selectedTestId: null,
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

  // Renderizar paso actual (3 pasos)
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
          <ConnectionRulesStep
            data={campaignData}
            availableTests={availableTests}
            onChange={handleStep3Change}
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

        {/* Modern Stepper (3 pasos) */}
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
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Anterior
          </button>

          {currentStep < 3 ? (
            <button
              className="btn-wizard btn-primary"
              onClick={handleNext}
            >
              Siguiente
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          ) : (
            <button
              className="btn-wizard btn-primary"
              onClick={handleGenerateDraft}
              disabled={loading || !campaignData.selectedTestId}
            >
              {loading ? (
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
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;
