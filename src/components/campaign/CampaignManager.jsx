/**
 * Componente principal para gestión de campañas 360°
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiTenant } from '../../hooks/useMultiTenant';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import { CAMPAIGN_STATUS } from '../../models/Campaign';
import { getCampaignStatusLabel, getCampaignStatusColor } from '../../models/Campaign';

// Subcomponentes
import CampaignWizard from './CampaignWizard';
import CampaignCard from './CampaignCard';

// Estilos
import './CampaignManager.css';

const CampaignManager = () => {
  const { currentOrgId } = useMultiTenant();
  const { user } = useAuth();

  // Estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [overview, setOverview] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoizar loadData para evitar recreaciones
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [campaignsData, overviewData] = await Promise.all([
        campaignService.getOrgCampaigns(currentOrgId),
        campaignService.getCampaignsOverview(currentOrgId)
      ]);

      setCampaigns(campaignsData);
      setOverview(overviewData);

      console.log('[CampaignManager] Data loaded:', {
        campaigns: campaignsData.length
      });
    } catch (err) {
      console.error('[CampaignManager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  // Cargar datos iniciales
  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId, loadData]);

  // Handlers
  const handleCreateCampaign = async (campaignData) => {
    try {
      await campaignService.createCampaign(currentOrgId, campaignData, user.uid);
      await loadData();
      setShowCampaignWizard(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateCampaign = async (campaignId) => {
    try {
      await campaignService.activateCampaign(currentOrgId, campaignId, user.uid);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    try {
      await campaignService.closeCampaign(currentOrgId, campaignId, user.uid);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      console.log('[CampaignManager] Deleting campaign:', campaignId);
      await campaignService.deleteCampaign(currentOrgId, campaignId);
      console.log('[CampaignManager] Campaign deleted successfully');
      await loadData();
    } catch (err) {
      console.error('[CampaignManager] Error deleting campaign:', err);
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  // Filtrar campañas por búsqueda
  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const title = (campaign.title || campaign.name || '').toLowerCase();
    const description = (campaign.description || '').toLowerCase();
    return title.includes(searchLower) || description.includes(searchLower);
  });

  // Agrupar por estado
  const campaignsByStatus = Object.values(CAMPAIGN_STATUS).reduce((acc, status) => {
    acc[status] = filteredCampaigns.filter(campaign => (campaign.status || 'draft') === status);
    return acc;
  }, {});

  // Renderizar badge de estado
  const renderStatusBadge = (status) => {
    const statusClass = {
      'draft': 'status-draft',
      'active': 'status-active',
      'closed': 'status-closed'
    }[status] || 'status-default';

    return (
      <span className={`status-badge ${statusClass}`}>
        {getCampaignStatusLabel(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span>Cargando campañas...</span>
      </div>
    );
  }

  return (
    <div className="campaign-manager-container">
      {/* Header */}
      <div className="campaign-manager-header">
        <div>
          <h1>Campañas 360°</h1>
          <p className="description">
            Gestiona campañas de evaluación 360° para tu organización
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowCampaignWizard(true)}
        >
          ➕ Nueva Campaña
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Estadísticas */}
      {overview && (
        <div className="stats-grid">
          <div className="stat-card" title="Número total de campañas creadas en el sistema">
            <div className="stat-label">Total campañas</div>
            <div className="stat-value">{overview.total}</div>
            <div className="stat-tooltip">
              Total de campañas creadas en tu organización.
              <br />💡 Incluye borradores, activas y cerradas
            </div>
          </div>

          <div className="stat-card" title="Campañas actualmente activas y en ejecución">
            <div className="stat-label">Activas</div>
            <div className="stat-value">{overview.byStatus.active || 0}</div>
            <div className="stat-tooltip">
              Campañas actualmente activas y en ejecución.
              <br />💡 Los evaluadores pueden completar evaluaciones
            </div>
          </div>

          <div className="stat-card" title="Total de personas evaluadas en todas las campañas">
            <div className="stat-label">Evaluados</div>
            <div className="stat-value">{overview.totalEvaluatees}</div>
            <div className="stat-tooltip">
              Total de personas evaluadas en todas las campañas.
              <br />💡 Personas que han recibido evaluaciones 360°
            </div>
          </div>

          <div className="stat-card" title="Porcentaje promedio de completitud de evaluaciones">
            <div className="stat-label">Completitud</div>
            <div className="stat-value">{overview.averageCompletionRate}%</div>
            <div className="stat-tooltip">
              Porcentaje promedio de completitud de evaluaciones.
              <br />💡 Mide el progreso general de las campañas activas
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="search-section">
        <label>Buscar campañas</label>
        <input
          type="text"
          placeholder="Ej: Evaluación Q1 2024"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="draft">Borradores</option>
          <option value="active">Activas</option>
          <option value="closed">Cerradas</option>
        </select>
      </div>

      {/* Contenido de tabs */}
      <div className="tabs-container">
        <div className="tabs-list">
          <button
            className={`tabs-trigger ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todas
          </button>
          <button
            className={`tabs-trigger ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            Borradores
          </button>
          <button
            className={`tabs-trigger ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Activas
          </button>
          <button
            className={`tabs-trigger ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            Cerradas
          </button>
        </div>

        <div className="tabs-content">
          {/* Tab: Todas */}
          {activeTab === 'all' && (
            <>
              {filteredCampaigns.length > 0 ? (
                <div className="campaigns-grid">
                  {filteredCampaigns.map(campaign => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onDelete={handleDeleteCampaign}
                      onClose={handleCloseCampaign}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3 className="empty-state-title">No hay campañas</h3>
                  <p className="empty-state-description">
                    Comienza creando tu primera campaña de evaluación 360°
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowCampaignWizard(true)}
                  >
                    Crear Campaña
                  </button>
                </div>
              )}
            </>
          )}

          {/* Tab: Por estado */}
          {activeTab !== 'all' && (
            <>
              {campaignsByStatus[activeTab]?.length > 0 ? (
                <div className="campaigns-grid">
                  {campaignsByStatus[activeTab].map(campaign => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onActivate={handleActivateCampaign}
                      onClose={handleCloseCampaign}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3 className="empty-state-title">
                    No hay campañas {getCampaignStatusLabel(activeTab).toLowerCase()}
                  </h3>
                  <p className="empty-state-description">
                    {activeTab === CAMPAIGN_STATUS.DRAFT
                      ? 'Crea una nueva campaña para comenzar'
                      : `No hay campañas en estado ${getCampaignStatusLabel(activeTab).toLowerCase()}`
                    }
                  </p>
                  {activeTab === CAMPAIGN_STATUS.DRAFT && (
                    <button
                      className="btn-primary"
                      onClick={() => setShowCampaignWizard(true)}
                    >
                      Crear Campaña
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Campaign Wizard */}
      {showCampaignWizard && (
        <CampaignWizard
          isOpen={showCampaignWizard}
          onClose={() => setShowCampaignWizard(false)}
          onSuccess={handleCreateCampaign}
        />
      )}
    </div>
  );
};

export default CampaignManager;
