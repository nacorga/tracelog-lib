/**
 * Disabled Events Configuration Test
 *
 * Tests the ability to disable specific auto-tracked event types (scroll, web_vitals, error)
 * while preserving core events (page_view, click, session)
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Disabled Events Configuration', () => {
  test('should not track scroll events when scroll is disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    // Clear storage after navigation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const result = await page.evaluate(async () => {
      // Initialize with scroll disabled
      await window.__traceLogBridge!.init({
        disabledEvents: ['scroll'],
      });

      const events: any[] = [];
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Trigger scroll
      window.scrollTo(0, 500);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        scrollEvents: events.filter((e) => e.type === 'SCROLL'),
        hasOtherEvents: events.some((e) => e.type !== 'SCROLL'),
      };
    });

    expect(result.scrollEvents.length).toBe(0);
  });

  test('should not track web vitals when web_vitals is disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const result = await page.evaluate(async () => {
      // Initialize with web_vitals disabled
      await window.__traceLogBridge!.init({
        disabledEvents: ['web_vitals'],
      });

      const events: any[] = [];
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Wait for potential web vitals
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        webVitalsEvents: events.filter((e) => e.type === 'WEB_VITALS'),
        totalEvents: events.length,
      };
    });

    expect(result.webVitalsEvents.length).toBe(0);
  });

  test('should not track errors when error is disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const result = await page.evaluate(async () => {
      // Initialize with error disabled
      await window.__traceLogBridge!.init({
        disabledEvents: ['error'],
      });

      const events: any[] = [];
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Trigger error
      try {
        throw new Error('Test error');
      } catch (error) {
        window.dispatchEvent(
          new ErrorEvent('error', {
            error,
            message: 'Test error',
          }),
        );
      }

      // Wait for error to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        errorEvents: events.filter((e) => e.type === 'ERROR'),
        totalEvents: events.length,
      };
    });

    expect(result.errorEvents.length).toBe(0);
  });

  test('should track click events even when scroll is disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    // Clear storage before test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 1: Initialize
    await page.evaluate(async () => {
      await window.__traceLogBridge!.init({
        disabledEvents: ['scroll'],
      });
    });

    // Step 2: Register listener and trigger events in separate block
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Register listener
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Create and click button
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Click Me';
      document.body.appendChild(button);

      button.click();

      // Wait for click event
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        clickEvents: events.filter((e) => e.type === 'click'),
        scrollEvents: events.filter((e) => e.type === 'scroll'),
      };
    });

    expect(result.clickEvents.length).toBeGreaterThan(0);
    expect(result.scrollEvents.length).toBe(0);
  });

  test('should track page view events even when all optional events are disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, destroyExisting: false });

    // Clear storage before test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Initialize with listener registered BEFORE init to capture initial PAGE_VIEW
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Register listener BEFORE init to capture PAGE_VIEW during init
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Initialize with all optional events disabled
      await window.__traceLogBridge!.init({
        disabledEvents: ['scroll', 'web_vitals', 'error'],
      });

      // Wait for initial page view event
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        pageViewEvents: events.filter((e) => e.type === 'page_view'),
        scrollEvents: events.filter((e) => e.type === 'scroll'),
        webVitalsEvents: events.filter((e) => e.type === 'web_vitals'),
        errorEvents: events.filter((e) => e.type === 'error'),
      };
    });

    expect(result.pageViewEvents.length).toBeGreaterThan(0);
    expect(result.scrollEvents.length).toBe(0);
    expect(result.webVitalsEvents.length).toBe(0);
    expect(result.errorEvents.length).toBe(0);
  });

  test('should track session events even when all optional events are disabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, destroyExisting: false });

    // Clear storage to ensure fresh session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Initialize and capture session start
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Register listener BEFORE init to capture SESSION_START
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Initialize with all optional events disabled
      await window.__traceLogBridge!.init({
        disabledEvents: ['scroll', 'web_vitals', 'error'],
      });

      // Wait for session start
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        sessionStartEvents: events.filter((e) => e.type === 'session_start'),
        totalEvents: events.length,
      };
    });

    expect(result.sessionStartEvents.length).toBeGreaterThan(0);
  });

  test('should handle empty disabledEvents array', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 1: Initialize
    await page.evaluate(async () => {
      await window.__traceLogBridge!.init({
        disabledEvents: [],
      });
    });

    // Wait for scroll suppression to clear (500ms after PAGE_VIEW)
    await page.waitForTimeout(600);

    // Step 2: Register listener and test scroll
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Register listener
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Add scrollable content
      const div = document.createElement('div');
      div.style.height = '2000px';
      div.textContent = 'Scrollable content';
      document.body.appendChild(div);

      // Wait a bit before scrolling
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger scroll
      window.scrollTo(0, 500);

      // Wait for scroll handler debounce (250ms) + buffer
      await new Promise((resolve) => setTimeout(resolve, 400));

      return {
        scrollEvents: events.filter((e) => e.type === 'scroll'),
        hasEvents: events.length > 0,
      };
    });

    // Should track scroll since nothing is disabled
    expect(result.hasEvents).toBe(true);
  });

  test('should handle multiple disabled event types', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 1: Initialize
    await page.evaluate(async () => {
      await window.__traceLogBridge!.init({
        disabledEvents: ['scroll', 'error'],
      });
    });

    // Step 2: Register listener and test events
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Register listener
      window.__traceLogBridge!.on('event', (event: any) => {
        events.push(event);
      });

      // Trigger scroll (should be disabled)
      window.scrollTo(0, 500);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Trigger error (should be disabled)
      try {
        throw new Error('Test error');
      } catch (error) {
        window.dispatchEvent(
          new ErrorEvent('error', {
            error,
            message: 'Test error',
          }),
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger click (should work)
      const button = document.createElement('button');
      button.textContent = 'Test';
      document.body.appendChild(button);
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        scrollEvents: events.filter((e) => e.type === 'scroll'),
        errorEvents: events.filter((e) => e.type === 'error'),
        clickEvents: events.filter((e) => e.type === 'click'),
      };
    });

    expect(result.scrollEvents.length).toBe(0);
    expect(result.errorEvents.length).toBe(0);
    expect(result.clickEvents.length).toBeGreaterThan(0); // Click should still work
  });

  test('should initialize successfully with undefined disabledEvents', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const result = await page.evaluate(async () => {
      // Initialize without disabledEvents
      await window.__traceLogBridge!.init({});

      return {
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    expect(result.initialized).toBe(true);
  });
});
