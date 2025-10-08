/**
 * User Navigation Flow Test
 *
 * Tests realistic user navigation scenarios to ensure TraceLog correctly tracks
 * page_view events and maintains session consistency during SPA navigation.
 * Focus: Real user behavior validation without over-engineering
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('User Navigation Flow', () => {
  test('should track page_view events during realistic navigation flow', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Initialize TraceLog and capture navigation via queue events
    const navigationResult = await page.evaluate(async () => {
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
      let sessionId: string | null = null;

      // Listen for queue events to capture page_view events with session_id
      window.__traceLogBridge.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge.init();

      // Get initial session ID
      const sessionData = window.__traceLogBridge.getSessionData();
      sessionId =
        sessionData && typeof sessionData === 'object' && 'id' in sessionData ? (sessionData.id as string) : null;

      // Wait for initial events to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate realistic user navigation: Inicio → Productos
      const productosLink = document.querySelector('[data-testid="nav-productos"]') as HTMLElement;
      if (productosLink) {
        productosLink.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Navigate to Nosotros
      const nosotrosLink = document.querySelector('[data-testid="nav-nosotros"]') as HTMLElement;
      if (nosotrosLink) {
        nosotrosLink.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Navigate to Contacto
      const contactoLink = document.querySelector('[data-testid="nav-contacto"]') as HTMLElement;
      if (contactoLink) {
        contactoLink.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Send a custom event to trigger queue sending
      window.__traceLogBridge.sendCustomEvent('test_navigation', { trigger: 'end_navigation' });

      // Wait for queue events (realistic mode uses 10-second intervals)
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionId,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    // Verify TraceLog initialization
    expect(navigationResult.initialized).toBe(true);
    expect(navigationResult.sessionId).toBeTruthy();

    // Verify queue events were captured
    expect(navigationResult.queueEvents.length).toBeGreaterThan(0);

    // Extract all page_view events from all queues
    const allPageViewEvents = navigationResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'page_view'),
    );

    // Verify page_view events were captured
    expect(allPageViewEvents.length).toBeGreaterThan(0);

    // Verify all queues have the same session_id (session persistence)
    const uniqueSessionIds = [...new Set(navigationResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(navigationResult.sessionId);

    // Verify page_view events have correct structure
    allPageViewEvents.forEach((event, index) => {
      expect(event.type).toBe('page_view');
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
      expect(event.page_url).toBeDefined();

      // Verify timestamp ordering (newer events should have higher timestamps)
      if (index > 0) {
        expect(event.timestamp).toBeGreaterThanOrEqual(allPageViewEvents[index - 1].timestamp);
      }
    });
  });

  test('should maintain session consistency across hash-based navigation', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test hash-based navigation consistency using queue events
    const hashNavigationResult = await page.evaluate(async () => {
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

      // Listen for queue events to capture session_id with page_view events
      window.__traceLogBridge.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge.init();
      sessionData = window.__traceLogBridge.getSessionData();

      // Wait for initial event to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Direct hash navigation (simulating browser back/forward)
      window.location.hash = '#productos';
      await new Promise((resolve) => setTimeout(resolve, 800));

      window.location.hash = '#nosotros';
      await new Promise((resolve) => setTimeout(resolve, 800));

      window.location.hash = '#contacto';
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Send custom event to trigger queue sending
      window.__traceLogBridge.sendCustomEvent('test_hash_navigation', { trigger: 'end_hash_navigation' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionData,
        currentHash: window.location.hash,
      };
    });

    // Verify session consistency during hash navigation
    expect(hashNavigationResult.sessionData).toBeTruthy();
    expect(hashNavigationResult.queueEvents.length).toBeGreaterThan(0);

    // All queues should have the same session_id
    const uniqueSessionIds = [...new Set(hashNavigationResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(hashNavigationResult.sessionData.id);

    // Extract all page_view events to verify URL tracking
    const allPageViewEvents = hashNavigationResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'page_view'),
    );

    // Verify URL tracking includes hash changes
    const hasHashEvents = allPageViewEvents.some(
      (event) =>
        event.page_url &&
        (event.page_url.includes('#productos') ||
          event.page_url.includes('#nosotros') ||
          event.page_url.includes('#contacto')),
    );
    expect(hasHashEvents).toBe(true);
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to playground
    await navigateToPlayground(page);

    // Test rapid navigation using queue events
    const rapidNavigationResult = await page.evaluate(async () => {
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

      // Wait for initial setup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Rapid navigation simulation
      const pages = ['#productos', '#nosotros', '#contacto', '#inicio'];

      for (let i = 0; i < 2; i++) {
        // 2 cycles of rapid navigation (reduced for stability)
        for (const hash of pages) {
          window.location.hash = hash;
          await new Promise((resolve) => setTimeout(resolve, 150)); // Moderate speed navigation
        }
      }

      // Send custom event to trigger queue sending
      window.__traceLogBridge.sendCustomEvent('test_rapid_navigation', { trigger: 'end_rapid_navigation' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    // Verify no console errors occurred during rapid navigation
    expect(consoleErrors).toHaveLength(0);

    // Verify TraceLog handled rapid navigation gracefully
    expect(rapidNavigationResult.initialized).toBe(true);
    expect(rapidNavigationResult.queueEvents.length).toBeGreaterThan(0);

    // Extract all page_view events from queues
    const allPageViewEvents = rapidNavigationResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'page_view'),
    );

    // Verify events were captured during rapid navigation
    expect(allPageViewEvents.length).toBeGreaterThan(0);

    // Verify all events have valid structure
    allPageViewEvents.forEach((event) => {
      expect(event.type).toBe('page_view');
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
      expect(event.page_url).toBeDefined();
    });

    // Verify all queues have consistent session_id
    const sessionIds = rapidNavigationResult.queueEvents.map((queue) => queue.session_id);
    const uniqueSessionIds = [...new Set(sessionIds)];
    expect(uniqueSessionIds.length).toBe(1);
  });
});
