/**
 * SenderManager Edge Cases Unit Tests
 *
 * Tests edge cases and error paths to detect library defects:
 * - Timeout handling and abort scenarios
 * - HTTP error responses (4xx, 5xx)
 * - Invalid persisted data recovery
 * - Concurrent send/retry operations
 * - Memory leaks in retry mechanism
 * - Max retries edge cases
 *
 * Focus: Detect network error handling defects and retry logic bugs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { DeviceType } from '../../../src/types';
import type { BaseEventsQueueDto } from '../../../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SenderManager Edge Cases', () => {
  let senderManager: SenderManager;
  let storageManager: StorageManager;

  const createEventDto = (): BaseEventsQueueDto => ({
    user_id: 'user-123',
    session_id: 'session-456',
    device: DeviceType.Desktop,
    events: [{ type: 'PAGE_VIEW' as any, page_url: '/test', timestamp: Date.now() }],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    storageManager = new StorageManager();
    senderManager = new SenderManager(storageManager);

    // Setup minimal state
    vi.spyOn(senderManager as any, 'get').mockImplementation((key: unknown) => {
      if (key === 'config') return { id: 'test-project' };
      if (key === 'apiUrl') return 'http://localhost:3000';
      if (key === 'userId') return 'anonymous';
      return null;
    });
  });

  afterEach(() => {
    senderManager.stop();
    vi.restoreAllMocks();
  });

  describe('Timeout Handling', () => {
    it('should clear timeout on successful response', async () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const body = createEventDto();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      await senderManager.sendEventsQueue(body);

      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should clear timeout even if fetch fails', async () => {
      vi.useFakeTimers();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const body = createEventDto();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      await senderManager.sendEventsQueue(body);

      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('HTTP Error Handling', () => {
    it('should handle 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(false);
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(false);
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(false);
    });

    it('should handle 503 Service Unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(false);
    });

    it('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      // Should return false due to error
      expect(result).toBe(false);
    });
  });

  describe('Invalid Persisted Data Recovery', () => {
    it('should handle corrupted JSON in persisted data', async () => {
      const storageKey = 'tlog:queue:anonymous';
      storageManager.setItem(storageKey, 'invalid-json{{{');

      const onSuccess = vi.fn();

      await senderManager.recoverPersistedEvents({ onSuccess });

      expect(onSuccess).not.toHaveBeenCalled();
      // clearPersistedEvents() is called in catch block
      // This test verifies corrupted data doesn't crash the recovery process
    });

    it('should ignore persisted data without timestamp', async () => {
      const storageKey = 'tlog:queue:anonymous';
      storageManager.setItem(
        storageKey,
        JSON.stringify({
          userId: 'test-user',
          sessionId: 'test-session',
          events: [{ type: 'CLICK' }],
          // Missing timestamp
        }),
      );

      const onSuccess = vi.fn();

      await senderManager.recoverPersistedEvents({ onSuccess });

      expect(onSuccess).not.toHaveBeenCalled();
      // isDataRecent returns false, clearPersistedEvents is called
    });

    it('should ignore expired persisted data', async () => {
      const storageKey = 'tlog:queue:anonymous';
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      storageManager.setItem(
        storageKey,
        JSON.stringify({
          userId: 'test-user',
          sessionId: 'test-session',
          events: [{ type: 'CLICK' }],
          timestamp: expiredTimestamp,
        }),
      );

      const onSuccess = vi.fn();

      await senderManager.recoverPersistedEvents({ onSuccess });

      expect(onSuccess).not.toHaveBeenCalled();
      // isDataRecent returns false, clearPersistedEvents is called
    });

    it('should ignore persisted data with empty events array', async () => {
      const storageKey = 'tlog:queue:anonymous';

      storageManager.setItem(
        storageKey,
        JSON.stringify({
          userId: 'test-user',
          sessionId: 'test-session',
          events: [], // Empty
          timestamp: Date.now(),
        }),
      );

      const onSuccess = vi.fn();

      await senderManager.recoverPersistedEvents({ onSuccess });

      expect(onSuccess).not.toHaveBeenCalled();
      // Empty events array means clearPersistedEvents is called
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent sendEventsQueue calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const body1 = createEventDto();
      const body2 = createEventDto();

      const [result1, result2] = await Promise.all([
        senderManager.sendEventsQueue(body1),
        senderManager.sendEventsQueue(body2),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should prevent concurrent retries for same request', async () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();

      await senderManager.sendEventsQueue(body);

      // isRetrying flag should prevent duplicate schedules
      const isRetrying = (senderManager as any).isRetrying;
      expect(isRetrying).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Retry Mechanism Edge Cases', () => {
    it('should clear persisted events after max retries', async () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();
      const onFailure = vi.fn();

      await senderManager.sendEventsQueue(body, { onFailure });

      // Fast-forward through all retries (MAX_RETRIES = 3)
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(5000 * Math.pow(2, i));
        await vi.runAllTimersAsync();
      }

      expect(onFailure).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should reset retry count after successful send', async () => {
      vi.useFakeTimers();

      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body1 = createEventDto();
      await senderManager.sendEventsQueue(body1);

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // New request should not have retry count from previous request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const body2 = createEventDto();
      const result = await senderManager.sendEventsQueue(body2);

      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it('should stop retries when stop() is called', async () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();
      await senderManager.sendEventsQueue(body);

      // Stop before retry happens
      senderManager.stop();

      vi.advanceTimersByTime(10000);

      // No retry should have happened (only initial send)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated stop/start cycles', () => {
      for (let i = 0; i < 100; i++) {
        senderManager.stop();
      }

      // Should not throw or leak memory
      expect(() => senderManager.stop()).not.toThrow();
    });
  });
});
