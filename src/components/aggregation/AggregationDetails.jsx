/**
 * Detalles de agregación 360°
 */

import React from 'react';
import { X, BarChart3, Users, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  getAggregationStatusLabel, 
  getAggregationStatusColor,
  getScoringMethodLabel 
} from '../../models/Evaluation360Aggregation';
import { Button, Card, Badge, Alert } from '../ui';

const AggregationDetails = ({ aggregation, onClose }) => {
  const formatDate = (date) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatScore = (score) => {
    return score ? `${score.toFixed(2)}/5.0` : 'N/A';
  };
  
  const getScoreColor = (score) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getGapIcon = (gap) => {
    if (gap > 0.5) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (gap < -0.5) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };
  
  const getGapColor = (gap) => {
    if (gap > 0.5) return 'text-red-600';
    if (gap < -0.5) return 'text-green-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles de Agregación 360°
            </h2>
            <p className="text-gray-600 mt-1">
              {aggregation.evaluateeName || 'Evaluado'} - {formatDate(aggregation.createdAt)}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Estado</span>
                  <Badge className={getAggregationStatusColor(aggregation.status)}>
                    {getAggregationStatusLabel(aggregation.status)}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {aggregation.isValid ? 'Válida' : 'Inválida'}
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Score Global</span>
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(aggregation.overallScore)}`}>
                  {formatScore(aggregation.overallScore)}
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Respuestas</span>
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {aggregation.validResponses}/{aggregation.totalResponses}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Anonymity Status */}
          {aggregation.anonymityStatus && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado de Umbrales de Anonimato
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(aggregation.anonymityStatus).map(([type, status]) => (
                    <div key={type} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {status.met ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {type}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status.actual}/{status.required}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          
          {/* Scores by Evaluator Type */}
          {aggregation.scoresByType && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Scores por Tipo de Evaluador
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(aggregation.scoresByType).map(([type, score]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {type}
                        </span>
                        <Badge variant="secondary">
                          {score.count} respuestas
                        </Badge>
                      </div>
                      
                      <div className={`text-xl font-bold ${getScoreColor(score.overallScore)}`}>
                        {formatScore(score.overallScore)}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Peso: {score.weight}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Consenso: {score.metrics?.consensusIndex || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          
          {/* Gap Analysis */}
          {aggregation.metrics?.gapAnalysis?.selfVsOthers && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Análisis de Brechas
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Brecha Autoevaluación vs Otros
                      </div>
                      <div className="text-sm text-gray-600">
                        Diferencia promedio entre autoevaluación y evaluación de otros
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getGapIcon(aggregation.metrics.gapAnalysis.selfVsOthers.averageGap)}
                      <span className={`text-lg font-bold ${getGapColor(aggregation.metrics.gapAnalysis.selfVsOthers.averageGap)}`}>
                        {aggregation.metrics.gapAnalysis.selfVsOthers.averageGap > 0 ? '+' : ''}
                        {aggregation.metrics.gapAnalysis.selfVsOthers.averageGap.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {aggregation.metrics.gapAnalysis.selfVsOthers.averageGap > 0.5 && (
                    <Alert type="warning">
                      <AlertCircle className="w-4 h-4" />
                      <Alert.Description>
                        La autoevaluación es significativamente más alta que la evaluación de otros. 
                        Esto puede indicar una sobreestimación de las propias capacidades.
                      </Alert.Description>
                    </Alert>
                  )}
                  
                  {aggregation.metrics.gapAnalysis.selfVsOthers.averageGap < -0.5 && (
                    <Alert type="info">
                      <AlertCircle className="w-4 h-4" />
                      <Alert.Description>
                        La autoevaluación es significativamente más baja que la evaluación de otros. 
                        Esto puede indicar una subestimación de las propias capacidades.
                      </Alert.Description>
                    </Alert>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          {/* Metrics */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas de Calidad
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {aggregation.metrics?.completionRate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Tasa de Completitud</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {aggregation.metrics?.consensusIndex || 0}
                  </div>
                  <div className="text-sm text-gray-500">Índice de Consenso</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getScoringMethodLabel(aggregation.scoringMethod)}
                  </div>
                  <div className="text-sm text-gray-500">Método de Scoring</div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Warnings and Errors */}
          {(aggregation.warnings?.length > 0 || aggregation.validationErrors?.length > 0) && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Advertencias y Errores
                </h3>
                
                <div className="space-y-3">
                  {aggregation.warnings?.map((warning, index) => (
                    <Alert key={index} type="warning">
                      <AlertCircle className="w-4 h-4" />
                      <Alert.Description>{warning}</Alert.Description>
                    </Alert>
                  ))}
                  
                  {aggregation.validationErrors?.map((error, index) => (
                    <Alert key={index} type="error">
                      <AlertCircle className="w-4 h-4" />
                      <Alert.Description>{error}</Alert.Description>
                    </Alert>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AggregationDetails;
