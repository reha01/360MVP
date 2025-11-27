/**
 * Campaign Dashboard - Placeholder
 * Aquí se gestionará la audiencia, configuración y lanzamiento de campañas
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import campaignService from '../../services/campaignService';

const CampaignDashboard = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const { currentOrgId } = useMultiTenant();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCampaign = async () => {
            try {
                const data = await campaignService.getCampaign(currentOrgId, campaignId);
                setCampaign(data);
            } catch (error) {
                console.error('[CampaignDashboard] Error loading campaign:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentOrgId && campaignId) {
            loadCampaign();
        }
    }, [currentOrgId, campaignId]);

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando campaña...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Campaña no encontrada</p>
                <button
                    onClick={() => navigate('/gestion/campanas')}
                    style={{ marginTop: '16px', padding: '8px 16px' }}
                >
                    Volver a Campañas
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/gestion/campanas')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#3B82F6',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginBottom: '16px'
                    }}
                >
                    ← Volver a Campañas
                </button>
                <h1 style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    {campaign.title}
                </h1>
                <p style={{ color: '#6B7280', margin: 0 }}>
                    Estado: {campaign.status} | ID: {campaignId}
                </p>
            </div>

            {/* Placeholder Content */}
            <div style={{
                background: '#F9FAFB',
                border: '2px dashed #D1D5DB',
                borderRadius: '12px',
                padding: '64px 32px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚧</div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    Dashboard en Construcción
                </h2>
                <p style={{ color: '#6B7280', fontSize: '16px', maxWidth: '600px', margin: '0 auto 24px' }}>
                    Aquí podrás gestionar la audiencia (evaluados), asignar evaluadores,
                    y lanzar la campaña una vez que todo esté configurado.
                </p>

                {/* Preview Info */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '24px',
                    maxWidth: '500px',
                    margin: '0 auto',
                    textAlign: 'left'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        Información de la Campaña
                    </h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                        <div><strong>Título:</strong> {campaign.title}</div>
                        <div><strong>Descripción:</strong> {campaign.description || 'Sin descripción'}</div>
                        <div><strong>Tipo:</strong> {campaign.type}</div>
                        <div><strong>Estado:</strong> {campaign.status}</div>
                        <div><strong>Evaluados:</strong> {campaign.stats?.totalEvaluatees || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDashboard;
