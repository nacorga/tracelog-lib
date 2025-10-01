/**
 * Basic Session Management Test
 *
 * Tests basic TraceLog session management functionality without complex abstractions
 * Focus: Library session validation only
 */

import { test, expect } from '@playwright/test';
import { SpecialProjectId } from '@/types';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Session Management - Excluded URL Scenarios', () => {
  test('should emit session_end when session closes on excluded page', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

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

  test('should respect samplingRate of zero (no sampling)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const { normalizedRate, noneSampled } = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const capturedNames: string[] = [];

      traceLog.on('event', (payload: any) => {
        if (payload.type === 'custom' && payload.custom_event?.name) {
          capturedNames.push(payload.custom_event.name as string);
        }
      });

      await traceLog.init({
        id: projectId,
        samplingRate: 0, // Valid: means "don't sample any events"
      });

      const normalizedSampling = traceLog.get('config')?.samplingRate ?? 1;

      const originalRandom = Math.random;
      Math.random = () => 0.01; // Would pass sampling if rate > 0

      try {
        for (let index = 0; index < 10; index++) {
          traceLog.sendCustomEvent(`sampled_event_${index}`);
        }
      } finally {
        Math.random = originalRandom;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      await traceLog.destroy();

      return { normalizedRate: normalizedSampling, noneSampled: capturedNames.length === 0 };
    }, SpecialProjectId.Skip);

    expect(normalizedRate).toBe(0); // Should preserve 0
    expect(noneSampled).toBe(true); // No events should be sampled with rate 0
  });

  test('should resume event tracking after leaving an excluded route', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

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
