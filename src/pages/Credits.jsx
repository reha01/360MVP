// src/pages/Credits.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const Credits = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to={ROUTES.DASHBOARD}
          style={{
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <h1>💳 Compra de Créditos</h1>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7',
        marginBottom: '20px'
      }}>
        <h3>🚧 En Desarrollo</h3>
        <p>El sistema de pagos con Stripe será implementado próximamente.</p>
      </div>

      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #007bff',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '5px 15px',
            borderRadius: '15px',
            fontSize: '12px',
            position: 'absolute',
            top: '-10px',
            left: '20px'
          }}>
            POPULAR
          </div>
          <h3>Paquete Básico</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
            $9.99
          </div>
          <p style={{ color: '#666' }}>3 evaluaciones</p>
          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'not-allowed',
            opacity: 0.6
          }}>
            Próximamente
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <h3>Paquete Pro</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
            $19.99
          </div>
          <p style={{ color: '#666' }}>10 evaluaciones + reportes PDF</p>
          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'not-allowed',
            opacity: 0.6
          }}>
            Próximamente
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <h3>Paquete Enterprise</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
            $49.99
          </div>
          <p style={{ color: '#666' }}>Evaluaciones ilimitadas</p>
          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffc107',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'not-allowed',
            opacity: 0.6
          }}>
            Próximamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Credits;