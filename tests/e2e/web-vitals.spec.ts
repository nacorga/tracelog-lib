import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

const parseTracelogPayloads = (logs: string[], type: EventType): any[] => {
  const matches = logs.filter((log) => log.includes(`[TraceLog] ${type} event:`));
  return matches.map((log) => {
    const json = log.split(`[TraceLog] ${type} event:`)[1];
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }).filter((p): p is Record<string, unknown> => !!p);
};

test.describe('Web Vitals - Test Mode', () => {
  test('should log WEB_VITALS events after init', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/web-vitals.html');
    await page.waitForLoadState('domcontentloaded');

    // Allow time for vitals observers to fire
    await page.waitForTimeout(2000);

    const payloads = parseTracelogPayloads(consoleLogs, EventType.WEB_VITALS);

    expect(payloads.length).toBeGreaterThan(0);

    const first = payloads[0] as { type: string; web_vitals?: { type?: string; value?: number } };
    expect(first.type).toBe(EventType.WEB_VITALS);
    expect(first.web_vitals?.type).toBeDefined();
  });

  test('should log LONG_TASK when main thread is blocked', async ({ page }) => {
    const projectName = test.info().project.name;
    if (projectName === 'chromium' || projectName === 'Mobile Chrome') {
      test.skip(true, 'LongTask PO unreliable in CI for Chromium-based browsers');
    }

    const supportsLongTask = await page.evaluate(() => {
      try {
        // @ts-ignore
        const supported = (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) || [];
        return Array.isArray(supported) && supported.includes('longtask');
      } catch {
        return false;
      }
    });

    if (!supportsLongTask) {
      test.skip(true, 'LongTask PerformanceObserver not supported in this browser');
    }

    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/web-vitals.html');
    await page.waitForLoadState('domcontentloaded');

    // Block main thread for ~250ms to trigger a long task
    await page.evaluate(() => {
      const start = performance.now();
      while (performance.now() - start < 250) {
        // busy loop
      }
    });

    await page.waitForTimeout(1000);

    const payloads = parseTracelogPayloads(consoleLogs, EventType.WEB_VITALS);
    const longTask = payloads.find((p) => (p.web_vitals?.type ?? '') === 'LONG_TASK');

    expect(longTask).toBeTruthy();
  });

  test.skip('RESOURCE_TIMINGS summary disabled', async () => {});
});


