// src/components/members/MemberManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { getOrgUsers } from '../../services/orgStructureServiceWrapper';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getOrgRoles, validateRole, normalizeRole } from '../../services/roleService';
import { getOrgAreas } from '../../services/orgStructureService';
import jobFamilyService from '../../services/jobFamilyService';
import * as XLSX from 'xlsx';
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
  const { isSuperAdmin } = useSuperAdmin();
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
    cargo: '', // Job Title (texto libre)
    jobFamilyId: '', // Job Family ID (select)
    areaId: '', // Area ID (select)
    isActive: true
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteConfirming] = useState(false);
  const [orgRoles, setOrgRoles] = useState(['member', 'admin', 'owner', 'manager']);
  const [jobFamilies, setJobFamilies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Cargar Job Families y Áreas para los dropdowns
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
        
        console.log('[MemberManager] Loaded reference data:', {
          jobFamilies: jobFamiliesData.status === 'fulfilled' ? jobFamiliesData.value.length : 0,
          areas: areasData.status === 'fulfilled' ? areasData.value.length : 0
        });
      } catch (error) {
        console.error('[MemberManager] Error loading reference data:', error);
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
      const expectedHeaders = ['email', 'nombre', 'apellido paterno'];
      const optionalHeaders = ['apellido materno', 'área', 'area', 'cargo', 'job family', 'jobfamily', 'rol']; // Rol es opcional e ignorado
      
      // Validate headers (Rol ya no es requerido)
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      // Cargar Job Families y Áreas para hacer match
      const [jobFamiliesData, areasData] = await Promise.allSettled([
        jobFamilyService.getOrgJobFamilies(activeOrgId).catch(() => []),
        getOrgAreas(activeOrgId).catch(() => [])
      ]);
      
      const availableJobFamilies = jobFamiliesData.status === 'fulfilled' ? jobFamiliesData.value : [];
      const availableAreas = areasData.status === 'fulfilled' ? areasData.value : [];

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

        // Rol siempre será 'member' por defecto (ignorar si viene en el CSV)
        const defaultRole = 'member';

        // Create member object
        const apellidoPaterno = memberData['apellido paterno'] || '';
        const apellidoMaterno = memberData['apellido materno'] || '';
        const cargo = memberData['cargo'] || ''; // Job Title (texto libre)
        const jobFamilyName = memberData['job family'] || memberData['jobfamily'] || '';
        const areaName = memberData['área'] || memberData['area'] || '';
        
        // Hacer match de Job Family por nombre
        let jobFamilyId = null;
        let jobFamilyIds = [];
        if (jobFamilyName) {
          const foundJobFamily = availableJobFamilies.find(
            jf => jf.name && jf.name.trim().toLowerCase() === jobFamilyName.trim().toLowerCase()
          );
          if (foundJobFamily) {
            jobFamilyId = foundJobFamily.id;
            jobFamilyIds = [foundJobFamily.id];
          } else {
            errors.push(`Fila ${i + 1}: Job Family "${jobFamilyName}" no encontrada. Verifica que exista en /gestion/job-families`);
            continue;
          }
        }
        
        // Hacer match de Área por nombre
        let areaId = null;
        let areaDisplayName = null;
        if (areaName) {
          const foundArea = availableAreas.find(
            a => a.name && a.name.trim().toLowerCase() === areaName.trim().toLowerCase()
          );
          if (foundArea) {
            areaId = foundArea.id;
            areaDisplayName = foundArea.name;
          } else {
            errors.push(`Fila ${i + 1}: Área "${areaName}" no encontrada. Verifica que exista en /gestion/estructura`);
            continue;
          }
        }
        
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
          role: defaultRole, // Siempre 'member' por defecto
          memberRole: defaultRole,
          cargo: cargo || null, // Job Title (texto libre)
          jobTitle: cargo || null, // Alias
          jobFamilyId: jobFamilyId, // Job Family ID
          jobFamilyIds: jobFamilyIds, // Array para compatibilidad
          jobFamilyName: jobFamilyId ? availableJobFamilies.find(jf => jf.id === jobFamilyId)?.name : null,
          areaId: areaId, // Area ID
          area: areaDisplayName, // Nombre para compatibilidad
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
    try {
      // Obtener datos de referencia: roles, áreas y job families
      const [validRoles, areas, jobFamilies] = await Promise.allSettled([
        getOrgRoles(activeOrgId).catch(() => []),
        getOrgAreas(activeOrgId).catch(() => []),
        jobFamilyService.getOrgJobFamilies(activeOrgId).catch(() => [])
      ]);
      
      const roles = validRoles.status === 'fulfilled' ? validRoles.value : [];
      const areasList = areas.status === 'fulfilled' ? areas.value : [];
      const jobFamiliesList = jobFamilies.status === 'fulfilled' ? jobFamilies.value : [];
      
      // Crear workbook de Excel
      const workbook = XLSX.utils.book_new();
      
      // HOJA 1: Plantilla de Miembros (sin columna Rol - todos serán 'member' por defecto)
      const templateData = [
        // Encabezados
        ['Email', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Cargo', 'Job Family', 'Área'],
        // Ejemplos
        ['ejemplo@empresa.com', 'Juan', 'Pérez', 'González', 'Gerente de Ventas', jobFamiliesList[0]?.name || '', areasList[0]?.name || 'Ventas'],
        ['maria@empresa.com', 'María', 'García', 'López', 'Directora de Operaciones', jobFamiliesList[1]?.name || '', areasList[1]?.name || ''],
        ['carlos@empresa.com', 'Carlos', 'López', 'Martínez', 'Analista de Marketing', jobFamiliesList[0]?.name || '', areasList[2]?.name || 'Marketing']
      ];
      
      const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Ajustar ancho de columnas
      templateSheet['!cols'] = [
        { wch: 30 }, // Email
        { wch: 20 }, // Nombre
        { wch: 20 }, // Apellido Paterno
        { wch: 20 }, // Apellido Materno
        { wch: 25 }, // Cargo (Job Title)
        { wch: 25 }, // Job Family
        { wch: 25 }  // Área
      ];
      
      XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');
      
      // HOJA 2: Referencia (Áreas y Job Families)
      const referenceData = [
        // Encabezado
        ['REFERENCIA: Áreas y Job Families Disponibles'],
        [''],
        ['=== ÁREAS DISPONIBLES ==='],
        ['Nombre de Área']
      ];
      
      // Agregar áreas
      if (areasList.length > 0) {
        areasList.forEach(area => {
          referenceData.push([area.name || 'Sin nombre']);
        });
      } else {
        referenceData.push(['(No hay áreas configuradas)']);
      }
      
      referenceData.push(['']);
      referenceData.push(['=== JOB FAMILIES (CARGOS) DISPONIBLES ===']);
      referenceData.push(['Nombre del Cargo']);
      
      // Agregar job families
      if (jobFamiliesList.length > 0) {
        jobFamiliesList.forEach(family => {
          referenceData.push([family.name || 'Sin nombre']);
        });
      } else {
        referenceData.push(['(No hay cargos configurados)']);
      }
      
      referenceData.push(['']);
      referenceData.push(['NOTA IMPORTANTE:']);
      referenceData.push(['Todos los miembros importados tendrán el rol "member" por defecto.']);
      referenceData.push(['Solo el Super Admin puede cambiar el rol de un miembro después de la importación.']);
      
      referenceData.push(['']);
      referenceData.push(['INSTRUCCIONES:']);
      referenceData.push(['1. Cargo (Job Title): Campo de texto libre - puedes escribir cualquier nombre de puesto']);
      referenceData.push(['2. Job Family: DEBE ser uno de los nombres listados arriba']);
      referenceData.push(['3. Área: DEBE ser uno de los nombres listados arriba']);
      referenceData.push(['4. Copia los nombres EXACTOS de las Áreas y Job Families de esta hoja']);
      referenceData.push(['5. Pega los nombres en la hoja "Plantilla"']);
      referenceData.push(['6. Los nombres deben coincidir EXACTAMENTE (mayúsculas, minúsculas, espacios)']);
      referenceData.push(['7. Si usas un nombre que no existe, el importador mostrará un error']);
      referenceData.push(['8. No incluyas columna "Rol" - todos los miembros serán "member" automáticamente']);
      
      const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
      
      // Ajustar ancho de columnas
      referenceSheet['!cols'] = [
        { wch: 50 } // Columna única más ancha
      ];
      
      XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Referencia');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      
      // Crear blob y descargar
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Plantilla_Miembros.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('[MemberManager] Template downloaded with reference data:', {
        areas: areasList.length,
        jobFamilies: jobFamiliesList.length,
        roles: roles.length
      });
    } catch (error) {
      console.error('[MemberManager] Error generating template:', error);
      setError('Error al generar la plantilla. Por favor, intenta nuevamente.');
    }
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
    
    // Encontrar jobFamilyId si el miembro tiene jobFamilyIds
    const memberJobFamilyId = member.jobFamilyIds && member.jobFamilyIds.length > 0 
      ? member.jobFamilyIds[0] 
      : '';
    
    // Encontrar areaId buscando por nombre primero, luego por ID
    let memberAreaId = '';
    if (member.areaId) {
      memberAreaId = member.areaId;
    } else if (member.area || member.unit || member.department) {
      // Buscar área por nombre
      const areaName = member.area || member.unit || member.department;
      const foundArea = areas.find(a => a.name === areaName);
      if (foundArea) {
        memberAreaId = foundArea.id;
      }
    }
    
    setEditForm({
      name: member.name || '',
      lastNamePaternal: member.lastNamePaternal || member.lastName || '',
      lastNameMaternal: member.lastNameMaternal || '',
      email: member.email || '',
      role: member.role || member.memberRole || 'member',
      cargo: member.cargo || member.jobTitle || '', // Job Title (texto libre)
      jobFamilyId: memberJobFamilyId, // Job Family ID (select)
      areaId: memberAreaId, // Area ID (select)
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
      jobFamilyId: '',
      areaId: '',
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

      // Obtener nombres de Job Family y Área para compatibilidad
      const selectedJobFamily = jobFamilies.find(jf => jf.id === editForm.jobFamilyId);
      const selectedArea = areas.find(a => a.id === editForm.areaId);
      
      // Update member in Firestore
      const memberRef = doc(db, 'members', editingMember.id);
      const updateData = {
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
        cargo: editForm.cargo || null, // Job Title (texto libre)
        jobTitle: editForm.cargo || null, // Alias para compatibilidad
        jobFamilyId: editForm.jobFamilyId || null, // Job Family ID
        jobFamilyIds: editForm.jobFamilyId ? [editForm.jobFamilyId] : [], // Array para compatibilidad
        jobFamilyName: selectedJobFamily?.name || null, // Nombre para referencia
        areaId: editForm.areaId || null, // Area ID
        area: selectedArea?.name || null, // Nombre para compatibilidad
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
              onClick={downloadTemplate}
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
          <div className="import-section" style={{ marginBottom: 0 }}>
            <h2>Exportar Miembros</h2>
            <p className="section-description">
              Exporta todos los miembros actuales a un archivo Excel
            </p>
            <div className="import-buttons">
              <button
                onClick={() => exportMembersToExcel()}
                className="btn-action btn-primary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                📊 Exportar
              </button>
            </div>
          </div>
        )}
      </div>

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
                // Calcular paginación solo si hay más de 10 miembros
                const shouldPaginate = members.length > 10;
                const startIndex = shouldPaginate ? (currentPage - 1) * itemsPerPage : 0;
                const endIndex = shouldPaginate ? startIndex + itemsPerPage : members.length;
                const paginatedMembers = shouldPaginate ? members.slice(startIndex, endIndex) : members;
                
                return paginatedMembers.map((member) => {
                // Construir nombre completo
                const fullName = [
                  member.name,
                  member.lastNamePaternal || member.lastName,
                  member.lastNameMaternal
                ].filter(Boolean).join(' ') || '--';
                
                // Obtener nombre de Job Family
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
              })})()}
            </tbody>
          </table>
        )}
        
        {/* Paginación - Solo mostrar si hay más de 10 miembros */}
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
              <span style={{ fontSize: '13px', color: '#6c757d' }}>
                Mostrar:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Resetear a la primera página
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
                <label className="form-label">
                  Rol {!isSuperAdmin && <span style={{ fontSize: '12px', color: '#6B7280' }}>(Solo Super Admin puede modificar)</span>}
                </label>
                {isSuperAdmin ? (
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
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.role || 'member'}
                    readOnly
                    disabled
                    style={{
                      backgroundColor: '#F3F4F6',
                      cursor: 'not-allowed',
                      color: '#6B7280'
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cargo (Job Title)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.cargo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ej: Gerente de Ventas (opcional)"
                />
                <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                  Nombre interno del puesto (información descriptiva)
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Job Family</label>
                <select
                  className="form-select"
                  value={editForm.jobFamilyId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, jobFamilyId: e.target.value }))}
                >
                  <option value="">Seleccionar Job Family (opcional)</option>
                  {jobFamilies.map(jf => (
                    <option key={jf.id} value={jf.id}>
                      {jf.name}
                    </option>
                  ))}
                </select>
                <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                  Categoría para evaluación (debe estar creada en /gestion/job-families)
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Área</label>
                <select
                  className="form-select"
                  value={editForm.areaId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, areaId: e.target.value }))}
                >
                  <option value="">Seleccionar Área (opcional)</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <small style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                  Área organizacional (debe estar creada en /gestion/estructura)
                </small>
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
