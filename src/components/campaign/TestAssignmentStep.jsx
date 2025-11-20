/**
 * Paso 3: Asignación de Tests
 * SOLUCIÓN SIMPLIFICADA: Formulario simple sin componentes complejos
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';

const TestAssignmentStep = ({ 
  data, 
  filteredUsers = [], 
  jobFamilies = [], 
  availableTests = [], 
  onChange 
}) => {
  const [testAssignments, setTestAssignments] = useState(data.testAssignments || {});
  
  // Flag para prevenir callbacks durante mount
  const isReadyRef = useRef(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true;
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Validar si hay tests disponibles (usando useMemo para evitar recálculos)
  const hasAvailableTests = useMemo(() => {
    return availableTests && Array.isArray(availableTests) && availableTests.length > 0;
  }, [availableTests]);
  
  // Notificar cambios al padre (solo cuando está listo)
  useEffect(() => {
    if (!isReadyRef.current || !onChange) return;
    
    const timer = setTimeout(() => {
      if (isReadyRef.current && onChange) {
        onChange({ testAssignments });
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [testAssignments, onChange]);
  
  const handleTestAssignment = (userId, testId) => {
    if (!testId) return;
    
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
        const userJobFamily = jobFamilies.find(family => 
          user.jobFamilyIds.includes(family.id)
        );
        
        if (userJobFamily && userJobFamily.testMappings?.recommended?.length > 0) {
          const recommendedTest = userJobFamily.testMappings.recommended[0];
          newAssignments[user.id] = {
            testId: recommendedTest.testId,
            version: recommendedTest.testVersion || '1.0',
            reason: `Recomendado por Job Family: ${userJobFamily.name}`
          };
        } else if (userJobFamily && userJobFamily.testMappings?.allowed?.length > 0) {
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
    
    const userJobFamily = jobFamilies.find(family => 
      user.jobFamilyIds.includes(family.id)
    );
    
    if (!userJobFamily || !userJobFamily.testMappings) {
      return availableTests;
    }
    
    const allowedTestIds = [
      ...(userJobFamily.testMappings.recommended || []).map(t => t.testId),
      ...(userJobFamily.testMappings.allowed || [])
    ];
    
    return availableTests.filter(test => allowedTestIds.includes(test.id));
  };
  
  const stats = {
    total: filteredUsers.length,
    assigned: Object.keys(testAssignments).length,
    withJobFamily: filteredUsers.filter(user => 
      user.jobFamilyIds && user.jobFamilyIds.length > 0
    ).length
  };
  
  // Estilos inline simples
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    marginBottom: '16px'
  };
  
  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px'
  };
  
  const buttonOutlineStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#3B82F6',
    border: '1px solid #3B82F6'
  };
  
  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  };
  
  
  return (
    <div style={{ padding: '0' }}>
      {/* Mensaje si no hay tests disponibles */}
      {!hasAvailableTests && (
        <div style={{
          ...cardStyle,
          backgroundColor: '#FEF3C7',
          border: '1px solid #FCD34D',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#92400E' }}>
            ⚠️ No hay evaluaciones disponibles para su organización
          </h3>
          <p style={{ color: '#92400E', margin: '0', fontSize: '14px' }}>
            No se han asignado tests a su organización. Por favor, contacte al administrador del sistema 
            para que asigne las evaluaciones necesarias antes de crear una campaña.
          </p>
        </div>
      )}
      
      {/* Auto Asignación */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Asignación Automática
        </h3>
        
        <p style={{ color: '#6B7280', marginBottom: '16px', fontSize: '14px' }}>
          El sistema puede asignar automáticamente tests basándose en las Job Families de los usuarios.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Total Usuarios</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{stats.withJobFamily}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Con Job Family</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F3FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6' }}>{stats.assigned}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Tests Asignados</div>
          </div>
        </div>
        
        <div>
          <button 
            onClick={handleAutoAssign} 
            style={buttonStyle}
            disabled={!hasAvailableTests}
          >
            Auto Asignar por Job Family
          </button>
          <button 
            onClick={handleClearAssignments} 
            style={buttonOutlineStyle}
            disabled={!hasAvailableTests}
          >
            Limpiar Asignaciones
          </button>
        </div>
      </div>
      
      {/* Lista de Usuarios y Tests */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Asignación de Tests por Usuario
        </h3>
        
        {filteredUsers.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px' }}>
            {filteredUsers.map(user => {
              const assignedTest = getAssignedTestForUser(user);
              const availableTestsForUser = getAvailableTestsForUser(user);
              
              return (
                <div key={user.id} style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{user.displayName}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                        {user.email} • {user.jobTitle}
                      </div>
                      
                      {user.jobFamilyIds && user.jobFamilyIds.length > 0 && (
                        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>Job Families: </span>
                          {user.jobFamilyIds.map(familyId => (
                            <span key={familyId} style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: '#F3F4F6',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#374151',
                              marginRight: '4px'
                            }}>
                              {getJobFamilyName(familyId)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {assignedTest && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#F0FDF4', borderRadius: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#10B981' }}>
                            {getTestName(assignedTest.testId)} (v{assignedTest.version})
                          </div>
                          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                            {assignedTest.reason}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ minWidth: '250px' }}>
                      {hasAvailableTests ? (
                        <select
                          value={assignedTest?.testId || ''}
                          onChange={(e) => handleTestAssignment(user.id, e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">Seleccionar test</option>
                          {availableTestsForUser.length > 0 ? (
                            availableTestsForUser.map(test => (
                              <option key={test.id} value={test.id}>
                                {test.name} (v{test.version})
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>No hay tests disponibles para esta Job Family</option>
                          )}
                        </select>
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #FCD34D',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#92400E',
                          textAlign: 'center'
                        }}>
                          No hay tests disponibles
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '14px', color: '#1E40AF' }}>
              No hay usuarios seleccionados. Ve al paso anterior para seleccionar evaluados.
            </div>
          </div>
        )}
      </div>
      
      {/* Resumen de Asignaciones */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Resumen de Asignaciones
        </h3>
        
        {Object.keys(testAssignments).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(testAssignments).map(([userId, assignment]) => {
              const user = filteredUsers.find(u => u.id === userId);
              if (!user) return null;
              
              return (
                <div key={userId} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px', 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#111827' }}>{user.displayName}</span>
                    <span style={{ color: '#6B7280', margin: '0 8px' }}>→</span>
                    <span style={{ color: '#3B82F6' }}>
                      {getTestName(assignment.testId)} (v{assignment.version})
                    </span>
                  </div>
                  <span style={{ 
                    padding: '2px 8px',
                    backgroundColor: '#D1FAE5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#065F46'
                  }}>
                    {assignment.reason}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
            <div style={{ fontSize: '14px', color: '#92400E' }}>
              No hay tests asignados. Usa la asignación automática o asigna tests manualmente.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAssignmentStep;
