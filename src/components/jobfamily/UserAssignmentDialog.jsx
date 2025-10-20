/**
 * Dialog para gestionar la asignación de usuarios a una Job Family
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, Search } from 'lucide-react';
import { Button, Alert, Card, Input, Badge } from '../ui';
import jobFamilyService from '../../services/jobFamilyService';

const UserAssignmentDialog = ({ isOpen, onClose, jobFamily, users, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar usuarios asignados
  useEffect(() => {
    if (isOpen && jobFamily) {
      loadAssignedUsers();
    }
  }, [isOpen, jobFamily]);
  
  const loadAssignedUsers = async () => {
    try {
      const users = await jobFamilyService.getUsersByJobFamily(
        jobFamily.orgId,
        jobFamily.id
      );
      setAssignedUsers(users);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleAssignUser = async (userId) => {
    setLoading(true);
    try {
      await jobFamilyService.assignJobFamilyToUser(
        jobFamily.orgId,
        userId,
        jobFamily.id,
        'current-user-id' // En implementación real, usar userId del contexto
      );
      await loadAssignedUsers();
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveUser = async (userId) => {
    setLoading(true);
    try {
      await jobFamilyService.removeJobFamilyFromUser(
        jobFamily.orgId,
        userId,
        jobFamily.id,
        'current-user-id'
      );
      await loadAssignedUsers();
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isNotAssigned = !assignedUsers.some(assigned => assigned.id === user.id);
    
    return matchesSearch && isNotAssigned;
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Asignación de Usuarios
              </h2>
              <p className="text-gray-600 mt-1">
                {jobFamily.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Error */}
          {error && (
            <Alert type="error" className="mb-6">
              <Alert.Description>{error}</Alert.Description>
            </Alert>
          )}
          
          {/* Usuarios Asignados */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  Usuarios Asignados ({assignedUsers.length})
                </h3>
              </div>
              
              <div className="space-y-2">
                {assignedUsers.length > 0 ? (
                  assignedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {user.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.email} • {user.jobTitle}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay usuarios asignados a esta Job Family
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Buscar y Asignar Usuarios */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asignar Usuarios
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
              
              {/* Lista de usuarios disponibles */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-sm">
                              {user.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.email} • {user.jobTitle}
                            </div>
                            {user.jobFamilyIds && user.jobFamilyIds.length > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <span className="text-xs text-gray-500">Job Families:</span>
                                {user.jobFamilyIds.slice(0, 2).map(familyId => (
                                  <Badge key={familyId} variant="secondary" className="text-xs">
                                    {familyId}
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
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignUser(user.id)}
                        disabled={loading}
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Asignar
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles para asignar'}
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAssignmentDialog;
