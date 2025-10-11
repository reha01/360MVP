/**
 * TestsAdmin - Panel de Administración de Tests
 * 
 * Permite a OWNER/ADMIN:
 * - Listar tests de la organización
 * - Crear nuevos tests
 * - Editar tests en draft
 * - Activar/Archivar tests
 * - Duplicar para nuevas versiones
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { listTests, createTest, activateTest, archiveTest, duplicateTest, deleteTest } from '../../services/testDefinitionService';
import * as TestDefinitionServiceDemo from '../../services/testDefinitionServiceDemo';
import * as GlobalTestService from '../../services/globalTestDefinitionService';
import { TEST_STATUS } from '../../models/TestDefinition';
import { dlog, dwarn } from '../../utils/debug';
import TestEditor from '../../components/TestEditor';
import { ensureDemoUserPermissions } from '../../services/demoUserService';
import { fixDemoPermissions } from '../../services/fixDemoPermissions';
import { createDemoWorkspace } from '../../services/createDemoWorkspace';
import { simpleDemoSetup } from '../../services/simpleDemoSetup';
import { directDemoSetup } from '../../services/directDemoSetup';
import './TestsAdmin.css';

const TestsAdmin = ({ mode = 'list' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId, activeOrg } = useOrg();
  const { isSuperAdmin } = useSuperAdmin();
  const { testId } = useParams();

  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | draft | active | archived
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);

  dlog('[TestsAdmin] isSuperAdmin:', isSuperAdmin);

  /**
   * Detectar si estamos en modo demo
   */
  const isDemoMode = () => {
    const demoConfig = localStorage.getItem('demo_user_config');
    return demoConfig && user?.email === 'demo@360mvp.com';
  };

  /**
   * Obtener el servicio de tests correcto (demo o real)
   */
  const getTestService = () => {
    return isDemoMode() ? TestDefinitionServiceDemo : {
      listTests,
      createTest,
      updateTest: async (orgId, testId, version, updates, userId) => {
        // Implementar updateTest si no existe en el servicio real
        throw new Error('updateTest not implemented in real service');
      },
      activateTest,
      archiveTest,
      duplicateTest,
      deleteTest
    };
  };

  /**
   * Cargar tests de la organización (o todos si es Super Admin)
   */
  const loadTests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      dlog('[TestsAdmin] Loading tests');
      dlog('[TestsAdmin] isSuperAdmin:', isSuperAdmin);
      dlog('[TestsAdmin] activeOrgId:', activeOrgId);
      dlog('[TestsAdmin] Demo mode:', isDemoMode());

      let loadedTests;

      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin ve TODOS los tests globales
        dlog('[TestsAdmin] Loading GLOBAL tests for Super Admin');
        loadedTests = await GlobalTestService.listGlobalTests();
        
        // Aplicar filtro de estado si no es "all"
        if (filter !== 'all') {
          loadedTests = loadedTests.filter(test => test.status === filter);
        }
        
        dlog('[TestsAdmin] Global tests loaded:', loadedTests.length);
        setTests(loadedTests);
        
      } else if (isDemoMode()) {
        // Modo demo usa servicio local
        if (!activeOrgId) {
          setTests([]);
          setIsLoading(false);
          return;
        }
        
        dlog('[TestsAdmin] Loading tests in DEMO mode');
        const testService = getTestService();
        const filters = filter !== 'all' ? { status: filter } : {};
        const result = await testService.listTests(activeOrgId, filters);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        dlog('[TestsAdmin] Demo tests loaded:', result.tests.length);
        setTests(result.tests);
        
      } else if (activeOrgId) {
        // Líder de Org ve solo tests disponibles para su org
        dlog('[TestsAdmin] Loading tests for org:', activeOrgId);
        loadedTests = await GlobalTestService.getTestsForOrg(activeOrgId);
        
        dlog('[TestsAdmin] Org tests loaded:', loadedTests.length);
        setTests(loadedTests);
        
      } else {
        dlog('[TestsAdmin] No orgId and not Super Admin, skipping load');
        setTests([]);
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error loading tests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [activeOrgId, filter, isSuperAdmin]);

  // Recargar tests cuando se vuelve de edición
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[TestsAdmin] Page became visible, reloading tests...');
        loadTests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeOrgId, filter]);

  /**
   * Crear nuevo test
   */
  const handleCreate = async () => {
    // Crear test básico directamente
    try {
      const testDefinition = {
        testId: `test_${Date.now()}`,
        version: 'v1',
        title: 'Test de Liderazgo Básico',
        description: 'Test básico de liderazgo creado automáticamente',
        visibility: 'public',
        allowedOrgs: [],
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Muy bajo',
            2: 'Bajo', 
            3: 'Medio',
            4: 'Alto',
            5: 'Muy alto'
          }
        },
        categories: [
          {
            id: 'leadership',
            name: 'Liderazgo',
            color: '#3b82f6',
            weight: 1,
            description: ''
          }
        ],
        questions: [
          {
            id: 'q_leadership_1',
            category: 'leadership',
            text: '¿Cómo evalúas tu liderazgo?',
            weight: 1,
            type: 'scale',
            isNegative: false
          }
        ],
        scoring: {
          method: 'weighted_average',
          rules: {}
        },
        status: 'draft'
      };

      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.createGlobalTest(testDefinition, user.uid);
        await loadTests();
        alert('✅ Test básico creado exitosamente!');
      } else {
        // Líder de Org usa servicio local
        if (!activeOrgId) {
          alert('❌ No hay organización activa');
          return;
        }
        
        const testService = getTestService();
        const result = await testService.createTest(activeOrgId, testDefinition, user.uid);

        if (result.success) {
          alert('✅ Test básico creado exitosamente!');
          loadTests(); // Recargar lista
        } else {
          alert('❌ Error creando test: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error creating basic test:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  /**
   * Crear test de ejemplo (solo Super Admin)
   */
  const handleCreateSampleTest = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setIsLoading(true);
      
      const sampleTest = {
        testId: 'liderazgo-basico',
        version: 'v1',
        title: 'Test de Liderazgo Básico',
        description: 'Evaluación fundamental de competencias de liderazgo para equipos de trabajo.',
        visibility: 'public',
        allowedOrgs: [],
        categories: [
          {
            id: 'comunicacion',
            name: 'Comunicación',
            color: '#3b82f6',
            weight: 1,
            description: 'Capacidad para transmitir ideas de manera clara y efectiva'
          },
          {
            id: 'toma-decisiones',
            name: 'Toma de Decisiones',
            color: '#10b981',
            weight: 1,
            description: 'Habilidad para analizar situaciones y tomar decisiones informadas'
          },
          {
            id: 'trabajo-equipo',
            name: 'Trabajo en Equipo',
            color: '#f59e0b',
            weight: 1,
            description: 'Colaboración efectiva con otros miembros del equipo'
          }
        ],
        questions: [
          {
            id: 'q_comunicacion_1',
            category: 'comunicacion',
            text: '¿Con qué frecuencia comunicas claramente las expectativas a tu equipo?',
            weight: 1,
            type: 'scale',
            isNegative: false
          },
          {
            id: 'q_comunicacion_2',
            category: 'comunicacion',
            text: '¿Evitas dar feedback directo a los miembros de tu equipo?',
            weight: 1,
            type: 'scale',
            isNegative: true
          },
          {
            id: 'q_toma-decisiones_1',
            category: 'toma-decisiones',
            text: '¿Analizas múltiples opciones antes de tomar decisiones importantes?',
            weight: 1,
            type: 'scale',
            isNegative: false
          },
          {
            id: 'q_trabajo-equipo_1',
            category: 'trabajo-equipo',
            text: '¿Promueves la colaboración entre diferentes departamentos?',
            weight: 1,
            type: 'scale',
            isNegative: false
          }
        ],
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Muy bajo',
            3: 'Medio',
            5: 'Muy alto'
          }
        },
        scoring: {
          method: 'weighted_average',
          rules: {}
        },
        status: 'active'
      };

      await GlobalTestService.createGlobalTest(sampleTest, user.uid);
      
      await loadTests();
      alert('✅ Test de ejemplo creado exitosamente!');
      
    } catch (err) {
      dwarn('[TestsAdmin] Error creating sample test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Editar test
   */
  const handleEdit = (testId) => {
    console.log('[TestsAdmin] handleEdit called with testId:', testId);
    navigate(`/admin/tests/${testId}/edit`);
  };

  /**
   * Activar test
   */
  const handleActivate = async (test) => {
    if (!window.confirm(`¿Activar ${test.testId}@${test.version}?\n\nEsto hará que esté disponible para evaluaciones y desactivará cualquier versión anterior activa.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        await GlobalTestService.activateGlobalTest(test.testId, test.version, user.uid);
      } else {
        const testService = getTestService();
        const result = await testService.activateTest(activeOrgId, test.testId, test.version, user.uid);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      await loadTests();
      alert('✅ Test activado exitosamente');

    } catch (err) {
      dwarn('[TestsAdmin] Error activating test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Archivar test
   */
  const handleArchive = async (test) => {
    if (!window.confirm(`¿Archivar ${test.testId}@${test.version}?\n\nNo estará disponible para nuevas evaluaciones, pero las históricas se mantendrán.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.archiveGlobalTest(test.testId, test.version, user.uid);
        await loadTests();
        alert('✅ Test archivado exitosamente');
      } else {
        // Líder de Org usa servicio local
        const testService = getTestService();
        const result = await testService.archiveTest(activeOrgId, test.testId, test.version, user.uid);

        if (!result.success) {
          throw new Error(result.error);
        }

        await loadTests();
        alert('✅ Test archivado exitosamente');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error archiving test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Duplicar test (crear nueva versión)
   */
  const handleDuplicate = async (test) => {
    if (!window.confirm(`¿Duplicar ${test.testId}@${test.version}?\n\nSe creará una nueva versión en estado draft que podrás editar.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const newVersion = `v${Date.now()}`;
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        const result = await GlobalTestService.duplicateGlobalTest(test.testId, test.version, newVersion, user.uid);
        await loadTests();
        alert(`✅ Test duplicado como ${result.testId}@${result.version}`);
        navigate(`/admin/tests/${result.testId}/edit`);
      } else {
        // Líder de Org usa servicio local
        const testService = getTestService();
        const result = await testService.duplicateTest(activeOrgId, test.testId, test.version, newVersion, user.uid);

        if (!result.success) {
          throw new Error(result.error);
        }

        await loadTests();
        alert(`✅ Test duplicado como ${result.test.testId}@${result.test.version}`);
        navigate(`/admin/tests/${result.test.testId}/edit`);
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error duplicating test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Eliminar test (solo draft)
   */
  const handleDelete = async (test) => {
    if (!window.confirm(`¿ELIMINAR ${test.testId}@${test.version}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.deleteGlobalTest(test.testId, test.version);
        await loadTests();
        alert('✅ Test eliminado exitosamente');
      } else {
        // Líder de Org usa servicio local
        const testService = getTestService();
        const result = await testService.deleteTest(activeOrgId, test.testId, test.version, user.uid);

        if (!result.success) {
          throw new Error(result.error);
        }

        await loadTests();
        alert('✅ Test eliminado exitosamente');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error deleting test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Desarchivar test (volver a draft)
   */
  const handleUnarchive = async (test) => {
    if (!window.confirm(`¿Desarchivar ${test.testId}@${test.version}?\n\nEl test volverá a estado draft y podrás editarlo nuevamente.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.unarchiveGlobalTest(test.testId, test.version, user.uid);
        await loadTests();
        alert('✅ Test desarchivado exitosamente');
      } else {
        // Líder de Org usa servicio local (implementar si es necesario)
        alert('❌ Función no disponible para líderes de organización');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error unarchiving test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Eliminar test (mover a papelera)
   */
  const handleMoveToTrash = async (test) => {
    if (!window.confirm(`¿Eliminar ${test.testId}@${test.version}?\n\nEl test se moverá a la papelera y no estará disponible para evaluaciones.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.deleteGlobalTest(test.testId, test.version, user.uid);
        await loadTests();
        alert('✅ Test movido a papelera exitosamente');
      } else {
        // Líder de Org usa servicio local (implementar si es necesario)
        alert('❌ Función no disponible para líderes de organización');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error moving test to trash:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restaurar test desde papelera
   */
  const handleRestore = async (test) => {
    if (!window.confirm(`¿Restaurar ${test.testId}@${test.version}?\n\nEl test volverá a estado draft.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.restoreGlobalTest(test.testId, test.version, user.uid);
        await loadTests();
        alert('✅ Test restaurado exitosamente');
      } else {
        // Líder de Org usa servicio local (implementar si es necesario)
        alert('❌ Función no disponible para líderes de organización');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error restoring test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Eliminar borrador (eliminación definitiva)
   */
  const handleDeleteDraft = async (test) => {
    if (!window.confirm(`¿Eliminar borrador ${test.testId}@${test.version}?\n\nEsta acción eliminará el test permanentemente.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.permanentDeleteGlobalTest(test.testId, test.version);
        await loadTests();
        alert('✅ Borrador eliminado exitosamente');
      } else {
        // Líder de Org usa servicio local (implementar si es necesario)
        alert('❌ Función no disponible para líderes de organización');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error deleting draft:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Eliminar definitivamente (desde papelera)
   */
  const handlePermanentDelete = async (test) => {
    if (!window.confirm(`¿ELIMINAR DEFINITIVAMENTE ${test.testId}@${test.version}?\n\nEsta acción NO se puede deshacer. El test se eliminará permanentemente.`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (isSuperAdmin && !isDemoMode()) {
        // Super Admin usa GlobalTestService
        await GlobalTestService.permanentDeleteGlobalTest(test.testId, test.version);
        await loadTests();
        alert('✅ Test eliminado definitivamente');
      } else {
        // Líder de Org usa servicio local (implementar si es necesario)
        alert('❌ Función no disponible para líderes de organización');
      }

    } catch (err) {
      dwarn('[TestsAdmin] Error permanently deleting test:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Arreglar permisos del usuario demo
   */
  const handleFixPermissions = async () => {
    if (!user) {
      alert('❌ Usuario no autenticado');
      return;
    }

    setIsFixingPermissions(true);
    try {
      console.log('[TestsAdmin] Setting up demo user...');
      
      // Usar método directo (localStorage) que no depende de Firestore
      const result = await directDemoSetup(user);
      
      if (result.success) {
        alert('✅ Usuario demo configurado correctamente!\n\nOrganización: ' + result.orgId + '\n\nModo: Demo local (sin Firestore)\n\nLa página se recargará automáticamente.');
        // Recargar la página para que detecte la nueva configuración
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert('❌ Error configurando demo: ' + result.error);
      }
    } catch (error) {
      console.error('Error fixing permissions:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setIsFixingPermissions(false);
    }
  };

  if (!activeOrgId) {
    return (
      <div className="tests-admin">
        <div className="admin-empty">
          <p>Selecciona una organización para administrar tests</p>
        </div>
      </div>
    );
  }

  // Manejar diferentes modos
  if (mode === 'create') {
    return (
      <div className="tests-admin">
        <div className="admin-header">
          <div className="header-left">
            <h1>Crear Nuevo Test</h1>
            <p className="org-name">{activeOrg?.name || 'Organización actual'}</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/admin/tests')}>
            ← Volver a Tests
          </button>
        </div>
        <TestEditor mode="create" />
      </div>
    );
  }

  if (mode === 'edit') {
    // Buscar el test a editar
    const testToEdit = tests.find(test => test.testId === testId);
    console.log('[TestsAdmin] Edit mode - testId:', testId);
    console.log('[TestsAdmin] Available tests:', tests.map(t => ({ testId: t.testId, title: t.title })));
    console.log('[TestsAdmin] Found testToEdit:', testToEdit);
    
    return (
      <div className="tests-admin">
        <div className="admin-header">
          <div className="header-left">
            <h1>Editar Test: {testToEdit?.title || testId}</h1>
            <p className="org-name">{activeOrg?.name || 'Organización Demo'}</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/admin/tests')}>
            ← Volver a Tests
          </button>
        </div>
        {testToEdit ? (
          <div>
            <div style={{ background: '#e3f2fd', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
              <strong>✅ Test encontrado para editar:</strong><br/>
              ID: {testToEdit.testId}<br/>
              Título: {testToEdit.title}<br/>
              Versión: {testToEdit.version}
            </div>
            <TestEditor mode="edit" testId={testId} testData={testToEdit} />
          </div>
        ) : (
          <div className="test-editor">
            <div className="error-message">
              <h3>❌ Test no encontrado</h3>
              <p><strong>ID buscado:</strong> {testId}</p>
              <p><strong>Tests disponibles:</strong> {tests.length > 0 ? tests.map(t => t.testId).join(', ') : 'Ninguno'}</p>
              
              <div className="error-details">
                <h4>Posibles causas:</h4>
                <ul>
                  <li>El test no existe o fue eliminado</li>
                  <li>No tienes permisos para ver este test</li>
                  <li>Problema de conexión con Firebase</li>
                  <li>Los tests aún se están cargando</li>
                </ul>
              </div>
              
              <div className="error-actions">
                <button className="btn-primary" onClick={() => window.location.reload()}>
                  🔄 Recargar página
                </button>
                <button className="btn-secondary" onClick={() => navigate('/admin/tests')}>
                  ← Volver a Tests
                </button>
                <button className="btn-secondary" onClick={() => loadTests()}>
                  🔄 Recargar tests
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tests-admin">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>
            Administración de Tests
            {isSuperAdmin && <span className="super-admin-badge">👑 Super Admin</span>}
          </h1>
          <p className="org-name">
            {isSuperAdmin 
              ? 'Catálogo Global de Tests' 
              : activeOrg?.name || 'Sin organización'
            }
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => loadTests()} disabled={isLoading}>
            🔄 Recargar
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            + Crear Test
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          className={`filter-btn ${filter === TEST_STATUS.DRAFT ? 'active' : ''}`}
          onClick={() => setFilter(TEST_STATUS.DRAFT)}
        >
          Borradores
        </button>
        <button
          className={`filter-btn ${filter === TEST_STATUS.ACTIVE ? 'active' : ''}`}
          onClick={() => setFilter(TEST_STATUS.ACTIVE)}
        >
          Activos
        </button>
        <button
          className={`filter-btn ${filter === TEST_STATUS.ARCHIVED ? 'active' : ''}`}
          onClick={() => setFilter(TEST_STATUS.ARCHIVED)}
        >
          Archivados
        </button>
        <button
          className={`filter-btn ${filter === TEST_STATUS.DELETED ? 'active' : ''}`}
          onClick={() => setFilter(TEST_STATUS.DELETED)}
        >
          🗑️ Papelera
        </button>
      </div>

      {/* Content */}
        {error && (
          <div className="admin-error">
            <span>⚠️</span> {error}
            {error.includes('permissions') && user?.email === 'demo@360mvp.com' && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>
                  Modo: {isDemoMode() ? 'Demo Local' : 'Firestore'}
                </div>
                <button 
                  className="btn-secondary"
                  onClick={handleFixPermissions}
                  disabled={isFixingPermissions}
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  {isFixingPermissions ? '🔧 Configurando...' : '🔧 Arreglar Permisos Demo'}
                </button>
              </div>
            )}
          </div>
        )}

      {isLoading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Cargando tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="admin-empty">
          <p>No hay tests {filter !== 'all' ? `en estado "${filter}"` : ''}</p>
          {filter === 'all' && (
            <div className="empty-actions">
              <button className="btn-secondary" onClick={handleCreate}>
                Crear tu primer test
              </button>
              {isSuperAdmin && (
                <button className="btn-primary" onClick={handleCreateSampleTest}>
                  🚀 Crear Test de Ejemplo
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="tests-list">
          {tests.map(test => (
            <TestCard
              key={`${test.testId}@${test.version}`}
              test={test}
              onEdit={() => handleEdit(test.testId)}
              onActivate={() => handleActivate(test)}
              onArchive={() => handleArchive(test)}
              onDuplicate={() => handleDuplicate(test)}
              onDelete={() => handleDelete(test)}
              onDeleteDraft={() => handleDeleteDraft(test)}
              onUnarchive={() => handleUnarchive(test)}
              onMoveToTrash={() => handleMoveToTrash(test)}
              onRestore={() => handleRestore(test)}
              onPermanentDelete={() => handlePermanentDelete(test)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * TestCard - Tarjeta de test individual
 */
const TestCard = ({ test, onEdit, onActivate, onArchive, onDuplicate, onDelete, onDeleteDraft, onUnarchive, onMoveToTrash, onRestore, onPermanentDelete }) => {
  console.log('[TestCard] Rendering test:', test);
  const getStatusBadge = (status) => {
    const badges = {
      [TEST_STATUS.DRAFT]: { label: 'Borrador', className: 'status-draft' },
      [TEST_STATUS.ACTIVE]: { label: 'Activo', className: 'status-active' },
      [TEST_STATUS.ARCHIVED]: { label: 'Archivado', className: 'status-archived' },
      [TEST_STATUS.DELETED]: { label: '🗑️ Eliminado', className: 'status-deleted' }
    };
    return badges[status] || { label: status, className: '' };
  };

  const badge = getStatusBadge(test.status);
  const isDraft = test.status === TEST_STATUS.DRAFT;
  const isActive = test.status === TEST_STATUS.ACTIVE;

  return (
    <div className={`test-card ${test.status}`}>
      <div className="card-header">
        <div className="card-title">
          <h3>{test.title}</h3>
          <span className="test-version">{test.testId}@{test.version}</span>
        </div>
        <span className={`status-badge ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="card-body">
        <p className="test-description">{test.description}</p>
        
        <div className="test-stats">
          <div className="stat">
            <span className="stat-label">Categorías</span>
            <span className="stat-value">{test.categories?.length || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Preguntas</span>
            <span className="stat-value">{test.questions?.length || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Escala</span>
            <span className="stat-value">{test.scale?.min}-{test.scale?.max}</span>
          </div>
        </div>

        <div className="test-visibility">
          <span className={`visibility-badge ${test.visibility || 'private'}`}>
            {test.visibility === 'public' ? '🌍 Público' : '🏢 Privado'}
          </span>
          <span className="visibility-description">
            {test.visibility === 'public' 
              ? 'Acceso libre para cualquier persona' 
              : 'Solo miembros de la organización'
            }
          </span>
        </div>

        {test.metadata?.updatedAt && (
          <p className="test-meta">
            Actualizado: {new Date(test.metadata.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="card-actions">
        {/* Botones para Draft */}
        {isDraft && (
          <>
            <button className="btn-action" onClick={onEdit}>
              ✏️ Editar
            </button>
            <button className="btn-action btn-success" onClick={onActivate}>
              ✓ Activar
            </button>
            <button className="btn-action btn-danger" onClick={onDeleteDraft}>
              🗑️ Eliminar
            </button>
          </>
        )}

        {/* Botones para Active */}
        {isActive && (
          <>
            <button className="btn-action" onClick={onDuplicate}>
              📋 Duplicar
            </button>
            <button className="btn-action btn-warning" onClick={onArchive}>
              📦 Archivar
            </button>
          </>
        )}

        {/* Botones para Archived */}
        {test.status === TEST_STATUS.ARCHIVED && (
          <>
            <button className="btn-action" onClick={onDuplicate}>
              📋 Duplicar
            </button>
            <button className="btn-action btn-primary" onClick={onUnarchive}>
              📤 Desarchivar
            </button>
            <button className="btn-action btn-danger" onClick={onMoveToTrash}>
              🗑️ Eliminar
            </button>
          </>
        )}

        {/* Botones para Deleted (Papelera) */}
        {test.status === TEST_STATUS.DELETED && (
          <>
            <button className="btn-action btn-success" onClick={onRestore}>
              ♻️ Restaurar
            </button>
            <button className="btn-action btn-danger" onClick={onPermanentDelete}>
              ⚠️ Eliminar Definitivamente
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TestsAdmin;

