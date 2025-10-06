import { test, expect } from '@playwright/test';

import { navigateToPlayground } from './utils/environment.utils';

test.describe('Session Start - Single emission per session', () => {
  test('should emit session_start only once for new session', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({});

      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    const sessionStartEvents = result.filter((e) => e.type === 'session_start');
    expect(sessionStartEvents).toHaveLength(1);
  });

  test('should NOT emit session_start when recovering session in new tab', async ({ context }) => {
    const page1 = await context.newPage();
    await navigateToPlayground(page1, { autoInit: false, searchParams: { e2e: 'true' } });

    const firstTabResult = await page1.evaluate(async (_projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({});

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    });

    const firstTabSessionStarts = firstTabResult.events.filter((e) => e.type === 'session_start');
    expect(firstTabSessionStarts).toHaveLength(1);
    expect(firstTabResult.sessionId).toBeDefined();

    const page2 = await context.newPage();
    await navigateToPlayground(page2, { autoInit: false, searchParams: { e2e: 'true' } });

    const secondTabResult = await page2.evaluate(async (_projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({});

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    });

    const secondTabSessionStarts = secondTabResult.events.filter((e) => e.type === 'session_start');
    expect(secondTabSessionStarts).toHaveLength(0);
    expect(secondTabResult.sessionId).toBe(firstTabResult.sessionId);

    await page1.close();
    await page2.close();
  });
});
