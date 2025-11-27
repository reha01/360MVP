/**
 * Paso 4: Reglas de Conexión
 * Selección de test y opciones dinámicas según la estrategia
 */

import React, { useState, useEffect } from 'react';
import './ConnectionRulesStep.css';

const ConnectionRulesStep = ({
    data,
    availableTests = [],
    onChange
}) => {
    const [selectedTestId, setSelectedTestId] = useState(data.selectedTestId || '');
    const [allowMultipleManagers, setAllowMultipleManagers] = useState(
        data.connectionRules?.allowMultipleManagers || false
    );
    const [restrictPeersToArea, setRestrictPeersToArea] = useState(
        data.connectionRules?.restrictPeersToArea || true
    );

    // Determinar si las opciones dinámicas deben mostrarse según la estrategia
    const showManagerOptions = data.evaluatorRules?.manager === true;
    const showPeerOptions = data.evaluatorRules?.peers === true;

    useEffect(() => {
        // Propagate changes to parent
        onChange({
            selectedTestId,
            connectionRules: {
                allowMultipleManagers,
                restrictPeersToArea
            }
        });
    }, [selectedTestId, allowMultipleManagers, restrictPeersToArea]);

    const handleTestChange = (e) => {
        setSelectedTestId(e.target.value);
    };

    return (
        <div className="connection-rules-step">
            <div className="connection-header">
                <h3>Reglas de Conexión</h3>
                <p className="connection-subtitle">
                    Configura cómo se asignarán los tests y evaluadores
                </p>
            </div>

            {/* Test Selection */}
            <div className="connection-section">
                <label className="connection-label">
                    <span className="label-text">Test a Utilizar</span>
                    <span className="label-required">*</span>
                </label>
                <select
                    className="connection-select"
                    value={selectedTestId}
                    onChange={handleTestChange}
                >
                    <option value="">Selecciona un test...</option>
                    {availableTests.map(test => (
                        <option key={test.id} value={test.id}>
                            {test.name || test.title} {test.version ? `(v${test.version})` : ''}
                        </option>
                    ))}
                </select>
                {!selectedTestId && (
                    <p className="connection-hint">
                        Selecciona el cuestionario que utilizarán los evaluadores
                    </p>
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
                        <strong>Test:</strong>{' '}
                        {selectedTestId ? (
                            availableTests.find(t => t.id === selectedTestId)?.name ||
                            availableTests.find(t => t.id === selectedTestId)?.title ||
                            'Test seleccionado'
                        ) : (
                            <span className="text-muted">No seleccionado</span>
                        )}
                    </li>
                    {showManagerOptions && (
                        <li>
                            <strong>Múltiples jefes:</strong>{' '}
                            {allowMultipleManagers ? 'Sí' : 'No'}
                        </li>
                    )}
                    {showPeerOptions && (
                        <li>
                            <strong>Pares restringidos a área:</strong>{' '}
                            {restrictPeersToArea ? 'Sí' : 'No'}
                        </li>
                    )}
                </ul>
            </div>

            {!selectedTestId && (
                <div className="connection-warning">
                    ⚠️ Debes seleccionar un test antes de continuar
                </div>
            )}
        </div>
    );
};

export default ConnectionRulesStep;
