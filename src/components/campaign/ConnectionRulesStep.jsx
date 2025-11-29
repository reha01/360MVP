/**
 * Paso 4: Reglas de Conexión
 * Selección de test y opciones dinámicas según la estrategia
 * Soporta asignación segmentada por Job Family
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import jobFamilyService from '../../services/jobFamilyService';
import './ConnectionRulesStep.css';

const ConnectionRulesStep = ({
    data,
    selectedUsers = [], // Recibimos la audiencia seleccionada
    availableTests = [],
    onChange
}) => {
    // Estado local para la configuración de tests
    const [testConfig, setTestConfig] = useState(data.testConfiguration || {
        mode: 'unified', // 'unified' | 'segmented'
        defaultTestId: data.selectedTestId || '', // Fallback para compatibilidad
        assignments: {} // { jobFamilyId: testId }
    });

    const [allowMultipleManagers, setAllowMultipleManagers] = useState(
        data.connectionRules?.allowMultipleManagers || false
    );
    const [restrictPeersToArea, setRestrictPeersToArea] = useState(
        data.connectionRules?.restrictPeersToArea || true
    );

    const { currentOrgId } = useMultiTenant();
    const [jobFamilies, setJobFamilies] = useState([]);

    // Cargar Job Families para resolver nombres
    useEffect(() => {
        if (!currentOrgId) return;
        jobFamilyService.getOrgJobFamilies(currentOrgId)
            .then(data => setJobFamilies(data))
            .catch(err => console.error('Error loading job families:', err));
    }, [currentOrgId]);

    // Agrupar usuarios por Job Family
    const userGroups = useMemo(() => {
        const groups = {};
        let noJobFamilyCount = 0;

        selectedUsers.forEach(user => {
            if (user.jobFamilyIds && user.jobFamilyIds.length > 0) {
                const jfId = user.jobFamilyIds[0];

                // Buscar nombre en la lista cargada
                const family = jobFamilies.find(f => f.id === jfId);
                const jfName = family ? family.name : (user.jobFamilyNames ? user.jobFamilyNames[0] : `Job Family ${jfId}`);

                if (!groups[jfId]) {
                    groups[jfId] = {
                        id: jfId,
                        name: jfName,
                        count: 0,
                        users: []
                    };
                }
                groups[jfId].count++;
                groups[jfId].users.push(user);
            } else {
                noJobFamilyCount++;
            }
        });

        return {
            groups: Object.values(groups),
            noJobFamilyCount
        };
    }, [selectedUsers, jobFamilies]);

    // Determinar si las opciones dinámicas deben mostrarse según la estrategia
    const showManagerOptions = data.evaluatorRules?.manager === true;
    const showPeerOptions = data.evaluatorRules?.peers === true;

    // Propagar cambios
    useEffect(() => {
        onChange({
            selectedTestId: testConfig.defaultTestId, // Mantener compatibilidad
            testConfiguration: testConfig,
            connectionRules: {
                allowMultipleManagers,
                restrictPeersToArea
            }
        });
    }, [testConfig, allowMultipleManagers, restrictPeersToArea]);

    const handleModeChange = (isUnified) => {
        setTestConfig(prev => ({
            ...prev,
            mode: isUnified ? 'unified' : 'segmented'
        }));
    };

    const handleDefaultTestChange = (e) => {
        setTestConfig(prev => ({
            ...prev,
            defaultTestId: e.target.value
        }));
    };

    const handleAssignmentChange = (jobFamilyId, testId) => {
        setTestConfig(prev => ({
            ...prev,
            assignments: {
                ...prev.assignments,
                [jobFamilyId]: testId
            }
        }));
    };

    const handleNoJobFamilyAssignmentChange = (testId) => {
        setTestConfig(prev => ({
            ...prev,
            assignments: {
                ...prev.assignments,
                'no_job_family': testId
            }
        }));
    };

    return (
        <div className="connection-rules-step">
            <div className="connection-header">
                <h3>Reglas de Conexión</h3>
                <p className="connection-subtitle">
                    Configura cómo se asignarán los tests y evaluadores
                </p>
            </div>

            {/* Test Selection Section */}
            <div className="connection-section">
                <h4 className="connection-subsection-title">Asignación de Tests</h4>

                {/* Mode Switch */}
                {selectedUsers.length > 0 && (
                    <div className="mode-switch-container" style={{ marginBottom: '16px' }}>
                        <label className="connection-checkbox-label">
                            <input
                                type="checkbox"
                                checked={testConfig.mode === 'unified'}
                                onChange={(e) => handleModeChange(e.target.checked)}
                                className="connection-checkbox"
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Usar el mismo test para todos</span>
                                <span className="checkbox-description">
                                    Aplica el mismo cuestionario a todos los {selectedUsers.length} evaluados
                                </span>
                            </div>
                        </label>
                    </div>
                )}

                {/* Unified Mode Selector */}
                {testConfig.mode === 'unified' && (
                    <div className="test-selector-group">
                        <label className="connection-label">
                            <span className="label-text">Test General</span>
                            <span className="label-required">*</span>
                        </label>
                        <select
                            className="connection-select"
                            value={testConfig.defaultTestId}
                            onChange={handleDefaultTestChange}
                        >
                            <option value="">Selecciona un test...</option>
                            {availableTests.map(test => (
                                <option key={test.id} value={test.id}>
                                    {test.name || test.title} {test.version ? `(v${test.version})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Segmented Mode Selectors */}
                {testConfig.mode === 'segmented' && (
                    <div className="segmented-selectors">
                        <p className="connection-hint" style={{ marginBottom: '12px' }}>
                            Asigna un test específico para cada grupo de cargos:
                        </p>

                        {userGroups.groups.map(group => (
                            <div key={group.id} className="test-selector-group" style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #e5e7eb' }}>
                                <label className="connection-label" style={{ fontSize: '14px' }}>
                                    <span className="label-text">{group.name} ({group.count} personas)</span>
                                </label>
                                <select
                                    className="connection-select"
                                    value={testConfig.assignments[group.id] || ''}
                                    onChange={(e) => handleAssignmentChange(group.id, e.target.value)}
                                >
                                    <option value="">Selecciona un test...</option>
                                    {availableTests.map(test => (
                                        <option key={test.id} value={test.id}>
                                            {test.name || test.title} {test.version ? `(v${test.version})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}

                        {userGroups.noJobFamilyCount > 0 && (
                            <div className="test-selector-group" style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #e5e7eb' }}>
                                <label className="connection-label" style={{ fontSize: '14px' }}>
                                    <span className="label-text">Sin Cargo Asignado ({userGroups.noJobFamilyCount} personas)</span>
                                </label>
                                <select
                                    className="connection-select"
                                    value={testConfig.assignments['no_job_family'] || ''}
                                    onChange={(e) => handleNoJobFamilyAssignmentChange(e.target.value)}
                                >
                                    <option value="">Selecciona un test...</option>
                                    {availableTests.map(test => (
                                        <option key={test.id} value={test.id}>
                                            {test.name || test.title} {test.version ? `(v${test.version})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dynamic Options based on Strategy */}
            {(showManagerOptions || showPeerOptions) && (
                <div className="connection-section">
                    <h4 className="connection-subsection-title">Opciones de Evaluación</h4>

                    {showManagerOptions && (
                        <label className="connection-checkbox-label">
                            <input
                                type="checkbox"
                                checked={allowMultipleManagers}
                                onChange={(e) => setAllowMultipleManagers(e.target.checked)}
                                className="connection-checkbox"
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Permitir múltiples jefes</span>
                                <span className="checkbox-description">
                                    Un evaluado puede ser evaluado por más de un manager (matriz organizacional)
                                </span>
                            </div>
                        </label>
                    )}

                    {showPeerOptions && (
                        <label className="connection-checkbox-label">
                            <input
                                type="checkbox"
                                checked={restrictPeersToArea}
                                onChange={(e) => setRestrictPeersToArea(e.target.checked)}
                                className="connection-checkbox"
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Restringir pares a la misma Área</span>
                                <span className="checkbox-description">
                                    Los evaluadores pares solo se seleccionarán dentro de la misma área organizacional
                                </span>
                            </div>
                        </label>
                    )}
                </div>
            )}

            {/* Summary Section */}
            <div className="connection-summary">
                <h4>Resumen de Configuración</h4>
                <ul>
                    <li>
                        <strong>Modo de Test:</strong>{' '}
                        {testConfig.mode === 'unified' ? 'Unificado' : 'Segmentado por Cargo'}
                    </li>
                    {testConfig.mode === 'unified' && (
                        <li>
                            <strong>Test:</strong>{' '}
                            {testConfig.defaultTestId ? (
                                availableTests.find(t => t.id === testConfig.defaultTestId)?.name || 'Test seleccionado'
                            ) : (
                                <span className="text-muted">No seleccionado</span>
                            )}
                        </li>
                    )}
                    {testConfig.mode === 'segmented' && (
                        <li>
                            <strong>Asignaciones:</strong>{' '}
                            {Object.keys(testConfig.assignments).length} grupos configurados
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ConnectionRulesStep;
