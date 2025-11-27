// src/components/members/MemberDataTools.jsx
import React from 'react';

/**
 * Stats cards and import/export tools for member management
 * @param {array} members - All members
 * @param {boolean} uploading - Whether CSV upload is in progress
 * @param {boolean} isImporting - Whether import job is running
 * @param {function} onFileUpload - Handler for CSV file upload
 * @param {function} onDownloadTemplate - Handler to download CSV template
 * @param {function} onExportMembers - Handler to export members to Excel
 */
const MemberDataTools = ({
    members,
    uploading,
    isImporting,
    onFileUpload,
    onDownloadTemplate,
    onExportMembers
}) => {
    // Calculate stats
    const stats = {
        total: members.length,
        active: members.filter(m => m.isActive !== false).length,
        inactive: members.filter(m => m.isActive === false).length,
    };

    return (
        <>
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total miembros</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Activos</div>
                    <div className="stat-value">{stats.active}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Inactivos</div>
                    <div className="stat-value">{stats.inactive}</div>
                </div>
            </div>

            {/* Import and Export Sections - Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Import Section */}
                <div className="import-section" style={{ marginBottom: 0 }}>
                    <h2>Importar Miembros</h2>
                    <p className="section-description">
                        Descarga la plantilla CSV, complétala con los datos de tus miembros y súbela aquí
                    </p>
                    <div className="import-buttons">
                        <button
                            onClick={onDownloadTemplate}
                            className="btn-action btn-outline"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                            📥 Descargar Plantilla
                        </button>
                        <label className="btn-action btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            {uploading ? 'Subiendo...' : '📤 Subir'}
                            <input
                                type="file"
                                accept=".csv"
                                onChange={onFileUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                        </label>
                        {isImporting && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                <span>Importando miembros...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Export Section */}
                {members.length > 0 && (
                    <div className="import-section" style={{ marginBottom: 0 }}>
                        <h2>Exportar Miembros</h2>
                        <p className="section-description">
                            Exporta todos los miembros actuales a un archivo Excel
                        </p>
                        <div className="import-buttons">
                            <button
                                onClick={onExportMembers}
                                className="btn-action btn-primary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                                📊 Exportar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MemberDataTools;
