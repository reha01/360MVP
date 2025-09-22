// src/components/ui/Skeleton.jsx
import React from 'react';

/**
 * Skeleton - Componente base de skeleton con animación
 */
const Skeleton = ({ 
  width = '100%',
  height = '20px',
  variant = 'rounded',
  className = '',
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          borderRadius: '4px',
          height: '16px'
        };
      case 'rounded':
        return {
          borderRadius: '8px'
        };
      case 'circular':
        return {
          borderRadius: '50%'
        };
      case 'rectangular':
        return {
          borderRadius: '0'
        };
      default:
        return {
          borderRadius: '8px'
        };
    }
  };

  const baseStyles = {
    width,
    height,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
    ...getVariantStyles()
  };

  return (
    <div
      className={`ui-skeleton ${className}`}
      style={baseStyles}
      {...props}
    >
      <div className="shimmer" />
    </div>
  );
};

/**
 * SkeletonText - Skeleton para texto con múltiples líneas
 */
export const SkeletonText = ({ lines = 3, className = '', ...props }) => (
  <div className={`ui-skeleton-text ${className}`} {...props}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '75%' : '100%'}
        style={{ marginBottom: i === lines - 1 ? 0 : '8px' }}
      />
    ))}
  </div>
);

/**
 * SkeletonCard - Skeleton completo para cards
 */
export const SkeletonCard = ({ 
  hasHeader = true,
  hasContent = true,
  hasFooter = true,
  className = '',
  ...props 
}) => (
  <div
    className={`ui-skeleton-card ${className}`}
    style={{
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #E5E7EB'
    }}
    {...props}
  >
    {hasHeader && (
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton variant="circular" width="40px" height="40px" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="20px" style={{ marginBottom: '6px' }} />
          <Skeleton width="40%" height="14px" />
        </div>
      </div>
    )}
    
    {hasContent && (
      <div style={{ marginBottom: hasFooter ? '20px' : '0' }}>
        <SkeletonText lines={3} />
      </div>
    )}
    
    {hasFooter && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="80px" height="14px" />
        <Skeleton width="100px" height="36px" variant="rounded" />
      </div>
    )}
  </div>
);

/**
 * SkeletonList - Skeleton para listas
 */
export const SkeletonList = ({ 
  items = 3, 
  itemHeight = '60px',
  spacing = '12px',
  className = '',
  ...props 
}) => (
  <div className={`ui-skeleton-list ${className}`} {...props}>
    {Array.from({ length: items }, (_, i) => (
      <div key={i} style={{ marginBottom: i === items - 1 ? 0 : spacing }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px'
        }}>
          <Skeleton variant="circular" width="32px" height="32px" />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="16px" style={{ marginBottom: '6px' }} />
            <Skeleton width="50%" height="12px" />
          </div>
          <Skeleton width="60px" height="28px" variant="rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
