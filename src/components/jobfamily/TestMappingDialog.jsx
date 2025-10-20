/**
 * Dialog para gestionar el mapeo de tests de una Job Family
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button, Alert, Card, Input, Select, Textarea } from '../ui';
import jobFamilyService from '../../services/jobFamilyService';
import { TEST_MAPPING_TYPES } from '../../models/JobFamily';

const TestMappingDialog = ({ isOpen, onClose, jobFamily, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [newTestMapping, setNewTestMapping] = useState({
    testId: '',
    testName: '',
    testVersion: '1.0',
    reason: '',
    priority: 1
  });
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Cargar tests disponibles
  useEffect(() => {
    if (isOpen && jobFamily) {
      loadAvailableTests();
    }
  }, [isOpen, jobFamily]);
  
  const loadAvailableTests = async () => {
    try {
      // En una implementación real, esto vendría de la API
      const tests = [
        { id: 'test1', name: 'Liderazgo Ejecutivo v3', version: '3.0' },
        { id: 'test2', name: 'Competencias Gerenciales v2', version: '2.0' },
        { id: 'test3', name: 'Habilidades de Comunicación v1', version: '1.0' },
        { id: 'test4', name: 'Gestión de Equipos v2', version: '2.0' },
        { id: 'test5', name: 'Pensamiento Estratégico v1', version: '1.0' }
      ];
      setAvailableTests(tests);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleAddRecommendedTest = async () => {
    if (!newTestMapping.testId) {
      setError('Selecciona un test');
      return;
    }
    
    setLoading(true);
    try {
      await jobFamilyService.addRecommendedTest(
        jobFamily.orgId,
        jobFamily.id,
        newTestMapping,
        'current-user-id' // En implementación real, usar userId del contexto
      );
      
      setNewTestMapping({
        testId: '',
        testName: '',
        testVersion: '1.0',
        reason: '',
        priority: 1
      });
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveRecommendedTest = async (testId) => {
    setLoading(true);
    try {
      await jobFamilyService.removeRecommendedTest(
        jobFamily.orgId,
        jobFamily.id,
        testId,
        'current-user-id'
      );
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAllowedTest = async (testId) => {
    setLoading(true);
    try {
      await jobFamilyService.addAllowedTest(
        jobFamily.orgId,
        jobFamily.id,
        testId,
        'current-user-id'
      );
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddExcludedTest = async (testId) => {
    setLoading(true);
    try {
      await jobFamilyService.addExcludedTest(
        jobFamily.orgId,
        jobFamily.id,
        testId,
        'current-user-id'
      );
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const getTestName = (testId) => {
    const test = availableTests.find(t => t.id === testId);
    return test ? test.name : testId;
  };
  
  const getTestVersion = (testId) => {
    const test = availableTests.find(t => t.id === testId);
    return test ? test.version : '1.0';
  };
  
  const getUnmappedTests = () => {
    const mappedTestIds = [
      ...(jobFamily.testMappings?.recommended || []).map(t => t.testId),
      ...(jobFamily.testMappings?.allowed || []),
      ...(jobFamily.testMappings?.excluded || [])
    ];
    
    return availableTests.filter(test => !mappedTestIds.includes(test.id));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Mapeo de Tests
              </h2>
              <p className="text-gray-600 mt-1">
                {jobFamily.name}
              </p>
            </div>
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
          
          {/* Tests Recomendados */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Tests Recomendados
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              {/* Formulario para agregar test recomendado */}
              {showAddForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test
                      </label>
                      <Select
                        value={newTestMapping.testId}
                        onValueChange={(value) => {
                          const test = availableTests.find(t => t.id === value);
                          setNewTestMapping(prev => ({
                            ...prev,
                            testId: value,
                            testName: test?.name || '',
                            testVersion: test?.version || '1.0'
                          }));
                        }}
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="Seleccionar test" />
                        </Select.Trigger>
                        <Select.Content>
                          {getUnmappedTests().map(test => (
                            <Select.Item key={test.id} value={test.id}>
                              {test.name} (v{test.version})
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newTestMapping.priority}
                        onChange={(e) => setNewTestMapping(prev => ({
                          ...prev,
                          priority: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón de la recomendación
                    </label>
                    <Textarea
                      value={newTestMapping.reason}
                      onChange={(e) => setNewTestMapping(prev => ({
                        ...prev,
                        reason: e.target.value
                      }))}
                      placeholder="Explica por qué este test es recomendado para esta Job Family..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddRecommendedTest}
                      disabled={loading}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Lista de tests recomendados */}
              <div className="space-y-2">
                {jobFamily.testMappings?.recommended?.length > 0 ? (
                  jobFamily.testMappings.recommended.map((test, index) => (
                    <div key={test.testId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {getTestName(test.testId)}
                          </span>
                          <span className="text-sm text-gray-500">
                            v{getTestVersion(test.testId)}
                          </span>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                            Prioridad {test.priority}
                          </span>
                        </div>
                        {test.reason && (
                          <p className="text-sm text-gray-600 mt-1">{test.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecommendedTest(test.testId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay tests recomendados configurados
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Tests Permitidos */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TestTube className="w-5 h-5 text-blue-600 mr-2" />
                Tests Permitidos
              </h3>
              
              <div className="space-y-2">
                {jobFamily.testMappings?.allowed?.length > 0 ? (
                  jobFamily.testMappings.allowed.map(testId => (
                    <div key={testId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {getTestName(testId)}
                        </span>
                        <span className="text-sm text-gray-500">
                          v{getTestVersion(testId)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddExcludedTest(testId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Excluir
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay tests permitidos configurados
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Tests Excluidos */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                Tests Excluidos
              </h3>
              
              <div className="space-y-2">
                {jobFamily.testMappings?.excluded?.length > 0 ? (
                  jobFamily.testMappings.excluded.map(testId => (
                    <div key={testId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {getTestName(testId)}
                        </span>
                        <span className="text-sm text-gray-500">
                          v{getTestVersion(testId)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddAllowedTest(testId)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Permitir
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay tests excluidos configurados
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Tests Disponibles */}
          {getUnmappedTests().length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tests Disponibles
                </h3>
                
                <div className="space-y-2">
                  {getUnmappedTests().map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {test.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          v{test.version}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddAllowedTest(test.id)}
                        >
                          Permitir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewTestMapping(prev => ({
                              ...prev,
                              testId: test.id,
                              testName: test.name,
                              testVersion: test.version
                            }));
                            setShowAddForm(true);
                          }}
                        >
                          Recomendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMappingDialog;
