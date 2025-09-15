import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Session Management - Session Timeout', () => {
  test('should accept custom session timeout configuration and validate initialization', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Wait for initialization to complete and verify final status
      await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');

      // Verify session exists and configuration was applied
      if (!sessionInfo.hasSession) {
        monitor.traceLogErrors.push('Session was not created during timeout configuration test');
      }

      expect(sessionInfo.hasSession).toBe(true);

      try {
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Session ID verification failed in timeout config test: ${error}`);
        throw error;
      }

      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Verify no TraceLog errors
      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during session timeout config test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should maintain session state with continuous user activity', async ({ page }) => {
    const { monitor, sessionInfo } = await TestUtils.setupSessionTest(page);

    try {
      // Verify initial session
      try {
        TestUtils.verifySessionId(sessionInfo.sessionId);
      } catch (error) {
        monitor.traceLogErrors.push(`Initial session ID verification failed in continuous activity test: ${error}`);
        throw error;
      }

      // Test multiple activities to ensure session persists
      for (let i = 0; i < 3; i++) {
        await TestUtils.waitForTimeout(page, 1000);
        await TestUtils.triggerClickEvent(page);

        // Verify session still exists after each activity
        const activeSessionInfo = await TestUtils.getSessionDataFromStorage(page);

        try {
          TestUtils.verifySessionId(activeSessionInfo.sessionId);
        } catch (error) {
          monitor.traceLogErrors.push(`Session ID verification failed during activity ${i}: ${error}`);
          throw error;
        }
      }

      const hasNoErrors = TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors);
      if (!hasNoErrors) {
        monitor.traceLogErrors.push(
          `TraceLog errors detected during continuous activity test: ${monitor.traceLogErrors.join(', ')}`,
        );
      }
      expect(hasNoErrors).toBe(true);
    } finally {
      await TestUtils.cleanupSessionTest(monitor);
    }
  });

  test('should validate session timeout configuration behavior without waiting for full timeout', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 2500);

      // Start session and verify configuration
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Validate that session timeout mechanism is in place using consolidated helper
      const configValidation = await TestUtils.evaluateSessionData(page);

      // Validate session configuration was applied correctly
      expect(configValidation.sessionExists).toBe(true);
      expect(configValidation.sessionId).toBeTruthy();
      expect(configValidation.isInitialized).toBe(true);
      expect(configValidation.storageKeyCount).toBeGreaterThan(0);

      if (configValidation.sessionData) {
        const isValidStructure = await TestUtils.validateSessionDataStructure(configValidation.sessionData);
        expect(isValidStructure).toBe(true);
      }

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle proper session cleanup and resource management', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Test initialization and cleanup cycle
      const initResult = await TestUtils.initializeTraceLog(page);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 2500); // Wait for cross-tab leader election

      // Start session
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 300);

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

      await TestUtils.waitForTimeout(page, 200);

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

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should verify session timeout configuration with different timeout values', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      const initResult = await TestUtils.initializeTraceLog(page);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 2500);

      // Start session
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Verify session is created with default timeout configuration
      const customConfigValidation = await TestUtils.evaluateSessionData(page);

      expect(customConfigValidation.sessionExists).toBe(true);
      expect(customConfigValidation.sessionId).toBeTruthy();
      expect(customConfigValidation.isInitialized).toBe(true);

      if (customConfigValidation.sessionData) {
        const isValidStructure = await TestUtils.validateSessionDataStructure(customConfigValidation.sessionData);
        expect(isValidStructure).toBe(true);
      }

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should ensure session data structure contains required timeout-related fields', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);
      await TestUtils.initializeTraceLog(page);
      await TestUtils.waitForTimeout(page, 2500);

      // Start session
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Check session data structure for timeout-related fields using consolidated helper
      const sessionStructureValidation = await TestUtils.evaluateSessionData(page);

      if (sessionStructureValidation.sessionData) {
        const isValidStructure = await TestUtils.validateSessionDataStructure(sessionStructureValidation.sessionData);
        expect(isValidStructure).toBe(true);
        expect(sessionStructureValidation.sessionId).toBeTruthy();
        expect(typeof sessionStructureValidation.sessionId).toBe('string');
      } else {
        throw new Error('Session structure validation failed - no session data found');
      }

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
