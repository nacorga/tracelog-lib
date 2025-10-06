/**
 * Scroll Core Behavior E2E Test
 *
 * Tests core scroll functionality: depth calculation, direction detection
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Scroll Core Behavior', () => {
  test('should track scroll events with depth and direction', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      const events: any[] = [];

      document.body.innerHTML =
        '<div id="scroll-box" style="overflow: auto; height: 400px;"><div style="height: 2000px; background: linear-gradient(red, blue);"></div></div>';

      await window.__traceLogBridge!.init({
        scrollContainerSelectors: '#scroll-box',
      });

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'scroll') {
          events.push(data);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const container = document.querySelector('#scroll-box') as HTMLElement;

      container.scrollTop = 800;
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { events, hasScrollData: events.length > 0 && !!events[0].scroll_data };
    });

    expect(result.hasScrollData).toBe(true);
    if (result.events.length > 0) {
      expect(result.events[0].scroll_data).toHaveProperty('depth');
      expect(result.events[0].scroll_data).toHaveProperty('direction');
    }
  });
});
