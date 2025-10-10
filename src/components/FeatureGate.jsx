// src/components/FeatureGate.jsx
import React from 'react';
import featureFlags from '../lib/featureFlags';

/**
 * FeatureGate - Componente para controlar acceso a features
 * Permite mostrar/ocultar funcionalidades según flags
 */
const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null, 
  showDisabledMessage = false 
}) => {
  const isEnabled = () => {
    switch (feature) {
      case 'org':
        return featureFlags.isOrgEnabled();
      case 'pdf':
        return featureFlags.isPdfEnabled();
      case 'invites':
        return featureFlags.isInvitesEnabled();
      case 'wizard':
        return featureFlags.isWizardEnabled();
      case 'credits':
        return featureFlags.isCreditsEnabled();
      default:
        console.warn('[360MVP] FeatureGate: Unknown feature:', feature);
        return false;
    }
  };

  const enabled = isEnabled();

  if (enabled) {
    return children;
  }

  if (showDisabledMessage) {
    return (
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '15px',
        textAlign: 'center',
        color: '#856404'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚧</div>
        <h4>Funcionalidad No Disponible</h4>
        <p style={{ margin: '10px 0', fontSize: '14px' }}>
          La funcionalidad "{feature}" está deshabilitada en este entorno.
        </p>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6c757d' }}>
          VITE_FEATURE_{feature.toUpperCase()}=false
        </div>
      </div>
    );
  }

  return fallback;
};

export default FeatureGate;
