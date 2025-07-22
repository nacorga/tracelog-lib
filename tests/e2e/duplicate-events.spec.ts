import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';
import { CLICK_DEBOUNCE_TIME } from '../../src/constants';

test.describe('Duplicate Events - Demo Mode', () => {
  test(`should ignore repeated clicks occurring within ${CLICK_DEBOUNCE_TIME}ms of the last event`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(100);
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(150);
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(CLICK_DEBOUNCE_TIME + 200);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));

    expect(clickLogs).toHaveLength(1);
  });
});