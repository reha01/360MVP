// src/components/members/MemberFormModal.jsx
import React, { useState, useEffect } from 'react';
import MultiManagerSelector from './MultiManagerSelector';

/**
 * Modal for editing member details
 * @param {object} editingMember - Member being edited (null if closed)
 * @param {function} onClose - Callback to close modal
 * @param {function} onSave - Callback to save changes (receives editForm)
 * @param {array} members - All members (for manager selector)
 * @param {array} jobFamilies - Available job families
 * @param {array} areas - Available areas
 * @param {array} orgRoles - Available roles
 * @param {boolean} isSuperAdmin - Whether current user is super admin
 * @param {boolean} saving - Whether save is in progress
 * @param {string} error - Error message if any
 * @param {function} onErrorClose - Callback to clear error
 */
const MemberFormModal = ({
    editingMember,
    onClose,
    onSave,
    members,
    jobFamilies,
    areas,
    orgRoles,
    isSuperAdmin,
    saving,
    error,
    onErrorClose
}) => {
    const [editForm, setEditForm] = useState({
        name: '',
        lastNamePaternal: '',
        lastNameMaternal: '',
        email: '',
        role: 'member',
        cargo: '',
        jobFamilyId: '',
        areaId: '',
        managerIds: [],
        isActive: true
    });

    // Initialize form when editingMember changes
    useEffect(() => {
        if (!editingMember) return;

        // Find jobFamilyId
        const memberJobFamilyId = editingMember.jobFamilyIds && editingMember.jobFamilyIds.length > 0
            ? editingMember.jobFamilyIds[0]
            : '';

        // Find areaId
        let memberAreaId = '';
        if (editingMember.areaId) {
            memberAreaId = editingMember.areaId;
        } else if (editingMember.area || editingMember.unit || editingMember.department) {
            const areaName = editingMember.area || editingMember.unit || editingMember.department;
            const foundArea = areas.find(a => a.name === areaName);
            if (foundArea) {
                memberAreaId = foundArea.id;
            }
        }

        setEditForm({
            name: editingMember.name || '',
            lastNamePaternal: editingMember.lastNamePaternal || editingMember.lastName || '',
            lastNameMaternal: editingMember.lastNameMaternal || '',
            email: editingMember.email || '',
            role: editingMember.role || editingMember.memberRole || 'member',
            cargo: editingMember.cargo || editingMember.jobTitle || '',
            jobFamilyId: memberJobFamilyId,
            areaId: memberAreaId,
            managerIds: editingMember.managerIds || [],
            isActive: editingMember.isActive !== false
        });
    }, [editingMember, areas]);

    const handleSubmit = () => {
        onSave(editForm);
    };

    if (!editingMember) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-header">Editar Miembro</h3>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button className="alert-close" onClick={onErrorClose}>×</button>
                    </div>
                )}

                <div className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre del miembro"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Apellido Paterno</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editForm.lastNamePaternal}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastNamePaternal: e.target.value }))}
                            placeholder="Apellido paterno"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Apellido Materno</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editForm.lastNameMaternal}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastNameMaternal: e.target.value }))}
                            placeholder="Apellido materno (opcional)"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="email@empresa.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Rol {!isSuperAdmin && <span style={{ fontSize: '12px', color: '#6B7280' }}>(Solo Super Admin puede modificar)</span>}
                        </label>
                        {isSuperAdmin ? (
                            <select
                                className="form-select"
                                value={editForm.role}
                                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            >
                                {orgRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="form-input"
                                value={editForm.role || 'member'}
                                readOnly
                                disabled
                                style={{
                                    backgroundColor: '#F3F4F6',
                                    cursor: 'not-allowed',
                                    color: '#6B7280'
                                }}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cargo (Job Title)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editForm.cargo}
                            onChange={(e) => setEditForm(prev => ({ ...prev, cargo: e.target.value }))}
                            placeholder="Ej: Gerente de Ventas (opcional)"
                        />
                        <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                            Nombre interno del puesto (información descriptiva)
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Job Family</label>
                        <select
                            className="form-select"
                            value={editForm.jobFamilyId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, jobFamilyId: e.target.value }))}
                        >
                            <option value="">Seleccionar Job Family (opcional)</option>
                            {jobFamilies.map(jf => (
                                <option key={jf.id} value={jf.id}>
                                    {jf.name}
                                </option>
                            ))}
                        </select>
                        <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                            Categoría para evaluación (debe estar creada en /gestion/job-families)
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Área</label>
                        <select
                            className="form-select"
                            value={editForm.areaId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, areaId: e.target.value }))}
                        >
                            <option value="">Seleccionar Área (opcional)</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                        <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                            Área organizacional (debe estar creada en /gestion/estructura)
                        </small>
                    </div>

                    {/* MULTI-MANAGER SELECTOR */}
                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                        <MultiManagerSelector
                            users={members}
                            selectedIds={editForm.managerIds || []}
                            onChange={(newIds) => setEditForm(prev => ({ ...prev, managerIds: newIds }))}
                            currentMemberId={editingMember?.id}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-checkbox-group">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={editForm.isActive}
                                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            />
                            Miembro activo
                        </label>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="btn-modal btn-modal-cancel"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-modal btn-modal-primary"
                    >
                        {saving && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberFormModal;
