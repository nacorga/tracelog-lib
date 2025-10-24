/**
 * Assertions Helper
 *
 * Custom assertions for TraceLog-specific validations
 */

import { expect } from 'vitest';
import { EventType } from '../../src/types/event.types';

/**
 * Validate event structure has all required fields
 */
export function expectEventStructure(event: any): void {
  expect(event).toBeDefined();
  expect(event.type).toBeDefined();
  expect(event.timestamp).toBeTypeOf('number');
  expect(event.page_url).toBeTypeOf('string');
  expect(event.page_title).toBeTypeOf('string');
  expect(event.user_agent).toBeTypeOf('string');
  expect(event.viewport_width).toBeTypeOf('number');
  expect(event.viewport_height).toBeTypeOf('number');
  expect(event.device_type).toBeTypeOf('string');
  expect(event.language).toBeTypeOf('string');
  expect(event.timezone).toBeTypeOf('string');
}

/**
 * Validate queue structure has all required fields
 */
export function expectQueueStructure(queue: any): void {
  expect(queue).toBeDefined();
  expect(queue.session_id).toBeTypeOf('string');
  expect(queue.user_id).toBeTypeOf('string');
  expect(queue.events).toBeInstanceOf(Array);
  expect(queue.events.length).toBeGreaterThan(0);

  // Validate first event
  expectEventStructure(queue.events[0]);
}

/**
 * Validate sessionId format (UUID v4)
 */
export function expectSessionId(sessionId: any): void {
  expect(sessionId).toBeTypeOf('string');
  expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

/**
 * Validate userId format (UUID v4)
 */
export function expectUserId(userId: any): void {
  expect(userId).toBeTypeOf('string');
  expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

/**
 * Validate timestamp is recent (within last N seconds)
 */
export function expectRecentTimestamp(timestamp: number, maxAgeSeconds = 5): void {
  const now = Date.now();
  const age = now - timestamp;
  expect(age).toBeLessThan(maxAgeSeconds * 1000);
  expect(age).toBeGreaterThanOrEqual(0);
}

/**
 * Validate event type matches expected
 */
export function expectEventType(event: any, expectedType: EventType): void {
  expect(event.type).toBe(expectedType);
}

/**
 * Validate click event has required fields
 */
export function expectClickEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.CLICK);
  expect(event.click).toBeDefined();
  expect(event.click.element_tag).toBeTypeOf('string');
  expect(event.click.x).toBeTypeOf('number');
  expect(event.click.y).toBeTypeOf('number');
}

/**
 * Validate scroll event has required fields
 */
export function expectScrollEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.SCROLL);
  expect(event.scroll).toBeDefined();
  expect(event.scroll.depth_percentage).toBeTypeOf('number');
  expect(event.scroll.depth_pixels).toBeTypeOf('number');
  expect(event.scroll.direction).toMatch(/up|down/);
}

/**
 * Validate page view event has required fields
 */
export function expectPageViewEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.PAGE_VIEW);
  expect(event.page_view).toBeDefined();
  expect(event.page_view.path).toBeTypeOf('string');
}

/**
 * Validate session start event has required fields
 */
export function expectSessionStartEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.SESSION_START);
  expect(event.session).toBeDefined();
  expect(event.session.is_new_user).toBeTypeOf('boolean');
  expect(event.session.session_count).toBeTypeOf('number');
}

/**
 * Validate session end event has required fields
 */
export function expectSessionEndEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.SESSION_END);
  expect(event.session).toBeDefined();
  expect(event.session.duration_ms).toBeTypeOf('number');
  expect(event.session.page_views).toBeTypeOf('number');
  expect(event.session.events_count).toBeTypeOf('number');
}

/**
 * Validate custom event has required fields
 */
export function expectCustomEvent(event: any, expectedName?: string): void {
  expectEventStructure(event);
  expectEventType(event, EventType.CUSTOM);
  expect(event.custom_event).toBeDefined();
  expect(event.custom_event.name).toBeTypeOf('string');

  if (expectedName) {
    expect(event.custom_event.name).toBe(expectedName);
  }
}

/**
 * Validate web vitals event has required fields
 */
export function expectWebVitalsEvent(event: any, expectedMetric?: string): void {
  expectEventStructure(event);
  expectEventType(event, EventType.WEB_VITALS);
  expect(event.web_vitals).toBeDefined();
  expect(event.web_vitals.name).toBeTypeOf('string');
  expect(event.web_vitals.value).toBeTypeOf('number');
  expect(event.web_vitals.rating).toMatch(/good|needs-improvement|poor/);

  if (expectedMetric) {
    expect(event.web_vitals.name).toBe(expectedMetric);
  }
}

/**
 * Validate error event has required fields
 */
export function expectErrorEvent(event: any): void {
  expectEventStructure(event);
  expectEventType(event, EventType.ERROR);
  expect(event.error).toBeDefined();
  expect(event.error.message).toBeTypeOf('string');
  expect(event.error.type).toBeTypeOf('string');
}

/**
 * Validate URL has been sanitized (no sensitive query params)
 */
export function expectSanitizedUrl(url: string): void {
  const sensitiveParams = [
    'token',
    'auth',
    'key',
    'secret',
    'password',
    'api_key',
    'apikey',
    'access_token',
    'refresh_token',
    'session',
    'sessionid',
    'session_id',
    'jwt',
    'bearer',
    'oauth',
  ];

  const urlObj = new URL(url);

  sensitiveParams.forEach((param) => {
    expect(urlObj.searchParams.has(param)).toBe(false);
  });
}

/**
 * Validate text has been sanitized (no PII)
 */
export function expectSanitizedText(text: string): void {
  // Check for email
  expect(text).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

  // Check for phone (simple patterns)
  expect(text).not.toMatch(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);

  // Check for credit card (simple patterns)
  expect(text).not.toMatch(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/);
}

/**
 * Validate storage key format
 */
export function expectStorageKey(key: string, expectedPrefix = 'tlog'): void {
  expect(key).toBeTypeOf('string');
  expect(key).toContain(expectedPrefix);
}

/**
 * Validate fetch was called with correct structure
 */
export function expectFetchCall(mockFetch: any, expectedUrl: string, expectedMethod = 'POST'): void {
  expect(mockFetch).toHaveBeenCalled();

  const calls = mockFetch.mock.calls;
  expect(calls.length).toBeGreaterThan(0);

  const [url, options] = calls[0];
  expect(url).toBe(expectedUrl);
  expect(options.method).toBe(expectedMethod);
  expect(options.headers).toBeDefined();
  expect(options.body).toBeDefined();
}

/**
 * Validate fetch body has correct structure
 */
export function expectFetchBody(mockFetch: any, validator: (body: any) => void): void {
  expect(mockFetch).toHaveBeenCalled();

  const calls = mockFetch.mock.calls;
  const [, options] = calls[0];
  const body = JSON.parse(options.body);

  validator(body);
}

/**
 * Validate console method was called with message
 */
export function expectConsoleCall(consoleMethod: any, expectedMessage: string | RegExp): void {
  expect(consoleMethod).toHaveBeenCalled();

  const calls = consoleMethod.mock.calls;
  const messages = calls.map((call: any[]) => call.join(' '));

  const found = messages.some((msg: string) => {
    if (typeof expectedMessage === 'string') {
      return msg.includes(expectedMessage);
    }
    return expectedMessage.test(msg);
  });

  expect(found).toBe(true);
}

/**
 * Validate array contains event with specific type
 */
export function expectEventInArray(events: any[], eventType: EventType): void {
  const found = events.some((event) => event.type === eventType);
  expect(found).toBe(true);
}

/**
 * Validate array contains N events of specific type
 */
export function expectEventCountInArray(events: any[], eventType: EventType, expectedCount: number): void {
  const count = events.filter((event) => event.type === eventType).length;
  expect(count).toBe(expectedCount);
}

/**
 * Validate queue was flushed (localStorage cleared)
 */
export function expectQueueFlushed(userId: string, integrationId = 'custom'): void {
  const key = `tlog:queue:${userId}:${integrationId}`;
  const value = localStorage.getItem(key);
  expect(value).toBeNull();
}

/**
 * Validate queue was persisted (localStorage has data)
 */
export function expectQueuePersisted(userId: string, integrationId = 'custom'): void {
  const key = `tlog:queue:${userId}:${integrationId}`;
  const value = localStorage.getItem(key);
  expect(value).not.toBeNull();

  const parsed = JSON.parse(value!);
  expect(parsed).toBeDefined();
  expect(parsed.events).toBeInstanceOf(Array);
}

/**
 * Validate state has expected shape
 */
export function expectStateShape(state: any, expectedKeys: string[]): void {
  expect(state).toBeDefined();

  expectedKeys.forEach((key) => {
    expect(state).toHaveProperty(key);
  });
}

/**
 * Validate config was merged correctly
 */
export function expectMergedConfig(config: any, defaults: any, overrides: any): void {
  Object.keys(defaults).forEach((key) => {
    if (key in overrides) {
      expect(config[key]).toEqual(overrides[key]);
    } else {
      expect(config[key]).toEqual(defaults[key]);
    }
  });
}
