// src/pages/AnalyticsDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import analyticsService from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);

  // Colores estilo Apple
  const colors = {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    purple: '#AF52DE',
    pink: '#FF2D55',
    gray: {
      100: '#F2F2F7',
      200: '#E5E5EA',
      300: '#D1D1D6',
      400: '#C7C7CC',
      500: '#AEAEB2',
      600: '#8E8E93',
      700: '#636366',
      800: '#48484A',
      900: '#3A3A3C'
    },
    gradient: {
      blue: ['#007AFF', '#5AC8FA'],
      green: ['#34C759', '#30D158'],
      orange: ['#FF9500', '#FFCC00'],
      purple: ['#AF52DE', '#DA8FFF']
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Suscribirse a actualizaciones en tiempo real
    const orgId = user?.organizationId || 'demo-org';
    const unsubscribe = analyticsService.subscribeToMetrics(orgId, handleRealTimeUpdate);
    
    return () => {
      analyticsService.unsubscribeFromMetrics(orgId);
    };
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const orgId = user?.organizationId || 'demo-org';
      const data = await analyticsService.getOrganizationMetrics(orgId, timeRange);
      
      // Si no hay datos reales, usar datos de demostración
      if (!data || Object.keys(data.overview || {}).length === 0) {
        setMetrics(generateDemoMetrics());
      } else {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      setMetrics(generateDemoMetrics());
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (updates) => {
    setRealTimeUpdates(prev => [...updates, ...prev].slice(0, 5));
  };

  const generateDemoMetrics = () => {
    return {
      overview: {
        totalEvaluations: { value: 156, change: 12.5, trend: 'up' },
        completedEvaluations: { value: 142, change: 8.3, trend: 'up' },
        averageScore: { value: 78, change: 3.2, trend: 'up' },
        completionRate: { value: 91, change: -2.1, trend: 'down' }
      },
      participation: {
        activeProcesses: 12,
        participationByRole: {
          'Líder': 24,
          'Par': 48,
          'Reporte Directo': 36,
          'Cliente': 18,
          'Autoevaluación': 30
        },
        responseRates: [
          { processName: 'Q1 Review', rate: 95, total: 20, completed: 19 },
          { processName: 'Annual 360', rate: 88, total: 50, completed: 44 },
          { processName: 'Project Alpha', rate: 82, total: 15, completed: 12 }
        ],
        averageResponseRate: 88.3
      },
      performance: {
        dimensionScores: {
          liderazgo: 82,
          comunicacion: 78,
          innovacion: 71,
          colaboracion: 85,
          estrategia: 74
        },
        topPerformers: [
          { name: 'Ana García', score: 92, level: 'Avanzado' },
          { name: 'Carlos López', score: 88, level: 'Avanzado' },
          { name: 'María Silva', score: 85, level: 'Avanzado' }
        ],
        commonWeaknesses: [
          { dimension: 'Innovación', frequency: 45, percentage: 28.8 },
          { dimension: 'Estrategia', frequency: 38, percentage: 24.4 }
        ],
        averageGlobalScore: 78
      },
      trends: {
        scoreTrend: [
          { date: '2024-01', averageScore: 72, count: 15 },
          { date: '2024-02', averageScore: 74, count: 18 },
          { date: '2024-03', averageScore: 75, count: 22 },
          { date: '2024-04', averageScore: 77, count: 25 },
          { date: '2024-05', averageScore: 78, count: 28 },
          { date: '2024-06', averageScore: 78, count: 30 }
        ],
        projection: [
          { period: 'P+1', projectedScore: 79 },
          { period: 'P+2', projectedScore: 80 },
          { period: 'P+3', projectedScore: 81 }
        ],
        growthRate: 8.3
      },
      distribution: {
        levelDistribution: {
          'Inicial': 8,
          'En Desarrollo': 42,
          'Competente': 68,
          'Avanzado': 24
        },
        scoreRanges: {
          '0-25': 4,
          '26-50': 18,
          '51-75': 62,
          '76-100': 58
        },
        departmentDistribution: {
          'Ventas': 45,
          'Marketing': 30,
          'Tecnología': 38,
          'Operaciones': 22,
          'RRHH': 15
        }
      },
      engagement: {
        averageCompletionTime: 18,
        abandonmentRate: 9,
        activityByDay: {
          'Lunes': 28,
          'Martes': 32,
          'Miércoles': 35,
          'Jueves': 30,
          'Viernes': 22,
          'Sábado': 8,
          'Domingo': 5
        },
        peakHour: '10:00 - 11:00',
        totalActiveUsers: 142,
        sessionsPerUser: 1.1
      }
    };
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!metrics) {
    return <ErrorScreen />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray[100],
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.gray[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: colors.gray[900],
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Analytics Dashboard
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.gray[600],
              margin: '4px 0 0 0'
            }}>
              Métricas organizacionales en tiempo real
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Time Range Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: colors.gray[100],
              borderRadius: '10px',
              padding: '2px'
            }}>
              {['7d', '30d', '90d', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: timeRange === range ? 'white' : 'transparent',
                    color: timeRange === range ? colors.primary : colors.gray[700],
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: timeRange === range ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {range === '7d' && '7 días'}
                  {range === '30d' && '30 días'}
                  {range === '90d' && '3 meses'}
                  {range === '1y' && '1 año'}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: colors.gray[700],
              border: `1px solid ${colors.gray[300]}`,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>↓</span> Exportar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px'
      }}>
        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <KPICard
            title="Evaluaciones Totales"
            value={metrics.overview.totalEvaluations.value}
            change={metrics.overview.totalEvaluations.change}
            trend={metrics.overview.totalEvaluations.trend}
            icon="📊"
            color={colors.primary}
          />
          <KPICard
            title="Tasa de Completado"
            value={`${metrics.overview.completionRate.value}%`}
            change={metrics.overview.completionRate.change}
            trend={metrics.overview.completionRate.trend}
            icon="✅"
            color={colors.success}
          />
          <KPICard
            title="Score Promedio"
            value={`${metrics.overview.averageScore.value}`}
            change={metrics.overview.averageScore.change}
            trend={metrics.overview.averageScore.trend}
            icon="🎯"
            color={colors.purple}
          />
          <KPICard
            title="Usuarios Activos"
            value={metrics.engagement.totalActiveUsers}
            change={8.5}
            trend="up"
            icon="👥"
            color={colors.warning}
          />
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Score Trend Chart */}
          <div style={{
            gridColumn: 'span 8',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Tendencia de Scores
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.trends.scoreTrend}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
                <XAxis 
                  dataKey="date" 
                  stroke={colors.gray[600]}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke={colors.gray[600]}
                  style={{ fontSize: '12px' }}
                  domain={[60, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: `1px solid ${colors.gray[200]}`,
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="averageScore"
                  stroke={colors.primary}
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Level Distribution */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Distribución por Nivel
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.distribution.levelDistribution).map(([key, value]) => ({
                    name: key,
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {Object.keys(metrics.distribution.levelDistribution).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[colors.danger, colors.warning, colors.primary, colors.success][index]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '16px'
            }}>
              {Object.entries(metrics.distribution.levelDistribution).map(([level, count], index) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: [colors.danger, colors.warning, colors.primary, colors.success][index]
                  }} />
                  <span style={{ fontSize: '12px', color: colors.gray[700] }}>
                    {level}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Participation by Role */}
          <div style={{
            gridColumn: 'span 6',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Participación por Rol
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={Object.entries(metrics.participation.participationByRole).map(([role, count]) => ({
                  role,
                  count
                }))}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
                <XAxis 
                  dataKey="role" 
                  stroke={colors.gray[600]}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke={colors.gray[600]}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: `1px solid ${colors.gray[200]}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill={colors.secondary}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div style={{
            gridColumn: 'span 6',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Distribución por Departamento
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="10%" 
                outerRadius="90%" 
                data={Object.entries(metrics.distribution.departmentDistribution).map(([dept, count], index) => ({
                  name: dept,
                  value: count,
                  fill: [colors.primary, colors.secondary, colors.purple, colors.warning, colors.success][index]
                }))}
              >
                <RadialBar dataKey="value" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '16px',
              justifyContent: 'center'
            }}>
              {Object.entries(metrics.distribution.departmentDistribution).map(([dept, count], index) => (
                <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: [colors.primary, colors.secondary, colors.purple, colors.warning, colors.success][index]
                  }} />
                  <span style={{ fontSize: '12px', color: colors.gray[700] }}>
                    {dept}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px'
        }}>
          {/* Top Performers */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Top Performers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {metrics.performance.topPerformers.map((performer, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: colors.gray[100],
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? colors.warning : colors.gray[300],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontSize: '16px'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.gray[900]
                    }}>
                      {performer.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.gray[600]
                    }}>
                      {performer.level}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.primary
                  }}>
                    {performer.score}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Actividad Semanal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(metrics.engagement.activityByDay).map(([day, count]) => {
                const maxCount = Math.max(...Object.values(metrics.engagement.activityByDay));
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '60px',
                      fontSize: '12px',
                      color: colors.gray[700],
                      fontWeight: '500'
                    }}>
                      {day.substring(0, 3)}
                    </div>
                    <div style={{
                      flex: 1,
                      height: '24px',
                      backgroundColor: colors.gray[100],
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: colors.primary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{
                      width: '30px',
                      fontSize: '12px',
                      color: colors.gray[600],
                      textAlign: 'right'
                    }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div style={{
            gridColumn: 'span 4',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '20px'
            }}>
              Métricas de Engagement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MetricRow
                label="Tiempo promedio"
                value={`${metrics.engagement.averageCompletionTime} min`}
                icon="⏱"
              />
              <MetricRow
                label="Tasa de abandono"
                value={`${metrics.engagement.abandonmentRate}%`}
                icon="📉"
                color={metrics.engagement.abandonmentRate < 10 ? colors.success : colors.warning}
              />
              <MetricRow
                label="Hora pico"
                value={metrics.engagement.peakHour}
                icon="🕐"
              />
              <MetricRow
                label="Sesiones por usuario"
                value={metrics.engagement.sessionsPerUser.toFixed(1)}
                icon="🔄"
              />
            </div>
          </div>
        </div>

        {/* Real-time Updates */}
        {realTimeUpdates.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '12px'
            }}>
              Actualizaciones en tiempo real
            </h4>
            {realTimeUpdates.map((update, index) => (
              <div key={index} style={{
                padding: '8px',
                backgroundColor: colors.gray[100],
                borderRadius: '6px',
                marginBottom: '8px',
                fontSize: '12px',
                color: colors.gray[700]
              }}>
                {update.type === 'added' ? '✅' : '📝'} Nueva evaluación completada
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Componente KPI Card
const KPICard = ({ title, value, change, trend, icon, color }) => {
  const colors = {
    gray: {
      100: '#F2F2F7',
      600: '#8E8E93',
      700: '#636366',
      900: '#3A3A3C'
    },
    success: '#34C759',
    danger: '#FF3B30'
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{
            fontSize: '14px',
            color: colors.gray[600],
            margin: '0 0 8px 0',
            fontWeight: '500'
          }}>
            {title}
          </p>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: colors.gray[900],
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            {value}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              color: trend === 'up' ? colors.success : trend === 'down' ? colors.danger : colors.gray[600],
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span style={{
              fontSize: '12px',
              color: colors.gray[600]
            }}>
              vs período anterior
            </span>
          </div>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Componente Metric Row
const MetricRow = ({ label, value, icon, color = '#3A3A3C' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontSize: '14px', color: '#8E8E93' }}>{label}</span>
      </div>
      <span style={{ fontSize: '14px', fontWeight: '600', color }}>{value}</span>
    </div>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#F2F2F7'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #E5E5EA',
      borderTop: '3px solid #007AFF',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: '20px', color: '#8E8E93' }}>Cargando métricas...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Error Screen
const ErrorScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#F2F2F7'
  }}>
    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
    <h2 style={{ color: '#3A3A3C', marginBottom: '10px' }}>Error al cargar métricas</h2>
    <p style={{ color: '#8E8E93' }}>Por favor, intenta nuevamente más tarde</p>
  </div>
);

export default AnalyticsDashboard;
