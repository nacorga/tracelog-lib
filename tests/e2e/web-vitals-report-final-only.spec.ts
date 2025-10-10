/**
 * Web Vitals Report Final Values Only Test
 *
 * Tests that web-vitals library reports only final values, not intermediate changes
 * Focus: Verify reportAllChanges: false prevents excessive WEB_VITALS events
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Web Vitals Final-Only Reporting', () => {
  test('should only capture final web vitals values, not intermediate changes', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({});
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Capture web vitals events
    const capturedEvents = await page.evaluate(async () => {
      const events: Array<{ type: string; web_vitals?: { type: string; value: number } }> = [];

      // Listen for all events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'web_vitals') {
          events.push(data);
        }
      });

      // Trigger layout shifts (for CLS) by modifying DOM
      const container = document.createElement('div');
      container.style.height = '100px';
      container.style.backgroundColor = 'red';
      document.body.insertBefore(container, document.body.firstChild);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger more layout shifts
      container.style.height = '200px';
      await new Promise((resolve) => setTimeout(resolve, 100));

      container.style.height = '300px';
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Wait for potential multiple reports (should not happen with reportAllChanges: false)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return events;
    });

    // Count CLS events
    const clsEvents = capturedEvents.filter((e) => e.web_vitals?.type === 'CLS');

    // With reportAllChanges: false, we should receive at most 1 CLS event
    // (or possibly 0 if threshold not met)
    expect(clsEvents.length).toBeLessThanOrEqual(1);

    // Log for debugging
    console.log('Total WEB_VITALS events:', capturedEvents.length);
    console.log('CLS events:', clsEvents.length);

    // General check: We should not have excessive events
    // With reportAllChanges: true, we'd see 3-5+ CLS events for the above DOM changes
    // With reportAllChanges: false, we should see 0-1
    expect(capturedEvents.length).toBeLessThan(10);
  });

  test('should report final LCP value only once per navigation', async ({ page }) => {
    await navigateToPlayground(page);

    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({});
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    const lcpEvents = await page.evaluate(async () => {
      const events: Array<{ web_vitals?: { type: string; value: number } }> = [];

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'web_vitals' && data.web_vitals?.type === 'LCP') {
          events.push(data);
        }
      });

      // Wait for LCP to stabilize
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return events;
    });

    // Should report LCP only once (final value)
    expect(lcpEvents.length).toBeLessThanOrEqual(1);

    console.log('LCP events captured:', lcpEvents.length);
  });

  test('should report final INP value, not every interaction', async ({ page }) => {
    await navigateToPlayground(page);

    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({});
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    const inpEvents = await page.evaluate(async () => {
      const events: Array<{ web_vitals?: { type: string; value: number } }> = [];

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'web_vitals' && data.web_vitals?.type === 'INP') {
          events.push(data);
        }
      });

      // Simulate multiple clicks (interactions)
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      // Click multiple times
      for (let i = 0; i < 5; i++) {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait for potential INP reports
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return events;
    });

    // With reportAllChanges: false, INP should not report after every interaction
    // Should report final value or not at all
    expect(inpEvents.length).toBeLessThanOrEqual(1);

    console.log('INP events captured:', inpEvents.length);
  });
});
