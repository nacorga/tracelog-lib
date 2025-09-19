import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { DEFAULT_CONFIG } from '../../constants/common.constants';
import { ERROR_TRACKING_CONSTANTS } from '../../constants/error-tracking.constants';

/**
 * Validates JavaScript errors and unhandled promise rejections are captured with appropriate sampling.
 * Tests global window.onerror and unhandledrejection event capture, error message sanitization,
 * stack trace capture, sampling application, and QA mode behavior.
 */
test.describe('Error Tracking - JavaScript Errors', () => {
  test('should capture JavaScript errors with proper metadata', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog with default sampling (10%)
      const initResult = await TestUtils.initializeTraceLog(page, DEFAULT_CONFIG);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test 1: Synchronous JavaScript error
      const syncErrorResult = await TestUtils.generateSynchronousError(
        page,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.SYNC_ERROR,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.FILENAMES.TEST_SCRIPT,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.LINE_NUMBERS.DEFAULT,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.COLUMN_NUMBERS.DEFAULT,
      );

      expect(syncErrorResult.errorTriggered).toBe(true);
      await TestUtils.waitForTimeout(page, 500);

      // Test 2: Unhandled promise rejection
      await TestUtils.generatePromiseRejection(
        page,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.PROMISE_REJECTION,
      );

      await TestUtils.waitForTimeout(page, 500);

      // Test 3: Error in setTimeout callback
      await TestUtils.generateTimeoutCallbackError(page, ERROR_TRACKING_CONSTANTS.TIMEOUTS.SHORT_WAIT);

      await TestUtils.waitForTimeout(page, ERROR_TRACKING_CONSTANTS.TIMEOUTS.LONG_WAIT);

      // Verify no TraceLog internal errors occurred
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      // Check that error handling infrastructure is working
      const hasErrorActivity = TestUtils.validateErrorActivity(monitor.debugLogs, ['error']);

      expect(hasErrorActivity).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle promise rejections correctly', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const initResult = await TestUtils.initializeTraceLog(page, DEFAULT_CONFIG);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test different types of promise rejections
      await TestUtils.generateMultiplePromiseRejections(page);

      await TestUtils.waitForTimeout(page, ERROR_TRACKING_CONSTANTS.TIMEOUTS.LONG_WAIT);

      // Verify no TraceLog internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      // Check for promise-related logs
      const hasPromiseActivity = TestUtils.validateErrorActivity(monitor.debugLogs, ['promise', 'rejection']);

      expect(hasPromiseActivity).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should apply error sampling correctly', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // First initialize TraceLog with default config to ensure it's working
      const initResult = await TestUtils.initializeTraceLog(page, DEFAULT_CONFIG);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test sampling behavior by checking if sampling logic exists and works
      // Since 'test' ID gets debug mode (100% sampling), we can test the sampling function directly
      const samplingTestResult = await TestUtils.testErrorSampling(page);

      await TestUtils.waitForTimeout(page, 500);

      // Verify sampling rates are approximately correct
      for (const result of samplingTestResult) {
        const isValidSamplingRate = TestUtils.validateSamplingRate(
          result,
          ERROR_TRACKING_CONSTANTS.SAMPLING.SAMPLING_TOLERANCE,
        );
        expect(isValidSamplingRate).toBe(true);
      }

      // Generate a few test errors to verify error handling is working
      await TestUtils.generateSynchronousError(
        page,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.SAMPLING_TEST,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.FILENAMES.SAMPLING_TEST,
      );

      await TestUtils.waitForTimeout(page, 500);

      // Verify error handling infrastructure is working
      const hasErrorHandling = TestUtils.validateErrorActivity(monitor.debugLogs, [
        ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.ERROR_HANDLER,
        'error',
      ]);

      expect(hasErrorHandling).toBe(true);

      // Verify no internal errors during sampling
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should bypass sampling in QA mode', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog with test config (which automatically gets debug mode = 100% sampling)
      const testConfig = { ...DEFAULT_CONFIG }; // 'test' ID gets debug mode automatically
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Generate multiple test errors
      await TestUtils.generateQaModeErrors(page, 5);

      await TestUtils.waitForTimeout(page, 500);

      // In debug/QA mode, all errors should be captured (no sampling skip messages)
      const samplingSkipLogs = monitor.debugLogs.filter((log) =>
        ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.SAMPLING_SKIP_KEYWORDS.some((keyword) => log.includes(keyword)),
      );

      // Should not skip errors in debug mode
      expect(samplingSkipLogs.length).toBe(0);

      // Verify error handling is active
      const hasErrorActivity = TestUtils.validateErrorActivity(monitor.debugLogs, [
        ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.ERROR_HANDLER,
        'error',
      ]);
      expect(hasErrorActivity).toBe(true);

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should capture error metadata correctly', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog with high sampling rate for reliable testing
      const highSamplingConfig = {
        ...DEFAULT_CONFIG,
        errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE,
      };
      const initResult = await TestUtils.initializeTraceLog(page, highSamplingConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Generate error with specific metadata
      await TestUtils.generateSynchronousError(
        page,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.METADATA_TEST,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.FILENAMES.METADATA_TEST,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.LINE_NUMBERS.METADATA_TEST,
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.COLUMN_NUMBERS.METADATA_TEST,
      );

      await TestUtils.waitForTimeout(page, 500);

      // Verify error metadata is captured in logs
      const hasMetadataActivity = TestUtils.validateErrorActivity(monitor.debugLogs, [
        ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.METADATA_TEST,
        ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.ERROR_HANDLER,
      ]);

      expect(hasMetadataActivity).toBe(true);

      // Check for filename and line number in debug logs
      const hasDetailedLogs = TestUtils.validateErrorActivity(monitor.debugLogs, ['filename', 'lineno']);

      expect(hasDetailedLogs).toBe(true);

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle various error types', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog with high sampling for testing
      const testConfig = {
        ...DEFAULT_CONFIG,
        errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE,
      };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test different types of JavaScript errors
      await TestUtils.generateVariousErrorTypes(page);

      await TestUtils.waitForTimeout(page, 500);

      // Verify different error types are handled
      const hasErrorTypeActivity = TestUtils.validateErrorActivity(monitor.debugLogs, [
        'ReferenceError',
        'TypeError',
        'SyntaxError',
        'RangeError',
      ]);

      expect(hasErrorTypeActivity).toBe(true);

      // Verify no internal TraceLog errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
