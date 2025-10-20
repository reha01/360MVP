/**
 * Componente principal para gestión de Estructura Organizacional
 * 
 * Permite CRUD de áreas/departamentos, asignación de managers,
 * y visualización de jerarquía organizacional
 */

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import orgStructureService from '../../services/orgStructureService';
import { ORG_LEVELS, MANAGER_TYPES } from '../../models/OrgStructure';
import { ORG_STRUCTURE_MESSAGES } from '../../constants/messages';

// Subcomponentes
import AreaForm from './AreaForm';
import AreaTree from './AreaTree';
import UserStructureForm from './UserStructureForm';
import CSVImportDialog from './CSVImportDialog';
import StructureValidation from './StructureValidation';

// UI Components
import { 
  Button, 
  Card, 
  Tabs, 
  Alert, 
  Spinner,
  Modal,
  Badge
} from '../ui';

const OrgStructureManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [orgTree, setOrgTree] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('structure');
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadOrgData();
    }
  }, [currentOrgId]);
  
  const loadOrgData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [areasData, usersData, treeData] = await Promise.all([
        orgStructureService.getOrgAreas(currentOrgId),
        orgStructureService.getOrgUsers(currentOrgId),
        orgStructureService.getOrgTree(currentOrgId)
      ]);
      
      setAreas(areasData);
      setUsers(usersData);
      setOrgTree(treeData);
      
      console.log('[OrgStructureManager] Data loaded:', {
        areas: areasData.length,
        users: usersData.length
      });
    } catch (err) {
      console.error('[OrgStructureManager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleCreateArea = async (areaData) => {
    try {
      await orgStructureService.createArea(currentOrgId, areaData, user.uid);
      await loadOrgData();
      setShowAreaForm(false);
      setEditingArea(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateArea = async (areaId, updates) => {
    try {
      await orgStructureService.updateArea(currentOrgId, areaId, updates, user.uid);
      await loadOrgData();
      setShowAreaForm(false);
      setEditingArea(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteArea = async (areaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta área?')) {
      return;
    }
    
    try {
      await orgStructureService.deleteArea(currentOrgId, areaId, user.uid);
      await loadOrgData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateUser = async (userId, updates) => {
    try {
      await orgStructureService.updateUserStructure(currentOrgId, userId, updates, user.uid);
      await loadOrgData();
      setShowUserForm(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleCSVImport = async (csvData) => {
    try {
      const results = await orgStructureService.importStructureFromCSV(
        currentOrgId, 
        csvData, 
        user.uid
      );
      
      if (results.errors.length > 0) {
        setError(`Import completed with ${results.errors.length} errors. Check validation.`);
      } else {
        await loadOrgData();
        setShowCSVImport(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleEditArea = (area) => {
    setEditingArea(area);
    setShowAreaForm(true);
  };
  
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando estructura organizacional...</span>
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
            Estructura Organizacional
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona áreas, departamentos y relaciones jerárquicas
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCSVImport(true)}
          >
            Importar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowValidation(true)}
          >
            Validar Estructura
          </Button>
          <Button
            onClick={() => {
              setEditingArea(null);
              setShowAreaForm(true);
            }}
          >
            Nueva Área
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {areas.length}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Áreas/Deptos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {areas.length} activas
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
                    {users.length}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Usuarios</p>
                <p className="text-lg font-semibold text-gray-900">
                  {users.length} activos
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
                    {orgTree?.rootAreas?.length || 0}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Niveles</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orgTree?.rootAreas?.length || 0} raíces
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="structure">Estructura</Tabs.Trigger>
          <Tabs.Trigger value="users">Usuarios</Tabs.Trigger>
          <Tabs.Trigger value="hierarchy">Jerarquía</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="structure" className="mt-4">
          <AreaTree
            areas={areas}
            users={users}
            onEditArea={handleEditArea}
            onDeleteArea={handleDeleteArea}
            onEditUser={handleEditUser}
          />
        </Tabs.Content>
        
        <Tabs.Content value="users" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Usuarios por Área</h3>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                  setShowUserForm(true);
                }}
              >
                Asignar Usuario
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map(area => (
                <Card key={area.id}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{area.name}</h4>
                      <Badge variant="secondary">
                        {area.memberCount} usuarios
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                    
                    <div className="space-y-1">
                      {users
                        .filter(user => user.areaId === area.id || user.departmentId === area.id)
                        .slice(0, 3)
                        .map(user => (
                          <div key={user.id} className="flex items-center text-sm">
                            <span className="text-gray-900">{user.displayName}</span>
                            <span className="text-gray-500 ml-2">({user.jobTitle})</span>
                          </div>
                        ))}
                      
                      {users.filter(user => 
                        user.areaId === area.id || user.departmentId === area.id
                      ).length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{users.filter(user => 
                            user.areaId === area.id || user.departmentId === area.id
                          ).length - 3} más...
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="hierarchy" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Jerarquía Organizacional</h3>
            {orgTree && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(orgTree, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs>
      
      {/* Modals */}
      {showAreaForm && (
        <Modal
          isOpen={showAreaForm}
          onClose={() => {
            setShowAreaForm(false);
            setEditingArea(null);
          }}
          title={editingArea ? 'Editar Área' : 'Nueva Área'}
        >
          <AreaForm
            area={editingArea}
            areas={areas}
            onSubmit={editingArea ? 
              (updates) => handleUpdateArea(editingArea.id, updates) :
              handleCreateArea
            }
            onCancel={() => {
              setShowAreaForm(false);
              setEditingArea(null);
            }}
          />
        </Modal>
      )}
      
      {showUserForm && (
        <Modal
          isOpen={showUserForm}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          title={editingUser ? 'Editar Usuario' : 'Asignar Usuario'}
        >
          <UserStructureForm
            user={editingUser}
            areas={areas}
            users={users}
            onSubmit={editingUser ? 
              (updates) => handleUpdateUser(editingUser.id, updates) :
              handleUpdateUser
            }
            onCancel={() => {
              setShowUserForm(false);
              setEditingUser(null);
            }}
          />
        </Modal>
      )}
      
      {showCSVImport && (
        <CSVImportDialog
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          onImport={handleCSVImport}
        />
      )}
      
      {showValidation && (
        <StructureValidation
          isOpen={showValidation}
          onClose={() => setShowValidation(false)}
          orgId={currentOrgId}
        />
      )}
    </div>
  );
};

export default OrgStructureManager;
