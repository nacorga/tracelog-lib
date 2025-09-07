import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Session Destroy', () => {
  test('should emit only one session_end on destroy', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      // @ts-ignore
      window.TraceLog.destroy();
    });
    await page.waitForTimeout(1000);

    const sessionEndLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.SESSION_END}"`));
    expect(sessionEndLogs).toHaveLength(1);
  });
});
