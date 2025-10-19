import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { StateManager } from '../../../src/managers/state.manager';
import { EventsQueue, EventType, EventData } from '../../../src/types';
import { TransformerHook } from '../../../src/types/transformer.types';

describe('SenderManager - Transformer Edge Cases', () => {
  let senderManager: SenderManager;
  let storageManager: StorageManager;
  let transformers: Map<TransformerHook, (data: EventData | EventsQueue) => EventData | EventsQueue | null>;

  const mockEventsQueue = (): EventsQueue => {
    return {
      events: [
        {
          type: EventType.PAGE_VIEW,
          page_view: {
            title: 'Test Page',
            pathname: '/',
            referrer: '',
          },
        },
        {
          type: EventType.CLICK,
          click: {
            element: 'button',
            text: 'Click Me',
          },
        },
      ],
      session_id: 'test-session',
      user_id: 'test-user',
      device: 'desktop',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  };

  const getFetchPayload = (): EventsQueue => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) {
      throw new Error('Expected fetch to be called');
    }
    return JSON.parse(fetchCall[1].body as string) as EventsQueue;
  };

  beforeEach(() => {
    storageManager = new StorageManager();
    transformers = new Map();

    // Mock global state
    const mockGet = vi.fn((key: string) => {
      if (key === 'userId') return 'test-user';
      if (key === 'sessionId') return 'test-session';
      return undefined;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (StateManager.prototype as any).get = mockGet;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  describe('beforeSend transformer - error handling', () => {
    it('should use original batch if beforeSend throws error', async () => {
      const throwingTransformer = vi.fn().mockImplementation(() => {
        throw new Error('Transformer error');
      });

      transformers.set('beforeSend', throwingTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(throwingTransformer).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original events preserved
    });

    it('should filter out events that return null from beforeSend', async () => {
      const filterTransformer = vi.fn().mockImplementation((event: EventData) => {
        if (event.type === EventType.CLICK) {
          return null; // Filter out clicks
        }
        return event;
      });

      transformers.set('beforeSend', filterTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(filterTransformer).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(1); // Only PAGE_VIEW
      expect(payload.events[0]?.type).toBe(EventType.PAGE_VIEW);
    });

    it('should return true and not send if all events filtered by beforeSend', async () => {
      const filterAllTransformer = vi.fn().mockReturnValue(null);

      transformers.set('beforeSend', filterAllTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(filterAllTransformer).toHaveBeenCalledTimes(2);
      expect(global.fetch).not.toHaveBeenCalled(); // No API call if all filtered
    });

    it('should use original event if beforeSend returns invalid data', async () => {
      const invalidTransformer = vi.fn().mockImplementation((event: EventData) => {
        if (event.type === EventType.CLICK) {
          return { invalid: 'data', missing: 'type' }; // Missing required 'type' field
        }
        return event;
      });

      transformers.set('beforeSend', invalidTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(invalidTransformer).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2);
      // CLICK event should be original (fallback)
      expect(payload.events[1]?.type).toBe(EventType.CLICK);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((payload.events[1] as any)?.click).toBeDefined();
    });

    it('should handle non-object return values from beforeSend', async () => {
      const invalidTransformer = vi.fn().mockReturnValue('string' as unknown as EventData);

      transformers.set('beforeSend', invalidTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original events preserved
    });
  });

  describe('beforeBatch transformer - error handling', () => {
    it('should use original batch if beforeBatch throws error', async () => {
      const throwingTransformer = vi.fn().mockImplementation(() => {
        throw new Error('Batch transformer error');
      });

      transformers.set('beforeBatch', throwingTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(throwingTransformer).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original batch preserved
    });

    it('should return true and not send if beforeBatch returns null', async () => {
      const filterBatchTransformer = vi.fn().mockReturnValue(null);

      transformers.set('beforeBatch', filterBatchTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(filterBatchTransformer).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled(); // No API call if batch filtered
    });

    it('should use original batch if beforeBatch returns invalid data (missing events array)', async () => {
      const invalidTransformer = vi.fn().mockReturnValue({
        session_id: 'test',
        user_id: 'test',
        // Missing 'events' array
      });

      transformers.set('beforeBatch', invalidTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original batch preserved
    });

    it('should handle non-object return values from beforeBatch', async () => {
      const invalidTransformer = vi.fn().mockReturnValue('string' as unknown as EventsQueue);

      transformers.set('beforeBatch', invalidTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original batch preserved
    });
  });

  describe('transformer chaining (beforeSend + beforeBatch)', () => {
    it('should apply beforeSend then beforeBatch in sequence', async () => {
      const beforeSend = vi.fn().mockImplementation((event: EventData) => ({
        ...event,
        transformed_by: 'beforeSend',
      }));

      const beforeBatch = vi.fn().mockImplementation((queue: EventsQueue) => ({
        ...queue,
        transformed_by: 'beforeBatch',
        events: queue.events.map((e) => ({ ...e, batch_processed: true })),
      }));

      transformers.set('beforeSend', beforeSend);
      transformers.set('beforeBatch', beforeBatch);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(beforeSend).toHaveBeenCalledTimes(2);
      expect(beforeBatch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((payload as any).transformed_by).toBe('beforeBatch');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((payload.events[0] as any)?.batch_processed).toBe(true);
    });

    it('should not call beforeBatch if beforeSend filters all events', async () => {
      const beforeSend = vi.fn().mockReturnValue(null);
      const beforeBatch = vi.fn();

      transformers.set('beforeSend', beforeSend);
      transformers.set('beforeBatch', beforeBatch);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(beforeSend).toHaveBeenCalled();
      expect(beforeBatch).not.toHaveBeenCalled(); // Skipped due to empty batch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('transformer behavior for saas integration', () => {
    it('should skip beforeSend transformer for saas integration', async () => {
      const beforeSend = vi.fn().mockReturnValue(null);

      transformers.set('beforeSend', beforeSend);
      senderManager = new SenderManager(storageManager, 'saas', 'https://saas.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(beforeSend).not.toHaveBeenCalled(); // Skipped for saas
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original events
    });

    it('should skip beforeBatch transformer for saas integration', async () => {
      const beforeBatch = vi.fn().mockReturnValue(null);

      transformers.set('beforeBatch', beforeBatch);
      senderManager = new SenderManager(storageManager, 'saas', 'https://saas.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(beforeBatch).not.toHaveBeenCalled(); // Skipped for saas
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(2); // Original events
    });
  });

  describe('transformer behavior in sendEventsQueueSync', () => {
    beforeEach(() => {
      global.navigator = {
        sendBeacon: vi.fn().mockReturnValue(true),
      } as unknown as Navigator;
    });

    it('should apply beforeSend and beforeBatch in sync send', () => {
      const beforeSend = vi.fn().mockImplementation((event: EventData) => event);
      const beforeBatch = vi.fn().mockImplementation((queue: EventsQueue) => queue);

      transformers.set('beforeSend', beforeSend);
      transformers.set('beforeBatch', beforeBatch);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = senderManager.sendEventsQueueSync(queue);

      expect(result).toBe(true);
      expect(beforeSend).toHaveBeenCalledTimes(2);
      expect(beforeBatch).toHaveBeenCalledTimes(1);
      expect(global.navigator.sendBeacon).toHaveBeenCalled();
    });

    it('should handle beforeSend filtering in sync send', () => {
      const beforeSend = vi.fn().mockReturnValue(null);

      transformers.set('beforeSend', beforeSend);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = senderManager.sendEventsQueueSync(queue);

      expect(result).toBe(true);
      expect(beforeSend).toHaveBeenCalled();
      expect(global.navigator.sendBeacon).not.toHaveBeenCalled(); // No send if all filtered
    });

    it('should handle beforeBatch filtering in sync send', () => {
      const beforeBatch = vi.fn().mockReturnValue(null);

      transformers.set('beforeBatch', beforeBatch);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = senderManager.sendEventsQueueSync(queue);

      expect(result).toBe(true);
      expect(beforeBatch).toHaveBeenCalled();
      expect(global.navigator.sendBeacon).not.toHaveBeenCalled(); // No send if batch filtered
    });
  });

  describe('transformer validation helpers', () => {
    it('should correctly validate EventData with type field', async () => {
      const transformer = vi.fn().mockReturnValue({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      transformers.set('beforeSend', transformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events[0]?.type).toBe(EventType.CUSTOM);
    });

    it('should correctly validate EventsQueue with events array', async () => {
      const transformer = vi.fn().mockReturnValue({
        events: [{ type: EventType.CUSTOM, custom_event: { name: 'test' } }],
        session_id: 'test',
        user_id: 'test',
      });

      transformers.set('beforeBatch', transformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // payload already retrieved
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0]?.type).toBe(EventType.CUSTOM);
    });
  });

  describe('transformer edge cases with recovery', () => {
    beforeEach(() => {
      global.navigator = {
        sendBeacon: vi.fn().mockReturnValue(true),
      } as unknown as Navigator;
    });

    it('should apply transformers during recovery', async () => {
      const beforeSend = vi.fn().mockImplementation((event: EventData) => event);
      const beforeBatch = vi.fn().mockImplementation((queue: EventsQueue) => queue);

      transformers.set('beforeSend', beforeSend);
      transformers.set('beforeBatch', beforeBatch);

      // First create manager and simulate a failed send to persist events
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const sendResult = await senderManager.sendEventsQueue(queue);
      expect(sendResult).toBe(false); // Failed, should persist

      // Clear transformer call counts
      beforeSend.mockClear();
      beforeBatch.mockClear();

      // Now recover with successful fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await senderManager.recoverPersistedEvents();

      // Transformers ARE applied during recovery (same path as normal send)
      expect(beforeSend).toHaveBeenCalled();
      expect(beforeBatch).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('multi-integration scenarios', () => {
    it('should apply transformers only to custom backend in multi-integration setup', async () => {
      const beforeSend = vi.fn().mockImplementation((event: EventData) => ({
        ...event,
        transformed: true,
      }));

      transformers.set('beforeSend', beforeSend);

      // Create two SenderManager instances: one for saas, one for custom
      const saasSender = new SenderManager(storageManager, 'saas', 'https://saas.api/collect', transformers);
      const customSender = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();

      // Send via SaaS - transformers should be skipped
      await saasSender.sendEventsQueue(queue);
      expect(beforeSend).not.toHaveBeenCalled();

      // Send via Custom - transformers should be applied
      await customSender.sendEventsQueue(queue);
      expect(beforeSend).toHaveBeenCalled();

      // Verify custom backend received transformed events
      const customFetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const secondCall = customFetchCalls[1];
      expect(secondCall).toBeDefined();
      const customPayload = JSON.parse(secondCall![1].body as string) as EventsQueue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((customPayload.events[0] as any).transformed).toBe(true);
    });

    it('should skip transformers for saas backend even with custom backend present', async () => {
      const beforeBatch = vi.fn().mockReturnValue(null);

      transformers.set('beforeBatch', beforeBatch);

      const saasSender = new SenderManager(storageManager, 'saas', 'https://saas.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await saasSender.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(beforeBatch).not.toHaveBeenCalled(); // Skipped for saas
      expect(global.fetch).toHaveBeenCalled(); // But still sent to API
    });
  });

  describe('additional edge cases', () => {
    it('should handle undefined return from beforeSend (fallback to original)', async () => {
      const undefinedTransformer = vi.fn().mockReturnValue(undefined);

      transformers.set('beforeSend', undefinedTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(undefinedTransformer).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled(); // Uses original events (fallback)

      const payload = getFetchPayload();
      expect(payload.events).toHaveLength(2); // Original events preserved
    });

    it('should handle empty events array from beforeBatch', async () => {
      const emptyBatchTransformer = vi.fn().mockImplementation((queue: EventsQueue) => ({
        ...queue,
        events: [],
      }));

      transformers.set('beforeBatch', emptyBatchTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(emptyBatchTransformer).toHaveBeenCalled();
      // Should still send (empty array is valid)
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      expect(payload.events).toHaveLength(0);
    });

    it('should handle mixed valid/invalid/null returns from beforeSend', async () => {
      let callCount = 0;
      const mixedTransformer = vi.fn().mockImplementation((event: EventData) => {
        callCount++;
        if (callCount === 1) {
          return null; // Filter first event
        }
        if (callCount === 2) {
          return { invalid: 'missing type field' }; // Invalid second event
        }
        return event; // Valid for rest
      });

      transformers.set('beforeSend', mixedTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(mixedTransformer).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalled();

      const payload = getFetchPayload();
      // First event filtered, second event fell back to original
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0]?.type).toBe(EventType.CLICK); // Second original event
    });

    it('should handle beforeBatch returning events array with null elements', async () => {
      const nullElementsTransformer = vi.fn().mockImplementation((queue: EventsQueue) => ({
        ...queue,
        events: [null, queue.events[0], undefined, queue.events[1]] as unknown as EventData[],
      }));

      transformers.set('beforeBatch', nullElementsTransformer);
      senderManager = new SenderManager(storageManager, 'custom', 'https://custom.api/collect', transformers);

      const queue = mockEventsQueue();
      const result = await senderManager.sendEventsQueue(queue);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      // Should send with null/undefined elements (validation happens in EventManager, not SenderManager)
      const payload = getFetchPayload();
      expect(payload.events).toHaveLength(4); // Includes null/undefined
    });
  });
});
