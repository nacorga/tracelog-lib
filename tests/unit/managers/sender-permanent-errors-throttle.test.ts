import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { PERMANENT_ERROR_LOG_THROTTLE_MS } from '../../../src/constants';
import { DeviceType } from '../../../src/types';
import type { BaseEventsQueueDto } from '../../../src/types';
import * as logUtils from '../../../src/utils/logging.utils';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SenderManager - Permanent Error Log Throttling', () => {
  let senderManager: SenderManager;
  let storageManager: StorageManager;
  let logSpy: ReturnType<typeof vi.spyOn>;

  const createEventDto = (): BaseEventsQueueDto => ({
    user_id: 'user-123',
    session_id: 'session-456',
    device: DeviceType.Desktop,
    events: [{ id: 'test-1', type: 'PAGE_VIEW' as any, page_url: '/test', timestamp: Date.now() }],
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Mock log utility
    logSpy = vi.spyOn(logUtils, 'log').mockImplementation(() => {});

    // Create fresh instances
    storageManager = new StorageManager();
    senderManager = new SenderManager(storageManager);

    // Setup minimal state for SenderManager
    vi.spyOn(senderManager as any, 'get').mockImplementation((key: unknown) => {
      if (key === 'config') return { id: 'test-project' };
      if (key === 'collectApiUrl') return 'http://localhost:3000/collect';
      if (key === 'userId') return 'anonymous';
      return null;
    });
  });

  afterEach(() => {
    senderManager.stop();
    vi.restoreAllMocks();
  });

  it('should log first permanent error immediately', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const body = createEventDto();
    await senderManager.sendEventsQueue(body);

    // First error should be logged
    expect(logSpy).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('Permanent error'),
      expect.objectContaining({
        data: expect.objectContaining({ status: 403 }),
      }),
    );
  });

  it('should throttle repeated same-status permanent errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const body = createEventDto();

    // First call - should log
    await senderManager.sendEventsQueue(body);

    const firstCallCount = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error')).length;

    // Second call immediately after - should NOT log (throttled)
    await senderManager.sendEventsQueue(body);

    const secondCallCount = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error')).length;

    expect(firstCallCount).toBe(1);
    expect(secondCallCount).toBe(1); // No additional log
  });

  it('should log different status codes independently', async () => {
    let callCount = 0;

    mockFetch.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: callCount === 1 ? 403 : 404,
        statusText: callCount === 1 ? 'Forbidden' : 'Not Found',
      });
    });

    const body = createEventDto();

    // First error: 403
    await senderManager.sendEventsQueue(body);

    // Second error: 404 (different status)
    await senderManager.sendEventsQueue(body);

    // Both should be logged (different status codes)
    const permanentErrorLogs = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error'));
    expect(permanentErrorLogs.length).toBe(2);
  });

  it('should log again after throttle window expires', async () => {
    vi.useFakeTimers();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const body = createEventDto();

    // First error - should log
    await senderManager.sendEventsQueue(body);

    const initialLogCount = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error')).length;

    // Advance time past throttle window
    vi.advanceTimersByTime(PERMANENT_ERROR_LOG_THROTTLE_MS + 1000);

    // Second error after throttle expires - should log again
    await senderManager.sendEventsQueue(body);

    const finalLogCount = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error')).length;

    expect(initialLogCount).toBe(1);
    expect(finalLogCount).toBe(2);

    vi.useRealTimers();
  });

  it('should handle mixed permanent and temporary errors correctly', async () => {
    let callCount = 0;

    mockFetch.mockImplementation(() => {
      callCount++;
      // First: 403 (permanent), Second: 500 (temporary)
      return Promise.resolve({
        ok: false,
        status: callCount === 1 ? 403 : 500,
        statusText: callCount === 1 ? 'Forbidden' : 'Internal Server Error',
      });
    });

    const body = createEventDto();

    // First: permanent error
    await senderManager.sendEventsQueue(body);

    // Second: temporary error (should NOT use permanent error log)
    await senderManager.sendEventsQueue(body);

    const permanentErrorLogs = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error'));

    // Only the 403 should trigger permanent error log
    expect(permanentErrorLogs.length).toBe(1);
  });

  it('should throttle multiple rapid permanent errors with same status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const body = createEventDto();

    // Send 5 events rapidly
    for (let i = 0; i < 5; i++) {
      await senderManager.sendEventsQueue(body);
    }

    const permanentErrorLogs = logSpy.mock.calls.filter((call) => call[1]?.toString().includes('Permanent error'));

    // Should only log once despite 5 calls
    expect(permanentErrorLogs.length).toBe(1);
  });

  it('should respect PERMANENT_ERROR_LOG_THROTTLE_MS constant', () => {
    // Verify constant is properly defined
    expect(PERMANENT_ERROR_LOG_THROTTLE_MS).toBe(60_000);
    expect(typeof PERMANENT_ERROR_LOG_THROTTLE_MS).toBe('number');
  });
});
