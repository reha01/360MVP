// src/pages/home/Home.jsx
import React from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import useFeatureFlags from '../../hooks/useFeatureFlags';

// Import sections
import HeroMetrics from './sections/HeroMetrics';
import SelfAssessmentSection from './sections/SelfAssessmentSection';
import AssignedEvaluationsSection from './sections/AssignedEvaluationsSection';
import ReportsSection from './sections/ReportsSection';
import RecentActivitySection from './sections/RecentActivitySection';
import LeaderAnalyticsSection from './sections/LeaderAnalyticsSection';
import { SkeletonCard } from '../../components/ui';

/**
 * Home - Página de inicio del dashboard con layout de secciones limpias
 */
const Home = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { orgEnabled } = useFeatureFlags();

  // Determinar si el usuario es líder
  const isLeader = profile?.role === 'leader' || profile?.permissions?.includes('org_admin') || false;

  if (profileLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="home-page">
      <div className="home-page__container">
        {/* Hero metrics */}
        <HeroMetrics profile={profile} />

        {/* Main content grid */}
        <div className="home-page__grid">
          {/* Left column */}
          <div className="home-page__main-column">
            {/* Self Assessment */}
            <SelfAssessmentSection profile={profile} />
            
            {/* Assigned Evaluations */}
            <AssignedEvaluationsSection />
          </div>

          {/* Right column */}
          <div className="home-page__sidebar-column">
            {/* My Reports */}
            <ReportsSection />
            
            {/* Recent Activity */}
            <RecentActivitySection />
            
            {/* Leader Analytics - Only if leader and org enabled */}
            {isLeader && orgEnabled && (
              <LeaderAnalyticsSection />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          min-height: 100%;
          color: #0B0F14;
        }

        .home-page__container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .home-page__grid {
          display: grid;
          gap: 32px;
          margin-top: 32px;
        }

        .home-page__main-column,
        .home-page__sidebar-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Mobile first - single column */
        @media (max-width: 768px) {
          .home-page__grid {
            grid-template-columns: 1fr;
            gap: 24px;
            margin-top: 24px;
          }
          
          .home-page__main-column,
          .home-page__sidebar-column {
            gap: 24px;
          }
        }

        /* Tablet and desktop - two columns */
        @media (min-width: 769px) {
          .home-page__grid {
            grid-template-columns: 2fr 1fr;
            align-items: start;
          }
        }

        /* Large desktop - optimized proportions */
        @media (min-width: 1200px) {
          .home-page__grid {
            grid-template-columns: 2fr 1.2fr;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * HomeSkeleton - Loading state para la página Home
 */
const HomeSkeleton = () => {
  return (
    <div className="home-page">
      <div className="home-page__container">
        {/* Hero skeleton */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} hasHeader={false} hasFooter={false} />
          ))}
        </div>

        {/* Main content skeleton */}
        <div style={{
          display: 'grid',
          gap: '32px',
          gridTemplateColumns: window.innerWidth >= 769 ? '2fr 1fr' : '1fr'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
