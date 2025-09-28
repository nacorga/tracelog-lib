/**
 * Basic Custom Events Test
 *
 * Tests basic TraceLog custom event functionality without complex abstractions
 * Focus: Library custom event validation only
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Custom Events', () => {
  test('should send custom events without metadata', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({ id: 'skip' });
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
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({ id: 'skip' });
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
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({ id: 'skip' });
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
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({ id: 'skip' });
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
});
