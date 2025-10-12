import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventType } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';
import { MAX_SAME_EVENT_PER_MINUTE } from '../../../src/constants/config.constants';

// Mock dependencies
vi.mock('../../../src/managers/sender.manager', () => ({
  SenderManager: vi.fn().mockImplementation(() => ({
    sendEventsQueue: vi.fn(),
    sendEventsQueueSync: vi.fn(),
    recoverPersistedEvents: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('../../../src/utils/logging', () => ({
  log: vi.fn(),
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventManager - Per-Event-Name Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTestState();
    vi.restoreAllMocks();
  });

  test('should allow CUSTOM events up to maxSameEventPerMinute limit', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 5 });

    // Track 5 events with same name but different pages to avoid deduplication
    for (let i = 0; i < 5; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event', metadata: { count: i } },
      });
    }

    expect(eventManager.getQueueLength()).toBe(5);
  });

  test('should reject CUSTOM events exceeding maxSameEventPerMinute limit', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 60 });

    // Track 61 events with same name but different pages - 61st should be rejected
    for (let i = 0; i < 61; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event', metadata: { count: i } },
      });
      // Advance time every 50 events to avoid global rate limit (50 events/sec)
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    // Only 60 should make it to the queue
    expect(eventManager.getQueueLength()).toBe(60);
  });

  test('should track different event names independently', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 60 });

    // Track 60 of event_a with different pages
    for (let i = 0; i < 60; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/a-${i}`,
        custom_event: { name: 'event_a' },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    // Track 60 of event_b with different pages
    for (let i = 0; i < 60; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/b-${i}`,
        custom_event: { name: 'event_b' },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    // Both should be tracked independently (120 total, limited by MAX_EVENTS_QUEUE_LENGTH)
    expect(eventManager.getQueueLength()).toBe(100); // Limited by MAX_EVENTS_QUEUE_LENGTH
  });

  test('should reset rate limit window after 60 seconds', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 60 });

    // Track 60 events - all should succeed
    for (let i = 0; i < 60; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event' },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    expect(eventManager.getQueueLength()).toBe(60);

    // Try to track 61st - should be rejected
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: 'https://example.com/page-61',
      custom_event: { name: 'test_event' },
    });

    expect(eventManager.getQueueLength()).toBe(60);

    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000);

    // Now should be able to track again
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: 'https://example.com/page-62',
      custom_event: { name: 'test_event' },
    });

    expect(eventManager.getQueueLength()).toBe(61);
  });

  test('should use default MAX_SAME_EVENT_PER_MINUTE when not configured', () => {
    const { eventManager } = setupTestEnvironment({});

    // Track default limit (60) events
    for (let i = 0; i < MAX_SAME_EVENT_PER_MINUTE; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event' },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    expect(eventManager.getQueueLength()).toBe(MAX_SAME_EVENT_PER_MINUTE);

    // Next one should be rejected
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: `https://example.com/page-${MAX_SAME_EVENT_PER_MINUTE}`,
      custom_event: { name: 'test_event' },
    });

    expect(eventManager.getQueueLength()).toBe(MAX_SAME_EVENT_PER_MINUTE);
  });

  test('should respect custom maxSameEventPerMinute config', () => {
    const customLimit = 10;
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: customLimit });

    // Track up to custom limit
    for (let i = 0; i < customLimit; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event' },
      });
    }

    expect(eventManager.getQueueLength()).toBe(customLimit);

    // Next one should be rejected
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: `https://example.com/page-${customLimit}`,
      custom_event: { name: 'test_event' },
    });

    expect(eventManager.getQueueLength()).toBe(customLimit);
  });

  test('should not apply rate limiting to non-CUSTOM events', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 10 });

    // Track 100 CLICK events with different pages - should not be rate limited by per-event logic
    for (let i = 0; i < 100; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/page-${i}`,
        click_data: { x: i, y: i, relativeX: 0, relativeY: 0 },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    expect(eventManager.getQueueLength()).toBe(100);
  });

  test('should allow CUSTOM events without name (should not crash)', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 60 });

    // Track CUSTOM event without name - should be allowed (falls through rate limit)
    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: '' },
    });

    expect(eventManager.getQueueLength()).toBe(1);
  });

  test('should handle sliding window correctly', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 3 });

    // Track 3 events at t=0
    for (let i = 0; i < 3; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event' },
      });
    }
    expect(eventManager.getQueueLength()).toBe(3);

    // Advance 30 seconds - oldest events still in window
    vi.advanceTimersByTime(30000);

    // Should still be rejected (3 events in last 60s)
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: 'https://example.com/page-3',
      custom_event: { name: 'test_event' },
    });
    expect(eventManager.getQueueLength()).toBe(3);

    // Advance another 31 seconds (total 61s) - first events now expired
    vi.advanceTimersByTime(31000);

    // Should now be allowed (old events outside 60s window)
    for (let i = 0; i < 3; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-new-${i}`,
        custom_event: { name: 'test_event' },
      });
    }
    expect(eventManager.getQueueLength()).toBe(6);
  });

  test('should clear per-event rate limits on stop()', () => {
    const { eventManager } = setupTestEnvironment({ maxSameEventPerMinute: 2 });

    // Track 2 events to hit limit
    for (let i = 0; i < 2; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-${i}`,
        custom_event: { name: 'test_event' },
      });
    }

    expect(eventManager.getQueueLength()).toBe(2);

    // Stop clears queue AND rate limit map
    eventManager.stop();
    expect(eventManager.getQueueLength()).toBe(0); // Queue cleared by stop()

    // After stop, rate limit map should be cleared
    // Track 2 more events - should succeed without waiting 60s (proves map was cleared)
    for (let i = 0; i < 2; i++) {
      eventManager.track({
        type: EventType.CUSTOM,
        page_url: `https://example.com/page-new-${i}`,
        custom_event: { name: 'test_event' },
      });
    }

    // Should be 2 events in queue (not 0, because we're adding after stop)
    expect(eventManager.getQueueLength()).toBe(2);
  });
});
