/**
 * Tarjeta de agregación individual
 */

import React from 'react';
import { BarChart3, Users, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { 
  getAggregationStatusLabel, 
  getAggregationStatusColor,
  getScoringMethodLabel 
} from '../../models/Evaluation360Aggregation';
import { Button, Card, Badge } from '../ui';

const AggregationCard = ({ aggregation, onView, onReprocess }) => {
  const formatDate = (date) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES');
  };
  
  const formatScore = (score) => {
    return score ? `${score.toFixed(2)}/5.0` : 'N/A';
  };
  
  const getAnonymityStatus = () => {
    if (!aggregation.anonymityStatus) return null;
    
    const statuses = Object.values(aggregation.anonymityStatus);
    const met = statuses.filter(s => s.met).length;
    const total = statuses.length;
    
    return { met, total };
  };
  
  const anonymityStatus = getAnonymityStatus();
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {aggregation.evaluateeName || 'Evaluado'}
            </h3>
            <Badge className={getAggregationStatusColor(aggregation.status)}>
              {getAggregationStatusLabel(aggregation.status)}
            </Badge>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {aggregation.totalResponses}
              </span>
            </div>
            <div className="text-xs text-gray-500">Respuestas</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BarChart3 className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {formatScore(aggregation.overallScore)}
              </span>
            </div>
            <div className="text-xs text-gray-500">Score Global</div>
          </div>
        </div>
        
        {/* Anonymity Status */}
        {anonymityStatus && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Umbrales de Anonimato</span>
              <span className={`font-medium ${
                anonymityStatus.met === anonymityStatus.total 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`}>
                {anonymityStatus.met}/{anonymityStatus.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  anonymityStatus.met === anonymityStatus.total 
                    ? 'bg-green-600' 
                    : 'bg-yellow-600'
                }`}
                style={{ width: `${(anonymityStatus.met / anonymityStatus.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Metrics */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completitud</span>
            <span className="font-medium text-gray-900">
              {aggregation.metrics?.completionRate || 0}%
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Consenso</span>
            <span className="font-medium text-gray-900">
              {aggregation.metrics?.consensusIndex || 0}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Método</span>
            <span className="font-medium text-gray-900">
              {getScoringMethodLabel(aggregation.scoringMethod)}
            </span>
          </div>
        </div>
        
        {/* Warnings */}
        {aggregation.warnings && aggregation.warnings.length > 0 && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                {aggregation.warnings.length} advertencia(s)
              </span>
            </div>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Creada: {formatDate(aggregation.createdAt)}</div>
          {aggregation.processedAt && (
            <div>Procesada: {formatDate(aggregation.processedAt)}</div>
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
          
          {aggregation.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReprocess}
              className="flex-1 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reprocesar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AggregationCard;
