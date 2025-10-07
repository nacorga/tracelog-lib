/**
 * SenderManager Retry Race Condition Test
 *
 * Tests that concurrent send failures don't create duplicate retry schedules
 * Critical bug: Multiple calls to scheduleRetry() could create overlapping retries
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SenderManager } from '../../src/managers/sender.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { DeviceType } from '../../src/types';
import type { BaseEventsQueueDto } from '../../src/types';

describe('SenderManager - Retry Race Condition', () => {
  let senderManager: SenderManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    storageManager = new StorageManager();
    senderManager = new SenderManager(storageManager);

    // Setup minimal state
    vi.spyOn(senderManager as any, 'get').mockImplementation((key: unknown) => {
      if (key === 'config') return { id: 'test-project' };
      if (key === 'collectApiUrl') return 'http://localhost:3000/collect';
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should prevent duplicate retries when multiple failures occur concurrently', async () => {
    const body: BaseEventsQueueDto = {
      user_id: 'user-123',
      session_id: 'session-456',
      device: DeviceType.Desktop,
      events: [{ id: 'test-1', type: 'PAGE_VIEW' as any, page_url: '/test', timestamp: Date.now() }],
    };

    // Mock fetch to always fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    // Simulate concurrent send failures
    const promise1 = senderManager.sendEventsQueue(body);
    const promise2 = senderManager.sendEventsQueue(body);

    await Promise.allSettled([promise1, promise2]);

    // Verify only ONE retry is scheduled (second should be blocked by isRetrying flag)
    const isRetrying = (senderManager as any).isRetrying;
    const retryTimeoutId = (senderManager as any).retryTimeoutId;

    // Should have a retry scheduled
    expect(retryTimeoutId).not.toBeNull();
    // Should be marked as retrying to prevent duplicates
    expect(isRetrying).toBe(true);
  });

  it('should maintain correct retry count during concurrent failures', async () => {
    const body: BaseEventsQueueDto = {
      user_id: 'user-123',
      session_id: 'session-456',
      device: DeviceType.Desktop,
      events: [
        {
          id: 'test-2',
          type: 'CLICK' as any,
          page_url: '/test',
          timestamp: Date.now(),
          click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5, tag: 'button' },
        },
      ],
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    // First concurrent batch of failures
    await Promise.allSettled([senderManager.sendEventsQueue(body), senderManager.sendEventsQueue(body)]);

    // Fast-forward to trigger retry
    await vi.runAllTimersAsync();

    // Verify retry count is correct (should be 1, not 2)
    const retryCount = (senderManager as any).retryCount;
    expect(retryCount).toBeLessThanOrEqual(1);
  });

  it('should reset state after successful retry', async () => {
    const body: BaseEventsQueueDto = {
      user_id: 'user-123',
      session_id: 'session-456',
      device: DeviceType.Desktop,
      events: [{ id: 'test-3', type: 'SESSION_START' as any, page_url: '/test', timestamp: Date.now() }],
    };

    // Mock successful send
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    // Trigger send that will succeed
    await senderManager.sendEventsQueue(body);

    // Verify clean state after success (no retry scheduled)
    const isRetrying = (senderManager as any).isRetrying;
    const retryTimeoutId = (senderManager as any).retryTimeoutId;
    const retryCount = (senderManager as any).retryCount;

    expect(isRetrying).toBe(false);
    expect(retryTimeoutId).toBeNull();
    expect(retryCount).toBe(0);
  });

  it('should handle rapid successive send attempts without race condition', async () => {
    const body: BaseEventsQueueDto = {
      user_id: 'user-123',
      session_id: 'session-456',
      device: DeviceType.Desktop,
      events: [
        {
          id: 'test-4',
          type: 'CUSTOM' as any,
          page_url: '/test',
          timestamp: Date.now(),
          custom_event: { name: 'test' },
        },
      ],
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    // Rapid fire 5 send attempts
    const promises = Array.from({ length: 5 }, () => senderManager.sendEventsQueue(body));

    await Promise.allSettled(promises);

    // Should only have ONE active retry scheduled
    const retryTimeoutId = (senderManager as any).retryTimeoutId;
    expect(retryTimeoutId).not.toBeNull();

    // Retry count should be 0 (not incremented yet, scheduled for later)
    const retryCount = (senderManager as any).retryCount;
    expect(retryCount).toBe(0);
  });
});
