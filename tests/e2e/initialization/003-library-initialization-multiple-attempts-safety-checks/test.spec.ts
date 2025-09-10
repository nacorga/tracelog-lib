import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Library Initialization - Multiple Attempts and Safety Checks', () => {
  // Constants
  const INITIALIZATION_PAGE_URL = '/';
  const DEFAULT_TEST_CONFIG = { id: 'test' }; // Use 'test' to trigger default config (no network requests)
  const ALTERNATE_CONFIG = { id: 'test', sessionTimeout: 30000 }; // Use 'test' but with valid timeout (30 seconds)
  const COMPLEX_CONFIG = {
    id: 'test',
    sessionTimeout: 45000, // 45 seconds
    globalMetadata: { source: 'e2e-test' },
    errorSampling: 0.5,
  };
  const READY_STATUS_TEXT = 'Status: Ready for testing';
  const INITIALIZED_STATUS_TEXT = 'Status: Initialized successfully';

  // Performance requirements from spec
  const PERFORMANCE_REQUIREMENTS = {
    TOTAL_INITIALIZATION_TIME: 500, // <500ms
    CONFIG_LOADING_TIME: 200, // <200ms
    STORAGE_OPERATIONS_TIME: 100, // <100ms
    HANDLER_REGISTRATION_TIME: 100, // <100ms
    USER_ID_GENERATION_TIME: 50, // <50ms
    SESSION_SETUP_TIME: 50, // <50ms
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to page and wait for ready state
    await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
    await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

    // Verify TraceLog is available globally
    const traceLogAvailable = await TestHelpers.verifyTraceLogAvailability(page);
    expect(traceLogAvailable).toBe(true);
  });

  test('should handle multiple consecutive init() calls with same configuration gracefully and meet performance requirements', async ({
    page,
  }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // First initialization - should succeed and meet performance requirements
      const startTime = Date.now();
      const firstInitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      const validatedFirstResult = TestAssertions.verifyInitializationResult(firstInitResult);
      expect(validatedFirstResult.success).toBe(true);
      expect(validatedFirstResult.hasError).toBe(false);

      // Performance requirement: Total initialization time <500ms
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      // Verify initialization status
      await expect(page.getByTestId('init-status')).toContainText(INITIALIZED_STATUS_TEXT);
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Get initial localStorage state
      const initialStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(initialStorageKeys.length).toBeGreaterThan(0);

      // Multiple consecutive init() calls with same config
      // According to api.ts line 26-28, subsequent init() calls should return successfully when already initialized
      const subsequentAttempts = [];
      for (let i = 0; i < 3; i++) {
        await TestHelpers.waitForTimeout(page, 200);

        const attemptStartTime = Date.now();
        const duplicateInitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
        const attemptDuration = Date.now() - attemptStartTime;

        subsequentAttempts.push(attemptDuration);
        const validatedDuplicateResult = TestAssertions.verifyInitializationResult(duplicateInitResult);

        // Should succeed gracefully (TraceLog.init() returns early if already initialized)
        expect(validatedDuplicateResult.success).toBe(true);
        expect(validatedDuplicateResult.hasError).toBe(false);

        // Subsequent attempts should be faster (should return early)
        expect(attemptDuration).toBeLessThan(100); // Much faster since it returns early

        // Should still report as initialized
        const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
        expect(stillInitialized).toBe(true);

        // Status should remain successful
        await expect(page.getByTestId('init-status')).toContainText(INITIALIZED_STATUS_TEXT);
      }

      // Storage should not have multiplied (no memory leaks)
      const finalStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(finalStorageKeys.length).toBeLessThanOrEqual(initialStorageKeys.length + 2); // Allow some variance

      // Verify no critical errors occurred
      const criticalErrors = monitor.traceLogErrors.filter(
        (error: string) =>
          error.toLowerCase().includes('uncaught') ||
          error.toLowerCase().includes('memory') ||
          error.toLowerCase().includes('handler'),
      );
      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle multiple init() calls with different configurations properly with safety checks', async ({
    page,
  }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // First initialization with default config and performance validation
      const startTime = Date.now();
      const firstInitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      const validatedFirstResult = TestAssertions.verifyInitializationResult(firstInitResult);
      expect(validatedFirstResult.success).toBe(true);

      // Performance validation
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Get initial storage state
      const initialStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);

      // Second initialization with different config
      // According to api.ts, this should succeed (return early) since app is already initialized
      await TestHelpers.waitForTimeout(page, 500);
      const secondStartTime = Date.now();
      const secondInitResult = await TestHelpers.initializeTraceLog(page, ALTERNATE_CONFIG);
      const secondDuration = Date.now() - secondStartTime;

      const validatedSecondResult = TestAssertions.verifyInitializationResult(secondInitResult);

      // Should succeed gracefully (ignores new config since already initialized)
      expect(validatedSecondResult.success).toBe(true);
      expect(validatedSecondResult.hasError).toBe(false);

      // Should be fast since it returns early
      expect(secondDuration).toBeLessThan(100);

      // Should still be initialized
      const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Third initialization with complex config
      await TestHelpers.waitForTimeout(page, 500);
      const thirdStartTime = Date.now();
      const thirdInitResult = await TestHelpers.initializeTraceLog(page, COMPLEX_CONFIG);
      const thirdDuration = Date.now() - thirdStartTime;

      const validatedThirdResult = TestAssertions.verifyInitializationResult(thirdInitResult);

      // Should also succeed gracefully
      expect(validatedThirdResult.success).toBe(true);
      expect(validatedThirdResult.hasError).toBe(false);

      // Should be fast since it returns early
      expect(thirdDuration).toBeLessThan(100);

      // Final state verification
      const finallyInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(finallyInitialized).toBe(true);

      // Storage should not have excessive growth (safety check)
      const finalStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(finalStorageKeys.length).toBeLessThanOrEqual(initialStorageKeys.length + 3);
    } finally {
      monitor.cleanup();
    }
  });

  test('should not create duplicate event handlers during multiple initializations (safety check)', async ({
    page,
  }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initial setup - first initialization with performance tracking
      const startTime = Date.now();
      const firstInitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      expect(TestAssertions.verifyInitializationResult(firstInitResult).success).toBe(true);
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      // Test initial click tracking works
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Get initial event count approximation by checking localStorage
      const initialEvents = await page.evaluate(() => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('tl:')) {
            keys.push(key);
          }
        }
        return keys.length;
      });

      // Multiple re-initializations (should return early and not affect handlers)
      for (let i = 0; i < 3; i++) {
        await TestHelpers.waitForTimeout(page, 300);

        // This should succeed gracefully and not create duplicate handlers
        const reinitStartTime = Date.now();
        const reinitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
        const reinitDuration = Date.now() - reinitStartTime;

        expect(TestAssertions.verifyInitializationResult(reinitResult).success).toBe(true);

        // Should be fast (returns early)
        expect(reinitDuration).toBeLessThan(100);

        // Test click handling after each re-initialization
        await TestHelpers.triggerClickEvent(page, `h1[data-testid="title"]`);
        await TestHelpers.waitForTimeout(page, 500);
      }

      // Final interaction tests
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Verify no excessive storage growth (which would indicate duplicate handlers)
      const finalEvents = await page.evaluate(() => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('tl:')) {
            keys.push(key);
          }
        }
        return keys.length;
      });

      // Should not have exponential growth of stored data (safety check)
      expect(finalEvents).toBeLessThan(initialEvents * 3); // Reasonable upper bound

      // Verify no handler-related errors (safety check)
      const handlerErrors = monitor.traceLogErrors.filter(
        (error: string) =>
          error.toLowerCase().includes('handler') ||
          error.toLowerCase().includes('listener') ||
          error.toLowerCase().includes('duplicate'),
      );
      expect(handlerErrors).toHaveLength(0);

      // Verify no runtime errors occurred
      const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);
      expect(hasRuntimeErrors).toBeFalsy();
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain existing tracking functionality after multiple initializations with performance validation', async ({
    page,
  }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initial initialization with performance tracking
      const startTime = Date.now();
      const initResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      // Test initial functionality
      const initialCustomEventResult = await TestHelpers.testCustomEvent(page, 'initial_test', { phase: 'initial' });
      expect(TestAssertions.verifyInitializationResult(initialCustomEventResult).success).toBe(true);

      // Perform several re-initializations
      const configs = [DEFAULT_TEST_CONFIG, ALTERNATE_CONFIG, DEFAULT_TEST_CONFIG];

      for (let i = 0; i < configs.length; i++) {
        await TestHelpers.waitForTimeout(page, 400);

        // Re-initialize (should succeed gracefully) with performance tracking
        const reinitStartTime = Date.now();
        const reinitResult = await TestHelpers.initializeTraceLog(page, configs[i]);
        const reinitDuration = Date.now() - reinitStartTime;

        expect(TestAssertions.verifyInitializationResult(reinitResult).success).toBe(true);

        // Should be fast (returns early)
        expect(reinitDuration).toBeLessThan(100);

        // Test that tracking still works
        const customEventResult = await TestHelpers.testCustomEvent(page, `reinit_test_${i}`, {
          phase: `reinit_${i}`,
          config: configs[i].id,
        });

        // Custom events should work since initialization succeeded
        const isStillInitialized = await TestHelpers.isTraceLogInitialized(page);
        expect(isStillInitialized).toBe(true);
        expect(TestAssertions.verifyInitializationResult(customEventResult).success).toBe(true);

        // Test DOM event tracking
        await TestHelpers.triggerClickEvent(page);
        await TestHelpers.triggerScrollEvent(page);
        await TestHelpers.waitForTimeout(page, 300);
      }

      // Final functionality test
      const finalCustomEventResult = await TestHelpers.testCustomEvent(page, 'final_test', { phase: 'final' });
      expect(TestAssertions.verifyInitializationResult(finalCustomEventResult).success).toBe(true);

      // Verify API methods still work
      const functionalityTests = await page.evaluate(() => {
        const results: any = {};

        try {
          // Test isInitialized method
          results.isInitialized = (window as any).TraceLog.isInitialized();
        } catch (error: any) {
          results.isInitialized = false;
          results.isInitializedError = error.message;
        }

        try {
          // Test custom events functionality
          (window as any).TraceLog.event('final_api_test', { method: 'direct_call' });
          results.customEvents = true;
        } catch (error: any) {
          results.customEvents = false;
          results.customEventsError = error.message;
        }

        return results;
      });

      expect(functionalityTests.isInitialized).toBe(true);
      expect(functionalityTests.customEvents).toBe(true);

      // Verify no critical tracking errors
      const trackingErrors = monitor.traceLogErrors.filter(
        (error: string) => error.toLowerCase().includes('track') && error.toLowerCase().includes('fail'),
      );
      expect(trackingErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate memory management during repeated re-initialization attempts (safety check)', async ({
    page,
  }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initial state
      const initialMemoryState = await page.evaluate(() => ({
        localStorageLength: localStorage.length,
        documentListeners: document.querySelectorAll('*').length, // Rough approximation
        windowKeys: Object.keys(window).filter((key) => key.includes('tl') || key.includes('TraceLog')).length,
      }));

      // Perform initial initialization with performance tracking
      const startTime = Date.now();
      const initResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      const postInitMemoryState = await page.evaluate(() => ({
        localStorageLength: localStorage.length,
        documentListeners: document.querySelectorAll('*').length,
        windowKeys: Object.keys(window).filter((key) => key.includes('tl') || key.includes('TraceLog')).length,
      }));

      // Perform multiple re-initialization attempts (stress test)
      for (let i = 0; i < 10; i++) {
        await TestHelpers.waitForTimeout(page, 100);

        // Try various configurations (should all succeed gracefully)
        const config = i % 2 === 0 ? DEFAULT_TEST_CONFIG : ALTERNATE_CONFIG;
        const reinitStartTime = Date.now();
        const reinitResult = await TestHelpers.initializeTraceLog(page, config);
        const reinitDuration = Date.now() - reinitStartTime;

        expect(TestAssertions.verifyInitializationResult(reinitResult).success).toBe(true);

        // Should be fast (returns early) - performance validation
        expect(reinitDuration).toBeLessThan(100);

        // Quick interaction to trigger handlers
        if (i % 3 === 0) {
          await TestHelpers.triggerClickEvent(page);
        }
      }

      // Final memory state check
      const finalMemoryState = await page.evaluate(() => ({
        localStorageLength: localStorage.length,
        documentListeners: document.querySelectorAll('*').length,
        windowKeys: Object.keys(window).filter((key) => key.includes('tl') || key.includes('TraceLog')).length,
        traceLogKeys: Object.keys(localStorage).filter((key) => key.startsWith('tl:')).length,
      }));

      // Memory usage should not have grown excessively (safety check)
      expect(finalMemoryState.localStorageLength).toBeLessThan(initialMemoryState.localStorageLength + 20);
      expect(finalMemoryState.windowKeys).toBeLessThan(postInitMemoryState.windowKeys + 5);
      expect(finalMemoryState.traceLogKeys).toBeLessThan(15); // Reasonable upper bound

      // Verify no memory-related errors
      const memoryErrors = monitor.traceLogErrors.filter(
        (error: string) =>
          error.toLowerCase().includes('memory') ||
          error.toLowerCase().includes('leak') ||
          error.toLowerCase().includes('overflow'),
      );
      expect(memoryErrors).toHaveLength(0);

      // Verify system is still responsive
      const isStillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isStillInitialized).toBe(true);

      // Final functionality test
      const finalTest = await TestHelpers.testCustomEvent(page, 'memory_test_final', { test: 'memory_management' });
      expect(TestAssertions.verifyInitializationResult(finalTest).success).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should properly handle rapid consecutive initialization attempts with safety checks', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Rapid-fire initialization attempts (race condition testing)
      const rapidInitPromises: Promise<any>[] = [];

      // Create multiple concurrent initialization attempts
      for (let i = 0; i < 5; i++) {
        // Use 'test' to avoid network requests, but vary sessionTimeout (30000ms minimum)
        const config = { id: 'test', sessionTimeout: 30000 + i * 1000 };
        rapidInitPromises.push(
          page.evaluate(async (cfg) => {
            try {
              const startTime = Date.now();
              const result = await (window as any).initializeTraceLog(cfg);
              const duration = Date.now() - startTime;
              return { ...result, duration };
            } catch (error: any) {
              return { success: false, error: error.message, duration: 0 };
            }
          }, config),
        );
      }

      // Wait for all attempts to complete
      const rapidResults = await Promise.all(rapidInitPromises);

      // Handle race condition results with safety checks:
      // - At least one should succeed
      // - Others either succeed (if after first completed) or fail with "initialization in progress"
      const successCount = rapidResults.filter((r) => r.success).length;
      const allHaveResults = rapidResults.every((r) => Object.prototype.hasOwnProperty.call(r, 'success'));

      expect(allHaveResults).toBe(true);
      expect(successCount).toBeGreaterThanOrEqual(1); // At least one should succeed

      // Performance validation for successful attempts
      const successfulAttempts = rapidResults.filter((r) => r.success);
      if (successfulAttempts.length > 0) {
        // First successful attempt should meet performance requirements
        const firstSuccessful = successfulAttempts[0];
        expect(firstSuccessful.duration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

        // Subsequent successful attempts should be faster (return early)
        if (successfulAttempts.length > 1) {
          const subsequentAttempts = successfulAttempts.slice(1);
          subsequentAttempts.forEach((attempt) => {
            expect(attempt.duration).toBeLessThan(100); // Much faster
          });
        }
      }

      // Failed ones should have appropriate error message about initialization in progress
      const failedResults = rapidResults.filter((r) => !r.success);
      if (failedResults.length > 0) {
        failedResults.forEach((result) => {
          expect(result.error).toMatch(/initialization is already in progress/i);
        });
      }

      // System should still be in valid state (safety check)
      const isStillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isStillInitialized).toBe(true);

      // Should be able to track events after rapid initialization
      await TestHelpers.waitForTimeout(page, 500);
      const postRapidEventResult = await TestHelpers.testCustomEvent(page, 'post_rapid_test', {
        rapidAttempts: rapidResults.length,
        successfulRapid: successCount,
      });

      expect(TestAssertions.verifyInitializationResult(postRapidEventResult).success).toBe(true);

      // Verify no unexpected race condition errors (safety check)
      const unexpectedRaceErrors = monitor.traceLogErrors.filter(
        (error: string) =>
          (error.toLowerCase().includes('race') ||
            error.toLowerCase().includes('concurrent') ||
            error.toLowerCase().includes('conflict')) &&
          !error.toLowerCase().includes('initialization is already in progress') &&
          !error.toLowerCase().includes('app initialization is already in progress'),
      );
      expect(unexpectedRaceErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });
});
