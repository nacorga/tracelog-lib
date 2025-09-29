/**
 * Basic Session Management Test
 *
 * Tests basic TraceLog session management functionality without complex abstractions
 * Focus: Library session validation only
 */

import { test, expect, type Page } from '@playwright/test';
import { SpecialProjectId } from '@/types';

const waitForBridge = async (page: Page) => {
  await page.waitForFunction(() => Boolean(window.__traceLogBridge), { timeout: 5000 });
};

test.describe('Session Management - Excluded URL Scenarios', () => {
  test('should emit session_end when session closes on excluded page', async ({ page }) => {
    await page.goto('/?e2e=true');
    await waitForBridge(page);

    const result = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string; pageUrl: string | undefined }> = [];

      const waitForPageUrl = async (expectedHash: string) => {
        const timeout = Date.now() + 2000;
        return new Promise<void>((resolve, reject) => {
          const poll = () => {
            const current = traceLog.get('pageUrl') as string | undefined;
            if (current?.includes(expectedHash)) {
              resolve();
              return;
            }
            if (Date.now() > timeout) {
              reject(new Error(`Timed out waiting for pageUrl to include ${expectedHash}`));
              return;
            }
            setTimeout(poll, 50);
          };
          poll();
        });
      };

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string, pageUrl: payload.page_url as string | undefined });
      });

      await traceLog.init({
        id: projectId,
        excludedUrlPaths: ['*#/nosotros'],
      });

      window.location.hash = '#/nosotros';
      await waitForPageUrl('#/nosotros');

      await traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 200));

      return events;
    }, SpecialProjectId.Skip);

    const eventTypes = result.map((event) => event.type);
    expect(eventTypes).toContain('session_start');
    expect(eventTypes).toContain('session_end');

    const sessionEnd = result.find((event) => event.type === 'session_end');
    expect(sessionEnd?.pageUrl ?? '').toContain('#/nosotros');
  });

  test('should default invalid samplingRate to full capture', async ({ page }) => {
    await page.goto('/?e2e=true');
    await waitForBridge(page);

    const { normalizedRate, allSampled } = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const capturedNames: string[] = [];

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'custom' && payload.custom_event?.name) {
          capturedNames.push(payload.custom_event.name as string);
        }
      });

      await traceLog.init({
        id: projectId,
        samplingRate: 0,
      });

      const normalizedSampling = traceLog.get('config')?.samplingRate ?? 0;

      const originalRandom = Math.random;
      Math.random = () => 0.01;

      try {
        for (let index = 0; index < 10; index++) {
          traceLog.sendCustomEvent(`sampled_event_${index}`);
        }
      } finally {
        Math.random = originalRandom;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      await traceLog.destroy();

      return { normalizedRate: normalizedSampling, allSampled: capturedNames.length >= 10 };
    }, SpecialProjectId.Skip);

    expect(normalizedRate).toBe(1);
    expect(allSampled).toBe(true);
  });

  test('should resume event tracking after leaving an excluded route', async ({ page }) => {
    await page.goto('/?e2e=true');
    await waitForBridge(page);

    const result = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const captured: Array<{ name: string | undefined; pageUrl: string | undefined }> = [];

      const waitForPageUrl = async (expectedHash: string) => {
        const timeout = Date.now() + 2000;
        return new Promise<void>((resolve, reject) => {
          const poll = () => {
            const current = traceLog.get('pageUrl') as string | undefined;
            if (current?.includes(expectedHash)) {
              resolve();
              return;
            }
            if (Date.now() > timeout) {
              reject(new Error(`Timed out waiting for pageUrl to include ${expectedHash}`));
              return;
            }
            setTimeout(poll, 50);
          };
          poll();
        });
      };

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'custom') {
          captured.push({ name: payload.custom_event?.name, pageUrl: payload.page_url });
        }
      });

      await traceLog.init({
        id: projectId,
        samplingRate: 1,
        excludedUrlPaths: ['*#/nosotros'],
      });

      window.location.hash = '#/nosotros';
      await waitForPageUrl('#/nosotros');
      traceLog.sendCustomEvent('event_on_excluded_route');
      await new Promise((resolve) => setTimeout(resolve, 200));

      window.location.hash = '#/inicio';
      await waitForPageUrl('#/inicio');
      traceLog.sendCustomEvent('event_on_allowed_route');
      await new Promise((resolve) => setTimeout(resolve, 200));

      await traceLog.destroy();

      return captured;
    }, SpecialProjectId.Skip);

    const excludedEvent = result.find((event) => event.name === 'event_on_excluded_route');
    expect(excludedEvent).toBeUndefined();

    const allowedEvent = result.find((event) => event.name === 'event_on_allowed_route');
    expect(allowedEvent).toBeDefined();
    expect(allowedEvent?.pageUrl ?? '').toContain('#/inicio');
  });
});
