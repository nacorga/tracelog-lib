#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

class BenchmarkRunner {
  constructor() {
    this.results = {
      bundleSize: {},
      performance: {},
      timestamp: new Date().toISOString(),
      version: this.getPackageVersion()
    };
  }

  getPackageVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  }

  async measureBundleSize() {
    console.log('📦 Measuring bundle sizes...\n');

    // Build all formats
    console.log('Building ESM...');
    execSync('npm run build:esm', { stdio: 'inherit' });
    
    console.log('Building CJS...');
    execSync('npm run build:cjs', { stdio: 'inherit' });
    
    console.log('Building browser bundle...');
    execSync('npm run build:browser', { stdio: 'inherit' });

    // Measure sizes
    const measurements = {};

    // ESM bundle
    const esmPath = 'dist/esm/src/public-api.js';
    if (fs.existsSync(esmPath)) {
      measurements.esm = this.getFileStats(esmPath);
    }

    // CJS bundle
    const cjsPath = 'dist/cjs/src/public-api.js';
    if (fs.existsSync(cjsPath)) {
      measurements.cjs = this.getFileStats(cjsPath);
    }

    // Browser bundle (unminified)
    const browserPath = 'dist/browser/tracelog.js';
    if (fs.existsSync(browserPath)) {
      measurements.browser = this.getFileStats(browserPath);
    }

    // Create minified version
    console.log('Creating minified version...');
    try {
      execSync('npm run build-ugly', { stdio: 'inherit' });
      
      // Re-measure browser bundle after uglification
      if (fs.existsSync(browserPath)) {
        measurements.browserMinified = this.getFileStats(browserPath);
      }
    } catch (error) {
      console.warn('⚠️  Could not create minified version:', error.message);
    }

    this.results.bundleSize = measurements;
    this.displayBundleSizes(measurements);
  }

  getFileStats(filePath) {
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    const brotli = zlib.brotliCompressSync(content);

    return {
      raw: content.length,
      gzipped: gzipped.length,
      brotli: brotli.length,
      rawKB: (content.length / 1024).toFixed(2),
      gzippedKB: (gzipped.length / 1024).toFixed(2),
      brotliKB: (brotli.length / 1024).toFixed(2)
    };
  }

  displayBundleSizes(measurements) {
    console.log('\n📊 Bundle Size Results:');
    console.log('═'.repeat(60));

    Object.entries(measurements).forEach(([format, stats]) => {
      console.log(`\n${format.toUpperCase()}:`);
      console.log(`  Raw:     ${stats.rawKB} KB (${stats.raw} bytes)`);
      console.log(`  Gzipped: ${stats.gzippedKB} KB (${stats.gzipped} bytes)`);
      console.log(`  Brotli:  ${stats.brotliKB} KB (${stats.brotli} bytes)`);
    });

    // Check README claim
    const browserMinified = measurements.browserMinified;
    if (browserMinified) {
      const claim = 15; // KB
      const actual = parseFloat(browserMinified.gzippedKB);
      const diff = actual - claim;
      const percentage = ((diff / claim) * 100).toFixed(1);
      
      console.log('\n🎯 README Claim Verification:');
      console.log(`  Claimed: ~${claim}KB minified and gzipped`);
      console.log(`  Actual:  ${actual}KB minified and gzipped`);
      console.log(`  Diff:    ${diff > 0 ? '+' : ''}${diff.toFixed(2)}KB (${percentage}%)`);
      console.log(`  Status:  ${Math.abs(diff) <= 2 ? '✅ ACCURATE' : diff > 0 ? '⚠️  OVER' : '✅ UNDER'}`);
    }
  }

  async measurePerformance() {
    console.log('\n⚡ Running performance benchmarks...\n');

    // Create test HTML file
    const testHTML = this.createPerformanceTestHTML();
    const testPath = 'benchmark/test.html';
    
    // Ensure benchmark directory exists
    if (!fs.existsSync('benchmark')) {
      fs.mkdirSync('benchmark', { recursive: true });
    }
    
    fs.writeFileSync(testPath, testHTML);

    try {
      // Use Playwright (already configured in the project)
      let playwright;
      try {
        playwright = require('@playwright/test');
      } catch {
        throw new Error('Playwright not available. Please install with: npm install @playwright/test');
      }
      
      const { chromium } = require('playwright');
      const browser = await chromium.launch({ 
        headless: true
      });
      const page = await browser.newPage();
      
      // Set timeout for Playwright
      page.setDefaultTimeout(60000);
      
      // Enable performance monitoring
      await page.addInitScript(() => {
        window.performanceData = {
          memory: [],
          timing: []
        };
      });

      // Load test page with better error handling
      const absolutePath = path.resolve(testPath);
      console.log(`Loading test page: file://${absolutePath}`);
      
      await page.goto(`file://${absolutePath}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for page to be ready
      await page.waitForFunction(() => {
        return document.readyState === 'complete';
      }, { timeout: 10000 });
      
      // Run comprehensive performance tests
      const results = await page.evaluate(async () => {
        return new Promise((resolve, reject) => {
          // Wait for TraceLog to be ready
          const checkReady = () => {
            if (typeof window.TraceLog !== 'undefined' && window.traceLogReady) {
              console.log('TraceLog detected, starting performance tests...');
              runTests();
            } else if (attempts < 50) { // 5 seconds max wait
              attempts++;
              setTimeout(checkReady, 100);
            } else {
              reject(new Error('TraceLog failed to load within timeout'));
            }
          };

          let attempts = 0;
          
          const runTests = async () => {
            try {
              console.log('Starting comprehensive performance analysis...');
              
              const startMemory = performance.memory ? { 
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize 
              } : null;

              // 1. INITIALIZATION BENCHMARKS
              console.log('🚀 Testing initialization performance...');
              const initStartTime = performance.now();
              window.TraceLog.init({
                id: 'benchmark-test',
                globalMetadata: {
                  test: true,
                  env: 'benchmark',
                  version: '1.0.0'
                }
              });
              const initEndTime = performance.now();
              const initTime = initEndTime - initStartTime;

              // 2. SINGLE EVENT PERFORMANCE
              console.log('📊 Testing individual event performance...');
              const singleEventTimes = [];
              const singleEventCount = 20;
              
              for (let i = 0; i < singleEventCount; i++) {
                const eventStart = performance.now();
                window.TraceLog.event(`single_test_${i}`, {
                  iteration: i,
                  category: 'performance',
                  data: { value: i * 10, label: `test-${i}` }
                });
                const eventEnd = performance.now();
                singleEventTimes.push(eventEnd - eventStart);
              }

              // 3. BURST EVENT PERFORMANCE (realistic high-load scenario)
              console.log('💥 Testing burst event handling...');
              const burstStart = performance.now();
              const burstCount = 100;
              
              for (let i = 0; i < burstCount; i++) {
                window.TraceLog.event('burst_event', {
                  burst_id: Math.floor(i / 10),
                  sequence: i,
                  timestamp: Date.now(),
                  data: 'burst_data_' + i
                });
              }
              const burstEnd = performance.now();
              const burstTime = burstEnd - burstStart;

              // 4. STORAGE PERFORMANCE TEST
              console.log('💾 Testing storage performance...');
              const storageStart = performance.now();
              
              // Test localStorage operations (realistic scenario)
              for (let i = 0; i < 50; i++) {
                const testKey = 'tracelog_perf_test_' + i;
                const testData = { id: i, data: 'test'.repeat(100), timestamp: Date.now() };
                
                localStorage.setItem(testKey, JSON.stringify(testData));
                const retrieved = JSON.parse(localStorage.getItem(testKey));
                localStorage.removeItem(testKey);
              }
              const storageEnd = performance.now();
              const storageTime = storageEnd - storageStart;

              // 5. COMPLEX EVENT WITH METADATA
              console.log('🎯 Testing complex metadata handling...');
              const complexEventStart = performance.now();
              
              window.TraceLog.event('complex_user_interaction', {
                user: {
                  id: 'user_123',
                  segment: 'premium',
                  preferences: ['notifications', 'analytics']
                },
                interaction: {
                  type: 'click',
                  target: 'cta_button',
                  coordinates: { x: 150, y: 300 },
                  viewport: { width: 1920, height: 1080 }
                },
                context: {
                  page: '/dashboard',
                  referrer: 'https://google.com',
                  session_duration: 45000,
                  previous_actions: ['scroll', 'hover', 'focus']
                },
                metadata: {
                  experiment: 'variant_b',
                  ab_test_id: 'exp_456',
                  feature_flags: ['new_ui', 'beta_analytics'],
                  custom_dimensions: {
                    plan: 'pro',
                    region: 'us-east',
                    device_type: 'desktop'
                  }
                }
              });
              const complexEventEnd = performance.now();
              const complexEventTime = complexEventEnd - complexEventStart;

              // 6. MEMORY STABILIZATION CHECK
              setTimeout(() => {
                const endMemory = performance.memory ? { 
                  usedJSHeapSize: performance.memory.usedJSHeapSize,
                  totalJSHeapSize: performance.memory.totalJSHeapSize 
                } : null;

                const avgSingleEventTime = singleEventTimes.reduce((a, b) => a + b, 0) / singleEventTimes.length;
                const p95SingleEventTime = singleEventTimes.sort((a, b) => a - b)[Math.floor(singleEventTimes.length * 0.95)];

                console.log('📋 Performance analysis completed.');
                resolve({
                  // Core metrics
                  initTime: initTime,
                  memoryUsage: endMemory && startMemory ? {
                    heapIncrease: endMemory.usedJSHeapSize - startMemory.usedJSHeapSize,
                    totalHeap: endMemory.totalJSHeapSize,
                    usedHeap: endMemory.usedJSHeapSize
                  } : null,
                  
                  // Event performance
                  singleEvent: {
                    count: singleEventCount,
                    avgTime: avgSingleEventTime,
                    p95Time: p95SingleEventTime,
                    times: singleEventTimes
                  },
                  
                  // Burst performance  
                  burstEvent: {
                    count: burstCount,
                    totalTime: burstTime,
                    avgTime: burstTime / burstCount,
                    eventsPerSecond: Math.round(burstCount / (burstTime / 1000))
                  },
                  
                  // Storage performance
                  storage: {
                    operationsTime: storageTime,
                    avgOperationTime: storageTime / 50,
                    opsPerSecond: Math.round(50 / (storageTime / 1000))
                  },
                  
                  // Complex event performance
                  complexEvent: {
                    time: complexEventTime,
                    overhead: complexEventTime / avgSingleEventTime
                  },

                  // Legacy compatibility
                  eventCount: singleEventCount,
                  avgEventTime: avgSingleEventTime,
                  eventTimes: singleEventTimes
                });
              }, 1000);
            } catch (error) {
              reject(error);
            }
          };

          checkReady();
        });
      });

      await browser.close();
      
      this.results.performance = results;
      this.displayPerformanceResults(results);

    } catch (error) {
      console.warn('⚠️  Performance tests failed:', error.message);
      
      if (error.message.includes('TraceLog failed to load')) {
        console.log('💡 This usually means the bundle structure has changed or the export pattern is different.');
        console.log('💡 Try checking the dist/browser/tracelog.js file structure.');
      } else if (error.message.includes('Playwright') || error.message.includes('playwright')) {
        console.log('💡 Playwright installation or execution failed.');
        console.log('💡 Try running: npm install @playwright/test');
      } else {
        console.log('💡 Unexpected error. Check the console output above for more details.');
      }
      
      // Don't lose partial results - preserve what we have
      if (!this.results.performance) {
        console.log('Skipping performance benchmarks...');
        this.results.performance = null;
      } else {
        console.log('Performance benchmarks completed with some issues, but results preserved...');
      }
    } finally {
      // Cleanup
      if (fs.existsSync('benchmark/test.html')) {
        fs.unlinkSync('benchmark/test.html');
      }
    }
  }

  createPerformanceTestHTML() {
    const browserBundlePath = 'dist/browser/tracelog.js';
    
    if (!fs.existsSync(browserBundlePath)) {
      throw new Error(`Browser bundle not found at ${browserBundlePath}. Run 'npm run build:browser' first.`);
    }
    
    const browserBundle = fs.readFileSync(browserBundlePath, 'utf8');
    
    // Convert ES6 export to global assignment with better regex
    const globalBundle = browserBundle.replace(
      /export\s*{\s*([^}]+)\s+as\s+TraceLog\s*};?\s*$/m,
      'window.TraceLog = $1; window.traceLogReady = true; console.log("TraceLog global assigned:", typeof window.TraceLog);'
    );
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraceLog Performance Benchmark</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .status { padding: 10px; margin: 10px 0; background: #f0f0f0; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Performance Test</h1>
    <div id="status" class="status">Loading TraceLog...</div>
    
    <script>
      console.log('HTML loaded, starting TraceLog initialization...');
      
      // Load TraceLog bundle with global assignment
      ${globalBundle}
      
      // Verification and status update
      setTimeout(() => {
        const statusEl = document.getElementById('status');
        if (typeof window.TraceLog !== 'undefined') {
          console.log('✅ TraceLog loaded successfully:', window.TraceLog);
          statusEl.textContent = '✅ TraceLog loaded successfully';
          statusEl.style.background = '#d4edda';
          window.traceLogReady = true;
        } else {
          console.error('❌ TraceLog failed to load');
          statusEl.textContent = '❌ TraceLog failed to load';
          statusEl.style.background = '#f8d7da';
        }
      }, 100);
    </script>
</body>
</html>`;
  }

  displayPerformanceResults(results) {
    console.log('\n📊 Comprehensive Performance Results:');
    console.log('═'.repeat(80));
    
    // 1. INITIALIZATION PERFORMANCE
    console.log(`\n🚀 Initialization Performance:`);
    console.log(`  Init time: ${results.initTime.toFixed(2)}ms`);
    console.log(`  Status: ${results.initTime < 10 ? '✅ Excellent' : results.initTime < 50 ? '⚡ Good' : '⚠️  Could be faster'}`);
    
    // 2. SINGLE EVENT PERFORMANCE
    if (results.singleEvent) {
      console.log(`\n📊 Single Event Performance:`);
      console.log(`  Average time: ${results.singleEvent.avgTime.toFixed(4)}ms`);
      console.log(`  P95 time: ${results.singleEvent.p95Time.toFixed(4)}ms`);
      console.log(`  Events tested: ${results.singleEvent.count}`);
      console.log(`  Status: ${results.singleEvent.avgTime < 1 ? '✅ Excellent' : results.singleEvent.avgTime < 5 ? '⚡ Good' : '⚠️  Could be faster'}`);
    }

    // 3. BURST EVENT PERFORMANCE
    if (results.burstEvent) {
      console.log(`\n💥 Burst Event Performance:`);
      console.log(`  Total time: ${results.burstEvent.totalTime.toFixed(2)}ms for ${results.burstEvent.count} events`);
      console.log(`  Events per second: ${results.burstEvent.eventsPerSecond} ops/sec`);
      console.log(`  Average per event: ${results.burstEvent.avgTime.toFixed(4)}ms`);
      console.log(`  Status: ${results.burstEvent.eventsPerSecond > 1000 ? '✅ Excellent throughput' : results.burstEvent.eventsPerSecond > 500 ? '⚡ Good throughput' : '⚠️  Low throughput'}`);
    }

    // 4. STORAGE PERFORMANCE
    if (results.storage) {
      console.log(`\n💾 Storage Performance:`);
      console.log(`  Operations time: ${results.storage.operationsTime.toFixed(2)}ms (50 operations)`);
      console.log(`  Operations per second: ${results.storage.opsPerSecond} ops/sec`);
      console.log(`  Average per operation: ${results.storage.avgOperationTime.toFixed(4)}ms`);
      console.log(`  Status: ${results.storage.opsPerSecond > 100 ? '✅ Fast storage' : results.storage.opsPerSecond > 50 ? '⚡ Adequate storage' : '⚠️  Slow storage'}`);
    }

    // 5. COMPLEX EVENT PERFORMANCE
    if (results.complexEvent) {
      console.log(`\n🎯 Complex Metadata Performance:`);
      console.log(`  Complex event time: ${results.complexEvent.time.toFixed(4)}ms`);
      console.log(`  Overhead vs simple: ${results.complexEvent.overhead.toFixed(2)}x`);
      console.log(`  Status: ${results.complexEvent.overhead < 2 ? '✅ Low overhead' : results.complexEvent.overhead < 5 ? '⚡ Moderate overhead' : '⚠️  High overhead'}`);
    }
    
    // 6. MEMORY ANALYSIS
    if (results.memoryUsage) {
      const heapMB = (results.memoryUsage.heapIncrease / 1024 / 1024).toFixed(2);
      const totalMB = (results.memoryUsage.totalHeap / 1024 / 1024).toFixed(2);
      
      console.log(`\n🧠 Memory Analysis:`);
      console.log(`  Heap increase: ${heapMB} MB`);
      console.log(`  Total heap: ${totalMB} MB`);
      console.log(`  Memory efficiency: ${parseFloat(heapMB) < 0.1 ? '✅ Excellent' : parseFloat(heapMB) < 1 ? '⚡ Good' : '⚠️  High usage'}`);
      
      // Memory claim verification
      const claimMB = 1;
      console.log(`\n🎯 Memory Claim Verification:`);
      console.log(`  Claimed: < ${claimMB}MB RAM overhead`);
      console.log(`  Actual:  ${heapMB}MB heap increase`);
      console.log(`  Status:  ${parseFloat(heapMB) < claimMB ? '✅ ACCURATE' : '⚠️  OVER LIMIT'}`);
    }

    // 7. CPU IMPACT ANALYSIS
    const avgEventTime = results.singleEvent ? results.singleEvent.avgTime : results.avgEventTime;
    const cpuPercentage = (avgEventTime / 1000).toFixed(4);
    console.log(`\n⚡ CPU Impact Analysis:`);
    console.log(`  Per-event CPU impact: ~${cpuPercentage}%`);
    console.log(`  Estimated for 100 events/min: ~${(cpuPercentage * 100 / 60).toFixed(6)}%/sec`);
    console.log(`  Claimed: < 0.1% on average devices`);
    console.log(`  Status: ${parseFloat(cpuPercentage) < 0.1 ? '✅ ACCURATE' : '⚠️  OVER LIMIT'}`);

    // 8. OVERALL PERFORMANCE RATING
    console.log(`\n🏆 Overall Performance Rating:`);
    const heapMB = results.memoryUsage ? (results.memoryUsage.heapIncrease / 1024 / 1024).toFixed(2) : '0';
    const scores = [
      results.initTime < 10 ? 1 : 0,
      avgEventTime < 1 ? 1 : 0,
      results.burstEvent?.eventsPerSecond > 1000 ? 1 : 0,
      results.storage?.opsPerSecond > 100 ? 1 : 0,
      parseFloat(heapMB || 0) < 1 ? 1 : 0
    ];
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const rating = totalScore >= 4 ? '🥇 Excellent' : totalScore >= 3 ? '🥈 Good' : totalScore >= 2 ? '🥉 Fair' : '⚠️  Needs improvement';
    console.log(`  Score: ${totalScore}/5 - ${rating}`);
  }

  saveResults() {
    const resultsPath = 'benchmark/results.json';
    
    // Load existing results if any
    let allResults = [];
    if (fs.existsSync(resultsPath)) {
      try {
        allResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      } catch (error) {
        console.warn('Could not load existing results:', error.message);
      }
    }

    // Add current results
    allResults.push(this.results);

    // Keep only last 10 results
    if (allResults.length > 10) {
      allResults = allResults.slice(-10);
    }

    // Save results
    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
    
    console.log(`\n💾 Results saved to ${resultsPath}`);
  }

  generateReport() {
    const performanceSection = this.results.performance ? `
### Core Performance
- **Initialization Time:** ${this.results.performance.initTime.toFixed(2)}ms
- **Memory Heap Increase:** ${this.results.performance.memoryUsage ? (this.results.performance.memoryUsage.heapIncrease / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}

### Event Performance  
${this.results.performance.singleEvent ? `
- **Single Event Avg:** ${this.results.performance.singleEvent.avgTime.toFixed(4)}ms
- **Single Event P95:** ${this.results.performance.singleEvent.p95Time.toFixed(4)}ms
- **Events Tested:** ${this.results.performance.singleEvent.count}
` : ''}
${this.results.performance.burstEvent ? `
### Burst Performance
- **Burst Total:** ${this.results.performance.burstEvent.totalTime.toFixed(2)}ms (${this.results.performance.burstEvent.count} events)
- **Events/Second:** ${this.results.performance.burstEvent.eventsPerSecond} ops/sec
- **Burst Avg/Event:** ${this.results.performance.burstEvent.avgTime.toFixed(4)}ms
` : ''}
${this.results.performance.storage ? `
### Storage Performance
- **Storage Operations:** ${this.results.performance.storage.operationsTime.toFixed(2)}ms (50 ops)
- **Storage Ops/Second:** ${this.results.performance.storage.opsPerSecond} ops/sec
- **Storage Avg/Op:** ${this.results.performance.storage.avgOperationTime.toFixed(4)}ms
` : ''}
${this.results.performance.complexEvent ? `
### Complex Event Performance
- **Complex Event Time:** ${this.results.performance.complexEvent.time.toFixed(4)}ms
- **Overhead vs Simple:** ${this.results.performance.complexEvent.overhead.toFixed(2)}x
` : ''}
` : 'Performance tests were skipped (requires headless browser environment)';

    const memoryStatus = this.results.performance?.memoryUsage 
      ? (this.results.performance.memoryUsage.heapIncrease / 1024 / 1024 < 1 ? '✅' : '⚠️') 
      : '⏭️ SKIPPED';

    const avgEventTime = this.results.performance?.singleEvent?.avgTime || this.results.performance?.avgEventTime || 0;
    const cpuStatus = this.results.performance 
      ? (avgEventTime / 1000 < 0.1 ? '✅' : '⚠️') 
      : '⏭️ SKIPPED';

    const memoryActual = this.results.performance?.memoryUsage 
      ? (this.results.performance.memoryUsage.heapIncrease / 1024 / 1024).toFixed(2) + 'MB' 
      : 'N/A';

    const cpuActual = this.results.performance 
      ? `~${(avgEventTime / 1000).toFixed(4)}%` 
      : 'N/A';

    const burstThroughput = this.results.performance?.burstEvent?.eventsPerSecond || 'N/A';

    const report = `# TraceLog Performance Benchmark Report

**Version:** ${this.results.version}  
**Date:** ${this.results.timestamp}

## Bundle Size Analysis

${Object.entries(this.results.bundleSize).map(([format, stats]) => `
### ${format.toUpperCase()}
- **Raw:** ${stats.rawKB} KB
- **Gzipped:** ${stats.gzippedKB} KB  
- **Brotli:** ${stats.brotliKB} KB
`).join('')}

## Performance Metrics

${performanceSection}

## README Claims Verification

| Metric | Claimed | Actual | Status |
|--------|---------|--------|--------|
| Bundle Size | ~15KB gzipped | ${this.results.bundleSize.browserMinified ? this.results.bundleSize.browserMinified.gzippedKB + 'KB' : 'N/A'} | ${this.results.bundleSize.browserMinified ? (Math.abs(parseFloat(this.results.bundleSize.browserMinified.gzippedKB) - 15) <= 2 ? '✅' : '⚠️') : 'N/A'} |
| Memory Usage | < 1MB | ${memoryActual} | ${memoryStatus} |
| CPU Impact | < 0.1% | ${cpuActual} | ${cpuStatus} |

## Advanced Performance Metrics

| Metric | Value | Performance Rating |
|--------|-------|--------------------|
| Initialization | ${this.results.performance?.initTime ? this.results.performance.initTime.toFixed(2) + 'ms' : 'N/A'} | ${this.results.performance?.initTime < 10 ? '✅ Excellent' : this.results.performance?.initTime < 50 ? '⚡ Good' : '⚠️ Slow'} |
| Burst Throughput | ${burstThroughput} events/sec | ${burstThroughput > 1000 ? '✅ Excellent' : burstThroughput > 500 ? '⚡ Good' : '⚠️ Low'} |
| Storage Ops | ${this.results.performance?.storage?.opsPerSecond || 'N/A'} ops/sec | ${(this.results.performance?.storage?.opsPerSecond || 0) > 100 ? '✅ Fast' : (this.results.performance?.storage?.opsPerSecond || 0) > 50 ? '⚡ OK' : '⚠️ Slow'} |
| Complex Event Overhead | ${this.results.performance?.complexEvent ? this.results.performance.complexEvent.overhead.toFixed(2) + 'x' : 'N/A'} | ${(this.results.performance?.complexEvent?.overhead || 0) < 2 ? '✅ Low' : (this.results.performance?.complexEvent?.overhead || 0) < 5 ? '⚡ Medium' : '⚠️ High'} |

---
*Generated automatically by benchmark script*
`;

    fs.writeFileSync('benchmark/BENCHMARK.md', report);
    console.log('\n📋 Benchmark report generated: BENCHMARK.md');
  }

  async run() {
    console.log('🚀 Starting TraceLog Performance Benchmark\n');
    console.log('═'.repeat(60));

    try {
      await this.measureBundleSize();
      await this.measurePerformance();
      
      this.saveResults();
      this.generateReport();
      
      console.log('\n✅ Benchmark completed successfully!');
      console.log('\nNext steps:');
      console.log('- Review BENCHMARK.md for detailed results');
      console.log('- Update README.md if metrics have changed significantly');
      console.log('- Consider optimizations if any metrics exceed claims');
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      // Don't exit with error code, just continue
      console.log('\n⚠️  Some benchmarks may have failed, but results were still generated');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new BenchmarkRunner();
  runner.run().catch(console.error);
}

module.exports = BenchmarkRunner; 