/**
 * EventManager - Critical event race tests
 *
 * Regression coverage for the case where a synchronous flush is requested
 * while an asynchronous send is in flight (e.g. user clicks "Pay" right as
 * the periodic send fires for the 50-event batch threshold). Without the
 * deferred re-flush mechanism the critical event would sit in the queue
 * until the next periodic tick — and if the user navigated before that, the
 * event would be lost. With the fix, the `finally` block of the in-flight
 * send re-runs `flushImmediatelySync()` so the event leaves via `sendBeacon`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types';
import { Emitter } from '../../../src/utils';

describe('EventManager - critical event race with in-flight async send', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;
  let customSender: {
    sendEventsQueue: ReturnType<typeof vi.fn>;
    sendEventsQueueSync: ReturnType<typeof vi.fn>;
    getIntegrationId: () => 'custom';
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, emitter, {});

    eventManager['set']('userId', 'user-race');
    eventManager['set']('device', MOCK_DEVICE_INFO);
    eventManager['set']('pageUrl', 'https://example.com/race');
    eventManager['set']('sessionId', 'session-race');
    eventManager['set']('collectApiUrls', { custom: 'https://custom.example.com' });

    customSender = {
      sendEventsQueue: vi.fn(),
      sendEventsQueueSync: vi.fn().mockReturnValue(true),
      getIntegrationId: (): 'custom' => 'custom',
      stop: vi.fn(),
    };

    // Replace dataSenders with our controllable double.
    const senders = eventManager['dataSenders'];
    senders.length = 0;
    senders.push(customSender as unknown as SenderManager);
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  it('defers sync flush while async send is in flight and re-runs it on settle', async () => {
    // Pre-queue some events and start an async flush that we keep paused.
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_1' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_2' } });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    customSender.sendEventsQueue.mockImplementation(async () => {
      await gate;
      return true;
    });

    const inFlight = eventManager.flushImmediately();
    // Microtask boundary so the async IIFE has a chance to claim sendInProgress.
    await Promise.resolve();
    expect(eventManager['sendInProgress']).toBe(true);

    // Simulate a critical event landing while the async send is paused: track
    // adds it to the queue, then the consumer requests a sync flush which must
    // not race with the in-flight fetch (would otherwise build the same batch
    // and duplicate the network request).
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'critical_now' } });
    const syncResult = eventManager.flushImmediatelySync();

    // The sync path returns true (deferred) without invoking the sender.
    expect(syncResult).toBe(true);
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
    expect(eventManager['pendingSyncFlush']).toBe(true);

    // Release the async send. The finally block must drain the deferred sync
    // flush — sendEventsQueueSync should now fire for the leftover critical
    // event (the original two were removed by the async send's optimistic
    // path).
    release();
    await inFlight;

    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });

  it('drains pendingSyncFlush from the periodic send path as well', async () => {
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'p1' } });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    customSender.sendEventsQueue.mockImplementation(async () => {
      await gate;
      return true;
    });

    // Trigger the periodic-style send path via the private method (mimics what
    // the internal timer would call).
    const periodic = eventManager['sendEventsQueue']();
    await Promise.resolve();
    expect(eventManager['sendInProgress']).toBe(true);

    // Sync flush requested while periodic is in flight → must defer.
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'mid_critical' } });
    eventManager.flushImmediatelySync();
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
    expect(eventManager['pendingSyncFlush']).toBe(true);

    release();
    await periodic;

    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });

  it('clears pendingSyncFlush on stop() so it does not leak across init/destroy cycles', () => {
    // Force the flag without going through a real flush.
    (eventManager as unknown as { pendingSyncFlush: boolean }).pendingSyncFlush = true;
    eventManager.stop();
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });
});
