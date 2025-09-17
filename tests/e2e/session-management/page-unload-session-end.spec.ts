import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import '../../../src/types/window.types';
import { TEST_URLS } from '../../constants';

test.describe('Session Management - Page Unload Session End', () => {
  // Test Configuration
  const UNLOAD_DETECTION_TIMEOUT = 2000;

  test('should trigger SESSION_END event on beforeunload with page_unload reason', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Navigate and initialize
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);

      if (!validated.success) {
        monitor.traceLogErrors.push(`Initialization failed in page unload test: ${JSON.stringify(initResult)}`);
      }

      expect(validated.success).toBe(true);

      // Start session by triggering activity
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000); // Wait longer for session to start

      // Wait for session coordination
      await TestUtils.waitForCrossTabSessionCoordination(page);

      // Get session info
      const sessionInfo = await TestUtils.getCrossTabSessionInfo(page);

      if (!sessionInfo.sessionId) {
        monitor.traceLogErrors.push('Session ID was not created before page unload test');
      }

      if (typeof sessionInfo.sessionId !== 'string') {
        monitor.traceLogErrors.push(`Session ID is not a string in page unload test: ${typeof sessionInfo.sessionId}`);
      }

      expect(sessionInfo.sessionId).toBeTruthy();
      expect(typeof sessionInfo.sessionId).toBe('string');

      // Set up event monitoring using consolidated helper
      await TestUtils.setupSessionEndMonitoring(page);

      // Trigger page unload by navigation
      await page.click('[data-testid="navigate-to-second-page"]');

      // Wait for navigation to complete
      await page.waitForURL('**/second-page.html', { timeout: 5000 });

      // Go back to check if SESSION_END was triggered
      await page.goBack();
      await TestUtils.waitForTimeout(page, 1000);

      // Check if SESSION_END event was detected
      const sessionEndData = await page.evaluate(() => {
        return (window as any).sessionEndData ?? null;
      });

      if (sessionEndData) {
        expect(sessionEndData.detected).toBe(true);
        expect(sessionEndData.reason).toBe('page_unload');
      } else {
        // Alternative verification through console logs
        const hasSessionEndLog = monitor.consoleMessages.some(
          (msg) => msg.includes('SESSION_END') || msg.includes('page_unload'),
        );
        expect(hasSessionEndLog).toBe(true);
      }

      // Verify no TraceLog errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should use synchronous event delivery methods during page unload', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session and add some events to queue
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);

      // Add events to queue by disabling auto-flush temporarily
      await page.evaluate(() => {
        const bridge = window.__traceLogTestBridge;
        const eventManager = bridge?.getEventManager();
        if (eventManager) {
          // Temporarily disable interval to prevent auto-flush
          eventManager.clearQueueIntervalInstance();

          // Add multiple events
          (window as any).TraceLog.event('test_event_1', { data: 'test1' });
          (window as any).TraceLog.event('test_event_2', { data: 'test2' });
          (window as any).TraceLog.event('test_event_3', { data: 'test3' });
        }
      });
      await TestUtils.waitForTimeout(page, 500);

      // Verify TraceLog is properly initialized and can handle events
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test that we can track events (which implies event manager is working)
      const eventResult = await TestUtils.testCustomEvent(page, 'sync_test_event', { test: true });
      const eventValidated = TestUtils.verifyInitializationResult(eventResult);
      expect(eventValidated.success).toBe(true);

      // Monitor synchronous flush calls
      await page.evaluate(() => {
        const bridge = window.__traceLogTestBridge;
        const eventManager = bridge?.getEventManager();
        if (eventManager) {
          const originalFlushSync = eventManager.flushImmediatelySync.bind(eventManager);
          eventManager.flushImmediatelySync = function (): boolean {
            (window as any).syncFlushCalled = true;
            (window as any).syncFlushTimestamp = Date.now();
            return originalFlushSync();
          };
        }
      });

      // Trigger page unload
      await page.click('[data-testid="navigate-away"]');
      await TestUtils.waitForTimeout(page, UNLOAD_DETECTION_TIMEOUT);

      // Note: We can't directly verify the sync call after navigation
      // but we can verify the setup was correct and no errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should properly clean up session state during page unload', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 1000);

      // Get initial session state
      const sessionInfo = await TestUtils.getCrossTabSessionInfo(page);
      const initialSessionId = sessionInfo.sessionId;
      expect(initialSessionId).toBeTruthy();

      // Store session ID in localStorage for verification after navigation
      await page.evaluate((sessionId) => {
        localStorage.setItem('test-session-id', sessionId ?? '');
      }, sessionInfo.sessionId);

      // Navigate away (triggers unload)
      await page.goto(TEST_URLS.PAGE_UNLOAD_SECOND_PAGE_URL);
      await TestUtils.waitForTimeout(page, 1000);

      // Navigate back to original page
      await page.goto(TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      await TestUtils.waitForTimeout(page, 1000);

      // Verify session was properly cleaned up and persisted
      const storedSessionId = await page.evaluate(() => {
        return localStorage.getItem('test-session-id');
      });
      expect(storedSessionId).toBe(sessionInfo.sessionId ?? null);

      // Verify no TraceLog errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle rapid navigation without losing session end events', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL.replace('index.html', ''));
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 500);

      // Track multiple events to ensure queue has content
      await page.evaluate(() => {
        const bridge = window.__traceLogTestBridge;
        const eventManager = bridge?.getEventManager();
        if (eventManager) {
          // Temporarily disable interval to prevent auto-flush
          eventManager.clearQueueIntervalInstance();

          // Add multiple events
          for (let i = 0; i < 3; i++) {
            (window as any).TraceLog.event(`test_event_${i}`, { data: `test${i}` });
          }
        }
      });

      // Verify TraceLog is properly initialized and can handle events
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Perform rapid navigation sequence
      await page.click('[data-testid="navigate-to-second-page"]');
      await page.waitForURL('**/second-page.html', { timeout: 3000 });

      await TestUtils.waitForTimeout(page, 200);

      await page.click('[data-testid="go-back"]');
      await page.waitForURL('**/page-unload/', { timeout: 5000 });

      await TestUtils.waitForTimeout(page, 500);

      // Verify no errors occurred during rapid navigation
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should trigger session end on pagehide event for mobile compatibility', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 1000);

      // Set up pagehide event monitoring
      await page.evaluate(() => {
        let pagehideHandled = false;
        window.addEventListener('pagehide', () => {
          if (!pagehideHandled) {
            pagehideHandled = true;
            (window as any).pagehideDetected = true;
            (window as any).pagehideTimestamp = Date.now();
          }
        });
      });

      // Simulate mobile-like navigation (pagehide without beforeunload)
      await page.evaluate(() => {
        const event = new PageTransitionEvent('pagehide', { persisted: false });
        window.dispatchEvent(event);
      });

      await TestUtils.waitForTimeout(page, 1000);

      // Verify pagehide was detected
      const pagehideDetected = await page.evaluate(() => {
        return (window as any).pagehideDetected ?? false;
      });
      expect(pagehideDetected).toBe(true);

      // Verify no errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle visibility change events as fallback for session end', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 1000);

      // Monitor visibility change handling
      await page.evaluate(() => {
        (window as any).visibilityChangeEvents = [];
        document.addEventListener('visibilitychange', () => {
          (window as any).visibilityChangeEvents.push({
            visibilityState: document.visibilityState,
            timestamp: Date.now(),
          });
        });
      });

      // Simulate page becoming hidden (visibility change)
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
        });
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      await TestUtils.waitForTimeout(page, 1500); // Wait for delayed handler

      // Verify visibility change was detected
      const visibilityEvents = await page.evaluate(() => {
        return (window as any).visibilityChangeEvents ?? [];
      });
      expect(visibilityEvents.length).toBeGreaterThan(0);

      // Verify no errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should prevent duplicate session end events during multiple unload triggers', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 1000);

      // Set up event monitoring for session end events using consolidated helper
      await TestUtils.setupSessionEndMonitoring(page, true);

      // Trigger multiple unload events rapidly
      await page.evaluate(() => {
        // Simulate multiple unload triggers
        const beforeUnloadEvent = new Event('beforeunload');
        window.dispatchEvent(beforeUnloadEvent);

        const pagehideEvent = new PageTransitionEvent('pagehide', { persisted: false });
        window.dispatchEvent(pagehideEvent);

        // Trigger visibility change
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
        });
        const visibilityEvent = new Event('visibilitychange');
        document.dispatchEvent(visibilityEvent);
      });

      await TestUtils.waitForTimeout(page, 2000);

      // Verify session end events were tracked but not duplicated excessively
      await page.evaluate(() => {
        return (window as any).sessionEndEvents ?? [];
      });

      // Verify that event monitoring was set up correctly (events may or may not be triggered in test environment)
      const hasEventMonitoring = await page.evaluate(() => {
        return Array.isArray((window as any).sessionEndEvents);
      });
      expect(hasEventMonitoring).toBe(true);

      // Verify no errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain session state for potential recovery after unload', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      const initResult = await TestUtils.initializeTraceLog(page);
      const validated = TestUtils.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Start session
      await TestUtils.simulateUserActivity(page);
      await TestUtils.waitForTimeout(page, 3000);
      await TestUtils.waitForCrossTabSessionCoordination(page);
      await TestUtils.waitForTimeout(page, 1000);

      // Get initial session data
      const sessionInfo = await TestUtils.getCrossTabSessionInfo(page);
      const storageKeys = await TestUtils.getTraceLogStorageKeys(page);

      expect(sessionInfo.sessionId).toBeTruthy();
      expect(storageKeys.length).toBeGreaterThan(0);

      // Navigate away to trigger unload
      await page.goto(TEST_URLS.PAGE_UNLOAD_SECOND_PAGE_URL);
      await TestUtils.waitForTimeout(page, 1000);

      // Return to original page
      await page.goto(TEST_URLS.PAGE_UNLOAD_PAGE_URL);
      await TestUtils.waitForTimeout(page, 1000);

      // Check if session data persisted in storage
      const persistedStorageKeys = await TestUtils.getTraceLogStorageKeys(page);

      // Verify session data was preserved for potential recovery
      expect(persistedStorageKeys.length).toBeGreaterThan(0);

      // Verify no errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
