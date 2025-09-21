import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * UserProfileCard - Componente reutilizable para mostrar información del perfil de usuario
 * con verificación visual del estado del email
 */
const UserProfileCard = ({ showActions = true, compact = false }) => {
  const { profile, loading, needsVerification, refreshProfile } = useUserProfile();
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

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: compact ? '15px' : '20px', 
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {!compact && (
        <h3 style={{ marginTop: 0, color: '#495057' }}>
          ¡Bienvenido{profile.displayName ? `, ${profile.displayName}` : ''}!
        </h3>
      )}
      
        <div style={{ display: 'grid', gap: compact ? '5px' : '10px' }}>
        <p><strong>Email:</strong> {profile.email}</p>
        
        {!compact && <p><strong>UID:</strong> <code style={{ fontSize: '12px', backgroundColor: '#e9ecef', padding: '2px 4px', borderRadius: '3px' }}>{profile.uid}</code></p>}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span><strong>Estado:</strong></span>
          {profile.isVerified ? (
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
              ✅ Email Verificado
            </span>
          ) : (
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
              ❌ Email No Verificado
            </span>
          )}
        </div>

        {/* Información del Plan y Créditos */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '15px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          marginTop: '10px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
              {profile.credits || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>Créditos</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {profile.evaluationsCompleted || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>Evaluaciones</div>
          </div>
          
          {!compact && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: profile.plan === 'premium' ? '#6f42c1' : '#6c757d',
                textTransform: 'uppercase',
                backgroundColor: profile.plan === 'premium' ? '#f8f9ff' : '#f8f9fa',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {profile.plan || 'Free'}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>Plan</div>
            </div>
          )}
        </div>

        {!compact && profile.createdAt && (
          <p><strong>Miembro desde:</strong> {new Date(profile.createdAt).toLocaleDateString('es-ES')}</p>
        )}

        {!compact && profile.lastSignIn && (
          <p><strong>Último acceso:</strong> {new Date(profile.lastSignIn).toLocaleString('es-ES')}</p>
        )}

        {!compact && (
          <div style={{ 
            fontSize: '12px', 
            color: profile.hasFirestoreProfile ? '#28a745' : '#0c5460', 
            backgroundColor: profile.hasFirestoreProfile ? '#d4edda' : '#d1ecf1',
            padding: '6px 10px',
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            {profile.hasFirestoreProfile ? (
              <>✅ Perfil sincronizado con Firestore</>
            ) : (
              <>⚙️ Firestore: Usando valores por defecto</>
            )}
            {profile.isRealGoogleAuth && (
              <div style={{ marginTop: '4px', color: '#155724' }}>
                🔐 Autenticado con Google OAuth real
              </div>
            )}
          </div>
        )}
      </div>

      {needsVerification && showActions && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '12px', 
          borderRadius: '6px', 
          marginTop: '15px' 
        }}>
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            ⚠️ <strong>Email no verificado:</strong> En producción, necesitarías verificar tu email para acceso completo.
          </p>
          <button 
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onClick={async () => {
              console.log('[360MVP] UserProfileCard: Iniciando simulación de verificación de email');
              
              const success = await simulateEmailVerification();
              
              if (success) {
                // Refrescar el perfil para mostrar el cambio
                setTimeout(() => {
                  refreshProfile();
                }, 100);
                
                alert('✅ Email verificado exitosamente!\n🔧 Modo Emulador: En producción se enviaría un email real.');
              } else {
                alert('❌ Error simulando verificación.\n🔧 Inténtalo nuevamente.');
              }
            }}
          >
            Simular Verificación (Emulador)
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;
