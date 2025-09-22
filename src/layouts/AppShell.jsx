// src/layouts/AppShell.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from '../components/nav/SideNav';
import TopBar from '../components/nav/TopBar';

/**
 * AppShell - Layout principal con sidebar + header + contenido central
 */
const AppShell = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <SideNav 
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggle={toggleSidebar}
        onMobileToggle={toggleMobileMenu}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="app-shell__main">
        {/* Top bar */}
        <TopBar onMobileMenuToggle={toggleMobileMenu} />
        
        {/* Page content */}
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>

      <style jsx>{`
        .app-shell {
          display: flex;
          height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .app-shell__main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0; /* Prevent flex item from overflowing */
          transition: margin-left 0.3s ease;
        }

        .app-shell__content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          max-width: 100%;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          display: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .app-shell__content {
            padding: 16px;
          }

          .mobile-overlay {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .app-shell__content {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AppShell;
