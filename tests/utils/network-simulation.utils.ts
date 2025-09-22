import { Page } from '@playwright/test';

/**
 * Network and error simulation utilities for TraceLog E2E testing
 *
 * This module provides comprehensive utilities for simulating various
 * network conditions, API failures, and error scenarios to test TraceLog's
 * resilience and error handling capabilities.
 *
 * @example
 * ```typescript
 * import { NetworkUtils } from '../utils';
 *
 * // Block all API calls
 * await NetworkUtils.blockApiCalls(page);
 *
 * // Simulate network failures
 * await NetworkUtils.simulateNetworkFailure(page, '/api/collect');
 *
 * // Mock API responses
 * await NetworkUtils.mockApiResponse(page, '/api/config', { sampling: 0.5 });
 *
 * // Inject JavaScript errors
 * await NetworkUtils.injectJavaScriptError(page, 'Test error message');
 * ```
 */

/**
 * Network simulation options
 */
export interface NetworkSimulationOptions {
  /** HTTP status code to return */
  status?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Response body */
  body?: string | object;
  /** Delay before response in milliseconds */
  delay?: number;
  /** Whether to abort the request */
  abort?: boolean;
  /** Abort reason */
  abortReason?:
    | 'failed'
    | 'aborted'
    | 'timedout'
    | 'accessdenied'
    | 'connectionclosed'
    | 'connectionreset'
    | 'connectionrefused'
    | 'connectionaborted'
    | 'connectionfailed'
    | 'namenotresolved'
    | 'internetdisconnected'
    | 'addressunreachable'
    | 'blockedbyclient'
    | 'blockedbyresponse';
}

/**
 * Rate limiting options
 */
export interface RateLimitOptions {
  /** Maximum requests per time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Status code to return when rate limited */
  rateLimitStatus?: number;
  /** Custom rate limit response */
  rateLimitResponse?: object;
}

/**
 * Configuration loading simulation options
 */
export interface ConfigSimulationOptions {
  /** Whether to return valid config */
  validConfig?: boolean;
  /** Custom config to return */
  customConfig?: object;
  /** HTTP status to return */
  status?: number;
  /** Delay before response */
  delay?: number;
  /** Whether config should be cached */
  enableCaching?: boolean;
}

/**
 * Error injection options
 */
export interface ErrorInjectionOptions {
  /** Error message */
  message?: string;
  /** Error type */
  type?: 'Error' | 'TypeError' | 'ReferenceError' | 'RangeError' | 'SyntaxError';
  /** Whether to throw immediately or after delay */
  delay?: number;
  /** Whether to throw in a setTimeout */
  async?: boolean;
  /** Custom error properties */
  customProperties?: Record<string, unknown>;
}

/**
 * Network monitoring result
 */
export interface NetworkMonitorResult {
  /** Total number of requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Requests by URL pattern */
  requestsByUrl: Record<string, number>;
  /** Requests by status code */
  requestsByStatus: Record<number, number>;
  /** Average response time */
  averageResponseTime: number;
}

/**
 * Core network simulation utilities
 */
export class NetworkSimulation {
  /**
   * Blocks all API calls matching specified patterns
   */
  static async blockApiCalls(page: Page, patterns: string[] = ['**/api/**', '**/config/**']): Promise<void> {
    for (const pattern of patterns) {
      await page.route(pattern, (route) => {
        route.abort('failed');
      });
    }
  }

  /**
   * Simulates network failures for specific endpoints
   */
  static async simulateNetworkFailure(
    page: Page,
    urlPattern: string,
    options: NetworkSimulationOptions = {},
  ): Promise<void> {
    const { status = 500, delay = 0, abort = false, abortReason = 'failed' } = options;

    await page.route(urlPattern, async (route) => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (abort) {
        await route.abort(abortReason);
      } else {
        await route.fulfill({
          status,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: 'Network simulation error', status }),
        });
      }
    });
  }

  /**
   * Mocks API responses with custom data
   */
  static async mockApiResponse(
    page: Page,
    urlPattern: string,
    responseData: object | string,
    options: NetworkSimulationOptions = {},
  ): Promise<void> {
    const { status = 200, headers = { 'content-type': 'application/json' }, delay = 0 } = options;

    await page.route(urlPattern, async (route) => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const body = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);

      await route.fulfill({
        status,
        headers,
        body,
      });
    });
  }

  /**
   * Simulates rate limiting for API endpoints
   */
  static async simulateRateLimit(page: Page, urlPattern: string, options: RateLimitOptions): Promise<void> {
    const {
      maxRequests,
      windowMs,
      rateLimitStatus = 429,
      rateLimitResponse = { error: 'Rate limit exceeded', retryAfter: windowMs / 1000 },
    } = options;

    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    await page.route(urlPattern, async (route) => {
      const url = route.request().url();
      const now = Date.now();
      const current = requestCounts.get(url) ?? { count: 0, resetTime: now + windowMs };

      // Reset counter if window has passed
      if (now > current.resetTime) {
        current.count = 0;
        current.resetTime = now + windowMs;
      }

      current.count++;
      requestCounts.set(url, current);

      if (current.count > maxRequests) {
        await route.fulfill({
          status: rateLimitStatus,
          headers: {
            'content-type': 'application/json',
            'x-ratelimit-limit': maxRequests.toString(),
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': Math.ceil(current.resetTime / 1000).toString(),
          },
          body: JSON.stringify(rateLimitResponse),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Simulates slow network conditions
   */
  static async simulateSlowNetwork(page: Page, urlPattern: string, delayMs = 5000): Promise<void> {
    await page.route(urlPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Simulates intermittent network issues
   */
  static async simulateIntermittentFailures(page: Page, urlPattern: string, failureRate = 0.3): Promise<void> {
    await page.route(urlPattern, async (route) => {
      if (Math.random() < failureRate) {
        await route.abort('connectionfailed');
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Clears all network simulation routes
   */
  static async clearAllRoutes(page: Page): Promise<void> {
    try {
      await page.unrouteAll();
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Configuration loading simulation utilities
 */
export class ConfigurationSimulation {
  /**
   * Simulates various configuration loading scenarios
   */
  static async simulateConfigLoading(
    page: Page,
    scenario: 'success' | 'failure' | 'timeout' | 'invalid' | 'partial',
    options: ConfigSimulationOptions = {},
  ): Promise<void> {
    const { delay = 0, enableCaching = false } = options;

    const cacheHeaders = enableCaching ? { 'cache-control': 'public, max-age=300' } : { 'cache-control': 'no-cache' };

    switch (scenario) {
      case 'success':
        await NetworkSimulation.mockApiResponse(
          page,
          '**/config**',
          options.customConfig ?? {
            sampling: { events: 1.0, webVitals: 0.1 },
            sessionTimeout: 900000,
            excludedUrlPaths: ['/admin', '/debug'],
            tags: [],
          },
          { delay, headers: { ...cacheHeaders, 'content-type': 'application/json' } },
        );
        break;

      case 'failure':
        await NetworkSimulation.simulateNetworkFailure(page, '**/config**', {
          status: options.status ?? 500,
          delay,
        });
        break;

      case 'timeout':
        await NetworkSimulation.simulateSlowNetwork(page, '**/config**', delay ?? 10000);
        break;

      case 'invalid':
        await NetworkSimulation.mockApiResponse(page, '**/config**', '{ invalid json }', {
          delay,
          headers: { ...cacheHeaders, 'content-type': 'application/json' },
        });
        break;

      case 'partial':
        await NetworkSimulation.mockApiResponse(
          page,
          '**/config**',
          { sampling: { events: 0.5 } }, // Missing required fields
          { delay, headers: { ...cacheHeaders, 'content-type': 'application/json' } },
        );
        break;
    }
  }

  /**
   * Simulates config validation scenarios
   */
  static async simulateConfigValidation(
    page: Page,
    validationResult: 'valid' | 'invalid' | 'unauthorized',
    projectId = 'test-project',
  ): Promise<void> {
    const urlPattern = `**/config**`;

    switch (validationResult) {
      case 'valid':
        await NetworkSimulation.mockApiResponse(page, urlPattern, {
          projectId,
          isValid: true,
          config: {
            sampling: { events: 1.0 },
            sessionTimeout: 900000,
          },
        });
        break;

      case 'invalid':
        await NetworkSimulation.mockApiResponse(
          page,
          urlPattern,
          {
            error: 'Invalid project ID',
            isValid: false,
          },
          { status: 400 },
        );
        break;

      case 'unauthorized':
        await NetworkSimulation.mockApiResponse(
          page,
          urlPattern,
          {
            error: 'Unauthorized domain',
            isValid: false,
          },
          { status: 403 },
        );
        break;
    }
  }
}

/**
 * Error injection utilities
 */
export class ErrorInjection {
  /**
   * Injects JavaScript errors for testing error tracking
   */
  static async injectJavaScriptError(page: Page, options: ErrorInjectionOptions = {}): Promise<void> {
    const {
      message = 'Simulated JavaScript error for testing',
      type = 'Error',
      delay = 0,
      async = true,
      customProperties = {},
    } = options;

    await page.evaluate(
      ({ message, type, delay, async, customProperties }) => {
        const throwError = (): void => {
          const ErrorConstructor = window[type as keyof Window] as ErrorConstructor;
          const error = new ErrorConstructor(message);

          // Add custom properties
          Object.assign(error, customProperties);

          throw error;
        };

        if (delay > 0) {
          setTimeout(throwError, delay);
        } else if (async) {
          setTimeout(throwError, 1);
        } else {
          throwError();
        }
      },
      { message, type, delay, async, customProperties },
    );

    // Wait for error to be thrown
    await page.waitForTimeout(Math.max(delay ?? 0, 100));
  }

  /**
   * Injects promise rejection errors
   */
  static async injectPromiseRejection(page: Page, message = 'Simulated promise rejection', delay = 0): Promise<void> {
    await page.evaluate(
      ({ message, delay }) => {
        const rejectPromise = (): void => {
          Promise.reject(new Error(message));
        };

        if (delay > 0) {
          setTimeout(rejectPromise, delay);
        } else {
          rejectPromise();
        }
      },
      { message, delay },
    );

    await page.waitForTimeout(Math.max(delay, 100));
  }

  /**
   * Simulates network errors by injecting fetch failures
   */
  static async injectNetworkError(page: Page, urlPattern: string, errorType: 'fetch' | 'xhr' = 'fetch'): Promise<void> {
    await page.evaluate(
      ({ urlPattern, errorType }) => {
        if (errorType === 'fetch' && window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes(urlPattern)) {
              return Promise.reject(new Error(`Network error: Failed to fetch ${url}`));
            }
            return originalFetch(input, init);
          };
        } else if (errorType === 'xhr') {
          const originalXHR = window.XMLHttpRequest;
          window.XMLHttpRequest = class extends originalXHR {
            open(
              method: string,
              url: string | URL,
              async = true,
              user?: string | null,
              password?: string | null,
            ): void {
              const urlString = url.toString();
              if (urlString.includes(urlPattern)) {
                super.open(method, urlString, async, user, password);
                setTimeout(() => {
                  this.dispatchEvent(new Event('error'));
                }, 10);
                return;
              }
              super.open(method, urlString, async, user, password);
            }
          };
        }
      },
      { urlPattern, errorType },
    );
  }

  /**
   * Injects errors with PII data for security testing
   */
  static async injectPIIError(page: Page): Promise<void> {
    const piiMessages = [
      'User email john.doe@example.com failed validation',
      'SSN 123-45-6789 not found in database',
      'Credit card 1234-5678-9012-3456 expired',
      'Phone number 555-123-4567 is invalid',
    ];

    const randomMessage = piiMessages[Math.floor(Math.random() * piiMessages.length)];
    await this.injectJavaScriptError(page, { message: randomMessage });
  }

  /**
   * Injects errors with XSS patterns for security testing
   */
  static async injectXSSError(page: Page): Promise<void> {
    const xssMessages = [
      'Error: <script>alert("xss")</script>',
      'Validation failed: javascript:void(0)',
      'Input error: <img src=x onerror=alert(1)>',
      'Form error: onload="malicious()"',
    ];

    const randomMessage = xssMessages[Math.floor(Math.random() * xssMessages.length)];
    await this.injectJavaScriptError(page, { message: randomMessage });
  }
}

/**
 * Network monitoring utilities
 */
export class NetworkMonitoring {
  private static readonly monitoringData = new Map<
    Page,
    {
      requests: Array<{ url: string; status: number; responseTime: number; timestamp: number }>;
      startTime: number;
    }
  >();

  /**
   * Starts monitoring network requests
   */
  static async startMonitoring(page: Page): Promise<void> {
    const monitorData = {
      requests: [],
      startTime: Date.now(),
    };

    this.monitoringData.set(page, monitorData);

    page.on('response', (response) => {
      const data = this.monitoringData.get(page);
      if (data) {
        const request = response.request();
        data.requests.push({
          url: request.url(),
          status: response.status(),
          responseTime: Date.now() - data.startTime,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Stops monitoring and returns results
   */
  static stopMonitoring(page: Page): NetworkMonitorResult {
    const data = this.monitoringData.get(page);
    if (!data) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        requestsByUrl: {},
        requestsByStatus: {},
        averageResponseTime: 0,
      };
    }

    const { requests } = data;
    const requestsByUrl: Record<string, number> = {};
    const requestsByStatus: Record<number, number> = {};
    let totalResponseTime = 0;

    for (const request of requests) {
      // Count by URL pattern
      const urlKey = new URL(request.url).pathname;
      requestsByUrl[urlKey] = (requestsByUrl[urlKey] ?? 0) + 1;

      // Count by status
      requestsByStatus[request.status] = (requestsByStatus[request.status] ?? 0) + 1;

      totalResponseTime += request.responseTime;
    }

    const successfulRequests = requests.filter((r) => r.status >= 200 && r.status < 400).length;
    const failedRequests = requests.length - successfulRequests;

    this.monitoringData.delete(page);

    return {
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      requestsByUrl,
      requestsByStatus,
      averageResponseTime: requests.length > 0 ? totalResponseTime / requests.length : 0,
    };
  }
}

/**
 * Combined network utilities namespace
 */
export const NetworkUtils = {
  // Network simulation
  blockApiCalls: NetworkSimulation.blockApiCalls,
  simulateNetworkFailure: NetworkSimulation.simulateNetworkFailure,
  mockApiResponse: NetworkSimulation.mockApiResponse,
  simulateRateLimit: NetworkSimulation.simulateRateLimit,
  simulateSlowNetwork: NetworkSimulation.simulateSlowNetwork,
  simulateIntermittentFailures: NetworkSimulation.simulateIntermittentFailures,
  clearAllRoutes: NetworkSimulation.clearAllRoutes,

  // Configuration simulation
  simulateConfigLoading: ConfigurationSimulation.simulateConfigLoading,
  simulateConfigValidation: ConfigurationSimulation.simulateConfigValidation,

  // Error injection
  injectJavaScriptError: ErrorInjection.injectJavaScriptError,
  injectPromiseRejection: ErrorInjection.injectPromiseRejection,
  injectNetworkError: ErrorInjection.injectNetworkError,
  injectPIIError: ErrorInjection.injectPIIError,
  injectXSSError: ErrorInjection.injectXSSError,

  // Network monitoring
  startNetworkMonitoring: NetworkMonitoring.startMonitoring,
  stopNetworkMonitoring: NetworkMonitoring.stopMonitoring,
} as const;
