import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Navigation - Demo Mode', () => {
  test('should include new page URL after SPA navigation', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      history.pushState({}, '', '/second-page');
    });
    await page.waitForTimeout(500);

    await page.getByTestId('test-button').click();
    await page.waitForTimeout(500);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));

    expect(clickLogs).toHaveLength(1);
    expect(clickLogs[0]).toContain(`[TraceLog] ${EventType.CLICK} event:`);

    const eventData = clickLogs[0].split(`[TraceLog] ${EventType.CLICK} event:`)[1];
    const parsed = JSON.parse(eventData);

    expect(parsed.page_url).toBe('http://localhost:3000/second-page');
  });
});
