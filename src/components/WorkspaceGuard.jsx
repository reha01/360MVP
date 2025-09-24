// src/components/WorkspaceGuard.jsx
// Route guard that ensures user has an active workspace

import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import WorkspaceSelector from './WorkspaceSelector';

const WorkspaceGuard = ({ children, fallback = null }) => {
  const { user, loading: authLoading } = useAuth();
  const { 
    activeOrgId, 
    status,
    error: orgError,
    memberships,
    setActiveOrgId
  } = useOrg();
  const location = useLocation();
  
  const [showSelector, setShowSelector] = useState(false);
  const autoSelectedRef = useRef(false);

  useEffect(() => {
    // Don't show selector while loading
    if (authLoading || status === 'loading') {
      setShowSelector(false);
      return;
    }

    // User not logged in - let AuthGuard handle it
    if (!user) {
      setShowSelector(false);
      return;
    }

    // Empty status - only show selector if not already on select-workspace page
    if (status === 'empty') {
      if (location.pathname !== '/select-workspace') {
        setShowSelector(true);
      }
      return;
    }

    // Success status with memberships but no activeOrgId - auto-select once
    if (status === 'success' && !activeOrgId && memberships?.length > 0 && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      const preferred = memberships.find(m => !/personal/i.test(m.orgId))?.orgId || memberships[0].orgId;
      console.info('[WS] auto-selecting', { preferred, count: memberships.length });
      setActiveOrgId(preferred);
      return;
    }

    // No active org and user has memberships - show selector
    if (!activeOrgId && memberships?.length > 0) {
      setShowSelector(true);
      return;
    }

    // Has active org - hide selector
    if (activeOrgId) {
      setShowSelector(false);
    }
  }, [user, activeOrgId, authLoading, status, memberships, location.pathname, setActiveOrgId]);

  // Unauthenticated state - redirect to login
  if (status === 'unauthenticated' || !user) {
    return children; // Let AuthProtectedRoute handle redirect to login
  }

  // Still loading
  if (authLoading || status === 'loading') {
    return fallback || (
      <div className="workspace-guard-loading">
        <div className="loading-spinner" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  // Empty state - no workspaces available
  if (status === 'empty') {
    return (
      <div className="workspace-guard-empty">
        <h3>No tienes organizaciones</h3>
        <p>Parece que aún no tienes acceso a ninguna organización.</p>
        <button onClick={() => window.location.assign('/select-workspace')}>
          Seleccionar Workspace
        </button>
      </div>
    );
  }

  // Error loading memberships
  if (orgError) {
    return (
      <div className="workspace-guard-error">
        <h3>Workspace Error</h3>
        <p>Unable to load your workspaces: {orgError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // No active workspace - show selector
  if (showSelector) {
    return <WorkspaceSelector />;
  }

  // Has active workspace - render children
  if (activeOrgId) {
    return children;
  }

  // Fallback loading state
  return fallback || (
    <div className="workspace-guard-loading">
      <div className="loading-spinner" />
      <p>Preparing workspace...</p>
    </div>
  );
};

export default WorkspaceGuard;


