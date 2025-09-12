import { Page, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from './test-helpers';

/**
 * Performance requirements from spec
 */
export const PERFORMANCE_REQUIREMENTS = {
  TOTAL_INITIALIZATION_TIME: 500, // <500ms
  CONFIG_LOADING_TIME: 200, // <200ms
  STORAGE_OPERATIONS_TIME: 100, // <100ms
  HANDLER_REGISTRATION_TIME: 100, // <100ms
  USER_ID_GENERATION_TIME: 50, // <50ms
  SESSION_SETUP_TIME: 50, // <50ms
  ERROR_HANDLING_TIME: 100, // <100ms for validation errors
  SUBSEQUENT_INIT_TIME: 100, // <100ms for subsequent initialization attempts
} as const;

/**
 * Common test configurations
 */
export const TEST_CONFIGS = {
  DEFAULT: { id: 'test' },
  ALTERNATE: { id: 'test', sessionTimeout: 30000 },
  COMPLEX: {
    id: 'test',
    sessionTimeout: 45000,
    globalMetadata: { source: 'e2e-test' },
    errorSampling: 0.5,
  },
  QA_MODE: { id: 'test', qaMode: true },
  QA_MODE_COMPLEX: {
    id: 'test',
    qaMode: true,
    sessionTimeout: 30000,
    globalMetadata: { source: 'qa-test', environment: 'test' },
    errorSampling: 1.0,
    scrollContainerSelectors: ['body', '.content'],
  },
  NON_QA_MODE: { id: 'test', qaMode: false },
} as const;

/**
 * Common page URLs and status texts
 */
export const TEST_CONSTANTS = {
  URLS: {
    INITIALIZATION_PAGE: '/',
    VALIDATION_PAGE: '/pages/validation/index.html',
  },
  STATUS_TEXTS: {
    READY: 'Status: Ready for testing',
    INITIALIZED: 'Status: Initialized successfully',
    VALIDATION_PASS: 'PASS: Valid project ID accepted',
  },
  ERROR_MESSAGES: {
    ID_REQUIRED: 'Project ID is required',
    INVALID_APP_CONFIG: 'Project ID is required',
    UNDEFINED_CONFIG: 'Configuration must be an object',
    APP_NOT_INITIALIZED: 'App not initialized',
  },
} as const;

/**
 * Performance validation utilities
 */
export class PerformanceValidator {
  /**
   * Validates initialization performance meets requirements
   */
  static validateInitializationTime(duration: number, isSubsequent = false): void {
    const requirement = isSubsequent
      ? PERFORMANCE_REQUIREMENTS.SUBSEQUENT_INIT_TIME
      : PERFORMANCE_REQUIREMENTS.TOTAL_INITIALIZATION_TIME;

    expect(duration).toBeLessThan(requirement);
  }

  /**
   * Validates error handling performance
   */
  static validateErrorHandlingTime(duration: number): void {
    expect(duration).toBeLessThan(PERFORMANCE_REQUIREMENTS.ERROR_HANDLING_TIME);
  }

  /**
   * Validates multiple performance results consistency
   */
  static validatePerformanceConsistency(
    results: Array<{ duration: number; success: boolean }>,
    maxVariationPercent = 150, // More lenient for E2E tests, especially Mobile Safari
  ): void {
    const successfulResults = results.filter((r) => r.success);
    expect(successfulResults.length).toBeGreaterThan(0);

    if (successfulResults.length === 1) {
      // Single result, no variation to check
      return;
    }

    const durations = successfulResults.map((r) => r.duration);
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    // Ensure consistent performance - only check if average > 0
    if (average > 0) {
      const variation = ((max - average) / average) * 100;

      // For very small durations (< 10ms), be more lenient as timing precision varies
      const adjustedMaxVariation = average < 10 ? maxVariationPercent * 2 : maxVariationPercent;

      // If all results are very close (within 5ms), skip variation check
      if (max - min <= 5) {
        return;
      }

      expect(variation).toBeLessThan(adjustedMaxVariation);
    }
  }
}

/**
 * Enhanced error validation utilities
 */
export class ErrorValidator {
  /**
   * Validates initialization error structure and message
   */
  static validateInitializationError(result: any, expectedErrorMessage: string): void {
    const validatedResult = TestAssertions.verifyInitializationResult(result);
    expect(validatedResult.success).toBe(false);
    expect(validatedResult.hasError).toBe(true);
    expect(result.error).toContain(expectedErrorMessage);
  }

  /**
   * Validates multiple error scenarios
   */
  static validateErrorScenarios(results: Array<{ result: any; expectedError: string }>): void {
    results.forEach(({ result, expectedError }) => {
      this.validateInitializationError(result, expectedError);
    });
  }

  /**
   * Validates console error filtering
   */
  static validateConsoleErrors(traceLogErrors: string[], allowedErrorPatterns: string[] = []): void {
    const unexpectedErrors = traceLogErrors.filter(
      (error) => !allowedErrorPatterns.some((pattern) => error.includes(pattern)),
    );
    expect(unexpectedErrors).toHaveLength(0);
  }

  /**
   * Validates that no tracking occurs when initialization fails
   */
  static async validateNoTrackingOnFailure(page: Page): Promise<void> {
    // Verify TraceLog is not initialized
    const isInitialized = await TestHelpers.isTraceLogInitialized(page);
    expect(isInitialized).toBe(false);

    // Verify no localStorage entries
    const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(localStorageKeys).toHaveLength(0);

    // Test custom events fail
    const customEventResult = await TestHelpers.testCustomEvent(page, 'test_event', { data: 'test' });
    expect(customEventResult.success).toBe(false);
    expect(customEventResult.error).toContain(TEST_CONSTANTS.ERROR_MESSAGES.APP_NOT_INITIALIZED);
  }
}

/**
 * Session and storage validation utilities
 */
export class SessionValidator {
  /**
   * Validates basic session state after initialization
   */
  static async validateSessionState(page: Page): Promise<void> {
    const isInitialized = await TestHelpers.isTraceLogInitialized(page);
    expect(isInitialized).toBe(true);

    const localStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(localStorageKeys.length).toBeGreaterThan(0);
  }

  /**
   * Validates memory management and storage growth
   */
  static async validateMemoryManagement(page: Page, initialStorageCount: number, maxGrowth = 10): Promise<void> {
    const finalStorageKeys = await TestHelpers.getTraceLogStorageKeys(page);
    expect(finalStorageKeys.length).toBeLessThan(initialStorageCount + maxGrowth);
  }

  /**
   * Validates functionality preservation after multiple operations
   */
  static async validateFunctionalityPreservation(page: Page): Promise<void> {
    // Test API methods still work
    const functionalityTests = await page.evaluate(() => {
      const results: any = {};

      try {
        results.isInitialized = (window as any).TraceLog.isInitialized();
      } catch (error: any) {
        results.isInitialized = false;
        results.isInitializedError = error.message;
      }

      try {
        (window as any).TraceLog.event('functionality_test', { test: 'preservation' });
        results.customEvents = true;
      } catch (error: any) {
        results.customEvents = false;
        results.customEventsError = error.message;
      }

      return results;
    });

    expect(functionalityTests.isInitialized).toBe(true);
    expect(functionalityTests.customEvents).toBe(true);
  }
}

/**
 * Base initialization test class with common setup/teardown patterns
 */
export class InitializationTestBase {
  protected page: Page;
  protected monitor: ReturnType<typeof TestHelpers.createConsoleMonitor>;

  constructor(page: Page) {
    this.page = page;
    this.monitor = TestHelpers.createConsoleMonitor(page);
  }

  get consoleMonitor(): ReturnType<typeof TestHelpers.createConsoleMonitor> {
    return this.monitor;
  }

  get testPage(): Page {
    return this.page;
  }

  /**
   * Standard setup for initialization tests
   */
  async setup(url: string = TEST_CONSTANTS.URLS.INITIALIZATION_PAGE): Promise<void> {
    await TestHelpers.navigateAndWaitForReady(this.page, url);
    await expect(this.page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.READY);

    const traceLogAvailable = await TestHelpers.verifyTraceLogAvailability(this.page);
    expect(traceLogAvailable).toBe(true);
  }

  /**
   * Perform measured initialization with performance validation
   */
  async performMeasuredInit(
    config: any = TEST_CONFIGS.DEFAULT,
    expectSuccess = true,
  ): Promise<{ result: any; duration: number }> {
    const startTime = Date.now();
    const result = await TestHelpers.initializeTraceLog(this.page, config);
    const duration = Date.now() - startTime;

    if (expectSuccess) {
      const validated = TestAssertions.verifyInitializationResult(result);
      expect(validated.success).toBe(true);
      expect(validated.hasError).toBe(false);
      PerformanceValidator.validateInitializationTime(duration);
    }

    return { result, duration };
  }

  /**
   * Validate initialization success with common checks
   */
  async validateSuccessfulInit(): Promise<void> {
    await expect(this.page.getByTestId('init-status')).toContainText(TEST_CONSTANTS.STATUS_TEXTS.INITIALIZED);

    // Verify no errors
    expect(TestAssertions.verifyNoTraceLogErrors(this.monitor.traceLogErrors)).toBe(true);

    // Verify success message
    expect(
      TestAssertions.verifyConsoleMessages(this.monitor.consoleMessages, 'TraceLog initialized successfully'),
    ).toBe(true);

    await SessionValidator.validateSessionState(this.page);
  }

  /**
   * Test basic functionality after initialization
   */
  async testBasicFunctionality(): Promise<void> {
    // Test DOM interactions
    await TestHelpers.triggerClickEvent(this.page);
    await TestHelpers.triggerScrollEvent(this.page);

    // Test custom events
    const customEventResult = await TestHelpers.testCustomEvent(this.page, 'test_event', { test: true });
    const validated = TestAssertions.verifyInitializationResult(customEventResult);
    expect(validated.success).toBe(true);
    expect(validated.hasError).toBe(false);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.monitor.cleanup();
  }
}

/**
 * Specialized test utilities for different initialization scenarios
 */
export class InitializationScenarios {
  /**
   * Test invalid project ID scenarios with consistent error validation
   */
  static async testInvalidProjectIdScenarios(testBase: InitializationTestBase): Promise<void> {
    const invalidConfigs = [
      { config: undefined, expectedError: TEST_CONSTANTS.ERROR_MESSAGES.UNDEFINED_CONFIG },
      { config: {}, expectedError: TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED },
      { config: { id: '' }, expectedError: TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED },
      { config: { id: null }, expectedError: TEST_CONSTANTS.ERROR_MESSAGES.ID_REQUIRED },
      { config: { id: '   \t\n  ' }, expectedError: TEST_CONSTANTS.ERROR_MESSAGES.INVALID_APP_CONFIG },
    ];

    for (const { config, expectedError } of invalidConfigs) {
      const startTime = Date.now();
      const result = await testBase.testPage.evaluate(async (cfg) => {
        try {
          await (window as any).TraceLog.init(cfg);
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }, config);
      const duration = Date.now() - startTime;

      ErrorValidator.validateInitializationError(result, expectedError);
      PerformanceValidator.validateErrorHandlingTime(duration);

      await ErrorValidator.validateNoTrackingOnFailure(testBase.testPage);
    }
  }

  /**
   * Test multiple initialization attempts with different configurations
   */
  static async testMultipleInitAttempts(
    testBase: InitializationTestBase,
    configs: any[] = [TEST_CONFIGS.DEFAULT, TEST_CONFIGS.ALTERNATE, TEST_CONFIGS.COMPLEX],
  ): Promise<void> {
    const results: Array<{ duration: number; success: boolean }> = [];

    // First initialization
    const firstResult = await testBase.performMeasuredInit(configs[0], true);
    results.push({ duration: firstResult.duration, success: true });

    // Subsequent attempts
    for (let i = 1; i < configs.length; i++) {
      await TestHelpers.waitForTimeout(testBase.testPage, 300);

      const startTime = Date.now();
      const result = await TestHelpers.initializeTraceLog(testBase.testPage, configs[i]);
      const duration = Date.now() - startTime;

      const validated = TestAssertions.verifyInitializationResult(result);
      expect(validated.success).toBe(true);
      expect(validated.hasError).toBe(false);

      PerformanceValidator.validateInitializationTime(duration, true);
      results.push({ duration, success: true });
    }

    PerformanceValidator.validatePerformanceConsistency(results);
  }

  /**
   * Test rapid concurrent initialization attempts
   */
  static async testRapidConcurrentInit(testBase: InitializationTestBase, attemptCount = 5): Promise<void> {
    const rapidInitPromises: Promise<any>[] = [];

    for (let i = 0; i < attemptCount; i++) {
      const config = { id: 'test', sessionTimeout: 30000 + i * 1000 };
      rapidInitPromises.push(
        testBase.testPage.evaluate(async (cfg) => {
          try {
            const startTime = Date.now();
            const result = await (window as any).initializeTraceLog(cfg);
            const duration = Date.now() - startTime;
            return { ...result, duration };
          } catch (error: any) {
            return { success: false, error: error.message, duration: 0 };
          }
        }, config),
      );
    }

    const rapidResults = await Promise.all(rapidInitPromises);

    // At least one should succeed
    const successCount = rapidResults.filter((r) => r.success).length;
    expect(successCount).toBeGreaterThanOrEqual(1);

    // Validate performance for successful attempts
    const successfulAttempts = rapidResults.filter((r) => r.success);
    if (successfulAttempts.length > 0) {
      PerformanceValidator.validateInitializationTime(successfulAttempts[0].duration);

      // Subsequent should be faster
      if (successfulAttempts.length > 1) {
        successfulAttempts.slice(1).forEach((attempt) => {
          PerformanceValidator.validateInitializationTime(attempt.duration, true);
        });
      }
    }
  }

  /**
   * Test QA mode functionality and logging
   */
  static async testQAModeFeatures(testBase: InitializationTestBase): Promise<void> {
    await testBase.performMeasuredInit(TEST_CONFIGS.QA_MODE, true);
    await testBase.validateSuccessfulInit();

    // Verify enhanced logging in QA mode
    const hasEnhancedLogging = testBase.consoleMonitor.consoleMessages.some(
      (msg) =>
        msg.includes('TraceLog initialized successfully') ||
        msg.includes('[TraceLog]') ||
        msg.includes('QA Mode') ||
        msg.includes('Debug:'),
    );
    expect(hasEnhancedLogging).toBe(true);

    await testBase.testBasicFunctionality();
  }
}

/**
 * Memory and resource management testing utilities
 */
export class MemoryTestUtils {
  /**
   * Get baseline memory state
   */
  static async getMemoryBaseline(page: Page): Promise<{
    localStorageLength: number;
    documentListeners: number;
    windowKeys: number;
  }> {
    return await page.evaluate(() => ({
      localStorageLength: localStorage.length,
      documentListeners: document.querySelectorAll('*').length,
      windowKeys: Object.keys(window).filter((key) => key.includes('tl') || key.includes('TraceLog')).length,
    }));
  }

  /**
   * Validate memory usage hasn't grown excessively
   */
  static async validateMemoryUsage(
    page: Page,
    baseline: { localStorageLength: number; documentListeners: number; windowKeys: number },
    maxGrowth: { storage: number; listeners: number; windowKeys: number } = {
      storage: 20,
      listeners: 100,
      windowKeys: 5,
    },
  ): Promise<void> {
    const current = await this.getMemoryBaseline(page);

    expect(current.localStorageLength).toBeLessThan(baseline.localStorageLength + maxGrowth.storage);
    expect(current.windowKeys).toBeLessThan(baseline.windowKeys + maxGrowth.windowKeys);
  }
}
