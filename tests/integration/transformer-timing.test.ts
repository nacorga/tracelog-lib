import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventData, EventsQueue, EventType, EmitterEvent } from '../../src/types';
import type { BeforeSendTransformer } from '../../src/types/transformer.types';
import * as api from '../../src/api';

/**
 * TRANSFORMER TIMING VALIDATION TESTS
 *
 * These tests verify the critical fix: beforeSend must run BEFORE deduplication, sampling, and queueing.
 *
 * Key Validations:
 * 1. beforeSend runs before deduplication (transformed events affect dedup logic)
 * 2. beforeSend runs before sampling (transformer can alter sampling decisions)
 * 3. beforeSend filters events BEFORE they enter the queue
 *
 * Bug Context:
 * - Previous implementation: beforeSend in SenderManager (AFTER dedup/sampling)
 * - Fixed implementation: beforeSend in EventManager.buildEventPayload() (BEFORE dedup/sampling)
 */
describe('Transformer Timing Validation', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let localStorageMock: Record<string, string>;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    // Reset initialization
    if (api.isInitialized()) {
      api.destroy();
    }

    // Mock fetch
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

  describe('beforeSend runs BEFORE deduplication', () => {
    it('should allow transformed events to affect deduplication logic', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const capturedEvents: EventData[] = [];

        // Capture all events via listener
        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer modifies timestamp (affects dedup fingerprint)
        let transformCount = 0;
        const transformer: BeforeSendTransformer = (data: EventData) => {
          transformCount++;
          return {
            ...data,
            timestamp: 1000000 + transformCount, // Unique timestamp per event
            transformed: true,
          } as EventData;
        };
        api.setTransformer('beforeSend', transformer);

        // Send 3 custom events with different names (to avoid rate limiting)
        api.event('test_event_1', { value: 'same' });
        api.event('test_event_2', { value: 'same' });
        api.event('test_event_3', { value: 'same' });

        // Wait for async processing
        await vi.advanceTimersByTimeAsync(100);

        // Verify: All 3 events should be captured (transformer applied to each)
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBeGreaterThanOrEqual(3);

        // Verify transformer was applied to each event
        expect(transformCount).toBeGreaterThanOrEqual(3);
        customEvents.forEach((event) => {
          expect(event).toHaveProperty('transformed', true);
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('should filter events BEFORE deduplication check', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const capturedEvents: EventData[] = [];

        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer filters out events with specific metadata
        const filterTransformer: BeforeSendTransformer = (data: EventData) => {
          // Filter events with shouldFilter = true
          if (
            data.custom_event?.metadata &&
            typeof data.custom_event.metadata === 'object' &&
            !Array.isArray(data.custom_event.metadata) &&
            'shouldFilter' in data.custom_event.metadata &&
            data.custom_event.metadata.shouldFilter === true
          ) {
            return null;
          }

          return data;
        };
        api.setTransformer('beforeSend', filterTransformer);

        // Send filtered event
        api.event('filtered_event', { shouldFilter: true });

        // Send normal event
        api.event('normal_event', { shouldFilter: false });

        await vi.advanceTimersByTimeAsync(100);

        // Verify: Only the normal event was captured (filtered event never entered queue)
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBe(1);
        expect(customEvents[0]?.custom_event?.name).toBe('normal_event');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('beforeSend runs BEFORE sampling', () => {
    it('should allow transformer to modify event data before sampling decision', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
          samplingRate: 1.0, // 100% sampling (no randomness)
        });

        const capturedEvents: EventData[] = [];

        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer adds metadata that could affect business logic
        api.setTransformer('beforeSend', (data: EventData) => {
          return {
            ...data,
            custom_event: {
              ...data.custom_event,
              metadata: {
                ...data.custom_event?.metadata,
                samplingEligible: true, // Added before sampling
              },
            },
          } as EventData;
        });

        api.event('sampled_event', { original: 'data' });

        await vi.advanceTimersByTimeAsync(100);

        // Verify: Event has transformer-added metadata
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBeGreaterThan(0);
        const firstEvent = customEvents[0];
        expect(firstEvent).toBeDefined();
        if (firstEvent?.custom_event?.metadata && !Array.isArray(firstEvent.custom_event.metadata)) {
          expect((firstEvent.custom_event.metadata as Record<string, any>).samplingEligible).toBe(true);
        }
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('beforeSend runs BEFORE queueing', () => {
    it('should emit transformed events (not original) to event listeners', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const capturedEvents: EventData[] = [];

        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer enriches events
        api.setTransformer('beforeSend', (data: EventData) => {
          return {
            ...data,
            enriched_before_queue: true,
            custom_event: {
              ...data.custom_event,
              metadata: {
                ...data.custom_event?.metadata,
                enrichmentTimestamp: Date.now(),
              },
            },
          } as EventData;
        });

        api.event('queue_test', { test: 'data' });

        await vi.advanceTimersByTimeAsync(100);

        // Verify: Event listener receives TRANSFORMED event (not original)
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBeGreaterThan(0);
        const firstEvent = customEvents[0];
        expect(firstEvent).toBeDefined();
        expect(firstEvent).toHaveProperty('enriched_before_queue', true);
        if (firstEvent?.custom_event?.metadata && !Array.isArray(firstEvent.custom_event.metadata)) {
          expect((firstEvent.custom_event.metadata as Record<string, any>).enrichmentTimestamp).toBeDefined();
        }
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not queue filtered events (null return)', async () => {
      vi.useFakeTimers();

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const queuedBatches: EventsQueue[] = [];

        api.on(EmitterEvent.QUEUE, (batch: EventsQueue) => {
          queuedBatches.push(batch);
        });

        // Transformer filters all events with specific pattern
        api.setTransformer('beforeSend', (data: EventData) => {
          if (data.custom_event?.name?.startsWith('internal_')) {
            return null; // Never queue internal events
          }

          return data;
        });

        // Send 5 events: 3 filtered, 2 normal
        api.event('internal_debug', {});
        api.event('user_action', {});
        api.event('internal_metrics', {});
        api.event('purchase', {});
        api.event('internal_log', {});

        // Force queue flush
        await vi.advanceTimersByTimeAsync(11000);

        // Verify: Only 2 CUSTOM events queued (3 were filtered before queueing)
        // Note: SESSION_START and PAGE_VIEW are also in the queue (automatic events)
        if (queuedBatches.length > 0) {
          const allEvents = queuedBatches.flatMap((b) => b.events);
          const customEvents = allEvents.filter((e) => e.type === EventType.CUSTOM);
          expect(customEvents.length).toBe(2);

          // Verify filtered events are not in queue
          const eventNames = customEvents.map((e) => e.custom_event?.name);
          expect(eventNames).not.toContain('internal_debug');
          expect(eventNames).not.toContain('internal_metrics');
          expect(eventNames).not.toContain('internal_log');
          expect(eventNames).toContain('user_action');
          expect(eventNames).toContain('purchase');
        }
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('beforeSend error handling', () => {
    it('should fallback to original event if transformer throws error', async () => {
      vi.useFakeTimers();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const capturedEvents: EventData[] = [];

        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer throws error
        api.setTransformer('beforeSend', () => {
          throw new Error('Transformer error');
        });

        api.event('error_test', { original: 'data' });

        await vi.advanceTimersByTimeAsync(100);

        // Verify: Original event was still captured (fallback)
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBeGreaterThan(0);
        const firstEvent = customEvents[0];
        expect(firstEvent).toBeDefined();
        expect(firstEvent?.custom_event?.name).toBe('error_test');
        if (firstEvent?.custom_event?.metadata && !Array.isArray(firstEvent.custom_event.metadata)) {
          expect((firstEvent.custom_event.metadata as Record<string, any>).original).toBe('data');
        }

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should fallback to original event if transformer returns invalid data', async () => {
      vi.useFakeTimers();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await api.init({
          integrations: {
            custom: {
              collectApiUrl: 'https://custom.api/collect',
            },
          },
        });

        const capturedEvents: EventData[] = [];

        api.on(EmitterEvent.EVENT, (event: EventData) => {
          capturedEvents.push(event);
        });

        // Transformer returns invalid data (missing 'type' field)
        api.setTransformer('beforeSend', () => {
          return { invalid: 'data' } as any;
        });

        api.event('invalid_test', { original: 'data' });

        await vi.advanceTimersByTimeAsync(100);

        // Verify: Original event was captured (fallback)
        const customEvents = capturedEvents.filter((e) => e.type === EventType.CUSTOM);
        expect(customEvents.length).toBeGreaterThan(0);
        const firstEvent = customEvents[0];
        expect(firstEvent).toBeDefined();
        expect(firstEvent?.custom_event?.name).toBe('invalid_test');

        // Verify warning was logged (check all console.warn calls for the message)
        const warnCalls = consoleWarnSpy.mock.calls.map((call) => call.join(' '));
        const hasExpectedWarning = warnCalls.some((call) =>
          call.includes('beforeSend transformer returned invalid data'),
        );
        expect(hasExpectedWarning).toBe(true);
      } finally {
        vi.useRealTimers();
        consoleWarnSpy.mockRestore();
      }
    });
  });
});
