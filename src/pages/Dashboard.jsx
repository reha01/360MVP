// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfileCard from '../components/UserProfileCard';
import { ROUTES } from '../constants/routes';

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

      {/* Email Verification Section */}
      <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeaa7', marginTop: '20px' }}>
        <h4>📧 Estado de Verificación de Email</h4>
        <p><strong>Estado actual:</strong> {user?.emailVerified ? '✅ Verificado' : '❌ No verificado'}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        {!user?.emailVerified && (
          <button 
            onClick={handleSimulateVerification}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            🔧 Simular Verificación (Emulador)
          </button>
        )}
      </div>

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