/**
 * Paso 2: Selección de Evaluados
 */

import React, { useState, useEffect } from 'react';
import { Users, Filter, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, Input, Checkbox, Alert } from '../ui';
import { getJobLevelLabel, getJobLevelColor } from '../../models/JobFamily';

const EvaluateeSelectionStep = ({ 
  data, 
  jobFamilies, 
  areas, 
  users, 
  filteredUsers, 
  onChange 
}) => {
  const [filters, setFilters] = useState({
    jobFamilyIds: data.evaluateeFilters?.jobFamilyIds || [],
    areaIds: data.evaluateeFilters?.areaIds || [],
    userIds: data.evaluateeFilters?.userIds || []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  
  // Notificar cambios al padre
  useEffect(() => {
    onChange({
      evaluateeFilters: filters
    });
  }, [filters, onChange]);
  
  const handleFilterChange = (filterType, value, checked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(id => id !== value)
    }));
  };
  
  const handleUserSelection = (userId, selected) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };
  
  const handleApplyUserSelection = () => {
    setFilters(prev => ({
      ...prev,
      userIds: Array.from(selectedUsers)
    }));
  };
  
  // Filtrar usuarios por búsqueda
  const searchFilteredUsers = filteredUsers.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getJobFamilyName = (familyId) => {
    const family = jobFamilies.find(f => f.id === familyId);
    return family ? family.name : familyId;
  };
  
  const getAreaName = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : areaId;
  };
  
  const getFilterSummary = () => {
    const summary = [];
    
    if (filters.jobFamilyIds.length > 0) {
      summary.push(`${filters.jobFamilyIds.length} Job Family(s)`);
    }
    
    if (filters.areaIds.length > 0) {
      summary.push(`${filters.areaIds.length} Área(s)`);
    }
    
    if (filters.userIds.length > 0) {
      summary.push(`${filters.userIds.length} Usuario(s) específico(s)`);
    }
    
    return summary.length > 0 ? summary.join(', ') : 'Sin filtros aplicados';
  };
  
  return (
    <div className="space-y-6">
      {/* Filtros por Job Family */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtrar por Job Family
          </h3>
          
          {jobFamilies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobFamilies.map(family => (
                <label key={family.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={filters.jobFamilyIds.includes(family.id)}
                    onChange={(checked) => handleFilterChange('jobFamilyIds', family.id, checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{family.name}</div>
                    <div className="text-sm text-gray-500">
                      <Badge className={getJobLevelColor(family.level)}>
                        {getJobLevelLabel(family.level)}
                      </Badge>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <Alert type="info">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay Job Families configuradas. Crea Job Families primero para poder filtrar por ellas.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
      
      {/* Filtros por Área */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtrar por Área/Departamento
          </h3>
          
          {areas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {areas.map(area => (
                <label key={area.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={filters.areaIds.includes(area.id)}
                    onChange={(checked) => handleFilterChange('areaIds', area.id, checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{area.name}</div>
                    <div className="text-sm text-gray-500">
                      {area.level === 2 ? 'Área' : 'Departamento'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <Alert type="info">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay áreas configuradas. Crea áreas primero para poder filtrar por ellas.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
      
      {/* Selección Manual de Usuarios */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Selección Manual de Usuarios
          </h3>
          
          {/* Búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios por nombre, email o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Resumen de filtros */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Filtros aplicados:</strong> {getFilterSummary()}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              <strong>Usuarios encontrados:</strong> {filteredUsers.length}
            </div>
          </div>
          
          {/* Lista de usuarios */}
          {searchFilteredUsers.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Select All */}
              <div className="flex items-center space-x-2 p-2 border-b">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="font-medium text-gray-900">
                  Seleccionar todos ({filteredUsers.length})
                </span>
              </div>
              
              {searchFilteredUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onChange={(checked) => handleUserSelection(user.id, checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-sm text-gray-600">
                      {user.email} • {user.jobTitle}
                    </div>
                    {user.jobFamilyIds && user.jobFamilyIds.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-500">Job Families:</span>
                        {user.jobFamilyIds.slice(0, 2).map(familyId => (
                          <Badge key={familyId} variant="secondary" className="text-xs">
                            {getJobFamilyName(familyId)}
                          </Badge>
                        ))}
                        {user.jobFamilyIds.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{user.jobFamilyIds.length - 2} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert type="info">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles para seleccionar'}
              </Alert.Description>
            </Alert>
          )}
          
          {/* Aplicar selección */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleApplyUserSelection}
                className="flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aplicar Selección ({selectedUsers.size} usuarios)
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Resumen Final */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Evaluados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {filteredUsers.length}
              </div>
              <div className="text-sm text-blue-800">Usuarios Seleccionados</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filters.jobFamilyIds.length}
              </div>
              <div className="text-sm text-green-800">Job Families</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filters.areaIds.length}
              </div>
              <div className="text-sm text-purple-800">Áreas/Departamentos</div>
            </div>
          </div>
          
          {filteredUsers.length === 0 && (
            <Alert type="warning" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <Alert.Description>
                No hay usuarios seleccionados. Aplica filtros o selecciona usuarios manualmente.
              </Alert.Description>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EvaluateeSelectionStep;
