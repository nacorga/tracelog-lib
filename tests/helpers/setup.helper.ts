/**
 * Test Setup Helper
 *
 * Provides common setup and cleanup functions for all test types
 */

import { vi } from 'vitest';

/**
 * Complete test environment setup
 * Call this in beforeEach for consistent test isolation
 */
export function setupTestEnvironment(): void {
  // Clear all mocks
  vi.clearAllMocks();

  // Clear storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset console methods
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();

  // Reset timers to real
  vi.useRealTimers();
}

/**
 * Complete test environment cleanup
 * Call this in afterEach for thorough cleanup
 */
export function cleanupTestEnvironment(): void {
  // Clear all mocks
  vi.clearAllMocks();

  // Clear storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Restore all mocks
  vi.restoreAllMocks();

  // Reset global.fetch to undefined (clean slate for next test)
  // Note: vi.restoreAllMocks() doesn't restore direct property assignments
  delete (global as any).fetch;

  // Ensure real timers
  vi.useRealTimers();

  // Clear any intervals/timeouts
  vi.clearAllTimers();
}

/**
 * Setup fake timers for controlled async testing
 */
export function setupFakeTimers(): void {
  vi.useFakeTimers();
}

/**
 * Restore real timers after fake timer tests
 */
export function restoreRealTimers(): void {
  vi.useRealTimers();
}

/**
 * Advance timers by specific duration
 * Use this instead of vi.runAllTimersAsync() to avoid infinite loops
 */
export async function advanceTimers(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await vi.runOnlyPendingTimersAsync();
}

/**
 * Setup minimal DOM structure
 * Useful for tests that need basic DOM elements
 */
export function setupMinimalDOM(): void {
  document.body.innerHTML = `
    <div id="app">
      <button id="test-button">Test Button</button>
      <input id="test-input" type="text" />
      <a id="test-link" href="/test">Test Link</a>
    </div>
  `;
}

/**
 * Setup navigation environment (for SPA testing)
 */
export function setupNavigationEnvironment(): void {
  // Mock window.location
  delete (window as any).location;
  (window as any).location = {
    href: 'http://localhost:3000/',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
  };

  // Mock history API
  window.history.pushState = vi.fn();
  window.history.replaceState = vi.fn();
}

/**
 * Trigger custom event on element
 * Useful for simulating user interactions
 */
export function triggerEvent(element: HTMLElement, eventType: string, detail?: any): void {
  const event = new CustomEvent(eventType, {
    bubbles: true,
    cancelable: true,
    detail,
  });
  element.dispatchEvent(event);
}

/**
 * Wait for next tick
 * Useful for waiting for promises to resolve
 */
export async function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create mock performance API
 */
export function setupPerformanceAPI(): void {
  (window as any).performance = {
    now: vi.fn(() => Date.now()),
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now(),
    },
    getEntriesByType: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  };
}

/**
 * Setup IntersectionObserver mock
 */
export function setupIntersectionObserver(): void {
  (global as any).IntersectionObserver = class IntersectionObserver {
    constructor(
      public callback: IntersectionObserverCallback,
      public options?: IntersectionObserverInit,
    ) {}

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  };
}

/**
 * Setup MutationObserver mock
 */
export function setupMutationObserver(): void {
  (global as any).MutationObserver = class MutationObserver {
    constructor(public callback: MutationCallback) {}

    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  };
}

/**
 * Setup ResizeObserver mock
 */
export function setupResizeObserver(): void {
  (global as any).ResizeObserver = class ResizeObserver {
    constructor(public callback: ResizeObserverCallback) {}

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

/**
 * Setup complete browser API mocks
 * Useful for comprehensive integration tests
 */
export function setupBrowserAPIs(): void {
  setupPerformanceAPI();
  setupIntersectionObserver();
  setupMutationObserver();
  setupResizeObserver();
}
