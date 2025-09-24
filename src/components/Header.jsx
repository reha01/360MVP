// src/components/Header.jsx
// Main application header with workspace switcher

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { activeOrg, canSwitchWorkspace, activeMembership } = useOrg();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show different header based on auth state
  if (!user) {
    return (
      <header className="app-header">
        <div className="header-container">
          {/* Logo */}
          <div className="header-logo">
            <h1>360MVP</h1>
          </div>

          {/* Login Button */}
          <div className="header-auth">
            <Link to="/login" className="login-button">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <h1>360MVP</h1>
        </div>

        {/* Workspace Switcher */}
        <div className="header-workspace">
          <WorkspaceSwitcher />
        </div>

        {/* User Menu */}
        <div className="header-user">
          <div className="user-info">
            <span className="user-name">{user.displayName || user.email}</span>
            {activeOrg && (
              <span className="current-workspace">
                in {activeMembership?.orgMeta?.displayName || activeOrg.displayName || activeOrg.name || 'Unknown Workspace'}
              </span>
            )}
          </div>
          
          <div className="user-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} />
            ) : (
              <span className="avatar-initials">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>

          <button 
            className="sign-out-button"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 3a1 1 0 011-1h4a1 1 0 010 2H5v8h3a1 1 0 010 2H4a1 1 0 01-1-1V3z"/>
              <path d="M13.293 5.293a1 1 0 011.414 1.414L12.414 9H9a1 1 0 010-2h3.414l-2.293-2.293z"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


