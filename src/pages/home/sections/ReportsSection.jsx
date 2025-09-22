// src/pages/home/sections/ReportsSection.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState, SkeletonList } from '../../../components/ui';
import useReports from '../../../hooks/useReports';
import useFeatureFlags from '../../../hooks/useFeatureFlags';

/**
 * ReportsSection - Sección de mis informes limpia
 */
const ReportsSection = () => {
  const { items: reports, total, loading, error } = useReports();
  const { pdfEnabled } = useFeatureFlags();
  const [activeMenuId, setActiveMenuId] = useState(null);

  if (loading) {
    return (
      <section className="reports-section">
        <Card>
          <CardHeader>
            <CardTitle>Mis informes</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonList items={3} />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reports-section">
        <Card>
          <CardHeader>
            <CardTitle>Mis informes</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="⚠️"
              title="Error al cargar"
              description="No se pudieron cargar los informes."
              size="sm"
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  // Mostrar los 3 más recientes
  const displayReports = reports.slice(0, 3);
  const hasMore = total > displayReports.length;

  const handleMenuAction = (action, reportId) => {
    setActiveMenuId(null);
    
    switch (action) {
      case 'download_pdf':
        // TODO: Implementar descarga de PDF
        console.log('Download PDF for report:', reportId);
        break;
      case 'share':
        // TODO: Implementar compartir enlace
        console.log('Share report:', reportId);
        break;
      default:
        break;
    }
  };

  return (
    <section className="reports-section">
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📊</div>
              <CardTitle>Mis informes</CardTitle>
            </div>
            {total > 0 && (
              <Badge variant="default" size="sm">
                {total}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {displayReports.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No hay informes"
              description="Completa una evaluación para generar tu primer informe."
              size="sm"
              action={
                <Button
                  as={Link}
                  to="/evaluation"
                  variant="secondary"
                  size="sm"
                >
                  Comenzar evaluación
                </Button>
              }
            />
          ) : (
            <div className="reports-list">
              {displayReports.map(report => (
                <ReportItem 
                  key={report.id} 
                  report={report} 
                  pdfEnabled={pdfEnabled}
                  activeMenuId={activeMenuId}
                  onMenuToggle={setActiveMenuId}
                  onMenuAction={handleMenuAction}
                />
              ))}
              
              {hasMore && (
                <div className="view-all-container">
                  <Button
                    as={Link}
                    to="/reports"
                    variant="ghost"
                    size="sm"
                  >
                    Ver todos ({total})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .view-all-container {
          text-align: center;
          padding-top: 8px;
          margin-top: 8px;
          border-top: 1px solid #F1F5F9;
        }
      `}</style>
    </section>
  );
};

/**
 * ReportItem - Item individual de reporte
 */
const ReportItem = ({ report, pdfEnabled, activeMenuId, onMenuToggle, onMenuAction }) => {
  const formatDate = (date) => {
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const getTypeInfo = (type) => {
    const typeMap = {
      self: { label: 'Auto', variant: 'primary' },
      180: { label: '180°', variant: 'purple' },
      360: { label: '360°', variant: 'success' }
    };
    return typeMap[type] || { label: type, variant: 'default' };
  };

  const typeInfo = getTypeInfo(report.type);
  const isMenuOpen = activeMenuId === report.id;

  return (
    <div className="report-item">
      <div className="report-item__main">
        <div className="report-item__header">
          <Badge variant={typeInfo.variant} size="xs">
            {typeInfo.label}
          </Badge>
          <div className="report-item__title">
            {report.title}
          </div>
        </div>
        <div className="report-item__meta">
          <span className="report-item__date">
            {formatDate(report.date)}
          </span>
          {report.score && (
            <>
              <span className="separator">•</span>
              <span className="report-item__score">
                {report.score}/10
              </span>
            </>
          )}
        </div>
      </div>

      <div className="report-item__actions">
        <Button
          as={Link}
          to={report.url}
          variant="primary"
          size="sm"
        >
          Ver informe
        </Button>
        
        {(pdfEnabled || true) && (
          <div className="dropdown-container">
            <button
              className="menu-button"
              onClick={() => onMenuToggle(isMenuOpen ? null : report.id)}
              aria-label="Más opciones"
            >
              ⋯
            </button>
            
            {isMenuOpen && (
              <div className="dropdown-menu">
                {pdfEnabled && report.pdfAvailable && (
                  <button
                    className="dropdown-item"
                    onClick={() => onMenuAction('download_pdf', report.id)}
                  >
                    📄 Descargar PDF
                  </button>
                )}
                <button
                  className="dropdown-item"
                  onClick={() => onMenuAction('share', report.id)}
                >
                  🔗 Compartir enlace
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .report-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px;
          background-color: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          transition: all 0.2s ease;
          gap: 16px;
        }

        .report-item:hover {
          background-color: white;
          border-color: #E5E7EB;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .report-item__main {
          flex: 1;
          min-width: 0;
        }

        .report-item__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .report-item__title {
          font-size: 15px;
          font-weight: 600;
          color: #0B0F14;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .report-item__meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6B7280;
        }

        .separator {
          color: #CBD5E1;
        }

        .report-item__score {
          color: #0A84FF;
          font-weight: 500;
        }

        .report-item__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .dropdown-container {
          position: relative;
        }

        .menu-button {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .menu-button:hover {
          background-color: #F1F5F9;
          color: #0B0F14;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          min-width: 160px;
          padding: 8px 0;
          z-index: 10;
        }

        .dropdown-item {
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: none;
          text-align: left;
          font-size: 14px;
          color: #0B0F14;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown-item:hover {
          background-color: #F8FAFC;
        }

        @media (max-width: 480px) {
          .report-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .report-item__actions {
            justify-content: space-between;
          }

          :global(.report-item__actions .ui-button) {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsSection;
