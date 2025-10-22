import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

/**
 * E2E Tests: Web Vitals Thresholds Configuration
 *
 * **Priority**: MEDIA
 *
 * **Purpose**: Validates that the `webVitalsThresholds` configuration correctly
 * filters Web Vitals events based on custom threshold values.
 *
 * **Configuration Tested**: `webVitalsThresholds` (optional custom thresholds for LCP/CLS/INP/FCP/TTFB)
 *
 * **Test Cases**:
 * 1. Default thresholds are applied when no custom config provided
 * 2. Custom thresholds override defaults
 * 3. Web Vitals Mode (strict/moderate/permissive) affects thresholds
 * 4. Partial threshold override (only some vitals customized)
 *
 * **Architecture Notes**:
 * - PerformanceHandler uses vitalThresholds to filter events
 * - Filter logic: value <= threshold → event NOT sent
 * - Thresholds loaded from getWebVitalsThresholds(mode) + config.webVitalsThresholds override
 * - Modes: 'strict' (lowest thresholds), 'moderate' (default), 'permissive' (highest thresholds)
 *
 * **Implementation**: performance.handler.ts lines 33-37, 323-329
 *
 * **Note**: Simulating real Web Vitals (LCP, CLS, INP) is complex in E2E tests.
 * These tests focus on configuration validation rather than metric capture simulation.
 */

test.describe('Web Vitals Thresholds Configuration', () => {
  test('should apply default moderate thresholds when no custom config provided', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        // No webVitalsThresholds config → should use moderate defaults
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const performanceHandler = traceLog.getPerformanceHandler();
      const thresholds = performanceHandler?.['vitalThresholds'] as Record<string, number> | undefined;

      return {
        hasThresholds: thresholds !== undefined,
        lcp: thresholds?.LCP ?? null,
        cls: thresholds?.CLS ?? null,
        inp: thresholds?.INP ?? null,
        fcp: thresholds?.FCP ?? null,
        ttfb: thresholds?.TTFB ?? null,
      };
    });

    expect(result.hasThresholds).toBe(true);
    // Moderate mode defaults (from getWebVitalsThresholds)
    expect(result.lcp).toBeGreaterThan(0);
    expect(result.cls).toBeGreaterThan(0);
    expect(result.inp).toBeGreaterThan(0);
    expect(result.fcp).toBeGreaterThan(0);
    expect(result.ttfb).toBeGreaterThan(0);
  });

  test('should override default thresholds with custom config', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const customThresholds = {
        LCP: 5000, // 5s custom threshold
        CLS: 0.5, // 0.5 custom threshold
        INP: 500, // 500ms custom threshold
      };

      await traceLog.init({
        webVitalsThresholds: customThresholds,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const performanceHandler = traceLog.getPerformanceHandler();
      const thresholds = performanceHandler?.['vitalThresholds'] as Record<string, number> | undefined;

      return {
        lcp: thresholds?.LCP ?? null,
        cls: thresholds?.CLS ?? null,
        inp: thresholds?.INP ?? null,
        fcp: thresholds?.FCP ?? null,
        ttfb: thresholds?.TTFB ?? null,
      };
    });

    // Custom values should override defaults
    expect(result.lcp).toBe(5000);
    expect(result.cls).toBe(0.5);
    expect(result.inp).toBe(500);
    // FCP and TTFB should still use defaults
    expect(result.fcp).toBeGreaterThan(0);
    expect(result.ttfb).toBeGreaterThan(0);
  });

  test('should apply "poor" mode thresholds', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        webVitalsMode: 'poor',
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const performanceHandler = traceLog.getPerformanceHandler();
      const thresholds = performanceHandler?.['vitalThresholds'] as Record<string, number> | undefined;

      return {
        lcp: thresholds?.LCP ?? null,
        cls: thresholds?.CLS ?? null,
        inp: thresholds?.INP ?? null,
      };
    });

    // "poor" mode should have highest thresholds (only reports worst metrics)
    expect(result.lcp).toBeGreaterThan(3000); // Poor LCP > 3s
    expect(result.cls).toBeGreaterThan(0.2); // Poor CLS > 0.2
    expect(result.inp).toBeGreaterThan(400); // Poor INP > 400ms
  });

  test('should apply "needs-improvement" mode thresholds', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        webVitalsMode: 'needs-improvement',
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const performanceHandler = traceLog.getPerformanceHandler();
      const thresholds = performanceHandler?.['vitalThresholds'] as Record<string, number> | undefined;

      return {
        lcp: thresholds?.LCP ?? null,
        cls: thresholds?.CLS ?? null,
        inp: thresholds?.INP ?? null,
      };
    });

    // "needs-improvement" mode should have moderate thresholds
    expect(result.lcp).toBeGreaterThanOrEqual(2500); // needs-improvement LCP between 2.5-4s
    expect(result.lcp).toBeLessThanOrEqual(4000);
    expect(result.cls).toBeGreaterThanOrEqual(0.1); // needs-improvement CLS between 0.1-0.25
    expect(result.cls).toBeLessThanOrEqual(0.25);
    expect(result.inp).toBeGreaterThanOrEqual(200); // needs-improvement INP between 200-500ms
    expect(result.inp).toBeLessThanOrEqual(500);
  });

  test('should combine mode thresholds with custom overrides', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        webVitalsMode: 'poor',
        webVitalsThresholds: {
          LCP: 8000, // Override poor LCP with custom value
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const performanceHandler = traceLog.getPerformanceHandler();
      const thresholds = performanceHandler?.['vitalThresholds'] as Record<string, number> | undefined;

      return {
        lcp: thresholds?.LCP ?? null,
        cls: thresholds?.CLS ?? null,
        inp: thresholds?.INP ?? null,
      };
    });

    // LCP should use custom override (8000)
    expect(result.lcp).toBe(8000);
    // CLS and INP should use "poor" mode defaults
    expect(result.cls).toBeGreaterThan(0.2);
    expect(result.inp).toBeGreaterThan(400);
  });
});
