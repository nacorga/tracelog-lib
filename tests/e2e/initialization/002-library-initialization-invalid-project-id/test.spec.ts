import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Library Initialization - Invalid Project ID', () => {
  // Constants
  const INITIALIZATION_PAGE_URL = '/';
  const EXPECTED_ERROR_MESSAGE_ID_REQUIRED = 'Project ID is required';
  const EXPECTED_ERROR_MESSAGE_INVALID_APP_CONFIG = 'Project ID is required'; // Now consistent with other validation layers
  const EXPECTED_ERROR_MESSAGE_UNDEFINED_CONFIG = 'Configuration must be an object'; // Improved error message

  // Performance requirements from spec
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const PERFORMANCE_REQUIREMENTS = {
    TOTAL_INITIALIZATION_TIME: 500, // <500ms (even for failed initialization)
    CONFIG_LOADING_TIME: 200, // <200ms
    STORAGE_OPERATIONS_TIME: 100, // <100ms
    HANDLER_REGISTRATION_TIME: 100, // <100ms
    USER_ID_GENERATION_TIME: 50, // <50ms
    SESSION_SETUP_TIME: 50, // <50ms
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to page and wait for ready state
    await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
    await expect(page.getByTestId('init-status')).toContainText('Status: Ready for testing');

    // Verify TraceLog is available globally
    const traceLogAvailable = await TestHelpers.verifyTraceLogAvailability(page);
    expect(traceLogAvailable).toBe(true);
  });

  test('should throw error when initialized with missing project ID', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Test missing project ID (undefined config) with performance measurement
      const startTime = Date.now();
      const missingIdResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init(undefined);
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });
      const errorHandlingDuration = Date.now() - startTime;

      // Performance requirement: Even error cases should be fast (<100ms for validation)
      expect(errorHandlingDuration).toBeLessThan(100);

      // Verify initialization failed with proper error
      const validatedResult = TestAssertions.verifyInitializationResult(missingIdResult);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(missingIdResult.error).toContain(EXPECTED_ERROR_MESSAGE_UNDEFINED_CONFIG);

      // Verify TraceLog reports as not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Verify no localStorage entries were created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);

      // Verify status shows failure
      await expect(page.getByTestId('init-status')).toContainText('Status: Ready for testing');
    } finally {
      monitor.cleanup();
    }
  });

  test('should throw error when initialized with empty object (no id property)', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Test empty config object
      const emptyConfigResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({});
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Verify initialization failed with proper error
      const validatedResult = TestAssertions.verifyInitializationResult(emptyConfigResult);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(emptyConfigResult.error).toContain(EXPECTED_ERROR_MESSAGE_ID_REQUIRED);

      // Verify TraceLog reports as not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Verify no localStorage entries were created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should throw error when initialized with empty project ID', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Test empty string project ID
      const emptyIdResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({ id: '' });
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Verify initialization failed with proper error
      const validatedResult = TestAssertions.verifyInitializationResult(emptyIdResult);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(emptyIdResult.error).toContain(EXPECTED_ERROR_MESSAGE_ID_REQUIRED);

      // Verify TraceLog reports as not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Verify no localStorage entries were created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should throw error when initialized with whitespace-only project ID', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Test whitespace-only project ID (should be trimmed to empty string)
      const whitespaceIdResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({ id: '   \t\n  ' });
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Verify initialization failed with proper error
      const validatedResult = TestAssertions.verifyInitializationResult(whitespaceIdResult);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(whitespaceIdResult.error).toContain(EXPECTED_ERROR_MESSAGE_INVALID_APP_CONFIG);

      // Verify TraceLog reports as not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Verify no localStorage entries were created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should throw error when initialized with null project ID', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Test null project ID
      const nullIdResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({ id: null });
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Verify initialization failed with proper error
      const validatedResult = TestAssertions.verifyInitializationResult(nullIdResult);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(nullIdResult.error).toContain(EXPECTED_ERROR_MESSAGE_ID_REQUIRED);

      // Verify TraceLog reports as not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Verify no localStorage entries were created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should verify no tracking occurs when initialization fails', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Try to initialize with invalid project ID
      await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({ id: '' });
        } catch {
          // Expected to fail, continue with test
        }
      });

      // Verify TraceLog is not initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Test that custom events throw error when not initialized
      const customEventResult = await page.evaluate(() => {
        try {
          (window as any).TraceLog.event('test_event', { data: 'test' });
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      expect(customEventResult.success).toBe(false);
      expect(customEventResult.error).toContain('App not initialized');

      // Trigger user interactions to ensure no automatic tracking occurs
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);

      // Verify no localStorage data was created
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);

      // Verify no TraceLog-related errors in console beyond expected initialization failures
      const unexpectedErrors = monitor.traceLogErrors.filter(
        (error) =>
          !error.includes('Initialization failed') &&
          !error.includes('Project ID is required') &&
          !error.includes('Configuration must be an object') &&
          !error.includes('Event tracking failed: App not initialized'),
      );
      expect(unexpectedErrors).toHaveLength(0);
    } finally {
      monitor.cleanup();
    }
  });

  test('should verify no event handlers are attached when initialization fails', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Try to initialize with invalid project ID
      await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({});
        } catch {
          // Expected to fail
        }
      });

      // Verify no initialization occurred
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(false);

      // Test multiple user interactions
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);

      // Wait a bit to see if any delayed handlers trigger
      await TestHelpers.waitForTimeout(page, 2000);

      // Verify no localStorage entries were created (indicating no event handlers attached)
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);

      // Verify no runtime errors occurred
      const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);
      expect(hasRuntimeErrors).toBeFalsy();

      // Verify only expected initialization errors
      const relevantErrors = monitor.traceLogErrors.filter(
        (error) => error.includes('TraceLog') || error.includes('Initialization failed'),
      );
      expect(relevantErrors.length).toBeGreaterThan(0); // Should have initialization error
      expect(
        relevantErrors.every(
          (error) =>
            error.includes('Initialization failed') ||
            error.includes('Project ID is required') ||
            error.includes('Configuration must be an object'),
        ),
      ).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should maintain error state across multiple failed initialization attempts', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      const invalidConfigs = [undefined, {}, { id: '' }, { id: null }, { id: '   ' }];

      for (const config of invalidConfigs) {
        // Add a small delay between attempts to avoid race conditions
        await TestHelpers.waitForTimeout(page, 100);

        const result = await page.evaluate(async (cfg) => {
          try {
            await (window as any).TraceLog.init(cfg);
            return { success: true, error: null };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }, config);

        // Each attempt should fail
        expect(result.success).toBe(false);
        // Different configs have different error messages
        if (config === undefined) {
          expect(result.error).toContain(EXPECTED_ERROR_MESSAGE_UNDEFINED_CONFIG);
        } else {
          // All other cases now consistently return 'Project ID is required' due to improved validation
          expect(result.error).toContain(EXPECTED_ERROR_MESSAGE_ID_REQUIRED);
        }

        // TraceLog should remain uninitialized
        const isInitialized = await TestHelpers.isTraceLogInitialized(page);
        expect(isInitialized).toBe(false);

        // Ensure clean state for next attempt
        await page.evaluate(() => {
          try {
            (window as any).TraceLog.destroy();
          } catch {
            // destroy might fail if app is not initialized, which is expected
          }
        });
      }

      // Verify no localStorage data after all failed attempts
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys).toHaveLength(0);

      // Wait a bit before attempting valid initialization to ensure any pending state is cleared
      await TestHelpers.waitForTimeout(page, 1000);

      // Test that a valid initialization attempt would at least pass basic validation
      // Note: It may still fail due to network/config fetch, but not due to invalid project ID
      const validResult = await TestHelpers.initializeTraceLog(page, { id: 'test-after-failures' });

      // The result might fail due to network issues (no backend), but the error should not be about invalid project ID
      if (!validResult.success) {
        // Should fail with network/config error, not project ID validation error
        expect(validResult.error).not.toContain('Project ID is required');
        expect(validResult.error).not.toContain('Configuration must be an object');
        // It's okay if it fails with network/config errors in test environment
        expect(validResult.error).toMatch(/Failed to load config|Failed to fetch|NetworkError/);
      } else {
        // If it succeeds (unlikely without backend), that's fine too
        expect(validResult.success).toBe(true);
      }
    } finally {
      monitor.cleanup();
    }
  });
});
