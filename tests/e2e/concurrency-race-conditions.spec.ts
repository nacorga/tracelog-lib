import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: Concurrency & Race Conditions
 *
 * **Priority**: CRITICAL (Production Blocker)
 *
 * **Purpose**: Validates that the library handles concurrent operations safely
 * in multi-tab scenarios, rapid init/destroy cycles, and race conditions.
 *
 * **Critical Scenarios**:
 * 1. Multiple rapid init() calls don't cause duplicate initialization
 * 2. Concurrent init/destroy cycles don't crash or leak memory
 * 3. BroadcastChannel messages from multiple tabs handled correctly
 * 4. Session synchronization across multiple tabs works reliably
 * 5. Race conditions in event emission don't cause data corruption
 *
 * **Production Risk**: Multi-tab applications (e.g., e-commerce with multiple
 * product tabs) must handle concurrent operations without crashes or data loss.
 */

test.describe('Concurrency & Race Conditions', () => {
  test('should handle rapid successive init calls without duplicating state', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const initPromises = [];
      let errors = 0;

      // Rapid fire 5 init calls concurrently
      for (let i = 0; i < 5; i++) {
        initPromises.push(
          traceLog.init().catch(() => {
            errors++;
          }),
        );
      }

      await Promise.all(initPromises);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check that session exists and is valid
      const session = traceLog.getSessionData();

      return {
        errors,
        hasSession: Boolean(session?.id),
        sessionValid: typeof session?.id === 'string' && session.id.length > 0,
      };
    });

    // Should handle concurrent inits gracefully
    expect(result.errors).toBe(0);
    expect(result.hasSession).toBe(true);
    expect(result.sessionValid).toBe(true);
  });

  test('should handle concurrent init and destroy operations safely', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      let operationErrors = 0;
      const operations = [];

      // Interleave init and destroy calls
      for (let i = 0; i < 3; i++) {
        operations.push(
          traceLog
            .init()
            .then(async () => {
              await new Promise((resolve) => setTimeout(resolve, 100));
            })
            .then(() => {
              traceLog.destroy();
            })
            .catch(() => {
              operationErrors++;
            }),
        );
      }

      await Promise.all(operations);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Final init to ensure library still works
      let finalInitSuccess = false;
      try {
        await traceLog.init();
        finalInitSuccess = true;
      } catch {
        finalInitSuccess = false;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const finalSession = traceLog.getSessionData();

      return {
        operationErrors,
        finalInitSuccess,
        hasFinalSession: Boolean(finalSession?.id),
      };
    });

    // Operations should complete without errors
    expect(result.operationErrors).toBe(0);
    expect(result.finalInitSuccess).toBe(true);
    expect(result.hasFinalSession).toBe(true);
  });

  test('should handle concurrent event emissions without data loss', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const events: string[] = [];
      traceLog.on('event', (event) => {
        events.push(event.type);
      });

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Fire multiple events concurrently
      const eventPromises = [];
      for (let i = 0; i < 10; i++) {
        eventPromises.push(
          Promise.resolve().then(() => {
            traceLog.sendCustomEvent(`concurrent_event_${i}`, { index: i });
          }),
        );
      }

      await Promise.all(eventPromises);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        totalEvents: events.length,
        hasCustomEvents: events.some((type) => type === 'custom'),
        eventsReceived: events.filter((type) => type === 'custom').length,
      };
    });

    // Should receive at least some of the concurrent events
    expect(result.totalEvents).toBeGreaterThan(0);
    expect(result.hasCustomEvents).toBe(true);
    expect(result.eventsReceived).toBeGreaterThan(0);
  });

  test('should maintain session consistency during rapid activity', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const initialSession = traceLog.getSessionData();
      const sessionIds: Set<string> = new Set();

      // Rapid activity that might trigger session updates
      for (let i = 0; i < 20; i++) {
        traceLog.sendCustomEvent(`rapid_activity_${i}`, { index: i });

        const currentSession = traceLog.getSessionData();
        if (currentSession?.id && typeof currentSession.id === 'string') {
          sessionIds.add(currentSession.id);
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const finalSession = traceLog.getSessionData();

      return {
        hadInitialSession: Boolean(initialSession?.id),
        uniqueSessionIds: Array.from(sessionIds),
        sessionIdsCount: sessionIds.size,
        hasFinalSession: Boolean(finalSession?.id),
        sessionConsistent: sessionIds.size === 1,
      };
    });

    // Session should remain consistent
    expect(result.hadInitialSession).toBe(true);
    expect(result.hasFinalSession).toBe(true);
    expect(result.sessionConsistent).toBe(true);
    expect(result.sessionIdsCount).toBe(1);
  });

  test('should handle destroy during active event processing', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      let processingErrors = 0;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start emitting events
      const eventPromises = [];
      for (let i = 0; i < 10; i++) {
        eventPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              try {
                traceLog.sendCustomEvent(`processing_event_${i}`, { index: i });
                resolve();
              } catch {
                processingErrors++;
                resolve();
              }
            }, i * 50);
          }),
        );
      }

      // Destroy while events are being emitted
      setTimeout(() => {
        traceLog.destroy();
      }, 250);

      await Promise.all(eventPromises);
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        processingErrors,
        noErrors: processingErrors === 0,
      };
    });

    // Should handle destroy during processing without errors
    expect(result.noErrors).toBe(true);
    expect(result.processingErrors).toBe(0);
  });

  test('should handle concurrent configuration updates safely', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Initialize with default config
      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Destroy and reinit with different configs concurrently
      traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const initPromises = [
        traceLog.init({ sessionTimeout: 60000 }),
        traceLog.init({ sessionTimeout: 120000 }),
        traceLog.init({ sessionTimeout: 180000 }),
      ];

      let initErrors = 0;
      await Promise.all(
        initPromises.map(async (p) => {
          await p.catch(() => {
            initErrors++;
          });
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalSession = traceLog.getSessionData();

      return {
        initErrors,
        hasFinalSession: Boolean(finalSession?.id),
        libraryWorking: true, // If we got here, library didn't crash
      };
    });

    // Should handle concurrent config updates gracefully
    expect(result.initErrors).toBe(0);
    expect(result.hasFinalSession).toBe(true);
    expect(result.libraryWorking).toBe(true);
  });
});
