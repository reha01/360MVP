// src/pages/ReportView.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const ReportView = () => {
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

      <h1>📊 Visualización de Reportes</h1>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ffeaa7',
        marginBottom: '20px'
      }}>
        <h3>🚧 En Desarrollo</h3>
        <p>Esta funcionalidad incluirá:</p>
        <ul>
          <li>Gráficos radar interactivos</li>
          <li>Análisis por dimensiones de liderazgo</li>
          <li>Generación de PDFs profesionales</li>
          <li>Comparación temporal de resultados</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        textAlign: 'center'
      }}>
        <h3>Mockup de Reporte</h3>
        
        {/* Simulación de gráfico radar */}
        <div style={{
          width: '300px',
          height: '300px',
          margin: '20px auto',
          backgroundColor: '#f8f9fa',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '2px solid #007bff'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Gráfico Radar</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Próximamente</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#28a745' }}>Fortalezas</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>✅ Comunicación</li>
              <li>✅ Visión estratégica</li>
              <li>✅ Empatía</li>
            </ul>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#dc3545' }}>Oportunidades</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>🎯 Delegación</li>
              <li>🎯 Toma de decisiones</li>
              <li>🎯 Gestión del cambio</li>
            </ul>
          </div>
        </div>

        <button style={{
          marginTop: '20px',
          padding: '12px 24px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'not-allowed',
          opacity: 0.6
        }}>
          📄 Descargar PDF (Próximamente)
        </button>
      </div>
    </div>
  );
};

export default ReportView;