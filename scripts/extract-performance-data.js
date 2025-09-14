#!/usr/bin/env node

/**
 * Extract performance data from test output and generate JSON report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PERFORMANCE_DIR = path.join(__dirname, '../performance');

function runPerformanceTests() {
  console.log('🚀 Running performance tests...');
  try {
    // 1) Build and copy SDK for fixtures (inherit stdio for visibility)
    execSync('npm run build:browser && cp dist/browser/tracelog.js tests/fixtures/tracelog.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    // 2) Run Playwright with JSON reporter and capture stdout only from Playwright
    const jsonOutput = execSync('npx playwright test tests/e2e/performance/benchmarks.spec.ts --reporter=json', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 64,
    });
    console.log('✅ Tests completed successfully');
    return jsonOutput;
  } catch (error) {
    console.log('⚠️  Tests ended with non-zero exit code, attempting to parse stdout...');
    return error.stdout || error.output?.filter(Boolean).join('\n') || '';
  }
}

function extractMetrics(output) {
  const results = {
    timestamp: new Date().toISOString(),
    summary: {},
  };

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    // If parsing fails, return empty results but with timestamp
    return results;
  }

  // Traverse suites/specs/tests and collect attachments named 'performance'
  // Collect raw values in-memory only, not persisted
  const rawByBrowser = {};
  const collect = (suite) => {
    if (!suite) return;
    const specs = suite.specs || [];
    for (const spec of specs) {
      const tests = spec.tests || [];
      for (const t of tests) {
        const projectName = (t.projectName || 'unknown').toLowerCase();
        // Normalize browser key
        const browserKey = projectName
          .replace(/\s+/g, '-')
          .replace('mobile-chrome', 'mobile-chrome')
          .replace('mobile-safari', 'mobile-safari');

        const attachments = t.results?.flatMap((r) => r.attachments || []) || [];
        for (const att of attachments) {
          if (att?.name !== 'performance') continue;
          try {
            let bodyStr = '';
            if (att.body) {
              // JSON reporter encodes bodies as base64
              try {
                bodyStr = Buffer.from(att.body, 'base64').toString('utf8');
              } catch (_) {
                bodyStr = String(att.body);
              }
            } else if (att.path) {
              bodyStr = fs.readFileSync(att.path, 'utf8');
            }
            const payload = JSON.parse(bodyStr);
            const metric = payload.metric;
            const value = Number(payload.value);
            if (!metric || Number.isNaN(value)) continue;

            if (!rawByBrowser[browserKey]) rawByBrowser[browserKey] = {};
            if (!rawByBrowser[browserKey][metric]) rawByBrowser[browserKey][metric] = [];
            rawByBrowser[browserKey][metric].push(value);
          } catch (_) {
            // ignore malformed attachment
          }
        }
      }
    }
    const children = suite.suites || [];
    for (const child of children) collect(child);
  };

  for (const rootSuite of data.suites || []) {
    collect(rootSuite);
  }

  // Calculate summary statistics
  for (const [browser, metrics] of Object.entries(rawByBrowser)) {
    results.summary[browser] = {};
    for (const [metric, values] of Object.entries(metrics)) {
      if (values.length > 0) {
        const round2 = (n) => Math.round(n * 100) / 100;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        results.summary[browser][metric] = {
          min: round2(Math.min(...values)),
          max: round2(Math.max(...values)),
          avg: round2(avg),
          count: values.length,
        };
      }
    }
  }

  return results;
}

function saveResults(results) {
  const outputPath = path.join(PERFORMANCE_DIR, 'performance-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📊 Data saved to: ${outputPath}`);
  return results;
}

function main() {
  console.log('🎯 Extracting performance data automatically');
  console.log('='.repeat(50));

  const output = runPerformanceTests();
  const results = extractMetrics(output);

  console.log(`\n📈 Data extracted for ${Object.keys(results.summary).length} browsers`);

  saveResults(results);

  // Show summary
  console.log('\n📊 Summary:');
  for (const [browser, summary] of Object.entries(results.summary)) {
    console.log(`\n🌐 ${browser.toUpperCase()}:`);
    if (summary.initialization) {
      console.log(`  Initialization: ${summary.initialization.avg.toFixed(1)}ms`);
    }
    if (summary.averageEvent) {
      console.log(`  Events: ${summary.averageEvent.avg.toFixed(2)}ms`);
    }
  }

  console.log('\n🎉 Process completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { extractMetrics, saveResults };
