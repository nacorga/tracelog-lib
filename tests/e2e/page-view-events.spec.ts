import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Page View Events - Demo Mode', () => {
  test(`should log ${EventType.PAGE_VIEW} on SPA navigation`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    consoleLogs.length = 0;

    await page.evaluate(() => {
      history.pushState({}, '', '/second-page');
    });

    await page.waitForTimeout(1000);

    const pageViewLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.PAGE_VIEW}"`));

    expect(pageViewLogs).toHaveLength(1);
    expect(pageViewLogs[0]).toContain(`[TraceLog] ${EventType.PAGE_VIEW} event:`);

    const eventData = pageViewLogs[0].split(`[TraceLog] ${EventType.PAGE_VIEW} event:`)[1];
    const parsed = JSON.parse(eventData);

    expect(parsed).toHaveProperty('type', EventType.PAGE_VIEW);
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('page_url');
    expect(parsed).toHaveProperty('from_page_url');
    expect(parsed.page_url).toBe('http://localhost:3000/second-page');
    expect(parsed.from_page_url).toBe('http://localhost:3000/');
  });
});
