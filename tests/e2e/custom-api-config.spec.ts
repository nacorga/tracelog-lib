import { test, expect } from '@playwright/test';

test.describe('Custom API Config', () => {
  test('should fetch remote config and apply sampling rate', async ({ page }) => {
    const configRequests: string[] = [];
    const eventRequests: string[] = [];

    await page.route('http://localhost:3000/config.json', async (route) => {
      configRequests.push(route.request().url());

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCode: 200, data: { samplingRate: 0 } }),
      });
    });

    await page.route('http://localhost:3000/collect', async (route) => {
      eventRequests.push(route.request().url());
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/custom-config.html');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('test-button').click();
    await page.waitForTimeout(500);

    expect(configRequests).toHaveLength(1);
    expect(eventRequests).toHaveLength(0);
  });
});
