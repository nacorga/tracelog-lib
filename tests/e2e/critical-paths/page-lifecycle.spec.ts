/**
 * E2E: Page Lifecycle Listeners
 *
 * Focus: Real-engine validation of the page-lifecycle features in tracelog-lib v2.9+:
 *   - Auto-flush on SPA navigation (pushState / replaceState / popstate / hashchange)
 *   - Auto-flush on visibilitychange when document.hidden becomes true
 *   - recoverPersistedEvents on bfcache restore (pageshow.persisted === true)
 *   - critical event option (sendBeacon transport)
 *
 * **Approach**: monkey-patch `EventManager` methods on the live instance to count
 * invocations from the actual listener wiring. Production code is never modified.
 *
 * **bfcache caveat**: real bfcache restoration cannot be reliably triggered in
 * automated browsers (Playwright disables it implicitly via lifecycle listeners
 * and route interception). We validate the listener wiring by dispatching a
 * synthetic `PageTransitionEvent` with `persisted: true`. The native-engine
 * path is left to manual QA on a physical iOS device.
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Page Lifecycle Listeners', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('visibilitychange flush', () => {
    // The visibilitychange handler uses `flushImmediatelySync` (sendBeacon)
    // rather than `flushImmediately` (async fetch) because mobile Safari can
    // abort an in-flight fetch when it backgrounds the tab. See commit 2dc147b.
    test('flushes when document.hidden becomes true (default config)', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
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
          flushImmediatelySync: () => boolean;
        };
        let count = 0;
        em.flushImmediatelySync = (): boolean => {
          count++;
          return true;
        };

        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));

        await new Promise((resolve) => setTimeout(resolve, 50));

        return count;
      });

      expect(callCount).toBe(1);
    });

    test('does NOT flush when document.hidden is false', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
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
          flushImmediatelySync: () => boolean;
        };
        let count = 0;
        em.flushImmediatelySync = (): boolean => {
          count++;
          return true;
        };

        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
        document.dispatchEvent(new Event('visibilitychange'));

        await new Promise((resolve) => setTimeout(resolve, 50));

        return count;
      });

      expect(callCount).toBe(0);
    });

    test('does NOT flush when flushOnPageHidden=false', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
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
          flushImmediatelySync: () => boolean;
        };
        let count = 0;
        em.flushImmediatelySync = (): boolean => {
          count++;
          return true;
        };

        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));

        await new Promise((resolve) => setTimeout(resolve, 50));

        return count;
      });

      expect(callCount).toBe(0);
    });
  });

  test.describe('SPA navigation flush', () => {
    test('flushes on pushState to a new URL (default config)', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init({ pageViewThrottleMs: 0 });

        const em = window.__traceLogBridge.getEventManager() as unknown as {
          flushImmediately: () => Promise<boolean>;
        };
        let count = 0;
        em.flushImmediately = async (): Promise<boolean> => {
          count++;
          await Promise.resolve();
          return true;
        };

        history.pushState({}, '', '/?spa=1');

        await new Promise((resolve) => setTimeout(resolve, 100));

        return count;
      });

      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    test('does NOT flush on SPA navigation when flushOnSpaNavigation=false', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
        let retries = 0;
        while (!window.__traceLogBridge && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!window.__traceLogBridge) {
          throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
        }

        window.__traceLogBridge.destroy(true);
        await window.__traceLogBridge.init({ pageViewThrottleMs: 0, flushOnSpaNavigation: false });

        const em = window.__traceLogBridge.getEventManager() as unknown as {
          flushImmediately: () => Promise<boolean>;
        };
        let count = 0;
        em.flushImmediately = async (): Promise<boolean> => {
          count++;
          await Promise.resolve();
          return true;
        };

        history.pushState({}, '', '/?spa=2');

        await new Promise((resolve) => setTimeout(resolve, 100));

        return count;
      });

      expect(callCount).toBe(0);
    });
  });

  test.describe('bfcache restore (pageshow)', () => {
    test('recovers persisted events when pageshow.persisted === true', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
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
          recoverPersistedEvents: () => Promise<void>;
        };
        let count = 0;
        em.recoverPersistedEvents = async (): Promise<void> => {
          count++;
          await Promise.resolve();
        };

        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

        await new Promise((resolve) => setTimeout(resolve, 50));

        return count;
      });

      expect(callCount).toBe(1);
    });

    test('does NOT recover when pageshow.persisted === false', async ({ page }) => {
      const callCount = await page.evaluate(async (): Promise<number> => {
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
          recoverPersistedEvents: () => Promise<void>;
        };
        let count = 0;
        em.recoverPersistedEvents = async (): Promise<void> => {
          count++;
          await Promise.resolve();
        };

        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));

        await new Promise((resolve) => setTimeout(resolve, 50));

        return count;
      });

      expect(callCount).toBe(0);
    });
  });

  test.describe('critical event option', () => {
    test('critical=true triggers dedicated sendBeacon + main-queue drain (double-write)', async ({ page }) => {
      const result = await page.evaluate(
        async (): Promise<{
          syncCount: number;
          asyncCount: number;
          dedicatedCount: number;
        }> => {
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
            flushLastEventSync: () => boolean;
          };
          let syncCount = 0;
          let asyncCount = 0;
          let dedicatedCount = 0;
          em.flushImmediatelySync = (): boolean => {
            syncCount++;
            return true;
          };
          em.flushImmediately = async (): Promise<boolean> => {
            asyncCount++;
            await Promise.resolve();
            return true;
          };
          em.flushLastEventSync = (): boolean => {
            dedicatedCount++;
            return true;
          };

          window.__traceLogBridge.event('purchase_completed', { revenue: 100 }, { critical: true });

          await new Promise((resolve) => setTimeout(resolve, 50));

          return { syncCount, asyncCount, dedicatedCount };
        },
      );

      // New contract: critical=true sends a single-event sendBeacon for the
      // just-tracked event AND drains the main queue. The dedicated beacon
      // guarantees delivery even if the main batch exceeds 64KB; the queue
      // drain catches any deferred sync flush from a concurrent async send.
      expect(result.dedicatedCount).toBe(1);
      expect(result.syncCount).toBe(1);
      expect(result.asyncCount).toBe(0);
    });

    test('critical=undefined does NOT trigger any immediate flush', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<{ syncCount: number; asyncCount: number }> => {
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

        window.__traceLogBridge.event('regular_event', { foo: 'bar' });

        await new Promise((resolve) => setTimeout(resolve, 50));

        return { syncCount, asyncCount };
      });

      expect(result.syncCount).toBe(0);
      expect(result.asyncCount).toBe(0);
    });

    test('critical=false does NOT trigger any immediate flush', async ({ page }) => {
      const result = await page.evaluate(async (): Promise<{ syncCount: number; asyncCount: number }> => {
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

        window.__traceLogBridge.event('regular_event', { foo: 'bar' }, { critical: false });

        await new Promise((resolve) => setTimeout(resolve, 50));

        return { syncCount, asyncCount };
      });

      expect(result.syncCount).toBe(0);
      expect(result.asyncCount).toBe(0);
    });
  });
});
