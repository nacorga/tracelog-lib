import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { StateManager } from '../../../src/managers/state.manager';
import { EventsQueue, EventType, DeviceType } from '../../../src/types';

describe('SenderManager - Hybrid sendBeacon/fetch Strategy', () => {
  let senderManager: SenderManager;
  let storageManager: StorageManager;
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockSendBeacon: ReturnType<typeof vi.fn>;

  const createEventDto = (): EventsQueue => ({
    user_id: 'test-user',
    session_id: 'test-session',
    device: DeviceType.Desktop,
    events: [
      {
        id: 'test-event-1',
        type: EventType.CLICK,
        timestamp: Date.now(),
        click: { x: 100, y: 200, target: 'button' },
      } as any,
    ],
  });

  beforeEach(() => {
    storageManager = new StorageManager();
    senderManager = new SenderManager(storageManager, 'custom', 'http://localhost:3000/collect');

    // Mock global state
    const mockGet = vi.fn((key: string) => {
      if (key === 'userId') return 'test-user';
      return undefined;
    });
    (StateManager.prototype as any).get = mockGet;

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock sendBeacon
    mockSendBeacon = vi.fn();
    Object.defineProperty(global.navigator, 'sendBeacon', {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Async Method - Uses fetch', () => {
    it('should use fetch for async sendEventsQueue', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });

    it('should detect 4xx errors with fetch and NOT persist', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const storageKey = 'tlog:queue:test-user:custom';
      storageManager.removeItem(storageKey);

      const body = createEventDto();
      const result = await senderManager.sendEventsQueue(body);

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Should NOT persist on permanent error
      const persisted = storageManager.getItem(storageKey);
      expect(persisted).toBeNull();
    });

    it('should detect 5xx errors with fetch and trigger failure callback', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();
      const onFailure = vi.fn();
      const result = await senderManager.sendEventsQueue(body, { onFailure });

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalled();
      // Events are persisted internally for recovery on next page load
    });

    it('should trigger failure callback on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const body = createEventDto();
      const onFailure = vi.fn();
      const result = await senderManager.sendEventsQueue(body, { onFailure });

      expect(result).toBe(false);
      expect(onFailure).toHaveBeenCalled();
      // Events are persisted internally for recovery
    });

    it('should call success callback on 2xx response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const onSuccess = vi.fn();
      const onFailure = vi.fn();
      const body = createEventDto();

      await senderManager.sendEventsQueue(body, { onSuccess, onFailure });

      expect(onSuccess).toHaveBeenCalledWith(1, body.events, body);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('should call failure callback on errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const onSuccess = vi.fn();
      const onFailure = vi.fn();
      const body = createEventDto();

      await senderManager.sendEventsQueue(body, { onSuccess, onFailure });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    });
  });

  describe('Sync Method - Uses sendBeacon', () => {
    it('should use sendBeacon for sync sendEventsQueueSync', () => {
      mockSendBeacon.mockReturnValue(true);

      const body = createEventDto();
      const result = senderManager.sendEventsQueueSync(body);

      expect(result).toBe(true);
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false when sendBeacon rejects', () => {
      mockSendBeacon.mockReturnValue(false);

      const body = createEventDto();
      const result = senderManager.sendEventsQueueSync(body);

      expect(result).toBe(false);
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
      // Events are persisted internally for recovery
    });

    it('should return false when sendBeacon is not available', () => {
      Object.defineProperty(global.navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const body = createEventDto();
      const result = senderManager.sendEventsQueueSync(body);

      expect(result).toBe(false);
      // Events are persisted internally for recovery
    });

    it('should send blob with correct content-type', () => {
      mockSendBeacon.mockReturnValue(true);

      const body = createEventDto();
      senderManager.sendEventsQueueSync(body);

      expect(mockSendBeacon).toHaveBeenCalledWith('http://localhost:3000/collect', expect.any(Blob));

      const blob = mockSendBeacon.mock.calls[0]?.[1] as Blob;
      expect(blob).toBeDefined();
      expect(blob.type).toBe('application/json');
    });
  });

  describe('Event Recovery from Persistence', () => {
    it('should recover persisted events on successful send', async () => {
      // Simulate persisted events from previous session
      const storageKey = 'tlog:queue:test-user:custom';
      const persistedData = {
        user_id: 'test-user',
        session_id: 'old-session',
        device: DeviceType.Desktop,
        events: [
          { id: 'test-1', type: EventType.CLICK, timestamp: Date.now(), click: { x: 1, y: 2, target: 'btn' } } as any,
        ],
        timestamp: Date.now(),
      };
      storageManager.setItem(storageKey, JSON.stringify(persistedData));

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const onSuccess = vi.fn();
      await senderManager.recoverPersistedEvents({ onSuccess });

      // Should attempt recovery and call success callback
      expect(onSuccess).toHaveBeenCalled();
      const eventCount = onSuccess.mock.calls[0]?.[0];
      expect(eventCount).toBeDefined();
      expect(eventCount).toBe(1); // event count
    });

    it('should skip recovery of expired events', async () => {
      const storageKey = 'tlog:queue:test-user:custom';
      const expiredTimestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago

      const persistedData = {
        user_id: 'test-user',
        session_id: 'old-session',
        device: DeviceType.Desktop,
        events: [
          { id: 'test-1', type: EventType.CLICK, timestamp: Date.now(), click: { x: 1, y: 2, target: 'btn' } } as any,
        ],
        timestamp: expiredTimestamp,
      };
      storageManager.setItem(storageKey, JSON.stringify(persistedData));

      const onSuccess = vi.fn();
      await senderManager.recoverPersistedEvents({ onSuccess });

      // Should not attempt recovery of expired events
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('No In-Session Retries', () => {
    it('should NOT retry automatically after fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const body = createEventDto();
      await senderManager.sendEventsQueue(body);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait a bit to ensure no retry is scheduled
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be only 1 call (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry after sendBeacon failure', async () => {
      mockSendBeacon.mockReturnValue(false);

      const body = createEventDto();
      senderManager.sendEventsQueueSync(body);

      expect(mockSendBeacon).toHaveBeenCalledTimes(1);

      // Wait a bit to ensure no retry is scheduled
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be only 1 call
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    });
  });
});
