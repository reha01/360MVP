/**
 * Paso 4: Reglas de Evaluadores
 */

import React, { useState, useEffect } from 'react';
import { Users, Shield, Clock, AlertCircle } from 'lucide-react';
import { Button, Card, Input, Checkbox, Alert } from '../ui';

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
  
  // Notificar cambios al padre
  useEffect(() => {
    onChange({
      config: {
        ...data.config,
        requiredEvaluators: rules.requiredEvaluators,
        anonymityThresholds: rules.anonymityThresholds
      }
    });
  }, [rules, onChange]);
  
  const handleRuleChange = (field, value) => {
    if (field.startsWith('requiredEvaluators.')) {
      const ruleField = field.replace('requiredEvaluators.', '');
      setRules(prev => ({
        ...prev,
        requiredEvaluators: {
          ...prev.requiredEvaluators,
          [ruleField]: value
        }
      }));
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
  
  const handleNestedRuleChange = (parentField, childField, value) => {
    setRules(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: {
          ...prev[parentField][childField],
          [childField]: value
        }
      }
    }));
  };
  
  return (
    <div className="space-y-6">
      {/* Reglas de Evaluadores Requeridos */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Evaluadores Requeridos
          </h3>
          
          <div className="space-y-6">
            {/* Autoevaluación */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Autoevaluación</div>
                <div className="text-sm text-gray-600">
                  El evaluado debe completar su propia evaluación
                </div>
              </div>
              <Checkbox
                checked={rules.requiredEvaluators.self}
                onChange={(checked) => handleRuleChange('requiredEvaluators.self', checked)}
              />
            </div>
            
            {/* Manager */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Manager Directo</div>
                <div className="text-sm text-gray-600">
                  El manager directo debe evaluar al empleado
                </div>
              </div>
              <Checkbox
                checked={rules.requiredEvaluators.manager}
                onChange={(checked) => handleRuleChange('requiredEvaluators.manager', checked)}
              />
            </div>
            
            {/* Pares */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">Pares</div>
                  <div className="text-sm text-gray-600">
                    Colegas del mismo nivel jerárquico
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={rules.requiredEvaluators.peers.min}
                    onChange={(e) => handleRuleChange('requiredEvaluators.peers.min', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={rules.requiredEvaluators.peers.max}
                    onChange={(e) => handleRuleChange('requiredEvaluators.peers.max', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
            
            {/* Subordinados */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">Subordinados</div>
                  <div className="text-sm text-gray-600">
                    Empleados que reportan directamente al evaluado
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={rules.requiredEvaluators.subordinates.min}
                  onChange={(e) => handleRuleChange('requiredEvaluators.subordinates.min', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            {/* Externos */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">Evaluadores Externos</div>
                  <div className="text-sm text-gray-600">
                    Clientes, proveedores, socios externos
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={rules.requiredEvaluators.external.min}
                  onChange={(e) => handleRuleChange('requiredEvaluators.external.min', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Umbrales de Anonimato */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Umbrales de Anonimato
          </h3>
          
          <div className="space-y-4">
            <Alert type="info">
              <Shield className="w-4 h-4" />
              <Alert.Description>
                Los umbrales de anonimato determinan cuántos evaluadores deben completar la evaluación
                para que los resultados sean visibles. Esto protege la privacidad de los evaluadores.
              </Alert.Description>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pares */}
              <div className="p-4 border rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Pares</div>
                <div className="text-sm text-gray-600 mb-3">
                  Mínimo de pares que deben completar
                </div>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={rules.anonymityThresholds.peers}
                  onChange={(e) => handleRuleChange('anonymityThresholds.peers', parseInt(e.target.value))}
                />
              </div>
              
              {/* Subordinados */}
              <div className="p-4 border rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Subordinados</div>
                <div className="text-sm text-gray-600 mb-3">
                  Mínimo de subordinados que deben completar
                </div>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={rules.anonymityThresholds.subordinates}
                  onChange={(e) => handleRuleChange('anonymityThresholds.subordinates', parseInt(e.target.value))}
                />
              </div>
              
              {/* Externos */}
              <div className="p-4 border rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Externos</div>
                <div className="text-sm text-gray-600 mb-3">
                  Mínimo de externos que deben completar
                </div>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={rules.anonymityThresholds.external}
                  onChange={(e) => handleRuleChange('anonymityThresholds.external', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Resumen de Reglas */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Resumen de Reglas
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Autoevaluación</span>
              <span className={`px-2 py-1 rounded text-sm ${rules.requiredEvaluators.self ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {rules.requiredEvaluators.self ? 'Requerida' : 'Opcional'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Manager Directo</span>
              <span className={`px-2 py-1 rounded text-sm ${rules.requiredEvaluators.manager ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {rules.requiredEvaluators.manager ? 'Requerido' : 'Opcional'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Pares</span>
              <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {rules.requiredEvaluators.peers.min}-{rules.requiredEvaluators.peers.max}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Subordinados</span>
              <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-800">
                {rules.requiredEvaluators.subordinates.min}+
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Externos</span>
              <span className="px-2 py-1 rounded text-sm bg-orange-100 text-orange-800">
                {rules.requiredEvaluators.external.min}+
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EvaluatorRulesStep;
