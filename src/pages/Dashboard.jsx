// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfileCard from '../components/UserProfileCard';
import { ROUTES } from '../constants/routes';
import { isOrgEnabled, isCreditsEnabled, FeatureFlags } from '../services/featureFlags';

const Dashboard = () => {
  const { logout, simulateEmailVerification, user } = useAuth();
  const { profile, loading, needsVerification, hasDisplayName } = useUserProfile();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>🔄 Cargando perfil...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      console.log('[360MVP] Dashboard: Logging out...');
      await logout();
      console.log('[360MVP] Dashboard: Logout successful');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('[360MVP] Dashboard: Logout failed:', error);
    }
  };

  const handleSimulateVerification = async () => {
    try {
      console.log('[360MVP] Dashboard: Simulating email verification...');
      await simulateEmailVerification();
      console.log('[360MVP] Dashboard: Email verification simulated');
    } catch (error) {
      console.error('[360MVP] Dashboard: Email verification simulation failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Dashboard 360MVP</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
      
      <UserProfileCard showActions={true} compact={false} />

      {/* Individual Evaluation Section */}
      <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px', border: '1px solid #b6d7ff', marginTop: '20px' }}>
        <h4>🎯 Evaluación Individual</h4>
        <p style={{ marginBottom: '15px', color: '#004085' }}>
          Realiza tu evaluación personal con plantillas predefinidas
        </p>
        <a 
          href="/evaluation"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🎯 Comenzar Evaluación
        </a>
      </div>

      {/* Organizational Tools - Solo si está habilitado */}
      {isOrgEnabled() && (
        <div style={{ backgroundColor: '#fff8e1', padding: '15px', borderRadius: '8px', border: '1px solid #ffecb3', marginTop: '20px' }}>
          <h4>🏢 Herramientas Organizacionales</h4>
          <p style={{ marginBottom: '15px', color: '#e65100' }}>
            Gestiona evaluaciones 360° para tu equipo u organización
          </p>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <a 
              href="/org/processes"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              📊 Dashboard Organizacional
            </a>
          </div>
        </div>
      )}

      {/* Credits Section - Solo si está habilitado */}
      {isCreditsEnabled() && (
        <div style={{ backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '8px', border: '1px solid #e1bee7', marginTop: '20px' }}>
          <h4>💳 Sistema de Créditos</h4>
          <p style={{ marginBottom: '15px', color: '#4a148c' }}>
            Gestiona tus créditos y compra evaluaciones adicionales
          </p>
          <a 
            href="/credits"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#9c27b0',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            💳 Ver Créditos
          </a>
        </div>
      )}

      {/* Feature Flags Debug - Solo en desarrollo */}
      {FeatureFlags.isDebugEnabled() && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
          <h4>🔧 Feature Flags (Debug)</h4>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>
            <div>🏢 Org Module: {isOrgEnabled() ? '✅ ON' : '❌ OFF'}</div>
            <div>📄 PDF Export: {FeatureFlags.isPdfEnabled() ? '✅ ON' : '❌ OFF'}</div>
            <div>🔗 Invitations: {FeatureFlags.isInvitesEnabled() ? '✅ ON' : '❌ OFF'}</div>
            <div>🎯 Wizard: {FeatureFlags.isWizardEnabled() ? '✅ ON' : '❌ OFF'}</div>
            <div>💳 Credits: {isCreditsEnabled() ? '✅ ON' : '❌ OFF'}</div>
            <div>🔧 Emulators: {FeatureFlags.shouldUseEmulators() ? '✅ ON' : '❌ OFF'}</div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb', marginTop: '20px' }}>
        <h4>✅ Sistema de Autenticación Funcionando</h4>
        <ul>
          <li>Firebase Auth Emulator conectado</li>
          <li>Usuario autenticado correctamente</li>
          <li>Google Sign-In habilitado</li>
          <li>Simulación de verificación de email</li>
          <li>Rutas protegidas funcionando</li>
          <li>Estado de autenticación persistente</li>
          <li>Navegación automática implementada</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <h4>🔄 Flujo de Navegación</h4>
        <p><strong>Ruta actual:</strong> /dashboard</p>
        <p><strong>Estado:</strong> Autenticado y protegido ✅</p>
        <p><strong>Prueba:</strong> Abre una nueva ventana en / para ver la redirección automática</p>
      </div>
    </div>
  );
};

export default Dashboard;