// src/pages/FeatureAwareOrgProcesses.jsx
import React, { useState, useEffect } from 'react';
import FeatureGate from '../components/FeatureGate';
import { useAuth } from '../context/AuthContext';
import emailService from '../services/emailService';
import featureFlags from '../services/featureFlags';

const FeatureAwareOrgProcesses = () => {
  const { user } = useAuth();
  const [processes, setProcesses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({});
  const [selectedProcess, setSelectedProcess] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockProcesses = [
      {
        id: 'proc-1',
        name: 'Evaluación Q1 2024',
        deadline: new Date('2024-03-31'),
        status: 'active',
        totalParticipants: 15,
        completedParticipants: 8,
        tenantName: 'Demo Corp'
      },
      {
        id: 'proc-2',
        name: 'Evaluación de Liderazgo',
        deadline: new Date('2024-04-15'),
        status: 'draft',
        totalParticipants: 25,
        completedParticipants: 0,
        tenantName: 'Demo Corp'
      }
    ];

    const mockInvitations = [
      {
        id: 'inv-1',
        processId: 'proc-1',
        participantName: 'Juan Pérez',
        toEmail: 'juan.perez@demo.com',
        roleInProcess: 'Evaluado',
        status: 'pending',
        emailStatus: 'sent',
        lastEmailSentAt: new Date('2024-01-15')
      },
      {
        id: 'inv-2',
        processId: 'proc-1',
        participantName: 'María García',
        toEmail: 'maria.garcia@demo.com',
        roleInProcess: 'Evaluador',
        status: 'completed',
        emailStatus: 'delivered',
        lastEmailSentAt: new Date('2024-01-15')
      }
    ];

    setProcesses(mockProcesses);
    setInvitations(mockInvitations);
  }, []);

  const handleSendInvitations = async (processId) => {
    setLoading(true);
    try {
      const processInvitations = invitations.filter(inv => inv.processId === processId);
      const invitationIds = processInvitations.map(inv => inv.id);
      
      const result = await emailService.sendInvitations(processId, invitationIds);
      
      // Update local state
      setInvitations(prev => prev.map(inv => 
        invitationIds.includes(inv.id) 
          ? { ...inv, emailStatus: 'sent', lastEmailSentAt: new Date() }
          : inv
      ));
      
      alert(`Invitaciones enviadas: ${result.successful}/${result.totalProcessed} exitosas`);
    } catch (error) {
      alert(`Error enviando invitaciones: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async (processId) => {
    setLoading(true);
    try {
      const result = await emailService.sendReminders(processId, 3);
      alert(`Recordatorios enviados: ${result.successful}/${result.totalProcessed} exitosos`);
    } catch (error) {
      alert(`Error enviando recordatorios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getEmailStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '📧';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getEmailStatusText = (status) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'failed': return 'Falló';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  return (
    <FeatureGate 
      feature="org" 
      showDisabledMessage={true}
    >
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '48px', marginRight: '20px' }}>🏢</div>
            <div>
              <h1 style={{ margin: 0, color: '#2c3e50' }}>Dashboard Organizacional</h1>
              <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                Gestión de procesos de evaluación 360°
              </p>
            </div>
          </div>

          {/* Feature Flags Status */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            <strong>Feature Flags:</strong> 
            <span style={{ marginLeft: '10px' }}>
              Org: {featureFlags.isEnabled('org') ? '✅' : '❌'} | 
              Email: {featureFlags.isEnabled('email') ? '✅' : '❌'} | 
              Invites: {featureFlags.isEnabled('invites') ? '✅' : '❌'}
            </span>
          </div>

          {/* Processes List */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Procesos de Evaluación</h2>
            
            {processes.map(process => (
              <div key={process.id} style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '15px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{process.name}</h3>
                    <p style={{ color: '#666', margin: '0 0 10px 0' }}>
                      Fecha límite: {process.deadline.toLocaleDateString('es-ES')}
                    </p>
                    <p style={{ color: '#666', margin: '0 0 15px 0' }}>
                      Progreso: {process.completedParticipants}/{process.totalParticipants} participantes
                    </p>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        width: `${(process.completedParticipants / process.totalParticipants) * 100}%`,
                        height: '100%',
                        backgroundColor: '#28a745',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button
                      onClick={() => handleSendInvitations(process.id)}
                      disabled={loading || process.status === 'draft'}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading || process.status === 'draft' ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Enviando...' : '📧 Enviar Invitaciones'}
                    </button>
                    
                    <button
                      onClick={() => handleSendReminders(process.id)}
                      disabled={loading || process.status === 'draft'}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading || process.status === 'draft' ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Enviando...' : '⏰ Enviar Recordatorios'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Invitations Status */}
          <div>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Estado de Invitaciones</h2>
            
            <div style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Participante
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Rol
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Estado
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                      Último Envío
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(invitation => (
                    <tr key={invitation.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <td style={{ padding: '12px' }}>{invitation.participantName}</td>
                      <td style={{ padding: '12px' }}>{invitation.toEmail}</td>
                      <td style={{ padding: '12px' }}>{invitation.roleInProcess}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: invitation.status === 'completed' ? '#d4edda' : '#fff3cd',
                          color: invitation.status === 'completed' ? '#155724' : '#856404'
                        }}>
                          {invitation.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '16px', marginRight: '5px' }}>
                          {getEmailStatusIcon(invitation.emailStatus)}
                        </span>
                        {getEmailStatusText(invitation.emailStatus)}
                      </td>
                      <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                        {invitation.lastEmailSentAt?.toLocaleDateString('es-ES') || 'Nunca'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <a
              href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              ← Volver al Dashboard
            </a>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default FeatureAwareOrgProcesses;
