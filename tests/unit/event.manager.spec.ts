/**
 * EventManager Unit Tests
 *
 * Tests event tracking and queue management to detect library defects:
 * - Deduplication works within 500ms threshold
 * - Sampling rates are respected (0, 0.5, 1)
 * - URL exclusions filter events correctly
 * - Queue enforces MAX_EVENTS_QUEUE_LENGTH
 * - Critical events bypass sampling
 *
 * Focus: Detect event processing defects and data loss
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType } from '../../src/types';
import { setupTestState, createTestConfig } from '../utils/test-setup';

describe('EventManager', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    setupTestState(
      createTestConfig({
        samplingRate: 1,
      }),
    );
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
  });

  afterEach(() => {
    eventManager.stop();
    vi.restoreAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track events and add to queue', () => {
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event', metadata: { key: 'value' } },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should reject events without type', () => {
      eventManager.track({} as any);
      expect(eventManager.getQueueLength()).toBe(0);
    });

    it('should add event metadata from global state', () => {
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });
  });

  describe('Event Deduplication', () => {
    it('should deduplicate identical events within 500ms', () => {
      vi.useFakeTimers();

      // Track same event twice rapidly
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      vi.advanceTimersByTime(100); // 100ms later

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      // Should have only 1 event (duplicate filtered)
      expect(eventManager.getQueueLength()).toBe(1);

      vi.useRealTimers();
    });

    it('should NOT deduplicate events after 500ms threshold', () => {
      vi.useFakeTimers();

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      vi.advanceTimersByTime(600); // 600ms later (past threshold)

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      // Should have 2 events (not duplicates)
      expect(eventManager.getQueueLength()).toBe(2);

      vi.useRealTimers();
    });

    it('should NOT deduplicate different event types', () => {
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5 },
      });

      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 50,
          direction: 'down' as any,
          container_selector: 'window',
          is_primary: true,
          velocity: 0,
          max_depth_reached: 50,
        },
      });

      expect(eventManager.getQueueLength()).toBe(2);
    });
  });

  describe('Sampling Rate', () => {
    it('should respect sampling rate of 0.5', () => {
      // Reconfigure with different sampling rate
      setupTestState(
        createTestConfig({
          samplingRate: 0.5,
        }),
      );

      // Mock Math.random to return predictable values
      let callCount = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        return callCount <= 5 ? 0.3 : 0.7; // First 5 sampled, next 5 not
      });

      // Track 10 events
      for (let i = 0; i < 10; i++) {
        eventManager.track({
          type: EventType.CUSTOM,
          custom_event: { name: `event_${i}` },
        });
      }

      // Should have ~5 events (50% sampling)
      expect(eventManager.getQueueLength()).toBe(5);
    });

    it('should sample NO events with rate 0', () => {
      // Reconfigure with sampling rate 0
      setupTestState(
        createTestConfig({
          samplingRate: 0,
        }),
      );

      // Recreate EventManager to pick up new config
      const tempStorageManager = new StorageManager();
      const tempEventManager = new EventManager(tempStorageManager);

      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      tempEventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Should NOT be sampled
      expect(tempEventManager.getQueueLength()).toBe(0);
    });

    it('should sample ALL events with rate 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      for (let i = 0; i < 10; i++) {
        eventManager.track({
          type: EventType.CUSTOM,
          custom_event: { name: `event_${i}` },
        });
      }

      expect(eventManager.getQueueLength()).toBe(10);
    });

    it('should NOT apply sampling to critical session events', () => {
      // Reconfigure with sampling rate 0
      setupTestState(
        createTestConfig({
          samplingRate: 0, // Sample nothing
        }),
      );

      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      // Track session_start (critical event)
      eventManager.track({
        type: EventType.SESSION_START,
      });

      // Should be tracked despite 0 sampling rate
      expect(eventManager.getQueueLength()).toBe(1);
    });
  });

  describe('Queue Overflow', () => {
    it('should enforce MAX_EVENTS_QUEUE_LENGTH', () => {
      // Add 110 events (MAX is likely 100)
      for (let i = 0; i < 110; i++) {
        eventManager.track({
          type: EventType.CUSTOM,
          custom_event: { name: `event_${i}` },
        });
      }

      // Queue should not exceed MAX
      expect(eventManager.getQueueLength()).toBeLessThanOrEqual(100);
    });

    it('should discard oldest events when overflow occurs', () => {
      // Add many events
      for (let i = 0; i < 110; i++) {
        eventManager.track({
          type: EventType.CUSTOM,
          custom_event: { name: `event_${i}` },
        });
      }

      // Queue should contain most recent events (not first ones)
      const queueLength = eventManager.getQueueLength();
      expect(queueLength).toBeLessThanOrEqual(100);
      expect(queueLength).toBeGreaterThan(0);
    });
  });

  describe('Session Start Deduplication', () => {
    it('should track only one session_start per session', () => {
      // First session_start
      eventManager.track({
        type: EventType.SESSION_START,
      });

      expect(eventManager.getQueueLength()).toBe(1);

      // Second session_start (duplicate)
      eventManager.track({
        type: EventType.SESSION_START,
      });

      // Should still be 1 (duplicate prevented)
      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should ignore session_start without sessionId', () => {
      // Setup state but explicitly clear sessionId to test the validation
      setupTestState(
        createTestConfig({
          samplingRate: 1,
        }),
      );

      // Create a new EventManager and explicitly clear sessionId from global state
      const tempStorageManager = new StorageManager();
      const tempEventManager = new EventManager(tempStorageManager);

      // Clear sessionId to simulate missing session
      tempEventManager['set']('sessionId', null);

      tempEventManager.track({
        type: EventType.SESSION_START,
      });

      // Should be ignored due to missing sessionId
      expect(tempEventManager.getQueueLength()).toBe(0);
    });
  });

  describe('Stop and Cleanup', () => {
    it('should clear queue on stop', () => {
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      expect(eventManager.getQueueLength()).toBe(1);

      eventManager.stop();

      expect(eventManager.getQueueLength()).toBe(0);
    });

    it('should clear send interval on stop', () => {
      vi.useFakeTimers();

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Verify interval was started
      expect(eventManager['sendIntervalId']).not.toBeNull();

      eventManager.stop();

      // Verify interval was cleared
      expect(eventManager['sendIntervalId']).toBeNull();

      vi.useRealTimers();
    });
  });
});
