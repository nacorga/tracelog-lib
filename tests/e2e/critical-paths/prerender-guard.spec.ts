/**
 * E2E: Pre-render guard
 * Focus: a pre-rendered page emits zero events until activation, then starts
 * full tracking on `prerenderingchange` — validated in a real browser.
 *
 * `document.prerendering` is read-only in the browser, so we shadow it with an
 * own data property before init() to simulate the pre-rendering phase, then
 * dispatch the activation event the same way the browser would.
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Pre-render guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test('defers all events while pre-rendering, then starts on activation', async ({ page }) => {
    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
      if (!window.__traceLogBridge) {
        throw new Error(`TraceLog bridge not available after ${retries * 100}ms`);
      }

      const bridge = window.__traceLogBridge;
      bridge.destroy(true);

      // Simulate the pre-rendering phase (document.prerendering is read-only).
      Object.defineProperty(document, 'prerendering', { configurable: true, value: true });

      await bridge.init();

      const countType = (type: string): number => bridge.getQueueEvents().filter((e) => e.type === type).length;

      const duringPrerender = {
        sessionId: bridge.get('sessionId'),
        sessionStart: countType('session_start'),
        pageView: countType('page_view'),
      };

      // Activate: prerendering → false, then fire the browser's activation event.
      Object.defineProperty(document, 'prerendering', { configurable: true, value: false });
      document.dispatchEvent(new Event('prerenderingchange'));
      await new Promise((resolve) => setTimeout(resolve, 200));

      const afterActivation = {
        sessionStart: countType('session_start'),
        pageView: countType('page_view'),
      };

      return { duringPrerender, afterActivation };
    });

    // A real sessionId is allocated, but nothing is emitted yet.
    expect(result.duringPrerender.sessionId).toBeTruthy();
    expect(result.duringPrerender.sessionStart).toBe(0);
    expect(result.duringPrerender.pageView).toBe(0);

    // Activation starts the full tracking sequence exactly once.
    expect(result.afterActivation.sessionStart).toBe(1);
    expect(result.afterActivation.pageView).toBeGreaterThanOrEqual(1);
  });
});
