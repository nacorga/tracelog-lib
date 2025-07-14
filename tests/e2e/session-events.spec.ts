import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Session Events - Demo Mode', () => {
  test('Test works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('title')).toContainText('TraceLog E2E Test Page');
  });

  test(`should log ${EventType.SESSION_START} and ${EventType.PAGE_VIEW} on init`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const sessionStartLogs = consoleLogs.filter((log) => log.includes(EventType.SESSION_START));
    const pageViewLogs = consoleLogs.filter((log) => log.includes(EventType.PAGE_VIEW));

    expect(sessionStartLogs).toHaveLength(1);
    expect(pageViewLogs).toHaveLength(1);

    expect(sessionStartLogs[0]).toContain(`[TraceLog] ${EventType.SESSION_START} event:`);
    expect(pageViewLogs[0]).toContain(`[TraceLog] ${EventType.PAGE_VIEW} event:`);

    const sessionStartEvent = sessionStartLogs[0];

    expect(sessionStartEvent).toContain('"type"');
    expect(sessionStartEvent).toContain('"timestamp"');
    expect(sessionStartEvent).toContain('"page_url"');
    expect(sessionStartEvent).toContain('"referrer"');

    const pageViewEvent = pageViewLogs[0];

    expect(pageViewEvent).toContain('"type"');
    expect(pageViewEvent).toContain('"timestamp"');
    expect(pageViewEvent).toContain('"page_url"');
  });

  test(`should log ${EventType.SESSION_END} on page unload`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    const sessionEndLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.SESSION_END}"`));

    expect(sessionEndLogs).toHaveLength(1);
    expect(sessionEndLogs[0]).toContain(`[TraceLog] ${EventType.SESSION_END} event:`);

    const sessionEndEvent = sessionEndLogs[0];

    expect(sessionEndEvent).toContain('"type"');
    expect(sessionEndEvent).toContain('"timestamp"');
    expect(sessionEndEvent).toContain('"page_url"');
  });
});
