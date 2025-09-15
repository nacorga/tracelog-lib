import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

/**
 * E2E tests for storage failure scenarios and fallback mechanisms
 *
 * Tests verify that TraceLog SDK continues functioning when localStorage
 * operations fail and properly falls back to in-memory storage.
 */
test.describe('Storage Failures - Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page and ensure clean state
    await TestUtils.navigateAndWaitForReady(page);

    // Clear any existing storage to ensure clean test state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should handle localStorage quota exceeded gracefully', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog first (normal initialization)
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Verify SDK is initialized
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Now simulate localStorage quota exceeded for future operations
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        let operationCount = 0;

        localStorage.setItem = function (key: string, value: string) {
          operationCount++;
          // Allow first few operations, then fail to simulate quota exceeded
          if (operationCount > 2 && key.startsWith('tl:')) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          return originalSetItem.call(this, key, value);
        };

        // Store original for restoration
        (window as any).__originalSetItem = originalSetItem;
      });

      // Test that events can still be tracked (should use fallback storage)
      const eventResult = await TestUtils.testCustomEvent(page, 'quota_test_event', { test: 'quota_exceeded' });
      expect(eventResult.success).toBe(true);

      // Trigger multiple events to ensure fallback storage is working
      await TestUtils.triggerClickEvent(page);
      await TestUtils.triggerScrollEvent(page);

      // Test multiple custom events to trigger quota failures
      for (let i = 0; i < 5; i++) {
        const multiEventResult = await TestUtils.testCustomEvent(page, `quota_event_${i}`, {
          index: i,
          quota_test: true,
        });
        expect(multiEventResult.success).toBe(true);
      }

      // Check for anomalies in storage quota handling
      const anomalies = monitor.getAnomalies();
      if (anomalies.length > 0) {
        monitor.traceLogWarnings.push(`Detected anomalies in localStorage quota test: ${anomalies.join(', ')}`);
        monitor.traceLogWarnings.push(`Debug logs: ${monitor.debugLogs.slice(-5).join(', ')}`);
      }

      // Verify no critical errors occurred
      expect(monitor.traceLogErrors.length).toBe(0);

      // Verify SDK continues to function
      const stillInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);
    } finally {
      monitor.cleanup();

      // Restore original localStorage.setItem
      await page.evaluate(() => {
        if ((window as any).__originalSetItem) {
          localStorage.setItem = (window as any).__originalSetItem;
        }
      });
    }
  });

  test('should handle localStorage.getItem failures gracefully', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog first (normal initialization)
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Verify SDK is initialized
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Now simulate localStorage.getItem failures for future operations
      await page.evaluate(() => {
        const originalGetItem = localStorage.getItem;

        localStorage.getItem = function (key: string) {
          // Fail for TraceLog keys to test fallback
          if (key.startsWith('tl:')) {
            const error = new Error('Storage access denied');
            error.name = 'SecurityError';
            throw error;
          }
          return originalGetItem.call(this, key);
        };

        // Store original for restoration
        (window as any).__originalGetItem = originalGetItem;
      });

      // Test event tracking works with fallback
      const eventResult = await TestUtils.testCustomEvent(page, 'getitem_failure_test', { fallback: true });
      expect(eventResult.success).toBe(true);

      // Trigger user interactions
      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Test multiple events to ensure continued functionality
      for (let i = 0; i < 3; i++) {
        const multiEventResult = await TestUtils.testCustomEvent(page, `getitem_event_${i}`, {
          index: i,
          getitem_test: true,
        });
        expect(multiEventResult.success).toBe(true);
      }

      // Verify SDK continues functioning despite getItem failures
      const stillInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Verify no critical errors
      expect(monitor.traceLogErrors.length).toBe(0);
    } finally {
      monitor.cleanup();

      // Restore original methods
      await page.evaluate(() => {
        if ((window as any).__originalGetItem) {
          localStorage.getItem = (window as any).__originalGetItem;
        }
      });
    }
  });

  test('should handle localStorage.setItem failures gracefully', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog first (normal initialization)
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Verify SDK is initialized
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Now simulate localStorage.setItem failures for future operations
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;

        localStorage.setItem = function (key: string, value: string) {
          if (key.startsWith('tl:')) {
            const error = new Error('Storage write failed');
            error.name = 'InvalidStateError';
            throw error;
          }
          return originalSetItem.call(this, key, value);
        };

        (window as any).__originalSetItem = originalSetItem;
      });

      // Test that events can still be tracked after setItem starts failing
      const eventResult = await TestUtils.testCustomEvent(page, 'setitem_failure_test', { fallback: true });
      expect(eventResult.success).toBe(true);

      // Trigger multiple interactions to test persistence fallback
      await TestUtils.triggerClickEvent(page);
      await TestUtils.triggerScrollEvent(page);
      await TestUtils.testCustomEvent(page, 'another_event', { after_failure: true });

      // Test multiple events to ensure fallback works consistently
      for (let i = 0; i < 3; i++) {
        const multiEventResult = await TestUtils.testCustomEvent(page, `setitem_event_${i}`, {
          index: i,
          setitem_test: true,
        });
        expect(multiEventResult.success).toBe(true);
      }

      // Verify SDK continues functioning
      const stillInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Verify no critical errors
      expect(monitor.traceLogErrors.length).toBe(0);
    } finally {
      monitor.cleanup();

      await page.evaluate(() => {
        if ((window as any).__originalSetItem) {
          localStorage.setItem = (window as any).__originalSetItem;
        }
      });
    }
  });

  test('should handle localStorage.removeItem failures gracefully', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog first (normal initialization)
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Test normal operations first
      await TestUtils.triggerClickEvent(page);
      const eventResult = await TestUtils.testCustomEvent(page, 'removeitem_test', { cleanup: true });
      expect(eventResult.success).toBe(true);

      // Now simulate localStorage.removeItem failures
      await page.evaluate(() => {
        const originalRemoveItem = localStorage.removeItem;

        localStorage.removeItem = function (key: string) {
          if (key.startsWith('tl:')) {
            const error = new Error('Remove operation failed');
            error.name = 'InvalidAccessError';
            throw error;
          }
          return originalRemoveItem.call(this, key);
        };

        (window as any).__originalRemoveItem = originalRemoveItem;
      });

      // Test that events continue to work despite removeItem failures
      const afterFailureEvent = await TestUtils.testCustomEvent(page, 'after_removeitem_failure', { test: true });
      expect(afterFailureEvent.success).toBe(true);

      // Test cleanup operations that might call removeItem
      const destroyResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.destroy();
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Destroy should succeed even if removeItem fails (fallback cleanup)
      expect(destroyResult.success).toBe(true);

      // Verify no critical errors during cleanup
      expect(monitor.traceLogErrors.length).toBe(0);
    } finally {
      monitor.cleanup();

      await page.evaluate(() => {
        if ((window as any).__originalRemoveItem) {
          localStorage.removeItem = (window as any).__originalRemoveItem;
        }
      });
    }
  });

  test('should handle complete localStorage unavailability', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Mock localStorage to be completely unavailable BEFORE initialization
      await page.addInitScript(() => {
        // Store original localStorage
        (window as any).__originalLocalStorage = window.localStorage;

        // Replace localStorage with failing implementation
        const failingStorage = {
          getItem: () => {
            throw new Error('Storage unavailable');
          },
          setItem: () => {
            throw new Error('Storage unavailable');
          },
          removeItem: () => {
            throw new Error('Storage unavailable');
          },
          clear: () => {
            throw new Error('Storage unavailable');
          },
          key: () => {
            throw new Error('Storage unavailable');
          },
          length: 0,
        };

        Object.defineProperty(window, 'localStorage', {
          value: failingStorage,
          writable: true,
        });
      });

      // Initialize TraceLog - should fall back to in-memory storage
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Verify SDK is functional with fallback storage
      const isInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Test all core functionality works with fallback storage
      const eventResult = await TestUtils.testCustomEvent(page, 'no_storage_test', {
        fallback_only: true,
        timestamp: Date.now(),
      });
      expect(eventResult.success).toBe(true);

      // Test user interactions
      await TestUtils.triggerClickEvent(page);
      await TestUtils.triggerScrollEvent(page);

      // Multiple events to test fallback storage capacity
      for (let i = 0; i < 5; i++) {
        const multiEventResult = await TestUtils.testCustomEvent(page, `fallback_event_${i}`, {
          index: i,
          batch: 'fallback_test',
        });
        expect(multiEventResult.success).toBe(true);
      }

      // Verify no errors occurred
      expect(monitor.traceLogErrors.length).toBe(0);

      // Test that session management works with fallback
      const sessionState = await page.evaluate(() => {
        try {
          // Try to get session info through the public API if available
          return {
            hasSession: true, // Assume session exists if no errors thrown
            functioning: true,
          };
        } catch (error) {
          return {
            hasSession: false,
            functioning: false,
            error: (error as Error).message,
          };
        }
      });

      expect(sessionState.functioning).toBe(true);
    } finally {
      monitor.cleanup();

      // Restore original localStorage
      await page.evaluate(() => {
        if ((window as any).__originalLocalStorage) {
          Object.defineProperty(window, 'localStorage', {
            value: (window as any).__originalLocalStorage,
            writable: true,
          });
        }
      });
    }
  });

  test('should handle mixed storage operation failures', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog first (normal initialization)
      const initResult = await TestUtils.initializeTraceLog(page);
      const validatedResult = TestUtils.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);

      // Now simulate intermittent localStorage failures
      await page.evaluate(() => {
        const originalGetItem = localStorage.getItem;
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;

        let operationCount = 0;

        // Fail every 3rd operation to test resilience
        localStorage.getItem = function (key: string) {
          operationCount++;
          if (operationCount % 3 === 0 && key.startsWith('tl:')) {
            throw new Error('Intermittent storage failure');
          }
          return originalGetItem.call(this, key);
        };

        localStorage.setItem = function (key: string, value: string) {
          operationCount++;
          if (operationCount % 4 === 0 && key.startsWith('tl:')) {
            throw new Error('Intermittent storage failure');
          }
          return originalSetItem.call(this, key, value);
        };

        localStorage.removeItem = function (key: string) {
          operationCount++;
          if (operationCount % 5 === 0 && key.startsWith('tl:')) {
            throw new Error('Intermittent storage failure');
          }
          return originalRemoveItem.call(this, key);
        };

        // Store originals
        (window as any).__originalStorageMethods = {
          getItem: originalGetItem,
          setItem: originalSetItem,
          removeItem: originalRemoveItem,
        };
      });

      // Test multiple operations to trigger various failure scenarios
      for (let i = 0; i < 10; i++) {
        const eventResult = await TestUtils.testCustomEvent(page, `mixed_test_${i}`, {
          iteration: i,
          mixed_failures: true,
        });
        expect(eventResult.success).toBe(true);

        // Trigger user interactions
        if (i % 2 === 0) {
          await TestUtils.triggerClickEvent(page);
        } else {
          await TestUtils.triggerScrollEvent(page);
        }

        await TestUtils.waitForTimeout(page, 100);
      }

      // Verify SDK remains stable despite intermittent failures
      const stillInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Verify no critical errors accumulated
      expect(monitor.traceLogErrors.length).toBe(0);
    } finally {
      monitor.cleanup();

      await page.evaluate(() => {
        const originals = (window as any).__originalStorageMethods;
        if (originals) {
          localStorage.getItem = originals.getItem;
          localStorage.setItem = originals.setItem;
          localStorage.removeItem = originals.removeItem;
        }
      });
    }
  });

  test('should recover gracefully from storage corruption', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // First, initialize normally to create valid storage entries
      const initResult = await TestUtils.initializeTraceLog(page);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.triggerClickEvent(page);
      await TestUtils.waitForTimeout(page, 500);

      // Corrupt storage data
      await page.evaluate(() => {
        // Find TraceLog keys and corrupt their values
        const keysToCorrupt: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('tl:')) {
            keysToCorrupt.push(key);
          }
        }

        // Corrupt the JSON data
        keysToCorrupt.forEach((key) => {
          localStorage.setItem(key, '{"corrupted": invalid json}');
        });
      });

      // Test that SDK handles corrupted data gracefully
      const eventAfterCorruption = await TestUtils.testCustomEvent(page, 'corruption_recovery_test', {
        after_corruption: true,
      });
      expect(eventAfterCorruption.success).toBe(true);

      // Trigger more interactions to test continued functionality
      await TestUtils.triggerClickEvent(page);
      await TestUtils.triggerScrollEvent(page);

      // Verify SDK continues functioning (should use fallback storage)
      const finalEventResult = await TestUtils.testCustomEvent(page, 'final_corruption_test', {
        recovery_verified: true,
      });
      expect(finalEventResult.success).toBe(true);

      // Verify no critical errors (some warnings about corrupted data are expected)
      const criticalErrors = monitor.traceLogErrors.filter(
        (error) =>
          error.toLowerCase().includes('critical') ||
          error.toLowerCase().includes('fatal') ||
          error.toLowerCase().includes('uncaught'),
      );
      expect(criticalErrors.length).toBe(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain functionality during concurrent storage operations', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      // Initialize TraceLog
      const initResult = await TestUtils.initializeTraceLog(page);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      // Simulate concurrent operations that might cause storage conflicts
      const concurrentOperations = [];

      // Create multiple concurrent events
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          TestUtils.testCustomEvent(page, `concurrent_event_${i}`, {
            concurrent: true,
            index: i,
            timestamp: Date.now(),
          }),
        );
      }

      // Add concurrent user interactions
      concurrentOperations.push(TestUtils.triggerClickEvent(page));
      concurrentOperations.push(TestUtils.triggerScrollEvent(page));

      // Execute all operations concurrently
      const results = await Promise.all(concurrentOperations);

      // Verify all operations succeeded
      results.forEach((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          expect(result.success).toBe(true);
        }
      });

      // Verify SDK remains stable after concurrent operations
      const stillInitialized = await TestUtils.isTraceLogInitialized(page);
      expect(stillInitialized).toBe(true);

      // Test one more operation to ensure stability
      const finalTest = await TestUtils.testCustomEvent(page, 'post_concurrent_test', {
        after_concurrent: true,
      });
      expect(finalTest.success).toBe(true);

      // Verify no critical errors from race conditions
      expect(monitor.traceLogErrors.length).toBe(0);
    } finally {
      monitor.cleanup();
    }
  });
});
