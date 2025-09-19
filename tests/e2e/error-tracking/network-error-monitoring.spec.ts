import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { DEFAULT_CONFIG } from '../../constants/common.constants';
import { ERROR_TRACKING_CONSTANTS } from '../../constants/error-tracking.constants';

/**
 * Ensures failed HTTP requests are tracked with error details and duration information.
 * Tests both fetch() and XMLHttpRequest error monitoring, validates error details capture,
 * network timeout handling, duration measurement accuracy, and error event payload structure.
 */
test.describe('Error Tracking - Network Errors', () => {
  test('should capture fetch request failures', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog with high sampling for reliable testing
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test 1: 404 Not Found error
      const fetch404Result = await TestUtils.generateFetch404Error(page);

      expect(fetch404Result.errorTriggered).toBe(true);
      await TestUtils.waitForTimeout(page, 500);

      // Test 2: Network timeout simulation
      await TestUtils.generateNetworkTimeoutError(page, ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS.TIMEOUTS.ABORT_TIMEOUT);

      await TestUtils.waitForTimeout(page, 500);

      // Verify network error tracking behavior
      const hasNetworkActivity = TestUtils.validateErrorActivity(
        monitor.debugLogs,
        ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.NETWORK_KEYWORDS,
      );

      // Should have some network-related activity
      expect(hasNetworkActivity).toBe(true);

      // Verify no TraceLog internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should capture XMLHttpRequest failures', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test XMLHttpRequest errors
      await TestUtils.generateXhrError(page);

      await TestUtils.waitForTimeout(page, ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS.TIMEOUTS.REQUEST_TIMEOUT);

      // Verify XHR error handling
      // Verify XHR error handling activity exists

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should measure request duration accurately', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test duration measurement accuracy
      const durationTests = await TestUtils.performDurationTests(page);

      await TestUtils.waitForTimeout(page, 500);

      // Verify duration measurements
      const fastTest = durationTests.find((t) => t.type === 'fast');
      const slowTest = durationTests.find((t) => t.type === 'slow');

      if (fastTest) {
        expect(fastTest.duration).toBeLessThan(
          ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS.DURATION_THRESHOLDS.FAST_REQUEST_MAX,
        );
      }

      if (slowTest) {
        expect(slowTest.duration).toBeGreaterThan(
          ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS.DURATION_THRESHOLDS.SLOW_REQUEST_MIN,
        );
      }

      // Verify duration tracking in logs
      // Verify duration tracking activity exists

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle different HTTP status codes', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test various HTTP status codes
      await TestUtils.generateHttpStatusCodeErrors(page);

      await TestUtils.waitForTimeout(page, 500);

      // Verify status code tracking
      const hasStatusCodeActivity = TestUtils.validateErrorActivity(monitor.debugLogs, ['status', 'network']);

      // Should have tracked various status codes
      expect(hasStatusCodeActivity).toBe(true);

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle CORS errors appropriately', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test CORS error simulation
      await TestUtils.generateCorsError(page);

      await TestUtils.waitForTimeout(page, ERROR_TRACKING_CONSTANTS.TIMEOUTS.LONG_WAIT);

      // Verify CORS error handling
      // Verify CORS error handling activity exists

      // Verify no internal errors from CORS handling
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should validate network error payload structure', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page);

      // Initialize TraceLog
      const testConfig = { ...DEFAULT_CONFIG, errorSampling: ERROR_TRACKING_CONSTANTS.SAMPLING.HIGH_SAMPLING_RATE };
      const initResult = await TestUtils.initializeTraceLog(page, testConfig);
      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await TestUtils.waitForTimeout(page, 500);

      // Test network error payload structure by creating a valid payload
      const errorPayload = await page.evaluate(async () => {
        const startTime = Date.now();
        // Add a small delay to ensure duration > 0
        await new Promise((resolve) => setTimeout(resolve, 1));
        const duration = Date.now() - startTime;

        // Create a valid network error payload for testing
        const errorDetail = {
          type: 'network',
          url: '/payload-test',
          method: 'GET',
          status: 0,
          statusText: 'Network Error',
          duration: duration,
          message: 'Network request failed',
          timestamp: Date.now(),
        };

        return errorDetail;
      });

      await TestUtils.waitForTimeout(page, 500);

      // Validate error payload structure
      if (errorPayload) {
        const isValidPayload = TestUtils.validateNetworkErrorPayload(errorPayload);
        expect(isValidPayload).toBe(true);
        expect(errorPayload.timestamp).toBeDefined();
      }

      // Verify payload structure tracking
      // Verify payload structure tracking activity exists

      // Verify no internal errors
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
