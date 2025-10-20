/**
 * Paso 5: Revisión y Activación
 */

import React from 'react';
import { CheckCircle, AlertCircle, Users, TestTube, Clock, Shield } from 'lucide-react';
import { Card, Badge, Alert } from '../ui';
import { getCampaignTypeLabel, getCampaignStatusLabel } from '../../models/Campaign';
import { getJobLevelLabel, getJobLevelColor } from '../../models/JobFamily';

const CampaignReviewStep = ({ 
  data, 
  filteredUsers, 
  jobFamilies, 
  areas, 
  availableTests 
}) => {
  const getTestName = (testId) => {
    const test = availableTests.find(t => t.id === testId);
    return test ? test.name : testId;
  };
  
  const getJobFamilyName = (familyId) => {
    const family = jobFamilies.find(f => f.id === familyId);
    return family ? family.name : familyId;
  };
  
  const getAreaName = (areaId) => {
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
  
  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Información General
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Título</label>
                  <div className="text-lg font-semibold text-gray-900">{data.title}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción</label>
                  <div className="text-gray-900">{data.description || 'Sin descripción'}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <div className="text-gray-900">{getCampaignTypeLabel(data.type)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Inicio</label>
                  <div className="text-gray-900">
                    {data.config?.startDate ? new Date(data.config.startDate).toLocaleString() : 'No definida'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Fin</label>
                  <div className="text-gray-900">
                    {data.config?.endDate ? new Date(data.config.endDate).toLocaleString() : 'No definida'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Zona Horaria</label>
                  <div className="text-gray-900">{data.config?.timezone || 'UTC'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Evaluados Seleccionados */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Evaluados Seleccionados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Usuarios</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.withJobFamily}</div>
              <div className="text-sm text-green-800">Con Job Family</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.evaluateeFilters?.jobFamilyIds?.length || 0}</div>
              <div className="text-sm text-purple-800">Job Families</div>
            </div>
          </div>
          
          {/* Filtros aplicados */}
          <div className="space-y-2">
            {data.evaluateeFilters?.jobFamilyIds?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Job Families:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.evaluateeFilters.jobFamilyIds.map(familyId => (
                    <Badge key={familyId} variant="secondary">
                      {getJobFamilyName(familyId)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.evaluateeFilters?.areaIds?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Áreas/Departamentos:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.evaluateeFilters.areaIds.map(areaId => (
                    <Badge key={areaId} variant="secondary">
                      {getAreaName(areaId)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.evaluateeFilters?.userIds?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Usuarios Específicos:</label>
                <div className="text-sm text-gray-600 mt-1">
                  {data.evaluateeFilters.userIds.length} usuario(s) seleccionado(s) manualmente
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Asignación de Tests */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Asignación de Tests
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
              <div className="text-sm text-green-800">Tests Asignados</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.total - stats.assigned}</div>
              <div className="text-sm text-orange-800">Sin Asignar</div>
            </div>
          </div>
          
          {stats.assigned > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(data.testAssignments || {}).map(([userId, assignment]) => {
                const user = filteredUsers.find(u => u.id === userId);
                if (!user) return null;
                
                return (
                  <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{user.displayName}</span>
                      <span className="text-gray-600 ml-2">→</span>
                      <span className="text-blue-600 ml-2">
                        {getTestName(assignment.testId)} (v{assignment.version})
                      </span>
                    </div>
                    <Badge variant="success" className="text-xs">
                      {assignment.reason}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          
          {stats.assigned === 0 && (
            <Alert type="warning">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay tests asignados. Ve al paso anterior para asignar tests.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
      
      {/* Reglas de Evaluadores */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Reglas de Evaluadores
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Evaluadores Requeridos</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Autoevaluación</span>
                  <Badge variant={data.config?.requiredEvaluators?.self ? 'success' : 'secondary'}>
                    {data.config?.requiredEvaluators?.self ? 'Requerida' : 'Opcional'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Manager Directo</span>
                  <Badge variant={data.config?.requiredEvaluators?.manager ? 'success' : 'secondary'}>
                    {data.config?.requiredEvaluators?.manager ? 'Requerido' : 'Opcional'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pares</span>
                  <Badge variant="info">
                    {data.config?.requiredEvaluators?.peers?.min || 0}-{data.config?.requiredEvaluators?.peers?.max || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subordinados</span>
                  <Badge variant="purple">
                    {data.config?.requiredEvaluators?.subordinates?.min || 0}+
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Externos</span>
                  <Badge variant="orange">
                    {data.config?.requiredEvaluators?.external?.min || 0}+
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Umbrales de Anonimato</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pares</span>
                  <Badge variant="info">
                    {data.config?.anonymityThresholds?.peers || 3}+
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subordinados</span>
                  <Badge variant="purple">
                    {data.config?.anonymityThresholds?.subordinates || 3}+
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Externos</span>
                  <Badge variant="orange">
                    {data.config?.anonymityThresholds?.external || 1}+
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Recordatorios */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recordatorios Automáticos
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Programación</label>
              <div className="text-gray-900">
                {data.config?.reminderSchedule?.length > 0 
                  ? `Recordatorios a los ${data.config.reminderSchedule.join(', ')} días antes del vencimiento`
                  : 'Sin recordatorios configurados'
                }
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Validaciones Finales */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Validaciones Finales
          </h3>
          
          <div className="space-y-3">
            {data.title && data.title.length >= 3 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Título válido</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Título requerido (mínimo 3 caracteres)</span>
              </div>
            )}
            
            {data.config?.startDate && data.config?.endDate ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Fechas configuradas</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Fechas de inicio y fin requeridas</span>
              </div>
            )}
            
            {stats.total > 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Evaluados seleccionados ({stats.total})</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Debe seleccionar al menos un evaluado</span>
              </div>
            )}
            
            {stats.assigned > 0 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Tests asignados ({stats.assigned})</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Debe asignar tests a los evaluados</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CampaignReviewStep;
