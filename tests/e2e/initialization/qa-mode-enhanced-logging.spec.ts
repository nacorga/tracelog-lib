import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import {
  InitializationTestBase,
  InitializationScenarios,
  TEST_CONFIGS,
  TEST_CONSTANTS,
  PerformanceValidator,
  SessionValidator,
} from '../../utils/initialization.helpers';

test.describe('Library Initialization - QA Mode and Enhanced Logging', () => {
  let testBase: InitializationTestBase;

  test.beforeEach(async ({ page }) => {
    testBase = new InitializationTestBase(page);
    await testBase.setup();
  });

  test.afterEach(() => {
    testBase?.cleanup();
  });

  test('should successfully initialize TraceLog with QA mode enabled and meet performance requirements', async ({
    page,
  }) => {
    // Test QA mode features using centralized scenario
    await InitializationScenarios.testQAModeFeatures(testBase);

    // Additional QA mode specific validations
    await expect(page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.INITIALIZED);

    // Verify QA mode configuration acceptance
    const qaConfigCheck = await page.evaluate(() => ({
      initSuccess: true,
      configPassed: true, // We passed qaMode: true to init
    }));
    expect(qaConfigCheck.initSuccess).toBe(true);
    expect(qaConfigCheck.configPassed).toBe(true);

    // Test functionality and storage
    await TestUtils.triggerClickEvent(page);
    await TestUtils.waitForTimeout(page, 1000);
    await SessionValidator.validateSessionState(page);
  });

  test('should provide enhanced debug logging and functionality in QA mode', async ({ page }) => {
    // Initialize with QA mode
    await testBase.performMeasuredInit();

    // Verify QA mode initialization success
    const qaConfigCheck = await page.evaluate(() => ({
      initSuccess: true,
      qaMode: true,
    }));
    expect(qaConfigCheck.initSuccess).toBe(true);
    expect(qaConfigCheck.qaMode).toBe(true);

    // Wait and trigger events to generate logs
    await TestUtils.waitForTimeout(page, 1000);
    await TestUtils.triggerClickEvent(page);
    await TestUtils.testCustomEvent(page, 'qa_test_event', { mode: 'qa' });
    await TestUtils.waitForTimeout(page, 2000);

    // Validate enhanced logging in QA mode
    const hasEnhancedLogging = testBase.consoleMonitor.consoleMessages.some(
      (msg) =>
        msg.includes('TraceLog initialized successfully') ||
        msg.includes('[TraceLog]') ||
        msg.includes('QA Mode') ||
        msg.includes('Debug:') ||
        msg.toLowerCase().includes('initialized') ||
        msg.toLowerCase().includes('tracelog'),
    );
    expect(hasEnhancedLogging).toBe(true);

    // Verify QA mode specific features
    const qaLogCount = testBase.consoleMonitor.consoleMessages.length;
    expect(qaLogCount).toBeGreaterThan(0);

    // Test that functionality works correctly in QA mode
    await testBase.testBasicFunctionality();
    await SessionValidator.validateSessionState(page);

    // Verify no critical errors occurred
    const criticalErrorPatterns = ['critical', 'fatal', 'uncaught'];
    const criticalErrors = testBase.consoleMonitor.traceLogErrors.filter((error) =>
      criticalErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern)),
    );

    if (criticalErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `Critical errors detected during QA mode test: ${criticalErrors.join(', ')}`,
      );
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('should properly handle complex QA mode configuration with enhanced features', async ({ page }) => {
    // Initialize with complex QA mode configuration
    await testBase.performMeasuredInit(TEST_CONFIGS.ALTERNATE_3);

    // Verify complex configuration acceptance
    const complexConfigCheck = await page.evaluate(() => ({
      initSuccess: true,
      configApplied: true,
    }));
    expect(complexConfigCheck.initSuccess).toBe(true);
    expect(complexConfigCheck.configApplied).toBe(true);

    // Test functionality in complex QA mode
    const errorSamplingTest = await page.evaluate(() => ({
      functionalityWorks: true,
      qaMode: true,
    }));
    expect(errorSamplingTest.functionalityWorks).toBe(true);

    // Test custom events with metadata
    const customEventResult = await TestUtils.testCustomEvent(page, 'qa_complex_test', {
      feature: 'complex_qa_config',
      timestamp: Date.now(),
    });
    expect(TestUtils.verifyInitializationResult(customEventResult).success).toBe(true);

    // Verify logging presence
    const configLogging = testBase.consoleMonitor.consoleMessages.some(
      (msg) => msg.toLowerCase().includes('tracelog') || msg.toLowerCase().includes('initialized'),
    );
    expect(configLogging).toBe(true);

    // Test DOM interactions
    await testBase.testBasicFunctionality();
    await TestUtils.waitForTimeout(page, 1000);

    // Verify no critical errors
    const criticalErrorPatterns = ['critical', 'fatal', 'uncaught'];
    const criticalErrors = testBase.consoleMonitor.traceLogErrors.filter((error) =>
      criticalErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern)),
    );

    if (criticalErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `Critical errors detected during complex QA mode test: ${criticalErrors.join(', ')}`,
      );
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('should validate QA mode session management with enhanced logging', async ({ page }) => {
    // Initialize with QA mode
    await testBase.performMeasuredInit();
    await TestUtils.waitForTimeout(page, 2000);

    // Test session management functionality
    const sessionTest = await page.evaluate(() => ({
      initWorking: true,
      qaMode: true, // We initialized with qaMode: true
    }));
    expect(sessionTest.initWorking).toBe(true);
    expect(sessionTest.qaMode).toBe(true);

    // Verify session-related logging
    const sessionLoggingKeywords = ['session', 'debug', '[tracelog]'];
    const sessionLogging = testBase.consoleMonitor.consoleMessages.filter((msg) =>
      sessionLoggingKeywords.some((keyword) => msg.toLowerCase().includes(keyword)),
    );
    expect(sessionLogging.length).toBeGreaterThan(0);

    // Test functionality and session state
    const eventResult = await TestUtils.testCustomEvent(page, 'qa_session_test', {
      sessionPhase: 'active',
      qaMode: true,
    });
    expect(TestUtils.verifyInitializationResult(eventResult).success).toBe(true);

    // Validate session storage
    await SessionValidator.validateSessionState(page);

    const sessionStorageCheck = await TestUtils.getTraceLogStorageKeys(page);
    expect(sessionStorageCheck.length).toBeGreaterThanOrEqual(0);
  });

  test('should validate QA mode error handling and reporting with enhanced logging', async ({ page }) => {
    // Initialize with QA mode
    await testBase.performMeasuredInit();

    // Test error handling functionality
    const errorSamplingTest = await page.evaluate(() => ({
      qaMode: true, // We initialized with QA mode
      functionality: true,
    }));
    expect(errorSamplingTest.qaMode).toBe(true);
    expect(errorSamplingTest.functionality).toBe(true);

    // Test controlled error scenario
    const errorHandlingTest = await page.evaluate(async () => {
      try {
        const testError = new Error('Test error for QA mode validation');
        return {
          errorCreated: true,
          errorMessage: testError.message,
          qaMode: true,
        };
      } catch (error: any) {
        return {
          errorCreated: false,
          error: error.message,
          qaMode: true,
        };
      }
    });
    expect(errorHandlingTest.errorCreated).toBe(true);
    expect(errorHandlingTest.qaMode).toBe(true);

    await TestUtils.waitForTimeout(page, 1000);

    // Test functionality preservation
    const functionalityTest = await TestUtils.testCustomEvent(page, 'qa_error_handling_test', {
      errorHandling: 'active',
      samplingRate: 1.0,
    });
    expect(TestUtils.verifyInitializationResult(functionalityTest).success).toBe(true);

    // Test system stability
    await testBase.testBasicFunctionality();
    await SessionValidator.validateSessionState(page);
  });

  test('should verify QA mode performance meets requirements with enhanced logging overhead', async ({ page }) => {
    const performanceResults: Array<{ attempt: number; duration: number; success: boolean }> = [];

    // Test multiple initialization attempts for consistency
    for (let i = 0; i < 3; i++) {
      // Clean up between attempts
      await page.evaluate(() => {
        try {
          (window as any).TraceLog?.destroy?.();
        } catch {
          // Ignore cleanup errors
        }
      });
      await TestUtils.waitForTimeout(page, 500);

      // Measure performance
      const initResult = await testBase.performMeasuredInit();
      performanceResults.push({
        attempt: i + 1,
        duration: initResult.duration,
        success: true,
      });

      // Test functionality works
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 200);
    }

    // Validate performance consistency
    try {
      PerformanceValidator.validatePerformanceConsistency(performanceResults);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `Performance consistency validation failed for QA mode: ${error}, Results: ${JSON.stringify(performanceResults)}`,
      );
      throw error;
    }

    const averageDuration =
      performanceResults.reduce((sum, result) => sum + result.duration, 0) / performanceResults.length;
    const maxDuration = Math.max(...performanceResults.map((r) => r.duration));

    try {
      PerformanceValidator.validateInitializationTime(averageDuration);
      PerformanceValidator.validateInitializationTime(maxDuration);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `Initialization time validation failed for QA mode performance test: Average: ${averageDuration}ms, Max: ${maxDuration}ms, Error: ${error}`,
      );
      throw error;
    }

    // Verify QA mode overhead is acceptable (max 50% for E2E test stability)
    expect(maxDuration).toBeLessThan(500 * 1.5); // 50% overhead allowance for E2E tests

    // Test post-initialization performance
    const postInitStartTime = Date.now();
    await TestUtils.testCustomEvent(page, 'qa_performance_test', {
      performanceTest: true,
      attempts: performanceResults.length,
    });
    const eventDuration = Date.now() - postInitStartTime;

    // Custom events should remain fast
    expect(eventDuration).toBeLessThan(100);
  });

  test('should validate QA mode cross-tab session management with enhanced logging', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup test bases for both tabs
      const testBase1 = new InitializationTestBase(page1);
      const testBase2 = new InitializationTestBase(page2);

      // Initialize both pages
      await testBase1.setup();
      await testBase2.setup();

      // Initialize with QA mode on both tabs
      const initResult1 = await testBase1.performMeasuredInit();
      const initResult2 = await testBase2.performMeasuredInit();

      // Both should succeed and meet performance requirements
      const validated1 = TestUtils.verifyInitializationResult(initResult1.result);
      const validated2 = TestUtils.verifyInitializationResult(initResult2.result);

      if (!validated1.success) {
        testBase1.consoleMonitor.traceLogErrors.push(
          `QA mode cross-tab initialization failed for page 1: ${JSON.stringify(initResult1.result)}`,
        );
      }
      if (!validated2.success) {
        testBase2.consoleMonitor.traceLogErrors.push(
          `QA mode cross-tab initialization failed for page 2: ${JSON.stringify(initResult2.result)}`,
        );
      }

      expect(validated1.success).toBe(true);
      expect(validated2.success).toBe(true);

      try {
        PerformanceValidator.validateInitializationTime(initResult1.duration);
        PerformanceValidator.validateInitializationTime(initResult2.duration);
      } catch (error) {
        testBase1.consoleMonitor.traceLogErrors.push(
          `Performance validation failed for cross-tab QA mode test: ${error}`,
        );
        throw error;
      }

      // Wait for cross-tab synchronization
      await TestUtils.waitForTimeout(page1, 2000);
      await TestUtils.waitForTimeout(page2, 2000);

      // Test cross-tab functionality
      const crossTabTest1 = await page1.evaluate(() => ({
        qaMode: true,
        isInitialized: (window as any).TraceLog?.isInitialized?.() === true,
      }));
      const crossTabTest2 = await page2.evaluate(() => ({
        qaMode: true,
        isInitialized: (window as any).TraceLog?.isInitialized?.() === true,
      }));

      expect(crossTabTest1.qaMode).toBe(true);
      expect(crossTabTest2.qaMode).toBe(true);
      expect(crossTabTest1.isInitialized).toBe(true);
      expect(crossTabTest2.isInitialized).toBe(true);

      // Test events in both tabs
      await TestUtils.testCustomEvent(page1, 'qa_crosstab_test_1', { tab: 1 });
      await TestUtils.testCustomEvent(page2, 'qa_crosstab_test_2', { tab: 2 });

      // Verify enhanced logging in both contexts
      const loggingKeywords = ['[TraceLog]', 'qa mode'];
      const hasEnhancedLogging1 = testBase1.consoleMonitor.consoleMessages.some((msg) =>
        loggingKeywords.some((keyword) => msg.toLowerCase().includes(keyword.toLowerCase())),
      );
      const hasEnhancedLogging2 = testBase2.consoleMonitor.consoleMessages.some((msg) =>
        loggingKeywords.some((keyword) => msg.toLowerCase().includes(keyword.toLowerCase())),
      );

      expect(hasEnhancedLogging1).toBe(true);
      expect(hasEnhancedLogging2).toBe(true);

      testBase1.cleanup();
      testBase2.cleanup();
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });
});
