import React, { useState, useEffect } from 'react';
import './CampaignDashboard.css';

const AddParticipantModal = ({ isOpen, onClose, allUsers, existingParticipantIds, onAdd }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Filter out users already in the campaign
    const availableUsers = allUsers.filter(u => !existingParticipantIds.includes(u.id));

    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            const lowerTerm = searchTerm.toLowerCase();
            const results = availableUsers.filter(u =>
                u.name.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm)
            );
            setSearchResults(results.slice(0, 10));
        } else {
            setSearchResults(availableUsers.slice(0, 10)); // Show first 10 by default
        }
    }, [searchTerm, availableUsers]);

    const handleAddParticipant = (user) => {
        onAdd(user);
        setSearchTerm('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="modal-header">
                    <h3>Agregar Participante</h3>
                </div>

                <div className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Buscar miembro activo</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {searchResults.length > 0 ? (
                        <div className="search-results">
                            {searchResults.map(user => (
                                <div key={user.id} className="search-result-item" onClick={() => handleAddParticipant(user)}>
                                    <div className="user-avatar-small">{user.name.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                        {user.jobTitle && <div className="text-xs text-gray-500">{user.jobTitle}</div>}
                                    </div>
                                    <div className="add-icon">+</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                            {availableUsers.length === 0 ? (
                                'Todos los miembros activos ya están en esta campaña.'
                            ) : (
                                'No se encontraron usuarios. Intenta buscar por nombre o email.'
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-modal btn-modal-cancel" onClick={onClose}>Cancelar</button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 8px;
                    padding: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .modal-header {
                    margin-bottom: 20px;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #212529;
                }
                .modal-form {
                    margin-bottom: 20px;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: #495057;
                    font-size: 14px;
                }
                .form-input, .form-select {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .form-input:focus, .form-select:focus {
                    outline: none;
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
                }
                .search-results {
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    max-height: 300px;
                    overflow-y: auto;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .search-result-item {
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid #f0f0f0;
                }
                .search-result-item:last-child {
                    border-bottom: none;
                }
                .search-result-item:hover {
                    background: #f0f9ff;
                }
                .user-avatar-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #e0e7ff;
                    color: #4f46e5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                .add-icon {
                    margin-left: auto;
                    color: #0d6efd;
                    font-weight: bold;
                    font-size: 20px;
                }
                .font-medium {
                    font-weight: 500;
                    font-size: 14px;
                    color: #212529;
                }
                .text-xs {
                    font-size: 12px;
                }
                .text-gray-500 {
                    color: #6c757d;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                .btn-modal {
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-modal-cancel {
                    background: white;
                    color: #495057;
                    border: 1px solid #dee2e6;
                }
                .btn-modal-cancel:hover {
                    background: #f8f9fa;
                }
                .btn-modal-primary {
                    background: #0d6efd;
                    color: white;
                }
                .btn-modal-primary:hover {
                    background: #0b5ed7;
                }
            `}</style>
        </div>
    );
};

export default AddParticipantModal;
