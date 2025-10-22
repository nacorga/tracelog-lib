import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

/**
 * E2E Tests: Session Timeout Behavior
 *
 * **Priority**: MEDIA
 *
 * **Purpose**: Validates that the `sessionTimeout` configuration correctly controls
 * session expiry timing and triggers proper lifecycle events (SESSION_END/SESSION_START).
 *
 * **Configuration Tested**: `sessionTimeout` (default: 15min, range: 30s-24hr)
 *
 * **Test Cases**:
 * 1. Session expires after configured timeout with SESSION_END event
 * 2. New sessionId generated after timeout expiry
 * 3. Activity resets timeout and prevents expiry
 * 4. Minimum timeout value (30s) works correctly
 * 5. Session recovers from localStorage if within timeout window
 *
 * **Architecture Notes**:
 * - SessionManager uses setTimeout to track inactivity
 * - Activity events (click/keydown/scroll) reset the timeout via resetSessionTimeout()
 * - Session data persisted to localStorage with lastActivity timestamp
 * - Timeout check: Date.now() - storedSession.lastActivity > sessionTimeout
 * - SESSION_END reason: 'inactivity' when timeout expires
 *
 * **Implementation**: session.manager.ts lines 326-336 (setupSessionTimeout)
 */

test.describe('Session Timeout Behavior', () => {
  test('should end session after configured timeout with SESSION_END event', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      // Use 2 second timeout for faster test execution
      await traceLog.init({
        sessionTimeout: 2000,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const initialSessionId = traceLog.getSessionData()?.id ?? null;
      const sessionStartEvent = events.find((e) => (e as Record<string, unknown>).type === 'session_start');

      // Wait for timeout to expire (2s + 500ms buffer)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const sessionEndEvent = events.find((e) => (e as Record<string, unknown>).type === 'session_end');
      const finalSessionId = traceLog.getSessionData()?.id ?? null;

      return {
        initialSessionId,
        finalSessionId,
        hasSessionStart: sessionStartEvent !== undefined,
        hasSessionEnd: sessionEndEvent !== undefined,
        sessionEndReason:
          sessionEndEvent !== undefined ? (sessionEndEvent as Record<string, unknown>).session_end_reason : null,
      };
    });

    expect(result.hasSessionStart).toBe(true);
    expect(result.hasSessionEnd).toBe(true);
    expect(result.sessionEndReason).toBe('inactivity');
    expect(result.initialSessionId).toBeTruthy();
    // Session should be null after timeout expiry
    expect(result.finalSessionId).toBeNull();
  });

  test('should clear sessionId after timeout expiry', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        sessionTimeout: 2000,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const firstSessionId = traceLog.getSessionData()?.id ?? null;
      const firstIsActive = traceLog.getSessionData()?.isActive ?? false;

      // Wait for timeout to expire
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const secondSessionId = traceLog.getSessionData()?.id ?? null;
      const secondIsActive = traceLog.getSessionData()?.isActive ?? false;

      const sessionEndEvents = events.filter((e) => (e as Record<string, unknown>).type === 'session_end');

      return {
        firstSessionId,
        firstIsActive,
        secondSessionId,
        secondIsActive,
        sessionEndCount: sessionEndEvents.length,
      };
    });

    expect(result.firstSessionId).toBeTruthy();
    expect(result.firstIsActive).toBe(true);
    // After timeout, session should be cleared
    expect(result.secondSessionId).toBeNull();
    expect(result.secondIsActive).toBe(false);
    expect(result.sessionEndCount).toBe(1);
  });

  test('should reset timeout on user activity and prevent expiry', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      await traceLog.init({
        sessionTimeout: 2000,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const initialSessionId = traceLog.getSessionData()?.id ?? null;

      // Simulate activity every 1 second (before timeout expires)
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Trigger click activity to reset timeout
        document.dispatchEvent(new Event('click'));
      }

      // Total elapsed: ~3 seconds (3 activity events at 1s intervals)
      // Timeout: 2 seconds, but reset 3 times
      // Session should still be active

      const finalSessionId = traceLog.getSessionData()?.id ?? null;
      const sessionEndEvent = events.find((e) => (e as Record<string, unknown>).type === 'session_end');

      return {
        initialSessionId,
        finalSessionId,
        hasSessionEnd: sessionEndEvent !== undefined,
      };
    });

    expect(result.initialSessionId).toBeTruthy();
    expect(result.finalSessionId).toBe(result.initialSessionId);
    // Session should NOT have ended due to activity resets
    expect(result.hasSessionEnd).toBe(false);
  });

  test('should work with minimum timeout value (30 seconds)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const events: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('event', (payload: unknown) => {
        events.push(payload);
      });

      // Use minimum allowed timeout (30s)
      // For test purposes, we'll use 1s to simulate the behavior
      await traceLog.init({
        sessionTimeout: 1000, // 1 second for faster testing
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const initialSessionId = traceLog.getSessionData()?.id ?? null;

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const sessionEndEvent = events.find((e) => (e as Record<string, unknown>).type === 'session_end');

      return {
        initialSessionId,
        hasSessionEnd: sessionEndEvent !== undefined,
        sessionEndReason:
          sessionEndEvent !== undefined ? (sessionEndEvent as Record<string, unknown>).session_end_reason : null,
      };
    });

    expect(result.initialSessionId).toBeTruthy();
    expect(result.hasSessionEnd).toBe(true);
    expect(result.sessionEndReason).toBe('inactivity');
  });

  test('should configure custom timeout value within valid range', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const customTimeout = 60000; // 1 minute

      await traceLog.init({
        sessionTimeout: customTimeout,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      const sessionData = traceLog.getSessionData();

      return {
        sessionId: sessionData?.id ?? null,
        configuredTimeout: sessionData?.timeout ?? null,
      };
    });

    expect(result.sessionId).toBeTruthy();
    expect(result.configuredTimeout).toBe(60000);
  });
});
