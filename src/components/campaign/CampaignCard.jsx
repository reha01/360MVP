/**
 * Tarjeta para mostrar información de una campaña
 * Refactorizada para nuevo flujo "Container First"
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaignStatusLabel, getCampaignTypeLabel } from '../../models/Campaign';

const CampaignCard = ({ campaign, onDelete, onClose }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return 'No definida';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return 'No definida';
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'No definida';
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'draft': 'status-draft',
      'active': 'status-active',
      'closed': 'status-closed'
    };
    return statusMap[status] || 'status-default';
  };

  const isDraft = campaign.status === 'draft';
  const isActive = campaign.status === 'active';

  const handleManage = () => {
    navigate(`/gestion/campanas/${campaign.id || campaign.campaignId}`);
  };

  const handleDelete = () => {
    const campaignId = campaign.id || campaign.campaignId;

    if (!campaignId) {
      console.error('[CampaignCard] No campaign ID found:', campaign);
      alert('Error: No se pudo identificar la campaña');
      return;
    }

    if (!onDelete) {
      console.error('[CampaignCard] No onDelete handler provided');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar la campaña "${campaign.title}"?`)) {
      console.log('[CampaignCard] Deleting campaign:', campaignId);
      onDelete(campaignId);
    }
  };

  return (
    <div className="campaign-card">
      {/* Header */}
      <div className="campaign-card-header">
        <div style={{ flex: 1 }}>
          <h3 className="campaign-card-title">
            {campaign.title || campaign.name || 'Sin título'}
          </h3>
          <span className={`status-badge ${getStatusClass(campaign.status || 'draft')}`}>
            {getCampaignStatusLabel(campaign.status || 'draft')}
          </span>
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="campaign-card-description">
          {campaign.description}
        </p>
      )}

      {/* Type */}
      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6c757d' }}>
        <span>Tipo: </span>
        <span style={{ fontWeight: 500, color: '#212529' }}>
          {getCampaignTypeLabel(campaign.type)}
        </span>
      </div>

      {/* Stats */}
      <div className="campaign-card-stats">
        <div className="campaign-card-stat">
          <div className="campaign-card-stat-value">
            {campaign.stats?.totalEvaluatees || 0}
          </div>
          <div className="campaign-card-stat-label">Evaluados</div>
        </div>

        <div className="campaign-card-stat">
          <div className="campaign-card-stat-value">
            {campaign.stats?.totalInvitations || 0}
          </div>
          <div className="campaign-card-stat-label">Invitaciones</div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6c757d' }}>
        <div style={{ marginBottom: '4px' }}>
          📅 Inicio: {formatDate(campaign.config?.startDate || campaign.startDate)}
        </div>
        <div>
          📅 Fin: {formatDate(campaign.config?.endDate || campaign.endDate)}
        </div>
      </div>

      {/* Completion Rate */}
      {campaign.stats?.completionRate !== undefined && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#6c757d' }}>Completitud</span>
            <span style={{ fontWeight: 500, color: '#212529' }}>
              {campaign.stats.completionRate}%
            </span>
          </div>
          <div style={{ width: '100%', background: '#e9ecef', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div
              style={{
                background: '#0d6efd',
                height: '100%',
                borderRadius: '4px',
                width: `${Math.min(campaign.stats.completionRate, 100)}%`,
                transition: 'width 0.3s'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="campaign-card-actions">
        {isDraft && (
          <>
            <button
              className="campaign-card-btn campaign-card-btn-primary"
              onClick={handleManage}
              style={{ flex: 1 }}
            >
              ⚙️ Gestionar
            </button>
            <button
              className="campaign-card-btn campaign-card-btn-delete"
              onClick={handleDelete}
              title="Eliminar campaña"
              style={{ padding: '8px 12px' }}
            >
              🗑️
            </button>
          </>
        )}

        {isActive && (
          <>
            <button
              className="campaign-card-btn campaign-card-btn-primary"
              onClick={handleManage}
              style={{ flex: 1 }}
            >
              📊 Ver Dashboard
            </button>
            <button
              className="campaign-card-btn campaign-card-btn-outline"
              onClick={() => onClose(campaign.id || campaign.campaignId)}
            >
              ⏸ Cerrar
            </button>
          </>
        )}

        {!isDraft && !isActive && (
          <button
            className="campaign-card-btn campaign-card-btn-outline"
            onClick={handleManage}
            style={{ width: '100%' }}
          >
            👁 Ver detalles
          </button>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;
