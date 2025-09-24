// src/utils/debug.ts
// Safe debug utilities that work in both development and production

export const isDebug = () =>
  (import.meta as any).env?.DEV === true ||
  localStorage.getItem('DEBUG') === '1';

export const dlog = (...args: any[]) => { 
  if (isDebug()) console.info(...args); 
};

export const dwarn = (...args: any[]) => { 
  if (isDebug()) console.warn(...args); 
};

export const dtrace = (...args: any[]) => { 
  if (isDebug()) console.trace(...args); 
};

export const derror = (...args: any[]) => { 
  if (isDebug()) console.error(...args); 
};

// Debug helper for OrgContext
export const debugOrgContext = {
  isEnabled: isDebug,
  log: dlog,
  warn: dwarn,
  trace: dtrace,
  error: derror
};
