import { test, expect } from '@playwright/test';
import { SpecialProjectId } from '@/types';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Session Start - Single emission per session', () => {
  test('should emit session_start only once for new session', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({ id: projectId });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    }, SpecialProjectId.Skip);

    const sessionStartEvents = result.filter((e) => e.type === 'session_start');
    expect(sessionStartEvents).toHaveLength(1);
  });

  test('should NOT emit session_start when recovering session in new tab', async ({ context }) => {
    const page1 = await context.newPage();
    await navigateToPlayground(page1, { autoInit: false, searchParams: { e2e: 'true' } });

    const firstTabResult = await page1.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({ id: projectId });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    }, SpecialProjectId.Skip);

    const firstTabSessionStarts = firstTabResult.events.filter((e) => e.type === 'session_start');
    expect(firstTabSessionStarts).toHaveLength(1);
    expect(firstTabResult.sessionId).toBeDefined();

    const page2 = await context.newPage();
    await navigateToPlayground(page2, { autoInit: false, searchParams: { e2e: 'true' } });

    const secondTabResult = await page2.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({ id: projectId });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    }, SpecialProjectId.Skip);

    const secondTabSessionStarts = secondTabResult.events.filter((e) => e.type === 'session_start');
    expect(secondTabSessionStarts).toHaveLength(0);
    expect(secondTabResult.sessionId).toBe(firstTabResult.sessionId);

    await page1.close();
    await page2.close();
  });

  test('should emit session_start on excluded URL, but not when recovering on non-excluded URL', async ({
    context,
  }) => {
    const page1 = await context.newPage();
    await navigateToPlayground(page1, { autoInit: false, searchParams: { e2e: 'true' }, hash: '#/admin' });

    const firstTabResult = await page1.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({
        id: projectId,
        excludedUrlPaths: ['*#/admin'],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    }, SpecialProjectId.Skip);

    const firstTabSessionStarts = firstTabResult.events.filter((e) => e.type === 'session_start');
    expect(firstTabSessionStarts).toHaveLength(1);

    const page2 = await context.newPage();
    await navigateToPlayground(page2, { autoInit: false, searchParams: { e2e: 'true' }, hash: '#/dashboard' });

    const secondTabResult = await page2.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const events: Array<{ type: string }> = [];

      traceLog.on('event', (payload: any) => {
        events.push({ type: payload.type as string });
      });

      await traceLog.init({
        id: projectId,
        excludedUrlPaths: ['*#/admin'],
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionData = traceLog.getSessionData();

      return {
        events,
        sessionId: sessionData?.id as string,
      };
    }, SpecialProjectId.Skip);

    const secondTabSessionStarts = secondTabResult.events.filter((e) => e.type === 'session_start');
    expect(secondTabSessionStarts).toHaveLength(0);
    expect(secondTabResult.sessionId).toBe(firstTabResult.sessionId);

    await page1.close();
    await page2.close();
  });
});
