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

      await window.__traceLogBridge!.init({});

      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'scroll') {
          events.push(data);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const container = document.querySelector('#scroll-box') as HTMLElement;

      container.scrollTop = 800;
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { events, hasScrollData: events.length > 0 && !!events[0].scroll_data };
    });

    expect(result.hasScrollData).toBe(true);
    if (result.events.length > 0) {
      const scrollData = result.events[0].scroll_data;
      // Verify all 6 scroll_data fields
      expect(scrollData).toHaveProperty('depth');
      expect(scrollData).toHaveProperty('direction');
      expect(scrollData).toHaveProperty('container_selector');
      expect(scrollData).toHaveProperty('is_primary');
      expect(scrollData).toHaveProperty('velocity');
      expect(scrollData).toHaveProperty('max_depth_reached');

      // Type validation
      expect(typeof scrollData.depth).toBe('number');
      expect(['up', 'down']).toContain(scrollData.direction);
      expect(typeof scrollData.container_selector).toBe('string');
      expect(typeof scrollData.is_primary).toBe('boolean');
      expect(typeof scrollData.velocity).toBe('number');
      expect(typeof scrollData.max_depth_reached).toBe('number');
    }
  });
});
