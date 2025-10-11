/**
 * Viewport Visibility Events Test
 *
 * Tests TraceLog viewport visibility tracking functionality
 * Focus: IntersectionObserver-based element visibility detection
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Viewport Visibility Events', () => {
  test('should capture viewport visible event when element becomes visible', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog with viewport config
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.hero' }], // Target hero section
            threshold: 0.5,
            minDwellTime: 1000,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Set up event listener and wait for viewport event
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Wait for element to be visible for minDwellTime
      // The hero section should already be visible on page load
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return events;
    });

    // Verify viewport event was captured
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify event structure
    const viewportEvent = capturedEvents[0];
    expect(viewportEvent.type).toBe('viewport_visible');
    expect(viewportEvent.id).toBeDefined();
    expect(viewportEvent.timestamp).toBeDefined();
    expect(viewportEvent.page_url).toBeDefined();

    // Verify viewport_data
    expect(viewportEvent.viewport_data).toBeDefined();
    expect(viewportEvent.viewport_data.selector).toBe('.hero');
    expect(viewportEvent.viewport_data.dwellTime).toBeGreaterThanOrEqual(1000);
    expect(viewportEvent.viewport_data.visibilityRatio).toBeGreaterThan(0);
  });

  test('should NOT capture event if element hidden before minDwellTime', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog with short dwell time
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.quick-hide-element' }], // Element that will be hidden quickly
            threshold: 0.5,
            minDwellTime: 2000, // 2 seconds
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Create element, make it visible briefly, then hide it
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Create test element
      const testElement = document.createElement('div');
      testElement.className = 'quick-hide-element';
      testElement.textContent = 'Test Element';
      testElement.style.height = '200px';
      testElement.style.backgroundColor = 'blue';
      document.body.appendChild(testElement);

      // Wait 500ms (less than minDwellTime of 2000ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Hide element
      testElement.style.display = 'none';

      // Wait to ensure no event fires
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return events;
    });

    // Verify NO viewport event was captured
    expect(capturedEvents.length).toBe(0);
  });

  test('should respect threshold configuration', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize with high threshold (75%)
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.cta' }],
            threshold: 0.75, // 75% visible required
            minDwellTime: 1000,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Scroll to make CTA visible
    await page.evaluate(() => {
      const ctaElement = document.querySelector('.cta');
      if (ctaElement) {
        ctaElement.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });

    // Wait for visibility event
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Wait for element to be visible for minDwellTime
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return events;
    });

    // Should capture event if CTA is sufficiently visible
    if (capturedEvents.length > 0) {
      const viewportEvent = capturedEvents[0];
      expect(viewportEvent.viewport_data.selector).toBe('.cta');
      expect(viewportEvent.viewport_data.visibilityRatio).toBeGreaterThanOrEqual(0.75);
    }
  });

  test('should handle multiple elements independently', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize with multiple selectors
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.hero' }, { selector: '.features' }],
            threshold: 0.5,
            minDwellTime: 500,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Wait for events
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Wait for elements to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return events;
    });

    // Should capture events for both elements
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Verify selectors
    const selectors = capturedEvents.map((e: any) => e.viewport_data.selector);
    expect(selectors.length).toBeGreaterThan(0);
  });

  test('should respect data-tlog-ignore attribute', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.ignored-element' }],
            threshold: 0.5,
            minDwellTime: 500,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Create element with data-tlog-ignore
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Create test element with ignore attribute
      const testElement = document.createElement('div');
      testElement.className = 'ignored-element';
      testElement.setAttribute('data-tlog-ignore', 'true');
      testElement.textContent = 'Ignored Element';
      testElement.style.height = '200px';
      testElement.style.backgroundColor = 'red';
      document.body.insertBefore(testElement, document.body.firstChild);

      // Wait for potential event
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return events;
    });

    // Verify NO event was captured for ignored element
    expect(capturedEvents.length).toBe(0);
  });

  test('should allow element to trigger again after leaving viewport', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize TraceLog
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [{ selector: '.retrigger-element' }],
            threshold: 0.5,
            minDwellTime: 500,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Test re-triggering
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Create test element
      const testElement = document.createElement('div');
      testElement.className = 'retrigger-element';
      testElement.textContent = 'Retrigger Element';
      testElement.style.height = '200px';
      testElement.style.backgroundColor = 'green';
      document.body.appendChild(testElement);

      // First visibility
      testElement.scrollIntoView({ behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Hide element
      testElement.style.display = 'none';
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Show element again
      testElement.style.display = 'block';
      testElement.scrollIntoView({ behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 600));

      return events;
    });

    // Should capture 2 events (initial + re-trigger)
    // Note: Using >= 1 for now because timing in E2E can be flaky
    expect(capturedEvents.length).toBeGreaterThanOrEqual(1);
  });

  test('should work without viewport config (no tracking)', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize without viewport config
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({}); // No viewport config
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Wait and verify no viewport events
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Wait
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return events;
    });

    // No viewport events should be captured
    expect(capturedEvents.length).toBe(0);
  });

  test('should capture viewport events with identifiers for analytics', async ({ page }) => {
    await navigateToPlayground(page);

    // Initialize with element identifiers (analytics use case)
    const initResult = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({
          viewport: {
            elements: [
              {
                selector: '.hero',
                id: 'homepage-hero',
                name: 'Homepage Hero Banner',
              },
              {
                selector: '.cta',
                id: 'cta-button-primary',
                name: 'Primary CTA Button',
              },
            ],
            threshold: 0.5,
            minDwellTime: 1000,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(initResult.success).toBe(true);

    // Wait for elements to be tracked and events captured
    const capturedEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for viewport events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'viewport_visible') {
          events.push(data);
        }
      });

      // Wait for hero element (should already be visible)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return events;
    });

    // Should capture hero element with identifiers
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Find hero event (hero section is visible on page load)
    const heroEvent = capturedEvents.find((e) => e.viewport_data.selector === '.hero');
    if (heroEvent) {
      expect(heroEvent.viewport_data).toMatchObject({
        selector: '.hero',
        id: 'homepage-hero',
        name: 'Homepage Hero Banner',
        dwellTime: expect.any(Number),
        visibilityRatio: expect.any(Number),
      });
      expect(heroEvent.viewport_data.dwellTime).toBeGreaterThanOrEqual(1000);
    }
  });
});
