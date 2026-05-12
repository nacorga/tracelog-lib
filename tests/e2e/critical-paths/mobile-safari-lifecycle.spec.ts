/**
 * E2E: Mobile Safari lifecycle quirks
 *
 * iOS Safari notoriously fails to fire `pagehide`/`beforeunload` when the OS
 * backgrounds or suspends the tab. The library covers this via the
 * `visibilitychange` → `document.hidden=true` flush path, gated by
 * `flushOnPageHidden` (default `true`). These tests reproduce the iOS-only
 * failure mode and validate that the visibility path delivers events even
 * when the unload events never arrive.
 *
 * Runs under the `Mobile Safari` Playwright project (iPhone 12 device emulation,
 * local-only — excluded from CI to avoid webkit dependency churn there).
 */
import { test, expect } from '@playwright/test';

test.describe('E2E: Mobile Safari visibility-only flush', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Gate to the `Mobile Safari` Playwright project only. The visibility-only
    // failure mode this file reproduces is iOS-specific; running on chromium /
    // Mobile Chrome / firefox / webkit would either pass trivially or fail for
    // unrelated browser reasons (the lifecycle event ordering is not the same).
    test.skip(testInfo.project.name !== 'Mobile Safari', 'iOS Safari-specific lifecycle behavior');
    await page.goto('/?auto-init=false');
  });

  test('visibility=hidden flushes via sendBeacon when pagehide does NOT fire', async ({ page }) => {
    const counters = await page.evaluate(async (): Promise<{ syncCount: number; asyncCount: number }> => {
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

      const em = window.__traceLogBridge.getEventManager() as unknown as {
        flushImmediately: () => Promise<boolean>;
        flushImmediatelySync: () => boolean;
      };
      let syncCount = 0;
      let asyncCount = 0;
      em.flushImmediatelySync = (): boolean => {
        syncCount++;
        return true;
      };
      em.flushImmediately = async (): Promise<boolean> => {
        asyncCount++;
        await Promise.resolve();
        return true;
      };

      // Track an event then simulate iOS backgrounding: visibilitychange fires
      // with document.hidden=true but pagehide/beforeunload never do.
      window.__traceLogBridge.event('add_to_cart', { productId: 'abc-123' });

      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Yield so the listener runs.
      await new Promise((resolve) => setTimeout(resolve, 50));

      return { syncCount, asyncCount };
    });

    // Visibility path uses sendBeacon (sync) — guaranteed delivery even when
    // the OS would have aborted an in-flight fetch.
    expect(counters.syncCount).toBeGreaterThanOrEqual(1);
    expect(counters.asyncCount).toBe(0);
  });

  test('critical=true event survives the visibility-only path', async ({ page }) => {
    const counters = await page.evaluate(async (): Promise<{ syncCount: number; asyncCount: number }> => {
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

      const em = window.__traceLogBridge.getEventManager() as unknown as {
        flushImmediately: () => Promise<boolean>;
        flushImmediatelySync: () => boolean;
      };
      let syncCount = 0;
      let asyncCount = 0;
      em.flushImmediatelySync = (): boolean => {
        syncCount++;
        return true;
      };
      em.flushImmediately = async (): Promise<boolean> => {
        asyncCount++;
        await Promise.resolve();
        return true;
      };

      // Critical event right before iOS backgrounds the tab.
      window.__traceLogBridge.event('purchase_completed', { orderId: 'ord-1' }, { critical: true });

      // Now simulate the backgrounding — visibilitychange but no pagehide.
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      return { syncCount, asyncCount };
    });

    // `critical: true` fires sendBeacon synchronously inside `event()`. The
    // visibility listener fires another sendBeacon. Both contribute to syncCount.
    // No async fetch should run for either path.
    expect(counters.syncCount).toBeGreaterThanOrEqual(1);
    expect(counters.asyncCount).toBe(0);
  });

  test('flushOnPageHidden=false suppresses the visibility flush entirely', async ({ page }) => {
    const counters = await page.evaluate(async (): Promise<{ syncCount: number; asyncCount: number }> => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      window.__traceLogBridge.destroy(true);
      await window.__traceLogBridge.init({ flushOnPageHidden: false });

      const em = window.__traceLogBridge.getEventManager() as unknown as {
        flushImmediately: () => Promise<boolean>;
        flushImmediatelySync: () => boolean;
      };
      let syncCount = 0;
      let asyncCount = 0;
      em.flushImmediatelySync = (): boolean => {
        syncCount++;
        return true;
      };
      em.flushImmediately = async (): Promise<boolean> => {
        asyncCount++;
        await Promise.resolve();
        return true;
      };

      window.__traceLogBridge.event('add_to_cart', { productId: 'abc-123' });

      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      return { syncCount, asyncCount };
    });

    // Opt-out path: no automatic flush on backgrounding. Useful if a consumer
    // wants to control timing manually.
    expect(counters.syncCount).toBe(0);
    expect(counters.asyncCount).toBe(0);
  });
});
