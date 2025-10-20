/**
 * Paso 3: Asignación de Tests
 */

import React, { useState, useEffect } from 'react';
import { TestTube, CheckCircle, AlertCircle, AutoAssign } from 'lucide-react';
import { Button, Card, Badge, Select, Alert } from '../ui';
import { generateTestSuggestions } from '../../models/JobFamily';

const TestAssignmentStep = ({ 
  data, 
  filteredUsers, 
  jobFamilies, 
  availableTests, 
  onChange 
}) => {
  const [testAssignments, setTestAssignments] = useState(data.testAssignments || {});
  const [autoAssignMode, setAutoAssignMode] = useState(true);
  
  // Notificar cambios al padre
  useEffect(() => {
    onChange({
      testAssignments
    });
  }, [testAssignments, onChange]);
  
  const handleTestAssignment = (userId, testId) => {
    setTestAssignments(prev => ({
      ...prev,
      [userId]: {
        testId,
        version: availableTests.find(t => t.id === testId)?.version || '1.0',
        reason: 'Asignado manualmente'
      }
    }));
  };
  
  const handleAutoAssign = () => {
    const newAssignments = {};
    
    filteredUsers.forEach(user => {
      if (user.jobFamilyIds && user.jobFamilyIds.length > 0) {
        // Buscar Job Family del usuario
        const userJobFamily = jobFamilies.find(family => 
          user.jobFamilyIds.includes(family.id)
        );
        
        if (userJobFamily && userJobFamily.testMappings.recommended.length > 0) {
          // Usar test recomendado
          const recommendedTest = userJobFamily.testMappings.recommended[0];
          newAssignments[user.id] = {
            testId: recommendedTest.testId,
            version: recommendedTest.testVersion || '1.0',
            reason: `Recomendado por Job Family: ${userJobFamily.name}`
          };
        } else if (userJobFamily && userJobFamily.testMappings.allowed.length > 0) {
          // Usar test permitido
          const allowedTest = userJobFamily.testMappings.allowed[0];
          newAssignments[user.id] = {
            testId: allowedTest,
            version: availableTests.find(t => t.id === allowedTest)?.version || '1.0',
            reason: `Permitido por Job Family: ${userJobFamily.name}`
          };
        }
      }
    });
    
    setTestAssignments(newAssignments);
  };
  
  const handleClearAssignments = () => {
    setTestAssignments({});
  };
  
  const getTestName = (testId) => {
    const test = availableTests.find(t => t.id === testId);
    return test ? test.name : testId;
  };
  
  const getTestVersion = (testId) => {
    const test = availableTests.find(t => t.id === testId);
    return test ? test.version : '1.0';
  };
  
  const getJobFamilyName = (familyId) => {
    const family = jobFamilies.find(f => f.id === familyId);
    return family ? family.name : familyId;
  };
  
  const getAssignedTestForUser = (user) => {
    return testAssignments[user.id] || null;
  };
  
  const getAvailableTestsForUser = (user) => {
    if (!user.jobFamilyIds || user.jobFamilyIds.length === 0) {
      return availableTests;
    }
    
    // Buscar Job Family del usuario
    const userJobFamily = jobFamilies.find(family => 
      user.jobFamilyIds.includes(family.id)
    );
    
    if (!userJobFamily) {
      return availableTests;
    }
    
    // Filtrar tests permitidos
    const allowedTestIds = [
      ...userJobFamily.testMappings.recommended.map(t => t.testId),
      ...userJobFamily.testMappings.allowed
    ];
    
    return availableTests.filter(test => allowedTestIds.includes(test.id));
  };
  
  const getAssignmentStats = () => {
    const total = filteredUsers.length;
    const assigned = Object.keys(testAssignments).length;
    const withJobFamily = filteredUsers.filter(user => 
      user.jobFamilyIds && user.jobFamilyIds.length > 0
    ).length;
    
    return { total, assigned, withJobFamily };
  };
  
  const stats = getAssignmentStats();
  
  return (
    <div className="space-y-6">
      {/* Auto Asignación */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AutoAssign className="w-5 h-5 mr-2" />
            Asignación Automática
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              El sistema puede asignar automáticamente tests basándose en las Job Families de los usuarios.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-800">Total Usuarios</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.withJobFamily}</div>
                <div className="text-sm text-green-800">Con Job Family</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.assigned}</div>
                <div className="text-sm text-purple-800">Tests Asignados</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAutoAssign}
                className="flex items-center"
              >
                <AutoAssign className="w-4 h-4 mr-2" />
                Auto Asignar por Job Family
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClearAssignments}
              >
                Limpiar Asignaciones
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Lista de Usuarios y Tests */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Asignación de Tests por Usuario
          </h3>
          
          {filteredUsers.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map(user => {
                const assignedTest = getAssignedTestForUser(user);
                const availableTestsForUser = getAvailableTestsForUser(user);
                
                return (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-600">
                          {user.email} • {user.jobTitle}
                        </div>
                        
                        {user.jobFamilyIds && user.jobFamilyIds.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-gray-500">Job Families:</span>
                            {user.jobFamilyIds.map(familyId => (
                              <Badge key={familyId} variant="secondary" className="text-xs">
                                {getJobFamilyName(familyId)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {assignedTest && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                {getTestName(assignedTest.testId)} (v{assignedTest.version})
                              </span>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {assignedTest.reason}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Select
                          value={assignedTest?.testId || ''}
                          onValueChange={(value) => handleTestAssignment(user.id, value)}
                        >
                          <Select.Trigger className="w-64">
                            <Select.Value placeholder="Seleccionar test" />
                          </Select.Trigger>
                          <Select.Content>
                            {availableTestsForUser.length > 0 ? (
                              availableTestsForUser.map(test => (
                                <Select.Item key={test.id} value={test.id}>
                                  {test.name} (v{test.version})
                                </Select.Item>
                              ))
                            ) : (
                              <Select.Item value="" disabled>
                                No hay tests disponibles
                              </Select.Item>
                            )}
                          </Select.Content>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert type="info">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay usuarios seleccionados. Ve al paso anterior para seleccionar evaluados.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
      
      {/* Resumen de Asignaciones */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Asignaciones
          </h3>
          
          <div className="space-y-2">
            {Object.entries(testAssignments).map(([userId, assignment]) => {
              const user = filteredUsers.find(u => u.id === userId);
              if (!user) return null;
              
              return (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{user.displayName}</span>
                    <span className="text-gray-600 ml-2">→</span>
                    <span className="text-blue-600 ml-2">
                      {getTestName(assignment.testId)} (v{assignment.version})
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    {assignment.reason}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {Object.keys(testAssignments).length === 0 && (
            <Alert type="warning">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay tests asignados. Usa la asignación automática o asigna tests manualmente.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TestAssignmentStep;
