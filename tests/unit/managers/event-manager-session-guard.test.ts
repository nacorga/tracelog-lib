/**
 * EventManager - Session Guard Tests
 *
 * Verifies that events captured before sessionId is set are buffered (not queued)
 * and that flushEvents() refuses to emit a batch when sessionId is missing.
 *
 * Regression coverage for the cold-start race that was producing batches with
 * `session_id === undefined` and getting rejected by the backend.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType, ScrollDirection, ErrorType } from '../../../src/types';
import { Emitter } from '../../../src/utils';

describe('EventManager - Session Guard', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, emitter, {});
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  describe('track() without sessionId', () => {
    it('should buffer CLICK events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
    });

    it('should buffer SCROLL events when sessionId is not set', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 50,
          direction: ScrollDirection.DOWN,
          container_selector: 'window',
          is_primary: true,
          velocity: 0,
          max_depth_reached: 50,
        },
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
  });

  describe('track() with sessionId', () => {
    beforeEach(() => {
      eventManager['set']('sessionId', 'test-session-123');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'test-user-456');
      eventManager['set']('device', MOCK_DEVICE_INFO);
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
        scroll_data: {
          depth: 50,
          direction: ScrollDirection.DOWN,
          container_selector: 'window',
          is_primary: true,
          velocity: 0,
          max_depth_reached: 50,
        },
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

      expect(eventManager.getQueueLength()).toBe(2);
      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
    });
  });

  describe('race condition during initialization', () => {
    it('should buffer events captured before session initialization completes', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 50, y: 50, relativeX: 0.25, relativeY: 0.25 },
      });

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(1);

      eventManager['set']('sessionId', 'session-after-init');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-123');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('hasStartSession', false);

      eventManager.flushPendingEvents();

      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should buffer rapid event bursts before session initialization', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      for (let i = 0; i < 10; i++) {
        eventManager.track({
          type: EventType.CLICK,
          click_data: { x: i * 10, y: i * 10, relativeX: i * 0.1, relativeY: i * 0.1 },
        });
      }

      expect(eventManager.getQueueLength()).toBe(0);
      expect(eventManager['pendingEventsBuffer'].length).toBe(10);

      eventManager['set']('sessionId', 'burst-session');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-456');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('hasStartSession', false);

      eventManager.flushPendingEvents();

      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(10);
    });

    it('should not flush pending events if session is not initialized', () => {
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 10, y: 10, relativeX: 0.1, relativeY: 0.1 },
      });

      expect(eventManager['pendingEventsBuffer'].length).toBe(1);

      eventManager.flushPendingEvents();

      expect(eventManager['pendingEventsBuffer'].length).toBe(1);
      expect(eventManager.getQueueLength()).toBe(0);
    });

    it('should handle mixed event types in buffer', () => {
      expect(eventManager['get']('sessionId')).toBeUndefined();

      eventManager.track({ type: EventType.CLICK, click_data: { x: 10, y: 10, relativeX: 0.1, relativeY: 0.1 } });
      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 25,
          direction: ScrollDirection.DOWN,
          container_selector: 'window',
          is_primary: true,
          velocity: 0,
          max_depth_reached: 25,
        },
      });
      eventManager.track({ type: EventType.PAGE_VIEW, page_url: 'https://example.com/page' });
      eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'test' } });

      expect(eventManager['pendingEventsBuffer'].length).toBe(4);

      eventManager['set']('sessionId', 'mixed-session');
      eventManager['set']('pageUrl', 'https://example.com');
      eventManager['set']('userId', 'user-789');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('hasStartSession', false);

      eventManager.flushPendingEvents();

      expect(eventManager['pendingEventsBuffer'].length).toBe(0);
      expect(eventManager.getQueueLength()).toBe(4);
    });
  });

  describe('buildEventPayload() page_url fallback', () => {
    it('should fall back to "unknown" when state.pageUrl is empty', () => {
      eventManager['set']('sessionId', 'session-123');
      eventManager['set']('userId', 'user-123');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('pageUrl', '');

      const payload = eventManager['buildEventPayload']({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      expect(payload).not.toBeNull();
      expect(payload!.page_url).toBe('unknown');
    });

    it('should fall back to "unknown" when explicit page_url is empty', () => {
      eventManager['set']('sessionId', 'session-456');
      eventManager['set']('userId', 'user-456');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('pageUrl', 'https://example.com/page');

      const payload = eventManager['buildEventPayload']({
        type: EventType.PAGE_VIEW,
        page_url: '',
      });

      expect(payload).not.toBeNull();
      expect(payload!.page_url).toBe('unknown');
    });

    it('should preserve a real URL', () => {
      eventManager['set']('sessionId', 'session-789');
      eventManager['set']('userId', 'user-789');
      eventManager['set']('device', MOCK_DEVICE_INFO);
      eventManager['set']('pageUrl', 'https://example.com/real');

      const payload = eventManager['buildEventPayload']({
        type: EventType.CUSTOM,
        custom_event: { name: 'real_url' },
      });

      expect(payload).not.toBeNull();
      expect(payload!.page_url).toBe('https://example.com/real');
    });
  });
});
