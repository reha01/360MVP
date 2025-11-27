// src/components/members/MultiManagerSelector.jsx
import React from 'react';

/**
 * Multi-Manager Selector Component
 * Allows selecting multiple managers with a chips-based UI
 * 
 * @param {Array} users - All available users to select from
 * @param {Array} selectedIds - Currently selected manager IDs
 * @param {Function} onChange - Callback when selection changes
 * @param {string} currentMemberId - ID of current member (to prevent self-selection)
 */
const MultiManagerSelector = ({ users = [], selectedIds = [], onChange, currentMemberId }) => {

    const handleRemoveManager = (managerIdToRemove) => {
        const updatedIds = (selectedIds || []).filter(id => id !== managerIdToRemove);
        onChange(updatedIds);
    };

    const handleAddManager = (e) => {
        const selectedManagerId = e.target.value;
        if (selectedManagerId && !(selectedIds || []).includes(selectedManagerId)) {
            onChange([...(selectedIds || []), selectedManagerId]);
        }
        // Reset dropdown
        e.target.value = '';
    };

    // SAFETY: Ensure arrays are defined with default values
    const safeUsers = Array.isArray(users) ? users : [];
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

    // Filter available users: exclude current member, inactive users, and already selected
    const availableUsers = safeUsers.filter(user =>
        user &&
        user.id !== currentMemberId &&
        user.isActive !== false &&
        !safeSelectedIds.includes(user.id)
    );

    return (
        <div className="multi-manager-selector">
            {/* Selected Managers - Chips Display */}
            {safeSelectedIds.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                }}>
                    {safeSelectedIds.map(managerId => {
                        const manager = safeUsers.find(u => u && u.id === managerId);

                        // Show placeholder if manager not found (data still loading)
                        if (!manager) {
                            return (
                                <div
                                    key={managerId}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        backgroundColor: '#9ca3af',
                                        color: 'white',
                                        borderRadius: '16px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                >
                                    <span>Cargando...</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveManager(managerId)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            padding: '0',
                                            fontSize: '16px',
                                            lineHeight: '1',
                                            fontWeight: 'bold'
                                        }}
                                        title="Remover"
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={managerId}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '16px',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                <span>{manager.displayName || manager.email || 'Usuario'}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveManager(managerId)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '0',
                                        fontSize: '16px',
                                        lineHeight: '1',
                                        fontWeight: 'bold'
                                    }}
                                    title="Remover"
                                    aria-label={`Remover ${manager.displayName || manager.email}`}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Manager Dropdown */}
            <select
                className="form-select"
                onChange={handleAddManager}
                defaultValue=""
            >
                <option value="">+ Agregar jefe...</option>
                {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.displayName || user.email || 'Usuario sin nombre'}
                    </option>
                ))}
            </select>

            <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                Puedes asignar múltiples jefes (estructura matricial). Un usuario no puede ser su propio jefe.
            </small>
        </div>
    );
};

export default MultiManagerSelector;
