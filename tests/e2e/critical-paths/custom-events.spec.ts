/**
 * E2E: Custom Events Tests
 * Focus: Custom event tracking via public API
 */

import { test, expect } from '@playwright/test';
import { type CapturedEvent, findCustomEventByName, assertEventStructure } from '../helpers/assertions.helper';

test.describe('E2E: Custom Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Basic Events', () => {
    test('should send custom event with name only', async ({ page }) => {
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

        // Send custom event with name only
        window.__traceLogBridge.event('button_clicked');

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const customEvent = findCustomEventByName(result, 'button_clicked');
      assertEventStructure(customEvent, 'custom');
      expect(customEvent.custom_event!.name).toBe('button_clicked');
      expect(customEvent.custom_event!.metadata).toBeUndefined();
    });

    test('should send custom event with metadata', async ({ page }) => {
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

        // Send custom event with metadata
        window.__traceLogBridge.event('product_viewed', {
          productId: 'abc-123',
          price: 299.99,
          category: 'electronics',
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const customEvent = findCustomEventByName(result, 'product_viewed');
      assertEventStructure(customEvent, 'custom');
      expect(customEvent.custom_event!.metadata).toBeDefined();
      expect((customEvent.custom_event!.metadata as any).productId).toBe('abc-123');
      expect((customEvent.custom_event!.metadata as any).price).toBe(299.99);
      expect((customEvent.custom_event!.metadata as any).category).toBe('electronics');
    });
  });

  test.describe('Event Validation', () => {
    test('should validate event name', async ({ page }) => {
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

        // Send custom event with valid name
        window.__traceLogBridge.event('valid_event_name');

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const customEvent = findCustomEventByName(result, 'valid_event_name');
      assertEventStructure(customEvent, 'custom');
      expect(customEvent.custom_event!.name).toBe('valid_event_name');
    });

    test('should validate metadata structure', async ({ page }) => {
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

        // Send custom event with nested metadata
        window.__traceLogBridge.event('cart_updated', {
          items: 3,
          total: 599.97,
          currency: 'USD',
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const customEvent = findCustomEventByName(result, 'cart_updated');
      assertEventStructure(customEvent, 'custom');
      expect(customEvent.custom_event!.metadata).toBeDefined();
      expect(typeof customEvent.custom_event!.metadata).toBe('object');
      expect((customEvent.custom_event!.metadata as any).items).toBe(3);
      expect((customEvent.custom_event!.metadata as any).total).toBe(599.97);
      expect((customEvent.custom_event!.metadata as any).currency).toBe('USD');
    });

    test('should emit custom event to listeners', async ({ page }) => {
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
          if (event.type === 'custom') {
            eventEmitted = true;
            Object.assign(emittedEvent, event);
          }
        });

        window.__traceLogBridge.event('checkout_completed', {
          orderId: 'ORDER-12345',
          total: 999.99,
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        return {
          eventEmitted,
          emittedEvent,
        };
      });

      expect(result.eventEmitted).toBe(true);
      expect(result.emittedEvent.type).toBe('custom');
      expect(result.emittedEvent.custom_event).toBeDefined();
      expect(result.emittedEvent.custom_event.name).toBe('checkout_completed');
      expect(result.emittedEvent.custom_event.metadata.orderId).toBe('ORDER-12345');
      expect(result.emittedEvent.custom_event.metadata.total).toBe(999.99);
    });

    test('should handle invalid metadata', async ({ page }) => {
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

        // Send event with various metadata types
        window.__traceLogBridge.event('test_event', {
          string: 'value',
          number: 123,
          boolean: true,
          null_value: null,
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        return events;
      });

      const customEvent = findCustomEventByName(result, 'test_event');
      assertEventStructure(customEvent, 'custom');
      expect(customEvent.custom_event!.metadata).toBeDefined();
      expect((customEvent.custom_event!.metadata as any).string).toBe('value');
      expect((customEvent.custom_event!.metadata as any).number).toBe(123);
      expect((customEvent.custom_event!.metadata as any).boolean).toBe(true);
    });
  });

  test.describe('Event Queue & Batching', () => {
    test('should add custom event to queue', async ({ page }) => {
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

        // Send custom event
        window.__traceLogBridge.event('feature_used', {
          featureName: 'advanced_search',
          timestamp: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        // Get queue events
        const queueEvents = window.__traceLogBridge.getQueueEvents();

        return {
          queueLength: queueEvents.length,
          queueEvents,
        };
      });

      expect(result.queueLength).toBeGreaterThan(0);

      // Find custom event in queue
      const customEventInQueue = result.queueEvents.find((e: any) => e.type === 'custom');
      expect(customEventInQueue).toBeDefined();
      expect((customEventInQueue as any).custom_event.name).toBe('feature_used');
      expect((customEventInQueue as any).custom_event.metadata.featureName).toBe('advanced_search');
    });

    test('should send custom events in batch', async ({ page }) => {
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

        // Send multiple custom events
        window.__traceLogBridge.event('event_1', { id: 1 });
        window.__traceLogBridge.event('event_2', { id: 2 });
        window.__traceLogBridge.event('event_3', { id: 3 });

        await new Promise((resolve) => setTimeout(resolve, 200));

        const queueEvents = window.__traceLogBridge.getQueueEvents();

        return {
          queueLength: queueEvents.length,
          queueEvents,
        };
      });

      expect(result.queueLength).toBeGreaterThan(0);

      // Find all custom events in queue
      const customEvents = result.queueEvents.filter((e: any) => e.type === 'custom');
      expect(customEvents.length).toBeGreaterThanOrEqual(3);

      // Verify each event
      const event1 = customEvents.find((e: any) => e.custom_event?.name === 'event_1');
      const event2 = customEvents.find((e: any) => e.custom_event?.name === 'event_2');
      const event3 = customEvents.find((e: any) => e.custom_event?.name === 'event_3');

      expect(event1).toBeDefined();
      expect(event2).toBeDefined();
      expect(event3).toBeDefined();
      expect((event1 as any).custom_event.metadata.id).toBe(1);
      expect((event2 as any).custom_event.metadata.id).toBe(2);
      expect((event3 as any).custom_event.metadata.id).toBe(3);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid event names', async ({ page }) => {
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

        const errors: string[] = [];
        const events: any[] = [];

        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        // Capture console errors
        const originalError = console.error;
        console.error = (...args: any[]) => {
          errors.push(args.join(' '));
          originalError.apply(console, args);
        };

        try {
          // Try to send event with empty name
          window.__traceLogBridge.event('');
        } catch (error: any) {
          errors.push(error.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        // Restore console.error
        console.error = originalError;

        return {
          errors,
          events,
        };
      });

      // Either no event was created or an error was logged
      const customEvents = result.events.filter((e: any) => e.type === 'custom' && e.custom_event.name === '');
      expect(customEvents.length).toBe(0);
    });
  });
});
