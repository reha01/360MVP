/**
 * Tarjeta para mostrar información de una campaña
 */

import React from 'react';
import { Play, Pause, Eye, Users, TestTube, Clock, Calendar } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { getCampaignStatusLabel, getCampaignStatusColor, getCampaignTypeLabel } from '../../models/Campaign';

const CampaignCard = ({ campaign, onActivate, onClose }) => {
  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString();
  };
  
  const formatDateTime = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleString();
  };
  
  const canActivate = campaign.status === 'draft';
  const canClose = campaign.status === 'active';
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {campaign.title}
            </h3>
            <Badge className={getCampaignStatusColor(campaign.status)}>
              {getCampaignStatusLabel(campaign.status)}
            </Badge>
          </div>
        </div>
        
        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {campaign.description}
          </p>
        )}
        
        {/* Type */}
        <div className="mb-4">
          <span className="text-sm text-gray-500">Tipo: </span>
          <span className="text-sm font-medium text-gray-900">
            {getCampaignTypeLabel(campaign.type)}
          </span>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {campaign.stats?.totalEvaluatees || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500">Evaluados</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TestTube className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {campaign.stats?.totalInvitations || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500">Invitaciones</div>
          </div>
        </div>
        
        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Inicio: {formatDate(campaign.config?.startDate)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Fin: {formatDate(campaign.config?.endDate)}</span>
          </div>
        </div>
        
        {/* Completion Rate */}
        {campaign.stats?.completionRate !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Completitud</span>
              <span className="font-medium text-gray-900">
                {campaign.stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${campaign.stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Creada: {formatDateTime(campaign.createdAt)}</div>
          {campaign.activatedAt && (
            <div>Activada: {formatDateTime(campaign.activatedAt)}</div>
          )}
          {campaign.closedAt && (
            <div>Cerrada: {formatDateTime(campaign.closedAt)}</div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          
          {canActivate && (
            <Button
              size="sm"
              onClick={() => onActivate(campaign.id)}
              className="flex-1 flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-1" />
              Activar
            </Button>
          )}
          
          {canClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClose(campaign.id)}
              className="flex-1 flex items-center justify-center"
            >
              <Pause className="w-4 h-4 mr-1" />
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CampaignCard;
