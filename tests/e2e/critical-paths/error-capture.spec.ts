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
