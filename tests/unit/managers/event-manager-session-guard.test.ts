import { describe, it, expect, beforeEach } from 'vitest';
import { EventManager } from '@/managers/event.manager';
import { StorageManager } from '@/managers/storage.manager';
import { EventType, ScrollDirection, ErrorType, DeviceType } from '@/types';
import type { SessionEndReason } from '@/types';

describe('EventManager - Session Guard', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
  });

  describe('track() without sessionId', () => {
    it('should buffer CLICK events when sessionId is not set', () => {
      // Arrange: No session initialized
      expect(eventManager['get']('sessionId')).toBeUndefined();

      // Act: Attempt to track a click event
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      // Assert: Event should be buffered
      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer SCROLL events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: { depth: 50, direction: ScrollDirection.DOWN },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer PAGE_VIEW events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: 'https://example.com',
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer CUSTOM events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event', metadata: { key: 'value' } },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer WEB_VITALS events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'LCP', value: 1234 },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer ERROR events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.ERROR,
        error_data: { type: ErrorType.JS_ERROR, message: 'x is not defined' },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer SESSION_START events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.SESSION_START,
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer SESSION_END events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.SESSION_END,
        session_end_reason: 'inactivity' as SessionEndReason,
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });
  });

  describe('track() with sessionId', () => {
    beforeEach(() => {
      // Simulate session initialization
      eventManager['set']('sessionId', 'test-session-123');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'test-user-456');
      eventManager['set']('device', DeviceType.Desktop);
    });

    it('should process CLICK events when sessionId is set', () => {
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should process SCROLL events when sessionId is set', () => {
      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: { depth: 50, direction: ScrollDirection.DOWN },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should process SESSION_START events when sessionId is set', () => {
      eventManager['set']('hasStartSession', false);

      eventManager.track({
        type: EventType.SESSION_START,
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should not buffer events when session is active', () => {
      eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: 'https://example.com/page',
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'user_action' },
      });

      // Events should be in queue, not in buffer
      expect(eventManager.getQueueLength()).toBe(2);
      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
    });
  });

  describe('race condition during initialization', () => {
    it('should buffer events captured before session initialization completes', () => {
      // Simulate scenario where handlers start tracking BEFORE sessionId is set
      // This can happen during App.initializeHandlers() async gap

      // Step 1: EventManager created (no session yet)
      expect(eventManager['get']('sessionId')).toBeUndefined();

      // Step 2: Handler tries to track event (e.g., user clicks during init)
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 50, y: 50, relativeX: 0.25, relativeY: 0.25 },
      });

      // Step 3: Event should be buffered (not in main queue)
      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);

      // Step 4: Session initialization completes
      eventManager['set']('sessionId', 'session-after-init');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-123');
      eventManager['set']('device', DeviceType.Mobile);
      eventManager['set']('hasStartSession', false);

      // Step 5: Flush buffered events
      eventManager.flushPendingEvents();

      // Step 6: Buffered events should now be processed
      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should buffer rapid event bursts before session initialization', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      // Simulate multiple events firing during init window
      for (let i = 0; i < 10; i++) {
        eventManager.track({
          type: EventType.CLICK,
          click_data: { x: i * 10, y: i * 10, relativeX: i * 0.1, relativeY: i * 0.1 },
        });
      }

      // All events should be buffered
      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(10);

      // Initialize session
      eventManager['set']('sessionId', 'burst-session');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-456');
      eventManager['set']('device', DeviceType.Desktop);
      eventManager['set']('hasStartSession', false);

      // Flush buffer
      eventManager.flushPendingEvents();

      // All buffered events should now be in queue
      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(10);
    });

    it('should not flush pending events if session is not initialized', () => {
      // Buffer some events
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 10, y: 10, relativeX: 0.1, relativeY: 0.1 },
      });

      expect(eventManager['pendingEventsBuffer'].length).toBe(1);

      // Try to flush without session - should keep events in buffer (not discard)
      eventManager.flushPendingEvents();

      // Events should remain in buffer for future retry
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
      expect(eventManager.getQueueLength()).toBe(0);
    });

    it('should handle mixed event types in buffer', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      // Buffer different event types
      eventManager.track({ type: EventType.CLICK, click_data: { x: 10, y: 10, relativeX: 0.1, relativeY: 0.1 } });
      eventManager.track({ type: EventType.SCROLL, scroll_data: { depth: 25, direction: ScrollDirection.DOWN } });
      eventManager.track({ type: EventType.PAGE_VIEW, page_url: 'https://example.com/page' });
      eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'test' } });

      expect(eventManager['pendingEventsBuffer'].length).toBe(4);

      // Initialize and flush
      eventManager['set']('sessionId', 'mixed-session');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-789');
      eventManager['set']('device', DeviceType.Mobile);
      eventManager['set']('hasStartSession', false);

      eventManager.flushPendingEvents();

      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(4);
    });
  });
});
