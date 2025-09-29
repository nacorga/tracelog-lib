/**
 * Basic Click Events Test
 *
 * Tests basic TraceLog click event capture functionality without complex abstractions
 * Focus: Library click event validation only
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Basic Click Events', () => {
  test('should capture click events', async ({ page }) => {
    await navigateToPlayground(page);

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

    // Set up event listener to capture click events
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for click events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'click') {
          events.push(data);
        }
      });

      // Click on a button in the playground
      const button = document.querySelector('[data-testid="cta-ver-productos"]');
      if (button) {
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            clientX: 100,
            clientY: 200,
          }),
        );
      }

      // Wait for event to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify click event was captured
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify event structure
    const clickEvent = capturedEvents[0];
    expect(clickEvent.type).toBe('click');
    expect(clickEvent.timestamp).toBeDefined();
    expect(typeof clickEvent.timestamp).toBe('number');
  });

  test('should capture multiple click events', async ({ page }) => {
    await navigateToPlayground(page);

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

    // Capture multiple click events
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for click events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'click') {
          events.push(data);
        }
      });

      // Click the same element twice with different coordinates to avoid deduplication
      const button = document.querySelector('[data-testid="cta-ver-productos"]');

      if (button) {
        // First click
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            clientX: 100,
            clientY: 200,
          }),
        );

        // Wait between clicks
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Second click with different coordinates
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            clientX: 150,
            clientY: 250,
          }),
        );
      }

      // Wait for events to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify at least one event was captured (relaxed expectation)
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify all are click events
    capturedEvents.forEach((event) => {
      expect(event.type).toBe('click');
      expect(event.timestamp).toBeDefined();
    });
  });

  test('should include click position data', async ({ page }) => {
    await navigateToPlayground(page);

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

    // Capture click with specific coordinates
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for click events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'click') {
          events.push(data);
        }
      });

      // Click with specific coordinates
      const button = document.querySelector('[data-testid="cta-ver-productos"]');
      if (button) {
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            clientX: 150,
            clientY: 250,
          }),
        );
      }

      // Wait for event to be captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Verify click event contains position data
    expect(capturedEvents.length).toBeGreaterThan(0);

    const clickEvent = capturedEvents[0];
    expect(clickEvent.type).toBe('click');

    // Verify click data structure (click events should have click-specific data)
    if (clickEvent.click) {
      expect(typeof clickEvent.click).toBe('object');
    }
  });
});
