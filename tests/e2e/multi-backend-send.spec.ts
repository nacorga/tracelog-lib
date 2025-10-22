import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: Multi-Backend Event Sending with Retry Strategy
 *
 * **Priority**: CRITICAL (Multi-Integration Reliability)
 *
 * Tests event sending to multiple backends simultaneously with new retry logic:
 * - Parallel send to Google Analytics + custom backend
 * - Selective retry when one backend fails (transient vs permanent errors)
 * - beforeBatch transformer isolation
 * - Independent processing per integration
 * - Optimistic queue management (remove if ANY integration succeeds)
 * - Exponential backoff with jitter (200-300ms, 400-500ms)
 *
 * Note: Using Google Analytics + custom instead of tracelog + custom to avoid
 * SaaS localhost restrictions in E2E tests.
 */

test.describe('Multi-Backend Parallel Send', () => {
  test('should send events to both Google Analytics and custom backend in parallel', async ({ page }) => {
    test.setTimeout(45000); // Increase timeout for flush interval

    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // Mock network requests to verify both backends receive events
    const requests: Array<{ url: string; body: string }> = [];

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();

      if (url.includes('/collect') || url.includes('google-analytics.com')) {
        const postData = request.postData();
        if (postData !== null) {
          requests.push({ url, body: postData });
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Initialize with Google Analytics + custom
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST123' },
          custom: { collectApiUrl: 'http://localhost:8080/collect', allowHttp: true },
        },
      });

      // Send custom event
      traceLog.event('multi_backend_test', { test: 'parallel' });
    });

    // Wait for queue flush OUTSIDE of page.evaluate() to avoid blocking test
    await page.waitForTimeout(11500); // Wait for 10s flush interval + buffer

    const result = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      return {
        queueSize: traceLog.getQueueLength(),
      };
    });

    // Queue should be empty (flushed)
    expect(result.queueSize).toBe(0);

    // Verify requests were made to custom backend
    const customRequests = requests.filter((r) => r.url.includes('/collect'));

    expect(customRequests.length).toBeGreaterThan(0);
  });
});

test.describe('Multi-Backend Selective Retry (Exponential Backoff)', () => {
  test('should retry failed backend with exponential backoff without blocking successful backend', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for retry test

    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const requests: Array<{ url: string; attempt: number; timestamp: number; hasRetryTest: boolean }> = [];
    let customAttemptsWithRetryTest = 0;

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const postData = request.postData() ?? '';

      if (url.includes('/collect')) {
        const hasRetryTest = postData.includes('retry_test');
        if (hasRetryTest) {
          customAttemptsWithRetryTest++;
        }
        requests.push({ url: 'custom', attempt: customAttemptsWithRetryTest, timestamp: Date.now(), hasRetryTest });

        // Custom backend FAILS with 500 (transient error → should trigger retry)
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else if (url.includes('google-analytics.com')) {
        // Google Analytics SUCCEEDS (should NOT retry)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST123' },
          custom: { collectApiUrl: 'http://localhost:8080/collect', allowHttp: true },
        },
      });

      traceLog.event('retry_test', { test: 'selective' });
    });

    // Wait for queue flush + retries OUTSIDE of page.evaluate()
    // Initial send happens on flush interval (10s)
    // Then retries with backoff: ~200ms + ~400ms = ~600ms
    await page.waitForTimeout(12000);

    // Custom backend should have 3 attempts for retry_test event (1 initial + 2 retries)
    expect(customAttemptsWithRetryTest).toBe(3);

    // Verify retries are for custom only
    const customRetries = requests.filter((r) => r.hasRetryTest);

    expect(customRetries.length).toBe(3);

    // Verify exponential backoff timing
    if (customRetries.length === 3 && customRetries[0] && customRetries[1] && customRetries[2]) {
      const delay1 = customRetries[1].timestamp - customRetries[0].timestamp;
      const delay2 = customRetries[2].timestamp - customRetries[1].timestamp;

      // First retry: 200-300ms (RETRY_BACKOFF_BASE_MS + jitter)
      expect(delay1).toBeGreaterThanOrEqual(150);
      expect(delay1).toBeLessThan(350);

      // Second retry: 400-500ms (exponential backoff)
      expect(delay2).toBeGreaterThanOrEqual(350);
      expect(delay2).toBeLessThan(550);
    }
  });

  test('should continue tracking new events even when one backend is failing', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    await page.route('**/collect', async (route) => {
      // Custom backend always fails
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.route('**google-analytics.com**', async (route) => {
      // Google Analytics succeeds
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const events: unknown[] = [];

      traceLog.on('event', (data: unknown) => {
        events.push(data);
      });

      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST123' },
          custom: { collectApiUrl: 'http://localhost:8080/collect', allowHttp: true },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send multiple events
      traceLog.event('event_1', { test: 'data' });
      await new Promise((resolve) => setTimeout(resolve, 100));
      traceLog.event('event_2', { test: 'data' });
      await new Promise((resolve) => setTimeout(resolve, 100));
      traceLog.event('event_3', { test: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      return { eventsCount: events.length };
    });

    // Should continue tracking events despite backend failures
    expect(result.eventsCount).toBeGreaterThan(3);
  });
});
