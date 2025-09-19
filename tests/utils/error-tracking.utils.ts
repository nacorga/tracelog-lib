import { Page } from '@playwright/test';
import { ERROR_TRACKING_CONSTANTS } from '../constants/error-tracking.constants';
import {
  ErrorEventResult,
  NetworkErrorTestResult,
  PerformanceTestResult,
  SamplingTestResult,
  DurationTestResult,
  NetworkErrorDetail,
  LegitimateDataTestCase,
} from '../types/error-tracking.types';

/**
 * Error tracking utilities for TraceLog E2E tests
 * Contains all common functionality for generating and testing different types of errors
 */

/**
 * JavaScript Error Generation Utilities
 */

/**
 * Generates a synchronous JavaScript error with specified metadata
 */
export async function generateSynchronousError(
  page: Page,
  errorMessage: string = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.SYNC_ERROR,
  filename: string = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.FILENAMES.TEST_SCRIPT,
  lineno: number = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.LINE_NUMBERS.DEFAULT,
  colno: number = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.COLUMN_NUMBERS.DEFAULT,
): Promise<ErrorEventResult> {
  return await page.evaluate(
    ({ errorMessage, filename, lineno, colno }) => {
      try {
        // This will trigger a ReferenceError
        (window as unknown as { nonExistentFunction: () => void }).nonExistentFunction();
        return { errorTriggered: false };
      } catch (error: unknown) {
        // Manually trigger the error event to simulate how it would be captured
        const actualErrorMessage = error instanceof Error ? error.message : errorMessage;
        const errorEvent = new ErrorEvent('error', {
          message: actualErrorMessage,
          filename: filename,
          lineno: lineno,
          colno: colno,
          error: error,
        });
        window.dispatchEvent(errorEvent);
        return { errorTriggered: true, errorMessage: actualErrorMessage };
      }
    },
    { errorMessage, filename, lineno, colno },
  );
}

/**
 * Generates an unhandled promise rejection
 */
export async function generatePromiseRejection(
  page: Page,
  rejectionValue: string = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS.ERROR_MESSAGES.PROMISE_REJECTION,
): Promise<void> {
  await page.evaluate((rejectionValue) => {
    // Create an unhandled promise rejection
    Promise.reject(new Error(rejectionValue));
  }, rejectionValue);
}

/**
 * Generates multiple promise rejections of different types
 */
export async function generateMultiplePromiseRejections(page: Page): Promise<void> {
  await page.evaluate(() => {
    // String rejection
    Promise.reject('String error message');

    // Error object rejection
    Promise.reject(new Error('Error object rejection'));

    // Custom object rejection
    Promise.reject({ code: 'CUSTOM_ERROR', message: 'Custom error object' });
  });
}

/**
 * Generates an error in a setTimeout callback
 */
export async function generateTimeoutCallbackError(
  page: Page,
  delay: number = ERROR_TRACKING_CONSTANTS.TIMEOUTS.SHORT_WAIT,
): Promise<void> {
  await page.evaluate((delay) => {
    setTimeout(() => {
      try {
        throw new Error('setTimeout callback error');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'callback.js',
          lineno: 10,
          colno: 8,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, delay);
  }, delay);
}

/**
 * Generates errors of various JavaScript types
 */
export async function generateVariousErrorTypes(page: Page): Promise<void> {
  const { ERROR_TYPES } = ERROR_TRACKING_CONSTANTS.JAVASCRIPT_ERRORS;

  for (const errorTest of ERROR_TYPES) {
    await page.evaluate((test) => {
      try {
        eval(test.code);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? `${test.type}: ${error.message}` : `${test.type}: Unknown error`;
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: `${test.type.toLowerCase()}-test.js`,
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, errorTest);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates multiple errors for QA mode testing
 */
export async function generateQaModeErrors(page: Page, count = 5): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate((index) => {
      try {
        throw new Error(`QA mode test error ${index}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'qa-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, i);
    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.SHORT_WAIT);
  }
}

/**
 * Network Error Generation Utilities
 */

/**
 * Generates a fetch request that results in a 404 error
 */
export async function generateFetch404Error(page: Page): Promise<NetworkErrorTestResult> {
  return await page.evaluate(async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('/nonexistent-endpoint');
      const duration = Date.now() - startTime;

      if (!response.ok) {
        // Manually trigger error tracking for non-ok responses
        const errorEvent = new CustomEvent('network-error', {
          detail: {
            type: 'network',
            url: '/nonexistent-endpoint',
            method: 'GET',
            status: response.status,
            statusText: response.statusText,
            duration: duration,
          },
        });
        window.dispatchEvent(errorEvent);

        return {
          status: response.status,
          statusText: response.statusText,
          duration: duration,
          errorTriggered: true,
        };
      }

      return { status: response.status, errorTriggered: false, duration };
    } catch {
      const duration = Date.now() - startTime;

      // Trigger error tracking for network failures
      const errorEvent = new CustomEvent('network-error', {
        detail: {
          type: 'network',
          url: '/nonexistent-endpoint',
          method: 'GET',
          status: 0,
          statusText: 'Network Error',
          duration: duration,
          message: 'Network error',
        },
      });
      window.dispatchEvent(errorEvent);

      return {
        error: 'Network error',
        duration: duration,
        errorTriggered: true,
      };
    }
  });
}

/**
 * Generates a network timeout error
 */
export async function generateNetworkTimeoutError(
  page: Page,
  timeoutMs: number = ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS.TIMEOUTS.ABORT_TIMEOUT,
): Promise<void> {
  await page.evaluate(async (timeoutMs) => {
    const startTime = Date.now();
    try {
      // Create a request that will timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      await fetch('/slow-endpoint', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch {
      const duration = Date.now() - startTime;

      const errorEvent = new CustomEvent('network-error', {
        detail: {
          type: 'network',
          url: '/slow-endpoint',
          method: 'GET',
          status: 0,
          statusText: 'Timeout',
          duration: duration,
          message: 'Request timeout',
        },
      });
      window.dispatchEvent(errorEvent);
    }
  }, timeoutMs);
}

/**
 * Generates XMLHttpRequest errors
 */
export async function generateXhrError(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const xhr = new XMLHttpRequest();

      xhr.onload = function (): void {
        const duration = Date.now() - startTime;

        if (xhr.status >= 400) {
          // Trigger error tracking for 4xx/5xx responses
          const errorEvent = new CustomEvent('network-error', {
            detail: {
              type: 'network',
              url: '/xhr-error-test',
              method: 'GET',
              status: xhr.status,
              statusText: xhr.statusText,
              duration: duration,
            },
          });
          window.dispatchEvent(errorEvent);
        }

        resolve({
          status: xhr.status,
          statusText: xhr.statusText,
          duration: duration,
          errorTriggered: xhr.status >= 400,
        });
      };

      xhr.onerror = function (): void {
        const duration = Date.now() - startTime;

        const errorEvent = new CustomEvent('network-error', {
          detail: {
            type: 'network',
            url: '/xhr-error-test',
            method: 'GET',
            status: 0,
            statusText: 'Network Error',
            duration: duration,
            message: 'XHR network error',
          },
        });
        window.dispatchEvent(errorEvent);

        resolve({
          error: 'XHR network error',
          duration: duration,
          errorTriggered: true,
        });
      };

      xhr.ontimeout = function (): void {
        const duration = Date.now() - startTime;

        const errorEvent = new CustomEvent('network-error', {
          detail: {
            type: 'network',
            url: '/xhr-error-test',
            method: 'GET',
            status: 0,
            statusText: 'Timeout',
            duration: duration,
            message: 'XHR timeout',
          },
        });
        window.dispatchEvent(errorEvent);

        resolve({
          error: 'XHR timeout',
          duration: duration,
          errorTriggered: true,
        });
      };

      xhr.open('GET', '/xhr-error-test');
      xhr.timeout = 1000;
      xhr.send();
    });
  });
}

/**
 * Generates errors for various HTTP status codes
 */
export async function generateHttpStatusCodeErrors(page: Page): Promise<void> {
  const { HTTP_STATUS_CODES } = ERROR_TRACKING_CONSTANTS.NETWORK_ERRORS;

  for (const statusCode of HTTP_STATUS_CODES) {
    await page.evaluate(async (code) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`/status/${code}`);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorEvent = new CustomEvent('network-error', {
            detail: {
              type: 'network',
              url: `/status/${code}`,
              method: 'GET',
              status: response.status,
              statusText: response.statusText,
              duration: duration,
            },
          });
          window.dispatchEvent(errorEvent);
        }
      } catch {
        const duration = Date.now() - startTime;

        const errorEvent = new CustomEvent('network-error', {
          detail: {
            type: 'network',
            url: `/status/${code}`,
            method: 'GET',
            status: 0,
            statusText: 'Network Error',
            duration: duration,
            message: 'Network error',
          },
        });
        window.dispatchEvent(errorEvent);
      }
    }, statusCode);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.SHORT_WAIT);
  }
}

/**
 * Generates CORS errors
 */
export async function generateCorsError(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const startTime = Date.now();
    try {
      // This will likely trigger a CORS error
      await fetch('https://httpbin.org/status/404', {
        mode: 'cors',
        headers: {
          'X-Custom-Header': 'test', // This might trigger CORS preflight
        },
      });
    } catch {
      const duration = Date.now() - startTime;

      // Trigger error tracking for CORS errors
      const errorEvent = new CustomEvent('network-error', {
        detail: {
          type: 'network',
          url: 'https://httpbin.org/status/404',
          method: 'GET',
          status: 0,
          statusText: 'CORS Error',
          duration: duration,
          message: 'CORS error',
        },
      });
      window.dispatchEvent(errorEvent);
    }
  });
}

/**
 * Performs duration measurement tests
 */
export async function performDurationTests(page: Page): Promise<DurationTestResult[]> {
  return await page.evaluate(async () => {
    const results: Array<{ type: string; duration: number }> = [];

    // Test 1: Fast request (should complete quickly)
    const fastStart = performance.now();
    try {
      await fetch('/fast-test', { method: 'HEAD' }); // HEAD request should be fast
    } catch {
      const fastDuration = performance.now() - fastStart;

      const errorEvent = new CustomEvent('network-error', {
        detail: {
          type: 'network',
          url: '/fast-test',
          method: 'HEAD',
          status: 0,
          statusText: 'Network Error',
          duration: fastDuration,
          message: 'Fast request error',
        },
      });
      window.dispatchEvent(errorEvent);

      results.push({ type: 'fast', duration: fastDuration });
    }

    // Test 2: Simulated slow request
    const slowStart = performance.now();
    try {
      // Simulate a slow request by adding artificial delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      await fetch('/slow-test');
    } catch {
      const slowDuration = performance.now() - slowStart;

      const errorEvent = new CustomEvent('network-error', {
        detail: {
          type: 'network',
          url: '/slow-test',
          method: 'GET',
          status: 0,
          statusText: 'Network Error',
          duration: slowDuration,
          message: 'Slow request error',
        },
      });
      window.dispatchEvent(errorEvent);

      results.push({ type: 'slow', duration: slowDuration });
    }

    return results;
  });
}

/**
 * PII Sanitization Utilities
 */

/**
 * Generates errors with email addresses for sanitization testing
 */
export async function generateEmailErrors(page: Page): Promise<void> {
  const { EMAILS } = ERROR_TRACKING_CONSTANTS.PII_PATTERNS;

  for (const email of EMAILS) {
    await page.evaluate((testEmail) => {
      try {
        throw new Error(`Failed to process user: ${testEmail}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'email-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, email);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates errors with phone numbers for sanitization testing
 */
export async function generatePhoneNumberErrors(page: Page): Promise<void> {
  const { PHONE_NUMBERS } = ERROR_TRACKING_CONSTANTS.PII_PATTERNS;

  for (const phone of PHONE_NUMBERS) {
    await page.evaluate((testPhone) => {
      try {
        throw new Error(`Invalid phone number: ${testPhone}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'phone-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, phone);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates errors with credit card numbers for sanitization testing
 */
export async function generateCreditCardErrors(page: Page): Promise<void> {
  const { CREDIT_CARDS } = ERROR_TRACKING_CONSTANTS.PII_PATTERNS;

  for (const card of CREDIT_CARDS) {
    await page.evaluate((testCard) => {
      try {
        throw new Error(`Payment failed for card: ${testCard}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'card-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, card);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates errors with URL parameters for sanitization testing
 */
export async function generateUrlParameterErrors(page: Page): Promise<void> {
  const { URL_PARAMETERS } = ERROR_TRACKING_CONSTANTS.PII_PATTERNS;

  for (const url of URL_PARAMETERS) {
    await page.evaluate((testUrl) => {
      try {
        throw new Error(`Request failed to: ${testUrl}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'url-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, url);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates errors with legitimate data that should be preserved
 */
export async function generateLegitimateDataErrors(page: Page): Promise<void> {
  const { LEGITIMATE_DATA } = ERROR_TRACKING_CONSTANTS;

  for (const test of LEGITIMATE_DATA) {
    await page.evaluate((testData) => {
      try {
        throw new Error(testData.message);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'legitimate-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, test);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Generates stack trace errors with PII for sanitization testing
 */
export async function generateStackTraceWithPii(page: Page): Promise<void> {
  await page.evaluate(() => {
    function processUserData(email: string, phone: string): void {
      // Create a function that will appear in stack trace
      function validateEmail(userEmail: string): void {
        if (!userEmail.includes('@')) {
          throw new Error(`Invalid email format for: ${userEmail}`);
        }
      }

      function validatePhone(userPhone: string): void {
        throw new Error(`Phone validation failed for: ${userPhone}`);
      }

      try {
        validateEmail(email);
        validatePhone(phone);
      } catch (error: unknown) {
        // This error will include PII in the stack trace
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'stack-trace-test.js',
          lineno: 5,
          colno: 12,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }

    // Call with PII data
    processUserData('sensitive@email.com', '555-123-4567');
  });
}

/**
 * Generates errors with complex PII patterns
 */
export async function generateComplexPiiErrors(page: Page): Promise<void> {
  const { COMPLEX_PII_CASES } = ERROR_TRACKING_CONSTANTS;

  for (const test of COMPLEX_PII_CASES) {
    await page.evaluate((testData) => {
      try {
        throw new Error(testData.message);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'complex-test.js',
          lineno: 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }, test);

    await page.waitForTimeout(ERROR_TRACKING_CONSTANTS.TIMEOUTS.DEFAULT_WAIT);
  }
}

/**
 * Performance Testing Utilities
 */

/**
 * Performs performance testing for error sanitization
 */
export async function performSanitizationPerformanceTest(page: Page): Promise<PerformanceTestResult> {
  return await page.evaluate(() => {
    const iterations = 50;
    const testMessage = 'Error processing user@example.com with phone (555) 123-4567 and card 4111-1111-1111-1111';
    const startTime = performance.now();

    // Generate multiple errors for performance testing
    for (let i = 0; i < iterations; i++) {
      try {
        throw new Error(`${testMessage} iteration ${i}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorEvent = new ErrorEvent('error', {
          message: errorMessage,
          filename: 'performance-test.js',
          lineno: i + 1,
          colno: 1,
          error: error,
        });
        window.dispatchEvent(errorEvent);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;

    return {
      totalTime,
      averageTime,
      iterations,
    };
  });
}

/**
 * Sampling Testing Utilities
 */

/**
 * Tests error sampling behavior
 */
export async function testErrorSampling(page: Page): Promise<SamplingTestResult[]> {
  return await page.evaluate(() => {
    const results: Array<{ expectedRate: number; actualRate: number; captures: number; iterations: number }> = [];

    // Test the sampling function with different rates
    const testRates = [0.01, 0.1, 0.5, 0.9];

    for (const rate of testRates) {
      let captures = 0;
      const iterations = 100;

      // Simulate sampling decisions
      for (let i = 0; i < iterations; i++) {
        if (Math.random() < rate) {
          captures++;
        }
      }

      const actualRate = captures / iterations;
      results.push({
        expectedRate: rate,
        actualRate: actualRate,
        captures: captures,
        iterations: iterations,
      });
    }

    return results;
  });
}

/**
 * Validation Utilities
 */

/**
 * Validates that no sensitive information leaked through
 */
export function validateNoLeakedPii(debugLogs: string[], piiPatterns: readonly string[]): string[] {
  return piiPatterns.filter((pattern) => debugLogs.some((log) => log.includes(pattern)));
}

/**
 * Validates legitimate data preservation
 */
export function validateLegitimateDataPreservation(
  debugLogs: string[],
  testCases: readonly LegitimateDataTestCase[],
): { testCase: LegitimateDataTestCase; missingItems: string[] }[] {
  return testCases.map((testCase) => {
    const missingItems = testCase.shouldPreserve.filter(
      (item) =>
        !debugLogs.some(
          (log) => log.includes(item) && log.includes(ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.TRACELOG_PREFIX),
        ),
    );
    return { testCase, missingItems };
  });
}

/**
 * Validates error activity in logs
 */
export function validateErrorActivity(debugLogs: string[], expectedKeywords: readonly string[]): boolean {
  return expectedKeywords.some((keyword) =>
    debugLogs.some(
      (log) => log.includes(keyword) && log.includes(ERROR_TRACKING_CONSTANTS.LOG_PATTERNS.TRACELOG_PREFIX),
    ),
  );
}

/**
 * Validates network error payload structure
 */
export function validateNetworkErrorPayload(payload: unknown): payload is NetworkErrorDetail {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;
  return (
    p.type === 'network' &&
    typeof p.url === 'string' &&
    typeof p.method === 'string' &&
    typeof p.status === 'number' &&
    typeof p.duration === 'number' &&
    p.duration > 0
  );
}

/**
 * Validates sampling rates are within tolerance
 */
export function validateSamplingRate(result: SamplingTestResult, tolerance = 0.2): boolean {
  const difference = Math.abs(result.actualRate - result.expectedRate);
  return difference < tolerance;
}
