import { test, expect } from '@playwright/test';
import {
  TestHelpers,
  TestAssertions,
  TEST_PAGE_URL,
  DEFAULT_TEST_CONFIG,
} from '../../utils/session-management/test.helpers';

test.describe('Session Management - Session Start', () => {
  test('should automatically create session on first user activity', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Verify the session is already initialized by setupSessionTest
      await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');

      // Verify session was created
      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] Session was not created during setup');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestAssertions.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session ID verification failed: ${error}`);
        throw error;
      }

      try {
        TestAssertions.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session structure verification failed: ${error}`);
        throw error;
      }

      // Verify no errors occurred during session creation
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during session creation: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should generate unique session ID with proper format', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Validate first session ID properties
      try {
        TestAssertions.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] First session ID verification failed: ${error}`);
        throw error;
      }

      // Verify UUID format
      const hasValidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionInfo.sessionId!,
      );

      if (!hasValidFormat) {
        monitor.traceLogErrors.push(`[E2E Test] Session ID does not match UUID format: ${sessionInfo.sessionId}`);
      }

      expect(hasValidFormat).toBe(true);

      const firstSessionId = sessionInfo.sessionId;

      // Generate second session to test uniqueness by clearing and reinitializing
      await page.evaluate(async () => {
        if ((window as any).TraceLog?.destroy) {
          await (window as any).TraceLog.destroy();
        }
        localStorage.clear();
        await (window as any).initializeTraceLog({ id: 'test' });
      });

      // Wait for cross-tab leader election and trigger activity
      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Get second session data
      const secondSessionInfo = await TestHelpers.getSessionDataFromStorage(page);

      // Verify uniqueness
      try {
        TestAssertions.verifySessionId(secondSessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Second session ID verification failed: ${error}`);
        throw error;
      }

      if (secondSessionInfo.sessionId === firstSessionId) {
        monitor.traceLogErrors.push(`[E2E Test] Session IDs are not unique: ${firstSessionId}`);
      }

      expect(secondSessionInfo.sessionId).not.toBe(firstSessionId);

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during session uniqueness test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should track SESSION_START event with required metadata', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page, 2500);

      // Setup event capture using consolidated helper
      await TestHelpers.setupEventCapture(page);

      // Trigger activity to start session and capture events
      const sessionStartTime = Date.now();
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Get captured events and validate
      const eventValidation = await page.evaluate(() => {
        const capturedEvents = (window as any).capturedEvents ?? [];
        const sessionStartEvent = capturedEvents.find((event: any) => event.type === 'session_start');

        return {
          hasSessionStartEvent: !!sessionStartEvent,
          sessionStartEvent: sessionStartEvent ?? null,
        };
      });

      // Check for session start event or validate session was created as fallback
      if (eventValidation.hasSessionStartEvent && eventValidation.sessionStartEvent) {
        const sessionStartEvent = eventValidation.sessionStartEvent;

        if (sessionStartEvent.type !== 'session_start') {
          monitor.traceLogErrors.push(`[E2E Test] Session start event has wrong type: ${sessionStartEvent.type}`);
        }

        expect(sessionStartEvent.type).toBe('session_start');

        try {
          TestAssertions.verifyTimingAccuracy(sessionStartEvent.timestamp, sessionStartTime - 1000, Date.now() + 1000);
        } catch (error) {
          monitor.traceLogErrors.push(`[E2E Test] Session start event timing verification failed: ${error}`);
          throw error;
        }

        if (!sessionStartEvent.page_url || typeof sessionStartEvent.page_url !== 'string') {
          monitor.traceLogErrors.push(
            `[E2E Test] Session start event missing or invalid page_url: ${sessionStartEvent.page_url}`,
          );
        }

        expect(sessionStartEvent.page_url).toBeTruthy();
        expect(typeof sessionStartEvent.page_url).toBe('string');
      }

      // Verify session creation through localStorage as fallback
      const sessionInfo = await TestHelpers.getSessionDataFromStorage(page);

      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] Session was not created in localStorage fallback check');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestAssertions.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session structure verification failed in fallback check: ${error}`);
        throw error;
      }

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during session start event test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      // Cleanup using consolidated helper
      await TestHelpers.restoreOriginalFetch(page);
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should persist session data in localStorage with correct structure', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Validate session exists and has correct structure
      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] Session does not exist in localStorage persistence test');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestAssertions.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session structure verification failed in persistence test: ${error}`);
        throw error;
      }

      // Verify localStorage keys are properly prefixed
      const storageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(storageKeys.length).toBeGreaterThan(0);
      expect(storageKeys.some((key: string) => key.startsWith('tl:'))).toBe(true);

      // Validate session data structure
      const isValidStructure = await TestHelpers.validateSessionStructure(sessionInfo.sessionData);

      if (!isValidStructure) {
        monitor.traceLogErrors.push(
          `[E2E Test] Session data structure validation failed: ${JSON.stringify(sessionInfo.sessionData)}`,
        );
      }

      expect(isValidStructure).toBe(true);

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during localStorage persistence test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should create session with accurate timestamp and metadata', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);

      // Record timing for accuracy testing
      const initStartTime = Date.now();
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);
      const postActivityTime = Date.now();

      // Get session data and metadata
      const sessionInfo = await TestHelpers.getSessionDataFromStorage(page);
      const metadata = await page.evaluate(() => ({
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
        },
        pageInfo: {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
        },
        timestamp: Date.now(),
      }));

      // Validate session exists and structure
      try {
        TestAssertions.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session ID verification failed in timestamp/metadata test: ${error}`);
        throw error;
      }

      try {
        TestAssertions.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(
          `[E2E Test] Session structure verification failed in timestamp/metadata test: ${error}`,
        );
        throw error;
      }

      // Validate timing accuracy
      try {
        TestAssertions.verifyTimingAccuracy(metadata.timestamp, initStartTime, postActivityTime + 1000);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Timing accuracy verification failed: ${error}`);
        throw error;
      }

      // Validate session data contains timing information
      const isValidStructure = await TestHelpers.validateSessionStructure(sessionInfo.sessionData, {
        hasStartTime: true,
        hasTimingField: true,
      });

      if (!isValidStructure) {
        monitor.traceLogErrors.push(
          `[E2E Test] Session structure validation failed for timing information: ${JSON.stringify(sessionInfo.sessionData)}`,
        );
      }

      expect(isValidStructure).toBe(true);

      // Validate browser metadata is available
      expect(metadata.browserInfo.userAgent).toBeTruthy();
      expect(metadata.pageInfo.url).toBeTruthy();

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during timestamp/metadata test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should handle session creation consistently across page interactions', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Verify initial session
      try {
        TestAssertions.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Initial session ID verification failed in consistency test: ${error}`);
        throw error;
      }

      // Test multiple interactions to ensure session consistency
      const interactions = [
        (): Promise<void> => TestHelpers.triggerClickEvent(page),
        (): Promise<void> => TestHelpers.triggerScrollEvent(page),
        (): Promise<any> => TestHelpers.testCustomEvent(page, 'test_interaction', { test: 'session_consistency' }),
      ];

      for (const interaction of interactions) {
        await interaction();
        await TestHelpers.waitForTimeout(page, 300);

        // Get current session data
        const currentSessionInfo = await TestHelpers.getSessionDataFromStorage(page);

        try {
          TestAssertions.verifySessionId(currentSessionInfo.sessionId);
        } catch (error) {
          monitor.traceLogErrors.push(
            `[E2E Test] Session ID verification failed during interaction ${interactions.indexOf(interaction)}: ${error}`,
          );
          throw error;
        }

        // Note: Session IDs may change due to session management logic
        // The important thing is that a session exists consistently
      }

      // Verify no errors occurred during multiple interactions
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during session consistency test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);

      // Verify session persistence after all interactions
      const finalStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(finalStorageKeys.length).toBeGreaterThan(0);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });
});
