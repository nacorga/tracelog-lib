/**
 * E2E Test Bridge Helpers
 *
 * This module provides reusable code snippets and constants for E2E tests.
 * These helpers are designed to be used INSIDE page.evaluate() contexts.
 *
 * Usage:
 * ```typescript
 * import { E2E_SETUP_CODE, E2E_WAIT_TIMES } from './helpers/bridge.helper';
 *
 * const result = await page.evaluate(async () => {
 *   ${E2E_SETUP_CODE}
 *   // Your test code here...
 *   return events;
 * });
 * ```
 */

/**
 * Wait for TraceLog bridge to be available in browser context.
 * This code snippet should be used inside page.evaluate().
 *
 * Retries: 50 times × 100ms = 5 seconds max wait time
 * Throws: Error if bridge is not available after max retries
 */
export const E2E_BRIDGE_WAIT_CODE = `
  let retries = 0;
  while (!window.__traceLogBridge && retries < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }

  if (!window.__traceLogBridge) {
    throw new Error(\`TraceLog bridge not available after \${retries * 100}ms (\${retries} retries)\`);
  }
`;

/**
 * Standard initialization sequence for E2E tests.
 * This code snippet should be used inside page.evaluate().
 *
 * Steps:
 * 1. Destroy any existing instance (prevents cross-test contamination)
 * 2. Initialize TraceLog with optional config
 */
export const E2E_INIT_CODE = `
  window.__traceLogBridge.destroy(true);
  await window.__traceLogBridge.init();
`;

/**
 * Setup event listener to collect all events emitted by TraceLog.
 * This code snippet should be used inside page.evaluate().
 *
 * Creates an array called 'events' that accumulates all emitted events.
 */
export const E2E_EVENT_LISTENER_CODE = `
  const events: any[] = [];
  window.__traceLogBridge.on('event', (event) => {
    events.push(event);
  });
`;

/**
 * Complete E2E test setup combining all steps:
 * 1. Wait for bridge availability
 * 2. Destroy + Initialize TraceLog
 * 3. Setup event listener
 *
 * Usage:
 * ```typescript
 * const result = await page.evaluate(async () => {
 *   ${E2E_SETUP_CODE}
 *   // Your test-specific code here...
 *   return events;
 * });
 * ```
 */
export const E2E_SETUP_CODE = `
  ${E2E_BRIDGE_WAIT_CODE}
  ${E2E_INIT_CODE}
  ${E2E_EVENT_LISTENER_CODE}
`;

/**
 * Standardized wait times for E2E tests.
 *
 * These constants ensure consistent timing across all tests and provide
 * documentation for why each timeout exists.
 */
export const E2E_WAIT_TIMES = {
  /**
   * Time between bridge availability checks.
   * 100ms × 50 retries = 5 seconds max wait time
   */
  BRIDGE_RETRY: 100,

  /**
   * Standard wait for event processing.
   * Used for: Click events, custom events
   *
   * Why 200ms: Allows time for event handlers to fire, validate,
   * and add events to queue. Covers synchronous event processing.
   */
  EVENT_PROCESSING: 200,

  /**
   * Wait after init completes for initialization events.
   * Used for: SESSION_START, initial PAGE_VIEW
   *
   * Why 300ms: Init triggers multiple events (session, page view),
   * needs slightly more time than single event processing.
   */
  INIT_COMPLETE: 300,

  /**
   * Wait for debounced events.
   * Used for: Scroll events (debounced at 250ms)
   *
   * Why 500ms: Scroll handler debounce = 250ms, plus 250ms buffer
   * for event processing and queueing.
   */
  DEBOUNCE: 500,

  /**
   * Wait for rate-limited events.
   * Used for: Multiple scroll events with rate limiting
   *
   * Why 800ms: Scroll rate limit > 600ms between events,
   * plus buffer for processing.
   */
  RATE_LIMIT: 800,

  /**
   * Wait for throttled events.
   * Used for: Page view events (throttled at 1000ms)
   *
   * Why 1100ms: Page view throttle = 1000ms, plus 100ms buffer
   * for event processing.
   */
  THROTTLE: 1100,

  /**
   * Wait for error event processing.
   * Used for: JavaScript errors, promise rejections
   *
   * Why 500ms: Error handlers process stack traces and sanitize PII,
   * which takes longer than standard events.
   */
  ERROR_PROCESSING: 500,
} as const;

/**
 * Helper to generate wait code with specific timeout.
 *
 * Usage inside page.evaluate():
 * ```typescript
 * await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
 * ```
 */
export function waitCode(ms: number): string {
  return `await new Promise((resolve) => setTimeout(resolve, ${ms}));`;
}

/**
 * Generate initialization code with custom config.
 *
 * @param config - TraceLog config object (will be JSON.stringified)
 * @returns Initialization code snippet
 *
 * Usage:
 * ```typescript
 * const initWithConfig = initCodeWithConfig({ sessionTimeout: 5000 });
 * await page.evaluate(async () => {
 *   ${E2E_BRIDGE_WAIT_CODE}
 *   ${initWithConfig}
 *   ${E2E_EVENT_LISTENER_CODE}
 * });
 * ```
 */
export function initCodeWithConfig(config: Record<string, any>): string {
  return `
  window.__traceLogBridge.destroy(true);
  await window.__traceLogBridge.init(${JSON.stringify(config)});
`;
}
