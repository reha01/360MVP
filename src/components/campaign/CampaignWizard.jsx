/**
 * Wizard para creación de campañas 360° - CLEAN SLATE
 * 
 * Proceso de 6 pasos (SIN SEMÁFORO):
 * 1. Información general + fechas
 * 2. Selección de evaluados (filtros)
 * 3. Asignación de tests (auto por Job Family)
 * 4. Reglas de evaluadores (global)
 * 5. Personalización individual
 * 6. Revisión + activación
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import jobFamilyService from '../../services/jobFamilyService';
import orgStructureService from '../../services/orgStructureService';
import { getTestsForOrg } from '../../services/globalTestDefinitionService';
import { CAMPAIGN_TYPE, CAMPAIGN_STATUS, validateCampaign } from '../../models/Campaign';

// Subcomponentes
import CampaignInfoStep from './CampaignInfoStep';
import EvaluateeSelectionStep from './EvaluateeSelectionStep';
import TestAssignmentStep from './TestAssignmentStep';
import EvaluatorRulesStep from './EvaluatorRulesStep';
import IndividualCustomizationStep from './IndividualCustomizationStep';
import CampaignReviewStep from './CampaignReviewStep';

// Estilos
import './CampaignWizard.css';

const CampaignWizard = ({ isOpen, onClose, onSuccess }) => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado del wizard - EMPIEZA EN PASO 1
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
  
  // Datos de referencia
  const [jobFamilies, setJobFamilies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Cargar datos de referencia
  useEffect(() => {
    if (!currentOrgId || !isOpen) return;
    
    const loadData = async () => {
      try {
        const [jobFamiliesData, areasData, usersData, testsData] = await Promise.all([
          jobFamilyService.getOrgJobFamilies(currentOrgId).catch(() => []),
          orgStructureService.getOrgAreas(currentOrgId).catch(() => []),
          orgStructureService.getOrgUsers(currentOrgId).catch(() => []),
          getTestsForOrg(currentOrgId).catch(() => [])
        ]);
        
        setJobFamilies(jobFamiliesData || []);
        setAreas(areasData || []);
        setUsers(usersData || []);
        setAvailableTests(testsData || []);
      } catch (err) {
        console.error('[CampaignWizard] Error loading data:', err);
      }
    };
    
    loadData();
  }, [currentOrgId, isOpen]);
  
  // Calcular usuarios filtrados
  useEffect(() => {
    if (!users.length) {
      setFilteredUsers([]);
      return;
    }
    
    const filters = campaignData.evaluateeFilters;
    let filtered = [...users];
    
    // Filtrar por Job Family
    if (filters.jobFamilyIds && filters.jobFamilyIds.length > 0) {
      filtered = filtered.filter(user => 
        user.jobFamilyIds && 
        user.jobFamilyIds.some(id => filters.jobFamilyIds.includes(id))
      );
    }
    
    // Filtrar por Área
    if (filters.areaIds && filters.areaIds.length > 0) {
      filtered = filtered.filter(user => 
        (user.areaId && filters.areaIds.includes(user.areaId)) ||
        (user.departmentId && filters.areaIds.includes(user.departmentId))
      );
    }
    
    // Filtrar por IDs específicos
    if (filters.userIds && filters.userIds.length > 0) {
      filtered = filtered.filter(user => filters.userIds.includes(user.id));
    }
    
    setFilteredUsers(filtered);
  }, [users, campaignData.evaluateeFilters]);
  
  // Handlers de pasos
  const handleStep1Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  const handleStep2Change = useCallback((filters) => {
    setCampaignData(prev => ({
      ...prev,
      evaluateeFilters: {
        ...prev.evaluateeFilters,
        ...filters
      }
    }));
  }, []);
  
  const handleStep3Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  const handleStep4Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...updates.config
      }
    }));
  }, []);
  
  const handleStep5Change = useCallback((updates) => {
    setCampaignData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  // Navegación
  const handleNext = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);
  
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // Crear campaña
  const handleCreate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar datos
      const validation = validateCampaign(campaignData);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      // Crear campaña
      const newCampaign = await campaignService.createCampaign(currentOrgId, {
        ...campaignData,
        status: CAMPAIGN_STATUS.DRAFT,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess(newCampaign);
      }
      
      // Reset y cerrar
      setCurrentStep(1);
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
      
      onClose();
    } catch (err) {
      console.error('[CampaignWizard] Error creating campaign:', err);
      setError(err.message || 'Error al crear la campaña');
    } finally {
      setLoading(false);
    }
  }, [campaignData, currentOrgId, user, onSuccess, onClose]);
  
  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setError(null);
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
  }, [isOpen]);
  
  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignInfoStep
            data={campaignData}
            onChange={handleStep1Change}
          />
        );
      case 2:
        return (
          <EvaluateeSelectionStep
            filters={campaignData.evaluateeFilters}
            onFilterChange={handleStep2Change}
            jobFamilies={jobFamilies}
            areas={areas}
            users={users}
            filteredUsers={filteredUsers}
          />
        );
      case 3:
        return (
          <TestAssignmentStep
            data={campaignData}
            filteredUsers={filteredUsers}
            jobFamilies={jobFamilies}
            availableTests={availableTests}
            onChange={handleStep3Change}
          />
        );
      case 4:
        return (
          <EvaluatorRulesStep
            data={campaignData}
            onChange={handleStep4Change}
          />
        );
      case 5:
        return (
          <IndividualCustomizationStep
            data={campaignData}
            filteredUsers={filteredUsers}
            availableTests={availableTests}
            onChange={handleStep5Change}
          />
        );
      case 6:
        return (
          <CampaignReviewStep
            data={campaignData}
            filteredUsers={filteredUsers}
            jobFamilies={jobFamilies}
            areas={areas}
            availableTests={availableTests}
          />
        );
      default:
        return null;
    }
  };
  
  // Títulos de pasos
  const getStepTitle = (step) => {
    const titles = {
      1: 'Información General',
      2: 'Selección de Evaluados',
      3: 'Asignación de Tests',
      4: 'Reglas de Evaluadores',
      5: 'Personalización Individual',
      6: 'Revisión y Activación'
    };
    return titles[step] || '';
  };
  
  if (!isOpen) return null;
  
  const progressPercentage = (currentStep / 6) * 100;
  
  return (
    <div className="campaign-wizard-overlay" onClick={(e) => {
      if (e.target.classList.contains('campaign-wizard-overlay')) {
        onClose();
      }
    }}>
      <div className="campaign-wizard-modal">
        {/* Header */}
        <div className="campaign-wizard-header">
          <h2>Crear Nueva Campaña</h2>
          <button className="campaign-wizard-close" onClick={onClose}>×</button>
        </div>
        
        {/* Progress Bar */}
        <div className="campaign-wizard-progress">
          <div 
            className="campaign-wizard-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Step Indicator */}
        <div className="campaign-wizard-step-indicator">
          <span>Paso {currentStep} de 6: {getStepTitle(currentStep)}</span>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="alert alert-error" style={{ margin: '16px' }}>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {/* Step Content */}
        <div className="campaign-wizard-content">
          {renderStep()}
        </div>
        
        {/* Footer */}
        <div className="campaign-wizard-footer">
          <button
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            ← Anterior
          </button>
          
          <div className="campaign-wizard-steps">
            {[1, 2, 3, 4, 5, 6].map(step => (
              <div
                key={step}
                className={`campaign-wizard-step-dot ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step)}
              />
            ))}
          </div>
          
          {currentStep < 6 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Campaña'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;

