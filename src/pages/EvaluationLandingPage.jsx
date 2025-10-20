/**
 * Landing page para evaluadores con token
 * 
 * Ruta: /eval/:token
 * Permite a evaluadores externos acceder a evaluaciones sin login
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, User, Target, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import evaluatorAssignmentService from '../services/evaluatorAssignmentService';
import { getEvaluatorTypeLabel, getEvaluatorTypeColor, getTokenTimeRemaining } from '../models/EvaluatorAssignment';
import { Button, Card, Alert, Spinner, Badge } from '../components/ui';

const EvaluationLandingPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [evaluatee, setEvaluatee] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Cargar datos del token
  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);
  
  // Actualizar tiempo restante cada minuto
  useEffect(() => {
    if (assignment) {
      const interval = setInterval(() => {
        const remaining = getTokenTimeRemaining(assignment);
        setTimeRemaining(remaining);
      }, 60000); // Cada minuto
      
      return () => clearInterval(interval);
    }
  }, [assignment]);
  
  const loadTokenData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar token y obtener asignación
      const assignmentData = await evaluatorAssignmentService.validateToken(token);
      setAssignment(assignmentData);
      
      // Obtener información de la campaña
      const campaignData = await campaignService.getCampaign(assignmentData.orgId, assignmentData.campaignId);
      setCampaign(campaignData);
      
      // Obtener información del evaluado
      const evaluateeData = await orgStructureService.getOrgUser(assignmentData.orgId, assignmentData.evaluateeId);
      setEvaluatee(evaluateeData);
      
      // Calcular tiempo restante
      const remaining = getTokenTimeRemaining(assignmentData);
      setTimeRemaining(remaining);
      
      console.log('[EvaluationLanding] Token data loaded:', {
        assignmentId: assignmentData.id,
        evaluatorEmail: assignmentData.evaluatorEmail,
        evaluatorType: assignmentData.evaluatorType
      });
    } catch (err) {
      console.error('[EvaluationLanding] Error loading token data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartEvaluation = () => {
    if (!assignment) return;
    
    // Navegar a la evaluación 360°
    navigate(`/evaluation360/${token}`, {
      state: {
        assignment,
        campaign,
        evaluatee,
        token
      }
    });
  };
  
  const formatTimeRemaining = (remaining) => {
    if (!remaining) return 'Tiempo no disponible';
    
    if (remaining.expired) {
      return 'Token expirado';
    }
    
    const parts = [];
    if (remaining.days > 0) parts.push(`${remaining.days} día${remaining.days > 1 ? 's' : ''}`);
    if (remaining.hours > 0) parts.push(`${remaining.hours} hora${remaining.hours > 1 ? 's' : ''}`);
    if (remaining.minutes > 0) parts.push(`${remaining.minutes} minuto${remaining.minutes > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Menos de 1 minuto';
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'invited': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Validando token...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    // RESPUESTA NEUTRA CON TIMINGS HOMOGÉNEOS
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-600 text-xl">🔒</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Acceso No Disponible
              </h1>
              <p className="text-gray-600 mb-4">
                No se puede acceder a la evaluación en este momento. 
                Por favor, verifica el enlace o contacta al administrador.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Si crees que esto es un error, por favor contacta al administrador del sistema.
              </div>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
              >
                Ir al Inicio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!assignment || !campaign || !evaluatee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No se pudo cargar la información de la evaluación</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluación 360°
          </h1>
          <p className="text-gray-600">
            {campaign.title}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Evaluation Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Evaluation Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información de la Evaluación
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Evaluando a</p>
                      <p className="font-medium text-gray-900">{evaluatee.displayName}</p>
                      <p className="text-sm text-gray-600">{evaluatee.jobTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Tu rol como evaluador</p>
                      <Badge className={getEvaluatorTypeColor(assignment.evaluatorType)}>
                        {getEvaluatorTypeLabel(assignment.evaluatorType)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha límite</p>
                      <p className="font-medium text-gray-900">
                        {new Date(campaign.config.endDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Instructions Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Instrucciones
                </h3>
                
                <div className="prose prose-sm text-gray-600">
                  <p>
                    Esta es una evaluación 360° confidencial. Tus respuestas serán anónimas 
                    y se utilizarán únicamente para el desarrollo profesional de {evaluatee.displayName}.
                  </p>
                  
                  <p>
                    Por favor, sé honesto y constructivo en tus respuestas. El proceso 
                    completo tomará aproximadamente 15-20 minutos.
                  </p>
                  
                  <p>
                    <strong>Importante:</strong> Una vez que comiences la evaluación, 
                    asegúrate de completarla en una sola sesión.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado de la Evaluación
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Estado</span>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status === 'pending' && 'Pendiente'}
                      {assignment.status === 'invited' && 'Invitado'}
                      {assignment.status === 'in_progress' && 'En Progreso'}
                      {assignment.status === 'completed' && 'Completado'}
                      {assignment.status === 'expired' && 'Expirado'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tiempo restante</span>
                    <span className={`text-sm font-medium ${
                      timeRemaining?.expired ? 'text-red-600' : 
                      timeRemaining?.days < 1 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {formatTimeRemaining(timeRemaining)}
                    </span>
                  </div>
                  
                  {assignment.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Completado</span>
                      <span className="text-sm text-gray-900">
                        {new Date(assignment.completedAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Actions Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acciones
                </h3>
                
                <div className="space-y-3">
                  {assignment.status === 'completed' ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Evaluación completada
                      </p>
                    </div>
                  ) : timeRemaining?.expired ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Token expirado
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleStartEvaluation}
                      className="w-full"
                      size="lg"
                    >
                      {assignment.status === 'in_progress' ? 'Continuar Evaluación' : 'Comenzar Evaluación'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open('mailto:support@company.com', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Contactar Soporte
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Privacy Notice */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Privacidad
                </h3>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    • Tus respuestas son completamente anónimas
                  </p>
                  <p>
                    • Solo se mostrarán resultados agregados
                  </p>
                  <p>
                    • Los datos se almacenan de forma segura
                  </p>
                  <p>
                    • Puedes contactar soporte si tienes dudas
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationLandingPage;
