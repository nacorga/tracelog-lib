#!/usr/bin/env node

/**
 * TraceLog Anomaly Detection Test Runner
 * Executes basic flow tests and generates anomaly reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'test-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'anomaly-report.json');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const anomalyReport = {
  timestamp: new Date().toISOString(),
  testSuite: 'TraceLog Basic Flow',
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    totalAnomalies: 0,
    criticalAnomalies: 0,
    warnings: 0,
  },
  anomalies: [],
  testResults: [],
  systemHealth: {
    traceLogErrors: 0,
    contextErrors: 0,
    memoryLeaks: false,
    crossBrowserCompatibility: {},
  },
};

function parseTestOutput(output) {
  const lines = output.split('\n');
  let currentTest = null;

  for (const line of lines) {
    // Track test execution - simplified pattern
    if (
      line.includes('[chromium]') ||
      line.includes('[firefox]') ||
      line.includes('[webkit]') ||
      line.includes('[Mobile')
    ) {
      const browserMatch = line.match(/\[([^\]]+)\]/);
      if (browserMatch && line.includes('basic-flow.spec.ts')) {
        const browser = browserMatch[1];
        const testName = line.includes('error scenarios') ? 'error-scenarios' : 'basic-flow';
        currentTest = { browser, testName, anomalies: [], passed: false };
      }
    }

    // Detect test completion
    if (line.includes('✓') && line.includes('basic-flow.spec.ts')) {
      if (currentTest) {
        currentTest.passed = true;
        anomalyReport.testResults.push(currentTest);
        anomalyReport.summary.passedTests++;
      }
      currentTest = null;
    } else if (line.includes('✘') && line.includes('basic-flow.spec.ts')) {
      if (currentTest) {
        currentTest.passed = false;
        anomalyReport.testResults.push(currentTest);
        anomalyReport.summary.failedTests++;
      }
      currentTest = null;
    }

    // Parse final summary lines
    if (line.match(/\d+ passed/)) {
      const passedMatch = line.match(/(\d+) passed/);
      if (passedMatch) {
        anomalyReport.summary.passedTests = parseInt(passedMatch[1]);
      }
    }

    if (line.match(/\d+ failed/)) {
      const failedMatch = line.match(/(\d+) failed/);
      if (failedMatch) {
        anomalyReport.summary.failedTests = parseInt(failedMatch[1]);
      }
    }

    // Capture anomaly patterns - look for color codes and error mentions
    if (line.includes("'") && (line.includes('error') || line.includes('warning') || line.includes('timeout'))) {
      const anomalyMatches = line.matchAll(/'([^']+)'/g);
      for (const match of anomalyMatches) {
        const anomalyText = match[1];
        if (
          anomalyText.includes('error') ||
          anomalyText.includes('warning') ||
          anomalyText.includes('timeout') ||
          anomalyText.includes('failures')
        ) {
          const anomaly = {
            type: anomalyText,
            severity: anomalyText.toLowerCase().includes('tracelog errors') ? 'critical' : 'warning',
            browser: currentTest?.browser || 'general',
            testContext: currentTest?.testName || 'general',
          };

          // Avoid duplicates
          const exists = anomalyReport.anomalies.some((a) => a.type === anomaly.type && a.browser === anomaly.browser);
          if (!exists) {
            anomalyReport.anomalies.push(anomaly);

            if (anomaly.severity === 'critical') {
              anomalyReport.summary.criticalAnomalies++;
            } else {
              anomalyReport.summary.warnings++;
            }
          }
        }
      }
    }

    // Track system health indicators
    if (line.includes('TraceLog errors:')) {
      const errorMatch = line.match(/TraceLog errors: (\d+)/);
      if (errorMatch) {
        anomalyReport.systemHealth.traceLogErrors = Math.max(
          anomalyReport.systemHealth.traceLogErrors,
          parseInt(errorMatch[1]),
        );
      }
    }

    if (line.includes('Context errors:')) {
      const errorMatch = line.match(/Context errors: (\d+)/);
      if (errorMatch) {
        anomalyReport.systemHealth.contextErrors = Math.max(
          anomalyReport.systemHealth.contextErrors,
          parseInt(errorMatch[1]),
        );
      }
    }
  }

  // Count total tests
  anomalyReport.summary.totalTests = anomalyReport.summary.passedTests + anomalyReport.summary.failedTests;
  anomalyReport.summary.totalAnomalies = anomalyReport.anomalies.length;
}

function generateSummary() {
  const { summary, systemHealth } = anomalyReport;

  // Categorize anomalies
  const criticalIssues = anomalyReport.anomalies.filter((a) => a.severity === 'critical');
  const warnings = anomalyReport.anomalies.filter((a) => a.severity === 'warning');

  // Browser compatibility
  const browsers = [...new Set(anomalyReport.testResults.map((t) => t.browser))];
  browsers.forEach((browser) => {
    const browserTests = anomalyReport.testResults.filter((t) => t.browser === browser);
    const passed = browserTests.filter((t) => t.passed).length;
    const total = browserTests.length;

    systemHealth.crossBrowserCompatibility[browser] = {
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%',
      passed,
      total,
      anomalies: anomalyReport.anomalies.filter((a) => a.browser === browser).length,
    };
  });

  return {
    overallHealth: criticalIssues.length === 0 ? 'HEALTHY' : 'CRITICAL',
    testPassRate: summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) + '%' : '0%',
    riskLevel: criticalIssues.length > 0 ? 'HIGH' : warnings.length > 10 ? 'MEDIUM' : 'LOW',
  };
}

async function runTests() {
  console.log('🔍 Running TraceLog Anomaly Detection Tests...');

  return new Promise((resolve, reject) => {
    const testProcess = spawn('npm', ['run', 'test:e2e', '--', 'tests/e2e/basic-flow.spec.ts', '--reporter=line'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      console.log(`\n📊 Tests completed with exit code: ${code}`);

      // Parse output regardless of exit code
      parseTestOutput(stdout + stderr);

      const summary = generateSummary();
      anomalyReport.summary = { ...anomalyReport.summary, ...summary };

      resolve({ code, stdout, stderr });
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    await runTests();

    // Write report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(anomalyReport, null, 2));

    // Display summary
    console.log('\n📋 ANOMALY DETECTION REPORT SUMMARY');
    console.log('=====================================');
    console.log(`Overall Health: ${anomalyReport.summary.overallHealth}`);
    console.log(`Test Pass Rate: ${anomalyReport.summary.testPassRate}`);
    console.log(`Risk Level: ${anomalyReport.summary.riskLevel}`);
    console.log(`Total Anomalies: ${anomalyReport.summary.totalAnomalies}`);
    console.log(`Critical Issues: ${anomalyReport.summary.criticalAnomalies}`);
    console.log(`Warnings: ${anomalyReport.summary.warnings}`);
    console.log(`TraceLog Errors: ${anomalyReport.systemHealth.traceLogErrors}`);
    console.log(`Context Errors: ${anomalyReport.systemHealth.contextErrors}`);

    console.log('\n🌐 Browser Compatibility:');
    Object.entries(anomalyReport.systemHealth.crossBrowserCompatibility).forEach(([browser, stats]) => {
      console.log(
        `  ${browser}: ${stats.passRate} (${stats.passed}/${stats.total} tests, ${stats.anomalies} anomalies)`,
      );
    });

    if (anomalyReport.summary.criticalAnomalies > 0) {
      console.log('\n⚠️  CRITICAL ANOMALIES DETECTED:');
      anomalyReport.anomalies
        .filter((a) => a.severity === 'critical')
        .forEach((anomaly) => {
          console.log(`  - ${anomaly.type} (${anomaly.browser})`);
        });
    }

    console.log(`\n📄 Full report saved: ${REPORT_FILE}`);

    // Exit with appropriate code
    process.exit(anomalyReport.summary.criticalAnomalies > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error running anomaly detection:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests, parseTestOutput, generateSummary };
