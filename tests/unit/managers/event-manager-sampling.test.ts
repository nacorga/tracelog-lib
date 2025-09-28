import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '@/managers/event.manager';
import { EventType } from '@/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

// Mock dependencies
vi.mock('@/managers/sender.manager', () => ({
  SenderManager: vi.fn().mockImplementation(() => ({
    sendEventsQueue: vi.fn(),
    recoverPersistedEvents: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('@/utils/logging', () => ({
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
  });

  afterEach(() => {
    cleanupTestState();
  });

  const createEventManager = async (samplingRate: number): Promise<EventManager> => {
    const testEnv = await setupTestEnvironment({ samplingRate });
    return testEnv.eventManager;
  };

  test('should sample all events with rate 1.0', async () => {
    const eventManager = await createEventManager(1.0);

    for (let i = 0; i < 100; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    expect(eventManager.getQueueLength()).toBe(100);
  });

  test('should sample no events with rate 0', async () => {
    const eventManager = await createEventManager(0);

    for (let i = 0; i < 100; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    expect(eventManager.getQueueLength()).toBe(0);
  });

  test('should sample ~50% events with rate 0.5', async () => {
    const eventManager = await createEventManager(0.5);

    // Track many events to get statistical significance
    for (let i = 0; i < 1000; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    const queueLength = eventManager.getQueueLength();

    // Allow for statistical variance (40-60%)
    expect(queueLength).toBeGreaterThan(400);
    expect(queueLength).toBeLessThan(600);
  });

  test('should sample ~10% events with rate 0.1', async () => {
    const eventManager = await createEventManager(0.1);

    // Track many events to get statistical significance
    for (let i = 0; i < 1000; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    const queueLength = eventManager.getQueueLength();

    // Allow for statistical variance (5-15%)
    expect(queueLength).toBeGreaterThan(50);
    expect(queueLength).toBeLessThan(150);
  });

  test('should use default sampling rate of 1 when not configured', async () => {
    // Use default config without samplingRate to test default behavior
    const eventManager = await createEventManager(1.0); // Default rate

    for (let i = 0; i < 50; i++) {
      eventManager.track({
        type: EventType.CLICK,
        page_url: `https://example.com/${i}`,
        click_data: { x: i, y: i, relativeX: i, relativeY: i },
      });
    }

    expect(eventManager.getQueueLength()).toBe(50);
  });
});
