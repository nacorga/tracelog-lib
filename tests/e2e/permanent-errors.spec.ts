import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

/**
 * Permanent Errors E2E Tests
 *
 * Focus: Basic integration validation that 4xx errors are not retried
 * Note: Detailed retry logic is covered by unit tests (sender-permanent-errors.test.ts)
 */
test.describe('Permanent Errors E2E', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });
  });

  test('should NOT retry on 403 Forbidden error', async ({ page }) => {
    const requests: Array<{ method: string; url: string; timestamp: number }> = [];

    // Intercept and mock 403 response
    await page.route('**/collect', async (route) => {
      requests.push({
        method: route.request().method(),
        url: route.request().url(),
        timestamp: Date.now(),
      });

      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      await window.__traceLogBridge.init({
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:8080/collect',
            allowHttp: true,
          },
        },
      });

      // Send custom event
      window.__traceLogBridge.sendCustomEvent('test_403', { value: 'test' });

      // Wait for initial send + potential retries (15s = 3x retry delay)
      await new Promise((resolve) => setTimeout(resolve, 15000));

      return {
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // Should only have 1 request (no retries for 403)
    expect(requests.length).toBe(1);
  });

  test('should NOT retry on 404 Not Found error', async ({ page }) => {
    const requests: Array<{ method: string; timestamp: number }> = [];

    await page.route('**/collect', async (route) => {
      requests.push({
        method: route.request().method(),
        timestamp: Date.now(),
      });

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' }),
      });
    });

    await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      await window.__traceLogBridge!.init({
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:8080/collect',
            allowHttp: true,
          },
        },
      });

      window.__traceLogBridge!.sendCustomEvent('test_404', { data: 'value' });

      // Wait for initial send + potential retries
      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    // Should only have 1 request (no retries for 404)
    expect(requests.length).toBe(1);
  });
});
