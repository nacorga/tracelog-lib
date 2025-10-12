/**
 * Bridge Utilities
 *
 * Shared utilities for interacting with the TraceLog test bridge in E2E tests.
 * Reduces code duplication across test files.
 */

import type { Page } from '@playwright/test';

/**
 * Waits for the TraceLog bridge to be available on the page.
 * This should be called inside page.evaluate() context.
 *
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 5000)
 * @throws Error if bridge is not available after timeout
 *
 * @example
 * const result = await page.evaluate(async () => {
 *   await waitForBridgeInternal();
 *   await window.__traceLogBridge.init();
 *   return { success: true };
 * });
 */
export const waitForBridgeInternal = async (timeoutMs = 5000): Promise<void> => {
  let elapsed = 0;
  const interval = 100;

  while (!window.__traceLogBridge && elapsed < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    elapsed += interval;
  }

  if (!window.__traceLogBridge) {
    throw new Error('TraceLog bridge not available after waiting. Check initialization in playground.');
  }
};

/**
 * Initializes TraceLog with the given configuration.
 * Use this inside page.evaluate() to reduce boilerplate.
 *
 * @param config - TraceLog configuration object
 * @returns Object with initialization result
 *
 * @example
 * const result = await page.evaluate(async () => {
 *   return await initializeTraceLog({ samplingRate: 1 });
 * });
 * expect(result.success).toBe(true);
 */
export const initializeTraceLogInternal = async (
  config: Record<string, unknown> = {},
): Promise<{
  success: boolean;
  error?: string;
  initialized?: boolean;
}> => {
  try {
    await window.__traceLogBridge!.init(config);
    return {
      success: true,
      initialized: window.__traceLogBridge!.initialized,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Sets up an event listener for queue events.
 * Returns an array that will be populated with queue events.
 *
 * @example
 * const result = await page.evaluate(async () => {
 *   const queues = setupQueueListener();
 *   await initializeTraceLog();
 *   // ... trigger events ...
 *   return queues;
 * });
 */
export const setupQueueListenerInternal = (): any[] => {
  const queues: any[] = [];
  window.__traceLogBridge!.on('queue', (data: any) => {
    queues.push(data);
  });
  return queues;
};

/**
 * Sets up an event listener for individual events.
 * Returns an array that will be populated with events.
 *
 * @param eventType - Optional event type to filter (e.g., 'click', 'custom')
 *
 * @example
 * const result = await page.evaluate(async () => {
 *   const events = setupEventListener('click');
 *   await initializeTraceLog();
 *   // ... trigger clicks ...
 *   return events;
 * });
 */
export const setupEventListenerInternal = (eventType?: string): any[] => {
  const events: any[] = [];
  window.__traceLogBridge!.on('event', (data: any) => {
    if (!eventType || data.type === eventType) {
      events.push(data);
    }
  });
  return events;
};

/**
 * Complete initialization pattern that combines waiting for bridge and initializing.
 * This is the most common pattern used across E2E tests.
 *
 * @param page - Playwright page object
 * @param config - TraceLog configuration
 * @returns Initialization result
 *
 * @example
 * const initResult = await initializeTraceLog(page, { samplingRate: 1 });
 * expect(initResult.success).toBe(true);
 */
export async function initializeTraceLog(
  page: Page,
  config: Record<string, unknown> = {},
): Promise<{ success: boolean; error?: string; initialized?: boolean }> {
  return await page.evaluate(async (cfg) => {
    // Wait for bridge
    let elapsed = 0;
    const interval = 100;
    const timeout = 5000;

    while (!window.__traceLogBridge && elapsed < timeout) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      elapsed += interval;
    }

    if (!window.__traceLogBridge) {
      return {
        success: false,
        error: 'TraceLog bridge not available',
      };
    }

    // Initialize
    try {
      await window.__traceLogBridge.init(cfg);
      return {
        success: true,
        initialized: window.__traceLogBridge.initialized,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }, config);
}

/**
 * Waits for queue events to be emitted.
 * Useful when you need to wait for the 10-second queue send interval.
 *
 * @param queueEvents - Array of queue events to monitor
 * @param timeoutMs - Maximum time to wait (default: 12000ms = 10s interval + 2s buffer)
 *
 * @example
 * const result = await page.evaluate(async () => {
 *   const queues: any[] = [];
 *   window.__traceLogBridge.on('queue', (data) => queues.push(data));
 *   await initializeTraceLog();
 *   // ... trigger events ...
 *   await waitForQueueEvents(queues);
 *   return queues;
 * });
 */
export const waitForQueueEventsInternal = async (queueEvents: any[], timeoutMs = 12000): Promise<void> => {
  const startTime = Date.now();
  while (queueEvents.length === 0 && Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};
