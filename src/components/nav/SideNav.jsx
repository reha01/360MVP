// src/components/nav/SideNav.jsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import Badge from '../ui/Badge';

/**
 * SideNav - Navegación lateral con colapsado para móvil
 */
const SideNav = ({ collapsed, mobileOpen, onToggle, onMobileToggle }) => {
  const { logout } = useAuth();
  const { profile } = useUserProfile();
  const { orgEnabled } = useFeatureFlags();
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar si el usuario es líder
  const isLeader = profile?.role === 'leader' || profile?.permissions?.includes('org_admin') || false;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navegación principal
  const mainNavItems = [
    {
      id: 'home',
      label: 'Inicio',
      icon: '🏠',
      path: '/dashboard',
      exact: true
    },
    {
      id: 'self-evaluation',
      label: 'Autoevaluación',
      icon: '🎯',
      path: '/evaluation'
    },
    {
      id: 'evaluate-others',
      label: 'Evaluar a otros',
      icon: '👥',
      path: '/evaluations/assigned'
    },
    {
      id: 'reports',
      label: 'Mis informes',
      icon: '📊',
      path: '/reports'
    }
  ];

  // Navegación organizacional (solo para líderes)
  const orgNavItems = isLeader && orgEnabled ? [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      path: '/analytics',
      badge: 'Equipos'
    }
  ] : [];

  // Navegación secundaria
  const secondaryNavItems = [
    {
      id: 'settings',
      label: 'Ajustes',
      icon: '⚙️',
      path: '/settings',
      disabled: true // Placeholder
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item, isSecondary = false }) => (
    <li key={item.id}>
      {item.disabled ? (
        <div
          className={`nav-item nav-item--disabled ${isSecondary ? 'nav-item--secondary' : ''}`}
          title="Próximamente"
        >
          <span className="nav-item__icon">{item.icon}</span>
          <span className="nav-item__label">{item.label}</span>
        </div>
      ) : (
        <NavLink
          to={item.path}
          className={({ isActive: routerIsActive }) => 
            `nav-item ${
              (routerIsActive && !item.exact) || (item.exact && isActive(item.path, true))
                ? 'nav-item--active' 
                : ''
            } ${isSecondary ? 'nav-item--secondary' : ''}`
          }
          onClick={() => {
            if (window.innerWidth <= 768) {
              onMobileToggle();
            }
          }}
        >
          <span className="nav-item__icon">{item.icon}</span>
          <span className="nav-item__label">{item.label}</span>
          {item.badge && (
            <Badge variant="primary" size="xs" className="nav-item__badge">
              {item.badge}
            </Badge>
          )}
        </NavLink>
      )}
    </li>
  );

  return (
    <>
      <aside className={`sidenav ${mobileOpen ? 'sidenav--mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidenav__header">
          <div className="sidenav__logo">
            <div className="logo-icon">360</div>
            <div className="logo-text">MVP</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidenav__nav">
          {/* Main navigation */}
          <div className="nav-section">
            <ul className="nav-list">
              {mainNavItems.map(item => (
                <NavItem key={item.id} item={item} />
              ))}
            </ul>
          </div>

          {/* Organizational navigation */}
          {orgNavItems.length > 0 && (
            <div className="nav-section">
              <div className="nav-section__title">Organización</div>
              <ul className="nav-list">
                {orgNavItems.map(item => (
                  <NavItem key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}

          {/* Secondary navigation */}
          <div className="nav-section nav-section--secondary">
            <ul className="nav-list">
              {secondaryNavItems.map(item => (
                <NavItem key={item.id} item={item} isSecondary />
              ))}
              
              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  className="nav-item nav-item--secondary nav-item--button"
                >
                  <span className="nav-item__icon">🚪</span>
                  <span className="nav-item__label">Cerrar sesión</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <style jsx>{`
        .sidenav {
          width: 280px;
          background-color: white;
          border-right: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 50;
          transition: transform 0.3s ease;
        }

        .sidenav__header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .sidenav__logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0A84FF 0%, #007AFF 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          color: #0B0F14;
        }

        .sidenav__nav {
          flex: 1;
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .nav-section {
          padding: 0 16px;
          margin-bottom: 32px;
        }

        .nav-section--secondary {
          margin-top: auto;
          margin-bottom: 16px;
        }

        .nav-section__title {
          font-size: 12px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          padding: 0 8px;
        }

        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: #64748B;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          min-height: 44px; /* Accessibility target size */
        }

        .nav-item--button {
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }

        .nav-item--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-item:hover:not(.nav-item--disabled) {
          background-color: #F8FAFC;
          color: #0B0F14;
        }

        .nav-item--active {
          background-color: #F0F9FF;
          color: #0A84FF;
          font-weight: 600;
        }

        .nav-item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background-color: #0A84FF;
          border-radius: 0 2px 2px 0;
        }

        .nav-item--secondary {
          font-size: 14px;
          color: #9CA3AF;
        }

        .nav-item__icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }

        .nav-item__label {
          flex: 1;
          line-height: 1.4;
        }

        .nav-item__badge {
          margin-left: auto;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .sidenav {
            transform: translateX(-100%);
          }

          .sidenav--mobile-open {
            transform: translateX(0);
          }
        }

        /* Desktop: adjust main content margin */
        @media (min-width: 769px) {
          :global(.app-shell__main) {
            margin-left: 280px;
          }
        }
      `}</style>
    </>
  );
};

export default SideNav;
