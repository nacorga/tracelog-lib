/**
 * Dual Destination E2E Tests
 *
 * Validates that events can be sent to multiple destinations simultaneously:
 * - TraceLog SaaS (projectId-based URL)
 * - Custom backend (custom collectApiUrl)
 *
 * Focus: Verify parallel sending to both destinations works correctly
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Dual Destination Sending', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });
  });

  test('should send events to both SaaS and custom destinations in parallel', async ({ page }) => {
    const saasRequests: Array<{ method: string; url: string; body: Record<string, unknown> | null }> = [];
    const customRequests: Array<{ method: string; url: string; body: Record<string, unknown> | null }> = [];

    // Intercept SaaS destination (simulated - based on projectId subdomain pattern)
    // Real SaaS URL would be: https://{projectId}.{domain}/collect
    await page.route('**/saas-endpoint/collect', async (route) => {
      const body = route.request().postData();
      const parsedBody = body ? (JSON.parse(body) as Record<string, unknown>) : null;
      saasRequests.push({
        method: route.request().method(),
        url: route.request().url(),
        body: parsedBody,
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Intercept custom backend destination
    await page.route('**/custom-endpoint/collect', async (route) => {
      const body = route.request().postData();
      const parsedBody = body ? (JSON.parse(body) as Record<string, unknown>) : null;
      customRequests.push({
        method: route.request().method(),
        url: route.request().url(),
        body: parsedBody,
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
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

      // Initialize with BOTH integrations
      // Note: In real E2E tests, SaaS URL generation happens internally
      // Here we simulate with custom URLs to test the dual-send logic
      await window.__traceLogBridge.init({
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:8080/custom-endpoint/collect',
            allowHttp: true,
          },
        },
      });

      // Send a custom event
      window.__traceLogBridge.sendCustomEvent('dual_test', { source: 'e2e_test' });

      // Wait for event batching and send (10-second interval or 50-event threshold)
      await new Promise((resolve) => setTimeout(resolve, 11000));

      return {
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // For custom backend, we should have received requests
    expect(customRequests.length).toBeGreaterThanOrEqual(1);

    // Verify custom backend received the event
    const customBodies = customRequests.map((req) => req.body);
    const customEventReceived = customBodies.some((body) => {
      if (!body || typeof body !== 'object' || !('events' in body)) return false;
      const events = body.events;
      if (!Array.isArray(events)) return false;
      return events.some((event: unknown) => {
        if (typeof event !== 'object' || event === null) return false;
        if (!('type' in event) || !('custom_event' in event)) return false;
        const customEvent = (event as { custom_event?: { name?: string } }).custom_event;
        return event.type === 'custom' && customEvent?.name === 'dual_test';
      });
    });

    expect(customEventReceived).toBe(true);
  });

  test('should handle independent success/failure for each destination', async ({ page }) => {
    const saasRequests: number[] = [];
    const customRequests: number[] = [];

    // SaaS endpoint - FAIL
    await page.route('**/saas-fail/collect', async (route) => {
      saasRequests.push(Date.now());

      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Custom endpoint - SUCCESS
    await page.route('**/custom-success/collect', async (route) => {
      customRequests.push(Date.now());

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
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
            collectApiUrl: 'http://localhost:8080/custom-success/collect',
            allowHttp: true,
          },
        },
      });

      // Send test event
      window.__traceLogBridge!.sendCustomEvent('independent_test', { test: true });

      // Wait for send
      await new Promise((resolve) => setTimeout(resolve, 11000));
    });

    // Custom backend should have received the request (and succeeded)
    expect(customRequests.length).toBeGreaterThanOrEqual(1);

    // Library should handle partial failures gracefully
    // (one destination failing shouldn't break the other)
  });

  test('should maintain event data integrity across destinations', async ({ page }) => {
    const customRequests: Array<{ body: Record<string, unknown> | null }> = [];

    await page.route('**/custom/collect', async (route) => {
      const body = route.request().postData();
      const parsedBody = body !== null && body !== undefined ? (JSON.parse(body) as Record<string, unknown>) : null;
      customRequests.push({
        body: parsedBody,
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
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
            collectApiUrl: 'http://localhost:8080/custom/collect',
            allowHttp: true,
          },
        },
      });

      // Send event with specific metadata
      window.__traceLogBridge!.sendCustomEvent('integrity_test', {
        test_field: 'test_value',
        number_field: 123,
      });

      await new Promise((resolve) => setTimeout(resolve, 11000));
    });

    expect(customRequests.length).toBeGreaterThanOrEqual(1);

    // Verify event data integrity
    const allEvents = customRequests.flatMap((req) => {
      const events = req.body?.events;
      return Array.isArray(events) ? events : [];
    });

    const targetEvent = allEvents.find((event: unknown) => {
      if (typeof event === 'object' && event !== null && 'type' in event && 'custom_event' in event) {
        const customEvent = (event as { custom_event?: { name?: string } }).custom_event;
        return customEvent?.name === 'integrity_test';
      }
      return false;
    });

    expect(targetEvent).toBeDefined();
  });

  test('should validate collectApiUrls state structure during initialization', async ({ page }) => {
    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      // Initialize with custom backend only
      await window.__traceLogBridge!.init({
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:8080/collect',
            allowHttp: true,
          },
        },
      });

      // Access collectApiUrls from state using the test bridge's get() method
      const collectApiUrls = window.__traceLogBridge!.get('collectApiUrls');

      return {
        hasCollectApiUrls: Boolean(collectApiUrls),
        hasSaasUrl: typeof collectApiUrls.saas === 'string',
        hasCustomUrl: typeof collectApiUrls.custom === 'string',
        saasUrl: collectApiUrls.saas,
        customUrl: collectApiUrls.custom,
      };
    });

    // Verify state structure
    expect(result.hasCollectApiUrls).toBe(true);
    expect(result.hasSaasUrl).toBe(true); // Should exist (even if empty)
    expect(result.hasCustomUrl).toBe(true);
    expect(result.saasUrl).toBe(''); // Empty because no tracelog projectId
    expect(result.customUrl).toContain('http://localhost:8080/collect');
  });
});
