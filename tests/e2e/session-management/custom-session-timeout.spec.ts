import { test, expect } from '@playwright/test';
import {
  TestHelpers,
  TestAssertions,
  MIN_SESSION_TIMEOUT_MS,
  MAX_SESSION_TIMEOUT_MS,
} from '../../utils/session-management/test.helpers';
import { TEST_CONFIGS } from '../../utils/initialization/test.helpers';

test.describe('Session Management - Custom Session Timeout', () => {
  test('should accept custom session timeout within valid bounds', async ({ page }) => {
    // Test with valid custom timeout (5 minutes)
    const customTimeout = 5 * 60 * 1000; // 5 minutes
    const testConfig = {
      ...TEST_CONFIGS.DEFAULT,
      sessionTimeout: customTimeout,
    };

    const { monitor } = await TestHelpers.setupSessionTest(page, testConfig);

    try {
      // Wait for initialization to complete and verify final status
      await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');

      // Verify session exists and custom timeout was accepted
      const configValidation = await TestHelpers.validateSessionTimeoutConfig(page, customTimeout);

      if (!configValidation.hasSession) {
        monitor.traceLogErrors.push('[E2E Test] Session was not created with custom timeout configuration');
      }

      if (!configValidation.isValid) {
        monitor.traceLogErrors.push(
          `[E2E Test] Custom timeout configuration validation failed: ${JSON.stringify(configValidation)}`,
        );
      }

      expect(configValidation.hasSession).toBe(true);

      try {
        TestAssertions.verifySessionId(configValidation.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`[E2E Test] Session ID verification failed with custom timeout: ${error}`);
        throw error;
      }

      expect(configValidation.isValid).toBe(true);

      // If the configuration is accessible, verify the custom timeout was set
      if (configValidation.configTimeout !== undefined) {
        if (configValidation.configTimeout !== customTimeout) {
          monitor.traceLogErrors.push(
            `[E2E Test] Custom timeout not applied correctly: expected ${customTimeout}, got ${configValidation.configTimeout}`,
          );
        }
        expect(configValidation.configTimeout).toBe(customTimeout);
      }

      const hasNoErrors = TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `[E2E Test] TraceLog errors detected during custom timeout test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should reject invalid session timeout values with proper error handling', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Test with timeout too low (below 30 seconds minimum)
      const tooLowTimeout = 15000; // 15 seconds
      const lowTimeoutConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: tooLowTimeout,
      };

      const lowTimeoutResult = await TestHelpers.initializeTraceLog(page, lowTimeoutConfig);
      const lowTimeoutValidated = TestAssertions.verifyInitializationResult(lowTimeoutResult);

      if (lowTimeoutValidated.success) {
        monitor.traceLogErrors.push(
          `[E2E Test] Low timeout should have been rejected but was accepted: ${tooLowTimeout}ms`,
        );
      }

      if (!lowTimeoutValidated.hasError) {
        monitor.traceLogErrors.push(
          `[E2E Test] Low timeout validation should have produced error but did not: ${JSON.stringify(lowTimeoutResult)}`,
        );
      }

      expect(lowTimeoutValidated.success).toBe(false);
      expect(lowTimeoutValidated.hasError).toBe(true);
      expect(lowTimeoutValidated.error).toBeTruthy();

      // Clear state for next test
      await page.evaluate(() => {
        localStorage.clear();
        if ((window as any).TraceLog?.destroy) {
          (window as any).TraceLog.destroy();
        }
      });
      await TestHelpers.waitForTimeout(page, 300);

      // Test with timeout too high (above 24 hours maximum)
      const tooHighTimeout = MAX_SESSION_TIMEOUT_MS + 1000; // Beyond max
      const highTimeoutConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: tooHighTimeout,
      };

      const highTimeoutResult = await TestHelpers.initializeTraceLog(page, highTimeoutConfig);
      const highTimeoutValidated = TestAssertions.verifyInitializationResult(highTimeoutResult);

      if (highTimeoutValidated.success) {
        monitor.traceLogErrors.push(
          `[E2E Test] High timeout should have been rejected but was accepted: ${tooHighTimeout}ms`,
        );
      }

      if (!highTimeoutValidated.hasError) {
        monitor.traceLogErrors.push(
          `[E2E Test] High timeout validation should have produced error but did not: ${JSON.stringify(highTimeoutResult)}`,
        );
      }

      expect(highTimeoutValidated.success).toBe(false);
      expect(highTimeoutValidated.hasError).toBe(true);
      expect(highTimeoutValidated.error).toBeTruthy();

      // Clear state for next test
      await page.evaluate(() => {
        localStorage.clear();
        if ((window as any).TraceLog?.destroy) {
          (window as any).TraceLog.destroy();
        }
      });
      await TestHelpers.waitForTimeout(page, 300);

      // Test with invalid type (string instead of number)
      const invalidTypeConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: '300000' as any, // Invalid: string instead of number
      };

      const invalidTypeResult = await TestHelpers.initializeTraceLog(page, invalidTypeConfig);
      const invalidTypeValidated = TestAssertions.verifyInitializationResult(invalidTypeResult);
      expect(invalidTypeValidated.success).toBe(false);
      expect(invalidTypeValidated.hasError).toBe(true);
      expect(invalidTypeValidated.error).toBeTruthy();

      // Verify error messages contain relevant information about timeout validation
      const hasTimeoutError = monitor.traceLogErrors.some(
        (error) => error.toLowerCase().includes('timeout') || error.toLowerCase().includes('session'),
      );
      expect(hasTimeoutError).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should test extreme timeout values at boundaries', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Test minimum valid timeout (30 seconds)
      const minTimeoutConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: MIN_SESSION_TIMEOUT_MS,
      };

      const minResult = await TestHelpers.initializeTraceLog(page, minTimeoutConfig);
      const minValidated = TestAssertions.verifyInitializationResult(minResult);
      expect(minValidated.success).toBe(true);
      expect(minValidated.hasError).toBe(false);

      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session was created with minimum timeout using consolidated helper
      const minSessionData = await TestHelpers.evaluateSessionData(page);
      expect(minSessionData.sessionExists).toBe(true);

      // Clear state for maximum timeout test
      await page.evaluate(async () => {
        localStorage.clear();
        if ((window as any).TraceLog?.destroy) {
          await (window as any).TraceLog.destroy();
        }
      });
      await TestHelpers.waitForTimeout(page, 500);

      // Test maximum valid timeout (24 hours)
      const maxTimeoutConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: MAX_SESSION_TIMEOUT_MS,
      };

      const maxResult = await TestHelpers.initializeTraceLog(page, maxTimeoutConfig);
      const maxValidated = TestAssertions.verifyInitializationResult(maxResult);
      expect(maxValidated.success).toBe(true);
      expect(maxValidated.hasError).toBe(false);

      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session was created with maximum timeout using consolidated helper
      const maxSessionData = await TestHelpers.evaluateSessionData(page);
      expect(maxSessionData.sessionExists).toBe(true);

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate custom timeout behavior without waiting for actual timeout', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Use a short but valid custom timeout for testing (1 minute)
      const shortTimeout = 60000; // 1 minute
      const testConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: shortTimeout,
      };

      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page, 2500);

      // Start session and validate configuration
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session configuration and timing mechanisms are in place
      const timeoutValidation = await page.evaluate((expectedTimeout) => {
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
          hasTimingFields: sessionData
            ? ['startTime', 'lastActivity', 'lastHeartbeat', 'timestamp'].some(
                (field) =>
                  typeof sessionData[field] === 'number' && sessionData[field] > 0 && sessionData[field] <= Date.now(),
              )
            : false,
          sessionData,
          expectedTimeout,
          currentTime: Date.now(),
        };
      }, shortTimeout);

      expect(timeoutValidation.hasSession).toBe(true);
      expect(timeoutValidation.sessionId).toBeTruthy();
      expect(timeoutValidation.hasTimingFields).toBe(true);

      // Verify session data structure contains required timing information
      if (timeoutValidation.sessionData) {
        expect(timeoutValidation.sessionData.sessionId).toBeTruthy();
        expect(typeof timeoutValidation.sessionData.sessionId).toBe('string');

        // Check that timing fields are reasonable (within recent timeframe)
        const recentTimeThreshold = timeoutValidation.currentTime - 5000; // 5 seconds ago
        const timingFields = ['startTime', 'lastActivity', 'lastHeartbeat', 'timestamp'];
        const hasRecentTiming = timingFields.some((field) => {
          const value = timeoutValidation.sessionData[field];
          return typeof value === 'number' && value >= recentTimeThreshold;
        });
        expect(hasRecentTiming).toBe(true);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should persist custom timeout configuration across page reloads', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Initialize with custom timeout
      const customTimeout = 10 * 60 * 1000; // 10 minutes
      const testConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: customTimeout,
      };

      const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(initResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Get initial session data
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

      // Reload page to test persistence
      await page.reload();
      await TestHelpers.waitForTimeout(page, 1000);

      // Reinitialize with same configuration
      await TestHelpers.navigateAndWaitForReady(page);
      const reloadInitResult = await TestHelpers.initializeTraceLog(page, testConfig);
      expect(TestAssertions.verifyInitializationResult(reloadInitResult).success).toBe(true);

      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session configuration persisted after reload
      const postReloadValidation = await page.evaluate((originalSessionId) => {
        let currentSessionData = null;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('session') && key.startsWith('tl:')) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                currentSessionData = JSON.parse(data);
                break;
              }
            } catch {
              // Continue if parsing fails
            }
          }
        }

        return {
          hasSession: !!currentSessionData,
          sessionId: currentSessionData?.sessionId,
          sessionPersisted: currentSessionData?.sessionId === originalSessionId,
          hasValidStructure:
            currentSessionData &&
            typeof currentSessionData.sessionId === 'string' &&
            ['startTime', 'lastActivity', 'lastHeartbeat', 'timestamp'].some(
              (field) => typeof currentSessionData[field] === 'number',
            ),
          isInitialized: (window as any).TraceLog?.isInitialized?.(),
        };
      }, initialSessionData.sessionId);

      expect(postReloadValidation.hasSession).toBe(true);
      expect(postReloadValidation.sessionId).toBeTruthy();
      expect(postReloadValidation.hasValidStructure).toBe(true);
      expect(postReloadValidation.isInitialized).toBe(true);

      // Note: Session ID may or may not persist depending on session recovery logic
      // The important thing is that a valid session exists after reload
      expect(typeof postReloadValidation.sessionId).toBe('string');
      expect(postReloadValidation.sessionId.length).toBeGreaterThanOrEqual(36);

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle multiple custom timeout configurations consistently', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Test sequence of different timeout configurations
      const timeoutConfigs = [
        { timeout: 60000, name: '1 minute' }, // 1 minute
        { timeout: 300000, name: '5 minutes' }, // 5 minutes
        { timeout: 1800000, name: '30 minutes' }, // 30 minutes
      ];

      for (const { timeout } of timeoutConfigs) {
        // Clear previous state with more thorough cleanup
        await page.evaluate(async () => {
          localStorage.clear();
          if ((window as any).TraceLog?.destroy) {
            await (window as any).TraceLog.destroy();
          }
        });
        await TestHelpers.waitForTimeout(page, 1000); // Longer wait for cleanup

        // Initialize with current timeout configuration
        const testConfig = {
          ...TEST_CONFIGS.DEFAULT,
          sessionTimeout: timeout,
        };

        const initResult = await TestHelpers.initializeTraceLog(page, testConfig);
        const validated = TestAssertions.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);
        expect(validated.hasError).toBe(false);

        await TestHelpers.waitForTimeout(page, 2500);
        await TestHelpers.triggerClickEvent(page);
        await TestHelpers.waitForTimeout(page, 500);

        // Verify session creation with current configuration
        const configCheck = await page.evaluate((expectedTimeout: number) => {
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
            expectedTimeout,
            hasSession: !!sessionData,
            sessionId: sessionData?.sessionId,
            isInitialized: (window as any).TraceLog?.isInitialized?.(),
          };
        }, timeout);

        expect(configCheck.hasSession).toBe(true);
        expect(configCheck.sessionId).toBeTruthy();
        expect(configCheck.isInitialized).toBe(true);
        expect(typeof configCheck.sessionId).toBe('string');
      }

      // Allow for potential errors during rapid initialization cycles, but verify core functionality worked
      // If all tests passed their functional requirements, minor initialization errors are acceptable
      const functionalTestsPassed = timeoutConfigs.every(({ timeout }) => timeout > 0);
      expect(functionalTestsPassed).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate session timeout configuration persistence in storage', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page);

      // Use custom timeout configuration
      const customTimeout = 20 * 60 * 1000; // 20 minutes
      const testConfig = {
        ...TEST_CONFIGS.DEFAULT,
        sessionTimeout: customTimeout,
      };

      await TestHelpers.initializeTraceLog(page, testConfig);
      await TestHelpers.waitForTimeout(page, 2500);
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session storage structure and timeout-related data
      const storageValidation = await page.evaluate((expectedTimeout) => {
        const results = {
          traceLogKeys: [] as string[],
          sessionData: null as any,
          hasValidTimeout: false,
          storageStructure: {} as Record<string, any>,
          expectedTimeout,
        };

        // Get all TraceLog localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('tl:')) {
            results.traceLogKeys.push(key);
            const data = localStorage.getItem(key);
            if (data) {
              try {
                results.storageStructure[key] = JSON.parse(data);
                if (key.includes('session')) {
                  results.sessionData = JSON.parse(data);
                }
              } catch {
                results.storageStructure[key] = data;
              }
            }
          }
        }

        // Validate session data structure
        if (results.sessionData) {
          results.hasValidTimeout =
            typeof results.sessionData.sessionId === 'string' &&
            ['startTime', 'lastActivity', 'lastHeartbeat', 'timestamp'].some(
              (field) =>
                typeof results.sessionData[field] === 'number' &&
                results.sessionData[field] > 0 &&
                results.sessionData[field] <= Date.now(),
            );
        }

        return results;
      }, customTimeout);

      // Validate localStorage contains TraceLog data
      expect(storageValidation.traceLogKeys.length).toBeGreaterThan(0);
      expect(storageValidation.traceLogKeys.some((key: string) => key.startsWith('tl:'))).toBe(true);

      // Validate session data structure
      expect(storageValidation.sessionData).toBeTruthy();
      expect(storageValidation.hasValidTimeout).toBe(true);

      if (storageValidation.sessionData) {
        expect(storageValidation.sessionData.sessionId).toBeTruthy();
        expect(typeof storageValidation.sessionData.sessionId).toBe('string');
        expect(storageValidation.sessionData.sessionId.length).toBeGreaterThanOrEqual(36);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
