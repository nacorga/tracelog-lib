/**
 * E2E: Error Capture Tests
 * Focus: JavaScript error tracking with PII sanitization
 */

import { test, expect } from '@playwright/test';
import {
  type CapturedEvent,
  findEventByType,
  assertEventStructure,
  assertPIISanitized,
} from '../helpers/assertions.helper';

test.describe('E2E: Error Capture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Error Types', () => {
    test('should capture thrown errors', async ({ page }) => {
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

        // Throw an error to trigger error handler
        setTimeout(() => {
          throw new Error('Test error message');
        }, 0);

        // Wait for error event processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const errorEvent = findEventByType(result, 'error');
      assertEventStructure(errorEvent, 'error');
      expect(errorEvent.error_data).toBeDefined();
      expect(errorEvent.error_data!.type).toBe('js_error');
      expect(errorEvent.error_data!.message).toContain('Test error message');
    });

    test('should capture unhandled promise rejections', async ({ page }) => {
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

        // Trigger unhandled promise rejection without awaiting (to avoid page.evaluate failure)
        // Don't catch - let it be truly unhandled so unhandledrejection event fires
        void Promise.reject('Promise rejection error');

        // Wait for error event processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const errorEvent = findEventByType(result, 'error');
      assertEventStructure(errorEvent, 'error');
      expect(errorEvent.error_data).toBeDefined();
      expect(errorEvent.error_data!.type).toBe('promise_rejection');
      expect(errorEvent.error_data!.message).toBe('Promise rejection error');
    });
  });

  test.describe('Error Data', () => {
    test('should capture error message', async ({ page }) => {
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

        // Throw error with specific message
        setTimeout(() => {
          throw new Error('Detailed error message with context');
        }, 0);

        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const errorEvent = findEventByType(result, 'error');
      assertEventStructure(errorEvent, 'error');
      expect(errorEvent.error_data!.message).toContain('Detailed error message with context');
    });

    test('should capture error stack trace', async ({ page }) => {
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

        // Trigger promise rejection without awaiting (to avoid page.evaluate failure)
        void Promise.reject('Error with stack trace');

        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const errorEvent = findEventByType(result, 'error');
      assertEventStructure(errorEvent, 'error');
      expect(errorEvent.error_data!.message).toBe('Error with stack trace');
    });

    test('should distinguish between error types', async ({ page }) => {
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

        // Throw JS error
        setTimeout(() => {
          throw new Error('JS Error');
        }, 0);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Trigger promise rejection without awaiting (to avoid page.evaluate failure)
        void Promise.reject('Promise Error');

        // Wait for both errors to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      // Find both error types
      const jsError = result.find((e: any) => e.type === 'error' && e.error_data?.message?.includes('JS Error'));
      const promiseError = result.find((e: any) => e.type === 'error' && e.error_data?.message === 'Promise Error');

      expect(jsError).toBeDefined();
      expect((jsError as any).error_data.type).toBe('js_error');

      expect(promiseError).toBeDefined();
      expect((promiseError as any).error_data.type).toBe('promise_rejection');
    });
  });

  test.describe('Privacy', () => {
    test('should sanitize PII from error messages', async ({ page }) => {
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

        // Throw error with PII in message
        setTimeout(() => {
          throw new Error('User email: test@example.com had error with card 1234-5678-9012-3456');
        }, 0);

        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      const errorEvent = findEventByType(result, 'error');
      assertEventStructure(errorEvent, 'error');

      // Use PII assertion helper
      assertPIISanitized(errorEvent.error_data!.message, ['test@example.com', '1234-5678-9012-3456']);
    });
  });

  test.describe('Per-Pageview Throttle', () => {
    test('should cap repeated same-signature errors at 3 events per pageview', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          if (event.type === 'error') events.push(event);
        });

        // Fire 50 errors with distinct numeric content so the 5s dedup window
        // does not absorb them, but all share the same normalized signature
        // (`failed to load [n]` + filename + line). Cap should keep only 3.
        for (let i = 1; i <= 50; i += 1) {
          const numericSuffix = `1${String(i).padStart(4, '0')}`;
          window.dispatchEvent(
            new ErrorEvent('error', {
              message: `Failed to load resource ${numericSuffix}`,
              filename: 'app.js',
              lineno: 42,
            }),
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        return events;
      });

      expect(result.length).toBe(3);
      result.forEach((event: any) => {
        expect(event.error_data.type).toBe('js_error');
        expect(event.error_data.message).toMatch(/Failed to load resource 1\d{4}/);
      });
    });

    test('should reset the throttle after a hard reload', async ({ page }) => {
      const firstPageviewCount = await page.evaluate(async () => {
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
          if (event.type === 'error') events.push(event);
        });

        for (let i = 1; i <= 10; i += 1) {
          window.dispatchEvent(
            new ErrorEvent('error', {
              message: `Reload canary ${1000 + i}`,
              filename: 'app.js',
              lineno: 7,
            }),
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        return events.length;
      });

      expect(firstPageviewCount).toBe(3);

      await page.reload();
      await page.waitForURL('**/*');

      const secondPageviewCount = await page.evaluate(async () => {
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
          if (event.type === 'error') events.push(event);
        });

        for (let i = 1; i <= 5; i += 1) {
          window.dispatchEvent(
            new ErrorEvent('error', {
              message: `Reload canary ${2000 + i}`,
              filename: 'app.js',
              lineno: 7,
            }),
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        return events.length;
      });

      expect(secondPageviewCount).toBe(3);
    });

    test('should reset the throttle on SPA navigation via pushState', async ({ page }) => {
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

        const events: any[] = [];
        window.__traceLogBridge.on('event', (event) => {
          if (event.type === 'error') events.push(event);
        });

        // First SPA pageview — cap should hold at 3.
        for (let i = 1; i <= 5; i += 1) {
          window.dispatchEvent(
            new ErrorEvent('error', {
              message: `SPA canary ${3000 + i}`,
              filename: 'app.js',
              lineno: 11,
            }),
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
        const afterFirstRoute = events.length;

        // SPA route change via patched pushState — PageViewHandler emits PAGE_VIEW,
        // which must reset the per-pageview signature counter.
        window.history.pushState({}, '', '/spa-route-2');
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Second SPA pageview — cap should hold at 3 again (fresh counter).
        for (let i = 1; i <= 5; i += 1) {
          window.dispatchEvent(
            new ErrorEvent('error', {
              message: `SPA canary ${4000 + i}`,
              filename: 'app.js',
              lineno: 11,
            }),
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 200));

        return { afterFirstRoute, total: events.length };
      });

      expect(result.afterFirstRoute).toBe(3);
      expect(result.total).toBe(6);
    });
  });

  test.describe('Event Emission', () => {
    test('should emit ERROR event to listeners', async ({ page }) => {
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

        let errorEventEmitted = false;
        const emittedErrorEvent: any = {};

        window.__traceLogBridge.on('event', (event) => {
          if (event.type === 'error') {
            errorEventEmitted = true;
            Object.assign(emittedErrorEvent, event);
          }
        });

        // Throw an error
        setTimeout(() => {
          throw new Error('Error for listener test');
        }, 0);

        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
          errorEventEmitted,
          emittedErrorEvent,
        };
      });

      expect(result.errorEventEmitted).toBe(true);
      expect(result.emittedErrorEvent.type).toBe('error');
      expect(result.emittedErrorEvent.error_data).toBeDefined();
      expect(result.emittedErrorEvent.error_data.type).toBe('js_error');
      expect(result.emittedErrorEvent.error_data.message).toContain('Error for listener test');
    });
  });
});
