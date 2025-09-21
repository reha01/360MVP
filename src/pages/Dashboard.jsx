import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUserProfile } from '../hooks/useUserProfile.js';
import UserProfileCard from '../components/UserProfileCard.jsx';
import NavigationCard from '../components/NavigationCard.jsx';
import { ROUTES } from '../constants/routes.js';

export default function Dashboard() {
  const { logout } = useAuth();
  const { profile, loading, needsVerification } = useUserProfile();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>🔄 Cargando dashboard...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      console.log('[360MVP] Dashboard: Cerrando sesión...');
      await logout();
      console.log('[360MVP] Dashboard: Sesión cerrada exitosamente');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('[360MVP] Dashboard: Error al cerrar sesión:', error);
    }
  };

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
        <h1 style={{ margin: 0, color: '#495057' }}>Dashboard 360MVP</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          Cerrar Sesión
        </button>
      </div>
      
      {/* Perfil del Usuario */}
      <div style={{ marginBottom: '30px' }}>
        <UserProfileCard showActions={true} compact={false} />
      </div>

      {/* Navegación Principal */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#495057' }}>🎯 Funcionalidades Principales</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          <NavigationCard
            title="Evaluación 360°"
            description="Realiza tu evaluación integral de liderazgo y obtén insights personalizados."
            icon="🎯"
            route={ROUTES.EVALUATION}
            color="#28a745"
            badge="Core"
          />
          
          <NavigationCard
            title="Mis Reportes"
            description="Visualiza tus resultados, tendencias y análisis detallados de evaluaciones."
            icon="📊"
            route={ROUTES.REPORT}
            color="#007bff"
          />
          
          <NavigationCard
            title="Gestión de Créditos"
            description="Administra tu saldo, compra créditos y revisa el historial de transacciones."
            icon="💳"
            route={ROUTES.CREDITS}
            color="#ffc107"
          />
          
          <NavigationCard
            title="Mi Perfil"
            description="Configura tus datos personales, preferencias y ajustes de cuenta."
            icon="👤"
            route="/profile"
            color="#6f42c1"
            disabled={true}
          />
        </div>
      </div>

      {/* Estado del Sistema */}
      <div style={{ 
        backgroundColor: '#d4edda', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #c3e6cb',
        marginBottom: '20px'
      }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#155724'
        }}>
          ✅ Sistema de Autenticación con Google OAuth Real
        </h4>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px', 
          color: '#155724'
        }}>
          <li>🔐 Google OAuth real conectado y funcionando</li>
          <li>🔥 Firebase Auth en modo producción</li>
          <li>👤 Usuario: {profile?.email} (Google: {profile?.isRealGoogleAuth ? '✅' : '❌'})</li>
          <li>🛡️ Rutas protegidas activas</li>
          <li>💾 {profile?.hasFirestoreProfile ? 'Firestore sincronizado' : 'Firestore pendiente'}</li>
          <li>🧭 Navegación completa entre módulos</li>
        </ul>
      </div>

      {/* Información del Usuario */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>👤 Información del Usuario Actual</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          <p style={{ margin: 0 }}><strong>Usuario:</strong> {profile?.displayName || 'Usuario'}</p>
          <p style={{ margin: 0 }}><strong>Email:</strong> {profile?.email}</p>
          <p style={{ margin: 0 }}><strong>Email verificado:</strong> {profile?.isVerified ? '✅ Sí' : '❌ No'}</p>
          <p style={{ margin: 0 }}><strong>Créditos disponibles:</strong> {profile?.credits || 0}</p>
          {profile?.isRealGoogleAuth && (
            <p style={{ margin: 0, color: '#155724', fontStyle: 'italic' }}>
              <strong>OAuth:</strong> ✅ Autenticado con Google real
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
