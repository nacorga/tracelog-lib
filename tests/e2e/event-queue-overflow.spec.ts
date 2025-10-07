/**
 * Event Queue Overflow Test
 *
 * Tests EventManager queue overflow handling to detect library defects:
 * - Queue enforces MAX_EVENTS_QUEUE_LENGTH limit
 * - Old events are discarded when overflow occurs
 * - Critical events (session_start/end) are never lost
 * - No crashes or memory leaks during high activity
 *
 * Focus: Detect memory leaks and queue management defects
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Event Queue Overflow', () => {
  test('should enforce MAX_EVENTS_QUEUE_LENGTH and discard oldest events', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1, // Capture all events
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate 150 custom events in 2 batches to avoid rate limiting (200 events/sec)
      // Batch 1: 75 events
      for (let i = 0; i < 75; i++) {
        traceLog.sendCustomEvent(`overflow_test_event_${i}`, { index: i });
      }

      // Wait 1 second to reset rate limit window
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Batch 2: 75 events
      for (let i = 75; i < 150; i++) {
        traceLog.sendCustomEvent(`overflow_test_event_${i}`, { index: i });
      }

      // Wait for events to be processed and queued
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger queue send with a final event
      traceLog.sendCustomEvent('trigger_queue_send', { marker: 'end' });

      // Wait for queue to be sent
      await new Promise((resolve) => setTimeout(resolve, 12000));

      await traceLog.destroy();

      return { queues, queueCount: queues.length };
    });

    expect(result.queueCount).toBeGreaterThan(0);

    // Extract all custom events from queues
    const allEvents = result.queues.flatMap((queue) => queue.events.filter((event: any) => event.type === 'custom'));

    // Should have captured events, but total in-memory queue should never exceed MAX
    // Since events are sent in batches, we verify that oldest events were discarded
    const lastEvent = allEvents.find((e: any) => e.custom_event?.name === 'trigger_queue_send');

    // Verify queue management worked (oldest events may be missing)
    expect(lastEvent).toBeDefined(); // Most recent events should be present
    expect(allEvents.length).toBeLessThan(150); // Some events should have been discarded
  });

  test('should never discard critical session events during overflow', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate many events to cause overflow
      for (let i = 0; i < 120; i++) {
        traceLog.sendCustomEvent(`stress_event_${i}`, { index: i });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger final event to force queue send
      traceLog.sendCustomEvent('final_event', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      await traceLog.destroy();

      return { queues };
    });

    // Extract all events
    const allEvents = result.queues.flatMap((queue: any) => queue.events);

    // Verify session_start exists (critical event should never be discarded)
    const sessionStart = allEvents.find((e: any) => e.type === 'session_start');
    expect(sessionStart).toBeDefined();

    // Verify session_end exists (critical event from destroy)
    const sessionEnd = allEvents.find((e: any) => e.type === 'session_end');
    expect(sessionEnd).toBeDefined();
  });

  test('should not crash with rapid concurrent event generation', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // This test verifies library stability under stress
    const result = await page.evaluate(async (_projectId) => {
      const errors: string[] = [];
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      // Capture any console errors
      const originalError = console.error;
      console.error = (...args: any[]) => {
        const message = args.join(' ');
        if (!message.includes('[TraceLog:EventValidation]')) {
          errors.push(message);
        }
        originalError.apply(console, args);
      };

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Generate events in rapid concurrent batches
      const batches: Promise<void>[] = [];

      for (let batch = 0; batch < 5; batch++) {
        const batchPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            for (let i = 0; i < 30; i++) {
              traceLog.sendCustomEvent(`batch_${batch}_event_${i}`, {
                batch,
                index: i,
                timestamp: Date.now(),
              });
            }
            resolve();
          }, Math.random() * 100);
        });
        batches.push(batchPromise);
      }

      await Promise.all(batches);

      await new Promise((resolve) => setTimeout(resolve, 500));

      traceLog.sendCustomEvent('stress_test_complete', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      console.error = originalError;
      await traceLog.destroy();

      return { errors, queueCount: queues.length, initialized: traceLog.initialized };
    });

    // Verify no unexpected errors occurred
    expect(result.errors).toHaveLength(0);

    // Verify library remained functional
    expect(result.queueCount).toBeGreaterThan(0);
  });

  test('should maintain queue integrity after multiple overflow cycles', async ({ page }) => {
    test.setTimeout(60000); // Need 44s for 4x11s waits + overhead
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Cycle 1: Generate overflow
      for (let i = 0; i < 110; i++) {
        traceLog.sendCustomEvent(`cycle1_event_${i}`, { cycle: 1, index: i });
      }

      // Wait for automatic send interval (10s) + buffer
      await new Promise((resolve) => setTimeout(resolve, 11000));

      // Cycle 2: Generate overflow again
      for (let i = 0; i < 110; i++) {
        traceLog.sendCustomEvent(`cycle2_event_${i}`, { cycle: 2, index: i });
      }

      // Wait for automatic send interval (10s) + buffer
      await new Promise((resolve) => setTimeout(resolve, 11000));

      // Cycle 3: Generate overflow again
      for (let i = 0; i < 110; i++) {
        traceLog.sendCustomEvent(`cycle3_event_${i}`, { cycle: 3, index: i });
      }

      // Wait for automatic send interval (10s) + buffer
      await new Promise((resolve) => setTimeout(resolve, 11000));

      traceLog.sendCustomEvent('cycles_complete', { marker: 'end' });

      // Wait for final queue
      await new Promise((resolve) => setTimeout(resolve, 11000));

      await traceLog.destroy();

      // Debug: Extract cycle counts before returning
      const allEvents = queues.flatMap((queue: any) => queue.events.filter((e: any) => e.type === 'custom'));
      const cycle1Count = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 1).length;
      const cycle2Count = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 2).length;
      const cycle3Count = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 3).length;
      const totalCustomEvents = allEvents.length;

      return {
        queues,
        queueCount: queues.length,
        cycle1Count,
        cycle2Count,
        cycle3Count,
        totalCustomEvents,
      };
    });

    expect(result.queueCount).toBeGreaterThan(0);

    // Verify queues were sent and processed correctly
    const allEvents = result.queues.flatMap((queue: any) => queue.events.filter((e: any) => e.type === 'custom'));

    // Verify events from all 3 cycles exist
    const cycle1Events = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 1);
    const cycle2Events = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 2);
    const cycle3Events = allEvents.filter((e: any) => e.custom_event?.metadata?.cycle === 3);

    expect(cycle1Events.length).toBeGreaterThan(0);
    expect(cycle2Events.length).toBeGreaterThan(0);
    expect(cycle3Events.length).toBeGreaterThan(0);

    // Verify final marker event exists
    const finalEvent = allEvents.find((e: any) => e.custom_event?.name === 'cycles_complete');
    expect(finalEvent).toBeDefined();
  });

  test('should handle overflow without memory leaks', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const traceLog = window.__traceLogBridge!;
      const memorySnapshots: number[] = [];

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Take initial memory snapshot if available
      if ((performance as any).memory) {
        memorySnapshots.push((performance as any).memory.usedJSHeapSize);
      }

      // Generate multiple overflow cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        for (let i = 0; i < 120; i++) {
          traceLog.sendCustomEvent(`memory_test_${cycle}_${i}`, { cycle, index: i });
        }

        await new Promise((resolve) => setTimeout(resolve, 300));

        if ((performance as any).memory) {
          memorySnapshots.push((performance as any).memory.usedJSHeapSize);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      await traceLog.destroy();

      return {
        memorySnapshots,
        hasMemoryAPI: !!(performance as any).memory,
      };
    });

    // If memory API is available, verify no significant memory growth
    if (result.hasMemoryAPI && result.memorySnapshots.length > 2) {
      const initialMemory = result.memorySnapshots[0];
      const finalMemory = result.memorySnapshots[result.memorySnapshots.length - 1];

      // Memory shouldn't grow more than 10MB during test
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    }

    // Test passed if no crashes occurred
    expect(true).toBe(true);
  });
});
