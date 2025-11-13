// src/pages/ReportView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportViewer from '../components/ReportViewer';
import reportService from '../services/reportService';
import pdfGenerator from '../services/pdfGenerator';
import { ROUTES } from '../constants/routes';

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport();
    } else {
      // Si no hay ID, generar un reporte de demostración
      generateDemoReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await reportService.getReport(id);
      if (result.success) {
        setReport(result.report);
      }
    } catch (error) {
      // Si falla, generar reporte de demostración
      console.error('Error loading report:', error);
      generateDemoReport();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoReport = () => {
    // Reporte de demostración para desarrollo
    const demoReport = {
      id: 'demo-report-123',
      type: 'individual',
      plan: 'premium',
      generatedAt: new Date(),
      metadata: {
        evaluationId: 'eval-demo-123',
        userId: user?.uid || 'demo-user',
        userName: user?.displayName || 'Usuario Demo',
        evaluationType: 'individual',
        completedAt: new Date(),
        totalQuestions: 50
      },
      metrics: {
        globalScore: 75,
        dimensionScores: {
          liderazgo: { average: 82, count: 10 },
          comunicacion: { average: 78, count: 10 },
          innovacion: { average: 65, count: 10 },
          colaboracion: { average: 88, count: 10 },
          estrategia: { average: 70, count: 10 }
        },
        categoryScores: {
          competencias_tecnicas: { average: 80, count: 20 },
          habilidades_blandas: { average: 72, count: 20 },
          liderazgo_personal: { average: 68, count: 10 }
        },
        strengths: [
          { dimension: 'colaboracion', score: 88 },
          { dimension: 'liderazgo', score: 82 },
          { dimension: 'comunicacion', score: 78 }
        ],
        weaknesses: [
          { dimension: 'innovacion', score: 65 },
          { dimension: 'estrategia', score: 70 }
        ],
        distribution: { 1: 2, 2: 5, 3: 15, 4: 20, 5: 8 },
        statistics: { mean: 3.8, median: 4, mode: 4, stdDev: 0.95 },
        totalResponses: 50
      },
      benchmarks: {
        globalComparison: {
          vsIndustry: 10,
          vsTopPerformers: -10,
          percentile: 70,
          trend: 'improving'
        }
      },
      narrative: {
        introduccion: {
          titulo: 'Introducción',
          contenido: 'Este reporte presenta un análisis completo de tu evaluación 360°, proporcionando insights valiosos sobre tu perfil profesional actual y áreas de desarrollo.'
        },
        nivel: {
          titulo: 'Tu Nivel Actual',
          contenido: `Con un score global del 75%, has alcanzado un nivel Competente que te posiciona por encima del promedio de la industria. 
          Tus fortalezas en colaboración (88%) y liderazgo (82%) son especialmente notables y constituyen ventajas competitivas importantes.`
        },
        sombra: {
          titulo: 'Áreas de Atención',
          contenido: `Las áreas de innovación (65%) y estrategia (70%) representan tus principales oportunidades de crecimiento. 
          Estas dimensiones, aunque no son críticas, podrían potenciar significativamente tu impacto profesional si se desarrollan.`
        },
        horizonte: {
          titulo: 'Tu Horizonte de Desarrollo',
          contenido: `Mirando hacia adelante, tu perfil actual te posiciona idealmente para roles de liderazgo de equipos. 
          Con un desarrollo sostenido en innovación y pensamiento estratégico, podrías alcanzar un nivel de excelencia (85%+) en los próximos 12 meses.`
        }
      },
      recommendations: {
        immediate: [
          { action: 'Buscar feedback específico sobre capacidad de innovación', impact: 'Alto', effort: 'Bajo' },
          { action: 'Identificar un mentor con fortaleza en pensamiento estratégico', impact: 'Alto', effort: 'Medio' }
        ],
        shortTerm: [
          { action: 'Participar en workshops de design thinking', impact: 'Alto', effort: 'Medio' },
          { action: 'Liderar un proyecto de innovación pequeño', impact: 'Medio', effort: 'Alto' }
        ],
        mediumTerm: [
          { action: 'Completar certificación en gestión estratégica', impact: 'Alto', effort: 'Alto' }
        ]
      }
    };

    setReport(demoReport);
    setLoading(false);
  };

  const handleGeneratePDF = async () => {
    if (!report) return;
    
    try {
      setGeneratingPDF(true);
      const result = await pdfGenerator.generatePDF(report, {
        includeCharts: true,
        includeNarrative: report.plan === 'premium',
        includeRecommendations: report.plan === 'premium',
        fileName: `reporte_${report.metadata?.userName?.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`
      });
      
      if (result.success) {
        alert(`PDF generado exitosamente: ${result.fileName}`);
      }
    } catch (error) {
      alert(`Error al generar PDF: ${error.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleRegenerateReport = async () => {
    if (!report || !report.metadata?.evaluationId) return;
    
    try {
      setLoading(true);
      const result = await reportService.generateReport(
        report.metadata.evaluationId,
        report.type,
        true // forceRegenerate
      );
      
      if (result.success) {
        await loadReport();
        alert('Reporte regenerado exitosamente');
      }
    } catch (error) {
      alert(`Error al regenerar reporte: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <p>Cargando reporte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>Error al cargar el reporte</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <Link
          to={ROUTES.DASHBOARD}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            display: 'inline-block'
          }}
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Action Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #ecf0f1',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link
            to={ROUTES.DASHBOARD}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#3498db',
              border: '1px solid #3498db',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ← Dashboard
          </Link>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: generatingPDF ? 'not-allowed' : 'pointer',
                opacity: generatingPDF ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {generatingPDF ? 'Generando...' : '📄 Exportar PDF'}
            </button>
            
            <button
              onClick={handleRegenerateReport}
              disabled={loading || !id}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !id ? 'not-allowed' : 'pointer',
                opacity: loading || !id ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {loading ? 'Regenerando...' : '🔄 Regenerar'}
            </button>
            
            {report?.plan === 'gratuito' && (
              <Link
                to={ROUTES.CREDITS}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '600'
                }}
              >
                ⭐ Actualizar a Premium
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Report Viewer Component */}
      <ReportViewer report={report} reportId={id} />
      
      {/* Footer */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderTop: '1px solid #ecf0f1',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '14px',
        marginTop: '50px'
      }}>
        <p>
          Reporte generado el {reportService.formatDate(report?.generatedAt)} • 
          Plan {report?.plan === 'premium' ? 'Premium' : 'Gratuito'} • 
          © 2024 360MVP
        </p>
      </div>
    </div>
  );
};

export default ReportView;
