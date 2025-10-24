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
 * Click event data structure
 */
export interface ClickData {
  /** HTML tag name (e.g., 'button', 'a', 'div') */
  tag: string;
  /** Element ID attribute */
  id?: string;
  /** Element class attribute */
  class?: string;
  /** Element text content (PII-sanitized) */
  text?: string;
  /** Absolute X coordinate of click */
  x: number;
  /** Absolute Y coordinate of click */
  y: number;
  /** Relative X coordinate (0-1) within element */
  relativeX: number;
  /** Relative Y coordinate (0-1) within element */
  relativeY: number;
}

/**
 * Scroll event data structure
 */
export interface ScrollData {
  /** Current scroll depth percentage (0-100) */
  depth: number;
  /** Scroll direction: 'up' or 'down' */
  direction: 'up' | 'down';
  /** Maximum depth reached in this session (0-100) */
  max_depth_reached: number;
  /** Scroll velocity (pixels per second) */
  velocity?: number;
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
 * Page view event data structure
 */
export interface PageViewData {
  /** Current page URL */
  page_url: string;
  /** Previous page URL (for navigation tracking) */
  from_page_url?: string;
  /** Page title */
  title?: string;
  /** Referrer URL */
  referrer?: string;
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
 * Checks that x, y, relativeX, relativeY are present and within valid ranges.
 *
 * @param clickData - Click data to validate
 *
 * @example
 * ```typescript
 * assertValidClickCoordinates(clickEvent.click_data!);
 * ```
 */
export function assertValidClickCoordinates(clickData: ClickData): void {
  // Absolute coordinates
  expect(clickData.x, 'Click X coordinate should be defined').toBeDefined();
  expect(clickData.y, 'Click Y coordinate should be defined').toBeDefined();
  expect(clickData.x, 'Click X should be >= 0').toBeGreaterThanOrEqual(0);
  expect(clickData.y, 'Click Y should be >= 0').toBeGreaterThanOrEqual(0);

  // Relative coordinates (0-1 range)
  expect(clickData.relativeX, 'Relative X should be >= 0').toBeGreaterThanOrEqual(0);
  expect(clickData.relativeX, 'Relative X should be <= 1').toBeLessThanOrEqual(1);
  expect(clickData.relativeY, 'Relative Y should be >= 0').toBeGreaterThanOrEqual(0);
  expect(clickData.relativeY, 'Relative Y should be <= 1').toBeLessThanOrEqual(1);
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

  if (scrollData.max_depth_reached !== undefined) {
    expect(scrollData.max_depth_reached, 'Max depth should be >= current depth').toBeGreaterThanOrEqual(
      scrollData.depth,
    );
  }
}
