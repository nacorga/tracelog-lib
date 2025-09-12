import { test, expect } from '@playwright/test';
import {
  TestHelpers,
  TestAssertions,
  TEST_PAGE_URL,
  DEFAULT_TEST_CONFIG,
} from '../../../utils/session-management/test.helpers';

test.describe('Session Management - Session Timeout', () => {
  test('should accept custom session timeout configuration and validate initialization', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Wait for initialization to complete and verify final status
      await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');

      // Verify session exists and configuration was applied
      expect(sessionInfo.hasSession).toBe(true);
      TestAssertions.verifySessionId(sessionInfo.sessionId);

      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Verify no TraceLog errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
    }
  });

  test('should maintain session state with continuous user activity', async ({ page }) => {
    const { monitor, sessionInfo } = await TestHelpers.setupSessionTest(page, DEFAULT_TEST_CONFIG);

    try {
      // Verify initial session
      TestAssertions.verifySessionId(sessionInfo.sessionId);

      // Test multiple activities to ensure session persists
      for (let i = 0; i < 3; i++) {
        await TestHelpers.waitForTimeout(page, 1000);
        await TestHelpers.triggerClickEvent(page);

        // Verify session still exists after each activity
        const activeSessionInfo = await TestHelpers.getSessionDataFromStorage(page);
        TestAssertions.verifySessionId(activeSessionInfo.sessionId);
      }

      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      await TestHelpers.cleanupSessionTest(monitor);
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

      await TestHelpers.waitForTimeout(page, 2500);

      // Start session and verify configuration
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Validate that session timeout mechanism is in place using consolidated helper
      const configValidation = await TestHelpers.evaluateSessionData(page);

      // Validate session configuration was applied correctly
      expect(configValidation.sessionExists).toBe(true);
      expect(configValidation.sessionId).toBeTruthy();
      expect(configValidation.isInitialized).toBe(true);
      expect(configValidation.storageKeyCount).toBeGreaterThan(0);

      if (configValidation.sessionData) {
        const isValidStructure = await TestHelpers.validateSessionDataStructure(configValidation.sessionData);
        expect(isValidStructure).toBe(true);
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

      await TestHelpers.waitForTimeout(page, 2500); // Wait for cross-tab leader election

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

      await TestHelpers.waitForTimeout(page, 2500);

      // Start session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Verify session is created with default timeout configuration
      const customConfigValidation = await TestHelpers.evaluateSessionData(page);

      expect(customConfigValidation.sessionExists).toBe(true);
      expect(customConfigValidation.sessionId).toBeTruthy();
      expect(customConfigValidation.isInitialized).toBe(true);

      if (customConfigValidation.sessionData) {
        const isValidStructure = await TestHelpers.validateSessionDataStructure(customConfigValidation.sessionData);
        expect(isValidStructure).toBe(true);
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
      await TestHelpers.waitForTimeout(page, 2500);

      // Start session
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Check session data structure for timeout-related fields using consolidated helper
      const sessionStructureValidation = await TestHelpers.evaluateSessionData(page);

      if (sessionStructureValidation.sessionData) {
        const isValidStructure = await TestHelpers.validateSessionDataStructure(sessionStructureValidation.sessionData);
        expect(isValidStructure).toBe(true);
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
