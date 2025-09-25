import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global teardown for TraceLog E2E tests
 *
 * This teardown runs once after all tests complete and handles:
 * - Test artifact cleanup
 * - Summary report generation
 * - Resource cleanup
 * - Final logging
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('🧹 Starting TraceLog E2E Test Suite Global Teardown...');

  try {
    // Generate test summary report
    await generateTestSummary();

    // Clean up temporary files (but preserve important artifacts)
    await cleanupTempFiles();

    // Archive test logs
    await archiveTestLogs();

    // Final validation
    await finalValidation();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown encountered errors:', error);
    // Don't throw error in teardown to avoid masking test results
  }
}

/**
 * Generate a comprehensive test summary report
 */
async function generateTestSummary(): Promise<void> {
  console.log('📊 Generating test summary report...');

  try {
    const summaryData = {
      timestamp: new Date().toISOString(),
      testRun: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      },
      artifacts: await getArtifactSummary(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TRACELOG_TEST_LOG_FILE: process.env.TRACELOG_TEST_LOG_FILE,
      },
    };

    const summaryFile = path.join('test-results', 'test-summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summaryData, null, 2));

    // Also create a human-readable summary
    const readableSummary = [
      '📋 TraceLog E2E Test Suite Summary',
      '='.repeat(50),
      `Completed at: ${summaryData.timestamp}`,
      `Node.js Version: ${summaryData.testRun.nodeVersion}`,
      `Platform: ${summaryData.testRun.platform}`,
      `CI Environment: ${summaryData.testRun.ci ? 'Yes' : 'No'}`,
      `Base URL: ${summaryData.testRun.baseUrl}`,
      '',
      '📁 Generated Artifacts:',
      ...Object.entries(summaryData.artifacts).map(([key, value]) => `   ${key}: ${value}`),
      '',
      '💡 Tip: Check playwright-report/index.html for detailed test results',
      '='.repeat(50),
    ].join('\n');

    await fs.writeFile(path.join('test-results', 'summary.txt'), readableSummary);

    console.log('   📄 Summary saved to test-results/test-summary.json');
    console.log('   📄 Human-readable summary saved to test-results/summary.txt');
  } catch (error) {
    console.warn('⚠️  Could not generate test summary:', error);
  }
}

/**
 * Get summary of generated artifacts
 */
async function getArtifactSummary(): Promise<Record<string, string | number>> {
  const artifacts: Record<string, string | number> = {};

  // Count screenshots
  try {
    const screenshotDir = 'test-results/screenshots';
    const screenshots = await fs.readdir(screenshotDir);
    artifacts.screenshots = screenshots.filter((f) => f.endsWith('.png')).length;
  } catch {
    artifacts.screenshots = 0;
  }

  // Count trace files
  try {
    const traceFiles = await fs.readdir('test-results');
    artifacts.traceFiles = traceFiles.filter((f) => f.endsWith('.zip')).length;
  } catch {
    artifacts.traceFiles = 0;
  }

  // Check for test results JSON
  try {
    await fs.access('playwright-report/test-results.json');
    artifacts.testResultsJson = 'Available';
  } catch {
    artifacts.testResultsJson = 'Not available';
  }

  // Check for HTML report
  try {
    await fs.access('playwright-report/index.html');
    artifacts.htmlReport = 'Available';
  } catch {
    artifacts.htmlReport = 'Not available';
  }

  return artifacts;
}

/**
 * Clean up temporary files but preserve important artifacts
 */
async function cleanupTempFiles(): Promise<void> {
  console.log('🧹 Cleaning up temporary files...');

  // Cleanup patterns for reference (not used in current implementation)
  // const tempPatterns = [
  //   'test-results/screenshots/*.png',
  //   'test-results/*.zip',
  // ];

  let cleanedFiles = 0;

  try {
    // Clean old screenshots (keep only last 50)
    const screenshotDir = 'test-results/screenshots';
    try {
      const screenshots = await fs.readdir(screenshotDir);
      const pngFiles = screenshots.filter((f) => f.endsWith('.png')).map((f) => path.join(screenshotDir, f));

      if (pngFiles.length > 50) {
        // Sort by modification time and keep only the 50 most recent
        const fileStats = await Promise.all(
          pngFiles.map(async (f) => ({
            path: f,
            mtime: (await fs.stat(f)).mtime,
          })),
        );

        fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        const filesToDelete = fileStats.slice(50);

        for (const { path: filePath } of filesToDelete) {
          await fs.unlink(filePath);
          cleanedFiles++;
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not clean screenshot files:', error);
    }

    // Clean old trace files (keep only last 20)
    try {
      const testResultsDir = 'test-results';
      const files = await fs.readdir(testResultsDir);
      const traceFiles = files.filter((f) => f.endsWith('.zip')).map((f) => path.join(testResultsDir, f));

      if (traceFiles.length > 20) {
        const fileStats = await Promise.all(
          traceFiles.map(async (f) => ({
            path: f,
            mtime: (await fs.stat(f)).mtime,
          })),
        );

        fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        const filesToDelete = fileStats.slice(20);

        for (const { path: filePath } of filesToDelete) {
          await fs.unlink(filePath);
          cleanedFiles++;
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not clean trace files:', error);
    }

    if (cleanedFiles > 0) {
      console.log(`   🗑️  Cleaned ${cleanedFiles} old temporary files`);
    }
  } catch (error) {
    console.warn('⚠️  Error during temp file cleanup:', error);
  }
}

/**
 * Archive test logs for future reference
 */
async function archiveTestLogs(): Promise<void> {
  console.log('📦 Archiving test logs...');

  try {
    const logFile = process.env.TRACELOG_TEST_LOG_FILE;
    if (logFile) {
      // Add final log entry
      const finalEntry = [
        '',
        '='.repeat(80),
        `Test suite completed at: ${new Date().toISOString()}`,
        '='.repeat(80),
      ].join('\n');

      await fs.appendFile(logFile, finalEntry);
      console.log(`   📄 Final log entry added to: ${logFile}`);
    }
  } catch (error) {
    console.warn('⚠️  Could not finalize test log:', error);
  }
}

/**
 * Perform final validation of test artifacts
 */
async function finalValidation(): Promise<void> {
  console.log('🔍 Performing final validation...');

  const expectedArtifacts = ['test-results/test-summary.json', 'test-results/summary.txt'];

  for (const artifact of expectedArtifacts) {
    try {
      await fs.access(artifact);
      console.log(`   ✅ ${artifact}`);
    } catch {
      console.log(`   ❌ Missing: ${artifact}`);
    }
  }

  // Check if HTML report exists
  try {
    await fs.access('playwright-report/index.html');
    console.log('   🌐 HTML report available at: playwright-report/index.html');
  } catch {
    console.log('   ⚠️  HTML report not found');
  }
}

export default globalTeardown;
