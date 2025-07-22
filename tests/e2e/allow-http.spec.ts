import { test, expect } from '@playwright/test';

test.describe('Allow HTTP Validation', () => {
  test('should fail initialization when allowHttp is not set', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/use-cases/http-without-allow.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toBe('[TraceLog] Initialization rejected: Configuration errors: customApiUrl using http requires allowHttp=true');
  });
});
