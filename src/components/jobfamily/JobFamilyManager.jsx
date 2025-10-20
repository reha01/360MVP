/**
 * Componente principal para gestión de Job Families
 * 
 * Permite CRUD de familias de puestos, mapeo de tests,
 * y configuración de evaluadores
 */

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import jobFamilyService from '../../services/jobFamilyService';
import { JOB_LEVELS } from '../../models/JobFamily';
import { getJobLevelLabel, getJobLevelColor } from '../../models/JobFamily';

// Subcomponentes
import JobFamilyForm from './JobFamilyForm';
import JobFamilyCard from './JobFamilyCard';
import TestMappingDialog from './TestMappingDialog';
import UserAssignmentDialog from './UserAssignmentDialog';

// UI Components
import { 
  Button, 
  Card, 
  Tabs, 
  Alert, 
  Spinner,
  Modal,
  Badge,
  Input
} from '../ui';

const JobFamilyManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobFamilies, setJobFamilies] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('families');
  const [showJobFamilyForm, setShowJobFamilyForm] = useState(false);
  const [showTestMapping, setShowTestMapping] = useState(false);
  const [showUserAssignment, setShowUserAssignment] = useState(false);
  const [editingJobFamily, setEditingJobFamily] = useState(null);
  const [selectedJobFamily, setSelectedJobFamily] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [jobFamiliesData, usersData, statsData] = await Promise.all([
        jobFamilyService.getOrgJobFamilies(currentOrgId),
        jobFamilyService.getOrgUsers(currentOrgId),
        jobFamilyService.getJobFamilyStats(currentOrgId)
      ]);
      
      setJobFamilies(jobFamiliesData);
      setUsers(usersData);
      setStats(statsData);
      
      console.log('[JobFamilyManager] Data loaded:', {
        jobFamilies: jobFamiliesData.length,
        users: usersData.length
      });
    } catch (err) {
      console.error('[JobFamilyManager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleCreateJobFamily = async (jobFamilyData) => {
    try {
      await jobFamilyService.createJobFamily(currentOrgId, jobFamilyData, user.uid);
      await loadData();
      setShowJobFamilyForm(false);
      setEditingJobFamily(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateJobFamily = async (familyId, updates) => {
    try {
      await jobFamilyService.updateJobFamily(currentOrgId, familyId, updates, user.uid);
      await loadData();
      setShowJobFamilyForm(false);
      setEditingJobFamily(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteJobFamily = async (familyId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta Job Family?')) {
      return;
    }
    
    try {
      await jobFamilyService.deleteJobFamily(currentOrgId, familyId, user.uid);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleEditJobFamily = (jobFamily) => {
    setEditingJobFamily(jobFamily);
    setShowJobFamilyForm(true);
  };
  
  const handleManageTests = (jobFamily) => {
    setSelectedJobFamily(jobFamily);
    setShowTestMapping(true);
  };
  
  const handleManageUsers = (jobFamily) => {
    setSelectedJobFamily(jobFamily);
    setShowUserAssignment(true);
  };
  
  // Filtrar Job Families por búsqueda
  const filteredJobFamilies = jobFamilies.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agrupar por nivel
  const jobFamiliesByLevel = Object.values(JOB_LEVELS).reduce((acc, level) => {
    acc[level] = filteredJobFamilies.filter(family => family.level === level);
    return acc;
  }, {});
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando Job Families...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert type="error" className="mb-4">
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Cerrar
        </Button>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Job Families
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona familias de puestos y su mapeo con tests de evaluación
          </p>
        </div>
        
        <Button
          onClick={() => {
            setEditingJobFamily(null);
            setShowJobFamilyForm(true);
          }}
        >
          Nueva Job Family
        </Button>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {stats.totalJobFamilies}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Job Families</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.totalJobFamilies} activas
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {stats.totalUsers}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Usuarios</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.totalUsers} asignados
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {stats.byTestMapping.withRecommended}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Con Tests</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.byTestMapping.withRecommended} configuradas
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">
                      {Object.values(stats.byLevel).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Niveles</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Object.keys(stats.byLevel).filter(level => stats.byLevel[level] > 0).length} utilizados
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar Job Families..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="families">Por Nivel</Tabs.Trigger>
          <Tabs.Trigger value="all">Todas</Tabs.Trigger>
          <Tabs.Trigger value="stats">Estadísticas</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="families" className="mt-4">
          <div className="space-y-6">
            {Object.entries(jobFamiliesByLevel).map(([level, families]) => (
              families.length > 0 && (
                <div key={level}>
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getJobLevelLabel(level)}
                    </h3>
                    <Badge className={`ml-2 ${getJobLevelColor(level)}`}>
                      {families.length} familias
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {families.map(family => (
                      <JobFamilyCard
                        key={family.id}
                        jobFamily={family}
                        onEdit={handleEditJobFamily}
                        onDelete={handleDeleteJobFamily}
                        onManageTests={handleManageTests}
                        onManageUsers={handleManageUsers}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobFamilies.map(family => (
              <JobFamilyCard
                key={family.id}
                jobFamily={family}
                onEdit={handleEditJobFamily}
                onDelete={handleDeleteJobFamily}
                onManageTests={handleManageTests}
                onManageUsers={handleManageUsers}
              />
            ))}
          </div>
          
          {filteredJobFamilies.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay Job Families
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera familia de puestos
                </p>
                <Button
                  onClick={() => {
                    setEditingJobFamily(null);
                    setShowJobFamilyForm(true);
                  }}
                >
                  Crear Job Family
                </Button>
              </div>
            </Card>
          )}
        </Tabs.Content>
        
        <Tabs.Content value="stats" className="mt-4">
          {stats && (
            <div className="space-y-6">
              {/* Estadísticas por nivel */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribución por Nivel
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.byLevel).map(([level, count]) => (
                      <div key={level} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600">{getJobLevelLabel(level)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              
              {/* Estadísticas de mapeo de tests */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Configuración de Tests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.byTestMapping.withRecommended}
                      </div>
                      <div className="text-sm text-gray-600">Con Tests Recomendados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.byTestMapping.withAllowed}
                      </div>
                      <div className="text-sm text-gray-600">Con Tests Permitidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.byTestMapping.withExcluded}
                      </div>
                      <div className="text-sm text-gray-600">Con Tests Excluidos</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Tabs.Content>
      </Tabs>
      
      {/* Modals */}
      {showJobFamilyForm && (
        <Modal
          isOpen={showJobFamilyForm}
          onClose={() => {
            setShowJobFamilyForm(false);
            setEditingJobFamily(null);
          }}
          title={editingJobFamily ? 'Editar Job Family' : 'Nueva Job Family'}
        >
          <JobFamilyForm
            jobFamily={editingJobFamily}
            onSubmit={editingJobFamily ? 
              (updates) => handleUpdateJobFamily(editingJobFamily.id, updates) :
              handleCreateJobFamily
            }
            onCancel={() => {
              setShowJobFamilyForm(false);
              setEditingJobFamily(null);
            }}
          />
        </Modal>
      )}
      
      {showTestMapping && selectedJobFamily && (
        <TestMappingDialog
          isOpen={showTestMapping}
          onClose={() => {
            setShowTestMapping(false);
            setSelectedJobFamily(null);
          }}
          jobFamily={selectedJobFamily}
          onUpdate={loadData}
        />
      )}
      
      {showUserAssignment && selectedJobFamily && (
        <UserAssignmentDialog
          isOpen={showUserAssignment}
          onClose={() => {
            setShowUserAssignment(false);
            setSelectedJobFamily(null);
          }}
          jobFamily={selectedJobFamily}
          users={users}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default JobFamilyManager;
