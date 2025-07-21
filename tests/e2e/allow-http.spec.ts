import { test, expect } from '@playwright/test';

// Validates that http endpoints require allowHttp=true

test.describe('Allow HTTP Validation', () => {
  test('should fail initialization when allowHttp is not set', async ({ page }) => {
    const eventRequests: string[] = [];
    const consoleErrors: string[] = [];

    await page.route('http://localhost:3000/collect', async (route) => {
      eventRequests.push(route.request().url());
      await route.fulfill({ status: 200, body: '{}' });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/http-without-allow.html');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('test-button').click();
    await page.waitForTimeout(500);

    expect(eventRequests).toHaveLength(0);
    expect(consoleErrors.some((err) => err.includes('Initialization'))).toBe(true);
  });
});
