import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../utils/test.helpers';
import {
  InitializationTestBase,
  InitializationScenarios,
  TEST_CONFIGS,
  TEST_CONSTANTS,
  PerformanceValidator,
  SessionValidator,
  MemoryTestUtils,
} from '../../utils/initialization/test.helpers';

test.describe('Library Initialization - Multiple Attempts and Safety Checks', () => {
  let testBase: InitializationTestBase;

  test.beforeEach(async ({ page }) => {
    testBase = new InitializationTestBase(page);
    await testBase.setup();
  });

  test.afterEach(() => {
    testBase?.cleanup();
  });

  test('should handle multiple consecutive init() calls with same configuration gracefully and meet performance requirements', async ({
    page,
  }) => {
    // First initialization
    await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);
    await expect(page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.INITIALIZED);
    await SessionValidator.validateSessionState(page);

    // Get initial storage state
    const initialStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(initialStorageKeys.length).toBeGreaterThan(0);

    // Multiple consecutive attempts with same config
    const subsequentResults: Array<{ duration: number; success: boolean }> = [];
    for (let i = 0; i < 3; i++) {
      await TestHelpers.waitForTimeout(page, 200);

      const startTime = Date.now();
      const duplicateInitResult = await TestHelpers.initializeTraceLog(page);
      const duration = Date.now() - startTime;

      const validatedResult = TestAssertions.verifyInitializationResult(duplicateInitResult);

      if (!validatedResult.success) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Multiple init attempt ${i} failed: ${JSON.stringify(duplicateInitResult)}`,
        );
      }
      if (validatedResult.hasError) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Multiple init attempt ${i} has unexpected error: ${JSON.stringify(duplicateInitResult)}`,
        );
      }

      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Subsequent attempts should be faster
      PerformanceValidator.validateInitializationTime(duration, true);
      subsequentResults.push({ duration, success: true });

      // Verify state consistency
      const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);
      await expect(page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.INITIALIZED);
    }

    // Validate memory management
    await SessionValidator.validateMemoryManagement(page, initialStorageKeys.length, 2);

    // Verify no critical errors
    const criticalErrorPatterns = ['uncaught', 'memory', 'handler'];
    const criticalErrors = testBase.consoleMonitor.traceLogErrors.filter((error: string) =>
      criticalErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern)),
    );

    if (criticalErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Critical errors detected during multiple init attempts: ${criticalErrors.join(', ')}`,
      );
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle multiple init() calls with different configurations properly with safety checks', async ({
    page,
  }) => {
    // Test multiple configurations using centralized scenario
    const configs = [TEST_CONFIGS.DEFAULT, TEST_CONFIGS.ALTERNATE, TEST_CONFIGS.COMPLEX];
    await InitializationScenarios.testMultipleInitAttempts(testBase, configs);

    // Final state verification
    const finallyInitialized = await TestHelpers.isTraceLogInitialized(page);
    expect(finallyInitialized).toBe(true);

    // Validate memory management
    const initialStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(initialStorageKeys.length).toBeGreaterThan(0);
  });

  test('should not create duplicate event handlers during multiple initializations (safety check)', async ({
    page,
  }) => {
    // Initial setup and first initialization
    await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);

    // Test initial interaction works
    await TestHelpers.triggerClickEvent(page);
    await TestHelpers.waitForTimeout(page, 1000);

    // Get initial event count
    const initialEvents = await TestHelpers.getTraceLogStorageKeys(page);
    const initialEventCount = initialEvents.length;

    // Multiple re-initializations (should not create duplicate handlers)
    for (let i = 0; i < 3; i++) {
      await TestHelpers.waitForTimeout(page, 300);

      const startTime = Date.now();
      const reinitResult = await TestHelpers.initializeTraceLog(page);
      const duration = Date.now() - startTime;

      const validatedReinitResult = TestAssertions.verifyInitializationResult(reinitResult);

      if (!validatedReinitResult.success) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Re-initialization ${i} failed: ${JSON.stringify(reinitResult)}`,
        );
      }

      expect(validatedReinitResult.success).toBe(true);

      try {
        PerformanceValidator.validateInitializationTime(duration, true);
      } catch (error) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Performance validation failed for re-initialization ${i}: ${error}`,
        );
        throw error;
      }

      // Test interaction after each re-initialization
      await TestHelpers.triggerClickEvent(page, `h1[data-testid="title"]`);
      await TestHelpers.waitForTimeout(page, 500);
    }

    // Final interaction tests
    await testBase.testBasicFunctionality();
    await TestHelpers.waitForTimeout(page, 1000);

    // Verify no excessive storage growth
    await SessionValidator.validateMemoryManagement(page, initialEventCount, 10);

    // Verify no handler-related errors
    const handlerErrorPatterns = ['handler', 'listener', 'duplicate'];
    const handlerErrors = testBase.consoleMonitor.traceLogErrors.filter((error: string) =>
      handlerErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern)),
    );

    if (handlerErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Handler errors detected during event handler safety checks: ${handlerErrors.join(', ')}`,
      );
    }

    expect(handlerErrors).toHaveLength(0);

    // Verify no runtime errors occurred
    const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);

    if (hasRuntimeErrors) {
      testBase.consoleMonitor.traceLogErrors.push(
        '[E2E Test] Runtime errors detected during event handler safety checks',
      );
    }

    expect(hasRuntimeErrors).toBeFalsy();
  });

  test('should maintain existing tracking functionality after multiple initializations with performance validation', async ({
    page,
  }) => {
    // Initial initialization and functionality test
    await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);
    const initialCustomEventResult = await TestHelpers.testCustomEvent(page, 'initial_test', { phase: 'initial' });
    expect(TestAssertions.verifyInitializationResult(initialCustomEventResult).success).toBe(true);

    // Test multiple re-initializations with different configs
    const configs = [TEST_CONFIGS.DEFAULT, TEST_CONFIGS.ALTERNATE, TEST_CONFIGS.DEFAULT];

    for (let i = 0; i < configs.length; i++) {
      await TestHelpers.waitForTimeout(page, 400);

      // Re-initialize with performance tracking
      const startTime = Date.now();
      const reinitResult = await TestHelpers.initializeTraceLog(page, configs[i]);
      const duration = Date.now() - startTime;

      const validatedReinitResult = TestAssertions.verifyInitializationResult(reinitResult);

      if (!validatedReinitResult.success) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Re-initialization ${i} failed: ${JSON.stringify(reinitResult)}`,
        );
      }

      expect(validatedReinitResult.success).toBe(true);

      try {
        PerformanceValidator.validateInitializationTime(duration, true);
      } catch (error) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Performance validation failed for re-initialization ${i}: ${error}`,
        );
        throw error;
      }

      // Test functionality preservation
      const customEventResult = await TestHelpers.testCustomEvent(page, `reinit_test_${i}`, {
        phase: `reinit_${i}`,
        config: configs[i].id,
      });
      expect(TestAssertions.verifyInitializationResult(customEventResult).success).toBe(true);

      // Verify state consistency
      await SessionValidator.validateSessionState(page);
      await testBase.testBasicFunctionality();
      await TestHelpers.waitForTimeout(page, 300);
    }

    // Final comprehensive functionality test
    const finalCustomEventResult = await TestHelpers.testCustomEvent(page, 'final_test', { phase: 'final' });
    expect(TestAssertions.verifyInitializationResult(finalCustomEventResult).success).toBe(true);

    await SessionValidator.validateFunctionalityPreservation(page);

    // Verify no critical tracking errors
    const trackingErrors = testBase.consoleMonitor.traceLogErrors.filter(
      (error: string) => error.toLowerCase().includes('track') && error.toLowerCase().includes('fail'),
    );

    if (trackingErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Tracking errors detected during functionality preservation test: ${trackingErrors.join(', ')}`,
      );
    }

    expect(trackingErrors).toHaveLength(0);
  });

  test('should validate memory management during repeated re-initialization attempts (safety check)', async ({
    page,
  }) => {
    // Get baseline memory state
    const initialMemoryState = await MemoryTestUtils.getMemoryBaseline(page);

    // Initial initialization
    await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);

    // Perform multiple re-initialization attempts (stress test)
    for (let i = 0; i < 10; i++) {
      await TestHelpers.waitForTimeout(page, 100);

      // Alternate configurations
      const config = i % 2 === 0 ? TEST_CONFIGS.DEFAULT : TEST_CONFIGS.ALTERNATE;
      const startTime = Date.now();
      const reinitResult = await TestHelpers.initializeTraceLog(page, config);
      const duration = Date.now() - startTime;

      const validatedReinitResult = TestAssertions.verifyInitializationResult(reinitResult);

      if (!validatedReinitResult.success) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Re-initialization ${i} failed: ${JSON.stringify(reinitResult)}`,
        );
      }

      expect(validatedReinitResult.success).toBe(true);

      try {
        PerformanceValidator.validateInitializationTime(duration, true);
      } catch (error) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Performance validation failed for re-initialization ${i}: ${error}`,
        );
        throw error;
      }

      // Periodic interaction to trigger handlers
      if (i % 3 === 0) {
        await TestHelpers.triggerClickEvent(page);
      }
    }

    // Validate final memory usage
    await MemoryTestUtils.validateMemoryUsage(page, initialMemoryState, {
      storage: 20,
      listeners: 100,
      windowKeys: 5,
    });

    // Verify no memory-related errors
    const memoryErrorPatterns = ['memory', 'leak', 'overflow'];
    const memoryErrors = testBase.consoleMonitor.traceLogErrors.filter((error: string) =>
      memoryErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern)),
    );

    if (memoryErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Memory errors detected during memory management test: ${memoryErrors.join(', ')}`,
      );
    }

    expect(memoryErrors).toHaveLength(0);

    // Verify system responsiveness
    await SessionValidator.validateSessionState(page);
    const finalTest = await TestHelpers.testCustomEvent(page, 'memory_test_final', { test: 'memory_management' });
    expect(TestAssertions.verifyInitializationResult(finalTest).success).toBe(true);
  });

  test('should properly handle rapid consecutive initialization attempts with safety checks', async ({ page }) => {
    // Test rapid concurrent initialization using centralized scenario
    await InitializationScenarios.testRapidConcurrentInit(testBase, 5);

    // System should be in valid state after rapid attempts
    await SessionValidator.validateSessionState(page);

    // Should be able to track events after rapid initialization
    await TestHelpers.waitForTimeout(page, 500);
    const postRapidEventResult = await TestHelpers.testCustomEvent(page, 'post_rapid_test', {
      testType: 'rapid_concurrent_init',
    });
    expect(TestAssertions.verifyInitializationResult(postRapidEventResult).success).toBe(true);

    // Verify no unexpected race condition errors
    const allowedRacePatterns = ['initialization is already in progress', 'app initialization is already in progress'];
    const raceErrors = testBase.consoleMonitor.traceLogErrors.filter((error: string) => {
      const hasRaceKeywords = ['race', 'concurrent', 'conflict'].some((keyword) =>
        error.toLowerCase().includes(keyword),
      );
      const isAllowedError = allowedRacePatterns.some((pattern) => error.toLowerCase().includes(pattern));
      return hasRaceKeywords && !isAllowedError;
    });

    if (raceErrors.length > 0) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Unexpected race condition errors detected during rapid init test: ${raceErrors.join(', ')}`,
      );
    }

    expect(raceErrors).toHaveLength(0);
  });
});
