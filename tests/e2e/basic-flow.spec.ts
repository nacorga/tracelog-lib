import { test, expect } from '@playwright/test';
import { TestUtils, EventCapture, COMMON_FILTERS } from '../utils';

test.describe('TraceLog Basic Flow Validation', () => {
  test('should validate core TraceLog functionality with comprehensive error detection', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = new EventCapture();

    try {
      await TestUtils.navigateAndWaitForReady(page, '/');
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      const appInstance = await TestUtils.getAppInstance(page);
      expect(appInstance).toBeDefined();

      const initEvent = await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, 3000);
      expect(initEvent.namespace).toBe('App');
      expect(initEvent.message).toContain('initialization');

      await page.mouse.move(100, 100);
      await page.waitForTimeout(200);
      await page.mouse.move(200, 200);
      await page.waitForTimeout(200);
      await page.mouse.click(150, 150);
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        window.__traceLogTestBridge?.sendCustomEvent('test_comprehensive_event', {
          testPhase: 'validation',
          timestamp: Date.now(),
          testType: 'comprehensive_flow',
        });
      });

      await page.waitForTimeout(500);

      await page.evaluate(() => {
        setTimeout(() => {
          throw new Error('Intentional test error for comprehensive validation');
        }, 10);
      });

      await page.waitForTimeout(500);

      await page.evaluate(() => {
        try {
          window.__traceLogTestBridge?.sendCustomEvent('', null as any);
        } catch {
          // Expected
        }
      });

      await page.waitForTimeout(500);

      const allEvents = eventCapture.getEvents();
      expect(allEvents.length).toBeGreaterThanOrEqual(1);

      const eventsByNamespace = allEvents.reduce(
        (acc, event) => {
          acc[event.namespace] = (acc[event.namespace] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      expect(eventsByNamespace['App']).toBeGreaterThanOrEqual(1);

      expect(monitor.traceLogErrors.length).toBe(0);

      const finalAppInstance = await TestUtils.getAppInstance(page);
      expect(finalAppInstance).toBeDefined();

      await page.evaluate(() => {
        window.__traceLogTestBridge?.sendCustomEvent('final_validation_event', {
          testPhase: 'final_validation',
          systemStable: true,
        });
      });

      await page.waitForTimeout(300);

      const finalAnomalies = monitor.getAnomalies();
      const criticalAnomalies = finalAnomalies.filter(
        (anomaly) => anomaly.includes('TraceLog errors') && !anomaly.includes('0 error(s)'),
      );

      expect(criticalAnomalies.length).toBe(0);
      expect(finalAppInstance).toBeDefined();
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();

      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    }
  });

  test('should demonstrate robust error recovery and system resilience', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = new EventCapture();

    try {
      await TestUtils.navigateAndWaitForReady(page, '/');
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(initResult.success).toBe(true);

      await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, 3000);

      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            throw new Error(`Stress test error ${i + 1}`);
          }, i * 50);
        }
      });

      await page.waitForTimeout(500);

      await page.evaluate(() => {
        for (let i = 0; i < 10; i++) {
          try {
            window.__traceLogTestBridge?.sendCustomEvent(`stress_test_event_${i}`, {
              iteration: i,
              timestamp: Date.now(),
            });
          } catch {
            // Expected
          }
        }
      });

      await page.waitForTimeout(500);

      await page.route('**/api/**', (route) => route.abort('failed'));

      await page.evaluate(() => {
        for (let i = 0; i < 3; i++) {
          fetch('/api/test-endpoint').catch(() => {});
        }
      });

      await page.waitForTimeout(500);

      const appInstance = await TestUtils.getAppInstance(page);
      expect(appInstance).toBeDefined();

      await page.evaluate(() => {
        window.__traceLogTestBridge?.sendCustomEvent('recovery_validation_event', {
          testType: 'recovery',
          systemRecovered: true,
        });
      });

      await page.waitForTimeout(300);

      expect(appInstance).toBeDefined();

      expect(monitor.traceLogErrors.length).toBeLessThanOrEqual(1);
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });

  test('should validate debug mode and logging comprehensively', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = new EventCapture();

    try {
      await TestUtils.navigateAndWaitForReady(page, '/');
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(initResult.success).toBe(true);

      await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, 3000);

      expect(monitor.debugLogs.length).toBeGreaterThan(0);

      const initDebugLogs = monitor.debugLogs.filter(
        (log) =>
          log.includes('initialization') || log.includes('App') || log.includes('started') || log.includes('completed'),
      );
      expect(initDebugLogs.length).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.__traceLogTestBridge?.sendCustomEvent('debug_test_event', {
          logLevel: 'debug',
          testPurpose: 'validate_logging',
        });
      });

      await page.waitForTimeout(500);

      const logAnalysis = {
        totalDebugLogs: monitor.debugLogs.length,
        infoLogs: monitor.traceLogInfo.length,
        warningLogs: monitor.traceLogWarnings.length,
        errorLogs: monitor.traceLogErrors.length,
        totalConsoleMessages: monitor.consoleMessages.length,
      };

      expect(logAnalysis.totalDebugLogs).toBeGreaterThan(0);

      const anomalies = monitor.getAnomalies();

      expect(Array.isArray(anomalies)).toBe(true);
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });
});
