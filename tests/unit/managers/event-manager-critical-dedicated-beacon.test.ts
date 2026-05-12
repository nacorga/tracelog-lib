/**
 * EventManager - Dedicated sendBeacon for critical events
 *
 * `flushLastEventSync()` sends just the most recently tracked event in its
 * own `EventsQueue` via every configured sender's `sendEventsQueueSync()`.
 * This guarantees delivery for high-stakes events (purchase, signup) even
 * when the main queue exceeds the 64KB `sendBeacon` cap or an async fetch
 * is in flight. The main queue is left untouched; idempotency by `event.id`
 * (backend unique index) absorbs the duplicate when the periodic / unload
 * flush also delivers it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType, EmitterEvent } from '../../../src/types';
import type { EventsQueue } from '../../../src/types';
import { Emitter } from '../../../src/utils';

describe('EventManager - flushLastEventSync (dedicated beacon for critical events)', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;
  let customSender: {
    sendEventsQueueSync: ReturnType<typeof vi.fn>;
    sendEventsQueue: ReturnType<typeof vi.fn>;
    getIntegrationId: () => 'custom';
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, emitter, {});

    eventManager['set']('userId', 'user-dedicated');
    eventManager['set']('device', MOCK_DEVICE_INFO);
    eventManager['set']('pageUrl', 'https://example.com/checkout');
    eventManager['set']('sessionId', 'session-dedicated');
    eventManager['set']('collectApiUrls', { custom: 'https://custom.example.com' });

    customSender = {
      sendEventsQueueSync: vi.fn().mockReturnValue(true),
      sendEventsQueue: vi.fn(),
      getIntegrationId: (): 'custom' => 'custom',
      stop: vi.fn(),
    };

    const senders = eventManager['dataSenders'];
    senders.length = 0;
    senders.push(customSender as unknown as SenderManager);
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  it('returns false when the queue is empty', () => {
    const ok = eventManager.flushLastEventSync();
    expect(ok).toBe(false);
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
  });

  it('sends only the most recently queued event in its own batch', () => {
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'add_to_cart' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'view_cart' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });

    expect(eventManager.getQueueLength()).toBe(3);

    const ok = eventManager.flushLastEventSync();
    expect(ok).toBe(true);

    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    const sentBatch = customSender.sendEventsQueueSync.mock.calls[0]![0] as EventsQueue;

    expect(sentBatch.events).toHaveLength(1);
    expect(sentBatch.events[0]!.custom_event?.name).toBe('purchase');
    expect(sentBatch.session_id).toBe('session-dedicated');
    expect(sentBatch.user_id).toBe('user-dedicated');
  });

  it('does NOT mutate the main queue (event still queued for periodic / unload flush)', () => {
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });

    expect(eventManager.getQueueLength()).toBe(1);
    eventManager.flushLastEventSync();
    // Caller-side idempotency: same event will be re-delivered via the
    // normal pipeline; backend dedupes by event.id.
    expect(eventManager.getQueueLength()).toBe(1);
  });

  it('strips _session_id from the event payload (backend forbidNonWhitelisted)', () => {
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });
    eventManager.flushLastEventSync();

    const sentBatch = customSender.sendEventsQueueSync.mock.calls[0]![0] as EventsQueue;
    const serialized = JSON.stringify(sentBatch);
    expect(serialized).not.toContain('_session_id');
    expect(serialized).toContain('"session_id":"session-dedicated"');
  });

  it('includes globalMetadata and identity when configured', () => {
    eventManager['set']('config', { globalMetadata: { app: 'cf-web' } });
    eventManager['set']('identity', { userId: 'crowdfarmer-42' });

    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });
    eventManager.flushLastEventSync();

    const sentBatch = customSender.sendEventsQueueSync.mock.calls[0]![0] as EventsQueue;
    expect(sentBatch.global_metadata).toEqual({ app: 'cf-web' });
    expect(sentBatch.identify).toEqual({ userId: 'crowdfarmer-42' });
  });

  it('returns true if at least one sender succeeds even when others fail', () => {
    const failingSender = {
      sendEventsQueueSync: vi.fn().mockReturnValue(false),
      sendEventsQueue: vi.fn(),
      getIntegrationId: () => 'saas' as const,
      stop: vi.fn(),
    };
    eventManager['dataSenders'].push(failingSender as unknown as SenderManager);

    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });
    const ok = eventManager.flushLastEventSync();

    expect(ok).toBe(true);
    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    expect(failingSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
  });

  it('returns false when all senders fail', () => {
    customSender.sendEventsQueueSync.mockReturnValue(false);

    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });
    const ok = eventManager.flushLastEventSync();

    expect(ok).toBe(false);
  });

  it('emits the batch locally in standalone mode (no senders)', () => {
    // Drop all senders to emulate standalone mode.
    eventManager['dataSenders'].length = 0;
    const queueListener = vi.fn();
    emitter.on(EmitterEvent.QUEUE, queueListener);

    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'purchase' } });
    const ok = eventManager.flushLastEventSync();

    expect(ok).toBe(true);
    expect(queueListener).toHaveBeenCalled();
    const emitted = queueListener.mock.calls.at(-1)![0] as EventsQueue;
    expect(emitted.events[0]!.custom_event?.name).toBe('purchase');
  });
});
