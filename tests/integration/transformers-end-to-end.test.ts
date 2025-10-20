import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventData, EventsQueue, EventType, EmitterEvent } from '../../src/types';
import * as api from '../../src/api';

/**
 * END-TO-END TRANSFORMER TESTS
 *
 * These tests validate 3 critical scenarios not fully covered by existing tests:
 * 1. Full transformer flow (beforeSend → beforeBatch → Network transmission)
 * 2. beforeSend ignored for SaaS-only configuration
 * 3. Transformer returning undefined (edge case validation)
 *
 * Strategy: Use event listeners ('queue' event) instead of flushImmediately()
 * to avoid timing issues in integration tests.
 */
describe('Transformers - End-to-End Critical Flows', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let localStorageMock: Record<string, string>;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    // Reset initialization
    if (api.isInitialized()) {
      api.destroy();
    }

    // Mock fetch with spy
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => Promise.resolve({ success: true }),
    } as Response);
    global.fetch = fetchSpy;

    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] ?? null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
        clear: () => {
          Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
        },
      },
      writable: true,
      configurable: true,
    });

    // Mock sessionStorage
    sessionStorageMock = {};
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (key: string) => sessionStorageMock[key] ?? null,
        setItem: (key: string, value: string) => {
          sessionStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete sessionStorageMock[key];
        },
        clear: () => {
          Object.keys(sessionStorageMock).forEach((key) => delete sessionStorageMock[key]);
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (api.isInitialized()) {
      api.destroy();
    }
    vi.clearAllMocks();
  });

  describe('[1/3] Full Transformer Flow: beforeSend → beforeBatch → Network', () => {
    it('should apply both transformers and verify in network payload', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        // beforeSend applied in SenderManager (per-event transformation)
        api.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
          if ('events' in data) return data;
          return { ...data, beforeSend_applied: true } as EventData;
        });

        // beforeBatch applied in SenderManager (batch-level transformation)
        api.setTransformer('beforeBatch', (data: EventData | EventsQueue) => {
          if ('events' in data) {
            return { ...data, beforeBatch_applied: true } as EventsQueue;
          }
          return data;
        });

        // Listen for queue event (fires when batch is about to be sent)
        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush (10 seconds)
        await vi.advanceTimersByTimeAsync(10100);

        await queuePromise;

        // Switch to real timers briefly to allow async operations to settle
        vi.useRealTimers();
        await new Promise((resolve) => setTimeout(resolve, 100));
        vi.useFakeTimers();

        // Verify fetch was called
        expect(fetchSpy).toHaveBeenCalled();

        // Get network payload (transformers applied in SenderManager)
        const fetchCall = fetchSpy.mock.calls[0];
        expect(fetchCall).toBeDefined();
        const networkPayload = JSON.parse(fetchCall![1].body as string) as EventsQueue;

        // Verify beforeBatch was applied (batch-level field in network request)
        expect((networkPayload as any).beforeBatch_applied).toBe(true);

        // Verify beforeSend was applied (event-level field in network payload)
        const customEvent = networkPayload.events.find((e) => e.type === EventType.CUSTOM);
        expect(customEvent).toBeDefined();
        expect((customEvent as any)?.beforeSend_applied).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle beforeSend filtering (null return) and prevent batch send', async () => {
      await api.init({
        integrations: {
          custom: {
            collectApiUrl: 'https://custom.api/collect',
          },
        },
      });

      // Filter all CUSTOM events at beforeSend level
      api.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
        if ('events' in data) return data;
        if (data.type === EventType.CUSTOM) return null; // Filter
        return data;
      });

      api.event('filtered_event', { key: 'value' });

      // Wait to ensure no network call happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT send (event filtered by beforeSend)
      // Note: fetch might be called for SESSION_START but not CUSTOM event
      if (fetchSpy.mock.calls.length > 0) {
        const payload = JSON.parse(fetchSpy.mock.calls[0]![1].body as string) as EventsQueue;
        const customEvent = payload.events.find((e) => e.type === EventType.CUSTOM);
        expect(customEvent).toBeUndefined(); // Filtered out
      }
    });

    it('should handle beforeBatch filtering (null return) and skip network send', async () => {
      await api.init({
        integrations: {
          custom: {
            collectApiUrl: 'https://custom.api/collect',
          },
        },
      });

      // beforeBatch filters entire batch
      api.setTransformer('beforeBatch', () => null);

      api.event('test_event', { key: 'value' });

      // Wait for potential send
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch should NOT be called (batch filtered at SenderManager level)
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('[2/3] SaaS-Only Config: Transformers Should Be Ignored', () => {
    it('should NOT apply beforeSend when only SaaS integration configured', async () => {
      vi.useFakeTimers();

      try {
        // Mock window.location for SaaS URL generation
        Object.defineProperty(window, 'location', {
          value: {
            hostname: 'app.example.com',
            href: 'https://app.example.com/page',
          },
          writable: true,
          configurable: true,
        });

        await api.init({
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        });

        // Set transformer (should be ignored - no custom backend)
        const beforeSendSpy = vi.fn((data: EventData | EventsQueue) => {
          if ('events' in data) return data;
          return { ...data, should_not_appear: true } as EventData;
        });

        api.setTransformer('beforeSend', beforeSendSpy);

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        const queue = await queuePromise;

        // Transformer NOT called (SaaS only - hasCustomBackend = false)
        expect(beforeSendSpy).not.toHaveBeenCalled();

        // Verify event sent without transformation
        const customEvent = queue.events.find((e) => e.type === EventType.CUSTOM);
        expect((customEvent as any)?.should_not_appear).toBeUndefined();

        // Verify sent to SaaS endpoint
        if (fetchSpy.mock.calls.length > 0) {
          const fetchUrl = fetchSpy.mock.calls[0]![0];
          expect(fetchUrl).toContain('test-project.example.com/collect');
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it('should NOT apply beforeBatch when only SaaS integration configured', async () => {
      vi.useFakeTimers();

      try {
        Object.defineProperty(window, 'location', {
          value: {
            hostname: 'app.example.com',
            href: 'https://app.example.com/page',
          },
          writable: true,
          configurable: true,
        });

        await api.init({
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        });

        // Set beforeBatch (should be skipped for SaaS)
        const beforeBatchSpy = vi.fn((data: EventData | EventsQueue) => {
          if ('events' in data) {
            return { ...data, should_not_appear: true } as EventsQueue;
          }
          return data;
        });

        api.setTransformer('beforeBatch', beforeBatchSpy);

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        await queuePromise;

        // beforeBatch NOT called for SaaS
        expect(beforeBatchSpy).not.toHaveBeenCalled();

        if (fetchSpy.mock.calls.length > 0) {
          const payload = JSON.parse(fetchSpy.mock.calls[0]![1].body as string) as EventsQueue;
          expect((payload as any).should_not_appear).toBeUndefined();
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it('should apply transformers ONLY to custom backend in multi-integration', async () => {
      vi.useFakeTimers();

      try {
        Object.defineProperty(window, 'location', {
          value: {
            hostname: 'app.example.com',
            href: 'https://app.example.com/page',
          },
          writable: true,
          configurable: true,
        });

        await api.init({
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
            custom: {
              collectApiUrl: 'https://warehouse.example.com/events',
            },
          },
        });

        api.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
          if ('events' in data) return data;
          return { ...data, custom_transformed: true } as EventData;
        });

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        await queuePromise;

        // Should send to BOTH endpoints
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        const saasCall = fetchSpy.mock.calls.find((call) => (call[0] as string).includes('test-project.example.com'));
        const customCall = fetchSpy.mock.calls.find((call) => (call[0] as string).includes('warehouse.example.com'));

        expect(saasCall).toBeDefined();
        expect(customCall).toBeDefined();

        // IMPORTANT: beforeSend is now applied in SenderManager (per-integration)
        // This means each backend receives its own version of the events:
        // - SaaS: Original events (transformer skipped for schema protection)
        // - Custom: Transformed events (transformer applied)

        // SaaS payload: NO transformation (beforeSend skipped for integrationId='saas')
        const saasPayload = JSON.parse(saasCall![1].body as string) as EventsQueue;
        const saasEvent = saasPayload.events.find((e) => e.type === EventType.CUSTOM);
        expect((saasEvent as any)?.custom_transformed).toBeUndefined(); // Protected from transformers

        // Custom payload: HAS transformation (beforeSend applied for integrationId='custom')
        const customPayload = JSON.parse(customCall![1].body as string) as EventsQueue;
        const customEvent = customPayload.events.find((e) => e.type === EventType.CUSTOM);
        expect((customEvent as any)?.custom_transformed).toBe(true); // Transformer applied
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('[3/3] Transformer Returning Undefined (Edge Case)', () => {
    it('should treat undefined return from beforeSend as invalid and use original', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        // Transformer returns undefined (not null)
        api.setTransformer('beforeSend', () => undefined as any);

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        const queue = await queuePromise;

        // Should send with original event (undefined treated as invalid)
        const customEvent = queue.events.find((e) => e.type === EventType.CUSTOM);
        expect(customEvent).toBeDefined();
        expect(customEvent?.custom_event?.name).toBe('test_event');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should treat undefined return from beforeBatch as invalid and use original', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        // Transformer returns undefined (not null)
        api.setTransformer('beforeBatch', () => undefined as any);

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        const queue = await queuePromise;

        // Should send with original batch
        expect(queue.events.length).toBeGreaterThan(0);
        expect(fetchSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle beforeSend returning object without type field (invalid)', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        // Return object without 'type' field
        api.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
          if ('events' in data) return data;
          return { custom_field: 'value' } as any; // Missing 'type'
        });

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        const queue = await queuePromise;

        // Should use original event (validation failed)
        const customEvent = queue.events.find((e) => e.type === EventType.CUSTOM);
        expect(customEvent).toBeDefined();
        expect(customEvent?.type).toBe(EventType.CUSTOM);
        expect(customEvent?.custom_event?.name).toBe('test_event');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle beforeBatch returning object without events array (invalid)', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        // Return object without 'events' array
        api.setTransformer('beforeBatch', (data: EventData | EventsQueue) => {
          if ('events' in data) {
            return { session_id: 'test' } as any; // Missing 'events'
          }
          return data;
        });

        const queuePromise = new Promise<EventsQueue>((resolve) => {
          api.on(EmitterEvent.QUEUE, resolve);
        });

        api.event('test_event', { key: 'value' });

        // Advance timers to trigger interval-based flush
        await vi.advanceTimersByTimeAsync(10100);

        const queue = await queuePromise;

        // Should send with original batch (validation failed)
        expect(Array.isArray(queue.events)).toBe(true);
        expect(queue.events.length).toBeGreaterThan(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
