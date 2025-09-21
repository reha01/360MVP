// src/pages/Evaluation.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const Evaluation = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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

      <h1>Evaluación 360°</h1>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7',
        marginBottom: '20px'
      }}>
        <h3>🚧 En Desarrollo</h3>
        <p>Esta funcionalidad está siendo desarrollada. Próximamente incluirá:</p>
        <ul>
          <li>Wizard de evaluación interactivo</li>
          <li>Preguntas por categorías de liderazgo</li>
          <li>Guardado automático de progreso</li>
          <li>Sistema de scoring inteligente</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h4>Mockup de Evaluación</h4>
        <p>Pregunta 1 de 50: ¿Cómo calificarías tu capacidad de liderazgo?</p>
        <div style={{ margin: '20px 0' }}>
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              style={{
                margin: '0 10px',
                padding: '10px 15px',
                backgroundColor: num === 3 ? '#007bff' : '#e9ecef',
                color: num === 3 ? 'white' : '#333',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer'
              }}
            >
              {num}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '14px', color: '#666' }}>
          1 = Muy bajo | 5 = Muy alto
        </p>
      </div>
    </div>
  );
};

export default Evaluation;