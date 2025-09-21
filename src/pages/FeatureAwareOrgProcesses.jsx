// src/pages/FeatureAwareOrgProcesses.jsx
import React from 'react';
import FeatureGate from '../components/FeatureGate';

const FeatureAwareOrgProcesses = () => {
  return (
    <FeatureGate 
      feature="org" 
      showDisabledMessage={true}
    >
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
          <h1>Dashboard Organizacional</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Funcionalidad disponible con feature flag VITE_FEATURE_ORG=true
          </p>
          
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4>🎯 Funcionalidades Organizacionales</h4>
            <p>✅ Crear procesos de evaluación 360°</p>
            <p>✅ Subir participantes vía CSV</p>
            <p>✅ Generar invitaciones por token</p>
            <p>✅ Dashboard de progreso y resultados</p>
            <p>✅ Reportes individuales con anonimato</p>
          </div>

          <a
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#007bff',
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
    </FeatureGate>
  );
};

export default FeatureAwareOrgProcesses;
