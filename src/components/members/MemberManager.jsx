// src/components/members/MemberMan ager.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useMemberManagement } from '../../hooks/useMemberManagement';
import MemberFormModal from './MemberFormModal';
import MemberDataTools from './MemberDataTools';
import './MemberManager.css';

const MemberManager = () => {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const { isSuperAdmin } = useSuperAdmin();

  // Get all member management state and functions from hook
  const memberManagement = useMemberManagement(activeOrgId, user);

  const {
    members,
    loading,
    error,
    setError,
    uploading,
    importJobs,
    editingMember,
    editSaving,
    editError,
    setEditError,
    deletingMember,
    deleteConfirming,
    orgRoles,
    jobFamilies,
    areas,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handleEditMember,
    handleCloseEditModal,
    handleSaveMember,
    handleDeleteMember,
    handleConfirmDelete,
    handleCancelDelete,
    handleFileUpload,
    downloadTemplate,
    exportMembersToExcel,
  } = memberManagement;

  // Calculate isImporting status
  const latestJob = importJobs[0];
  const isImporting = latestJob &&
    ['pending', 'processing'].includes(latestJob.status) &&
    latestJob.createdAt &&
    (Date.now() - latestJob.createdAt.toMillis()) < 60000;

  return (
    <div className="member-manager-container">
      {/* Header */}
      <div className="member-manager-header">
        <h1>Gestión de Miembros</h1>
        <p className="description">
          Administra los miembros de tu organización
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats + Import/Export Tools */}
      <MemberDataTools
        members={members}
        uploading={uploading}
        isImporting={isImporting}
        onFileUpload={handleFileUpload}
        onDownloadTemplate={downloadTemplate}
        onExportMembers={exportMembersToExcel}
      />

      {/* Members Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Cargando miembros...</span>
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No hay miembros registrados. Importa un archivo CSV para comenzar.
          </div>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Cargo</th>
                <th>Job Family</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const shouldPaginate = members.length > 10;
                const startIndex = shouldPaginate ? (currentPage - 1) * itemsPerPage : 0;
                const endIndex = shouldPaginate ? startIndex + itemsPerPage : members.length;
                const paginatedMembers = shouldPaginate ? members.slice(startIndex, endIndex) : members;

                return paginatedMembers.map((member) => {
                  const fullName = [
                    member.name,
                    member.lastNamePaternal || member.lastName,
                    member.lastNameMaternal
                  ].filter(Boolean).join(' ') || '--';

                  const jobFamilyName = member.jobFamilyName ||
                    (member.jobFamilyId && jobFamilies.find(jf => jf.id === member.jobFamilyId)?.name) ||
                    (member.jobFamilyIds && member.jobFamilyIds.length > 0 && jobFamilies.find(jf => jf.id === member.jobFamilyIds[0])?.name) ||
                    '--';

                  return (
                    <tr key={member.id}>
                      <td>{fullName}</td>
                      <td>{member.email || member.workEmail || '--'}</td>
                      <td>{member.role || member.memberRole || '--'}</td>
                      <td>{member.cargo || member.jobTitle || '--'}</td>
                      <td>{jobFamilyName}</td>
                      <td>{member.area || member.areaName || member.unit || member.department || '--'}</td>
                      <td>
                        {member.isActive === false ? (
                          <span className="status-badge status-expired">Inactivo</span>
                        ) : (
                          <span className="status-badge status-completed">Activo</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="btn-action-minimal btn-edit-minimal"
                            title="Editar miembro"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="btn-action-minimal btn-delete-minimal"
                            title="Eliminar miembro"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              })()}
            </tbody>
          </table>
        )}

        {/* Pagination - Only show if more than 10 members */}
        {members.length > 10 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderTop: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>
                de {members.length} miembros
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-action btn-secondary"
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '13px', color: '#495057', padding: '0 8px' }}>
                Página {currentPage} de {Math.ceil(members.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(members.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(members.length / itemsPerPage)}
                className="btn-action btn-secondary"
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  opacity: currentPage >= Math.ceil(members.length / itemsPerPage) ? 0.5 : 1,
                  cursor: currentPage >= Math.ceil(members.length / itemsPerPage) ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <MemberFormModal
          editingMember={editingMember}
          onClose={handleCloseEditModal}
          onSave={handleSaveMember}
          members={members}
          jobFamilies={jobFamilies}
          areas={areas}
          orgRoles={orgRoles}
          isSuperAdmin={isSuperAdmin}
          saving={editSaving}
          error={editError}
          onErrorClose={() => setEditError(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
              <div>
                <h3 className="modal-header" style={{ margin: 0 }}>
                  Confirmar eliminación
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                ¿Estás seguro de que deseas eliminar a{' '}
                <strong>{deletingMember.displayName || deletingMember.email}</strong>?
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                Email: {deletingMember.email}
              </p>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleCancelDelete}
                disabled={deleteConfirming}
                className="btn-modal btn-modal-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirming}
                className="btn-modal btn-modal-danger"
              >
                {deleteConfirming && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>}
                {deleteConfirming ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
