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

        {/* Navigation Menu */}
        <nav className="header-nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/evaluations" className="nav-link">Evaluaciones</Link>
          <Link to="/reports" className="nav-link">Reportes</Link>
          
          {/* Gestión Dropdown */}
          <div className="nav-dropdown">
            <span className="nav-link">Gestión ▾</span>
            <div className="nav-dropdown-menu">
              <Link to="/gestion/miembros" className="nav-dropdown-link">
                👤 Gestor de Miembros
                <span className="nav-badge">Nuevo</span>
              </Link>
              <Link to="/bulk-actions" className="nav-dropdown-link">📧 Acciones Masivas</Link>
              <Link to="/gestion/politicas" className="nav-dropdown-link">🛡️ Políticas</Link>
              <Link to="/gestion/alertas" className="nav-dropdown-link">🔔 Alertas</Link>
              <Link to="/gestion/campanas" className="nav-dropdown-link">📅 Campañas</Link>
              <Link to="/comparacion-campanas" className="nav-dropdown-link">📈 Comparación</Link>
            </div>
          </div>
          
          {/* Super Admin Dropdown */}
          {(activeMembership?.role === 'owner' || activeMembership?.role === 'admin') && (
            <div className="nav-dropdown">
              <span className="nav-link admin-link">Super Admin ▾</span>
              <div className="nav-dropdown-menu">
                <Link to="/super-admin" className="nav-dropdown-link">🎯 Panel Principal</Link>
                <Link to="/admin/tests" className="nav-dropdown-link">📝 Gestión de Tests</Link>
              </div>
            </div>
          )}
        </nav>

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


