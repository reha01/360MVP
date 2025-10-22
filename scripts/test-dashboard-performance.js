/**
 * Script de test de performance para Dashboard 360°
 * Mide el tiempo de carga p95 del dashboard
 */

const STAGING_URL = 'https://mvp-staging-3e1cd.web.app/dashboard-360';
const NUM_TESTS = 20;

async function measureLoadTime(url) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const loadTime = Date.now() - startTime;
    return loadTime;
  } catch (error) {
    console.error('Error loading page:', error);
    return null;
  }
}

async function runPerformanceTests() {
  console.log('🚀 Iniciando tests de performance del Dashboard 360°');
  console.log(`📍 URL: ${STAGING_URL}`);
  console.log(`🔄 Número de tests: ${NUM_TESTS}`);
  console.log('');
  
  const loadTimes = [];
  
  for (let i = 1; i <= NUM_TESTS; i++) {
    process.stdout.write(`Test ${i}/${NUM_TESTS}: `);
    const loadTime = await measureLoadTime(STAGING_URL);
    
    if (loadTime !== null) {
      loadTimes.push(loadTime);
      console.log(`✅ ${loadTime}ms`);
    } else {
      console.log('❌ Failed');
    }
    
    // Esperar un poco entre tests para no saturar
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calcular métricas
  if (loadTimes.length > 0) {
    loadTimes.sort((a, b) => a - b);
    
    const min = loadTimes[0];
    const max = loadTimes[loadTimes.length - 1];
    const avg = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
    const median = loadTimes[Math.floor(loadTimes.length / 2)];
    const p95Index = Math.floor(loadTimes.length * 0.95);
    const p95 = loadTimes[p95Index] || max;
    const p99Index = Math.floor(loadTimes.length * 0.99);
    const p99 = loadTimes[p99Index] || max;
    
    console.log('');
    console.log('📊 RESULTADOS DE PERFORMANCE');
    console.log('================================');
    console.log(`✅ Tests exitosos: ${loadTimes.length}/${NUM_TESTS}`);
    console.log(`⚡ Tiempo mínimo: ${min}ms`);
    console.log(`📈 Tiempo máximo: ${max}ms`);
    console.log(`📊 Tiempo promedio: ${avg}ms`);
    console.log(`📊 Mediana: ${median}ms`);
    console.log(`🎯 P95: ${p95}ms ${p95 < 2000 ? '✅ PASS' : '❌ FAIL (objetivo < 2000ms)'}`);
    console.log(`🎯 P99: ${p99}ms`);
    console.log('');
    
    // Distribución
    console.log('📊 DISTRIBUCIÓN DE TIEMPOS');
    console.log('================================');
    const buckets = {
      '<500ms': 0,
      '500-1000ms': 0,
      '1000-1500ms': 0,
      '1500-2000ms': 0,
      '>2000ms': 0
    };
    
    loadTimes.forEach(time => {
      if (time < 500) buckets['<500ms']++;
      else if (time < 1000) buckets['500-1000ms']++;
      else if (time < 1500) buckets['1000-1500ms']++;
      else if (time < 2000) buckets['1500-2000ms']++;
      else buckets['>2000ms']++;
    });
    
    Object.entries(buckets).forEach(([range, count]) => {
      const percentage = Math.round((count / loadTimes.length) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`${range.padEnd(15)} ${bar} ${count} (${percentage}%)`);
    });
    
    console.log('');
    console.log('🎯 CRITERIO DE ACEPTACIÓN');
    console.log('================================');
    if (p95 < 2000) {
      console.log('✅ PASS: P95 < 2000ms');
      console.log(`   Dashboard carga en ${p95}ms (p95)`);
    } else {
      console.log('❌ FAIL: P95 >= 2000ms');
      console.log(`   Dashboard tarda ${p95}ms (p95), debe ser < 2000ms`);
    }
  } else {
    console.log('❌ No se pudieron obtener métricas de performance');
  }
}

// Ejecutar tests
runPerformanceTests().catch(console.error);





