/**
 * E2E: Click Tracking Tests
 * Focus: Click event capture with PII sanitization
 */

import { test, expect } from '@playwright/test';
import {
  type CapturedEvent,
  findEventByType,
  assertEventStructure,
  assertPIISanitized,
  assertValidClickCoordinates,
} from '../helpers/assertions.helper';

test.describe('E2E: Click Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Disable auto-init to prevent script.js from initializing tracelog
    await page.goto('/?auto-init=false');
  });

  test.describe('Event Capture', () => {
    test('should capture click events on buttons', async ({ page }) => {
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

        // Click CTA button
        const button = document.querySelector('[data-testid="cta-ver-productos"]') as HTMLElement;
        if (button) {
          button.click();
        }

        // Wait for event processing
        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');
      expect(clickEvent.click_data).toBeDefined();
    });

    test('should capture element tag, id, classes', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Click cart button (has id, class, and testid)
        const button = document.querySelector('[data-testid="cart-button"]') as HTMLElement;
        if (button) {
          button.click();
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');
      expect(clickEvent.click_data!.tag).toBe('button');
      expect(clickEvent.click_data!.class).toContain('cart-btn');
    });

    test('should capture element text content', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Click button with text content
        const button = document.querySelector('[data-testid="cta-ver-productos"]') as HTMLElement;
        if (button) {
          button.click();
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');
      expect(clickEvent.click_data!.text).toBe('Ver Productos');
    });

    test('should capture click coordinates (x, y)', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        const button = document.querySelector('[data-testid="cta-ver-productos"]') as HTMLElement;
        if (button) {
          button.click();
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');
      assertValidClickCoordinates(clickEvent.click_data!);
    });
  });

  test.describe('Privacy & Security', () => {
    test('should NOT capture input values', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Create a test input and click it
        const input = document.createElement('input');
        input.type = 'text';
        input.value = 'secret-value';
        input.setAttribute('data-testid', 'test-input');
        document.body.appendChild(input);

        input.click();

        await new Promise((resolve) => setTimeout(resolve, 200));

        document.body.removeChild(input);

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');

      // Should NOT contain the input value
      const eventStr = JSON.stringify(clickEvent);
      expect(eventStr).not.toContain('secret-value');
    });

    test('should sanitize PII from text content', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Create button with PII in text
        const button = document.createElement('button');
        button.textContent = 'Contact us at user@example.com or call 555-123-4567';
        button.setAttribute('data-testid', 'pii-button');
        document.body.appendChild(button);

        button.click();

        await new Promise((resolve) => setTimeout(resolve, 200));

        document.body.removeChild(button);

        return events;
      });

      const clickEvent = findEventByType(result, 'click');
      assertEventStructure(clickEvent, 'click');

      // Use PII assertion helper
      assertPIISanitized(clickEvent.click_data!.text!, ['user@example.com', '555-123-4567']);
    });

    test('should respect data-tlog-ignore attribute', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Create button with data-tlog-ignore
        const button = document.createElement('button');
        button.textContent = 'Ignored Button';
        button.setAttribute('data-tlog-ignore', 'true');
        button.setAttribute('data-testid', 'ignored-button');
        document.body.appendChild(button);

        button.click();

        await new Promise((resolve) => setTimeout(resolve, 200));

        document.body.removeChild(button);

        return events;
      });

      // Should NOT have a click event for ignored element
      const clickEvent = findEventByType(result, 'click');
      expect(clickEvent).toBeUndefined();
    });
  });

  test.describe('Event Emission', () => {
    test('should emit CLICK event to listeners', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init();

        let eventEmitted = false;
        const emittedEvent: any = {};

        window.__traceLogBridge.on('event', (event) => {
          if (event.type === 'click') {
            eventEmitted = true;
            Object.assign(emittedEvent, event);
          }
        });

        const button = document.querySelector('[data-testid="cta-ver-productos"]') as HTMLElement;
        if (button) {
          button.click();
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        return {
          eventEmitted,
          emittedEvent,
        };
      });

      expect(result.eventEmitted).toBe(true);
      expect(result.emittedEvent.type).toBe('click');
      expect(result.emittedEvent.click_data).toBeDefined();
    });
  });
});
