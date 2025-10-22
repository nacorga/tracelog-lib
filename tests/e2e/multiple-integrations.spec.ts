/**
 * Multiple Integrations Simultaneous Test
 *
 * Validates that multiple integrations can run simultaneously without conflicts.
 * Tests Google Analytics + Custom backend together.
 *
 * Critical for ensuring integrations don't interfere with each other.
 *
 * NOTE: TraceLog SaaS integration cannot be tested in localhost E2E tests
 * because it requires a valid domain (not localhost/IP). Use custom integration for E2E.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Multiple Integrations Simultaneous', () => {
  test('should handle Google Analytics + Custom backend simultaneously', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const events: unknown[] = [];

      window.__traceLogBridge.on('event', (data: unknown) => {
        events.push(data);
      });

      // Initialize with multiple integrations (Google Analytics + Custom)
      await window.__traceLogBridge.init({
        samplingRate: 1,
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
          custom: {
            collectApiUrl: 'http://localhost:8080/collect',
            allowHttp: true,
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send custom event
      window.__traceLogBridge.sendCustomEvent('multi_integration_test', {
        source: 'e2e_test',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        initialized: window.__traceLogBridge.initialized,
        eventsTracked: events.length,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.eventsTracked).toBeGreaterThan(0);
  });

  test('should track multiple event types across integrations', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const events: { type: string }[] = [];

      window.__traceLogBridge.on('event', (data: unknown) => {
        const event = data as { type: string };
        events.push(event);
      });

      // Initialize with Google + Custom
      await window.__traceLogBridge.init({
        samplingRate: 1,
        integrations: {
          google: {
            measurementId: 'G-TEST456',
          },
          custom: {
            collectApiUrl: 'http://localhost:8080/custom-collect',
            allowHttp: true,
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send multiple event types
      window.__traceLogBridge.sendCustomEvent('multi_type_test', {
        test: 'multiple_events',
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Create button and click
      const button = document.createElement('button');
      button.textContent = 'Integration Test Button';
      button.id = 'multi-int-btn';
      document.body.appendChild(button);
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 300));

      button.remove();

      const customEvents = events.filter((e) => e.type === 'custom');
      const clickEvents = events.filter((e) => e.type === 'click');

      return {
        initialized: window.__traceLogBridge.initialized,
        totalEvents: events.length,
        customEvents: customEvents.length,
        clickEvents: clickEvents.length,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.totalEvents).toBeGreaterThan(0);

    // Verify both custom and click events were tracked
    expect(result.customEvents).toBeGreaterThan(0);
    expect(result.clickEvents).toBeGreaterThan(0);
  });

  test('should emit events to listeners even if integrations fail', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const events: unknown[] = [];

      window.__traceLogBridge.on('event', (data: unknown) => {
        events.push(data);
      });

      // Initialize with invalid Google Analytics config (should fail gracefully)
      await window.__traceLogBridge.init({
        samplingRate: 1,
        integrations: {
          google: {
            measurementId: 'INVALID-ID',
          },
          custom: {
            collectApiUrl: 'http://invalid-domain-12345.com/collect',
            allowHttp: true,
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send event (should still be emitted to listeners)
      window.__traceLogBridge.sendCustomEvent('fail_gracefully_test', {
        expected: 'event_still_emitted',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        initialized: window.__traceLogBridge.initialized,
        eventsEmitted: events.length,
      };
    });

    // Library should still initialize
    expect(result.initialized).toBe(true);

    // Events should still be emitted to listeners even if integrations fail
    expect(result.eventsEmitted).toBeGreaterThan(0);
  });

  test('should work with no integrations (local-only mode)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const events: unknown[] = [];

      window.__traceLogBridge.on('event', (data: unknown) => {
        events.push(data);
      });

      // Initialize WITHOUT any integrations
      await window.__traceLogBridge.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send custom event
      window.__traceLogBridge.sendCustomEvent('local_only_test', {
        mode: 'no_integrations',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        initialized: window.__traceLogBridge.initialized,
        eventsTracked: events.length,
      };
    });

    // Should work perfectly without integrations
    expect(result.initialized).toBe(true);
    expect(result.eventsTracked).toBeGreaterThan(0);
  });
});
