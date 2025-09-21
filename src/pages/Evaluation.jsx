import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { ROUTES } from '../constants/routes.js';

export default function Evaluation() {
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>🔄 Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '20px'
      }}>
        <h1 style={{ margin: 0, color: '#495057' }}>🎯 Evaluación 360°</h1>
        <button 
          onClick={() => navigate(ROUTES.DASHBOARD)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          ← Volver al Dashboard
        </button>
      </div>

      {/* Estado del Usuario */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <h3>Tu Estado Actual</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {profile?.credits || 0}
            </div>
            <div style={{ color: '#6c757d' }}>Créditos Disponibles</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {profile?.evaluationsCompleted || 0}
            </div>
            <div style={{ color: '#6c757d' }}>Evaluaciones Completadas</div>
          </div>
        </div>
      </div>

      {/* Acciones Principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #28a745',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
          <h3 style={{ color: '#28a745', marginBottom: '10px' }}>Nueva Evaluación</h3>
          <p style={{ color: '#6c757d', marginBottom: '15px' }}>
            Inicia una nueva evaluación 360° completa
          </p>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: profile?.credits > 0 ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: profile?.credits > 0 ? 1 : 0.6
            }}
            disabled={!profile?.credits || profile?.credits <= 0}
            onClick={() => {
              if (profile?.credits > 0) {
                alert('🚧 Funcionalidad en desarrollo. Próximamente disponible.');
              }
            }}
          >
            {profile?.credits > 0 ? 'Comenzar Evaluación' : 'Sin Créditos'}
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #007bff',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Evaluaciones Previas</h3>
          <p style={{ color: '#6c757d', marginBottom: '15px' }}>
            Revisa y continúa evaluaciones anteriores
          </p>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onClick={() => {
              alert('🚧 Funcionalidad en desarrollo. Próximamente disponible.');
            }}
          >
            Ver Evaluaciones
          </button>
        </div>
      </div>

      {/* Información */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        padding: '20px', 
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 Sobre las Evaluaciones 360°</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Cada evaluación consume 1 crédito</li>
          <li>Obtienes insights detallados sobre tu liderazgo</li>
          <li>Puedes descargar reportes completos</li>
          <li>Los resultados se guardan permanentemente</li>
        </ul>
      </div>
    </div>
  );
}
