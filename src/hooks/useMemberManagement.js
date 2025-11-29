// src/hooks/useMemberManagement.js
import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getOrgUsers } from '../services/orgStructureServiceWrapper';
import { getOrgRoles } from '../services/roleService';
import { getOrgAreas } from '../services/orgStructureService';
import jobFamilyService from '../services/jobFamilyService';
import * as XLSX from 'xlsx';
import {
  uploadMemberCsv,
  subscribeToImportJobs
} from '../services/memberImportService';

/**
 * Custom hook for managing members state and operations
 * @param {string} activeOrgId - Active organization ID
 * @param {object} user - Current user object
 * @returns {object} Member management state and functions
 */
export const useMemberManagement = (activeOrgId, user) => {
  // ==================== STATE ====================
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importJobs, setImportJobs] = useState([]);

  // Editing state
  const [editingMember, setEditingMember] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete state
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  // Reference data
  const [orgRoles, setOrgRoles] = useState(['member', 'admin', 'owner', 'manager']);
  const [jobFamilies, setJobFamilies] = useState([]);
  const [areas, setAreas] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ==================== LOAD MEMBERS ====================
  const loadMembers = useCallback(async () => {
    if (!activeOrgId) {
      console.log('[useMemberManagement] No activeOrgId, skipping load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useMemberManagement] Loading members for org:', activeOrgId);
      const users = await getOrgUsers(activeOrgId);
      console.log('[useMemberManagement] Loaded users:', users);
      setMembers(users || []);
    } catch (err) {
      console.error('[useMemberManagement] Error loading members:', err);
      setError(err.message || 'Error al cargar miembros');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  // ==================== EFFECTS ====================

  // Load members on mount/activeOrgId change
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Load org roles
  useEffect(() => {
    const loadOrgRoles = async () => {
      if (!activeOrgId) return;
      try {
        const roles = await getOrgRoles(activeOrgId);
        setOrgRoles(roles);
      } catch (error) {
        console.error('[useMemberManagement] Error loading org roles:', error);
      }
    };
    loadOrgRoles();
  }, [activeOrgId]);

  // Load reference data (JobFamilies, Areas)
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!activeOrgId) return;
      try {
        const [jobFamiliesData, areasData] = await Promise.allSettled([
          jobFamilyService.getOrgJobFamilies(activeOrgId).catch(() => []),
          getOrgAreas(activeOrgId).catch(() => [])
        ]);

        setJobFamilies(jobFamiliesData.status === 'fulfilled' ? jobFamiliesData.value : []);
        setAreas(areasData.status === 'fulfilled' ? areasData.value : []);

        console.log('[useMemberManagement] Loaded reference data:', {
          jobFamilies: jobFamiliesData.status === 'fulfilled' ? jobFamiliesData.value.length : 0,
          areas: areasData.status === 'fulfilled' ? areasData.value.length : 0
        });
      } catch (error) {
        console.error('[useMemberManagement] Error loading reference data:', error);
      }
    };
    loadReferenceData();
  }, [activeOrgId]);

  // Listen to import jobs
  useEffect(() => {
    if (!activeOrgId) return;

    try {
      const unsubscribe = subscribeToImportJobs(
        activeOrgId,
        (jobs) => {
          console.log('[useMemberManagement] Import jobs updated:', jobs);
          if (jobs && jobs.length > 0) {
            const latestJob = jobs[0];
            console.log('[useMemberManagement] Latest job details:', {
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
      console.error('[useMemberManagement] Error setting up import jobs listener:', error);
    }
  }, [activeOrgId]);

  // ==================== CRUD FUNCTIONS ====================

  /**
   * Open edit modal for a member
   */
  const handleEditMember = useCallback((member) => {
    setEditingMember(member);
    setEditError(null);
  }, []);

  /**
   * Close edit modal
   */
  const handleCloseEditModal = useCallback(() => {
    setEditingMember(null);
    setEditError(null);
    setEditSaving(false);
  }, []);

  /**
   * Save member changes to Firestore
   */
  const handleSaveMember = useCallback(async (editForm) => {
    if (!editingMember || !activeOrgId) return;

    const name = editForm.name.trim();
    const lastNamePaternal = editForm.lastNamePaternal.trim();
    const lastNameMaternal = editForm.lastNameMaternal.trim();
    const email = editForm.email.trim();

    if (!email || !email.includes('@')) {
      setEditError('Email es requerido y debe ser válido');
      return false;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const fullLastName = [lastNamePaternal, lastNameMaternal].filter(Boolean).join(' ');
      const displayName = [name, fullLastName].filter(Boolean).join(' ') || email;

      // Get job family and area names for compatibility
      const selectedJobFamily = jobFamilies.find(jf => jf.id === editForm.jobFamilyId);
      const selectedArea = areas.find(a => a.id === editForm.areaId);

      // Update member in Firestore
      const memberRef = doc(db, 'members', editingMember.id);
      const updateData = {
        name: name || null,
        lastName: lastNamePaternal || null,
        lastNamePaternal: lastNamePaternal || null,
        lastNameMaternal: lastNameMaternal || null,
        fullLastName: fullLastName,
        displayName,
        fullName: displayName,
        email,
        role: editForm.role,
        memberRole: editForm.role,
        cargo: editForm.cargo || null,
        jobTitle: editForm.cargo || null,
        jobFamilyId: editForm.jobFamilyId || null,
        jobFamilyIds: editForm.jobFamilyId ? [editForm.jobFamilyId] : [],
        jobFamilyName: selectedJobFamily?.name || null,
        areaId: editForm.areaId || null,
        area: selectedArea?.name || null,
        managerIds: editForm.managerIds || [],
        isActive: editForm.isActive,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'member-manager',
      };

      await updateDoc(memberRef, updateData);

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
              jobTitle: editForm.cargo,
              jobFamilyId: editForm.jobFamilyId,
              jobFamilyIds: editForm.jobFamilyId ? [editForm.jobFamilyId] : [],
              jobFamilyName: selectedJobFamily?.name,
              areaId: editForm.areaId,
              area: selectedArea?.name,
              managerIds: editForm.managerIds || [],
              isActive: editForm.isActive,
            }
            : member
        )
      );

      console.log('[useMemberManagement] Member updated successfully:', displayName);
      setEditingMember(null);
      setEditSaving(false);
      return true;

    } catch (err) {
      console.error('[useMemberManagement] Error updating member:', err);
      setEditError(err.message || 'Error al actualizar el miembro');
      setEditSaving(false);
      return false;
    }
  }, [editingMember, activeOrgId, user, jobFamilies, areas]);

  /**
   * Open delete confirmation modal
   */
  const handleDeleteMember = useCallback((member) => {
    setDeletingMember(member);
  }, []);

  /**
   * Confirm and execute member deletion (soft delete)
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingMember || !activeOrgId) return;

    setDeleteConfirming(true);
    setError(null);

    try {
      console.log('[useMemberManagement] Deactivating member (Soft Delete):', {
        id: deletingMember.id,
        name: deletingMember.displayName,
        email: deletingMember.email
      });

      // Soft Delete: Update isActive to false instead of deleting
      const memberRef = doc(db, 'members', deletingMember.id);
      await updateDoc(memberRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'member-manager-delete'
      });

      // SYNC: Update organization_members status to 'inactive'
      // This ensures OrgContext blocks access immediately
      try {
        const orgMembersRef = collection(db, 'organization_members');
        // Try to find by userId (new schema) or user_id (legacy)
        const q1 = query(
          orgMembersRef,
          where('orgId', '==', activeOrgId),
          where('userId', '==', deletingMember.id) // member.id is usually the auth uid
        );

        // Also try legacy field just in case
        const q2 = query(
          orgMembersRef,
          where('org_id', '==', activeOrgId),
          where('user_id', '==', deletingMember.id)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const docsToUpdate = [...snap1.docs, ...snap2.docs];

        // Deduplicate by ID
        const uniqueDocs = new Map();
        docsToUpdate.forEach(d => uniqueDocs.set(d.id, d));

        if (uniqueDocs.size > 0) {
          console.log(`[useMemberManagement] Syncing inactive status to ${uniqueDocs.size} organization_members docs`);
          const updatePromises = Array.from(uniqueDocs.values()).map(d =>
            updateDoc(doc(db, 'organization_members', d.id), {
              status: 'inactive',
              updatedAt: serverTimestamp()
            })
          );
          await Promise.all(updatePromises);
        } else {
          console.warn('[useMemberManagement] No matching organization_members document found to sync status');
        }
      } catch (syncErr) {
        console.error('[useMemberManagement] Error syncing organization_members status:', syncErr);
        // Don't fail the main operation if sync fails, but log it
      }

      // Update local state optimistically
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === deletingMember.id
            ? { ...member, isActive: false }
            : member
        )
      );

      console.log('[useMemberManagement] Member deactivated successfully:', deletingMember.displayName);

      // Close modal and reset states
      setDeletingMember(null);
      setDeleteConfirming(false);

    } catch (err) {
      console.error('[useMemberManagement] Error deactivating member:', err);
      setError(`Error al desactivar ${deletingMember.displayName}: ${err.message}`);

      // Close modal even on error
      setDeletingMember(null);
      setDeleteConfirming(false);
    }
  }, [deletingMember, activeOrgId]);

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = useCallback(() => {
    setDeletingMember(null);
    setDeleteConfirming(false);
  }, []);

  // ==================== CSV FUNCTIONS ====================

  /**
   * Handle CSV file upload
   */
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeOrgId) return;

    setUploading(true);
    setError(null);

    try {
      await uploadMemberCsv(activeOrgId, file);
      console.log('[useMemberManagement] CSV upload initiated successfully');
      event.target.value = '';
    } catch (err) {
      console.error('[useMemberManagement] Error uploading CSV:', err);
      setError(err.message || 'Error al subir el archivo CSV');
    } finally {
      setUploading(false);
    }
  }, [activeOrgId]);

  /**
   * Download CSV template with reference data
   */
  const downloadTemplate = useCallback(async () => {
    if (!activeOrgId) return;

    try {
      // Get valid roles, areas, and job families
      const [validRoles, areas, jobFamilies] = await Promise.allSettled([
        getOrgRoles(activeOrgId).catch(() => []),
        getOrgAreas(activeOrgId).catch(() => []),
        jobFamilyService.getOrgJobFamilies(activeOrgId).catch(() => [])
      ]);

      const roles = validRoles.status === 'fulfilled' ? validRoles.value : [];
      const areasList = areas.status === 'fulfilled' ? areas.value : [];
      const jobFamiliesList = jobFamilies.status === 'fulfilled' ? jobFamilies.value : [];

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // SHEET 1: Template
      const templateData = [
        ['Email', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Job Family', 'Área', 'Email Jefatura'],
        ['ceo@empresa.com', 'CEO', 'Empresa', '', 'Director Ejecutivo', jobFamiliesList[0]?.name || '', '', ''],
        ['juan@empresa.com', 'Juan', 'Pérez', 'González', 'Gerente de Ventas', jobFamiliesList[0]?.name || '', areasList[0]?.name || 'Ventas', 'ceo@empresa.com'],
        ['maria@empresa.com', 'María', 'García', 'López', 'Directora de Operaciones', jobFamiliesList[1]?.name || '', areasList[1]?.name || '', 'ceo@empresa.com'],
        ['carlos@empresa.com', 'Carlos', 'López', 'Martínez', 'Analista de Marketing', jobFamiliesList[0]?.name || '', areasList[2]?.name || 'Marketing', 'juan@empresa.com; maria@empresa.com']
      ];

      const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
      templateSheet['!cols'] = [
        { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 40 }
      ];

      XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');

      // SHEET 2: Reference data
      const referenceData = [
        ['=== ROLES VÁLIDOS ==='],
        ['Todos los miembros importados tendrán el rol "member" por defecto.'],
        [''],
        ['=== ÁREAS DISPONIBLES ==='],
        ['Nombre de Área']
      ];

      if (areasList.length > 0) {
        areasList.forEach(area => referenceData.push([area.name]));
      } else {
        referenceData.push(['(No hay áreas configuradas)']);
      }

      referenceData.push(['']);
      referenceData.push(['=== JOB FAMILIES (CARGOS) DISPONIBLES ===']);
      referenceData.push(['Nombre del Cargo']);

      if (jobFamiliesList.length > 0) {
        jobFamiliesList.forEach(family => referenceData.push([family.name]));
      } else {
        referenceData.push(['(No hay cargos configurados)']);
      }

      referenceData.push(['']);
      referenceData.push(['=== EMAIL JEFATURA (OPCIONAL) ===']);
      referenceData.push(['Formato: email del jefe o múltiples emails separados por punto y coma (;)']);
      referenceData.push(['Ejemplos:']);
      referenceData.push(['Un solo jefe: ceo@empresa.com']);
      referenceData.push(['Múltiples jefes: ceo@empresa.com; gerente@empresa.com']);
      referenceData.push(['Sin jefes: dejar vacío']);
      referenceData.push(['']);
      referenceData.push(['IMPORTANTE: Los jefes deben existir como miembros.']);
      referenceData.push(['Si un email no existe, será ignorado.']);

      referenceData.push(['']);
      referenceData.push(['NOTA IMPORTANTE:']);
      referenceData.push(['Todos los miembros importados tendrán el rol "member" por defecto.']);
      referenceData.push(['Solo Super Admins pueden cambiar roles posteriormente.']);

      const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
      referenceSheet['!cols'] = [{ wch: 50 }];

      XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Referencia');

      // Generate and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Miembros.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('[useMemberManagement] Template downloaded');
    } catch (error) {
      console.error('[useMemberManagement] Error generating template:', error);
      setError('Error al generar la plantilla. Por favor, intenta nuevamente.');
    }
  }, [activeOrgId]);

  /**
   * Export members to Excel
   */
  const exportMembersToExcel = useCallback(async () => {
    try {
      const validRoles = await getOrgRoles(activeOrgId);
      const headers = ['Email', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Rol', 'Cargo', 'Job Family', 'Área', 'Jefes', 'Estado'];

      const rows = members.map(member => {
        const fullName = [
          member.name,
          member.lastNamePaternal || member.lastName,
          member.lastNameMaternal
        ].filter(Boolean).join(' ');

        // Get Job Family name
        const jobFamilyName = member.jobFamilyName ||
          (member.jobFamilyId && jobFamilies.find(jf => jf.id === member.jobFamilyId)?.name) ||
          (member.jobFamilyIds && member.jobFamilyIds.length > 0 && jobFamilies.find(jf => jf.id === member.jobFamilyIds[0])?.name) ||
          '';

        // Get Manager names
        let managerNames = '';
        if (member.managerIds && member.managerIds.length > 0) {
          const managersList = member.managerIds
            .map(managerId => {
              const manager = members.find(m => m.id === managerId);
              if (manager) {
                return [
                  manager.name,
                  manager.lastNamePaternal || manager.lastName,
                  manager.lastNameMaternal
                ].filter(Boolean).join(' ') || manager.email;
              }
              return null;
            })
            .filter(Boolean);
          managerNames = managersList.join(', ');
        }

        return [
          member.email || member.workEmail || '',
          member.name || '',
          member.lastNamePaternal || member.lastName || '',
          member.lastNameMaternal || '',
          member.role || member.memberRole || '',
          member.cargo || '',
          jobFamilyName,
          member.area || member.unit || member.department || '',
          managerNames,
          member.isActive === false ? 'Inactivo' : 'Activo'
        ];
      });

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

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `Miembros_Exportados_${dateStr}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`[useMemberManagement] Exported ${members.length} members to Excel`);
    } catch (error) {
      console.error('[useMemberManagement] Error exporting members:', error);
      setError(`Error al exportar miembros: ${error.message}`);
    }
  }, [activeOrgId, members, jobFamilies]);

  // ==================== RETURN API ====================
  return {
    // State
    members,
    setMembers,
    loading,
    error,
    setError,
    uploading,
    importJobs,

    // Edit state
    editingMember,
    setEditingMember,
    editSaving,
    editError,
    setEditError,

    // Delete state
    deletingMember,
    setDeletingMember,
    deleteConfirming,

    // Reference data
    orgRoles,
    jobFamilies,
    areas,

    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,

    // CRUD functions
    loadMembers,
    handleEditMember,
    handleCloseEditModal,
    handleSaveMember,
    handleDeleteMember,
    handleConfirmDelete,
    handleCancelDelete,

    // CSV functions
    handleFileUpload,
    downloadTemplate,
    exportMembersToExcel,
  };
};
