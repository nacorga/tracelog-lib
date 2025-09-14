import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../utils/test.helpers';

test.describe('Storage Quota Edge Cases', () => {
  const TEST_CONFIG = { id: 'test' };

  test('should handle localStorage quota exceeded after initialization', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize TraceLog first (normal initialization)
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Verify SDK is initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Now simulate localStorage quota exceeded for future operations
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function (key: string, value: string) {
          if (key.includes('tl:') || key.includes('session')) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          return originalSetItem.call(this, key, value);
        };
      });

      // Test that events can still be tracked (should use fallback storage)
      const eventResult = await TestHelpers.testCustomEvent(page, 'quota_test_event', {
        test: 'storage_quota_exceeded',
        fallback: true,
      });
      expect(eventResult.success).toBe(true);

      // Trigger additional events to test fallback mechanisms
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);

      // Allow for storage-related warnings but no critical failures
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('localStorage') &&
          !error.includes('QuotaExceededError') &&
          !error.includes('storage quota') &&
          !error.includes('Storage setItem failed'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle sessionStorage quota exceeded after initialization', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize TraceLog first
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Now simulate sessionStorage quota exceeded
      await page.evaluate(() => {
        const originalSetItem = sessionStorage.setItem;
        sessionStorage.setItem = function (key: string, value: string) {
          if (key.includes('tl:') || key.includes('session')) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          return originalSetItem.call(this, key, value);
        };
      });

      // Test session management with storage limitations
      const sessionInfo = await page.evaluate(() => {
        return {
          hasWindow: typeof window !== 'undefined',
          hasTraceLog: typeof (window as any).TraceLog !== 'undefined',
          storageAvailable: (() => {
            try {
              sessionStorage.setItem('test', 'test');
              sessionStorage.removeItem('test');
              return true;
            } catch {
              return false;
            }
          })(),
        };
      });

      expect(sessionInfo.hasTraceLog).toBe(true);

      // Test that SDK continues functioning
      const eventResult = await TestHelpers.testCustomEvent(page, 'session_quota_test', {
        test: 'sessionStorage_quota_exceeded',
      });
      expect(eventResult.success).toBe(true);

      // Verify SDK adapts to storage constraints
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('sessionStorage') &&
          !error.includes('QuotaExceededError') &&
          !error.includes('storage quota') &&
          !error.includes('Storage setItem failed'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle complete storage unavailability after initialization', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize TraceLog first (normal initialization)
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Now simulate complete storage unavailability
      await page.evaluate(() => {
        // Override both localStorage and sessionStorage
        const throwQuotaError = () => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        };

        Object.defineProperty(window, 'localStorage', {
          value: {
            setItem: throwQuotaError,
            getItem: () => null,
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null,
          },
          writable: false,
        });

        Object.defineProperty(window, 'sessionStorage', {
          value: {
            setItem: throwQuotaError,
            getItem: () => null,
            removeItem: () => {},
            clear: () => {},
            length: 0,
            key: () => null,
          },
          writable: false,
        });
      });

      // Verify basic functionality works without storage (memory-only mode)
      const eventResult = await TestHelpers.testCustomEvent(page, 'no_storage_event', {
        test: 'complete_storage_unavailable',
      });
      expect(eventResult.success).toBe(true);

      // Should function in memory-only mode
      const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Allow storage-related warnings but no critical failures
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('localStorage') &&
          !error.includes('sessionStorage') &&
          !error.includes('QuotaExceededError') &&
          !error.includes('storage') &&
          !error.includes('Storage setItem failed'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle storage errors during critical operations', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize TraceLog first
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Simulate intermittent storage failures
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        let operationCount = 0;

        localStorage.setItem = function (key: string, value: string) {
          operationCount++;
          // Fail every 3rd operation to simulate intermittent issues
          if (operationCount % 3 === 0 && key.includes('tl:')) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          return originalSetItem.call(this, key, value);
        };
      });

      // Test multiple events to trigger intermittent failures
      for (let i = 0; i < 10; i++) {
        const eventResult = await TestHelpers.testCustomEvent(page, `intermittent_test_${i}`, {
          index: i,
          test: 'intermittent_storage_failures',
        });
        expect(eventResult.success).toBe(true);
      }

      // Trigger DOM events
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);

      // SDK should continue functioning despite intermittent failures
      const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Allow for storage warnings but no critical system errors
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('QuotaExceededError') &&
          !error.includes('Storage setItem failed') &&
          !error.includes('storage quota'),
      );

      expect(criticalErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });
});
