// src/utils/testingUtils.js
// Utilidades para detectar entornos de testing y deshabilitar funcionalidades problemáticas

/**
 * Detecta si estamos corriendo en un entorno de testing de Playwright
 * @returns {boolean} true si estamos en Playwright
 */
export function isPlaywrightTest() {
  // Método 1: Variable de entorno específica de Playwright
  if (typeof process !== 'undefined' && process.env?.PLAYWRIGHT) {
    return true;
  }
  
  // Método 2: User agent de Playwright
  if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Playwright')) {
    return true;
  }
  
  // Método 3: Parámetro en la URL
  if (typeof window !== 'undefined' && window.location?.search?.includes('disableAnalytics=true')) {
    return true;
  }
  
  // Método 4: Variable global específica que Playwright puede establecer
  if (typeof window !== 'undefined' && window.__PLAYWRIGHT_TEST__) {
    return true;
  }
  
  // Método 5: LocalStorage flag establecido por Playwright
  if (typeof window !== 'undefined' && localStorage?.getItem('__PLAYWRIGHT_TEST__') === 'true') {
    return true;
  }
  
  // Método 6: Detectar si estamos en modo headless (común en tests)
  if (typeof window !== 'undefined' && window.navigator?.webdriver) {
    return true;
  }
  
  return false;
}

/**
 * Detecta si debemos deshabilitar analytics por completo
 * @returns {boolean} true si analytics debe estar deshabilitado
 */
export function shouldDisableAnalytics() {
  // Variable de entorno específica para deshabilitar analytics
  if (import.meta.env.VITE_DISABLE_ANALYTICS === 'true') {
    console.log('[TestingUtils] 🚫 Analytics disabled - VITE_DISABLE_ANALYTICS=true');
    return true;
  }
  
  // ✅ SOLO deshabilitar analytics si estamos en modo test explícito
  // No deshabilitar en Playwright ya que interfiere con Firebase Auth
  const explicitTestMode = localStorage?.getItem('__EXPLICIT_TEST_MODE__') === 'true';
  if (explicitTestMode) {
    console.log('[TestingUtils] 🧪 Analytics disabled - Explicit test mode');
    return true;
  }
  
  return false;
}

/**
 * Wrapper para setInterval que se puede deshabilitar en tests
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {number|null} ID del interval o null si está deshabilitado
 */
export function testSafeSetInterval(callback, delay) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ setInterval skipped - testing environment');
    return null;
  }
  
  return setInterval(callback, delay);
}

/**
 * Wrapper para funciones de suscripción que se pueden deshabilitar en tests
 * @param {Function} subscriptionFn - Función de suscripción (ej. onSnapshot)
 * @param {...any} args - Argumentos para la función
 * @returns {Function|null} Función de unsubscribe o null si está deshabilitado
 */
export function testSafeSubscription(subscriptionFn, ...args) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ Subscription skipped - testing environment');
    // Retornar función de unsubscribe dummy
    return () => {};
  }
  
  return subscriptionFn(...args);
}


/**
 * Detecta si estamos corriendo en un entorno de testing de Playwright
 * @returns {boolean} true si estamos en Playwright
 */
export function isPlaywrightTest() {
  // Método 1: Variable de entorno específica de Playwright
  if (typeof process !== 'undefined' && process.env?.PLAYWRIGHT) {
    return true;
  }
  
  // Método 2: User agent de Playwright
  if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Playwright')) {
    return true;
  }
  
  // Método 3: Parámetro en la URL
  if (typeof window !== 'undefined' && window.location?.search?.includes('disableAnalytics=true')) {
    return true;
  }
  
  // Método 4: Variable global específica que Playwright puede establecer
  if (typeof window !== 'undefined' && window.__PLAYWRIGHT_TEST__) {
    return true;
  }
  
  // Método 5: LocalStorage flag establecido por Playwright
  if (typeof window !== 'undefined' && localStorage?.getItem('__PLAYWRIGHT_TEST__') === 'true') {
    return true;
  }
  
  // Método 6: Detectar si estamos en modo headless (común en tests)
  if (typeof window !== 'undefined' && window.navigator?.webdriver) {
    return true;
  }
  
  return false;
}

/**
 * Detecta si debemos deshabilitar analytics por completo
 * @returns {boolean} true si analytics debe estar deshabilitado
 */
export function shouldDisableAnalytics() {
  // Variable de entorno específica para deshabilitar analytics
  if (import.meta.env.VITE_DISABLE_ANALYTICS === 'true') {
    console.log('[TestingUtils] 🚫 Analytics disabled - VITE_DISABLE_ANALYTICS=true');
    return true;
  }
  
  // ✅ SOLO deshabilitar analytics si estamos en modo test explícito
  // No deshabilitar en Playwright ya que interfiere con Firebase Auth
  const explicitTestMode = localStorage?.getItem('__EXPLICIT_TEST_MODE__') === 'true';
  if (explicitTestMode) {
    console.log('[TestingUtils] 🧪 Analytics disabled - Explicit test mode');
    return true;
  }
  
  return false;
}

/**
 * Wrapper para setInterval que se puede deshabilitar en tests
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {number|null} ID del interval o null si está deshabilitado
 */
export function testSafeSetInterval(callback, delay) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ setInterval skipped - testing environment');
    return null;
  }
  
  return setInterval(callback, delay);
}

/**
 * Wrapper para funciones de suscripción que se pueden deshabilitar en tests
 * @param {Function} subscriptionFn - Función de suscripción (ej. onSnapshot)
 * @param {...any} args - Argumentos para la función
 * @returns {Function|null} Función de unsubscribe o null si está deshabilitado
 */
export function testSafeSubscription(subscriptionFn, ...args) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ Subscription skipped - testing environment');
    // Retornar función de unsubscribe dummy
    return () => {};
  }
  
  return subscriptionFn(...args);
}


/**
 * Detecta si estamos corriendo en un entorno de testing de Playwright
 * @returns {boolean} true si estamos en Playwright
 */
export function isPlaywrightTest() {
  // Método 1: Variable de entorno específica de Playwright
  if (typeof process !== 'undefined' && process.env?.PLAYWRIGHT) {
    return true;
  }
  
  // Método 2: User agent de Playwright
  if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Playwright')) {
    return true;
  }
  
  // Método 3: Parámetro en la URL
  if (typeof window !== 'undefined' && window.location?.search?.includes('disableAnalytics=true')) {
    return true;
  }
  
  // Método 4: Variable global específica que Playwright puede establecer
  if (typeof window !== 'undefined' && window.__PLAYWRIGHT_TEST__) {
    return true;
  }
  
  // Método 5: LocalStorage flag establecido por Playwright
  if (typeof window !== 'undefined' && localStorage?.getItem('__PLAYWRIGHT_TEST__') === 'true') {
    return true;
  }
  
  // Método 6: Detectar si estamos en modo headless (común en tests)
  if (typeof window !== 'undefined' && window.navigator?.webdriver) {
    return true;
  }
  
  return false;
}

/**
 * Detecta si debemos deshabilitar analytics por completo
 * @returns {boolean} true si analytics debe estar deshabilitado
 */
export function shouldDisableAnalytics() {
  // Variable de entorno específica para deshabilitar analytics
  if (import.meta.env.VITE_DISABLE_ANALYTICS === 'true') {
    console.log('[TestingUtils] 🚫 Analytics disabled - VITE_DISABLE_ANALYTICS=true');
    return true;
  }
  
  // ✅ SOLO deshabilitar analytics si estamos en modo test explícito
  // No deshabilitar en Playwright ya que interfiere con Firebase Auth
  const explicitTestMode = localStorage?.getItem('__EXPLICIT_TEST_MODE__') === 'true';
  if (explicitTestMode) {
    console.log('[TestingUtils] 🧪 Analytics disabled - Explicit test mode');
    return true;
  }
  
  return false;
}

/**
 * Wrapper para setInterval que se puede deshabilitar en tests
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {number|null} ID del interval o null si está deshabilitado
 */
export function testSafeSetInterval(callback, delay) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ setInterval skipped - testing environment');
    return null;
  }
  
  return setInterval(callback, delay);
}

/**
 * Wrapper para funciones de suscripción que se pueden deshabilitar en tests
 * @param {Function} subscriptionFn - Función de suscripción (ej. onSnapshot)
 * @param {...any} args - Argumentos para la función
 * @returns {Function|null} Función de unsubscribe o null si está deshabilitado
 */
export function testSafeSubscription(subscriptionFn, ...args) {
  if (shouldDisableAnalytics()) {
    console.log('[TestingUtils] ⏸️ Subscription skipped - testing environment');
    // Retornar función de unsubscribe dummy
    return () => {};
  }
  
  return subscriptionFn(...args);
}
