import React, { useState, useEffect } from 'react';
import './CampaignDashboard.css';

const EvaluatorManagementModal = ({ isOpen, onClose, evaluatee, allUsers, onSave }) => {
    const [managers, setManagers] = useState([]);
    const [peers, setPeers] = useState([]);
    const [subordinates, setSubordinates] = useState([]);
    const [skipManagerEvaluation, setSkipManagerEvaluation] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('peer');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (evaluatee) {
            // Convert IDs to user objects for display
            const managerObjs = (evaluatee.managerIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);
            const peerObjs = (evaluatee.peerIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);
            const subObjs = (evaluatee.dependentIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);

            setManagers(managerObjs);
            setPeers(peerObjs);
            setSubordinates(subObjs);
            setSkipManagerEvaluation(evaluatee.skipManagerEvaluation || false);
        }
    }, [evaluatee, allUsers]);

    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            const lowerTerm = searchTerm.toLowerCase();
            const existingIds = new Set([
                ...managers.map(u => u.id),
                ...peers.map(u => u.id),
                ...subordinates.map(u => u.id)
            ]);

            const results = allUsers.filter(u =>
                u.id !== evaluatee.id &&
                !existingIds.has(u.id) &&
                (u.name.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm))
            );
            setSearchResults(results.slice(0, 5));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, allUsers, evaluatee, managers, peers, subordinates]);

    const handleAdd = (user) => {
        if (selectedRole === 'manager') {
            setManagers([...managers, user]);
        } else if (selectedRole === 'peer') {
            setPeers([...peers, user]);
        } else if (selectedRole === 'subordinate') {
            setSubordinates([...subordinates, user]);
        }
        setSearchTerm('');
    };

    const handleRemove = (userId, role) => {
        if (role === 'manager') {
            setManagers(managers.filter(u => u.id !== userId));
        } else if (role === 'peer') {
            setPeers(peers.filter(u => u.id !== userId));
        } else if (role === 'subordinate') {
            setSubordinates(subordinates.filter(u => u.id !== userId));
        }
    };

    const handleSave = () => {
        // 🛑 CRITICAL: Sanitize to IDs only before saving
        const cleanManagers = managers.map(user =>
            typeof user === 'object' ? user.id : user
        ).filter(id => typeof id === 'string');

        const cleanPeers = peers.map(user =>
            typeof user === 'object' ? user.id : user
        ).filter(id => typeof id === 'string');

        const cleanSubordinates = subordinates.map(user =>
            typeof user === 'object' ? user.id : user
        ).filter(id => typeof id === 'string');

        onSave({
            ...evaluatee,
            managerIds: cleanManagers,
            peerIds: cleanPeers,
            dependentIds: cleanSubordinates,
            skipManagerEvaluation: skipManagerEvaluation
        });
    };

    // Calculate work load
    const totalWorkLoad = managers.length + peers.length + subordinates.length;

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="evaluator-modal">
                {/* Header */}
                <div className="modal-header-new">
                    <div className="modal-user-info">
                        <div className="user-avatar-large">
                            {evaluatee?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3>{evaluatee?.name}</h3>
                            <p className="user-role-text">{evaluatee?.jobTitle || 'Sin cargo'}</p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                {/* Work Load Bar */}
                <div className="work-load-header">
                    <div className="work-load-label">
                        <span className="clipboard-icon">📋</span>
                        <span>Debe evaluar a {totalWorkLoad} personas</span>
                    </div>
                    <div className="work-load-bar">
                        <div
                            className="work-load-fill"
                            style={{ width: `${Math.min((totalWorkLoad / 15) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* 3-Zone Matrix */}
                <div className="evaluator-matrix">
                    {/* Zone 1: Superiores */}
                    <div className="evaluator-zone">
                        <div className="zone-header">
                            <h4>👤 Superiores ({managers.length})</h4>
                            <span className="zone-subtitle">Jefes directos</span>
                        </div>
                        <div className="evaluator-list-zone">
                            {managers.map(user => (
                                <div key={user.id} className="evaluator-chip">
                                    <div className="chip-avatar">{user.name.charAt(0)}</div>
                                    <div className="chip-info">
                                        <div className="chip-name">{user.name}</div>
                                        <div className="chip-email">{user.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(user.id, 'manager')}
                                        className="chip-remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {managers.length === 0 && (
                                <div className="empty-zone">Sin superiores asignados</div>
                            )}
                        </div>
                        <div className="zone-skip-option">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={skipManagerEvaluation}
                                    onChange={(e) => setSkipManagerEvaluation(e.target.checked)}
                                />
                                <span>Este usuario no tiene superior (CEO/Dueño)</span>
                            </label>
                        </div>
                    </div>

                    {/* Zone 2: Pares */}
                    <div className="evaluator-zone">
                        <div className="zone-header">
                            <h4>👥 Pares ({peers.length})</h4>
                            <span className="zone-subtitle">Colegas del mismo nivel</span>
                        </div>
                        <div className="evaluator-list-zone">
                            {peers.map(user => (
                                <div key={user.id} className="evaluator-chip">
                                    <div className="chip-avatar">{user.name.charAt(0)}</div>
                                    <div className="chip-info">
                                        <div className="chip-name">{user.name}</div>
                                        <div className="chip-email">{user.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(user.id, 'peer')}
                                        className="chip-remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {peers.length === 0 && (
                                <div className="empty-zone">Sin pares asignados</div>
                            )}
                        </div>
                    </div>

                    {/* Zone 3: Equipo */}
                    <div className="evaluator-zone">
                        <div className="zone-header">
                            <h4>🔻 Equipo ({subordinates.length})</h4>
                            <span className="zone-subtitle">Reportes directos</span>
                        </div>
                        <div className="evaluator-list-zone">
                            {subordinates.map(user => (
                                <div key={user.id} className="evaluator-chip">
                                    <div className="chip-avatar">{user.name.charAt(0)}</div>
                                    <div className="chip-info">
                                        <div className="chip-name">{user.name}</div>
                                        <div className="chip-email">{user.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(user.id, 'subordinate')}
                                        className="chip-remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {subordinates.length === 0 && (
                                <div className="empty-zone">Sin reportes asignados</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search & Add Section */}
                <div className="evaluator-search-section">
                    <hr className="section-divider" />
                    <h4 className="search-title">Añadir Evaluador</h4>
                    <div className="search-controls">
                        <select
                            className="role-selector"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="manager">Superior</option>
                            <option value="peer">Par</option>
                            <option value="subordinate">Equipo</option>
                        </select>
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results-new">
                            {searchResults.map(user => (
                                <div
                                    key={user.id}
                                    className="search-result-item-new"
                                    onClick={() => handleAdd(user)}
                                >
                                    <div className="result-avatar">{user.name.charAt(0)}</div>
                                    <div className="result-info">
                                        <div className="result-name">{user.name}</div>
                                        <div className="result-email">{user.email}</div>
                                    </div>
                                    <div className="add-icon-new">+</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-actions-new">
                    <button className="btn btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluatorManagementModal;
