/**
 * Componente principal unificado para gestión de Organización
 * 
 * Combina Estructura Organizacional y Job Families en una sola página
 * con navegación por pestañas para mejor UX
 */

import React, { useState, useEffect } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import orgStructureService from '../../services/orgStructureService';
import jobFamilyService from '../../services/jobFamilyService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { ORG_LEVELS } from '../../models/OrgStructure';
import { Pencil, Trash2 } from 'lucide-react';

// Helper para obtener label del nivel
const getLevelLabel = (level) => {
  switch(level) {
    case ORG_LEVELS.ORGANIZATION: return 'Organización';
    case ORG_LEVELS.AREA: return 'Área';
    case ORG_LEVELS.DEPARTMENT: return 'Departamento';
    default: return 'Área';
  }
};
import { JOB_LEVELS, getJobLevelLabel, getJobLevelColor } from '../../models/JobFamily';

// Subcomponentes de Estructura
import AreaForm from '../org/AreaForm';

// Subcomponentes de Job Families
import JobFamilyForm from '../jobfamily/JobFamilyForm';

// UI Components
import { 
  Alert, 
  Spinner
} from '../ui';
import Modal from '../ui/Modal';
import HelpInstructions from '../ui/HelpInstructions';

// Estilos
import './OrganizationManager.css';

const OrganizationManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();
  
  // Estado principal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado de Estructura
  const [areas, setAreas] = useState([]);
  const [structureUsers, setStructureUsers] = useState([]);
  
  // Estado de Job Families
  const [jobFamilies, setJobFamilies] = useState([]);
  const [jobFamilyUsers, setJobFamilyUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // UI State - Navegación principal
  const [activeMainTab, setActiveMainTab] = useState('structure');
  
  // UI State - Estructura
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  
  // UI State - Job Families
  const [showJobFamilyForm, setShowJobFamilyForm] = useState(false);
  const [editingJobFamily, setEditingJobFamily] = useState(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    if (!currentOrgId) return;
    
    const timer = setTimeout(() => {
      loadAllData();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [currentOrgId]);
  
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de estructura y job families en paralelo
      const [
        areasResult, 
        structureUsersResult,
        jobFamiliesResult, 
        jobFamilyUsersResult
      ] = await Promise.allSettled([
        orgStructureService.getOrgAreas(currentOrgId).catch(() => []),
        orgStructureService.getOrgUsers(currentOrgId).catch(() => []),
        jobFamilyService.getOrgJobFamilies(currentOrgId).catch(() => []),
        getOrgUsers(currentOrgId).catch(() => [])
      ]);
      
      // Deferir actualizaciones de estado para evitar React #130
      setTimeout(() => {
        setAreas(areasResult.status === 'fulfilled' ? areasResult.value : []);
        setStructureUsers(structureUsersResult.status === 'fulfilled' ? structureUsersResult.value : []);
        setJobFamilies(jobFamiliesResult.status === 'fulfilled' ? jobFamiliesResult.value : []);
        setJobFamilyUsers(jobFamilyUsersResult.status === 'fulfilled' ? jobFamilyUsersResult.value : []);
        
        console.log('[OrganizationManager] Data loaded:', {
          areas: areasResult.status === 'fulfilled' ? areasResult.value.length : 0,
          structureUsers: structureUsersResult.status === 'fulfilled' ? structureUsersResult.value.length : 0,
          jobFamilies: jobFamiliesResult.status === 'fulfilled' ? jobFamiliesResult.value.length : 0,
          jobFamilyUsers: jobFamilyUsersResult.status === 'fulfilled' ? jobFamilyUsersResult.value.length : 0
        });
        
        setLoading(false);
      }, 0);
    } catch (err) {
      console.error('[OrganizationManager] Unexpected error loading data:', err);
      setTimeout(() => {
        setAreas([]);
        setStructureUsers([]);
        setJobFamilies([]);
        setJobFamilyUsers([]);
        setError('Algunos datos no pudieron cargarse. Verifica la consola para más detalles.');
        setLoading(false);
      }, 0);
    }
  };
  
  // Handlers de Estructura
  const handleCreateArea = async (areaData) => {
    try {
      await orgStructureService.createArea(currentOrgId, areaData, user.uid);
      await loadAllData();
      setShowAreaForm(false);
      setEditingArea(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateArea = async (areaId, updates) => {
    try {
      await orgStructureService.updateArea(currentOrgId, areaId, updates, user.uid);
      await loadAllData();
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
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleEditArea = (area) => {
    setEditingArea(area);
    setShowAreaForm(true);
  };
  
  // Handlers de Job Families
  const handleCreateJobFamily = async (jobFamilyData) => {
    try {
      // Asignar valores por defecto si no existen
      const dataWithDefaults = {
        ...jobFamilyData,
        level: jobFamilyData.level || JOB_LEVELS.INDIVIDUAL_CONTRIBUTOR,
        evaluatorConfig: jobFamilyData.evaluatorConfig || {
          requireSelf: true,
          requireManager: true,
          peersMin: 3,
          peersMax: 5,
          subordinatesMin: 0
        },
        testMappings: jobFamilyData.testMappings || {
          recommended: [],
          allowed: [],
          excluded: []
        }
      };
      await jobFamilyService.createJobFamily(currentOrgId, dataWithDefaults, user.uid);
      await loadAllData();
      setShowJobFamilyForm(false);
      setEditingJobFamily(null);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateJobFamily = async (familyId, updates) => {
    try {
      await jobFamilyService.updateJobFamily(currentOrgId, familyId, updates, user.uid);
      await loadAllData();
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
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleEditJobFamily = (jobFamily) => {
    setEditingJobFamily(jobFamily);
    setShowJobFamilyForm(true);
  };
  
  
  
  if (loading) {
    return (
      <div className="organization-manager-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando organización...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="organization-manager-container">
        <div className="alert alert-error">
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="organization-manager-container">
      {/* Help Instructions */}
      <HelpInstructions title="📖 Configuración de Organización">
        <div style={{ lineHeight: '1.8' }}>
          <h4 style={{ marginTop: '0', marginBottom: '12px', fontWeight: '600' }}>¿Qué es cada sección?</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#2563EB' }}>🏢 Estructura y Áreas:</strong>
            <p style={{ marginTop: '4px', marginBottom: '0', fontSize: '14px' }}>
              Define los <strong>departamentos y áreas</strong> de tu empresa (Ej: Ventas, TI, Marketing, RRHH).
              Esto te permite agrupar usuarios por departamento y establecer relaciones jerárquicas.
            </p>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#7C3AED' }}>👔 Familias de Puestos:</strong>
            <p style={{ marginTop: '4px', marginBottom: '0', fontSize: '14px' }}>
              Define las <strong>categorías para evaluación</strong> (Ej: Gerentes, Analistas, Directores).
              Esto es <strong>vital</strong> para asignar los Tests correctos a cada tipo de puesto.
              Los usuarios con la misma Job Family serán evaluados con los mismos tests.
            </p>
          </div>
          
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
            <strong style={{ color: '#92400E' }}>💡 Flujo recomendado:</strong>
            <ol style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px', fontSize: '14px', color: '#92400E' }}>
              <li>Primero crea tus <strong>Áreas</strong> (departamentos)</li>
              <li>Luego crea tus <strong>Job Families</strong> (tipos de evaluación)</li>
              <li>Finalmente importa usuarios y asígnales Área y Job Family</li>
            </ol>
          </div>
        </div>
      </HelpInstructions>
      
      {/* Header */}
      <div className="organization-manager-header">
        <h1>🏢 Organización</h1>
        <p className="description">
          Configura la estructura organizacional y las familias de puestos de tu empresa
        </p>
      </div>
      
      {/* Toggle entre vistas principales */}
      <div className="view-toggle-container">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeMainTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('structure')}
          >
            Áreas
          </button>
          <button
            className={`toggle-btn ${activeMainTab === 'jobFamilies' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('jobFamilies')}
          >
            Familias de Puestos
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Áreas</div>
          <div className="stat-value">{areas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Job Families</div>
          <div className="stat-value">{jobFamilies.length}</div>
        </div>
      </div>
      
      {/* Contenido según pestaña activa */}
      {activeMainTab === 'structure' && (
        <div>
          {/* Header con botón Crear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#212529', margin: '0 0 4px 0' }}>
                Estructura Organizacional
              </h2>
              <p className="section-description" style={{ margin: 0 }}>
                Gestiona áreas, departamentos y relaciones jerárquicas
              </p>
            </div>
            <button
              onClick={() => {
                setEditingArea(null);
                setShowAreaForm(true);
              }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                backgroundColor: '#0d6efd',
                color: 'white',
                lineHeight: '1.5',
                display: 'inline-block',
                textAlign: 'center',
                textDecoration: 'none',
                verticalAlign: 'middle',
                userSelect: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0b5ed7';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#0d6efd';
              }}
            >
              Crear Área
            </button>
          </div>
          
          {/* Tabla de Áreas */}
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuarios Asignados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{textAlign: 'center', padding: '40px'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>🏢</div>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>No hay áreas configuradas</strong>
                          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                            Comienza creando tu primera área o departamento
                          </p>
                        </div>
                        <button
                          className="btn-action btn-primary"
                          onClick={() => {
                            setEditingArea(null);
                            setShowAreaForm(true);
                          }}
                          style={{ marginTop: '8px' }}
                        >
                          Crear Área
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  areas.map((area) => {
                    const userCount = structureUsers.filter(u => 
                      u.areaId === area.id || u.departmentId === area.id
                    ).length;
                    
                    return (
                      <tr key={area.id}>
                        <td>
                          <strong style={{ color: '#212529' }}>{area.name}</strong>
                          {area.description && (
                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                              {area.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', color: '#212529' }}>{userCount}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditArea(area)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f0f9ff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Editar área"
                            >
                              <Pencil size={18} style={{ color: '#0dcaf0' }} />
                            </button>
                            <button
                              onClick={() => handleDeleteArea(area.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#fff3cd';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Eliminar área"
                            >
                              <Trash2 size={18} style={{ color: '#6c757d' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Tab: Familias de Puestos */}
      {activeMainTab === 'jobFamilies' && (
        <div>
          {/* Header con botón Crear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#212529', margin: '0 0 4px 0' }}>
                Familias de Puestos
              </h2>
              <p className="section-description" style={{ margin: 0 }}>
                Gestiona familias de puestos y su mapeo con tests de evaluación
              </p>
            </div>
            <button
              onClick={() => {
                setEditingJobFamily(null);
                setShowJobFamilyForm(true);
              }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                backgroundColor: '#0d6efd',
                color: 'white',
                lineHeight: '1.5',
                display: 'inline-block',
                textAlign: 'center',
                textDecoration: 'none',
                verticalAlign: 'middle',
                userSelect: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0b5ed7';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#0d6efd';
              }}
            >
              Crear Job Family
            </button>
          </div>
          
          {/* Tabla de Job Families */}
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nivel</th>
                  <th>Usuarios Asignados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jobFamilies.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '40px'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>👔</div>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>No hay familias de puestos configuradas</strong>
                          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                            Comienza creando tu primera familia de puestos
                          </p>
                        </div>
                        <button
                          className="btn-action btn-primary"
                          onClick={() => {
                            setEditingJobFamily(null);
                            setShowJobFamilyForm(true);
                          }}
                          style={{ marginTop: '8px' }}
                        >
                          Crear Job Family
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobFamilies.map((family) => {
                    const userCount = jobFamilyUsers.filter(u => 
                      u.jobFamilyId === family.id
                    ).length;
                    
                    return (
                      <tr key={family.id}>
                        <td>
                          <strong style={{ color: '#212529' }}>{family.name}</strong>
                          {family.description && (
                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                              {family.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="status-badge status-default">
                            {getJobLevelLabel(family.level)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', color: '#212529' }}>{userCount}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditJobFamily(family)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f0f9ff';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Editar familia de puestos"
                            >
                              <Pencil size={18} style={{ color: '#0dcaf0' }} />
                            </button>
                            <button
                              onClick={() => handleDeleteJobFamily(family.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#fef2f2';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Eliminar familia de puestos"
                            >
                              <Trash2 size={18} style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modals de Estructura */}
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
      
      
      {/* Modals de Job Families */}
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
      
    </div>
  );
};

export default OrganizationManager;

