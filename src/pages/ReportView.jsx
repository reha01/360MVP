import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { ROUTES } from '../constants/routes.js';

export default function ReportView() {
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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '20px'
      }}>
        <h1 style={{ margin: 0, color: '#495057' }}>📊 Mis Reportes</h1>
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

      {/* Resumen de Evaluaciones */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '30px'
      }}>
        <h3>Tu Progreso de Evaluaciones</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
              {profile?.evaluationsCompleted || 0}
            </div>
            <div style={{ color: '#6c757d' }}>Evaluaciones Completadas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
              0
            </div>
            <div style={{ color: '#6c757d' }}>Reportes Generados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
              N/A
            </div>
            <div style={{ color: '#6c757d' }}>Último Score</div>
          </div>
        </div>
      </div>

      {/* Lista de Reportes */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#495057' }}>📋 Tus Reportes</h2>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
            onClick={() => navigate(ROUTES.EVALUATION)}
          >
            + Nueva Evaluación
          </button>
        </div>

        {/* Estado vacío */}
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px dashed #dee2e6',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ color: '#6c757d', marginBottom: '10px' }}>No tienes reportes aún</h3>
          <p style={{ marginBottom: '20px' }}>
            Completa tu primera evaluación 360° para generar tu primer reporte
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
            onClick={() => navigate(ROUTES.EVALUATION)}
          >
            Comenzar Primera Evaluación
          </button>
        </div>
      </div>

      {/* Información sobre Reportes */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>📈 Análisis Detallado</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#155724' }}>
            <li>Evaluación por competencias</li>
            <li>Fortalezas y oportunidades</li>
            <li>Comparación con benchmarks</li>
            <li>Plan de desarrollo personalizado</li>
          </ul>
        </div>

        <div style={{ 
          backgroundColor: '#d1ecf1', 
          border: '1px solid #bee5eb',
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>📊 Formatos Disponibles</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5460' }}>
            <li>Reporte ejecutivo (PDF)</li>
            <li>Dashboard interactivo</li>
            <li>Datos exportables (Excel)</li>
            <li>Presentación lista para usar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
