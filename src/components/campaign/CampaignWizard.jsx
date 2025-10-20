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

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import jobFamilyService from '../../services/jobFamilyService';
import orgStructureService from '../../services/orgStructureService';
import { CAMPAIGN_TYPE, CAMPAIGN_STATUS } from '../../models/Campaign';
import { getCampaignTypeLabel } from '../../models/Campaign';

// Subcomponentes
import CampaignInfoStep from './CampaignInfoStep';
import EvaluateeSelectionStep from './EvaluateeSelectionStep';
import TestAssignmentStep from './TestAssignmentStep';
import EvaluatorRulesStep from './EvaluatorRulesStep';
import CampaignReviewStep from './CampaignReviewStep';

// UI Components
import { 
  Button, 
  Card, 
  Alert, 
  Spinner,
  Progress
} from '../ui';

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
  
  // Datos de referencia
  const [jobFamilies, setJobFamilies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Cargar datos de referencia
  useEffect(() => {
    if (isOpen && currentOrgId) {
      loadReferenceData();
    }
  }, [isOpen, currentOrgId]);
  
  // Actualizar usuarios filtrados cuando cambien los filtros
  useEffect(() => {
    if (currentOrgId) {
      updateFilteredUsers();
    }
  }, [campaignData.evaluateeFilters, users]);
  
  const loadReferenceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [jobFamiliesData, areasData, usersData] = await Promise.all([
        jobFamilyService.getOrgJobFamilies(currentOrgId),
        orgStructureService.getOrgAreas(currentOrgId),
        orgStructureService.getOrgUsers(currentOrgId)
      ]);
      
      setJobFamilies(jobFamiliesData);
      setAreas(areasData);
      setUsers(usersData);
      
      // Cargar tests disponibles (en implementación real, desde API)
      setAvailableTests([
        { id: 'test1', name: 'Liderazgo Ejecutivo v3', version: '3.0' },
        { id: 'test2', name: 'Competencias Gerenciales v2', version: '2.0' },
        { id: 'test3', name: 'Habilidades de Comunicación v1', version: '1.0' },
        { id: 'test4', name: 'Gestión de Equipos v2', version: '2.0' }
      ]);
      
      console.log('[CampaignWizard] Reference data loaded:', {
        jobFamilies: jobFamiliesData.length,
        areas: areasData.length,
        users: usersData.length
      });
    } catch (err) {
      console.error('[CampaignWizard] Error loading reference data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const updateFilteredUsers = async () => {
    try {
      const filtered = await campaignService.getUsersByFilters(currentOrgId, campaignData.evaluateeFilters);
      setFilteredUsers(filtered);
    } catch (err) {
      console.error('[CampaignWizard] Error filtering users:', err);
    }
  };
  
  const handleStepDataChange = (stepData) => {
    setCampaignData(prev => ({
      ...prev,
      ...stepData
    }));
  };
  
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const campaign = await campaignService.createCampaign(
        currentOrgId,
        campaignData,
        user.uid
      );
      
      console.log('[CampaignWizard] Campaign created:', campaign.campaignId);
      
      if (onSuccess) {
        onSuccess(campaign);
      }
      
      onClose();
    } catch (err) {
      console.error('[CampaignWizard] Error creating campaign:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleActivateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Crear campaña primero
      const campaign = await campaignService.createCampaign(
        currentOrgId,
        campaignData,
        user.uid
      );
      
      // Activar campaña
      const result = await campaignService.activateCampaign(
        currentOrgId,
        campaign.campaignId,
        user.uid
      );
      
      console.log('[CampaignWizard] Campaign created and activated:', campaign.campaignId);
      
      if (onSuccess) {
        onSuccess(result.campaign);
      }
      
      onClose();
    } catch (err) {
      console.error('[CampaignWizard] Error creating and activating campaign:', err);
      setError(err.message);
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Crear Campaña 360°
            </h2>
            <p className="text-gray-600">
              {getStepTitle(currentStep)} - {getStepDescription(currentStep)}
            </p>
          </div>
          
          {/* Progress */}
          <div className="mb-6">
            <Progress 
              value={(currentStep / 5) * 100} 
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Paso {currentStep} de 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% completado</span>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <Alert type="error" className="mb-6">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
          
          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
              <span className="ml-2">Procesando...</span>
            </div>
          )}
          
          {/* Step Content */}
          {!loading && (
            <div className="mb-6">
              {currentStep === 1 && (
                <CampaignInfoStep
                  data={campaignData}
                  onChange={handleStepDataChange}
                />
              )}
              
              {currentStep === 2 && (
                <EvaluateeSelectionStep
                  data={campaignData}
                  jobFamilies={jobFamilies}
                  areas={areas}
                  users={users}
                  filteredUsers={filteredUsers}
                  onChange={handleStepDataChange}
                />
              )}
              
              {currentStep === 3 && (
                <TestAssignmentStep
                  data={campaignData}
                  filteredUsers={filteredUsers}
                  jobFamilies={jobFamilies}
                  availableTests={availableTests}
                  onChange={handleStepDataChange}
                />
              )}
              
              {currentStep === 4 && (
                <EvaluatorRulesStep
                  data={campaignData}
                  onChange={handleStepDataChange}
                />
              )}
              
              {currentStep === 5 && (
                <CampaignReviewStep
                  data={campaignData}
                  filteredUsers={filteredUsers}
                  jobFamilies={jobFamilies}
                  areas={areas}
                  availableTests={availableTests}
                />
              )}
            </div>
          )}
          
          {/* Navigation */}
          {!loading && (
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    Anterior
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                
                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCreateCampaign}
                    >
                      Guardar Borrador
                    </Button>
                    <Button
                      onClick={handleActivateCampaign}
                    >
                      Crear y Activar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;
