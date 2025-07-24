import { test, expect } from '@playwright/test';

test.describe('API Config', () => {
  test('should load client static config and apply it', async ({ page }) => {
    const logs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        logs.push(msg.text());
      }
    });

    await page.goto('/use-cases/client-static-config.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const configLog = logs.find((log) => log.includes('[TraceLog] set config:'));

    expect(configLog).toContain('"qaMode":true');
    expect(configLog).toContain('"samplingRate":0.7');
    expect(configLog).toContain('"excludedUrlPaths":["/admin","/debug"]');
  });

  test('should fetch client remote config and apply it', async ({ page }) => {
    const logs: string[] = [];
    const configRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        logs.push(msg.text());
      }
    });

    await page.route('http://localhost:3000/json/client-remote-config.json', async (route) => {
      configRequests.push(route.request().url());

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qaMode: true, samplingRate: 0.33 }),
      });
    });

    await page.goto('/use-cases/client-remote-config.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const configLog = logs.find((log) => log.includes('[TraceLog] set config:'));

    expect(configLog).toContain('"qaMode":true');
    expect(configLog).toContain('"samplingRate":0.33');
    expect(configLog).toContain('"sessionTimeout":40000');
  });
});
