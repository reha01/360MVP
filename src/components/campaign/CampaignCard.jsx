/**
 * Tarjeta para mostrar información de una campaña
 */

import React from 'react';
import { getCampaignStatusLabel, getCampaignTypeLabel } from '../../models/Campaign';

const CampaignCard = ({ campaign, onActivate, onClose }) => {
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
  
  const canActivate = campaign.status === 'draft';
  const canClose = campaign.status === 'active';
  
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
        {canActivate && (
          <button
            className="campaign-card-btn campaign-card-btn-primary"
            onClick={() => onActivate(campaign.id || campaign.campaignId)}
          >
            ▶ Activar
          </button>
        )}
        
        {canClose && (
          <button
            className="campaign-card-btn campaign-card-btn-outline"
            onClick={() => onClose(campaign.id || campaign.campaignId)}
          >
            ⏸ Cerrar
          </button>
        )}
        
        {!canActivate && !canClose && (
          <button
            className="campaign-card-btn campaign-card-btn-outline"
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
