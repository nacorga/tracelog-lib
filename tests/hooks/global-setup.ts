import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global setup for TraceLog E2E tests
 *
 * This setup runs once before all tests and handles:
 * - Environment validation
 * - Test artifact cleanup
 * - Directory preparation
 * - Global configuration validation
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('🚀 Starting TraceLog E2E Test Suite Global Setup...');

  try {
    // Validate required environment
    validateEnvironment();

    // Setup test directories
    await setupTestDirectories();

    // Validate TraceLog build artifacts
    await validateBuildArtifacts();

    // Setup logging configuration
    await setupLogging();

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Validate that the testing environment is properly configured
 */
function validateEnvironment(): void {
  console.log('📋 Validating test environment...');

  // Check Node.js version
  const nodeVersion = process.version;
  const versionPart = nodeVersion.substring(1).split('.')[0];
  if (!versionPart) {
    throw new Error('Failed to parse Node.js version');
  }
  const majorVersion = parseInt(versionPart);
  if (majorVersion < 16) {
    throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16+`);
  }

  // Validate NODE_ENV
  if (process.env.NODE_ENV !== 'dev' && process.env.NODE_ENV !== 'development') {
    console.warn('⚠️  NODE_ENV is not set to "dev" - some test features may not work correctly');
  }

  // Check if playground server will be available
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`🌐 Test server expected at: ${baseURL}`);

  console.log('✅ Environment validation complete');
}

/**
 * Setup test artifact directories
 */
async function setupTestDirectories(): Promise<void> {
  console.log('📁 Setting up test directories...');

  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/traces',
    'test-results/logs',
    'test-results/reports',
    'playwright-report',
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`   Created: ${dir}`);
    } catch (error) {
      console.warn(`   Warning: Could not create ${dir}:`, error);
    }
  }

  // Create test artifacts cleanup indicator
  const cleanupMarker = path.join('test-results', 'cleanup-required');
  await fs.writeFile(cleanupMarker, new Date().toISOString());

  console.log('✅ Test directories setup complete');
}

/**
 * Validate that TraceLog build artifacts are available
 */
async function validateBuildArtifacts(): Promise<void> {
  console.log('🔧 Validating TraceLog build artifacts...');

  const requiredFiles = ['dist/browser/tracelog.js', 'playground/tracelog.js', 'package.json'];

  const missingFiles: string[] = [];

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`   ✅ Found: ${file}`);
    } catch {
      missingFiles.push(file);
      console.log(`   ❌ Missing: ${file}`);
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ Missing required build artifacts:', missingFiles);
    console.log('💡 Try running: npm run build:browser:dev');
    throw new Error('Required build artifacts are missing. Please run the build process.');
  }

  // Verify playground file is recent (built for testing)
  try {
    const playgroundStats = await fs.stat('playground/tracelog.js');
    const buildStats = await fs.stat('dist/browser/tracelog.js');

    if (playgroundStats.mtime < buildStats.mtime) {
      console.warn('⚠️  playground/tracelog.js appears outdated compared to dist/browser/tracelog.js');
      console.log('💡 Consider running: cp dist/browser/tracelog.js playground/tracelog.js');
    }
  } catch (error) {
    console.warn('⚠️  Could not verify playground file timestamps:', error);
  }

  console.log('✅ Build artifacts validation complete');
}

/**
 * Setup logging configuration for tests
 */
async function setupLogging(): Promise<void> {
  console.log('📝 Setting up test logging...');

  // Create a global test run log
  const testRunId = Date.now().toString();
  const logFile = path.join('test-results', 'logs', `test-run-${testRunId}.log`);

  const logHeader = [
    '='.repeat(80),
    `TraceLog E2E Test Suite - Run ${testRunId}`,
    `Started at: ${new Date().toISOString()}`,
    `Node.js: ${process.version}`,
    `Platform: ${process.platform}`,
    `Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`,
    `CI: ${process.env.CI ? 'true' : 'false'}`,
    '='.repeat(80),
    '',
  ].join('\n');

  try {
    await fs.writeFile(logFile, logHeader);
    process.env.TRACELOG_TEST_LOG_FILE = logFile;
    console.log(`   📄 Test log: ${logFile}`);
  } catch (error) {
    console.warn('⚠️  Could not create test log file:', error);
  }

  console.log('✅ Logging setup complete');
}

export default globalSetup;
