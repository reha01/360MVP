/**
 * Tarjeta para mostrar información de una Job Family
 */

import React from 'react';
import { Edit, Trash2, Settings, Users, TestTube, Badge as BadgeIcon } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { getJobLevelLabel, getJobLevelColor, getRecommendedTests, getAllowedTests, getExcludedTests } from '../../models/JobFamily';

const JobFamilyCard = ({ 
  jobFamily, 
  onEdit, 
  onDelete, 
  onManageTests, 
  onManageUsers 
}) => {
  const recommendedTests = getRecommendedTests(jobFamily);
  const allowedTests = getAllowedTests(jobFamily);
  const excludedTests = getExcludedTests(jobFamily);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {jobFamily.name}
            </h3>
            <Badge className={getJobLevelColor(jobFamily.level)}>
              {getJobLevelLabel(jobFamily.level)}
            </Badge>
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(jobFamily)}
              className="p-1"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(jobFamily.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Description */}
        {jobFamily.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {jobFamily.description}
          </p>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {jobFamily.memberCount || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500">Usuarios</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TestTube className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {recommendedTests.length}
              </span>
            </div>
            <div className="text-xs text-gray-500">Tests</div>
          </div>
        </div>
        
        {/* Test Mappings */}
        <div className="space-y-2 mb-4">
          {recommendedTests.length > 0 && (
            <div className="flex items-center text-sm">
              <Badge variant="success" className="mr-2 text-xs">
                {recommendedTests.length}
              </Badge>
              <span className="text-gray-600">Recomendados</span>
            </div>
          )}
          
          {allowedTests.length > 0 && (
            <div className="flex items-center text-sm">
              <Badge variant="secondary" className="mr-2 text-xs">
                {allowedTests.length}
              </Badge>
              <span className="text-gray-600">Permitidos</span>
            </div>
          )}
          
          {excludedTests.length > 0 && (
            <div className="flex items-center text-sm">
              <Badge variant="destructive" className="mr-2 text-xs">
                {excludedTests.length}
              </Badge>
              <span className="text-gray-600">Excluidos</span>
            </div>
          )}
          
          {recommendedTests.length === 0 && allowedTests.length === 0 && excludedTests.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Sin tests configurados
            </div>
          )}
        </div>
        
        {/* Evaluator Config */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Configuración de Evaluadores</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Autoevaluación:</span>
              <span className={jobFamily.evaluatorConfig?.requireSelf ? 'text-green-600' : 'text-gray-400'}>
                {jobFamily.evaluatorConfig?.requireSelf ? 'Requerida' : 'Opcional'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Manager:</span>
              <span className={jobFamily.evaluatorConfig?.requireManager ? 'text-green-600' : 'text-gray-400'}>
                {jobFamily.evaluatorConfig?.requireManager ? 'Requerido' : 'Opcional'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pares:</span>
              <span className="text-blue-600">
                {jobFamily.evaluatorConfig?.peersMin || 0}-{jobFamily.evaluatorConfig?.peersMax || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Subordinados:</span>
              <span className="text-purple-600">
                {jobFamily.evaluatorConfig?.subordinatesMin || 0}+
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageTests(jobFamily)}
            className="flex-1 flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            Tests
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageUsers(jobFamily)}
            className="flex-1 flex items-center justify-center"
          >
            <Users className="w-4 h-4 mr-1" />
            Usuarios
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobFamilyCard;
