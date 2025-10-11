/**
 * Componente de Gestión Unificada de Test
 * 
 * Combina la gestión de categorías, subdimensiones y preguntas
 * en una sola interfaz con navegación tipo sidebar
 */

import React, { useState, useEffect } from 'react';

const UnifiedTestManagement = ({ 
  formData, 
  setFormData, 
  isSubmitting,
  handleCategoryChange,
  handleConditionalRuleChange,
  updateSubdimension,
  addSubdimension,
  removeSubdimension,
  getQuestionsForCategory,
  getQuestionsForSubdimension,
  addCustomQuestion,
  updateCustomQuestion,
  removeCustomQuestion,
  getQuestionText,
  getOperatorText,
  addCategory,
  removeCategory
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubdimensionId, setSelectedSubdimensionId] = useState(null);
  const [collapsedSubdimensions, setCollapsedSubdimensions] = useState(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Seleccionar automáticamente la primera categoría
  useEffect(() => {
    if (formData.categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(formData.categories[0].id);
    }
  }, [formData.categories, selectedCategoryId]);

  const toggleSubdimensionCollapse = (subdimensionId) => {
    const newCollapsed = new Set(collapsedSubdimensions);
    if (newCollapsed.has(subdimensionId)) {
      newCollapsed.delete(subdimensionId);
    } else {
      newCollapsed.add(subdimensionId);
    }
    setCollapsedSubdimensions(newCollapsed);
  };

  const toggleCategoryCollapse = (categoryId) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubdimensionId(null); // Reset subdimension selection when changing category
  };

  const handleSubdimensionSelect = (subdimensionId) => {
    setSelectedSubdimensionId(subdimensionId);
  };

  return (
    <div className="unified-test-management">
      {/* Sidebar Expandido con Navegación Jerárquica */}
      <div className="hierarchical-sidebar">
        <div className="sidebar-header">
          <h4>Estructura del Test</h4>
          <button
            type="button"
            onClick={addCategory}
            disabled={isSubmitting}
            className="btn-add-category-sidebar"
          >
            + Nueva Categoría
          </button>
        </div>
        
        <div className="hierarchical-navigation">
          {formData.categories.map((category, catIndex) => {
            const hasCustomQuestions = getQuestionsForCategory(category.id).length > 0;
            const isCategorySelected = selectedCategoryId === category.id;
            const isCategoryCollapsed = collapsedCategories.has(category.id);
            const subdimensions = category.subdimensions || [];
            
            return (
              <div key={category.id} className="category-section">
                {/* Header de Categoría */}
                <div 
                  className={`category-header-hierarchical ${isCategorySelected ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="category-header-left">
                    <button
                      type="button"
                      className="collapse-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryCollapse(category.id);
                      }}
                    >
                      <span className="collapse-icon">
                        {isCategoryCollapsed ? '▶' : '▼'}
                      </span>
                    </button>
                    <div className="category-indicator" style={{ backgroundColor: category.color }}></div>
                    <div className="category-info">
                      <span className="category-name">{category.name}</span>
                      <div className="category-stats">
                        <span className="subdimensions-count">
                          {subdimensions.length} subdimensión(es)
                        </span>
                        {hasCustomQuestions && (
                          <span className="questions-indicator" title="Tiene preguntas personalizadas">
                            ✏️
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="category-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addSubdimension(category.id);
                      }}
                      disabled={isSubmitting}
                      className="btn-add-subdimension-small"
                      title="Agregar subdimensión"
                    >
                      + Sub
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(catIndex);
                      }}
                      disabled={formData.categories.length <= 1 || isSubmitting}
                      className="btn-remove-category"
                      title="Eliminar categoría"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Lista de Subdimensiones (expandible) */}
                {!isCategoryCollapsed && subdimensions.length > 0 && (
                  <div className="subdimensions-list-hierarchical">
                    {subdimensions.map((subdim) => {
                      const subdimQuestions = getQuestionsForSubdimension(category.id, subdim.id);
                      const isSubdimSelected = selectedCategoryId === category.id && selectedSubdimensionId === subdim.id;
                      
                      return (
                        <div
                          key={subdim.id}
                          className={`subdimension-item-hierarchical ${isSubdimSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleCategorySelect(category.id);
                            handleSubdimensionSelect(subdim.id);
                          }}
                        >
                          <div className="subdimension-info">
                            <span className="subdimension-name">{subdim.name}</span>
                            <div className="subdimension-meta">
                              <span className="questions-count">
                                {subdimQuestions.length} pregunta(s)
                              </span>
                              {subdim.weight > 1 && (
                                <span className="weight-badge">Peso: {subdim.weight}</span>
                              )}
                            </div>
                          </div>
                          <div className="subdimension-actions">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addCustomQuestion(category.id, subdim.id);
                              }}
                              disabled={isSubmitting}
                              className="btn-add-question-small"
                              title="Agregar pregunta"
                            >
                              + P
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSubdimension(category.id, subdim.id);
                              }}
                              disabled={subdimensions.length <= 1 || isSubmitting}
                              className="btn-remove-subdimension"
                              title="Eliminar subdimensión"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel Principal Expandido */}
      <div className="expanded-details-panel">
        {selectedCategoryId ? (
          (() => {
            const category = formData.categories.find(cat => cat.id === selectedCategoryId);
            const catIndex = formData.categories.findIndex(cat => cat.id === selectedCategoryId);
            const subdimensions = category?.subdimensions || [];
            
            // Si hay una subdimensión seleccionada, mostrar solo esa
            if (selectedSubdimensionId) {
              const selectedSubdim = subdimensions.find(sub => sub.id === selectedSubdimensionId);
              const subdimQuestions = getQuestionsForSubdimension(selectedCategoryId, selectedSubdimensionId);
              
              return (
                <div className="subdimension-details">
                  {/* Breadcrumb */}
                  <div className="breadcrumb">
                    <span 
                      className="breadcrumb-item clickable"
                      onClick={() => setSelectedSubdimensionId(null)}
                    >
                      {category.name}
                    </span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-item active">{selectedSubdim.name}</span>
                  </div>

                  {/* Header de Subdimensión */}
                  <div className="subdimension-details-header">
                    <div className="subdimension-title-section">
                      <input
                        type="text"
                        value={selectedSubdim.name}
                        onChange={(e) => updateSubdimension(selectedCategoryId, selectedSubdimensionId, 'name', e.target.value)}
                        placeholder="Nombre de subdimensión"
                        disabled={isSubmitting}
                        className="subdimension-name-input-large"
                      />
                      <div className="subdimension-weight-section">
                        <label>Peso:</label>
                        <select
                          value={selectedSubdim.weight || 1}
                          onChange={(e) => updateSubdimension(selectedCategoryId, selectedSubdimensionId, 'weight', parseInt(e.target.value))}
                          disabled={isSubmitting}
                          className="subdimension-weight-select-large"
                        >
                          <option value={1}>1 - Normal</option>
                          <option value={2}>2 - Medio</option>
                          <option value={3}>3 - Alto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Descripción de Subdimensión */}
                  <div className="subdimension-description-section">
                    <label>Descripción de la subdimensión</label>
                    <textarea
                      value={selectedSubdim.description}
                      onChange={(e) => updateSubdimension(selectedCategoryId, selectedSubdimensionId, 'description', e.target.value)}
                      placeholder="Descripción opcional de la subdimensión (ej: habilidades específicas, comportamientos observables, etc.)"
                      disabled={isSubmitting}
                      rows={1}
                      className="subdimension-description-textarea"
                    />
                  </div>

                  {/* Preguntas de la Subdimensión */}
                  <div className="questions-management-section">
                    <div className="questions-section-header">
                      <h4>Preguntas de esta Subdimensión</h4>
                      <button
                        type="button"
                        onClick={() => addCustomQuestion(selectedCategoryId, selectedSubdimensionId)}
                        disabled={isSubmitting}
                        className="btn-add-question-large"
                      >
                        + Agregar Pregunta
                      </button>
                    </div>

                    <div className="questions-grid">
                      {subdimQuestions.length === 0 ? (
                        <div className="no-questions-message-large">
                          <div className="no-questions-icon">❓</div>
                          <h5>No hay preguntas en esta subdimensión</h5>
                          <p>Haz clic en "+ Agregar Pregunta" para crear la primera pregunta de esta subdimensión.</p>
                        </div>
                      ) : (
                        subdimQuestions.map((question) => (
                          <div key={question.id} className="question-card">
                            <div className="question-card-header">
                              <div className="question-id">
                                {question.id}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomQuestion(question.id)}
                                disabled={isSubmitting}
                                className="btn-remove-question-card"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="question-content-card">
                              <textarea
                                value={question.text}
                                onChange={(e) => updateCustomQuestion(question.id, 'text', e.target.value)}
                                placeholder="Texto de la pregunta..."
                                disabled={isSubmitting}
                                rows={3}
                                className="question-text-input-card"
                              />
                            </div>
                            
                            <div className="question-settings-card">
                              <div className="question-setting-row">
                                <label className="negative-toggle-label-card">
                                  <input
                                    type="checkbox"
                                    checked={question.isNegative || false}
                                    onChange={(e) => updateCustomQuestion(question.id, 'isNegative', e.target.checked)}
                                    disabled={isSubmitting}
                                    className="negative-toggle-card"
                                  />
                                  <span className="negative-toggle-text">
                                    Pregunta negativa
                                  </span>
                                </label>
                                
                                <div className="weight-buttons-card">
                                  <span className="weight-label">Peso:</span>
                                  <div className="weight-button-group">
                                    {[1, 2, 3].map((weight) => (
                                      <button
                                        key={weight}
                                        type="button"
                                        onClick={() => updateCustomQuestion(question.id, 'weight', weight)}
                                        disabled={isSubmitting}
                                        className={`weight-btn-card ${(question.weight || 1) === weight ? 'active' : ''}`}
                                        title={`Peso ${weight}: ${weight === 1 ? 'Normal' : weight === 2 ? 'Medio' : 'Alto'}`}
                                      >
                                        {weight}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Si no hay subdimensión seleccionada, mostrar la categoría completa
            return (
              <div className="category-details">
                {/* Header de Categoría */}
                <div className="category-details-header">
                  <div className="category-title-section">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => handleCategoryChange(catIndex, 'name', e.target.value)}
                      placeholder="Nombre de categoría"
                      disabled={isSubmitting}
                      className="category-name-input-large"
                    />
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => handleCategoryChange(catIndex, 'color', e.target.value)}
                      disabled={isSubmitting}
                      className="category-color-input"
                    />
                  </div>
                </div>

                {/* Descripción de Categoría */}
                <div className="category-description-section">
                  <label>Descripción de la categoría</label>
                  <textarea
                    value={category.description}
                    onChange={(e) => handleCategoryChange(catIndex, 'description', e.target.value)}
                    placeholder="Descripción opcional de la categoría (ej: habilidades de liderazgo, comunicación efectiva, etc.)"
                    disabled={isSubmitting}
                    rows={3}
                    className="category-description-textarea"
                  />
                </div>

                {/* Configuración Condicional */}
                <div className="conditional-config-section">
                  <div className="conditional-toggle">
                    <label className="conditional-toggle-label">
                      <input
                        type="checkbox"
                        checked={category.isConditional || false}
                        onChange={(e) => handleCategoryChange(catIndex, 'isConditional', e.target.checked)}
                        disabled={isSubmitting}
                        className="conditional-checkbox"
                      />
                      <span className="conditional-toggle-text">
                        Esta categoría es condicional
                      </span>
                    </label>
                    <span className="conditional-description">
                      Si está marcada, la categoría se excluirá del scoring cuando se cumpla una condición específica.
                    </span>
                  </div>
                  
                  {category.isConditional && (
                    <div className="conditional-rule-config">
                      <h5>Regla Condicional</h5>
                      <div className="conditional-rule-fields">
                        <div className="rule-field">
                          <label>Si la pregunta:</label>
                          <select
                            value={category.conditionalRule?.condition?.questionId || ''}
                            onChange={(e) => handleConditionalRuleChange(catIndex, 'questionId', e.target.value)}
                            disabled={isSubmitting}
                            className="rule-select"
                          >
                            <option value="">Seleccionar pregunta...</option>
                            {formData.customQuestions.map((question) => (
                              <option key={question.id} value={question.id}>
                                {question.id}: {question.text || 'Pregunta sin texto'}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="rule-field">
                          <label>Tiene respuesta:</label>
                          <select
                            value={category.conditionalRule?.condition?.operator || 'equals'}
                            onChange={(e) => handleConditionalRuleChange(catIndex, 'operator', e.target.value)}
                            disabled={isSubmitting}
                            className="rule-select"
                          >
                            <option value="equals">Igual a</option>
                            <option value="not_equals">Diferente de</option>
                            <option value="greater_than">Mayor que</option>
                            <option value="less_than">Menor que</option>
                          </select>
                        </div>
                        
                        <div className="rule-field">
                          <label>Valor:</label>
                          <input
                            type="text"
                            value={category.conditionalRule?.condition?.value || ''}
                            onChange={(e) => handleConditionalRuleChange(catIndex, 'value', e.target.value)}
                            placeholder="No, Sí, 1, 5, etc."
                            disabled={isSubmitting}
                            className="rule-input"
                          />
                        </div>
                        
                        <div className="rule-field">
                          <label>Entonces:</label>
                          <select
                            value={category.conditionalRule?.action || 'exclude_from_scoring'}
                            onChange={(e) => handleConditionalRuleChange(catIndex, 'action', e.target.value)}
                            disabled={isSubmitting}
                            className="rule-select"
                          >
                            <option value="exclude_from_scoring">Excluir del scoring</option>
                            <option value="mark_as_not_applicable">Marcar como No Aplica</option>
                          </select>
                        </div>
                      </div>
                      
                      {category.conditionalRule?.condition?.questionId && (
                        <div className="conditional-preview">
                          <strong>Vista previa:</strong> Si "{getQuestionText(category.conditionalRule.condition.questionId)}" 
                          {getOperatorText(category.conditionalRule.condition.operator)} "{category.conditionalRule.condition.value}", 
                          entonces {category.conditionalRule.action === 'exclude_from_scoring' ? 'excluir' : 'marcar como no aplica'} 
                          la categoría "{category.name}".
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subdimensiones y Preguntas */}
                <div className="subdimensions-questions-section">
                  <div className="section-header">
                    <h4>Subdimensiones y Preguntas</h4>
                    <button
                      type="button"
                      onClick={() => addSubdimension(category.id)}
                      disabled={isSubmitting}
                      className="btn-add-subdimension"
                    >
                      + Añadir Subdimensión
                    </button>
                  </div>

                  <div className="subdimensions-container">
                    {subdimensions.map((subdim) => {
                      const subdimQuestions = getQuestionsForSubdimension(category.id, subdim.id);
                      const isCollapsed = collapsedSubdimensions.has(subdim.id);
                      
                      return (
                        <div key={subdim.id} className="subdimension-panel">
                          <div 
                            className="subdimension-panel-header"
                            onClick={() => toggleSubdimensionCollapse(subdim.id)}
                          >
                            <div className="subdimension-info">
                              <span className="collapse-icon">
                                {isCollapsed ? '▶' : '▼'}
                              </span>
                              <input
                                type="text"
                                value={subdim.name}
                                onChange={(e) => updateSubdimension(category.id, subdim.id, 'name', e.target.value)}
                                placeholder="Nombre de subdimensión"
                                disabled={isSubmitting}
                                className="subdimension-name-input"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="subdimension-weight-label">Peso:</span>
                              <select
                                value={subdim.weight || 1}
                                onChange={(e) => updateSubdimension(category.id, subdim.id, 'weight', parseInt(e.target.value))}
                                disabled={isSubmitting}
                                className="subdimension-weight-select"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                              </select>
                            </div>
                            <div className="subdimension-stats">
                              <span className="questions-count">
                                {subdimQuestions.length} pregunta(s)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSubdimension(category.id, subdim.id);
                                }}
                                disabled={subdimensions.length <= 1 || isSubmitting}
                                className="btn-remove-subdimension"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="subdimension-panel-content">
                              <div className="subdimension-description-container">
                                <textarea
                                  value={subdim.description}
                                  onChange={(e) => updateSubdimension(category.id, subdim.id, 'description', e.target.value)}
                                  placeholder="Descripción opcional de la subdimensión"
                                  disabled={isSubmitting}
                                  rows={2}
                                  className="subdimension-description-input"
                                />
                              </div>

                              <div className="questions-container">
                                <div className="questions-header">
                                  <h5>Preguntas</h5>
                                  <button
                                    type="button"
                                    onClick={() => addCustomQuestion(category.id, subdim.id)}
                                    disabled={isSubmitting}
                                    className="btn-add-question"
                                  >
                                    + Agregar Pregunta
                                  </button>
                                </div>

                                {subdimQuestions.length === 0 ? (
                                  <div className="no-questions-message">
                                    No hay preguntas en esta subdimensión. Haz clic en "+ Agregar Pregunta" para añadir una.
                                  </div>
                                ) : (
                                  <div className="questions-list">
                                    {subdimQuestions.map((question) => (
                                      <div key={question.id} className="question-item">
                                        <div className="question-content">
                                          <div className="question-id">
                                            {question.id}
                                          </div>
                                          <textarea
                                            value={question.text}
                                            onChange={(e) => updateCustomQuestion(question.id, 'text', e.target.value)}
                                            placeholder="Texto de la pregunta..."
                                            disabled={isSubmitting}
                                            rows={2}
                                            className="question-text-input"
                                          />
                                        </div>
                                        <div className="question-settings">
                                          <div className="settings-row">
                                            <label className="negative-toggle-label">
                                              <input
                                                type="checkbox"
                                                checked={question.isNegative || false}
                                                onChange={(e) => updateCustomQuestion(question.id, 'isNegative', e.target.checked)}
                                                disabled={isSubmitting}
                                                className="negative-toggle"
                                              />
                                              <span className="negative-toggle-text">
                                                Pregunta negativa
                                              </span>
                                            </label>
                                            <div className="weight-buttons">
                                              <span className="weight-label">Peso:</span>
                                              <div className="weight-button-group">
                                                {[1, 2, 3].map((weight) => (
                                                  <button
                                                    key={weight}
                                                    type="button"
                                                    onClick={() => updateCustomQuestion(question.id, 'weight', weight)}
                                                    disabled={isSubmitting}
                                                    className={`weight-btn ${(question.weight || 1) === weight ? 'active' : ''}`}
                                                    title={`Peso ${weight}: ${weight === 1 ? 'Normal' : weight === 2 ? 'Medio' : 'Alto'}`}
                                                  >
                                                    {weight}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
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
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="no-category-selected">
            <p>Selecciona una categoría del sidebar para editarla</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedTestManagement;
