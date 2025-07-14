import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Click Events - Demo Mode', () => {
  test('should log click and custom events when interacting with elements', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(500);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));
    const customLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CUSTOM}"`));

    expect(clickLogs).toHaveLength(1);
    expect(customLogs).toHaveLength(1);

    expect(clickLogs[0]).toContain(`[TraceLog] ${EventType.CLICK} event:`);
    expect(customLogs[0]).toContain(`[TraceLog] ${EventType.CUSTOM} event:`);

    const clickEvent = clickLogs[0];

    expect(clickEvent).toContain('"type"');
    expect(clickEvent).toContain('"timestamp"');
    expect(clickEvent).toContain('"page_url"');
    expect(clickEvent).toContain('"x"');
    expect(clickEvent).toContain('"y"');
    expect(clickEvent).toContain('"elementTag"');

    const customEvent = customLogs[0];

    expect(customEvent).toContain('"name"');
    expect(customEvent).toContain('"metadata"');
  });
});
