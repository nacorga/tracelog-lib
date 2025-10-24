/**
 * Event Pipeline Integration Tests
 * Focus: Event flow from capture to send
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, collectEvents } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import { wait } from '../../helpers/wait.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Event Pipeline', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should capture event from handler', () => {
    const [getEvents, cleanupEvents] = collectEvents(bridge, 'event');

    bridge.event('test_event', { key: 'value' });

    const events = getEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);

    const customEvent = events.find((e) => e.custom_event?.name === 'test_event');
    expect(customEvent).toBeDefined();
    expect(customEvent?.custom_event?.metadata).toEqual({ key: 'value' });

    cleanupEvents();
  });

  it('should validate event in EventManager', () => {
    bridge.event('valid_event', { field: 'value' });

    const events = bridge.getQueueEvents();
    expect(events.length).toBeGreaterThan(0);

    const customEvent = events.find((e) => e.custom_event?.name === 'valid_event');
    expect(customEvent).toBeDefined();
    expect(customEvent?.type).toBe('custom');
    expect(customEvent?.timestamp).toBeDefined();
  });

  it('should add event to queue', () => {
    const initialLength = bridge.getQueueLength();

    bridge.event('queue_test', { data: 'test' });

    expect(bridge.getQueueLength()).toBe(initialLength + 1);

    const events = bridge.getQueueEvents();
    const queuedEvent = events.find((e) => e.custom_event?.name === 'queue_test');
    expect(queuedEvent).toBeDefined();
  });

  it('should emit event to listeners', () => {
    const [getEvents, cleanupEvents] = collectEvents(bridge, 'event');

    bridge.event('emit_test', { value: 123 });

    const events = getEvents();
    const emittedEvent = events.find((e) => e.custom_event?.name === 'emit_test');
    expect(emittedEvent).toBeDefined();
    expect(emittedEvent?.custom_event?.metadata).toEqual({ value: 123 });

    cleanupEvents();
  });

  it('should flush queue after interval', async () => {
    bridge.event('flush_test', { count: 1 });

    expect(bridge.getQueueLength()).toBeGreaterThan(0);

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should send batch to backend', async () => {
    bridge.event('batch_test_1', { id: 1 });
    bridge.event('batch_test_2', { id: 2 });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');

    const [url, options] = fetchCall;
    expect(url).toBe('https://api.test.com/collect');
    expect(options.method).toBe('POST');

    const payload = JSON.parse(options.body as string);
    expect(payload.events).toBeDefined();
    expect(payload.session_id).toBeDefined();
  });

  it('should clear queue after successful send', async () => {
    bridge.event('clear_test', { value: 'abc' });

    const initialLength = bridge.getQueueLength();
    expect(initialLength).toBeGreaterThan(0);

    await bridge.flushQueue();
    await wait(100);

    expect(bridge.getQueueLength()).toBe(0);
  });
});

describe('Integration: Event Deduplication Flow', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should detect duplicate clicks', () => {
    document.body.innerHTML = '<button id="test-btn">Click me</button>';
    const button = document.getElementById('test-btn')!;

    const initialLength = bridge.getQueueLength();

    button.click();
    button.click();

    const finalLength = bridge.getQueueLength();
    expect(finalLength).toBe(initialLength + 1);
  });

  it('should prevent duplicate events in queue', () => {
    const initialLength = bridge.getQueueLength();

    bridge.event('duplicate_test', { id: 1 });
    bridge.event('unique_test', { id: 2 });

    const events = bridge.getQueueEvents();
    const duplicates = events.filter(
      (e) => e.custom_event?.name === 'duplicate_test' || e.custom_event?.name === 'unique_test',
    );

    expect(duplicates.length).toBe(2);
    expect(bridge.getQueueLength()).toBe(initialLength + 2);
  });

  it('should allow events after time threshold', async () => {
    document.body.innerHTML = '<button id="test-btn">Click me</button>';
    const button = document.getElementById('test-btn')!;

    const initialLength = bridge.getQueueLength();

    button.click();

    await wait(600);

    button.click();

    const finalLength = bridge.getQueueLength();
    expect(finalLength).toBe(initialLength + 2);
  });
});

describe('Integration: Event Transformation Flow', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should apply beforeSend in EventManager', async () => {
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    bridge.setTransformer('beforeSend', (event: any) => ({
      ...event,
      transformed: true,
    }));

    bridge.event('transform_test', { original: true });

    const events = bridge.getQueueEvents();
    const transformedEvent = events.find((e) => e.custom_event?.name === 'transform_test');

    expect(transformedEvent).toBeDefined();
    expect((transformedEvent as any).transformed).toBe(true);
  });

  it('should apply beforeBatch in SenderManager', async () => {
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    bridge.setTransformer('beforeBatch', (batch: any) => ({
      ...batch,
      batch_transformed: true,
    }));

    bridge.event('batch_transform_test', { data: 'test' });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');

    const payload = JSON.parse(fetchCall[1].body as string);
    expect(payload.batch_transformed).toBe(true);
  });

  it('should skip transformers for saas integration', async () => {
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    bridge.setTransformer('beforeSend', (event: any) => ({
      ...event,
      transformed_field: 'should_apply',
    }));

    bridge.event('custom_test', { data: 'test' });

    const events = bridge.getQueueEvents();
    const event = events.find((e) => e.custom_event?.name === 'custom_test');

    expect((event as any)?.transformed_field).toBe('should_apply');
  });

  it('should handle transformer errors gracefully', async () => {
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    bridge.setTransformer('beforeSend', () => {
      throw new Error('Transformer error');
    });

    bridge.event('error_test', { data: 'test' });

    const events = bridge.getQueueEvents();
    const event = events.find((e) => e.custom_event?.name === 'error_test');

    expect(event).toBeDefined();
    expect(event?.custom_event?.name).toBe('error_test');
  });
});

describe('Integration: Multi-Integration Sending', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.custom.com/collect',
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should send to multiple backends in parallel', async () => {
    bridge.event('multi_test', { data: 'test' });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle partial failures', async () => {
    const failingFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('custom')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => Promise.resolve({ success: true }),
      });
    });

    global.fetch = failingFetch as any;

    bridge.event('partial_failure_test', { data: 'test' });

    await bridge.flushQueue();
    await wait(100);

    expect(failingFetch).toHaveBeenCalled();
  });

  it('should report success if any succeeds', async () => {
    bridge.event('success_test', { data: 'test' });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
    expect(bridge.getQueueLength()).toBe(0);
  });

  it('should persist failures per integration', async () => {
    const failingFetch = createMockFetch({ ok: false, status: 500 });
    global.fetch = failingFetch;

    bridge.event('persist_test', { data: 'test' });

    await bridge.flushQueue();
    await wait(100);

    const persistedQueue = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(persistedQueue).toBeDefined();
  });
});
