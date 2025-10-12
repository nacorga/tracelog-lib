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
        await window.__traceLogBridge!.init();
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

    // Verify exactly one click event was captured
    expect(capturedEvents.length).toBe(1);

    // Verify event structure
    const clickEvent = capturedEvents[0];
    expect(clickEvent.type).toBe('click');
    expect(clickEvent.timestamp).toBeDefined();
    expect(typeof clickEvent.timestamp).toBe('number');
    expect(clickEvent.click_data).toBeDefined();
  });

  test('should capture multiple click events', async ({ page }) => {
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

        // Wait between clicks (must exceed click throttle of 300ms)
        await new Promise((resolve) => setTimeout(resolve, 350));

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

    // Verify exactly 2 click events were captured (different coordinates avoid deduplication)
    expect(capturedEvents.length).toBe(2);

    // Verify all are click events with proper structure
    capturedEvents.forEach((event) => {
      expect(event.type).toBe('click');
      expect(event.timestamp).toBeDefined();
      expect(event.click_data).toBeDefined();
    });

    // Verify different coordinates were captured
    expect(capturedEvents[0].click_data.x).toBe(100);
    expect(capturedEvents[0].click_data.y).toBe(200);
    expect(capturedEvents[1].click_data.x).toBe(150);
    expect(capturedEvents[1].click_data.y).toBe(250);
  });

  test('should include click position data', async ({ page }) => {
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
    expect(capturedEvents.length).toBe(1);

    const clickEvent = capturedEvents[0];
    expect(clickEvent.type).toBe('click');

    // Verify click data structure (click events should have click_data field)
    expect(clickEvent.click_data).toBeDefined();
    expect(typeof clickEvent.click_data).toBe('object');
    expect(clickEvent.click_data.x).toBe(150);
    expect(clickEvent.click_data.y).toBe(250);
    expect(typeof clickEvent.click_data.relativeX).toBe('number');
    expect(typeof clickEvent.click_data.relativeY).toBe('number');
  });
});
