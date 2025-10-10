import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventType, ScrollDirection } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';
import { BATCH_SIZE_THRESHOLD } from '../../../src/constants/config.constants';

// Mock dependencies
vi.mock('../../../src/managers/sender.manager', () => ({
  SenderManager: vi.fn().mockImplementation(() => ({
    sendEventsQueue: vi.fn().mockResolvedValue(true),
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

describe('EventManager - Dynamic Queue Flush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestState();
  });

  test('should auto-flush queue when BATCH_SIZE_THRESHOLD is reached', () => {
    const testEnv = setupTestEnvironment({});
    const eventManager = testEnv.eventManager;

    // Get reference to mocked sendEventsQueue
    const sendEventsQueueSpy = vi.spyOn(eventManager as any, 'sendEventsQueue');

    // Track events up to BATCH_SIZE_THRESHOLD - 1
    for (let i = 0; i < BATCH_SIZE_THRESHOLD - 1; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/page-${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    // sendEventsQueue should NOT have been called yet
    expect(sendEventsQueueSpy).not.toHaveBeenCalled();

    // Track one more event to reach BATCH_SIZE_THRESHOLD
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com/threshold',
      click_data: { x: 50, y: 50, relativeX: 50, relativeY: 50 },
    });

    // sendEventsQueue should have been called immediately
    expect(sendEventsQueueSpy).toHaveBeenCalledTimes(1);
  });

  test('should continue auto-flushing on subsequent batches', () => {
    const testEnv = setupTestEnvironment({});
    const eventManager = testEnv.eventManager;

    const sendEventsQueueSpy = vi.spyOn(eventManager as any, 'sendEventsQueue');

    // First batch: reach BATCH_SIZE_THRESHOLD
    for (let i = 0; i < BATCH_SIZE_THRESHOLD; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/batch1-${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    const firstBatchCallCount = sendEventsQueueSpy.mock.calls.length;
    expect(firstBatchCallCount).toBeGreaterThanOrEqual(1);

    // Second batch: reach BATCH_SIZE_THRESHOLD again
    for (let i = 0; i < BATCH_SIZE_THRESHOLD; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/batch2-${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    // Should have triggered more flushes
    expect(sendEventsQueueSpy.mock.calls.length).toBeGreaterThan(firstBatchCallCount);
  });

  test('should not auto-flush before BATCH_SIZE_THRESHOLD', () => {
    const testEnv = setupTestEnvironment({});
    const eventManager = testEnv.eventManager;

    const sendEventsQueueSpy = vi.spyOn(eventManager as any, 'sendEventsQueue');

    // Track fewer events than threshold
    for (let i = 0; i < BATCH_SIZE_THRESHOLD - 10; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/page-${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    // Should not have triggered auto-flush
    expect(sendEventsQueueSpy).not.toHaveBeenCalled();
  });

  test('should work with mixed event types', () => {
    const testEnv = setupTestEnvironment({});
    const eventManager = testEnv.eventManager;

    const sendEventsQueueSpy = vi.spyOn(eventManager as any, 'sendEventsQueue');

    // Mix of event types
    const eventTypes = [EventType.CLICK, EventType.PAGE_VIEW, EventType.SCROLL, EventType.CUSTOM] as const;

    for (let i = 0; i < BATCH_SIZE_THRESHOLD; i++) {
      const type = eventTypes[i % eventTypes.length] as (typeof eventTypes)[number];

      switch (type) {
        case EventType.CLICK:
          eventManager.track({
            type: EventType.CLICK,
            page_url: `https://example.com/${i}`,
            click_data: { x: i, y: i, relativeX: i, relativeY: i },
          });
          break;
        case EventType.PAGE_VIEW:
          eventManager.track({
            type: EventType.PAGE_VIEW,
            page_url: `https://example.com/${i}`,
          });
          break;
        case EventType.SCROLL:
          eventManager.track({
            type: EventType.SCROLL,
            page_url: `https://example.com/${i}`,
            scroll_data: {
              depth: i,
              direction: ScrollDirection.DOWN,
              container_selector: 'window',
              is_primary: true,
              velocity: 100,
              max_depth_reached: i,
            },
          });
          break;
        case EventType.CUSTOM:
          eventManager.track({
            type: EventType.CUSTOM,
            page_url: `https://example.com/${i}`,
            custom_event: { name: `event-${i}`, metadata: {} },
          });
          break;
        default:
          // This should never happen with our controlled test data
          throw new Error(`Unexpected event type: ${type as string}`);
      }
    }

    // Should trigger auto-flush with mixed event types
    expect(sendEventsQueueSpy).toHaveBeenCalledTimes(1);
  });

  test('should handle rapid event bursts efficiently', () => {
    const testEnv = setupTestEnvironment({});
    const eventManager = testEnv.eventManager;

    const sendEventsQueueSpy = vi.spyOn(eventManager as any, 'sendEventsQueue');

    // Simulate rapid burst of 150 events (3x BATCH_SIZE_THRESHOLD)
    for (let i = 0; i < BATCH_SIZE_THRESHOLD * 3; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/burst-${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    // Should have triggered flush at least 3 times
    expect(sendEventsQueueSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
