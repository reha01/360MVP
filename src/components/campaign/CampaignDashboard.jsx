import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { getCampaign, updateCampaign } from '../../services/campaignService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { CAMPAIGN_STATUS } from '../../models/Campaign';
import './CampaignDashboard.css';
import EvaluatorAssignmentModal from './EvaluatorAssignmentModal';
import AddParticipantModal from './AddParticipantModal';

const CampaignDashboard = () => {
    const { campaignId } = useParams();
    const { currentOrgId } = useMultiTenant();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Editable Title State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvaluatee, setSelectedEvaluatee] = useState(null);

    // Add Participant Modal State
    const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);

    useEffect(() => {
        if (!currentOrgId || !campaignId) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const [campaignData, usersData] = await Promise.all([
                    getCampaign(currentOrgId, campaignId),
                    getOrgUsers(currentOrgId)
                ]);

                setCampaign(campaignData);
                setEditedTitle(campaignData.title);
                setAllUsers(usersData);

                const map = {};
                usersData.forEach(u => {
                    map[u.id] = u;
                });
                setUsersMap(map);

            } catch (err) {
                console.error('Error loading campaign dashboard:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentOrgId, campaignId]);

    const handleLaunchCampaign = async () => {
        if (!campaign) return;

        const hasErrors = campaign.selectedUsers?.some(user => checkMissingEvaluators(user).hasError);
        if (hasErrors) {
            alert('No se puede lanzar la campaña porque hay usuarios con evaluadores obligatorios faltantes. Por favor revisa las filas marcadas en rojo.');
            return;
        }

        if (!window.confirm('¿Estás seguro de que deseas lanzar esta campaña? Esto enviará las invitaciones.')) {
            return;
        }

        try {
            setProcessing(true);
            await updateCampaign(currentOrgId, campaign.id, {
                status: CAMPAIGN_STATUS.ACTIVE,
                launchedAt: new Date()
            });

            setCampaign(prev => ({
                ...prev,
                status: CAMPAIGN_STATUS.ACTIVE
            }));

            alert('¡Campaña lanzada con éxito!');
        } catch (err) {
            console.error('Error launching campaign:', err);
            alert('Error al lanzar la campaña: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!window.confirm('¿Estás seguro de que deseas ELIMINAR este borrador? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            setProcessing(true);
            await updateCampaign(currentOrgId, campaign.id, { status: 'archived' });
            alert('Borrador eliminado.');
            navigate('/gestion/campanas');
        } catch (err) {
            console.error('Error deleting campaign:', err);
            alert('Error al eliminar: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleTitleSave = async () => {
        if (editedTitle.trim() === campaign.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateCampaign(currentOrgId, campaign.id, { title: editedTitle });
            setCampaign(prev => ({ ...prev, title: editedTitle }));
            setIsEditingTitle(false);
        } catch (err) {
            alert('Error al actualizar el título');
        }
    };

    const handleOpenModal = (evaluatee) => {
        const effectiveManagers = getEffectiveEvaluators(evaluatee, 'manager');
        const effectivePeers = getEffectiveEvaluators(evaluatee, 'peer');
        const effectiveSubordinates = getEffectiveEvaluators(evaluatee, 'subordinate');

        setSelectedEvaluatee({
            ...evaluatee,
            managerIds: effectiveManagers,
            peerIds: effectivePeers,
            dependentIds: effectiveSubordinates
        });
        setIsModalOpen(true);
    };

    const handleSaveEvaluators = async (updatedEvaluatee) => {
        try {
            const customEvaluators = {
                managers: updatedEvaluatee.managerIds,
                peers: updatedEvaluatee.peerIds,
                subordinates: updatedEvaluatee.dependentIds
            };

            const updatedSelectedUsers = campaign.selectedUsers.map(u =>
                u.id === updatedEvaluatee.id ? {
                    ...u,
                    customEvaluators,
                    skipManagerEvaluation: updatedEvaluatee.skipManagerEvaluation,
                    // Update counts to keep consistency
                    peersCount: updatedEvaluatee.peerIds?.length || 0,
                    dependentsCount: updatedEvaluatee.dependentIds?.length || 0,
                    superiorsCount: updatedEvaluatee.managerIds?.length || 0
                } : u
            );

            setCampaign(prev => ({
                ...prev,
                selectedUsers: updatedSelectedUsers
            }));

            await updateCampaign(currentOrgId, campaign.id, {
                selectedUsers: updatedSelectedUsers
            });

            setIsModalOpen(false);
            setSelectedEvaluatee(null);
        } catch (err) {
            console.error('Error saving evaluators:', err);
            alert('Error al guardar los cambios: ' + err.message);
        }
    };

    const handleAddParticipant = async (user) => {
        try {
            const liveUser = usersMap[user.id];
            const newParticipant = {
                id: user.id,
                name: user.name,
                email: user.email,
                jobTitle: user.jobTitle,
                peersCount: 0,
                dependentsCount: 0,
                superiorsCount: liveUser?.managerIds?.length || 0,
            };

            const updatedSelectedUsers = [...campaign.selectedUsers, newParticipant];

            setCampaign(prev => ({
                ...prev,
                selectedUsers: updatedSelectedUsers
            }));

            await updateCampaign(currentOrgId, campaign.id, {
                selectedUsers: updatedSelectedUsers
            });

            alert(`${user.name} ha sido agregado a la campaña.`);
        } catch (err) {
            console.error('Error adding participant:', err);
            alert('Error al agregar participante: ' + err.message);
        }
    };

    const getUserName = (userId) => {
        return usersMap[userId]?.name || 'Usuario desconocido';
    };

    const getEffectiveEvaluators = (user, type) => {
        if (user.customEvaluators) {
            if (type === 'manager' && user.customEvaluators.managers) return user.customEvaluators.managers;
            if (type === 'peer' && user.customEvaluators.peers) return user.customEvaluators.peers;
            if (type === 'subordinate' && user.customEvaluators.subordinates) return user.customEvaluators.subordinates;
        }

        const liveUser = usersMap[user.id];

        if (type === 'manager') return liveUser?.managerIds || [];
        if (type === 'subordinate') return allUsers.filter(u => u.managerIds?.includes(user.id)).map(u => u.id);
        if (type === 'peer') return user.peerIds || [];

        return [];
    };

    const checkMissingEvaluators = (user) => {
        const effectiveManagers = getEffectiveEvaluators(user, 'manager');
        let error = null;

        // Rule: If Manager evaluation is required AND user is not exempt, must have at least 1 manager
        if (campaign.evaluatorRules?.manager && !user.skipManagerEvaluation && effectiveManagers.length === 0) {
            error = 'Falta Superior';
        }

        return { hasError: !!error, error };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) return <div className="dashboard-container"><div className="text-center p-5">Cargando campaña...</div></div>;
    if (error) return <div className="dashboard-container"><div className="alert alert-error">Error: {error}</div></div>;
    if (!campaign) return <div className="dashboard-container"><div className="text-center p-5">No se encontró la campaña</div></div>;

    return (
        <div className="dashboard-container">
            {/* Alert Banner */}
            <div className="dashboard-alert">
                <span className="dashboard-alert-icon">ℹ️</span>
                <div>
                    <strong>Calibración de Evaluadores:</strong> Los cambios que realices en esta tabla (asignar jefes o pares)
                    solo aplicarán para esta campaña vigente. <strong>No afectarán el organigrama oficial de la empresa.</strong>
                </div>
            </div>

            {/* Header */}
            <div className="dashboard-header">
                <div style={{ flex: 1 }}>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            className="title-edit-input"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                        />
                    ) : (
                        <h1 onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {campaign.title} <span style={{ fontSize: '14px', color: '#adb5bd' }}>✏️</span>
                        </h1>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        <span className={`status-badge ${campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'active' : 'draft'}`}>
                            {campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'Activa' : 'Borrador'}
                        </span>
                        <span className="description" style={{ marginLeft: '8px' }}>
                            {campaign.selectedUsers?.length || 0} Evaluados
                        </span>
                        {campaign.config?.startDate && (
                            <span className="description" style={{ marginLeft: '8px', borderLeft: '1px solid #ccc', paddingLeft: '8px' }}>
                                {formatDate(campaign.config.startDate)} - {formatDate(campaign.config.endDate)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate('/gestion/campanas')}
                    >
                        Volver
                    </button>
                    {campaign.status === CAMPAIGN_STATUS.DRAFT && (
                        <>
                            <button
                                onClick={handleDeleteCampaign}
                                disabled={processing}
                                className="btn btn-danger"
                            >
                                Eliminar Borrador
                            </button>
                            <button
                                onClick={handleLaunchCampaign}
                                disabled={processing}
                                className="btn btn-primary"
                            >
                                {processing ? 'Lanzando...' : 'Lanzar Campaña'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Matrix Table */}
            <div className="table-container">
                <div className="table-header">
                    <div>
                        <h3 className="table-title">Matriz de Evaluación</h3>
                        <p className="table-subtitle">Revisa y calibra los evaluadores para cada participante.</p>
                    </div>
                    <button
                        onClick={() => setIsAddParticipantModalOpen(true)}
                        className="btn btn-outline"
                        disabled={campaign.status !== CAMPAIGN_STATUS.DRAFT}
                        title={campaign.status !== CAMPAIGN_STATUS.DRAFT ? 'Solo se pueden agregar participantes a borradores' : 'Agregar un nuevo participante a esta campaña'}
                    >
                        + Agregar Participante
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th scope="col">Evaluado</th>
                                <th scope="col" className="text-center">Autoevaluación</th>
                                <th scope="col">Superior</th>
                                <th scope="col">Pares</th>
                                <th scope="col">Equipo</th>
                                <th const="col" className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaign.selectedUsers?.map((user) => {
                                const effectiveManagers = getEffectiveEvaluators(user, 'manager');
                                const effectivePeers = getEffectiveEvaluators(user, 'peer');
                                const effectiveSubordinates = getEffectiveEvaluators(user, 'subordinate');
                                const validation = checkMissingEvaluators(user);

                                return (
                                    <tr key={user.id} className={validation.hasError ? 'row-error' : ''}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-name">{user.name}</div>
                                                    <div className="user-role">{user.jobTitle || usersMap[user.id]?.jobTitle || 'Sin cargo'}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="text-center">
                                            {campaign.evaluatorRules?.self ? (
                                                <span className="badge-required">Requerido</span>
                                            ) : (
                                                <span className="dash-icon">-</span>
                                            )}
                                        </td>

                                        <td>
                                            <div className="manager-list">
                                                {campaign.evaluatorRules?.manager ? (
                                                    user.skipManagerEvaluation ? (
                                                        <span className="badge-exempt">Exento (CEO/Dueño)</span>
                                                    ) : effectiveManagers.length > 0 ? (
                                                        effectiveManagers.map(mgrId => (
                                                            <div key={mgrId} className="manager-item">
                                                                {getUserName(mgrId)}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="error-text">⚠️ Falta Superior</span>
                                                    )
                                                ) : (
                                                    <span className="dash-icon">-</span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            {campaign.evaluatorRules?.peers ? (
                                                effectivePeers.length > 0 ? (
                                                    <div className="manager-list">
                                                        {effectivePeers.map(peerId => (
                                                            <div key={peerId} className="manager-item">
                                                                {getUserName(peerId)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span title="Los pares se asignarán automáticamente basados en la Familia de Puesto">
                                                        {user.peersCount || 0} Pares potenciales
                                                    </span>
                                                )
                                            ) : (
                                                <span className="dash-icon">-</span>
                                            )}
                                        </td>

                                        <td>
                                            {campaign.evaluatorRules?.subordinates ? (
                                                effectiveSubordinates.length > 0 ? (
                                                    <div className="manager-list">
                                                        {effectiveSubordinates.length} Reportes
                                                    </div>
                                                ) : (
                                                    <span className="empty-text">0 Reportes</span>
                                                )
                                            ) : (
                                                <span className="dash-icon">-</span>
                                            )}
                                        </td>

                                        <td className="text-right">
                                            <button
                                                className="btn-action"
                                                onClick={() => handleOpenModal(user)}
                                                title="Editar evaluadores"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {(!campaign.selectedUsers || campaign.selectedUsers.length === 0) && (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-gray-500">
                                        No hay usuarios seleccionados en esta campaña.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            <EvaluatorAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                evaluatee={selectedEvaluatee}
                allUsers={allUsers}
                onSave={handleSaveEvaluators}
            />

            {/* Add Participant Modal */}
            <AddParticipantModal
                isOpen={isAddParticipantModalOpen}
                onClose={() => setIsAddParticipantModalOpen(false)}
                allUsers={allUsers}
                existingParticipantIds={campaign.selectedUsers?.map(u => u.id) || []}
                onAdd={handleAddParticipant}
            />
        </div>
    );
};

export default CampaignDashboard;
