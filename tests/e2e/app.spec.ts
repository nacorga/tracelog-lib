import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should load the test page successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('title')).toContainText('TraceLog E2E Test Suite');
  });

  test('should initialize TraceLog successfully', async ({ page }) => {
    const initializationMessages: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text() === '[E2E Test] TraceLog initialized successfully') {
        initializationMessages.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    expect(initializationMessages).toHaveLength(1);
    expect(initializationMessages[0]).toBe('[E2E Test] TraceLog initialized successfully');
  });

  test('should display initialization status on page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page.getByTestId('init-status')).toContainText('Status: Initialized successfully');
  });
});
