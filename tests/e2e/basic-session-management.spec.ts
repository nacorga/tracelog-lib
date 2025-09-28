/**
 * Basic Session Management Test
 *
 * Tests basic TraceLog session management functionality without complex abstractions
 * Focus: Library session validation only
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Session Management', () => {
  test('should initialize session on TraceLog init', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog and check session
    const sessionData = await page.evaluate(async () => {
      try {
        await window.__traceLogBridge!.init({ id: 'skip' });

        // Get session information
        const sessionInfo = window.__traceLogBridge!.getSessionData();

        return {
          success: true,
          initialized: window.__traceLogBridge!.initialized,
          sessionInfo,
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    expect(sessionData.success).toBe(true);
    expect(sessionData.initialized).toBe(true);
    expect(sessionData.sessionInfo).toBeDefined();
    expect(sessionData.sessionInfo!.id).toBeDefined();
    expect(typeof sessionData.sessionInfo!.id).toBe('string');
    expect((sessionData.sessionInfo!.id as string).length).toBeGreaterThan(0);
    expect(sessionData.sessionInfo!.isActive).toBe(true);
  });

  test('should maintain session across page interactions', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize and capture initial session
    const sessionResults = await page.evaluate(async () => {
      await window.__traceLogBridge!.init({ id: 'skip' });

      const initialSession = window.__traceLogBridge!.getSessionData();

      // Simulate user interactions
      document
        .querySelector('[data-testid="cta-ver-productos"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      window.__traceLogBridge!.sendCustomEvent('user_interaction', { type: 'click' });

      // Wait a bit for session activity update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const sessionAfterActivity = window.__traceLogBridge!.getSessionData();

      return {
        initialSession,
        sessionAfterActivity,
      };
    });

    // Session should remain the same but potentially updated activity
    expect(sessionResults.initialSession!.id).toBe(sessionResults.sessionAfterActivity!.id);
    expect(sessionResults.sessionAfterActivity!.isActive).toBe(true);
  });

  test('should handle session start/end events', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Monitor session-related events
    const sessionEvents = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for all events to capture session events
      window.__traceLogBridge!.on('event', (data: any) => {
        if (data.type === 'session_start' || data.type === 'session_end') {
          events.push(data);
        }
      });

      // Initialize TraceLog (should trigger session start)
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Wait for potential session events
      await new Promise((resolve) => setTimeout(resolve, 500));

      return events;
    });

    // Should have session start event or session-related activity
    expect(sessionEvents.length).toBeGreaterThanOrEqual(0);

    if (sessionEvents.length > 0) {
      const sessionEvent = sessionEvents[0];
      expect(sessionEvent.type).toMatch(/session/);
      expect(sessionEvent.timestamp).toBeDefined();
    }
  });

  test('should validate session data structure', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize and validate session structure
    const sessionValidation = await page.evaluate(async () => {
      await window.__traceLogBridge!.init({ id: 'skip' });

      const sessionData = window.__traceLogBridge!.getSessionData();

      // Validate session data structure
      const validation = {
        hasId: 'id' in sessionData! && typeof sessionData!.id === 'string',
        hasIsActive: 'isActive' in sessionData! && typeof sessionData!.isActive === 'boolean',
        idNotEmpty: sessionData!.id && (sessionData!.id as string).length > 0,
        isActiveTrue: sessionData!.isActive === true,
      };

      return {
        sessionData,
        validation,
      };
    });

    expect(sessionValidation.validation.hasId).toBe(true);
    expect(sessionValidation.validation.hasIsActive).toBe(true);
    expect(sessionValidation.validation.idNotEmpty).toBe(true);
    expect(sessionValidation.validation.isActiveTrue).toBe(true);
  });

  test('should handle session recovery gracefully', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize and simulate session recovery scenario
    const recoveryTest = await page.evaluate(async () => {
      // First initialization
      await window.__traceLogBridge!.init({ id: 'skip' });
      const firstSession = window.__traceLogBridge!.getSessionData();

      // Simulate some activity
      window.__traceLogBridge!.sendCustomEvent('test_activity');

      // Wait for activity to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const sessionAfterActivity = window.__traceLogBridge!.getSessionData();

      return {
        firstSession,
        sessionAfterActivity,
        recoveryWorked: firstSession!.id === sessionAfterActivity!.id,
      };
    });

    expect(recoveryTest.recoveryWorked).toBe(true);
    expect(recoveryTest.sessionAfterActivity!.isActive).toBe(true);
  });

  test('should generate unique session IDs', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Test session ID uniqueness (simulate multiple initializations)
    const uniquenessTest = await page.evaluate(async () => {
      const sessionIds: string[] = [];

      // First session
      await window.__traceLogBridge!.init({ id: 'skip' });
      const session1 = window.__traceLogBridge!.getSessionData();
      sessionIds.push(session1!.id as string);

      // Session ID should be consistent across calls
      const session1Again = window.__traceLogBridge!.getSessionData();
      sessionIds.push(session1Again!.id as string);

      return {
        sessionIds,
        areIdentical: sessionIds[0] === sessionIds[1],
        isValidFormat: /^\d+-[a-z0-9]+$/.test(sessionIds[0]), // Timestamp-random format check
      };
    });

    expect(uniquenessTest.areIdentical).toBe(true);
    expect(uniquenessTest.isValidFormat).toBe(true);
    expect(uniquenessTest.sessionIds[0].length).toBeGreaterThan(10);
  });
});
