/**
 * Dynamic Scroll Containers E2E Test
 *
 * Tests scroll tracking with containers that appear after initialization
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Dynamic Scroll Containers', () => {
  test('should track scroll in delayed container', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      const events: any[] = [];

      await window.__traceLogBridge!.init({});

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'scroll') {
          events.push(data);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      document.body.innerHTML +=
        '<div class="delayed" style="overflow: auto; height: 300px;"><div style="height: 2000px;"></div></div>';

      // Wait for all retry attempts to complete (5 attempts × 200ms = 1000ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const container = document.querySelector('.delayed') as HTMLElement;
      if (container) {
        container.scrollTop = 100;
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return {
        events,
        containerExists: !!container,
      };
    });

    expect(result.containerExists).toBe(true);
    expect(result.events.length).toBe(1);

    // Verify scroll data structure for dynamic container
    const scrollEvent = result.events[0];
    expect(scrollEvent.scroll_data).toBeDefined();
    expect(scrollEvent.scroll_data.container_selector).toBe('.delayed');
    // is_primary is false when window is scrollable (which it is in playground)
    expect(typeof scrollEvent.scroll_data.is_primary).toBe('boolean');
  });

  test('should fallback to window', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      const events: any[] = [];

      await window.__traceLogBridge!.init({});

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'scroll') {
          events.push(data);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      window.scrollTo(0, 500);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        events,
      };
    });

    expect(result.events.length).toBeGreaterThan(0);
  });
});
