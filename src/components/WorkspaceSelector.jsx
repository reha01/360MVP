// src/components/WorkspaceSelector.jsx
// Full-page workspace selection when user has no active workspace

import React, { useState, useRef } from 'react';
import { useOrg } from '../context/OrgContext';
import './WorkspaceSelector.css';

const WorkspaceSelector = () => {
  const { 
    memberships, 
    setActiveOrg, 
    loading,
    error 
  } = useOrg();
  
  const [selecting, setSelecting] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const autoSelectedRef = useRef(false);

  // Auto-select if only one active membership exists - single shot
  React.useEffect(() => {
    if (!loading && memberships && !selecting && !autoSelectedRef.current) {
      const activeMemberships = memberships.filter(m => m.status === 'active');
      
      console.info('[WS] decided', { count: activeMemberships.length });
      
      // Auto-select if only one organization
      if (activeMemberships.length === 1) {
        autoSelectedRef.current = true;
        console.info('[WS] auto-selecting single', { orgId: activeMemberships[0].orgId });
        handleWorkspaceSelect(activeMemberships[0].orgId);
      }
    }
  }, [loading, memberships, selecting]);

  const handleWorkspaceSelect = async (orgId) => {
    setSelecting(true);
    setSelectedOrgId(orgId);

    try {
      const success = await setActiveOrg(orgId, 'manual');
      if (!success) {
        setSelecting(false);
        setSelectedOrgId(null);
      }
      // If successful, the context will update and this component will unmount
    } catch (error) {
      console.error('[WorkspaceSelector] Error selecting workspace:', error);
      setSelecting(false);
      setSelectedOrgId(null);
    }
  };

  const getOrgDisplayInfo = (membership) => {
    const org = membership.organization;
    return {
      id: membership.orgId,
      name: org?.name || 'Unknown Workspace',
      type: org?.type || 'unknown',
      role: membership.role,
      isPersonal: org?.type === 'personal',
      avatar: org?.avatar || null,
      initials: getInitials(org?.name || 'Unknown'),
      description: org?.type === 'personal' 
        ? 'Your personal evaluation space'
        : `${membership.role} in ${org?.name || 'organization'}`,
      slug: createOrgSlug(org?.name || 'unknown', org?.type)
    };
  };

  const createOrgSlug = (name, type) => {
    if (type === 'personal') {
      return 'personal';
    }
    
    // Convert name to slug format
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="workspace-selector-container">
        <div className="workspace-selector-content">
          <div className="workspace-selector-header">
            <div className="loading-spinner" />
            <h1>Loading your workspaces...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-selector-container">
        <div className="workspace-selector-content">
          <div className="workspace-selector-header">
            <h1>Workspace Error</h1>
            <p>Unable to load your workspaces: {error}</p>
          </div>
          <button 
            className="retry-button"
            onClick={() => { window.location.reload(); }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!memberships?.length) {
    return (
      <div className="workspace-selector-container">
        <div className="workspace-selector-content">
          <div className="workspace-selector-header">
            <h1>No Workspaces Available</h1>
            <p>You don't have access to any workspaces yet.</p>
          </div>
          <div className="workspace-selector-actions">
            <button 
              className="create-workspace-button"
              onClick={() => {
                // This would trigger workspace creation flow
                console.log('Create workspace flow would start here');
              }}
            >
              Create Personal Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeMemberships = memberships.filter(m => m.status === 'active');
  const pendingMemberships = memberships.filter(m => m.status === 'invited');

  return (
    <div className="workspace-selector-container">
      <div className="workspace-selector-content">
        <div className="workspace-selector-header">
          <h1>Select a Workspace</h1>
          <p>Choose which workspace you'd like to use for your 360° evaluations.</p>
        </div>

        {activeMemberships.length > 0 && (
          <div className="workspace-options" data-testid="workspace-options">
            <h2>Your Workspaces</h2>
            <div className="workspace-grid" data-testid="workspace-grid">
              {activeMemberships
                .sort((a, b) => {
                  // Personal first, then alphabetical
                  if (a.organization?.type === 'personal' && b.organization?.type !== 'personal') return -1;
                  if (b.organization?.type === 'personal' && a.organization?.type !== 'personal') return 1;
                  return (a.organization?.name || '').localeCompare(b.organization?.name || '');
                })
                .map((membership) => {
                  const info = getOrgDisplayInfo(membership);
                  const isSelecting = selecting && selectedOrgId === membership.orgId;

                  return (
                    <button
                      key={membership.orgId}
                      className={`workspace-card ${info.isPersonal ? 'personal' : 'corporate'} ${isSelecting ? 'selecting' : ''}`}
                      onClick={() => handleWorkspaceSelect(membership.orgId)}
                      disabled={selecting}
                      data-testid={`ws-select-${info.slug}`}
                    >
                      <div className="workspace-card-avatar">
                        {info.avatar ? (
                          <img src={info.avatar} alt={info.name} />
                        ) : (
                          <span className={`avatar-initials ${info.isPersonal ? 'personal' : 'corporate'}`}>
                            {info.initials}
                          </span>
                        )}
                      </div>
                      
                      <div className="workspace-card-content">
                        <h3>{info.name}</h3>
                        <p>{info.description}</p>
                        
                        <div className="workspace-card-meta">
                          <span className={`workspace-badge ${info.isPersonal ? 'personal' : 'corporate'}`}>
                            {info.isPersonal ? 'Personal' : 'Corporate'}
                          </span>
                          {!info.isPersonal && (
                            <span className="role-badge">{info.role}</span>
                          )}
                        </div>
                      </div>
                      
                      {isSelecting && (
                        <div className="selecting-overlay">
                          <div className="selecting-spinner" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {pendingMemberships.length > 0 && (
          <div className="workspace-options pending">
            <h2>Pending Invitations</h2>
            <div className="workspace-grid">
              {pendingMemberships.map((membership) => {
                const info = getOrgDisplayInfo(membership);

                return (
                  <div key={membership.orgId} className="workspace-card pending">
                    <div className="workspace-card-avatar">
                      <span className="avatar-initials corporate">
                        {info.initials}
                      </span>
                    </div>
                    
                    <div className="workspace-card-content">
                      <h3>{info.name}</h3>
                      <p>You've been invited to join this workspace</p>
                      
                      <div className="workspace-card-actions">
                        <button className="accept-button">Accept</button>
                        <button className="decline-button">Decline</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="workspace-selector-footer">
          <p>
            Need help? <a href="/support">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;

