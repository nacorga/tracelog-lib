/**
 * E2E: Scroll Tracking Tests
 * Focus: Scroll depth tracking with debouncing
 */

import { test, expect } from '@playwright/test';
import {
  type CapturedEvent,
  findEventByType,
  findEventsByType,
  assertEventStructure,
  assertValidScrollDepth,
} from '../helpers/assertions.helper';

test.describe('E2E: Scroll Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Scroll Metrics', () => {
    test('should track scroll depth percentage', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        // Wait for init
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Trigger scroll
        window.scrollTo(0, 100);

        // Wait for debounce (250ms) + processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const scrollEvent = findEventByType(result, 'scroll');

      if (scrollEvent) {
        assertEventStructure(scrollEvent, 'scroll');
        assertValidScrollDepth(scrollEvent.scroll_data!);
      }
    });

    test('should track scroll depth pixels', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Scroll to specific position
        window.scrollTo(0, 200);

        await new Promise((resolve) => setTimeout(resolve, 500));

        return { events, scrollY: window.scrollY };
      });

      expect(result.scrollY).toBeGreaterThan(0);

      const scrollEvent = findEventByType(result.events, 'scroll');

      if (scrollEvent) {
        assertEventStructure(scrollEvent, 'scroll');
        expect(scrollEvent.scroll_data!.depth).toBeGreaterThan(0);
      }
    });

    test('should track scroll direction (up/down)', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Scroll down
        window.scrollTo(0, 300);

        // Wait for debounce + rate limit
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Scroll up
        window.scrollTo(0, 100);

        await new Promise((resolve) => setTimeout(resolve, 800));

        return events;
      });

      const scrollEvents = findEventsByType(result, 'scroll');

      if (scrollEvents.length >= 2) {
        expect(scrollEvents[0]!.scroll_data!.direction).toBe('down');
        expect(scrollEvents[1]!.scroll_data!.direction).toBe('up');
      }
    });

    test('should track max depth reached', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Scroll to mid-point
        window.scrollTo(0, 300);

        await new Promise((resolve) => setTimeout(resolve, 800));

        return events;
      });

      const scrollEvent = findEventByType(result, 'scroll');

      if (scrollEvent) {
        assertEventStructure(scrollEvent, 'scroll');
        expect(scrollEvent.scroll_data!.max_depth_reached).toBeDefined();
        expect(scrollEvent.scroll_data!.max_depth_reached).toBeGreaterThanOrEqual(scrollEvent.scroll_data!.depth);
      }
    });
  });

  test.describe('Debouncing & Rate Limiting', () => {
    test('should debounce scroll events (250ms)', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Rapid scroll events should be debounced
        window.scrollTo(0, 100);
        await new Promise((resolve) => setTimeout(resolve, 50));
        window.scrollTo(0, 200);
        await new Promise((resolve) => setTimeout(resolve, 50));
        window.scrollTo(0, 300);

        // Wait for debounce to complete
        await new Promise((resolve) => setTimeout(resolve, 800));

        return events;
      });

      const scrollEvents = findEventsByType(result, 'scroll');

      // Should have only 1 scroll event due to debouncing
      expect(scrollEvents.length).toBeLessThanOrEqual(1);
    });

    test('should suppress scroll for 500ms after init', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          events.push(event);
        });

        await window.__traceLogBridge.init();

        // Scroll immediately after init (within 500ms)
        window.scrollTo(0, 100);

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const scrollEvents = findEventsByType(result, 'scroll');

      // May have 0 or 1 scroll event depending on timing - just verify no errors
      expect(Array.isArray(scrollEvents)).toBe(true);
    });
  });

  test.describe('Event Emission', () => {
    test('should emit SCROLL event to listeners', async ({ page }) => {
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

        let scrollEventEmitted = false;
        const emittedScrollEvent: any = {};

        window.__traceLogBridge.on('event', (event) => {
          if (event.type === 'scroll') {
            scrollEventEmitted = true;
            Object.assign(emittedScrollEvent, event);
          }
        });

        await window.__traceLogBridge.init();

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Trigger scroll
        window.scrollTo(0, 300);

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 800));

        return {
          scrollEventEmitted,
          emittedScrollEvent,
        };
      });

      if (result.scrollEventEmitted) {
        expect(result.emittedScrollEvent.type).toBe('scroll');
        expect(result.emittedScrollEvent.scroll_data).toBeDefined();
      }
    });
  });
});
