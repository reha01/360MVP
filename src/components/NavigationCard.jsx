import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NavigationCard - Componente reutilizable para navegación en Dashboard
 */
const NavigationCard = ({ 
  title, 
  description, 
  icon, 
  route, 
  disabled = false,
  badge = null,
  color = '#007bff'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!disabled) {
      navigate(route);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: disabled ? '#f8f9fa' : '#ffffff',
        border: disabled ? '2px dashed #dee2e6' : '2px solid #e9ecef',
        borderRadius: '12px',
        padding: '24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.borderColor = color;
          e.target.style.boxShadow = `0 4px 12px ${color}20`;
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.borderColor = '#e9ecef';
          e.target.style.boxShadow = 'none';
          e.target.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Badge */}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: color,
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '600'
          }}
        >
          {badge}
        </div>
      )}

      {/* Icon */}
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>
        {icon}
      </div>

      {/* Content */}
      <div>
        <h3 
          style={{ 
            margin: '0 0 8px 0', 
            color: disabled ? '#6c757d' : '#495057',
            fontSize: '18px',
            fontWeight: '600'
          }}
        >
          {title}
        </h3>
        <p 
          style={{ 
            margin: 0, 
            color: disabled ? '#6c757d' : '#6c757d',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          {description}
        </p>
      </div>

      {/* Status indicator */}
      {disabled && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            color: '#6c757d',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Próximamente
        </div>
      )}
    </div>
  );
};

export default NavigationCard;
