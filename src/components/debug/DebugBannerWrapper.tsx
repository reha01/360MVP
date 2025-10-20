// src/components/debug/DebugBannerWrapper.tsx
// Wrapper component that uses the debug info hook

import React from 'react';
import DebugBanner from './DebugBanner';
import { useDebugInfo } from '../../hooks/useDebugInfo';

const DebugBannerWrapper: React.FC = () => {
  const debugInfo = useDebugInfo();
  
  return <DebugBanner info={debugInfo} />;
};

export default DebugBannerWrapper;









