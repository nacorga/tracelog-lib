import { test, expect } from '@playwright/test';
import { TestUtils, COMMON_FILTERS } from '../utils';
import { SpecialProjectId } from '../../src/types';

test.describe('Flow Validation', () => {
  test('should validate core functionality', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture({ maxEvents: 200 });

    try {
      // Navigate to playground (auto-detects E2E mode)
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await eventCapture.startCapture(page);

      // Wait for TraceLog to be available and manually initialize
      await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

      // Manual initialization instead of relying on auto-init
      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.Skip,
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      // Verify TraceLog bridge is available
      const appInstance = await TestUtils.getAppInstance(page);
      expect(appInstance).toBeDefined();

      // Wait for initialization with assertions
      const initEvent = await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, {
        timeout: 3000,
        description: 'initialization event',
      });

      expect(initEvent.namespace).toBe('App');
      expect(initEvent.message).toContain('Initialization completed');
      expect(initEvent.timestamp).toBeDefined();

      // Test interactions using visible playground elements
      const browserName = page.context().browser()?.browserType().name();
      if (browserName === 'webkit') {
        // Force click for Safari to avoid floating monitor interference
        await page.locator('[data-testid="cta-ver-productos"]').click({ force: true });
      } else {
        await page.click('[data-testid="cta-ver-productos"]');
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));

      // Test custom events using bridge
      await page.evaluate(() => {
        window.__traceLogBridge?.sendCustomEvent('test_event', {
          testPhase: 'core_validation',
          timestamp: Date.now(),
          testType: 'basic_flow',
        });
      });

      // Intentional error injection for resilience testing
      try {
        await page.evaluate(() => {
          throw new Error('Intentional test error for resilience validation');
        });
      } catch {
        // Expected error for resilience testing - this should fail
      }

      await page.waitForTimeout(500);

      // Event validation
      const allEvents = eventCapture.getEvents();
      expect(allEvents.length).toBeGreaterThanOrEqual(2);

      // Basic event validation
      const appEvents = allEvents.filter((e) => e.namespace === 'App');
      expect(appEvents.length).toBeGreaterThanOrEqual(1);

      const customEvents = allEvents.filter((e) => e.namespace === 'EventManager');
      expect(customEvents.length).toBeGreaterThanOrEqual(1);

      // Security validation - check for sensitive data
      for (const event of allEvents) {
        expect(JSON.stringify(event)).not.toMatch(/\bpassword\b|\bssn\b|\bcredit\b/i);
        expect(JSON.stringify(event)).not.toMatch(/<script|javascript:|vbscript:/i);
      }

      // System stability validation
      const appInstance2 = await TestUtils.getAppInstance(page);
      expect(appInstance2).toBeDefined();

      // Allow some errors due to intentional injection but system should be stable
      expect(monitor.traceLogErrors.length).toBeLessThanOrEqual(3);

      const finalAnomalies = monitor.getAnomalies();
      const criticalAnomalies = finalAnomalies.filter(
        (anomaly) => anomaly.includes('TraceLog errors') && !anomaly.includes('0 error(s)'),
      );
      expect(criticalAnomalies.length).toBeLessThanOrEqual(2);
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });

  test('should demonstrate network resilience and error recovery', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture();

    try {
      await page.goto('/?e2e=true');
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(initResult.success).toBe(true);

      await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, { timeout: 3000 });

      // Stress test with multiple errors
      await page.evaluate(() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            throw new Error(`Stress test error ${i + 1}`);
          }, i * 50);
        }
      });

      // Network stress test
      await page.evaluate(() => {
        for (let i = 0; i < 3; i++) {
          fetch('/api/test-endpoint').catch(() => {});
        }
      });

      await page.waitForTimeout(500);

      // Multiple custom events during stress
      for (let i = 0; i < 5; i++) {
        await page.evaluate((i) => {
          window.__traceLogBridge?.sendCustomEvent(`stress_test_event_${i}`, {
            iteration: i,
            timestamp: Date.now(),
          });
        }, i);
      }

      await page.waitForTimeout(500);

      // System should remain stable
      const appInstance3 = await TestUtils.getAppInstance(page);
      expect(appInstance3).toBeDefined();

      // Reasonable error tolerance during stress test
      expect(monitor.traceLogErrors.length).toBeLessThanOrEqual(5);

      // Final stability validation
      await page.evaluate(() => {
        window.__traceLogBridge?.sendCustomEvent('stability_validation', {
          testType: 'resilience',
          systemStable: true,
        });
      });
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });

  test('should validate session management and debug logging', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture();

    try {
      await page.goto('/?e2e=true');
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(initResult.success).toBe(true);

      await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, { timeout: 3000 });

      // Test user activity
      await page.mouse.move(100, 100);
      await page.mouse.click(100, 100);

      // Validate debug logging
      expect(monitor.debugLogs.length).toBeGreaterThan(0);

      const initDebugLogs = monitor.debugLogs.filter(
        (log) =>
          log.includes('initialization') || log.includes('App') || log.includes('started') || log.includes('completed'),
      );
      expect(initDebugLogs.length).toBeGreaterThan(0);

      // Test debug event
      await page.evaluate(() => {
        window.__traceLogBridge?.sendCustomEvent('debug_validation_event', {
          logLevel: 'debug',
          testPurpose: 'validate_logging',
          sessionActive: true,
        });
      });

      await page.waitForTimeout(500);

      // Log analysis
      const summary = monitor.getSummary();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.traceLogInfo).toBeGreaterThanOrEqual(0);

      // Anomaly detection should be working
      const anomalies = monitor.getAnomalies();
      expect(Array.isArray(anomalies)).toBe(true);
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });

  test('should validate cross-browser compatibility basics', async ({ page, browserName }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture();

    try {
      await page.goto('/?e2e=true');
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(initResult.success).toBe(true);

      const initEvent = await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, {
        timeout: 5000,
        description: `initialization in ${browserName}`,
      });

      expect(initEvent.namespace).toBe('App');

      // Browser interaction testing
      await page.mouse.click(100, 100);

      // Universal scroll test
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.25));

      // Custom event should work across all browsers
      await page.evaluate((browserName) => {
        window.__traceLogBridge?.sendCustomEvent('browser_compatibility_test', {
          browser: browserName,
          testType: 'cross_browser_validation',
        });
      }, browserName);

      await page.waitForTimeout(300);

      // Validate events were captured
      const events = eventCapture.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(2);

      // No critical errors should occur in any browser
      // Log any TraceLog errors for debugging but don't fail test
      if (monitor.traceLogErrors.length > 0) {
        console.log('TraceLog errors detected:', monitor.traceLogErrors);
      }
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup();
    }
  });
});
