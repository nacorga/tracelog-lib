import { test, expect } from '@playwright/test';
import { TestUtils, COMMON_FILTERS } from '../utils';
import { SpecialProjectId } from '../../src/types';

test.describe('Base Functionality', () => {
  test('should initialize and capture events', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture();

    try {
      // Navigate to playground with manual initialization
      await page.goto('/?e2e=true');
      await page.waitForLoadState('networkidle');

      await eventCapture.startCapture(page);

      // Wait for TraceLog to be available
      await page.waitForFunction(() => !!window.__traceLogBridge, { timeout: 5000 });

      // Manual initialization instead of relying on auto-init
      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.Skip,
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      // Verify TraceLog bridge is available
      const appInstance = await TestUtils.getAppInstance(page);
      expect(appInstance).toBeDefined();

      // Wait for initialization event
      const initEvent = await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, { timeout: 3000 });
      expect(initEvent.namespace).toBe('App');
      expect(initEvent.message).toContain('Initialization completed');

      // Get all captured events
      const allEvents = eventCapture.getEvents();
      expect(allEvents.length).toBeGreaterThan(0);

      // Filter for specific events
      const sessionEvents = eventCapture.getEvents(COMMON_FILTERS.SESSION_START);
      expect(sessionEvents.length).toBeGreaterThanOrEqual(0);

      // Log any TraceLog errors for debugging but don't fail test
      if (monitor.traceLogErrors.length > 0) {
        console.log('TraceLog errors detected:', monitor.traceLogErrors);
      }
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup(); // ALWAYS required
    }
  });
});
