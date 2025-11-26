/**
 * OrgManager - Gestor de Organizaciones (Tenants)
 * 
 * Permite al Super Admin:
 * - Listar todas las organizaciones
 * - Crear nuevas organizaciones con owner inicial
 * - Editar organizaciones
 * - Desactivar/Activar organizaciones
 */

import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useAuth } from '../../context/AuthContext';
import superAdminService from '../../services/superAdminService';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import './OrgManager.css';

const OrgManager = () => {
  const { isSuperAdmin } = useSuperAdmin();
  const { user } = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Empresa
    name: '',
    orgId: '',
    plan: 'starter',
    timezone: 'UTC',
    active: true,
    grupo: '', // Grupo de empresas (opcional)
    // Owner
    ownerName: '',
    ownerEmail: ''
  });
  
  // Owner info state
  const [ownersInfo, setOwnersInfo] = useState({}); // { orgId: { name, email } }
  
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cargar organizaciones
  useEffect(() => {
    if (!isSuperAdmin) {
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }
    
    loadOrganizations();
  }, [isSuperAdmin]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgs = await superAdminService.getAllOrganizations();
      setOrganizations(orgs);
      
      // Cargar información de owners en paralelo
      const ownersPromises = orgs.map(async (org) => {
        const ownerInfo = await superAdminService.getOrganizationOwner(org.id);
        return { orgId: org.id, ownerInfo };
      });
      
      const ownersResults = await Promise.allSettled(ownersPromises);
      const ownersMap = {};
      ownersResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          ownersMap[result.value.orgId] = result.value.ownerInfo;
        }
      });
      setOwnersInfo(ownersMap);
    } catch (err) {
      console.error('[OrgManager] Error loading organizations:', err);
      setError(err.message || 'Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  };

  // Generar slug sugerido desde nombre
  const handleNameChange = (value) => {
    setFormData(prev => {
      const newData = { ...prev, name: value };
      // Si orgId está vacío o es el slug anterior, generar nuevo
      if (!prev.orgId || prev.orgId === generateSlug(prev.name)) {
        newData.orgId = generateSlug(value);
      }
      return newData;
    });
  };

  const generateSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre de la organización es requerido';
    }
    
    if (!formData.orgId.trim()) {
      errors.orgId = 'El ID/Slug es requerido';
    } else if (!/^[a-z0-9-]+$/.test(formData.orgId)) {
      errors.orgId = 'El ID solo puede contener letras minúsculas, números y guiones';
    }
    
    if (!formData.ownerName.trim()) {
      errors.ownerName = 'El nombre del owner es requerido';
    }
    
    if (!formData.ownerEmail.trim()) {
      errors.ownerEmail = 'El email del owner es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
      errors.ownerEmail = 'El email no es válido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Crear organización
  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const orgData = {
        name: formData.name.trim(),
        orgId: formData.orgId.trim(),
        plan: formData.plan,
        timezone: formData.timezone,
        active: formData.active,
        grupo: formData.grupo.trim() || null
      };

      const ownerData = {
        name: formData.ownerName.trim(),
        email: formData.ownerEmail.trim()
      };

      await superAdminService.createOrganizationWithAdmin(orgData, ownerData);
      
      // Reset form y cerrar modal
      setFormData({
        name: '',
        orgId: '',
        plan: 'starter',
        timezone: 'UTC',
        active: true,
        grupo: '',
        ownerName: '',
        ownerEmail: ''
      });
      setFormErrors({});
      setShowCreateModal(false);
      
      // Recargar lista
      await loadOrganizations();
    } catch (err) {
      console.error('[OrgManager] Error creating organization:', err);
      setError(err.message || 'Error al crear organización');
    } finally {
      setSaving(false);
    }
  };

  // Editar organización
  const handleEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name || '',
      orgId: org.id || '',
      plan: org.plan || 'starter',
      timezone: org.settings?.timezone || 'UTC',
      active: org.active !== undefined ? org.active : true,
      grupo: org.grupo || '',
      ownerName: '', // No editamos owner desde aquí
      ownerEmail: org.ownerEmail || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updates = {
        name: formData.name.trim(),
        plan: formData.plan,
        active: formData.active,
        grupo: formData.grupo.trim() || null,
        settings: {
          timezone: formData.timezone,
          ...editingOrg.settings
        }
      };

      await superAdminService.updateOrganization(editingOrg.id, updates);
      
      setShowEditModal(false);
      setEditingOrg(null);
      await loadOrganizations();
    } catch (err) {
      console.error('[OrgManager] Error updating organization:', err);
      setError(err.message || 'Error al actualizar organización');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar organización
  const handleDelete = async (org) => {
    const confirmMessage = `¿Estás seguro de que quieres ELIMINAR permanentemente la organización "${org.name}"?\n\nEsta acción NO se puede deshacer y eliminará todos los datos asociados.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Confirmación adicional
    const secondConfirm = prompt(`Para confirmar, escribe el nombre de la organización: "${org.name}"`);
    if (secondConfirm !== org.name) {
      alert('El nombre no coincide. La eliminación ha sido cancelada.');
      return;
    }

    try {
      setLoading(true);
      await superAdminService.deleteOrganization(org.id);
      await loadOrganizations();
      alert(`La organización "${org.name}" ha sido eliminada exitosamente.`);
    } catch (err) {
      console.error('[OrgManager] Error deleting organization:', err);
      setError(err.message || 'Error al eliminar organización');
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Si no es Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="org-manager-container">
        <div className="alert alert-error">
          No tienes permisos para acceder a esta página. Solo el Super Admin puede gestionar organizaciones.
        </div>
      </div>
    );
  }

  return (
    <div className="org-manager-container">
      {/* Header */}
      <div className="org-manager-header">
        <h1>🏢 Gestión de Organizaciones</h1>
        <p className="description">
          Administra las organizaciones (tenants) de la plataforma
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Organizaciones</div>
          <div className="stat-value">{organizations.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activas</div>
          <div className="stat-value">
            {organizations.filter(o => o.active !== false).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactivas</div>
          <div className="stat-value">
            {organizations.filter(o => o.active === false).length}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        <button
          onClick={() => {
            setFormData({
              name: '',
              orgId: '',
              plan: 'starter',
              timezone: 'UTC',
              active: true,
              grupo: '',
              ownerName: '',
              ownerEmail: ''
            });
            setFormErrors({});
            setShowCreateModal(true);
          }}
          className="btn-action btn-primary"
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={16} style={{ marginRight: '4px' }} />
          Nueva Organización
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Cargando organizaciones...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No hay organizaciones registradas. Crea la primera organización.
          </div>
        ) : (
          <table className="orgs-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>ID</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Grupo</th>
                <th>Owner</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>{org.name || '--'}</td>
                  <td>
                    <code style={{ fontSize: '12px', color: '#6c757d' }}>
                      {org.id || org.orgId || '--'}
                    </code>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      backgroundColor: org.plan === 'enterprise' ? '#7c3aed' : 
                                     org.plan === 'professional' ? '#0d6efd' : '#6c757d',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {org.plan || 'starter'}
                    </span>
                  </td>
                  <td>
                    {org.active === false ? (
                      <span className="status-badge status-expired">Inactiva</span>
                    ) : (
                      <span className="status-badge status-completed">Activa</span>
                    )}
                  </td>
                  <td>{org.grupo || '--'}</td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '500', color: '#212529', marginBottom: '2px' }}>
                        {ownersInfo[org.id]?.name || '--'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {ownersInfo[org.id]?.email || org.ownerEmail || '--'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(org)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Editar organización"
                      >
                        <Pencil size={18} style={{ color: '#0dcaf0' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Eliminar organización"
                      >
                        <Trash2 size={18} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !saving && setShowCreateModal(false)}
        title="Nueva Organización"
      >
        <div className="modal-form">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              A. Datos de la Empresa
            </h3>
            
            <div className="form-group">
              <label className="form-label">Nombre de la Organización *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: ACME Corp"
                error={formErrors.name}
                required
              />
              {formErrors.name && (
                <span className="form-error">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">ID/Slug *</label>
              <Input
                type="text"
                value={formData.orgId}
                onChange={(e) => setFormData(prev => ({ ...prev, orgId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="acme-corp"
                error={formErrors.orgId}
                required
              />
              <small style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', display: 'block' }}>
                Se genera automáticamente desde el nombre. Solo letras minúsculas, números y guiones.
              </small>
              {formErrors.orgId && (
                <span className="form-error">{formErrors.orgId}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Plan</label>
              <select
                className="form-input"
                value={formData.plan}
                onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Grupo (Opcional)</label>
              <Input
                type="text"
                value={formData.grupo}
                onChange={(e) => setFormData(prev => ({ ...prev, grupo: e.target.value }))}
                placeholder="Ej: Grupo Empresarial ABC"
              />
              <small style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', display: 'block' }}>
                Nombre del grupo de empresas al que pertenece esta organización (si aplica).
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Zona Horaria</label>
              <select
                className="form-input"
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              >
                <option value="UTC">UTC</option>
                <option value="America/Santiago">America/Santiago</option>
                <option value="America/Mexico_City">America/Mexico_City</option>
                <option value="America/Bogota">America/Bogota</option>
                <option value="America/Buenos_Aires">America/Buenos_Aires</option>
                <option value="America/Lima">America/Lima</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                />
                <span>Organización activa</span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px', paddingTop: '24px', borderTop: '1px solid #dee2e6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
              B. Owner Inicial
            </h3>
            
            <div className="form-group">
              <label className="form-label">Nombre del Owner *</label>
              <Input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                error={formErrors.ownerName}
                required
              />
              {formErrors.ownerName && (
                <span className="form-error">{formErrors.ownerName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email del Owner *</label>
              <Input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value.trim() }))}
                placeholder="owner@empresa.com"
                error={formErrors.ownerEmail}
                required
              />
              <small style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', display: 'block' }}>
                Si el usuario no existe, se creará un registro pendiente de invitación.
              </small>
              {formErrors.ownerEmail && (
                <span className="form-error">{formErrors.ownerEmail}</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn-modal btn-modal-cancel"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="btn-modal btn-modal-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>
                  Creando...
                </>
              ) : (
                'Crear Organización'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={showEditModal}
        onClose={() => !saving && setShowEditModal(false)}
        title="Editar Organización"
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Nombre de la Organización *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              required
            />
            {formErrors.name && (
              <span className="form-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">ID/Slug</label>
            <Input
              type="text"
              value={formData.orgId}
              disabled
              style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
            />
            <small style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', display: 'block' }}>
              El ID no puede ser modificado después de la creación.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Plan</label>
            <select
              className="form-input"
              value={formData.plan}
              onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Zona Horaria</label>
            <select
              className="form-input"
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            >
              <option value="UTC">UTC</option>
              <option value="America/Santiago">America/Santiago</option>
              <option value="America/Mexico_City">America/Mexico_City</option>
              <option value="America/Bogota">America/Bogota</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires</option>
              <option value="America/Lima">America/Lima</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              />
              <span>Organización activa</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              onClick={() => setShowEditModal(false)}
              className="btn-modal btn-modal-cancel"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              className="btn-modal btn-modal-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', display: 'inline-block', marginRight: '8px' }}></div>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrgManager;

