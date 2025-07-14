import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Scroll Events - Demo Mode', () => {
  test('should log scroll event on window scroll', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const scrollLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.SCROLL}"`));
    expect(scrollLogs.length).toBeGreaterThan(0);

    const scrollEvent = scrollLogs[0];
    expect(scrollEvent).toContain(`[TraceLog] ${EventType.SCROLL} event:`);
    expect(scrollEvent).toContain('"type"');
    expect(scrollEvent).toContain('"timestamp"');
    expect(scrollEvent).toContain('"page_url"');
    expect(scrollEvent).toContain('"depth"');
    expect(scrollEvent).toContain('"direction"');
  });
});