import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import { getCampaign, updateCampaign } from '../../services/campaignService';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { CAMPAIGN_STATUS } from '../../models/Campaign';
import './CampaignDashboard.css'; // We'll create this later or use inline styles for now

const CampaignDashboard = () => {
    const { campaignId } = useParams();
    const { currentOrgId } = useMultiTenant();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState(null);
    const [usersMap, setUsersMap] = useState({}); // Map ID -> User Name
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!currentOrgId || !campaignId) return;

        const loadData = async () => {
            try {
                setLoading(true);
                // Load campaign and all users in parallel
                const [campaignData, allUsers] = await Promise.all([
                    getCampaign(currentOrgId, campaignId),
                    getOrgUsers(currentOrgId)
                ]);

                setCampaign(campaignData);

                // Create a lookup map for users
                const map = {};
                allUsers.forEach(u => {
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

        // Validation logic here (e.g., check if everyone has evaluators)
        // For now, we assume if they are in the list, it's valid enough to try, 
        // but in a real scenario we'd check specific rules.

        if (!window.confirm('¿Estás seguro de que deseas lanzar esta campaña? Esto enviará las invitaciones.')) {
            return;
        }

        try {
            setProcessing(true);
            await updateCampaign(currentOrgId, campaign.id, {
                status: CAMPAIGN_STATUS.ACTIVE,
                launchedAt: new Date()
            });

            // Update local state
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

    const getUserName = (userId) => {
        return usersMap[userId]?.name || 'Usuario desconocido';
    };

    if (loading) return <div className="p-8 text-center">Cargando campaña...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!campaign) return <div className="p-8 text-center">No se encontró la campaña</div>;

    return (
        <div className="campaign-dashboard p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'Activa' : 'Borrador'}
                        </span>
                        <span className="text-sm text-gray-500">
                            {campaign.selectedUsers?.length || 0} Evaluados
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => navigate('/gestion/campanas')}
                    >
                        Volver
                    </button>
                    {campaign.status === CAMPAIGN_STATUS.DRAFT && (
                        <button
                            onClick={handleLaunchCampaign}
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Lanzando...' : 'Lanzar Campaña'}
                        </button>
                    )}
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Matriz de Evaluación</h3>
                    <p className="text-sm text-gray-500">Revisa y calibra los evaluadores para cada participante.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Evaluado
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Autoevaluación
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Superior
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pares
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipo
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaign.selectedUsers?.map((user) => (
                                <tr key={user.id}>
                                    {/* Evaluado */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                                {user.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Autoevaluación */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {campaign.evaluatorRules?.self ? (
                                            <span className="text-green-600 text-lg">✓</span>
                                        ) : (
                                            <span className="text-gray-300 text-lg">-</span>
                                        )}
                                    </td>

                                    {/* Superior */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {user.managerIds && user.managerIds.length > 0 ? (
                                                user.managerIds.map(mgrId => (
                                                    <div key={mgrId} className="flex items-center gap-1 mb-1">
                                                        <span>{getUserName(mgrId)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-yellow-600 italic text-xs">Sin asignar</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Pares */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {/* Logic for peers is tricky without explicit assignments. 
                          For now, showing count or "Auto-assigned" based on rules. 
                          Ideally we'd list them if we had them. 
                          Since we don't have explicit peerIds in the user object yet (only count),
                          we'll show a placeholder or the count.
                      */}
                                            {campaign.evaluatorRules?.peers ? (
                                                <span title="Los pares se asignarán automáticamente basados en la Familia de Puesto">
                                                    {user.peersCount || 0} Pares potenciales
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Equipo (Subordinados) */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {campaign.evaluatorRules?.subordinates ? (
                                                <span>{user.dependentsCount || 0} Reportes</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CampaignDashboard;
