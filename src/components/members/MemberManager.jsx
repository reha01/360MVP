// src/components/members/MemberManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getOrgRoles, validateRole, normalizeRole } from '../../services/roleService';
import './MemberManager.css';

// Función helper para formatear fechas: dd-mm-yy HH:mm (24 horas)
const formatDateCompact = (dateValue) => {
  if (!dateValue) return '--';
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return '--';
    
    // Formato: dd-mm-yy HH:mm (24 horas)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Últimos 2 dígitos del año
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return '--';
  }
};

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
    cargo: '',
    area: '',
    isActive: true
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteConfirming] = useState(false);
  const [orgRoles, setOrgRoles] = useState(['member', 'admin', 'owner', 'manager']);

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

  // Cargar roles de la organización
  useEffect(() => {
    const loadOrgRoles = async () => {
      if (!activeOrgId) return;
      try {
        const roles = await getOrgRoles(activeOrgId);
        setOrgRoles(roles);
      } catch (error) {
        console.error('[MemberManager] Error loading org roles:', error);
      }
    };
    loadOrgRoles();
  }, [activeOrgId]);

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

      // Buscar la línea que contiene los headers (puede haber instrucciones antes)
      let headerLineIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('email') && lines[i].toLowerCase().includes('nombre')) {
          headerLineIndex = i;
          break;
        }
      }
      
      // Parse header and data
      const headers = lines[headerLineIndex].split(';').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['email', 'nombre', 'apellido paterno', 'rol'];
      const optionalHeaders = ['apellido materno', 'área', 'area', 'cargo'];
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      // Cargar roles válidos de la organización
      const validRoles = await getOrgRoles(activeOrgId);

      // Parse data rows (empezar después de la línea de headers)
      const members = [];
      const errors = [];
      
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
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

        // Validar rol
        const normalizedRole = normalizeRole(memberData.rol);
        if (!normalizedRole || !validRoles.includes(normalizedRole)) {
          errors.push(`Fila ${i + 1}: Rol inválido "${memberData.rol}". Roles válidos: ${validRoles.join(', ')}`);
          continue;
        }

        // Create member object
        const apellidoPaterno = memberData['apellido paterno'] || '';
        const apellidoMaterno = memberData['apellido materno'] || '';
        const area = memberData['área'] || memberData['area'] || '';
        const cargo = memberData['cargo'] || '';
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
          role: normalizedRole,
          memberRole: normalizedRole,
          cargo: cargo || null,
          area: area || null,
          isActive: true,
          createdAt: serverTimestamp(),
          source: 'csv-import',
          importedBy: user?.email || user?.uid || '',
        });
      }

      if (members.length === 0 && errors.length === 0) {
        throw new Error('No se encontraron miembros válidos en el archivo CSV');
      }

      console.log(`[MemberManager] Parsed ${members.length} members, ${errors.length} errors`);
      
      if (errors.length > 0) {
        const errorMessage = `Errores encontrados:\n${errors.join('\n')}`;
        console.warn('[MemberManager] CSV parsing errors:', errors);
        setError(errorMessage);
        // Continuar con los miembros válidos si hay alguno
        if (members.length === 0) {
          throw new Error(errorMessage);
        }
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

  const downloadTemplate = async () => {
    // Obtener roles válidos para incluir en el template
    const validRoles = await getOrgRoles(activeOrgId);
    
    // Crear template con UTF-8 BOM para que Excel reconozca los acentos
    // Incluir una sección de instrucciones con los roles válidos
    const template = `\uFEFF=== ROLES VÁLIDOS ===
Los siguientes roles están disponibles para usar en la columna "Rol":
${validRoles.map(r => `- ${r}`).join('\n')}

=== DATOS DE MIEMBROS ===
Email;Nombre;Apellido Paterno;Apellido Materno;Rol;Cargo;Área
ejemplo@empresa.com;Juan;Pérez;González;${validRoles[0] || 'member'};Gerente de Ventas;Ventas
maria@empresa.com;María;García;López;${validRoles[1] || 'admin'};Directora de Operaciones;
carlos@empresa.com;Carlos;López;Martínez;${validRoles[0] || 'member'};Analista de Marketing;Marketing`;
    
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

  const exportMembersToExcel = async () => {
    try {
      // Obtener roles válidos para incluir en el archivo
      const validRoles = await getOrgRoles(activeOrgId);
      
      // Crear encabezados
      const headers = ['Email', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Rol', 'Cargo', 'Área', 'Estado'];
      
      // Crear filas de datos
      const rows = members.map(member => {
        const fullName = [
          member.name,
          member.lastNamePaternal || member.lastName,
          member.lastNameMaternal
        ].filter(Boolean).join(' ');
        
        return [
          member.email || member.workEmail || '',
          member.name || '',
          member.lastNamePaternal || member.lastName || '',
          member.lastNameMaternal || '',
          member.role || member.memberRole || '',
          member.cargo || '',
          member.area || member.unit || member.department || '',
          member.isActive === false ? 'Inactivo' : 'Activo'
        ];
      });
      
      // Crear contenido CSV con UTF-8 BOM para Excel
      const csvContent = [
        `=== ROLES VÁLIDOS ===`,
        `Los siguientes roles están disponibles:`,
        ...validRoles.map(r => `- ${r}`),
        ``,
        `=== MIEMBROS EXPORTADOS ===`,
        `Fecha de exportación: ${new Date().toLocaleString('es-CL')}`,
        `Total de miembros: ${members.length}`,
        ``,
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');
      
      // Crear blob con UTF-8 BOM
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nombre del archivo con fecha
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `Miembros_Exportados_${dateStr}.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log(`[MemberManager] Exported ${members.length} members to Excel`);
    } catch (error) {
      console.error('[MemberManager] Error exporting members:', error);
      setError(`Error al exportar miembros: ${error.message}`);
    }
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
      cargo: member.cargo || '',
      area: member.area || member.unit || member.department || '',
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
      cargo: '',
      area: '',
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
        cargo: editForm.cargo || null,
        area: editForm.area || null,
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
                cargo: editForm.cargo,
                area: editForm.area,
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

      {/* Import Section */}
      <div className="import-section">
        <h2>Importar Miembros</h2>
        <p className="section-description">
          Descarga la plantilla CSV, complétala con los datos de tus miembros y súbela aquí
        </p>
        <div className="import-buttons">
          <button
            onClick={downloadTemplate}
            className="btn-import btn-outline"
          >
            📥 Descargar Plantilla
          </button>
          <label className="btn-import btn-primary">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d' }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
              <span>Importando miembros...</span>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      {members.length > 0 && (
        <div className="import-section" style={{ marginTop: '16px' }}>
          <h2>Exportar Miembros</h2>
          <p className="section-description">
            Exporta todos los miembros actuales a un archivo Excel
          </p>
          <div className="import-buttons">
            <button
              onClick={() => exportMembersToExcel()}
              className="btn-import btn-primary"
            >
              📊 Exportar a Excel
            </button>
          </div>
        </div>
      )}

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
                <th>Área / Unidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                // Construir nombre completo
                const fullName = [
                  member.name,
                  member.lastNamePaternal || member.lastName,
                  member.lastNameMaternal
                ].filter(Boolean).join(' ') || '--';
                
                return (
                  <tr key={member.id}>
                    <td>{fullName}</td>
                    <td>{member.email || member.workEmail || '--'}</td>
                    <td>{member.role || member.memberRole || '--'}</td>
                    <td>{member.cargo || '--'}</td>
                    <td>{member.area || member.unit || member.department || '--'}</td>
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
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">Editar Miembro</h3>

            {editError && (
              <div className="alert alert-error">
                {editError}
                <button className="alert-close" onClick={() => setEditError(null)}>×</button>
              </div>
            )}

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del miembro"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellido Paterno</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.lastNamePaternal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastNamePaternal: e.target.value }))}
                  placeholder="Apellido paterno"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellido Materno</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.lastNameMaternal}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastNameMaternal: e.target.value }))}
                  placeholder="Apellido materno (opcional)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  {orgRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.cargo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ej: Gerente de Ventas"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Área / Unidad</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.area}
                  onChange={(e) => setEditForm(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="Ej: Ventas, Marketing"
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox-group">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Miembro activo
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleCloseEditModal}
                disabled={editSaving}
                className="btn-modal btn-modal-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMember}
                disabled={editSaving}
                className="btn-modal btn-modal-primary"
              >
                {editSaving && <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>}
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
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
