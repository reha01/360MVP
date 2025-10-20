/**
 * Componente para gestionar asignaciones de evaluadores
 */

import React, { useState, useEffect } from 'react';
import { Users, Mail, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import { 
  getAssignmentStatusLabel, 
  getAssignmentStatusColor, 
  getEvaluatorTypeLabel, 
  getEvaluatorTypeColor,
  getTokenTimeRemaining 
} from '../../models/EvaluatorAssignment';
import { Button, Card, Badge, Alert, Spinner, Tabs } from '../ui';

const EvaluatorAssignmentsManager = ({ orgId, campaignId, session360Id }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Cargar asignaciones
  useEffect(() => {
    if (session360Id) {
      loadAssignments();
    }
  }, [session360Id]);
  
  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [assignmentsData, statsData] = await Promise.all([
        evaluatorAssignmentService.getSessionAssignments(orgId, session360Id),
        evaluatorAssignmentService.getAssignmentStats(orgId, campaignId)
      ]);
      
      setAssignments(assignmentsData);
      setStats(statsData);
      
      console.log(`[EvaluatorAssignments] Loaded ${assignmentsData.length} assignments`);
    } catch (err) {
      console.error('[EvaluatorAssignments] Error loading assignments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendInvitations = async () => {
    try {
      setSendingEmails(true);
      
      // Obtener asignaciones pendientes
      const pendingAssignments = assignments.filter(a => a.status === 'pending');
      const assignmentIds = pendingAssignments.map(a => a.id);
      
      if (assignmentIds.length === 0) {
        setError('No hay asignaciones pendientes para enviar');
        return;
      }
      
      // Enviar invitaciones (en implementación real, usar Cloud Function)
      console.log('[EvaluatorAssignments] Sending invitations:', assignmentIds);
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recargar asignaciones
      await loadAssignments();
      
    } catch (err) {
      console.error('[EvaluatorAssignments] Error sending invitations:', err);
      setError(err.message);
    } finally {
      setSendingEmails(false);
    }
  };
  
  const handleSendReminders = async () => {
    try {
      setSendingEmails(true);
      
      // Obtener asignaciones que necesitan recordatorio
      const reminderAssignments = assignments.filter(a => 
        a.status === 'invited' || a.status === 'in_progress'
      );
      const assignmentIds = reminderAssignments.map(a => a.id);
      
      if (assignmentIds.length === 0) {
        setError('No hay asignaciones que necesiten recordatorio');
        return;
      }
      
      // Enviar recordatorios (en implementación real, usar Cloud Function)
      console.log('[EvaluatorAssignments] Sending reminders:', assignmentIds);
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recargar asignaciones
      await loadAssignments();
      
    } catch (err) {
      console.error('[EvaluatorAssignments] Error sending reminders:', err);
      setError(err.message);
    } finally {
      setSendingEmails(false);
    }
  };
  
  const formatTimeRemaining = (assignment) => {
    const remaining = getTokenTimeRemaining(assignment);
    if (!remaining) return 'N/A';
    
    if (remaining.expired) {
      return 'Expirado';
    }
    
    const parts = [];
    if (remaining.days > 0) parts.push(`${remaining.days}d`);
    if (remaining.hours > 0) parts.push(`${remaining.hours}h`);
    if (remaining.minutes > 0) parts.push(`${remaining.minutes}m`);
    
    return parts.length > 0 ? parts.join(' ') : '<1m';
  };
  
  const getFilteredAssignments = () => {
    switch (activeTab) {
      case 'pending':
        return assignments.filter(a => a.status === 'pending');
      case 'invited':
        return assignments.filter(a => a.status === 'invited');
      case 'in_progress':
        return assignments.filter(a => a.status === 'in_progress');
      case 'completed':
        return assignments.filter(a => a.status === 'completed');
      case 'expired':
        return assignments.filter(a => a.status === 'expired');
      default:
        return assignments;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
        <span className="ml-2">Cargando asignaciones...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert type="error" className="mb-4">
        <AlertCircle className="w-4 h-4" />
        <Alert.Description>{error}</Alert.Description>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Cerrar
        </Button>
      </Alert>
    );
  }
  
  const filteredAssignments = getFilteredAssignments();
  
  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Asignaciones de Evaluadores
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAssignments}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </Button>
            </div>
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.invited}</div>
                <div className="text-sm text-gray-500">Invitados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-500">Completados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                <div className="text-sm text-gray-500">Expirados</div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Acciones de email */}
      <Card>
        <div className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Envío de Emails
          </h4>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleSendInvitations}
              disabled={sendingEmails || stats?.pending === 0}
              className="flex items-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Invitaciones ({stats?.pending || 0})
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSendReminders}
              disabled={sendingEmails || (stats?.invited + stats?.in_progress) === 0}
              className="flex items-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Enviar Recordatorios ({(stats?.invited || 0) + (stats?.in_progress || 0)})
            </Button>
          </div>
          
          {sendingEmails && (
            <div className="mt-4 flex items-center text-blue-600">
              <Spinner size="sm" />
              <span className="ml-2">Enviando emails...</span>
            </div>
          )}
        </div>
      </Card>
      
      {/* Lista de asignaciones */}
      <Card>
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="all">Todas ({assignments.length})</Tabs.Trigger>
              <Tabs.Trigger value="pending">Pendientes ({stats?.pending || 0})</Tabs.Trigger>
              <Tabs.Trigger value="invited">Invitados ({stats?.invited || 0})</Tabs.Trigger>
              <Tabs.Trigger value="in_progress">En Progreso ({stats?.in_progress || 0})</Tabs.Trigger>
              <Tabs.Trigger value="completed">Completados ({stats?.completed || 0})</Tabs.Trigger>
              <Tabs.Trigger value="expired">Expirados ({stats?.expired || 0})</Tabs.Trigger>
            </Tabs.List>
            
            <Tabs.Content value={activeTab} className="mt-4">
              <div className="space-y-3">
                {filteredAssignments.map(assignment => (
                  <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {assignment.evaluatorName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {assignment.evaluatorEmail}
                            </div>
                          </div>
                          
                          <Badge className={getEvaluatorTypeColor(assignment.evaluatorType)}>
                            {getEvaluatorTypeLabel(assignment.evaluatorType)}
                          </Badge>
                          
                          <Badge className={getAssignmentStatusColor(assignment.status)}>
                            {getAssignmentStatusLabel(assignment.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTimeRemaining(assignment)}
                          </div>
                          
                          {assignment.emailSent && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              Enviado
                            </div>
                          )}
                          
                          {assignment.completedAt && (
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completado
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Token: {assignment.token.substring(0, 8)}...
                        </div>
                        {assignment.timeSpent > 0 && (
                          <div className="text-sm text-gray-500">
                            {assignment.timeSpent} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredAssignments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay asignaciones en este estado
                  </div>
                )}
              </div>
            </Tabs.Content>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default EvaluatorAssignmentsManager;
