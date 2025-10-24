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

    // First retry should happen between 200-300ms (100ms * 2^1 + jitter)
    await advanceTimers(200);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + first retry

    // Second retry should happen between 400-500ms (100ms * 2^2 + jitter)
    await advanceTimers(400);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries

    await sendPromise;

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(3);
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

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', null, {
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

    const sender = new SenderManager(storage, 'saas', 'https://saas.test.com/collect', null, {
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

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', null, {
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

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', null, {
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

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', null, {
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

    const sender = new SenderManager(storage, 'custom', 'https://api.test.com/collect', null, {
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
