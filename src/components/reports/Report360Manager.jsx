/**
 * Componente para gestión de reportes 360°
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import report360Service from '../../services/report360Service';
import { 
  getReportStatusLabel, 
  getReportStatusColor,
  getReportTypeLabel 
} from '../../models/Report360';
import { Button, Card, Badge, Alert, Spinner, Tabs } from '../ui';

// Subcomponentes
import Report360Card from './Report360Card';
import Report360Viewer from './Report360Viewer';

const Report360Manager = ({ orgId, campaignId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [generating, setGenerating] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    if (campaignId) {
      loadData();
    }
  }, [campaignId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reportsData, statsData] = await Promise.all([
        report360Service.getCampaignReports(orgId, campaignId),
        report360Service.getReportStats(orgId, campaignId)
      ]);
      
      setReports(reportsData);
      setStats(statsData);
      
      console.log(`[Report360Manager] Loaded ${reportsData.length} reports`);
    } catch (err) {
      console.error('[Report360Manager] Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateReport = async (aggregationId) => {
    try {
      setGenerating(true);
      await report360Service.generateReport360(orgId, aggregationId, 'system');
      await loadData();
    } catch (err) {
      console.error('[Report360Manager] Error generating report:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleViewReport = (report) => {
    setSelectedReport(report);
  };
  
  const handleCloseViewer = () => {
    setSelectedReport(null);
  };
  
  const handleDownloadPDF = async (report) => {
    try {
      // Implementar descarga de PDF
      console.log('[Report360Manager] Downloading PDF for report:', report.id);
    } catch (err) {
      console.error('[Report360Manager] Error downloading PDF:', err);
      setError(err.message);
    }
  };
  
  // Filtrar reportes por estado
  const filteredReports = reports.filter(report => {
    if (activeTab === 'all') return true;
    return report.status === activeTab;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Cargando reportes...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert type="error" className="mb-4">
        <AlertCircle className="w-4 h-4" />
        <Alert.Description>{error}</Alert.Description>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Cerrar
        </Button>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Reportes 360°
          </h2>
          <p className="text-gray-600 mt-1">
            Generación y gestión de reportes de evaluaciones 360°
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          
          <Button
            onClick={() => setGenerating(true)}
            disabled={generating}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generar Reportes
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {stats.total}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Reportes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.total} reportes
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {stats.completed}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completados</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.completed} reportes
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {stats.averageScore}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Score Promedio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.averageScore}/5.0
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">
                      {stats.averageGenerationTime}s
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.averageGenerationTime}s
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="all">Todas ({reports.length})</Tabs.Trigger>
          <Tabs.Trigger value="pending">Pendientes ({stats?.pending || 0})</Tabs.Trigger>
          <Tabs.Trigger value="generating">Generando ({stats?.generating || 0})</Tabs.Trigger>
          <Tabs.Trigger value="completed">Completados ({stats?.completed || 0})</Tabs.Trigger>
          <Tabs.Trigger value="failed">Fallidos ({stats?.failed || 0})</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map(report => (
              <Report360Card
                key={report.id}
                report={report}
                onView={() => handleViewReport(report)}
                onDownload={() => handleDownloadPDF(report)}
                onRegenerate={() => handleGenerateReport(report.aggregationId)}
              />
            ))}
          </div>
          
          {filteredReports.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay reportes
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'all' 
                    ? 'No hay reportes para esta campaña'
                    : `No hay reportes en estado ${getReportStatusLabel(activeTab).toLowerCase()}`
                  }
                </p>
                <Button
                  onClick={() => setGenerating(true)}
                  disabled={generating}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generar Primer Reporte
                </Button>
              </div>
            </Card>
          )}
        </Tabs.Content>
      </Tabs>
      
      {/* Report Viewer Modal */}
      {selectedReport && (
        <Report360Viewer
          report={selectedReport}
          onClose={handleCloseViewer}
          onDownload={() => handleDownloadPDF(selectedReport)}
        />
      )}
    </div>
  );
};

export default Report360Manager;
