/**
 * E2E Test Assertion Helpers
 *
 * This module provides type-safe interfaces and helper functions for
 * asserting event data in E2E tests.
 *
 * Usage:
 * ```typescript
 * import { findEventByType, assertEventStructure, CapturedEvent } from './helpers/assertions.helper';
 *
 * const result = await page.evaluate(...): Promise<CapturedEvent[]> => { ... };
 * const clickEvent = findEventByType(result, 'click');
 * assertEventStructure(clickEvent, 'click');
 * ```
 */

import { expect } from '@playwright/test';

/**
 * Click event data structure (v3.0)
 */
export interface ClickData {
  /** HTML tag name (e.g., 'button', 'a', 'div') */
  tag?: string;
  /** Element ID attribute */
  id?: string;
  /** Element class attribute */
  class?: string;
  /** Element text content (PII-sanitized) */
  text?: string;
  /** Anchor href, if the clicked element is/is inside an <a> tag */
  href?: string;
  /** Absolute X coordinate of click */
  x: number;
  /** Absolute Y coordinate of click */
  y: number;
}

/**
 * Scroll event data structure (v3.0)
 */
export interface ScrollData {
  /** Current scroll depth percentage (0-100) */
  depth: number;
  /** Scroll direction: 'up' or 'down' */
  direction: 'up' | 'down';
  /** CSS selector for the scrolled container */
  container_selector?: string;
}

/**
 * Custom event data structure
 */
export interface CustomEventData {
  /** Custom event name */
  name: string;
  /** Optional metadata object */
  metadata?: Record<string, any>;
}

/**
 * Error event data structure
 */
export interface ErrorData {
  /** Error type: 'js_error' or 'promise_rejection' */
  type: 'js_error' | 'promise_rejection';
  /** Error message (PII-sanitized) */
  message: string;
  /** Error stack trace (if available) */
  stack?: string;
  /** Error name (e.g., 'TypeError', 'ReferenceError') */
  name?: string;
}

/**
 * Page view event data structure (v3.0)
 *
 * Pathname, search and hash are intentionally not part of the payload anymore —
 * the full URL is sent via `page_url` instead.
 */
export interface PageViewDataDetails {
  /** Document referrer URL */
  referrer?: string;
  /** Document title */
  title?: string;
}

/**
 * Captured event structure (matches library EventData)
 */
export interface CapturedEvent {
  /** Event type */
  type: 'click' | 'scroll' | 'custom' | 'error' | 'page_view' | 'session_start' | 'session_end' | 'web_vitals';
  /** Event timestamp */
  timestamp?: number;
  /** Click event data */
  click_data?: ClickData;
  /** Scroll event data */
  scroll_data?: ScrollData;
  /** Custom event data */
  custom_event?: CustomEventData;
  /** Error event data */
  error_data?: ErrorData;
  /** Page view event data (nested details) */
  page_view?: PageViewDataDetails;
  /** Page URL (for page_view events) */
  page_url?: string;
  /** Previous page URL (for navigation) */
  from_page_url?: string;
  /** Session ID (attached to some events) */
  session_id?: string;
  /** User ID (attached to some events) */
  user_id?: string;
}

/**
 * Find first event matching the specified type.
 *
 * @param events - Array of captured events
 * @param type - Event type to find
 * @returns First matching event or undefined
 *
 * @example
 * ```typescript
 * const clickEvent = findEventByType(result, 'click');
 * expect(clickEvent).toBeDefined();
 * ```
 */
export function findEventByType(events: CapturedEvent[], type: CapturedEvent['type']): CapturedEvent | undefined {
  return events.find((e) => e.type === type);
}

/**
 * Find all events matching the specified type.
 *
 * @param events - Array of captured events
 * @param type - Event type to find
 * @returns Array of matching events (may be empty)
 *
 * @example
 * ```typescript
 * const scrollEvents = findEventsByType(result, 'scroll');
 * expect(scrollEvents.length).toBeGreaterThan(0);
 * ```
 */
export function findEventsByType(events: CapturedEvent[], type: CapturedEvent['type']): CapturedEvent[] {
  return events.filter((e) => e.type === type);
}

/**
 * Find custom event by name.
 *
 * @param events - Array of captured events
 * @param name - Custom event name
 * @returns First matching custom event or undefined
 *
 * @example
 * ```typescript
 * const purchaseEvent = findCustomEventByName(result, 'purchase');
 * expect(purchaseEvent).toBeDefined();
 * ```
 */
export function findCustomEventByName(events: CapturedEvent[], name: string): CapturedEvent | undefined {
  return events.find((e) => e.type === 'custom' && e.custom_event?.name === name);
}

/**
 * Assert that an event exists and has the expected type.
 * Throws helpful assertion errors if validation fails.
 *
 * @param event - Event to validate (may be undefined)
 * @param expectedType - Expected event type
 *
 * @example
 * ```typescript
 * const clickEvent = findEventByType(result, 'click');
 * assertEventStructure(clickEvent, 'click');
 * // Now TypeScript knows clickEvent is defined and has type 'click'
 * ```
 */
export function assertEventStructure(
  event: CapturedEvent | undefined,
  expectedType: CapturedEvent['type'],
): asserts event is CapturedEvent {
  expect(event, `Expected ${expectedType} event to be defined in captured events`).toBeDefined();
  expect(event!.type).toBe(expectedType);
}

/**
 * Assert that text has been sanitized for PII.
 * Checks that original PII is not present and [REDACTED] marker exists.
 *
 * @param text - Text to check for sanitization
 * @param originalPII - Array of PII strings that should be redacted
 *
 * @example
 * ```typescript
 * assertPIISanitized(clickEvent.click_data.text, ['user@example.com', '555-1234']);
 * ```
 */
export function assertPIISanitized(text: string, originalPII: string[]): void {
  for (const pii of originalPII) {
    expect(text, `Text should not contain PII: ${pii}`).not.toContain(pii);
  }
  expect(text, 'Text should contain [REDACTED] marker').toContain('[REDACTED]');
}

/**
 * Assert that an event does NOT contain any PII in its serialized form.
 * Useful for comprehensive PII checks across the entire event object.
 *
 * @param event - Event to check
 * @param piiPatterns - Array of PII strings/patterns to check for
 *
 * @example
 * ```typescript
 * assertNoPII(clickEvent, ['secret@email.com', '4111-1111-1111-1111']);
 * ```
 */
export function assertNoPII(event: CapturedEvent, piiPatterns: string[]): void {
  const eventStr = JSON.stringify(event);
  for (const pii of piiPatterns) {
    expect(eventStr, `Event should not contain PII: ${pii}`).not.toContain(pii);
  }
}

/**
 * Assert that event has valid timestamp.
 * Checks that timestamp exists, is a number, and is recent (within last 10 seconds).
 *
 * @param event - Event to validate
 *
 * @example
 * ```typescript
 * assertValidTimestamp(clickEvent);
 * ```
 */
export function assertValidTimestamp(event: CapturedEvent): void {
  expect(event.timestamp, 'Event should have timestamp').toBeDefined();
  expect(typeof event.timestamp, 'Timestamp should be a number').toBe('number');

  const now = Date.now();
  const timeDiff = now - event.timestamp!;
  expect(timeDiff, 'Timestamp should be recent (within 10 seconds)').toBeLessThan(10000);
  expect(timeDiff, 'Timestamp should not be in the future').toBeGreaterThanOrEqual(0);
}

/**
 * Assert that click event has valid coordinates.
 * Checks that x, y are present and >= 0.
 *
 * @param clickData - Click data to validate
 *
 * @example
 * ```typescript
 * assertValidClickCoordinates(clickEvent.click_data!);
 * ```
 */
export function assertValidClickCoordinates(clickData: ClickData): void {
  expect(clickData.x, 'Click X coordinate should be defined').toBeDefined();
  expect(clickData.y, 'Click Y coordinate should be defined').toBeDefined();
  expect(clickData.x, 'Click X should be >= 0').toBeGreaterThanOrEqual(0);
  expect(clickData.y, 'Click Y should be >= 0').toBeGreaterThanOrEqual(0);
}

/**
 * Assert that scroll depth is valid (0-100 percentage).
 *
 * @param scrollData - Scroll data to validate
 *
 * @example
 * ```typescript
 * assertValidScrollDepth(scrollEvent.scroll_data!);
 * ```
 */
export function assertValidScrollDepth(scrollData: ScrollData): void {
  expect(scrollData.depth, 'Scroll depth should be defined').toBeDefined();
  expect(scrollData.depth, 'Scroll depth should be >= 0').toBeGreaterThanOrEqual(0);
  expect(scrollData.depth, 'Scroll depth should be <= 100').toBeLessThanOrEqual(100);
}

/**
 * Assert that a page_view event has valid page_view data with at least pathname.
 * This ensures the page_view field is properly propagated through the event pipeline.
 *
 * @param event - Page view event to validate
 *
 * @example
 * ```typescript
 * const pageViewEvent = findEventByType(result, 'page_view');
 * assertEventStructure(pageViewEvent, 'page_view');
 * assertPageViewData(pageViewEvent);
 * ```
 */
export function assertPageViewData(event: CapturedEvent): void {
  expect(event.type, 'Event should be page_view type').toBe('page_view');
  expect(event.page_url, 'Page view event should have page_url').toBeDefined();
  expect(typeof event.page_url, 'page_url should be a string').toBe('string');
}

/**
 * Assert that page_view data contains expected values.
 * Useful for verifying specific navigation scenarios.
 *
 * @param event - Page view event to validate
 * @param expected - Expected values for page_view fields
 *
 * @example
 * ```typescript
 * assertPageViewDataContains(pageViewEvent, {
 *   pathname: '/products',
 *   title: 'Products Page',
 * });
 * ```
 */
export function assertPageViewDataContains(event: CapturedEvent, expected: Partial<PageViewDataDetails>): void {
  expect(event.page_view, 'Page view event should have page_view data').toBeDefined();

  if (expected.title !== undefined) {
    expect(event.page_view!.title, 'Title should match expected').toBe(expected.title);
  }
  if (expected.referrer !== undefined) {
    expect(event.page_view!.referrer, 'Referrer should match expected').toBe(expected.referrer);
  }
}

/**
 * Assert that a page_view event has navigation tracking (from_page_url).
 * Useful for verifying SPA navigation events.
 *
 * @param event - Page view event to validate
 *
 * @example
 * ```typescript
 * // For SPA navigation events
 * assertPageViewNavigation(pageViewEvent);
 * expect(pageViewEvent.from_page_url).toContain('/previous-page');
 * ```
 */
export function assertPageViewNavigation(event: CapturedEvent): void {
  assertPageViewData(event);
  expect(event.from_page_url, 'Navigation event should have from_page_url').toBeDefined();
  expect(typeof event.from_page_url, 'from_page_url should be a string').toBe('string');
}
