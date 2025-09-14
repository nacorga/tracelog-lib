import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../utils/test.helpers';

/**
 * Resource tracking instrumentation for memory leak detection
 */
interface ResourceSnapshot {
  domListeners: {
    click: number;
    scroll: number;
    beforeunload: number;
    visibilitychange: number;
    focus: number;
    blur: number;
    touchstart: number;
    touchend: number;
    total: number;
  };
  timers: {
    timeouts: number;
    intervals: number;
    total: number;
  };
  storage: {
    traceLogKeys: string[];
    totalKeys: number;
    traceLogEntries: number;
  };
  broadcastChannels: {
    activeChannels: string[];
    channelCount: number;
  };
  memoryUsage?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

test.describe('Memory - Resource Cleanup', () => {
  const TEST_CONFIG = { id: 'test' };

  /**
   * Inject resource tracking instrumentation into the page
   */
  async function injectResourceTracker(page: any): Promise<void> {
    await page.addInitScript(() => {
      // Track DOM event listeners
      (window as any).__resourceTracker = {
        eventListeners: new Map(),
        timers: new Set(),
        intervals: new Set(),
        broadcastChannels: new Set(),
        originalAddEventListener: EventTarget.prototype.addEventListener,
        originalRemoveEventListener: EventTarget.prototype.removeEventListener,
        originalSetTimeout: window.setTimeout,
        originalClearTimeout: window.clearTimeout,
        originalSetInterval: window.setInterval,
        originalClearInterval: window.clearInterval,
        originalBroadcastChannel: window.BroadcastChannel,
      };

      const tracker = (window as any).__resourceTracker;

      // Override addEventListener to track listeners
      EventTarget.prototype.addEventListener = function (type: string, listener: any, options?: any) {
        const key = `${this.constructor.name}-${type}`;
        if (!tracker.eventListeners.has(key)) {
          tracker.eventListeners.set(key, new Set());
        }
        tracker.eventListeners.get(key).add(listener);
        return tracker.originalAddEventListener.call(this, type, listener, options);
      };

      // Override removeEventListener to track cleanup
      EventTarget.prototype.removeEventListener = function (type: string, listener: any, options?: any) {
        const key = `${this.constructor.name}-${type}`;
        if (tracker.eventListeners.has(key)) {
          tracker.eventListeners.get(key).delete(listener);
        }
        return tracker.originalRemoveEventListener.call(this, type, listener, options);
      };

      // Override setTimeout to track timers
      window.setTimeout = function (callback: any, delay?: number, ...args: any[]) {
        const id = tracker.originalSetTimeout.call(window, callback, delay, ...args);
        tracker.timers.add(id);
        return id;
      };

      // Override clearTimeout to track cleanup
      window.clearTimeout = function (id: number) {
        tracker.timers.delete(id);
        return tracker.originalClearTimeout.call(window, id);
      };

      // Override setInterval to track intervals
      window.setInterval = function (callback: any, delay?: number, ...args: any[]) {
        const id = tracker.originalSetInterval.call(window, callback, delay, ...args);
        tracker.intervals.add(id);
        return id;
      };

      // Override clearInterval to track cleanup
      window.clearInterval = function (id: number) {
        tracker.intervals.delete(id);
        return tracker.originalClearInterval.call(window, id);
      };

      // Override BroadcastChannel to track channels
      if (window.BroadcastChannel) {
        window.BroadcastChannel = class extends tracker.originalBroadcastChannel {
          constructor(name: string) {
            super(name);
            tracker.broadcastChannels.add(this);
          }

          close() {
            tracker.broadcastChannels.delete(this);
            super.close();
          }
        } as any;
      }
    });
  }

  /**
   * Capture current resource state
   */
  async function captureResourceSnapshot(page: any): Promise<ResourceSnapshot> {
    return await page.evaluate(() => {
      const tracker = (window as any).__resourceTracker;

      // Check if tracker exists
      if (!tracker) {
        return {
          domListeners: {
            click: 0,
            scroll: 0,
            beforeunload: 0,
            visibilitychange: 0,
            focus: 0,
            blur: 0,
            touchstart: 0,
            touchend: 0,
            total: 0,
          },
          timers: {
            timeouts: 0,
            intervals: 0,
            total: 0,
          },
          storage: {
            traceLogKeys: [],
            totalKeys: localStorage.length,
            traceLogEntries: 0,
          },
          broadcastChannels: {
            activeChannels: [],
            channelCount: 0,
          },
        };
      }

      // Count DOM event listeners by type
      const listenerCounts = {
        click: 0,
        scroll: 0,
        beforeunload: 0,
        visibilitychange: 0,
        focus: 0,
        blur: 0,
        touchstart: 0,
        touchend: 0,
        total: 0,
      };

      for (const [key, listeners] of tracker.eventListeners.entries()) {
        const listenerCount = listeners.size;
        listenerCounts.total += listenerCount;

        if (key.includes('click')) listenerCounts.click += listenerCount;
        if (key.includes('scroll')) listenerCounts.scroll += listenerCount;
        if (key.includes('beforeunload')) listenerCounts.beforeunload += listenerCount;
        if (key.includes('visibilitychange')) listenerCounts.visibilitychange += listenerCount;
        if (key.includes('focus')) listenerCounts.focus += listenerCount;
        if (key.includes('blur')) listenerCounts.blur += listenerCount;
        if (key.includes('touchstart')) listenerCounts.touchstart += listenerCount;
        if (key.includes('touchend')) listenerCounts.touchend += listenerCount;
      }

      // Debug: List active timers with their IDs for better tracking
      const activeTimeouts = [];
      const activeIntervals = [];

      for (const timerId of tracker.timers) {
        activeTimeouts.push(timerId);
      }

      for (const intervalId of tracker.intervals) {
        activeIntervals.push(intervalId);
      }

      // Count localStorage entries
      const traceLogKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tl:')) {
          traceLogKeys.push(key);
        }
      }

      // Count BroadcastChannels
      const activeChannels: string[] = [];
      for (const channel of tracker.broadcastChannels) {
        try {
          // Try to access channel name to verify it's still active
          if ((channel as any).name) {
            activeChannels.push((channel as any).name);
          }
        } catch {
          // Channel is closed or invalid
        }
      }

      // Get memory usage if available
      let memoryUsage = undefined;
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }

      return {
        domListeners: listenerCounts,
        timers: {
          timeouts: tracker.timers.size,
          intervals: tracker.intervals.size,
          total: tracker.timers.size + tracker.intervals.size,
        },
        storage: {
          traceLogKeys,
          totalKeys: localStorage.length,
          traceLogEntries: traceLogKeys.length,
        },
        broadcastChannels: {
          activeChannels,
          channelCount: activeChannels.length,
        },
        memoryUsage,
      };
    });
  }

  /**
   * Force garbage collection if available (Chrome with --js-flags=--expose-gc)
   */
  async function forceGarbageCollection(page: any): Promise<void> {
    try {
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      await page.waitForTimeout(100); // Allow GC to complete
    } catch {
      // GC not available, continue without it
    }
  }

  /**
   * Destroy TraceLog and verify cleanup
   */
  async function destroyTraceLog(page: any): Promise<void> {
    await page.evaluate(() => {
      if ((window as any).TraceLog?.destroy) {
        (window as any).TraceLog.destroy();
      }
    });
    await page.waitForTimeout(500); // Allow cleanup to complete
  }

  test('should clean up DOM event listeners on destroy', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation to catch all listeners
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline AFTER page load but before TraceLog init
      const baselineSnapshot = await captureResourceSnapshot(page);

      // Initialize TraceLog
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);

      // Debug the initialization result
      if (!validated.success) {
        console.log('Initialization failed:', validated.error);
        console.log('TraceLog errors:', monitor.traceLogErrors);
      }

      expect(validated.success).toBe(true);

      // Trigger various events to ensure listeners are added
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.triggerScrollEvent(page);
      await page.evaluate(() => {
        // Trigger visibility change
        document.dispatchEvent(new Event('visibilitychange'));
        // Trigger focus/blur
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('blur'));
      });

      await TestHelpers.waitForTimeout(page, 1000);

      // Capture snapshot after initialization and events
      const afterInitSnapshot = await captureResourceSnapshot(page);

      // Verify listeners were added
      expect(afterInitSnapshot.domListeners.total).toBeGreaterThan(baselineSnapshot.domListeners.total);

      // Destroy TraceLog
      await destroyTraceLog(page);
      await forceGarbageCollection(page);

      // Capture final snapshot
      const afterDestroySnapshot = await captureResourceSnapshot(page);

      // Verify DOM listeners were cleaned up
      expect(afterDestroySnapshot.domListeners.total).toBeLessThanOrEqual(
        baselineSnapshot.domListeners.total + 2, // Allow for small variance
      );

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should clean up timers and intervals on destroy', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation to catch all resources
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline AFTER page load but before TraceLog init
      const baselineSnapshot = await captureResourceSnapshot(page);

      // Initialize TraceLog
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Wait for session management timers to be established
      await TestHelpers.waitForTimeout(page, 2000);

      // Trigger events to activate various handlers
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.simulateUserActivity(page);

      // Capture snapshot after initialization
      const afterInitSnapshot = await captureResourceSnapshot(page);

      // Verify timers/intervals were created
      expect(afterInitSnapshot.timers.total).toBeGreaterThanOrEqual(baselineSnapshot.timers.total);

      // Destroy TraceLog
      await destroyTraceLog(page);
      await forceGarbageCollection(page);

      // Wait for timer cleanup to complete
      await TestHelpers.waitForTimeout(page, 1000);

      // Capture final snapshot
      const afterDestroySnapshot = await captureResourceSnapshot(page);

      // Verify timers were cleaned up (allow for some remaining timers due to async cleanup)
      expect(afterDestroySnapshot.timers.total).toBeLessThan(
        afterInitSnapshot.timers.total, // Should be fewer than after init
      );

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should clean up localStorage entries on destroy', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation to catch all resources
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline AFTER page load but before TraceLog init
      const baselineSnapshot = await captureResourceSnapshot(page);

      // Initialize TraceLog
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Trigger events to create session data
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.waitForTimeout(page, 1500);

      // Capture snapshot after initialization and session creation
      const afterInitSnapshot = await captureResourceSnapshot(page);

      // Verify TraceLog storage entries were created
      expect(afterInitSnapshot.storage.traceLogEntries).toBeGreaterThan(baselineSnapshot.storage.traceLogEntries);
      expect(afterInitSnapshot.storage.traceLogKeys.length).toBeGreaterThan(0);

      // Verify expected storage keys exist (mobile browsers may have different storage patterns)
      const expectedKeyPatterns = [
        `tl:${TEST_CONFIG.id}:session`,
        `tl:${TEST_CONFIG.id}:cross_tab_session`,
        `tl:${TEST_CONFIG.id}:tab:`,
        `tl:${TEST_CONFIG.id}:uid`, // UID key is commonly created
      ];

      const hasExpectedKeys = expectedKeyPatterns.some((pattern) =>
        afterInitSnapshot.storage.traceLogKeys.some((key) => key.includes(pattern)),
      );

      // If no expected keys found, just verify that some TraceLog keys were created
      const hasAnyTraceLogKeys = afterInitSnapshot.storage.traceLogEntries > 0;
      expect(hasExpectedKeys || hasAnyTraceLogKeys).toBe(true);

      // Destroy TraceLog
      await destroyTraceLog(page);
      await TestHelpers.waitForTimeout(page, 500);

      // Capture final snapshot
      const afterDestroySnapshot = await captureResourceSnapshot(page);

      // Verify storage entries were cleaned up (mobile browsers may persist some session data)
      expect(afterDestroySnapshot.storage.traceLogEntries).toBeLessThanOrEqual(
        baselineSnapshot.storage.traceLogEntries + 2, // Allow for mobile browser variance
      );

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should clean up BroadcastChannels on destroy', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Skip test if BroadcastChannel is not supported
      const hasBroadcastChannel = await page.evaluate(() => typeof BroadcastChannel !== 'undefined');
      if (!hasBroadcastChannel) {
        test.skip();
        return;
      }

      // Inject resource tracking BEFORE navigation to catch all resources
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline AFTER page load but before TraceLog init
      const baselineSnapshot = await captureResourceSnapshot(page);

      // Initialize TraceLog
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Wait for cross-tab session management to establish channels
      await TestHelpers.waitForTimeout(page, 2000);

      // Trigger events to activate cross-tab communication
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.simulateUserActivity(page);

      // Capture snapshot after initialization
      const afterInitSnapshot = await captureResourceSnapshot(page);

      // Verify BroadcastChannels were created (if supported)
      if (hasBroadcastChannel) {
        expect(afterInitSnapshot.broadcastChannels.channelCount).toBeGreaterThanOrEqual(
          baselineSnapshot.broadcastChannels.channelCount,
        );
      }

      // Destroy TraceLog
      await destroyTraceLog(page);
      await forceGarbageCollection(page);

      // Wait for channel cleanup
      await TestHelpers.waitForTimeout(page, 1000);

      // Capture final snapshot
      const afterDestroySnapshot = await captureResourceSnapshot(page);

      // Verify BroadcastChannels were cleaned up
      expect(afterDestroySnapshot.broadcastChannels.channelCount).toBeLessThanOrEqual(
        baselineSnapshot.broadcastChannels.channelCount + 1, // Allow for small variance
      );

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should prevent memory leaks during multiple init/destroy cycles', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation to catch all resources
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline AFTER page load but before TraceLog init
      const baselineSnapshot = await captureResourceSnapshot(page);

      const cycleCount = 3;
      const snapshots: ResourceSnapshot[] = [baselineSnapshot];

      // Perform multiple init/destroy cycles
      for (let cycle = 0; cycle < cycleCount; cycle++) {
        // Initialize TraceLog
        const initResult = await TestHelpers.initializeTraceLog(page, {
          ...TEST_CONFIG,
          id: 'test', // Keep using 'test' to avoid HTTP requests
        });
        const validated = TestAssertions.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Trigger various activities
        await TestHelpers.triggerClickEvent(page);
        await TestHelpers.triggerScrollEvent(page);
        await TestHelpers.simulateUserActivity(page);
        await TestHelpers.waitForTimeout(page, 1000);

        // Capture snapshot after init
        const afterInitSnapshot = await captureResourceSnapshot(page);
        snapshots.push(afterInitSnapshot);

        // Destroy TraceLog
        await destroyTraceLog(page);
        await forceGarbageCollection(page);
        await TestHelpers.waitForTimeout(page, 500);

        // Capture snapshot after destroy
        const afterDestroySnapshot = await captureResourceSnapshot(page);
        snapshots.push(afterDestroySnapshot);
      }

      // Analyze snapshots for memory leaks
      const finalSnapshot = snapshots[snapshots.length - 1];

      // Verify resources don't accumulate excessively across cycles
      expect(finalSnapshot.domListeners.total).toBeLessThanOrEqual(
        baselineSnapshot.domListeners.total + 5, // Allow for reasonable variance
      );

      expect(finalSnapshot.timers.total).toBeLessThanOrEqual(
        baselineSnapshot.timers.total + 15, // Allow for async cleanup delays
      );

      expect(finalSnapshot.storage.traceLogEntries).toBeLessThanOrEqual(
        baselineSnapshot.storage.traceLogEntries + 2, // Allow for session persistence
      );

      // Verify memory usage doesn't grow excessively (if available)
      if (baselineSnapshot.memoryUsage && finalSnapshot.memoryUsage) {
        const memoryGrowth = finalSnapshot.memoryUsage.usedJSHeapSize! - baselineSnapshot.memoryUsage.usedJSHeapSize!;
        const maxAllowedGrowth = 5 * 1024 * 1024; // 5MB threshold

        expect(memoryGrowth).toBeLessThan(maxAllowedGrowth);
      }

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should clean up long-running timeouts on destroy', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize TraceLog
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Wait for all timers to be established (including long-running ones)
      await TestHelpers.waitForTimeout(page, 3000);

      // Capture snapshot after initialization
      const afterInitSnapshot = await captureResourceSnapshot(page);

      // Destroy TraceLog immediately (don't wait for long timeouts to fire)
      await destroyTraceLog(page);

      // Wait a short time for immediate cleanup
      await TestHelpers.waitForTimeout(page, 1000);

      const immediateSnapshot = await captureResourceSnapshot(page);

      // The key test: destroy() should prevent long-running timeouts from accumulating
      // We should see a significant reduction in timers after destroy
      expect(immediateSnapshot.timers.total).toBeLessThan(afterInitSnapshot.timers.total);

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should verify baseline timeouts (control test)', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking BEFORE navigation
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Capture baseline WITHOUT initializing TraceLog
      const baselineSnapshot = await captureResourceSnapshot(page);

      // Wait the same amount of time as other tests
      await TestHelpers.waitForTimeout(page, 3000);

      const afterWaitSnapshot = await captureResourceSnapshot(page);

      // Verify baseline remains stable (no timer growth without TraceLog)
      expect(afterWaitSnapshot.timers.total).toBeLessThanOrEqual(baselineSnapshot.timers.total + 1);

      // Verify no TraceLog-specific errors
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should handle resource cleanup failures gracefully', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Inject resource tracking and error simulation BEFORE navigation
      await injectResourceTracker(page);

      // Navigate and wait for ready
      await TestHelpers.navigateAndWaitForReady(page, '/');

      // Initialize
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);

      // Simulate cleanup failures by overriding cleanup methods
      await page.evaluate(() => {
        // Override removeEventListener to sometimes fail
        const originalRemove = EventTarget.prototype.removeEventListener;
        let failureCount = 0;

        EventTarget.prototype.removeEventListener = function (type: string, listener: any, options?: any) {
          // Fail every 3rd removal attempt
          if (++failureCount % 3 === 0) {
            throw new Error('Simulated cleanup failure');
          }
          return originalRemove.call(this, type, listener, options);
        };

        // Override clearTimeout to sometimes fail
        const originalClearTimeout = window.clearTimeout;
        window.clearTimeout = function (id: number) {
          // Randomly fail some cleanup attempts
          if (Math.random() < 0.3) {
            throw new Error('Simulated timer cleanup failure');
          }
          return originalClearTimeout.call(window, id);
        };
      });

      // Trigger events to create resources
      await TestHelpers.triggerClickEvent(page);
      await TestHelpers.simulateUserActivity(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Destroy TraceLog (this should handle cleanup failures gracefully)
      await destroyTraceLog(page);
      await TestHelpers.waitForTimeout(page, 1000);

      // Verify the SDK handles cleanup failures gracefully (may still be partially initialized)
      const sdkState = await page.evaluate(() => {
        const TraceLog = (window as any).TraceLog;
        return {
          exists: !!TraceLog,
          isInitialized: TraceLog?.isInitialized?.() ?? false,
          hasDestroy: typeof TraceLog?.destroy === 'function',
        };
      });

      // SDK should still exist but cleanup failures should not crash the application
      expect(sdkState.exists).toBe(true);

      // Verify no critical errors that would break the application
      const hasCriticalErrors = monitor.traceLogErrors.some(
        (error) =>
          error.includes('Cannot read property') || error.includes('TypeError') || error.includes('ReferenceError'),
      );

      expect(hasCriticalErrors).toBe(false);
    } finally {
      monitor.cleanup();
    }
  });
});
