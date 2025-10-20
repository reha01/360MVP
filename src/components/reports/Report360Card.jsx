/**
 * Tarjeta de reporte 360° individual
 */

import React from 'react';
import { FileText, Download, Eye, RefreshCw, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import { 
  getReportStatusLabel, 
  getReportStatusColor,
  getReportTypeLabel,
  getScoreLevelLabel,
  getScoreLevelColor
} from '../../models/Report360';
import { Button, Card, Badge } from '../ui';

const Report360Card = ({ report, onView, onDownload, onRegenerate }) => {
  const formatDate = (date) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES');
  };
  
  const formatScore = (score) => {
    return score ? `${score.toFixed(2)}/5.0` : 'N/A';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'generating':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {report.evaluateeName || 'Evaluado'}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge className={getReportStatusColor(report.status)}>
                {getReportStatusLabel(report.status)}
              </Badge>
              <Badge variant="secondary">
                {getReportTypeLabel(report.reportType)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center">
            {getStatusIcon(report.status)}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600 mr-1" />
              <span className={`text-lg font-semibold ${getScoreColor(report.executiveSummary?.overallScore || 0)}`}>
                {formatScore(report.executiveSummary?.overallScore || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Score Global</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {report.evaluatorCount}
              </span>
            </div>
            <div className="text-xs text-gray-500">Evaluadores</div>
          </div>
        </div>
        
        {/* Score Level */}
        {report.executiveSummary?.scoreLevel && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Nivel de Desempeño</span>
              <span className={`font-medium ${getScoreLevelColor(report.executiveSummary.scoreLevel)}`}>
                {getScoreLevelLabel(report.executiveSummary.scoreLevel)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  report.executiveSummary.scoreLevel === 'excellent' ? 'bg-green-600' :
                  report.executiveSummary.scoreLevel === 'very_good' ? 'bg-green-500' :
                  report.executiveSummary.scoreLevel === 'good' ? 'bg-blue-500' :
                  report.executiveSummary.scoreLevel === 'satisfactory' ? 'bg-yellow-500' :
                  report.executiveSummary.scoreLevel === 'needs_improvement' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: `${((report.executiveSummary.overallScore || 0) / 5) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Strengths and Opportunities */}
        <div className="space-y-2 mb-4">
          {report.executiveSummary?.topStrengths && report.executiveSummary.topStrengths.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Fortalezas</div>
              <div className="text-sm text-gray-700">
                {report.executiveSummary.topStrengths.slice(0, 2).map(strength => strength.category).join(', ')}
                {report.executiveSummary.topStrengths.length > 2 && '...'}
              </div>
            </div>
          )}
          
          {report.executiveSummary?.keyOpportunities && report.executiveSummary.keyOpportunities.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Oportunidades</div>
              <div className="text-sm text-gray-700">
                {report.executiveSummary.keyOpportunities.slice(0, 2).map(opp => opp.category).join(', ')}
                {report.executiveSummary.keyOpportunities.length > 2 && '...'}
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamps */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Creado: {formatDate(report.createdAt)}</div>
          {report.generatedAt && (
            <div>Generado: {formatDate(report.generatedAt)}</div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1 flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          
          {report.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex-1 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
          
          {report.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex-1 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Report360Card;
