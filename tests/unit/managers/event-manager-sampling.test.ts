import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '@/managers/event.manager';
import { StorageManager } from '@/managers/storage.manager';
import { StateManager } from '@/managers/state.manager';
import { EventType } from '@/types';

// Mock dependencies
vi.mock('@/managers/sender.manager', () => ({
  SenderManager: vi.fn().mockImplementation(() => ({
    sendEventsQueue: vi.fn(),
    recoverPersistedEvents: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('@/managers/storage.manager');
vi.mock('@/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventManager - Sampling', () => {
  let mockStorage: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createEventManager = async (samplingRate: number) => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as any;

    // Create a temporary StateManager to set up global state
    const tempStateManager = new (class extends StateManager {
      async setConfig(config: any) {
        await this.set('config', config);
      }
      async setPageUrl(url: string) {
        await this.set('pageUrl', url);
      }
      async setSessionId(id: string) {
        await this.set('sessionId', id);
      }
    })();

    // Set up global state
    await tempStateManager.setConfig({
      excludedUrlPaths: [],
      mode: 'production',
      samplingRate,
      ipExcluded: false,
      id: 'test-project',
    });
    await tempStateManager.setPageUrl('https://example.com');
    await tempStateManager.setSessionId('test-session');

    return new EventManager(mockStorage);
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
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as any;

    // Create a temporary StateManager to set up global state
    const tempStateManager = new (class extends StateManager {
      async setConfig(config: any) {
        await this.set('config', config);
      }
      async setPageUrl(url: string) {
        await this.set('pageUrl', url);
      }
      async setSessionId(id: string) {
        await this.set('sessionId', id);
      }
    })();

    // Set up global state without samplingRate
    await tempStateManager.setConfig({
      excludedUrlPaths: [],
      mode: 'production',
      ipExcluded: false,
      id: 'test-project',
    });
    await tempStateManager.setPageUrl('https://example.com');
    await tempStateManager.setSessionId('test-session');

    const eventManager = new EventManager(mockStorage);

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
