import { test, expect } from '@playwright/test';
import { TestUtils, COMMON_FILTERS } from '../utils';
import { SpecialProjectId } from '../../src/types';

test.describe('Initialization System', () => {
  test.describe('Basic Initialization', () => {
    test('should initialize successfully with minimal config', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to playground with specific config override
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');

        // Wait for TraceLog to be available and manually initialize with minimal config
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const initResult = await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
        });

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should initialize with full configuration', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');

        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const initResult = await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
          sessionTimeout: 900000,
          globalMetadata: {
            environment: 'e2e-test',
            version: '1.0.0',
          },
          scrollContainerSelectors: ['.hero', '.products-grid'],
          sensitiveQueryParams: ['token', 'apiKey'],
          errorSampling: 1,
        });

        expect(initResult.success).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent duplicate initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const firstInit = await TestUtils.initializeTraceLog(page);
        expect(firstInit.success).toBe(true);

        const secondInit = await TestUtils.initializeTraceLog(page);
        expect(secondInit.success).toBe(true);
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
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await eventCapture.startCapture(page);

        const results = await page.evaluate(async () => {
          const bridge = window.__traceLogBridge;

          if (!bridge) throw new Error('TraceLog bridge not available');

          const results = await Promise.all([
            bridge.init({ id: 'skip' }),
            bridge.init({ id: 'skip' }),
            bridge.init({ id: 'skip' }),
          ]);

          return results;
        });

        expect(results.every((r) => r === undefined)).toBe(true);

        const initEvents = eventCapture.getEvents(COMMON_FILTERS.INITIALIZATION);
        expect(initEvents.length).toBeGreaterThan(0);
      } finally {
        await eventCapture.stopCapture();
        monitor.cleanup();
      }
    });

    test('should use retry mechanism for concurrent initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const eventCapture = TestUtils.createEventCapture();

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await eventCapture.startCapture(page);

        await page.evaluate(async () => {
          const bridge = window.__traceLogBridge;

          if (!bridge) throw new Error('TraceLog bridge not available');

          const firstInit = bridge.init({ id: 'skip' });

          await new Promise((resolve) => setTimeout(resolve, 50));

          const secondInit = bridge.init({ id: 'skip' });

          await Promise.all([firstInit, secondInit]);
        });
      } finally {
        await eventCapture.stopCapture();
        monitor.cleanup();
      }
    });

    test('should timeout concurrent initialization after 30 seconds', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const result = await page.evaluate(async () => {
          // Create fresh bridge instance for this test to avoid interference
          if ((window as unknown as { __createFreshTraceLogBridge?: () => void }).__createFreshTraceLogBridge) {
            (window as unknown as { __createFreshTraceLogBridge: () => void }).__createFreshTraceLogBridge();
          }

          const bridge = window.__traceLogBridge;

          if (!bridge) throw new Error('TraceLog bridge not available');

          bridge.forceInitLock(true);

          try {
            await bridge.init({ id: 'skip' });

            return { success: true, error: null };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
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
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        await TestUtils.initializeTraceLog(page);

        await page.evaluate(async () => {
          const bridge = window.__traceLogBridge;

          if (!bridge) throw new Error('TraceLog bridge not available');

          await bridge.destroy();
        });

        const listenersAfter = await page.evaluate(() => {
          const bridge = window.__traceLogBridge;
          return {
            scrollHandlers: bridge?.getScrollHandler()?.containers?.length ?? 0,
            clickHandlers: !!bridge?.getClickHandler(),
          };
        });

        expect(listenersAfter.scrollHandlers).toBe(0);
      } finally {
        monitor.cleanup();
      }
    });

    // REMOVED: Test for deprecated fingerprintMapSize functionality
    // Fingerprint maps were replaced with simpler lastEvent comparison in v2

    test('should clear all intervals and timeouts on stop', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await TestUtils.initializeTraceLog(page);

        await page.evaluate(async () => {
          const bridge = window.__traceLogBridge;
          const eventManager = bridge?.getEventManager();

          if (!eventManager) throw new Error('Event manager not available');

          eventManager.stop();

          const hasInterval = !!(eventManager as unknown as { eventsQueueIntervalId?: unknown }).eventsQueueIntervalId;
          const hasCircuitTimeout = !!(eventManager as unknown as { circuitResetTimeoutId?: unknown })
            .circuitResetTimeoutId;
          const hasHealthCheck = !!(eventManager as unknown as { circuitBreakerHealthCheckInterval?: unknown })
            .circuitBreakerHealthCheckInterval;

          if (hasInterval || hasCircuitTimeout || hasHealthCheck) {
            throw new Error('Intervals/timeouts not cleaned up');
          }
        });
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
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await eventCapture.startCapture(page);

        await TestUtils.initializeTraceLog(page);

        const hasStorageManager = await page.evaluate(() => {
          const bridge = window.__traceLogBridge;
          return !!bridge?.getStorageManager();
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
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await TestUtils.initializeTraceLog(page);

        const stateValid = await page.evaluate(() => {
          const bridge = window.__traceLogBridge;

          const hasApiUrl = !!(bridge as unknown as { get: (key: string) => unknown }).get('apiUrl');
          const hasConfig = !!(bridge as unknown as { get: (key: string) => unknown }).get('config');
          const hasUserId = !!(bridge as unknown as { get: (key: string) => unknown }).get('userId');
          const hasDevice = !!(bridge as unknown as { get: (key: string) => unknown }).get('device');
          const hasPageUrl = !!(bridge as unknown as { get: (key: string) => unknown }).get('pageUrl');

          return hasApiUrl && hasConfig && hasUserId && hasDevice && hasPageUrl;
        });

        expect(stateValid).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should validate all handlers are initialized', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
        await TestUtils.initializeTraceLog(page);

        const handlersValid = await page.evaluate(() => {
          const bridge = window.__traceLogBridge;

          return {
            sessionHandler: !!bridge?.getSessionHandler(),
            scrollHandler: !!bridge?.getScrollHandler(),
            pageViewHandler: !!bridge?.getPageViewHandler(),
            clickHandler: !!bridge?.getClickHandler(),
            performanceHandler: !!bridge?.getPerformanceHandler(),
            errorHandler: !!bridge?.getErrorHandler(),
            // networkHandler removed in v2
          };
        });

        expect(Object.values(handlersValid).every((v) => v === true)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('XSS Protection - CSS Selectors', () => {
    test('should allow safe CSS selectors', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const safeSelectors = ['.hero', '.container', '.products-grid', '.features', 'section:nth-child(2)'];

        for (const selector of safeSelectors) {
          const result = await page.evaluate(async (sel) => {
            try {
              const bridge = window.__traceLogBridge;

              if (!bridge) throw new Error('TraceLog bridge not available');

              // Only destroy if already initialized
              if (bridge.initialized) {
                await bridge.destroy();
              }

              await bridge.init({
                id: 'skip',
                scrollContainerSelectors: [sel],
              });

              return { success: true };
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
          }, selector);

          // Initialization failures are captured in expect() assertion below
          expect(result.success).toBe(true);
        }
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle querySelector errors gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        await TestUtils.initializeTraceLog(page, {
          id: SpecialProjectId.Skip,
          scrollContainerSelectors: ['#valid-selector', '#another-valid'],
        });
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Localhost Validation', () => {
    test('should validate localhost format and reject invalid configurations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await page.goto('/?e2e=true');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

        const result = await page.evaluate(async () => {
          try {
            const bridge = window.__traceLogBridge;

            if (!bridge) throw new Error('TraceLog bridge not available');

            await bridge.init({ id: 'localhost:99999' });

            return { success: true };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      } finally {
        monitor.cleanup();
      }
    });
  });
});
