/**
 * Paso 5: Personalización Individual
 * Permite personalizar la asignación de tests por usuario individual
 */

import React from 'react';

const IndividualCustomizationStep = ({ 
  data, 
  filteredUsers = [], 
  availableTests = [], 
  onChange 
}) => {
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
        Personalización Individual
      </h3>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#F9FAFB', 
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
          Esta funcionalidad permite personalizar la asignación de tests para usuarios específicos.
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
          Por ahora, las asignaciones se realizan automáticamente según las Job Families en el paso anterior.
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic' }}>
          Total de usuarios: {filteredUsers.length}
        </p>
      </div>
    </div>
  );
};

export default IndividualCustomizationStep;

