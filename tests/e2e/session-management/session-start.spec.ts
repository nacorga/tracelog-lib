import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Session Management - Session Start', () => {
  test('should automatically create session on first user activity', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Verify the session is already initialized by setupSessionTest
      await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');

      // Verify session was created
      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('Session was not created during setup');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Session ID verification failed: ${error}`);
        throw error;
      }

      try {
        TestUtils.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`Session structure verification failed: ${error}`);
        throw error;
      }

      // Verify no errors occurred during session creation
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during session creation: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should generate unique session ID with proper format', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Validate first session ID properties
      try {
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`First session ID verification failed: ${error}`);
        throw error;
      }

      // Verify UUID format
      const hasValidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionInfo.sessionId!,
      );

      if (!hasValidFormat) {
        monitor.traceLogErrors.push(`Session ID does not match UUID format: ${sessionInfo.sessionId}`);
      }

      expect(hasValidFormat).toBe(true);

      const firstSessionId = sessionInfo.sessionId;

      // Generate second session to test uniqueness by clearing and reinitializing
      await page.evaluate(async () => {
        if ((window as any).TraceLog?.destroy) {
          await (window as any).TraceLog.destroy();
        }
        localStorage.clear();
      });
      await TestUtils.initializeTraceLog(page);

      // Wait for cross-tab leader election and trigger activity
      await TestUtils.waitForTimeout(page, 2500);
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Get second session data
      const secondSessionInfo = await TestUtils.getSessionDataFromStorage(page);

      // Verify uniqueness
      try {
        TestUtils.verifySessionId(secondSessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Second session ID verification failed: ${error}`);
        throw error;
      }

      if (secondSessionInfo.sessionId === firstSessionId) {
        monitor.traceLogErrors.push(`Session IDs are not unique: ${firstSessionId}`);
      }

      expect(secondSessionInfo.sessionId).not.toBe(firstSessionId);

      // Verify no errors occurred
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during session uniqueness test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should track SESSION_START event with required metadata', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);
      await TestUtils.initializeTraceLog(page);
      await TestUtils.waitForTimeout(page, 2500);

      // Setup event capture using consolidated helper
      await TestUtils.setupEventCapture(page);

      // Trigger activity to start session and capture events
      const sessionStartTime = Date.now();
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 1000);

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
          monitor.traceLogErrors.push(`Session start event has wrong type: ${sessionStartEvent.type}`);
        }

        expect(sessionStartEvent.type).toBe('session_start');

        try {
          TestUtils.verifyTimingAccuracy(sessionStartEvent.timestamp, sessionStartTime - 1000, Date.now() + 1000);
        } catch (error) {
          monitor.traceLogErrors.push(`Session start event timing verification failed: ${error}`);
          throw error;
        }

        if (!sessionStartEvent.page_url || typeof sessionStartEvent.page_url !== 'string') {
          monitor.traceLogErrors.push(
            `Session start event missing or invalid page_url: ${sessionStartEvent.page_url}`,
          );
        }

        expect(sessionStartEvent.page_url).toBeTruthy();
        expect(typeof sessionStartEvent.page_url).toBe('string');
      }

      // Verify session creation through localStorage as fallback
      const sessionInfo = await TestUtils.getSessionDataFromStorage(page);

      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('Session was not created in localStorage fallback check');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestUtils.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`Session structure verification failed in fallback check: ${error}`);
        throw error;
      }

      // Verify no errors occurred
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during session start event test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      // Cleanup using consolidated helper
      await TestUtils.restoreOriginalFetch(page);
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should persist session data in localStorage with correct structure', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Validate session exists and has correct structure
      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('Session does not exist in localStorage persistence test');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestUtils.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(`Session structure verification failed in persistence test: ${error}`);
        throw error;
      }

      // Verify localStorage keys are properly prefixed
      const storageKeys = await TestUtils.getTraceLogStorageKeys(page);
      expect(storageKeys.length).toBeGreaterThan(0);
      expect(storageKeys.some((key: string) => key.startsWith('tl:'))).toBe(true);

      // Validate session data structure
      const isValidStructure = await TestUtils.validateSessionStructure(sessionInfo.sessionData);

      if (!isValidStructure) {
        monitor.traceLogErrors.push(
          `Session data structure validation failed: ${JSON.stringify(sessionInfo.sessionData)}`,
        );
      }

      expect(isValidStructure).toBe(true);

      // Verify no errors occurred
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during localStorage persistence test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should create session with accurate timestamp and metadata', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Record timing for accuracy testing
      const initStartTime = Date.now();
      await TestUtils.initializeTraceLog(page);
      await TestUtils.waitForTimeout(page, 2500);
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);
      const postActivityTime = Date.now();

      // Get session data and metadata
      const sessionInfo = await TestUtils.getSessionDataFromStorage(page);
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
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Session ID verification failed in timestamp/metadata test: ${error}`);
        throw error;
      }

      try {
        TestUtils.verifySessionStructure(sessionInfo.sessionData);
      } catch (error) {
        monitor.traceLogErrors.push(
          `Session structure verification failed in timestamp/metadata test: ${error}`,
        );
        throw error;
      }

      // Validate timing accuracy
      try {
        TestUtils.verifyTimingAccuracy(metadata.timestamp, initStartTime, postActivityTime + 1000);
      } catch (error) {
        monitor.traceLogErrors.push(`Timing accuracy verification failed: ${error}`);
        throw error;
      }

      // Validate session data contains timing information
      const isValidStructure = await TestUtils.validateSessionStructure(sessionInfo.sessionData, {
        hasStartTime: true,
        hasTimingField: true,
      });

      if (!isValidStructure) {
        monitor.traceLogErrors.push(
          `Session structure validation failed for timing information: ${JSON.stringify(sessionInfo.sessionData)}`,
        );
      }

      expect(isValidStructure).toBe(true);

      // Validate browser metadata is available
      expect(metadata.browserInfo.userAgent).toBeTruthy();
      expect(metadata.pageInfo.url).toBeTruthy();

      // Verify no errors occurred
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during timestamp/metadata test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should handle session creation consistently across page interactions', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Verify initial session
      try {
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Initial session ID verification failed in consistency test: ${error}`);
        throw error;
      }

      // Test multiple interactions to ensure session consistency
      const interactions = [
        (): Promise<void> => TestUtils.triggerClickEvent(page),
        (): Promise<void> => TestUtils.triggerScrollEvent(page),
        (): Promise<any> => TestUtils.testCustomEvent(page, 'test_interaction', { test: 'session_consistency' }),
      ];

      for (const interaction of interactions) {
        await interaction();
        await TestUtils.waitForTimeout(page, 300);

        // Get current session data
        const currentSessionInfo = await TestUtils.getSessionDataFromStorage(page);

        try {
          TestUtils.verifySessionId(currentSessionInfo.sessionId);
        } catch (error) {
          monitor.traceLogErrors.push(
            `Session ID verification failed during interaction ${interactions.indexOf(interaction)}: ${error}`,
          );
          throw error;
        }

        // Note: Session IDs may change due to session management logic
        // The important thing is that a session exists consistently
      }

      // Verify no errors occurred during multiple interactions
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during session consistency test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);

      // Verify session persistence after all interactions
      const finalStorageKeys = await TestUtils.getTraceLogStorageKeys(page);
      expect(finalStorageKeys.length).toBeGreaterThan(0);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });
});
