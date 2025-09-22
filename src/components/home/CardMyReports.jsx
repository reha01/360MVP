// src/components/home/CardMyReports.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useReports from '../../hooks/useReports';
import useFeatureFlags from '../../hooks/useFeatureFlags';

/**
 * CardMyReports - Card que muestra los reportes del usuario
 */
const CardMyReports = () => {
  const { items: reports, total, loading, error } = useReports();
  const { pdfEnabled } = useFeatureFlags();
  const [activeMenuId, setActiveMenuId] = useState(null);

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

  const getTypeLabel = (type) => {
    const typeMap = {
      self: { label: 'Auto', color: '#0A84FF', icon: '🎯' },
      180: { label: '180°', color: '#8B5CF6', icon: '📊' },
      360: { label: '360°', color: '#10B981', icon: '🌟' }
    };
    return typeMap[type] || { label: type, color: '#64748B', icon: '📄' };
  };

  const handleMenuToggle = (reportId) => {
    setActiveMenuId(activeMenuId === reportId ? null : reportId);
  };

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

  if (loading) {
    return (
      <div className="card-my-reports">
        <div className="card-my-reports__skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-item"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-my-reports">
        <div className="card-my-reports__error">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Error al cargar</h3>
            <p>No se pudieron cargar los reportes</p>
          </div>
        </div>
      </div>
    );
  }

  const displayReports = reports.slice(0, 3); // Mostrar máximo 3
  const hasMore = total > displayReports.length;

  return (
    <div className="card-my-reports">
      <div className="card-my-reports__header">
        <h3 className="card-my-reports__title">
          Mis Informes
        </h3>
        {total > 0 && (
          <div className="card-my-reports__count">
            {total} {total === 1 ? 'informe' : 'informes'}
          </div>
        )}
      </div>

      <div className="card-my-reports__content">
        {displayReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📊</div>
            <div className="empty-state__text">
              <p>Aún no hay informes</p>
              <span>Completa una evaluación para generar tu primer reporte</span>
            </div>
          </div>
        ) : (
          <div className="report-list">
            {displayReports.map((report) => {
              const typeInfo = getTypeLabel(report.type);
              const isMenuOpen = activeMenuId === report.id;

              return (
                <div key={report.id} className="report-item">
                  <div className="report-item__header">
                    <div className="report-item__main">
                      <div 
                        className="report-item__badge"
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        <span className="report-item__badge-icon">
                          {typeInfo.icon}
                        </span>
                        <span className="report-item__badge-text">
                          {typeInfo.label}
                        </span>
                      </div>
                      <div className="report-item__info">
                        <div className="report-item__title">
                          {report.title}
                        </div>
                        <div className="report-item__meta">
                          <span className="report-item__date">
                            {formatDate(report.date)}
                          </span>
                          {report.score && (
                            <>
                              <span className="report-item__separator">•</span>
                              <span className="report-item__score">
                                {report.score}/10
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="report-item__actions">
                      <Link 
                        to={report.url}
                        className="report-item__view-btn"
                        aria-label={`Ver informe ${report.title}`}
                      >
                        Ver informe
                      </Link>
                      
                      <div className="report-item__menu">
                        <button
                          className="report-item__menu-btn"
                          onClick={() => handleMenuToggle(report.id)}
                          aria-label="Más opciones"
                          aria-expanded={isMenuOpen}
                        >
                          ⋯
                        </button>
                        
                        {isMenuOpen && (
                          <div className="report-item__dropdown">
                            {pdfEnabled && report.pdfAvailable && (
                              <button
                                className="dropdown-item"
                                onClick={() => handleMenuAction('download_pdf', report.id)}
                              >
                                <span className="dropdown-icon">📄</span>
                                Descargar PDF
                              </button>
                            )}
                            <button
                              className="dropdown-item"
                              onClick={() => handleMenuAction('share', report.id)}
                            >
                              <span className="dropdown-icon">🔗</span>
                              Compartir enlace
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="card-my-reports__footer">
          <Link 
            to="/reports"
            className="view-all-link"
          >
            Ver todos ({total})
          </Link>
        </div>
      )}

      <style jsx>{`
        .card-my-reports {
          background-color: white;
          border: 1px solid #E6EAF0;
          border-radius: 20px;
          padding: 24px;
          transition: all 0.2s ease;
          position: relative;
        }

        .card-my-reports:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #D1D5DB;
        }

        .card-my-reports__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-my-reports__title {
          font-size: 20px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0;
          line-height: 1.3;
        }

        .card-my-reports__count {
          font-size: 12px;
          color: #64748B;
          background-color: #F1F5F9;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 500;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 16px;
        }

        .empty-state__icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state__text p {
          font-size: 16px;
          color: #64748B;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .empty-state__text span {
          font-size: 14px;
          color: #94A3B8;
        }

        .report-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .report-item {
          padding: 16px;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          background-color: #FAFBFC;
          transition: all 0.2s ease;
        }

        .report-item:hover {
          border-color: #E6EAF0;
          background-color: white;
        }

        .report-item__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .report-item__main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .report-item__badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .report-item__badge-icon {
          font-size: 12px;
        }

        .report-item__info {
          flex: 1;
          min-width: 0;
        }

        .report-item__title {
          font-size: 15px;
          font-weight: 600;
          color: #0B0F14;
          margin-bottom: 4px;
          line-height: 1.3;
          word-wrap: break-word;
        }

        .report-item__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748B;
        }

        .report-item__separator {
          color: #CBD5E1;
        }

        .report-item__score {
          font-weight: 500;
          color: #0A84FF;
        }

        .report-item__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .report-item__view-btn {
          padding: 6px 12px;
          background-color: #0A84FF;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .report-item__view-btn:hover {
          background-color: #007AFF;
          transform: translateY(-1px);
        }

        .report-item__menu {
          position: relative;
        }

        .report-item__menu-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #64748B;
          font-size: 16px;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .report-item__menu-btn:hover {
          background-color: #F1F5F9;
          color: #0B0F14;
        }

        .report-item__dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #E6EAF0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #F8FAFC;
        }

        .dropdown-icon {
          font-size: 14px;
        }

        .card-my-reports__footer {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .view-all-link {
          color: #0A84FF;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-all-link:hover {
          background-color: #F0F9FF;
          text-decoration: underline;
        }

        /* Skeleton loading */
        .card-my-reports__skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-header {
          height: 24px;
          width: 120px;
          background-color: #E6EAF0;
          border-radius: 8px;
        }

        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-item {
          height: 80px;
          background-color: #F1F5F9;
          border-radius: 12px;
        }

        /* Error state */
        .card-my-reports__error {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          text-align: center;
        }

        .error-icon {
          font-size: 32px;
        }

        .error-text h3 {
          margin: 0 0 4px 0;
          color: #EF4444;
          font-size: 16px;
        }

        .error-text p {
          margin: 0;
          color: #64748B;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default CardMyReports;
