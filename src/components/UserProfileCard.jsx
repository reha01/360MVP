import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

/**
 * UserProfileCard - Componente reutilizable para mostrar información del perfil de usuario
 */
const UserProfileCard = ({ showActions = true, compact = false }) => {
  const { profile, loading, needsVerification } = useUserProfile();
  const { simulateEmailVerification } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        padding: compact ? '10px' : '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p>🔄 Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ 
        padding: compact ? '10px' : '20px',
        backgroundColor: '#f8d7da',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p>❌ No se pudo cargar el perfil</p>
      </div>
    );
  }

  const handleSimulateVerification = async () => {
    try {
      console.log('[360MVP] UserProfileCard: Simulating email verification...');
      await simulateEmailVerification();
    } catch (error) {
      console.error('[360MVP] UserProfileCard: Verification simulation failed:', error);
      alert('Error al simular verificación');
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: compact ? '15px' : '20px', 
      borderRadius: '8px' 
    }}>
      {!compact && (
        <h3>¡Bienvenido{profile.displayName ? `, ${profile.displayName}` : ''}!</h3>
      )}
      
      <div style={{ display: 'grid', gap: compact ? '5px' : '10px' }}>
        <p><strong>Email:</strong> {profile.email}</p>
        
        {!compact && <p><strong>UID:</strong> {profile.uid}</p>}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span><strong>Estado:</strong></span>
          {profile.isVerified ? (
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
              ✅ Verificado
            </span>
          ) : (
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
              ❌ No verificado
            </span>
          )}
        </div>

        {!compact && profile.createdAt && (
          <p><strong>Miembro desde:</strong> {new Date(profile.createdAt).toLocaleDateString('es-ES')}</p>
        )}
      </div>

      {needsVerification && showActions && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '10px', 
          borderRadius: '4px', 
          marginTop: '10px' 
        }}>
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            ⚠️ <strong>Email no verificado:</strong> En producción, verifica tu email para acceso completo.
          </p>
          <button 
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={handleSimulateVerification}
          >
            🔧 Simular verificación (Emulador)
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;