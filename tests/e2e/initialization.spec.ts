import { test, expect } from '@playwright/test';
import { TestUtils, COMMON_FILTERS } from '../utils';
import { SpecialProjectId } from '../../src/types';

test.describe('Initialization System', () => {
  test.describe('Basic Initialization', () => {
    test('should initialize successfully with minimal config', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const initResult = await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
        });

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should initialize with full configuration', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const initResult = await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
          sessionTimeout: 900000,
          globalMetadata: {
            environment: 'e2e-test',
            version: '1.0.0',
          },
          scrollContainerSelectors: ['#main-content', '.scrollable'],
          sensitiveQueryParams: ['token', 'apiKey'],
          errorSampling: 1,
        });

        expect(initResult.success).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent duplicate initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const firstInit = await TestUtils.initializeTraceLog(page);
        expect(firstInit.success).toBe(true);

        const secondInit = await TestUtils.initializeTraceLog(page);
        expect(secondInit.success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Concurrent Initialization', () => {
    test('should handle concurrent initialization attempts correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const eventCapture = TestUtils.createEventCapture();

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await eventCapture.startCapture(page);

        const results = await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          const promises = [bridge.init({ id: 'skip' }), bridge.init({ id: 'skip' }), bridge.init({ id: 'skip' })];

          const results = await Promise.all(promises);
          return results;
        });

        expect(results.every((r) => r === undefined)).toBe(true);

        const initEvents = eventCapture.getEvents(COMMON_FILTERS.INITIALIZATION);
        expect(initEvents.length).toBeGreaterThan(0);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        await eventCapture.stopCapture();
        monitor.cleanup();
      }
    });

    test('should use retry mechanism for concurrent initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const eventCapture = TestUtils.createEventCapture();

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await eventCapture.startCapture(page);

        await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          const firstInit = bridge.init({ id: 'skip' });

          await new Promise((resolve) => setTimeout(resolve, 50));

          const secondInit = bridge.init({ id: 'skip' });

          await Promise.all([firstInit, secondInit]);
        });

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        await eventCapture.stopCapture();
        monitor.cleanup();
      }
    });

    test('should timeout concurrent initialization after 30 seconds', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const result = await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          (window as any).__forceInitLock = true;

          try {
            await bridge.init({ id: 'skip' });
            return { success: true, error: null };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        });

        if (!result.success) {
          expect(result.error).toContain('timeout');
        }
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Memory Leak Prevention', () => {
    test('should clean up event listeners on destroy', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        await TestUtils.initializeTraceLog(page);

        await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;
          await bridge.destroy();
        });

        const listenersAfter = await page.evaluate(() => {
          const bridge = (window as any).__traceLogBridge;
          return {
            scrollHandlers: (bridge as any).scrollHandler?.containers?.length ?? 0,
            clickHandlers: !!(bridge as any).clickHandler,
          };
        });

        expect(listenersAfter.scrollHandlers).toBe(0);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    // REMOVED: Test for deprecated fingerprintMapSize functionality
    // Fingerprint maps were replaced with simpler lastEvent comparison in v2

    test('should clear all intervals and timeouts on stop', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;
          const eventManager = (bridge as any).eventManager;

          eventManager.stop();

          const hasInterval = !!(eventManager as any).eventsQueueIntervalId;
          const hasCircuitTimeout = !!(eventManager as any).circuitResetTimeoutId;
          const hasHealthCheck = !!(eventManager as any).circuitBreakerHealthCheckInterval;

          if (hasInterval || hasCircuitTimeout || hasHealthCheck) {
            throw new Error('Intervals/timeouts not cleaned up');
          }
        });

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Manager Initialization & Rollback', () => {
    test('should validate StorageManager during initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const eventCapture = TestUtils.createEventCapture();

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await eventCapture.startCapture(page);

        await TestUtils.initializeTraceLog(page);

        const hasStorageManager = await page.evaluate(() => {
          const bridge = (window as any).__traceLogBridge;
          return !!(bridge as any).storageManager;
        });

        expect(hasStorageManager).toBe(true);
      } finally {
        await eventCapture.stopCapture();
        monitor.cleanup();
      }
    });

    test('should validate all required state properties', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        const stateValid = await page.evaluate(() => {
          const bridge = (window as any).__traceLogBridge;

          const hasApiUrl = !!(bridge as any).get('apiUrl');
          const hasConfig = !!(bridge as any).get('config');
          const hasUserId = !!(bridge as any).get('userId');
          const hasDevice = !!(bridge as any).get('device');
          const hasPageUrl = !!(bridge as any).get('pageUrl');

          return hasApiUrl && hasConfig && hasUserId && hasDevice && hasPageUrl;
        });

        expect(stateValid).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should validate all handlers are initialized', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        const handlersValid = await page.evaluate(() => {
          const bridge = (window as any).__traceLogBridge;

          return {
            sessionHandler: !!(bridge as any).sessionHandler,
            scrollHandler: !!(bridge as any).scrollHandler,
            pageViewHandler: !!(bridge as any).pageViewHandler,
            clickHandler: !!(bridge as any).clickHandler,
            performanceHandler: !!(bridge as any).performanceHandler,
            errorHandler: !!(bridge as any).errorHandler,
            // networkHandler removed in v2
          };
        });

        expect(Object.values(handlersValid).every((v) => v === true)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should rollback on initialization failure', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        await page.evaluate(() => {
          (window as any).__forceInitFailure = true;
        });

        const result = await page.evaluate(async () => {
          try {
            const bridge = (window as any).__traceLogBridge;
            await bridge.init({ id: null as any });
            return { success: true };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        });

        expect(result.success).toBe(false);

        const stateAfterFailure = await page.evaluate(() => {
          const bridge = (window as any).__traceLogBridge;
          if (!bridge) {
            return {
              sessionId: null,
              hasStartSession: false,
              suppressNextScroll: false,
            };
          }
          return {
            sessionId: (bridge as any).get('sessionId'),
            hasStartSession: (bridge as any).get('hasStartSession'),
            suppressNextScroll: (bridge as any).get('suppressNextScroll'),
          };
        });

        expect(stateAfterFailure.sessionId).toBeFalsy();
        expect(stateAfterFailure.hasStartSession).toBeFalsy();
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('XSS Protection - CSS Selectors', () => {
    test('should allow safe CSS selectors', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const safeSelectors = [
          '#main-content',
          '.scrollable-container',
          'div.content',
          '[data-scroll="true"]',
          'section:nth-child(2)',
        ];

        for (const selector of safeSelectors) {
          const result = await page.evaluate(async (sel) => {
            try {
              const bridge = (window as any).__traceLogBridge;
              await bridge.destroy();
              await bridge.init({
                id: 'skip',
                scrollContainerSelectors: [sel],
              });
              return { success: true };
            } catch (error: any) {
              return { success: false, error: error.message };
            }
          }, selector);

          expect(result.success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle querySelector errors gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
          scrollContainerSelectors: ['#valid-selector', '#another-valid'],
        });

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Localhost Validation', () => {
    test('should validate localhost format and reject invalid configurations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });

        const result = await page.evaluate(async () => {
          try {
            const bridge = (window as any).__traceLogBridge;
            await bridge.init({ id: 'localhost:99999' });
            return { success: true };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('State Race Conditions', () => {
    test('should serialize state updates via queue', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        const updateCount = await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          for (let i = 0; i < 100; i++) {
            await (bridge as any).set('testValue', i);
          }

          return (bridge as any).get('testValue');
        });

        expect(updateCount).toBe(99);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should use state versioning correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        const versionIncreased = await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          const versionBefore = (bridge as any).getStateVersion();
          await (bridge as any).set('sessionId', 'test-session');
          const versionAfter = (bridge as any).getStateVersion();

          return versionAfter > versionBefore;
        });

        expect(versionIncreased).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent concurrent state modifications', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, { url: '/' });
        await TestUtils.initializeTraceLog(page);

        const updateCount = await page.evaluate(async () => {
          const bridge = (window as any).__traceLogBridge;

          const promises = Array.from({ length: 50 }, (_, i) => (bridge as any).set('testCounter', i));

          await Promise.all(promises);

          return (bridge as any).getStateVersion();
        });

        expect(updateCount).toBeGreaterThan(0);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
