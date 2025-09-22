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
  testSuite: 'TraceLog Flow Validation',
  overallStatus: 'UNKNOWN', // HEALTHY | DEGRADED | CRITICAL
  summary: {
    totalTests: 0,
    failedTests: 0,
    successRate: '0%',
    totalAnomalies: 0,
    criticalIssues: 0,
    executionTime: 0,
  },
  // Only include problems, not successful tests
  failures: [],
  anomalies: [],
  browserCompatibility: {
    failingBrowsers: [],
    inconsistentBehavior: [],
  },
  systemHealth: {
    traceLogErrors: 0,
    memoryLeaks: false,
    performanceIssues: [],
  },
  // Actionable recommendations
  recommendations: [],
};

let testStartTime = Date.now();

function parseTestOutput(output) {
  const lines = output.split('\n');
  let currentFailure = null;

  // Reset for fresh parsing
  anomalyReport.summary.failedTests = 0;
  anomalyReport.failures = [];
  anomalyReport.anomalies = [];
  anomalyReport.summary.criticalIssues = 0;
  anomalyReport.summary.totalAnomalies = 0;

  for (const line of lines) {
    // Detect failed tests - only track failures
    if (line.includes('✘') && line.includes('basic-flow.spec.ts')) {
      const matches = line.match(
        /\[(\d+)\/(\d+)\]\s*\[([^\]]+)\]\s*›.*basic-flow\.spec\.ts:\d+:\d+\s*›\s*Flow Validation\s*›\s*(.+)/,
      );
      if (matches) {
        const [, testNumber, totalTests, browser, testDescription] = matches;

        currentFailure = {
          browser,
          testDescription,
          testNumber: parseInt(testNumber),
          errorDetails: [],
          severity: 'CRITICAL',
        };

        anomalyReport.failures.push(currentFailure);
        anomalyReport.summary.failedTests++;

        // Track browser failures
        if (!anomalyReport.browserCompatibility.failingBrowsers.includes(browser)) {
          anomalyReport.browserCompatibility.failingBrowsers.push(browser);
        }
      }
    }

    // This logic is now handled above in the main parsing section
    // Keep this for any edge cases that might be missed

    // Get total tests from summary
    if (line.match(/\d+ passed/)) {
      const passedMatch = line.match(/(\d+) passed/);
      if (passedMatch) {
        const passed = parseInt(passedMatch[1]);
        anomalyReport.summary.totalTests = passed + anomalyReport.summary.failedTests;
      }
    }

    // Detect failures from final summary
    if (line.match(/\d+ failed/)) {
      const failedMatch = line.match(/(\d+) failed/);
      if (failedMatch) {
        const failedCount = parseInt(failedMatch[1]);

        // If we didn't catch individual failures, create generic failure entries
        if (anomalyReport.failures.length === 0 && failedCount > 0) {
          for (let i = 0; i < failedCount; i++) {
            anomalyReport.failures.push({
              browser: 'multiple',
              testDescription: 'Failed test (details not captured)',
              severity: 'CRITICAL',
              errorDetails: [
                {
                  type: 'Test Failure',
                  message: 'Test failed - check full logs for details',
                  severity: 'CRITICAL',
                },
              ],
            });
          }
        }

        anomalyReport.summary.failedTests = Math.max(anomalyReport.summary.failedTests, failedCount);

        // Update total tests calculation
        if (anomalyReport.summary.totalTests === 0) {
          // Estimate total tests if not detected elsewhere
          anomalyReport.summary.totalTests = failedCount * 5; // Assume 5 browsers
        }
      }
    }

    // Capture detailed error information for current failure
    if (currentFailure && (line.includes('Error:') || line.includes('Expected:') || line.includes('Received:'))) {
      let errorType = 'Unknown Error';
      let severity = 'WARNING';

      // Classify error types
      if (line.includes('TimeoutError:')) {
        errorType = 'Timeout';
        severity = 'CRITICAL';
      } else if (line.includes('Error: expect(')) {
        errorType = 'Assertion Failure';
        severity = 'WARNING';
      } else if (line.includes('TraceLog')) {
        errorType = 'TraceLog System Error';
        severity = 'CRITICAL';
      } else if (line.includes('network') || line.includes('fetch')) {
        errorType = 'Network Error';
        severity = 'WARNING';
      }

      currentFailure.errorDetails.push({
        type: errorType,
        message: line.trim().substring(0, 150),
        severity,
      });

      currentFailure.severity = severity === 'CRITICAL' ? 'CRITICAL' : currentFailure.severity;
    }

    // Track TraceLog-specific system health indicators
    if (line.includes('TraceLog errors:')) {
      const errorMatch = line.match(/TraceLog errors: (\d+)/);
      if (errorMatch) {
        const errorCount = parseInt(errorMatch[1]);
        anomalyReport.systemHealth.traceLogErrors = errorCount;

        if (errorCount > 0) {
          anomalyReport.anomalies.push({
            type: 'TraceLog Core Errors',
            count: errorCount,
            severity: 'CRITICAL',
            impact: 'Library initialization or core functionality failing',
          });
          anomalyReport.summary.criticalIssues++;
        }
      }
    }

    // === TRACELOG LIBRARY-SPECIFIC ANOMALY DETECTION ===

    // Detect TraceLog bridge initialization issues
    if (line.includes('__traceLogBridge') && (line.includes('undefined') || line.includes('null'))) {
      anomalyReport.anomalies.push({
        type: 'TraceLog Bridge Failure',
        severity: 'CRITICAL',
        impact: 'Event tracking not functional - bridge not initialized',
        details: line.trim().substring(0, 100),
        recommendation: 'Check if TraceLog.init() was called before bridge usage',
      });
      anomalyReport.summary.criticalIssues++;
    }

    // Detect TraceLog initialization failures
    if (line.includes('initializeTraceLog') && (line.includes('failed') || line.includes('error'))) {
      anomalyReport.anomalies.push({
        type: 'TraceLog Initialization Failure',
        severity: 'CRITICAL',
        impact: 'Library failed to initialize - no event tracking available',
        details: line.trim().substring(0, 100),
        recommendation: 'Verify project ID, API URL configuration, and network connectivity',
      });
      anomalyReport.summary.criticalIssues++;
    }

    // Detect event sending failures
    if (
      line.includes('Failed to send events') ||
      line.includes('sendEventsQueue failed') ||
      line.includes('sendBeacon failed')
    ) {
      anomalyReport.anomalies.push({
        type: 'Event Transmission Failure',
        severity: 'HIGH',
        impact: 'Events not reaching server - data loss occurring',
        details: line.trim().substring(0, 100),
        recommendation: 'Check network connectivity, API endpoints, and CORS configuration',
      });
    }

    // Detect custom event sending failures
    if (line.includes('sendCustomEvent') && (line.includes('Error') || line.includes('failed'))) {
      anomalyReport.anomalies.push({
        type: 'Custom Event Failure',
        severity: 'MEDIUM',
        impact: 'Custom events not being tracked properly',
        details: line.trim().substring(0, 100),
        recommendation: 'Validate custom event data structure and metadata',
      });
    }

    // Detect session management issues
    if (
      line.includes('Session recovery failed') ||
      line.includes('SessionManager error') ||
      line.includes('Cross-tab sync failed')
    ) {
      anomalyReport.anomalies.push({
        type: 'Session Management Issue',
        severity: 'MEDIUM',
        impact: 'Session tracking inconsistent - user journey fragmented',
        details: line.trim().substring(0, 100),
        recommendation: 'Check localStorage availability and cross-tab communication',
      });
    }

    // Detect configuration issues
    if (
      line.includes('Invalid configuration') ||
      line.includes('Missing project ID') ||
      line.includes('Config validation failed')
    ) {
      anomalyReport.anomalies.push({
        type: 'Configuration Error',
        severity: 'HIGH',
        impact: 'Library not properly configured - tracking may be incomplete',
        details: line.trim().substring(0, 100),
        recommendation: 'Validate TraceLog.init() parameters and project settings',
      });
    }

    // Detect event validation failures
    if (
      line.includes('Event validation failed') ||
      line.includes('Invalid event data') ||
      line.includes('Event schema error')
    ) {
      anomalyReport.anomalies.push({
        type: 'Event Validation Failure',
        severity: 'MEDIUM',
        impact: 'Some events rejected - incomplete tracking data',
        details: line.trim().substring(0, 100),
        recommendation: 'Check custom event data structure and metadata validation',
      });
    }

    // Detect handler errors
    if (
      line.includes('Handler error') ||
      line.includes('Event listener failed') ||
      line.includes('Tracking handler stopped')
    ) {
      anomalyReport.anomalies.push({
        type: 'Event Handler Failure',
        severity: 'MEDIUM',
        impact: 'Specific interaction tracking disabled - partial data loss',
        details: line.trim().substring(0, 100),
        recommendation: 'Check DOM element availability and handler initialization',
      });
    }

    // Detect storage issues
    if (
      line.includes('localStorage unavailable') ||
      line.includes('Storage quota exceeded') ||
      line.includes('Storage operation failed')
    ) {
      anomalyReport.anomalies.push({
        type: 'Storage Issue',
        severity: 'MEDIUM',
        impact: 'Session persistence and event queuing affected',
        details: line.trim().substring(0, 100),
        recommendation: 'Check browser storage settings and available space',
      });
    }

    // Detect network-related issues
    if (line.includes('CORS error') || line.includes('Network timeout') || line.includes('API endpoint unreachable')) {
      anomalyReport.anomalies.push({
        type: 'Network Connectivity Issue',
        severity: 'HIGH',
        impact: 'Events cannot reach analytics server',
        details: line.trim().substring(0, 100),
        recommendation: 'Verify API URL, CORS headers, and network connectivity',
      });
    }

    // Detect event queue issues
    if (
      line.includes('Event queue overflow') ||
      line.includes('Queue capacity exceeded') ||
      line.includes('Events dropped')
    ) {
      anomalyReport.anomalies.push({
        type: 'Event Queue Overflow',
        severity: 'MEDIUM',
        impact: 'Events being dropped due to queue limits',
        details: line.trim().substring(0, 100),
        recommendation: 'Review event sampling rates and send frequency',
      });
    }

    // Detect Web Vitals tracking issues
    if (
      line.includes('Web Vitals') &&
      (line.includes('failed') || line.includes('error') || line.includes('not supported'))
    ) {
      anomalyReport.anomalies.push({
        type: 'Web Vitals Tracking Issue',
        severity: 'LOW',
        impact: 'Performance metrics not being captured',
        details: line.trim().substring(0, 100),
        recommendation: 'Check browser compatibility for Web Vitals API',
      });
    }

    // Detect integration issues
    if (line.includes('Google Analytics') && (line.includes('failed') || line.includes('error'))) {
      anomalyReport.anomalies.push({
        type: 'Integration Failure',
        severity: 'LOW',
        impact: 'Third-party integration not working properly',
        details: line.trim().substring(0, 100),
        recommendation: 'Verify integration configuration and API keys',
      });
    }

    // Detect performance issues
    if (line.includes('performance') && (line.includes('slow') || line.includes('high') || line.includes('memory'))) {
      anomalyReport.systemHealth.performanceIssues.push({
        type: 'Performance Warning',
        details: line.trim().substring(0, 100),
      });
    }

    // Detect memory leak indicators
    if (
      line.includes('memory') &&
      (line.includes('leak') || line.includes('growing') || line.includes('not released'))
    ) {
      anomalyReport.systemHealth.memoryLeaks = true;
      anomalyReport.anomalies.push({
        type: 'Memory Leak Detected',
        severity: 'WARNING',
        impact: 'Potential memory consumption issues in long-running sessions',
        details: line.trim().substring(0, 100),
      });
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

  // Calculate final metrics
  if (anomalyReport.summary.totalTests > 0) {
    const successRate = (
      ((anomalyReport.summary.totalTests - anomalyReport.summary.failedTests) / anomalyReport.summary.totalTests) *
      100
    ).toFixed(1);
    anomalyReport.summary.successRate = `${successRate}%`;
  } else {
    anomalyReport.summary.successRate = '0%';
  }

  anomalyReport.summary.totalAnomalies = anomalyReport.anomalies.length;
  anomalyReport.summary.executionTime = Date.now() - testStartTime;

  // Determine overall status
  if (anomalyReport.summary.criticalIssues > 0 || anomalyReport.summary.failedTests > 0) {
    anomalyReport.overallStatus = 'CRITICAL';
  } else if (anomalyReport.summary.totalAnomalies > 0) {
    anomalyReport.overallStatus = 'DEGRADED';
  } else {
    anomalyReport.overallStatus = 'HEALTHY';
  }

  // Generate actionable recommendations
  generateRecommendations();
}

function generateRecommendations() {
  const recommendations = [];

  // Analyze failures and suggest fixes
  if (anomalyReport.failures.length > 0) {
    const failuresByBrowser = {};
    anomalyReport.failures.forEach((failure) => {
      if (!failuresByBrowser[failure.browser]) {
        failuresByBrowser[failure.browser] = [];
      }
      failuresByBrowser[failure.browser].push(failure);
    });

    // Browser-specific issues
    Object.entries(failuresByBrowser).forEach(([browser, failures]) => {
      if (failures.length > 1) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Browser Compatibility',
          issue: `Multiple failures in ${browser} (${failures.length} tests)`,
          action: `Focus testing efforts on ${browser} - possible browser-specific issues`,
        });
      }
    });
  }

  // TraceLog-specific recommendations
  if (anomalyReport.systemHealth.traceLogErrors > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'TraceLog Core',
      issue: `TraceLog system errors detected (${anomalyReport.systemHealth.traceLogErrors})`,
      action: 'Check TraceLog initialization, API configuration, and network connectivity',
    });
  }

  // Generate specific recommendations for each anomaly type
  const anomaliesByType = {};
  anomalyReport.anomalies.forEach((anomaly) => {
    if (!anomaliesByType[anomaly.type]) {
      anomaliesByType[anomaly.type] = [];
    }
    anomaliesByType[anomaly.type].push(anomaly);
  });

  // Process each anomaly type and create consolidated recommendations
  Object.entries(anomaliesByType).forEach(([type, anomalies]) => {
    const firstAnomaly = anomalies[0];
    const count = anomalies.length;

    // Use the recommendation from the anomaly if available
    if (firstAnomaly.recommendation) {
      const priority =
        firstAnomaly.severity === 'CRITICAL'
          ? 'CRITICAL'
          : firstAnomaly.severity === 'HIGH'
            ? 'HIGH'
            : firstAnomaly.severity === 'MEDIUM'
              ? 'MEDIUM'
              : 'LOW';

      recommendations.push({
        priority,
        category: 'TraceLog Library',
        issue: count > 1 ? `${type} (${count} occurrences)` : type,
        action: firstAnomaly.recommendation,
        impact: firstAnomaly.impact,
      });
    }
  });

  // Additional consolidated recommendations for TraceLog health
  const criticalAnomalies = anomalyReport.anomalies.filter((a) => a.severity === 'CRITICAL');
  const highAnomalies = anomalyReport.anomalies.filter((a) => a.severity === 'HIGH');

  if (criticalAnomalies.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'System Health',
      issue: `${criticalAnomalies.length} critical TraceLog issues detected`,
      action: 'Immediate attention required - core tracking functionality is compromised',
    });
  }

  if (highAnomalies.length > 2) {
    recommendations.push({
      priority: 'HIGH',
      category: 'System Stability',
      issue: `Multiple high-severity issues (${highAnomalies.length})`,
      action: 'Review TraceLog integration and configuration comprehensively',
    });
  }

  // Memory and performance recommendations
  if (anomalyReport.systemHealth.memoryLeaks) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Performance',
      issue: 'Memory leak indicators detected',
      action: 'Review event listener cleanup and memory management in TraceLog integration',
    });
  }

  if (anomalyReport.systemHealth.performanceIssues.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Performance',
      issue: `Performance issues detected (${anomalyReport.systemHealth.performanceIssues.length})`,
      action: 'Consider optimizing TraceLog configuration or reducing event frequency',
    });
  }

  // Performance recommendations
  if (anomalyReport.summary.executionTime > 60000) {
    // > 1 minute
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Performance',
      issue: 'Test execution time is high',
      action: 'Consider optimizing test setup or parallelization',
    });
  }

  anomalyReport.recommendations = recommendations;
}

async function runTests() {
  console.log('🔍 Running TraceLog Anomaly Detection Tests...');
  testStartTime = Date.now(); // Reset start time

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

    // Display useful summary
    console.log('\n📋 TRACELOG HEALTH REPORT');
    console.log('==========================');
    console.log(`Status: ${getStatusIcon(anomalyReport.overallStatus)} ${anomalyReport.overallStatus}`);
    console.log(
      `Success Rate: ${anomalyReport.summary.successRate} (${anomalyReport.summary.totalTests - anomalyReport.summary.failedTests}/${anomalyReport.summary.totalTests} tests)`,
    );
    console.log(`Execution Time: ${(anomalyReport.summary.executionTime / 1000).toFixed(1)}s`);

    // Only show problems
    if (anomalyReport.summary.failedTests > 0) {
      console.log(`\n❌ FAILED TESTS (${anomalyReport.summary.failedTests}):`);
      anomalyReport.failures.forEach((failure, index) => {
        console.log(`  ${index + 1}. [${failure.browser}] ${failure.testDescription}`);
        if (failure.errorDetails.length > 0) {
          console.log(`     → ${failure.errorDetails[0].type}: ${failure.errorDetails[0].message.substring(0, 80)}...`);
        }
      });
    }

    if (anomalyReport.summary.totalAnomalies > 0) {
      console.log(`\n⚠️  TRACELOG LIBRARY ANOMALIES (${anomalyReport.summary.totalAnomalies}):`);
      anomalyReport.anomalies.forEach((anomaly, index) => {
        console.log(`  ${index + 1}. ${getSeverityIcon(anomaly.severity)} ${anomaly.type}`);
        if (anomaly.impact) console.log(`     Impact: ${anomaly.impact}`);
        if (anomaly.recommendation) console.log(`     Fix: ${anomaly.recommendation}`);
      });
    }

    if (anomalyReport.browserCompatibility.failingBrowsers.length > 0) {
      console.log(`\n🌐 BROWSER ISSUES:`);
      console.log(`  Failing browsers: ${anomalyReport.browserCompatibility.failingBrowsers.join(', ')}`);
    }

    if (anomalyReport.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      anomalyReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        console.log(`     → ${rec.action}`);
      });
    }

    if (anomalyReport.overallStatus === 'HEALTHY') {
      console.log('\n✅ All systems operational - no issues detected');
    }

    console.log(`\n📄 Full report saved: ${REPORT_FILE}`);

    // Exit with appropriate code
    process.exit(anomalyReport.summary.criticalIssues > 0 || anomalyReport.summary.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error running anomaly detection:', error);
    process.exit(1);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'HEALTHY':
      return '✅';
    case 'DEGRADED':
      return '⚠️';
    case 'CRITICAL':
      return '❌';
    default:
      return '❓';
  }
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'CRITICAL':
      return '🔴';
    case 'WARNING':
      return '🟡';
    default:
      return '🔵';
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests, parseTestOutput, generateRecommendations };
