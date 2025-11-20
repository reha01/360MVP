/**
 * Paso 5: Revisión y Activación
 * SOLUCIÓN SIMPLIFICADA: Formulario simple sin componentes complejos
 */

import React from 'react';
import { getCampaignTypeLabel } from '../../models/Campaign';

const CampaignReviewStep = ({ 
  data, 
  filteredUsers = [], 
  jobFamilies = [], 
  areas = [], 
  availableTests = [] 
}) => {
  const getTestName = (testId) => {
    if (!availableTests || !Array.isArray(availableTests)) return testId;
    const test = availableTests.find(t => t.id === testId);
    return test ? test.name : testId;
  };
  
  const getJobFamilyName = (familyId) => {
    if (!jobFamilies || !Array.isArray(jobFamilies)) return familyId;
    const family = jobFamilies.find(f => f.id === familyId);
    return family ? family.name : familyId;
  };
  
  const getAreaName = (areaId) => {
    if (!areas || !Array.isArray(areas)) return areaId;
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : areaId;
  };
  
  const getAssignmentStats = () => {
    const total = filteredUsers.length;
    const assigned = Object.keys(data.testAssignments || {}).length;
    const withJobFamily = filteredUsers.filter(user => 
      user.jobFamilyIds && user.jobFamilyIds.length > 0
    ).length;
    
    return { total, assigned, withJobFamily };
  };
  
  const stats = getAssignmentStats();
  
  // Estilos inline simples
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    marginBottom: '16px'
  };
  
  const badgeStyle = {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  };
  
  return (
    <div style={{ padding: '0' }}>
      {/* Información General */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Información General
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Título</label>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{data.title}</div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Descripción</label>
                <div style={{ color: '#111827' }}>{data.description || 'Sin descripción'}</div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Tipo</label>
                <div style={{ color: '#111827' }}>{getCampaignTypeLabel(data.type)}</div>
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Fecha de Inicio</label>
                <div style={{ color: '#111827' }}>
                  {data.config?.startDate ? new Date(data.config.startDate).toLocaleString() : 'No definida'}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Fecha de Fin</label>
                <div style={{ color: '#111827' }}>
                  {data.config?.endDate ? new Date(data.config.endDate).toLocaleString() : 'No definida'}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Zona Horaria</label>
                <div style={{ color: '#111827' }}>{data.config?.timezone || 'UTC'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Evaluados Seleccionados */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Evaluados Seleccionados
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Total Usuarios</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{stats.withJobFamily}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Con Job Family</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F3FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6' }}>{data.evaluateeFilters?.jobFamilyIds?.length || 0}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Job Families</div>
          </div>
        </div>
        
        {/* Filtros aplicados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.evaluateeFilters?.jobFamilyIds?.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Job Families:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.evaluateeFilters.jobFamilyIds.map(familyId => (
                  <span key={familyId} style={{ ...badgeStyle, backgroundColor: '#F3F4F6', color: '#374151' }}>
                    {getJobFamilyName(familyId)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {data.evaluateeFilters?.areaIds?.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Áreas/Departamentos:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.evaluateeFilters.areaIds.map(areaId => (
                  <span key={areaId} style={{ ...badgeStyle, backgroundColor: '#F3F4F6', color: '#374151' }}>
                    {getAreaName(areaId)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {data.evaluateeFilters?.userIds?.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Usuarios Específicos:</label>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                {data.evaluateeFilters.userIds.length} usuario(s) seleccionado(s) manualmente
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Asignación de Tests */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Asignación de Tests
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{stats.assigned}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Tests Asignados</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#D97706' }}>{stats.total - stats.assigned}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Sin Asignar</div>
          </div>
        </div>
        
        {stats.assigned > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px' }}>
            {Object.entries(data.testAssignments || {}).map(([userId, assignment]) => {
              const user = filteredUsers.find(u => u.id === userId);
              if (!user) return null;
              
              return (
                <div key={userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#111827' }}>{user.displayName}</span>
                    <span style={{ color: '#6B7280', margin: '0 8px' }}>→</span>
                    <span style={{ color: '#3B82F6' }}>
                      {getTestName(assignment.testId)} (v{assignment.version})
                    </span>
                  </div>
                  <span style={{ ...badgeStyle, backgroundColor: '#D1FAE5', color: '#065F46' }}>
                    {assignment.reason}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {stats.assigned === 0 && (
          <div style={{ padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
            <div style={{ fontSize: '14px', color: '#92400E' }}>
              No hay tests asignados. Ve al paso anterior para asignar tests.
            </div>
          </div>
        )}
      </div>
      
      {/* Reglas de Evaluadores */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Reglas de Evaluadores
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '12px' }}>Evaluadores Requeridos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Autoevaluación</span>
                <span style={{ ...badgeStyle, backgroundColor: data.config?.requiredEvaluators?.self ? '#D1FAE5' : '#F3F4F6', color: data.config?.requiredEvaluators?.self ? '#065F46' : '#374151' }}>
                  {data.config?.requiredEvaluators?.self ? 'Requerida' : 'Opcional'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Manager Directo</span>
                <span style={{ ...badgeStyle, backgroundColor: data.config?.requiredEvaluators?.manager ? '#D1FAE5' : '#F3F4F6', color: data.config?.requiredEvaluators?.manager ? '#065F46' : '#374151' }}>
                  {data.config?.requiredEvaluators?.manager ? 'Requerido' : 'Opcional'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Pares</span>
                <span style={{ ...badgeStyle, backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                  {data.config?.requiredEvaluators?.peers?.min || 0}-{data.config?.requiredEvaluators?.peers?.max || 0}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Subordinados</span>
                <span style={{ ...badgeStyle, backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                  {data.config?.requiredEvaluators?.subordinates?.min || 0}+
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Externos</span>
                <span style={{ ...badgeStyle, backgroundColor: '#FED7AA', color: '#9A3412' }}>
                  {data.config?.requiredEvaluators?.external?.min || 0}+
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '12px' }}>Umbrales de Anonimato</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Pares</span>
                <span style={{ ...badgeStyle, backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                  {data.config?.anonymityThresholds?.peers || 3}+
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Subordinados</span>
                <span style={{ ...badgeStyle, backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                  {data.config?.anonymityThresholds?.subordinates || 3}+
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Externos</span>
                <span style={{ ...badgeStyle, backgroundColor: '#FED7AA', color: '#9A3412' }}>
                  {data.config?.anonymityThresholds?.external || 1}+
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recordatorios */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Recordatorios Automáticos
        </h3>
        
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '4px' }}>Programación</label>
          <div style={{ color: '#111827' }}>
            {data.config?.reminderSchedule?.length > 0 
              ? `Recordatorios a los ${data.config.reminderSchedule.join(', ')} días antes del vencimiento`
              : 'Sin recordatorios configurados'
            }
          </div>
        </div>
      </div>
      
      {/* Validaciones Finales */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Validaciones Finales
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.title && data.title.length >= 3 ? (
            <div style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
              <span style={{ fontSize: '12px' }}>✓ Título válido</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#EF4444' }}>
              <span style={{ fontSize: '12px' }}>✗ Título requerido (mínimo 3 caracteres)</span>
            </div>
          )}
          
          {data.config?.startDate && data.config?.endDate ? (
            <div style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
              <span style={{ fontSize: '12px' }}>✓ Fechas configuradas</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#EF4444' }}>
              <span style={{ fontSize: '12px' }}>✗ Fechas de inicio y fin requeridas</span>
            </div>
          )}
          
          {stats.total > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
              <span style={{ fontSize: '12px' }}>✓ Evaluados seleccionados ({stats.total})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#EF4444' }}>
              <span style={{ fontSize: '12px' }}>✗ Debe seleccionar al menos un evaluado</span>
            </div>
          )}
          
          {stats.assigned > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
              <span style={{ fontSize: '12px' }}>✓ Tests asignados ({stats.assigned})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#EF4444' }}>
              <span style={{ fontSize: '12px' }}>✗ Debe asignar tests a los evaluados</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignReviewStep;
