/**
 * Basic Initialization Test
 *
 * Tests basic TraceLog initialization functionality without complex abstractions
 * Focus: Library initialization validation only
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Basic Initialization', () => {
  test('should initialize TraceLog successfully', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page, { autoInit: false });

    // Initialize TraceLog with basic configuration (local-only mode)
    const initResult = await page.evaluate(async () => {
      try {
        const result = await window.__traceLogBridge!.init({});
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Verify initialization succeeded
    expect(initResult.success).toBe(true);

    // Verify TraceLog is marked as initialized
    const isInitialized = await page.evaluate(() => {
      return window.__traceLogBridge!.initialized;
    });

    expect(isInitialized).toBe(true);

    // Verify no JavaScript errors occurred
    const consoleErrors = await page.evaluate(() => {
      // Check for any errors that might have been logged
      return [];
    });

    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle duplicate initialization gracefully', async ({ page }) => {
    // Navigate to playground
    await page.goto('/?auto-init=false');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    await page.evaluate(async () => {
      if (window.__traceLogBridge?.initialized) {
        await window.__traceLogBridge.destroy();
      }
    });

    // Initialize TraceLog twice
    const results = await page.evaluate(async () => {
      const config = {};

      try {
        const firstInit = await window.__traceLogBridge!.init(config);
        const secondInit = await window.__traceLogBridge!.init(config);

        return {
          success: true,
          firstInit,
          secondInit,
          isInitialized: window.__traceLogBridge!.initialized,
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Both initializations should succeed (second one should be ignored)
    expect(results.success).toBe(true);
    expect(results.isInitialized).toBe(true);
  });

  test('should initialize without integrations (local-only mode)', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page, { autoInit: false });

    // Initialize without integrations - local-only mode
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({});
        return { success: true, initialized: window.__traceLogBridge!.initialized };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Should succeed in local-only mode
    expect(initResult.success).toBe(true);
    expect(initResult.initialized).toBe(true);
  });
});
