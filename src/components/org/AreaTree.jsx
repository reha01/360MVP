/**
 * Componente para visualizar y gestionar el árbol de estructura organizacional
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2, Users, Building } from 'lucide-react';
import { Button, Badge, Card } from '../ui';
import { ORG_LEVELS } from '../../models/OrgStructure';

const AreaTree = ({ areas, users, onEditArea, onDeleteArea, onEditUser }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // Construir árbol jerárquico
  const buildTree = () => {
    const areasMap = {};
    const rootAreas = [];
    
    // Crear mapa de áreas
    areas.forEach(area => {
      areasMap[area.id] = { ...area, children: [] };
    });
    
    // Construir árbol
    areas.forEach(area => {
      if (area.parentId && areasMap[area.parentId]) {
        areasMap[area.parentId].children.push(areasMap[area.id]);
      } else {
        rootAreas.push(areasMap[area.id]);
      }
    });
    
    return { rootAreas, areasMap };
  };
  
  const { rootAreas, areasMap } = buildTree();
  
  const toggleExpanded = (areaId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedNodes(newExpanded);
  };
  
  const getAreaUsers = (areaId) => {
    return users.filter(user => 
      user.areaId === areaId || user.departmentId === areaId
    );
  };
  
  const getLevelIcon = (level) => {
    switch (level) {
      case ORG_LEVELS.ORGANIZATION:
        return <Building className="w-4 h-4 text-blue-600" />;
      case ORG_LEVELS.AREA:
        return <Building className="w-4 h-4 text-green-600" />;
      case ORG_LEVELS.DEPARTMENT:
        return <Building className="w-4 h-4 text-purple-600" />;
      default:
        return <Building className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getLevelLabel = (level) => {
    switch (level) {
      case ORG_LEVELS.ORGANIZATION: return 'Organización';
      case ORG_LEVELS.AREA: return 'Área';
      case ORG_LEVELS.DEPARTMENT: return 'Departamento';
      default: return 'Nivel';
    }
  };
  
  const getLevelColor = (level) => {
    switch (level) {
      case ORG_LEVELS.ORGANIZATION: return 'bg-blue-100 text-blue-800';
      case ORG_LEVELS.AREA: return 'bg-green-100 text-green-800';
      case ORG_LEVELS.DEPARTMENT: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const TreeNode = ({ area, depth = 0 }) => {
    const isExpanded = expandedNodes.has(area.id);
    const hasChildren = area.children.length > 0;
    const areaUsers = getAreaUsers(area.id);
    
    return (
      <div className="select-none">
        {/* Nodo del área */}
        <div 
          className={`
            flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer
            ${depth > 0 ? 'ml-4' : ''}
          `}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* Expandir/Colapsar */}
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(area.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            {/* Icono de nivel */}
            <div className="mr-3">
              {getLevelIcon(area.level)}
            </div>
            
            {/* Información del área */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{area.name}</h3>
                <Badge className={getLevelColor(area.level)}>
                  {getLevelLabel(area.level)}
                </Badge>
                {areaUsers.length > 0 && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{areaUsers.length}</span>
                  </Badge>
                )}
              </div>
              
              {area.description && (
                <p className="text-sm text-gray-600 mt-1">{area.description}</p>
              )}
              
              {area.managerId && (
                <p className="text-xs text-gray-500 mt-1">
                  Manager: {area.managerId}
                </p>
              )}
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditArea(area)}
              className="p-1"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteArea(area.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Usuarios del área */}
        {areaUsers.length > 0 && (
          <div 
            className="ml-8 mb-2"
            style={{ marginLeft: `${(depth + 1) * 20 + 32}px` }}
          >
            <div className="space-y-1">
              {areaUsers.slice(0, 3).map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-gray-900">{user.displayName}</span>
                    <span className="text-gray-500">({user.jobTitle})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUser(user)}
                    className="p-1 text-xs"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {areaUsers.length > 3 && (
                <div className="text-xs text-gray-500 px-2">
                  +{areaUsers.length - 3} usuarios más...
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Nodos hijos */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {area.children.map(child => (
              <TreeNode 
                key={child.id} 
                area={child} 
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  if (rootAreas.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay estructura organizacional
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera área o departamento
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estructura Organizacional
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 rounded-full" />
              <span>Organización</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 rounded-full" />
              <span>Área</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-100 rounded-full" />
              <span>Departamento</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          {rootAreas.map(area => (
            <TreeNode key={area.id} area={area} />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default AreaTree;
