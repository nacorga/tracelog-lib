import { test, expect } from '@playwright/test';

// Ensures apiConfig is applied without fetching remote configuration

test.describe('Static API Config', () => {
  test('should use provided apiConfig without fetching remote', async ({ page }) => {
    const configRequests: string[] = [];
    const eventRequests: string[] = [];

    await page.route('**/config', async (route) => {
      configRequests.push(route.request().url());
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.route('http://localhost:3000/collect', async (route) => {
      eventRequests.push(route.request().url());
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/static-config.html');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('test-button').click();
    await page.waitForTimeout(500);

    expect(configRequests).toHaveLength(0);
    expect(eventRequests).toHaveLength(0);
  });
});
