/**
 * E2E Test Template
 *
 * Use this template as a starting point for new E2E tests.
 * It demonstrates best practices and proper usage of helpers.
 *
 * To create a new test file:
 * 1. Copy this file
 * 2. Rename to match your feature (e.g., 'feature-name.spec.ts')
 * 3. Update the describe block name
 * 4. Replace template tests with your actual tests
 * 5. Remove unused imports
 */

import { test, expect } from '@playwright/test';
// Example imports - remove unused imports in your actual tests
// import { E2E_WAIT_TIMES, initCodeWithConfig } from './helpers/bridge.helper';
import {
  type CapturedEvent,
  findEventByType,
  findEventsByType,
  findCustomEventByName,
  assertEventStructure,
  assertPIISanitized,
  // assertValidTimestamp,
  // assertValidClickCoordinates,
  // assertValidScrollDepth,
} from './helpers/assertions.helper';

test.describe('E2E: [Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Prevent auto-initialization by script.js
    // This ensures we have full control over TraceLog initialization timing
    await page.goto('/?auto-init=false');
  });

  /**
   * Template Test 1: Basic event capture
   *
   * This test demonstrates the standard pattern for capturing and asserting events.
   */
  test('should capture [event type] events', async ({ page }) => {
    // Execute test in browser context and return serializable data
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // Standard setup: Wait for bridge + Initialize + Setup listener
      // This replaces ~20 lines of boilerplate code
      // NOTE: Copy E2E_SETUP_CODE here or use string interpolation:
      // eval(E2E_SETUP_CODE) or window.__traceLogBridge methods directly

      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      // Initialize
      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init();

      // Setup event listener
      const events: any[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event);
      });

      // ===== YOUR TEST CODE STARTS HERE =====

      // Trigger the action you want to test
      // Example: Click a button
      const button = document.querySelector('[data-testid="test-button"]') as HTMLElement;
      if (button) {
        button.click();
      }

      // Wait for event processing using documented wait times
      await new Promise((resolve) => setTimeout(resolve, 200)); // E2E_WAIT_TIMES.EVENT_PROCESSING

      // ===== YOUR TEST CODE ENDS HERE =====

      // Return serializable data
      return events;
    });

    // ===== ASSERTIONS (Run in Node.js context) =====

    // Use type-safe helper to find event
    const clickEvent = findEventByType(result, 'click');

    // Use assertion helper to validate structure
    assertEventStructure(clickEvent, 'click');

    // Add specific assertions for your test
    expect(clickEvent.click_data).toBeDefined();
    expect(clickEvent.click_data!.tag).toBe('button');
  });

  /**
   * Template Test 2: Event with custom config
   *
   * This test demonstrates how to initialize TraceLog with custom configuration.
   */
  test('should work with custom config', async ({ page }) => {
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      // Use initCodeWithConfig helper for custom initialization
      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init({
        sessionTimeout: 5000,
        globalMetadata: { testMode: true },
      });

      // Setup event listener
      const events: any[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event);
      });

      // Your test code here...

      await new Promise((resolve) => setTimeout(resolve, 200)); // E2E_WAIT_TIMES.EVENT_PROCESSING

      return events;
    });

    // Assertions...
    expect(result.length).toBeGreaterThan(0);
  });

  /**
   * Template Test 3: Custom event tracking
   *
   * This test demonstrates how to test custom events with metadata.
   */
  test('should track custom events', async ({ page }) => {
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      // Initialize
      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init();

      // Setup event listener
      const events: any[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event);
      });

      // Send custom event via bridge
      window.__traceLogBridge.event('test_event', {
        category: 'testing',
        value: 123,
      });

      await new Promise((resolve) => setTimeout(resolve, 200)); // E2E_WAIT_TIMES.EVENT_PROCESSING

      return events;
    });

    // Use helper to find custom event by name
    const customEvent = findCustomEventByName(result, 'test_event');

    assertEventStructure(customEvent, 'custom');
    expect(customEvent.custom_event).toBeDefined();
    expect(customEvent.custom_event!.name).toBe('test_event');
    expect(customEvent.custom_event!.metadata).toBeDefined();
    expect(customEvent.custom_event!.metadata!.category).toBe('testing');
    expect(customEvent.custom_event!.metadata!.value).toBe(123);
  });

  /**
   * Template Test 4: PII sanitization
   *
   * This test demonstrates how to verify PII is properly sanitized.
   */
  test('should sanitize PII from captured data', async ({ page }) => {
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      // Initialize
      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init();

      // Setup event listener
      const events: any[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event);
      });

      // Create element with PII in text content
      const button = document.createElement('button');
      button.textContent = 'Contact: user@example.com or 555-1234';
      button.setAttribute('data-testid', 'pii-button');
      document.body.appendChild(button);

      // Click button
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 200)); // E2E_WAIT_TIMES.EVENT_PROCESSING

      // Cleanup
      document.body.removeChild(button);

      return events;
    });

    const clickEvent = findEventByType(result, 'click');
    assertEventStructure(clickEvent, 'click');

    // Use PII assertion helper
    const originalPII = ['user@example.com', '555-1234'];
    assertPIISanitized(clickEvent.click_data!.text!, originalPII);
  });

  /**
   * Template Test 5: Multiple events
   *
   * This test demonstrates how to work with multiple events of the same type.
   */
  test('should capture multiple events', async ({ page }) => {
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      // Initialize
      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init();

      // Setup event listener
      const events: any[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event);
      });

      // Trigger multiple actions
      window.__traceLogBridge.event('event_1', { id: 1 });
      window.__traceLogBridge.event('event_2', { id: 2 });
      window.__traceLogBridge.event('event_3', { id: 3 });

      await new Promise((resolve) => setTimeout(resolve, 200)); // E2E_WAIT_TIMES.EVENT_PROCESSING

      return events;
    });

    // Use helper to find all custom events
    const customEvents = findEventsByType(result, 'custom');

    expect(customEvents.length).toBeGreaterThanOrEqual(3);

    // Find specific events
    const event1 = customEvents.find((e) => e.custom_event?.name === 'event_1');
    const event2 = customEvents.find((e) => e.custom_event?.name === 'event_2');
    const event3 = customEvents.find((e) => e.custom_event?.name === 'event_3');

    expect(event1).toBeDefined();
    expect(event2).toBeDefined();
    expect(event3).toBeDefined();
  });

  /**
   * Template Test 6: Nested describe blocks
   *
   * For larger test suites, organize tests into logical groups.
   */
  test.describe('Subfeature 1', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    test('should do something specific', async () => {
      // Test implementation...
      expect(true).toBe(true);
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    test('should handle edge case', async () => {
      // Test implementation...
      expect(true).toBe(true);
    });
  });

  test.describe('Subfeature 2', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    test('should work in different scenarios', async () => {
      // Test implementation...
      expect(true).toBe(true);
    });
  });
});

/**
 * HELPER USAGE REFERENCE
 *
 * Import from helpers:
 * ```typescript
 * import { E2E_SETUP_CODE, E2E_WAIT_TIMES, initCodeWithConfig } from './helpers/bridge.helper';
 * import { CapturedEvent, findEventByType, assertEventStructure } from './helpers/assertions.helper';
 * ```
 *
 * Wait times:
 * - E2E_WAIT_TIMES.EVENT_PROCESSING (200ms) - Standard event processing
 * - E2E_WAIT_TIMES.INIT_COMPLETE (300ms) - After initialization
 * - E2E_WAIT_TIMES.DEBOUNCE (500ms) - Debounced events (scroll)
 * - E2E_WAIT_TIMES.RATE_LIMIT (800ms) - Rate-limited events
 * - E2E_WAIT_TIMES.THROTTLE (1100ms) - Throttled events (page view)
 * - E2E_WAIT_TIMES.ERROR_PROCESSING (500ms) - Error events
 *
 * Common patterns:
 * ```typescript
 * // Standard setup (see bridge.helper.ts for E2E_SETUP_CODE content)
 * // You can copy the setup code directly into your tests
 *
 * // Find single event
 * const event = findEventByType(result, 'click');
 *
 * // Find multiple events
 * const events = findEventsByType(result, 'scroll');
 *
 * // Assert structure
 * assertEventStructure(event, 'click');
 *
 * // Assert PII sanitization
 * assertPIISanitized(text, ['secret@email.com']);
 *
 * // Validate coordinates
 * assertValidClickCoordinates(clickEvent.click_data!);
 *
 * // Validate scroll depth
 * assertValidScrollDepth(scrollEvent.scroll_data!);
 * ```
 */
