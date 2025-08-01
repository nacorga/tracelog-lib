import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('Test works', async ({ page }) => {
    let appWorksLog: string | undefined = undefined;

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text() === 'TraceLog initialized successfully') {
        appWorksLog = msg.text();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('title')).toContainText('TraceLog E2E Test Page');

    expect(appWorksLog).toBeDefined()
  });
});
