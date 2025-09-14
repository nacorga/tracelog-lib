import { test, expect } from '@playwright/test';
import {
  TestHelpers,
  TestAssertions,
  TEST_PAGE_URL,
  DEFAULT_TEST_CONFIG,
} from '../../utils/session-management/test.helpers';

test.describe('Session Management - Session Recovery', () => {
  test('should maintain session functionality after page reload', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize and create initial session
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Trigger activity to create session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Get original session data using the helper function
      const originalSessionData = await TestHelpers.getSessionDataFromStorage(page);

      if (!originalSessionData.sessionId) {
        monitor.traceLogErrors.push('[E2E Test] Original session ID was not created before reload test');
      }

      expect(originalSessionData.sessionId).toBeTruthy();

      // Wait for session to stabilize
      await TestHelpers.waitForTimeout(page, 1500);

      // Simulate page reload
      await page.reload();
      await TestHelpers.waitForTimeout(page, 500);

      // Re-initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      const initResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const validatedResult = TestAssertions.verifyInitializationResult(initResult);

      if (!validatedResult.success) {
        monitor.traceLogErrors.push(`[E2E Test] Initialization failed after reload: ${JSON.stringify(initResult)}`);
      }

      expect(validatedResult.success).toBe(true);

      await TestHelpers.waitForTimeout(page);

      // Trigger activity to establish session after reload
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1500);

      // Verify session functionality after reload
      const postReloadSessionData = await page.evaluate(() => {
        let sessionId = null;
        let hasSession = false;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            hasSession = true;
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed.sessionId) {
                  sessionId = parsed.sessionId;
                }
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return { sessionId, hasSession };
      });

      // Session should exist after reload (either recovered or new)
      if (!postReloadSessionData.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] Session was not found after page reload and recovery');
      }

      if (!postReloadSessionData.sessionId) {
        monitor.traceLogErrors.push('[E2E Test] Session ID is missing after page reload and recovery');
      }

      expect(postReloadSessionData.hasSession).toBe(true);
      expect(postReloadSessionData.sessionId).toBeTruthy();

      // Test session functionality with custom event
      const eventResult = await TestHelpers.testCustomEvent(page, 'post_recovery_test', { recovered: true });

      if (!eventResult.success) {
        monitor.traceLogErrors.push(`[E2E Test] Custom event failed after recovery: ${JSON.stringify(eventResult)}`);
      }

      expect(eventResult.success).toBe(true);

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during page reload recovery test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle session storage and recovery data management', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Create session with activities
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.testCustomEvent(page, 'recovery_test_event', {
        testData: 'recovery_validation',
        timestamp: Date.now(),
      });
      await TestHelpers.waitForTimeout(page, 1500);

      // Verify session data is stored
      const sessionStorageCheck = await page.evaluate(() => {
        let sessionExists = false;
        let recoveryExists = false;
        let sessionId = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('tl:')) {
            if (key.includes('session')) {
              sessionExists = true;
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  const parsed = JSON.parse(data);
                  sessionId = parsed.sessionId;
                }
              } catch {
                // Continue if parsing fails
              }
            }
            if (key.includes('recovery')) {
              recoveryExists = true;
            }
          }
        }

        return { sessionExists, recoveryExists, sessionId };
      });

      expect(sessionStorageCheck.sessionExists).toBe(true);
      expect(sessionStorageCheck.sessionId).toBeTruthy();

      // Simulate reload
      await page.reload();
      await TestHelpers.waitForTimeout(page, 500);

      // Re-initialize
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Trigger recovery
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Validate session management after recovery attempt
      const postRecoveryCheck = await page.evaluate(() => {
        let sessionExists = false;
        let sessionId = null;
        let isSessionWorking = false;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            sessionExists = true;
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed.sessionId) {
                  sessionId = parsed.sessionId;
                  isSessionWorking = true;
                }
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return { sessionExists, sessionId, isSessionWorking };
      });

      // Session should be functional after recovery process
      expect(postRecoveryCheck.sessionExists).toBe(true);
      expect(postRecoveryCheck.sessionId).toBeTruthy();
      expect(postRecoveryCheck.isSessionWorking).toBe(true);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle expired session recovery gracefully', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Create initial session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Simulate expired recovery data
      await page.evaluate(() => {
        const now = Date.now();
        const expiredTime = now - 25 * 60 * 60 * 1000; // 25 hours ago (beyond max recovery)

        const expiredRecoveryData = [
          {
            sessionId: 'expired-session-id',
            timestamp: expiredTime,
            attempt: 1,
            context: {
              sessionId: 'expired-session-id',
              startTime: expiredTime,
              lastActivity: expiredTime,
              tabCount: 1,
              recoveryAttempts: 1,
              metadata: {
                userAgent: navigator.userAgent,
                pageUrl: window.location.href,
              },
            },
          },
        ];

        localStorage.setItem('tl:test:recovery', JSON.stringify(expiredRecoveryData));
      });

      // Simulate reload
      await page.reload();
      await TestHelpers.waitForTimeout(page, 500);

      // Re-initialize
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Trigger activity
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Verify new session was created (expired session not recovered)
      const newSessionValidation = await page.evaluate(() => {
        let currentSessionId = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                currentSessionId = parsed.sessionId;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return {
          currentSessionId,
          isNewSession: currentSessionId && currentSessionId !== 'expired-session-id',
        };
      });

      // Should create new session, not recover expired one
      if (!newSessionValidation.currentSessionId) {
        monitor.traceLogErrors.push('[E2E Test] No session ID found after expired session recovery');
      }

      if (!newSessionValidation.isNewSession) {
        monitor.traceLogErrors.push(
          `[E2E Test] Expired session was recovered instead of creating new session: ${newSessionValidation.currentSessionId}`,
        );
      }

      expect(newSessionValidation.currentSessionId).toBeTruthy();
      expect(newSessionValidation.isNewSession).toBe(true);

      // Verify no errors occurred
      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during expired session recovery test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain session timing accuracy during recovery process', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Create session with timing data
      const sessionStartTime = Date.now();
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Simulate reload
      const reloadTime = Date.now();
      await page.reload();
      await TestHelpers.waitForTimeout(page, 500);

      // Re-initialize
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Trigger recovery
      const recoveryTime = Date.now();
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Validate timing accuracy
      const timingValidation = await page.evaluate(
        (params: { sessionStartTime: number; reloadTime: number; recoveryTime: number }) => {
          let recoveryData = null;
          let sessionData = null;

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.includes('recovery') && key.startsWith('tl:')) {
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  recoveryData = JSON.parse(data);
                }
              } catch {
                // Continue if parsing fails
              }
            }
            if (key?.includes('session') && key.startsWith('tl:')) {
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  sessionData = JSON.parse(data);
                }
              } catch {
                // Continue if parsing fails
              }
            }
          }

          const now = Date.now();
          const latestRecovery =
            recoveryData && Array.isArray(recoveryData) && recoveryData.length > 0
              ? recoveryData[recoveryData.length - 1]
              : null;

          return {
            hasRecoveryData: !!recoveryData,
            hasSessionData: !!sessionData,
            latestRecovery,
            sessionData,
            timingAccuracy: {
              recoveryWithinBounds:
                !latestRecovery ||
                (latestRecovery?.timestamp >= params.sessionStartTime && latestRecovery?.timestamp <= now),
              sessionTimingValid: !sessionData || sessionData.startTime >= params.sessionStartTime,
            },
          };
        },
        { sessionStartTime, reloadTime, recoveryTime },
      );

      // Verify timing accuracy
      if (timingValidation.latestRecovery) {
        expect(timingValidation.timingAccuracy.recoveryWithinBounds).toBe(true);
      }

      // Verify session exists after recovery process
      expect(timingValidation.hasSessionData).toBe(true);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle cross-reload session continuity', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Create session with multiple interactions
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);
      await TestHelpers.testCustomEvent(page, 'continuity_test', { phase: 'before_reload' });
      await TestHelpers.waitForTimeout(page, 1500);

      // Get session info before reload
      const preReloadSession = await page.evaluate(() => {
        let sessionId = null;
        let sessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                sessionData = JSON.parse(data);
                sessionId = sessionData.sessionId;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return { sessionId, sessionData };
      });

      expect(preReloadSession.sessionId).toBeTruthy();

      // Perform multiple reload cycles
      for (let i = 0; i < 2; i++) {
        await page.reload();
        await TestHelpers.waitForTimeout(page, 500);

        await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
        await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
        await TestHelpers.waitForTimeout(page);

        await TestHelpers.triggerClickEvent(page);
        await TestHelpers.waitForTimeout(page, 1000);

        // Verify session exists after each reload
        const sessionExists = await page.evaluate(() => {
          for (let j = 0; j < localStorage.length; j++) {
            const key = localStorage.key(j);
            if (key?.includes('session') && key.startsWith('tl:')) {
              return true;
            }
          }
          return false;
        });

        expect(sessionExists).toBe(true);
      }

      // Test final functionality
      const finalEventResult = await TestHelpers.testCustomEvent(page, 'final_continuity_test', {
        phase: 'after_reloads',
      });
      expect(finalEventResult.success).toBe(true);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle session recovery under different browser conditions', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Create session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Test storage persistence across different scenarios
      const storageTests = [
        {
          name: 'normal_reload',
          action: async () => {
            await page.reload();
            await TestHelpers.waitForTimeout(page, 500);
          },
        },
        {
          name: 'context_reset',
          action: async () => {
            await page.evaluate(() => {
              // Simulate partial context loss but keep storage
              delete (window as any).TraceLog;
            });
          },
        },
      ];

      for (const testCase of storageTests) {
        // Perform the test action
        await testCase.action();

        // Re-initialize
        await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
        await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
        await TestHelpers.waitForTimeout(page);

        // Trigger session activity
        await TestHelpers.triggerClickEvent(page);
        await TestHelpers.waitForTimeout(page, 1000);

        // Verify session functionality
        const sessionCheck = await page.evaluate(() => {
          let hasSession = false;
          let sessionId = null;

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.includes('session') && key.startsWith('tl:')) {
              hasSession = true;
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  const parsed = JSON.parse(data);
                  sessionId = parsed.sessionId;
                }
              } catch {
                // Continue if parsing fails
              }
            }
          }

          return { hasSession, sessionId };
        });

        expect(sessionCheck.hasSession).toBe(true);
        expect(sessionCheck.sessionId).toBeTruthy();

        // Test event functionality
        const eventResult = await TestHelpers.testCustomEvent(page, `test_${testCase.name}`, {
          testCase: testCase.name,
        });
        expect(eventResult.success).toBe(true);
      }

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
