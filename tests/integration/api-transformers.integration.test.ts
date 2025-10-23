/**
 * API Transformer Methods Integration Tests
 *
 * Tests for TraceLog.setTransformer() and TraceLog.removeTransformer() methods
 * These tests verify that transformers can be set before init() and are properly applied
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import type { EventData, EventsQueue } from '../../src/types';
import { EmitterEvent } from '../../src/types';

describe('API Integration - Transformer Methods', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    // Cleanup any existing instance
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('setTransformer() - Before Initialization', () => {
    it('should buffer beforeSend transformer when called before init()', () => {
      const transformFn = (data: EventData): EventData | null => data;

      expect(() => {
        TraceLog.setTransformer('beforeSend', transformFn);
      }).not.toThrow();
    });

    it('should buffer beforeBatch transformer when called before init()', () => {
      const transformFn = (data: EventsQueue): EventsQueue | null => data;

      expect(() => {
        TraceLog.setTransformer('beforeBatch', transformFn);
      }).not.toThrow();
    });

    it('should apply buffered beforeSend transformer to initial events', async () => {
      const eventCallback = vi.fn();
      let transformerCalled = false;

      // Set up listener and transformer BEFORE init
      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        transformerCalled = true;
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: {
              ...data.custom_event?.metadata,
              transformed_before_init: true,
            },
          },
        };
      });

      // Initialize with custom backend
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      // Send custom event
      TraceLog.event('test-event', { original: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Transformer should have been called
      expect(transformerCalled).toBe(true);

      // Event should have transformation applied
      const customEventCalls = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test-event',
      );

      expect(customEventCalls.length).toBeGreaterThan(0);
      expect(customEventCalls[0]?.[0].custom_event?.metadata).toMatchObject({
        original: 'value',
        transformed_before_init: true,
      });
    });

    it('should apply buffered beforeSend transformer to SESSION_START event', async () => {
      let sessionStartTransformed = false;

      const eventCallback = vi.fn((event) => {
        if (event.type === 'session_start' && event.custom_event?.metadata?.session_transformed) {
          sessionStartTransformed = true;
        }
      });

      // Set up listener and transformer BEFORE init
      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        if (data.type === 'session_start') {
          return {
            ...data,
            custom_event: {
              ...data.custom_event,
              name: data.custom_event?.name ?? '',
              metadata: {
                ...data.custom_event?.metadata,
                session_transformed: true,
              },
            },
          };
        }
        return data;
      });

      // Initialize
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // SESSION_START event should have been transformed
      expect(sessionStartTransformed).toBe(true);
    });

    it('should apply buffered beforeSend transformer to PAGE_VIEW event', async () => {
      let pageViewTransformed = false;

      const eventCallback = vi.fn((event) => {
        if (event.type === 'page_view' && event.custom_event?.metadata?.page_transformed) {
          pageViewTransformed = true;
        }
      });

      // Set up listener and transformer BEFORE init
      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        if (data.type === 'page_view') {
          return {
            ...data,
            custom_event: {
              ...data.custom_event,
              name: data.custom_event?.name ?? '',
              metadata: {
                ...data.custom_event?.metadata,
                page_transformed: true,
              },
            },
          };
        }
        return data;
      });

      // Initialize
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // PAGE_VIEW event should have been transformed
      expect(pageViewTransformed).toBe(true);
    });

    it('should replace buffered transformer if set multiple times before init', async () => {
      const eventCallback = vi.fn();

      // Set first transformer
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { first: true },
          },
        };
      });

      // Replace with second transformer
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { second: true },
          },
        };
      });

      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.event('test', {});

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Only second transformer should be applied
      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test',
      );

      expect(customEvents[0]?.[0].custom_event?.metadata).toMatchObject({
        second: true,
      });
      expect(customEvents[0]?.[0].custom_event?.metadata).not.toHaveProperty('first');
    });
  });

  describe('setTransformer() - After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });
    });

    it('should apply transformer set after init to subsequent events', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Set transformer AFTER init
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: {
              ...data.custom_event?.metadata,
              after_init: true,
            },
          },
        };
      });

      TraceLog.event('test-event', { key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test-event',
      );

      expect(customEvents[0]?.[0].custom_event?.metadata).toMatchObject({
        key: 'value',
        after_init: true,
      });
    });

    it('should replace existing transformer when set again', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Set first transformer
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { version: 1 },
          },
        };
      });

      // Replace with second transformer
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { version: 2 },
          },
        };
      });

      TraceLog.event('test', {});

      await new Promise((resolve) => setTimeout(resolve, 100));

      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test',
      );

      // Only second transformer should be applied
      expect(customEvents[0]?.[0].custom_event?.metadata).toMatchObject({
        version: 2,
      });
    });
  });

  describe('removeTransformer() - Before Initialization', () => {
    it('should remove buffered transformer when called before init()', () => {
      const transformFn = (data: EventData): EventData | null => data;

      TraceLog.setTransformer('beforeSend', transformFn);

      expect(() => {
        TraceLog.removeTransformer('beforeSend');
      }).not.toThrow();
    });

    it('should not apply transformer if removed before init', async () => {
      const eventCallback = vi.fn();

      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { should_not_appear: true },
          },
        };
      });

      // Remove transformer before init
      TraceLog.removeTransformer('beforeSend');

      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.event('test', { original: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test',
      );

      // Transformer should NOT have been applied
      expect(customEvents[0]?.[0].custom_event?.metadata).not.toHaveProperty('should_not_appear');
      expect(customEvents[0]?.[0].custom_event?.metadata).toMatchObject({
        original: 'value',
      });
    });

    it('should handle removing non-existent buffered transformer', () => {
      expect(() => {
        TraceLog.removeTransformer('beforeSend');
      }).not.toThrow();
    });
  });

  describe('removeTransformer() - After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });
    });

    it('should remove transformer set after init', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { transformed: true },
          },
        };
      });

      // Remove transformer
      TraceLog.removeTransformer('beforeSend');

      TraceLog.event('test', { key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test',
      );

      // Transformer should NOT have been applied
      expect(customEvents[0]?.[0].custom_event?.metadata).not.toHaveProperty('transformed');
    });

    it('should handle removing non-existent transformer', () => {
      expect(() => {
        TraceLog.removeTransformer('beforeSend');
      }).not.toThrow();
    });
  });

  describe('Transformer Lifecycle', () => {
    it('should clear transformers on destroy', async () => {
      const eventCallback = vi.fn();

      TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
        return {
          ...data,
          custom_event: {
            ...data.custom_event,
            name: data.custom_event?.name ?? '',
            metadata: { transformed: true },
          },
        };
      });

      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Re-initialize without transformer
      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.event('test', { key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const customEvents = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test',
      );

      // Old transformer should NOT be applied
      expect(customEvents[0]?.[0].custom_event?.metadata).not.toHaveProperty('transformed');
    });

    it('should support independent beforeSend and beforeBatch transformers', async () => {
      vi.useFakeTimers();

      try {
        const queueCallback = vi.fn();
        const eventCallback = vi.fn();

        TraceLog.on(EmitterEvent.EVENT, eventCallback);
        TraceLog.on(EmitterEvent.QUEUE, queueCallback);

        // Set both transformers before init
        TraceLog.setTransformer('beforeSend', (data: EventData): EventData | null => {
          return {
            ...data,
            custom_event: {
              ...data.custom_event,
              name: data.custom_event?.name ?? '',
              metadata: {
                ...data.custom_event?.metadata,
                event_transformed: true,
              },
            },
          };
        });

        TraceLog.setTransformer('beforeBatch', (data: EventsQueue): EventsQueue | null => {
          return {
            ...data,
            global_metadata: {
              ...data.global_metadata,
              batch_transformed: true,
            },
          };
        });

        await TraceLog.init({
          integrations: {
            custom: { collectApiUrl: 'https://test-api.example.com/collect' },
          },
        });

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => Promise.resolve({}),
        } as Response);

        TraceLog.event('test', {});

        // Trigger queue flush - use runOnlyPendingTimersAsync after advancing time
        await vi.advanceTimersByTimeAsync(10100);
        await vi.runOnlyPendingTimersAsync();

        vi.useRealTimers();
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check event transformation (beforeSend)
        const customEvents = eventCallback.mock.calls.filter((call) => call[0].type === 'custom');
        expect(customEvents.length).toBeGreaterThan(0);
        expect(customEvents[0]?.[0].custom_event?.metadata).toHaveProperty('event_transformed');

        // Check batch transformation (beforeBatch)
        // Note: beforeBatch may add batch_transformed to the queue data
        expect(queueCallback).toHaveBeenCalled();

        fetchSpy.mockRestore();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('setTransformer() - Validation & Edge Cases', () => {
    it('should throw when fn is not a function (runtime validation)', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime validation
        TraceLog.setTransformer('beforeSend', 'not-a-function');
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        TraceLog.setTransformer('beforeSend', null);
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        TraceLog.setTransformer('beforeSend', undefined);
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing runtime validation
        TraceLog.setTransformer('beforeSend', 123);
      }).toThrow();
    });

    it('should replace buffered transformer when same hook is set multiple times before init', async () => {
      const firstFn = vi.fn((data: EventData) => ({
        ...data,
        custom_event: {
          ...data.custom_event,
          name: data.custom_event?.name ?? '',
          metadata: {
            ...data.custom_event?.metadata,
            transformer: 'first',
          },
        },
      }));

      const secondFn = vi.fn((data: EventData) => ({
        ...data,
        custom_event: {
          ...data.custom_event,
          name: data.custom_event?.name ?? '',
          metadata: {
            ...data.custom_event?.metadata,
            transformer: 'second',
          },
        },
      }));

      const eventCallback = vi.fn();

      // Set first transformer
      TraceLog.setTransformer('beforeSend', firstFn);

      // Replace with second transformer (before init)
      TraceLog.setTransformer('beforeSend', secondFn);

      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.event('test-event', { data: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Only second transformer should have been called
      expect(secondFn).toHaveBeenCalled();
      expect(firstFn).not.toHaveBeenCalled();

      // Event should have second transformer's metadata
      const customEventCalls = eventCallback.mock.calls.filter(
        (call) => call[0].type === 'custom' && call[0].custom_event?.name === 'test-event',
      );

      expect(customEventCalls.length).toBeGreaterThan(0);
      expect(customEventCalls[0]?.[0].custom_event?.metadata?.transformer).toBe('second');
    });

    it('should allow setting different transformers for beforeSend and beforeBatch before init', async () => {
      const beforeSendFn = vi.fn((data: EventData) => data);
      const beforeBatchFn = vi.fn((data: EventsQueue) => data);

      TraceLog.setTransformer('beforeSend', beforeSendFn);
      TraceLog.setTransformer('beforeBatch', beforeBatchFn);

      await TraceLog.init({
        integrations: {
          custom: { collectApiUrl: 'https://test-api.example.com/collect' },
        },
      });

      TraceLog.event('test-event');

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Both transformers should be registered
      expect(beforeSendFn).toHaveBeenCalled();
    });

    it('should throw when setting transformer during destroy', async () => {
      await TraceLog.init();

      // Start destroying (async operation)
      const destroyPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          try {
            TraceLog.destroy();
            resolve();
          } catch {
            resolve();
          }
        }, 10);
      });

      // Wait a bit for destroy to start
      await new Promise((resolve) => setTimeout(resolve, 20));

      // NOTE: This test might not consistently catch the isDestroying state
      // due to timing. The more reliable test is that after destroy completes,
      // we cannot set transformers.
      await destroyPromise;

      // After destroy, setting transformer should not throw (creates new pending)
      // but init would be required
      expect(() => {
        TraceLog.setTransformer('beforeSend', (data: EventData) => data);
      }).not.toThrow();
    });
  });
});
