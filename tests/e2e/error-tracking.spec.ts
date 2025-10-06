/**
 * Error Tracking Test
 *
 * Tests ErrorHandler functionality to detect library defects:
 * - JS errors and promise rejections are captured
 * - PII sanitization works correctly
 * - Error sampling respects configured rate
 * - Duplicate errors are suppressed within time window
 *
 * Focus: Detect defects in error tracking, NOT test configuration issues
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Error Tracking', () => {
  test('should capture JavaScript errors', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1, // Capture all errors for testing
      });

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger JavaScript error
      try {
        // @ts-expect-error - Intentional error for testing
        window.nonExistentFunction();
      } catch {
        // Error will be caught by error handler
        window.dispatchEvent(
          new ErrorEvent('error', {
            message: 'nonExistentFunction is not defined',
            filename: 'test.js',
            lineno: 42,
            colno: 10,
          }),
        );
      }

      // Wait for error event to be processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.destroy();

      return { events, capturedCount: events.length };
    });

    // Verify error was captured
    expect(result.capturedCount).toBeGreaterThan(0);
    expect(result.events[0].type).toBe('error');
    expect(result.events[0].error_data.type).toBe('js_error');
    expect(result.events[0].error_data.message).toContain('nonExistentFunction');
  });

  test('should capture unhandled promise rejections', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger unhandled promise rejection
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: Promise.reject('Test rejection'),
          reason: 'Test rejection',
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.destroy();

      return { events, capturedCount: events.length };
    });

    expect(result.capturedCount).toBeGreaterThan(0);
    expect(result.events[0].type).toBe('error');
    expect(result.events[0].error_data.type).toBe('promise_rejection');
    expect(result.events[0].error_data.message).toContain('Test rejection');
  });

  test('should sanitize PII from error messages', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger error with PII (email)
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'User test@example.com authentication failed',
          filename: 'auth.js',
          lineno: 100,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger error with PII (token)
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'API token sk_test_abc123xyz456 is invalid',
          filename: 'api.js',
          lineno: 50,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger error with PII (credit card)
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Payment failed for card 4532-1234-5678-9010',
          filename: 'payment.js',
          lineno: 75,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.destroy();

      return { events };
    });

    expect(result.events.length).toBeGreaterThanOrEqual(3);

    // Verify email is sanitized
    const emailError = result.events.find((e) => e.error_data.filename === 'auth.js');
    expect(emailError).toBeDefined();
    expect(emailError.error_data.message).toContain('[REDACTED]');
    expect(emailError.error_data.message).not.toContain('test@example.com');

    // Verify token is sanitized
    const tokenError = result.events.find((e) => e.error_data.filename === 'api.js');
    expect(tokenError).toBeDefined();
    expect(tokenError.error_data.message).toContain('[REDACTED]');
    expect(tokenError.error_data.message).not.toContain('sk_test_abc123xyz456');

    // Verify credit card is sanitized
    const cardError = result.events.find((e) => e.error_data.filename === 'payment.js');
    expect(cardError).toBeDefined();
    expect(cardError.error_data.message).toContain('[REDACTED]');
    expect(cardError.error_data.message).not.toContain('4532-1234-5678-9010');
  });

  test('should respect error sampling rate', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // Test 1: errorSampling = 0 should capture NO errors
    const result1 = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 0, // 0% - should capture NOTHING
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger 10 errors
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(
          new ErrorEvent('error', {
            message: `Test error ${i}`,
            filename: 'test.js',
            lineno: i,
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      await traceLog.destroy();

      return { capturedCount: events.length };
    });

    // With errorSampling = 0, should capture 0 errors
    expect(result1.capturedCount).toBe(0);

    // Test 2: errorSampling = 1 should capture ALL errors
    const result2 = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1, // 100% - should capture ALL
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger 10 errors
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(
          new ErrorEvent('error', {
            message: `Test error batch2 ${i}`,
            filename: 'test2.js',
            lineno: i,
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      await traceLog.destroy();

      return { capturedCount: events.length };
    });

    // With errorSampling = 1, should capture all 10 errors
    expect(result2.capturedCount).toBe(10);
  });

  test('should suppress duplicate errors within time window', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger same error 3 times rapidly
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(
          new ErrorEvent('error', {
            message: 'Duplicate error message',
            filename: 'test.js',
            lineno: 100,
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Wait for suppression window to pass (5s default)
      await new Promise((resolve) => setTimeout(resolve, 5500));

      // Trigger same error again (should be captured)
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Duplicate error message',
          filename: 'test.js',
          lineno: 100,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.destroy();

      return { events, capturedCount: events.length };
    });

    // Should capture 2 errors: 1 from first batch, 1 after suppression window
    expect(result.capturedCount).toBe(2);
    expect(result.events[0].error_data.message).toBe('Duplicate error message');
    expect(result.events[1].error_data.message).toBe('Duplicate error message');
  });

  test('should handle very long error messages', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'error') {
          events.push(payload);
        }
      });

      await traceLog.init({
        errorSampling: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger error with very long message (> MAX_ERROR_MESSAGE_LENGTH)
      const longMessage = 'Error: '.repeat(500); // ~3000 characters
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: longMessage,
          filename: 'test.js',
          lineno: 1,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.destroy();

      return { events, messageLength: events[0]?.error_data?.message?.length || 0 };
    });

    // Should truncate to MAX_ERROR_MESSAGE_LENGTH (likely 1000 or 2000)
    expect(result.messageLength).toBeLessThan(3000);
    expect(result.messageLength).toBeGreaterThan(0);
    expect(result.events[0].error_data.message).toContain('...');
  });
});
