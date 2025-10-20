/**
 * API Emitter Methods Integration Tests
 *
 * Tests for TraceLog.on() and TraceLog.off() methods - event emitters
 * These tests verify the emitter methods work correctly with the full app lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import { EmitterEvent } from '../../src/types';

/**
 * Helper to wait for a condition to become true with polling.
 * Useful for async operations that need to settle in tests.
 */
async function waitForCondition(condition: () => boolean, timeoutMs = 500, intervalMs = 10): Promise<void> {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  if (!condition()) {
    throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
  }
}

describe('API Integration - Emitter Methods', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();

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

  describe('on() method', () => {
    describe('Before Initialization', () => {
      it('should buffer listeners when called before init()', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.on(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });

      it('should buffer queue listeners before init()', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.on(EmitterEvent.QUEUE, callback);
        }).not.toThrow();
      });
    });

    describe('After Initialization', () => {
      beforeEach(async () => {
        await TraceLog.init();
      });

      it('should register event listener successfully', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.on(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });

      it('should register queue listener successfully', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.on(EmitterEvent.QUEUE, callback);
        }).not.toThrow();
      });

      it('should receive events when listener is registered', async () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        TraceLog.event('test-event');

        // Give time for event to be emitted
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).toHaveBeenCalled();
      });

      it('should receive event data in callback', async () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        TraceLog.event('test-event', { key: 'value' });

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'custom',
            custom_event: expect.objectContaining({
              name: 'test-event',
              metadata: expect.objectContaining({ key: 'value' }),
            }),
          }),
        );
      });

      it('should support multiple listeners for the same event', async () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const callback3 = vi.fn();

        TraceLog.on(EmitterEvent.EVENT, callback1);
        TraceLog.on(EmitterEvent.EVENT, callback2);
        TraceLog.on(EmitterEvent.EVENT, callback3);

        TraceLog.event('multi-listener');

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
        expect(callback3).toHaveBeenCalled();
      });

      it('should receive all event types', async () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        TraceLog.event('event1');
        TraceLog.event('event2');
        TraceLog.event('event3');

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledTimes(3);
      });

      it('should receive automatic session events', async () => {
        const callback = vi.fn();

        // Register listener early to catch session_start
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));

        await TraceLog.init();
        TraceLog.on(EmitterEvent.EVENT, callback);

        // Send a custom event which will be tracked
        TraceLog.event('test-event');

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should receive at least the custom event
        expect(callback.mock.calls.length).toBeGreaterThan(0);
      });
    });
  });

  describe('off() method', () => {
    describe('Before Initialization', () => {
      it('should allow removing buffered listeners when called before init()', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.off(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });
    });

    describe('After Initialization', () => {
      beforeEach(async () => {
        await TraceLog.init();
      });

      it('should unregister event listener successfully', () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        expect(() => {
          TraceLog.off(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });

      it('should stop receiving events after unregistering', async () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        TraceLog.event('event-before');
        await new Promise((resolve) => setTimeout(resolve, 50));

        const callCountBefore = callback.mock.calls.length;

        TraceLog.off(EmitterEvent.EVENT, callback);

        TraceLog.event('event-after');
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Should not receive new events
        expect(callback.mock.calls.length).toBe(callCountBefore);
      });

      it('should only unregister specific callback', async () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        TraceLog.on(EmitterEvent.EVENT, callback1);
        TraceLog.on(EmitterEvent.EVENT, callback2);

        TraceLog.off(EmitterEvent.EVENT, callback1);

        TraceLog.event('test');
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should handle unregistering non-existent listener', () => {
        const callback = vi.fn();
        expect(() => {
          TraceLog.off(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });

      it('should handle unregistering same listener multiple times', () => {
        const callback = vi.fn();
        TraceLog.on(EmitterEvent.EVENT, callback);

        expect(() => {
          TraceLog.off(EmitterEvent.EVENT, callback);
          TraceLog.off(EmitterEvent.EVENT, callback);
          TraceLog.off(EmitterEvent.EVENT, callback);
        }).not.toThrow();
      });
    });
  });

  describe('Emitter Lifecycle', () => {
    it('should work after destroy and re-initialization', async () => {
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Re-initialization should work
      await TraceLog.init();
      const callback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, callback);

      TraceLog.event('test');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // New listener should work after re-initialization
      expect(callback).toHaveBeenCalled();
    });

    it('should allow registering new listeners after destroy', async () => {
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await TraceLog.init();
      const callback = vi.fn();

      // Should be able to register listeners after re-init
      expect(() => {
        TraceLog.on(EmitterEvent.EVENT, callback);
      }).not.toThrow();
    });
  });

  describe('Event and Queue Emitters', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should handle both event and queue listeners simultaneously', async () => {
      const eventCallback = vi.fn();
      const queueCallback = vi.fn();

      TraceLog.on(EmitterEvent.EVENT, eventCallback);
      TraceLog.on(EmitterEvent.QUEUE, queueCallback);

      TraceLog.event('test');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(eventCallback).toHaveBeenCalled();
      // Queue callback may or may not be called depending on batching
    });

    it('should allow mixed registration and unregistration', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      TraceLog.on(EmitterEvent.EVENT, callback1);
      TraceLog.on(EmitterEvent.QUEUE, callback2);

      expect(() => {
        TraceLog.off(EmitterEvent.EVENT, callback1);
        TraceLog.off(EmitterEvent.QUEUE, callback2);
      }).not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should handle valid callback registration', () => {
      const callback = vi.fn();

      // Registering a valid callback should not throw
      expect(() => {
        TraceLog.on(EmitterEvent.EVENT, callback);
      }).not.toThrow();
    });

    it('should handle undefined callback', () => {
      expect(() => {
        TraceLog.on(EmitterEvent.EVENT, undefined as any);
      }).not.toThrow();
    });

    it('should handle null callback', () => {
      expect(() => {
        TraceLog.on(EmitterEvent.EVENT, null as any);
      }).not.toThrow();
    });
  });

  describe('QUEUE Event Verification', () => {
    it('should receive QUEUE events when events are batched', async () => {
      vi.useFakeTimers();

      try {
        // Initialize with backend integration to trigger queue flushing
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
        await TraceLog.init({
          integrations: {
            custom: { collectApiUrl: 'https://test-api.example.com/collect' },
          },
        });

        const queueCallback = vi.fn();
        TraceLog.on(EmitterEvent.QUEUE, queueCallback);

        // Mock fetch to prevent actual network requests
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => Promise.resolve({}),
        } as Response);

        // Create multiple events to trigger queue flush
        for (let i = 0; i < 5; i++) {
          TraceLog.event(`event-${i}`, { index: i });
        }

        // Advance time to trigger interval-based flush (10 seconds)
        await vi.advanceTimersByTimeAsync(10100);

        // Switch to real timers to allow all async operations (promises, microtasks) to settle
        vi.useRealTimers();

        // Wait for the callback to be invoked with polling
        await waitForCondition(() => queueCallback.mock.calls.length > 0, 500);

        // QUEUE callback should have been called
        expect(queueCallback).toHaveBeenCalled();

        // Verify queue data structure
        const queueData = queueCallback.mock.calls[0]?.[0];
        expect(queueData).toBeDefined();
        expect(queueData).toHaveProperty('events');
        expect(queueData).toHaveProperty('session_id');
        expect(queueData).toHaveProperty('user_id');
        expect(queueData).toHaveProperty('device');
        expect(Array.isArray(queueData.events)).toBe(true);
        expect(typeof queueData.session_id).toBe('string');
        expect(typeof queueData.user_id).toBe('string');
        expect(typeof queueData.device).toBe('string');
        expect(['mobile', 'tablet', 'desktop', 'unknown']).toContain(queueData.device);

        // Verify events array contains our custom events
        expect(queueData.events.length).toBeGreaterThan(0);
        const customEvents = queueData.events.filter((e: any) => e.type === 'custom');
        expect(customEvents.length).toBeGreaterThan(0);

        fetchSpy.mockRestore();
      } finally {
        vi.useRealTimers();
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
      }
    });

    it('should include session_id in queue data, not in individual events', async () => {
      vi.useFakeTimers();

      try {
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
        await TraceLog.init({
          integrations: {
            custom: { collectApiUrl: 'https://test-api.example.com/collect' },
          },
        });

        const queueCallback = vi.fn();
        TraceLog.on(EmitterEvent.QUEUE, queueCallback);

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => Promise.resolve({}),
        } as Response);

        TraceLog.event('test-event');

        await vi.advanceTimersByTimeAsync(10100);

        // Switch to real timers to allow all async operations (promises, microtasks) to settle
        vi.useRealTimers();

        // Wait for the callback to be invoked with polling
        await waitForCondition(() => queueCallback.mock.calls.length > 0, 500);

        expect(queueCallback).toHaveBeenCalled();

        const queueData = queueCallback.mock.calls[0]?.[0];
        expect(queueData).toBeDefined();

        // session_id should be at queue level
        expect(queueData.session_id).toBeDefined();
        expect(typeof queueData.session_id).toBe('string');

        // Individual events should NOT have session_id (it's in queue metadata)
        queueData.events.forEach((event: any) => {
          expect(event.session_id).toBeUndefined();
        });

        fetchSpy.mockRestore();
      } finally {
        vi.useRealTimers();
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
      }
    });

    it('should emit QUEUE events with global metadata', async () => {
      vi.useFakeTimers();

      try {
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
        await TraceLog.init({
          globalMetadata: {
            appVersion: '1.0.0',
            environment: 'test',
          },
          integrations: {
            custom: { collectApiUrl: 'https://test-api.example.com/collect' },
          },
        });

        const queueCallback = vi.fn();
        TraceLog.on(EmitterEvent.QUEUE, queueCallback);

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => Promise.resolve({}),
        } as Response);

        TraceLog.event('test-event');

        await vi.advanceTimersByTimeAsync(10100);

        expect(queueCallback).toHaveBeenCalled();

        const queueData = queueCallback.mock.calls[0]?.[0];
        expect(queueData).toBeDefined();

        // Global metadata should be in queue data
        expect(queueData.global_metadata).toBeDefined();
        expect(queueData.global_metadata).toMatchObject({
          appVersion: '1.0.0',
          environment: 'test',
        });

        fetchSpy.mockRestore();
      } finally {
        vi.useRealTimers();
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
      }
    });

    it('should not emit QUEUE events when no backend is configured', async () => {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
      }
      await TraceLog.init({}); // No integrations

      const queueCallback = vi.fn();
      TraceLog.on(EmitterEvent.QUEUE, queueCallback);

      TraceLog.event('test-event');

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Queue callback should NOT be called (no backend to send to)
      expect(queueCallback).not.toHaveBeenCalled();
    });

    it('should batch multiple events in single QUEUE emission', async () => {
      vi.useFakeTimers();

      try {
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
        await TraceLog.init({
          integrations: {
            custom: { collectApiUrl: 'https://test-api.example.com/collect' },
          },
        });

        const queueCallback = vi.fn();
        TraceLog.on(EmitterEvent.QUEUE, queueCallback);

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => Promise.resolve({}),
        } as Response);

        // Create multiple events rapidly
        for (let i = 0; i < 10; i++) {
          TraceLog.event(`batch-event-${i}`);
        }

        await vi.advanceTimersByTimeAsync(10100);

        // Should have at least one queue emission
        expect(queueCallback).toHaveBeenCalled();

        // Find queue emission with our events
        const queueCalls = queueCallback.mock.calls;
        let totalEvents = 0;

        queueCalls.forEach((call) => {
          const queueData = call[0];
          totalEvents += queueData.events.length;
        });

        // All events should be batched and sent
        expect(totalEvents).toBeGreaterThan(0);

        fetchSpy.mockRestore();
      } finally {
        vi.useRealTimers();
        if (TraceLog.isInitialized()) {
          TraceLog.destroy();
        }
      }
    });
  });

  describe('Performance and Stress Tests', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should handle many listeners efficiently', () => {
      const callbacks = Array.from({ length: 100 }, () => vi.fn());

      expect(() => {
        callbacks.forEach((callback) => {
          TraceLog.on(EmitterEvent.EVENT, callback);
        });
      }).not.toThrow();
    });

    it('should handle many events efficiently', async () => {
      const callback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, callback);

      expect(() => {
        for (let i = 0; i < 50; i++) {
          TraceLog.event(`event-${i}`);
        }
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(callback).toHaveBeenCalled();
    });

    it('should generate unique IDs for all events', async () => {
      const eventIds = new Set<string>();
      const eventIdRegex = /^\d{13}-[0-9a-f]{8}$/;

      const callback = vi.fn((eventData) => {
        expect(eventData.id).toBeDefined();
        expect(typeof eventData.id).toBe('string');

        // Validate hybrid ID format: {timestamp}-{counter}-{random}
        expect(eventData.id).toMatch(eventIdRegex);

        // Track IDs for uniqueness check
        eventIds.add(eventData.id);
      });

      TraceLog.on(EmitterEvent.EVENT, callback);

      // Create 10 events rapidly
      for (let i = 0; i < 10; i++) {
        TraceLog.event(`event-${i}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // All events should have been emitted
      expect(callback).toHaveBeenCalledTimes(10);

      // All IDs should be unique (no collisions)
      expect(eventIds.size).toBe(10);
    });

    it('should preserve unique IDs across all emitted events', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Create multiple events rapidly
      TraceLog.event('event1', { key: 'value1' });
      TraceLog.event('event2', { key: 'value2' });
      TraceLog.event('event3', { key: 'value3' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // At least 3 events should have been emitted
      expect(eventCallback.mock.calls.length).toBeGreaterThanOrEqual(3);

      // Collect all emitted event IDs
      const eventIds = new Set<string>();
      const eventIdRegex = /^\d{13}-[0-9a-f]{8}$/;

      eventCallback.mock.calls.forEach((call) => {
        const eventData = call[0];
        if (eventData && eventData.type === 'custom') {
          // Verify ID exists and is valid hybrid ID format
          expect(eventData.id).toBeDefined();
          expect(typeof eventData.id).toBe('string');
          expect(eventData.id).toMatch(eventIdRegex);

          // Track IDs for uniqueness check
          eventIds.add(eventData.id);
        }
      });

      // All IDs should be unique
      expect(eventIds.size).toBeGreaterThanOrEqual(3);
    });
  });
});
