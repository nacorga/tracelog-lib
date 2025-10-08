/**
 * User Session Flow Test
 *
 * Tests basic session management scenarios to ensure TraceLog correctly handles
 * session initialization, persistence, and recovery in realistic user scenarios.
 * Focus: Core session functionality validation without advanced multi-tab complexity
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('User Session Flow', () => {
  test('should maintain session during extended user activity', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test extended session activity
    const extendedSessionResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];
      let sessionData: any = null;

      // Listen for queue events
      window.__traceLogBridge.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge.init();
      sessionData = window.__traceLogBridge.getSessionData();

      // Simulate extended user activity over time
      const activities = ['page_visit', 'product_view', 'add_to_cart', 'checkout_start', 'form_fill', 'final_action'];

      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        if (activity) {
          window.__traceLogBridge.sendCustomEvent(activity, {
            step: i + 1,
            timestamp: Date.now(),
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      // Trigger queue sending
      window.__traceLogBridge.sendCustomEvent('test_extended_session_complete', { trigger: 'end_session' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        sessionData,
        queueEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    // Verify session initialization
    expect(extendedSessionResult.initialized).toBe(true);
    expect(extendedSessionResult.sessionData).toBeTruthy();
    expect(extendedSessionResult.sessionData.id).toBeTruthy();

    // Verify queue events maintain session consistency
    if (extendedSessionResult.queueEvents.length > 0) {
      const uniqueSessionIds = [...new Set(extendedSessionResult.queueEvents.map((queue) => queue.session_id))];
      expect(uniqueSessionIds).toHaveLength(1);
      expect(uniqueSessionIds[0]).toBe(extendedSessionResult.sessionData.id);

      // Verify all activity events were captured with consistent session
      const allCustomEvents = extendedSessionResult.queueEvents.flatMap((queue) =>
        queue.events.filter((event: any) => event.type === 'custom'),
      );

      const activityEvents = allCustomEvents.filter((event) =>
        ['page_visit', 'product_view', 'add_to_cart', 'checkout_start', 'form_fill', 'final_action'].includes(
          event.custom_event?.name,
        ),
      );

      expect(activityEvents.length).toBeGreaterThan(0);

      // Verify events maintain chronological order
      let previousTimestamp = 0;
      activityEvents.forEach((event) => {
        expect(event.timestamp).toBeGreaterThanOrEqual(previousTimestamp);
        previousTimestamp = event.timestamp;
      });
    }
  });

  test('should validate session data structure and consistency', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test session data validation
    const sessionValidationResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];

      // Listen for queue events
      window.__traceLogBridge.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge.init();
      const sessionData = window.__traceLogBridge.getSessionData();

      // Generate validation activities
      window.__traceLogBridge.sendCustomEvent('session_validation', {
        sessionId: sessionData?.id,
        isActive: sessionData?.isActive,
        timestamp: Date.now(),
      });

      // Trigger queue sending
      window.__traceLogBridge.sendCustomEvent('test_session_validation_complete', { trigger: 'end_validation' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        sessionData,
        queueEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    // Verify session data structure
    expect(sessionValidationResult.initialized).toBe(true);
    expect(sessionValidationResult.sessionData).toBeTruthy();
    expect(sessionValidationResult.sessionData?.id).toBeTruthy();
    expect(typeof sessionValidationResult.sessionData?.id).toBe('string');
    expect(sessionValidationResult.sessionData?.isActive).toBe(true);

    // Verify queue events maintain session consistency
    if (sessionValidationResult.queueEvents.length > 0) {
      const uniqueSessionIds = [...new Set(sessionValidationResult.queueEvents.map((queue) => queue.session_id))];
      expect(uniqueSessionIds).toHaveLength(1);
      expect(uniqueSessionIds[0]).toBe(sessionValidationResult.sessionData?.id);

      // Verify validation events were captured
      const allCustomEvents = sessionValidationResult.queueEvents.flatMap((queue) =>
        queue.events.filter((event: any) => event.type === 'custom'),
      );

      const validationEvents = allCustomEvents.filter((event) => event.custom_event?.name === 'session_validation');
      expect(validationEvents.length).toBeGreaterThan(0);

      // Verify validation event metadata
      validationEvents.forEach((event) => {
        expect(event.custom_event.metadata.sessionId).toBe(sessionValidationResult.sessionData?.id);
        expect(event.custom_event.metadata.isActive).toBe(true);
        expect(typeof event.custom_event.metadata.timestamp).toBe('number');
      });
    }
  });
});
