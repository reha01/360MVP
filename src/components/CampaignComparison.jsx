import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { useRuntimeFeatureFlags } from '../hooks/useRuntimeFeatureFlags';
import campaignService from '../services/campaignService';
import { Card, CardHeader, CardTitle, CardContent, Spinner, Alert, Button } from './ui';
import { formatDate, formatDateRange, toDate } from '../utils/dateFormat';

const metricLabels = {
  totalAssignments: 'Asignaciones Totales',
  completedAssignments: 'Completadas',
  pendingAssignments: 'Pendientes',
  failedAssignments: 'Fallidas',
  averageScore: 'PuntuaciÃ³n Promedio',
  responseRate: 'Tasa de Respuesta',
};

const formatPercentage = (value) => {
  if (typeof value !== 'number') return 'â€”';
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toLocaleString('es-CL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
};

const formatNumeric = (key, value) => {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey.includes('rate') || normalizedKey.includes('percentage')) {
    return formatPercentage(value);
  }

  if (normalizedKey.includes('score') || normalizedKey.includes('average')) {
    return Number(value).toLocaleString('es-CL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  return Number(value).toLocaleString('es-CL');
};

const formatMetric = (key, value) => {
  if (value === undefined || value === null) {
    return 'â€”';
  }

  if (typeof value === 'number') {
    return formatNumeric(key, value);
  }

  if (typeof value === 'string') {
    const parsedDate = toDate(value);
    if (parsedDate) {
      return formatDate(parsedDate, { withTime: true });
    }
    return value;
  }

  const parsedDate = toDate(value);
  if (parsedDate) {
    return formatDate(parsedDate, { withTime: true });
  }

  return value;
};

const useCampaignOptions = (activeOrgId) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCampaigns = async () => {
      if (!activeOrgId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await campaignService.getCampaigns(activeOrgId, {});
        const list = result.campaigns || [];
        if (!cancelled) {
          setCampaigns(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[CampaignComparison] Error loading campaigns:', err);
          setError('No se pudieron cargar las campaÃ±as. Intenta nuevamente.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      cancelled = true;
    };
  }, [activeOrgId]);

  const options = useMemo(
    () =>
      campaigns.map((campaign) => ({
        label: campaign.title || campaign.name || campaign.id,
        value: campaign.id || campaign.campaignId,
        data: campaign,
      })),
    [campaigns]
  );

  return { campaigns, options, loading, error };
};

const CampaignComparison = () => {
  const { activeOrgId, isReady, loading: orgLoading } = useOrg();
  const { isEnabled: comparisonEnabled, loading: flagsLoading } = useRuntimeFeatureFlags(
    'FEATURE_CAMPAIGN_COMPARISON'
  );

  const { campaigns, options, loading: campaignsLoading, error: campaignsError } =
    useCampaignOptions(activeOrgId);

  const [selection, setSelection] = useState({ left: null, right: null });
  const [metrics, setMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchMetrics = useCallback(
    async (campaignId, side) => {
      if (!campaignId || !activeOrgId) return;

      setLoadingMetrics(true);
      setMetricsError(null);

      try {
        const detailed = await campaignService.getCampaign(activeOrgId, campaignId);
        let metricsPayload = detailed?.stats || detailed?.metrics;

        if (!metricsPayload) {
          const result = await campaignService.getCampaigns(activeOrgId, {});
          const list = result.campaigns || [];
          const campaign = list.find((c) => c.id === campaignId);
          metricsPayload = campaign?.stats || campaign?.metrics;
        }

        setMetrics((prev) => ({
          ...prev,
          [side]: metricsPayload || null,
        }));
      } catch (err) {
        console.error('[CampaignComparison] Error fetching metrics:', err);
        setMetricsError('No se pudieron obtener las mÃ©tricas de la campaÃ±a seleccionada.');
        setMetrics((prev) => ({
          ...prev,
          [side]: null,
        }));
      } finally {
        setLoadingMetrics(false);
      }
    },
    [activeOrgId]
  );

  useEffect(() => {
    if (selection.left) {
      fetchMetrics(selection.left, 'left');
    }
  }, [selection.left, fetchMetrics]);

  useEffect(() => {
    if (selection.right) {
      fetchMetrics(selection.right, 'right');
    }
  }, [selection.right, fetchMetrics]);

  const leftCampaign = useMemo(
    () => campaigns.find((campaign) => (campaign.id || campaign.campaignId) === selection.left) || null,
    [campaigns, selection.left]
  );
  const rightCampaign = useMemo(
    () => campaigns.find((campaign) => (campaign.id || campaign.campaignId) === selection.right) || null,
    [campaigns, selection.right]
  );

  const combinedMetricsKeys = useMemo(() => {
    const keys = new Set();
    [metrics.left, metrics.right].forEach((metricBundle) => {
      if (metricBundle) {
        Object.keys(metricBundle).forEach((key) => {
          if (metricBundle[key] !== undefined && metricBundle[key] !== null) {
            keys.add(key);
          }
        });
      }
    });
    return Array.from(keys);
  }, [metrics]);

  if (orgLoading || flagsLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm text-slate-600">Cargando comparativa...</span>
      </div>
    );
  }

  if (!comparisonEnabled) {
    return (
      <div className="max-w-3xl mx-auto p-6" data-testid="campaign-comparison-view">
        <Alert type="info">
          <Alert.Title>FunciÃ³n no disponible</Alert.Title>
          <Alert.Description>
            El mÃ³dulo de comparativas estÃ¡ deshabilitado para tu organizaciÃ³n. Activa el flag
            <code> FEATURE_CAMPAIGN_COMPARISON </code> para continuar.
          </Alert.Description>
        </Alert>
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <div className="max-w-3xl mx-auto p-6" data-testid="campaign-comparison-view">
        <Alert type="warning">
          <Alert.Title>Sin organizaciÃ³n activa</Alert.Title>
          <Alert.Description>
            Selecciona una organizaciÃ³n para comparar sus campaÃ±as.
          </Alert.Description>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6" data-testid="campaign-comparison-view">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Comparativas de Campanas</h1>
          <p className="text-sm text-slate-600">
            Evalua el desempeno de las campanas seleccionando dos o mas y comparando sus metricas.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={async () => {
            setRefreshing(true);
            setFeedback(null);
            try {
              await fetchMetrics(selection.left, 'left');
              await fetchMetrics(selection.right, 'right');
              setFeedback({ type: 'success', message: 'Metricas actualizadas.' });
            } catch (err) {
              console.error('[CampaignComparison] Error refreshing metrics:', err);
              setFeedback({ type: 'error', message: 'No se pudieron actualizar las metricas.' });
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={loadingMetrics || refreshing}
        >
          {refreshing ? 'Actualizando...' : 'Actualizar metricas'}
        </Button>
      </div>

      {feedback && (
        <Alert type={feedback.type === 'error' ? 'error' : 'success'}>
          <Alert.Title>{feedback.type === 'error' ? 'Error' : 'Listo'}</Alert.Title>
          <Alert.Description>{feedback.message}</Alert.Description>
        </Alert>
      )}

      {campaignsError && (
        <Alert type="error">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{campaignsError}</Alert.Description>
        </Alert>
      )}

      {metricsError && (
        <Alert type="warning">
          <Alert.Title>MÃ©tricas no disponibles</Alert.Title>
          <Alert.Description>{metricsError}</Alert.Description>
        </Alert>
      )}

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Selecciona campaÃ±as a comparar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600">CampaÃ±a A</label>
              <select
                value={selection.left || ''}
                onChange={(event) => setSelection((prev) => ({ ...prev, left: event.target.value || null }))}
                disabled={campaignsLoading}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">Selecciona una campaÃ±a</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">CampaÃ±a B</label>
              <select
                value={selection.right || ''}
                onChange={(event) => setSelection((prev) => ({ ...prev, right: event.target.value || null }))}
                disabled={campaignsLoading}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">Selecciona una campaÃ±a</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <CardTitle>Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMetrics ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <span className="text-sm text-slate-600">Cargando mÃ©tricas...</span>
            </div>
          ) : !selection.left && !selection.right ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-slate-500">
              Selecciona al menos una campaÃ±a para ver sus mÃ©tricas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">MÃ©trica</th>
                    <th className="px-4 py-3">{leftCampaign ? (leftCampaign.title || leftCampaign.name) : 'Campaña A'}</th>
                    <th className="px-4 py-3">{rightCampaign ? (rightCampaign.title || rightCampaign.name) : 'Campaña B'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">Estado</td>
                    <td className="px-4 py-3 text-slate-600">{leftCampaign?.status || 'â€”'}</td>
                    <td className="px-4 py-3 text-slate-600">{rightCampaign?.status || 'â€”'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">Periodo</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateRange(
                        leftCampaign?.config?.startDate || leftCampaign?.startDate, 
                        leftCampaign?.config?.endDate || leftCampaign?.endDate, 
                        { withTime: true }
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateRange(
                        rightCampaign?.config?.startDate || rightCampaign?.startDate, 
                        rightCampaign?.config?.endDate || rightCampaign?.endDate, 
                        { withTime: true }
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">Participantes</td>
                    <td className="px-4 py-3 text-slate-600">
                      {leftCampaign?.stats?.totalEvaluatees || leftCampaign?.metrics?.totalAssignments ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {rightCampaign?.stats?.totalEvaluatees || rightCampaign?.metrics?.totalAssignments ?? '—'}
                    </td>
                  </tr>
                  {combinedMetricsKeys.map((key) => (
                    <tr key={key}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {metricLabels[key] || key}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMetric(key, metrics.left?.[key])}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatMetric(key, metrics.right?.[key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignComparison;






