// src/pages/InvitePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import featureFlags from '../lib/featureFlags';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    // Mock invitation data for demonstration
    const mockInvitation = {
      id: 'inv-1',
      token: token,
      participantName: 'Juan Pérez',
      toEmail: 'juan.perez@demo.com',
      roleInProcess: 'Evaluado',
      processName: 'Evaluación Q1 2024',
      deadline: new Date('2024-03-31'),
      tenantName: 'Demo Corp',
      status: 'pending'
    };

    // Simulate API call
    setTimeout(() => {
      setInvitation(mockInvitation);
      setLoading(false);
    }, 1000);
  }, [token]);

  const handleStartEvaluation = () => {
    // In a real implementation, this would start the evaluation process
    alert('Iniciando evaluación... (Funcionalidad de demostración)');
    navigate('/evaluation');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p>Cargando invitación...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>Invitación no válida</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {error || 'No se pudo encontrar la invitación solicitada.'}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>
            Evaluación 360°
          </h1>
          <p style={{ color: '#666' }}>
            Has sido invitado a participar en una evaluación organizacional
          </p>
        </div>

        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid #3498db',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Detalles de la Invitación</h3>
          <p><strong>Participante:</strong> {invitation.participantName}</p>
          <p><strong>Proceso:</strong> {invitation.processName}</p>
          <p><strong>Tu rol:</strong> {invitation.roleInProcess}</p>
          <p><strong>Organización:</strong> {invitation.tenantName}</p>
          <p><strong>Fecha límite:</strong> {invitation.deadline.toLocaleDateString('es-ES')}</p>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '30px'
        }}>
          <strong>⚠️ Importante:</strong> Esta evaluación es completamente anónima. 
          Tus respuestas serán confidenciales y solo se mostrarán resultados agregados.
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h4 style={{ marginTop: 0, color: '#2c3e50' }}>¿Qué esperar?</h4>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Tiempo estimado: 15-20 minutos</li>
            <li>Preguntas sobre competencias y comportamientos</li>
            <li>Respuestas en escala de 1-5</li>
            <li>Puedes pausar y continuar más tarde</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleStartEvaluation}
            style={{
              padding: '15px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Comenzar Evaluación
          </button>
          
          <p style={{ color: '#666', fontSize: '14px' }}>
            Al hacer clic en "Comenzar Evaluación", aceptas participar en este proceso de evaluación.
          </p>
        </div>

        {/* Feature Flags Debug */}
        {featureFlags.isEnabled('debugLogs') && (
          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Debug Info:</strong><br/>
            Token: {token}<br/>
            Feature Flags: Email={featureFlags.isEnabled('email') ? 'ON' : 'OFF'}, 
            Invites={featureFlags.isEnabled('invites') ? 'ON' : 'OFF'}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;


