/**
 * TestEditor - Editor básico de tests
 * 
 * Permite crear y editar tests de forma simple
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      { id: 'leadership', name: 'Liderazgo', color: '#3b82f6', weight: 1, description: '' },
      { id: 'communication', name: 'Comunicación', color: '#10b981', weight: 1, description: '' },
      { id: 'teamwork', name: 'Trabajo en Equipo', color: '#f59e0b', weight: 1, description: '' }
    ],
    customQuestions: [] // Preguntas personalizadas por categoría
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null); // Para navegación por categorías
  const [organizations, setOrganizations] = useState([]); // Lista de todas las organizaciones
  const [loadingOrgs, setLoadingOrgs] = useState(false);

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
    const demoMode = isDemoMode();
    console.log('[TestEditor] isDemoMode result:', demoMode);
    console.log('[TestEditor] user email:', user?.email);
    console.log('[TestEditor] demo config exists:', !!localStorage.getItem('demo_user_config'));
    
    if (demoMode) {
      console.log('[TestEditor] Using TestDefinitionServiceDemo');
      return TestDefinitionServiceDemo;
    } else {
      console.log('[TestEditor] Using real service');
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
      setFormData({
        testId: testData.testId || '',
        title: testData.title || '',
        description: testData.description || '',
        scaleMin: testData.scale?.min || 1,
        scaleMax: testData.scale?.max || 5,
        visibility: testData.visibility || 'private',
        allowedOrgs: testData.allowedOrgs || [],
        categories: testData.categories || [
          { id: 'leadership', name: 'Liderazgo', color: '#3b82f6', weight: 1, description: '' }
        ],
        customQuestions: testData.questions || [] // Preguntas personalizadas
      });
    }
  }, [mode, testData]);

  // Inicializar categoría activa
  useEffect(() => {
    if (formData.categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(formData.categories[0].id);
    }
  }, [formData.categories, activeCategoryId]);

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

  const addCategory = () => {
    const newCategory = {
      id: `category_${Date.now()}`,
      name: 'Nueva Categoría',
      color: '#6b7280',
      weight: 1,
      description: ''
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

  // Funciones para manejar preguntas personalizadas
  const addCustomQuestion = (categoryId) => {
    const newQuestion = {
      id: `q_${categoryId}_${Date.now()}`,
      category: categoryId,
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

  const getActiveCategory = () => {
    return formData.categories.find(cat => cat.id === activeCategoryId);
  };

  const getTotalQuestions = () => {
    return formData.customQuestions.length;
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
          description: cat.description || ''
        })),
        questions: formData.customQuestions.length > 0 ? formData.customQuestions.map(q => ({
          ...q,
          isNegative: q.isNegative || false
        })) : [
          // Generar preguntas automáticas si no hay preguntas personalizadas
          ...formData.categories.flatMap(cat => {
            const numQuestions = parseInt(cat.weight) || 1;
            return Array.from({ length: numQuestions }, (_, index) => ({
              id: `q_${cat.id}_${index + 1}`,
              category: cat.id,
              text: `¿Cómo evalúas tu ${cat.name.toLowerCase()}? (Pregunta ${index + 1})`,
              weight: 1,
              type: 'scale',
              isNegative: false
            }));
          })
        ],
        scoring: {
          method: 'weighted_average',
          rules: {}
        },
        status: 'draft'
      };

      console.log('[TestEditor] Form data:', formData);
      console.log('[TestEditor] Test definition to save:', testDefinition);

      // Forzar uso del servicio demo si estamos en modo demo
      const demoMode = isDemoMode();
      console.log('[TestEditor] Demo mode:', demoMode);
      
      let result;

      if (demoMode) {
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
      } else {
        console.log('[TestEditor] Using real service');
        if (mode === 'edit') {
          // Actualizar test existente con servicio real
          result = await updateTest(
            activeOrgId, 
            formData.testId, 
            testData?.version || 'v1', 
            testDefinition
          );
        } else {
          // Crear nuevo test con servicio real
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
        <div className="form-section">
          <h3>{mode === 'edit' ? 'Editar Test' : 'Información Básica'}</h3>
          
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

        <div className="form-section">
          <h3>Escala de Evaluación</h3>
          
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

        {/* Sección de Configuración de Visibilidad */}
        <div className="form-section">
          <h3>Configuración de Visibilidad</h3>
          <p className="section-description">
            Define quién puede acceder y tomar este test de evaluación.
          </p>
          
          <div className="visibility-options">
            <div className="visibility-option">
              <label className="visibility-label">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  disabled={isSubmitting}
                  className="visibility-radio"
                />
                <div className="visibility-card">
                  <div className="visibility-header">
                    <span className="visibility-icon">🏢</span>
                    <span className="visibility-title">Privado - Organizaciones Específicas</span>
                  </div>
                  <div className="visibility-description">
                    {isSuperAdmin 
                      ? 'Solo las organizaciones que selecciones podrán ver y usar este test.' 
                      : 'Solo los miembros de organizaciones específicas pueden ver y tomar este test.'
                    }
                  </div>
                  <div className="visibility-features">
                    <span className="feature-tag">Restringido</span>
                    <span className="feature-tag">Seguro</span>
                    <span className="feature-tag">Controlado</span>
                  </div>
                </div>
              </label>
            </div>
            
            <div className="visibility-option">
              <label className="visibility-label">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  disabled={isSubmitting}
                  className="visibility-radio"
                />
                <div className="visibility-card">
                  <div className="visibility-header">
                    <span className="visibility-icon">🌍</span>
                    <span className="visibility-title">Público - Acceso Libre</span>
                  </div>
                  <div className="visibility-description">
                    Cualquier persona puede encontrar y tomar este test.
                    Ideal para evaluaciones abiertas, investigación o demostraciones.
                  </div>
                  <div className="visibility-features">
                    <span className="feature-tag">Abierto</span>
                    <span className="feature-tag">Global</span>
                    <span className="feature-tag">Investigación</span>
                  </div>
                </div>
              </label>
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

        <div className="form-section">
          <h3>Categorías</h3>
          <p className="section-description">
            Define las categorías de evaluación. El peso se usa para generar preguntas automáticas 
            si no agregas preguntas personalizadas en la sección siguiente.
          </p>
          
          {formData.categories.map((category, index) => {
            const hasCustomQuestions = getQuestionsForCategory(category.id).length > 0;
            
            return (
              <div key={index} className="category-item">
                <div className="category-header">
                  <div className="category-name-container">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                      placeholder="Nombre de categoría"
                      disabled={isSubmitting}
                    />
                    {hasCustomQuestions && (
                      <span className="custom-questions-indicator" title="Tiene preguntas personalizadas">
                        ✏️
                      </span>
                    )}
                  </div>
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleCategoryChange(index, 'color', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {/* Campo oculto para mantener el peso por defecto */}
                  <input
                    type="hidden"
                    value={category.weight}
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    disabled={formData.categories.length <= 1 || isSubmitting}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
                <div className="category-description-container">
                  <textarea
                    value={category.description}
                    onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                    placeholder="Descripción opcional de la categoría (ej: habilidades de liderazgo, comunicación efectiva, etc.)"
                    disabled={isSubmitting}
                    rows={2}
                    className="category-description-input"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addCategory}
            disabled={isSubmitting}
            className="btn-add-category"
          >
            + Añadir Categoría
          </button>
        </div>

        {/* Sección de Preguntas Personalizadas con Navegación Mejorada */}
        <div className="form-section">
          <div className="questions-header">
            <h3>Preguntas Personalizadas</h3>
            <div className="questions-summary">
              <span className="total-questions">
                Total: {getTotalQuestions()} preguntas
              </span>
            </div>
          </div>
          <p className="section-description">
            Agrega preguntas específicas para cada categoría. Si no agregas preguntas personalizadas, 
            se generarán automáticamente según el peso de cada categoría.
          </p>
          
          <div className="questions-editor">
            {/* Sidebar de Categorías */}
            <div className="categories-sidebar">
              <div className="sidebar-header">
                <h4>Categorías</h4>
              </div>
              <div className="categories-list">
                {formData.categories.map((category) => {
                  const categoryQuestions = getQuestionsForCategory(category.id);
                  const negativeQuestions = categoryQuestions.filter(q => q.isNegative).length;
                  const isActive = category.id === activeCategoryId;
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`category-tab ${isActive ? 'active' : ''}`}
                      style={{ 
                        borderLeftColor: category.color,
                        backgroundColor: isActive ? `${category.color}15` : 'transparent'
                      }}
                    >
                      <div className="category-tab-content">
                        <div className="category-tab-header">
                          <span 
                            className="category-color-dot"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="category-name">{category.name}</span>
                          <span className="questions-count">{categoryQuestions.length}</span>
                          {negativeQuestions > 0 && (
                            <span className="negative-indicator" title={`${negativeQuestions} pregunta(s) negativa(s)`}>
                              ↻
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <div className="category-description-small">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Principal de Preguntas */}
            <div className="questions-panel">
              {activeCategoryId && (() => {
                const activeCategory = getActiveCategory();
                const categoryQuestions = getQuestionsForCategory(activeCategoryId);
                
                return (
                  <div className="category-questions-panel">
                    <div className="panel-header">
                      <div className="panel-title">
                        <span 
                          className="category-icon"
                          style={{ color: activeCategory.color }}
                        >
                          ●
                        </span>
                        <h4 style={{ color: activeCategory.color }}>
                          {activeCategory.name}
                        </h4>
                        <span className="questions-count-badge">
                          {categoryQuestions.length} preguntas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addCustomQuestion(activeCategoryId)}
                        disabled={isSubmitting}
                        className="btn-add-question-primary"
                      >
                        + Agregar Pregunta
                      </button>
                    </div>
                    
                    {activeCategory.description && (
                      <div className="category-description-panel">
                        {activeCategory.description}
                      </div>
                    )}
                    
                    <div className="questions-list">
                      {categoryQuestions.map((question, questionIndex) => (
                        <div 
                          key={question.id} 
                          className={`question-item ${question.isNegative ? 'question-negative' : 'question-positive'}`}
                        >
                          <div className="question-content">
                            <div className="question-header">
                              <div className="question-header-left">
                                <span 
                                  className={`question-status-indicator ${question.isNegative ? 'negative' : 'positive'}`}
                                  title={question.isNegative ? 'Pregunta Negativa' : 'Pregunta Positiva'}
                                >
                                  {question.isNegative ? '↻' : '✓'}
                                </span>
                                <span className="question-number">
                                  Pregunta {questionIndex + 1}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomQuestion(question.id)}
                                disabled={isSubmitting}
                                className="btn-remove-question"
                              >
                                ✕
                              </button>
                            </div>
                            <textarea
                              value={question.text}
                              onChange={(e) => updateCustomQuestion(question.id, 'text', e.target.value)}
                              placeholder={`Pregunta para ${activeCategory.name.toLowerCase()}...`}
                              disabled={isSubmitting}
                              rows={3}
                              className="question-text"
                            />
                            <div className="question-settings">
                              <div className="negative-toggle">
                                <label className="toggle-label">
                                  <input
                                    type="checkbox"
                                    checked={question.isNegative || false}
                                    onChange={(e) => updateCustomQuestion(question.id, 'isNegative', e.target.checked)}
                                    disabled={isSubmitting}
                                    className="toggle-input"
                                  />
                                  <span className={`toggle-slider ${question.isNegative ? 'toggle-negative' : 'toggle-positive'}`}></span>
                                  <span className="toggle-text">
                                    {question.isNegative ? 'Pregunta Negativa' : 'Pregunta Positiva'}
                                  </span>
                                </label>
                                <span className="toggle-description">
                                  {question.isNegative 
                                    ? 'Esta pregunta se valorará al revés (5→1, 4→2, etc.)' 
                                    : 'Esta pregunta se valorará normalmente (1→1, 5→5)'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {categoryQuestions.length === 0 && (
                        <div className="no-questions">
                          <div className="no-questions-content">
                            <span className="no-questions-icon">❓</span>
                            <h5>No hay preguntas personalizadas</h5>
                            <p>Agrega preguntas específicas para esta categoría o déjala vacía para usar preguntas automáticas.</p>
                            <button
                              type="button"
                              onClick={() => addCustomQuestion(activeCategoryId)}
                              disabled={isSubmitting}
                              className="btn-add-first-question"
                            >
                              + Agregar Primera Pregunta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
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
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (mode === 'edit' ? 'Guardando...' : 'Creando...') : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Test')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestEditor;
