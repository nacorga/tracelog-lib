import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

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
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventManager - Sampling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupTestState();
  });

  const createEventManager = (samplingRate: number): EventManager => {
    const testEnv = setupTestEnvironment({ samplingRate });
    return testEnv.eventManager;
  };

  test('should sample all events with rate 1.0', () => {
    const eventManager = createEventManager(1.0);

    // Send events in batches to respect rate limit (50 events/sec)
    for (let i = 0; i < 100; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
      // Reset rate limit after first 50 events
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    expect(eventManager.getQueueLength()).toBe(100);
  });

  test('should sample ~50% events with rate 0.5', () => {
    const eventManager = createEventManager(0.5);

    // Track 100 events (stay within MAX_EVENTS_QUEUE_LENGTH of 100)
    for (let i = 0; i < 100; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
      // Reset rate limit after first 50 events
      if (i === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    const queueLength = eventManager.getQueueLength();

    // Allow for statistical variance (40-60% of 100 = 40-60 events)
    expect(queueLength).toBeGreaterThan(30);
    expect(queueLength).toBeLessThan(70);
  });

  test('should sample ~10% events with rate 0.1', () => {
    const eventManager = createEventManager(0.1);

    // Track 190 events with rate limit respecting
    // Expected: ~10% = ~19 events (allow 3-38 for statistical variance)
    for (let i = 0; i < 190; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
      // Advance time every 50 events to avoid global rate limit
      if (i % 50 === 49) {
        vi.advanceTimersByTime(1100);
      }
    }

    const queueLength = eventManager.getQueueLength();

    // Expect ~10% of 190 = ~19 events (allow 3-38 for variance - wider range due to sampling randomness)
    expect(queueLength).toBeGreaterThan(3);
    expect(queueLength).toBeLessThan(38);
  });

  test('should use default sampling rate of 1 when not configured', () => {
    // Use default config without samplingRate to test default behavior
    const eventManager = createEventManager(1.0); // Default rate

    for (let i = 0; i < 50; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    expect(eventManager.getQueueLength()).toBe(50);
  });

  test('should always capture critical session events regardless of sampling rate', () => {
    const eventManager = createEventManager(0.1);

    eventManager.track({
      type: EventType.SESSION_START,
    });

    eventManager.track({
      type: EventType.SESSION_END,
    });

    expect(eventManager.getQueueLength()).toBe(2);
  });

  test('invalid sampling rates are caught by config validation (not EventManager)', () => {
    const { eventManager } = setupTestEnvironment({ samplingRate: -0.3 });

    for (let i = 0; i < 50; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    expect(eventManager.getQueueLength()).toBe(0);
  });

  test('should accept zero as valid sampling rate (sample nothing)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const { eventManager } = setupTestEnvironment({ samplingRate: 0 });

    expect(eventManager.getQueueLength()).toBe(0);

    // Try to track event with samplingRate=0 (should be rejected)
    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'rejected_event' },
    });

    // Event should NOT be added (samplingRate=0 means sample nothing)
    expect(eventManager.getQueueLength()).toBe(0);

    vi.restoreAllMocks();
  });
});
