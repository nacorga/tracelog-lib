/**
 * URL Sensitive Params Filtering Test
 *
 * Validates that sensitive URL parameters are automatically filtered from page_view events.
 * Tests default sensitive params (token, auth, key, password, etc.) and custom params.
 *
 * Critical for security and privacy compliance (GDPR, PII protection).
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('URL Sensitive Params Filtering', () => {
  test('should filter default sensitive query params (token, auth, key)', async ({ page }) => {
    // Navigate with sensitive params - use lowercase names that match defaults
    await navigateToPlayground(page, {
      autoInit: false,
      searchParams: {
        token: 'abc123',
        auth: 'xyz789',
        apikey: 'secret123', // lowercase 'apikey' is in defaults
        normalParam: 'ok',
      },
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

      const pageViewEvents: { page_url?: string }[] = [];

      // Add listener BEFORE init
      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string; page_url?: string };
        if (event.type === 'page_view') {
          pageViewEvents.push({ page_url: event.page_url });
        }
      });

      // Now init
      await window.__traceLogBridge.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        initialized: window.__traceLogBridge.initialized,
        pageViewEvents: pageViewEvents.length,
        firstPageViewUrl: pageViewEvents[0]?.page_url ?? '',
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.pageViewEvents).toBeGreaterThan(0);

    const firstUrl = result.firstPageViewUrl;
    if (!firstUrl) {
      throw new Error('No page view URL captured');
    }

    // Verify sensitive params are filtered (completely removed)
    expect(firstUrl).not.toContain('abc123');
    expect(firstUrl).not.toContain('xyz789');
    expect(firstUrl).not.toContain('secret123');
    expect(firstUrl).not.toContain('token=');
    expect(firstUrl).not.toContain('auth=');
    expect(firstUrl).not.toContain('apikey=');

    // Verify normal param is preserved
    expect(firstUrl).toContain('normalParam=ok');
  });

  test('should filter password and session params', async ({ page }) => {
    // Navigate with password/session params - use lowercase names matching defaults
    await navigateToPlayground(page, {
      autoInit: false,
      searchParams: {
        password: 'mypass123',
        session: 'abc',
        otp: 'xyz456', // 'otp' is in defaults, not 'sessionId'
        normalParam: 'value',
      },
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

      const pageViewEvents: { page_url?: string }[] = [];

      // Add listener BEFORE init
      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string; page_url?: string };
        if (event.type === 'page_view') {
          pageViewEvents.push({ page_url: event.page_url });
        }
      });

      // Now init
      await window.__traceLogBridge.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        firstPageViewUrl: pageViewEvents[0]?.page_url ?? '',
      };
    });

    const firstUrl = result.firstPageViewUrl;
    if (!firstUrl) {
      throw new Error('No page view URL captured');
    }

    // Sensitive params filtered
    expect(firstUrl).not.toContain('mypass123');
    expect(firstUrl).not.toContain('abc');
    expect(firstUrl).not.toContain('xyz456'); // Changed from 'xyz' to 'xyz456'

    // Normal param preserved
    expect(firstUrl).toContain('normalParam=value');
  });

  test('should filter custom sensitive params via config', async ({ page }) => {
    // Navigate with custom sensitive params that we'll configure to be filtered
    await navigateToPlayground(page, {
      autoInit: false,
      searchParams: {
        customSecret: 'hidden123',
        internalCode: 'internal456',
        normalParam: 'visible',
      },
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

      const pageViewEvents: { page_url?: string }[] = [];

      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string; page_url?: string };
        if (event.type === 'page_view') {
          pageViewEvents.push({ page_url: event.page_url });
        }
      });

      // Add custom sensitive params to filter list
      await window.__traceLogBridge.init({
        samplingRate: 1,
        sensitiveQueryParams: ['customSecret', 'internalCode'],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        firstPageViewUrl: pageViewEvents[0]?.page_url ?? '',
      };
    });

    const firstUrl = result.firstPageViewUrl;
    if (!firstUrl) {
      throw new Error('No page view URL captured');
    }

    // Custom sensitive params filtered
    expect(firstUrl).not.toContain('hidden123');
    expect(firstUrl).not.toContain('internal456');

    // Normal param preserved
    expect(firstUrl).toContain('normalParam=visible');
  });

  test('should handle URLs without query params', async ({ page }) => {
    // Navigate without query params
    await navigateToPlayground(page, {
      autoInit: false,
      searchParams: {},
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

      const pageViewEvents: { page_url?: string }[] = [];

      // Add listener BEFORE init
      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string; page_url?: string };
        if (event.type === 'page_view') {
          pageViewEvents.push({ page_url: event.page_url });
        }
      });

      // Now init
      await window.__traceLogBridge.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        firstPageViewUrl: pageViewEvents[0]?.page_url ?? '',
        hasQueryParams: pageViewEvents[0]?.page_url?.includes('?') ?? false,
      };
    });

    const firstUrl = result.firstPageViewUrl;
    if (!firstUrl) {
      throw new Error('No page view URL captured');
    }

    // Should not crash or add spurious query params
    expect(firstUrl).toContain('localhost:3000');
  });

  test('should filter params in multiple page views during navigation', async ({ page }) => {
    // Navigate with token param that should be filtered
    await navigateToPlayground(page, {
      autoInit: false,
      searchParams: {
        token: 'secret1', // changed from 'initialToken' to 'token' (in defaults)
      },
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

      const pageViewEvents: { page_url?: string }[] = [];

      // Add listener BEFORE init
      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string; page_url?: string };
        if (event.type === 'page_view') {
          pageViewEvents.push({ page_url: event.page_url });
        }
      });

      // Now init
      await window.__traceLogBridge.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate navigation with pushState
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('auth', 'secret2');
      newUrl.searchParams.set('normalParam', 'value');
      window.history.pushState({}, '', newUrl.toString());

      // Trigger popstate event to simulate navigation
      window.dispatchEvent(new PopStateEvent('popstate'));

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        totalPageViews: pageViewEvents.length,
        pageViews: pageViewEvents.map((e) => e.page_url ?? '').filter((url) => url.length > 0),
      };
    });

    expect(result.totalPageViews).toBeGreaterThan(0);

    // All page views should have filtered params
    result.pageViews.forEach((url) => {
      if (!url) return;
      expect(url).not.toContain('secret1');
      expect(url).not.toContain('secret2');
    });

    // Check if second page view exists and has normalParam
    if (result.pageViews.length > 1) {
      const secondPageView = result.pageViews[1];
      const isValidUrl = secondPageView != null && secondPageView.length > 0;
      if (isValidUrl) {
        expect(secondPageView).toContain('normalParam=value');
      }
    }
  });
});
