#!/usr/bin/env node

/**
 * CI/CD Health Check Integration Script
 * Optimized for continuous integration environments
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CI_MODE = process.env.CI === 'true';
const GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';
const STRICT_MODE = process.env.TRACELOG_STRICT_MODE === 'true';

console.log('🚀 TraceLog CI/CD Health Check');
console.log('==============================');
console.log(`CI Mode: ${CI_MODE ? '✅' : '❌'}`);
console.log(`GitHub Actions: ${GITHUB_ACTIONS ? '✅' : '❌'}`);
console.log(`Strict Mode: ${STRICT_MODE ? '✅' : '❌'}`);

async function runHealthCheck() {
  try {
    // Import the existing anomaly detection
    const { runTests, parseTestOutput } = require('./test-anomaly-report.js');

    console.log('\n🔍 Executing TraceLog health assessment...');
    const result = await runTests();

    const reportPath = path.join(__dirname, '..', 'test-reports', 'anomaly-report.json');

    if (!fs.existsSync(reportPath)) {
      throw new Error('Health report not generated');
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // CI-specific analysis
    const analysis = analyzeCIHealth(report);

    // Output for GitHub Actions
    if (GITHUB_ACTIONS) {
      outputGitHubActions(analysis);
    }

    // Output for general CI
    outputCIResults(analysis);

    // Determine exit code
    const exitCode = getExitCode(analysis);
    console.log(`\n📊 CI Health Check completed with exit code: ${exitCode}`);

    process.exit(exitCode);
  } catch (error) {
    console.error('❌ CI Health Check failed:', error.message);

    if (GITHUB_ACTIONS) {
      console.log('::error::TraceLog health check execution failed');
    }

    process.exit(1);
  }
}

function analyzeCIHealth(report) {
  const analysis = {
    overall: report.overallStatus,
    canDeploy: false,
    shouldWarn: false,
    criticalCount: report.summary.criticalIssues,
    anomalyCount: report.summary.totalAnomalies,
    successRate: parseFloat(report.summary.successRate),
    recommendations: report.recommendations,
    risks: [],
    blockers: [],
  };

  // Deployment decision logic
  if (report.overallStatus === 'HEALTHY') {
    analysis.canDeploy = true;
  } else if (report.overallStatus === 'DEGRADED' && !STRICT_MODE) {
    analysis.canDeploy = true;
    analysis.shouldWarn = true;
  } else {
    analysis.canDeploy = false;
  }

  // Identify risks and blockers
  report.anomalies.forEach((anomaly) => {
    if (anomaly.severity === 'CRITICAL') {
      analysis.blockers.push({
        type: anomaly.type,
        impact: anomaly.impact,
        fix: anomaly.recommendation,
      });
    } else if (anomaly.severity === 'HIGH') {
      analysis.risks.push({
        type: anomaly.type,
        impact: anomaly.impact,
        fix: anomaly.recommendation,
      });
    }
  });

  // Success rate analysis
  if (analysis.successRate < 95 && STRICT_MODE) {
    analysis.canDeploy = false;
    analysis.blockers.push({
      type: 'Low Success Rate',
      impact: `Success rate (${analysis.successRate}%) below threshold`,
      fix: 'Investigate test failures and improve stability',
    });
  }

  return analysis;
}

function outputGitHubActions(analysis) {
  // Set output variables for GitHub Actions
  console.log(`::set-output name=health-status::${analysis.overall}`);
  console.log(`::set-output name=can-deploy::${analysis.canDeploy}`);
  console.log(`::set-output name=should-warn::${analysis.shouldWarn}`);
  console.log(`::set-output name=critical-count::${analysis.criticalCount}`);
  console.log(`::set-output name=anomaly-count::${analysis.anomalyCount}`);
  console.log(`::set-output name=success-rate::${analysis.successRate}`);

  // Create job summary
  const summary = createJobSummary(analysis);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  // Annotations for issues
  analysis.blockers.forEach((blocker) => {
    console.log(`::error::TraceLog Blocker - ${blocker.type}: ${blocker.impact}`);
  });

  analysis.risks.forEach((risk) => {
    console.log(`::warning::TraceLog Risk - ${risk.type}: ${risk.impact}`);
  });
}

function createJobSummary(analysis) {
  const statusIcon = analysis.overall === 'HEALTHY' ? '✅' : analysis.overall === 'DEGRADED' ? '⚠️' : '❌';

  let summary = `## ${statusIcon} TraceLog Health Check Results

| Metric | Value |
|--------|-------|
| **Overall Status** | ${analysis.overall} |
| **Can Deploy** | ${analysis.canDeploy ? '✅ Yes' : '❌ No'} |
| **Success Rate** | ${analysis.successRate}% |
| **Critical Issues** | ${analysis.criticalCount} |
| **Total Anomalies** | ${analysis.anomalyCount} |

`;

  if (analysis.blockers.length > 0) {
    summary += `### 🚫 Deployment Blockers\n\n`;
    analysis.blockers.forEach((blocker, index) => {
      summary += `${index + 1}. **${blocker.type}**\n`;
      summary += `   - Impact: ${blocker.impact}\n`;
      summary += `   - Fix: ${blocker.fix}\n\n`;
    });
  }

  if (analysis.risks.length > 0) {
    summary += `### ⚠️ Risk Factors\n\n`;
    analysis.risks.forEach((risk, index) => {
      summary += `${index + 1}. **${risk.type}**\n`;
      summary += `   - Impact: ${risk.impact}\n`;
      summary += `   - Fix: ${risk.fix}\n\n`;
    });
  }

  if (analysis.canDeploy && analysis.overall === 'HEALTHY') {
    summary += `### ✅ Deployment Approved\n\nAll health checks passed. Safe to deploy.\n\n`;
  } else if (analysis.canDeploy && analysis.shouldWarn) {
    summary += `### ⚠️ Deployment Approved with Warnings\n\nSome issues detected but not blocking. Monitor after deployment.\n\n`;
  } else {
    summary += `### ❌ Deployment Blocked\n\nCritical issues must be resolved before deployment.\n\n`;
  }

  return summary;
}

function outputCIResults(analysis) {
  console.log('\n📋 CI HEALTH ANALYSIS');
  console.log('=====================');
  console.log(`Overall Status: ${getStatusIcon(analysis.overall)} ${analysis.overall}`);
  console.log(`Deployment: ${analysis.canDeploy ? '✅ APPROVED' : '❌ BLOCKED'}`);
  console.log(`Success Rate: ${analysis.successRate}%`);
  console.log(`Critical Issues: ${analysis.criticalCount}`);
  console.log(`Total Anomalies: ${analysis.anomalyCount}`);

  if (analysis.blockers.length > 0) {
    console.log('\n🚫 DEPLOYMENT BLOCKERS:');
    analysis.blockers.forEach((blocker, index) => {
      console.log(`  ${index + 1}. ${blocker.type}`);
      console.log(`     Impact: ${blocker.impact}`);
      console.log(`     Fix: ${blocker.fix}`);
    });
  }

  if (analysis.risks.length > 0) {
    console.log('\n⚠️ RISK FACTORS:');
    analysis.risks.forEach((risk, index) => {
      console.log(`  ${index + 1}. ${risk.type}`);
      console.log(`     Impact: ${risk.impact}`);
      console.log(`     Fix: ${risk.fix}`);
    });
  }

  if (analysis.shouldWarn) {
    console.log('\n⚠️ DEPLOYMENT WARNING: Monitor closely after deployment');
  }
}

function getExitCode(analysis) {
  if (!analysis.canDeploy) {
    return 1; // Block deployment
  }

  if (analysis.shouldWarn) {
    return 0; // Allow but warn (some CI systems might use 2 for warnings)
  }

  return 0; // Success
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ CI health check interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ CI health check terminated');
  process.exit(143);
});

if (require.main === module) {
  runHealthCheck();
}

module.exports = { runHealthCheck, analyzeCIHealth };
