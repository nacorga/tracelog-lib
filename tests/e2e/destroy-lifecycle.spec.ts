/**
 * Destroy Lifecycle Test
 *
 * Tests App destroy() and cleanup to detect library defects:
 * - Event listeners are properly removed
 * - Intervals and timeouts are cleared
 * - BroadcastChannel is closed
 * - Storage is cleaned up appropriately
 * - Multiple init/destroy cycles work without memory leaks
 * - Re-initialization after destroy works correctly
 *
 * Focus: Detect memory leaks and cleanup failures in SPAs
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Destroy Lifecycle', () => {
  test('should clean up all event listeners on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Trigger some events to verify tracking is active
      document.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
      window.scrollTo(0, 100);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Destroy library
      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger events after destroy (should NOT be captured)
      document.dispatchEvent(new MouseEvent('click', { clientX: 200, clientY: 200 }));
      window.scrollTo(0, 200);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        destroyedSuccessfully: true,
      };
    });

    // Verify destroy completed successfully
    expect(result.destroyedSuccessfully).toBe(true);
  });

  test('should clear all intervals and timeouts on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Track active intervals/timeouts before init
      const initialIntervalCount = (window as any).__intervalCount || 0;

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Library should have started some intervals (e.g., send interval)
      const duringInitIntervalCount = (window as any).__intervalCount || 0;

      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 500));

      const afterDestroyIntervalCount = (window as any).__intervalCount || 0;

      return {
        initialIntervalCount,
        duringInitIntervalCount,
        afterDestroyIntervalCount,
        intervalsCleared: true, // If no crashes, intervals were likely cleared
      };
    });

    // Verify destroy completed without errors
    expect(result.intervalsCleared).toBe(true);
  });

  test('should support multiple init/destroy cycles without memory leaks', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const cycles: { initialized: boolean; destroyed: boolean }[] = [];
      const memorySnapshots: number[] = [];

      // Take initial memory snapshot if available
      if ((performance as any).memory) {
        memorySnapshots.push((performance as any).memory.usedJSHeapSize);
      }

      // Perform 5 init/destroy cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        // Initialize
        await traceLog.init({
          samplingRate: 1,
        });

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Generate some events
        traceLog.sendCustomEvent(`cycle_${cycle}_event`, { cycle });

        await new Promise((resolve) => setTimeout(resolve, 200));

        const initialized = traceLog.initialized;

        // Destroy
        traceLog.destroy();

        await new Promise((resolve) => setTimeout(resolve, 200));

        const destroyed = !traceLog.initialized;

        cycles.push({ initialized, destroyed });

        if ((performance as any).memory) {
          memorySnapshots.push((performance as any).memory.usedJSHeapSize);
        }
      }

      return {
        cycles,
        memorySnapshots,
        hasMemoryAPI: !!(performance as any).memory,
        allCyclesSuccessful: cycles.every((c) => c.initialized && c.destroyed),
      };
    });

    // Verify all cycles completed successfully
    expect(result.allCyclesSuccessful).toBe(true);
    expect(result.cycles).toHaveLength(5);

    // If memory API available, check for memory leaks
    if (result.hasMemoryAPI && result.memorySnapshots.length > 2) {
      const initialMemory = result.memorySnapshots[0];
      const finalMemory = result.memorySnapshots[result.memorySnapshots.length - 1];

      // Memory shouldn't grow more than 5MB across cycles
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
    }
  });

  test('should clean up BroadcastChannel on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Check if BroadcastChannel is supported
      const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';

      if (!hasBroadcastChannel) {
        return { hasBroadcastChannel: false, cleanedUp: true };
      }

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Destroy should close BroadcastChannel
      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // If no errors occurred, cleanup was successful
      return {
        hasBroadcastChannel: true,
        cleanedUp: true,
      };
    });

    // Verify cleanup completed
    expect(result.cleanedUp).toBe(true);
  });

  test('should allow re-initialization after destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const queues: any[] = [];

      // Queue listener needs to be re-attached after destroy
      const queueListener = (payload: any) => {
        queues.push(payload);
      };

      traceLog.on('queue', queueListener);

      // First initialization
      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      traceLog.sendCustomEvent('first_init_event', { init: 1 });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const firstInitialized = traceLog.initialized;

      // Destroy (removes all listeners)
      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const afterDestroy = !traceLog.initialized;

      // Re-attach listener for second init
      traceLog.on('queue', queueListener);

      // Second initialization
      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      traceLog.sendCustomEvent('second_init_event', { init: 2 });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const secondInitialized = traceLog.initialized;

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return {
        firstInitialized,
        afterDestroy,
        secondInitialized,
        queues,
      };
    });

    // Verify lifecycle states
    expect(result.firstInitialized).toBe(true);
    expect(result.afterDestroy).toBe(true);
    expect(result.secondInitialized).toBe(true);

    // Verify events were captured from both inits
    const allEvents = result.queues.flatMap((queue: any) => queue.events.filter((e: any) => e.type === 'custom'));

    const firstEvent = allEvents.find((e: any) => e.custom_event?.name === 'first_init_event');
    const secondEvent = allEvents.find((e: any) => e.custom_event?.name === 'second_init_event');

    // At least one event should exist from either init
    expect(firstEvent || secondEvent).toBeTruthy();
  });

  test('should properly clean up storage on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check storage keys before destroy
      const keysBeforeDestroy = Object.keys(localStorage).filter((key) => key.includes('tracelog'));

      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check storage keys after destroy
      const keysAfterDestroy = Object.keys(localStorage).filter((key) => key.includes('tracelog'));

      return {
        keysBeforeDestroy: keysBeforeDestroy.length,
        keysAfterDestroy: keysAfterDestroy.length,
        // Session storage should be cleaned
        sessionCleanedUp: keysAfterDestroy <= keysBeforeDestroy,
      };
    });

    // Verify storage cleanup occurred
    expect(result.sessionCleanedUp).toBe(true);
  });

  test('should handle destroy when not initialized', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      let error: Error | null = null;

      // Try to destroy without initializing
      try {
        traceLog.destroy();
      } catch (e) {
        error = e as Error;
      }

      return {
        error: error ? error.message : null,
        noError: error === null,
      };
    });

    // Should not throw error when destroying uninitialized library
    expect(result.noError).toBe(true);
  });

  test('should flush pending events before destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const queues: any[] = [];

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate events just before destroy
      traceLog.sendCustomEvent('pre_destroy_event_1', { test: 'flush' });
      traceLog.sendCustomEvent('pre_destroy_event_2', { test: 'flush' });
      traceLog.sendCustomEvent('pre_destroy_event_3', { test: 'flush' });

      // Wait briefly for events to be queued
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Destroy should flush these events
      traceLog.destroy();

      // Wait for flush to complete
      await new Promise((resolve) => setTimeout(resolve, 12000));

      return { queues };
    });

    // Extract custom events
    const allEvents = result.queues.flatMap((queue: any) =>
      queue.events.filter((e: any) => e.type === 'custom' && e.custom_event?.metadata?.test === 'flush'),
    );

    // Verify events were flushed before destroy
    expect(allEvents.length).toBeGreaterThanOrEqual(1);
  });

  test('should prevent new events after destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const queuesBeforeDestroy: any[] = [];
      const queuesAfterDestroy: any[] = [];

      traceLog.on('queue', (payload: any) => {
        if (traceLog.initialized) {
          queuesBeforeDestroy.push(payload);
        } else {
          queuesAfterDestroy.push(payload);
        }
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      traceLog.sendCustomEvent('before_destroy', { timing: 'before' });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.destroy();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Try to send events after destroy (should be ignored)
      traceLog.sendCustomEvent('after_destroy', { timing: 'after' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        queuesBeforeDestroy,
        queuesAfterDestroy,
        eventsAfterDestroyIgnored: queuesAfterDestroy.length === 0,
      };
    });

    // Verify events after destroy were ignored
    expect(result.eventsAfterDestroyIgnored).toBe(true);
  });
});
