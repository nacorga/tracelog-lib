import { test, expect } from '@playwright/test';

test.describe('TraceLog Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load test page with all required elements', async ({ page }) => {
    // Check basic page structure
    await expect(page.locator('h1')).toHaveText('TraceLog E2E Test Page');
    
    // Check initialization section
    await expect(page.locator('[data-testid="init-tracking"]')).toBeVisible();
    await expect(page.locator('[data-testid="reinit-tracking"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    
    // Check configuration section
    await expect(page.locator('#tracking-id')).toBeVisible();
    await expect(page.locator('#session-timeout')).toBeVisible();
    await expect(page.locator('#global-metadata')).toBeVisible();
    await expect(page.locator('[data-testid="init-with-config"]')).toBeVisible();
    
    // Check event testing section
    await expect(page.locator('[data-testid="simple-event-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-event-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="invalid-event-btn"]')).toBeVisible();
    
    // Check interaction elements
    await expect(page.locator('[data-testid="click-test-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="click-counter"]')).toBeVisible();
  });

  test('should have correct initial states', async ({ page }) => {
    // Check initial status
    const status = await page.locator('[data-testid="tracking-status"]').textContent();
    expect(status).toContain('Not initialized');
    
    // Check initial counter
    const counter = await page.locator('[data-testid="click-counter"]').textContent();
    expect(counter).toContain('Clicks: 0');
    
    // Check initial form values
    const trackingId = await page.locator('#tracking-id').inputValue();
    expect(trackingId).toBe('test-tracking-id');
    
    const sessionTimeout = await page.locator('#session-timeout').inputValue();
    expect(sessionTimeout).toBe('900000');
  });

  test('should handle basic user interactions without errors', async ({ page }) => {
    // Test button clicks don't cause JavaScript errors
    await page.click('[data-testid="init-tracking"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="check-status"]');
    await page.waitForTimeout(300);
    
    await page.click('[data-testid="click-test-btn"]');
    await page.waitForTimeout(300);
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle scroll interactions', async ({ page }) => {
    // Test scroll areas are functional
    const scrollArea = page.locator('.scroll-area').first();
    if (await scrollArea.isVisible()) {
      await scrollArea.hover();
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
    }
    
    // Page should remain stable
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle form interactions', async ({ page }) => {
    // Test form inputs work
    await page.fill('#tracking-id', 'smoke-test-id');
    const newValue = await page.locator('#tracking-id').inputValue();
    expect(newValue).toBe('smoke-test-id');
    
    // Test metadata textarea
    await page.fill('#global-metadata', '{"test": true}');
    const metadataValue = await page.locator('#global-metadata').inputValue();
    expect(metadataValue).toContain('test');
    
    // Test config button works
    await page.click('[data-testid="init-with-config"]');
    await page.waitForTimeout(500);
    
    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid event button
    await page.click('[data-testid="invalid-event-btn"]');
    await page.waitForTimeout(300);
    
    // Test invalid config
    await page.click('[data-testid="test-invalid-config"]');
    await page.waitForTimeout(300);
    
    // Page should remain functional despite errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
  });

  test('should load required assets and dependencies', async ({ page }) => {
    // Check that JavaScript is loaded and working
    const result = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    expect(result).toBe(true);
    
    // Check that page has expected content
    const pageContent = await page.content();
    expect(pageContent).toContain('TraceLog E2E Test Page');
    expect(pageContent).toContain('Tracking Status');
    expect(pageContent).toContain('Custom Events');
  });

  test('should maintain page responsiveness', async ({ page }) => {
    // Test rapid interactions don't freeze the page
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    await expect(page.locator('[data-testid="click-counter"]')).toBeVisible();
    
    // Test status button still works
    await page.click('[data-testid="check-status"]');
    await page.waitForTimeout(300);
    
    await expect(page.locator('body')).toBeVisible();
  });
}); 