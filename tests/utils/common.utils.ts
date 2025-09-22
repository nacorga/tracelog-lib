import { ConsoleMessage, Page } from '@playwright/test';
import { ConsoleMonitor, ConsoleMonitorSummary, InitializationResult, NavigationOptions } from '../types';
import { DEFAULT_CONFIG, TEST_URLS, CONSOLE_MONITORING } from '../constants';
import { Config, TraceLogTestBridge } from '../../src/types';

/**
 * Core shared utilities for TraceLog E2E tests
 *
 * This module provides essential utilities for:
 * - Application instance management
 * - Console monitoring and anomaly detection
 * - Page navigation and initialization
 * - Result validation and error handling
 *
 * All functions are designed to be composable and maintain consistency
 * across different test scenarios.
 */

/**
 * Retrieves the TraceLog test bridge instance from the browser window
 *
 * @param page - Playwright page instance
 * @returns Promise resolving to the TraceLog bridge or null if not available
 * @throws Will throw an error if page evaluation fails
 */
export async function getAppInstance(page: Page): Promise<TraceLogTestBridge | null> {
  try {
    return await page.evaluate(() => {
      return (window as typeof window & { __traceLogBridge?: TraceLogTestBridge }).__traceLogBridge ?? null;
    });
  } catch (error) {
    throw new Error(
      `Failed to retrieve TraceLog app instance: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Console message monitoring utilities
 *
 * Creates a comprehensive console monitor that captures and categorizes
 * different types of console messages for analysis and debugging.
 */

/**
 * Creates a console monitor for capturing and analyzing console messages
 *
 * @param page - Playwright page instance to monitor
 * @returns ConsoleMonitor instance with categorized message collections and utilities
 *
 * @example
 * ```typescript
 * const monitor = createConsoleMonitor(page);
 * // ... perform test actions ...
 * const anomalies = monitor.getAnomalies();
 * monitor.cleanup(); // Always call cleanup when done
 * ```
 */
export function createConsoleMonitor(page: Page): ConsoleMonitor {
  // Initialize message collections with proper typing
  const consoleMessages: string[] = [];
  const traceLogErrors: string[] = [];
  const traceLogWarnings: string[] = [];
  const traceLogInfo: string[] = [];
  const debugLogs: string[] = [];
  const contextErrors: string[] = [];

  let isDisposed = false;

  /**
   * Internal message processor that categorizes console messages
   */
  const monitor = (msg: ConsoleMessage): void => {
    if (isDisposed) return;

    try {
      const text = msg.text();
      const type = msg.type();
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${text}`;

      consoleMessages.push(text);

      // Categorize TraceLog-specific messages
      if (text.includes(CONSOLE_MONITORING.TRACELOG_PREFIX)) {
        debugLogs.push(logEntry);

        switch (type) {
          case 'error':
            traceLogErrors.push(text);
            break;
          case 'warning':
            traceLogWarnings.push(text);
            break;
          case 'info':
          case 'log':
            traceLogInfo.push(text);
            break;
        }
      } else if (type === 'error') {
        contextErrors.push(text);
      }
    } catch (error) {
      // Avoid infinite loops by not logging this error
      contextErrors.push(`Console monitor error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Analyzes captured messages for potential issues and anomalies
   *
   * @returns Array of anomaly descriptions, ordered by severity
   */
  const getAnomalies = (): string[] => {
    if (isDisposed) {
      return ['Console monitor has been disposed'];
    }

    const anomalies: string[] = [];

    // Critical: TraceLog-specific errors (highest priority)
    if (traceLogErrors.length > 0) {
      anomalies.push(`TraceLog errors detected: ${traceLogErrors.length} error(s)`);
      // Add sample of most recent errors for debugging
      const recentErrors = traceLogErrors.slice(-CONSOLE_MONITORING.MAX_SAMPLE_SIZE).join('; ');
      anomalies.push(`Recent TraceLog errors: ${recentErrors}`);
    }

    // High: Context errors (potentially related to TraceLog)
    if (contextErrors.length > 0) {
      anomalies.push(`Context errors detected: ${contextErrors.length} error(s)`);
    }

    // Medium: Excessive warnings
    if (traceLogWarnings.length > CONSOLE_MONITORING.WARNING_THRESHOLD) {
      anomalies.push(
        `High warning count: ${traceLogWarnings.length} warnings (threshold: ${CONSOLE_MONITORING.WARNING_THRESHOLD})`,
      );
    }

    // Pattern-based anomaly detection with configurable thresholds
    CONSOLE_MONITORING.PROBLEM_PATTERNS.forEach(({ pattern, threshold, name }) => {
      const matchingLogs = debugLogs.filter((log) => log.toLowerCase().includes(pattern.toLowerCase()));

      if (matchingLogs.length > threshold) {
        anomalies.push(`Excessive ${name}: ${matchingLogs.length} occurrences (threshold: ${threshold})`);
      }
    });

    return anomalies;
  };

  /**
   * Gets a summary of all captured message types
   */
  const getSummary = (): ConsoleMonitorSummary => ({
    total: consoleMessages.length,
    traceLogErrors: traceLogErrors.length,
    traceLogWarnings: traceLogWarnings.length,
    traceLogInfo: traceLogInfo.length,
    contextErrors: contextErrors.length,
    debugLogs: debugLogs.length,
  });

  /**
   * Cleanup function that removes event listeners and marks as disposed
   */
  const cleanup = (): void => {
    if (!isDisposed) {
      page.off('console', monitor);
      isDisposed = true;
    }
  };

  // Attach the console listener
  page.on('console', monitor);

  return {
    consoleMessages,
    traceLogErrors,
    traceLogWarnings,
    traceLogInfo,
    debugLogs,
    contextErrors,
    cleanup,
    getAnomalies,
    getSummary,
    isDisposed: () => isDisposed,
  };
}

/**
 * Page navigation and initialization utilities
 *
 * Provides robust navigation with proper state verification and error handling.
 */

/**
 * Navigates to a URL and waits for the page to be ready for testing
 *
 * @param page - Playwright page instance
 * @param options - Navigation options including URL, selectors, and timeouts
 * @returns Promise that resolves when page is ready
 * @throws Will throw an error if navigation fails or timeout is exceeded
 *
 * @example
 * ```typescript
 * await navigateAndWaitForReady(page, {
 *   url: '/test-page',
 *   statusSelector: '[data-testid="custom-status"]',
 *   timeout: 10000
 * });
 * ```
 */
export async function navigateAndWaitForReady(page: Page, options: NavigationOptions = {}): Promise<void> {
  const {
    url = TEST_URLS.INITIALIZATION_PAGE,
    statusSelector,
    timeout = 30000,
    waitForLoadState = 'domcontentloaded',
  } = options;

  try {
    // Navigate to the URL with timeout
    await page.goto(url, { timeout });

    // Wait for the specified load state
    await page.waitForLoadState(waitForLoadState, { timeout });

    // Wait for status indicators
    const selector = statusSelector ?? '[data-testid="init-status"], [data-testid="validation-status"]';
    await page.locator(selector).waitFor({ timeout });
  } catch (error) {
    throw new Error(`Navigation failed for URL '${url}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Initializes TraceLog in the browser context with comprehensive error handling
 *
 * @param page - Playwright page instance
 * @param config - TraceLog configuration object
 * @returns Promise resolving to initialization result with success status and error details
 * @throws Will throw an error if the bridge is not available or evaluation fails
 *
 * @example
 * ```typescript
 * const result = await initializeTraceLog(page, { id: 'test-project' });
 * if (!result.success) {
 *   console.error('Initialization failed:', result.error);
 * }
 * ```
 */
export async function initializeTraceLog(page: Page, config: Config = DEFAULT_CONFIG): Promise<InitializationResult> {
  try {
    return await page.evaluate(async (config: Config) => {
      const bridge = (window as typeof window & { __traceLogBridge?: TraceLogTestBridge }).__traceLogBridge;

      if (!bridge) {
        return {
          success: false,
          error: 'TraceLog test bridge not found. Ensure the library is properly loaded.',
          errorType: 'BRIDGE_NOT_FOUND',
          hasError: true,
        };
      }

      try {
        await bridge.init(config);
        return {
          success: true,
          error: null,
          errorType: null,
          hasError: false,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: 'INITIALIZATION_ERROR',
          hasError: true,
        };
      }
    }, config);
  } catch (error) {
    throw new Error(
      `Failed to evaluate TraceLog initialization: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Validates and type-guards an initialization result object
 *
 * @param result - Raw result from initialization attempt
 * @returns Typed and validated initialization result
 * @throws Will throw an error if result structure is invalid
 *
 * @example
 * ```typescript
 * const rawResult = await page.evaluate(() => { return someValue; });
 * const validatedResult = verifyInitializationResult(rawResult);
 * ```
 */
export function verifyInitializationResult(result: unknown): InitializationResult {
  if (!result || typeof result !== 'object') {
    throw new Error(`Invalid initialization result structure. Expected object, received: ${typeof result}`);
  }

  const typedResult = result as Partial<InitializationResult>;

  // Validate required fields
  if (typeof typedResult.success !== 'boolean') {
    throw new Error('Initialization result must have a boolean "success" field');
  }

  return {
    success: typedResult.success,
    error: typedResult.error ?? null,
    errorType: typedResult.errorType ?? null,
    hasError: typedResult.error !== null && typedResult.error !== undefined,
  };
}

/**
 * Verifies that no TraceLog-specific errors were captured
 *
 * @param traceLogErrors - Array of captured TraceLog error messages
 * @returns True if no errors were found, false otherwise
 *
 * @example
 * ```typescript
 * const monitor = createConsoleMonitor(page);
 * // ... test actions ...
 * const hasNoErrors = verifyNoTraceLogErrors(monitor.traceLogErrors);
 * ```
 */
export function verifyNoTraceLogErrors(traceLogErrors: string[]): boolean {
  return Array.isArray(traceLogErrors) && traceLogErrors.length === 0;
}

/**
 * Waits for a specific condition to be met with configurable polling
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Options for timeout and polling interval
 * @returns Promise that resolves when condition is met
 * @throws Will throw an error if timeout is exceeded
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number; description?: string } = {},
): Promise<void> {
  const { timeout = 5000, interval = 100, description = 'condition' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return;
      }
    } catch {
      // Continue polling even if condition check fails
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for ${description} after ${timeout}ms`);
}

/**
 * Creates a disposable resource that ensures cleanup is called
 *
 * @param resource - Object with cleanup method
 * @param action - Function to execute with the resource
 * @returns Promise resolving to the action result
 */
export async function withCleanup<T, R>(
  resource: T & { cleanup: () => void | Promise<void> },
  action: (resource: T) => Promise<R>,
): Promise<R> {
  try {
    return await action(resource);
  } finally {
    await resource.cleanup();
  }
}
