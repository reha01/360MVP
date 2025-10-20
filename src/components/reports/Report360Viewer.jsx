/**
 * Visor de reporte 360°
 */

import React from 'react';
import { X, Download, BarChart3, TrendingUp, TrendingDown, Users, Target, Lightbulb } from 'lucide-react';
import { 
  getScoreLevelLabel,
  getScoreLevelColor,
  getConsensusLevelLabel,
  getGapInterpretationLabel
} from '../../models/Report360';
import { Button, Card, Badge, Alert } from '../ui';

const Report360Viewer = ({ report, onClose, onDownload }) => {
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
              Reporte 360° - {report.evaluateeName}
            </h2>
            <p className="text-gray-600 mt-1">
              Generado el {formatDate(report.generatedAt)}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          {report.executiveSummary && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen Ejecutivo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(report.executiveSummary.overallScore)}`}>
                      {formatScore(report.executiveSummary.overallScore)}
                    </div>
                    <div className="text-sm text-gray-500">Score Global</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {report.evaluatorCount}
                    </div>
                    <div className="text-sm text-gray-500">Evaluadores</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getScoreLevelColor(report.executiveSummary.scoreLevel)}`}>
                      {getScoreLevelLabel(report.executiveSummary.scoreLevel)}
                    </div>
                    <div className="text-sm text-gray-500">Nivel de Desempeño</div>
                  </div>
                </div>
                
                {report.executiveSummary.summaryText && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{report.executiveSummary.summaryText}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Strengths and Opportunities */}
          {(report.executiveSummary?.topStrengths?.length > 0 || report.executiveSummary?.keyOpportunities?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {report.executiveSummary?.topStrengths?.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      Fortalezas Principales
                    </h3>
                    
                    <div className="space-y-3">
                      {report.executiveSummary.topStrengths.map((strength, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium text-green-900">{strength.category}</div>
                            <div className="text-sm text-green-700">
                              {getScoreLevelLabel(strength.level)}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {strength.score.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Opportunities */}
              {report.executiveSummary?.keyOpportunities?.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 text-orange-600 mr-2" />
                      Oportunidades de Desarrollo
                    </h3>
                    
                    <div className="space-y-3">
                      {report.executiveSummary.keyOpportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <div className="font-medium text-orange-900">{opportunity.category}</div>
                            <div className="text-sm text-orange-700">
                              Potencial: +{opportunity.potential.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-orange-600">
                            {opportunity.score.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Category Analysis */}
          {report.categoryAnalysis && Object.keys(report.categoryAnalysis).length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Análisis por Categoría
                </h3>
                
                <div className="space-y-4">
                  {Object.values(report.categoryAnalysis).map((category, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                          <div className="text-sm text-gray-600">
                            Consenso: {getConsensusLevelLabel(getConsensusLevel(category.consensusIndex))}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getScoreColor(category.score)}`}>
                            {formatScore(category.score)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getScoreLevelLabel(category.scoreLevel)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            category.scoreLevel === 'excellent' ? 'bg-green-600' :
                            category.scoreLevel === 'very_good' ? 'bg-green-500' :
                            category.scoreLevel === 'good' ? 'bg-blue-500' :
                            category.scoreLevel === 'satisfactory' ? 'bg-yellow-500' :
                            category.scoreLevel === 'needs_improvement' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(category.score / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
          
          {/* Gap Analysis */}
          {report.gapAnalysis && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Análisis de Brechas
                </h3>
                
                <div className="space-y-4">
                  {/* Self vs Others Gap */}
                  {report.gapAnalysis.selfVsOthers && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            Brecha Autoevaluación vs Otros
                          </h4>
                          <p className="text-sm text-blue-700">
                            Diferencia promedio entre autoevaluación y evaluación de otros
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getGapIcon(report.gapAnalysis.selfVsOthers.averageGap)}
                          <span className={`text-lg font-bold ${getGapColor(report.gapAnalysis.selfVsOthers.averageGap)}`}>
                            {report.gapAnalysis.selfVsOthers.averageGap > 0 ? '+' : ''}
                            {report.gapAnalysis.selfVsOthers.averageGap.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-blue-800">
                        Interpretación: {getGapInterpretationLabel(report.gapAnalysis.selfVsOthers.interpretation)}
                      </div>
                    </div>
                  )}
                  
                  {/* Critical Gaps */}
                  {report.gapAnalysis.criticalGaps && report.gapAnalysis.criticalGaps.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Brechas Críticas</h4>
                      <div className="space-y-2">
                        {report.gapAnalysis.criticalGaps.map((gap, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{gap.category}</span>
                            <span className={`text-sm font-medium ${getGapColor(gap.gap)}`}>
                              {gap.gap > 0 ? '+' : ''}{gap.gap.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          {/* Recommendations */}
          {report.recommendations && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                  Recomendaciones
                </h3>
                
                <div className="space-y-4">
                  {/* Immediate Recommendations */}
                  {report.recommendations.immediate && report.recommendations.immediate.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Acciones Inmediatas</h4>
                      <div className="space-y-2">
                        {report.recommendations.immediate.map((rec, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg">
                            <div className="font-medium text-red-900">{rec.action}</div>
                            <div className="text-sm text-red-700">
                              Impacto: {rec.impact} | Esfuerzo: {rec.effort}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Short Term Recommendations */}
                  {report.recommendations.shortTerm && report.recommendations.shortTerm.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Corto Plazo (1-3 meses)</h4>
                      <div className="space-y-2">
                        {report.recommendations.shortTerm.map((rec, index) => (
                          <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                            <div className="font-medium text-yellow-900">{rec.action}</div>
                            <div className="text-sm text-yellow-700">
                              Impacto: {rec.impact} | Esfuerzo: {rec.effort}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Medium Term Recommendations */}
                  {report.recommendations.mediumTerm && report.recommendations.mediumTerm.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Mediano Plazo (3-6 meses)</h4>
                      <div className="space-y-2">
                        {report.recommendations.mediumTerm.map((rec, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium text-blue-900">{rec.action}</div>
                            <div className="text-sm text-blue-700">
                              Impacto: {rec.impact} | Esfuerzo: {rec.effort}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          {/* Narrative */}
          {report.narrative && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Narrativa del Reporte
                </h3>
                
                <div className="space-y-4">
                  {report.narrative.introduction && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Introducción</h4>
                      <p className="text-gray-700">{report.narrative.introduction}</p>
                    </div>
                  )}
                  
                  {report.narrative.strengths && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Fortalezas</h4>
                      <p className="text-gray-700">{report.narrative.strengths}</p>
                    </div>
                  )}
                  
                  {report.narrative.opportunities && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Oportunidades</h4>
                      <p className="text-gray-700">{report.narrative.opportunities}</p>
                    </div>
                  )}
                  
                  {report.narrative.conclusion && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Conclusión</h4>
                      <p className="text-gray-700">{report.narrative.conclusion}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report360Viewer;
