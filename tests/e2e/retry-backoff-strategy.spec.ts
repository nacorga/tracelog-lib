import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: Retry Backoff Strategy & Error Classification
 *
 * **Priority**: CRITICAL (Reliability & Performance)
 *
 * Tests retry logic with exponential backoff and jitter:
 * - 5xx errors trigger up to 2 retries with backoff
 * - 4xx errors (permanent) do NOT trigger retries
 * - Timeout errors trigger retries
 * - Backoff delays increase exponentially (200-300ms, 400-500ms)
 * - Multiple integrations retry independently
 *
 * These tests ensure robust error handling and prevent thundering herd problems.
 */

test.describe('Retry Backoff Strategy', () => {
  test('should retry 5xx errors with exponential backoff (up to 2 retries)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const attempts: { attempt: number; timestamp: number }[] = [];
    let attemptCount = 0;

    await page.route('**/custom/collect', async (route) => {
      attemptCount++;
      const timestamp = Date.now();
      attempts.push({ attempt: attemptCount, timestamp });

      // Always return 503 Service Unavailable (transient error)
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('retry_backoff_test', { test: 'backoff' });

      // Wait for initial send + retries (with backoff delays)
      // Initial attempt + 2 retries with ~200-300ms and ~400-500ms delays = ~1000ms total
      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    // Should have attempted 3 times total: initial + 2 retries
    expect(attemptCount).toBe(3);

    // Verify backoff delays between attempts
    if (attempts.length >= 2 && attempts[0] && attempts[1]) {
      const delay1 = attempts[1].timestamp - attempts[0].timestamp;
      // First retry delay: 200-300ms (100ms * 2^1 + jitter 0-100ms)
      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay1).toBeLessThanOrEqual(400); // Allow some slack for execution time
    }

    if (attempts.length >= 3 && attempts[1] && attempts[2]) {
      const delay2 = attempts[2].timestamp - attempts[1].timestamp;
      // Second retry delay: 400-500ms (100ms * 2^2 + jitter 0-100ms)
      expect(delay2).toBeGreaterThanOrEqual(400);
      expect(delay2).toBeLessThanOrEqual(700); // Allow some slack for execution time
    }
  });

  test('should NOT retry 4xx errors (permanent errors)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    let attemptCount = 0;

    await page.route('**/custom/collect', async (route) => {
      attemptCount++;

      // Return 400 Bad Request (permanent error)
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Bad Request' }),
      });
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('permanent_error_test', { test: '4xx' });

      // Wait for initial send + potential retries
      await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    // Should have attempted only 1 time (no retries for 4xx)
    expect(attemptCount).toBe(1);
  });

  test('should retry 408 Request Timeout (transient error)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    let attemptCount = 0;

    await page.route('**/custom/collect', async (route) => {
      attemptCount++;

      // Return 408 Request Timeout (transient, should retry)
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request Timeout' }),
      });
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('timeout_error_test', { test: '408' });

      // Wait for initial send + retries
      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    // Should have attempted 3 times: initial + 2 retries
    expect(attemptCount).toBe(3);
  });

  test('should retry 429 Too Many Requests (transient error)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    let attemptCount = 0;

    await page.route('**/custom/collect', async (route) => {
      attemptCount++;

      // Return 429 Too Many Requests (transient, should retry)
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests' }),
      });
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('rate_limit_test', { test: '429' });

      // Wait for initial send + retries
      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    // Should have attempted 3 times: initial + 2 retries
    expect(attemptCount).toBe(3);
  });

  test('should succeed on second retry attempt', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    let attemptCount = 0;

    await page.route('**/custom/collect', async (route) => {
      attemptCount++;

      if (attemptCount < 3) {
        // Fail first 2 attempts
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        // Succeed on 3rd attempt
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const queues: any[] = [];

      traceLog.on('queue', (data: unknown) => {
        queues.push(data);
      });

      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('retry_success_test', { test: 'eventual_success' });

      // Wait for initial send + retries
      await new Promise((resolve) => setTimeout(resolve, 15000));

      return { queuesEmitted: queues.length };
    });

    // Should have attempted 3 times total
    expect(attemptCount).toBe(3);

    // Should have emitted queue event after success
    expect(result.queuesEmitted).toBeGreaterThan(0);
  });
});

test.describe('Multi-Integration Independent Retries', () => {
  test('should retry each integration independently', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    let customAttempts = 0;
    let tracelogAttempts = 0;

    await page.route('**/custom/collect', async (route) => {
      customAttempts++;

      // Custom always fails (should trigger retries)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.route('**/api/collect', async (route) => {
      tracelogAttempts++;

      if (tracelogAttempts < 2) {
        // Tracelog fails first attempt
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        // Tracelog succeeds on second attempt
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          tracelog: { projectId: 'test-project' },
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('independent_retry_test', { test: 'multi' });

      // Wait for initial send + retries
      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    // Custom should have 3 attempts (failed all)
    expect(customAttempts).toBe(3);

    // Tracelog should have 2 attempts (succeeded on 2nd)
    expect(tracelogAttempts).toBe(2);
  });

  test('should persist failed events per-integration after retries exhausted', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    await page.route('**/custom/collect', async (route) => {
      // Always fail
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.route('**/api/collect', async (route) => {
      // Always succeed
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        integrations: {
          tracelog: { projectId: 'test-project' },
          custom: { collectApiUrl: 'http://localhost:8080/custom/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.event('persistence_test', { test: 'per_integration' });

      // Wait for retries to complete
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Check localStorage for persisted events
      const sessionData = traceLog.getSessionData();
      const userId = sessionData?.userId || 'anonymous';
      const customKey = `tlog:${userId}:queue:custom`;
      const saasKey = `tlog:${userId}:queue:saas`;

      const customPersisted = localStorage.getItem(customKey);
      const saasPersisted = localStorage.getItem(saasKey);

      return {
        hasCustomPersisted: customPersisted !== null,
        hasSaasPersisted: saasPersisted !== null,
        customData: customPersisted ? JSON.parse(customPersisted) : null,
      };
    });

    // Custom backend should have persisted events (failed)
    expect(result.hasCustomPersisted).toBe(true);

    // SaaS backend should NOT have persisted events (succeeded)
    expect(result.hasSaasPersisted).toBe(false);

    // Verify persisted data structure
    if (result.customData) {
      expect(result.customData.events).toBeDefined();
      expect(Array.isArray(result.customData.events)).toBe(true);
      expect(result.customData.timestamp).toBeDefined();
    }
  });
});
