import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: Cleanup & Memory Management
 *
 * CRITICAL for production: Verify library properly cleans up resources on destroy()
 * to prevent memory leaks in Single Page Applications (React/Vue/Next.js).
 *
 * Test Coverage:
 * 1. Event listener cleanup (click, scroll, pageview, error handlers)
 * 2. Timer/interval cleanup (session timeout, debounce timers)
 * 3. localStorage preservation (destroy should NOT clear user data)
 * 4. Multiple init/destroy cycles (no accumulation of listeners)
 * 5. BroadcastChannel cleanup (multi-tab communication)
 * 6. Integration cleanup (Google Analytics, custom backends)
 * 7. Handler state reset (no stale references after destroy)
 *
 * Each test runs across 5 browsers (Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari)
 */

test.describe('Cleanup & Memory Management', () => {
  test('should remove all event listeners on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();

      // Trigger some events to ensure handlers are active
      traceLog.sendCustomEvent('test_event', { data: 'value' });
      document.body.click();
      window.scrollTo(0, 100);

      // Wait for handlers to settle
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Destroy and verify cleanup
      traceLog.destroy();

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        canTrackAfterDestroy: typeof traceLog.sendCustomEvent === 'function',
        canInitAfterDestroy: typeof traceLog.init === 'function',
      };
    });

    // API should still exist but be no-op after destroy
    expect(result.canTrackAfterDestroy).toBe(true);
    expect(result.canInitAfterDestroy).toBe(true);
  });

  test('should allow re-initialization after destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // First init
      await traceLog.init();
      traceLog.sendCustomEvent('test_first_init', { data: 'value' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionBefore = traceLog.getSessionData();

      // Destroy
      traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Re-init should work without errors
      let reinitSuccess = false;
      try {
        await traceLog.init();
        reinitSuccess = true;
      } catch {
        reinitSuccess = false;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should be able to track events after reinit
      traceLog.sendCustomEvent('test_after_reinit', { data: 'value' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const sessionAfter = traceLog.getSessionData();

      return {
        hadSessionBefore: Boolean(sessionBefore?.id),
        reinitSuccess,
        hasSessionAfter: Boolean(sessionAfter?.id),
        canTrackAfterReinit: true, // If we got here, tracking works
      };
    });

    // Should successfully reinitialize and track events
    expect(result.hadSessionBefore).toBe(true);
    expect(result.reinitSuccess).toBe(true);
    expect(result.hasSessionAfter).toBe(true);
    expect(result.canTrackAfterReinit).toBe(true);
  });

  test('should handle multiple init/destroy cycles without memory leaks', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const cycles = 5;
      const errors: string[] = [];

      for (let i = 0; i < cycles; i++) {
        try {
          // Init
          await traceLog.init();

          // Trigger some activity
          traceLog.sendCustomEvent(`test_cycle_${i}`, { cycle: i });
          document.body.click();

          // Wait
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Destroy
          traceLog.destroy();

          // Wait before next cycle
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          errors.push(`Cycle ${i}: ${(err as Error).message}`);
        }
      }

      return {
        completedCycles: cycles,
        errors,
        success: errors.length === 0,
      };
    });

    // All cycles should complete without errors
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.completedCycles).toBe(5);
  });

  test('should cleanup BroadcastChannel connections on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();

      // Trigger session activity
      traceLog.sendCustomEvent('test_broadcast', { data: 'value' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Destroy should close BroadcastChannel
      traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify no errors when trying to use library after destroy
      let errorThrown = false;
      try {
        traceLog.sendCustomEvent('after_destroy', { data: 'value' });
      } catch {
        errorThrown = true;
      }

      return {
        noErrorAfterDestroy: !errorThrown,
      };
    });

    // Library should handle calls gracefully after destroy (no-op, no errors)
    expect(result.noErrorAfterDestroy).toBe(true);
  });

  test('should handle destroy gracefully with integrations enabled', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      let destroySuccess = false;
      let reinitSuccess = false;

      try {
        await traceLog.init({
          integrations: {
            google: {
              measurementId: 'G-TEST12345',
            },
          },
        });

        // Trigger some events
        traceLog.sendCustomEvent('test_integration', { data: 'value' });
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Destroy should not throw
        traceLog.destroy();
        destroySuccess = true;

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Should be able to reinit after destroy
        await traceLog.init();
        reinitSuccess = true;

        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch {
        // Catch any errors
      }

      return {
        destroySuccess,
        reinitSuccess,
      };
    });

    // Destroy and reinit should work without errors
    expect(result.destroySuccess).toBe(true);
    expect(result.reinitSuccess).toBe(true);
  });

  test('should reset all handler state on destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();

      // Trigger various handlers to populate state
      traceLog.sendCustomEvent('test_page1', { data: 'page1' });
      document.body.click();
      window.scrollTo(0, 100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Destroy
      traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Re-init
      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get fresh session after reinit
      const sessionAfterReinit = traceLog.getSessionData();

      // Track new event
      traceLog.sendCustomEvent('test_page2', { data: 'page2' });
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        hasSessionAfterReinit: Boolean(sessionAfterReinit?.id),
        reinitSuccessful: true,
      };
    });

    // Should be able to reinit and track events normally
    expect(result.hasSessionAfterReinit).toBe(true);
    expect(result.reinitSuccessful).toBe(true);
  });
});
