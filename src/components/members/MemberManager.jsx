// src/components/members/MemberManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Import memberImportService functions individually to avoid issues
import { 
  uploadMemberCsv, 
  createImportJob,
  subscribeToImportJobs 
} from '../../services/memberImportService';
// Temporary: Using simple components instead of ui library
const Alert = ({ variant, children, ...props }) => (
  <div 
    style={{
      padding: '12px',
      borderRadius: '6px',
      backgroundColor: variant === 'error' ? '#fef2f2' : '#f0f9ff',
      border: `1px solid ${variant === 'error' ? '#fecaca' : '#bae6fd'}`,
      color: variant === 'error' ? '#dc2626' : '#0369a1',
      marginBottom: '16px'
    }}
    {...props}
  >
    {children}
  </div>
);

const Spinner = ({ size = 'md', ...props }) => (
  <div
    style={{
      width: size === 'small' ? '16px' : '32px',
      height: size === 'small' ? '16px' : '32px',
      border: '2px solid #e5e7eb',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block'
    }}
    {...props}
  />
);

// Add CSS for spinner animation
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spinnerStyles;
  if (!document.head.querySelector('style[data-spinner]')) {
    styleSheet.setAttribute('data-spinner', 'true');
    document.head.appendChild(styleSheet);
  }
}

const MemberManager = () => {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importJobs, setImportJobs] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    role: 'member',
    isActive: true
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!activeOrgId) {
      console.log('[MemberManager] No activeOrgId, skipping load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[MemberManager] Loading members for org:', activeOrgId);
      const users = await getOrgUsers(activeOrgId);
      console.log('[MemberManager] Loaded users:', users);
      setMembers(users || []);
    } catch (err) {
      console.error('[MemberManager] Error loading members:', err);
      setError(err.message || 'Error al cargar miembros');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Listen to import jobs
  useEffect(() => {
    if (!activeOrgId) return;

    try {
      const unsubscribe = subscribeToImportJobs(
        activeOrgId,
        (jobs) => {
          console.log('[MemberManager] Import jobs updated:', jobs);
          if (jobs && jobs.length > 0) {
            const latestJob = jobs[0];
            console.log('[MemberManager] Latest job details:', {
              id: latestJob.id,
              status: latestJob.status,
              summary: latestJob.summary,
              hasErrors: latestJob.hasErrors,
              failedRows: latestJob.failedRows
            });
          }
          setImportJobs(jobs || []);
        },
        5
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('[MemberManager] Error setting up import jobs listener:', error);
    }
  }, [activeOrgId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeOrgId) return;

    setUploading(true);
    setError(null);

    try {
      console.log('[MemberManager] Processing CSV file:', file.name);

      // Read and parse CSV file
      const csvText = await file.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('El archivo CSV debe tener al menos una fila de datos además del encabezado');
      }

      // Parse header and data
      const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['email', 'nombre', 'apellido paterno', 'rol'];
      const optionalHeaders = ['apellido materno'];
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const members = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        if (values.length < headers.length) continue;

        const memberData = {};
        headers.forEach((header, index) => {
          memberData[header] = values[index] || '';
        });

        // Validate required fields
        if (!memberData.email || !memberData.email.includes('@')) {
          errors.push(`Fila ${i + 1}: Email inválido (${memberData.email})`);
          continue;
        }

        // Create member object
        const apellidoPaterno = memberData['apellido paterno'] || '';
        const apellidoMaterno = memberData['apellido materno'] || '';
        const fullLastName = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
        const displayName = [memberData.nombre, fullLastName].filter(Boolean).join(' ') || memberData.email;
        
        members.push({
          orgId: activeOrgId,
          email: memberData.email,
          name: memberData.nombre || '',
          lastName: apellidoPaterno || '',
          lastNamePaternal: apellidoPaterno || '',
          lastNameMaternal: apellidoMaterno || '',
          fullLastName: fullLastName,
          displayName,
          fullName: displayName,
          role: memberData.rol || 'member',
          memberRole: memberData.rol || 'member',
          isActive: true,
          createdAt: serverTimestamp(),
          source: 'csv-import',
          importedBy: user?.email || user?.uid || '',
        });
      }

      if (members.length === 0) {
        throw new Error('No se encontraron miembros válidos en el archivo CSV');
      }

      console.log(`[MemberManager] Parsed ${members.length} members, ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.warn('[MemberManager] CSV parsing errors:', errors);
      }

      // Create members in Firestore
      const membersRef = collection(db, 'members');
      let created = 0;
      let failed = 0;

      for (const member of members) {
        try {
          await addDoc(membersRef, member);
          created++;
          console.log(`[MemberManager] Created member: ${member.displayName}`);
        } catch (err) {
          failed++;
          console.error(`[MemberManager] Failed to create member ${member.displayName}:`, err);
        }
      }

      console.log(`[MemberManager] Import completed: ${created} created, ${failed} failed`);

      // Show result message
      if (failed === 0) {
        // Success - show brief success message and refresh
        setTimeout(() => setError(null), 3000);
      } else {
        setError(`Importación parcial: ${created} miembros creados, ${failed} fallaron`);
      }

      // Refresh members list
      await loadMembers();

    } catch (err) {
      console.error('[MemberManager] Error processing CSV:', err);
      setError(err.message || 'Error al procesar el archivo CSV');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `Email;Nombre;Apellido Paterno;Apellido Materno;Rol
ejemplo@empresa.com;Juan;Pérez;González;member
maria@empresa.com;María;García;López;admin
carlos@empresa.com;Carlos;López;Martínez;member`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Miembros.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Edit member functions
  const handleEditMember = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      lastNamePaternal: member.lastNamePaternal || member.lastName || '',
      lastNameMaternal: member.lastNameMaternal || '',
      email: member.email || '',
      role: member.role || member.memberRole || 'member',
      isActive: member.isActive !== false
    });
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    setEditingMember(null);
    setEditForm({
      name: '',
      lastNamePaternal: '',
      lastNameMaternal: '',
      email: '',
      role: 'member',
      isActive: true
    });
    setEditError(null);
    setEditSaving(false);
  };

  const handleSaveMember = async () => {
    if (!editingMember || !activeOrgId) return;

    const name = editForm.name.trim();
    const lastNamePaternal = editForm.lastNamePaternal.trim();
    const lastNameMaternal = editForm.lastNameMaternal.trim();
    const email = editForm.email.trim();

    if (!email || !email.includes('@')) {
      setEditError('Email es requerido y debe ser válido');
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const fullLastName = [lastNamePaternal, lastNameMaternal].filter(Boolean).join(' ');
      const displayName = [name, fullLastName].filter(Boolean).join(' ') || email;

      // Update member in Firestore
      const memberRef = doc(db, 'members', editingMember.id);
      await updateDoc(memberRef, {
        name: name || null,
        lastName: lastNamePaternal || null, // For compatibility
        lastNamePaternal: lastNamePaternal || null,
        lastNameMaternal: lastNameMaternal || null,
        fullLastName: fullLastName,
        displayName,
        fullName: displayName,
        email,
        role: editForm.role,
        memberRole: editForm.role,
        isActive: editForm.isActive,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'member-manager',
      });

      // Update local state optimistically
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === editingMember.id
            ? {
                ...member,
                name,
                lastName: lastNamePaternal,
                lastNamePaternal,
                lastNameMaternal,
                fullLastName,
                displayName,
                fullName: displayName,
                email,
                role: editForm.role,
                memberRole: editForm.role,
                isActive: editForm.isActive,
              }
            : member
        )
      );

      console.log('[MemberManager] Member updated successfully:', displayName);
      handleCloseEditModal();

    } catch (err) {
      console.error('[MemberManager] Error updating member:', err);
      setEditError(err.message || 'Error al actualizar el miembro');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete member functions
  const handleDeleteMember = (member) => {
    setDeletingMember(member);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember || !activeOrgId) return;

    setDeleteConfirming(true);
    setError(null); // Clear any existing errors

    try {
      console.log('[MemberManager] Deleting member:', {
        id: deletingMember.id,
        name: deletingMember.displayName,
        email: deletingMember.email
      });

      // Delete member from Firestore
      const memberRef = doc(db, 'members', deletingMember.id);
      await deleteDoc(memberRef);

      // Update local state optimistically
      setMembers(prevMembers =>
        prevMembers.filter(member => member.id !== deletingMember.id)
      );

      console.log('[MemberManager] Member deleted successfully:', deletingMember.displayName);
      
      // Close modal and reset states
      setDeletingMember(null);
      setDeleteConfirming(false);

    } catch (err) {
      console.error('[MemberManager] Error deleting member:', err);
      setError(`Error al eliminar ${deletingMember.displayName}: ${err.message}`);
      
      // Close modal even on error
      setDeletingMember(null);
      setDeleteConfirming(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingMember(null);
    setDeleteConfirming(false);
  };

  const stats = {
    total: members.length,
    active: members.filter(m => m.isActive !== false).length,
    inactive: members.filter(m => m.isActive === false).length,
  };

  const latestJob = importJobs[0];
  // Only show "importing" for a limited time to avoid stuck indicator
  const isImporting = latestJob && 
    ['pending', 'processing'].includes(latestJob.status) &&
    latestJob.createdAt &&
    (Date.now() - latestJob.createdAt.toMillis()) < 60000; // Max 60 seconds

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        Gestor de Miembros
      </h1>

      {error && (
        <Alert variant="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Total de miembros
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {stats.active}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Activos
          </div>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {stats.inactive}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Inactivos
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Importar Miembros
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={downloadTemplate}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📥 Descargar Plantilla
          </button>
          <label
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              backgroundColor: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {uploading ? 'Subiendo...' : '📤 Subir CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {isImporting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
              <Spinner size="small" />
              <span>Importando miembros...</span>
            </div>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Lista de Miembros
        </h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No hay miembros registrados. Importa un archivo CSV para comenzar.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Nombre
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Apellido Paterno
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Apellido Materno
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Rol
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Estado
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {member.email || member.workEmail || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {member.name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {member.lastNamePaternal || member.lastName || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {member.lastNameMaternal || '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {member.role || member.memberRole || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {member.isActive === false ? (
                      <span style={{ color: '#ef4444' }}>Inactivo</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>Activo</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditMember(member)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#fff',
                          color: '#374151',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#fff';
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ef4444',
                          backgroundColor: '#fff',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#fff';
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
              Editar Miembro
            </h3>

            {editError && (
              <Alert variant="error" style={{ marginBottom: '16px' }}>
                {editError}
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Nombre del miembro"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Apellido Paterno
                </label>
                <input
                  type="text"
                  value={editForm.lastNamePaternal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastNamePaternal: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Apellido paterno"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Apellido Materno
                </label>
                <input
                  type="text"
                  value={editForm.lastNameMaternal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastNameMaternal: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Apellido materno (opcional)"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Rol
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                  <option value="owner">Propietario</option>
                  <option value="manager">Gerente</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Miembro activo
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseEditModal}
                disabled={editSaving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  cursor: editSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: editSaving ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMember}
                disabled={editSaving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  cursor: editSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: editSaving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {editSaving && <Spinner size="small" />}
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                  Confirmar eliminación
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                ¿Estás seguro de que deseas eliminar a{' '}
                <strong>{deletingMember.displayName || deletingMember.email}</strong>?
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                Email: {deletingMember.email}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
                disabled={deleteConfirming}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  cursor: deleteConfirming ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: deleteConfirming ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirming}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: deleteConfirming ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: deleteConfirming ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {deleteConfirming && <Spinner size="small" />}
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
