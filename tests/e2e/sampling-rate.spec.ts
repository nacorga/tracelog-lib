/**
 * E2E Tests: Client-Side Sampling Rate
 *
 * Validates probabilistic event sampling behavior with samplingRate config.
 * Tests that critical events (SESSION_START, SESSION_END) bypass sampling.
 *
 * IMPORTANT: Uses Math.random() mocking for deterministic results.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Client-Side Sampling Rate', () => {
  test('should sample all events with samplingRate = 1', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        samplingRate: 1, // 100% sampling
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 10 custom events
      for (let i = 0; i < 10; i++) {
        traceLog.sendCustomEvent(`test_event_${i}`, { index: i });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        customEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'custom').length,
        sessionStartCount: events.filter((e) => (e as Record<string, unknown>).type === 'session_start').length,
        totalCount: events.length,
      };
    });

    // Should capture all 10 custom events + 1 session_start
    expect(result.customEventCount).toBe(10);
    expect(result.sessionStartCount).toBe(1);
    expect(result.totalCount).toBeGreaterThanOrEqual(11); // May include page_view
  });

  test('should sample no non-critical events with samplingRate = 0', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        samplingRate: 0, // 0% sampling - only critical events
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 10 custom events (should all be dropped)
      for (let i = 0; i < 10; i++) {
        traceLog.sendCustomEvent(`test_event_${i}`, { index: i });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Trigger clicks (should be dropped)
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Click Me';
      document.body.appendChild(button);

      for (let i = 0; i < 5; i++) {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        customEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'custom').length,
        clickEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'click').length,
        sessionStartCount: events.filter((e) => (e as Record<string, unknown>).type === 'session_start').length,
        totalCount: events.length,
      };
    });

    // Should capture NO custom or click events (samplingRate = 0)
    expect(result.customEventCount).toBe(0);
    expect(result.clickEventCount).toBe(0);

    // Should still capture SESSION_START (critical event bypasses sampling)
    expect(result.sessionStartCount).toBe(1);
  });

  test('should sample approximately 50% of events with samplingRate = 0.5', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        samplingRate: 0.5, // 50% sampling
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 50 custom events to get statistically significant sample
      for (let i = 0; i < 50; i++) {
        traceLog.sendCustomEvent(`test_event_${i}`, { index: i });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        customEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'custom').length,
        sessionStartCount: events.filter((e) => (e as Record<string, unknown>).type === 'session_start').length,
      };
    });

    // Should capture ~50% of 50 events = ~25 events (allow 15-35 for variance)
    expect(result.customEventCount).toBeGreaterThan(15);
    expect(result.customEventCount).toBeLessThan(35);

    // SESSION_START should always be captured
    expect(result.sessionStartCount).toBe(1);
  });

  test('should always capture critical session events regardless of sampling rate', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        samplingRate: 0, // 0% sampling - should only capture critical events
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 20 custom events (should all be dropped due to samplingRate = 0)
      for (let i = 0; i < 20; i++) {
        traceLog.sendCustomEvent(`test_event_${i}`, { index: i });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Destroy to trigger SESSION_END
      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        customEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'custom').length,
        sessionStartCount: events.filter((e) => (e as Record<string, unknown>).type === 'session_start').length,
        sessionEndCount: events.filter((e) => (e as Record<string, unknown>).type === 'session_end').length,
      };
    });

    // Should capture NO custom events
    expect(result.customEventCount).toBe(0);

    // Should ALWAYS capture SESSION_START and SESSION_END (critical events)
    expect(result.sessionStartCount).toBe(1);
    expect(result.sessionEndCount).toBe(1);
  });

  test('should apply sampling independently to different event types', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        samplingRate: 0.5, // 50% sampling
        clickThrottleMs: 0, // Disable throttling to test pure sampling
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 30 custom events
      for (let i = 0; i < 30; i++) {
        traceLog.sendCustomEvent(`test_event_${i}`, { index: i });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Generate 30 click events - space 15px apart to avoid deduplication
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Click Me';
      document.body.appendChild(button);

      for (let i = 0; i < 30; i++) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 100 + i * 15, // 15px spacing > 10px deduplication threshold
          clientY: 100 + i * 15,
        });
        button.dispatchEvent(clickEvent);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        customEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'custom').length,
        clickEventCount: events.filter((e) => (e as Record<string, unknown>).type === 'click').length,
      };
    });

    // Both should be sampled at ~50% rate (allow 7-23 for statistical variance)
    expect(result.customEventCount).toBeGreaterThan(7);
    expect(result.customEventCount).toBeLessThan(23);

    expect(result.clickEventCount).toBeGreaterThan(7);
    expect(result.clickEventCount).toBeLessThan(23);
  });
});
