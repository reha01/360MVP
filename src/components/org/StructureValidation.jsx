/**
 * Componente para validar la estructura organizacional completa
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button, Alert, Card } from '../ui';
import orgStructureService from '../../services/orgStructureService';

const StructureValidation = ({ isOpen, onClose, orgId }) => {
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [error, setError] = useState(null);
  
  const runValidation = async () => {
    if (!orgId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await orgStructureService.validateOrgStructure(orgId);
      setValidationResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && orgId) {
      runValidation();
    }
  }, [isOpen, orgId]);
  
  const getIssueIcon = (type) => {
    switch (type) {
      case 'manager_cycles':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'orphan_areas':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getIssueTitle = (type) => {
    switch (type) {
      case 'manager_cycles':
        return 'Relaciones Circulares de Manager';
      case 'orphan_areas':
        return 'Áreas Huérfanas';
      default:
        return 'Problema de Estructura';
    }
  };
  
  const getIssueDescription = (type) => {
    switch (type) {
      case 'manager_cycles':
        return 'Se detectaron relaciones circulares en la jerarquía de managers. Esto puede causar problemas en las evaluaciones 360°.';
      case 'orphan_areas':
        return 'Hay áreas que referencian un área padre que no existe. Esto puede causar problemas en la navegación y reportes.';
      default:
        return 'Problema detectado en la estructura organizacional.';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Validación de Estructura
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Error */}
          {error && (
            <Alert type="error" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
          
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Validando estructura...</span>
            </div>
          )}
          
          {/* Results */}
          {validationResults && !loading && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {validationResults.isValid ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span className="font-semibold text-gray-900">
                    {validationResults.isValid ? 'Estructura Válida' : 'Problemas Detectados'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {validationResults.issues.length} problema(s) encontrado(s)
                </div>
              </div>
              
              {/* Issues */}
              {validationResults.issues.length > 0 ? (
                <div className="space-y-4">
                  {validationResults.issues.map((issue, index) => (
                    <Card key={index}>
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {getIssueTitle(issue.type)}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {getIssueDescription(issue.type)}
                            </p>
                            
                            {/* Issue Details */}
                            {issue.type === 'manager_cycles' && issue.cycles && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-800">
                                  Ciclos detectados:
                                </h4>
                                {issue.cycles.map((cycle, cycleIndex) => (
                                  <div key={cycleIndex} className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                                    <div className="font-medium">Ciclo {cycleIndex + 1}:</div>
                                    <div className="text-red-600">
                                      {cycle.join(' → ')} → {cycle[0]}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {issue.type === 'orphan_areas' && issue.areas && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-800">
                                  Áreas huérfanas:
                                </h4>
                                {issue.areas.map((area, areaIndex) => (
                                  <div key={areaIndex} className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                                    <div className="font-medium">{area.name}</div>
                                    <div className="text-yellow-600">
                                      Referencia a área padre inexistente: {area.parentId}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Estructura Válida!
                    </h3>
                    <p className="text-gray-600">
                      No se encontraron problemas en la estructura organizacional.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </Button>
            <Button
              onClick={runValidation}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Revalidar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructureValidation;
