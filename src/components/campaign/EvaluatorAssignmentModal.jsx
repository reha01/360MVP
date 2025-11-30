import React, { useState, useEffect } from 'react';
import './CampaignDashboard.css'; // Reusing the same styles

const EvaluatorAssignmentModal = ({ isOpen, onClose, evaluatee, allUsers, onSave }) => {
    const [managers, setManagers] = useState([]);
    const [peers, setPeers] = useState([]);
    const [subordinates, setSubordinates] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('peer'); // 'manager', 'peer', 'subordinate'
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (evaluatee) {
            setManagers(evaluatee.managerIds || []);
            setPeers(evaluatee.peerIds || []);
            setSubordinates(evaluatee.dependentIds || []);
        }
    }, [evaluatee]);

    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            const lowerTerm = searchTerm.toLowerCase();
            const results = allUsers.filter(u =>
                u.id !== evaluatee.id && // Cannot evaluate self here (handled by self-eval flag)
                (u.name.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm)) &&
                !managers.includes(u.id) &&
                !peers.includes(u.id) &&
                !subordinates.includes(u.id)
            );
            setSearchResults(results.slice(0, 5)); // Limit to 5 results
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, allUsers, evaluatee, managers, peers, subordinates]);

    const handleAdd = (userId) => {
        if (selectedRole === 'manager') {
            setManagers([...managers, userId]);
        } else if (selectedRole === 'peer') {
            setPeers([...peers, userId]);
        } else if (selectedRole === 'subordinate') {
            setSubordinates([...subordinates, userId]);
        }
        setSearchTerm('');
    };

    const handleRemove = (userId, role) => {
        if (role === 'manager') {
            setManagers(managers.filter(id => id !== userId));
        } else if (role === 'peer') {
            setPeers(peers.filter(id => id !== userId));
        } else if (role === 'subordinate') {
            setSubordinates(subordinates.filter(id => id !== userId));
        }
    };

    const handleSave = () => {
        onSave({
            ...evaluatee,
            managerIds: managers,
            peerIds: peers,
            dependentIds: subordinates,
            // Update counts as well to keep consistency if the UI relies on them
            peersCount: peers.length,
            dependentsCount: subordinates.length,
            superiorsCount: managers.length
        });
    };

    const getUserName = (userId) => {
        const user = allUsers.find(u => u.id === userId);
        return user ? user.name : 'Usuario desconocido';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="modal-header">
                    <h3>Calibrar Evaluadores para {evaluatee?.name}</h3>
                </div>

                <div className="modal-form">

                    {/* Current Assignments */}
                    <div className="form-group">
                        <label className="form-label">Superiores ({managers.length})</label>
                        <div className="evaluator-list">
                            {managers.map(id => (
                                <div key={id} className="evaluator-tag">
                                    <span>{getUserName(id)}</span>
                                    <button onClick={() => handleRemove(id, 'manager')} className="remove-btn">×</button>
                                </div>
                            ))}
                            {managers.length === 0 && <span className="empty-text">Sin superiores asignados</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pares ({peers.length})</label>
                        <div className="evaluator-list">
                            {peers.map(id => (
                                <div key={id} className="evaluator-tag">
                                    <span>{getUserName(id)}</span>
                                    <button onClick={() => handleRemove(id, 'peer')} className="remove-btn">×</button>
                                </div>
                            ))}
                            {peers.length === 0 && <span className="empty-text">Sin pares asignados</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Equipo / Reportes ({subordinates.length})</label>
                        <div className="evaluator-list">
                            {subordinates.map(id => (
                                <div key={id} className="evaluator-tag">
                                    <span>{getUserName(id)}</span>
                                    <button onClick={() => handleRemove(id, 'subordinate')} className="remove-btn">×</button>
                                </div>
                            ))}
                            {subordinates.length === 0 && <span className="empty-text">Sin reportes asignados</span>}
                        </div>
                    </div>

                    <hr style={{ margin: '16px 0', border: '0', borderTop: '1px solid #eee' }} />

                    {/* Add New */}
                    <div className="form-group">
                        <label className="form-label">Añadir Evaluador</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <select
                                className="form-select"
                                style={{ width: '140px' }}
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="manager">Superior</option>
                                <option value="peer">Par</option>
                                <option value="subordinate">Equipo</option>
                            </select>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Buscar usuario por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="search-results">
                                {searchResults.map(user => (
                                    <div key={user.id} className="search-result-item" onClick={() => handleAdd(user.id)}>
                                        <div className="user-avatar-small">{user.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        <div className="add-icon">+</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                <div className="modal-actions">
                    <button className="btn-modal btn-modal-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-modal btn-modal-primary" onClick={handleSave}>Guardar Cambios</button>
                </div>
            </div>

            <style>{`
                .evaluator-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    min-height: 42px;
                }
                .evaluator-tag {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 4px 10px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #dc3545;
                    font-weight: bold;
                    cursor: pointer;
                    padding: 0;
                    font-size: 16px;
                    line-height: 1;
                }
                .search-results {
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .search-result-item:hover {
                    background: #f0f9ff;
                }
                .user-avatar-small {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #e0e7ff;
                    color: #4f46e5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                }
                .add-icon {
                    margin-left: auto;
                    color: #0d6efd;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default EvaluatorAssignmentModal;
