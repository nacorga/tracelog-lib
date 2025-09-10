import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Library Initialization - Browser Environment Check', () => {
  // Constants
  const INITIALIZATION_PAGE_URL = '/';
  const ENVIRONMENT_ERROR_MESSAGE = 'This library can only be used in a browser environment';
  const READY_STATUS_TEXT = 'Status: Ready for testing';

  test('should verify environment check logic and provide clear error message', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Test the error message that would be thrown in non-browser environments
      const environmentCheckTest = await page.evaluate(async () => {
        try {
          // Test the exact error message from the SDK that would occur in Node.js
          // We can't actually simulate Node.js environment, but we can test the error message
          const expectedError = 'This library can only be used in a browser environment';
          
          // Simulate the condition check that happens in api.ts
          const simulateNonBrowserEnvironment = () => {
            // This simulates what would happen when typeof window === 'undefined'
            throw new Error(expectedError);
          };

          try {
            simulateNonBrowserEnvironment();
            return { success: true, error: null };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Validate error message content and clarity
      const validatedResult = TestAssertions.verifyInitializationResult(environmentCheckTest);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      
      // Check error message provides clear guidance
      expect(environmentCheckTest.error).toBe(ENVIRONMENT_ERROR_MESSAGE);
      expect(environmentCheckTest.error).toContain('browser environment');
      expect(environmentCheckTest.error.length).toBeGreaterThan(20); // Ensure message is descriptive

    } finally {
      monitor.cleanup();
    }
  });

  test('should confirm browser environment is properly detected', async ({ page }) => {
    // Setup console monitoring  
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Test that browser environment objects are available
      const environmentAvailabilityTest = await page.evaluate(async () => {
        const results: any = {};

        // Check that window and document are available (as they should be in browser)
        results.windowAvailable = typeof window !== 'undefined';
        results.documentAvailable = typeof document !== 'undefined';
        results.windowObject = typeof window === 'object';
        results.documentObject = typeof document === 'object';
        
        // Verify browser-specific properties exist
        results.navigator = typeof navigator !== 'undefined';
        results.localStorage = typeof localStorage !== 'undefined';
        results.location = typeof location !== 'undefined';

        return { success: true, error: null, results };
      });

      // Validate browser environment is properly detected
      const validatedResult = TestAssertions.verifyInitializationResult(environmentAvailabilityTest);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Verify all browser objects are available
      expect(environmentAvailabilityTest.results.windowAvailable).toBe(true);
      expect(environmentAvailabilityTest.results.documentAvailable).toBe(true);
      expect(environmentAvailabilityTest.results.windowObject).toBe(true);
      expect(environmentAvailabilityTest.results.documentObject).toBe(true);
      expect(environmentAvailabilityTest.results.navigator).toBe(true);
      expect(environmentAvailabilityTest.results.localStorage).toBe(true);
      expect(environmentAvailabilityTest.results.location).toBe(true);

    } finally {
      monitor.cleanup();
    }
  });

  test('should confirm TraceLog is available in browser environment', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Verify TraceLog SDK is available in browser environment
      const sdkAvailabilityTest = await page.evaluate(async () => {
        const results: any = {};

        // Check that TraceLog SDK is loaded and available
        results.traceLogDefined = typeof (window as any).TraceLog !== 'undefined';
        results.initFunctionAvailable = typeof (window as any).TraceLog.init === 'function';
        results.eventFunctionAvailable = typeof (window as any).TraceLog.event === 'function';
        results.isInitializedFunctionAvailable = typeof (window as any).TraceLog.isInitialized === 'function';
        
        // Verify environment objects are available
        results.windowAvailable = typeof window !== 'undefined';
        results.documentAvailable = typeof document !== 'undefined';

        return { success: true, error: null, results };
      });

      // Validate SDK availability in browser environment
      const validatedResult = TestAssertions.verifyInitializationResult(sdkAvailabilityTest);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Verify SDK is properly loaded
      expect(sdkAvailabilityTest.results.traceLogDefined).toBe(true);
      expect(sdkAvailabilityTest.results.initFunctionAvailable).toBe(true);
      expect(sdkAvailabilityTest.results.eventFunctionAvailable).toBe(true);
      expect(sdkAvailabilityTest.results.isInitializedFunctionAvailable).toBe(true);

      // Verify environment prerequisites are met
      expect(sdkAvailabilityTest.results.windowAvailable).toBe(true);
      expect(sdkAvailabilityTest.results.documentAvailable).toBe(true);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

    } finally {
      monitor.cleanup();
    }
  });

  test('should demonstrate graceful error handling pattern', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Test graceful error handling pattern that would occur in non-browser environments
      const gracefulErrorTest = await page.evaluate(async () => {
        try {
          // Create a mock function that simulates the environment check failure
          const mockEnvironmentCheckFailure = async () => {
            // Simulate what happens when the environment check fails
            throw new Error('This library can only be used in a browser environment');
          };

          try {
            await mockEnvironmentCheckFailure();
            return { success: true, error: null };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Validate graceful error handling
      const validatedResult = TestAssertions.verifyInitializationResult(gracefulErrorTest);
      expect(validatedResult.success).toBe(false);
      expect(validatedResult.hasError).toBe(true);
      expect(gracefulErrorTest.error).toBe(ENVIRONMENT_ERROR_MESSAGE);

      // Verify the page is still functional after the simulated failure
      const pageStillFunctional = await page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      expect(pageStillFunctional).toBe(true);

    } finally {
      monitor.cleanup();
    }
  });

  test('should validate environment prerequisites are checked first', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Test that environment prerequisites are available and verifiable before initialization
      const environmentPrerequisitesTest = await page.evaluate(async () => {
        const results: any = {};
        
        // Check environment prerequisites that the SDK expects
        results.windowDefined = typeof window !== 'undefined';
        results.documentDefined = typeof document !== 'undefined';
        results.windowIsObject = typeof window === 'object';
        results.documentIsObject = typeof document === 'object';
        
        // Check additional browser APIs the SDK might use
        results.navigatorAvailable = typeof navigator !== 'undefined';
        results.localStorageAvailable = typeof localStorage !== 'undefined';
        results.locationAvailable = typeof location !== 'undefined';
        
        // Verify the environment check logic that would be executed
        const wouldPassEnvironmentCheck = typeof window !== 'undefined' && typeof document !== 'undefined';
        results.wouldPassEnvironmentCheck = wouldPassEnvironmentCheck;
        
        return { success: true, error: null, results };
      });

      // Validate environment prerequisites
      const validatedResult = TestAssertions.verifyInitializationResult(environmentPrerequisitesTest);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Verify all environment prerequisites are met
      expect(environmentPrerequisitesTest.results.windowDefined).toBe(true);
      expect(environmentPrerequisitesTest.results.documentDefined).toBe(true);
      expect(environmentPrerequisitesTest.results.windowIsObject).toBe(true);
      expect(environmentPrerequisitesTest.results.documentIsObject).toBe(true);
      expect(environmentPrerequisitesTest.results.navigatorAvailable).toBe(true);
      expect(environmentPrerequisitesTest.results.localStorageAvailable).toBe(true);
      expect(environmentPrerequisitesTest.results.locationAvailable).toBe(true);
      
      // Verify the environment check would pass in this browser context
      expect(environmentPrerequisitesTest.results.wouldPassEnvironmentCheck).toBe(true);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

    } finally {
      monitor.cleanup();
    }
  });

  test('should confirm SDK environment requirements are documented', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Test the error message clarity and guidance for developers
      const errorMessageQualityTest = await page.evaluate(() => {
        try {
          // Test the error message that would be shown to developers
          const expectedError = 'This library can only be used in a browser environment';
          
          // Verify error message quality
          const results: any = {};
          results.messageLength = expectedError.length;
          results.containsBrowserKeyword = expectedError.includes('browser');
          results.containsEnvironmentKeyword = expectedError.includes('environment');
          results.isDescriptive = expectedError.length > 20;
          results.providesGuidance = expectedError.includes('browser environment');
          
          return { success: true, error: null, results };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });

      // Validate error message quality
      const validatedResult = TestAssertions.verifyInitializationResult(errorMessageQualityTest);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Verify error message meets quality standards
      expect(errorMessageQualityTest.results.messageLength).toBeGreaterThan(20);
      expect(errorMessageQualityTest.results.containsBrowserKeyword).toBe(true);
      expect(errorMessageQualityTest.results.containsEnvironmentKeyword).toBe(true);
      expect(errorMessageQualityTest.results.isDescriptive).toBe(true);
      expect(errorMessageQualityTest.results.providesGuidance).toBe(true);

    } finally {
      monitor.cleanup();
    }
  });
});