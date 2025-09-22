// src/components/nav/TopBar.jsx
import React, { useState } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * TopBar - Header superior con saludo, búsqueda y badges
 */
const TopBar = ({ onMobileMenuToggle }) => {
  const { profile } = useUserProfile();
  const { debugEnabled } = useFeatureFlags();
  const [searchValue, setSearchValue] = useState('');

  const firstName = profile?.displayName?.split(' ')[0] || 'Usuario';

  return (
    <header className="topbar">
      <div className="topbar__content">
        {/* Left side - Mobile menu + Greeting */}
        <div className="topbar__left">
          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={onMobileMenuToggle}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Greeting */}
          <div className="topbar__greeting">
            <h1 className="greeting-text">
              Hola, {firstName}
            </h1>
          </div>
        </div>

        {/* Center - Search (optional) */}
        <div className="topbar__center">
          <div className="search-container">
            <div className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="search-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {/* Right side - Actions + Badges */}
        <div className="topbar__right">
          {/* Help button */}
          <Button
            variant="ghost"
            size="sm"
            icon="❓"
            className="help-btn"
            title="Centro de ayuda"
          />

          {/* Environment badges */}
          {debugEnabled && (
            <Badge variant="warning" size="sm" className="env-badge">
              Staging
            </Badge>
          )}

          {/* Profile indicator */}
          <div className="profile-indicator">
            <div className="profile-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          background-color: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .topbar__content {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 24px;
        }

        .topbar__left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          min-width: 40px;
          min-height: 40px;
        }

        .mobile-menu-btn:hover {
          background-color: #F1F5F9;
          color: #0B0F14;
        }

        .topbar__greeting {
          display: flex;
          align-items: center;
        }

        .greeting-text {
          font-size: 28px;
          font-weight: 600;
          color: #0B0F14;
          margin: 0;
          line-height: 1.2;
        }

        .topbar__center {
          flex: 1;
          max-width: 400px;
          margin: 0 auto;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9CA3AF;
          pointer-events: none;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-size: 14px;
          background-color: #F8FAFC;
          transition: all 0.2s ease;
          outline: none;
        }

        .search-input:focus {
          background-color: white;
          border-color: #0A84FF;
          box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
        }

        .search-input::placeholder {
          color: #9CA3AF;
        }

        .topbar__right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .help-btn {
          opacity: 0.7;
        }

        .env-badge {
          flex-shrink: 0;
        }

        .profile-indicator {
          display: flex;
          align-items: center;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #0A84FF 0%, #007AFF 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.05);
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .topbar {
            padding: 0 16px;
            height: 64px;
          }

          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .greeting-text {
            font-size: 24px;
          }

          .topbar__center {
            display: none; /* Hide search on mobile */
          }

          .topbar__content {
            gap: 12px;
          }

          .topbar__right {
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .topbar {
            padding: 0 12px;
          }

          .greeting-text {
            font-size: 20px;
          }

          .help-btn {
            display: none; /* Hide help button on very small screens */
          }
        }
      `}</style>
    </header>
  );
};

export default TopBar;
