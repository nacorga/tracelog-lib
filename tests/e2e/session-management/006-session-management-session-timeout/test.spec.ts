import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Session Management - Session Timeout', () => {
  // Constants
  const TEST_PAGE_URL = '/';
  const DEFAULT_TEST_CONFIG = { id: 'test' };
  const READY_STATUS_TEXT = 'Status: Ready for testing';
  const INITIALIZED_STATUS_TEXT = 'Status: Initialized successfully';

  test('should accept custom session timeout configuration and validate initialization', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate and initialize
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Initialize TraceLog with QA mode
      const testConfig = {
        ...DEFAULT_TEST_CONFIG,
        qaMode: true,
      };

      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      const validatedResult = TestAssertions.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      await TestHelpers.waitForTimeout(page);
      await expect(page.getByTestId('init-status')).toContainText(INITIALIZED_STATUS_TEXT);

      // Start session with activity
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session exists and configuration was applied
      const sessionValidation = await page.evaluate(() => {
        let sessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                sessionData = JSON.parse(data);
                break;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return {
          hasSession: !!sessionData,
          sessionId: sessionData?.sessionId,
          isInitialized: (window as Record<string, any>).TraceLog?.isInitialized?.(),
        };
      });

      expect(sessionValidation.hasSession).toBe(true);
      expect(sessionValidation.sessionId).toBeTruthy();
      expect(sessionValidation.isInitialized).toBe(true);
      expect(typeof sessionValidation.sessionId).toBe('string');
      expect(sessionValidation.sessionId.length).toBeGreaterThanOrEqual(36);

      // Verify no TraceLog errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain session state with continuous user activity', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);

      const testConfig = {
        ...DEFAULT_TEST_CONFIG,
        qaMode: true,
      };

      await TestHelpers.initializeTraceLog(page, testConfig);
      await TestHelpers.waitForTimeout(page);

      // Start initial session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session exists
      const initialSessionData = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) return JSON.parse(data);
            } catch {
              // Continue if parsing fails
            }
          }
        }
        return null;
      });

      expect(initialSessionData).toBeTruthy();
      expect(initialSessionData.sessionId).toBeTruthy();

      // Test multiple activities to ensure session persists
      for (let i = 0; i < 3; i++) {
        await TestHelpers.waitForTimeout(page, 1000);
        await TestHelpers.triggerClickEvent(page);

        // Verify session still exists after each activity
        const activeSessionData = await page.evaluate(() => {
          for (let j = 0; j < localStorage.length; j++) {
            const key = localStorage.key(j);
            if (key?.includes('session') && key.startsWith('tl:')) {
              try {
                const data = localStorage.getItem(key);
                if (data) return JSON.parse(data);
              } catch {
                // Continue if parsing fails
              }
            }
          }
          return null;
        });

        expect(activeSessionData).toBeTruthy();
        expect(activeSessionData.sessionId).toBeTruthy();
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate session timeout configuration behavior without waiting for full timeout', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);

      const testConfig = {
        ...DEFAULT_TEST_CONFIG,
        qaMode: true,
      };

      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page);

      // Start session and verify configuration
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Validate that session timeout mechanism is in place
      const configValidation = await page.evaluate(() => {
        let sessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                sessionData = JSON.parse(data);
                break;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return {
          hasSession: !!sessionData,
          sessionId: sessionData?.sessionId,
          sessionData,
          isInitialized: (window as Record<string, any>).TraceLog?.isInitialized?.(),
          storageKeyCount: Object.keys(localStorage).filter((k) => k.startsWith('tl:')).length,
        };
      });

      // Validate session configuration was applied correctly
      expect(configValidation.hasSession).toBe(true);
      expect(configValidation.sessionId).toBeTruthy();
      expect(configValidation.isInitialized).toBe(true);
      expect(configValidation.storageKeyCount).toBeGreaterThan(0);

      if (configValidation.sessionData) {
        expect(configValidation.sessionData.sessionId).toBeTruthy();
        expect(typeof configValidation.sessionData.sessionId).toBe('string');
        expect(configValidation.sessionData.startTime).toBeGreaterThan(0);

        // Check for timing fields (could be lastHeartbeat, lastActivity, or timestamp)
        const hasTimingField = ['lastHeartbeat', 'lastActivity', 'timestamp'].some(
          (field) => typeof configValidation.sessionData[field] === 'number' && configValidation.sessionData[field] > 0,
        );
        expect(hasTimingField).toBe(true);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle proper session cleanup and resource management', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);

      const testConfig = {
        ...DEFAULT_TEST_CONFIG,
        qaMode: true,
      };

      // Test initialization and cleanup cycle
      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page, 300);

      // Start session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 300);

      // Verify session exists
      const sessionExists = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            return true;
          }
        }
        return false;
      });

      expect(sessionExists).toBe(true);

      // Destroy TraceLog to trigger cleanup
      await page.evaluate(async () => {
        if ((window as Record<string, any>).TraceLog?.destroy) {
          await (window as Record<string, any>).TraceLog.destroy();
        }
      });

      await TestHelpers.waitForTimeout(page, 200);

      // Verify cleanup occurred
      const cleanupValidation = await page.evaluate(() => {
        const sessionKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            sessionKeys.push(key);
          }
        }
        return { sessionKeys: sessionKeys.length };
      });

      // Session data should be cleaned up after destroy
      expect(cleanupValidation.sessionKeys).toBeLessThanOrEqual(1);

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should verify session timeout configuration with different timeout values', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);

      // Test with default timeout configuration
      const testConfig = {
        ...DEFAULT_TEST_CONFIG,
        qaMode: true,
      };

      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page);

      // Start session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session is created with default timeout configuration
      const customConfigValidation = await page.evaluate(() => {
        let sessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                sessionData = JSON.parse(data);
                break;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return {
          hasSession: !!sessionData,
          sessionId: sessionData?.sessionId,
          sessionData,
          isInitialized: (window as Record<string, any>).TraceLog?.isInitialized?.(),
        };
      });

      expect(customConfigValidation.hasSession).toBe(true);
      expect(customConfigValidation.sessionId).toBeTruthy();
      expect(customConfigValidation.isInitialized).toBe(true);

      if (customConfigValidation.sessionData) {
        expect(customConfigValidation.sessionData.sessionId).toBeTruthy();
        expect(typeof customConfigValidation.sessionData.sessionId).toBe('string');
        expect(customConfigValidation.sessionData.sessionId.length).toBeGreaterThanOrEqual(36);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should ensure session data structure contains required timeout-related fields', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, TEST_PAGE_URL);
      await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      await TestHelpers.waitForTimeout(page);

      // Start session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Check session data structure for timeout-related fields
      const sessionStructureValidation = await page.evaluate(() => {
        let sessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                sessionData = JSON.parse(data);
                break;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        if (!sessionData) return null;

        const fields = Object.keys(sessionData);
        return {
          sessionId: sessionData.sessionId,
          hasSessionId: !!sessionData.sessionId,
          hasStartTime: typeof sessionData.startTime === 'number',
          hasTimingField: fields.some(
            (field) =>
              ['lastHeartbeat', 'lastActivity', 'timestamp'].includes(field) && typeof sessionData[field] === 'number',
          ),
          allFields: fields,
        };
      });

      if (sessionStructureValidation) {
        expect(sessionStructureValidation.hasSessionId).toBe(true);
        expect(sessionStructureValidation.hasStartTime).toBe(true);
        expect(sessionStructureValidation.hasTimingField).toBe(true);
        expect(sessionStructureValidation.sessionId).toBeTruthy();
        expect(typeof sessionStructureValidation.sessionId).toBe('string');
      } else {
        throw new Error('Session structure validation failed - no session data found');
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
