import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { getCampaign, updateCampaign } from '../../services/campaignService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { getOrgJobFamilies } from '../../services/jobFamilyService';
import { CAMPAIGN_STATUS } from '../../models/Campaign';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import * as XLSX from 'xlsx';
import './CampaignDashboard.css';
import EvaluatorManagementModal from './EvaluatorManagementModal';
import AddParticipantModal from './AddParticipantModal';
import { EVALUATION_TYPES } from '../../utils/evaluatorAssignmentLogic';


console.log('>>> APP VERSION: 2.1.14 - OUTGOING TAB FILTER <<<');

const CampaignDashboard = () => {
    const { campaignId } = useParams();
    const { currentOrgId } = useMultiTenant();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [jobFamiliesMap, setJobFamiliesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvaluatee, setSelectedEvaluatee] = useState(null);
    const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);

    useEffect(() => {
        if (!currentOrgId || !campaignId) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const [campaignData, usersData, jobFamiliesData] = await Promise.all([
                    getCampaign(currentOrgId, campaignId),
                    getOrgUsers(currentOrgId),
                    getOrgJobFamilies(currentOrgId)
                ]);

                setCampaign(campaignData);
                setEditedTitle(campaignData.title);
                setAllUsers(usersData);

                const map = {};
                usersData.forEach(u => {
                    map[u.id] = u;
                });
                setUsersMap(map);

                const jfMap = {};
                (jobFamiliesData || []).forEach(jf => {
                    jfMap[jf.id] = jf;
                });
                setJobFamiliesMap(jfMap);

            } catch (err) {
                console.error('Error loading campaign dashboard:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentOrgId, campaignId]);

    const handleExportExcel = () => {
        if (!campaign?.selectedUsers) return;

        const excelData = campaign.selectedUsers.map(user => {
            const effectiveManagers = getEffectiveEvaluators(user, 'manager');
            const effectivePeers = getEffectiveEvaluators(user, 'peer');
            const effectiveSubordinates = getEffectiveEvaluators(user, 'subordinate');
            const workLoad = effectiveManagers.length + effectivePeers.length + effectiveSubordinates.length;

            return {
                'Nombre': user.name,
                'Email': user.email,
                'Cargo': user.jobTitle || usersMap[user.id]?.jobTitle || 'Sin cargo',
                'Auto': campaign.evaluatorRules?.self ? 'Sí' : '-',
                'Jefes': effectiveManagers.length,
                'Pares': effectivePeers.length,
                'Equipo': effectiveSubordinates.length,
                'Carga de Trabajo': workLoad,
                'Estado': 'Pendiente'
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Campaña');

        const fileName = `${campaign.title || 'Campaña'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleLaunchCampaign = async () => {
        if (!campaign) return;

        // Validación específica para 180º Liderazgo
        if (campaign.selectedStrategy === 'LEADERSHIP_180') {
            const usersWithoutTeam = campaign.selectedUsers?.filter(user => {
                const team = allUsers.filter(u => u.managerId === user.id);
                return team.length === 0;
            }) || [];

            if (usersWithoutTeam.length > 0) {
                const names = usersWithoutTeam.map(u => u.name).join(', ');
                alert(`⚠️ No se puede lanzar la campaña 180º Liderazgo:\n\nLos siguientes usuarios no tienen equipo asignado:\n${names}\n\nLa evaluación 180º requiere que el líder tenga subordinados directos para recibir feedback.`);
                return;
            }
        }

        const hasErrors = campaign.selectedUsers?.some(user => checkMissingEvaluators(user).hasError);
        if (hasErrors) {
            alert('No se puede lanzar la campaña porque hay usuarios con evaluadores obligatorios faltantes.');
            return;
        }

        if (!window.confirm('¿Estás seguro de que deseas lanzar esta campaña?')) {
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
        if (!window.confirm('¿Estás seguro de que deseas ELIMINAR este borrador?')) {
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
        // Detect relationships first (what SHOULD be there)
        const { myManagers, myTeam, myPeers } = detectRelationships(evaluatee, allUsers, usersMap);

        // Prefer saved custom evaluators, but fallback to detected ones if null/undefined OR EMPTY
        // Usage Rule: If the user explicitly wants "0", they must save an empty list. 
        // BUT, given the bug history, we assume empty list = "not correctly set" for the "Gran Jefe" case.
        // To be safe and fix the user's issue: If custom list is empty, valid detected relationships take precedence.

        const currentCustom = evaluatee.customEvaluators || {};

        let effectiveManagers = (currentCustom.managers && currentCustom.managers.length > 0)
            ? currentCustom.managers
            : myManagers.map(u => u.id);

        let effectivePeers = (currentCustom.peers && currentCustom.peers.length > 0)
            ? currentCustom.peers
            : myPeers.map(u => u.id);

        let effectiveSubordinates = (currentCustom.subordinates && currentCustom.subordinates.length > 0)
            ? currentCustom.subordinates
            : myTeam.map(u => u.id);

        // Calculate OUTGOING (Who this user evaluates)
        // We use the same helper function from the render loop
        const outgoingIds = calculateOutgoingEvaluations(evaluatee.id);

        // Resolve IDs to Objects
        const resolveIds = (ids) => ids.map(id => usersMap[id]).filter(Boolean);

        const outgoingEvaluations = {
            managers: resolveIds(outgoingIds.toManagers),
            peers: resolveIds(outgoingIds.toPeers),
            subordinates: resolveIds(outgoingIds.toSubordinates)
        };

        // FILTER AUTO-POPULATED LISTS BASED ON STRATEGY
        // To prevent "ghost" evaluators appearing when they shouldn't
        if (campaign.selectedStrategy === 'PEER_ONLY') {
            effectiveManagers = [];
            effectiveSubordinates = [];
        } else if (campaign.selectedStrategy === 'TOP_DOWN') {
            effectivePeers = [];
            effectiveSubordinates = []; // Usually only Manager evaluates
        }

        setSelectedEvaluatee({
            ...evaluatee,
            managerIds: effectiveManagers,
            peerIds: effectivePeers,
            dependentIds: effectiveSubordinates,
            outgoingEvaluations: outgoingEvaluations, // New Prop data
            config: campaign.evaluatorRules // Pass rules for "Auto" check
        });
        setIsModalOpen(true);
    };

    const handleSaveEvaluators = async (updatedEvaluatee) => {
        try {
            const finalCustomEvaluators = {
                managers: updatedEvaluatee.managerIds || [],
                peers: updatedEvaluatee.peerIds || [],
                subordinates: updatedEvaluatee.dependentIds || []
            };

            const updatedSelectedUsers = campaign.selectedUsers.map(u => {
                if (u.id === updatedEvaluatee.id) {
                    return {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        jobTitle: u.jobTitle,
                        customEvaluators: finalCustomEvaluators,
                        skipManagerEvaluation: updatedEvaluatee.skipManagerEvaluation || false,
                    };
                }
                return u;
            });

            setCampaign(prev => ({
                ...prev,
                selectedUsers: updatedSelectedUsers
            }));

            const campaignRef = doc(db, 'organizations', currentOrgId, 'campaigns', campaign.id);
            await updateDoc(campaignRef, {
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
            const newParticipant = {
                id: user.id,
                name: user.name,
                email: user.email,
                jobTitle: user.jobTitle,
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

    /**
     * CORE LOGIC: Detects natural relationships based on data.
     * Returns arrays of User Objects (or IDs if preferred, here Arrays for flexibility).
     */
    const detectRelationships = (user, allUsersData, usersMapData) => {
        // ==========================================
        // 1. NORMALIZACIÓN DE DATOS DEL USUARIO ACTUAL
        // ==========================================
        const currentUserId = String(user.id || user.uid || '');
        const currentUserEmail = (user.email || '').toLowerCase().trim();

        // Obtener datos completos del usuario desde usersMap
        const liveUser = usersMapData[user.id] || user;

        // Normalizar mis Jefes a un Array de Strings (Soporte Single + Multi)
        let myManagerIds = [];
        if (Array.isArray(liveUser?.managerIds)) {
            myManagerIds = liveUser.managerIds.map(id => String(id));
        } else if (liveUser?.managerId) {
            myManagerIds = [String(liveUser.managerId)];
        }

        // ==========================================
        // 2. ENCONTRAR RELACIONES (Lógica Robusta)
        // ==========================================

        // A. MIS JEFES (Incoming Manager)
        const myManagers = allUsersData.filter(u => {
            const uId = String(u.id || u.uid || '');
            const uEmail = (u.email || '').toLowerCase().trim();
            const matchId = myManagerIds.includes(uId);
            const matchEmail = liveUser?.managerEmail && uEmail === liveUser.managerEmail.toLowerCase().trim();
            return matchId || matchEmail;
        });

        // B. MI EQUIPO (Incoming Team / Outgoing Team)
        const myTeam = allUsersData.filter(u => {
            const uMgrIds = Array.isArray(u.managerIds) ? u.managerIds.map(String) : (u.managerId ? [String(u.managerId)] : []);
            const matchId = uMgrIds.includes(currentUserId);
            const matchEmail = u.managerEmail && u.managerEmail.toLowerCase().trim() === currentUserEmail;
            return matchId || matchEmail;
        });

        // C. MIS PARES (Incoming/Outgoing Peers)
        const myPeers = allUsersData.filter(u => {
            if (u.id === user.id) return false; // No soy par de mí mismo

            const uMgrIds = Array.isArray(u.managerIds) ? u.managerIds.map(String) : (u.managerId ? [String(u.managerId)] : []);

            // CASO A: Ambos tienen jefe
            if (myManagerIds.length > 0 && uMgrIds.length > 0) {
                const shareManagerId = uMgrIds.some(id => myManagerIds.includes(id));
                const shareManagerEmail = liveUser?.managerEmail && u.managerEmail &&
                    liveUser.managerEmail.toLowerCase().trim() === u.managerEmail.toLowerCase().trim();
                return shareManagerId || shareManagerEmail;
            }

            // CASO B: Ninguno tiene jefe (C-Level / Directores)
            if (myManagerIds.length === 0 && uMgrIds.length === 0) {
                const myFamId = liveUser.jobFamilyId;
                const theirFamId = u.jobFamilyId;

                if (myFamId && theirFamId && String(myFamId) === String(theirFamId)) return true;

                const getJobFamilyName = (obj) =>
                    String(obj.jobFamily || obj.jobFamilyName || obj.job_family_name || obj.family || '').toLowerCase().trim();

                const myJF = getJobFamilyName(liveUser);
                const theirJF = getJobFamilyName(u);

                if (myJF && theirJF && myJF === theirJF) return true;
                return false;
            }
            return false;
        });

        return { myManagers, myTeam, myPeers };
    };

    /**
     * Calcula los conteos teóricos de evaluadores incoming/outgoing
     * basado en el tipo de evaluación y las relaciones del usuario.
     */
    const calculateTheoreticalCounts = (user, evaluationType) => {
        // 1. OBTENER RELACIONES DETECTADAS
        const { myManagers, myTeam, myPeers } = detectRelationships(user, allUsers, usersMap);

        console.log(`✅ Relaciones calculadas para ${user.name}: Managers=${myManagers.length}, Team=${myTeam.length}, Peers=${myPeers.length}`);

        // Initialize counts
        const incoming = { auto: 1, managers: 0, peers: 0, team: 0 };
        const outgoing = { auto: 1, managers: 0, peers: 0, team: 0 };

        // 2. APLICAR REGLAS SEGÚN TIPO DE CAMPAÑA
        switch (evaluationType) {
            case EVALUATION_TYPES.SELF_ONLY:
                break;

            case EVALUATION_TYPES.TOP_DOWN:
                incoming.managers = myManagers.length;
                outgoing.team = myTeam.length;
                break;

            case 'PEER':
            case 'PEER_TO_PEER':
            case 'PEERS':
            case 'Peer-to-Peer':
            case 'peer-to-peer':
            case 'P2P':
            case 'COLLABORATION':
            case EVALUATION_TYPES.PEER_TO_PEER:
                incoming.peers = myPeers.length;
                outgoing.peers = myPeers.length;
                break;

            case EVALUATION_TYPES.LEADERSHIP_180:
                incoming.managers = myManagers.length;
                incoming.team = myTeam.length;

                const subLeaders = myTeam.filter(member => {
                    return allUsers.some(u => {
                        const uMgrIds = Array.isArray(u.managerIds) ? u.managerIds.map(String) : [];
                        return uMgrIds.includes(String(member.id));
                    });
                });

                outgoing.team = subLeaders.length;
                break;

            case EVALUATION_TYPES.FULL_360:
                incoming.managers = myManagers.length;
                incoming.team = myTeam.length;
                incoming.peers = myPeers.length;

                outgoing.managers = myManagers.length;
                outgoing.team = myTeam.length;
                outgoing.peers = myPeers.length;
                break;

            default:
                console.warn('Unknown evaluation type:', evaluationType);
        }

        return { incoming, outgoing };
    };

    const getEffectiveEvaluators = (user, type) => {
        // 1. Check Custom Override (Explicitly set AND not empty)
        // We apply the same logic as the modal: Empty custom list -> Fallback to smart detection
        if (user.customEvaluators) {
            if (type === 'manager' && user.customEvaluators.managers && user.customEvaluators.managers.length > 0) return user.customEvaluators.managers;
            if (type === 'peer' && user.customEvaluators.peers && user.customEvaluators.peers.length > 0) return user.customEvaluators.peers;
            if (type === 'subordinate' && user.customEvaluators.subordinates && user.customEvaluators.subordinates.length > 0) return user.customEvaluators.subordinates;
        }

        // 2. Fallback to Smart Detection
        const detected = detectRelationships(user, allUsers, usersMap);

        if (type === 'manager') return detected.myManagers.map(u => u.id);
        if (type === 'subordinate') return detected.myTeam.map(u => u.id); // Note: detectRelationships returns 'myTeam' for subordinates
        if (type === 'peer') return detected.myPeers.map(u => u.id);

        return [];
    };

    const checkMissingEvaluators = (user) => {
        const effectiveManagers = getEffectiveEvaluators(user, 'manager');
        let error = null;

        if (campaign.evaluatorRules?.manager && !user.skipManagerEvaluation && effectiveManagers.length === 0) {
            error = 'Falta Superior';
        }

        return { hasError: !!error, error };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString();
    };

    const calculateWorkLoad = (user) => {
        const autoEval = campaign.evaluatorRules?.self ? 1 : 0;
        const managers = getEffectiveEvaluators(user, 'manager');
        const peers = getEffectiveEvaluators(user, 'peer');
        const subordinates = getEffectiveEvaluators(user, 'subordinate');
        return autoEval + managers.length + peers.length + subordinates.length;
    };

    const getWorkloadTooltip = (user) => {
        const autoEval = campaign.evaluatorRules?.self ? 1 : 0;
        const managers = getEffectiveEvaluators(user, 'manager').length;
        const peers = getEffectiveEvaluators(user, 'peer').length;
        const subordinates = getEffectiveEvaluators(user, 'subordinate').length;

        const parts = [];
        if (autoEval) parts.push(`${autoEval} Auto`);
        if (managers) parts.push(`${managers} Jefe${managers > 1 ? 's' : ''}`);
        if (peers) parts.push(`${peers} Par${peers > 1 ? 'es' : ''}`);
        if (subordinates) parts.push(`${subordinates} Equipo`);

        return parts.join(' + ');
    };

    const getNamesForTooltip = (userIds) => {
        return userIds.map(id => getUserName(id)).join(', ') || 'Ninguno';
    };

    // Reverse calculation: How many people of each type THIS user must evaluate
    const calculateOutgoingEvaluations = (userId) => {
        const toManagers = [];
        const toPeers = [];
        const toSubordinates = [];

        // Count how many times this user appears in others' evaluator lists
        campaign.selectedUsers?.forEach(otherUser => {
            if (otherUser.id === userId) return; // Skip self

            const otherManagers = getEffectiveEvaluators(otherUser, 'manager');
            const otherPeers = getEffectiveEvaluators(otherUser, 'peer');
            const otherSubordinates = getEffectiveEvaluators(otherUser, 'subordinate');

            // If current user is in this person's manager list (Manager role),
            // then this person is their SUBORDINATE (Downwards evaluation)
            if (otherManagers.includes(userId)) {
                toSubordinates.push(otherUser.id);
            }

            // If current user is in this person's peer list, they must evaluate a peer
            if (otherPeers.includes(userId)) {
                toPeers.push(otherUser.id);
            }

            // If current user is in this person's subordinate list (Subordinate role),
            // then this person is their MANAGER (Upwards evaluation)
            if (otherSubordinates.includes(userId)) {
                toManagers.push(otherUser.id);
            }
        });

        return {
            toManagers,
            toPeers,
            toSubordinates
        };
    };

    if (loading) return <div className="dashboard-compact"><div className="loading-state">Cargando campaña...</div></div>;
    if (error) return <div className="dashboard-compact"><div className="error-state">Error: {error}</div></div>;
    if (!campaign) return <div className="dashboard-compact"><div className="empty-state">No se encontró la campaña</div></div>;

    return (
        <div className="dashboard-compact">
            {/* Header */}
            <div className="dashboard-header-compact">
                <div className="header-left">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            className="title-input-compact"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                        />
                    ) : (
                        <h1 onClick={() => setIsEditingTitle(true)} className="title-compact">
                            {campaign.title} <span className="edit-pencil">✏️</span>
                        </h1>
                    )}
                    <div className="meta-row">
                        <span className={`badge-status ${campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'active' : 'draft'}`}>
                            {campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'Activa' : 'Borrador'}
                        </span>
                        <span className="meta-item">{campaign.selectedUsers?.length || 0} Evaluados</span>
                        {campaign.config?.startDate && (
                            <span className="meta-item">
                                {formatDate(campaign.config.startDate)} - {formatDate(campaign.config.endDate)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="header-actions-compact">
                    <button className="btn-secondary-compact" onClick={() => navigate('/gestion/campanas')}>
                        Volver
                    </button>
                    <button
                        className="btn-export-compact"
                        onClick={handleExportExcel}
                        disabled={!campaign.selectedUsers || campaign.selectedUsers.length === 0}
                    >
                        📊 Exportar Excel
                    </button>
                    {campaign.status === CAMPAIGN_STATUS.DRAFT && (
                        <>
                            <button
                                onClick={handleDeleteCampaign}
                                disabled={processing}
                                className="btn-danger-compact"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={handleLaunchCampaign}
                                disabled={processing}
                                className="btn-primary-compact"
                            >
                                {processing ? 'Lanzando...' : '🚀 Lanzar Campaña'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Compact Table */}
            <div className="table-wrapper-compact">
                <div className="table-actions-bar">
                    <div>
                        <h2 className="table-title-compact">Matriz de Evaluación</h2>
                        <p className="table-subtitle-compact">Vista compacta - Badges numéricos</p>
                    </div>
                    <button
                        onClick={() => setIsAddParticipantModalOpen(true)}
                        className="btn-add-compact"
                        disabled={campaign.status !== CAMPAIGN_STATUS.DRAFT}
                    >
                        + Agregar
                    </button>
                </div>

                <table className="table-compact">
                    {/* Column width definitions */}
                    <colgroup>
                        <col style={{ width: "30%" }} /> {/* Colaborador */}
                        <col style={{ width: "8%" }} />  {/* Auto */}
                        <col style={{ width: "8%" }} />  {/* Jefes */}
                        <col style={{ width: "8%" }} />  {/* Pares */}
                        <col style={{ width: "8%" }} />  {/* Equipo */}
                        <col style={{ width: "9%" }} />  {/* A Jefes */}
                        <col style={{ width: "9%" }} />  {/* A Pares */}
                        <col style={{ width: "9%" }} />  {/* A Equipo */}
                        <col style={{ width: "11%" }} /> {/* Acciones */}
                    </colgroup>

                    <thead>
                        {/* Fila 1: Super-Headers con color */}
                        <tr className="grouped-headers">
                            <th rowSpan="2" className="col-identity-compact group-header">Colaborador</th>
                            <th colSpan="4" className="header-incoming">📥 RECIBE FEEDBACK DE</th>
                            <th colSpan="3" className="header-outgoing">📤 DEBE EVALUAR A</th>
                            <th rowSpan="2" className="col-actions-compact group-header">Acciones</th>
                        </tr>
                        {/* Individual Column Headers Row */}
                        <tr>
                            <th className="col-numeric border-left-separator">Auto</th>
                            <th className="col-numeric">Jefes</th>
                            <th className="col-numeric">Pares</th>
                            <th className="col-numeric">Equipo</th>
                            <th className="col-numeric border-left-separator">A Jefes</th>
                            <th className="col-numeric">A Pares</th>
                            <th className="col-numeric">A Equipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaign.selectedUsers?.map((user) => {
                            // Get campaign-level evaluation type (global for all users)
                            const evalType = campaign.selectedStrategy || 'SELF_ONLY';

                            // Calculate theoretical counts based on eval type
                            const counts = calculateTheoreticalCounts(user, evalType);

                            // Keep old functions for workload calculation
                            const effectiveManagers = getEffectiveEvaluators(user, 'manager');
                            const effectivePeers = getEffectiveEvaluators(user, 'peer');
                            const effectiveSubordinates = getEffectiveEvaluators(user, 'subordinate');
                            const validation = checkMissingEvaluators(user);
                            const workLoad = calculateWorkLoad(user);
                            const isArchived = usersMap[user.id]?.status === 'archived';

                            return (
                                <tr key={user.id} className={validation.hasError ? 'row-error-compact' : ''}>
                                    {/* Identity */}
                                    <td className="cell-identity-compact">
                                        <div className={`identity-compact ${isArchived ? 'archived' : ''}`}>
                                            <div className="avatar-compact">
                                                {user.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="identity-text">
                                                <div className="name-compact">{user.name}</div>
                                                <div className="email-compact">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Auto */}
                                    <td className="cell-numeric border-left-separator cell-incoming" style={{ backgroundColor: '#f0f9ff' }}>
                                        {counts.incoming.auto > 0 ? (
                                            <span className="badge-numeric badge-auto">{counts.incoming.auto}</span>
                                        ) : (
                                            <span className="badge-none">-</span>
                                        )}
                                    </td>

                                    {/* Superior (Jefes) */}
                                    <td className="cell-numeric cell-incoming" style={{ backgroundColor: '#f0f9ff' }}>
                                        {counts.incoming.managers > 0 ? (
                                            <span className="badge-numeric badge-manager">
                                                {counts.incoming.managers}
                                            </span>
                                        ) : (
                                            // Show warning if type requires manager but none exists
                                            [EVALUATION_TYPES.TOP_DOWN, EVALUATION_TYPES.LEADERSHIP_180, EVALUATION_TYPES.FULL_360].includes(evalType) ? (
                                                <span className="badge-error" title="Este tipo requiere un superior">⚠️</span>
                                            ) : (
                                                <span className="badge-zero">0</span>
                                            )
                                        )}
                                    </td>

                                    {/* Pares */}
                                    <td className="cell-numeric cell-incoming" style={{ backgroundColor: '#f0f9ff' }}>
                                        {counts.incoming.peers > 0 ? (
                                            <span className="badge-numeric badge-peer">
                                                {counts.incoming.peers}
                                            </span>
                                        ) : (
                                            <span className="badge-zero">0</span>
                                        )}
                                    </td>

                                    {/* Equipo */}
                                    <td className="cell-numeric cell-incoming" style={{ backgroundColor: '#f0f9ff' }}>
                                        {counts.incoming.team > 0 ? (
                                            <span className="badge-numeric badge-team">
                                                {counts.incoming.team}
                                            </span>
                                        ) : (
                                            <span className="badge-zero">0</span>
                                        )}
                                    </td>

                                    {/* OUTGOING SECTION - Who they must evaluate */}
                                    {/* A Jefes */}
                                    <td className="cell-numeric border-left-separator cell-outgoing" style={{ backgroundColor: '#fffbeb' }}>
                                        {counts.outgoing.managers > 0 ? (
                                            <span className="badge-numeric badge-outgoing-manager">
                                                {counts.outgoing.managers}
                                            </span>
                                        ) : (
                                            <span className="badge-zero">0</span>
                                        )}
                                    </td>

                                    {/* A Pares */}
                                    <td className="cell-numeric cell-outgoing" style={{ backgroundColor: '#fffbeb' }}>
                                        {counts.outgoing.peers > 0 ? (
                                            <span className="badge-numeric badge-outgoing-peer">
                                                {counts.outgoing.peers}
                                            </span>
                                        ) : (
                                            <span className="badge-zero">0</span>
                                        )}
                                    </td>

                                    {/* A Equipo */}
                                    <td className="cell-numeric cell-outgoing" style={{ backgroundColor: '#fffbeb' }}>
                                        {counts.outgoing.team > 0 ? (
                                            <span className="badge-numeric badge-outgoing-team">
                                                {counts.outgoing.team}
                                            </span>
                                        ) : (
                                            <span className="badge-zero">0</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="cell-actions-compact">
                                        <button
                                            className="btn-edit-compact"
                                            onClick={() => handleOpenModal(user)}
                                            title="Editar evaluadores"
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!campaign.selectedUsers || campaign.selectedUsers.length === 0) && (
                            <tr>
                                <td colSpan="9" className="empty-row">
                                    No hay usuarios seleccionados en esta campaña.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {isModalOpen && selectedEvaluatee && (
                <EvaluatorManagementModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEvaluatee(null);
                    }}
                    evaluatee={selectedEvaluatee}
                    allUsers={allUsers}
                    onSave={handleSaveEvaluators}
                    outgoingEvaluations={selectedEvaluatee.outgoingEvaluations}
                    evaluatorRules={selectedEvaluatee.config}
                    jobFamiliesMap={jobFamiliesMap}
                    campaignStrategy={campaign.selectedStrategy} // PASS STRATEGY EXPLICITLY
                />
            )}
            <AddParticipantModal
                isOpen={isAddParticipantModalOpen}
                onClose={() => setIsAddParticipantModalOpen(false)}
                allUsers={allUsers}
                existingParticipantIds={campaign.selectedUsers?.map(u => u.id) || []}
                onAdd={handleAddParticipant}
            />
        </div >
    );
};

export default CampaignDashboard;
