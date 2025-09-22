import { test, expect } from '@playwright/test';
import { TestUtils, COMMON_FILTERS } from '../utils';

test.describe('TraceLog Base Functionality', () => {
  test('should initialize and capture events', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const eventCapture = TestUtils.createEventCapture();

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });
      await eventCapture.startCapture(page);

      const initResult = await TestUtils.initializeTraceLog(page);

      // Verify initialization
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      const appInstance = await TestUtils.getAppInstance(page);
      expect(appInstance).toBeDefined();

      // Wait for initialization event
      const initEvent = await eventCapture.waitForEvent(COMMON_FILTERS.INITIALIZATION, { timeout: 3000 });
      expect(initEvent.namespace).toBe('App');
      expect(initEvent.message).toContain('initialization');

      // Get all captured events
      const allEvents = eventCapture.getEvents();
      expect(allEvents.length).toBeGreaterThan(0);

      // Filter for specific events
      const sessionEvents = eventCapture.getEvents(COMMON_FILTERS.SESSION_START);
      expect(sessionEvents.length).toBeGreaterThanOrEqual(0);
    } finally {
      await eventCapture.stopCapture();
      monitor.cleanup(); // ALWAYS required
    }
  });
});
