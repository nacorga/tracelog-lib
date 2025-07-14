import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Custom Events - Demo Mode', () => {
  test(`should log ${EventType.CUSTOM} event via sendCustomEvent`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.getByTestId('custom-event-btn').click();
    await page.waitForTimeout(1000);

    const customLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CUSTOM}"`));

    expect(customLogs).toHaveLength(1);
    expect(customLogs[0]).toContain(`[TraceLog] ${EventType.CUSTOM} event:`);

    const customEventLog = customLogs[0];

    expect(customEventLog).toContain('"type"');
    expect(customEventLog).toContain('"timestamp"');
    expect(customEventLog).toContain('"page_url"');
    expect(customEventLog).toContain('"custom_event"');
    expect(customEventLog).toContain('"name":"playwright_event"');
    expect(customEventLog).toContain('"metadata"');
  });
});