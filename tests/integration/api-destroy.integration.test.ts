/**
 * API Destroy Method Integration Tests
 *
 * Tests for TraceLog.destroy() method - cleanup and teardown
 * These tests verify proper cleanup of all resources and event listeners
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import { EmitterEvent } from '../../src/types';

describe('API Integration - Destroy Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Before Initialization', () => {
    it('should throw error when called before init()', () => {
      expect(() => {
        TraceLog.destroy();
      }).toThrow('App not initialized');
    });
  });

  describe('After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should destroy successfully', () => {
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should set isInitialized to false after destroy', () => {
      expect(TraceLog.isInitialized()).toBe(true);
      TraceLog.destroy();
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should prevent using event() after destroy', async () => {
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(() => {
        TraceLog.event('test');
      }).toThrow('TraceLog not initialized');
    });

    it('should clean up global state', async () => {
      // Trigger some events to populate state
      TraceLog.event('event1');
      TraceLog.event('event2');

      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After destroy, should not be able to access anything
      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('Multiple Destroy Calls', () => {
    it('should throw error on second destroy call', async () => {
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(() => {
        TraceLog.destroy();
      }).toThrow('App not initialized');
    });

    it('should handle multiple destroy calls gracefully (synchronous)', async () => {
      await TraceLog.init();

      // First destroy (synchronous)
      TraceLog.destroy();

      // Subsequent destroy calls should throw since app is already destroyed
      expect(() => {
        TraceLog.destroy();
      }).toThrow('App not initialized');
    });
  });

  describe('Re-initialization After Destroy', () => {
    it('should allow init after destroy', async () => {
      // First lifecycle
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await expect(TraceLog.init()).resolves.not.toThrow();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should work correctly after re-initialization', async () => {
      // First lifecycle
      await TraceLog.init();
      TraceLog.event('event1');
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await TraceLog.init();
      expect(() => {
        TraceLog.event('event2');
      }).not.toThrow();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle multiple init/destroy cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await TraceLog.init();
        TraceLog.event(`event-cycle-${i}`);
        expect(TraceLog.isInitialized()).toBe(true);

        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(TraceLog.isInitialized()).toBe(false);
      }
    });
  });

  describe('Cleanup Verification', () => {
    it('should cleanup event listeners and not track events after destroy', async () => {
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Verify listener works before destroy
      TraceLog.event('test-before-destroy');
      await new Promise((resolve) => setTimeout(resolve, 50));
      const callCountBefore = eventCallback.mock.calls.length;
      expect(callCountBefore).toBeGreaterThan(0);

      // Destroy should remove all event listeners (but may emit SESSION_END)
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy (might include SESSION_END event)
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // After destroy, DOM events should not trigger tracking
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(clickEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Event callback should not be called for new events after destroy
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should cleanup timers and intervals', async () => {
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Trigger some events
      TraceLog.event('test-event');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Destroy should clear all timers/intervals
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // Wait a bit longer
      await new Promise((resolve) => setTimeout(resolve, 200));

      // No new events should be emitted (all timers cleared)
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should cleanup storage listeners and not react to storage changes', async () => {
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Destroy should remove storage listeners
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // Storage changes should not trigger anything
      const storageEvent = new StorageEvent('storage', {
        key: '__tracelog_session',
        newValue: JSON.stringify({ sessionId: 'new-session', userId: 'test-user' }),
      });
      window.dispatchEvent(storageEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // No new events should be emitted
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should cleanup click handlers and not track clicks after destroy', async () => {
      document.body.innerHTML = '<button id="test-button">Click me</button>';

      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Click before destroy - should be tracked
      const button = document.getElementById('test-button')!;
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const clickEventsBefore = eventCallback.mock.calls.filter((call) => call[0]?.type === 'click').length;
      expect(clickEventsBefore).toBeGreaterThan(0);

      // Destroy should remove click listeners
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // Click after destroy - should NOT be tracked
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No new events should be emitted
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);

      document.body.innerHTML = '';
    });

    it('should cleanup scroll handlers and not track scrolls after destroy', async () => {
      document.body.innerHTML = `
        <div id="scrollable" style="overflow: auto; height: 200px;">
          <div style="height: 1000px;"></div>
        </div>
      `;
      const scrollContainer = document.getElementById('scrollable') as HTMLElement;

      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, configurable: true, writable: true });
      Object.defineProperty(scrollContainer, 'offsetParent', { value: document.body, configurable: true });

      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      await new Promise((resolve) => setTimeout(resolve, 1200)); // Wait for scroll detection

      // Destroy should remove scroll listeners
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // Scroll after destroy - should NOT be tracked
      scrollContainer.scrollTop = 500;
      scrollContainer.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // No new events should be emitted
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);

      document.body.innerHTML = '';
    });

    it('should cleanup visibility change handlers', async () => {
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Destroy should remove visibility listeners
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Get call count after destroy
      const callCountAfterDestroy = eventCallback.mock.calls.length;

      // Visibility change after destroy - should NOT trigger events
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // No new events should be emitted
      expect(eventCallback.mock.calls.length).toBe(callCountAfterDestroy);
      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('With Different Configurations', () => {
    it('should destroy when initialized with skip mode', async () => {
      await TraceLog.init();
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should destroy when initialized with empty config', async () => {
      await TraceLog.init();
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should destroy when initialized with global metadata', async () => {
      await TraceLog.init({
        globalMetadata: { version: '1.0.0' },
      });
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should destroy when initialized with custom timeout', async () => {
      await TraceLog.init({
        sessionTimeout: 60000,
      });
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle destroy with pending events', async () => {
      await TraceLog.init();

      // Queue up some events
      TraceLog.event('event1');
      TraceLog.event('event2');
      TraceLog.event('event3');

      // Destroy immediately without waiting for events to send
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should handle destroy immediately after init', async () => {
      await TraceLog.init();

      // Destroy right away
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });

    it('should handle destroy without any events sent', async () => {
      await TraceLog.init();

      // Destroy without sending any custom events
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
    });
  });
});
