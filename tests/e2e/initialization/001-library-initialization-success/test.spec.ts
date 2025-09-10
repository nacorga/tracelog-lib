import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Library Initialization - Success', () => {
  // Constants
  const INITIALIZATION_PAGE_URL = '/';
  const VALIDATION_PAGE_URL = '/pages/validation/index.html';
  const DEFAULT_TEST_CONFIG = { id: 'test' };
  const READY_STATUS_TEXT = 'Status: Ready for testing';
  const INITIALIZED_STATUS_TEXT = 'Status: Initialized successfully';
  const VALIDATION_PASS_TEXT = 'PASS: Valid project ID accepted';

  // Performance requirements from spec
  const PERFORMANCE_REQUIREMENTS = {
    TOTAL_INITIALIZATION_TIME: 500, // <500ms
    CONFIG_LOADING_TIME: 200, // <200ms
    STORAGE_OPERATIONS_TIME: 100, // <100ms
    HANDLER_REGISTRATION_TIME: 100, // <100ms
    USER_ID_GENERATION_TIME: 50, // <50ms
    SESSION_SETUP_TIME: 50, // <50ms
  };

  test('should successfully initialize TraceLog with valid project ID', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate to page and wait for ready state
      await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
      await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

      // Verify TraceLog is available globally
      const traceLogAvailable = await TestHelpers.verifyTraceLogAvailability(page);
      expect(traceLogAvailable).toBe(true);

      // Initialize TraceLog with performance measurement
      const startTime = Date.now();
      const initResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
      const initDuration = Date.now() - startTime;

      const validatedResult = TestAssertions.verifyInitializationResult(initResult);
      expect(validatedResult.success).toBe(true);
      expect(validatedResult.hasError).toBe(false);

      // Performance requirement: Total initialization time <500ms
      expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

      // Wait for initialization to complete
      await TestHelpers.waitForTimeout(page);

      // Verify initialization status
      await expect(page.getByTestId('init-status')).toContainText(INITIALIZED_STATUS_TEXT);

      // Verify no errors occurred
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      // Verify success message was logged
      expect(TestAssertions.verifyConsoleMessages(monitor.consoleMessages, 'TraceLog initialized successfully')).toBe(
        true,
      );

      // Verify TraceLog reports as initialized
      const isInitialized = await TestHelpers.isTraceLogInitialized(page);
      expect(isInitialized).toBe(true);

      // Verify localStorage entries
      const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
      expect(localStorageKeys.length).toBeGreaterThan(0);

      // Test DOM event handlers
      await TestHelpers.triggerClickEvent(page);

      // Verify no errors during interaction
      const postClickErrors = monitor.traceLogErrors.filter(
        (msg) => msg.toLowerCase().includes('error') || msg.toLowerCase().includes('uncaught'),
      );
      expect(postClickErrors).toHaveLength(0);

      // Test custom event functionality
      const customEventResult = await TestHelpers.testCustomEvent(page, 'test_initialization_event', { test: true });
      const validatedCustomResult = TestAssertions.verifyInitializationResult(customEventResult);
      expect(validatedCustomResult.success).toBe(true);
      expect(validatedCustomResult.hasError).toBe(false);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate project ID requirement', async ({ browser }) => {
    // Create isolated context for validation testing
    const { page, cleanup } = await TestHelpers.createIsolatedContext(browser);

    try {
      // Navigate to validation page
      await TestHelpers.navigateAndWaitForReady(page, VALIDATION_PAGE_URL);
      await TestHelpers.waitForTimeout(page);

      // Test 1: No project ID validation
      const noIdResult = await page.evaluate(() => {
        return (window as any).testNoProjectId();
      });
      const validatedNoIdResult = TestAssertions.verifyInitializationResult(noIdResult);
      expect(validatedNoIdResult.success).toBe(false);
      expect(noIdResult.error).toContain('Project ID is required');

      // Test 2: Empty project ID validation
      const emptyIdResult = await page.evaluate(() => {
        return (window as any).testEmptyProjectId();
      });
      const validatedEmptyIdResult = TestAssertions.verifyInitializationResult(emptyIdResult);
      expect(validatedEmptyIdResult.success).toBe(false);
      expect(emptyIdResult.error).toContain('Project ID is required');

      // Test 3: Valid project ID should succeed
      const validIdResult = await page.evaluate(() => {
        return (window as any).testValidProjectId();
      });

      const validatedValidIdResult = TestAssertions.verifyInitializationResult(validIdResult);
      expect(validatedValidIdResult.success).toBe(true);
      expect(validatedValidIdResult.hasError).toBe(false);

      // Verify validation status in UI
      await expect(page.getByTestId('validation-status')).toContainText(VALIDATION_PASS_TEXT);
    } finally {
      await cleanup();
    }
  });

  test('should handle initialization state properly', async ({ page }) => {
    // Navigate to page and wait for ready state
    await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
    await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

    // Perform first initialization with performance measurement
    const startTime = Date.now();
    const firstInitResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
    const initDuration = Date.now() - startTime;

    const validatedFirstResult = TestAssertions.verifyInitializationResult(firstInitResult);
    expect(validatedFirstResult.success).toBe(true);
    expect(validatedFirstResult.hasError).toBe(false);

    // Performance requirement: Total initialization time <500ms
    expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

    // Verify initialization state
    const isInitialized = await TestHelpers.isTraceLogInitialized(page);
    expect(isInitialized).toBe(true);

    // Test duplicate initialization handling
    const duplicateInitResult = await page.evaluate(async () => {
      try {
        // Try to initialize again directly with different config
        await (window as any).TraceLog.init({ id: 'test-duplicate' });
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Should succeed (gracefully handle duplicate initialization)
    const validatedDuplicateResult = TestAssertions.verifyInitializationResult(duplicateInitResult);
    expect(validatedDuplicateResult.success).toBe(true);

    // Should still report as initialized
    const stillInitialized = await TestHelpers.isTraceLogInitialized(page);
    expect(stillInitialized).toBe(true);
  });

  test('should enable all core functionality after initialization', async ({ page }) => {
    // Navigate to page and wait for ready state
    await TestHelpers.navigateAndWaitForReady(page, INITIALIZATION_PAGE_URL);
    await expect(page.getByTestId('init-status')).toContainText(READY_STATUS_TEXT);

    // Initialize TraceLog with performance measurement
    const startTime = Date.now();
    const initResult = await TestHelpers.initializeTraceLog(page, DEFAULT_TEST_CONFIG);
    const initDuration = Date.now() - startTime;

    const validatedResult = TestAssertions.verifyInitializationResult(initResult);
    expect(validatedResult.success).toBe(true);
    expect(validatedResult.hasError).toBe(false);

    // Performance requirement: Total initialization time <500ms
    expect(initDuration).toBeLessThan(PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME);

    // Wait for initialization to complete
    await TestHelpers.waitForTimeout(page);

    // Test core functionality availability
    const functionalityTests = await page.evaluate(() => {
      const results: any = {};

      try {
        // Test custom events functionality
        (window as any).TraceLog.event('test_custom', { feature: 'custom_events' });
        results.customEvents = true;
      } catch (error: any) {
        results.customEvents = false;
        results.customEventsError = error.message;
      }

      try {
        // Test isInitialized method
        results.isInitialized = (window as any).TraceLog.isInitialized();
      } catch (error: any) {
        results.isInitialized = false;
        results.isInitializedError = error.message;
      }

      return results;
    });

    // Verify functionality test results
    expect(functionalityTests.customEvents).toBe(true);
    expect(functionalityTests.isInitialized).toBe(true);

    // Test DOM event handlers through user interactions
    await TestHelpers.triggerClickEvent(page);
    await TestHelpers.triggerScrollEvent(page);

    // Verify no runtime errors occurred during interactions
    const hasRuntimeErrors = await TestHelpers.detectRuntimeErrors(page);
    expect(hasRuntimeErrors).toBeFalsy();
  });
});
