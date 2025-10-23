/**
 * TestBridge Helper
 *
 * Utilities for working with TestBridge in unit and integration tests.
 * TestBridge adapts tests to the library - library code should NOT adapt to tests.
 */

import { TraceLogTestBridge } from '../../src/types';

/**
 * Get TestBridge instance from window (for integration tests)
 * Throws error if not available
 */
export function getTestBridge(): TraceLogTestBridge {
  if (typeof window === 'undefined' || !window.__traceLogBridge) {
    throw new Error('[Test Helper] TestBridge not available. Ensure NODE_ENV=development and bridge is injected.');
  }
  return window.__traceLogBridge;
}

/**
 * Check if TestBridge is available
 */
export function hasTestBridge(): boolean {
  return typeof window !== 'undefined' && window.__traceLogBridge !== undefined;
}

/**
 * Wait for TestBridge to be available (for E2E tests with CSP)
 * Uses internal polling to avoid CSP violations
 *
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @returns Promise that resolves when bridge is available
 */
export async function waitForTestBridge(timeout = 5000): Promise<TraceLogTestBridge> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (hasTestBridge()) {
      return getTestBridge();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('[Test Helper] TestBridge not available after timeout');
}

/**
 * Initialize TestBridge with config and wait for completion
 *
 * @param config - Optional configuration object
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @returns Promise that resolves when initialization completes
 */
export async function initTestBridge(config?: any, timeout = 5000): Promise<TraceLogTestBridge> {
  const bridge = getTestBridge();
  await bridge.init(config);
  await bridge.waitForInitialization(timeout);
  return bridge;
}

/**
 * Destroy TestBridge and clean up
 */
export function destroyTestBridge(): void {
  if (hasTestBridge()) {
    const bridge = getTestBridge();
    bridge.destroy(true); // Force cleanup
  }
}

/**
 * Get all manager instances from TestBridge
 */
export function getManagers(bridge: TraceLogTestBridge) {
  return {
    event: bridge.getEventManager(),
    storage: bridge.getStorageManager(),
    consent: bridge.getConsentManager(),
  };
}

/**
 * Get all handler instances from TestBridge
 */
export function getHandlers(bridge: TraceLogTestBridge) {
  return {
    session: bridge.getSessionHandler(),
    pageView: bridge.getPageViewHandler(),
    click: bridge.getClickHandler(),
    scroll: bridge.getScrollHandler(),
    performance: bridge.getPerformanceHandler(),
    error: bridge.getErrorHandler(),
    viewport: bridge.getViewportHandler(),
  };
}

/**
 * Get queue state from TestBridge (for validation)
 */
export function getQueueState(bridge: TraceLogTestBridge) {
  return {
    length: bridge.getQueueLength(),
    events: bridge.getQueueEvents(),
  };
}

/**
 * Get consent buffer state from TestBridge (for validation)
 */
export function getConsentBufferState(
  bridge: TraceLogTestBridge,
  integration: 'google' | 'custom' | 'tracelog',
) {
  return {
    length: bridge.getConsentBufferLength(),
    events: bridge.getConsentBufferEvents(integration),
  };
}

/**
 * Get full state snapshot from TestBridge (for debugging)
 */
export function getStateSnapshot(bridge: TraceLogTestBridge) {
  return {
    initialized: bridge.initialized,
    state: bridge.getFullState(),
    session: bridge.getSessionData(),
    queue: getQueueState(bridge),
    consent: bridge.getConsentState(),
  };
}

/**
 * Setup event listener with automatic cleanup
 * Returns unsubscribe function
 */
export function onEvent(
  bridge: TraceLogTestBridge,
  event: string,
  callback: (data: any) => void,
): () => void {
  bridge.on(event, callback);
  return () => bridge.off(event, callback);
}

/**
 * Collect events emitted during test execution
 * Returns array of collected events and cleanup function
 *
 * @example
 * const [getEvents, cleanup] = collectEvents(bridge, 'event');
 * // ... trigger events
 * const events = getEvents();
 * cleanup();
 */
export function collectEvents(
  bridge: TraceLogTestBridge,
  eventName: string,
): [() => any[], () => void] {
  const collected: any[] = [];

  const callback = (data: any) => {
    collected.push(data);
  };

  bridge.on(eventName, callback);

  const getEvents = () => [...collected];
  const cleanup = () => {
    bridge.off(eventName, callback);
    collected.length = 0;
  };

  return [getEvents, cleanup];
}

/**
 * Wait for specific number of events to be collected
 *
 * @param bridge - TestBridge instance
 * @param eventName - Event name to listen for
 * @param count - Number of events to wait for
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @returns Promise that resolves with collected events
 */
export async function waitForEvents(
  bridge: TraceLogTestBridge,
  eventName: string,
  count: number,
  timeout = 5000,
): Promise<any[]> {
  const collected: any[] = [];

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      bridge.off(eventName, callback);
      reject(new Error(`Timeout waiting for ${count} events (got ${collected.length})`));
    }, timeout);

    const callback = (data: any) => {
      collected.push(data);
      if (collected.length >= count) {
        clearTimeout(timeoutId);
        bridge.off(eventName, callback);
        resolve([...collected]);
      }
    };

    bridge.on(eventName, callback);
  });
}

/**
 * Trigger custom event and wait for it to be queued
 */
export async function triggerAndWaitForEvent(
  bridge: TraceLogTestBridge,
  eventName: string,
  metadata?: Record<string, unknown> | Record<string, unknown>[],
  timeout = 1000,
): Promise<void> {
  const initialLength = bridge.getQueueLength();

  bridge.event(eventName, metadata);

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (bridge.getQueueLength() > initialLength) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Event "${eventName}" not queued after ${timeout}ms`);
}
