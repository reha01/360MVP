/**
 * TestEditor - Editor básico de tests
 * 
 * Permite crear y editar tests de forma simple
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedTestManagement from './UnifiedTestManagement';
import TestPreview from './TestPreview';
import './UnifiedTestManagement.css';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useSuperAdmin } from '../hooks/useSuperAdmin';
import { createTest, updateTest } from '../services/testDefinitionService';
import * as TestDefinitionServiceDemo from '../services/testDefinitionServiceDemo';
import * as GlobalTestService from '../services/globalTestDefinitionService';
import { listAllOrganizations } from '../services/organizationService';
import './TestEditor.css';

const TestEditor = ({ mode = 'create', testId = null, testData = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const { isSuperAdmin } = useSuperAdmin();

  console.log('[TestEditor] Props:', { mode, testId, testData, isSuperAdmin });

  const [formData, setFormData] = useState({
    testId: '',
    title: '',
    description: '',
    scaleMin: 1,
    scaleMax: 5,
    visibility: 'private', // 'public' o 'private'
    allowedOrgs: [], // Organizaciones permitidas (solo para tests privados)
    categories: [
      { 
        id: 'leadership', 
        name: 'Liderazgo', 
        color: '#3b82f6', 
        weight: 1, 
        description: '',
        subdimensions: [
          { id: 'leadership_vision', name: 'Visión Estratégica', description: '', weight: 1 }
        ]
      },
      { 
        id: 'communication', 
        name: 'Comunicación', 
        color: '#10b981', 
        weight: 1, 
        description: '',
        subdimensions: [
          { id: 'communication_verbal', name: 'Comunicación Verbal', description: '', weight: 1 }
        ]
      },
      { 
        id: 'teamwork', 
        name: 'Trabajo en Equipo', 
        color: '#f59e0b', 
        weight: 1, 
        description: '',
        subdimensions: [
          { id: 'teamwork_collaboration', name: 'Colaboración', description: '', weight: 1 }
        ]
      }
    ],
    customQuestions: [], // Preguntas personalizadas por categoría y subdimensión
    conditionalRules: [] // Reglas condicionales
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]); // Lista de todas las organizaciones
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Estado para el modal de preview

  // Estado para controlar las secciones desplegables
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    scale: false,
    visibility: false
  });

  /**
   * Toggle para expandir/colapsar secciones
   */
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  /**
   * Detectar si estamos en modo demo
   */
  const isDemoMode = () => {
    const demoConfig = localStorage.getItem('demo_user_config');
    return demoConfig && user?.email === 'demo@360mvp.com';
  };

  /**
   * Obtener el servicio de tests correcto (demo, global o real)
   */
  const getTestService = () => {
    const demoMode = isDemoMode();
    console.log('[TestEditor] isDemoMode result:', demoMode);
    console.log('[TestEditor] user email:', user?.email);
    console.log('[TestEditor] isSuperAdmin:', isSuperAdmin);
    console.log('[TestEditor] demo config exists:', !!localStorage.getItem('demo_user_config'));
    
    if (demoMode) {
      console.log('[TestEditor] Using TestDefinitionServiceDemo');
      return TestDefinitionServiceDemo;
    } else if (isSuperAdmin) {
      console.log('[TestEditor] Using GlobalTestService for Super Admin');
      return GlobalTestService;
    } else {
      console.log('[TestEditor] Using TestDefinitionService for org users');
      return {
        createTest,
        updateTest
      };
    }
  };

  // Cargar organizaciones (solo para Super Admin)
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!isSuperAdmin) return;
      
      try {
        setLoadingOrgs(true);
        const orgs = await listAllOrganizations();
        setOrganizations(orgs);
        console.log('[TestEditor] Loaded organizations:', orgs.length);
      } catch (error) {
        console.error('[TestEditor] Error loading organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, [isSuperAdmin]);

  // Cargar datos del test cuando está en modo edit
  useEffect(() => {
    if (mode === 'edit' && testData) {
      // Asegurar que cada categoría tenga subdimensiones
      const categoriesWithSubdimensions = (testData.categories || []).map(cat => ({
        ...cat,
        subdimensions: cat.subdimensions || [
          { id: `${cat.id}_sub1`, name: 'Subdimensión 1', description: '', weight: 1 }
        ]
      }));
      
      setFormData({
        testId: testData.testId || '',
        title: testData.title || '',
        description: testData.description || '',
        scaleMin: testData.scale?.min || 1,
        scaleMax: testData.scale?.max || 5,
        visibility: testData.visibility || 'private',
        allowedOrgs: testData.allowedOrgs || [],
        categories: categoriesWithSubdimensions,
        customQuestions: testData.questions || [], // Preguntas personalizadas
        conditionalRules: testData.conditionalRules || []
      });
    }
  }, [mode, testData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Manejar selección de organizaciones (toggle individual)
   */
  const handleOrgToggle = (orgId) => {
    setFormData(prev => {
      const isSelected = prev.allowedOrgs.includes(orgId);
      return {
        ...prev,
        allowedOrgs: isSelected
          ? prev.allowedOrgs.filter(id => id !== orgId)
          : [...prev.allowedOrgs, orgId]
      };
    });
  };

  /**
   * Seleccionar/Deseleccionar todas las organizaciones
   */
  const handleSelectAllOrgs = (selectAll) => {
    setFormData(prev => ({
      ...prev,
      allowedOrgs: selectAll ? organizations.map(org => org.orgId) : []
    }));
  };

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...formData.categories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  // Manejar cambios en reglas condicionales
  const handleConditionalRuleChange = (catIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, index) => {
        if (index !== catIndex) return cat;
        
        const updatedCategory = { ...cat };
        
        if (!updatedCategory.conditionalRule) {
          updatedCategory.conditionalRule = {
            condition: {
              questionId: '',
              operator: 'equals',
              value: null
            },
            action: 'exclude_from_scoring'
          };
        }
        
        if (field === 'questionId' || field === 'operator' || field === 'value') {
          updatedCategory.conditionalRule.condition[field] = value;
        } else if (field === 'action') {
          updatedCategory.conditionalRule.action = value;
        }
        
        return updatedCategory;
      })
    }));
  };

  // Obtener texto de pregunta por ID
  const getQuestionText = (questionId) => {
    const question = formData.customQuestions.find(q => q.id === questionId);
    return question ? (question.text || 'Pregunta sin texto') : 'Pregunta no encontrada';
  };

  // Obtener texto del operador
  const getOperatorText = (operator) => {
    const operators = {
      'equals': 'es igual a',
      'not_equals': 'es diferente de',
      'greater_than': 'es mayor que',
      'less_than': 'es menor que'
    };
    return operators[operator] || 'es igual a';
  };

  const addCategory = () => {
    const newCategory = {
      id: `category_${Date.now()}`,
      name: 'Nueva Categoría',
      color: '#6b7280',
      weight: 1,
      description: '',
      subdimensions: [
        { id: `category_${Date.now()}_sub1`, name: 'Subdimensión 1', description: '', weight: 1 }
      ]
    };
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const removeCategory = (index) => {
    if (formData.categories.length > 1) {
      const categoryToRemove = formData.categories[index];
      const newCategories = formData.categories.filter((_, i) => i !== index);
      // También eliminar preguntas de esta categoría
      const newQuestions = formData.customQuestions.filter(q => q.category !== categoryToRemove.id);
      
      setFormData(prev => ({
        ...prev,
        categories: newCategories,
        customQuestions: newQuestions
      }));
    }
  };

  // Funciones para manejar subdimensiones
  const addSubdimension = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          const newSubdim = {
            id: `${categoryId}_sub${Date.now()}`,
            name: `Subdimensión ${(cat.subdimensions?.length || 0) + 1}`,
            description: '',
            weight: 1
          };
          return {
            ...cat,
            subdimensions: [...(cat.subdimensions || []), newSubdim]
          };
        }
        return cat;
      })
    }));
  };

  const updateSubdimension = (categoryId, subdimId, field, value) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subdimensions: cat.subdimensions.map(sub =>
              sub.id === subdimId ? { ...sub, [field]: value } : sub
            )
          };
        }
        return cat;
      })
    }));
  };

  const removeSubdimension = (categoryId, subdimId) => {
    setFormData(prev => {
      // Encontrar la categoría
      const category = prev.categories.find(cat => cat.id === categoryId);
      if (!category || category.subdimensions.length <= 1) {
        return prev; // No permitir eliminar si solo hay una subdimensión
      }

      // Eliminar preguntas de esta subdimensión
      const newQuestions = prev.customQuestions.filter(
        q => !(q.category === categoryId && q.subdimension === subdimId)
      );

      return {
        ...prev,
        categories: prev.categories.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              subdimensions: cat.subdimensions.filter(sub => sub.id !== subdimId)
            };
          }
          return cat;
        }),
        customQuestions: newQuestions
      };
    });
  };

  // Funciones para manejar preguntas personalizadas
  const addCustomQuestion = (categoryId, subdimensionId) => {
    // Generar ID automático basado en el formato P_CAT#_SUB#_Q#
    const category = formData.categories.find(cat => cat.id === categoryId);
    const categoryIndex = formData.categories.indexOf(category);
    const subdimension = category?.subdimensions?.find(sub => sub.id === subdimensionId);
    const subdimensionIndex = category?.subdimensions?.indexOf(subdimension) || 0;
    const questionIndex = formData.customQuestions.filter(
      q => q.category === categoryId && q.subdimension === subdimensionId
    ).length;
    
    const autoId = `P_CAT${categoryIndex + 1}_SUB${subdimensionIndex + 1}_Q${questionIndex + 1}`;
    
    const newQuestion = {
      id: autoId,
      category: categoryId,
      subdimension: subdimensionId,
      text: '',
      weight: 1,
      type: 'scale',
      isNegative: false // Por defecto las preguntas son positivas
    };
    
    setFormData(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, newQuestion]
    }));
  };

  const updateCustomQuestion = (questionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeCustomQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== questionId)
    }));
  };

  const getQuestionsForCategory = (categoryId) => {
    return formData.customQuestions.filter(q => q.category === categoryId);
  };

  const getQuestionsForSubdimension = (categoryId, subdimensionId) => {
    return formData.customQuestions.filter(
      q => q.category === categoryId && q.subdimension === subdimensionId
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.testId.trim() || !formData.title.trim()) {
      setError('ID del test y título son requeridos');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Crear test básico con estructura mínima
      const testDefinition = {
        testId: formData.testId.trim(),
        version: 'v1',
        title: formData.title.trim(),
        description: formData.description.trim(),
        scale: {
          min: parseInt(formData.scaleMin),
          max: parseInt(formData.scaleMax),
          labels: {
            [formData.scaleMin]: 'Muy bajo',
            [Math.floor((formData.scaleMin + formData.scaleMax) / 2)]: 'Medio',
            [formData.scaleMax]: 'Muy alto'
          }
        },
        visibility: formData.visibility,
        allowedOrgs: formData.visibility === 'private' ? formData.allowedOrgs : [], // Solo para tests privados
        categories: formData.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          weight: parseInt(cat.weight),
          description: cat.description || '',
          subdimensions: (cat.subdimensions || []).map(sub => ({
            id: sub.id,
            name: sub.name,
            description: sub.description || '',
            weight: parseInt(sub.weight) || 1
          })),
          isConditional: cat.isConditional || false,
          conditionalRule: cat.conditionalRule || null
        })),
        questions: formData.customQuestions.length > 0 ? formData.customQuestions.map(q => ({
          ...q,
          isNegative: q.isNegative || false
        })) : [
          // Generar preguntas automáticas si no hay preguntas personalizadas
          ...formData.categories.flatMap((cat, catIndex) => {
            const subdimensions = cat.subdimensions || [];
            return subdimensions.flatMap((subdim, subIndex) => {
              const numQuestions = parseInt(subdim.weight) || 1;
              return Array.from({ length: numQuestions }, (_, qIndex) => ({
                id: `P_CAT${catIndex + 1}_SUB${subIndex + 1}_Q${qIndex + 1}`,
                category: cat.id,
                subdimension: subdim.id,
                text: `¿Cómo evalúas tu ${subdim.name.toLowerCase()}? (Pregunta ${qIndex + 1})`,
                weight: 1,
                type: 'scale',
                isNegative: false
              }));
            });
          })
        ],
        conditionalRules: formData.conditionalRules || [],
        scoring: {
          method: 'weighted_average',
          rules: {}
        },
        status: 'draft'
      };

      console.log('[TestEditor] Form data:', formData);
      console.log('[TestEditor] Test definition to save:', testDefinition);

      // Obtener el servicio correcto
      const testService = getTestService();
      console.log('[TestEditor] Using service:', testService);
      
      let result;

      if (isDemoMode()) {
        console.log('[TestEditor] Using TestDefinitionServiceDemo for all operations');
        if (mode === 'edit') {
          // Actualizar test existente con servicio demo
          result = await TestDefinitionServiceDemo.updateTest(
            activeOrgId, 
            formData.testId, 
            testData?.version || 'v1', 
            testDefinition, 
            user.uid
          );
        } else {
          // Crear nuevo test con servicio demo
          result = await TestDefinitionServiceDemo.createTest(activeOrgId, testDefinition, user.uid);
        }
      } else if (isSuperAdmin) {
        console.log('[TestEditor] Using GlobalTestService for Super Admin');
        if (mode === 'edit') {
          // Actualizar test existente con servicio global
          result = await GlobalTestService.updateGlobalTest(
            formData.testId, 
            testData?.version || 'v1', 
            testDefinition, 
            user.uid
          );
        } else {
          // Crear nuevo test con servicio global
          result = await GlobalTestService.createGlobalTest(testDefinition, user.uid);
        }
      } else {
        console.log('[TestEditor] Using TestDefinitionService for org users');
        if (mode === 'edit') {
          // Actualizar test existente con servicio de org
          result = await updateTest(
            activeOrgId, 
            formData.testId, 
            testData?.version || 'v1', 
            testDefinition
          );
        } else {
          // Crear nuevo test con servicio de org
          result = await createTest(activeOrgId, testDefinition);
        }
      }

      if (result.success) {
        console.log('[TestEditor] Update successful, result:', result);
        alert(`✅ Test ${mode === 'edit' ? 'actualizado' : 'creado'} exitosamente!`);
        // Forzar recarga de la página para asegurar que se vean los cambios
        window.location.href = '/admin/tests';
      } else {
        console.error('[TestEditor] Update failed, result:', result);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="test-editor">
      <form onSubmit={handleSubmit} className="editor-form">
            {/* Sección Desplegable: Descripción del Test */}
            <div className="collapsible-section">
              <div 
                className={`collapsible-header ${expandedSections.description ? 'active' : ''}`}
                onClick={() => toggleSection('description')}
              >
                <h3 className="collapsible-title">Descripción del Test</h3>
                <span className="collapsible-icon">▼</span>
              </div>
              <div className={`collapsible-content ${expandedSections.description ? 'expanded' : 'collapsed'}`}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testId">ID del Test *</label>
                    <input
                      id="testId"
                      type="text"
                      value={formData.testId}
                      onChange={(e) => handleInputChange('testId', e.target.value)}
                      placeholder="ej: leadership_2024"
                      required
                      readOnly={mode === 'edit'}
                      disabled={isSubmitting}
                      style={mode === 'edit' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                    />
                    <small>Identificador único para el test (sin espacios)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Título *</label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="ej: Evaluación de Liderazgo 2024"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descripción del test..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Sección Desplegable: Escala de Evaluación */}
            <div className="collapsible-section">
              <div 
                className={`collapsible-header ${expandedSections.scale ? 'active' : ''}`}
                onClick={() => toggleSection('scale')}
              >
                <h3 className="collapsible-title">Escala de Evaluación</h3>
                <span className="collapsible-icon">▼</span>
              </div>
              <div className={`collapsible-content ${expandedSections.scale ? 'expanded' : 'collapsed'}`}>
                <div className="scale-group">
                  <div className="form-group">
                    <label htmlFor="scaleMin">Valor Mínimo</label>
                    <input
                      id="scaleMin"
                      type="number"
                      value={formData.scaleMin}
                      onChange={(e) => handleInputChange('scaleMin', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="scaleMax">Valor Máximo</label>
                    <input
                      id="scaleMax"
                      type="number"
                      value={formData.scaleMax}
                      onChange={(e) => handleInputChange('scaleMax', parseInt(e.target.value))}
                      min="2"
                      max="10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Desplegable: Configuración de Visibilidad */}
            <div className="collapsible-section">
              <div 
                className={`collapsible-header ${expandedSections.visibility ? 'active' : ''}`}
                onClick={() => toggleSection('visibility')}
              >
                <h3 className="collapsible-title">Configuración de Visibilidad</h3>
                <span className="collapsible-icon">▼</span>
              </div>
              <div className={`collapsible-content ${expandedSections.visibility ? 'expanded' : 'collapsed'}`}>
                <p className="section-description">
                  Define quién puede acceder y tomar este test de evaluación.
                </p>
                
                <div className="visibility-compact">
                  <div 
                    className={`visibility-compact-option ${formData.visibility === 'private' ? 'selected' : ''}`}
                    onClick={() => !isSubmitting && handleInputChange('visibility', 'private')}
                  >
                    <span className="visibility-compact-icon">🏢</span>
                    <div className="visibility-compact-content">
                      <div className="visibility-compact-title">Privado</div>
                      <div className="visibility-compact-description">
                        Solo organizaciones específicas
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`visibility-compact-option ${formData.visibility === 'public' ? 'selected' : ''}`}
                    onClick={() => !isSubmitting && handleInputChange('visibility', 'public')}
                  >
                    <span className="visibility-compact-icon">🌍</span>
                    <div className="visibility-compact-content">
                      <div className="visibility-compact-title">Público</div>
                      <div className="visibility-compact-description">
                        Acceso libre para todos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selector de Organizaciones (solo para tests privados y Super Admin) */}
                {isSuperAdmin && formData.visibility === 'private' && (
                  <div className="organizations-selector">
                    <h4>Seleccionar Organizaciones</h4>
                    <p className="selector-description">
                      Elige qué organizaciones podrán acceder a este test. Solo sus miembros podrán verlo y tomarlo.
                    </p>
                    
                    {loadingOrgs ? (
                      <p className="loading-message">Cargando organizaciones...</p>
                    ) : (
                      <>
                        <div className="selector-actions">
                          <button
                            type="button"
                            onClick={() => handleSelectAllOrgs(true)}
                            className="btn-select-action"
                            disabled={isSubmitting}
                          >
                            Seleccionar Todas
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectAllOrgs(false)}
                            className="btn-select-action"
                            disabled={isSubmitting}
                          >
                            Desseleccionar Todas
                          </button>
                          <span className="selection-count">
                            {formData.allowedOrgs.length} de {organizations.length} seleccionadas
                          </span>
                        </div>

                        <div className="organizations-list">
                          {organizations.length === 0 ? (
                            <p className="no-organizations">No hay organizaciones disponibles</p>
                          ) : (
                            organizations.map(org => (
                              <label key={org.orgId} className="org-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={formData.allowedOrgs.includes(org.orgId)}
                                  onChange={() => handleOrgToggle(org.orgId)}
                                  disabled={isSubmitting}
                                  className="org-checkbox"
                                />
                                <div className="org-info">
                                  <span className="org-name">{org.name || org.orgId}</span>
                                  <span className="org-id">{org.orgId}</span>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

        {/* Sección Unificada: Gestión de Categorías, Subdimensiones y Preguntas */}
        <div className="form-section">
          <div className="unified-header">
            <h3>Gestión de Test</h3>
            <p className="section-description">
              Crea y organiza categorías, subdimensiones y preguntas en una sola interfaz. 
              Las subdimensiones permiten agrupar preguntas relacionadas dentro de cada categoría.
            </p>
          </div>
          
          <UnifiedTestManagement
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
            handleCategoryChange={handleCategoryChange}
            handleConditionalRuleChange={handleConditionalRuleChange}
            updateSubdimension={updateSubdimension}
            addSubdimension={addSubdimension}
            removeSubdimension={removeSubdimension}
            getQuestionsForCategory={getQuestionsForCategory}
            getQuestionsForSubdimension={getQuestionsForSubdimension}
            addCustomQuestion={addCustomQuestion}
            updateCustomQuestion={updateCustomQuestion}
            removeCustomQuestion={removeCustomQuestion}
            getQuestionText={getQuestionText}
            getOperatorText={getOperatorText}
            addCategory={addCategory}
            removeCategory={removeCategory}
          />
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
            className="btn-preview"
            title="Ver cómo se verá el test para los evaluadores"
          >
            👁️ Vista Previa
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (mode === 'edit' ? 'Guardando...' : 'Creando...') : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Test')}
          </button>
        </div>
      </form>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <TestPreview 
          testDefinition={{
            title: formData.title || 'Test sin título',
            description: formData.description,
            categories: formData.categories,
            questions: formData.customQuestions,
            scale: {
              min: formData.scaleMin,
              max: formData.scaleMax,
              labels: {
                [formData.scaleMin]: 'Muy bajo',
                [Math.floor((formData.scaleMin + formData.scaleMax) / 2)]: 'Medio',
                [formData.scaleMax]: 'Muy alto'
              }
            }
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TestEditor;
