import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { ROUTES } from '../constants/routes.js';

export default function Credits() {
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
        <h1 style={{ margin: 0, color: '#495057' }}>💳 Gestión de Créditos</h1>
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

      {/* Balance Actual */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '12px',
        border: '2px solid #007bff',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Tu Balance Actual</h2>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>
          {profile?.credits || 0}
        </div>
        <p style={{ margin: 0, color: '#6c757d' }}>Créditos disponibles para evaluaciones</p>
      </div>

      {/* Paquetes de Créditos */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#495057' }}>🛍️ Paquetes Disponibles</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px'
        }}>
          {/* Paquete Básico */}
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #28a745',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📦</div>
            <h3 style={{ color: '#28a745', marginBottom: '8px' }}>Paquete Básico</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
              3 Créditos
            </div>
            <p style={{ color: '#6c757d', marginBottom: '15px', fontSize: '14px' }}>
              Perfecto para comenzar
            </p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
              $29.99
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => alert('🚧 Sistema de pagos en desarrollo')}
            >
              Comprar Ahora
            </button>
          </div>

          {/* Paquete Estándar */}
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #007bff',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#007bff',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              POPULAR
            </div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎁</div>
            <h3 style={{ color: '#007bff', marginBottom: '8px' }}>Paquete Estándar</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', marginBottom: '8px' }}>
              10 Créditos
            </div>
            <p style={{ color: '#6c757d', marginBottom: '15px', fontSize: '14px' }}>
              El más popular + 2 bonus
            </p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
              $79.99
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => alert('🚧 Sistema de pagos en desarrollo')}
            >
              Comprar Ahora
            </button>
          </div>

          {/* Paquete Premium */}
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #6f42c1',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>💎</div>
            <h3 style={{ color: '#6f42c1', marginBottom: '8px' }}>Paquete Premium</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6f42c1', marginBottom: '8px' }}>
              25 Créditos
            </div>
            <p style={{ color: '#6c757d', marginBottom: '15px', fontSize: '14px' }}>
              Máximo valor + 5 bonus
            </p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
              $179.99
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => alert('🚧 Sistema de pagos en desarrollo')}
            >
              Comprar Ahora
            </button>
          </div>
        </div>
      </div>

      {/* Historial (placeholder) */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>📊 Historial de Transacciones</h3>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6c757d' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
          <p>No tienes transacciones registradas aún</p>
          <p style={{ fontSize: '14px' }}>Tus compras de créditos aparecerán aquí</p>
        </div>
      </div>
    </div>
  );
}
