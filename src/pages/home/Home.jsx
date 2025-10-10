// src/pages/home/Home.jsx
import React from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';

// Import sections
import HeroMetrics from './sections/HeroMetrics';
import SelfAssessmentSection from './sections/SelfAssessmentSection';
import AssignedEvaluationsSection from './sections/AssignedEvaluationsSection';
import ReportsSection from './sections/ReportsSection';
import RecentActivitySection from './sections/RecentActivitySection';
import LeaderAnalyticsSection from './sections/LeaderAnalyticsSection';
import { DashboardSkeleton } from '../../components/ui';

/**
 * Home - Página de inicio del dashboard con layout de secciones limpias
 */
const Home = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { orgEnabled } = useFeatureFlags();
  const { memberships, setActiveOrg } = useOrg();
  const { user } = useAuth();

  // Función para crear una organización de prueba
  const createTestOrg = async () => {
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }

    try {
      const { doc, setDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      const orgId = `org_test_${Date.now()}`;
      const orgRef = doc(db, 'orgs', orgId);
      
      // Crear organización
      await setDoc(orgRef, {
        id: orgId,
        name: 'Organización de Prueba',
        type: 'business',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Crear membresía en la estructura correcta para Firestore rules
      const memberId = `${orgId}:${user.uid}`;
      const memberRef = doc(db, `orgs/${orgId}/members`, memberId);
      await setDoc(memberRef, {
        userId: user.uid,
        email: user.email,
        role: 'owner', // El creador es owner
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Cambiar a la nueva organización
      await setActiveOrg(orgId);
      
      console.log('✅ Organización de prueba creada:', orgId);
      alert('✅ ¡Organización de prueba creada! Ahora puedes usar el switch de workspace.');
    } catch (error) {
      console.error('❌ Error creando organización de prueba:', error);
      alert('❌ Error creando organización: ' + error.message);
    }
  };

  // Determinar si el usuario es líder
  const isLeader = profile?.role === 'leader' || profile?.permissions?.includes('org_admin') || false;

  if (profileLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="home-page">
      <div className="home-page__container fade-in">
        {/* Hero metrics */}
        <div className="fade-in-up">
          <HeroMetrics profile={profile} />
        </div>

        {/* Botón temporal para crear organización de prueba */}
        {import.meta.env.DEV && memberships && memberships.length <= 1 && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 10px 0', color: '#0c4a6e' }}>
              <strong>🧪 Modo Desarrollo:</strong> Crea una organización de prueba para probar el switch de workspace
            </p>
            <button 
              onClick={createTestOrg}
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🏢 Crear Organización de Prueba
            </button>
          </div>
        )}

        {/* Main content grid */}
        <div className="home-page__grid stagger-children">
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


export default Home;
