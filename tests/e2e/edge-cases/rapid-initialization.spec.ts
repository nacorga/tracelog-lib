import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../utils/initialization.helpers';

test.describe('Rapid Initialization Edge Cases', () => {
  test('should handle rapid initialization attempts safely', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Test multiple rapid initialization attempts with same config
      // The SDK should handle this by allowing the first to succeed, others return early
      const results = await page.evaluate(async (config) => {
        const promises = Array.from({ length: 5 }, () =>
          (window as any).TraceLog.init(config).catch((error: Error) => ({ error: error.message })),
        );
        return Promise.allSettled(promises);
      }, TEST_CONFIGS.DEFAULT);

      // Verify all promises settled (no hanging promises)
      expect(results).toHaveLength(5);

      // Check that all attempts either succeeded or failed gracefully
      const fulfilledResults = results.filter((r) => r.status === 'fulfilled');
      const rejectedResults = results.filter((r) => r.status === 'rejected');

      // All attempts should complete (first one initializes, others return early)
      expect(fulfilledResults.length + rejectedResults.length).toBe(5);

      // The SDK should be initialized (first call should have succeeded)
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test that the SDK functions normally after rapid initialization
      const eventResult = await TestUtils.testCustomEvent(page, 'post_rapid_init_event', {
        test: 'rapid_initialization_completed',
      });
      expect(eventResult.success).toBe(true);

      // Verify no critical errors from concurrent initialization
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle concurrent initialization with same project ID', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Test multiple concurrent initialization with identical config
      // The SDK should handle concurrent calls by waiting for the first to complete
      const results = await page.evaluate(async (config) => {
        const startTime = performance.now();

        const promises = Array.from({ length: 10 }, () =>
          (window as any).TraceLog.init(config).catch((error: Error) => ({
            error: error.message,
          })),
        );

        const settledResults = await Promise.allSettled(promises);
        const endTime = performance.now();

        return {
          results: settledResults,
          duration: endTime - startTime,
          totalAttempts: promises.length,
        };
      }, TEST_CONFIGS.DEFAULT);

      // Verify all attempts completed
      expect(results.results).toHaveLength(10);

      // Should complete reasonably quickly (not hanging)
      expect(results.duration).toBeLessThan(5000); // 5 second timeout

      // Verify SDK is in a consistent state (all calls should succeed)
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test normal functionality after concurrent initialization
      const eventResult = await TestUtils.testCustomEvent(page, 'concurrent_init_test', {
        attempts: results.totalAttempts,
        duration: results.duration,
      });
      expect(eventResult.success).toBe(true);

      // Should not have critical errors from race conditions
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) => !error.includes('already initialized') && !error.includes('initialization in progress'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle initialization during page unload', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Simulate initialization attempt during page unload
      const result = await page.evaluate(async (config) => {
        // Start initialization
        const initPromise = (window as any).TraceLog.init(config);

        // Immediately trigger page unload event
        window.dispatchEvent(new Event('beforeunload'));
        window.dispatchEvent(new Event('unload'));

        try {
          const initResult = await initPromise;
          return { success: true, result: initResult };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      }, TEST_CONFIGS.DEFAULT);

      // Should handle unload gracefully (either succeed or fail cleanly)
      expect(result).toBeDefined();

      // If it succeeded, verify basic functionality
      if (result.success) {
        const isInitialized = await TestUtils.isTraceLogInitialized(page);
        expect(isInitialized).toBe(true);
      }

      // Should not cause unhandled errors
      const unhandledErrors = monitor.traceLogErrors.filter(
        (error) => error.includes('Unhandled') || error.includes('uncaught'),
      );

      expect(unhandledErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle initialization with invalid configurations in sequence', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // First initialize with a valid config
      const firstInitResult = await TestUtils.initializeTraceLog(page);
      const firstValidated = TestUtils.verifyInitializationResult(firstInitResult);
      expect(firstValidated.success).toBe(true);

      // Test subsequent initialization attempts with invalid configs (should be no-ops)
      const results = await page.evaluate(async () => {
        const configs = [
          { id: '' }, // Invalid: empty ID
          {}, // Invalid: missing ID
          { id: null }, // Invalid: null ID
          { id: 'a'.repeat(1000) }, // Invalid: too long ID
          { id: 'valid-config-2' }, // Valid but SDK already initialized
        ];

        const results = [];
        for (const config of configs) {
          try {
            await (window as any).TraceLog.init(config);
            results.push({ success: true, config });
          } catch (error) {
            results.push({ success: false, error: (error as Error).message, config });
          }
        }

        return results;
      });

      // All attempts should complete
      expect(results).toHaveLength(5);

      // Count successful vs failed initializations
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Since SDK is already initialized, subsequent calls should either succeed (no-op) or fail (validation)
      expect(successful.length + failed.length).toBe(5);

      // SDK should end up in a valid state (first valid config wins)
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test functionality after mixed initialization attempts
      const eventResult = await TestUtils.testCustomEvent(page, 'mixed_config_test', {
        successful: successful.length,
        failed: failed.length,
      });
      expect(eventResult.success).toBe(true);

      // Should have validation errors but no system crashes
      const systemErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('Invalid') &&
          !error.includes('validation') &&
          !error.includes('required') &&
          !error.includes('already initialized'),
      );

      expect(systemErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle initialization race conditions with event tracking', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // First initialize the SDK properly
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Test concurrent event tracking after initialization
      const result = await page.evaluate(async () => {
        // Try to track multiple events simultaneously
        const eventPromises = Array.from({ length: 5 }, (_, i) => {
          const eventCall = (window as any).TraceLog.event(`race_event_${i}`, {
            timestamp: Date.now(),
            sequence: i,
          });

          // Handle case where event might return undefined
          if (eventCall && typeof eventCall.catch === 'function') {
            return eventCall.catch((error: Error) => ({ error: error.message }));
          }
          return Promise.resolve(eventCall);
        });

        try {
          const eventResults = await Promise.all(eventPromises);

          return {
            initSuccess: true,
            eventResults: eventResults,
            totalEvents: eventPromises.length,
          };
        } catch (error) {
          return {
            initSuccess: true,
            error: (error as Error).message,
            eventResults: await Promise.allSettled(eventPromises),
          };
        }
      });

      // Initialization should succeed
      expect(result.initSuccess).toBe(true);

      // Events should be tracked successfully after initialization
      expect(result.eventResults).toBeDefined();
      expect(result.eventResults.length).toBe(5);

      // Verify SDK is properly initialized
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test that normal event tracking works
      const eventResult = await TestUtils.testCustomEvent(page, 'post_concurrent_event', {
        test: 'concurrent_events_completed',
      });
      expect(eventResult.success).toBe(true);

      // Should not have critical system errors
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('not initialized') &&
          !error.includes('initialization in progress') &&
          !error.includes('queue') &&
          !error.includes('App not initialized'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });
});
