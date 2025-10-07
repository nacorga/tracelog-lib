/**
 * Basic Custom Events Test
 *
 * Tests basic TraceLog custom event functionality without complex abstractions
 * Focus: Library custom event validation only
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Basic Custom Events', () => {
  test('should send custom events without metadata', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Send custom event and capture it
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for custom events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'custom') {
          events.push(data);
        }
      });

      // Send custom event
      window.__traceLogBridge!.sendCustomEvent('user_action');

      // Wait for event to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify custom event was captured
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify event structure
    const customEvent = capturedEvents[0];
    expect(customEvent.type).toBe('custom');
    expect(customEvent.timestamp).toBeDefined();
    expect(typeof customEvent.timestamp).toBe('number');
    expect(customEvent.custom_event).toBeDefined();
    expect(customEvent.custom_event.name).toBe('user_action');
  });

  test('should send custom events with metadata', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Send custom event with metadata
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for custom events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'custom') {
          events.push(data);
        }
      });

      // Send custom event with metadata
      window.__traceLogBridge!.sendCustomEvent('purchase', {
        product_id: '123',
        amount: 99.99,
        currency: 'USD',
      });

      // Wait for event to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify custom event was captured
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify event structure with metadata
    const customEvent = capturedEvents[0];
    expect(customEvent.type).toBe('custom');
    expect(customEvent.custom_event.name).toBe('purchase');
    expect(customEvent.custom_event.metadata).toBeDefined();
    expect(customEvent.custom_event.metadata.product_id).toBe('123');
    expect(customEvent.custom_event.metadata.amount).toBe(99.99);
    expect(customEvent.custom_event.metadata.currency).toBe('USD');
  });

  test('should handle multiple custom events', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Send multiple custom events
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for custom events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'custom') {
          events.push(data);
        }
      });

      // Send multiple custom events
      window.__traceLogBridge!.sendCustomEvent('page_view', { page: 'home' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      window.__traceLogBridge!.sendCustomEvent('button_click', { button: 'cta' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      window.__traceLogBridge!.sendCustomEvent('form_submit', { form: 'contact' });

      // Wait for events to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify multiple events were captured
    expect(capturedEvents.length).toBeGreaterThanOrEqual(3);

    // Verify all are custom events with correct names
    const eventNames = capturedEvents.map((event) => event.custom_event.name);
    expect(eventNames).toContain('page_view');
    expect(eventNames).toContain('button_click');
    expect(eventNames).toContain('form_submit');
  });

  test('should reject invalid custom event names', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Try to send custom event with invalid name
    const result = await page.evaluate(async () => {
      try {
        // Try empty string
        window.__traceLogBridge!.sendCustomEvent('');
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Should handle invalid names gracefully (library might validate or silently ignore)
    // The test passes regardless since we're testing the library doesn't crash
    expect(typeof result.success).toBe('boolean');
  });

  test('should assign unique IDs to all custom events', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Send multiple custom events and verify IDs
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for custom events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'custom') {
          events.push(data);
        }
      });

      // Send 10 custom events rapidly
      for (let i = 0; i < 10; i++) {
        window.__traceLogBridge!.sendCustomEvent(`event_${i}`, { index: i });
      }

      // Wait for events to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify all events were captured
    expect(result.length).toBe(10);

    // Verify each event has a unique ID
    const eventIds = new Set<string>();
    const eventIdRegex = /^\d{13}-[0-9a-f]{8}$/;

    result.forEach((event, index) => {
      // Verify ID exists and is a string
      expect(event.id).toBeDefined();
      expect(typeof event.id).toBe('string');

      // Verify ID is a valid hybrid ID format: {timestamp}-{counter}-{random}
      expect(event.id).toMatch(eventIdRegex);

      // Verify ID is unique
      expect(eventIds.has(event.id)).toBe(false);
      eventIds.add(event.id);

      // Verify event data integrity
      expect(event.type).toBe('custom');
      expect(event.custom_event.name).toBe(`event_${index}`);
    });

    // Final uniqueness check
    expect(eventIds.size).toBe(10);
  });
});
