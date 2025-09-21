import React from 'react';

export default function DebugOverlay() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? '(undefined)';
  const emu = import.meta.env.VITE_AUTH_EMULATOR_URL ?? '(undefined)';
  return (
    <div style={{position:'fixed',bottom:8,left:8,background:'#000',color:'#fff',padding:'8px 12px',fontSize:12,zIndex:999999,opacity:0.85}}>
      <div>apiKey: {String(apiKey).slice(0,10)}…</div>
      <div>EMU: {String(emu)}</div>
    </div>
  );
}
