// src/components/ReportViewer.jsx

import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import reportService from '../services/reportService';

const ReportViewer = ({ reportId, report: initialReport = null }) => {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!initialReport && reportId) {
      loadReport();
    } else if (initialReport) {
      processReportData(initialReport);
    }
  }, [reportId, initialReport]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await reportService.getReport(reportId);
      if (result.success) {
        setReport(result.report);
        processReportData(result.report);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (reportData) => {
    const data = reportService.prepareChartData(reportData);
    setChartData(data);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <p>Cargando reporte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#e74c3c' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <p>Error al cargar el reporte: {error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>No se encontró el reporte</p>
      </div>
    );
  }

  const colors = reportService.getChartColors();
  const level = reportService.getLevel(report.metrics?.globalScore || 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
              Reporte de Evaluación {report.type === '360' ? '360°' : 'Individual'}
            </h1>
            <p style={{ color: '#7f8c8d', margin: '0 0 20px 0' }}>
              {report.metadata?.userName} • {reportService.formatDate(report.generatedAt)}
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: level.color,
              marginBottom: '10px'
            }}>
              {report.metrics?.globalScore || 0}%
            </div>
            <div style={{
              backgroundColor: level.color,
              color: 'white',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {level.name}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px'
      }}>
        {['overview', 'narrative', 'charts', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#3498db' : 'transparent',
              color: activeTab === tab ? 'white' : '#7f8c8d',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            {tab === 'overview' && '📋 Resumen'}
            {tab === 'narrative' && '📝 Narrativa'}
            {tab === 'charts' && '📊 Gráficos'}
            {tab === 'recommendations' && '🎯 Recomendaciones'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Resumen Ejecutivo</h2>
            
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <MetricCard
                title="Score Global"
                value={`${report.metrics?.globalScore || 0}%`}
                color={level.color}
                icon="🎯"
              />
              <MetricCard
                title="Dimensiones Evaluadas"
                value={Object.keys(report.metrics?.dimensionScores || {}).length}
                color="#3498db"
                icon="📊"
              />
              <MetricCard
                title="Respuestas Totales"
                value={report.metrics?.totalResponses || 0}
                color="#9b59b6"
                icon="✅"
              />
              <MetricCard
                title="Percentil"
                value={`Top ${100 - (report.benchmarks?.globalComparison?.percentile || 50)}%`}
                color="#2ecc71"
                icon="🏆"
              />
            </div>

            {/* Strengths and Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h3 style={{ color: '#27ae60', marginBottom: '15px' }}>
                  💪 Fortalezas Principales
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {report.metrics?.strengths?.map((strength, index) => (
                    <li key={index} style={{
                      padding: '10px',
                      backgroundColor: '#d4edda',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{reportService.formatDimensionName(strength.dimension)}</span>
                      <strong style={{ color: '#27ae60' }}>{Math.round(strength.score)}%</strong>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>
                  🎯 Áreas de Mejora
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {report.metrics?.weaknesses?.map((weakness, index) => (
                    <li key={index} style={{
                      padding: '10px',
                      backgroundColor: '#f8d7da',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{reportService.formatDimensionName(weakness.dimension)}</span>
                      <strong style={{ color: '#e74c3c' }}>{Math.round(weakness.score)}%</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Narrative Tab */}
        {activeTab === 'narrative' && report.narrative && (
          <div>
            {Object.entries(report.narrative).map(([key, section]) => (
              <div key={key} style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
                  {section.titulo}
                </h2>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db',
                  lineHeight: '1.8',
                  color: '#2c3e50'
                }}>
                  {section.contenido.split('\n').map((paragraph, index) => (
                    <p key={index} style={{ marginBottom: '15px' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && chartData && (
          <div>
            <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>Visualizaciones</h2>
            
            {/* Radar Chart */}
            {chartData.radarData && chartData.radarData.length > 0 && (
              <div style={{ marginBottom: '50px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Perfil de Competencias
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={chartData.radarData}>
                    <PolarGrid stroke="#ecf0f1" />
                    <PolarAngleAxis dataKey="dimension" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={colors.primary}
                      fill={colors.primary}
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar Chart */}
            {chartData.barData && chartData.barData.length > 0 && (
              <div style={{ marginBottom: '50px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Análisis por Categorías
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill={colors.secondary}>
                      {chartData.barData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors.gradient[index % colors.gradient.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribution Chart */}
            {chartData.distributionData && chartData.distributionData.length > 0 && (
              <div style={{ marginBottom: '50px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Distribución de Respuestas
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                    <XAxis dataKey="value" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={colors.info} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Comparison Chart */}
            {chartData.comparisonData && (
              <div>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                  Comparación con Benchmarks
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.comparisonData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value">
                      {chartData.comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? colors.primary : index === 1 ? colors.warning : colors.success}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && report.recommendations && (
          <div>
            <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>Plan de Acción Recomendado</h2>
            
            {Object.entries(report.recommendations).map(([timeframe, actions]) => (
              <div key={timeframe} style={{ marginBottom: '40px' }}>
                <h3 style={{
                  color: '#3498db',
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: '#e8f4fd',
                  borderRadius: '8px'
                }}>
                  {timeframe === 'immediate' && '🚀 Acciones Inmediatas (Próximos 30 días)'}
                  {timeframe === 'shortTerm' && '📅 Corto Plazo (1-3 meses)'}
                  {timeframe === 'mediumTerm' && '🎯 Mediano Plazo (3-6 meses)'}
                  {timeframe === 'longTerm' && '🏆 Largo Plazo (6-12 meses)'}
                </h3>
                
                {Array.isArray(actions) && actions.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {actions.map((action, index) => (
                      <li key={index} style={{
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        borderLeft: '4px solid #3498db'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#2c3e50' }}>
                              {action.action || action}
                            </strong>
                            {action.dimension && (
                              <p style={{ color: '#7f8c8d', marginTop: '5px', marginBottom: 0 }}>
                                Área: {reportService.formatDimensionName(action.dimension)}
                              </p>
                            )}
                          </div>
                          {action.impact && action.effort && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span style={{
                                padding: '5px 10px',
                                backgroundColor: action.impact === 'Alto' ? '#d4edda' : '#fff3cd',
                                color: action.impact === 'Alto' ? '#155724' : '#856404',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                Impacto: {action.impact}
                              </span>
                              <span style={{
                                padding: '5px 10px',
                                backgroundColor: action.effort === 'Bajo' ? '#d4edda' : '#f8d7da',
                                color: action.effort === 'Bajo' ? '#155724' : '#721c24',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                Esfuerzo: {action.effort}
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#7f8c8d' }}>No hay acciones específicas para este período.</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No premium message */}
        {report.plan === 'gratuito' && (activeTab === 'narrative' || activeTab === 'recommendations') && (
          <div style={{
            textAlign: 'center',
            padding: '50px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
            <h3 style={{ color: '#856404' }}>Contenido Premium</h3>
            <p style={{ color: '#856404', marginBottom: '20px' }}>
              {activeTab === 'narrative' 
                ? 'La narrativa completa está disponible en el plan premium'
                : 'Las recomendaciones detalladas están disponibles en el plan premium'}
            </p>
            <button style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Actualizar a Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para mostrar métricas
const MetricCard = ({ title, value, color, icon }) => (
  <div style={{
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: `4px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  }}>
    <div style={{ fontSize: '32px' }}>{icon}</div>
    <div>
      <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: '14px' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color }}>
        {value}
      </p>
    </div>
  </div>
);

export default ReportViewer;
