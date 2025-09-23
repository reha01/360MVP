// src/components/debug/DebugBanner.tsx
// Debug banner component for development and debugging

import React from 'react';
import { deriveEnv, isPublicHost } from '../../utils/env';
import { FeatureFlags } from '../../lib/featureFlags';

interface DebugInfo {
  env: string;
  publicHost: boolean;
  useEmulators: boolean;
  activeOrgId?: string | null;
  tenant?: string;
}

interface DebugBannerProps {
  info: DebugInfo;
}

const DebugBanner: React.FC<DebugBannerProps> = ({ info }) => {
  // Show banner if DEBUG is enabled in localStorage or not in production
  const shouldShow = 
    localStorage.getItem('DEBUG') === '1' || 
    import.meta.env.MODE !== 'production';

  if (!shouldShow) {
    return null;
  }

  const {
    env,
    publicHost,
    useEmulators,
    activeOrgId,
    tenant
  } = info;

  return (
    <div 
      className="debug-banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fef3c7', // amber-50
        borderTop: '1px solid #f59e0b', // amber-500
        padding: '4px 8px',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        color: '#92400e', // amber-800
        zIndex: 9999,
        boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        lineHeight: '1.2'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600' }}>DEBUG</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>ENV:</span>
          <span 
            style={{ 
              backgroundColor: env === 'prod' ? '#dc2626' : env === 'staging' ? '#d97706' : '#059669',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: '600'
            }}
          >
            {env.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>HOST:</span>
          <span 
            style={{ 
              backgroundColor: publicHost ? '#dc2626' : '#059669',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: '600'
            }}
          >
            {publicHost ? 'PUBLIC' : 'LOCAL'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>EMULATORS:</span>
          <span 
            style={{ 
              backgroundColor: useEmulators ? '#059669' : '#6b7280',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: '600'
            }}
          >
            {useEmulators ? 'ON' : 'OFF'}
          </span>
        </div>

        {activeOrgId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ORG:</span>
            <span 
              style={{ 
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}
            >
              {activeOrgId.slice(0, 8)}...
            </span>
          </div>
        )}

        {tenant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>TENANT:</span>
            <span 
              style={{ 
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}
            >
              {tenant}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>
          {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={() => {
            localStorage.removeItem('DEBUG');
            window.location.reload();
          }}
          style={{
            background: 'none',
            border: '1px solid #d97706',
            color: '#92400e',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer',
            opacity: 0.8
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = '#f59e0b';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#92400e';
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DebugBanner;

