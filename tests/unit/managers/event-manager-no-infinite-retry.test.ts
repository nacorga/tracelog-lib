import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { StateManager } from '../../../src/managers/state.manager';
import { EventType, DeviceType } from '../../../src/types';

/**
 * Critical Test: Verify NO infinite retry loops when API fails
 *
 * Issue: When API returns 500 or network error, events were staying in
 * in-memory queue AND persisting to localStorage, causing setInterval
 * to resend same events every 10 seconds forever.
 *
 * Fix: On failure, remove events from in-memory queue (they're already
 * persisted to localStorage for next-page recovery).
 */
describe('EventManager - No Infinite Retry Loops', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);

    // Mock global state
    const mockGet = vi.fn((key: string) => {
      if (key === 'sessionId') return 'test-session-123';
      if (key === 'userId') return 'test-user-456';
      if (key === 'collectApiUrl') return 'http://localhost:3000/collect';
      if (key === 'device') return DeviceType.Desktop;
      if (key === 'pageUrl') return 'http://localhost:3000/test';
      return undefined;
    });
    (StateManager.prototype as any).get = mockGet;

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    eventManager.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('500 Server Error (Temporary Failure)', () => {
    it('should NOT retry in-session when API returns 500', async () => {
      // Simulate persistent 500 error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Track a custom event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event', metadata: { value: 123 } },
      });

      // Verify event added to queue
      expect(eventManager.getQueueLength()).toBe(1);

      // Wait for first send (10 seconds)
      await vi.advanceTimersByTimeAsync(10000);
      await vi.runOnlyPendingTimersAsync();

      // Should have called API once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // CRITICAL: Queue should be empty (event removed to prevent infinite retry)
      expect(eventManager.getQueueLength()).toBe(0);

      // Wait another 30 seconds
      await vi.advanceTimersByTimeAsync(30000);

      // Should NOT have made additional requests (queue empty)
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, no retries
    });

    it('should NOT retry multiple events in queue', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Track 3 events
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'event1' },
      });
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'event2' },
      });
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'event3' },
      });

      expect(eventManager.getQueueLength()).toBe(3);

      // First send attempt (10s)
      await vi.advanceTimersByTimeAsync(10000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(eventManager.getQueueLength()).toBe(0); // All removed

      // Wait 50 seconds (5 intervals)
      await vi.advanceTimersByTimeAsync(50000);
      await vi.runAllTimersAsync();

      // Should NOT retry (queue empty)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Network Errors', () => {
    it('should NOT retry when network request fails', async () => {
      // Simulate network failure
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 50, relativeY: 100, text: 'Submit' },
      });

      expect(eventManager.getQueueLength()).toBe(1);

      // First attempt
      await vi.advanceTimersByTimeAsync(10000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(eventManager.getQueueLength()).toBe(0);

      // Wait for potential retries
      await vi.advanceTimersByTimeAsync(60000);
      await vi.runAllTimersAsync();

      // No retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry when request times out', async () => {
      // Simulate timeout (abort error)
      mockFetch.mockImplementation(async () => {
        return new Promise((_, reject) => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });

      eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: 'http://localhost:3000/dashboard',
      });

      await vi.advanceTimersByTimeAsync(10000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(eventManager.getQueueLength()).toBe(0);

      await vi.advanceTimersByTimeAsync(40000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Case (Control)', () => {
    it('should remove events from queue on success', async () => {
      // Simulate success
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'success_event' },
      });

      expect(eventManager.getQueueLength()).toBe(1);

      await vi.advanceTimersByTimeAsync(10000);
      await vi.runOnlyPendingTimersAsync();

      // Should call API
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Queue should be empty
      expect(eventManager.getQueueLength()).toBe(0);

      // No further requests (timer should be cleared)
      await vi.advanceTimersByTimeAsync(60000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Batch Send Threshold', () => {
    it('should NOT retry after immediate send fails (batch threshold)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      // Track 50 events (triggers immediate send)
      for (let i = 0; i < 50; i++) {
        eventManager.track({
          type: EventType.CUSTOM,
          custom_event: { name: `event_${i}` },
        });
      }

      // Allow immediate send to complete
      await vi.runAllTimersAsync();

      // Should have sent immediately (batch threshold reached)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Queue should be empty (all removed)
      expect(eventManager.getQueueLength()).toBe(0);

      // Wait for potential interval retries
      await vi.advanceTimersByTimeAsync(100000);
      await vi.runAllTimersAsync();

      // No retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Flush', () => {
    it('should NOT retry after manual flush fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'flush_test' },
      });

      expect(eventManager.getQueueLength()).toBe(1);

      // Manual flush
      await eventManager.flushImmediately();

      // Should have attempted send
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Queue should be empty
      expect(eventManager.getQueueLength()).toBe(0);

      // Wait for interval (should not retry)
      await vi.advanceTimersByTimeAsync(50000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Persistence Verification', () => {
    it('should persist failed events to localStorage', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'persist_test', metadata: { important: true } },
      });

      await vi.advanceTimersByTimeAsync(10000);
      await vi.runAllTimersAsync();

      // Event removed from queue (no infinite retry)
      expect(eventManager.getQueueLength()).toBe(0);

      // But should be persisted to localStorage
      const storageKey = 'tlog:test-user-456:queue';
      const persisted = storageManager.getItem(storageKey);

      expect(persisted).toBeTruthy();

      if (persisted) {
        const data = JSON.parse(persisted);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].custom_event?.name).toBe('persist_test');
        expect(data.timestamp).toBeDefined();
      }
    });
  });

  describe('Recovery After Failure', () => {
    it('should allow new events after previous failure', async () => {
      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'first_event' },
      });

      await vi.advanceTimersByTimeAsync(10000);
      await vi.runOnlyPendingTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(eventManager.getQueueLength()).toBe(0);

      // API recovers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track new event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'second_event' },
      });

      expect(eventManager.getQueueLength()).toBe(1);

      await vi.advanceTimersByTimeAsync(10000);
      await vi.runOnlyPendingTimersAsync();

      // Should send new event successfully
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(eventManager.getQueueLength()).toBe(0);
    });
  });
});
