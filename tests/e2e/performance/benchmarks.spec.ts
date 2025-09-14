import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../utils/test.helpers';

/**
 * Performance benchmarks for TraceLog SDK
 * Tests initialization and event tracking performance with strict budgets
 */
test.describe('Performance Benchmarks', () => {
  // Performance budgets (in milliseconds)
  const PERFORMANCE_BUDGETS = {
    INITIALIZATION: 100,
    EVENT_TRACKING: 10,
    SESSION_START: 100, // Increased to be more realistic for session initialization
    CUSTOM_EVENT: 15,
  } as const;

  const TEST_CONFIG = {
    id: 'test', // Use 'test' ID for special handling that avoids network requests
    qaMode: true, // Enable QA mode for testing
  };

  /**
   * Measures initialization performance in browser context
   */
  test('should initialize within performance budget (100ms)', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Measure initialization time in browser context
      const initPerformance = await page.evaluate(async (config) => {
        const startTime = performance.now();

        try {
          const result = await (window as any).initializeTraceLog(config);
          const endTime = performance.now();
          const duration = endTime - startTime;

          return {
            success: result.success,
            duration,
            startTime,
            endTime,
            error: result.error,
          };
        } catch (error: any) {
          const endTime = performance.now();
          return {
            success: false,
            duration: endTime - startTime,
            startTime,
            endTime,
            error: error.message,
          };
        }
      }, TEST_CONFIG);

      // Validate initialization result
      const validated = TestAssertions.verifyInitializationResult(initPerformance);

      if (!validated.success) {
        monitor.traceLogErrors.push(`[E2E Test] Initialization failed: ${initPerformance.error}`);
      }

      // Performance budget validation
      if (initPerformance.duration > PERFORMANCE_BUDGETS.INITIALIZATION) {
        monitor.traceLogErrors.push(
          `[E2E Test] Initialization exceeded performance budget: ${initPerformance.duration}ms > ${PERFORMANCE_BUDGETS.INITIALIZATION}ms`,
        );
      }

      await test.info().attach('performance', {
        body: JSON.stringify({ metric: 'initialization', value: initPerformance.duration }),
        contentType: 'application/json',
      });

      expect(validated.success).toBe(true);
      expect(initPerformance.duration).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.INITIALIZATION);
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  /**
   * Measures event tracking performance for various event types
   */
  test('should track events within performance budget (10ms)', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize SDK first
      await TestHelpers.navigateAndWaitForReady(page, '/');
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);

      const validated = TestAssertions.verifyInitializationResult(initResult);
      if (!validated.success) {
        monitor.traceLogErrors.push(`[E2E Test] SDK initialization failed: ${initResult.error}`);
      }
      expect(validated.success).toBe(true);

      // Test different event types with performance measurement
      const eventTypes = [
        { name: 'click', action: () => TestHelpers.triggerClickEvent(page) },
        { name: 'scroll', action: () => TestHelpers.triggerScrollEvent(page) },
        { name: 'custom', action: () => TestHelpers.testCustomEvent(page, 'perf_test', { value: 'benchmark' }) },
      ];

      for (const eventType of eventTypes) {
        // Measure event tracking performance in browser context
        const eventPerformance = await page.evaluate(async (type) => {
          const startTime = performance.now();

          try {
            // Trigger event based on type
            if (type === 'click') {
              const button = document.querySelector('button[data-testid="test-button"]');
              if (button) {
                (button as HTMLButtonElement).click();
              }
            } else if (type === 'scroll') {
              window.scrollTo(0, 100);
            } else if (type === 'custom') {
              await (window as any).TraceLog.event('perf_test', { value: 'benchmark' });
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            return {
              success: true,
              duration,
              type,
              error: null,
            };
          } catch (error: any) {
            const endTime = performance.now();
            return {
              success: false,
              duration: endTime - startTime,
              type,
              error: error.message,
            };
          }
        }, eventType.name);

        // Validate event tracking result
        if (!eventPerformance.success) {
          monitor.traceLogErrors.push(`[E2E Test] ${eventType.name} event tracking failed: ${eventPerformance.error}`);
        }

        // Performance budget validation
        const budget =
          eventType.name === 'custom' ? PERFORMANCE_BUDGETS.CUSTOM_EVENT : PERFORMANCE_BUDGETS.EVENT_TRACKING;
        if (eventPerformance.duration > budget) {
          monitor.traceLogErrors.push(
            `[E2E Test] ${eventType.name} event exceeded performance budget: ${eventPerformance.duration}ms > ${budget}ms`,
          );
        }

        const metricKey =
          eventType.name === 'click' ? 'clickEvent' : eventType.name === 'scroll' ? 'scrollEvent' : 'customEvent';
        await test.info().attach('performance', {
          body: JSON.stringify({ metric: metricKey, value: eventPerformance.duration }),
          contentType: 'application/json',
        });

        expect(eventPerformance.success).toBe(true);
        expect(eventPerformance.duration).toBeLessThanOrEqual(budget);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  /**
   * Measures session management performance
   */
  test('should handle session operations within performance budget (100ms)', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Measure session initialization performance
      const sessionPerformance = await page.evaluate(async (config) => {
        const startTime = performance.now();

        try {
          const result = await (window as any).initializeTraceLog(config);

          // Wait for session to be fully established
          await new Promise((resolve) => setTimeout(resolve, 50));

          const endTime = performance.now();
          const duration = endTime - startTime;

          // Check if TraceLog is initialized properly
          const isInitialized =
            typeof (window as any).TraceLog !== 'undefined' && (window as any).isCurrentlyInitialized?.();
          const hasSession = isInitialized;

          return {
            success: result.success,
            duration,
            hasSession,
            error: result.error,
          };
        } catch (error: any) {
          const endTime = performance.now();
          return {
            success: false,
            duration: endTime - startTime,
            hasSession: false,
            error: error.message,
          };
        }
      }, TEST_CONFIG);

      // Validate session performance
      if (!sessionPerformance.success) {
        monitor.traceLogErrors.push(`[E2E Test] Session initialization failed: ${sessionPerformance.error}`);
      }

      if (!sessionPerformance.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] TraceLog was not properly initialized');
      }

      if (sessionPerformance.duration > PERFORMANCE_BUDGETS.SESSION_START) {
        monitor.traceLogErrors.push(
          `[E2E Test] Session initialization exceeded performance budget: ${sessionPerformance.duration}ms > ${PERFORMANCE_BUDGETS.SESSION_START}ms`,
        );
      }

      await test.info().attach('performance', {
        body: JSON.stringify({ metric: 'sessionInit', value: sessionPerformance.duration }),
        contentType: 'application/json',
      });

      expect(sessionPerformance.success).toBe(true);
      expect(sessionPerformance.hasSession).toBe(true);
      expect(sessionPerformance.duration).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.SESSION_START);
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  /**
   * Measures batch event processing performance
   */
  test('should process batch events efficiently', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);

      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Measure batch event processing
      const batchPerformance = await page.evaluate(async () => {
        const startTime = performance.now();
        const eventCount = 10;

        try {
          // Create batch of events
          const eventPromises = [];
          for (let i = 0; i < eventCount; i++) {
            eventPromises.push(
              (window as any).TraceLog.event(`batch_event_${i}`, {
                index: i,
                timestamp: Date.now(),
              }),
            );
          }

          await Promise.all(eventPromises);

          const endTime = performance.now();
          const duration = endTime - startTime;
          const averageEventTime = duration / eventCount;

          return {
            success: true,
            duration,
            eventCount,
            averageEventTime,
            error: null,
          };
        } catch (error: any) {
          const endTime = performance.now();
          return {
            success: false,
            duration: endTime - startTime,
            eventCount,
            averageEventTime: 0,
            error: error.message,
          };
        }
      });

      // Validate batch processing performance
      if (!batchPerformance.success) {
        monitor.traceLogErrors.push(`[E2E Test] Batch event processing failed: ${batchPerformance.error}`);
      }

      if (batchPerformance.averageEventTime > PERFORMANCE_BUDGETS.EVENT_TRACKING) {
        monitor.traceLogErrors.push(
          `[E2E Test] Average batch event time exceeded budget: ${batchPerformance.averageEventTime}ms > ${PERFORMANCE_BUDGETS.EVENT_TRACKING}ms`,
        );
      }

      await test.info().attach('performance', {
        body: JSON.stringify({ metric: 'batchProcessing', value: batchPerformance.duration }),
        contentType: 'application/json',
      });
      await test.info().attach('performance', {
        body: JSON.stringify({ metric: 'averageEvent', value: batchPerformance.averageEventTime }),
        contentType: 'application/json',
      });

      expect(batchPerformance.success).toBe(true);
      expect(batchPerformance.averageEventTime).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.EVENT_TRACKING);
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  /**
   * Measures memory usage and cleanup performance
   */
  test('should maintain memory efficiency during operations', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Measure memory usage during SDK lifecycle
      const memoryPerformance = await page.evaluate(async (config) => {
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

        try {
          // Initialize SDK
          const initResult = await (window as any).initializeTraceLog(config);
          if (!initResult.success) {
            throw new Error(initResult.error);
          }

          // Generate some events
          for (let i = 0; i < 50; i++) {
            await (window as any).TraceLog.event(`memory_test_${i}`, { data: 'test' });
          }

          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }

          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          const memoryDelta = finalMemory - initialMemory;

          // Test cleanup
          if ((window as any).TraceLog.destroy) {
            await (window as any).TraceLog.destroy();
          }

          const postCleanupMemory = (performance as any).memory?.usedJSHeapSize || 0;
          const cleanupEfficiency = finalMemory - postCleanupMemory;

          return {
            success: true,
            initialMemory,
            finalMemory,
            memoryDelta,
            postCleanupMemory,
            cleanupEfficiency,
            hasMemoryAPI: !!(performance as any).memory,
            error: null,
          };
        } catch (error: any) {
          return {
            success: false,
            initialMemory,
            finalMemory: 0,
            memoryDelta: 0,
            postCleanupMemory: 0,
            cleanupEfficiency: 0,
            hasMemoryAPI: !!(performance as any).memory,
            error: error.message,
          };
        }
      }, TEST_CONFIG);

      // Validate memory performance (if memory API is available)
      if (!memoryPerformance.success) {
        monitor.traceLogErrors.push(`[E2E Test] Memory performance test failed: ${memoryPerformance.error}`);
      }

      if (memoryPerformance.hasMemoryAPI) {
        const memoryDeltaMB = memoryPerformance.memoryDelta / 1024 / 1024;
        const cleanupEfficiencyMB = memoryPerformance.cleanupEfficiency / 1024 / 1024;
        await test.info().attach('performance', {
          body: JSON.stringify({ metric: 'memoryUsage', value: memoryDeltaMB }),
          contentType: 'application/json',
        });
        await test.info().attach('performance', {
          body: JSON.stringify({ metric: 'cleanupEfficiency', value: cleanupEfficiencyMB }),
          contentType: 'application/json',
        });

        // Memory should not grow excessively (arbitrary 10MB limit for this test)
        const memoryLimitMB = 10;

        if (memoryDeltaMB > memoryLimitMB) {
          monitor.traceLogErrors.push(
            `[E2E Test] Memory usage exceeded limit: ${memoryDeltaMB.toFixed(2)}MB > ${memoryLimitMB}MB`,
          );
        }

        expect(memoryDeltaMB).toBeLessThanOrEqual(memoryLimitMB);
      }

      expect(memoryPerformance.success).toBe(true);
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
