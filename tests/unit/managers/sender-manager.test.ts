/**
 * SenderManager Tests
 * Focus: Event transmission, retry logic, error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, advanceTimers } from '../../helpers/setup.helper';
import { createMockFetch, createMockFetchNetworkError } from '../../helpers/mocks.helper';
import { createMockEvent, createMockQueue } from '../../helpers/fixtures.helper';
import { setGlobalStateValue } from '../../helpers/state.helper';
import { EventType } from '../../../src/types';

describe('SenderManager - Event Sending (fetch)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should send events via fetch (async)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: { key: 'value' } },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should use POST method', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.method).toBe('POST');
  });

  it('should set correct headers', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('should serialize body as JSON', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: { key: 'value' } },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    const body = JSON.parse(options.body as string);

    expect(body.session_id).toBe('test-session-id');
    expect(body.user_id).toBe('test-user-id');
    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe('custom');
    expect(body._metadata).toBeDefined();
    expect(body._metadata.timestamp).toBeTypeOf('number');
  });

  it('should call success callback on 2xx', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    const successCallback = vi.fn();
    const failureCallback = vi.fn();

    // Act
    await sender.sendEventsQueue(eventsQueue, {
      onSuccess: successCallback,
      onFailure: failureCallback,
    });

    // Assert
    expect(successCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledWith(1, expect.any(Array), expect.any(Object));
    expect(failureCallback).not.toHaveBeenCalled();
  });

  it('should call failure callback on error', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    const successCallback = vi.fn();
    const failureCallback = vi.fn();

    // Act
    const success = await sender.sendEventsQueue(eventsQueue, {
      onSuccess: successCallback,
      onFailure: failureCallback,
    });

    // Assert
    expect(success).toBe(false);
    expect(successCallback).not.toHaveBeenCalled();
    expect(failureCallback).toHaveBeenCalledTimes(1);
  });

  it('should handle 4xx errors (permanent)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 400 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    // Setup state with userId for proper storage key
    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    const failureCallback = vi.fn();

    // Act
    const success = await sender.sendEventsQueue(eventsQueue, {
      onFailure: failureCallback,
    });

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx
    expect(failureCallback).toHaveBeenCalledTimes(1);

    // Should NOT persist permanent errors
    const storageKey = 'tlog:test-user-id:queue:custom';
    const persisted = localStorage.getItem(storageKey);
    expect(persisted).toBeNull();
  });

  it('should handle 5xx errors (transient)', async () => {
    // Arrange
    vi.useFakeTimers();
    const mockFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    // Setup state with userId for proper storage key
    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);

    // Advance timers for retries
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry

    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries

    // Note: Persistence after exhausting retries is tested in "Event Persistence" block

    vi.useRealTimers();
  });
});

describe('SenderManager - Event Sending (sendBeacon)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should send events via sendBeacon (sync)', async () => {
    // Arrange
    const mockSendBeacon = vi.fn().mockReturnValue(true);
    global.navigator.sendBeacon = mockSendBeacon;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = sender.sendEventsQueueSync(eventsQueue);

    // Assert
    expect(success).toBe(true);
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon).toHaveBeenCalledWith('https://api.test.com/collect', expect.any(Blob));
  });

  it('should use Blob with correct content-type', async () => {
    // Arrange
    const mockSendBeacon = vi.fn().mockReturnValue(true);
    global.navigator.sendBeacon = mockSendBeacon;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    sender.sendEventsQueueSync(eventsQueue);

    // Assert
    const blob = mockSendBeacon.mock.calls[0]?.[1];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe('application/json');
  });

  it('should return true on success', async () => {
    // Arrange
    const mockSendBeacon = vi.fn().mockReturnValue(true);
    global.navigator.sendBeacon = mockSendBeacon;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = sender.sendEventsQueueSync(eventsQueue);

    // Assert
    expect(success).toBe(true);
  });

  it('should return false on failure', async () => {
    // Arrange
    const mockSendBeacon = vi.fn().mockReturnValue(false);
    global.navigator.sendBeacon = mockSendBeacon;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    // Setup state with userId for proper storage key
    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = sender.sendEventsQueueSync(eventsQueue);

    // Assert
    expect(success).toBe(false);
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

    // Note: Persistence behavior is tested in "Event Persistence" block
  });
});

describe('SenderManager - Retry Logic', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.useRealTimers();
  });

  it('should retry transient errors (5xx)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should retry network failures', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should retry timeout errors (408)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 408 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries (408 is transient)
  });

  it('should retry rate limit errors (429)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 429 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries (429 is transient)
  });

  it('should NOT retry permanent errors (4xx except 408, 429)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 400 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(1000); // Wait for any potential retries
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 4xx
  });

  it('should use exponential backoff', async () => {
    // Arrange - Mock Math.random to eliminate jitter for deterministic timing
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    const mockFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act - Start send and advance through retry delays
    const sendPromise = sender.sendEventsQueue(eventsQueue);

    // With Math.random() = 0 (no jitter):
    // - First backoff: 100ms * 2^1 = 200ms
    // - Second backoff: 100ms * 2^2 = 400ms
    // Total time needed: 200ms + 400ms = 600ms

    // Verify initial call happens immediately
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past first backoff delay (200ms) - should trigger first retry
    await vi.advanceTimersByTimeAsync(201);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Advance past second backoff delay (400ms) - should trigger second retry
    await vi.advanceTimersByTimeAsync(401);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    await sendPromise;

    // Assert final state
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries

    // Cleanup
    randomSpy.mockRestore();
  });

  it('should max out at 2 retries (3 total attempts)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(300); // First retry
    await advanceTimers(500); // Second retry
    await advanceTimers(1000); // Wait for any additional attempts
    const success = await sendPromise;

    // Assert
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Exactly 3 attempts
  });
});

describe('SenderManager - Event Persistence', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should NOT persist permanent errors (4xx)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 400 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(false);

    // Should NOT persist permanent errors
    const storageKey = 'tlog:test-user-id:queue:custom';
    const persisted = localStorage.getItem(storageKey);
    expect(persisted).toBeNull();
  });
});

describe('SenderManager - beforeBatch Transformer', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should apply beforeBatch transformer before send', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    // Create transformer that adds a custom field
    const beforeBatchTransformer = vi.fn((batch: any) => ({
      ...batch,
      custom_field: 'transformed',
    }));

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true);
    expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

    // Check that transformed data was sent
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    const body = JSON.parse(options.body as string);

    expect(body.custom_field).toBe('transformed');
  });

  it('should skip beforeBatch for saas integration', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    const beforeBatchTransformer = vi.fn((batch: any) => ({
      ...batch,
      custom_field: 'should_not_appear',
    }));

    const sender = new SenderManager(storage, 'saas', 'https://saas.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true);
    expect(beforeBatchTransformer).not.toHaveBeenCalled(); // Should not be called for saas

    // Check that original data was sent (no transformation)
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    const body = JSON.parse(options.body as string);

    expect(body.custom_field).toBeUndefined();
  });

  it('should handle transformer errors gracefully', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    // Transformer that throws error
    const beforeBatchTransformer = vi.fn(() => {
      throw new Error('Transformer error');
    });

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true); // Should still succeed with original data
    expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

    // Check that original data was sent (fallback)
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    const body = JSON.parse(options.body as string);

    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe('custom');
  });

  it('should use original batch if transformer returns invalid', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    // Transformer that returns invalid data (missing events array)
    const beforeBatchTransformer = vi.fn(() => ({
      invalid: 'data',
    })) as any;

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true);
    expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

    // Check that original data was sent (fallback)
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    const body = JSON.parse(options.body as string);

    expect(body.events).toHaveLength(1);
    expect(body.events[0].type).toBe('custom');
  });

  it('should filter batch if transformer returns null', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    // Transformer that filters batch
    const beforeBatchTransformer = vi.fn(() => null);

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true); // Returns true when filtered
    expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled(); // Should not send
  });
});

describe('SenderManager - Error Handling', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should handle fetch errors', async () => {
    // Arrange
    const mockFetch = vi.fn(() => {
      throw new Error('Network error');
    });

    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert - Should handle error gracefully without throwing
    expect(success).toBe(false);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle JSON serialization errors', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Create circular reference that will cause JSON.stringify to fail
    const circularEvent: any = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'circular', metadata: {} },
    });
    circularEvent.circular = circularEvent; // Create circular reference

    const eventsQueue = createMockQueue([circularEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert - Should handle serialization error gracefully
    expect(success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled(); // Should not reach fetch if serialization fails
  });

  it('should handle storage errors', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    // Mock storage to throw errors
    const storage = new StorageManager();
    const setItemSpy = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act - Should not throw despite storage error
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(false);
    expect(setItemSpy).toHaveBeenCalled();
  });

  it('should handle transformer errors', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();

    // Transformer that throws error
    const beforeBatchTransformer = vi.fn(() => {
      throw new Error('Transformer error');
    });

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {
      beforeBatch: beforeBatchTransformer,
    });

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act - Should not throw despite transformer error
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert - Should succeed with original data
    expect(success).toBe(true);
    expect(beforeBatchTransformer).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should log errors without throwing', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockFetch = vi.fn(() => {
      throw new Error('Network error');
    });

    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act - Should not throw
    await expect(sender.sendEventsQueue(eventsQueue)).resolves.not.toThrow();

    // Assert
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should continue operation after errors', async () => {
    // Arrange
    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount++;
      // First 3 calls fail (initial + 2 retries), then succeed
      if (callCount <= 3) {
        throw new Error('First send fails (with retries)');
      }
      return Promise.resolve({ ok: true, status: 200 } as Response);
    });

    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act - First send fails (after retries)
    const firstSuccess = await sender.sendEventsQueue(eventsQueue);

    // Second send should work
    const secondSuccess = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(firstSuccess).toBe(false);
    expect(secondSuccess).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(4); // 3 failed + 1 success
  });
});

describe('SenderManager - Custom Headers', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should include static headers from config in fetch request', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'test-brand', 'X-Tenant-Id': 'tenant-123' };
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {}, staticHeaders);

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'test-brand',
      'X-Tenant-Id': 'tenant-123',
    });
  });

  it('should include dynamic headers from provider in fetch request', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const dynamicProvider = vi.fn(() => ({
      Authorization: 'Bearer test-token',
      'X-Request-Id': 'req-123',
    }));
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {}, {}, dynamicProvider);

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(dynamicProvider).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
      'X-Request-Id': 'req-123',
    });
  });

  it('should merge static and dynamic headers (dynamic overrides static)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'static-brand', 'X-Shared': 'from-static' };
    const dynamicProvider = vi.fn(() => ({
      'X-Shared': 'from-dynamic', // Should override static
      Authorization: 'Bearer token',
    }));
    const sender = new SenderManager(
      storage,
      'custom',
      'https://api.test.com/collect',
      {},
      staticHeaders,
      dynamicProvider,
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand',
      'X-Shared': 'from-dynamic', // Dynamic wins
      Authorization: 'Bearer token',
    });
  });

  it('should NOT apply custom headers for saas integration', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'test-brand' };
    const dynamicProvider = vi.fn(() => ({ Authorization: 'Bearer token' }));
    // Use 'saas' integration - headers should be ignored
    const sender = new SenderManager(
      storage,
      'saas',
      'https://api.tracelog.com/collect',
      {},
      staticHeaders,
      dynamicProvider,
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(dynamicProvider).not.toHaveBeenCalled(); // Provider not called for saas
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      // No custom headers
    });
  });

  it('should use empty custom headers when provider throws error', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'static-brand' };
    const dynamicProvider = vi.fn(() => {
      throw new Error('Provider error');
    });
    const sender = new SenderManager(
      storage,
      'custom',
      'https://api.test.com/collect',
      {},
      staticHeaders,
      dynamicProvider,
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true); // Request still succeeds
    expect(dynamicProvider).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    // Falls back to static headers only (dynamic failed)
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand',
    });
  });

  it('should use empty custom headers when provider returns invalid value', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'static-brand' };
    // Provider returns array instead of object (invalid)
    const dynamicProvider = vi.fn(() => ['invalid'] as unknown as Record<string, string>);
    const sender = new SenderManager(
      storage,
      'custom',
      'https://api.test.com/collect',
      {},
      staticHeaders,
      dynamicProvider,
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(success).toBe(true);
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    // Falls back to static headers only (dynamic invalid)
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand',
    });
  });

  it('should allow setting provider after construction', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Set provider after construction
    const dynamicProvider = vi.fn(() => ({ Authorization: 'Bearer late-token' }));
    sender.setCustomHeadersProvider(dynamicProvider);

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(dynamicProvider).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer late-token',
    });
  });

  it('should allow removing provider', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const staticHeaders = { 'X-Brand': 'test-brand' };
    const dynamicProvider = vi.fn(() => ({ Authorization: 'Bearer token' }));
    const sender = new SenderManager(
      storage,
      'custom',
      'https://api.test.com/collect',
      {},
      staticHeaders,
      dynamicProvider,
    );

    // Remove provider
    sender.removeCustomHeadersProvider();

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(dynamicProvider).not.toHaveBeenCalled(); // Provider was removed
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'test-brand', // Only static headers
    });
  });
});

describe('SenderManager - fetchCredentials', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should default to credentials: include', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.credentials).toBe('include');
  });

  it('should use configured fetchCredentials: same-origin', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(
      storage,
      'custom',
      'https://api.test.com/collect',
      {},
      {},
      undefined,
      'same-origin',
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.credentials).toBe('same-origin');
  });

  it('should use configured fetchCredentials: omit', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', {}, {}, undefined, 'omit');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.credentials).toBe('omit');
  });
});

describe('SenderManager - TimeoutError Handling', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.useRealTimers();
  });

  it('should convert AbortController timeout into TimeoutError (not persist events)', async () => {
    // Arrange — fetch that never resolves, triggers abort on signal
    global.fetch = vi.fn(async (_url: string | RequestInfo | URL, options?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        }
      });
    });

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    const failureCallback = vi.fn();

    // Act — advance past REQUEST_TIMEOUT_MS (15s) for all 3 attempts + backoff
    const sendPromise = sender.sendEventsQueue(eventsQueue, { onFailure: failureCallback });
    await advanceTimers(16000);
    await advanceTimers(16000);
    await advanceTimers(16000);
    const success = await sendPromise;

    // Assert — TimeoutError path: returns false, does NOT persist, clears storage
    expect(success).toBe(false);
    expect(failureCallback).toHaveBeenCalledTimes(1);

    const storageKey = 'tlog:test-user-id:queue:custom';
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should call clearPersistedEvents (not persistEvents) when all attempts timeout', async () => {
    // Arrange — mock send() to throw TimeoutError directly
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');
    const { TimeoutError } = await import('../../../src/types');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const clearSpy = vi.spyOn(sender as any, 'clearPersistedEvents');
    const persistSpy = vi.spyOn(sender as any, 'persistEvents');

    // Mock private send() to throw TimeoutError (simulates all attempts timed out)
    vi.spyOn(sender as any, 'send').mockRejectedValue(
      new TimeoutError('All retry attempts timed out (server likely received the request)'),
    );

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert — TimeoutError: clearPersistedEvents called, persistEvents NOT called
    expect(success).toBe(false);
    expect(clearSpy).toHaveBeenCalled();
    expect(persistSpy).not.toHaveBeenCalled();
  });

  it('should call persistEvents (not clearPersistedEvents) when failures are mixed', async () => {
    // Arrange — mock send() to return false (simulates mixed failures where allTimeouts=false)
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const clearSpy = vi.spyOn(sender as any, 'clearPersistedEvents');
    const persistSpy = vi.spyOn(sender as any, 'persistEvents');

    // Mock private send() to return false (mixed failures — not all timeouts)
    vi.spyOn(sender as any, 'send').mockResolvedValue(false);

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const success = await sender.sendEventsQueue(eventsQueue);

    // Assert — mixed failures (send returned false): persistEvents called, not clear
    expect(success).toBe(false);
    expect(persistSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('should clear persisted events when recovery times out (recoverPersistedEvents)', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');
    const { TimeoutError } = await import('../../../src/types');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Persist events using the sender's own internal key (via persistEvents)
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'persisted_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEvents(eventsQueue);

    const clearSpy = vi.spyOn(sender as any, 'clearPersistedEvents');

    // Mock private send() to throw TimeoutError
    vi.spyOn(sender as any, 'send').mockRejectedValue(
      new TimeoutError('All retry attempts timed out (server likely received the request)'),
    );

    const failureCallback = vi.fn();

    // Act
    await sender.recoverPersistedEvents({ onFailure: failureCallback });

    // Assert — recovery timeout: clearPersistedEvents called, onFailure invoked
    expect(clearSpy).toHaveBeenCalled();
    expect(failureCallback).toHaveBeenCalledTimes(1);
  });

  it('should call onFailure callback on timeout (not onSuccess)', async () => {
    // Arrange
    global.fetch = vi.fn(async (_url: string | RequestInfo | URL, options?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        }
      });
    });

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    const successCallback = vi.fn();
    const failureCallback = vi.fn();

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue, {
      onSuccess: successCallback,
      onFailure: failureCallback,
    });
    await advanceTimers(16000);
    await advanceTimers(16000);
    await advanceTimers(16000);
    await sendPromise;

    // Assert
    expect(successCallback).not.toHaveBeenCalled();
    expect(failureCallback).toHaveBeenCalledTimes(1);
  });

  it('should retry all 3 attempts before concluding timeout (not bail early)', async () => {
    // Arrange
    const fetchSpy = vi.fn(async (_url: string | RequestInfo | URL, options?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        }
      });
    });
    global.fetch = fetchSpy;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(16000);
    await advanceTimers(16000);
    await advanceTimers(16000);
    await sendPromise;

    // Assert — all 3 attempts made (initial + 2 retries)
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('should track allTimeouts correctly in send() — all timeouts throws TimeoutError', async () => {
    // Arrange — fetch that always times out via AbortController
    global.fetch = vi.fn(async (_url: string | RequestInfo | URL, options?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        }
      });
    });

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const clearSpy = vi.spyOn(sender as any, 'clearPersistedEvents');
    const persistSpy = vi.spyOn(sender as any, 'persistEvents');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act
    const sendPromise = sender.sendEventsQueue(eventsQueue);
    await advanceTimers(16000);
    await advanceTimers(16000);
    await advanceTimers(16000);
    const success = await sendPromise;

    // Assert — TimeoutError: clearPersistedEvents called, persistEvents NOT called
    expect(success).toBe(false);
    expect(clearSpy).toHaveBeenCalled();
    expect(persistSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// NETWORK CIRCUIT BREAKER
// ============================================================================

describe('SenderManager - Network Circuit Breaker', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  /**
   * Helper: runs a single batch through all retries (3 attempts) with network error.
   * Returns the sendEventsQueue promise result.
   */
  async function runFailedNetworkBatch(sender: any, eventsQueue: any): Promise<boolean> {
    const promise = sender.sendEventsQueue(eventsQueue);
    // Advance past backoff delays: attempt 1 immediate fail, backoff ~300ms,
    // attempt 2 immediate fail, backoff ~500ms, attempt 3 immediate fail
    await advanceTimers(1000);
    return promise;
  }

  it('should open circuit after MAX_CONSECUTIVE_NETWORK_FAILURES batches', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act — send 3 batches, each failing all 3 attempts (9 fetch calls total)
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    expect(mockFetch).toHaveBeenCalledTimes(9); // 3 batches × 3 attempts

    // 4th send should be blocked by circuit breaker (no additional fetch calls)
    mockFetch.mockClear();
    const result = await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should skip send when circuit is open (within cooldown)', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Open circuit
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    mockFetch.mockClear();

    // Act — advance 60s (still within 120s cooldown) and try sending
    await advanceTimers(60000);
    const result = await sender.sendEventsQueue(eventsQueue);

    // Assert — still blocked
    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should allow probe after CIRCUIT_BREAKER_COOLDOWN_MS (half-open)', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Open circuit
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    mockFetch.mockClear();

    // Act — advance past cooldown (120s) and try sending
    await advanceTimers(121000);
    const promise = runFailedNetworkBatch(sender, eventsQueue);
    await promise;

    // Assert — fetch was called (probe allowed through)
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should close circuit on successful probe', async () => {
    // Arrange
    const mockFetchFail = createMockFetchNetworkError();
    global.fetch = mockFetchFail;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Open circuit
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    // Advance past cooldown
    await advanceTimers(121000);

    // Switch to success mock for probe
    const mockFetchSuccess = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetchSuccess;

    // Act — probe succeeds
    const probeResult = await sender.sendEventsQueue(eventsQueue);
    expect(probeResult).toBe(true);

    // Assert — next send also succeeds immediately (circuit closed)
    mockFetchSuccess.mockClear();
    const nextResult = await sender.sendEventsQueue(eventsQueue);
    expect(nextResult).toBe(true);
    expect(mockFetchSuccess).toHaveBeenCalledTimes(1);
  });

  it('should re-open circuit on failed probe', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Open circuit
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    // Advance past cooldown and fail probe
    await advanceTimers(121000);
    mockFetch.mockClear();
    await runFailedNetworkBatch(sender, eventsQueue);

    // Assert — circuit re-opened, immediate send blocked
    mockFetch.mockClear();
    const result = await sender.sendEventsQueue(eventsQueue);
    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should reset counter on successful send', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // 2 failed batches (counter = 2, below threshold of 3)
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    expect((sender as any).consecutiveNetworkFailures).toBe(2);

    // Successful send resets counter
    global.fetch = createMockFetch({ ok: true, status: 200 });
    await sender.sendEventsQueue(eventsQueue);
    expect((sender as any).consecutiveNetworkFailures).toBe(0);

    // 2 more failures — circuit still not open (counter back to 2)
    global.fetch = createMockFetchNetworkError();
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    expect((sender as any).consecutiveNetworkFailures).toBe(2);

    // Verify circuit is NOT open (fetch still called)
    const freshMock = createMockFetchNetworkError();
    global.fetch = freshMock;
    await runFailedNetworkBatch(sender, eventsQueue);
    expect(freshMock).toHaveBeenCalled();
  });

  it('should reset counter on PermanentError (4xx)', async () => {
    // Arrange — start with 2 network failures
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);
    expect((sender as any).consecutiveNetworkFailures).toBe(2);

    // Act — 4xx response proves URL is reachable, resets counter
    global.fetch = createMockFetch({ ok: false, status: 400 });
    await sender.sendEventsQueue(eventsQueue);

    // Assert
    expect((sender as any).consecutiveNetworkFailures).toBe(0);
  });

  it('should NOT count TimeoutError toward circuit breaker', async () => {
    // Arrange — fetch that hangs until AbortController timeout
    global.fetch = vi.fn(async (_url: string | RequestInfo | URL, options?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          });
        }
      });
    });

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Act — send 4 batches, all timing out (would exceed threshold if counted)
    for (let i = 0; i < 4; i++) {
      const sendPromise = sender.sendEventsQueue(eventsQueue);
      // Advance past REQUEST_TIMEOUT_MS (15s) × 3 attempts + backoff
      await advanceTimers(16000);
      await advanceTimers(16000);
      await advanceTimers(16000);
      await sendPromise;
    }

    // Assert — counter stays at 0, circuit never opens
    expect((sender as any).consecutiveNetworkFailures).toBe(0);
  });

  it('should track circuitOpenedAt timestamp when circuit opens', async () => {
    // Arrange
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);

    // Initially zero
    expect((sender as any).circuitOpenedAt).toBe(0);

    // Open circuit with 3 failed batches
    await runFailedNetworkBatch(sender, eventsQueue);
    await runFailedNetworkBatch(sender, eventsQueue);

    const timeBeforeOpen = Date.now();
    await runFailedNetworkBatch(sender, eventsQueue);

    // Assert — timestamp set on 3rd failure
    expect((sender as any).circuitOpenedAt).toBeGreaterThanOrEqual(timeBeforeOpen);
    expect((sender as any).consecutiveNetworkFailures).toBe(3);
  });
});

// ============================================================================
// RECOVERY FAILURE TRACKING
// ============================================================================

describe('SenderManager - Recovery Failure Tracking', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should discard persisted events after MAX_RECOVERY_FAILURES', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Use sender's own persistence with MAX_RECOVERY_FAILURES
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEventsWithFailureCount(eventsQueue, 3);

    const clearSpy = vi.spyOn(sender as any, 'clearPersistedEvents');
    const failureCallback = vi.fn();

    // Act
    await sender.recoverPersistedEvents({ onFailure: failureCallback });

    // Assert — discarded without send attempt
    expect(clearSpy).toHaveBeenCalled();
    expect(failureCallback).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should increment recoveryFailures on failed recovery', async () => {
    // Arrange
    vi.useFakeTimers();
    const mockFetch = createMockFetchNetworkError();
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Use sender's own persistence with recoveryFailures: 1
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEventsWithFailureCount(eventsQueue, 1);

    // Advance past persistence throttle window (1s)
    await advanceTimers(1500);

    // Act
    const recoverPromise = sender.recoverPersistedEvents();
    await advanceTimers(1000); // Past backoff delays
    await recoverPromise;

    // Assert — recoveryFailures incremented to 2
    const storageKey = (sender as any).getQueueStorageKey();
    const updated = JSON.parse(storage.getItem(storageKey)!);
    expect(updated.recoveryFailures).toBe(2);
  });

  it('should clear recoveryFailures on successful recovery', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Use sender's own persistence with recoveryFailures: 2
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEventsWithFailureCount(eventsQueue, 2);

    // Act
    await sender.recoverPersistedEvents();

    // Assert — localStorage entirely cleared
    const storageKey = (sender as any).getQueueStorageKey();
    expect(storage.getItem(storageKey)).toBeNull();
  });

  it('should treat missing recoveryFailures as 0', async () => {
    // Arrange — persisted data without recoveryFailures field (backward compat)
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Use sender's own persistEvents (which sets recoveryFailures: 0, omitted from JSON)
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEvents(eventsQueue);

    const sendSpy = vi.spyOn(sender as any, 'send');

    // Act
    await sender.recoverPersistedEvents();

    // Assert — send was attempted (not discarded)
    expect(sendSpy).toHaveBeenCalled();
    const storageKey = (sender as any).getQueueStorageKey();
    expect(storage.getItem(storageKey)).toBeNull(); // Cleared on success
  });

  it('should not include recoveryFailures in HTTP body', async () => {
    // Arrange
    const mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    const { StorageManager } = await import('../../../src/managers/storage.manager');
    const { SenderManager } = await import('../../../src/managers/sender.manager');

    setGlobalStateValue('userId', 'test-user-id');

    const storage = new StorageManager();
    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect');

    // Use sender's own persistence with recoveryFailures: 1
    const customEvent = createMockEvent(EventType.CUSTOM, {
      custom_event: { name: 'test_event', metadata: {} },
    });
    const eventsQueue = createMockQueue([customEvent]);
    (sender as any).persistEventsWithFailureCount(eventsQueue, 1);

    // Act
    await sender.recoverPersistedEvents();

    // Assert — fetch payload should NOT contain recoveryFailures
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchPayload = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
    expect(fetchPayload).not.toHaveProperty('recoveryFailures');
    expect(fetchPayload).not.toHaveProperty('timestamp');
  });
});
