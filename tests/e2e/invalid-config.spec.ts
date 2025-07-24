import { test, expect } from '@playwright/test';

test.describe('Invalid Configuration', () => {
  test('should log error when id and apiUrl are used simultaneously', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/use-cases/id-and-custom.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toBe('[TraceLog] Invalid configuration: id cannot be used with apiUrl or remoteConfigApiUrl');
  });
});
