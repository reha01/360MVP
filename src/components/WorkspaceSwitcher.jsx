// src/components/WorkspaceSwitcher.jsx
// Workspace switcher component for multi-tenant navigation

import React, { useState, useRef, useEffect } from 'react';
import { useOrg } from '../context/OrgContext';
import './WorkspaceSwitcher.css';

const WorkspaceSwitcher = () => {
  const {
    activeOrg,
    activeOrgId,
    memberships,
    setActiveOrg,
    loading,
    canSwitchWorkspace,
    isPersonalWorkspace
  } = useOrg();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle workspace switch
  const handleWorkspaceSwitch = async (orgId) => {
    if (orgId === activeOrgId || switching) return;

    setSwitching(true);
    setIsOpen(false);

    try {
      const success = await setActiveOrg(orgId, 'manual');
      if (success) {
        // Give UI time to update
        setTimeout(() => setSwitching(false), 500);
      } else {
        setSwitching(false);
      }
    } catch (error) {
      console.error('[WorkspaceSwitcher] Error switching workspace:', error);
      setSwitching(false);
    }
  };

  // Get organization display info
  const getOrgDisplayInfo = (membership) => {
    const org = membership.organization;
    const orgMeta = membership.orgMeta;
    
    // Use real organization name from metadata, fallback to embedded data
    const displayName = orgMeta?.displayName || org?.displayName || org?.name || 'Unknown Workspace';
    const orgType = orgMeta?.type || org?.type || 'unknown';
    const avatarColor = orgMeta?.avatarColor || org?.avatarColor;
    
    // Show fallback badge if no real name
    const hasRealName = orgMeta?.displayName || org?.displayName;
    const nameToShow = hasRealName ? displayName : `${membership.orgId.slice(0, 8)}... (sin nombre)`;
    
    return {
      id: membership.orgId,
      name: nameToShow,
      displayName: displayName,
      type: orgType,
      role: membership.role,
      isPersonal: orgType === 'personal',
      avatar: org?.avatar || null,
      avatarColor: avatarColor,
      initials: getInitials(displayName),
      hasRealName: !!hasRealName
    };
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render if loading or no memberships
  if (loading || !memberships?.length) {
    return (
      <div className="workspace-switcher loading">
        <div className="workspace-switcher-trigger">
          <div className="workspace-avatar skeleton" />
          <span className="workspace-name skeleton">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if user only has personal workspace and we want to hide it
  if (!canSwitchWorkspace && isPersonalWorkspace) {
    return null; // Or return a minimal version
  }

  const activeOrgInfo = memberships.find(m => m.orgId === activeOrgId);
  const displayInfo = activeOrgInfo ? getOrgDisplayInfo(activeOrgInfo) : null;

  return (
    <div className="workspace-switcher" ref={dropdownRef}>
      <button
        className={`workspace-switcher-trigger ${isOpen ? 'open' : ''} ${switching ? 'switching' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        aria-label="Switch workspace"
        aria-expanded={isOpen}
      >
        <div className="workspace-avatar">
          {displayInfo?.avatar ? (
            <img src={displayInfo.avatar} alt={displayInfo.name} />
          ) : (
            <span className={`avatar-initials ${displayInfo?.isPersonal ? 'personal' : 'corporate'}`}>
              {displayInfo?.initials || '?'}
            </span>
          )}
        </div>
        
        <div className="workspace-info">
          <span className="workspace-name">
            {switching ? 'Switching...' : displayInfo?.name || 'Select Workspace'}
          </span>
          {displayInfo && (
            <span className="workspace-type">
              {displayInfo.isPersonal ? 'Personal' : displayInfo.role}
            </span>
          )}
        </div>
        
        <svg 
          className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-dropdown-header">
            <span>Switch Workspace</span>
          </div>
          
          <div className="workspace-list">
            {memberships
              .filter(m => m.status === 'active')
              .sort((a, b) => {
                // Sort: Personal first, then by name
                if (a.organization?.type === 'personal' && b.organization?.type !== 'personal') return -1;
                if (b.organization?.type === 'personal' && a.organization?.type !== 'personal') return 1;
                return (a.organization?.name || '').localeCompare(b.organization?.name || '');
              })
              .map((membership) => {
                const info = getOrgDisplayInfo(membership);
                const isActive = membership.orgId === activeOrgId;

                return (
                  <button
                    key={membership.orgId}
                    className={`workspace-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleWorkspaceSwitch(membership.orgId)}
                    disabled={isActive || switching}
                  >
                    <div className="workspace-avatar">
                      {info.avatar ? (
                        <img src={info.avatar} alt={info.name} />
                      ) : (
                        <span className={`avatar-initials ${info.isPersonal ? 'personal' : 'corporate'}`}>
                          {info.initials}
                        </span>
                      )}
                    </div>
                    
                    <div className="workspace-details">
                      <span className="workspace-name">{info.name}</span>
                      <span className="workspace-meta">
                        {info.isPersonal ? 'Personal Space' : `${info.role} • Corporate`}
                      </span>
                    </div>
                    
                    {isActive && (
                      <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16">
                        <path 
                          d="M13.5 4.5L6 12l-3.5-3.5" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
          </div>
          
          {memberships.some(m => m.status === 'invited') && (
            <>
              <div className="workspace-divider" />
              <div className="workspace-section">
                <div className="section-header">Pending Invitations</div>
                {memberships
                  .filter(m => m.status === 'invited')
                  .map((membership) => {
                    const info = getOrgDisplayInfo(membership);
                    
                    return (
                      <div key={membership.orgId} className="workspace-item pending">
                        <div className="workspace-avatar">
                          <span className="avatar-initials corporate">
                            {info.initials}
                          </span>
                        </div>
                        
                        <div className="workspace-details">
                          <span className="workspace-name">{info.name}</span>
                          <span className="workspace-meta">Invitation pending</span>
                        </div>
                        
                        <button className="accept-invite-btn">
                          Accept
                        </button>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
      
      {switching && (
        <div className="workspace-switching-overlay">
          <div className="switching-spinner" />
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;


