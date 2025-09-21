// src/components/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div>
      <p>Progreso: {progress}%</p>
      <div style={{ border: '1px solid #ccc', width: '100%' }}>
        <div style={{ width: `${progress}%`, height: '20px', backgroundColor: 'blue' }} />
      </div>
    </div>
  );
};

export default ProgressBar;
