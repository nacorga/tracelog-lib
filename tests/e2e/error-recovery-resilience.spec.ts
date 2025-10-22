import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

/**
 * E2E Tests: Error Recovery & Fault Tolerance
 *
 * **Priority**: CRITICAL (Production Blocker)
 *
 * **Purpose**: Validates that the library gracefully handles internal errors,
 * network failures, and corrupted data WITHOUT crashing the host application.
 *
 * **Critical Scenarios**:
 * 1. Library continues working after internal errors
 * 2. Network failures in integrations don't block local event emission
 * 3. Corrupted localStorage data doesn't crash initialization
 * 4. Invalid configuration values fail gracefully with fallbacks
 * 5. Integration script load failures don't block core functionality
 *
 * **Production Risk**: If the library crashes due to edge cases, it could
 * take down the entire host application. These tests ensure resilient operation.
 */

test.describe('Error Recovery & Fault Tolerance', () => {
  test('should continue tracking events after JavaScript errors in user code', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Send event before error
      traceLog.sendCustomEvent('before_error', { test: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simulate user code error (should be caught by error handler)
      try {
        throw new Error('Simulated user error');
      } catch {
        // Error caught by user code, library should still work
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send event after error - should still work
      traceLog.sendCustomEvent('after_error', { test: 'value2' });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const customEvents = events.filter((e) => (e as Record<string, unknown>).type === 'custom');

      return {
        eventCount: events.length,
        customEventCount: customEvents.length,
        hasSessionStart: events.some((e) => (e as Record<string, unknown>).type === 'session_start'),
      };
    });

    // Library should continue working after simulated error
    expect(result.eventCount).toBeGreaterThan(1);
    expect(result.customEventCount).toBe(2); // before_error + after_error
    expect(result.hasSessionStart).toBe(true);
  });

  test('should handle corrupted localStorage data gracefully', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Corrupt session data in localStorage
      localStorage.setItem('tlog:session', 'INVALID_JSON{{{');
      localStorage.setItem('tlog:queue', '["not", "valid", "queue"]');
      localStorage.setItem('tlog:consent', 'corrupted_data');

      const errors: string[] = [];
      let initSuccess = false;

      try {
        await traceLog.init();
        initSuccess = true;
      } catch (error) {
        errors.push((error as Error).message);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      const sessionData = traceLog.getSessionData();

      return {
        initSuccess,
        errors,
        hasSessionId: sessionData?.id !== null && sessionData?.id !== undefined,
        isActive: sessionData?.isActive ?? false,
      };
    });

    // Library should initialize successfully despite corrupted data
    expect(result.initSuccess).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.hasSessionId).toBe(true);
    expect(result.isActive).toBe(true);
  });

  test('should continue emitting events locally if integration fails to load', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      // Configure integration with invalid Google Analytics ID (should fail gracefully)
      await traceLog.init({
        integrations: {
          google: {
            measurementId: 'INVALID_GA_ID',
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      traceLog.sendCustomEvent('test_event', { data: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const customEvents = events.filter((e) => (e as Record<string, unknown>).type === 'custom');

      return {
        eventCount: events.length,
        customEventCount: customEvents.length,
        hasSessionStart: events.some((e) => (e as Record<string, unknown>).type === 'session_start'),
      };
    });

    // Events should still be emitted locally even if GA fails
    expect(result.eventCount).toBeGreaterThan(1);
    expect(result.customEventCount).toBeGreaterThanOrEqual(1);
    expect(result.hasSessionStart).toBe(true);
  });

  test('should recover from quota exceeded errors in localStorage', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Fill localStorage to simulate quota
      try {
        const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test_key_${i}`, largeData);
        }
      } catch {
        // Quota exceeded expected
      }

      // Try to send event - should handle quota gracefully
      traceLog.sendCustomEvent('test_after_quota', { data: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clean up
      for (let i = 0; i < 100; i++) {
        try {
          localStorage.removeItem(`test_key_${i}`);
        } catch {
          // Ignore
        }
      }

      const customEvents = events.filter((e) => (e as Record<string, unknown>).type === 'custom');

      return {
        eventCount: events.length,
        customEventCount: customEvents.length,
      };
    });

    // Library should continue working even if localStorage quota exceeded
    expect(result.eventCount).toBeGreaterThan(0);
    expect(result.customEventCount).toBeGreaterThanOrEqual(1);
  });

  test('should handle network failures without blocking event emission', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // Block network requests to simulate offline
    await page.route('**/*', async (route) => route.abort());

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.example.com/collect',
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('offline_event', { test: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 800));

      const customEvents = events.filter((e) => (e as Record<string, unknown>).type === 'custom');

      return {
        eventCount: events.length,
        customEventCount: customEvents.length,
        hasSessionStart: events.some((e) => (e as Record<string, unknown>).type === 'session_start'),
      };
    });

    // Events should be emitted locally even when network is down
    expect(result.eventCount).toBeGreaterThan(1);
    expect(result.customEventCount).toBeGreaterThanOrEqual(1);
    expect(result.hasSessionStart).toBe(true);
  });

  test('should not crash on rapid init/destroy cycles', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const errors: string[] = [];

      // Rapid init/destroy cycles (simulates React StrictMode)
      for (let i = 0; i < 5; i++) {
        try {
          await traceLog.init();
          await new Promise((resolve) => setTimeout(resolve, 50));
          traceLog.destroy();
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          errors.push((error as Error).message);
        }
      }

      // Final init to verify library still works
      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const sessionData = traceLog.getSessionData();

      return {
        errors,
        hasSessionId: sessionData?.id !== null && sessionData?.id !== undefined,
        isActive: sessionData?.isActive ?? false,
      };
    });

    // Should handle rapid cycles without crashing
    expect(result.errors).toHaveLength(0);
    expect(result.hasSessionId).toBe(true);
    expect(result.isActive).toBe(true);
  });
});
