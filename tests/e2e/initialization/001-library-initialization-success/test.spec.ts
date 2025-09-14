import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test.helpers';
import {
  InitializationTestBase,
  TEST_CONFIGS,
  TEST_CONSTANTS,
  SessionValidator,
} from '../../../utils/initialization/test.helpers';

test.describe('Library Initialization - Success', () => {
  test('should successfully initialize TraceLog with valid project ID', async ({ page }) => {
    const testBase = new InitializationTestBase(page);

    try {
      // Setup and perform initialization
      await testBase.setup();
      await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);
      await TestHelpers.waitForTimeout(page);

      // Log if initialization validation fails
      try {
        await testBase.validateSuccessfulInit();
      } catch (error) {
        testBase.consoleMonitor.traceLogErrors.push(`[E2E Test] Initialization validation failed: ${error}`);
        throw error;
      }

      // Test functionality
      await testBase.testBasicFunctionality();

      // Verify no errors during interaction
      const postClickErrors = testBase.consoleMonitor.traceLogErrors.filter(
        (msg) => msg.toLowerCase().includes('error') || msg.toLowerCase().includes('uncaught'),
      );
      if (postClickErrors.length > 0) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Unexpected TraceLog errors detected: ${postClickErrors.join(', ')}`,
        );
      }
      expect(postClickErrors).toHaveLength(0);
    } finally {
      testBase.cleanup();
    }
  });

  test('should validate project ID requirement', async ({ browser }) => {
    const { page, cleanup } = await TestHelpers.createIsolatedContext(browser);
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to validation page
      await TestHelpers.navigateAndWaitForReady(page, TEST_CONSTANTS.URLS.VALIDATION_PAGE);
      await TestHelpers.waitForTimeout(page);

      // Test validation scenarios using page-specific methods
      const validationScenarios = [
        { method: 'testNoProjectId', expectedError: TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED },
        { method: 'testEmptyProjectId', expectedError: TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED },
      ];

      for (const { method, expectedError } of validationScenarios) {
        const result = await page.evaluate((methodName) => {
          return (window as any)[methodName]();
        }, method);

        const validatedResult = TestAssertions.verifyInitializationResult(result);

        if (validatedResult.success) {
          monitor.traceLogErrors.push(
            `[E2E Test] ${method} should have failed but succeeded: ${JSON.stringify(result)}`,
          );
        }
        if (!result.error?.includes(expectedError)) {
          monitor.traceLogErrors.push(
            `[E2E Test] ${method} error mismatch - expected: "${expectedError}", got: "${result.error}"`,
          );
        }

        expect(validatedResult.success).toBe(false);
        expect(result.error).toContain(expectedError);
      }

      // Test valid project ID
      const validIdResult = await page.evaluate(() => {
        return (window as any).testValidProjectId();
      });

      const validatedValidIdResult = TestAssertions.verifyInitializationResult(validIdResult);

      if (!validatedValidIdResult.success) {
        monitor.traceLogErrors.push(
          `[E2E Test] Valid project ID test failed unexpectedly: ${JSON.stringify(validIdResult)}`,
        );
      }
      if (validatedValidIdResult.hasError) {
        monitor.traceLogErrors.push(
          `[E2E Test] Valid project ID test has unexpected error: ${JSON.stringify(validIdResult)}`,
        );
      }

      expect(validatedValidIdResult.success).toBe(true);
      expect(validatedValidIdResult.hasError).toBe(false);

      // Verify validation status in UI
      await expect(page.getByTestId('validation-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.VALIDATION_PASS);
    } finally {
      monitor.cleanup();
      await cleanup();
    }
  });

  test('should handle initialization state properly', async ({ page }) => {
    const testBase = new InitializationTestBase(page);

    try {
      // Setup and first initialization
      await testBase.setup();
      await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);
      await SessionValidator.validateSessionState(page);

      // Test duplicate initialization handling
      const duplicateInitResult = await page.evaluate(async () => {
        try {
          await (window as any).TraceLog.init({ id: 'test-duplicate' });
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Should succeed (gracefully handle duplicate initialization)
      const validatedDuplicateResult = TestAssertions.verifyInitializationResult(duplicateInitResult);

      if (!validatedDuplicateResult.success) {
        testBase.consoleMonitor.traceLogErrors.push(
          `[E2E Test] Duplicate initialization should have succeeded: ${JSON.stringify(duplicateInitResult)}`,
        );
      }

      expect(validatedDuplicateResult.success).toBe(true);

      // Should still report as initialized
      const stillInitialized = await TestHelpers.isTraceLogInitialized(page);

      if (!stillInitialized) {
        testBase.consoleMonitor.traceLogErrors.push(
          '[E2E Test] TraceLog should still be initialized after duplicate init',
        );
      }

      expect(stillInitialized).toBe(true);
    } finally {
      testBase.cleanup();
    }
  });

  test('should enable all core functionality after initialization', async ({ page }) => {
    const testBase = new InitializationTestBase(page);

    try {
      // Setup and initialization
      await testBase.setup();
      await testBase.performMeasuredInit(TEST_CONFIGS.DEFAULT);
      await TestHelpers.waitForTimeout(page);

      // Test core functionality using centralized method
      await SessionValidator.validateFunctionalityPreservation(page);
      await testBase.testBasicFunctionality();

      // Verify no runtime errors occurred during interactions
      const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);

      if (hasRuntimeErrors) {
        testBase.consoleMonitor.traceLogErrors.push(
          '[E2E Test] Runtime errors detected during core functionality test',
        );
      }

      expect(hasRuntimeErrors).toBeFalsy();
    } finally {
      testBase.cleanup();
    }
  });
});
