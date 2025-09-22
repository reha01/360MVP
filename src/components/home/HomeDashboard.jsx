// src/components/home/HomeDashboard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import useFeatureFlags from '../../hooks/useFeatureFlags';

// Import subcomponents
import HeaderGreeting from './HeaderGreeting';
import QuickActions from './QuickActions';
import CardSelfAssessment from './CardSelfAssessment';
import CardAssignedEvaluations from './CardAssignedEvaluations';
import CardMyReports from './CardMyReports';
import CardRecentActivity from './CardRecentActivity';
import CardLeaderPanel from './CardLeaderPanel';
import SkeletonCard from './SkeletonCard';

/**
 * HomeDashboard - Componente principal del dashboard unificado post-login
 * Implementa diseño Apple-like con cards, espaciado generoso y tipografía clara
 */
const HomeDashboard = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { orgEnabled, debugEnabled } = useFeatureFlags();

  // Determinar si el usuario es líder (mock logic - TODO: implementar lógica real)
  const isLeader = profile?.role === 'leader' || profile?.permissions?.includes('org_admin') || false;

  // Loading state
  if (profileLoading) {
    return <HomeDashboardSkeleton />;
  }

  const firstName = profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Usuario';

  return (
    <div className="home-dashboard">
      {/* Header Section */}
      <HeaderGreeting firstName={firstName} profile={profile} />

      {/* Quick Actions */}
      <QuickActions profile={profile} />

      {/* Main Content Grid */}
      <div className="home-dashboard__grid">
        {/* Left Column */}
        <div className="home-dashboard__left-column">
          {/* Self Assessment Card */}
          <CardSelfAssessment />

          {/* Assigned Evaluations Card */}
          <CardAssignedEvaluations />
        </div>

        {/* Right Column */}
        <div className="home-dashboard__right-column">
          {/* My Reports Card */}
          <CardMyReports />

          {/* Recent Activity Card */}
          <CardRecentActivity />

          {/* Leader Panel - Only if user is leader and org feature is enabled */}
          {isLeader && orgEnabled && (
            <CardLeaderPanel />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="home-dashboard__footer">
        <div className="home-dashboard__footer-links">
          <a href="/help" className="home-dashboard__footer-link">Centro de ayuda</a>
          <a href="/privacy" className="home-dashboard__footer-link">Política de privacidad</a>
          <button 
            onClick={() => {/* TODO: implement logout */}}
            className="home-dashboard__footer-link home-dashboard__footer-link--button"
          >
            Cerrar sesión
          </button>
        </div>
        
        {/* Environment badge */}
        {debugEnabled && (
          <div className="home-dashboard__env-badge">
            Staging
          </div>
        )}
      </footer>

      <style jsx>{`
        .home-dashboard {
          min-height: 100vh;
          background-color: #F8FAFC;
          padding: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0B0F14;
        }

        .home-dashboard__grid {
          display: grid;
          gap: 32px;
          max-width: 1400px;
          margin: 32px auto 0;
        }

        /* Mobile First */
        .home-dashboard__left-column,
        .home-dashboard__right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Desktop Layout */
        @media (min-width: 768px) {
          .home-dashboard__grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }

        /* Large Desktop */
        @media (min-width: 1200px) {
          .home-dashboard__grid {
            grid-template-columns: 2fr 1.5fr;
          }
        }

        .home-dashboard__footer {
          max-width: 1400px;
          margin: 64px auto 0;
          padding: 32px 0;
          border-top: 1px solid #E6EAF0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .home-dashboard__footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .home-dashboard__footer-link {
          color: #64748B;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .home-dashboard__footer-link--button {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          padding: 0;
        }

        .home-dashboard__footer-link:hover {
          color: #0A84FF;
        }

        .home-dashboard__env-badge {
          background-color: #FFF3CD;
          color: #856404;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #FFEAA7;
        }

        /* Mobile adjustments */
        @media (max-width: 767px) {
          .home-dashboard {
            padding: 16px;
          }
          
          .home-dashboard__grid {
            margin-top: 24px;
            gap: 24px;
          }
          
          .home-dashboard__footer {
            margin-top: 48px;
            padding: 24px 0;
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * HomeDashboardSkeleton - Loading state del dashboard
 */
const HomeDashboardSkeleton = () => {
  return (
    <div className="home-dashboard">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            height: '32px',
            width: '200px',
            backgroundColor: '#E6EAF0',
            borderRadius: '8px',
            marginBottom: '8px'
          }}></div>
          <div style={{
            height: '20px',
            width: '300px',
            backgroundColor: '#E6EAF0',
            borderRadius: '8px'
          }}></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                height: '48px',
                backgroundColor: '#E6EAF0',
                borderRadius: '16px'
              }}
            ></div>
          ))}
        </div>

        {/* Cards Grid Skeleton */}
        <div style={{
          display: 'grid',
          gap: '32px',
          gridTemplateColumns: window.innerWidth >= 768 ? '1fr 1fr' : '1fr'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
