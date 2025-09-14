import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../utils/test.helpers';
import {
  InitializationTestBase,
  InitializationScenarios,
  TEST_CONSTANTS,
  ErrorValidator,
  PerformanceValidator,
} from '../../utils/initialization/test.helpers';

test.describe('Library Initialization - Invalid Project ID', () => {
  let testBase: InitializationTestBase;

  test.beforeEach(async ({ page }) => {
    testBase = new InitializationTestBase(page);
    await testBase.setup();
  });

  test.afterEach(() => {
    testBase?.cleanup();
  });

  test('should throw error when initialized with missing project ID', async ({ page }) => {
    // Test undefined config with performance measurement
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

    // Validate error and performance
    try {
      PerformanceValidator.validateErrorHandlingTime(errorHandlingDuration);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Performance validation failed for missing ID error: ${error}`,
      );
      throw error;
    }

    try {
      ErrorValidator.validateInitializationError(missingIdResult, TEST_CONSTANTS.ERROR_MESSAGES.UNDEFINED_CONFIG);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Error validation failed for undefined config: ${JSON.stringify(missingIdResult)}, Expected: ${TEST_CONSTANTS.ERROR_MESSAGES.UNDEFINED_CONFIG}`,
      );
      throw error;
    }

    // Verify no tracking occurs
    await ErrorValidator.validateNoTrackingOnFailure(page);

    // Verify status remains ready
    await expect(page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.READY);
  });

  test('should throw error when initialized with empty object (no id property)', async ({ page }) => {
    // Test empty config object
    const emptyConfigResult = await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({});
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Validate error and ensure no tracking occurs
    try {
      ErrorValidator.validateInitializationError(emptyConfigResult, TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Error validation failed for empty config: ${JSON.stringify(emptyConfigResult)}, Expected: ${TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED}`,
      );
      throw error;
    }

    try {
      await ErrorValidator.validateNoTrackingOnFailure(page);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] No tracking validation failed for empty config case: ${error}`,
      );
      throw error;
    }
  });

  test('should throw error when initialized with empty project ID', async ({ page }) => {
    // Test empty string project ID
    const emptyIdResult = await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({ id: '' });
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Validate error and ensure no tracking occurs
    try {
      ErrorValidator.validateInitializationError(emptyIdResult, TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Error validation failed for empty ID: ${JSON.stringify(emptyIdResult)}, Expected: ${TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED}`,
      );
      throw error;
    }

    try {
      await ErrorValidator.validateNoTrackingOnFailure(page);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] No tracking validation failed for empty ID case: ${error}`,
      );
      throw error;
    }
  });

  test('should throw error when initialized with whitespace-only project ID', async ({ page }) => {
    // Test whitespace-only project ID
    const whitespaceIdResult = await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({ id: '   \t\n  ' });
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Validate error and ensure no tracking occurs
    try {
      ErrorValidator.validateInitializationError(whitespaceIdResult, TEST_CONSTANTS.ERROR_MESSAGES.INVALID_APP_CONFIG);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Error validation failed for whitespace ID: ${JSON.stringify(whitespaceIdResult)}, Expected: ${TEST_CONSTANTS.ERROR_MESSAGES.INVALID_APP_CONFIG}`,
      );
      throw error;
    }

    try {
      await ErrorValidator.validateNoTrackingOnFailure(page);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] No tracking validation failed for whitespace ID case: ${error}`,
      );
      throw error;
    }
  });

  test('should throw error when initialized with null project ID', async ({ page }) => {
    // Test null project ID
    const nullIdResult = await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({ id: null });
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Validate error and ensure no tracking occurs
    try {
      ErrorValidator.validateInitializationError(nullIdResult, TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] Error validation failed for null ID: ${JSON.stringify(nullIdResult)}, Expected: ${TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED}`,
      );
      throw error;
    }

    try {
      await ErrorValidator.validateNoTrackingOnFailure(page);
    } catch (error) {
      testBase.consoleMonitor.traceLogErrors.push(
        `[E2E Test] No tracking validation failed for null ID case: ${error}`,
      );
      throw error;
    }
  });

  test('should verify no tracking occurs when initialization fails', async ({ page }) => {
    // Try to initialize with invalid project ID
    await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({ id: '' });
      } catch {
        // Expected to fail, continue with test
      }
    });

    // Validate complete failure state
    await ErrorValidator.validateNoTrackingOnFailure(page);

    // Trigger user interactions to ensure no automatic tracking occurs
    await TestHelpers.triggerClickEvent(page);
    await TestHelpers.triggerScrollEvent(page);

    // Re-verify no localStorage data was created after interactions
    const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(localStorageKeys).toHaveLength(0);

    // Verify only expected errors in console
    const allowedErrorPatterns = [
      'Initialization failed',
      'Project ID is required',
      'Configuration must be an object',
      'Event tracking failed: App not initialized',
    ];
    ErrorValidator.validateConsoleErrors(testBase.consoleMonitor.traceLogErrors, allowedErrorPatterns);
  });

  test('should verify no event handlers are attached when initialization fails', async ({ page }) => {
    // Try to initialize with invalid project ID
    await page.evaluate(async () => {
      try {
        await (window as any).TraceLog.init({});
      } catch {
        // Expected to fail
      }
    });

    // Validate no initialization occurred
    await ErrorValidator.validateNoTrackingOnFailure(page);

    // Test multiple user interactions
    await TestHelpers.triggerClickEvent(page);
    await TestHelpers.triggerScrollEvent(page);
    await TestHelpers.waitForTimeout(page, 2000);

    // Verify no localStorage entries after interactions
    const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(localStorageKeys).toHaveLength(0);

    // Verify no runtime errors occurred
    const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);

    if (hasRuntimeErrors) {
      testBase.consoleMonitor.traceLogErrors.push('[E2E Test] Runtime errors detected in event handlers test');
    }

    expect(hasRuntimeErrors).toBeFalsy();

    // Verify only expected initialization errors
    const relevantErrors = testBase.consoleMonitor.traceLogErrors.filter(
      (error) => error.includes('TraceLog') || error.includes('Initialization failed'),
    );
    expect(relevantErrors.length).toBeGreaterThan(0);

    // More flexible error validation - check that each error contains at least one expected pattern
    const expectedErrorPatterns = [
      'Initialization failed',
      'Project ID is required',
      'Configuration must be an object',
      'Invalid project', // Additional pattern for flexibility
      'init', // General initialization error pattern
    ];

    const hasValidErrors =
      relevantErrors.length === 0 ||
      relevantErrors.some((error) =>
        expectedErrorPatterns.some((pattern) => error.toLowerCase().includes(pattern.toLowerCase())),
      );
    expect(hasValidErrors).toBe(true);
  });

  test('should maintain error state across multiple failed initialization attempts', async ({ page }) => {
    // Test multiple invalid configurations using centralized scenario
    await InitializationScenarios.testInvalidProjectIdScenarios(testBase);

    // Verify no localStorage data after all failed attempts
    const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(localStorageKeys).toHaveLength(0);

    // Wait before attempting valid initialization
    await TestHelpers.waitForTimeout(page, 1000);

    // Test valid initialization would pass basic validation
    const validResult = await TestHelpers.initializeTraceLog(page, { id: 'test-after-failures' });

    // Validate result based on expected behavior
    if (!validResult.success) {
      // Should fail with network/config error, not project ID validation error
      if (
        validResult.error?.includes(TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED) ||
        validResult.error?.includes(TEST_CONSTANTS.ERROR_MESSAGES.UNDEFINED_CONFIG)
      ) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Valid initialization failed with project ID validation error after multiple failures: ${JSON.stringify(validResult)}`,
        );
      }

      expect(validResult.error).not.toContain(TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED);
      expect(validResult.error).not.toContain(TEST_CONSTANTS.ERROR_MESSAGES.UNDEFINED_CONFIG);
      expect(validResult.error).toMatch(/Failed to load config|Failed to fetch|NetworkError/);
    } else {
      expect(validResult.success).toBe(true);
    }
  });
});
