/**
 * Basic Queue Events Test
 *
 * Tests basic TraceLog queue event functionality without complex abstractions
 * Focus: Library queue event validation only
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Basic Queue Events', () => {
  test('should send queue events automatically', async ({ page }) => {
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

    // Listen for queue events and generate some user activity
    const queueEvents = await page.evaluate(async () => {
      const queues: any[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queues.push(data);
      });

      // Generate some events to be queued
      document
        .querySelector('[data-testid="cta-ver-productos"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      window.__traceLogBridge!.sendCustomEvent('test_event', { test: true });

      // Wait for queue to be sent (realistic mode uses 10-second intervals)
      const startTime = Date.now();
      while (queues.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return queues;
    });

    // Verify queue event was captured
    expect(queueEvents.length).toBeGreaterThan(0);

    // Verify queue event structure
    const queueEvent = queueEvents[0];
    expect(queueEvent).toBeDefined();
    expect(queueEvent.events).toBeDefined();
    expect(Array.isArray(queueEvent.events)).toBe(true);
    expect(queueEvent.events.length).toBeGreaterThan(0);

    // Verify events in queue have proper structure
    const firstEvent = queueEvent.events[0];
    expect(firstEvent.type).toBeDefined();
    expect(firstEvent.timestamp).toBeDefined();
    expect(typeof firstEvent.timestamp).toBe('number');
  });

  test('should include multiple events in queue', async ({ page }) => {
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

    // Generate multiple events and capture queue
    const queueData = await page.evaluate(async () => {
      const queues: any[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queues.push(data);
      });

      // Generate multiple events rapidly
      const button = document.querySelector('[data-testid="cta-ver-productos"]');
      if (button) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 200 }));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 150, clientY: 250 }));
      }

      window.__traceLogBridge!.sendCustomEvent('event_1', { sequence: 1 });
      window.__traceLogBridge!.sendCustomEvent('event_2', { sequence: 2 });

      // Wait for queue to be sent
      const startTime = Date.now();
      while (queues.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return queues;
    });

    // Verify queue contains multiple events
    expect(queueData.length).toBeGreaterThan(0);

    const queueEvent = queueData[0];
    expect(queueEvent.events.length).toBeGreaterThan(1);

    // Verify different event types are included
    const eventTypes = queueEvent.events.map((event: any) => event.type);
    expect(eventTypes.length).toBeGreaterThan(1);
  });

  test('should handle queue events with session information', async ({ page }) => {
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

    // Capture queue with session context
    const sessionQueueData = await page.evaluate(async () => {
      const queues: any[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queues.push(data);
      });

      // Generate some activity
      window.__traceLogBridge!.sendCustomEvent('session_test');

      // Wait for queue
      const startTime = Date.now();
      while (queues.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return queues;
    });

    // Verify queue has session-related data
    expect(sessionQueueData.length).toBeGreaterThan(0);

    const queueEvent = sessionQueueData[0];
    expect(queueEvent.events).toBeDefined();

    // Check if queue has session information (session_id is at queue level, not event level)
    expect(queueEvent.session_id).toBeDefined();
    expect(typeof queueEvent.session_id).toBe('string');
    expect(queueEvent.session_id.length).toBeGreaterThan(0);
  });

  test('should respect queue timing intervals', async ({ page }) => {
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

    // Test queue timing behavior
    const timingData = await page.evaluate(async () => {
      const queueTimes: number[] = [];

      // Listen for queue events and record timing
      window.__traceLogBridge!.on('queue', () => {
        queueTimes.push(Date.now());
      });

      // Generate initial activity
      window.__traceLogBridge!.sendCustomEvent('timing_test');

      // Wait for first queue
      const startTime = Date.now();
      while (queueTimes.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        firstQueueTime: queueTimes[0],
        queueCount: queueTimes.length,
        totalWaitTime: Date.now() - startTime,
      };
    });

    // Verify timing behavior
    expect(timingData.queueCount).toBeGreaterThan(0);
    expect(timingData.totalWaitTime).toBeLessThan(12000);
    expect(timingData.firstQueueTime).toBeDefined();
  });
});
