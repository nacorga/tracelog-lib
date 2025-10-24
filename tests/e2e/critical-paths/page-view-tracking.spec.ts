/**
 * E2E: Page View Tracking Tests
 * Focus: Navigation and page view tracking
 */

import { test, expect } from '@playwright/test';
import {
  type CapturedEvent,
  findEventByType,
  findEventsByType,
  assertEventStructure,
} from '../helpers/assertions.helper';

test.describe('E2E: Page View Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Basic Tracking', () => {
    test('should emit PAGE_VIEW event on init', async ({ page }) => {
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

        return events;
      });

      const pageViewEvent = findEventByType(result, 'page_view');
      assertEventStructure(pageViewEvent, 'page_view');
      expect(pageViewEvent.page_url).toBeDefined();
      expect(pageViewEvent.page_url).toContain('localhost');
    });

    test('should track page path and title', async ({ page }) => {
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

        return events;
      });

      const pageViewEvent = findEventByType(result, 'page_view');
      assertEventStructure(pageViewEvent, 'page_view');
      expect(pageViewEvent.page_url).toContain('/');
    });

    test('should track referrer', async ({ page }) => {
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

        return events;
      });

      const pageViewEvent = findEventByType(result, 'page_view');
      assertEventStructure(pageViewEvent, 'page_view');
      expect(pageViewEvent.page_url).toBeDefined();
    });
  });

  test.describe('URL Parameters', () => {
    test('should extract UTM parameters from URL', async ({ page }) => {
      await page.goto('/?auto-init=false&utm_source=test&utm_medium=email&utm_campaign=launch');

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

        return events;
      });

      const pageViewEvent = findEventByType(result, 'page_view');
      assertEventStructure(pageViewEvent, 'page_view');
      expect(pageViewEvent.page_url).toContain('utm_source=test');
      expect(pageViewEvent.page_url).toContain('utm_medium=email');
      expect(pageViewEvent.page_url).toContain('utm_campaign=launch');
    });

    test('should sanitize sensitive query params', async ({ page }) => {
      await page.goto('/?auto-init=false&token=secret123&api_key=abc123&normal=value');

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

        return events;
      });

      const pageViewEvent = findEventByType(result, 'page_view');
      assertEventStructure(pageViewEvent, 'page_view');
      expect(pageViewEvent.page_url).not.toContain('secret123');
      expect(pageViewEvent.page_url).not.toContain('abc123');
      expect(pageViewEvent.page_url).toContain('normal=value');
    });
  });

  test.describe('SPA Navigation', () => {
    test('should detect SPA navigation (pushState)', async ({ page }) => {
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

        // Wait longer than throttle time (1000ms) before triggering navigation
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Trigger pushState navigation
        window.history.pushState({}, '', '/new-page');

        // Wait for page view event
        await new Promise((resolve) => setTimeout(resolve, 300));

        return events;
      });

      const pageViewEvents = findEventsByType(result, 'page_view');

      expect(pageViewEvents.length).toBeGreaterThanOrEqual(2);

      const newPageView = pageViewEvents.find((e) => e.page_url?.includes('/new-page'));
      expect(newPageView).toBeDefined();
      expect(newPageView!.from_page_url).toBeDefined();
    });

    test('should detect SPA navigation (replaceState)', async ({ page }) => {
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

        // Wait longer than throttle time (1000ms) before triggering navigation
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Trigger replaceState navigation
        window.history.replaceState({}, '', '/replaced-page');

        // Wait for page view event
        await new Promise((resolve) => setTimeout(resolve, 300));

        return events;
      });

      const pageViewEvents = findEventsByType(result, 'page_view');

      expect(pageViewEvents.length).toBeGreaterThanOrEqual(2);

      const replacedPageView = pageViewEvents.find((e) => e.page_url?.includes('/replaced-page'));
      expect(replacedPageView).toBeDefined();
    });

    test('should detect hash changes', async ({ page }) => {
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

        // Wait longer than throttle time (1000ms) before triggering navigation
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Trigger hash change
        window.location.hash = '#section1';

        // Wait for page view event
        await new Promise((resolve) => setTimeout(resolve, 300));

        return events;
      });

      const pageViewEvents = findEventsByType(result, 'page_view');

      expect(pageViewEvents.length).toBeGreaterThanOrEqual(2);

      const hashPageView = pageViewEvents.find((e) => e.page_url?.includes('#section1'));
      expect(hashPageView).toBeDefined();
    });
  });
});
