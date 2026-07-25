/**
 * E2E: Web Vitals Consolidation
 *
 * Focus: the acceptance test that would have caught the source-censorship
 * bug — a FAST page (every vital in the "good" band) must still produce a
 * `WEB_VITALS` event under the library's DEFAULT config. Before this fix,
 * the default 'needs-improvement' filtering mode dropped every good
 * measurement client-side, so a fast page produced NONE — the server could
 * never distinguish a truncated sample from a complete one.
 *
 * Also verifies the wire shape the API/middleware were extended to accept:
 * `{ schema: 'consolidated', metrics: [{ type, value }, ...] }`, one event
 * per navigation rather than one event per metric.
 */
import { test, expect } from '@playwright/test';

interface CapturedWebVitalsEvent {
  type: string;
  web_vitals?: {
    schema?: string;
    metrics?: Array<{ type: string; value: number }>;
  };
}

test.describe('E2E: Web Vitals Consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test('a fast page (all vitals good) produces a consolidated WEB_VITALS event under the default config', async ({
    page,
  }) => {
    const webVitalsEvents = await page.evaluate(async (): Promise<CapturedWebVitalsEvent[]> => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      window.__traceLogBridge.destroy(true);
      // No `webVitalsMode` override: this exercises the library's actual
      // DEFAULT config, exactly as a real merchant snippet would run it.
      await window.__traceLogBridge.init();

      const events: CapturedWebVitalsEvent[] = [];
      window.__traceLogBridge.on('event', (event) => {
        events.push(event as CapturedWebVitalsEvent);
      });

      // Let TTFB/FCP finalize naturally — both fire early, well before any
      // page-hide transition, on a fast local page.
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force LCP/CLS/INP finalization and the consolidated-buffer flush,
      // mirroring a real tab-hide-then-unload sequence. Both transitions are
      // dispatched because a real hard navigation fires both.
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pagehide'));

      await new Promise((resolve) => setTimeout(resolve, 200));

      return events.filter((e) => e.type === 'web_vitals');
    });

    // This is the regression the bug produced: zero events for a fast page.
    expect(webVitalsEvents.length).toBeGreaterThan(0);

    // ONE navigation ships ONE event. The handler registers its flush listeners
    // after web-vitals registers its own, so LCP/CLS/INP have already finalized
    // into the buffer by the time the first transition flushes it — the second
    // transition then finds an empty buffer. Splitting a navigation across two
    // events is unmergeable server-side: the payload carries no navigation id.
    expect(webVitalsEvents).toHaveLength(1);

    for (const event of webVitalsEvents) {
      expect(event.web_vitals?.schema).toBe('consolidated');
      expect(Array.isArray(event.web_vitals?.metrics)).toBe(true);
      expect(event.web_vitals?.metrics?.length).toBeGreaterThan(0);
      expect(event.web_vitals?.metrics?.length).toBeLessThanOrEqual(5);

      const types = event.web_vitals?.metrics?.map((metric) => metric.type) ?? [];
      expect(new Set(types).size).toBe(types.length); // One entry per type — the API rejects duplicates

      for (const metric of event.web_vitals?.metrics ?? []) {
        expect(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']).toContain(metric.type);
        expect(typeof metric.value).toBe('number');
        expect(Number.isFinite(metric.value)).toBe(true);
      }
    }
  });
});
