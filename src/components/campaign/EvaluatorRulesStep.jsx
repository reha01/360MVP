/**
 * Paso 4: Reglas de Evaluadores
 * SOLUCIÓN SIMPLIFICADA: Formulario simple sin componentes complejos
 */

import React, { useState, useRef, useEffect } from 'react';

const EvaluatorRulesStep = ({ data, onChange }) => {
  const [rules, setRules] = useState({
    requiredEvaluators: data.config?.requiredEvaluators || {
      self: true,
      manager: true,
      peers: { min: 3, max: 5 },
      subordinates: { min: 0 },
      external: { min: 0 }
    },
    anonymityThresholds: data.config?.anonymityThresholds || {
      peers: 3,
      subordinates: 3,
      external: 1
    }
  });
  
  // Flag para prevenir callbacks durante mount
  const isReadyRef = useRef(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true;
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Notificar cambios al padre (solo cuando está listo)
  useEffect(() => {
    if (!isReadyRef.current || !onChange) return;
    
    const timer = setTimeout(() => {
      if (isReadyRef.current && onChange) {
        onChange({
          config: {
            ...data.config,
            requiredEvaluators: rules.requiredEvaluators,
            anonymityThresholds: rules.anonymityThresholds
          }
        });
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [rules, onChange, data.config]);
  
  const handleRuleChange = (field, value) => {
    if (field.startsWith('requiredEvaluators.')) {
      const ruleField = field.replace('requiredEvaluators.', '');
      if (ruleField.includes('.')) {
        const [parent, child] = ruleField.split('.');
        setRules(prev => ({
          ...prev,
          requiredEvaluators: {
            ...prev.requiredEvaluators,
            [parent]: {
              ...prev.requiredEvaluators[parent],
              [child]: value
            }
          }
        }));
      } else {
        setRules(prev => ({
          ...prev,
          requiredEvaluators: {
            ...prev.requiredEvaluators,
            [ruleField]: value
          }
        }));
      }
    } else if (field.startsWith('anonymityThresholds.')) {
      const thresholdField = field.replace('anonymityThresholds.', '');
      setRules(prev => ({
        ...prev,
        anonymityThresholds: {
          ...prev.anonymityThresholds,
          [thresholdField]: value
        }
      }));
    }
  };
  
  // Estilos inline simples
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    marginBottom: '16px'
  };
  
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px'
  };
  
  return (
    <div style={{ padding: '0' }}>
      {/* Reglas de Evaluadores Requeridos */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Evaluadores Requeridos
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Autoevaluación */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Autoevaluación</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>El evaluado debe completar su propia evaluación</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rules.requiredEvaluators.self}
                onChange={(e) => handleRuleChange('requiredEvaluators.self', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
            </label>
          </div>
          
          {/* Manager */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Manager Directo</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>El manager directo debe evaluar al empleado</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rules.requiredEvaluators.manager}
                onChange={(e) => handleRuleChange('requiredEvaluators.manager', e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
            </label>
          </div>
          
          {/* Pares */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Pares</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Colegas del mismo nivel jerárquico</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Mínimo</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={rules.requiredEvaluators.peers.min}
                  onChange={(e) => handleRuleChange('requiredEvaluators.peers.min', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Máximo</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={rules.requiredEvaluators.peers.max}
                  onChange={(e) => handleRuleChange('requiredEvaluators.peers.max', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
          
          {/* Subordinados */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Subordinados</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Empleados que reportan directamente al evaluado</div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Mínimo</label>
              <input
                type="number"
                min="0"
                max="15"
                value={rules.requiredEvaluators.subordinates.min}
                onChange={(e) => handleRuleChange('requiredEvaluators.subordinates.min', parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </div>
          
          {/* Externos */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>Evaluadores Externos</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Clientes, proveedores, socios externos</div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Mínimo</label>
              <input
                type="number"
                min="0"
                max="5"
                value={rules.requiredEvaluators.external.min}
                onChange={(e) => handleRuleChange('requiredEvaluators.external.min', parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Umbrales de Anonimato */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Umbrales de Anonimato
        </h3>
        
        <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#1E40AF' }}>
            Los umbrales de anonimato determinan cuántos evaluadores deben completar la evaluación para que los resultados sean visibles. Esto protege la privacidad de los evaluadores.
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Pares */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>Pares</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Mínimo de pares que deben completar</div>
            <input
              type="number"
              min="1"
              max="10"
              value={rules.anonymityThresholds.peers}
              onChange={(e) => handleRuleChange('anonymityThresholds.peers', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </div>
          
          {/* Subordinados */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>Subordinados</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Mínimo de subordinados que deben completar</div>
            <input
              type="number"
              min="1"
              max="15"
              value={rules.anonymityThresholds.subordinates}
              onChange={(e) => handleRuleChange('anonymityThresholds.subordinates', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </div>
          
          {/* Externos */}
          <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
            <div style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>Externos</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Mínimo de externos que deben completar</div>
            <input
              type="number"
              min="1"
              max="5"
              value={rules.anonymityThresholds.external}
              onChange={(e) => handleRuleChange('anonymityThresholds.external', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      
      {/* Resumen de Reglas */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Resumen de Reglas
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>Autoevaluación</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px',
              backgroundColor: rules.requiredEvaluators.self ? '#D1FAE5' : '#F3F4F6',
              color: rules.requiredEvaluators.self ? '#065F46' : '#374151'
            }}>
              {rules.requiredEvaluators.self ? 'Requerida' : 'Opcional'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>Manager Directo</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px',
              backgroundColor: rules.requiredEvaluators.manager ? '#D1FAE5' : '#F3F4F6',
              color: rules.requiredEvaluators.manager ? '#065F46' : '#374151'
            }}>
              {rules.requiredEvaluators.manager ? 'Requerido' : 'Opcional'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>Pares</span>
            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
              {rules.requiredEvaluators.peers.min}-{rules.requiredEvaluators.peers.max}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>Subordinados</span>
            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
              {rules.requiredEvaluators.subordinates.min}+
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
            <span style={{ fontWeight: '500', color: '#111827' }}>Externos</span>
            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#FED7AA', color: '#9A3412' }}>
              {rules.requiredEvaluators.external.min}+
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorRulesStep;
