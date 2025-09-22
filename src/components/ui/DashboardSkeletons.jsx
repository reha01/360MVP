// src/components/ui/DashboardSkeletons.jsx
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Skeleton, SkeletonText } from './Skeleton';

/**
 * HeroMetricsSkeleton - Skeleton para las métricas del hero
 */
export const HeroMetricsSkeleton = () => {
  return (
    <div className="hero-metrics-skeleton fade-in">
      <div className="hero-metrics-skeleton__grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg" className="skeleton-loading">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Skeleton 
                variant="circular" 
                width="48px" 
                height="48px" 
              />
              <div style={{ flex: 1 }}>
                <Skeleton 
                  variant="text" 
                  width="120px" 
                  height="14px" 
                  style={{ marginBottom: '8px' }}
                />
                <Skeleton 
                  variant="text" 
                  width="60px" 
                  height="24px" 
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * SectionSkeleton - Skeleton genérico para secciones
 */
export const SectionSkeleton = ({ 
  title = true, 
  subtitle = true, 
  items = 3,
  className = ''
}) => {
  return (
    <Card className={`section-skeleton ${className}`} padding="lg">
      <CardHeader>
        {title && (
          <Skeleton 
            variant="text" 
            width="180px" 
            height="24px" 
            style={{ marginBottom: subtitle ? '8px' : '0' }}
          />
        )}
        {subtitle && (
          <Skeleton 
            variant="text" 
            width="280px" 
            height="16px" 
          />
        )}
      </CardHeader>
      
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from({ length: items }, (_, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px'
            }}>
              <Skeleton variant="circular" width="40px" height="40px" />
              <div style={{ flex: 1 }}>
                <Skeleton 
                  variant="text" 
                  width="160px" 
                  height="16px" 
                  style={{ marginBottom: '4px' }}
                />
                <Skeleton 
                  variant="text" 
                  width="120px" 
                  height="14px" 
                />
              </div>
              <Skeleton variant="rounded" width="80px" height="32px" />
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Skeleton variant="text" width="100px" height="16px" />
      </CardFooter>
    </Card>
  );
};

/**
 * ReportsSkeleton - Skeleton específico para la sección de reportes
 */
export const ReportsSkeleton = ({ className = '' }) => {
  return (
    <Card className={`reports-skeleton ${className}`} padding="lg">
      <CardHeader>
        <Skeleton 
          variant="text" 
          width="140px" 
          height="24px" 
          style={{ marginBottom: '8px' }}
        />
        <Skeleton 
          variant="text" 
          width="220px" 
          height="16px" 
        />
      </CardHeader>
      
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} style={{ 
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <Skeleton 
                    variant="text" 
                    width="180px" 
                    height="18px" 
                    style={{ marginBottom: '6px' }}
                  />
                  <Skeleton 
                    variant="text" 
                    width="100px" 
                    height="14px" 
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Skeleton variant="rounded" width="24px" height="24px" />
                  <Skeleton variant="rounded" width="24px" height="24px" />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Skeleton variant="rounded" width="60px" height="20px" />
                <Skeleton variant="rounded" width="80px" height="20px" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Skeleton variant="text" width="120px" height="16px" />
      </CardFooter>
    </Card>
  );
};

/**
 * AnalyticsSkeleton - Skeleton para el panel de analytics (leaders)
 */
export const AnalyticsSkeleton = ({ className = '' }) => {
  return (
    <Card className={`analytics-skeleton ${className}`} padding="lg">
      <CardHeader>
        <Skeleton 
          variant="text" 
          width="160px" 
          height="24px" 
          style={{ marginBottom: '8px' }}
        />
        <Skeleton 
          variant="text" 
          width="240px" 
          height="16px" 
        />
      </CardHeader>
      
      <CardContent>
        {/* Progress bars */}
        <div style={{ marginBottom: '24px' }}>
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <Skeleton variant="text" width="120px" height="14px" />
                <Skeleton variant="text" width="40px" height="14px" />
              </div>
              <Skeleton variant="rounded" width="100%" height="8px" />
            </div>
          ))}
        </div>
        
        {/* Stats grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ 
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <Skeleton 
                variant="text" 
                width="60px" 
                height="24px" 
                style={{ margin: '0 auto 4px' }}
              />
              <Skeleton 
                variant="text" 
                width="80px" 
                height="14px" 
                style={{ margin: '0 auto' }}
              />
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Skeleton variant="rounded" width="140px" height="36px" />
      </CardFooter>
    </Card>
  );
};

/**
 * ActivitySkeleton - Skeleton para actividad reciente
 */
export const ActivitySkeleton = ({ className = '' }) => {
  return (
    <Card className={`activity-skeleton ${className}`} padding="lg">
      <CardHeader>
        <Skeleton 
          variant="text" 
          width="160px" 
          height="24px" 
          style={{ marginBottom: '8px' }}
        />
        <Skeleton 
          variant="text" 
          width="200px" 
          height="16px" 
        />
      </CardHeader>
      
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px'
            }}>
              <Skeleton variant="circular" width="32px" height="32px" />
              <div style={{ flex: 1 }}>
                <Skeleton 
                  variant="text" 
                  width="200px" 
                  height="16px" 
                  style={{ marginBottom: '4px' }}
                />
                <Skeleton 
                  variant="text" 
                  width="100px" 
                  height="14px" 
                />
              </div>
              <Skeleton 
                variant="text" 
                width="60px" 
                height="14px" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * DashboardSkeleton - Skeleton completo para el dashboard
 */
export const DashboardSkeleton = () => {
  return (
    <div className="dashboard-skeleton fade-in">
      <div style={{ marginBottom: '32px' }}>
        <HeroMetricsSkeleton />
      </div>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
        }
      }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SectionSkeleton title subtitle items={1} />
          <SectionSkeleton title subtitle items={3} />
        </div>
        
        {/* Sidebar column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ReportsSkeleton />
          <ActivitySkeleton />
        </div>
      </div>
    </div>
  );
};
